import { test, expect } from '@playwright/test';

test.describe('Evasive Vote Button E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  async function registerAndGoToLeaderboard(page: any) {
    // Register a new user (User A)
    await page.goto('/auth');
    await page.click('button:has-text("Register now")');
    const uniqueSuffix = `${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
    const uniqueUsername = `evasive_user_${uniqueSuffix}`;
    await page.fill('#username', uniqueUsername);
    await page.fill('#password', 'securePassword123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/profile/);

    // Go back to homepage
    await page.goto('/');

    // Propose a paradigm (create a post as User A)
    await page.click('button:has-text("Propose a Paradigm")');
    const titleInput = page.locator('#post-title-input');
    const contentInput = page.locator('#post-content-input');
    const uniqueTitle = `Leverage synergy paradigm ${uniqueSuffix}`;
    await titleInput.fill(uniqueTitle);
    await contentInput.fill('This is a long content to pass validation rules. It has synergy, leverage, paradigm, scale and KPI to reach fifty characters.');
    await page.click('button:has-text("Propose Paradigm")');

    // Solve Ad Captcha
    await expect(page.locator('h2:has-text("Sponsor Message Verification")')).toBeVisible();
    const postAdText = await page.locator('#sponsor-ad-text').textContent();
    expect(postAdText).not.toBeNull();
    await page.fill('#ad-verification-input', postAdText!);
    await page.click('button:has-text("Verify & Submit")');

    // Wait for modal to disappear
    await expect(page.locator('h2:has-text("Propose a Paradigm")')).not.toBeVisible();

    // Log out User A by clearing cookies
    await page.context().clearCookies();

    // Register User B to vote on User A's post
    await page.goto('/auth');
    await page.click('button:has-text("Register now")');
    const userBUsername = `voter_user_${uniqueSuffix}`;
    await page.fill('#username', userBUsername);
    await page.fill('#password', 'securePassword123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/profile/);

    // Go back to homepage as User B
    await page.goto('/');

    // Verify post is on the leaderboard
    const postRow = page.locator('div[class*="postRowWrapper"]', { hasText: uniqueTitle });
    await expect(postRow).toBeVisible();

    const scoreLocator = postRow.locator('[class*="scoreValue"]');
    const scoreText = await scoreLocator.textContent();
    const initialScore = scoreText ? parseInt(scoreText.replace(/[^0-9]/g, ''), 10) : 0;

    return { uniqueTitle, postRow, initialScore };
  }

  test('should evade mouse hover and require 5 combo clicks in vibrating state to vote', async ({ page }) => {
    const { postRow, initialScore } = await registerAndGoToLeaderboard(page);

    // Find the vote button for this post row
    const voteBtn = postRow.locator('button[id^="vote-btn-post-"]');
    await expect(voteBtn).toBeVisible();

    // 1. Initial State
    let transformX = await voteBtn.evaluate(el => el.style.getPropertyValue('--offset-x'));
    let transformY = await voteBtn.evaluate(el => el.style.getPropertyValue('--offset-y'));
    expect(transformX === '' || transformX === '0px').toBeTruthy();
    expect(transformY === '' || transformY === '0px').toBeTruthy();

    // 2. Proximity Evasion (Hover 1)
    await voteBtn.hover();
    await page.waitForTimeout(100);

    let offset1X = await voteBtn.evaluate(el => el.style.getPropertyValue('--offset-x'));
    let offset1Y = await voteBtn.evaluate(el => el.style.getPropertyValue('--offset-y'));
    expect(offset1X).not.toBe('0px');
    expect(offset1X).not.toBe('');

    // Hover 2
    await voteBtn.hover();
    await page.waitForTimeout(100);

    let offset2X = await voteBtn.evaluate(el => el.style.getPropertyValue('--offset-x'));
    expect(offset2X).not.toBe(offset1X);

    // Hover 3 (triggers vibrating state)
    await voteBtn.hover();
    await page.waitForTimeout(100);

    // Should now be vibrating
    await expect(voteBtn).toHaveClass(/vibrating/);
    await expect(voteBtn).toHaveText(/CLICK 5x SPEED!|COMBO:/);

    // 3. Click 5 times to successfully submit
    for (let i = 0; i < 5; i++) {
      // In vibrating state it stays at its last position so we can click it using force: true
      await voteBtn.click({ force: true });
    }

    // 4. Verify Cooldown state and +50 kcal
    await expect(voteBtn).toHaveClass(/cooldown/);
    await expect(voteBtn).toBeDisabled();
    await expect(voteBtn).toHaveText(/Breathing.../);

    const scoreLocator = postRow.locator('[class*="scoreValue"]');
    // Verify score increases by 50
    await expect(scoreLocator).toContainText(`${initialScore + 50} kcal`);
  });

  test('should reset combo on timeout in vibrating state', async ({ page }) => {
    const { postRow } = await registerAndGoToLeaderboard(page);

    const voteBtn = postRow.locator('button[id^="vote-btn-post-"]');
    await expect(voteBtn).toBeVisible();

    // Dodge 3 times to enter vibrating state
    await voteBtn.hover();
    await page.waitForTimeout(100);
    await voteBtn.hover();
    await page.waitForTimeout(100);
    await voteBtn.hover();
    await page.waitForTimeout(100);

    await expect(voteBtn).toHaveClass(/vibrating/);

    // Click once to start the 2-second combo timer
    await voteBtn.click({ force: true });
    await expect(voteBtn).toHaveText(/COMBO: 1\/5/);

    // Wait for the 2-second combo timer to expire (let's wait 2500ms)
    await page.waitForTimeout(2500);

    // Verify combo reset and mockup tooltip shown
    await expect(voteBtn).not.toHaveClass(/vibrating/);
    const tooltip = postRow.locator('[class*="tooltip"]');
    await expect(tooltip).toBeVisible();
    await expect(tooltip).toHaveText(/Too slow, grandpa!/);
  });

  test('should reset combo when clicking outside the button in vibrating state', async ({ page }) => {
    const { postRow } = await registerAndGoToLeaderboard(page);

    const voteBtn = postRow.locator('button[id^="vote-btn-post-"]');
    await expect(voteBtn).toBeVisible();

    // Dodge 3 times
    await voteBtn.hover();
    await page.waitForTimeout(100);
    await voteBtn.hover();
    await page.waitForTimeout(100);
    await voteBtn.hover();
    await page.waitForTimeout(100);

    await expect(voteBtn).toHaveClass(/vibrating/);

    // Click once
    await voteBtn.click({ force: true });
    await expect(voteBtn).toHaveText(/COMBO: 1\/5/);

    // Click outside on the post title
    const titleLocator = postRow.locator('[class*="postTitleText"]');
    await titleLocator.click();

    // Verify combo reset and tooltip
    await expect(voteBtn).not.toHaveClass(/vibrating/);
    const tooltip = postRow.locator('[class*="tooltip"]');
    await expect(tooltip).toBeVisible();
    await expect(tooltip).toHaveText(/Synergy levels too low!/);
  });

  test('should bypass evasion and vote in a single press when using keyboard navigation', async ({ page }) => {
    const { postRow, initialScore } = await registerAndGoToLeaderboard(page);

    const voteBtn = postRow.locator('button[id^="vote-btn-post-"]');
    await expect(voteBtn).toBeVisible();

    // Simulate Tab key down globally by focusing an element and pressing Tab until button is focused
    await page.keyboard.press('Tab');
    // Force set the flag or navigate focus
    await voteBtn.focus();

    // Hover should NOT cause evasion since keyboard is active
    await voteBtn.hover();
    const transformX = await voteBtn.evaluate(el => el.style.getPropertyValue('--offset-x'));
    expect(transformX === '' || transformX === '0px').toBeTruthy();

    // Press Enter to vote in a single keypress
    await page.keyboard.press('Enter');

    // Verify it bypassed and went straight to cooldown/success state
    await expect(voteBtn).toHaveClass(/cooldown/);
    await expect(voteBtn).toBeDisabled();
    await expect(voteBtn).toHaveText(/Breathing.../);

    const scoreLocator = postRow.locator('[class*="scoreValue"]');
    await expect(scoreLocator).toContainText(`${initialScore + 50} kcal`);
  });

  test('should bypass evasion and vote in a single click under prefers-reduced-motion', async ({ page }) => {
    // Emulate reduced motion
    await page.emulateMedia({ reducedMotion: 'reduce' });

    const { postRow, initialScore } = await registerAndGoToLeaderboard(page);

    const voteBtn = postRow.locator('button[id^="vote-btn-post-"]');
    await expect(voteBtn).toBeVisible();

    // Hover should NOT cause evasion
    await voteBtn.hover();
    const transformX = await voteBtn.evaluate(el => el.style.getPropertyValue('--offset-x'));
    expect(transformX === '' || transformX === '0px').toBeTruthy();

    // A single click should vote successfully
    await voteBtn.click();

    // Verify it bypassed and went straight to cooldown
    await expect(voteBtn).toHaveClass(/cooldown/);
    await expect(voteBtn).toBeDisabled();
    await expect(voteBtn).toHaveText(/Breathing.../);

    const scoreLocator = postRow.locator('[class*="scoreValue"]');
    await expect(scoreLocator).toContainText(`${initialScore + 50} kcal`);
  });
});
