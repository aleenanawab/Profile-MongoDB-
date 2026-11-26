'use client';

import React from 'react';
import { ProfileData } from '@/types/profile';
import { getBackgroundTheme } from '@/data/backgroundThemes';

export interface CuratedImageBackground {
  id: string;
  label: string;
  url: string;
  previewStyle: React.CSSProperties;
}

export interface AnimatedVideoPreset {
  id: string;
  label: string;
  description: string;
  variant: 'waves' | 'mist' | 'grid' | 'sweep';
}

export const CURATED_IMAGE_BACKGROUNDS: CuratedImageBackground[] = [
  {
    id: 'img-monolith',
    label: 'Obsidian Architecture',
    url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1400&q=80',
    previewStyle: {
      background: 'linear-gradient(135deg, #18181b 0%, #3f3f46 50%, #09090b 100%)'
    }
  },
  {
    id: 'img-concrete',
    label: 'Minimal Concrete',
    url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1400&q=80',
    previewStyle: {
      background: 'linear-gradient(135deg, #27272a 0%, #71717a 55%, #18181b 100%)'
    }
  },
  {
    id: 'img-gallery',
    label: 'White Gallery',
    url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1400&q=80',
    previewStyle: {
      background: 'linear-gradient(135deg, #ffffff 0%, #e4e4e7 55%, #d4d4d8 100%)'
    }
  },
  {
    id: 'img-paper',
    label: 'Studio Shadow',
    url: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=1400&q=80',
    previewStyle: {
      background: 'linear-gradient(135deg, #f4f4f5 0%, #a1a1aa 60%, #52525b 100%)'
    }
  }
];

export const ANIMATED_VIDEO_PRESETS: AnimatedVideoPreset[] = [
  {
    id: 'preset:waves',
    label: 'Obsidian Waves',
    description: 'Slow monochrome silk motion',
    variant: 'waves'
  },
  {
    id: 'preset:mist',
    label: 'Silver Mist',
    description: 'Soft ambient contrast drift',
    variant: 'mist'
  },
  {
    id: 'preset:grid',
    label: 'Minimal Matrix',
    description: 'Subtle architectural pulse',
    variant: 'grid'
  },
  {
    id: 'preset:sweep',
    label: 'Studio Spotlight',
    description: 'Quiet editorial light sweep',
    variant: 'sweep'
  }
];

export function resolveBackgroundMode(profile: Partial<ProfileData>): 'default' | 'image' | 'video' | 'occasion' {
  if (profile.backgroundType === 'image' && profile.customBackgroundImage) return 'image';
  if (profile.backgroundType === 'video' && profile.customBackgroundVideo) return 'video';
  if (profile.backgroundType === 'occasion' && profile.activeBackgroundThemeId) return 'occasion';
  if (profile.backgroundType === 'default') return 'default';

  if (profile.customBackgroundVideo) return 'video';
  if (profile.customBackgroundImage) return 'image';
  if (profile.activeBackgroundThemeId) return 'occasion';
  return 'default';
}

export function getBackgroundDescription(profile: Partial<ProfileData>): string {
  const mode = resolveBackgroundMode(profile);
  if (mode === 'image') {
    const matched = CURATED_IMAGE_BACKGROUNDS.find((c) => c.url === profile.customBackgroundImage);
    return matched ? `Image · ${matched.label}` : 'Custom background image';
  }
  if (mode === 'video') {
    const preset = ANIMATED_VIDEO_PRESETS.find((v) => v.id === profile.customBackgroundVideo);
    return preset ? `Animated Video · ${preset.label}` : 'Custom looping video';
  }
  if (mode === 'occasion') {
    const theme = getBackgroundTheme(profile.activeBackgroundThemeId);
    return theme ? `Occasion · ${theme.name}` : 'Occasion theme';
  }
  return 'Default minimalist monochrome surface';
}

interface AnimatedPresetCanvasProps {
  variant: AnimatedVideoPreset['variant'];
  className?: string;
}

export function AnimatedVideoBackdrop({ variant, className = '' }: AnimatedPresetCanvasProps) {
  if (variant === 'mist') {
    return (
      <div className={`relative w-full h-full overflow-hidden bg-zinc-950 ${className}`}>
        <div
          className="absolute -inset-1/2 opacity-50 animate-pulse"
          style={{
            background:
              'radial-gradient(circle at 30% 35%, rgba(255,255,255,0.28), transparent 45%), radial-gradient(circle at 75% 70%, rgba(161,161,170,0.22), transparent 50%)'
          }}
        />
      </div>
    );
  }
  if (variant === 'grid') {
    return (
      <div className={`relative w-full h-full overflow-hidden bg-black ${className}`}>
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.12) 1px, transparent 1px)',
            backgroundSize: '36px 36px'
          }}
        />
        <div
          className="absolute inset-0 opacity-40 animate-pulse"
          style={{
            background: 'radial-gradient(circle at 50% 40%, rgba(255,255,255,0.22), transparent 60%)'
          }}
        />
      </div>
    );
  }
  if (variant === 'sweep') {
    return (
      <div className={`relative w-full h-full overflow-hidden bg-zinc-900 ${className}`}>
        <div
          className="absolute inset-0 opacity-60"
          style={{
            background:
              'linear-gradient(125deg, #09090b 10%, #27272a 42%, #ffffff22 52%, #18181b 72%, #000000 100%)'
          }}
        />
      </div>
    );
  }

  // Default: waves
  return (
    <div className={`relative w-full h-full overflow-hidden bg-[#09090B] ${className}`}>
      <div
        className="absolute inset-0 opacity-65 animate-pulse"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 20% 20%, rgba(255,255,255,0.16), transparent), radial-gradient(ellipse 70% 60% at 80% 80%, rgba(212,212,216,0.14), transparent)'
        }}
      />
    </div>
  );
}

interface ProfileBackgroundLayerProps {
  profile: Partial<ProfileData>;
  overrideOccasionThemeId?: string | null;
  contained?: boolean;
}

export function ProfileBackgroundLayer({
  profile,
  overrideOccasionThemeId,
  contained = false
}: ProfileBackgroundLayerProps) {
  const mode = overrideOccasionThemeId ? 'occasion' : resolveBackgroundMode(profile);
  const posClass = contained ? 'absolute inset-0' : 'fixed inset-0';

  if (mode === 'default') {
    return null;
  }

  if (mode === 'occasion') {
    const theme = getBackgroundTheme(overrideOccasionThemeId || profile.activeBackgroundThemeId);
    if (!theme) return null;
    const backgroundStyle: React.CSSProperties = {
      ...theme.backgroundStyle,
      ...(contained ? { backgroundAttachment: 'scroll' } : {}),
      zIndex: 0
    };
    if (contained) {
      return (
        <div
          data-contained="true"
          data-background-mode="occasion"
          className={`${posClass} pointer-events-none z-0 transition-all duration-500 ease-in-out`}
          style={{
            backgroundColor: theme.backgroundStyle.backgroundColor,
            zIndex: 0
          }}
          aria-hidden="true"
        >
          <div className="sticky top-0 w-full h-full max-h-[100dvh]" style={backgroundStyle} />
        </div>
      );
    }
    return (
      <div
        data-contained="false"
        data-background-mode="occasion"
        className={`${posClass} pointer-events-none z-0 transition-all duration-500 ease-in-out`}
        style={backgroundStyle}
        aria-hidden="true"
      />
    );
  }

  if (mode === 'image' && profile.customBackgroundImage) {
    return (
      <div
        data-contained={contained ? 'true' : 'false'}
        data-background-mode="image"
        className={`${posClass} pointer-events-none z-0 ${contained ? '' : 'overflow-hidden'}`}
        aria-hidden="true"
      >
        <div className={contained ? 'sticky top-0 w-full h-full max-h-[100dvh] overflow-hidden' : 'relative w-full h-full overflow-hidden'}>
          <img
            src={profile.customBackgroundImage}
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/20 dark:bg-black/45" />
        </div>
      </div>
    );
  }

  if (mode === 'video' && profile.customBackgroundVideo) {
    const src = profile.customBackgroundVideo;
    const preset = ANIMATED_VIDEO_PRESETS.find((p) => p.id === src);

    return (
      <div
        data-contained={contained ? 'true' : 'false'}
        data-background-mode="video"
        className={`${posClass} pointer-events-none z-0 ${contained ? '' : 'overflow-hidden'}`}
        aria-hidden="true"
      >
        <div className={contained ? 'sticky top-0 w-full h-full max-h-[100dvh] overflow-hidden' : 'relative w-full h-full overflow-hidden'}>
          {preset ? (
            <AnimatedVideoBackdrop variant={preset.variant} />
          ) : (
            <video
              src={src}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-black/20 dark:bg-black/45" />
        </div>
      </div>
    );
  }

  return null;
}
