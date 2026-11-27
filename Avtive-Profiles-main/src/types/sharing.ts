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
  tags?: string[];
  labels?: string[];
}

export interface ContactTagRecord {
  id: string;
  ownerUserId: string;
  name: string;
  normalizedName: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContactTagSummary {
  id: string;
  name: string;
  count: number;
  createdAt: string;
}

export interface ContactTagLinkRecord {
  id: string;
  ownerUserId: string;
  recipientId: string;
  tags: string[];
  updatedAt: string;
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
  | 'link_copied'
  | 'native_shared'
  | 'qr_generated'
  | 'qr_opened'
  | 'nfc_shared'
  | 'nfc_opened'
  | 'email_sent'
  | 'vcard_downloaded'
  | 'link_opened'
  | 'link_expired'
  | 'link_revoked'
  | 'access_updated';

export type ShareEventActorType = 'owner' | 'visitor' | 'system';
export type ShareTargetType = 'share_link' | 'public_profile';

export interface ShareEventRecord {
  id: string;
  shareLinkId: string;
  ownerUserId: string;
  profileId: string;
  eventType: ShareEventType;
  timestamp: string;
  channel?: string;
  dedupKey?: string;
  actorType?: ShareEventActorType;
  targetType?: ShareTargetType;
  targetUrl?: string;
  selectedFields?: string[];
  selectedFieldsCount?: number;
  recipientNames?: string[];
  profileName?: string;
  profileSlug?: string;
  metadata?: Record<string, unknown>;
}

export interface ShareHistoryItem {
  id: string;
  eventType: ShareEventType;
  actorType: ShareEventActorType;
  targetType: ShareTargetType;
  timestamp: string;
  channel: string;
  profileId: string;
  profileName: string;
  profileIdentifier: string;
  shareLinkId: string | null;
  linkTitle: string | null;
  tokenHint?: string;
  accessStatus: ShareLinkStatus | 'public';
  selectedFields: string[];
  selectedFieldsCount: number;
  recipientNames: string[];
  viewCount: number | null;
  lastAccessedAt: string | null;
  targetUrl?: string;
  eventLabel?: string;
}

export interface ShareHistoryResponse {
  success: boolean;
  items: ShareHistoryItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  profiles: Array<{ id: string; name: string; identifier: string }>;
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
