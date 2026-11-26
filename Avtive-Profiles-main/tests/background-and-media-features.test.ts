/**
 * Unit & Integration Test Suite for:
 * 1. Background Theme Collection (presets, retrieval, diffing, dirty checking)
 * 2. Profile Introduction Media (external URL parser, safe embed generation, audio/video types, diffing, dirty checking)
 * 3. Sanitization & Public Visibility handling for Introduction Media
 * 4. Backward Compatibility with existing profiles
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  BACKGROUND_THEMES,
  BACKGROUND_THEME_CATEGORIES,
  getBackgroundTheme
} from '../src/data/backgroundThemes';
import { ProfileBackgroundLayer, resolveBackgroundAppearance } from '../src/components/editor/BackgroundRenderer';
import { getSurfaceThemeConfig } from '../src/components/ui/themeStyles';
import { parseExternalVideoUrl } from '../src/components/profile-sections/ProfileIntroductionMedia';
import { diffProfile, isProfileDirty } from '../src/lib/profileDiff';
import { sanitizeProfileForPublic, mapDocToProfileData } from '../src/lib/db/profiles';
import { ProfileData, ProfileIntroductionMedia } from '../src/types/profile';

describe('Background Theme Collection', () => {
  it('should have predefined categories and presets covering all required styles', () => {
    assert.ok(BACKGROUND_THEMES.length >= 25, 'Expected at least 25 background presets');

    const categories = new Set(BACKGROUND_THEMES.map(t => t.category));
    assert.ok(categories.has('occasions'), 'Expected occasions category');
    assert.ok(categories.has('festivals'), 'Expected festivals category');
    assert.ok(categories.has('celebrations'), 'Expected celebrations category');
    assert.ok(categories.has('everyday'), 'Expected everyday category');

    for (const theme of BACKGROUND_THEMES) {
      assert.ok(theme.id, 'Theme must have an id');
      assert.ok(theme.name, 'Theme must have a name');
      assert.ok(theme.backgroundStyle, 'Theme must have CSS properties');
      assert.ok(typeof theme.isDark === 'boolean', 'Theme must specify isDark');
    }
  });

  it('getBackgroundTheme should retrieve preset by id and return null for invalid id', () => {
    const aurora = getBackgroundTheme('aurora-borealis');
    assert.ok(aurora);
    assert.strictEqual(aurora?.name, 'Aurora Borealis');
    assert.strictEqual(aurora?.category, 'everyday');

    const christmas = getBackgroundTheme('christmas-wonderland');
    assert.ok(christmas);
    assert.strictEqual(christmas?.name, 'Christmas');
    assert.strictEqual(christmas?.category, 'festivals');

    const eid = getBackgroundTheme('eid-mubarak');
    assert.ok(eid);
    assert.strictEqual(eid?.name, 'Eid Mubarak');
    assert.strictEqual(eid?.category, 'festivals');

    const halloween = getBackgroundTheme('halloween-night');
    assert.ok(halloween);
    assert.strictEqual(halloween?.name, 'Halloween');
    assert.strictEqual(halloween?.category, 'occasions');

    const obsidian = getBackgroundTheme('obsidian-grid');
    assert.ok(obsidian);
    assert.strictEqual(obsidian?.name, 'Obsidian Mesh');

    const nonexistent = getBackgroundTheme('non-existent-theme-id');
    assert.strictEqual(nonexistent, null);

    const empty = getBackgroundTheme(undefined);
    assert.strictEqual(empty, null);
  });

  it('should detect dirty state when activeBackgroundThemeId changes', () => {
    const base: ProfileData = {
      id: 'p1',
      name: 'Test User',
      slug: 'test-user',
      activeBackgroundThemeId: 'aurora-borealis',
      savedBackgroundThemeIds: ['aurora-borealis']
    };

    const current: ProfileData = {
      ...base,
      activeBackgroundThemeId: 'obsidian-mesh'
    };

    assert.strictEqual(isProfileDirty(base, current), true);
  });

  it('should detect dirty state when savedBackgroundThemeIds changes', () => {
    const base: ProfileData = {
      id: 'p1',
      name: 'Test User',
      slug: 'test-user',
      savedBackgroundThemeIds: ['aurora-borealis']
    };

    const current: ProfileData = {
      ...base,
      savedBackgroundThemeIds: ['aurora-borealis', 'obsidian-mesh']
    };

    assert.strictEqual(isProfileDirty(base, current), true);
  });

  it('should generate $set patch for activeBackgroundThemeId and savedBackgroundThemeIds', () => {
    const base: ProfileData = {
      id: 'p1',
      name: 'Test User',
      slug: 'test-user',
      activeBackgroundThemeId: undefined,
      savedBackgroundThemeIds: []
    };

    const current: ProfileData = {
      ...base,
      activeBackgroundThemeId: 'midnight-nebula',
      savedBackgroundThemeIds: ['midnight-nebula', 'royal-amethyst']
    };

    const diff = diffProfile(base, current);
    assert.strictEqual(diff.hasChanges, true);
    assert.strictEqual(diff.patch.activeBackgroundThemeId, 'midnight-nebula');
    assert.deepStrictEqual(diff.patch.savedBackgroundThemeIds, ['midnight-nebula', 'royal-amethyst']);
  });
});

describe('Profile Introduction Media', () => {
  it('should correctly parse standard YouTube links and create secure embed URL', () => {
    const parsed = parseExternalVideoUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    assert.strictEqual(parsed.provider, 'youtube');
    assert.strictEqual(parsed.id, 'dQw4w9WgXcQ');
    assert.strictEqual(parsed.embedUrl, 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0');
    assert.strictEqual(parsed.thumbnailUrl, 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg');
  });

  it('should correctly parse youtu.be short links', () => {
    const parsed = parseExternalVideoUrl('https://youtu.be/dQw4w9WgXcQ');
    assert.strictEqual(parsed.provider, 'youtube');
    assert.strictEqual(parsed.id, 'dQw4w9WgXcQ');
    assert.strictEqual(parsed.embedUrl, 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0');
  });

  it('should correctly parse YouTube Shorts links', () => {
    const parsed = parseExternalVideoUrl('https://www.youtube.com/shorts/dQw4w9WgXcQ');
    assert.strictEqual(parsed.provider, 'youtube');
    assert.strictEqual(parsed.id, 'dQw4w9WgXcQ');
    assert.strictEqual(parsed.embedUrl, 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0');
  });

  it('should correctly parse Vimeo links', () => {
    const parsed = parseExternalVideoUrl('https://vimeo.com/76979871');
    assert.strictEqual(parsed.provider, 'vimeo');
    assert.strictEqual(parsed.id, '76979871');
    assert.strictEqual(parsed.embedUrl, 'https://player.vimeo.com/video/76979871?autoplay=1');
  });

  it('should correctly parse Instagram Reels links', () => {
    const parsed = parseExternalVideoUrl('https://www.instagram.com/reel/C1234567890/');
    assert.strictEqual(parsed.provider, 'instagram');
    assert.strictEqual(parsed.id, 'C1234567890');
    assert.strictEqual(parsed.embedUrl, 'https://www.instagram.com/reel/C1234567890/embed');
  });

  it('should generate $set patch when adding introductionMedia', () => {
    const base: ProfileData = {
      id: 'p1',
      name: 'Test User',
      slug: 'test-user',
      introductionMedia: null
    };

    const media: ProfileIntroductionMedia = {
      type: 'voice',
      url: 'https://res.cloudinary.com/avtive/video/upload/v123/voice.webm',
      duration: 32,
      title: 'Voice Introduction',
      createdAt: '2026-01-01T00:00:00.000Z'
    };

    const current: ProfileData = {
      ...base,
      introductionMedia: media
    };

    assert.strictEqual(isProfileDirty(base, current), true);
    const diff = diffProfile(base, current);
    assert.strictEqual(diff.hasChanges, true);
    assert.strictEqual(diff.patch['introductionMedia.type'], 'voice');
    assert.strictEqual(diff.patch['introductionMedia.url'], media.url);
  });

  it('should generate nullification and clearFields when removing introductionMedia', () => {
    const media: ProfileIntroductionMedia = {
      type: 'external',
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      provider: 'youtube',
      embedUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0',
      title: 'My Video'
    };

    const base: ProfileData = {
      id: 'p1',
      name: 'Test User',
      slug: 'test-user',
      introductionMedia: media
    };

    const current: ProfileData = {
      ...base,
      introductionMedia: null
    };

    assert.strictEqual(isProfileDirty(base, current), true);
    const diff = diffProfile(base, current);
    assert.strictEqual(diff.hasChanges, true);
    assert.strictEqual(diff.patch.introductionMedia, null);
    assert.ok(diff.clearFields?.includes('introductionMedia'));
  });
});

describe('Sanitization & Backward Compatibility', () => {
  it('sanitizeProfileForPublic should preserve introductionMedia when sharingSettings is enabled', () => {
    const profile: ProfileData = {
      id: 'p1',
      name: 'Test User',
      slug: 'test-user',
      sharingSettings: {
        introductionMedia: true,
        bio: true
      },
      introductionMedia: {
        type: 'voice',
        url: 'https://res.cloudinary.com/avtive/video/upload/v123/voice.webm',
        title: 'Voice Intro'
      }
    };

    const sanitized = sanitizeProfileForPublic(profile);
    assert.ok(sanitized.introductionMedia, 'Expected introductionMedia to be preserved');
    assert.strictEqual(sanitized.introductionMedia?.type, 'voice');
  });

  it('sanitizeProfileForPublic should omit introductionMedia when sharingSettings.introductionMedia is false', () => {
    const profile: ProfileData = {
      id: 'p1',
      name: 'Test User',
      slug: 'test-user',
      sharingSettings: {
        introductionMedia: false
      },
      introductionMedia: {
        type: 'voice',
        url: 'https://res.cloudinary.com/avtive/video/upload/v123/voice.webm',
        title: 'Voice Intro'
      }
    };

    const sanitized = sanitizeProfileForPublic(profile);
    assert.strictEqual(sanitized.introductionMedia, null);
  });

  it('sanitizeProfileForPublic should preserve activeBackgroundThemeId for public viewing', () => {
    const profile: ProfileData = {
      id: 'p1',
      name: 'Test User',
      slug: 'test-user',
      activeBackgroundThemeId: 'sunset-amber',
      savedBackgroundThemeIds: ['sunset-amber', 'aurora-borealis']
    };

    const sanitized = sanitizeProfileForPublic(profile);
    assert.strictEqual(sanitized.activeBackgroundThemeId, 'sunset-amber');
  });

  it('mapDocToProfileData should gracefully handle old profiles without new properties', () => {
    const oldDoc = {
      _id: 'p1',
      name: 'Old User',
      slug: 'old-user',
      theme: 'editorial'
    };

    const mapped = mapDocToProfileData(oldDoc);
    assert.strictEqual(mapped.id, 'p1');
    assert.strictEqual(mapped.name, 'Old User');
    assert.strictEqual(mapped.theme, 'editorial');
    assert.ok(!mapped.activeBackgroundThemeId);
    assert.deepStrictEqual(mapped.savedBackgroundThemeIds, []);
    assert.strictEqual(mapped.introductionMedia, null);
  });

  it('mapDocToProfileData should map new properties when present in DB doc', () => {
    const doc = {
      _id: 'p1',
      name: 'New User',
      slug: 'new-user',
      activeBackgroundThemeId: 'aurora-borealis',
      savedBackgroundThemeIds: ['aurora-borealis', 'royal-amethyst'],
      introductionMedia: {
        type: 'external',
        url: 'https://youtu.be/dQw4w9WgXcQ',
        provider: 'youtube',
        embedUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0',
        title: 'My Video'
      }
    };

    const mapped = mapDocToProfileData(doc);
    assert.strictEqual(mapped.activeBackgroundThemeId, 'aurora-borealis');
    assert.deepStrictEqual(mapped.savedBackgroundThemeIds, ['aurora-borealis', 'royal-amethyst']);
    assert.ok(mapped.introductionMedia);
    assert.strictEqual(mapped.introductionMedia?.type, 'external');
  });

  it('resolveBackgroundAppearance & getSurfaceThemeConfig adapt translucent surfaces across all 4 background modes', () => {
    const baseProfile: Partial<ProfileData> = {
      id: 'p-bg',
      name: 'Background Tester',
      slug: 'bg-tester',
      theme: 'editorial'
    };

    const defaultApp = resolveBackgroundAppearance(baseProfile);
    assert.deepStrictEqual(defaultApp, { mode: 'default', hasCustomBg: false, bgIsDark: false });
    const defaultSurface = getSurfaceThemeConfig('editorial', baseProfile);
    assert.ok(defaultSurface.cardBg.includes('bg-white'), 'Default surface keeps editorial light base');

    const darkOccasionProfile: Partial<ProfileData> = {
      ...baseProfile,
      backgroundType: 'occasion',
      activeBackgroundThemeId: 'aurora-borealis'
    };
    const darkOccApp = resolveBackgroundAppearance(darkOccasionProfile);
    assert.deepStrictEqual(darkOccApp, { mode: 'occasion', hasCustomBg: true, bgIsDark: true });
    const darkOccSurface = getSurfaceThemeConfig('editorial', darkOccasionProfile);
    assert.ok(darkOccSurface.cardBg.includes('backdrop-blur-md') && darkOccSurface.cardBg.includes('/45'), 'Dark occasion uses translucent frosted surface');
    assert.ok(darkOccSurface.textPrimary.includes('text-white'), 'Dark occasion forces readable white text even with editorial profile theme');

    const lightOccasionProfile: Partial<ProfileData> = {
      ...baseProfile,
      backgroundType: 'occasion',
      activeBackgroundThemeId: 'soft-linen'
    };
    const lightOccApp = resolveBackgroundAppearance(lightOccasionProfile);
    assert.deepStrictEqual(lightOccApp, { mode: 'occasion', hasCustomBg: true, bgIsDark: false });
    const lightOccSurface = getSurfaceThemeConfig('editorial', lightOccasionProfile);
    assert.ok(lightOccSurface.cardBg.includes('bg-white/65') && lightOccSurface.cardBg.includes('backdrop-blur-md'), 'Light occasion uses bright translucent frosted glass');
    assert.ok(lightOccSurface.textPrimary.includes('text-zinc-950'), 'Light occasion uses dark text');

    const imageProfile: Partial<ProfileData> = {
      ...baseProfile,
      backgroundType: 'image',
      customBackgroundImage: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1400&q=80'
    };
    assert.deepStrictEqual(resolveBackgroundAppearance(imageProfile), { mode: 'image', hasCustomBg: true, bgIsDark: true });
    assert.ok(getSurfaceThemeConfig('editorial', imageProfile).cardBg.includes('bg-zinc-950/55'));

    const videoProfile: Partial<ProfileData> = {
      ...baseProfile,
      backgroundType: 'video',
      customBackgroundVideo: 'preset:waves'
    };
    assert.deepStrictEqual(resolveBackgroundAppearance(videoProfile), { mode: 'video', hasCustomBg: true, bgIsDark: true });
    assert.ok(getSurfaceThemeConfig('editorial', videoProfile).cardBg.includes('bg-zinc-950/55'));

    const containedOccasionHtml = renderToStaticMarkup(
      React.createElement(ProfileBackgroundLayer, { profile: darkOccasionProfile, contained: true })
    );
    assert.ok(containedOccasionHtml.includes('data-contained="true"'));
    assert.ok(containedOccasionHtml.includes('data-background-mode="occasion"'));
    assert.ok(containedOccasionHtml.includes('background-attachment:scroll'), 'Contained background overrides fixed attachment for mobile compatibility');

    const containedImageHtml = renderToStaticMarkup(
      React.createElement(ProfileBackgroundLayer, { profile: imageProfile, contained: true })
    );
    assert.ok(containedImageHtml.includes('data-background-mode="image"'));
    assert.ok(containedImageHtml.includes('sticky top-0'));

    const containedVideoHtml = renderToStaticMarkup(
      React.createElement(ProfileBackgroundLayer, { profile: videoProfile, contained: true })
    );
    assert.ok(containedVideoHtml.includes('data-background-mode="video"'));
    assert.ok(containedVideoHtml.includes('sticky top-0'));
  });
});
