import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }], ['junit', { outputFile: 'test-results/junit.xml' }]],
  use: { baseURL: process.env.FRONTEND_URL ?? 'http://localhost:4200', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  timeout: 30_000,
});
