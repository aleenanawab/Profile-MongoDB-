import { ShareEventType, ShareTargetType } from '@/types/sharing';

export interface TrackOwnerShareEventInput {
  profileId: string;
  eventType: Extract<
    ShareEventType,
    'link_copied' | 'native_shared' | 'qr_generated' | 'nfc_shared' | 'vcard_downloaded'
  >;
  channel?: string;
  shareLinkId?: string;
  targetType?: ShareTargetType;
  selectedFields?: string[];
  selectedFieldsCount?: number;
  recipientNames?: string[];
  dedupToken?: string;
}

export interface TrackOwnerShareEventResult {
  recorded: boolean;
  error?: string;
}

/**
 * Records an owner-initiated sharing action after the action succeeds.
 * Returns `{ recorded: false, error }` if persistence fails so the UI can warn accurately
 * without breaking the share action itself.
 */
export async function trackOwnerShareEvent(
  input: TrackOwnerShareEventInput
): Promise<TrackOwnerShareEventResult> {
  if (!input.profileId) {
    return { recorded: false, error: 'Missing profileId' };
  }
  try {
    const res = await fetch('/api/share/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.recorded === false) {
      const errMsg = data?.error || `History log failed (${res.status})`;
      console.warn('[trackOwnerShareEvent] Event not recorded:', errMsg);
      return { recorded: false, error: errMsg };
    }
    return { recorded: true };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : 'Network error recording share activity';
    console.warn('[trackOwnerShareEvent] Network error:', errMsg);
    return { recorded: false, error: errMsg };
  }
}
