import { expect, test } from 'vitest';
import { greet } from './smoke.js';

test('the TypeScript toolchain executes typed code', () => {
  expect(greet('Formal Methods Lab')).toBe('Hello, Formal Methods Lab!');
});
