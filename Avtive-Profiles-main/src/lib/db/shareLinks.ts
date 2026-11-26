import crypto from 'crypto';
import { ObjectId } from 'mongodb';
import {
  ShareChannel,
  ShareEventRecord,
  ShareExpiryOption,
  ShareLinkClientView,
  ShareLinkRecord,
  ShareLinkStatus,
  ShareRecipientAssociation
} from '@/types/sharing';
import { ProfileData } from '@/types/profile';
import { getMongoDb, COLLECTIONS } from './client';
import { lazyEnsureIndexes } from './indexes';
import { getProfileByIdOrSlug } from './profiles';
import { getCompanyMemberByUser } from './members';
import {
  filterAuthorizedSelection,
  getFieldPrivacyTier
} from '@/lib/sharing/presets';
import { sanitizeProfileForShare } from '@/lib/sharing/sanitize';
import {
  generateShareToken,
  hashShareToken,
  buildTokenHint,
  encryptShareToken,
  decryptShareToken,
  buildEventDedupKey
} from '@/lib/sharing/crypto';
import {
  recordShareEvent,
  hasRecentDedupEvent,
  listEventsForShareLink
} from './shareEvents';

const EXPIRY_7D_MS = 7 * 24 * 60 * 60 * 1000;

export function computeShareLinkStatus(
  doc: Pick<ShareLinkRecord, 'revoked' | 'expiresAt' | 'accessLimit' | 'accessCount'>,
  now: Date = new Date()
): ShareLinkStatus {
  if (doc.revoked) return 'revoked';
  if (doc.expiresAt && new Date(doc.expiresAt).getTime() <= now.getTime()) {
    return 'expired';
  }
  if (typeof doc.accessLimit === 'number' && doc.accessLimit > 0 && (doc.accessCount || 0) >= doc.accessLimit) {
    return 'expired';
  }
  return 'active';
}

function mapDocToShareLinkRecord(doc: any): ShareLinkRecord {
  const status = computeShareLinkStatus(doc);
  return {
    id: String(doc.id || doc._id),
    tokenHash: String(doc.tokenHash),
    encryptedToken: doc.encryptedToken || undefined,
    tokenHint: doc.tokenHint || undefined,
    ownerUserId: String(doc.ownerUserId),
    profileId: String(doc.profileId),
    profileSlug: doc.profileSlug || undefined,
    profileName: doc.profileName || undefined,
    title: doc.title || 'Untitled link',
    selectedFields: Array.isArray(doc.selectedFields) ? doc.selectedFields : [],
    selectedSections: Array.isArray(doc.selectedSections) ? doc.selectedSections : [],
    templateId: doc.templateId || undefined,
    templateName: doc.templateName || undefined,
    recipients: Array.isArray(doc.recipients) ? doc.recipients : [],
    eventLabel: doc.eventLabel || undefined,
    shareChannel: doc.shareChannel || 'link',
    expiryOption: (doc.expiryOption || 'never') as ShareExpiryOption,
    createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : String(doc.createdAt || new Date().toISOString()),
    updatedAt: doc.updatedAt instanceof Date ? doc.updatedAt.toISOString() : String(doc.updatedAt || new Date().toISOString()),
    expiresAt: doc.expiresAt ? (doc.expiresAt instanceof Date ? doc.expiresAt.toISOString() : String(doc.expiresAt)) : null,
    accessLimit: typeof doc.accessLimit === 'number' ? doc.accessLimit : null,
    accessCount: typeof doc.accessCount === 'number' ? doc.accessCount : 0,
    lastAccessedAt: doc.lastAccessedAt
      ? doc.lastAccessedAt instanceof Date
        ? doc.lastAccessedAt.toISOString()
        : String(doc.lastAccessedAt)
      : null,
    revoked: Boolean(doc.revoked),
    revokedAt: doc.revokedAt ? String(doc.revokedAt) : null,
    status
  };
}

export function toShareLinkClientView(
  record: ShareLinkRecord,
  originUrl?: string
): ShareLinkClientView {
  const rawToken = decryptShareToken(record.encryptedToken);
  const sharePath = rawToken ? `/s/${rawToken}` : '';
  const cleanOrigin = (originUrl || process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/+$/, '');
  const shareUrl = sharePath ? (cleanOrigin ? `${cleanOrigin}${sharePath}` : sharePath) : '';

  return {
    id: record.id,
    shareUrl,
    sharePath,
    tokenHint: record.tokenHint,
    profileId: record.profileId,
    profileSlug: record.profileSlug,
    profileName: record.profileName,
    title: record.title,
    selectedFields: record.selectedFields,
    selectedSections: record.selectedSections,
    templateId: record.templateId,
    templateName: record.templateName,
    recipients: record.recipients,
    eventLabel: record.eventLabel,
    shareChannel: record.shareChannel,
    expiryOption: record.expiryOption,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    expiresAt: record.expiresAt,
    accessLimit: record.accessLimit,
    accessCount: record.accessCount,
    lastAccessedAt: record.lastAccessedAt,
    revoked: record.revoked,
    revokedAt: record.revokedAt,
    status: computeShareLinkStatus(record)
  };
}

async function verifyProfileOwnership(profile: ProfileData, userId: string): Promise<boolean> {
  const direct =
    profile.userId === userId ||
    (profile as any).user_id === userId ||
    (ObjectId.isValid(userId) &&
      (String(profile.userId) === userId || String((profile as any).user_id) === userId));
  if (direct) return true;

  if (profile.companyId) {
    const member = await getCompanyMemberByUser(profile.companyId, userId);
    if (member && (member.role === 'OWNER' || member.role === 'ADMIN')) {
      return true;
    }
  }
  return false;
}

export interface CreateShareLinkParams {
  ownerUserId: string;
  profileId: string;
  title?: string;
  selectedFields: string[];
  confirmedPrivateFields?: string[];
  templateId?: string;
  templateName?: string;
  recipients?: ShareRecipientAssociation[];
  eventLabel?: string;
  shareChannel?: ShareChannel;
  expiryOption?: ShareExpiryOption;
  originUrl?: string;
}

export async function createShareLink(
  params: CreateShareLinkParams
): Promise<{
  success: boolean;
  link?: ShareLinkClientView;
  blockedNeverShare?: string[];
  error?: string;
  status: number;
}> {
  if (!params.ownerUserId) {
    return { success: false, error: 'Unauthorized: Authentication required.', status: 401 };
  }

  const profile = await getProfileByIdOrSlug(params.profileId);
  if (!profile) {
    return { success: false, error: 'Profile not found.', status: 404 };
  }

  const isOwner = await verifyProfileOwnership(profile, params.ownerUserId);
  if (!isOwner) {
    return { success: false, error: 'Forbidden: You do not own this profile.', status: 403 };
  }

  const confirmedPrivateSet = new Set<string>(params.confirmedPrivateFields || []);

  // Separate normal/confirmed-private requests vs unconfirmed-private vs never_share
  const eligibleRequested = (params.selectedFields || []).filter((f) => {
    const tier = getFieldPrivacyTier(profile, f);
    if (tier === 'private' && !confirmedPrivateSet.has(f)) {
      return false;
    }
    return true;
  });

  const {
    authorizedFields,
    authorizedSections,
    blockedNeverShare
  } = filterAuthorizedSelection(profile, eligibleRequested, {
    allowConfirmedPrivate: true
  });

  if (authorizedFields.length === 0) {
    return {
      success: false,
      error: 'Select at least one permissible field to create a share link.',
      blockedNeverShare,
      status: 400
    };
  }

  await lazyEnsureIndexes();
  const db = await getMongoDb();
  const col = db.collection(COLLECTIONS.SHARE_LINKS);

  const rawToken = generateShareToken();
  const tokenHash = hashShareToken(rawToken);
  const encryptedToken = encryptShareToken(rawToken);
  const tokenHint = buildTokenHint(rawToken);

  const expiryOption: ShareExpiryOption =
    params.expiryOption === '7d' || params.expiryOption === '1_view' ? params.expiryOption : 'never';

  const now = new Date();
  const nowIso = now.toISOString();
  const expiresAt =
    expiryOption === '7d' ? new Date(now.getTime() + EXPIRY_7D_MS).toISOString() : null;
  const accessLimit = expiryOption === '1_view' ? 1 : null;

  const cleanEvent = params.eventLabel?.trim().slice(0, 80) || undefined;
  const cleanTitle =
    params.title?.trim().slice(0, 120) ||
    cleanEvent ||
    (params.recipients && params.recipients.length === 1 ? `Shared with ${params.recipients[0].name}` : '') ||
    (params.templateName ? `${params.templateName} · ${profile.name}` : `Share · ${profile.name}`);

  const cleanRecipients: ShareRecipientAssociation[] = Array.isArray(params.recipients)
    ? params.recipients.slice(0, 25).map((r) => ({
      id: String(r.id || '').slice(0, 80),
      name: String(r.name || '').trim().slice(0, 100),
      ...(r.email ? { email: String(r.email).trim().slice(0, 160) } : {}),
      ...(r.company ? { company: String(r.company).trim().slice(0, 120) } : {}),
      ...(r.designation ? { designation: String(r.designation).trim().slice(0, 120) } : {}),
      ...(r.source ? { source: r.source } : {}),
      ...(() => {
        const mergedTags = Array.isArray(r.tags) && r.tags.length > 0 ? r.tags : r.labels;
        return Array.isArray(mergedTags)
          ? { tags: mergedTags.slice(0, 6), labels: mergedTags.slice(0, 6) }
          : {};
      })()
    })).filter((r) => Boolean(r.name))
    : [];

  const linkId = `sl-${crypto.randomUUID()}`;
  const doc: ShareLinkRecord & { _id: string } = {
    _id: linkId,
    id: linkId,
    tokenHash,
    encryptedToken,
    tokenHint,
    ownerUserId: params.ownerUserId,
    profileId: profile.id,
    profileSlug: profile.slug,
    profileName: profile.profileName || profile.name,
    title: cleanTitle,
    selectedFields: authorizedFields,
    selectedSections: authorizedSections,
    templateId: params.templateId || undefined,
    templateName: params.templateName || undefined,
    recipients: cleanRecipients,
    eventLabel: cleanEvent,
    shareChannel: params.shareChannel || 'link',
    expiryOption,
    createdAt: nowIso,
    updatedAt: nowIso,
    expiresAt,
    accessLimit,
    accessCount: 0,
    lastAccessedAt: null,
    revoked: false,
    revokedAt: null,
    status: 'active'
  };

  await col.insertOne(doc as any);

  await recordShareEvent({
    shareLinkId: linkId,
    ownerUserId: params.ownerUserId,
    profileId: profile.id,
    eventType: 'share_created',
    channel: doc.shareChannel
  }).catch(() => { });

  return {
    success: true,
    link: toShareLinkClientView(doc, params.originUrl),
    blockedNeverShare,
    status: 201
  };
}

export async function listShareLinksForOwner(
  ownerUserId: string,
  options?: {
    status?: 'all' | ShareLinkStatus;
    search?: string;
    profileId?: string;
    originUrl?: string;
  }
): Promise<ShareLinkClientView[]> {
  if (!ownerUserId) return [];
  await lazyEnsureIndexes();
  const db = await getMongoDb();

  const query: Record<string, any> = { ownerUserId };
  if (options?.profileId) {
    query.profileId = options.profileId;
  }

  const docs = await db
    .collection(COLLECTIONS.SHARE_LINKS)
    .find(query)
    .sort({ createdAt: -1 })
    .limit(200)
    .toArray();

  let views = docs.map(mapDocToShareLinkRecord).map((rec) => toShareLinkClientView(rec, options?.originUrl));

  if (options?.status && options.status !== 'all') {
    views = views.filter((v) => v.status === options.status);
  }

  if (options?.search && options.search.trim()) {
    const q = options.search.trim().toLowerCase();
    views = views.filter((v) => {
      if (v.title.toLowerCase().includes(q)) return true;
      if (v.eventLabel && v.eventLabel.toLowerCase().includes(q)) return true;
      if (v.profileName && v.profileName.toLowerCase().includes(q)) return true;
      if (v.templateName && v.templateName.toLowerCase().includes(q)) return true;
      if (v.recipients.some((r) =>
        r.name.toLowerCase().includes(q) ||
        (r.company && r.company.toLowerCase().includes(q)) ||
        (r.email && r.email.toLowerCase().includes(q))
      )) {
        return true;
      }
      return false;
    });
  }

  return views;
}

export async function getShareLinkDetailsForOwner(
  shareLinkId: string,
  ownerUserId: string,
  originUrl?: string
): Promise<{
  success: boolean;
  link?: ShareLinkClientView;
  events?: ShareEventRecord[];
  error?: string;
  status: number;
}> {
  if (!ownerUserId) {
    return { success: false, error: 'Unauthorized', status: 401 };
  }
  await lazyEnsureIndexes();
  const db = await getMongoDb();

  const doc = await db.collection(COLLECTIONS.SHARE_LINKS).findOne({ id: shareLinkId });
  if (!doc) {
    return { success: false, error: 'Share link not found.', status: 404 };
  }
  if (String(doc.ownerUserId) !== ownerUserId) {
    return { success: false, error: 'Forbidden: You do not own this share link.', status: 403 };
  }

  const record = mapDocToShareLinkRecord(doc);
  const events = await listEventsForShareLink(record.id, ownerUserId, 50);

  return {
    success: true,
    link: toShareLinkClientView(record, originUrl),
    events,
    status: 200
  };
}

export async function updateShareLinkForOwner(
  shareLinkId: string,
  ownerUserId: string,
  patch: {
    title?: string;
    selectedFields?: string[];
    confirmedPrivateFields?: string[];
    expiryOption?: ShareExpiryOption;
    eventLabel?: string;
    recipients?: ShareRecipientAssociation[];
  },
  originUrl?: string
): Promise<{
  success: boolean;
  link?: ShareLinkClientView;
  error?: string;
  status: number;
}> {
  if (!ownerUserId) {
    return { success: false, error: 'Unauthorized', status: 401 };
  }
  await lazyEnsureIndexes();
  const db = await getMongoDb();
  const col = db.collection(COLLECTIONS.SHARE_LINKS);

  const existingDoc = await col.findOne({ id: shareLinkId });
  if (!existingDoc) {
    return { success: false, error: 'Share link not found.', status: 404 };
  }
  if (String(existingDoc.ownerUserId) !== ownerUserId) {
    return { success: false, error: 'Forbidden: You do not own this share link.', status: 403 };
  }
  if (existingDoc.revoked) {
    return { success: false, error: 'Cannot edit a revoked share link.', status: 400 };
  }

  const now = new Date();
  const nowIso = now.toISOString();
  const $set: Record<string, any> = { updatedAt: nowIso };

  if (typeof patch.title === 'string') {
    $set.title = patch.title.trim().slice(0, 120) || existingDoc.title;
  }
  if (patch.eventLabel !== undefined) {
    $set.eventLabel = patch.eventLabel ? patch.eventLabel.trim().slice(0, 80) : null;
  }
  if (Array.isArray(patch.recipients)) {
    $set.recipients = patch.recipients.slice(0, 25);
  }

  if (Array.isArray(patch.selectedFields)) {
    const profile = await getProfileByIdOrSlug(existingDoc.profileId);
    if (!profile) {
      return { success: false, error: 'Associated profile not found.', status: 404 };
    }
    const confirmedPrivateSet = new Set<string>(patch.confirmedPrivateFields || []);
    const existingFieldsSet = new Set<string>(existingDoc.selectedFields || []);

    const eligibleRequested = patch.selectedFields.filter((f) => {
      const tier = getFieldPrivacyTier(profile, f);
      if (tier === 'private' && !confirmedPrivateSet.has(f) && !existingFieldsSet.has(f)) {
        return false;
      }
      return true;
    });

    const { authorizedFields, authorizedSections } = filterAuthorizedSelection(
      profile,
      eligibleRequested,
      { allowConfirmedPrivate: true }
    );
    if (authorizedFields.length === 0) {
      return { success: false, error: 'At least one permissible field must remain selected.', status: 400 };
    }
    $set.selectedFields = authorizedFields;
    $set.selectedSections = authorizedSections;
  }

  if (patch.expiryOption) {
    $set.expiryOption = patch.expiryOption;
    if (patch.expiryOption === 'never') {
      $set.expiresAt = null;
      $set.accessLimit = null;
      $set.status = 'active';
    } else if (patch.expiryOption === '7d') {
      $set.expiresAt = new Date(now.getTime() + EXPIRY_7D_MS).toISOString();
      $set.accessLimit = null;
      $set.status = 'active';
    } else if (patch.expiryOption === '1_view') {
      $set.expiresAt = null;
      $set.accessLimit = (existingDoc.accessCount || 0) + 1;
      $set.status = 'active';
    }
  }

  const updated = await col.findOneAndUpdate(
    { id: shareLinkId, ownerUserId },
    { $set },
    { returnDocument: 'after' }
  );

  if (!updated) {
    return { success: false, error: 'Failed to update share link.', status: 500 };
  }

  await recordShareEvent({
    shareLinkId,
    ownerUserId,
    profileId: String(existingDoc.profileId),
    eventType: 'access_updated'
  }).catch(() => { });

  return {
    success: true,
    link: toShareLinkClientView(mapDocToShareLinkRecord(updated), originUrl),
    status: 200
  };
}

export async function revokeShareLinkForOwner(
  shareLinkId: string,
  ownerUserId: string,
  originUrl?: string
): Promise<{
  success: boolean;
  link?: ShareLinkClientView;
  error?: string;
  status: number;
}> {
  if (!ownerUserId) {
    return { success: false, error: 'Unauthorized', status: 401 };
  }
  await lazyEnsureIndexes();
  const db = await getMongoDb();
  const col = db.collection(COLLECTIONS.SHARE_LINKS);

  const existingDoc = await col.findOne({ id: shareLinkId });
  if (!existingDoc) {
    return { success: false, error: 'Share link not found.', status: 404 };
  }
  if (String(existingDoc.ownerUserId) !== ownerUserId) {
    return { success: false, error: 'Forbidden: You do not own this share link.', status: 403 };
  }

  const nowIso = new Date().toISOString();
  const updated = await col.findOneAndUpdate(
    { id: shareLinkId, ownerUserId },
    {
      $set: {
        revoked: true,
        revokedAt: existingDoc.revokedAt || nowIso,
        status: 'revoked',
        updatedAt: nowIso
      }
    },
    { returnDocument: 'after' }
  );

  if (!updated) {
    return { success: false, error: 'Failed to revoke share link.', status: 500 };
  }

  if (!existingDoc.revoked) {
    await recordShareEvent({
      shareLinkId,
      ownerUserId,
      profileId: String(existingDoc.profileId),
      eventType: 'link_revoked'
    }).catch(() => { });
  }

  return {
    success: true,
    link: toShareLinkClientView(mapDocToShareLinkRecord(updated), originUrl),
    status: 200
  };
}

export type ResolveShareLinkResult =
  | {
    outcome: 'valid';
    profile: ProfileData;
    shareMeta: {
      title: string;
      templateName?: string;
      eventLabel?: string;
      expiryOption: ShareExpiryOption;
      expiresAt: string | null;
      remainingViews: number | null;
      selectedFieldsCount: number;
    };
  }
  | {
    outcome: 'not_found' | 'revoked' | 'expired' | 'rate_limited';
  };

/**
 * Resolves a visitor token on `/s/[token]`:
 *  1. Validates token hash in MongoDB
 *  2. Enforces revocation and time expiry on every request
 *  3. Atomically consumes limited/one-view links so concurrent requests cannot bypass accessLimit
 *  4. Deduplicates multi-view rapid refresh events without inflating access counts
 *  5. Returns strictly sanitized profile intersecting profile visibility, Never Share rules, and share configuration
 */
export async function consumeAndResolveShareLink(
  rawToken: string,
  options?: {
    channel?: string;
    clientSignature?: string;
    isPrefetch?: boolean;
  }
): Promise<ResolveShareLinkResult> {
  if (!rawToken || typeof rawToken !== 'string' || rawToken.length < 12) {
    return { outcome: 'not_found' };
  }

  await lazyEnsureIndexes();
  const db = await getMongoDb();
  const col = db.collection(COLLECTIONS.SHARE_LINKS);

  const tokenHash = hashShareToken(rawToken);
  const existing = await col.findOne({ tokenHash });

  if (!existing) {
    return { outcome: 'not_found' };
  }

  const record = mapDocToShareLinkRecord(existing);
  if (record.revoked) {
    return { outcome: 'revoked' };
  }

  const now = new Date();
  const nowIso = now.toISOString();

  // Check time expiry
  if (record.expiresAt && new Date(record.expiresAt).getTime() <= now.getTime()) {
    if (existing.status !== 'expired') {
      await col.updateOne(
        { id: record.id, status: { $ne: 'expired' } },
        { $set: { status: 'expired', updatedAt: nowIso } }
      );
      await recordShareEvent({
        shareLinkId: record.id,
        ownerUserId: record.ownerUserId,
        profileId: record.profileId,
        eventType: 'link_expired'
      }).catch(() => { });
    }
    return { outcome: 'expired' };
  }

  // If Next router prefetch or browser speculative prefetch, do not consume a view
  if (options?.isPrefetch) {
    if (record.accessLimit !== null && record.accessCount >= record.accessLimit) {
      return { outcome: 'expired' };
    }
    const profile = await getProfileByIdOrSlug(record.profileId);
    if (!profile) return { outcome: 'not_found' };
    const sanitized = sanitizeProfileForShare(profile, {
      selectedFields: record.selectedFields,
      selectedSections: record.selectedSections
    });
    return {
      outcome: 'valid',
      profile: sanitized,
      shareMeta: {
        title: record.title,
        templateName: record.templateName,
        eventLabel: record.eventLabel,
        expiryOption: record.expiryOption,
        expiresAt: record.expiresAt,
        remainingViews: record.accessLimit !== null ? Math.max(0, record.accessLimit - record.accessCount) : null,
        selectedFieldsCount: record.selectedFields.length
      }
    };
  }

  const channel = options?.channel === 'qr' ? 'qr' : options?.channel === 'nfc' ? 'nfc' : 'link';
  const eventType =
    channel === 'qr' ? 'qr_opened' : channel === 'nfc' ? 'nfc_opened' : 'link_opened';

  let remainingViews: number | null = null;

  if (typeof record.accessLimit === 'number' && record.accessLimit > 0) {
    // STRICT ATOMIC CONSUME: no dedup bypass! Only allowed N requests win this conditional update.
    const atomicFilter: Record<string, any> = {
      tokenHash,
      revoked: false,
      accessCount: { $lt: record.accessLimit },
      $or: [{ expiresAt: null }, { expiresAt: { $gt: nowIso } }]
    };

    const willExhaust = record.accessCount + 1 >= record.accessLimit;
    const consumedDoc = await col.findOneAndUpdate(
      atomicFilter,
      {
        $inc: { accessCount: 1 },
        $set: {
          lastAccessedAt: nowIso,
          updatedAt: nowIso,
          ...(willExhaust ? { status: 'expired' } : {})
        }
      },
      { returnDocument: 'after' }
    );

    if (!consumedDoc) {
      // Lost race or already consumed/revoked
      const latest = await col.findOne({ tokenHash });
      if (latest?.revoked) return { outcome: 'revoked' };
      return { outcome: 'expired' };
    }

    const updatedRecord = mapDocToShareLinkRecord(consumedDoc);
    remainingViews = Math.max(0, (updatedRecord.accessLimit || 1) - updatedRecord.accessCount);

    await recordShareEvent({
      shareLinkId: record.id,
      ownerUserId: record.ownerUserId,
      profileId: record.profileId,
      eventType,
      channel
    }).catch(() => { });

    if (remainingViews === 0) {
      await col.updateOne({ id: record.id }, { $set: { status: 'expired' } }).catch(() => { });
      await recordShareEvent({
        shareLinkId: record.id,
        ownerUserId: record.ownerUserId,
        profileId: record.profileId,
        eventType: 'link_expired',
        channel
      }).catch(() => { });
    }
  } else {
    // Unlimited views (until revoked or 7d expiry): apply short deduplication window to avoid inflating analytics on accidental double-hits
    const dedupKey = buildEventDedupKey(
      record.id,
      channel,
      options?.clientSignature || 'anon',
      15
    );
    const alreadySeenRecently = await hasRecentDedupEvent(dedupKey);

    const checkFilter: Record<string, any> = {
      tokenHash,
      revoked: false,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: nowIso } }]
    };

    if (!alreadySeenRecently) {
      const updatedDoc = await col.findOneAndUpdate(
        checkFilter,
        {
          $inc: { accessCount: 1 },
          $set: { lastAccessedAt: nowIso, updatedAt: nowIso }
        },
        { returnDocument: 'after' }
      );
      if (!updatedDoc) {
        const latest = await col.findOne({ tokenHash });
        if (latest?.revoked) return { outcome: 'revoked' };
        return { outcome: 'expired' };
      }

      await recordShareEvent({
        shareLinkId: record.id,
        ownerUserId: record.ownerUserId,
        profileId: record.profileId,
        eventType,
        channel,
        dedupKey
      }).catch(() => { });
    } else {
      const validDoc = await col.findOne(checkFilter);
      if (!validDoc) {
        const latest = await col.findOne({ tokenHash });
        if (latest?.revoked) return { outcome: 'revoked' };
        return { outcome: 'expired' };
      }
    }
  }

  const profile = await getProfileByIdOrSlug(record.profileId);
  if (!profile) {
    return { outcome: 'not_found' };
  }

  const sanitizedProfile = sanitizeProfileForShare(profile, {
    selectedFields: record.selectedFields,
    selectedSections: record.selectedSections
  });

  return {
    outcome: 'valid',
    profile: sanitizedProfile,
    shareMeta: {
      title: record.title,
      templateName: record.templateName,
      eventLabel: record.eventLabel,
      expiryOption: record.expiryOption,
      expiresAt: record.expiresAt,
      remainingViews,
      selectedFieldsCount: record.selectedFields.length
    }
  };
}
