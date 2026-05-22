import { test, expect } from '@playwright/test';

test.describe('Viral Sharing & Dynamic Previews E2E Flow', () => {
  test('should allow public unauthenticated access to profiles and posts, copy share links, and render clown hat overlays', async ({ browser }) => {
    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();
    await pageA.goto('/auth');
    await pageA.click('button:has-text("Register now")');
    const userA = `sharerA_${Date.now()}`;
    await pageA.fill('#username', userA);
    await pageA.fill('#password', 'password123');
    await pageA.click('button[type="submit"]');
    await expect(pageA).toHaveURL(/\/profile/);

    // 2. Setup User B context and page
    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();

    // Mock clipboard API on pageB to bypass headless environment focus/clipboard flakiness
    await pageB.addInitScript(() => {
      let copiedText = '';
      (window as any).lastCopiedText = '';
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: async (text: string) => {
            copiedText = text;
            (window as any).lastCopiedText = text;
            return Promise.resolve();
          },
          readText: async () => {
            return Promise.resolve(copiedText);
          }
        },
        configurable: true,
        writable: true
      });
    });

    await pageB.goto('/auth');
    await pageB.click('button:has-text("Register now")');
    const userB = `sharerB_${Date.now()}`;
    await pageB.fill('#username', userB);
    await pageB.fill('#password', 'password123');
    await pageB.click('button[type="submit"]');
    await expect(pageB).toHaveURL(/\/profile/);

    // Test profile settings "Share Profile Link" button
    const shareProfileBtn = pageB.locator('[data-testid="share-profile-btn"]');
    await expect(shareProfileBtn).toBeVisible();
    await shareProfileBtn.click();
    await expect(shareProfileBtn).toHaveText('Copied! ✓');
    
    // Evaluate clipboard text
    const profileLink = await pageB.evaluate(() => (window as any).lastCopiedText);
    expect(profileLink).toContain(`/profile/${userB}`);

    // Create a post as User B
    const uniqueTitle = `Synergy Leverage Share Title ${Date.now()}`;
    await pageB.goto('/');
    await pageB.click('button:has-text("Propose a Paradigm")');
    await pageB.fill('#post-title-input', uniqueTitle);
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

    // Locate User B's post on User B's page (to test Post Share button)
    const row = pageB.locator(`div[class*="postRowWrapper"]:has-text("${userB}")`);
    await expect(row).toBeVisible();
    const sharePostBtn = row.locator('[data-testid="share-post-btn"]');
    await expect(sharePostBtn).toBeVisible();
    await sharePostBtn.click();
    await expect(sharePostBtn).toHaveText('Copied! ✓');

    const postLink = await pageB.evaluate(() => (window as any).lastCopiedText);
    expect(postLink).toContain('/posts/');

    // Get the post ID from postLink
    const postUrlParts = postLink.split('/');
    const postId = postUrlParts[postUrlParts.length - 1];

    // 3. Test unauthenticated access to User B's profile
    const unauthContext = await browser.newContext();
    const unauthPage = await unauthContext.newPage();
    
    // Go directly to public profile
    await unauthPage.goto(`/profile/${userB}`);
    await expect(unauthPage.locator('h1')).toContainText(userB);
    await expect(unauthPage.locator('text="Wasted Calories"')).toBeVisible();
    await expect(unauthPage.locator('text="Logic Violations"')).toBeVisible();
    
    // Check that there is no clown hat yet
    const profileAvatar = unauthPage.locator('div[class*="avatarDisplay"]');
    await expect(profileAvatar).not.toHaveClass(/.*penalizedAvatar.*/);

    // Test back to leaderboard link
    const backBtn = unauthPage.locator('a:has-text("Back to Leaderboard")');
    await expect(backBtn).toBeVisible();
    await backBtn.click();
    await expect(unauthPage).toHaveURL(/\/$/);

    // Go directly to public post
    await unauthPage.goto(`/posts/${postId}`);
    await expect(unauthPage.locator('h1')).toHaveText(uniqueTitle);
    await expect(unauthPage.locator(`text=${validContent}`)).toBeVisible();
    await expect(unauthPage.locator(`text=${userB}`)).toBeVisible();

    const postAvatar = unauthPage.locator('div[class*="authorAvatar"]');
    await expect(postAvatar).not.toHaveClass(/.*penalizedAvatar.*/);

    // Test back to leaderboard link from post page
    const postBackBtn = unauthPage.locator('a:has-text("Back to Leaderboard")');
    await expect(postBackBtn).toBeVisible();
    await postBackBtn.click();
    await expect(unauthPage).toHaveURL(/\/$/);

    // 4. Report User B's post 5 times to trigger clown hat
    await pageA.goto('/');
    const rowA = pageA.locator(`div[class*="postRowWrapper"]:has-text("${userB}")`);
    await expect(rowA).toBeVisible();
    const violationsBadge = rowA.locator('span[class*="violationsBadge"]');
    for (let i = 0; i < 5; i++) {
      const reportBtn = rowA.locator('button:has-text("Report Logic 🚨")');
      await expect(reportBtn).toBeVisible();
      await reportBtn.click();
      await expect(violationsBadge).toHaveText(`🚨 ${i + 1}`);
    }

    // Verify clown hat active on public profile page
    await unauthPage.goto(`/profile/${userB}`);
    await expect(profileAvatar).toHaveClass(/.*penalizedAvatar.*/);
    const profileSrOnly = unauthPage.locator('h1[class*="title"] span[class*="srOnly"]');
    await expect(profileSrOnly).toHaveText(' (Penalized with a clown hat)');

    // Verify clown hat active on public post page
    await unauthPage.goto(`/posts/${postId}`);
    await expect(postAvatar).toHaveClass(/.*penalizedAvatar.*/);
    const postSrOnly = unauthPage.locator('span[class*="authorName"] span[class*="srOnly"]');
    await expect(postSrOnly).toHaveText(' (Penalized with a clown hat)');

    // Clean up
    await contextA.close();
    await contextB.close();
    await unauthContext.close();
  });
});
