import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    clearMocks: true,
    restoreMocks: true,
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        'dist/',
        'build/',
        '*.config.*',
        'coverage/',
        'prisma/',
        'scripts/'
      ]
    },
    include: ['tests/**/*.test.ts'],
    exclude: ['node_modules/', 'dist/', 'build/']
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  }
}); 