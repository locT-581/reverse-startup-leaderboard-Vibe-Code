# Acceptance Auditor Review Prompt

You are an Acceptance Auditor. Review the provided diff against the spec and context docs. Check for: violations of acceptance criteria, deviations from spec intent, missing implementation of specified behavior, contradictions between spec constraints and actual code. Output findings as a Markdown list. Each finding: one-line title, which AC/constraint it violates, and evidence from the diff.

## Spec Document

```markdown
story_id: 4.4
story_key: 4-4-safe-chaos-protocol-screen-reader-bypass
epic_num: 4
story_num: 4
epic_title: Anti-Logic Moderation & Viral Sharing
story_title: Safe-Chaos Protocol & Screen Reader Bypass
status: review

# Story 4.4: Safe-Chaos Protocol & Screen Reader Bypass

Status: review

## Story

As a system administrator,
I want the platform to be safe and accessible despite the visual chaos,
so that we do not cause actual harm or exclude assistive technology users.

## Acceptance Criteria

1. **Given** the application is running:
   - **When** a user has OS-level `prefers-reduced-motion: reduce` active
   - **Then** all CSS vibrating, evading, and shaking animations must be disabled statically.
   - **And** the `EvasiveButton` proximity evasion is disabled, allowing direct voting in a single click without requiring combo clicks.
   - **And** the `AdCaptchaModal` "Skip Ad" button evasion is disabled, remaining stationary when hovered or focused.
2. **Given** a post is distorted by an active Sabotage Pack (e.g. `sabotage-blur`, `sabotage-comic-sans`, `sabotage-papyrus`):
   - **When** a screen reader parses the post row on the leaderboard
   - **Then** it must read out a clean, undistorted, visually hidden text block (using `.srOnly` CSS styles) containing full semantic text (Rank, Innovator username, logic penalties, post title, post snippet, and Wasted Calories).
   - **And** all distorted visual elements must be hidden from screen readers via `aria-hidden="true"`.
3. **Given** a keyboard user navigates the site using `Tab`, `Enter`, or `Space`:
   - **When** they focus on the `EvasiveButton`
   - **Then** the evasion logic is bypassed entirely, keeping the button in place.
   - **And** pressing `Enter` or `Space` immediately registers the vote in a single action.

## Tasks / Subtasks

- [x] **Task 1: Verify & Consolidate Safe-Chaos Protocol (prefers-reduced-motion)** (AC: 1)
  - [x] Audit CSS modules to ensure transitions, animations, and keyframes are disabled or set to static properties when `@media (prefers-reduced-motion: reduce)` is matching. Check:
    - [x] `apps/frontend/src/app/globals.css` (screen-shake)
    - [x] `apps/frontend/src/domains/anti-ux/components/EvasiveButton.module.css` (shakeBtn, panting)
    - [x] `apps/frontend/src/domains/anti-ux/components/AdCaptchaModal.module.css` (shake, scaleIn, fadeIn)
    - [x] `apps/frontend/src/domains/leaderboard/components/LeaderboardGrid.module.css` (wiggle)
    - [x] `apps/frontend/src/domains/leaderboard/components/CommentSection.module.css` (wiggle)
    - [x] `apps/frontend/src/app/profile/profile.module.css` & `profile-public.module.css` (wiggle, pulse)
  - [x] Audit React state listeners and ensures JS-based evasion coordinates are immediately bypassed for reduced-motion users (using matchMedia checks) in `EvasiveButton.tsx` and `AdCaptchaModal.tsx`.
- [x] **Task 2: Verify & Consolidate Screen Reader Bypass** (AC: 2)
  - [x] Inspect `LeaderboardGrid.tsx` and verify that when a post is active-sabotaged (`isDistorted` is true):
    - [x] The clean text fallback `<div className={styles.srOnly}>` renders correct readable fields.
    - [x] All other row contents (Rank badge, Innovator column, Title snippet column, Score column, actionButtons) are wrapped in containers marked with `aria-hidden="true"`.
  - [x] Review comment sections and other elements to ensure no visual chaos overrides screen reader navigation.
- [x] **Task 3: Implement Automated E2E Accessibility Tests** (AC: 1, 2, 3)
  - [x] Create a new E2E test file `tests/e2e/accessibility-safe-chaos.spec.ts` using Playwright:
    - [x] **Test Case 1 (Reduced Motion Evasive Button):** Emulate `reducedMotion: 'reduce'`, hover the `EvasiveButton`, verify it does not translate, and verify clicking it once successfully casts a vote (increases score).
    - [x] **Test Case 2 (Reduced Motion Captcha Skip):** Emulate `reducedMotion: 'reduce'`, trigger the post creation captcha, hover/mouseMove the "Skip Ad" button, and verify it does not translate.
    - [x] **Test Case 3 (Screen Reader Bypass):** Register User A and create a post. Register User B, purchase a Sabotage Pack, and deploy it onto User A's post. Verify that User A's post row is distorted, that the visual elements have `aria-hidden="true"`, and that the `.srOnly` element is visible in the DOM containing the correct, readable text representation of the post.
    - [x] **Test Case 4 (Keyboard Bypass):** Register a user, focus on the `EvasiveButton` using keyboard navigation (`focus()`), hover it to verify it does not move, and press `Enter` to cast the vote instantly.
```

## Content to Review: Diff Output

```diff
diff --git a/_bmad-output/implementation-artifacts/sprint-status.yaml b/_bmad-output/implementation-artifacts/sprint-status.yaml
index c1b14a7..32b61a5 100644
--- a/_bmad-output/implementation-artifacts/sprint-status.yaml
+++ b/_bmad-output/implementation-artifacts/sprint-status.yaml
@@ -1,5 +1,5 @@
 # generated: 2026-05-18T09:50:34Z
-# last_updated: 2026-05-22T15:37:00+07:00
+# last_updated: 2026-05-22T15:53:30+07:00
 # project: Reverse Startup Leaderboard
 # project_key: NOKEY
 # tracking_system: file-system
@@ -35,7 +35,7 @@
 # - Dev moves story to 'review', then runs code-review (fresh context, different LLM recommended)
 
 generated: 2026-05-18T09:50:34Z
-last_updated: 2026-05-22T15:37:00+07:00
+last_updated: 2026-05-22T15:53:30+07:00
 project: Reverse Startup Leaderboard
 project_key: NOKEY
 tracking_system: file-system
@@ -63,5 +63,5 @@ development_status:
   4-1-anti-logic-reporting-system: done
   4-2-visual-penalties-the-clown-hat: done
   4-3-viral-sharing-dynamic-previews: done
-  4-4-safe-chaos-protocol-screen-reader-bypass: backlog
+  4-4-safe-chaos-protocol-screen-reader-bypass: review
   epic-4-retrospective: optional
diff --git a/apps/frontend/src/app/profile/[username]/profile-public.module.css b/apps/frontend/src/app/profile/[username]/profile-public.module.css
index 32b56aa..047f421 100644
--- a/apps/frontend/src/app/profile/[username]/profile-public.module.css
+++ b/apps/frontend/src/app/profile/[username]/profile-public.module.css
@@ -187,3 +187,16 @@
   font-weight: 600;
   line-height: 1.4;
 }
+
+@media (prefers-reduced-motion: reduce) {
+  .avatarDisplay,
+  .backLink,
+  .statBox {
+    transition: none !important;
+    animation: none !important;
+  }
+  .avatarDisplay:hover,
+  .statBox:hover {
+    transform: none !important;
+  }
+}
diff --git a/apps/frontend/src/app/profile/profile.module.css b/apps/frontend/src/app/profile/profile.module.css
index 56a0582..adb199a 100644
--- a/apps/frontend/src/app/profile/profile.module.css
+++ b/apps/frontend/src/app/profile/profile.module.css
@@ -413,3 +413,25 @@
   transform: translateY(-1px);
   box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
 }
+
+@media (prefers-reduced-motion: reduce) {
+  .avatarDisplay,
+  .avatarOption,
+  .saveButton,
+  .logoutButton,
+  .storeButton,
+  .shareProfileBtn {
+    transition: none !important;
+    animation: none !important;
+  }
+  .avatarDisplay:hover,
+  .avatarOption:hover,
+  .saveButton:hover,
+  .storeButton:hover,
+  .shareProfileBtn:hover {
+    transform: none !important;
+  }
+  .loadingText {
+    animation: none !important;
+  }
+}
diff --git a/apps/frontend/src/domains/anti-ux/components/AdCaptchaModal.tsx b/apps/frontend/src/domains/anti-ux/components/AdCaptchaModal.tsx
index 9ea8e94..e513183 100644
--- a/apps/frontend/src/domains/anti-ux/components/AdCaptchaModal.tsx
+++ b/apps/frontend/src/domains/anti-ux/components/AdCaptchaModal.tsx
@@ -119,7 +119,7 @@ export default function AdCaptchaModal({
   };
 
   const handleButtonEvasion = () => {
-    if (reducedMotion) return;
+    if (reducedMotion || document.activeElement === skipBtnRef.current) return;
 
     // Relocate to a random coordinate within bounds
     // We'll use values between -140px and 140px for X, and -80px and 80px for Y
diff --git a/tests/e2e/accessibility-safe-chaos.spec.ts b/tests/e2e/accessibility-safe-chaos.spec.ts
new file mode 100644
index 0000000..1302308
--- /dev/null
+++ b/tests/e2e/accessibility-safe-chaos.spec.ts
@@ -0,0 +1,231 @@
+import { test, expect } from '@playwright/test';
+
+test.describe('Safe-Chaos & Accessibility E2E tests', () => {
+  test.beforeEach(async ({ page }) => {
+    await page.context().clearCookies();
+  });
+
+  async function registerAndCreatePost(page: any, username: string, title: string) {
+    await page.goto('/auth');
+    await page.click('button:has-text("Register now")');
+    await page.fill('#username', username);
+    await page.fill('#password', 'securePassword123');
+    await page.click('button[type="submit"]');
+    await expect(page).toHaveURL(/\/profile/);
+
+    await page.goto('/');
+    await page.click('button:has-text("Propose a Paradigm")');
+    const titleInput = page.locator('#post-title-input');
+    const contentInput = page.locator('#post-content-input');
+    await titleInput.fill(title);
+    await contentInput.fill('This is a long content to pass validation rules. It has synergy, leverage, paradigm, scale and KPI to reach fifty characters.');
+    await page.click('button:has-text("Propose Paradigm")');
+
+    await expect(page.locator('h2:has-text("Sponsor Message Verification")')).toBeVisible();
+    const postAdText = await page.locator('#sponsor-ad-text').textContent();
+    expect(postAdText).not.toBeNull();
+    await page.fill('#ad-verification-input', postAdText!);
+    await page.click('button:has-text("Verify & Submit")');
+
+    await expect(page.locator('h2:has-text("Propose a Paradigm")')).not.toBeVisible();
+  }
+
+  test('Test Case 1 (Reduced Motion Evasive Button): should not translate and vote in single click', async ({ browser }) => {
+    const contextA = await browser.newContext();
+    const pageA = await contextA.newPage();
+    const suffix = `${Date.now()}_${Math.floor(Math.random() * 1000)}`;
+    const title = `Reduced motion synergy paradigm ${suffix}`;
+    await registerAndCreatePost(pageA, `red_author_${suffix}`, title);
+    await contextA.close();
+
+    const contextB = await browser.newContext();
+    const pageB = await contextB.newPage();
+    await pageB.emulateMedia({ reducedMotion: 'reduce' });
+
+    // Register User B (voter)
+    await pageB.goto('/auth');
+    await pageB.click('button:has-text("Register now")');
+    await pageB.fill('#username', `red_voter_${suffix}`);
+    await pageB.fill('#password', 'securePassword123');
+    await pageB.click('button[type="submit"]');
+    await expect(pageB).toHaveURL(/\/profile/);
+
+    await pageB.goto('/');
+    const postRow = pageB.locator('div[class*="postRowWrapper"]', { hasText: title });
+    await expect(postRow).toBeVisible();
+
+    const voteBtn = postRow.locator('button[id^="vote-btn-post-"]');
+    await expect(voteBtn).toBeVisible();
+
+    // Verify it doesn't move on hover
+    await voteBtn.hover();
+    const transformX = await voteBtn.evaluate(el => el.style.getPropertyValue('--offset-x'));
+    const transformY = await voteBtn.evaluate(el => el.style.getPropertyValue('--offset-y'));
+    expect(transformX === '' || transformX === '0px').toBeTruthy();
+    expect(transformY === '' || transformY === '0px').toBeTruthy();
+
+    const scoreLocator = postRow.locator('[class*="scoreValue"]');
+    const initialScoreText = await scoreLocator.textContent();
+    const initialScore = initialScoreText ? parseInt(initialScoreText.replace(/[^0-9]/g, ''), 10) : 0;
+
+    // Single click votes successfully
+    await voteBtn.click();
+
+    // Verify success state (cooldown) and score increment
+    await expect(voteBtn).toHaveClass(/cooldown/);
+    await expect(scoreLocator).toContainText(`${initialScore + 50} kcal`);
+
+    await contextB.close();
+  });
+
+  test('Test Case 2 (Reduced Motion Captcha Skip): should not translate Skip Ad button', async ({ page }) => {
+    await page.emulateMedia({ reducedMotion: 'reduce' });
+
+    const suffix = `${Date.now()}_${Math.floor(Math.random() * 1000)}`;
+    await page.goto('/auth');
+    await page.click('button:has-text("Register now")');
+    await page.fill('#username', `red_captcha_${suffix}`);
+    await page.fill('#password', 'securePassword123');
+    await page.click('button[type="submit"]');
+    await expect(page).toHaveURL(/\/profile/);
+
+    await page.goto('/');
+    await page.click('button:has-text("Propose a Paradigm")');
+    await page.fill('#post-title-input', `Captcha reduced motion pivot leverage ${suffix}`);
+    await page.fill('#post-content-input', 'This is a long content to pass validation rules. It has synergy, leverage, paradigm, scale and KPI to reach fifty characters.');
+    await page.click('button:has-text("Propose Paradigm")');
+
+    const skipBtn = page.locator('button:has-text("Skip Ad")');
+    await expect(skipBtn).toBeVisible();
+
+    // Hover/mousemove the skip button
+    await skipBtn.hover();
+    
+    // Verify it does not move
+    const transformX = await skipBtn.evaluate(el => el.style.getPropertyValue('--skip-x'));
+    const transformY = await skipBtn.evaluate(el => el.style.getPropertyValue('--skip-y'));
+    expect(transformX === '' || transformX === '0px').toBeTruthy();
+    expect(transformY === '' || transformY === '0px').toBeTruthy();
+  });
+
+  test('Test Case 3 (Screen Reader Bypass): should hide distorted elements and expose clean text in srOnly', async ({ browser }) => {
+    test.setTimeout(60000);
+    const contextA = await browser.newContext();
+    const pageA = await contextA.newPage();
+    const suffix = `${Date.now()}_${Math.floor(Math.random() * 1000)}`;
+    const postTitle = `Distortion screen reader ecosystem scalability ${suffix}`;
+    const userA = `sr_usera_${suffix}`;
+
+    // Register User A and create post
+    await registerAndCreatePost(pageA, userA, postTitle);
+
+    // Context B (User B)
+    const contextB = await browser.newContext();
+    const pageB = await contextB.newPage();
+    const userB = `sr_userb_${suffix}`;
+
+    // Register User B
+    await pageB.goto('/auth');
+    await pageB.click('button:has-text("Register now")');
+    await pageB.fill('#username', userB);
+    await pageB.fill('#password', 'securePassword123');
+    await pageB.click('button[type="submit"]');
+    await expect(pageB).toHaveURL(/\/profile/);
+
+    // Purchase Sabotage Pack
+    await pageB.goto('/sabotage-store');
+    await expect(pageB.locator('[data-testid="inv-blur"]')).toContainText('0');
+    await pageB.locator('[data-testid="buy-button-blur"]').click();
+    await expect(pageB.locator('[data-testid="checkout-success-banner"]')).toBeVisible();
+
+    // Deploy onto User A's post
+    await pageB.goto('/');
+    const postRowB = pageB.locator('div[class*="postRowWrapper"]', { hasText: postTitle });
+    await expect(postRowB).toBeVisible();
+
+    await postRowB.locator('button:has-text("Sabotage 😈")').click();
+    await expect(pageB.locator('h2:has-text("Sabotage Paradigm")')).toBeVisible();
+    await pageB.locator('div[class*="inventoryCard"]').filter({ hasText: 'Blur Pack' }).click();
+    await pageB.locator('button:has-text("Deploy")').click();
+
+    // Wait for deploy confirmation and modal closing
+    await expect(pageB.locator('text=Sabotage deployed successfully!')).toBeVisible();
+    await expect(pageB.locator('h2:has-text("Sabotage Paradigm")')).not.toBeVisible({ timeout: 5000 });
+
+    // Verify row level distortion class is applied
+    const postRowElement = postRowB.locator('div[class*="postRow"]:not([class*="postRowWrapper"])');
+    await expect(postRowElement).toHaveClass(/post-blur/);
+
+    // Verify distorted visual elements have aria-hidden="true"
+    const rankCol = postRowB.locator('[class*="colRank"]');
+    const authorCol = postRowB.locator('[class*="colAuthor"]');
+    const titleCol = postRowB.locator('[class*="colTitle"]');
+    const scoreVal = postRowB.locator('[class*="scoreValue"]');
+
+    await expect(rankCol).toHaveAttribute('aria-hidden', 'true');
+    await expect(authorCol).toHaveAttribute('aria-hidden', 'true');
+    await expect(titleCol).toHaveAttribute('aria-hidden', 'true');
+    await expect(scoreVal).toHaveAttribute('aria-hidden', 'true');
+
+    // Verify .srOnly block is present in the DOM containing clean text representation
+    const srOnlyText = postRowB.locator('[class*="srOnly"]');
+    await expect(srOnlyText).toBeVisible();
+    
+    const textContent = await srOnlyText.textContent();
+    expect(textContent).toContain(`Innovator: ${userA}`);
+    expect(textContent).toContain(postTitle);
+
+    await contextA.close();
+    await contextB.close();
+  });
+
+  test('Test Case 4 (Keyboard Bypass): should focus, not move on hover, and vote on Enter keypress', async ({ browser }) => {
+    const contextA = await browser.newContext();
+    const pageA = await contextA.newPage();
+    const suffix = `${Date.now()}_${Math.floor(Math.random() * 1000)}`;
+    const title = `Keyboard bypass microservices cloud-native ${suffix}`;
+    await registerAndCreatePost(pageA, `kb_author_${suffix}`, title);
+    await contextA.close();
+
+    const contextB = await browser.newContext();
+    const pageB = await contextB.newPage();
+
+    // Register User B (voter)
+    await pageB.goto('/auth');
+    await pageB.click('button:has-text("Register now")');
+    await pageB.fill('#username', `kb_voter_${suffix}`);
+    await pageB.fill('#password', 'securePassword123');
+    await pageB.click('button[type="submit"]');
+    await expect(pageB).toHaveURL(/\/profile/);
+
+    await pageB.goto('/');
+    const postRow = pageB.locator('div[class*="postRowWrapper"]', { hasText: title });
+    await expect(postRow).toBeVisible();
+
+    const voteBtn = postRow.locator('button[id^="vote-btn-post-"]');
+    await expect(voteBtn).toBeVisible();
+
+    // Focus the button
+    await voteBtn.focus();
+
+    // Hover the button and verify it does not move
+    await voteBtn.hover();
+    const transformX = await voteBtn.evaluate(el => el.style.getPropertyValue('--offset-x'));
+    const transformY = await voteBtn.evaluate(el => el.style.getPropertyValue('--offset-y'));
+    expect(transformX === '' || transformX === '0px').toBeTruthy();
+    expect(transformY === '' || transformY === '0px').toBeTruthy();
+
+    const scoreLocator = postRow.locator('[class*="scoreValue"]');
+    const initialScoreText = await scoreLocator.textContent();
+    const initialScore = initialScoreText ? parseInt(initialScoreText.replace(/[^0-9]/g, ''), 10) : 0;
+
+    // Press Enter to cast the vote instantly
+    await pageB.keyboard.press('Enter');
+
+    // Verify success state (cooldown) and score increment
+    await expect(voteBtn).toHaveClass(/cooldown/);
+    await expect(scoreLocator).toContainText(`${initialScore + 50} kcal`);
+
+    await contextB.close();
+  });
+});
+```
+
