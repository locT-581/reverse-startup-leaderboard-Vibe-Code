import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'line',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'pnpm --filter backend start:dev',
      port: 3001,
      reuseExistingServer: true,
      env: {
        DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/reverse_startup',
        JWT_SECRET: 'this-is-a-very-secret-key-12345',
      }
    },
    {
      command: 'pnpm --filter frontend dev',
      port: 3000,
      reuseExistingServer: true,
      env: {
        JWT_SECRET: 'this-is-a-very-secret-key-12345',
        NEXT_PUBLIC_BACKEND_URL: 'http://localhost:3001',
        BACKEND_URL: 'http://localhost:3001',
      }
    }
  ]
});
