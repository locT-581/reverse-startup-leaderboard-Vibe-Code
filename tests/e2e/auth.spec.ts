import { test, expect } from '@playwright/test';

test.describe('User Authentication & Profile Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test('should register, update profile, and logout', async ({ page }) => {
    await page.goto('/auth');
    await expect(page.locator('h1')).toHaveText('Đăng nhập');

    await page.click('button:has-text("Đăng ký ngay")');
    await expect(page.locator('h1')).toHaveText('Đăng ký');

    await page.click('button[type="submit"]');
    await expect(page.locator('[role="alert"]').first()).toContainText('Tên người dùng không được để trống');

    const uniqueUsername = `testuser_${Date.now()}`;
    await page.fill('#username', uniqueUsername);
    await page.fill('#password', 'securePassword123');

    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/profile/);
    await expect(page.locator('h1')).toHaveText(uniqueUsername);

    await expect(page.locator('text=Calo lãng phí')).toBeVisible();
    await expect(page.locator('text=Vi phạm logic')).toBeVisible();

    await page.fill('#username', `${uniqueUsername}_updated`);
    await page.click('button[aria-label="Chú hề"]');

    await page.click('button:has-text("Lưu hồ sơ")');

    await expect(page.locator('text=Cập nhật hồ sơ thành công')).toBeVisible();
    await expect(page.locator('h1')).toHaveText(`${uniqueUsername}_updated`);

    await page.click('button:has-text("Đăng xuất")');
    await expect(page).toHaveURL(/\/auth/);
    await expect(page.locator('h1')).toHaveText('Đăng nhập');

    await page.goto('/profile');
    await expect(page).toHaveURL(/\/auth/);
  });
});
