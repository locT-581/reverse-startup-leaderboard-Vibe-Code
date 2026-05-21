import { test, expect } from '@playwright/test';

test.describe('Real-Time Sabotage Broadcast E2E Flow', () => {
  test('should register two users, buy/deploy a sabotage pack, and broadcast real-time visual distortion & score updates', async ({ browser }) => {
    test.setTimeout(90000);
    // 1. Create Context A and User A
    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();
    await contextA.clearCookies();

    // Register User A
    await pageA.goto('/auth');
    await pageA.click('button:has-text("Register now")');
    const userAUsername = `usera_${Date.now()}`;
    await pageA.fill('#username', userAUsername);
    await pageA.fill('#password', 'pass1234');
    await pageA.click('button[type="submit"]');
    await expect(pageA).toHaveURL(/\/profile/);

    // Create a post as User A
    await pageA.goto('/');
    await pageA.click('button:has-text("Propose a Paradigm")');
    const titleInput = pageA.locator('#post-title-input');
    const postTitle = `Leverage synergy paradigm A ${Date.now()}`;
    await titleInput.fill(postTitle);
    const contentInput = pageA.locator('#post-content-input');
    await contentInput.fill('This is a long content to pass validation rules. It has synergy, leverage, paradigm, scale and KPI to reach fifty characters.');
    await pageA.click('button:has-text("Propose Paradigm")');

    // Solve Ad Captcha
    await expect(pageA.locator('h2:has-text("Sponsor Message Verification")')).toBeVisible();
    const postAdText = await pageA.locator('#sponsor-ad-text').textContent();
    expect(postAdText).not.toBeNull();
    await pageA.fill('#ad-verification-input', postAdText!);
    await pageA.click('button:has-text("Verify & Submit")');

    // Wait for the modal to close and verify post is on the leaderboard
    await expect(pageA.locator('h2:has-text("Propose a Paradigm")')).not.toBeVisible({ timeout: 5000 });
    const postRowLocator = pageA.locator('div[class*="postRowWrapper"]').filter({ hasText: postTitle });
    await expect(postRowLocator).toBeVisible();

    // Read the initial score of the post
    const initialScoreText = await postRowLocator.locator(`[class*="scoreValue"]`).textContent();
    expect(initialScoreText).not.toBeNull();
    const initialScoreNumber = parseInt(initialScoreText!.replace(/[^0-9]/g, ''));

    // 2. Create Context B and User B
    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();
    await contextB.clearCookies();

    // Register User B
    await pageB.goto('/auth');
    await pageB.click('button:has-text("Register now")');
    const userBUsername = `userb_${Date.now()}`;
    await pageB.fill('#username', userBUsername);
    await pageB.fill('#password', 'pass1234');
    await pageB.click('button[type="submit"]');
    await expect(pageB).toHaveURL(/\/profile/);

    // Go to Sabotage Store and purchase a Blur Pack
    await pageB.goto('/sabotage-store');
    await expect(pageB.locator('[data-testid="inv-blur"]')).toContainText('0');
    await pageB.locator('[data-testid="buy-button-blur"]').click();
    await expect(pageB.locator('[data-testid="checkout-success-banner"]')).toBeVisible();
    await expect(pageB.locator('[data-testid="inv-blur"]')).toContainText('1');

    // Close checkout success banner
    await pageB.locator('[data-testid="checkout-success-banner"] button').click();

    // Navigate to Leaderboard
    await pageB.goto('/');

    // Find User A's post row on Page B
    const postRowOnB = pageB.locator('div[class*="postRowWrapper"]').filter({ hasText: postTitle });
    await expect(postRowOnB).toBeVisible();

    // Click "Sabotage 😈" trigger button
    await postRowOnB.locator('button:has-text("Sabotage 😈")').click();

    // Verify modal is displayed and retrieve inventory count
    await expect(pageB.locator('h2:has-text("Sabotage Paradigm")')).toBeVisible();
    await pageB.locator('div[class*="inventoryCard"]').filter({ hasText: 'Blur Pack' }).click();

    // Deploy visual sabotage
    await pageB.locator('button:has-text("Deploy")').click();

    // Verify success confirmation and wait for modal to auto-close
    await expect(pageB.locator('text=Sabotage deployed successfully!')).toBeVisible();
    await expect(pageB.locator('h2:has-text("Sabotage Paradigm")')).not.toBeVisible({ timeout: 5000 });

    // Verify score is decremented by 100 kcal in real time on both Page A and Page B
    const expectedScoreText = `${initialScoreNumber - 100} kcal`;
    await expect(postRowOnB.locator(`[class*="scoreValue"]`)).toHaveText(expectedScoreText);
    await expect(postRowLocator.locator(`[class*="scoreValue"]`)).toHaveText(expectedScoreText);

    // Verify row-level distortion is applied on Page B (non-author)
    const postRowElementOnB = postRowOnB.locator('div[class*="postRow"]:not([class*="postRowWrapper"])');
    await expect(postRowElementOnB).toHaveClass(/post-blur/);

    // Verify screen reader bypass is active on Page B
    const srOnlyOnB = postRowOnB.locator('div[class*="srOnly"]');
    await expect(srOnlyOnB).toBeVisible();
    await expect(srOnlyOnB).toContainText(userAUsername);

    // Verify distorted title block has aria-hidden="true" set on Page B
    const titleColOnB = postRowOnB.locator('div[class*="colTitle"]');
    await expect(titleColOnB).toHaveAttribute('aria-hidden', 'true');

    // Verify global body-level distortion is applied on Page A (author)
    const bodyOnA = pageA.locator('body');
    await expect(bodyOnA).toHaveClass(/sabotage-blur/);

    // Wait 15 seconds for the sabotage duration to expire (using a 16s timeout to be safe)
    await pageB.waitForTimeout(16000);

    // Verify visual classes are fully cleared and original styling restored
    await expect(postRowElementOnB).not.toHaveClass(/post-blur/);
    await expect(bodyOnA).not.toHaveClass(/sabotage-blur/);

    // Close both browser contexts
    await contextA.close();
    await contextB.close();
  });
});
