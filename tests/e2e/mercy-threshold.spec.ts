import { test, expect } from '@playwright/test';

test.describe('Mercy Threshold & Toddler Mode E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test('should trigger Mercy Mode at 10 failures, bypass CAPTCHA and voting evasion, display baby badges, and allow toggle on profile', async ({ page }) => {
    test.setTimeout(60000);
    // 1. Register User A to create a post
    await page.goto('/auth');
    await page.click('button:has-text("Register now")');
    const uniqueSuffix = `${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
    const userAUsername = `author_user_${uniqueSuffix}`;
    await page.fill('#username', userAUsername);
    await page.fill('#password', 'securePassword123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/profile/);

    // Create Post 1 as User A
    await page.goto('/');
    await page.click('button:has-text("Propose a Paradigm")');
    const titleInput1 = page.locator('#post-title-input');
    const contentInput1 = page.locator('#post-content-input');
    const post1Title = `Leverage synergy paradigm ${uniqueSuffix}`;
    await titleInput1.fill(post1Title);
    await contentInput1.fill('This is a long content to pass validation rules. It has synergy, leverage, paradigm, scale and KPI to reach fifty characters.');
    await page.click('button:has-text("Propose Paradigm")');

    // Solve Ad Captcha 1
    await expect(page.locator('h2:has-text("Sponsor Message Verification")')).toBeVisible();
    const adText1 = await page.locator('#sponsor-ad-text').textContent();
    expect(adText1).not.toBeNull();
    await page.fill('#ad-verification-input', adText1!);
    await page.click('button:has-text("Verify & Submit")');
    await expect(page.locator('h2:has-text("Propose a Paradigm")')).not.toBeVisible();

    // Log out User A
    await page.context().clearCookies();

    // 2. Register User B (The frustrated voter)
    await page.goto('/auth');
    await page.click('button:has-text("Register now")');
    const userBUsername = `frustrated_user_${uniqueSuffix}`;
    await page.fill('#username', userBUsername);
    await page.fill('#password', 'securePassword123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/profile/);

    // Go back to homepage as User B
    await page.goto('/');

    // Prevent header from intercepting mouse hovers and clicks
    await page.evaluate(() => {
      const header = document.querySelector('header');
      if (header) {
        (header as HTMLElement).style.pointerEvents = 'none';
      }
    });

    // Locate Post 1 and its vote button
    const post1Row = page.locator('div[class*="postRowWrapper"]', { hasText: post1Title });
    await expect(post1Row).toBeVisible();
    const voteBtn1 = post1Row.locator('button[id^="vote-btn-post-"]');
    await expect(voteBtn1).toBeVisible();

    const targetButtonId = await voteBtn1.getAttribute('id');
    await page.evaluate(({ targetId, targetTitle }) => {
      const buttons = document.querySelectorAll('button[id^="vote-btn-post-"]');
      buttons.forEach(btn => {
        if (btn.id !== targetId) {
          (btn as HTMLElement).style.pointerEvents = 'none';
        }
      });

      const rows = document.querySelectorAll('div[class*="postRowWrapper"]');
      rows.forEach(row => {
        if (!row.textContent?.includes(targetTitle)) {
          (row as HTMLElement).style.pointerEvents = 'none';
        }
      });
    }, { targetId: targetButtonId!, targetTitle: post1Title });

    // 3. Fail the vote interaction 10 times to trigger Mercy Mode
    const titleText = post1Row.locator('[class*="postTitleText"]');
    for (let i = 1; i <= 10; i++) {
      // Hover and move away 3 times to reliably enter vibrating state
      await titleText.hover();
      await page.waitForTimeout(100);
      await voteBtn1.hover();
      await page.waitForTimeout(150);

      await titleText.hover();
      await page.waitForTimeout(100);
      await voteBtn1.hover();
      await page.waitForTimeout(150);

      await titleText.hover();
      await page.waitForTimeout(100);
      await voteBtn1.hover();
      await page.waitForTimeout(150);

      await expect(voteBtn1).toHaveClass(/vibrating/);

      // Click once to start the combo timer
      await voteBtn1.click({ force: true });
      await expect(voteBtn1).toHaveText(/COMBO: 1\/5/);

      // Click outside (the hero title) to reset and count a failure without expanding the post row
      await page.locator('h1:has-text("The Hall of Inefficiency")').click();

      // Verify combo reset
      await expect(voteBtn1).not.toHaveClass(/vibrating/);
    }

    // 4. Verify Mercy Activation Modal pops up on the 10th failure
    const mercyModal = page.locator('#mercy-activation-overlay');
    await expect(mercyModal).toBeVisible();
    await expect(page.locator('h2#mercy-modal-title')).toContainText('Mercy Mode Activated!');

    // Dismiss the modal
    await page.click('#dismiss-mercy-modal-btn');
    await expect(mercyModal).not.toBeVisible();

    // 5. Verify Baby Badge 👶 in navigation (reenable pointer events temporarily to allow nav content check if needed)
    const navBtn = page.locator('#nav-profile-btn');
    await expect(navBtn).toContainText('👶');

    // 6. Verify voting now succeeds with a single standard click (no vibrating state)
    // Hover should NOT cause evasion since Mercy Mode is active
    await voteBtn1.hover();
    const transform1X = await voteBtn1.evaluate(el => el.style.getPropertyValue('--offset-x'));
    expect(transform1X === '' || transform1X === '0px').toBeTruthy();

    // Single click should submit vote directly and enter cooldown
    await voteBtn1.click();
    await expect(voteBtn1).toHaveClass(/cooldown/);
    await expect(voteBtn1).toBeDisabled();

    // 7. Verify CAPTCHA bypass when creating a post
    // Re-enable pointer events for navigation or interaction
    await page.evaluate(() => {
      const header = document.querySelector('header');
      if (header) {
        (header as HTMLElement).style.pointerEvents = 'auto';
      }
    });

    await page.click('button:has-text("Propose a Paradigm")');
    await expect(page.locator('h2:has-text("Propose a Paradigm")')).toBeVisible();

    const titleInputB = page.locator('#post-title-input');
    const contentInputB = page.locator('#post-content-input');
    await titleInputB.fill(`Leverage synergy ${uniqueSuffix}`);
    await contentInputB.fill('This is a paradigm proposed with mercy active. We will touch base to pivot and scale the KPI.');

    // Propose paradigm -> captcha is bypassed, so it should succeed immediately
    await page.click('button:has-text("Propose Paradigm")');

    // Verification modal should NOT remain visible and success banner should show
    const adCaptchaModal = page.locator('#ad-captcha-overlay');
    await expect(adCaptchaModal).not.toBeVisible();
    await expect(page.locator('text=Paradigm successfully proposed!')).toBeVisible();

    // Wait for the modal to close
    await expect(page.locator('h2:has-text("Propose a Paradigm")')).not.toBeVisible();

    // 8. Verify baby badge 👶 shown next to User B's post row on the leaderboard
    const newPostRow = page.locator('div[class*="postRowWrapper"]', { hasText: `Leverage synergy ${uniqueSuffix}` });
    await expect(newPostRow).toBeVisible();
    const authorSpan = newPostRow.locator('[class*="authorName"]');
    await expect(authorSpan).toContainText('👶');

    // 9. Go to Profile Page and check settings
    await page.goto('/profile');
    await expect(page).toHaveURL(/\/profile/);
    // Wait for the async session loading to complete
    await expect(page.locator('h2:has-text("Loading session...")')).not.toBeVisible({ timeout: 15000 });
    await expect(page.locator('h1')).toContainText('👶');
    await expect(page.locator('h3:has-text("Toddler Settings")')).toBeVisible();

    // Verify checkbox is checked
    const toggle = page.locator('#mercy-mode-toggle');
    await expect(toggle).toBeChecked();

    // 10. Turn Mercy Mode OFF on Profile Page
    await page.click('#mercy-mode-toggle');
    await expect(page.locator('h1')).not.toContainText('👶');
    
    // Wait for the async database sync to complete before navigating away
    await expect(page.locator('text=(Syncing...)')).not.toBeVisible();

    // 11. Go back to homepage, wait for cooldown, and verify evasion is restored
    await page.goto('/');
    await expect(navBtn).not.toContainText('👶');

    // Disable pointer events on header again for clean hover
    await page.evaluate(() => {
      const header = document.querySelector('header');
      if (header) {
        (header as HTMLElement).style.pointerEvents = 'none';
      }
    });

    // Locate the first post again
    const postRowReloaded = page.locator('div[class*="postRowWrapper"]', { hasText: post1Title });
    await expect(postRowReloaded).toBeVisible();
    const voteBtnReloaded = postRowReloaded.locator('button[id^="vote-btn-post-"]');
    await expect(voteBtnReloaded).toBeVisible();

    // Wait for the 5-second cooldown to fully clear (wait 6 seconds)
    await page.waitForTimeout(6000);

    // Hover voteBtnReloaded and verify proximity evasion is active again (it moves)
    await voteBtnReloaded.hover();
    await page.waitForTimeout(100);
    const transform2X = await voteBtnReloaded.evaluate(el => el.style.getPropertyValue('--offset-x'));
    expect(transform2X).not.toBe('0px');
    expect(transform2X).not.toBe('');
  });
});
