import assert from 'node:assert/strict';
import test from 'node:test';
import { checkTlc, checkVitest, guardCompleted, parseProgress } from './checks.mjs';

const row = (status = 'completed') => `| 001-test | 2026-11-25 | test | ${status} | 講師レビュー済み | - | 考察 | learner: reviewed |`;
const registry = { samples: { lean: { modules: ['Samples.Basic'] } }, exercises: [{ id: '001-test', lean: { modules: ['Exercises.Test'], declarations: ['Test.proof'] } }] };

test('progress rejects unknown states, duplicates, and unreviewed completion', () => {
  assert.throws(() => parseProgress(row('complete')), /Unknown status/);
  assert.throws(() => parseProgress(row() + '\n' + row()), /Duplicate/);
  assert.throws(() => parseProgress(row().replace('講師レビュー済み', '未評価')), /comprehension/);
  assert.throws(() => parseProgress(row().replace('learner: reviewed', '-')), /approval/);
});

test('completed requirements cannot be deleted, downgraded, or weakened', () => {
  const before = parseProgress(row());
  assert.throws(() => guardCompleted(registry, before, registry, parseProgress(row('pending'))), /downgraded/);
  const after = structuredClone(registry);
  after.exercises[0].lean.declarations = [];
  assert.throws(() => guardCompleted(registry, before, after, before), /removed or changed/);
  assert.throws(() => guardCompleted(registry, before, { ...registry, samples: {} }, before), /removed/);
  const extended = structuredClone(registry);
  extended.exercises[0].lean.declarations.push('Test.secondProof');
  assert.doesNotThrow(() => guardCompleted(registry, before, extended, before));
});

const message = (code, level, body = '') => `@!@!@STARTMSG ${code}:${level} @!@!@\n${body}\n@!@!@ENDMSG ${code} @!@!@\n`;
const expected = { kind: 'invariant-violation', invariant: 'TypeOK', trace: ['count = 0', 'count = 1'] };
const violation = message(2110, 1, 'Invariant TypeOK is violated.') + message(2121, 1) + message(2217, 4, 'count = 0') + message(2217, 4, 'count = 1') + message(2186, 0);

test('TLC expects the exact safety failure, invariant, and ordered trace', () => {
  assert.doesNotThrow(() => checkTlc(12, violation, expected));
  assert.throws(() => checkTlc(1, violation, expected), /exit code/);
  assert.throws(() => checkTlc(12, violation.replace('TypeOK', 'Other'), expected), /invariant/);
  assert.throws(() => checkTlc(12, violation.replace('count = 1', 'count = 2'), expected), /state 2/);
  assert.throws(() => checkTlc(12, violation + message(1000, 1, 'exception'), expected), /Unexpected TLC error/);
  assert.throws(() => checkTlc(150, message(3002, 1, 'syntax error'), expected), /did not finish/);
  assert.throws(() => checkTlc(0, violation, { kind: 'success' }), /errors/);
  assert.throws(() => checkTlc(0, message(2186, 0), { kind: 'success' }), /success result/);
});

test('a skipped, empty, or missing Vitest test cannot satisfy completion', () => {
  const report = { success: true, testResults: [{ name: '/lab/a.test.ts', assertionResults: [{ status: 'passed' }] }] };
  assert.doesNotThrow(() => checkVitest(report, ['a.test.ts'], '/lab'));
  report.testResults[0].assertionResults[0].status = 'pending';
  assert.throws(() => checkVitest(report, ['a.test.ts'], '/lab'), /Skipped/);
  report.testResults[0].assertionResults = [];
  assert.throws(() => checkVitest(report, ['a.test.ts'], '/lab'), /No tests/);
  assert.throws(() => checkVitest(report, ['missing.test.ts'], '/lab'), /not run/);
});


test('completed TLC expectations preserve counterexample order', () => {
  const before = { samples: {}, exercises: [{ id: '001-test', tla: [{ expected: { kind: 'invariant-violation', trace: ['x = 0', 'x = 1'] } }] }] };
  const after = structuredClone(before);
  after.exercises[0].tla[0].expected.trace.reverse();
  assert.throws(() => guardCompleted(before, parseProgress(row()), after, parseProgress(row())), /removed or changed/);
});
