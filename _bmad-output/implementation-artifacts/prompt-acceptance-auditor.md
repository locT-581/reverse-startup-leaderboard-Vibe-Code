# Acceptance Auditor Code Review Prompt

You are acting as the **Acceptance Auditor** subagent for code review.

## Role Definition
You are an Acceptance Auditor. Review this diff against the spec and context docs. Check for: violations of acceptance criteria, deviations from spec intent, missing implementation of specified behavior, contradictions between spec constraints and actual code.

## Instructions
1. Review the git diff provided below against the specification document.
2. Output findings as a Markdown list. Each finding must include:
   - One-line title
   - Which AC/constraint it violates
   - Evidence from the diff
3. Keep the output clean and focused.

## Specification Document (2-2-the-ad-captcha-challenge.md)
```markdown
---
story_id: 2.2
story_key: 2-2-the-ad-captcha-challenge
epic_num: 2
story_num: 2
epic_title: The Core Chaos - Posting, Voting & Mercy
story_title: The Ad Captcha Challenge
status: review
---

# Story 2.2: The Ad Captcha Challenge

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to submit my completed form,
so that my content is published to the leaderboard.

## Acceptance Criteria

1. **Given** a user has successfully passed the Hostile Input validation:
   - **When** they click to finally submit a post (in `CreatePostModal.tsx`) or comment (in `CommentSection.tsx`)
   - **Then** an "Ad Captcha" modal (`AdCaptchaModal.tsx`) appears, intercepting the form submission.
2. **Given** the "Ad Captcha" modal is open:
   - **Then** it displays a randomized/sequential sponsored message (from a pre-defined list of at least 3 funny, corporate buzzword-heavy ad lines).
   - **And** it displays a text input area for the user to manually type out the sponsored message.
   - **And** it displays a "Skip Ad" button that evades the user's cursor on hover/approach, making it mathematically impossible to click via normal mouse movement.
3. **Given** the "Skip Ad" button is focused or clicked:
   - **When** the user clicks "Skip Ad" (e.g., via keyboard navigation or a simulated click event)
   - **Then** it displays a new, different sponsored message, forcing the user into a recursive loop of ad captchas.
4. **Given** the user is typing the sponsored message:
   - **When** the user's input does not exactly match the sponsored message (case-sensitive, matching spaces and punctuation)
   - **Then** the "Verify & Submit" button remains disabled, and an error indicator is shown.
5. **Given** the user's input matches the sponsored message exactly:
   - **When** they click the "Verify & Submit" button
   - **Then** the modal closes, the actual form submission is fired (calling `actionCreatePost` or `actionCreateComment`), and the parent form's state is reset.
6. **Given** the frontend client:
   - **When** `prefers-reduced-motion` is active
   - **Then** the "Skip Ad" button must NOT move or evade the cursor, to comply with accessibility rules (Safe-Chaos).

## Tasks / Subtasks

- [x] Task 1: Create the Ad Captcha Component & Styling (AC: 1, 2, 3, 4, 6)
  - [x] Create `apps/frontend/src/domains/anti-ux/components/AdCaptchaModal.tsx` as a Client Component (`"use client"`).
  - [x] Implement a list of funny corporate sponsor ads (e.g., SynergyCoin, Paradigmer.io, MoonScale.io).
  - [x] Create styling in `apps/frontend/src/domains/anti-ux/components/AdCaptchaModal.module.css` using Vanilla CSS (strict separation of concerns, absolute positioning, responsive modal layout).
  - [x] Add the text validation matching logic (exact string matching, trim whitespace).
  - [x] Implement the "Skip Ad" button evasion physics using `onMouseEnter` or `onMouseMove` events. Adjust position variables using inline styles/CSS variables (`--skip-x`, `--skip-y`) to avoid React re-renders and maintain 60fps performance.
  - [x] Implement recursive ad cycling when "Skip Ad" is successfully clicked.
  - [x] Integrate accessibility fallback using `@media (prefers-reduced-motion: reduce)` to disable evasion.
- [x] Task 2: Integrate Ad Captcha into Post Creation (AC: 1, 5)
  - [x] Modify `apps/frontend/src/domains/leaderboard/components/CreatePostModal.tsx` to import and render `AdCaptchaModal`.
  - [x] Add state tracking to defer the `actionCreatePost` execution until the captcha is successfully solved.
  - [x] Ensure that when the captcha is completed, the modal is hidden, the Server Action is fired, and any server errors/successes are displayed correctly.
- [x] Task 3: Integrate Ad Captcha into Comment Submission (AC: 1, 5)
  - [x] Modify `apps/frontend/src/domains/leaderboard/components/CommentSection.tsx` to import and render `AdCaptchaModal`.
  - [x] Defer the `actionCreateComment` call until the captcha is successfully solved.
- [x] Task 4: Testing & Verification (AC: 1, 2, 3, 4, 5, 6)
  - [x] Create Playwright E2E tests in `tests/e2e/ad-captcha.spec.ts`.
  - [x] Verify form submission interception, exact match checking, evasion on hover, recursive ad looping, and reduced motion accessibility.

## Dev Notes

- **Anti-UX Isolation**:
  - Keep all evasion logic and modal complexity within `apps/frontend/src/domains/anti-ux/components/`. Do not pollute shared UI components with this logic.
- **Aesthetics & Theme**:
  - Style the captcha modal as a premium modern card (border-radius: 12px, soft drop shadow, clean typography) to make the subsequent frustration even more jarring.
  - Use Penalty Red `#ef4444` for match errors or warning indicators.
- **Performance**:
  - Do not trigger state changes on every pixel movement of the cursor. Use inline CSS Custom Properties for offsets.
- **Future Hookability**:
  - Make sure `AdCaptchaModal` accepts a bypass prop or check. When Story 2.4 (Mercy Threshold) is implemented, it will need to disable or simplify the captcha if the Mercy Mode toggle is active.
- **References**:
  - [PRD - FR6](file:///Users/loct-581/Work/reverse-startup-leaderboard/_bmad-output/planning-artifacts/prd.md#L254)
  - [UX Spec - Interstitial Labor](file:///Users/loct-581/Work/reverse-startup-leaderboard/_bmad-output/planning-artifacts/ux-design-specification.md#L206)
  - [UX Spec - The Ad Captcha Interstitial](file:///Users/loct-581/Work/reverse-startup-leaderboard/_bmad-output/planning-artifacts/ux-design-specification.md#L373)
  - [Architecture - Consistency Rules](file:///Users/loct-581/Work/reverse-startup-leaderboard/_bmad-output/planning-artifacts/architecture.md#L175)
  - [Previous Story - Hostile Input](file:///Users/loct-581/Work/reverse-startup-leaderboard/_bmad-output/implementation-artifacts/2-1-hostile-input-content-creation.md)

## Dev Agent Record

### Agent Model Used

Gemini 3.5 Flash (High)

### Debug Log References

None

### Completion Notes List

- Designed and implemented the `AdCaptchaModal` containing randomized ads, text verification, recursive loop cycling, and inline CSS custom property-based evasive buttons.
- Integrated the modal into post and comment creation forms to properly intercept submissions.
- Fixed a race condition where randomizing the ad index on open caused the text to fluctuate and fail E2E tests by shifting randomization to the close trigger.
- Authored a comprehensive E2E suite verifying validation constraints, skip button evasion mechanics, recursive cycling, and accessibility overrides.

### File List

- [AdCaptchaModal.tsx](file:///Users/loct-581/Work/reverse-startup-leaderboard/apps/frontend/src/domains/anti-ux/components/AdCaptchaModal.tsx)
- [AdCaptchaModal.module.css](file:///Users/loct-581/Work/reverse-startup-leaderboard/apps/frontend/src/domains/anti-ux/components/AdCaptchaModal.module.css)
- [CreatePostModal.tsx](file:///Users/loct-581/Work/reverse-startup-leaderboard/apps/frontend/src/domains/leaderboard/components/CreatePostModal.tsx)
- [CommentSection.tsx](file:///Users/loct-581/Work/reverse-startup-leaderboard/apps/frontend/src/domains/leaderboard/components/CommentSection.tsx)
- [ad-captcha.spec.ts](file:///Users/loct-581/Work/reverse-startup-leaderboard/tests/e2e/ad-captcha.spec.ts)
- [posts.spec.ts](file:///Users/loct-581/Work/reverse-startup-leaderboard/tests/e2e/posts.spec.ts)

```

## Input Code Diff
```diff
diff --git a/apps/frontend/src/domains/anti-ux/components/AdCaptchaModal.module.css b/apps/frontend/src/domains/anti-ux/components/AdCaptchaModal.module.css
new file mode 100644
index 0000000..e4ea1aa
--- /dev/null
+++ b/apps/frontend/src/domains/anti-ux/components/AdCaptchaModal.module.css
@@ -0,0 +1,311 @@
+.overlay {
+  position: fixed;
+  top: 0;
+  left: 0;
+  right: 0;
+  bottom: 0;
+  background-color: rgba(15, 23, 42, 0.6);
+  backdrop-filter: blur(12px);
+  z-index: 1100;
+  /* Higher than standard modals to intercept them */
+  display: flex;
+  justify-content: center;
+  align-items: center;
+  padding: 1.5rem;
+  animation: fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
+}
+
+.modal {
+  background: #ffffff;
+  border: 1px solid #e2e8f0;
+  border-radius: 16px;
+  box-shadow:
+    0 20px 25px -5px rgba(0, 0, 0, 0.1),
+    0 10px 10px -5px rgba(0, 0, 0, 0.04),
+    0 0 0 1px rgba(0, 0, 0, 0.05);
+  width: 100%;
+  max-width: 550px;
+  max-height: 90vh;
+  overflow: visible;
+  /* Needed for skip button to float outside if necessary */
+  position: relative;
+  font-family: var(--font-body);
+  animation: scaleIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
+  display: flex;
+  flex-direction: column;
+}
+
+.header {
+  display: flex;
+  justify-content: space-between;
+  align-items: flex-start;
+  padding: 1.5rem 1.75rem 0.75rem 1.75rem;
+}
+
+.titleContainer {
+  flex: 1;
+}
+
+.title {
+  font-family: var(--font-heading);
+  font-weight: 800;
+  font-size: 1.35rem;
+  color: #0f172a;
+  margin: 0 0 0.35rem 0;
+  letter-spacing: -0.02em;
+}
+
+.subtitle {
+  font-size: 0.85rem;
+  color: #64748b;
+  margin: 0;
+  line-height: 1.4;
+}
+
+.closeBtn {
+  background: transparent;
+  border: none;
+  font-size: 1.5rem;
+  cursor: pointer;
+  color: #94a3b8;
+  padding: 0.25rem;
+  line-height: 1;
+  display: flex;
+  align-items: center;
+  justify-content: center;
+  transition: color 0.2s ease, transform 0.2s ease, background-color 0.2s ease;
+  border-radius: 50%;
+  width: 32px;
+  height: 32px;
+}
+
+.closeBtn:hover {
+  color: #475569;
+  background-color: #f1f5f9;
+  transform: rotate(90deg);
+}
+
+.adBanner {
+  margin: 0.5rem 1.75rem 1rem 1.75rem;
+  background: linear-gradient(135deg, #1e293b, #0f172a);
+  border-radius: 12px;
+  padding: 1.25rem;
+  border: 1px solid #334155;
+  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
+  position: relative;
+  overflow: hidden;
+}
+
+.adBanner::before {
+  content: '';
+  position: absolute;
+  top: 0;
+  left: 0;
+  right: 0;
+  height: 4px;
+  background: linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899);
+}
+
+.adTag {
+  font-family: var(--font-heading);
+  font-size: 0.65rem;
+  font-weight: 800;
+  letter-spacing: 0.1em;
+  color: #3b82f6;
+  margin-bottom: 0.5rem;
+}
+
+.adText {
+  color: #f8fafc;
+  font-size: 0.95rem;
+  font-weight: 500;
+  line-height: 1.5;
+  margin: 0;
+  user-select: all;
+  /* Make it easy to select/copy */
+  font-style: italic;
+}
+
+.formContent {
+  padding: 0 1.75rem 1.75rem 1.75rem;
+}
+
+.form {
+  display: flex;
+  flex-direction: column;
+  gap: 1.25rem;
+}
+
+.inputGroup {
+  display: flex;
+  flex-direction: column;
+  gap: 0.5rem;
+}
+
+.label {
+  font-weight: 600;
+  font-size: 0.85rem;
+  color: #475569;
+}
+
+.textarea {
+  font-family: var(--font-body);
+  width: 100%;
+  padding: 0.75rem 1rem;
+  border-radius: 10px;
+  border: 1.5px solid #cbd5e1;
+  font-size: 0.9rem;
+  line-height: 1.5;
+  resize: none;
+  background-color: #f8fafc;
+  transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
+}
+
+.textarea:focus {
+  outline: none;
+  border-color: #3b82f6;
+  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
+  background-color: #ffffff;
+}
+
+.errorMessage {
+  display: flex;
+  align-items: center;
+  gap: 0.35rem;
+  color: #ef4444;
+  /* Penalty Red */
+  font-size: 0.8rem;
+  font-weight: 500;
+  margin-top: 0.25rem;
+  animation: shake 0.2s ease-in-out;
+}
+
+.errorIcon {
+  font-size: 0.95rem;
+}
+
+.generalError {
+  background: #fef2f2;
+  border: 1px solid #fca5a5;
+  color: #ef4444;
+  padding: 0.75rem 1rem;
+  border-radius: 8px;
+  font-size: 0.85rem;
+  font-weight: 500;
+}
+
+.actions {
+  display: flex;
+  justify-content: space-between;
+  align-items: center;
+  margin-top: 0.5rem;
+  position: relative;
+}
+
+.skipBtn {
+  font-family: var(--font-heading);
+  font-size: 0.85rem;
+  font-weight: 700;
+  padding: 0.6rem 1.25rem;
+  border-radius: 8px;
+  cursor: pointer;
+  background: #f1f5f9;
+  color: #64748b;
+  border: 1px solid #e2e8f0;
+  transform: translate3d(var(--skip-x, 0px), var(--skip-y, 0px), 0px);
+  transition: transform 0.12s cubic-bezier(0.25, 0.8, 0.25, 1), background-color 0.2s, color 0.2s;
+  z-index: 10;
+  outline: none;
+}
+
+.skipBtn:hover {
+  background: #e2e8f0;
+  color: #334155;
+}
+
+.skipBtn:focus-visible {
+  box-shadow: 0 0 0 2px #3b82f6;
+}
+
+.submitBtn {
+  font-family: var(--font-heading);
+  font-size: 0.9rem;
+  font-weight: 700;
+  padding: 0.65rem 1.5rem;
+  border-radius: 10px;
+  cursor: pointer;
+  background: #3b82f6;
+  color: #ffffff;
+  border: none;
+  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
+  transition: all 0.2s ease;
+  margin-left: auto;
+  /* Push to the right */
+}
+
+.submitBtn:hover:not(:disabled) {
+  background: #2563eb;
+  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.25);
+  transform: translateY(-1px);
+}
+
+.submitBtn:disabled {
+  background: #cbd5e1;
+  color: #94a3b8;
+  box-shadow: none;
+  cursor: not-allowed;
+}
+
+@keyframes fadeIn {
+  from {
+    opacity: 0;
+  }
+
+  to {
+    opacity: 1;
+  }
+}
+
+@keyframes scaleIn {
+  from {
+    opacity: 0;
+    transform: scale(0.96) translateY(8px);
+  }
+
+  to {
+    opacity: 1;
+    transform: scale(1) translateY(0);
+  }
+}
+
+@keyframes shake {
+
+  0%,
+  100% {
+    transform: translateX(0);
+  }
+
+  25% {
+    transform: translateX(-4px);
+  }
+
+  75% {
+    transform: translateX(4px);
+  }
+}
+
+@media (prefers-reduced-motion: reduce) {
+
+  .overlay,
+  .modal,
+  .closeBtn,
+  .submitBtn,
+  .skipBtn {
+    animation: none !important;
+    transition: none !important;
+  }
+
+  .skipBtn {
+    transform: none !important;
+  }
+}
\ No newline at end of file
diff --git a/apps/frontend/src/domains/anti-ux/components/AdCaptchaModal.tsx b/apps/frontend/src/domains/anti-ux/components/AdCaptchaModal.tsx
new file mode 100644
index 0000000..c3520d2
--- /dev/null
+++ b/apps/frontend/src/domains/anti-ux/components/AdCaptchaModal.tsx
@@ -0,0 +1,240 @@
+'use client';
+
+import React, { useState, useEffect, useRef } from 'react';
+import styles from './AdCaptchaModal.module.css';
+
+interface AdCaptchaModalProps {
+  isOpen: boolean;
+  onClose: () => void;
+  onSuccess: () => Promise<void> | void;
+  bypass?: boolean; // For future Story 2.4 Mercy Threshold hookability
+}
+
+const SPONSOR_ADS = [
+  'SynergyCoin: Monetizing paradigm shifts via proof-of-synergy blockchains. Pivot today!',
+  'Paradigmer.io: Leverage cloud-native, deep-learning, enterprise-grade synergy for 10x deliverables.',
+  'MoonScale.io: Disruption-as-a-Service targeting frictionless, hyper-growth vertical integrations.',
+  'Deliverablely: Deep dive into leveraging bandwidth to circle back on low-hanging fruits.',
+  'KPI-Accelerate: Streamlining microservices scaling ecosystems to maximize resource monetization.'
+];
+
+export default function AdCaptchaModal({
+  isOpen,
+  onClose,
+  onSuccess,
+  bypass = false
+}: AdCaptchaModalProps) {
+  const [adIndex, setAdIndex] = useState(() => Math.floor(Math.random() * SPONSOR_ADS.length));
+  const [userInput, setUserInput] = useState('');
+  const [isSubmitting, setIsSubmitting] = useState(false);
+  const [errorMessage, setErrorMessage] = useState<string | null>(null);
+
+  const skipBtnRef = useRef<HTMLButtonElement>(null);
+  const modalRef = useRef<HTMLDivElement>(null);
+
+  const currentAd = SPONSOR_ADS[adIndex];
+  const isMatch = userInput === currentAd;
+
+  // Track if prefers-reduced-motion is active
+  const [reducedMotion, setReducedMotion] = useState(false);
+
+  useEffect(() => {
+    if (typeof window !== 'undefined') {
+      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
+      setReducedMotion(mediaQuery.matches);
+
+      const listener = (e: MediaQueryListEvent) => {
+        setReducedMotion(e.matches);
+      };
+
+      mediaQuery.addEventListener('change', listener);
+      return () => mediaQuery.removeEventListener('change', listener);
+    }
+  }, []);
+
+  // When bypass is enabled, skip the captcha entirely and call onSuccess immediately
+  useEffect(() => {
+    if (isOpen && bypass) {
+      handleSuccessSubmit();
+    }
+  }, [isOpen, bypass]);
+
+  // Reset states when modal is opened/closed
+  useEffect(() => {
+    if (isOpen) {
+      setUserInput('');
+      setErrorMessage(null);
+      setIsSubmitting(false);
+      resetButtonPosition();
+      modalRef.current?.focus();
+    } else {
+      // Pick a random ad starting point for the next open
+      const randomIndex = Math.floor(Math.random() * SPONSOR_ADS.length);
+      setAdIndex(randomIndex);
+    }
+  }, [isOpen]);
+
+  const resetButtonPosition = () => {
+    const button = skipBtnRef.current;
+    if (button) {
+      button.style.setProperty('--skip-x', '0px');
+      button.style.setProperty('--skip-y', '0px');
+    }
+  };
+
+  const handleSuccessSubmit = async () => {
+    setIsSubmitting(true);
+    setErrorMessage(null);
+    try {
+      await onSuccess();
+      onClose();
+    } catch (err: any) {
+      setErrorMessage(err.message || 'Verification failed. Please try again.');
+    } finally {
+      setIsSubmitting(false);
+    }
+  };
+
+  const handleVerifySubmit = (e: React.FormEvent) => {
+    e.preventDefault();
+    if (!isMatch || isSubmitting) return;
+    handleSuccessSubmit();
+  };
+
+  const handleSkipAd = () => {
+    // Recursive ad loop: pick another random ad, different from the current one
+    let nextIndex = adIndex;
+    while (nextIndex === adIndex) {
+      nextIndex = Math.floor(Math.random() * SPONSOR_ADS.length);
+    }
+    setAdIndex(nextIndex);
+    setUserInput('');
+    setErrorMessage('Skip failed! To access your content, please verify a new sponsor.');
+    resetButtonPosition();
+  };
+
+  const handleButtonEvasion = () => {
+    if (reducedMotion) return;
+
+    // Relocate to a random coordinate within bounds
+    // We'll use values between -140px and 140px for X, and -80px and 80px for Y
+    const currentX = parseFloat(skipBtnRef.current?.style.getPropertyValue('--skip-x') || '0');
+    const currentY = parseFloat(skipBtnRef.current?.style.getPropertyValue('--skip-y') || '0');
+
+    let newX = (Math.random() - 0.5) * 280;
+    let newY = (Math.random() - 0.5) * 160;
+
+    // Ensure it actually moves a minimum distance to prevent user from getting lucky
+    if (Math.abs(newX - currentX) < 40) {
+      newX = newX > 0 ? newX + 50 : newX - 50;
+    }
+    if (Math.abs(newY - currentY) < 30) {
+      newY = newY > 0 ? newY + 40 : newY - 40;
+    }
+
+    const button = skipBtnRef.current;
+    if (button) {
+      button.style.setProperty('--skip-x', `${newX}px`);
+      button.style.setProperty('--skip-y', `${newY}px`);
+    }
+  };
+
+  if (!isOpen || bypass) return null;
+
+  return (
+    <div className={styles.overlay} onClick={onClose} id="ad-captcha-overlay">
+      <div
+        ref={modalRef}
+        className={styles.modal}
+        onClick={(e) => e.stopPropagation()}
+        role="dialog"
+        aria-modal="true"
+        aria-labelledby="ad-captcha-title"
+        tabIndex={-1}
+      >
+        <div className={styles.header}>
+          <div className={styles.titleContainer}>
+            <h2 id="ad-captcha-title" className={styles.title}>
+              Sponsor Message Verification
+            </h2>
+            <p className={styles.subtitle}>
+              Prove you value enterprise monetization before publishing. Copy the corporate truth exactly.
+            </p>
+          </div>
+          <button
+            className={styles.closeBtn}
+            onClick={onClose}
+            aria-label="Close sponsor verification"
+          >
+            &times;
+          </button>
+        </div>
+
+        <div className={styles.adBanner}>
+          <div className={styles.adTag}>SPONSORED AD</div>
+          <p className={styles.adText} id="sponsor-ad-text">{currentAd}</p>
+        </div>
+
+        <div className={styles.formContent}>
+          <form onSubmit={handleVerifySubmit} className={styles.form}>
+            <div className={styles.inputGroup}>
+              <label htmlFor="ad-verification-input" className={styles.label}>
+                Type the sponsored message exactly:
+              </label>
+              <textarea
+                id="ad-verification-input"
+                className={styles.textarea}
+                value={userInput}
+                onChange={(e) => setUserInput(e.target.value)}
+                placeholder="Type here..."
+                disabled={isSubmitting}
+                aria-invalid={!isMatch && userInput.length > 0}
+                aria-describedby={!isMatch && userInput.length > 0 ? 'ad-match-error' : undefined}
+                rows={3}
+              />
+
+              {!isMatch && userInput.trim().length > 0 && (
+                <div id="ad-match-error" className={styles.errorMessage} role="alert">
+                  <span className={styles.errorIcon} aria-hidden="true">⚠️</span>
+                  Input does not match the sponsored text. Case-sensitive.
+                </div>
+              )}
+
+              {errorMessage && (
+                <div className={styles.generalError} role="alert">
+                  {errorMessage}
+                </div>
+              )}
+            </div>
+
+            <div className={styles.actions}>
+              <button
+                ref={skipBtnRef}
+                type="button"
+                className={styles.skipBtn}
+                onClick={handleSkipAd}
+                onMouseEnter={handleButtonEvasion}
+                onMouseMove={handleButtonEvasion}
+                style={{
+                  '--skip-x': '0px',
+                  '--skip-y': '0px'
+                } as React.CSSProperties}
+                aria-label="Skip Ad"
+              >
+                Skip Ad
+              </button>
+
+              <button
+                type="submit"
+                className={styles.submitBtn}
+                disabled={!isMatch || isSubmitting}
+              >
+                {isSubmitting ? 'Verifying...' : 'Verify & Submit'}
+              </button>
+            </div>
+          </form>
+        </div>
+      </div>
+    </div>
+  );
+}
diff --git a/apps/frontend/src/domains/leaderboard/components/CommentSection.tsx b/apps/frontend/src/domains/leaderboard/components/CommentSection.tsx
index 46cea38..a0ce78e 100644
--- a/apps/frontend/src/domains/leaderboard/components/CommentSection.tsx
+++ b/apps/frontend/src/domains/leaderboard/components/CommentSection.tsx
@@ -6,6 +6,7 @@ import HostileInput from './HostileInput';
 import { LeaderboardPost } from '../../../app/actions/leaderboard';
 import { UserProfile } from '../../../app/actions/auth';
 import { actionCreateComment } from '../../../app/actions/posts';
+import AdCaptchaModal from '../../anti-ux/components/AdCaptchaModal';
 import styles from './CommentSection.module.css';
 
 const AVATAR_MAP: Record<string, string> = {
@@ -27,13 +28,18 @@ export default function CommentSection({ post, currentUser }: CommentSectionProp
   const [hasError, setHasError] = useState(false);
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [submitError, setSubmitError] = useState<string | null>(null);
+  const [isCaptchaOpen, setIsCaptchaOpen] = useState(false);
 
   const comments = post.comments || [];
 
-  const handleSubmit = async (e: React.FormEvent) => {
+  const handleSubmit = (e: React.FormEvent) => {
     e.preventDefault();
     if (hasError || !commentText.trim()) return;
 
+    setIsCaptchaOpen(true);
+  };
+
+  const handleCaptchaSuccess = async () => {
     setIsSubmitting(true);
     setSubmitError(null);
 
@@ -45,7 +51,9 @@ export default function CommentSection({ post, currentUser }: CommentSectionProp
       setCommentText('');
       setHasError(false);
     } else {
-      setSubmitError(res.error?.message || 'Failed to submit solution.');
+      const errMsg = res.error?.message || 'Failed to submit solution.';
+      setSubmitError(errMsg);
+      throw new Error(errMsg);
     }
   };
 
@@ -77,33 +85,40 @@ export default function CommentSection({ post, currentUser }: CommentSectionProp
       </div>
 
       {currentUser ? (
-        <form onSubmit={handleSubmit} className={styles.newCommentForm}>
-          <h4 className={styles.formTitle}>Propose an Overengineered Solution</h4>
-          <HostileInput
-            type="textarea"
-            id={`comment-input-${post.id}`}
-            value={commentText}
-            onChange={setCommentText}
-            placeholder="Type your convoluted solution here... It must be strictly longer than the original post."
-            validationType="comment"
-            originalPostLength={post.content.length}
-            onErrorChange={setHasError}
-            label="Solution Comment Content"
-            hideLabelVisually={true}
+        <>
+          <form onSubmit={handleSubmit} className={styles.newCommentForm}>
+            <h4 className={styles.formTitle}>Propose an Overengineered Solution</h4>
+            <HostileInput
+              type="textarea"
+              id={`comment-input-${post.id}`}
+              value={commentText}
+              onChange={setCommentText}
+              placeholder="Type your convoluted solution here... It must be strictly longer than the original post."
+              validationType="comment"
+              originalPostLength={post.content.length}
+              onErrorChange={setHasError}
+              label="Solution Comment Content"
+              hideLabelVisually={true}
+            />
+            {submitError && (
+              <div className={styles.submitError} role="alert">
+                ⚠️ {submitError}
+              </div>
+            )}
+            <button
+              type="submit"
+              className={styles.submitBtn}
+              disabled={isButtonDisabled}
+            >
+              {isSubmitting ? 'Submitting Solution...' : 'Submit Solution'}
+            </button>
+          </form>
+          <AdCaptchaModal
+            isOpen={isCaptchaOpen}
+            onClose={() => setIsCaptchaOpen(false)}
+            onSuccess={handleCaptchaSuccess}
           />
-          {submitError && (
-            <div className={styles.submitError} role="alert">
-              ⚠️ {submitError}
-            </div>
-          )}
-          <button
-            type="submit"
-            className={styles.submitBtn}
-            disabled={isButtonDisabled}
-          >
-            {isSubmitting ? 'Submitting Solution...' : 'Submit Solution'}
-          </button>
-        </form>
+        </>
       ) : (
         <div className={styles.authPrompt}>
           Want to propose a solution?{' '}
diff --git a/apps/frontend/src/domains/leaderboard/components/CreatePostModal.tsx b/apps/frontend/src/domains/leaderboard/components/CreatePostModal.tsx
index a93fddf..2813d29 100644
--- a/apps/frontend/src/domains/leaderboard/components/CreatePostModal.tsx
+++ b/apps/frontend/src/domains/leaderboard/components/CreatePostModal.tsx
@@ -2,6 +2,7 @@
 
 import React, { useState, useEffect, useRef } from 'react';
 import HostileInput from './HostileInput';
+import AdCaptchaModal from '../../anti-ux/components/AdCaptchaModal';
 import { actionCreatePost } from '../../../app/actions/posts';
 import styles from './CreatePostModal.module.css';
 
@@ -18,6 +19,7 @@ export default function CreatePostModal({ isOpen, onClose }: CreatePostModalProp
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [submitError, setSubmitError] = useState<string | null>(null);
   const [submitSuccess, setSubmitSuccess] = useState(false);
+  const [isCaptchaOpen, setIsCaptchaOpen] = useState(false);
 
   const modalRef = useRef<HTMLDivElement>(null);
 
@@ -40,6 +42,7 @@ export default function CreatePostModal({ isOpen, onClose }: CreatePostModalProp
       setContentError(false);
       setSubmitError(null);
       setSubmitSuccess(false);
+      setIsCaptchaOpen(false);
     } else {
       // Focus modal when it opens for accessibility
       modalRef.current?.focus();
@@ -48,10 +51,15 @@ export default function CreatePostModal({ isOpen, onClose }: CreatePostModalProp
 
   if (!isOpen) return null;
 
-  const handleSubmit = async (e: React.FormEvent) => {
+  const handleSubmit = (e: React.FormEvent) => {
     e.preventDefault();
     if (titleError || contentError || !title.trim() || !content.trim()) return;
 
+    // Show the captcha modal instead of submitting directly
+    setIsCaptchaOpen(true);
+  };
+
+  const handleCaptchaSuccess = async () => {
     setIsSubmitting(true);
     setSubmitError(null);
     setSubmitSuccess(false);
@@ -66,7 +74,9 @@ export default function CreatePostModal({ isOpen, onClose }: CreatePostModalProp
         onClose();
       }, 1500);
     } else {
-      setSubmitError(res.error?.message || 'Failed to propose paradigm.');
+      const errMsg = res.error?.message || 'Failed to propose paradigm.';
+      setSubmitError(errMsg);
+      throw new Error(errMsg);
     }
   };
 
@@ -155,6 +165,11 @@ export default function CreatePostModal({ isOpen, onClose }: CreatePostModalProp
           </form>
         </div>
       </div>
+      <AdCaptchaModal
+        isOpen={isCaptchaOpen}
+        onClose={() => setIsCaptchaOpen(false)}
+        onSuccess={handleCaptchaSuccess}
+      />
     </div>
   );
 }
diff --git a/tests/e2e/ad-captcha.spec.ts b/tests/e2e/ad-captcha.spec.ts
new file mode 100644
index 0000000..131d4b3
--- /dev/null
+++ b/tests/e2e/ad-captcha.spec.ts
@@ -0,0 +1,169 @@
+import { test, expect } from '@playwright/test';
+
+test.describe('Ad Captcha Challenge E2E', () => {
+  test.beforeEach(async ({ page }) => {
+    await page.context().clearCookies();
+  });
+
+  test('should display captcha on post creation, block submissions, and require exact case-sensitive matching', async ({ page }) => {
+    // 1. Visit homepage and login
+    await page.goto('/auth');
+    await page.click('button:has-text("Register now")');
+    const uniqueUsername = `captcha_user_${Date.now()}`;
+    await page.fill('#username', uniqueUsername);
+    await page.fill('#password', 'securePassword123');
+    await page.click('button[type="submit"]');
+    await expect(page).toHaveURL(/\/profile/);
+
+    await page.goto('/');
+
+    // 2. Open Create Post modal
+    await page.click('button:has-text("Propose a Paradigm")');
+    await expect(page.locator('h2:has-text("Propose a Paradigm")')).toBeVisible();
+
+    const titleInput = page.locator('#post-title-input');
+    const contentInput = page.locator('#post-content-input');
+    await titleInput.fill(`Leverage synergy paradigm ${Date.now()}`);
+    await contentInput.fill('This is a long content to pass validation rules. It has synergy, leverage, paradigm, scale and KPI to reach fifty characters.');
+
+    // 3. Click Propose Paradigm -> triggers Captcha overlay
+    await page.click('button:has-text("Propose Paradigm")');
+    const captchaModal = page.locator('#ad-captcha-overlay');
+    await expect(captchaModal).toBeVisible();
+
+    // 4. Test exact case-sensitive matching
+    const adText = await page.locator('#sponsor-ad-text').textContent();
+    expect(adText).not.toBeNull();
+
+    const inputArea = page.locator('#ad-verification-input');
+    const submitBtn = page.locator('button:has-text("Verify & Submit")');
+
+    // Case mismatch test
+    await inputArea.fill(adText!.toLowerCase());
+    await expect(submitBtn).toBeDisabled();
+    await expect(page.locator('text=Input does not match the sponsored text. Case-sensitive.')).toBeVisible();
+
+    // Correct exact match test
+    await inputArea.fill(adText!);
+    await expect(submitBtn).not.toBeDisabled();
+    await expect(page.locator('text=Input does not match the sponsored text. Case-sensitive.')).not.toBeVisible();
+
+    // Verify submit closes captcha and creates post
+    await submitBtn.click();
+    await expect(captchaModal).not.toBeVisible();
+    await expect(page.locator('text=Paradigm successfully proposed!')).toBeVisible();
+  });
+
+  test('should evade mouse hover unless prefers-reduced-motion is active', async ({ page }) => {
+    // 1. Visit homepage and login
+    await page.goto('/auth');
+    await page.click('button:has-text("Register now")');
+    const uniqueUsername = `evasion_user_${Date.now()}`;
+    await page.fill('#username', uniqueUsername);
+    await page.fill('#password', 'securePassword123');
+    await page.click('button[type="submit"]');
+    await expect(page).toHaveURL(/\/profile/);
+    await page.goto('/');
+
+    // 2. Open Create Post modal
+    await page.click('button:has-text("Propose a Paradigm")');
+    const titleInput = page.locator('#post-title-input');
+    const contentInput = page.locator('#post-content-input');
+    await titleInput.fill(`Leverage synergy paradigm ${Date.now()}`);
+    await contentInput.fill('This is a long content to pass validation rules. It has synergy, leverage, paradigm, scale and KPI to reach fifty characters.');
+    await page.click('button:has-text("Propose Paradigm")');
+
+    // 3. Verify Captcha Modal is open
+    const skipBtn = page.locator('button:has-text("Skip Ad")');
+    await expect(skipBtn).toBeVisible();
+
+    // Get initial position style variables (should be 0px)
+    let transformX = await skipBtn.evaluate(el => el.style.getPropertyValue('--skip-x'));
+    let transformY = await skipBtn.evaluate(el => el.style.getPropertyValue('--skip-y'));
+    expect(transformX).toBe('0px');
+    expect(transformY).toBe('0px');
+
+    // Hover mouse on the button
+    await skipBtn.hover();
+
+    // Verify it moved (styles updated to something other than 0px)
+    transformX = await skipBtn.evaluate(el => el.style.getPropertyValue('--skip-x'));
+    transformY = await skipBtn.evaluate(el => el.style.getPropertyValue('--skip-y'));
+    expect(transformX).not.toBe('0px');
+    expect(transformY).not.toBe('0px');
+    expect(transformX).not.toBe('');
+    expect(transformY).not.toBe('');
+  });
+
+  test('should cycle to another ad when Skip Ad is clicked', async ({ page }) => {
+    // 1. Visit homepage and login
+    await page.goto('/auth');
+    await page.click('button:has-text("Register now")');
+    const uniqueUsername = `cycle_user_${Date.now()}`;
+    await page.fill('#username', uniqueUsername);
+    await page.fill('#password', 'securePassword123');
+    await page.click('button[type="submit"]');
+    await expect(page).toHaveURL(/\/profile/);
+    await page.goto('/');
+
+    // 2. Open Create Post modal
+    await page.click('button:has-text("Propose a Paradigm")');
+    const titleInput = page.locator('#post-title-input');
+    const contentInput = page.locator('#post-content-input');
+    await titleInput.fill(`Leverage synergy paradigm ${Date.now()}`);
+    await contentInput.fill('This is a long content to pass validation rules. It has synergy, leverage, paradigm, scale and KPI to reach fifty characters.');
+    await page.click('button:has-text("Propose Paradigm")');
+
+    const adTextElement = page.locator('#sponsor-ad-text');
+    const initialAd = await adTextElement.textContent();
+
+    const skipBtn = page.locator('button:has-text("Skip Ad")');
+    await expect(skipBtn).toBeVisible();
+
+    // To click the button in tests despite mouse evasion, we can programmatically dispatch a click
+    await skipBtn.click({ force: true });
+
+    // Verify ad has changed, input is empty, and general error message is shown
+    const newAd = await adTextElement.textContent();
+    expect(newAd).not.toBe(initialAd);
+
+    const inputArea = page.locator('#ad-verification-input');
+    await expect(inputArea).toHaveValue('');
+    await expect(page.locator('text=Skip failed! To access your content, please verify a new sponsor.')).toBeVisible();
+  });
+
+  test('should NOT evade mouse hover when prefers-reduced-motion is active', async ({ page }) => {
+    // Emulate reduced motion
+    await page.emulateMedia({ reducedMotion: 'reduce' });
+
+    // 1. Visit homepage and login
+    await page.goto('/auth');
+    await page.click('button:has-text("Register now")');
+    const uniqueUsername = `reduced_user_${Date.now()}`;
+    await page.fill('#username', uniqueUsername);
+    await page.fill('#password', 'securePassword123');
+    await page.click('button[type="submit"]');
+    await expect(page).toHaveURL(/\/profile/);
+    await page.goto('/');
+
+    // 2. Open Create Post modal
+    await page.click('button:has-text("Propose a Paradigm")');
+    const titleInput = page.locator('#post-title-input');
+    const contentInput = page.locator('#post-content-input');
+    await titleInput.fill(`Leverage synergy paradigm ${Date.now()}`);
+    await contentInput.fill('This is a long content to pass validation rules. It has synergy, leverage, paradigm, scale and KPI to reach fifty characters.');
+    await page.click('button:has-text("Propose Paradigm")');
+
+    const skipBtn = page.locator('button:has-text("Skip Ad")');
+    await expect(skipBtn).toBeVisible();
+
+    // Hover mouse on the button
+    await skipBtn.hover();
+
+    // Verify it DID NOT move (styles remain 0px)
+    const transformX = await skipBtn.evaluate(el => el.style.getPropertyValue('--skip-x'));
+    const transformY = await skipBtn.evaluate(el => el.style.getPropertyValue('--skip-y'));
+    expect(transformX).toBe('0px');
+    expect(transformY).toBe('0px');
+  });
+});
diff --git a/tests/e2e/posts.spec.ts b/tests/e2e/posts.spec.ts
index 2e5e90f..63443a0 100644
--- a/tests/e2e/posts.spec.ts
+++ b/tests/e2e/posts.spec.ts
@@ -56,6 +56,14 @@ test.describe('Posts & Comments E2E Flow', () => {
 
     // 6. Submit Post
     await page.click('button:has-text("Propose Paradigm")');
+
+    // Solve Ad Captcha
+    await expect(page.locator('h2:has-text("Sponsor Message Verification")')).toBeVisible();
+    const postAdText = await page.locator('#sponsor-ad-text').textContent();
+    expect(postAdText).not.toBeNull();
+    await page.fill('#ad-verification-input', postAdText!);
+    await page.click('button:has-text("Verify & Submit")');
+
     await expect(page.locator('text=Paradigm successfully proposed!')).toBeVisible();
 
     // Wait for the modal to close and unmount
@@ -84,6 +92,13 @@ test.describe('Posts & Comments E2E Flow', () => {
     // 10. Submit Comment
     await page.click('button:has-text("Submit Solution")');
 
+    // Solve Ad Captcha for Comment
+    await expect(page.locator('h2:has-text("Sponsor Message Verification")')).toBeVisible();
+    const commentAdText = await page.locator('#sponsor-ad-text').textContent();
+    expect(commentAdText).not.toBeNull();
+    await page.fill('#ad-verification-input', commentAdText!);
+    await page.click('button:has-text("Verify & Submit")');
+
     // 11. Verify comment is displayed inline
     await expect(page.locator(`p:has-text("${validComment}")`)).toBeVisible();
   });

```
