import { test, expect } from '@playwright/test';

test.describe('Ad Captcha Challenge E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test('should display captcha on post creation, block submissions, and require exact case-sensitive matching', async ({ page }) => {
    // 1. Visit homepage and login
    await page.goto('/auth');
    await page.click('button:has-text("Đăng ký ngay")');
    const uniqueUsername = `captcha_user_${Date.now()}`;
    await page.fill('#username', uniqueUsername);
    await page.fill('#password', 'securePassword123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/profile/);

    await page.goto('/');

    // 2. Open Create Post modal
    await page.click('button:has-text("💡 Đề xuất một Hệ hình")');
    await expect(page.locator('h2:has-text("Đề xuất một Mô hình")')).toBeVisible();

    const titleInput = page.locator('#post-title-input');
    const contentInput = page.locator('#post-content-input');
    await titleInput.fill(`Leverage synergy paradigm ${Date.now()}`);
    await contentInput.fill('This is a long content to pass validation rules. It has synergy, leverage, paradigm, scale and KPI to reach fifty characters.');

    // 3. Click Propose Paradigm -> triggers Captcha overlay
    await page.click('button:has-text("Đề xuất Mô hình")');
    const captchaModal = page.locator('#ad-captcha-overlay');
    await expect(captchaModal).toBeVisible();

    // 4. Test exact case-sensitive matching
    const adText = await page.locator('#sponsor-ad-text').textContent();
    expect(adText).not.toBeNull();

    const inputArea = page.locator('#ad-verification-input');
    const submitBtn = page.locator('button:has-text("Xác minh & Gửi")');

    // Case mismatch test
    await inputArea.fill(adText!.toLowerCase());
    await expect(submitBtn).toBeDisabled();
    await expect(page.locator('text=Đầu vào không khớp với văn bản được tài trợ. Phân biệt chữ hoa chữ thường.')).toBeVisible();

    // Correct exact match test
    await inputArea.fill(adText!);
    await expect(submitBtn).not.toBeDisabled();
    await expect(page.locator('text=Đầu vào không khớp với văn bản được tài trợ. Phân biệt chữ hoa chữ thường.')).not.toBeVisible();

    // Verify submit closes captcha and creates post
    await submitBtn.click();
    await expect(captchaModal).not.toBeVisible();
    await expect(page.locator('text=Đề xuất mô hình thành công!')).toBeVisible();
  });

  test('should evade mouse hover unless prefers-reduced-motion is active', async ({ page }) => {
    // 1. Visit homepage and login
    await page.goto('/auth');
    await page.click('button:has-text("Đăng ký ngay")');
    const uniqueUsername = `evasion_user_${Date.now()}`;
    await page.fill('#username', uniqueUsername);
    await page.fill('#password', 'securePassword123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/profile/);
    await page.goto('/');

    // 2. Open Create Post modal
    await page.click('button:has-text("💡 Đề xuất một Hệ hình")');
    const titleInput = page.locator('#post-title-input');
    const contentInput = page.locator('#post-content-input');
    await titleInput.fill(`Leverage synergy paradigm ${Date.now()}`);
    await contentInput.fill('This is a long content to pass validation rules. It has synergy, leverage, paradigm, scale and KPI to reach fifty characters.');
    await page.click('button:has-text("Đề xuất Mô hình")');

    // 3. Verify Captcha Modal is open
    const skipBtn = page.locator('button:has-text("Bỏ qua quảng cáo")');
    await expect(skipBtn).toBeVisible();

    // Get initial position style variables (should be 0px)
    let transformX = await skipBtn.evaluate(el => el.style.getPropertyValue('--skip-x'));
    let transformY = await skipBtn.evaluate(el => el.style.getPropertyValue('--skip-y'));
    expect(transformX).toBe('0px');
    expect(transformY).toBe('0px');

    // Hover mouse on the button
    await skipBtn.hover();

    // Verify it moved (styles updated to something other than 0px)
    transformX = await skipBtn.evaluate(el => el.style.getPropertyValue('--skip-x'));
    transformY = await skipBtn.evaluate(el => el.style.getPropertyValue('--skip-y'));
    expect(transformX).not.toBe('0px');
    expect(transformY).not.toBe('0px');
    expect(transformX).not.toBe('');
    expect(transformY).not.toBe('');
  });

  test('should cycle to another ad when Skip Ad is clicked', async ({ page }) => {
    // 1. Visit homepage and login
    await page.goto('/auth');
    await page.click('button:has-text("Đăng ký ngay")');
    const uniqueUsername = `cycle_user_${Date.now()}`;
    await page.fill('#username', uniqueUsername);
    await page.fill('#password', 'securePassword123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/profile/);
    await page.goto('/');

    // 2. Open Create Post modal
    await page.click('button:has-text("💡 Đề xuất một Hệ hình")');
    const titleInput = page.locator('#post-title-input');
    const contentInput = page.locator('#post-content-input');
    await titleInput.fill(`Leverage synergy paradigm ${Date.now()}`);
    await contentInput.fill('This is a long content to pass validation rules. It has synergy, leverage, paradigm, scale and KPI to reach fifty characters.');
    await page.click('button:has-text("Đề xuất Mô hình")');

    const adTextElement = page.locator('#sponsor-ad-text');
    const initialAd = await adTextElement.textContent();

    const skipBtn = page.locator('button:has-text("Bỏ qua quảng cáo")');
    await expect(skipBtn).toBeVisible();

    // To click the button in tests despite mouse evasion, we can programmatically dispatch a click
    await skipBtn.click({ force: true });

    // Verify ad has changed, input is empty, and general error message is shown
    const newAd = await adTextElement.textContent();
    expect(newAd).not.toBe(initialAd);

    const inputArea = page.locator('#ad-verification-input');
    await expect(inputArea).toHaveValue('');
    await expect(page.locator('text=Bỏ qua thất bại! Để truy cập nội dung, vui lòng xác minh nhà tài trợ mới.')).toBeVisible();
  });

  test('should NOT evade mouse hover when prefers-reduced-motion is active', async ({ page }) => {
    // Emulate reduced motion
    await page.emulateMedia({ reducedMotion: 'reduce' });

    // 1. Visit homepage and login
    await page.goto('/auth');
    await page.click('button:has-text("Đăng ký ngay")');
    const uniqueUsername = `reduced_user_${Date.now()}`;
    await page.fill('#username', uniqueUsername);
    await page.fill('#password', 'securePassword123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/profile/);
    await page.goto('/');

    // 2. Open Create Post modal
    await page.click('button:has-text("💡 Đề xuất một Hệ hình")');
    const titleInput = page.locator('#post-title-input');
    const contentInput = page.locator('#post-content-input');
    await titleInput.fill(`Leverage synergy paradigm ${Date.now()}`);
    await contentInput.fill('This is a long content to pass validation rules. It has synergy, leverage, paradigm, scale and KPI to reach fifty characters.');
    await page.click('button:has-text("Đề xuất Mô hình")');

    const skipBtn = page.locator('button:has-text("Bỏ qua quảng cáo")');
    await expect(skipBtn).toBeVisible();

    // Hover mouse on the button
    await skipBtn.hover();

    // Verify it DID NOT move (styles remain 0px)
    const transformX = await skipBtn.evaluate(el => el.style.getPropertyValue('--skip-x'));
    const transformY = await skipBtn.evaluate(el => el.style.getPropertyValue('--skip-y'));
    expect(transformX).toBe('0px');
    expect(transformY).toBe('0px');
  });
});
