import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/table/**/__test__/*.test.{ts,tsx}', 'src/core/components/layout/scrollbar/__test__/*.test.ts'],
  },
});
