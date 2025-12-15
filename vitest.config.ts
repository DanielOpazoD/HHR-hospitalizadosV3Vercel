/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './tests/setup.ts',
    // Default includes for unit and integration tests
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    // Exclude storybook stories from default test runner
    exclude: ['stories/**/*', 'node_modules/**/*'],
    projects: [
      // Unit and Integration tests (runs in jsdom)
      {
        extends: true,
        test: {
          name: 'unit',
          include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
          environment: 'jsdom'
        }
      },
      // Storybook tests (runs in browser)
      {
        extends: true,
        plugins: [
          storybookTest({
            configDir: path.join(dirname, '.storybook')
          })
        ],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{
              browser: 'chromium'
            }]
          },
          setupFiles: ['.storybook/vitest.setup.ts']
        }
      }
    ]
  }
});