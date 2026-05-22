import { test, expect } from '@playwright/test';

test.describe('Markdown Rendering E2E tests', () => {
  test('should render markdown code blocks correctly in posts', async ({ page }) => {
    // 1. Visit homepage
    await page.goto('/');

    // 2. The post title from seed data containing the yaml block:
    // "CẢI TỔ TOÀN DIỆN KIẾN TRÚC MICROSERVICES"
    const postTitle = page.locator('text=CẢI TỔ TOÀN DIỆN KIẾN TRÚC MICROSERVICES');
    await expect(postTitle).toBeVisible();

    // 3. Locate the specific post row wrapper
    // The postRow is a button containing the title.
    const postRow = page.locator('[role="button"]').filter({ hasText: 'CẢI TỔ TOÀN DIỆN KIẾN TRÚC MICROSERVICES' });

    // 4. Check if the post content contains a rendered code block inside this row
    const codeBlock = postRow.locator('pre');
    await expect(codeBlock).toBeVisible();

    // Check if code language badge "yaml" is displayed inside this row
    const langBadge = postRow.locator('text=yaml');
    await expect(langBadge).toBeVisible();

    // Check if the content inside the code block is exact
    const codeText = await codeBlock.locator('code').textContent();
    expect(codeText).toContain('services:');
    expect(codeText).toContain('auth:');
    expect(codeText).toContain('image: auth-service:latest');
    expect(codeText).toContain('leaderboard:');
    expect(codeText).toContain('image: leaderboard:latest');
  });
});
