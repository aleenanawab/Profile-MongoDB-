import crypto from 'crypto';
import {
  ShareEventActorType,
  ShareEventRecord,
  ShareEventType,
  ShareHistoryItem,
  ShareHistoryResponse,
  ShareLinkStatus,
  ShareTargetType
} from '@/types/sharing';
import { getMongoDb, COLLECTIONS } from './client';
import { lazyEnsureIndexes } from './indexes';
import { getProfilesByUserId } from './profiles';

export interface RecordShareEventParams {
  shareLinkId?: string;
  ownerUserId: string;
  profileId: string;
  eventType: ShareEventType;
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

export interface RecordShareEventResult {
  recorded: boolean;
  deduplicated?: boolean;
  event?: ShareEventRecord;
  error?: string;
}

const VISITOR_EVENT_TYPES = new Set<ShareEventType>(['link_opened', 'qr_opened', 'nfc_opened']);
const SYSTEM_EVENT_TYPES = new Set<ShareEventType>(['link_expired']);

export function resolveDefaultActorType(eventType: ShareEventType): ShareEventActorType {
  if (VISITOR_EVENT_TYPES.has(eventType)) return 'visitor';
  if (SYSTEM_EVENT_TYPES.has(eventType)) return 'system';
  return 'owner';
}

function mapDocToShareEvent(doc: any): ShareEventRecord {
  const eventType = doc.eventType as ShareEventType;
  return {
    id: String(doc.id || doc._id),
    shareLinkId: doc.shareLinkId ? String(doc.shareLinkId) : 'public_profile',
    ownerUserId: String(doc.ownerUserId),
    profileId: String(doc.profileId),
    eventType,
    timestamp: doc.timestamp instanceof Date ? doc.timestamp.toISOString() : String(doc.timestamp || new Date().toISOString()),
    channel: doc.channel || undefined,
    actorType: (doc.actorType as ShareEventActorType) || resolveDefaultActorType(eventType),
    targetType: (doc.targetType as ShareTargetType) || (doc.shareLinkId && doc.shareLinkId !== 'public_profile' ? 'share_link' : 'public_profile'),
    targetUrl: typeof doc.targetUrl === 'string' ? doc.targetUrl : undefined,
    selectedFields: Array.isArray(doc.selectedFields) ? doc.selectedFields : undefined,
    selectedFieldsCount: typeof doc.selectedFieldsCount === 'number' ? doc.selectedFieldsCount : undefined,
    recipientNames: Array.isArray(doc.recipientNames) ? doc.recipientNames : undefined,
    profileName: typeof doc.profileName === 'string' ? doc.profileName : undefined,
    profileSlug: typeof doc.profileSlug === 'string' ? doc.profileSlug : undefined,
    metadata: doc.metadata && typeof doc.metadata === 'object' ? doc.metadata : undefined
  };
}

function computeStatusFromDoc(doc: any, now: Date = new Date()): ShareLinkStatus {
  if (doc.revoked) return 'revoked';
  if (doc.expiresAt && new Date(doc.expiresAt).getTime() <= now.getTime()) {
    return 'expired';
  }
  if (typeof doc.accessLimit === 'number' && doc.accessLimit > 0 && (doc.accessCount || 0) >= doc.accessLimit) {
    return 'expired';
  }
  return 'active';
}

function sanitizeSafeTargetUrl(url?: string): string | undefined {
  if (!url || typeof url !== 'string') return undefined;
  const trimmed = url.trim();
  // Never store raw `/s/<token>` secret URLs in share_events
  if (trimmed.includes('/s/')) return undefined;
  return trimmed.slice(0, 240);
}

/**
 * Reliable, deduplicated, retry-backed event persistence.
 * Never swallows errors silently: logs safely on the server and returns `{ recorded: false, error }`
 * so callers can preserve core sharing functionality while surfacing accurate recording status.
 */
export async function recordShareEventSafe(
  params: RecordShareEventParams
): Promise<RecordShareEventResult> {
  if (!params.ownerUserId || !params.profileId || !params.eventType) {
    const err = 'Missing required fields (ownerUserId, profileId, or eventType) for share event.';
    console.error('[shareEvents] Validation failure:', {
      hasOwner: Boolean(params.ownerUserId),
      hasProfile: Boolean(params.profileId),
      eventType: params.eventType
    });
    return { recorded: false, error: err };
  }

  const maxAttempts = 3;
  let lastErrorMessage = 'Unknown persistence error';

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await lazyEnsureIndexes();
      const db = await getMongoDb();
      const col = db.collection(COLLECTIONS.SHARE_EVENTS);

      if (params.dedupKey) {
        const existing = await col.findOne({ dedupKey: params.dedupKey });
        if (existing) {
          return {
            recorded: true,
            deduplicated: true,
            event: mapDocToShareEvent(existing)
          };
        }
      }

      const id = `se-${crypto.randomUUID()}`;
      const now = new Date().toISOString();
      const actorType = params.actorType || resolveDefaultActorType(params.eventType);
      const targetType: ShareTargetType =
        params.targetType ||
        (params.shareLinkId && params.shareLinkId !== 'public_profile' ? 'share_link' : 'public_profile');
      const shareLinkId =
        params.shareLinkId && params.shareLinkId.trim()
          ? params.shareLinkId.trim()
          : 'public_profile';

      const doc: Record<string, any> = {
        _id: id,
        id,
        shareLinkId,
        ownerUserId: params.ownerUserId,
        profileId: params.profileId,
        eventType: params.eventType,
        actorType,
        targetType,
        timestamp: now
      };

      if (params.channel) doc.channel = String(params.channel).slice(0, 40);
      if (params.dedupKey) doc.dedupKey = params.dedupKey;
      const safeUrl = sanitizeSafeTargetUrl(params.targetUrl);
      if (safeUrl) doc.targetUrl = safeUrl;
      if (Array.isArray(params.selectedFields)) {
        doc.selectedFields = params.selectedFields.slice(0, 100);
        doc.selectedFieldsCount =
          typeof params.selectedFieldsCount === 'number'
            ? params.selectedFieldsCount
            : params.selectedFields.length;
      } else if (typeof params.selectedFieldsCount === 'number') {
        doc.selectedFieldsCount = params.selectedFieldsCount;
      }
      if (Array.isArray(params.recipientNames) && params.recipientNames.length > 0) {
        doc.recipientNames = params.recipientNames
          .map((n) => String(n || '').trim().slice(0, 100))
          .filter(Boolean)
          .slice(0, 25);
      }
      if (params.profileName) doc.profileName = String(params.profileName).slice(0, 120);
      if (params.profileSlug) doc.profileSlug = String(params.profileSlug).slice(0, 120);
      if (params.metadata && typeof params.metadata === 'object') {
        doc.metadata = params.metadata;
      }

      await col.insertOne(doc);
      return {
        recorded: true,
        deduplicated: false,
        event: mapDocToShareEvent(doc)
      };
    } catch (err: unknown) {
      const mongoErr = err as { code?: number; message?: string };
      // Duplicate key race on dedupKey -> treat as deduplicated success
      if (mongoErr?.code === 11000 && params.dedupKey) {
        try {
          const db = await getMongoDb();
          const existing = await db.collection(COLLECTIONS.SHARE_EVENTS).findOne({ dedupKey: params.dedupKey });
          if (existing) {
            return { recorded: true, deduplicated: true, event: mapDocToShareEvent(existing) };
          }
        } catch {
          // Fall through to retry/error
        }
      }

      lastErrorMessage = err instanceof Error ? err.message : String(err);
      console.error('[shareEvents] Persistence attempt failed:', {
        attempt,
        maxAttempts,
        eventType: params.eventType,
        profileId: params.profileId,
        shareLinkId: params.shareLinkId || 'public_profile',
        error: lastErrorMessage
      });

      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 40 * attempt));
      }
    }
  }

  return {
    recorded: false,
    error: lastErrorMessage
  };
}

export async function recordShareEvent(params: RecordShareEventParams): Promise<ShareEventRecord> {
  const res = await recordShareEventSafe(params);
  if (!res.recorded || !res.event) {
    throw new Error(res.error || 'Failed to persist share event.');
  }
  return res.event;
}

export async function hasRecentDedupEvent(dedupKey: string): Promise<boolean> {
  if (!dedupKey) return false;
  await lazyEnsureIndexes();
  const db = await getMongoDb();
  const existing = await db.collection(COLLECTIONS.SHARE_EVENTS).findOne({ dedupKey });
  return Boolean(existing);
}

export async function listEventsForShareLink(
  shareLinkId: string,
  ownerUserId: string,
  limit: number = 50
): Promise<ShareEventRecord[]> {
  if (!shareLinkId || !ownerUserId) return [];
  await lazyEnsureIndexes();
  const db = await getMongoDb();

  const docs = await db
    .collection(COLLECTIONS.SHARE_EVENTS)
    .find({ shareLinkId, ownerUserId })
    .sort({ timestamp: -1 })
    .limit(Math.min(Math.max(limit, 1), 100))
    .toArray();

  return docs.map(mapDocToShareEvent);
}

export interface ShareHistoryQueryOptions {
  profileId?: string;
  eventType?: string;
  channel?: string;
  status?: string;
  actorType?: string;
  from?: string;
  to?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export async function queryShareHistoryForOwner(
  ownerUserId: string,
  options: ShareHistoryQueryOptions = {}
): Promise<ShareHistoryResponse> {
  const page = Math.max(1, Number(options.page || 1) || 1);
  const limit = Math.min(100, Math.max(1, Number(options.limit || 20) || 20));

  if (!ownerUserId) {
    return {
      success: false,
      items: [],
      total: 0,
      page,
      limit,
      totalPages: 1,
      profiles: []
    };
  }

  await lazyEnsureIndexes();
  const db = await getMongoDb();

  const [ownedProfiles, linkDocs] = await Promise.all([
    getProfilesByUserId(ownerUserId),
    db
      .collection(COLLECTIONS.SHARE_LINKS)
      .find({ ownerUserId }, { projection: { tokenHash: 0, encryptedToken: 0 } })
      .toArray()
  ]);

  const profileById = new Map<string, { id: string; name: string; identifier: string }>();
  for (const p of ownedProfiles) {
    const info = {
      id: p.id,
      name: p.profileName || p.name || 'Digital Profile',
      identifier: p.slug || p.id
    };
    profileById.set(p.id, info);
    if (p.slug) profileById.set(p.slug, info);
  }

  const linkById = new Map<string, any>();
  for (const l of linkDocs) {
    linkById.set(String(l.id || l._id), l);
  }

  const eventQuery: Record<string, any> = { ownerUserId };
  if (options.profileId && options.profileId !== 'all') {
    const matchedProfile = profileById.get(options.profileId);
    eventQuery.profileId = matchedProfile ? matchedProfile.id : options.profileId;
  }
  if (options.eventType && options.eventType !== 'all') {
    eventQuery.eventType = options.eventType;
  }
  if (options.channel && options.channel !== 'all') {
    eventQuery.channel = options.channel;
  }

  const rawEvents = await db
    .collection(COLLECTIONS.SHARE_EVENTS)
    .find(eventQuery)
    .sort({ timestamp: -1 })
    .limit(1000)
    .toArray();

  const fromMs = options.from ? new Date(options.from).getTime() : null;
  let toMs: number | null = null;
  if (options.to) {
    const parsedTo = new Date(options.to);
    if (!Number.isNaN(parsedTo.getTime())) {
      // Include full end day if date-only string YYYY-MM-DD was provided
      if (/^\d{4}-\d{2}-\d{2}$/.test(options.to.trim())) {
        parsedTo.setUTCHours(23, 59, 59, 999);
      }
      toMs = parsedTo.getTime();
    }
  }

  const now = new Date();
  const mapped: ShareHistoryItem[] = rawEvents.map((doc) => {
    const ev = mapDocToShareEvent(doc);
    const link = ev.shareLinkId && ev.shareLinkId !== 'public_profile' ? linkById.get(ev.shareLinkId) : null;
    const profileMeta = profileById.get(ev.profileId);

    const profileName =
      profileMeta?.name ||
      link?.profileName ||
      ev.profileName ||
      'Deleted or Unknown Profile';
    const profileIdentifier =
      profileMeta?.identifier ||
      link?.profileSlug ||
      ev.profileSlug ||
      ev.profileId;

    const accessStatus: ShareLinkStatus | 'public' = link
      ? computeStatusFromDoc(link, now)
      : 'public';

    const selectedFields: string[] =
      Array.isArray(ev.selectedFields) && ev.selectedFields.length > 0
        ? ev.selectedFields
        : Array.isArray(link?.selectedFields)
          ? link.selectedFields
          : [];

    const selectedFieldsCount =
      typeof ev.selectedFieldsCount === 'number'
        ? ev.selectedFieldsCount
        : selectedFields.length;

    const recipientNames: string[] =
      Array.isArray(ev.recipientNames) && ev.recipientNames.length > 0
        ? ev.recipientNames
        : Array.isArray(link?.recipients)
          ? link.recipients
              .map((r: any) => (r?.name ? String(r.name).trim() : ''))
              .filter(Boolean)
          : [];

    return {
      id: ev.id,
      eventType: ev.eventType,
      actorType: ev.actorType || resolveDefaultActorType(ev.eventType),
      targetType: link ? 'share_link' : (ev.targetType || 'public_profile'),
      timestamp: ev.timestamp,
      channel: ev.channel || link?.shareChannel || (ev.eventType === 'qr_opened' || ev.eventType === 'qr_generated' ? 'qr' : ev.eventType === 'nfc_opened' || ev.eventType === 'nfc_shared' ? 'nfc' : 'link'),
      profileId: ev.profileId,
      profileName,
      profileIdentifier,
      shareLinkId: link ? String(link.id || link._id) : null,
      linkTitle: link ? String(link.title || 'Untitled link') : null,
      tokenHint: link?.tokenHint || undefined,
      accessStatus,
      selectedFields,
      selectedFieldsCount,
      recipientNames,
      viewCount: link ? Number(link.accessCount || 0) : null,
      lastAccessedAt: link?.lastAccessedAt
        ? link.lastAccessedAt instanceof Date
          ? link.lastAccessedAt.toISOString()
          : String(link.lastAccessedAt)
        : null,
      targetUrl: ev.targetUrl || (!link && profileIdentifier ? `/profile/${profileIdentifier}` : undefined),
      eventLabel: link?.eventLabel || undefined
    };
  });

  const searchLower = options.search?.trim().toLowerCase() || '';
  const filtered = mapped.filter((item) => {
    if (options.actorType && options.actorType !== 'all' && item.actorType !== options.actorType) {
      return false;
    }
    if (options.status && options.status !== 'all' && item.accessStatus !== options.status) {
      return false;
    }
    const tsMs = new Date(item.timestamp).getTime();
    if (fromMs !== null && !Number.isNaN(fromMs) && tsMs < fromMs) {
      return false;
    }
    if (toMs !== null && !Number.isNaN(toMs) && tsMs > toMs) {
      return false;
    }
    if (searchLower) {
      const haystacks = [
        item.profileName,
        item.profileIdentifier,
        item.linkTitle || '',
        item.channel,
        item.eventType,
        item.eventLabel || '',
        ...item.recipientNames
      ];
      if (!haystacks.some((h) => h.toLowerCase().includes(searchLower))) {
        return false;
      }
    }
    return true;
  });

  // Sort newest first deterministically
  filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * limit;
  const items = filtered.slice(start, start + limit);

  const uniqueProfiles = ownedProfiles.map((p) => ({
    id: p.id,
    name: p.profileName || p.name || 'Digital Profile',
    identifier: p.slug || p.id
  }));

  return {
    success: true,
    items,
    total,
    page: safePage,
    limit,
    totalPages,
    profiles: uniqueProfiles
  };
}
