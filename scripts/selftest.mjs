// Infrastructure regression checks in isolated temporary courses, not learner material.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, symlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cache = path.join(root, '.cache');
mkdirSync(cache, { recursive: true });
const output = mkdtempSync(path.join(cache, 'selftest-'));
const tools = process.env.FORMAL_TOOLS || path.join(root, '.tools');
let count = 0;

function fixture(label, status, check, files, mode, failurePattern) {
  const course = path.join(output, label);
  mkdirSync(course);
  for (const item of ['scripts', 'lean', 'tla', 'typescript', 'toolchains.json']) {
    cpSync(path.join(root, item), path.join(course, item), {
      recursive: true,
      filter: p => !['node_modules', '.lake'].includes(path.basename(p)),
    });
  }
  symlinkSync(path.join(root, 'typescript/node_modules'), path.join(course, 'typescript/node_modules'), 'dir');
  for (const [file, text] of Object.entries(files)) {
    const dest = path.join(course, file);
    mkdirSync(path.dirname(dest), { recursive: true });
    writeFileSync(dest, text, { flag: 'wx' });
  }
  const registry = JSON.parse(readFileSync(path.join(root, 'checks.json'), 'utf8'));
  registry.exercises = [{ id: '999-infrastructure-test', ...check }];
  writeFileSync(path.join(course, 'checks.json'), JSON.stringify(registry), { flag: 'wx' });
  writeFileSync(path.join(course, 'progress.md'), `| 999-infrastructure-test | 2026-11-25 | infrastructure only | ${status} | reviewed | - | fixture | test fixture |\n`, { flag: 'wx' });
  const env = { ...process.env, FORMAL_TOOLS: tools };
  delete env.VERIFY_BASE;
  const result = spawnSync(process.execPath, ['scripts/verify.mjs', mode], { cwd: course, env, encoding: 'utf8', timeout: 180_000, maxBuffer: 16 * 1024 * 1024 });
  assert.ifError(result.error);
  const log = result.stdout + result.stderr;
  writeFileSync(path.join(output, `${label}.log`), log, { flag: 'wx' });
  if (failurePattern) {
    assert.notEqual(result.status, 0, `${label}: should fail`);
    assert.match(log, failurePattern, `${label}: wrong failure; see ${output}`);
  } else assert.equal(result.status, 0, `${label}: should pass; see ${output}\n${log}`);
  console.log(`PASS ${label}`);
  count++;
}

const ts = { typescript: { files: ['exercises/check.test.ts'], tests: ['exercises/check.test.ts'] } };
const lean = { lean: { modules: ['Exercises.Check'], declarations: ['checkProof'] } };
const tla = { tla: [{ module: 'specs/check/Check.tla', config: 'specs/check/Check.cfg', expected: { kind: 'invariant-violation', invariant: 'TypeOK', trace: ['count = 0', 'count = 1'] } }] };
const malformedTla = { 'tla/specs/check/Check.tla': 'THIS IS NOT A TLA MODULE\n', 'tla/specs/check/Check.cfg': 'SPECIFICATION Spec\nINVARIANT TypeOK\n' };
const malformedTs = "import { test } from 'vitest';\nconst bad: boolean = 7;\ntest('unfinished', () => { throw new Error(String(bad)); });\n";

fixture('unfinished-isolation', 'in-progress', { ...ts, ...lean, ...tla }, {
  'typescript/exercises/check.test.ts': malformedTs,
  'lean/Exercises/Check.lean': 'theorem checkProof : True := by\n  this is unfinished\n',
  ...malformedTla,
}, 'all');
fixture('completed-type-error', 'completed', ts, { 'typescript/exercises/check.test.ts': malformedTs }, 'typescript', /TS2322/);
fixture('completed-failing-test', 'completed', ts, {
  'typescript/exercises/check.test.ts': "import { expect, test } from 'vitest';\ntest('wrong', () => expect(1).toBe(2));\n",
}, 'typescript', /AssertionError/);
fixture('completed-skipped-test', 'completed', ts, {
  'typescript/exercises/check.test.ts': "import { test } from 'vitest';\ntest.skip('not completed', () => {});\n",
}, 'typescript', /Skipped\/todo\/failed/);
fixture('completed-sorry', 'completed', lean, { 'lean/Exercises/Check.lean': 'theorem checkProof : True := by sorry\n' }, 'lean', /declaration uses .sorry./);
fixture('completed-sorry-axiom', 'completed', lean, { 'lean/Exercises/Check.lean': 'set_option warningAsError false\ntheorem checkProof : False := sorryAx False true\n' }, 'lean', /Unapproved axiom sorryAx/);
fixture('completed-transitive-sorry', 'completed', lean, {
  'lean/Exercises/Untrusted.lean': 'theorem untrusted : False := by sorry\n',
  'lean/Exercises/Check.lean': 'import Exercises.Untrusted\nset_option warningAsError false\ntheorem checkProof : False := untrusted\n',
}, 'lean', /Unapproved axiom sorryAx/);
fixture('completed-custom-axiom', 'completed', lean, { 'lean/Exercises/Check.lean': 'axiom fabricated : False\ntheorem checkProof : False := fabricated\n' }, 'lean', /Unapproved axiom fabricated/);
fixture('completed-missing-theorem', 'completed', lean, { 'lean/Exercises/Check.lean': 'theorem anotherProof : True := True.intro\n' }, 'lean', /Missing required declaration/);
fixture('completed-tla-parse-error', 'completed', tla, malformedTla, 'tla', /Expected TLC safety violation|did not finish/);

console.log(`${count} infrastructure scenarios passed. Evidence: ${output}`);
