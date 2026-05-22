import { test, expect, Page } from '@playwright/test';

test.describe('Safe-Chaos & Accessibility E2E tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  async function registerAndCreatePost(page: Page, username: string, title: string) {
    await page.goto('/auth');
    await page.click('button:has-text("Đăng ký ngay")');
    await page.fill('#username', username);
    await page.fill('#password', 'securePassword123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/profile/);

    await page.goto('/');
    await page.click('button:has-text("💡 Đề xuất một Hệ hình")');
    const titleInput = page.locator('#post-title-input');
    const contentInput = page.locator('#post-content-input');
    await titleInput.fill(title);
    await contentInput.fill('This is a long content to pass validation rules. It has synergy, leverage, paradigm, scale and KPI to reach fifty characters.');
    await page.click('button:has-text("Đề xuất Mô hình")');

    await expect(page.locator('h2:has-text("Xác minh thông điệp tài trợ")')).toBeVisible();
    const postAdText = await page.locator('#sponsor-ad-text').textContent();
    expect(postAdText).not.toBeNull();
    await page.fill('#ad-verification-input', postAdText!);
    await page.click('button:has-text("Xác minh & Gửi")');

    await expect(page.locator('h2:has-text("Đề xuất một Mô hình")')).not.toBeVisible();
  }

  test('Test Case 1 (Reduced Motion Evasive Button): should not translate and vote in single click', async ({ browser }) => {
    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();
    const suffix = `${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const title = `Reduced motion synergy paradigm ${suffix}`;
    await registerAndCreatePost(pageA, `red_author_${suffix}`, title);
    await contextA.close();

    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();
    await pageB.emulateMedia({ reducedMotion: 'reduce' });

    // Register User B (voter)
    await pageB.goto('/auth');
    await pageB.click('button:has-text("Đăng ký ngay")');
    await pageB.fill('#username', `red_voter_${suffix}`);
    await pageB.fill('#password', 'securePassword123');
    await pageB.click('button[type="submit"]');
    await expect(pageB).toHaveURL(/\/profile/);

    await pageB.goto('/');
    const postRow = pageB.locator('div[class*="postRowWrapper"]', { hasText: title });
    await expect(postRow).toBeVisible();

    const voteBtn = postRow.locator('button[id^="vote-btn-post-"]');
    await expect(voteBtn).toBeVisible();

    // Verify it doesn't move on hover
    await voteBtn.hover();
    const transformX = await voteBtn.evaluate(el => el.style.getPropertyValue('--offset-x'));
    const transformY = await voteBtn.evaluate(el => el.style.getPropertyValue('--offset-y'));
    expect(transformX === '' || transformX === '0px').toBeTruthy();
    expect(transformY === '' || transformY === '0px').toBeTruthy();

    const scoreLocator = postRow.locator('[class*="scoreValue"]');
    const initialScoreText = await scoreLocator.textContent();
    const initialScore = initialScoreText ? parseInt(initialScoreText.replace(/[^0-9]/g, ''), 10) : 0;

    // Single click votes successfully
    await voteBtn.click();

    // Verify success state (cooldown) and score increment
    await expect(voteBtn).toHaveClass(/cooldown/);
    await expect(scoreLocator).toContainText(`${initialScore + 50} kcal`);

    await contextB.close();
  });

  test('Test Case 2 (Reduced Motion Captcha Skip): should not translate Skip Ad button', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });

    const suffix = `${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    await page.goto('/auth');
    await page.click('button:has-text("Đăng ký ngay")');
    await page.fill('#username', `red_captcha_${suffix}`);
    await page.fill('#password', 'securePassword123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/profile/);

    await page.goto('/');
    await page.click('button:has-text("💡 Đề xuất một Hệ hình")');
    await page.fill('#post-title-input', `Captcha reduced motion pivot leverage ${suffix}`);
    await page.fill('#post-content-input', 'This is a long content to pass validation rules. It has synergy, leverage, paradigm, scale and KPI to reach fifty characters.');
    await page.click('button:has-text("Đề xuất Mô hình")');

    const skipBtn = page.locator('button:has-text("Bỏ qua quảng cáo")');
    await expect(skipBtn).toBeVisible();

    // Hover/mousemove the skip button
    await skipBtn.hover();
    
    // Verify it does not move
    const transformX = await skipBtn.evaluate(el => el.style.getPropertyValue('--skip-x'));
    const transformY = await skipBtn.evaluate(el => el.style.getPropertyValue('--skip-y'));
    expect(transformX === '' || transformX === '0px').toBeTruthy();
    expect(transformY === '' || transformY === '0px').toBeTruthy();
  });

  test('Test Case 3 (Screen Reader Bypass): should hide distorted elements and expose clean text in srOnly', async ({ browser }) => {
    test.setTimeout(60000);
    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();
    const suffix = `${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const postTitle = `Distortion screen reader ecosystem scalability ${suffix}`;
    const userA = `sr_usera_${suffix}`;

    // Register User A and create post
    await registerAndCreatePost(pageA, userA, postTitle);

    // Context B (User B)
    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();
    const userB = `sr_userb_${suffix}`;

    // Register User B
    await pageB.goto('/auth');
    await pageB.click('button:has-text("Đăng ký ngay")');
    await pageB.fill('#username', userB);
    await pageB.fill('#password', 'securePassword123');
    await pageB.click('button[type="submit"]');
    await expect(pageB).toHaveURL(/\/profile/);

    // Purchase Sabotage Pack
    await pageB.goto('/sabotage-store');
    await expect(pageB.locator('[data-testid="inv-blur"]')).toContainText('0');
    await pageB.locator('[data-testid="buy-button-blur"]').click();
    await expect(pageB.locator('[data-testid="checkout-success-banner"]')).toBeVisible();

    // Deploy onto User A's post
    await pageB.goto('/');
    const postRowB = pageB.locator('div[class*="postRowWrapper"]', { hasText: postTitle });
    await expect(postRowB).toBeVisible();

    await postRowB.locator('button:has-text("Phá hoại 😈")').click();
    await expect(pageB.locator('h2:has-text("Phá hoại Mô hình 😈")')).toBeVisible();
    await pageB.locator('div[class*="inventoryCard"]').filter({ hasText: 'Gói Làm mờ' }).click();
    await pageB.locator('button:has-text("Kích hoạt")').click();

    // Wait for deploy confirmation and modal closing
    await expect(pageB.locator('text=Đã kích hoạt phá hoại thành công!')).toBeVisible();
    await expect(pageB.locator('h2:has-text("Phá hoại Mô hình 😈")')).not.toBeVisible({ timeout: 5000 });

    // Verify row level distortion class is applied
    const postRowElement = postRowB.locator('div[class*="postRow"]:not([class*="postRowWrapper"])');
    await expect(postRowElement).toHaveClass(/post-blur/);

    // Verify distorted visual elements have aria-hidden="true"
    const rankCol = postRowB.locator('[class*="colRank"]');
    const authorCol = postRowB.locator('[class*="colAuthor"]');
    const titleCol = postRowB.locator('[class*="colTitle"]');
    const scoreVal = postRowB.locator('[class*="scoreValue"]');

    await expect(rankCol).toHaveAttribute('aria-hidden', 'true');
    await expect(authorCol).toHaveAttribute('aria-hidden', 'true');
    await expect(titleCol).toHaveAttribute('aria-hidden', 'true');
    await expect(scoreVal).toHaveAttribute('aria-hidden', 'true');

    // Verify .srOnly block is present in the DOM containing clean text representation
    const srOnlyText = postRowB.locator('[class*="srOnly"]');
    await expect(srOnlyText).toBeVisible();
    
    const textContent = await srOnlyText.textContent();
    expect(textContent).toContain(`Nhà đổi mới: ${userA}`);
    expect(textContent).toContain(postTitle);

    await contextA.close();
    await contextB.close();
  });

  test('Test Case 4 (Keyboard Bypass): should focus, not move on hover, and vote on Enter keypress', async ({ browser }) => {
    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();
    const suffix = `${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const title = `Keyboard bypass microservices cloud-native ${suffix}`;
    await registerAndCreatePost(pageA, `kb_author_${suffix}`, title);
    await contextA.close();

    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();

    // Register User B (voter)
    await pageB.goto('/auth');
    await pageB.click('button:has-text("Đăng ký ngay")');
    await pageB.fill('#username', `kb_voter_${suffix}`);
    await pageB.fill('#password', 'securePassword123');
    await pageB.click('button[type="submit"]');
    await expect(pageB).toHaveURL(/\/profile/);

    await pageB.goto('/');
    const postRow = pageB.locator('div[class*="postRowWrapper"]', { hasText: title });
    await expect(postRow).toBeVisible();

    const voteBtn = postRow.locator('button[id^="vote-btn-post-"]');
    await expect(voteBtn).toBeVisible();

    // Focus the button
    await voteBtn.focus();

    // Hover the button and verify it does not move
    await voteBtn.hover();
    const transformX = await voteBtn.evaluate(el => el.style.getPropertyValue('--offset-x'));
    const transformY = await voteBtn.evaluate(el => el.style.getPropertyValue('--offset-y'));
    expect(transformX === '' || transformX === '0px').toBeTruthy();
    expect(transformY === '' || transformY === '0px').toBeTruthy();

    const scoreLocator = postRow.locator('[class*="scoreValue"]');
    const initialScoreText = await scoreLocator.textContent();
    const initialScore = initialScoreText ? parseInt(initialScoreText.replace(/[^0-9]/g, ''), 10) : 0;

    // Press Enter to cast the vote instantly
    await pageB.keyboard.press('Enter');

    // Verify success state (cooldown) and score increment
    await expect(voteBtn).toHaveClass(/cooldown/);
    await expect(scoreLocator).toContainText(`${initialScore + 50} kcal`);

    await contextB.close();
  });
});
