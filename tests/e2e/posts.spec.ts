import { test, expect } from '@playwright/test';

test.describe('Posts & Comments E2E Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test('should validate, submit posts, expand rows, and submit comments', async ({ page }) => {
    // 1. Visit homepage and verify login prompt for unauthenticated user
    await page.goto('/');
    await expect(page.locator('text=Đăng nhập để Đề xuất một Hệ hình')).toBeVisible();

    // 2. Go to auth page and register a new user
    await page.goto('/auth');
    await expect(page).toHaveURL(/\/auth/);
    await page.click('button:has-text("Đăng ký ngay")');
    const uniqueUsername = `testuser_${Date.now()}`;
    await page.fill('#username', uniqueUsername);
    await page.fill('#password', 'securePassword123');
    await page.click('button[type="submit"]');

    // Wait for registration to complete and redirect to profile page
    await expect(page).toHaveURL(/\/profile/);
    await expect(page.locator('h1')).toHaveText(uniqueUsername);

    // After registration, redirected to /profile. Go back to homepage.
    await page.goto('/');

    // Click "💡 Đề xuất một Hệ hình" button to open modal
    await page.click('button:has-text("💡 Đề xuất một Hệ hình")');

    // 3. Verify Propose a Paradigm form is now visible
    await expect(page.locator('h2:has-text("Đề xuất một Mô hình")')).toBeVisible();

    // 4. Test real-time validation for Title
    const titleInput = page.locator('#post-title-input');
    await titleInput.fill('Short');
    await titleInput.blur();
    await expect(page.locator('text=Tiêu đề của bạn thiếu synergy cần thiết. Vui lòng leverage thêm các paradigm.')).toBeVisible();

    // Fill valid title
    const uniqueTitle = `Leverage synergy paradigm ${Date.now()}`;
    await titleInput.fill(uniqueTitle);
    await expect(page.locator('text=Tiêu đề của bạn thiếu synergy cần thiết. Vui lòng leverage thêm các paradigm.')).not.toBeVisible();

    // 5. Test real-time validation for Content
    const contentInput = page.locator('#post-content-input');
    await contentInput.fill('Short content.');
    await contentInput.blur();
    await expect(page.locator('text=Giải thích này dễ hiểu đến mức nguy hiểm. Hãy thêm synergy.')).toBeVisible();

    // Fill valid content (must contain 3 buzzwords and be >= 50 chars)
    const validContent = 'This is a long content to pass validation rules. It has synergy, leverage, paradigm, scale and KPI to reach fifty characters.';
    await contentInput.fill(validContent);
    await expect(page.locator('text=Giải thích này dễ hiểu đến mức nguy hiểm. Hãy thêm synergy.')).not.toBeVisible();

    // 6. Submit Post
    await page.click('button:has-text("Đề xuất Mô hình")');

    // Solve Ad Captcha
    await expect(page.locator('h2:has-text("Xác minh thông điệp tài trợ")')).toBeVisible();
    const postAdText = await page.locator('#sponsor-ad-text').textContent();
    expect(postAdText).not.toBeNull();
    await page.fill('#ad-verification-input', postAdText!);
    await page.click('button:has-text("Xác minh & Gửi")');

    await expect(page.locator('text=Đề xuất mô hình thành công!')).toBeVisible();

    // Wait for the modal to close and unmount
    await expect(page.locator('h2:has-text("Đề xuất một Mô hình")')).not.toBeVisible({ timeout: 5000 });

    // 7. Verify post is in leaderboard and click it to expand
    const postRow = page.locator(`text=${uniqueTitle}`);
    await expect(postRow).toBeVisible();
    await postRow.click();

    // 8. Verify comments section expanded
    await expect(page.locator('h3:has-text("Giải pháp Đề xuất")')).toBeVisible();
    await expect(page.locator('text=Chưa có giải pháp nào được đề xuất.')).toBeVisible();

    // 9. Test comment validation
    const commentInput = page.locator(`textarea[id^="comment-input-"]`);
    await commentInput.fill('Too short comment');
    await commentInput.blur();
    await expect(page.locator('text=Giải pháp của bạn chưa đủ độ dài. Nó bắt buộc phải vượt quá độ dài')).toBeVisible();

    // Fill valid comment (longer than original post length of 124 characters)
    const validComment = 'This comment is strictly longer than the original post content to satisfy the length validation. Leverage synergy, paradigm, and scale in our microservices ecosystem!';
    await commentInput.fill(validComment);
    await expect(page.locator('text=Giải pháp của bạn chưa đủ độ dài.')).not.toBeVisible();

    // 10. Submit Comment
    await page.click('button:has-text("Gửi Giải pháp")');

    // Solve Ad Captcha for Comment
    await expect(page.locator('h2:has-text("Xác minh thông điệp tài trợ")')).toBeVisible();
    const commentAdText = await page.locator('#sponsor-ad-text').textContent();
    expect(commentAdText).not.toBeNull();
    await page.fill('#ad-verification-input', commentAdText!);
    await page.click('button:has-text("Xác minh & Gửi")');

    // 11. Verify comment is displayed inline
    await expect(page.locator(`p:has-text("${validComment}")`)).toBeVisible();
  });
});
