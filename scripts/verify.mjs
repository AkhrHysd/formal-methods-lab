import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkTlc, checkVitest, guardCompleted, loadChecks, parseProgress } from './checks.mjs';

const defaultRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function run(command, args, options = {}) {
  console.log(`+ ${command} ${args.join(' ')}`);
  const result = spawnSync(command, args, { encoding: 'utf8', timeout: 180_000, maxBuffer: 16 * 1024 * 1024, ...options });
  if (result.error) throw result.error;
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  assert.equal(result.signal, null, `${command} interrupted`);
  return result;
}

function mustRun(command, args, options) {
  const result = run(command, args, options);
  assert.equal(result.status, 0, `${command} failed`);
  return result;
}

export function verify(root = defaultRoot, mode = 'all', lesson) {
  assert(['all', 'typescript', 'typecheck', 'lean', 'tla', 'metadata'].includes(mode), 'Unknown verification mode');
  const { registry, progress } = loadChecks(root);
  const pins = JSON.parse(readFileSync(path.join(root, 'toolchains.json'), 'utf8'));
  assert.equal(process.versions.node, pins.versions.node, 'Run source scripts/env.sh to select pinned Node');
  assert.equal(readFileSync(path.join(root, 'lean/lean-toolchain'), 'utf8').trim(), pins.lean, 'Lean version pins disagree');
  const base = process.env.VERIFY_BASE;
  if (base && !/^0+$/.test(base)) {
    assert(/^[a-f0-9]{40}$/.test(base), 'VERIFY_BASE must be a full Git commit SHA');
    const readAtBase = file => mustRun('git', ['show', `${base}:${file}`], { cwd: root }).stdout;
    guardCompleted(JSON.parse(readAtBase('checks.json')), parseProgress(readAtBase('progress.md')), registry, progress);
    console.log('Previously completed requirements preserved.');
  }
  let selected = registry.exercises.filter(e => progress.get(e.id).status === 'completed');
  if (lesson) {
    const requested = registry.exercises.find(e => e.id === lesson);
    assert(requested, `Unknown lesson: ${lesson}`);
    // Explicit practice adds a pending exercise, never removes completed checks.
    if (!selected.includes(requested)) selected.push(requested);
  }
  const checks = [registry.samples, ...selected];
  console.log(`Required samples + ${selected.length} exercise(s); ${registry.exercises.length - selected.length} unfinished excluded.`);
  if (mode === 'metadata') return;
  const cache = path.join(root, '.cache');
  mkdirSync(cache, { recursive: true });
  const output = mkdtempSync(path.join(cache, 'verify-'));
  console.log(`Logs: ${output}`);

  if (['all', 'typescript', 'typecheck'].includes(mode)) {
    const tsRoot = path.join(root, 'typescript');
    assert.equal(mustRun('pnpm', ['--version'], { cwd: tsRoot }).stdout.trim(), pins.versions.pnpm, 'pnpm version mismatch');
    const files = [...new Set(checks.flatMap(c => c.typescript?.files ?? []))];
    const tests = [...new Set(checks.flatMap(c => c.typescript?.tests ?? []))];
    const config = JSON.parse(readFileSync(path.join(tsRoot, 'tsconfig.json'), 'utf8'));
    assert.equal(config.compilerOptions.strict, true, 'strict must remain enabled');
    const generated = path.join(output, 'tsconfig.json');
    writeFileSync(generated, JSON.stringify({ extends: path.join(tsRoot, 'tsconfig.json'), compilerOptions: { typeRoots: [path.join(tsRoot, 'node_modules/@types')] }, include: [], exclude: [], files: [...files, 'vitest.config.ts'].map(f => path.join(tsRoot, f)) }), { flag: 'wx' });
    mustRun('pnpm', ['exec', 'tsc', '--project', generated], { cwd: tsRoot });
    if (mode !== 'typecheck') {
      const report = path.join(output, 'vitest.json');
      mustRun('pnpm', ['exec', 'vitest', 'run', '--reporter=default', '--reporter=json', `--outputFile=${report}`], { cwd: tsRoot, env: { ...process.env, LAB_TEST_FILES: JSON.stringify(tests) } });
      checkVitest(JSON.parse(readFileSync(report, 'utf8')), tests, tsRoot);
    }
  }
  if (['all', 'lean'].includes(mode)) {
    const leanRoot = path.join(root, 'lean');
    const modules = [...new Set(checks.flatMap(c => c.lean?.modules ?? []))];
    const declarations = [...new Set(checks.flatMap(c => c.lean?.declarations ?? []))];
    mustRun('lake', ['build', ...modules], { cwd: leanRoot });
    // Re-elaborate even a cached module to make warnings fatal, including unused sorry.
    for (const module of modules) mustRun('lake', ['env', 'lean', '-DwarningAsError=true', module.replaceAll('.', '/') + '.lean'], { cwd: leanRoot });
    const audit = path.join(output, 'Audit.lean');
    writeFileSync(audit, `import Lean\n${modules.map(m => `import ${m}`).join('\n')}\nopen Lean Elab Command\nrun_cmd do\n  let env ← getEnv\n  let allowed : Array Name := #[\`propext, \`Classical.choice, \`Quot.sound]\n  let required : Array Name := #[${declarations.map(d => '`' + d).join(', ')}]\n  for decl in required do\n    unless env.contains decl do throwError "Missing required declaration: {decl}"\n    unless (env.find? decl).any (fun info => info matches .thmInfo _) do\n      throwError "Required declaration must be a theorem: {decl}"\n  for (decl, _) in env.constants.toList do\n    if let some idx := env.getModuleIdxFor? decl then\n      let mod := env.header.moduleNames[idx]!\n      if mod.toString.startsWith "Exercises." || mod.toString.startsWith "Samples." || required.contains decl then\n        let axioms ← collectAxioms decl\n        for ax in axioms do\n          unless allowed.contains ax do\n            throwError "Unapproved axiom {ax} in {decl} (sorryAx is forbidden)"\n  logInfo "Proof audit passed"\n`, { flag: 'wx' });
    mustRun('lake', ['env', 'lean', '-DwarningAsError=true', audit], { cwd: leanRoot });
  }
  if (['all', 'tla'].includes(mode)) {
    const javaVersion = mustRun('java', ['-version']);
    assert((javaVersion.stdout + javaVersion.stderr).includes(pins.versions.java), 'Java version mismatch');
    const tools = process.env.FORMAL_TOOLS || path.join(root, '.tools');
    const jar = path.join(tools, 'tla/tla2tools.jar');
    assert.equal(createHash('sha256').update(readFileSync(jar)).digest('hex'), pins.tla.sha256, 'TLA jar checksum mismatch');
    for (const [i, model] of checks.flatMap(c => c.tla ?? []).entries()) {
      const cwd = path.dirname(path.join(root, 'tla', model.module));
      const states = path.join(output, `tlc-${i}`);
      mkdirSync(states);
      const result = run('java', ['-XX:+UseParallelGC', '-Xmx512m', '-cp', jar, 'tlc2.TLC', '-tool', '-workers', '1', '-seed', '1', '-metadir', states, '-config', path.basename(model.config), path.basename(model.module)], { cwd });
      const log = result.stdout + result.stderr;
      writeFileSync(path.join(output, `tlc-${i}.log`), log, { flag: 'wx' });
      checkTlc(result.status, log, model.expected);
      console.log(`TLC expectation passed: ${model.module} (${model.expected.kind})`);
    }
  }
  console.log('Verification passed. Learning progress has not been changed.');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2);
    const mode = args[0] || 'all';
    assert(args.length <= 3 && (args.length <= 1 || args[1] === '--lesson'), 'Usage: node scripts/verify.mjs [all|typescript|typecheck|lean|tla|metadata] [--lesson 001-slug]');
    if (args[1]) assert(args[2], 'Lesson id required');
    verify(defaultRoot, mode, args[2]);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
