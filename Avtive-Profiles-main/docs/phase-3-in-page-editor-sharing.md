# Avtive Profiles — Phase 3: True In-Page Profile Editor & Unified Sharing Architecture

## Overview

Phase 3 replaces the overlay-based profile editing sheet (`ProfileEditorSheet`) and overlay sharing drawer/modal (`UnifiedShareDrawer`, `SafetyCheckDialog`, `ShareModal`) with true, mutually exclusive in-page screens directly inside `/profile/[identifier]`.

Rather than opening popups, dark backdrops, bottom sheets, or right-side drawers on top of the profile view, navigating to **Edit** or **Share** swaps the primary workspace content inline on the same route and synchronizes browser URL query parameters (`?edit=true` / `?share=true`) and Back/Forward history (`popstate`).

---

## Key Architectural Changes

### 1. Mutually Exclusive Screen State (`preview` | `edit` | `share`)
- Added `src/lib/profileScreenMode.ts`:
  - Defines `ProfileScreenMode = 'preview' | 'edit' | 'share'`.
  - `resolveScreenModeFromSearch(search, isOwner)` resolves URL query state deterministically, enforces owner-only access to `edit` (non-owners with `?edit=true` fall back to `'preview'`), and resolves conflicting parameters (`?edit=true&share=true`) to a single mode (`'edit'` for owners, `'share'` for visitors) with `needsUrlNormalization: true`.
  - `buildProfileUrlForMode(slugOrId, mode)` builds canonical `/profile/[identifier]`, `/profile/[identifier]?edit=true`, and `/profile/[identifier]?share=true` URLs.
- Updated `src/app/profile/[identifier]/PublicProfileClient.tsx`:
  - Single `screenMode` state (`'preview' | 'edit' | 'share'`) drives Screen 1 rendering (`ProfileEditorView` for `'edit'`, `UnifiedShareWorkspace` or `VisitorPublicShareView` for `'share'`, and `ProfileSectionTabBar` + `AvtiveDigitalCard` for `'preview'`).
  - `navigateScreenMode()` updates state and pushes/replaces browser history entries without page reloads and binds a `popstate` listener for browser Back/Forward synchronization.
  - Passes `hideMobilePreview={screenMode !== 'preview'}` to `DualScreenWorkspace` so the twin mobile preview chassis hides cleanly during `'edit'` and `'share'`.
  - Renders `<ProfileBackgroundLayer>` only during `'preview'` so editor and sharing workspaces display crisp neutral black-and-white surfaces.
- Updated `src/components/layout/DualScreenWorkspace.tsx` & `src/components/layout/HeaderNav.tsx`:
  - `DualScreenWorkspace` accepts `hideMobilePreview?: boolean`, letting Screen 1 span cleanly (`max-w-[1100px]`) during in-page Edit and Share modes.
  - `HeaderNav` accepts `isSharing` and `showEditActionsInHeader` so preview action buttons (`Edit Profile`, `Share Profile`, and `Individual/Team` view switchers) are hidden during in-page Edit and Share views without duplicating sticky header controls.

### 2. Full In-Page Profile Editor (`ProfileEditorView`)
- Replaced `src/components/editor/ProfileEditorSheet.tsx` with `src/components/editor/ProfileEditorView.tsx` (`data-testid="profile-editor-view"`):
  - Renders inline in natural page flow with zero `fixed inset-0` overlay wrappers, backdrops, `role="dialog"`, or slide-up bottom sheets.
  - Keeps the sticky top bar (**Cancel**, **EDITING** + live autosave status, **Done**), where **Cancel** prompts an inline confirmation banner when `hasUnsavedWork` (`isDirty`, `saving`, or `error`) is true and invokes `discardUnsavedChanges()`, while **Done** flushes pending edits via `flushAutosave()` and returns to `'preview'`.
  - Reuses P3 editor modules (`BackgroundSelectorCard`, `IdentityEditorCard`, `ProfileVisibilityCard`, `EditableSectionCard`, `Reorder.Group` reordering, and custom dynamic sections) with monochrome black-and-white styling.
- Updated `src/context/ProfileEditorContext.tsx`:
  - Added `discardUnsavedChanges` to `DEFAULT_PROFILE_EDITOR_CONTEXT`.
  - Added `statusResetTimerRef` and `isUnmountedRef` lifecycle guards so post-save reset timers cannot fire after provider unmount.
  - Separated internal `dirtyBaseline` state from public `savedBaseline` so initial hydration normalization leaves `isDirty === false` on fresh open while preserving `savedBaseline === initialProfile` semantics.
- Updated `src/components/profiles/ProfileSectionTabBar.tsx`:
  - Guarded `container.scrollTo` with a runtime function check for test and non-browser DOM environments.

### 3. Full In-Page Sharing & Visitor Share Views
- Replaced `src/components/sharing/UnifiedShareDrawer.tsx` with `src/components/sharing/UnifiedShareWorkspace.tsx` (`data-testid="unified-share-workspace"`):
  - Full-page centered workspace (`Back` button, title, `History` button, optional profile switcher, and `Share` / `Shared Links` / `Templates` tabs).
  - Embeds subviews (`RecipientPickerModal`, `LinkQrReadyPanel`, `InPersonShareView`) inline within the workspace rather than rendering right-side drawers or bottom sheets.
- Replaced `src/components/sharing/SafetyCheckDialog.tsx` with `src/components/sharing/SafetyCheckPanel.tsx` (`#safety-check-inline-panel`):
  - Displays `private` and `never_share` warnings inline with `scrollIntoView` focus and without `role="dialog"` / `aria-modal="true"` popups.
- Replaced `src/components/share/ShareModal.tsx` with `src/components/sharing/VisitorPublicShareView.tsx` (`data-testid="visitor-share-view"`):
  - Non-owner visitors selecting Share open a clean, read-only in-page link/QR/vCard/copy workspace rather than a modal popup.
- Updated `src/components/sharing/InPersonShareView.tsx`, `LinkQrReadyPanel.tsx`, `RecipientPickerModal.tsx`, `SharedLinksTab.tsx`, and `ShareTemplatesTab.tsx` to scroll naturally inside the parent page and align with monochrome border styling.

---

## Files Summary

- **Created**:
  - `src/lib/profileScreenMode.ts`
  - `src/components/editor/ProfileEditorView.tsx`
  - `src/components/sharing/UnifiedShareWorkspace.tsx`
  - `src/components/sharing/SafetyCheckPanel.tsx`
  - `src/components/sharing/VisitorPublicShareView.tsx`
  - `docs/phase-3-in-page-editor-sharing.md`
- **Modified**:
  - `src/app/profile/[identifier]/PublicProfileClient.tsx`
  - `src/components/layout/DualScreenWorkspace.tsx`
  - `src/components/layout/HeaderNav.tsx`
  - `src/components/profiles/ProfileSectionTabBar.tsx`
  - `src/components/sharing/InPersonShareView.tsx`
  - `src/components/sharing/LinkQrReadyPanel.tsx`
  - `src/components/sharing/RecipientPickerModal.tsx`
  - `src/components/sharing/SharedLinksTab.tsx`
  - `src/components/sharing/ShareTemplatesTab.tsx`
  - `src/context/ProfileEditorContext.tsx`
  - `tests/phase1-sharing-system.test.ts`
  - `tests/phase2-editor-redesign.test.tsx`
- **Deleted**:
  - `src/components/editor/ProfileEditorSheet.tsx`
  - `src/components/sharing/UnifiedShareDrawer.tsx`
  - `src/components/sharing/SafetyCheckDialog.tsx`
  - `src/components/share/ShareModal.tsx`

---

## Verification Results

### Automated Checks (Executed in `Avtive-Profiles-main/` after final code edits)
- **`npx tsc --noEmit`**: Passed (0 TypeScript errors).
- **`npm run lint` (`eslint`)**: Passed (exit code 0, 0 errors; pre-existing warnings exist across repo files).
- **`npm test` (`tsx tests/run-all-tests.ts`)**: Passed (**12/12 suites passed**, 0 failures), including:
  - `tests/phase1-sharing-system.test.ts` (**17 passed, 0 failed** — updated Group 5 for inline `UnifiedShareWorkspace` and inline `SafetyCheckPanel` without `role="dialog"` or `fixed inset-0`).
  - `tests/phase2-editor-redesign.test.tsx` (**6 passed, 0 failed** — updated to test `ProfileEditorView`, `resolveScreenModeFromSearch`, `buildProfileUrlForMode`, `VisitorPublicShareView`, and `PublicProfileClient` screen switching & `popstate` synchronization).
  - `tests/e2e-persistence.test.tsx` and remaining persistence/regression suites all passed.
- **`npx next build --webpack`**: Passed (compiled in 17.4s, TypeScript finished in 5.8s, 27 static pages plus dynamic/API routes built cleanly).
- **`npm run build` (`next build` Turbopack default)**: Failed in this Windows environment with `TurbopackInternalError: failed to create junction point at "...\\.next\\node_modules\\mongodb-..." ... Access is denied. (os error 5)`.

### Live Browser Verification Status
- Desktop (`1440x900`) and mobile (`375x812`) live Chrome DevTools checks on `http://localhost:3000` were **not completed** in this environment because Chrome remote debugging was unavailable (`ENOENT: no such file or directory, open 'C:\Users\Win 10\AppData\Local\Google\Chrome\User Data\DevToolsActivePort'`).
