# Avtive Profiles — Phase 2: Profile Editor Redesign & Minimalist Black-and-White System Theme

## Overview

Phase 2 upgrades the editing experience on `/profile/[identifier]` to follow the P3 same-page mobile-first editor workflow, converts remaining side-opening panels to bottom-up drawers, enforces public/private profile visibility server-side, and establishes minimalist black and white as the default system aesthetic.

## Key Changes Implemented

### 1. P3 Same-Page Profile Editor (`ProfileEditorSheet`)
- **Bottom-Up Sheet Presentation (`src/components/editor/ProfileEditorSheet.tsx`)**: Slides up cleanly from the bottom (`y: '100%' -> 0 -> '100%'`) on the existing profile URL (`/profile/[identifier]`), keeping live preview state synchronized in real time via `ProfileEditorContext`.
- **Sticky Editing Bar**: Fixed header displaying **Cancel** (prompts inline discard confirmation when unsaved edits exist and calls `discardUnsavedChanges()` so previously saved changes remain untouched), **EDITING** status with live save progress, and **Done** (flushes pending changes via `flushAutosave()` and returns to the profile preview on the same URL).
- **Three-Category Background Customization (`src/components/editor/BackgroundSelectorCard.tsx`, `src/components/editor/BackgroundRenderer.tsx`)**:
  - **Image**: Curated monochrome images, direct HTTPS URL input, and Cloudinary upload (`backgrounds` bucket).
  - **Animated Video**: Ambient animated CSS/HTML canvas loops (`Obsidian Waves`, `Silver Mist`, `Minimal Matrix`, `Studio Spotlight`), direct MP4/WebM URL support, and video file upload up to 25MB.
  - **Occasion**: Reuses `BackgroundThemeGallery` and existing occasion presets including **Birthday**, seasonal, and celebration themes.
  - Custom `image`, `video`, and `occasion` backgrounds render behind both the profile workspace (`PublicProfileClient.tsx`) and permission-scoped shared passes (`SharedProfileClient.tsx`).
- **Profile Identity & Media (`src/components/editor/IdentityEditorCard.tsx`)**: Compact card for avatar upload/removal, Name, Headline, Company, and Location, plus progressive disclosure for cover banner, handle/slug, tagline, optional visual card theme, and `ProfileIntroductionMediaSection`.
- **Public / Private Visibility Control (`src/components/editor/ProfileVisibilityCard.tsx`, `src/lib/db/profiles.ts`, `src/components/card/AvtiveDigitalCard.tsx`)**:
  - Toggle between `Public` and `Private` (`"Private shows your name only"`).
  - Enforced server-side in `sanitizeProfileForPublic()`: when `profileVisibility === 'private'` and the viewer is not the owner, headline, bio, contact channels, avatar, sections, resume, intro media, and custom backgrounds are stripped, leaving only display name and essential routing metadata.
  - Non-owner rendering in `AvtiveDigitalCard` renders a minimal name-only private card view.
- **Consistent Expandable Section Cards (`src/components/editor/EditableSectionCard.tsx`, `src/components/editor/ResumeSectionCard.tsx`)**:
  - Standardized card chrome across all profile sections (`About`, `Contact`, `Social Links`, `Skills`, `Services`, `Projects`, `Experience`, `Education`, `Certifications`, `Recommendations`, `Languages`, `Custom Fields`, `CV / Resume`, extended LinkedIn-parity sections, and custom `dynamicSections`).
  - Header controls: drag reorder (`useLongPressDrag` + `Reorder.Item`), Move Up / Move Down, Show / Hide visibility toggle, inline-confirmed section clear/remove, and expand/collapse.
  - Body lists item summary rows with `Edit`, `Show/Hide`, and `Remove` actions, reuses the existing section form components inline, includes a bottom `+ Add to <Section>` action, and provides real PDF upload/management (`application/pdf`, `%PDF` signature validation, 10MB limit) in `/api/upload` (`documents` bucket).

### 2. Bottom-Up Panel Animations
- Replaced horizontal slide-in/slide-out animations across `PublicProfileClient.tsx` (`desktop-sidebar-drawer`, `mobile-viewport-sidebar-drawer`, `mobile-drawer-panel`, `mobile-chassis-sidebar-drawer`), `UnifiedShareDrawer.tsx`, and `ProfileEditorSheet.tsx` with bottom-up `y: '100%'` Framer Motion transitions.

### 3. Minimalist Black & White Default System Theme
- Updated `src/app/globals.css`, `src/components/ui/themeStyles.ts` (`editorial` / `default`), `HeaderNav.tsx`, `DualScreenWorkspace.tsx`, `ProfileDashboard.tsx`, `DesktopProfileSidebar.tsx`, profile section components, authentication pages (`LoginClient.tsx`, `RegisterClient.tsx`, `ForgotPasswordClient.tsx`, `ResetPasswordClient.tsx`), onboarding/creation flows (`CreateProfileClient.tsx`, `onboarding/*`), and sharing UIs to neutral monochrome surfaces (`#FFFFFF`, `#000000`, `#111111`, and zinc borders/text) while preserving user-selected background themes and optional profile themes.

### 4. Persistence & Upload Architecture Updates
- `src/types/profile.ts`: Added `profileVisibility`, `backgroundType`, `customBackgroundImage`, `customBackgroundVideo`.
- `src/lib/profileDiff.ts`: Registered Phase 2 primitive fields in `FIELD_CLASSIFICATIONS`.
- `src/context/ProfileEditorContext.tsx`: Added live state atoms, baseline sync, `discardUnsavedChanges()`, and default context parity.
- `src/app/api/upload/route.ts` & `src/lib/storage/cloudinary.ts`: Added `%PDF` header signature validation, `documents` bucket support, and Cloudinary `raw` resource handling for PDF resumes.
- `src/app/api/profile/update/route.ts` & `src/lib/db/profiles.ts`: Added sanitization, Cloudinary asset promotion, safe URL guards, and persistence for all Phase 2 fields.

## Automated Tests & Verification
- Added `tests/phase2-editor-redesign.test.tsx` and registered it in `tests/run-all-tests.ts`.
- Covers minimalist editorial theme config, private visibility sanitization (`sanitizeProfileForPublic`), persistence (`PUT/POST /api/profile/update`), PDF `%PDF` upload validation (`POST /api/upload`), P3 editor UI controls (`BackgroundSelectorCard`, `IdentityEditorCard`, `ProfileVisibilityCard`, `EditableSectionCard`, `Cancel` unsaved discard confirmation, `Done` flush/save), and private visitor rendering in `AvtiveDigitalCard`.
