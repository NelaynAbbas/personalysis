import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vitest.config';

export default mergeConfig(viteConfig, defineConfig({
  test: {
    include: ['**/server/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    environment: 'node',
  }
}));