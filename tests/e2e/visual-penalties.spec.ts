import { test, expect } from '@playwright/test';

test.describe('Visual Penalties (The Clown Hat) E2E Flow', () => {
  test('should apply clown hat overlay, respect prefers-reduced-motion, support screen readers, and persist avatar changes', async ({ browser }) => {
    // 1. Setup User A context and page
    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();
    await pageA.goto('/auth');
    await pageA.click('button:has-text("Đăng ký ngay")');
    const userA = `userA_${Date.now()}`;
    await pageA.fill('#username', userA);
    await pageA.fill('#password', 'password123');
    await pageA.click('button[type="submit"]');
    await expect(pageA).toHaveURL(/\/profile/);

    // 2. Setup User B context and page
    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();
    await pageB.goto('/auth');
    await pageB.click('button:has-text("Đăng ký ngay")');
    const userB = `userB_${Date.now()}`;
    await pageB.fill('#username', userB);
    await pageB.fill('#password', 'password123');
    await pageB.click('button[type="submit"]');
    await expect(pageB).toHaveURL(/\/profile/);

    // User B starts with 0 violations and has no clown hat overlay on profile page
    const mainAvatarB = pageB.locator('div[class*="avatarDisplay"]');
    await expect(mainAvatarB).not.toHaveClass(/.*penalizedAvatar.*/);

    // 3. User B creates a post
    await pageB.goto('/');
    await pageB.click('button:has-text("💡 Đề xuất một Hệ hình")');
    await pageB.fill('#post-title-input', `Synergy Paradigm Title ${Date.now()}`);
    const validContent = 'This is a long content to pass validation rules. It has synergy, leverage, paradigm, scale and KPI to reach fifty characters.';
    await pageB.fill('#post-content-input', validContent);
    await pageB.click('button:has-text("Đề xuất Mô hình")');

    // Solve Ad Captcha
    await expect(pageB.locator('h2:has-text("Xác minh thông điệp tài trợ")')).toBeVisible();
    const adText = await pageB.locator('#sponsor-ad-text').textContent();
    await pageB.fill('#ad-verification-input', adText!);
    await pageB.click('button:has-text("Xác minh & Gửi")');

    // Wait for modal to close
    await expect(pageB.locator('h2:has-text("Đề xuất một Mô hình")')).not.toBeVisible({ timeout: 5000 });

    // 4. User A goes to home page and locates User B's post
    await pageA.goto('/');
    const row = pageA.locator(`div[class*="postRowWrapper"]:has-text("${userB}")`);
    await expect(row).toBeVisible();

    // Verify User B starts with 🚨 0 violations and has no clown hat class on avatar
    const violationsBadge = row.locator('span[class*="violationsBadge"]');
    await expect(violationsBadge).toHaveText('🚨 0');
    const avatarSpan = row.locator('span[class*="authorAvatar"]');
    await expect(avatarSpan).not.toHaveClass(/.*penalizedAvatar.*/);

    // 5. User A reports User B's post 5 times to trigger the visual penalty
    for (let i = 0; i < 5; i++) {
      const reportBtn = row.locator('button:has-text("Báo cáo Logic 🚨")');
      await expect(reportBtn).toBeVisible();
      await reportBtn.click();
      // Wait for the badge to dynamically increment
      await expect(violationsBadge).toHaveText(`🚨 ${i + 1}`);
    }

    // 6. Verify User B is penalized with a clown hat overlay in Leaderboard Grid
    await expect(avatarSpan).toHaveClass(/.*penalizedAvatar.*/);
    await expect(avatarSpan).toHaveAttribute('aria-label', /.* - bị phạt đội mũ hề/);

    // Verify screen reader bypass elements exist next to username
    const nameSrOnly = row.locator('span[class*="authorName"] span[class*="srOnly"]');
    await expect(nameSrOnly).toHaveText(' (Bị phạt đội mũ hề)');

    // 7. User B goes to profile page and verifies the clown hat overlay
    await pageB.goto('/profile');
    await expect(mainAvatarB).toHaveClass(/.*penalizedAvatar.*/);
    await expect(mainAvatarB).toHaveAttribute('aria-label', /.* - bị phạt với mũ chú hề/);

    const profileNameSrOnly = pageB.locator('h1[class*="title"] span[class*="srOnly"]');
    await expect(profileNameSrOnly).toHaveText(' (Bị phạt với mũ chú hề)');

    // 8. User B changes avatar and verifies the clown hat persists
    // Select the "Bọ" avatar option
    await pageB.locator('button[aria-label="Bọ"]').click();
    // Avatar display updates the emoji to Bug (🐛)
    await expect(mainAvatarB).toHaveText('🐛');
    // The clown hat overlay remains active
    await expect(mainAvatarB).toHaveClass(/.*penalizedAvatar.*/);
    await expect(mainAvatarB).toHaveAttribute('aria-label', /Bọ - bị phạt với mũ chú hề/);

    // Save profile and ensure it persists after refresh/navigation
    await pageB.click('button:has-text("Lưu hồ sơ")');
    await expect(pageB.locator('div[class*="successMessage"]')).toBeVisible();

    await pageB.reload();
    await expect(mainAvatarB).toHaveText('🐛');
    await expect(mainAvatarB).toHaveClass(/.*penalizedAvatar.*/);
    await expect(mainAvatarB).toHaveAttribute('aria-label', /Bọ - bị phạt với mũ chú hề/);

    // Clean up
    await contextA.close();
    await contextB.close();
  });
});
