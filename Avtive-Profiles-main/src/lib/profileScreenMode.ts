export type ProfileScreenMode = 'preview' | 'edit' | 'share';

export interface ResolvedScreenFromUrl {
  mode: ProfileScreenMode;
  needsUrlNormalization: boolean;
}

/**
 * Resolves the mutually exclusive active screen (`preview` | `edit` | `share`)
 * from browser URL query parameters and ownership state.
 * If both `?edit=true` and `?share=true` appear, resolves deterministically and flags normalization.
 */
export function resolveScreenModeFromSearch(
  search: string,
  isOwner: boolean
): ResolvedScreenFromUrl {
  const params = new URLSearchParams(search || '');
  const hasEdit = params.get('edit') === 'true' || params.get('edit') === '1';
  const hasShare = params.get('share') === 'true' || params.get('share') === '1';

  if (hasEdit && hasShare) {
    return {
      mode: isOwner ? 'edit' : 'share',
      needsUrlNormalization: true,
    };
  }

  if (hasEdit) {
    return {
      mode: isOwner ? 'edit' : 'preview',
      needsUrlNormalization: !isOwner,
    };
  }

  if (hasShare) {
    return {
      mode: 'share',
      needsUrlNormalization: false,
    };
  }

  return {
    mode: 'preview',
    needsUrlNormalization: false,
  };
}

export function buildProfileUrlForMode(slugOrId: string, mode: ProfileScreenMode): string {
  const base = `/profile/${encodeURIComponent(slugOrId)}`;
  if (mode === 'edit') return `${base}?edit=true`;
  if (mode === 'share') return `${base}?share=true`;
  return base;
}
