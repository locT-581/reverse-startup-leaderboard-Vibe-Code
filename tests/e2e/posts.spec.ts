import { test, expect } from '@playwright/test';

test.describe('Posts & Comments E2E Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test('should validate, submit posts, expand rows, and submit comments', async ({ page }) => {
    // 1. Visit homepage and verify login prompt for unauthenticated user
    await page.goto('/');
    await expect(page.locator('text=Sign In to Propose a Paradigm')).toBeVisible();

    // 2. Go to auth page and register a new user
    await page.goto('/auth');
    await expect(page).toHaveURL(/\/auth/);
    await page.click('button:has-text("Register now")');
    const uniqueUsername = `testuser_${Date.now()}`;
    await page.fill('#username', uniqueUsername);
    await page.fill('#password', 'securePassword123');
    await page.click('button[type="submit"]');

    // Wait for registration to complete and redirect to profile page
    await expect(page).toHaveURL(/\/profile/);
    await expect(page.locator('h1')).toHaveText(uniqueUsername);

    // After registration, redirected to /profile. Go back to homepage.
    await page.goto('/');

    // Click "💡 Propose a Paradigm" button to open modal
    await page.click('button:has-text("Propose a Paradigm")');

    // 3. Verify Propose a Paradigm form is now visible
    await expect(page.locator('h2:has-text("Propose a Paradigm")')).toBeVisible();

    // 4. Test real-time validation for Title
    const titleInput = page.locator('#post-title-input');
    await titleInput.fill('Short');
    await titleInput.blur();
    await expect(page.locator('text=Your title lacks sufficient synergy. Please leverage additional paradigms.')).toBeVisible();

    // Fill valid title
    const uniqueTitle = `Leverage synergy paradigm ${Date.now()}`;
    await titleInput.fill(uniqueTitle);
    await expect(page.locator('text=Your title lacks sufficient synergy. Please leverage additional paradigms.')).not.toBeVisible();

    // 5. Test real-time validation for Content
    const contentInput = page.locator('#post-content-input');
    await contentInput.fill('Short content.');
    await contentInput.blur();
    await expect(page.locator('text=This explanation is dangerously legible. Inject more synergy.')).toBeVisible();

    // Fill valid content (must contain 3 buzzwords and be >= 50 chars)
    const validContent = 'This is a long content to pass validation rules. It has synergy, leverage, paradigm, scale and KPI to reach fifty characters.';
    await contentInput.fill(validContent);
    await expect(page.locator('text=This explanation is dangerously legible. Inject more synergy.')).not.toBeVisible();

    // 6. Submit Post
    await page.click('button:has-text("Propose Paradigm")');
    await expect(page.locator('text=Paradigm successfully proposed!')).toBeVisible();

    // Wait for the modal to close and unmount
    await expect(page.locator('h2:has-text("Propose a Paradigm")')).not.toBeVisible({ timeout: 5000 });

    // 7. Verify post is in leaderboard and click it to expand
    const postRow = page.locator(`text=${uniqueTitle}`);
    await expect(postRow).toBeVisible();
    await postRow.click();

    // 8. Verify comments section expanded
    await expect(page.locator('h3:has-text("Proposed Solutions")')).toBeVisible();
    await expect(page.locator('text=No solutions proposed yet.')).toBeVisible();

    // 9. Test comment validation
    const commentInput = page.locator(`textarea[id^="comment-input-"]`);
    await commentInput.fill('Too short comment');
    await commentInput.blur();
    await expect(page.locator('text=Your solution has insufficient volume. It must strictly exceed the original post')).toBeVisible();

    // Fill valid comment (longer than original post length of 124 characters)
    const validComment = 'This comment is strictly longer than the original post content to satisfy the length validation. Leverage synergy, paradigm, and scale in our microservices ecosystem!';
    await commentInput.fill(validComment);
    await expect(page.locator('text=Your solution has insufficient volume.')).not.toBeVisible();

    // 10. Submit Comment
    await page.click('button:has-text("Submit Solution")');

    // 11. Verify comment is displayed inline
    await expect(page.locator(`p:has-text("${validComment}")`)).toBeVisible();
  });
});
