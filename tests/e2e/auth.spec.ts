import { test, expect } from '@playwright/test';

test.describe('User Authentication & Profile Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test('should register, update profile, and logout', async ({ page }) => {
    await page.goto('/auth');
    await expect(page.locator('h1')).toHaveText('Log In');

    await page.click('button:has-text("Register now")');
    await expect(page.locator('h1')).toHaveText('Register');

    await page.click('button[type="submit"]');
    await expect(page.locator('[role="alert"]').first()).toContainText('Username cannot be empty');

    const uniqueUsername = `testuser_${Date.now()}`;
    await page.fill('#username', uniqueUsername);
    await page.fill('#password', 'securePassword123');

    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/profile/);
    await expect(page.locator('h1')).toHaveText(uniqueUsername);

    await expect(page.locator('text=Wasted Calories')).toBeVisible();
    await expect(page.locator('text=Logic Violations')).toBeVisible();

    await page.fill('#username', `${uniqueUsername}_updated`);
    await page.click('button[aria-label="Clown"]');

    await page.click('button:has-text("Save Profile")');

    await expect(page.locator('text=Profile updated successfully')).toBeVisible();
    await expect(page.locator('h1')).toHaveText(`${uniqueUsername}_updated`);

    await page.click('button:has-text("Logout")');
    await expect(page).toHaveURL(/\/auth/);
    await expect(page.locator('h1')).toHaveText('Log In');

    await page.goto('/profile');
    await expect(page).toHaveURL(/\/auth/);
  });
});
