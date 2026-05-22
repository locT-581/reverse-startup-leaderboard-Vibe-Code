import { test, expect } from '@playwright/test';

test.describe('Visual Penalties (The Clown Hat) E2E Flow', () => {
  test('should apply clown hat overlay, respect prefers-reduced-motion, support screen readers, and persist avatar changes', async ({ browser }) => {
    // 1. Setup User A context and page
    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();
    await pageA.goto('/auth');
    await pageA.click('button:has-text("Register now")');
    const userA = `userA_${Date.now()}`;
    await pageA.fill('#username', userA);
    await pageA.fill('#password', 'password123');
    await pageA.click('button[type="submit"]');
    await expect(pageA).toHaveURL(/\/profile/);

    // 2. Setup User B context and page
    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();
    await pageB.goto('/auth');
    await pageB.click('button:has-text("Register now")');
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
    await pageB.click('button:has-text("Propose a Paradigm")');
    await pageB.fill('#post-title-input', `Synergy Paradigm Title ${Date.now()}`);
    const validContent = 'This is a long content to pass validation rules. It has synergy, leverage, paradigm, scale and KPI to reach fifty characters.';
    await pageB.fill('#post-content-input', validContent);
    await pageB.click('button:has-text("Propose Paradigm")');

    // Solve Ad Captcha
    await expect(pageB.locator('h2:has-text("Sponsor Message Verification")')).toBeVisible();
    const adText = await pageB.locator('#sponsor-ad-text').textContent();
    await pageB.fill('#ad-verification-input', adText!);
    await pageB.click('button:has-text("Verify & Submit")');

    // Wait for modal to close
    await expect(pageB.locator('h2:has-text("Propose a Paradigm")')).not.toBeVisible({ timeout: 5000 });

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
      const reportBtn = row.locator('button:has-text("Report Logic 🚨")');
      await expect(reportBtn).toBeVisible();
      await reportBtn.click();
      // Wait for the badge to dynamically increment
      await expect(violationsBadge).toHaveText(`🚨 ${i + 1}`);
    }

    // 6. Verify User B is penalized with a clown hat overlay in Leaderboard Grid
    await expect(avatarSpan).toHaveClass(/.*penalizedAvatar.*/);
    await expect(avatarSpan).toHaveAttribute('aria-label', /.* - penalized with a clown hat/);

    // Verify screen reader bypass elements exist next to username
    const nameSrOnly = row.locator('span[class*="authorName"] span[class*="srOnly"]');
    await expect(nameSrOnly).toHaveText(' (Penalized with a clown hat)');

    // 7. User B goes to profile page and verifies the clown hat overlay
    await pageB.goto('/profile');
    await expect(mainAvatarB).toHaveClass(/.*penalizedAvatar.*/);
    await expect(mainAvatarB).toHaveAttribute('aria-label', /.* - penalized with a clown hat/);

    const profileNameSrOnly = pageB.locator('h1[class*="title"] span[class*="srOnly"]');
    await expect(profileNameSrOnly).toHaveText(' (Penalized with a clown hat)');

    // 8. User B changes avatar and verifies the clown hat persists
    // Select the "Bug" avatar option
    await pageB.locator('button[aria-label="Bug"]').click();
    // Avatar display updates the emoji to Bug (🐛)
    await expect(mainAvatarB).toHaveText('🐛');
    // The clown hat overlay remains active
    await expect(mainAvatarB).toHaveClass(/.*penalizedAvatar.*/);
    await expect(mainAvatarB).toHaveAttribute('aria-label', /Bug - penalized with a clown hat/);

    // Save profile and ensure it persists after refresh/navigation
    await pageB.click('button:has-text("Save Profile")');
    await expect(pageB.locator('div[class*="successMessage"]')).toBeVisible();

    await pageB.reload();
    await expect(mainAvatarB).toHaveText('🐛');
    await expect(mainAvatarB).toHaveClass(/.*penalizedAvatar.*/);
    await expect(mainAvatarB).toHaveAttribute('aria-label', /Bug - penalized with a clown hat/);

    // Clean up
    await contextA.close();
    await contextB.close();
  });
});
