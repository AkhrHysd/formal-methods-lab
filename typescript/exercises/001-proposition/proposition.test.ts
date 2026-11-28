import { test } from 'vitest';

test.each([
  [10, 5],
  [10, 10],
  [10, 11],
  [0, 0],
  [0, 1],
])('canUsePoints(%i, %i)', (balance, usage) => {
  // TODO: canUsePoints と expect を import し、各入力の期待値と assertion を書く。
  throw new Error('Expected value and assertion are not implemented');
});
