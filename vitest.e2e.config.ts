import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vitest.config';

export default mergeConfig(viteConfig, defineConfig({
  test: {
    include: ['**/tests/e2e/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    exclude: ['**/node_modules/**', '**/tests/unit/**', '**/tests/integration/**'], // Explicitly exclude other test types
    environment: 'node',
    testTimeout: 30000, // Longer timeout for E2E tests
    setupFiles: ['./tests/setup.ts'] // Add the setup file which has been fixed to handle Node.js environment
  }
}));