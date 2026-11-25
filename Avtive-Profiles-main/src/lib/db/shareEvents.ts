import crypto from 'crypto';
import { ShareEventRecord, ShareEventType } from '@/types/sharing';
import { getMongoDb, COLLECTIONS } from './client';
import { lazyEnsureIndexes } from './indexes';

function mapDocToShareEvent(doc: any): ShareEventRecord {
  return {
    id: String(doc.id || doc._id),
    shareLinkId: String(doc.shareLinkId),
    ownerUserId: String(doc.ownerUserId),
    profileId: String(doc.profileId),
    eventType: doc.eventType as ShareEventType,
    timestamp: doc.timestamp instanceof Date ? doc.timestamp.toISOString() : String(doc.timestamp || new Date().toISOString()),
    channel: doc.channel || undefined
  };
}

export async function recordShareEvent(params: {
  shareLinkId: string;
  ownerUserId: string;
  profileId: string;
  eventType: ShareEventType;
  channel?: string;
  dedupKey?: string;
}): Promise<ShareEventRecord> {
  await lazyEnsureIndexes();
  const db = await getMongoDb();
  const col = db.collection(COLLECTIONS.SHARE_EVENTS);

  const id = `se-${crypto.randomUUID()}`;
  const now = new Date().toISOString();

  const doc: Record<string, any> = {
    _id: id,
    id,
    shareLinkId: params.shareLinkId,
    ownerUserId: params.ownerUserId,
    profileId: params.profileId,
    eventType: params.eventType,
    timestamp: now
  };

  if (params.channel) doc.channel = params.channel;
  if (params.dedupKey) doc.dedupKey = params.dedupKey;

  await col.insertOne(doc);
  return mapDocToShareEvent(doc);
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
