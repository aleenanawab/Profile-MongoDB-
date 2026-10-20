import { UserConnection } from '@/types/profile';
import { getMongoDb, COLLECTIONS } from './client';
import { lazyEnsureIndexes } from './indexes';
import { getProfileByIdOrSlug } from './profiles';

function mapDocToConnection(doc: any): UserConnection {
  return {
    id: String(doc._id || doc.id),
    fromUserId: String(doc.fromUserId),
    fromUserName: doc.fromUserName || '',
    fromUserEmail: doc.fromUserEmail || '',
    toProfileId: String(doc.toProfileId),
    toUserId: doc.toUserId ? String(doc.toUserId) : undefined,
    createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : (doc.createdAt || new Date().toISOString()),
    note: doc.note || undefined
  };
}

export async function createConnection(data: {
  fromUserId: string;
  fromUserName: string;
  fromUserEmail: string;
  toProfileId: string;
  note?: string;
}): Promise<{ success: boolean; connection?: UserConnection; error?: string; status: number }> {
  if (!data.fromUserId) {
    return { success: false, error: 'Unauthorized: Session required.', status: 401 };
  }

  const targetProfile = await getProfileByIdOrSlug(data.toProfileId);
  if (!targetProfile) {
    return { success: false, error: 'Target profile not found.', status: 404 };
  }

  // Prevent connecting to own profile
  if (targetProfile.userId && targetProfile.userId === data.fromUserId) {
    return { success: false, error: 'You cannot connect with your own profile.', status: 400 };
  }

  await lazyEnsureIndexes();
  const db = await getMongoDb();
  const connectionsCol = db.collection(COLLECTIONS.CONNECTIONS);

  // Check if connection already exists
  const existing = await connectionsCol.findOne({
    fromUserId: data.fromUserId,
    $or: [{ toProfileId: targetProfile.id }, { toProfileId: targetProfile.slug }]
  });

  if (existing) {
    return { success: true, connection: mapDocToConnection(existing), status: 200 };
  }

  const connId = `conn-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const newConnDoc: any = {
    _id: connId,
    id: connId,
    fromUserId: data.fromUserId,
    fromUserName: data.fromUserName,
    fromUserEmail: data.fromUserEmail,
    toProfileId: targetProfile.id,
    toUserId: targetProfile.userId,
    createdAt: now,
    note: data.note?.trim()
  };

  await connectionsCol.insertOne(newConnDoc);
  return { success: true, connection: mapDocToConnection(newConnDoc), status: 201 };
}

export async function checkIsConnected(fromUserId: string, toProfileId: string): Promise<boolean> {
  if (!fromUserId || !toProfileId) return false;

  await lazyEnsureIndexes();
  const db = await getMongoDb();
  const target = await getProfileByIdOrSlug(toProfileId);
  const targetId = target ? target.id : toProfileId;
  const targetSlug = target ? target.slug : toProfileId;

  const doc = await db.collection(COLLECTIONS.CONNECTIONS).findOne({
    fromUserId,
    $or: [{ toProfileId: targetId }, { toProfileId: targetSlug }]
  });

  return Boolean(doc);
}

export async function getUserConnections(userId: string): Promise<UserConnection[]> {
  if (!userId) return [];

  await lazyEnsureIndexes();
  const db = await getMongoDb();
  const docs = await db.collection(COLLECTIONS.CONNECTIONS).find({
    $or: [{ fromUserId: userId }, { toUserId: userId }]
  }).toArray();

  return docs.map(mapDocToConnection);
}
