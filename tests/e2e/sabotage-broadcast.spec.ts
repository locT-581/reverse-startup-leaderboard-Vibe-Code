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

  test('should prevent self-sabotage and validate deploy payload', async ({ browser }) => {
    test.setTimeout(60000);
    const context = await browser.newContext();
    const page = await context.newPage();
    await context.clearCookies();

    // Register User A
    await page.goto('/auth');
    await page.click('button:has-text("Register now")');
    const username = `selfsab_${Date.now()}`;
    await page.fill('#username', username);
    await page.fill('#password', 'pass1234');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/profile/);

    // Create a post as User A
    await page.goto('/');
    await page.click('button:has-text("Propose a Paradigm")');
    const titleInput = page.locator('#post-title-input');
    const postTitle = `Leverage synergy self sabotage paradigm ${Date.now()}`;
    await titleInput.fill(postTitle);
    const contentInput = page.locator('#post-content-input');
    await contentInput.fill('This is a long content to pass validation rules. It has synergy, leverage, paradigm, scale and KPI to reach fifty characters.');
    await page.click('button:has-text("Propose Paradigm")');

    // Solve Ad Captcha
    await expect(page.locator('h2:has-text("Sponsor Message Verification")')).toBeVisible();
    const postAdText = await page.locator('#sponsor-ad-text').textContent();
    expect(postAdText).not.toBeNull();
    await page.fill('#ad-verification-input', postAdText!);
    await page.click('button:has-text("Verify & Submit")');

    // Wait for the modal to close
    await expect(page.locator('h2:has-text("Propose a Paradigm")')).not.toBeVisible({ timeout: 5000 });
    const postRowLocator = page.locator('div[class*="postRowWrapper"]').filter({ hasText: postTitle });
    await expect(postRowLocator).toBeVisible();

    // Go to Sabotage Store and purchase a Comic Sans Pack
    await page.goto('/sabotage-store');
    await expect(page.locator('[data-testid="inv-comic_sans"]')).toContainText('0');
    await page.locator('[data-testid="buy-button-comic_sans"]').click();
    await expect(page.locator('[data-testid="checkout-success-banner"]')).toBeVisible();
    await expect(page.locator('[data-testid="inv-comic_sans"]')).toContainText('1');

    // Close checkout success banner
    await page.locator('[data-testid="checkout-success-banner"] button').click();

    // Go back to Leaderboard
    await page.goto('/');
    await expect(postRowLocator).toBeVisible();

    // Click "Sabotage 😈" on their own post
    await postRowLocator.locator('button:has-text("Sabotage 😈")').click();

    // Verify modal is displayed and select Comic Sans Pack
    await expect(page.locator('h2:has-text("Sabotage Paradigm")')).toBeVisible();
    await page.locator('div[class*="inventoryCard"]').filter({ hasText: 'Comic Sans Pack' }).click();

    // Click Deploy
    await page.locator('button:has-text("Deploy")').click();

    // Verify self-sabotage error message is displayed
    await expect(page.locator('text=You cannot sabotage your own post!')).toBeVisible();

    // Close modal
    await page.locator('button[aria-label="Close modal"]').click();

    // Test API validation and self-sabotage directly using the page's request context
    const cookies = await page.context().cookies();
    const tokenCookie = cookies.find(c => c.name === 'token');
    const token = tokenCookie?.value;
    expect(token).not.toBeNull();

    // 1. Missing parameters
    const resMissing = await page.request.post('http://localhost:3001/sabotage/deploy', {
      headers: { Authorization: `Bearer ${token}` },
      data: {},
    });
    expect(resMissing.status()).toBe(400);
    const jsonMissing = await resMissing.json();
    expect(jsonMissing.error?.message || jsonMissing.message).toContain('postId and effectType are required.');

    // 2. Invalid effectType
    const resInvalidEffect = await page.request.post('http://localhost:3001/sabotage/deploy', {
      headers: { Authorization: `Bearer ${token}` },
      data: { postId: 'some-uuid', effectType: 'invalid-effect-type' },
    });
    expect(resInvalidEffect.status()).toBe(400);
    const jsonInvalidEffect = await resInvalidEffect.json();
    expect(jsonInvalidEffect.error?.message || jsonInvalidEffect.message).toContain('Invalid effectType.');

    // Close context
    await context.close();
  });
});
