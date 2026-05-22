import { test, expect } from '@playwright/test';

test.describe('Anti-Logic Reporting E2E Flow', () => {
  test('should allow user B to report user A post, update counts, and block user A self-reporting', async ({ browser }) => {
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

    // 2. User A creates a post
    await pageA.goto('/');
    await pageA.click('button:has-text("Propose a Paradigm")');
    await pageA.fill('#post-title-input', `Synergy Paradigm Title ${Date.now()}`);
    const validContent = 'This is a long content to pass validation rules. It has synergy, leverage, paradigm, scale and KPI to reach fifty characters.';
    await pageA.fill('#post-content-input', validContent);
    await pageA.click('button:has-text("Propose Paradigm")');

    // Solve Ad Captcha
    await expect(pageA.locator('h2:has-text("Sponsor Message Verification")')).toBeVisible();
    const adText = await pageA.locator('#sponsor-ad-text').textContent();
    await pageA.fill('#ad-verification-input', adText!);
    await pageA.click('button:has-text("Verify & Submit")');

    // Wait for modal to close
    await expect(pageA.locator('h2:has-text("Propose a Paradigm")')).not.toBeVisible({ timeout: 5000 });

    // 3. Setup User B context and page
    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();
    await pageB.goto('/auth');
    await pageB.click('button:has-text("Register now")');
    const userB = `userB_${Date.now()}`;
    await pageB.fill('#username', userB);
    await pageB.fill('#password', 'password123');
    await pageB.click('button[type="submit"]');
    await expect(pageB).toHaveURL(/\/profile/);

    // 4. User B goes to home and reports User A's post
    await pageB.goto('/');

    // Locate User A's row in leaderboard
    const row = pageB.locator(`div[class*="postRowWrapper"]:has-text("${userA}")`);
    await expect(row).toBeVisible();

    // Verify initial violations count is 🚨 0
    const violationsBadge = row.locator('span[class*="violationsBadge"]');
    await expect(violationsBadge).toHaveText('🚨 0');

    // Click "Report Logic 🚨" on User A's post
    const reportBtn = row.locator('button:has-text("Report Logic 🚨")');
    await expect(reportBtn).toBeVisible();
    await reportBtn.click();

    // Verify dynamic update of the badge to 🚨 1 in User B's UI via WebSocket broadcast
    await expect(violationsBadge).toHaveText('🚨 1');

    // 5. In User A's session, verify the count is also updated to 🚨 1 dynamically
    const rowA = pageA.locator(`div[class*="postRowWrapper"]:has-text("${userA}")`);
    const violationsBadgeA = rowA.locator('span[class*="violationsBadge"]');
    await expect(violationsBadgeA).toHaveText('🚨 1');

    // 6. User A attempts to self-report
    const reportBtnA = rowA.locator('button:has-text("Report Logic 🚨")');
    await expect(reportBtnA).toBeVisible();
    await reportBtnA.click();

    // Verify error message is rendered
    const errorMsg = rowA.locator('span[class*="reportErrorMsg"]');
    await expect(errorMsg).toBeVisible();
    await expect(errorMsg).toHaveText("⚠️ Why are you reporting yourself? That's too logical, stop it!");

    // Verify count did not increment (remains 🚨 1)
    await expect(violationsBadgeA).toHaveText('🚨 1');

    // Clean up
    await contextA.close();
    await contextB.close();
  });
});
