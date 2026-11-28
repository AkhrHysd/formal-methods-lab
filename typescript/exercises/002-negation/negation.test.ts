import { expect, test } from 'vitest';
import { isUsageDenied, isUsageDeniedDirect } from './negation.js';

test.each([
  [10, 5],
  [10, 10],
  [0, 0],
])('denial for balance %i and usage %i', (balance, usage) => {
  // TODO: 各入力の期待値を決め、両関数をそれぞれ assertion で検査する。
  expect(isUsageDenied(balance, usage)).toBe(false);
  expect(isUsageDeniedDirect(balance, usage)).toBe(false);
});

test.each([
  [0, 5],
  [10, 11],
  [0, 1],
])('denial for balance %i and usage %i', (balance, usage) => {
  // TODO: 各入力の期待値を決め、両関数をそれぞれ assertion で検査する。
  expect(isUsageDenied(balance, usage)).toBe(true);
  expect(isUsageDeniedDirect(balance, usage)).toBe(true);
});
