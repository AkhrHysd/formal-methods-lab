import assert from 'node:assert/strict';
import { readFileSync, realpathSync } from 'node:fs';
import path from 'node:path';

const lessonId = /^\d{3}-[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const name = /^[A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)*$/;
const statuses = new Set(['pending', 'in-progress', 'completed']);

export function parseProgress(text) {
  const rows = new Map();
  for (const line of text.split('\n')) {
    if (!/^\|\s*\d/.test(line)) continue;
    const cells = line.split('|').slice(1, -1).map(s => s.trim());
    assert.equal(cells.length, 8, 'progress.md: expected 8 columns');
    const [id, date, , status, quiz, , , approval] = cells;
    assert(lessonId.test(id), `Invalid lesson id: ${id}`);
    assert(statuses.has(status), `Unknown status for ${id}: ${status}`);
    assert(!rows.has(id), `Duplicate progress row: ${id}`);
    if (status === 'completed') {
      assert(/^\d{4}-\d{2}-\d{2}$/.test(date), `${id}: learning date required`);
      assert(quiz && quiz !== '未評価' && quiz !== '-', `${id}: comprehension result required`);
      assert(approval && approval !== '-', `${id}: learner/instructor approval required`);
    }
    rows.set(id, { status, cells });
  }
  return rows;
}

function nonemptyStrings(value, label, regex) {
  assert(Array.isArray(value) && value.length > 0, `${label}: nonempty array required`);
  assert.equal(new Set(value).size, value.length, `${label}: duplicates`);
  for (const s of value) assert(typeof s === 'string' && regex.test(s), `${label}: invalid value ${s}`);
}

export function safeFile(root, relative) {
  assert(typeof relative === 'string' && relative.length > 0, 'File path required');
  assert(!path.isAbsolute(relative) && !relative.split('/').includes('..'), `Unsafe path: ${relative}`);
  assert(!/[\x00-\x1f*?{}\[\]\\]/.test(relative), `Exact file path required: ${relative}`);
  const base = realpathSync(root);
  const file = realpathSync(path.join(root, relative));
  assert(file.startsWith(base + path.sep), `Path escapes language directory: ${relative}`);
  return file;
}

function validateCheck(check, root, sample = false) {
  assert(check && typeof check === 'object', 'Check object required');
  assert(Object.keys(check).every(k => ['id', 'typescript', 'lean', 'tla'].includes(k)), 'Unknown check key');
  assert(check.typescript || check.lean || check.tla, 'At least one language check required');
  if (check.typescript) {
    const ts = check.typescript;
    for (const key of ['files', 'tests']) {
      nonemptyStrings(ts[key], `typescript.${key}`, /\.ts$/);
      for (const file of ts[key]) {
        assert(file.startsWith(sample ? 'samples/' : 'exercises/'), `Unexpected TypeScript path: ${file}`);
        safeFile(path.join(root, 'typescript'), file);
      }
    }
    assert(ts.tests.every(f => ts.files.includes(f)), 'Tests must also be typechecked');
    assert(ts.tests.every(f => f.endsWith('.test.ts')), 'Use .test.ts for tests');
  }
  if (check.lean) {
    nonemptyStrings(check.lean.modules, 'lean.modules', name);
    nonemptyStrings(check.lean.declarations, 'lean.declarations', name);
    for (const module of check.lean.modules) {
      assert(module.startsWith(sample ? 'Samples.' : 'Exercises.'), `Unexpected Lean module: ${module}`);
      safeFile(path.join(root, 'lean'), module.replaceAll('.', '/') + '.lean');
    }
  }
  if (check.tla) {
    assert(Array.isArray(check.tla) && check.tla.length > 0, 'Nonempty tla list required');
    for (const model of check.tla) {
      for (const key of ['module', 'config']) {
        assert(model[key].startsWith(sample ? 'samples/' : 'specs/'), `Unexpected TLA path: ${model[key]}`);
        safeFile(path.join(root, 'tla'), model[key]);
      }
      assert(model.module.endsWith('.tla') && model.config.endsWith('.cfg'), 'TLA module/config extensions required');
      assert.equal(path.dirname(model.module), path.dirname(model.config), 'Keep module and config together');
      assert(['success', 'invariant-violation'].includes(model.expected?.kind), 'Unknown TLC expectation');
      if (model.expected.kind === 'invariant-violation') {
        assert(name.test(model.expected.invariant), 'Invariant name required');
        assert(Array.isArray(model.expected.trace) && model.expected.trace.length > 0 && model.expected.trace.every(s => typeof s === 'string' && /\S/.test(s)), 'expected.trace: nonempty state descriptions required');
      }
    }
  }
}

export function loadChecks(root) {
  const registry = JSON.parse(readFileSync(path.join(root, 'checks.json'), 'utf8'));
  assert.equal(registry.version, 1, 'Unsupported checks.json version');
  assert(Array.isArray(registry.exercises), 'exercises must be an array');
  const progress = parseProgress(readFileSync(path.join(root, 'progress.md'), 'utf8'));
  validateCheck(registry.samples, root, true);
  const ids = new Set();
  for (const check of registry.exercises) {
    assert(lessonId.test(check.id) && !ids.has(check.id), `Invalid/duplicate exercise: ${check.id}`);
    ids.add(check.id);
    assert(progress.has(check.id), `Missing progress row: ${check.id}`);
    validateCheck(check, root);
  }
  for (const id of progress.keys()) assert(ids.has(id), `Missing checks registration: ${id}`);
  return { registry, progress };
}

// Existing completed requirements may be extended, but cannot be removed or weakened.
function requireSubset(previous, current, label) {
  if (Array.isArray(previous)) {
    assert(Array.isArray(current), `${label}: removed list`);
    for (const item of previous) {
      assert(current.some(candidate => {
        try { requireSubset(item, candidate, label); return true; } catch { return false; }
      }), `${label}: removed or changed requirement ${JSON.stringify(item)}`);
    }
  } else if (previous && typeof previous === 'object') {
    assert(current && typeof current === 'object', `${label}: removed object`);
    for (const [key, value] of Object.entries(previous)) {
      if (key === 'expected') assert.deepEqual(current[key], value, `${label}: changed expected result`);
      else requireSubset(value, current[key], `${label}.${key}`);
    }
  } else assert.equal(current, previous, `${label}: changed requirement`);
}

export function guardCompleted(before, beforeProgress, after, afterProgress) {
  requireSubset(before.samples, after.samples, 'samples');
  for (const check of before.exercises) {
    if (beforeProgress.get(check.id)?.status !== 'completed') continue;
    assert.equal(afterProgress.get(check.id)?.status, 'completed', `${check.id}: completed exercise cannot be downgraded/removed`);
    requireSubset(check, after.exercises.find(x => x.id === check.id), check.id);
  }
}

export function checkVitest(report, tests, root) {
  assert(report.success === true, 'Vitest did not succeed');
  for (const test of tests) {
    const result = report.testResults.find(r => path.resolve(r.name) === path.resolve(root, test));
    assert(result, `Test file was not run: ${test}`);
    assert(result.assertionResults.length > 0, `No tests in ${test}`);
    assert(result.assertionResults.every(r => r.status === 'passed'), `Skipped/todo/failed tests in ${test}`);
  }
}

export function checkTlc(status, output, expected) {
  const messages = [...output.matchAll(/@!@!@STARTMSG (\d+):(\d+) @!@!@\r?\n([\s\S]*?)@!@!@ENDMSG \1 @!@!@/g)]
    .map(m => ({ code: Number(m[1]), level: Number(m[2]), body: m[3] }));
  assert(messages.some(m => m.code === 2186), 'TLC did not finish (crash/timeout/parse error)');
  const errors = messages.filter(m => m.level === 1);
  if (expected.kind === 'success') {
    assert.equal(status, 0, 'TLC returned an error');
    assert.equal(errors.length, 0, 'TLC reported errors');
    assert(messages.some(m => m.code === 2193), 'TLC success result missing');
  } else {
    assert.equal(status, 12, 'Expected TLC safety violation exit code 12');
    const violation = messages.find(m => m.code === 2110);
    assert(violation?.body.includes(`Invariant ${expected.invariant} is violated.`), 'Wrong/missing invariant violation');
    assert(errors.every(m => [2110, 2121].includes(m.code)), 'Unexpected TLC error');
    const states = messages.filter(m => m.level === 4).map(m => m.body);
    assert.equal(states.length, expected.trace.length, 'Unexpected counterexample length');
    for (const [i, state] of states.entries()) {
      assert(state.split(/\r?\n/).map(s => s.trim().replace(/^\/\\ /, '')).includes(expected.trace[i]), `Unexpected counterexample state ${i + 1}`);
    }
  }
}
