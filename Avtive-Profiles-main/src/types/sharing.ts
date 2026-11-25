import { PrivacyTier } from './profile';

export type SharePresetKey = 'everything' | 'general' | 'personal' | 'embedded_jobs';
export type ShareExpiryOption = 'never' | '7d' | '1_view';
export type ShareLinkStatus = 'active' | 'expired' | 'revoked';
export type ShareChannel = 'link' | 'qr' | 'nfc' | 'native' | 'email' | 'vcard';

export interface ShareRecipientAssociation {
  id: string;
  name: string;
  email?: string;
  company?: string;
  designation?: string;
  avatar?: string;
  source?: 'connection' | 'colleague' | 'manual';
  labels?: string[];
}

export interface ShareLinkRecord {
  id: string;
  tokenHash: string;
  encryptedToken?: string;
  tokenHint?: string;
  ownerUserId: string;
  profileId: string;
  profileSlug?: string;
  profileName?: string;
  title: string;
  selectedFields: string[];
  selectedSections: string[];
  templateId?: string;
  templateName?: string;
  recipients: ShareRecipientAssociation[];
  eventLabel?: string;
  shareChannel?: ShareChannel;
  expiryOption: ShareExpiryOption;
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;
  accessLimit: number | null;
  accessCount: number;
  lastAccessedAt: string | null;
  revoked: boolean;
  revokedAt: string | null;
  status: ShareLinkStatus;
}

/**
 * Safe owner-facing projection of a share link (never leaks tokenHash or encryptedToken).
 */
export interface ShareLinkClientView {
  id: string;
  shareUrl: string;
  sharePath: string;
  tokenHint?: string;
  profileId: string;
  profileSlug?: string;
  profileName?: string;
  title: string;
  selectedFields: string[];
  selectedSections: string[];
  templateId?: string;
  templateName?: string;
  recipients: ShareRecipientAssociation[];
  eventLabel?: string;
  shareChannel?: ShareChannel;
  expiryOption: ShareExpiryOption;
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;
  accessLimit: number | null;
  accessCount: number;
  lastAccessedAt: string | null;
  revoked: boolean;
  revokedAt: string | null;
  status: ShareLinkStatus;
}

export interface ShareTemplateRecord {
  id: string;
  ownerUserId: string;
  name: string;
  description: string;
  isBuiltIn: boolean;
  presetKey?: SharePresetKey;
  selectedFields: string[];
  selectedSections: string[];
  lostAndFoundMode?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ShareEventType =
  | 'share_created'
  | 'link_opened'
  | 'qr_opened'
  | 'nfc_opened'
  | 'link_expired'
  | 'link_revoked'
  | 'access_updated';

export interface ShareEventRecord {
  id: string;
  shareLinkId: string;
  ownerUserId: string;
  profileId: string;
  eventType: ShareEventType;
  timestamp: string;
  channel?: string;
  dedupKey?: string;
}

export interface ShareFieldDefinition {
  key: string;
  label: string;
  group: 'basics' | 'about' | 'contact' | 'career' | 'extended' | 'custom';
  defaultPrivacy: PrivacyTier;
  canonicalSection: string;
  sharingSettingsKey?: string;
  description?: string;
}
