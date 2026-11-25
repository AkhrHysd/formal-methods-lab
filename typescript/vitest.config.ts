import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: process.env.LAB_TEST_FILES
      ? JSON.parse(process.env.LAB_TEST_FILES) as string[]
      : ['samples/**/*.test.ts'],
    allowOnly: false,
    passWithNoTests: false,
    testTimeout: 5000,
  },
});
