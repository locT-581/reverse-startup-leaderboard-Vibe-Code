import { test, expect } from '@playwright/test';

test.describe('Real-time Leaderboard & Badges E2E Flow', () => {
  test('should display leaderboard header, grid columns, and first-place badge', async ({ page }) => {
    // 1. Visit the home page
    await page.goto('/');

    // 2. Verify logo and hero section
    await expect(page.locator('text=Reverse Startup')).toBeVisible();
    await expect(page.locator('h1')).toHaveText('The Hall of Inefficiency');

    // 3. Verify leaderboard grid headers
    await expect(page.locator('text=Rank').first()).toBeVisible();
    await expect(page.locator('text=Innovator').first()).toBeVisible();
    await expect(page.locator('text=Idea').first()).toBeVisible();
    await expect(page.locator('text=Wasted Calories').first()).toBeVisible();

    // 4. Verify that the first-place item displays the Golden Raspberry badge
    const firstPlaceRow = page.locator('div[class*="firstPlace"]');
    await expect(firstPlaceRow).toBeVisible();
    await expect(firstPlaceRow.locator('text=Golden Raspberry')).toBeVisible();

    // Check that we display the author name and score correctly
    const authorName = firstPlaceRow.locator('span[class*="authorName"]');
    await expect(authorName).toBeVisible();

    const scoreVal = firstPlaceRow.locator('span[class*="scoreValue"]');
    await expect(scoreVal).toBeVisible();
  });
});
