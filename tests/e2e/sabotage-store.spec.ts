import { test, expect } from '@playwright/test';

test.describe('Sabotage Storefront E2E Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test('should navigate to storefront from profile, buy a pack (mock), and return to leaderboard', async ({ page }) => {
    // 1. Register a new user
    await page.goto('/auth');
    await page.click('button:has-text("Register now")');
    const uniqueUsername = `saboteur_${Date.now()}`;
    await page.fill('#username', uniqueUsername);
    await page.fill('#password', 'pass1234');
    await page.click('button[type="submit"]');

    // 2. Expect redirection to /profile
    await expect(page).toHaveURL(/\/profile/);
    await expect(page.locator('h1')).toHaveText(uniqueUsername);

    // 3. Verify Sabotage Store Link is present on profile and click it
    const profileStoreBtn = page.locator('[data-testid="profile-sabotage-store"]');
    await expect(profileStoreBtn).toBeVisible();
    await profileStoreBtn.click();

    // 4. Verify we are on /sabotage-store page
    await expect(page).toHaveURL(/\/sabotage-store/);
    await expect(page.locator('h1')).toHaveText('Sabotage Store');
    await expect(page.locator('h2')).toHaveText('Troll Capitalism');

    // 5. Verify the 4 MVP Sabotage Packs exist
    const blurCard = page.locator('[data-testid="sabotage-card-blur"]');
    await expect(blurCard).toBeVisible();
    await expect(blurCard.locator('h3')).toHaveText('Blur Pack');
    await expect(blurCard.locator('p')).toContainText('blurry');
    await expect(blurCard.locator('span')).toHaveText('$0.99');

    const comicCard = page.locator('[data-testid="sabotage-card-comic_sans"]');
    await expect(comicCard).toBeVisible();
    await expect(comicCard.locator('h3')).toHaveText('Comic Sans Pack');
    await expect(comicCard.locator('span')).toHaveText('$1.99');

    const papyrusCard = page.locator('[data-testid="sabotage-card-papyrus"]');
    await expect(papyrusCard).toBeVisible();
    await expect(papyrusCard.locator('h3')).toHaveText('Papyrus Pack');
    await expect(papyrusCard.locator('span')).toHaveText('$1.99');

    const caloriesCard = page.locator('[data-testid="sabotage-card-deduct_calories"]');
    await expect(caloriesCard).toBeVisible();
    await expect(caloriesCard.locator('h3')).toHaveText('Calories Deduction Pack');
    await expect(caloriesCard.locator('span')).toHaveText('$4.99');

    // 6. Check that clicking "Buy Now" on Blur Pack redirects and completes transaction via Mock mode
    // Initial inventory checks
    await expect(page.locator('[data-testid="inv-blur"]')).toContainText('0');
    await expect(page.locator('[data-testid="inv-comic_sans"]')).toContainText('0');

    // Click Buy Now on Blur Pack
    await page.locator('[data-testid="buy-button-blur"]').click();

    // Verify success banner is shown (since mock checkout redirects immediately to success URL)
    await expect(page.locator('[data-testid="checkout-success-banner"]')).toBeVisible();
    await expect(page).toHaveURL(/\/sabotage-store/);

    // Verify updated inventory (Blur should now be 1)
    await expect(page.locator('[data-testid="inv-blur"]')).toContainText('1');

    // Close the success banner
    await page.locator('[data-testid="checkout-success-banner"] button').click();
    await expect(page.locator('[data-testid="checkout-success-banner"]')).toBeHidden();

    // 7. Verify cancel flow manually using query parameter redirection
    await page.goto('/sabotage-store?canceled=true');
    await expect(page.locator('[data-testid="checkout-cancel-banner"]')).toBeVisible();
    await expect(page).toHaveURL(/\/sabotage-store/); // replaced by router.replace
    await page.locator('[data-testid="checkout-cancel-banner"] button').click();
    await expect(page.locator('[data-testid="checkout-cancel-banner"]')).toBeHidden();

    // 8. Test the webhook endpoint `/api/webhooks/stripe` with a mock payload
    // First, extract the token from context cookies to find the logged in userId
    const cookies = await page.context().cookies();
    const tokenCookie = cookies.find((c) => c.name === 'token');
    expect(tokenCookie).toBeDefined();
    const token = tokenCookie!.value;
    const payloadBase64 = token.split('.')[1];
    const payloadJson = Buffer.from(payloadBase64, 'base64').toString('utf-8');
    const payload = JSON.parse(payloadJson);
    const userId = payload.sub;
    expect(userId).toBeDefined();

    // Get the actual packId of the Comic Sans pack from the DOM using the comicCard locator declared above
    const packId = await comicCard.getAttribute('data-pack-id');
    expect(packId).not.toBeNull();

    // Send mock webhook request
    const webhookPayload = {
      id: `evt_mock_${Date.now()}`,
      type: 'checkout.session.completed',
      data: {
        object: {
          id: `cs_test_mock_webhook_${Date.now()}`,
          metadata: {
            userId: userId,
            packId: packId,
          },
        },
      },
    };

    const webhookRes = await page.request.post('/api/webhooks/stripe', {
      data: webhookPayload,
    });
    expect(webhookRes.ok()).toBe(true);
    const resJson = await webhookRes.json();
    expect(resJson.success).toBe(true);

    // Reload page and check that the Comic Sans pack inventory has increased to 1
    await page.reload();
    await expect(page.locator('[data-testid="inv-comic_sans"]')).toContainText('1');

    // 9. Click back to leaderboard and verify home page
    const backBtn = page.locator('[data-testid="back-to-leaderboard"]');
    await expect(backBtn).toBeVisible();
    await backBtn.click();
    await expect(page).toHaveURL(/\/$/); // exactly root path
    await expect(page.locator('#nav-profile-btn')).toContainText(uniqueUsername);

    // 10. Verify the header link on home page and click it to return to storefront
    const headerStoreBtn = page.locator('[data-testid="nav-sabotage-store"]');
    await expect(headerStoreBtn).toBeVisible();
    
    // Wait briefly for hydration
    await page.waitForTimeout(500);
    await headerStoreBtn.click();
    
    // Try to expect URL, retrying click if Next.js hydration swallowed it
    try {
      await expect(page).toHaveURL(/\/sabotage-store/, { timeout: 3000 });
    } catch (e) {
      await headerStoreBtn.click();
      await expect(page).toHaveURL(/\/sabotage-store/);
    }
  });
});
