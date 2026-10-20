import { MongoClient, Db, IndexDescription, Collection } from 'mongodb';

/**
 * Server-only MongoDB Client and Database Accessor
 * ------------------------------------------------
 * Hard rules:
 * - Read MONGODB_URI and MONGODB_DB_NAME server-side only.
 * - If missing, throw a safe error naming the variable without printing any value.
 * - Cache MongoClient in globalThis during dev (HMR protection) and module singleton in prod.
 * - Keep string IDs as _id (no ObjectId conversion).
 */

if (typeof window !== 'undefined') {
  throw new Error('src/lib/mongodb.ts is server-only and cannot be imported in the browser.');
}

export const COLLECTIONS = {
  USERS: 'users',
  PROFILES: 'profiles',
  COMPANIES: 'companies',
  COMPANY_MEMBERS: 'company_members',
  CONNECTIONS: 'connections'
} as const;

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];

export function getMongoUri(): string {
  const uri = process.env.MONGODB_URI;
  if (!uri || !uri.trim()) {
    throw new Error('Missing required environment variable: MONGODB_URI');
  }
  return uri.trim();
}

export function getMongoDbName(): string {
  const dbName = process.env.MONGODB_DB_NAME;
  if (!dbName || !dbName.trim()) {
    throw new Error('Missing required environment variable: MONGODB_DB_NAME');
  }
  return dbName.trim();
}

let clientPromise: Promise<MongoClient> | null = null;

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

export function getMongoClientPromise(): Promise<MongoClient> {
  const uri = getMongoUri();

  if (process.env.NODE_ENV === 'development') {
    if (!global._mongoClientPromise) {
      const client = new MongoClient(uri);
      global._mongoClientPromise = client.connect();
    }
    return global._mongoClientPromise;
  }

  if (!clientPromise) {
    const client = new MongoClient(uri);
    clientPromise = client.connect();
  }
  return clientPromise;
}

export async function getMongoClient(): Promise<MongoClient> {
  return getMongoClientPromise();
}

export async function getMongoDb(dbNameOverride?: string): Promise<Db> {
  const client = await getMongoClientPromise();
  const dbName = dbNameOverride || getMongoDbName();
  return client.db(dbName);
}

export interface IndexConflict {
  collection: string;
  field: string;
  conflictCount: number;
  conflicts: Array<{ value: unknown; ids: string[]; count: number }>;
}

export interface EnsureIndexesResult {
  success: boolean;
  indexesCreated: string[];
  indexesExisting: string[];
  conflicts: IndexConflict[];
}

/**
 * Server-only index verification and creation:
 * First scans collection data for duplicate conflicts on target unique keys.
 * If conflicts exist, does NOT alter data and returns the conflict report.
 * If no conflicts, creates the unique and auxiliary query indexes.
 */
export async function ensureIndexes(dbInstance?: Db): Promise<EnsureIndexesResult> {
  const db = dbInstance || (await getMongoDb());

  const result: EnsureIndexesResult = {
    success: true,
    indexesCreated: [],
    indexesExisting: [],
    conflicts: []
  };

  const usersCol = db.collection(COLLECTIONS.USERS);
  const profilesCol = db.collection(COLLECTIONS.PROFILES);
  const companiesCol = db.collection(COLLECTIONS.COMPANIES);
  const membersCol = db.collection(COLLECTIONS.COMPANY_MEMBERS);
  const connectionsCol = db.collection(COLLECTIONS.CONNECTIONS);

  // Helper to check existing index by name
  async function hasIndex(col: Collection, name: string): Promise<boolean> {
    try {
      const idxs: IndexDescription[] = await col.indexes();
      return idxs.some((i) => i.name === name);
    } catch {
      return false;
    }
  }

  // 1. Scan and index: users.email (unique)
  try {
    const emailDuplicates = await usersCol
      .aggregate<{ _id: string; count: number; ids: string[] }>([
        { $match: { email: { $exists: true, $ne: null } } },
        {
          $group: {
            _id: { $toLower: { $trim: { input: '$email' } } },
            count: { $sum: 1 },
            ids: { $push: '$_id' }
          }
        },
        { $match: { count: { $gt: 1 } } }
      ])
      .toArray();

    if (emailDuplicates.length > 0) {
      result.conflicts.push({
        collection: COLLECTIONS.USERS,
        field: 'email',
        conflictCount: emailDuplicates.length,
        conflicts: emailDuplicates.map((d) => ({
          value: '[REDACTED_EMAIL]',
          ids: d.ids,
          count: d.count
        }))
      });
      result.success = false;
    } else {
      const idxName = 'uniq_users_email';
      if (await hasIndex(usersCol, idxName)) {
        result.indexesExisting.push(`${COLLECTIONS.USERS}.${idxName}`);
      } else {
        await usersCol.createIndex({ email: 1 }, { unique: true, name: idxName });
        result.indexesCreated.push(`${COLLECTIONS.USERS}.${idxName}`);
      }
    }
  } catch (err: any) {
    console.error('Error scanning users email index:', err?.message || err);
  }

  // 2. Scan and index: profiles.slug (unique) & profiles.userId (index)
  try {
    const slugDuplicates = await profilesCol
      .aggregate<{ _id: string; count: number; ids: string[] }>([
        { $match: { slug: { $exists: true, $ne: null } } },
        {
          $group: {
            _id: { $toLower: { $trim: { input: '$slug' } } },
            count: { $sum: 1 },
            ids: { $push: '$_id' }
          }
        },
        { $match: { count: { $gt: 1 } } }
      ])
      .toArray();

    if (slugDuplicates.length > 0) {
      result.conflicts.push({
        collection: COLLECTIONS.PROFILES,
        field: 'slug',
        conflictCount: slugDuplicates.length,
        conflicts: slugDuplicates.map((d) => ({
          value: d._id,
          ids: d.ids,
          count: d.count
        }))
      });
      result.success = false;
    } else {
      const idxName = 'uniq_profiles_slug';
      if (await hasIndex(profilesCol, idxName)) {
        result.indexesExisting.push(`${COLLECTIONS.PROFILES}.${idxName}`);
      } else {
        await profilesCol.createIndex({ slug: 1 }, { unique: true, name: idxName });
        result.indexesCreated.push(`${COLLECTIONS.PROFILES}.${idxName}`);
      }
    }

    // Auxiliary index: profiles.userId
    const userIdxName = 'idx_profiles_userId';
    if (await hasIndex(profilesCol, userIdxName)) {
      result.indexesExisting.push(`${COLLECTIONS.PROFILES}.${userIdxName}`);
    } else {
      await profilesCol.createIndex({ userId: 1 }, { name: userIdxName });
      result.indexesCreated.push(`${COLLECTIONS.PROFILES}.${userIdxName}`);
    }
  } catch (err: any) {
    console.error('Error scanning profiles indexes:', err?.message || err);
  }

  // 3. Scan and index: companies.slug (unique) & companies.ownerUserId (index)
  try {
    const companySlugDuplicates = await companiesCol
      .aggregate<{ _id: string; count: number; ids: string[] }>([
        { $match: { slug: { $exists: true, $ne: null } } },
        {
          $group: {
            _id: { $toLower: { $trim: { input: '$slug' } } },
            count: { $sum: 1 },
            ids: { $push: '$_id' }
          }
        },
        { $match: { count: { $gt: 1 } } }
      ])
      .toArray();

    if (companySlugDuplicates.length > 0) {
      result.conflicts.push({
        collection: COLLECTIONS.COMPANIES,
        field: 'slug',
        conflictCount: companySlugDuplicates.length,
        conflicts: companySlugDuplicates.map((d) => ({
          value: d._id,
          ids: d.ids,
          count: d.count
        }))
      });
      result.success = false;
    } else {
      const idxName = 'uniq_companies_slug';
      if (await hasIndex(companiesCol, idxName)) {
        result.indexesExisting.push(`${COLLECTIONS.COMPANIES}.${idxName}`);
      } else {
        await companiesCol.createIndex({ slug: 1 }, { unique: true, name: idxName });
        result.indexesCreated.push(`${COLLECTIONS.COMPANIES}.${idxName}`);
      }
    }

    // Auxiliary index: companies.ownerUserId
    const ownerIdxName = 'idx_companies_ownerUserId';
    if (await hasIndex(companiesCol, ownerIdxName)) {
      result.indexesExisting.push(`${COLLECTIONS.COMPANIES}.${ownerIdxName}`);
    } else {
      await companiesCol.createIndex({ ownerUserId: 1 }, { name: ownerIdxName });
      result.indexesCreated.push(`${COLLECTIONS.COMPANIES}.${ownerIdxName}`);
    }
  } catch (err: any) {
    console.error('Error scanning companies indexes:', err?.message || err);
  }

  // 4. Scan and index: company_members (companyId, email unique)
  try {
    const memberDuplicates = await membersCol
      .aggregate<{ _id: { companyId: string; email: string }; count: number; ids: string[] }>([
        { $match: { companyId: { $exists: true }, email: { $exists: true } } },
        {
          $group: {
            _id: {
              companyId: '$companyId',
              email: { $toLower: { $trim: { input: '$email' } } }
            },
            count: { $sum: 1 },
            ids: { $push: '$_id' }
          }
        },
        { $match: { count: { $gt: 1 } } }
      ])
      .toArray();

    if (memberDuplicates.length > 0) {
      result.conflicts.push({
        collection: COLLECTIONS.COMPANY_MEMBERS,
        field: 'companyId + email',
        conflictCount: memberDuplicates.length,
        conflicts: memberDuplicates.map((d) => ({
          value: { companyId: d._id.companyId, email: '[REDACTED_EMAIL]' },
          ids: d.ids,
          count: d.count
        }))
      });
      result.success = false;
    } else {
      const idxName = 'uniq_company_members_company_email';
      if (await hasIndex(membersCol, idxName)) {
        result.indexesExisting.push(`${COLLECTIONS.COMPANY_MEMBERS}.${idxName}`);
      } else {
        await membersCol.createIndex({ companyId: 1, email: 1 }, { unique: true, name: idxName });
        result.indexesCreated.push(`${COLLECTIONS.COMPANY_MEMBERS}.${idxName}`);
      }
    }

    // Auxiliary indexes
    const compIdxName = 'idx_company_members_companyId';
    if (await hasIndex(membersCol, compIdxName)) {
      result.indexesExisting.push(`${COLLECTIONS.COMPANY_MEMBERS}.${compIdxName}`);
    } else {
      await membersCol.createIndex({ companyId: 1 }, { name: compIdxName });
      result.indexesCreated.push(`${COLLECTIONS.COMPANY_MEMBERS}.${compIdxName}`);
    }

    const memberUserIdxName = 'idx_company_members_userId';
    if (await hasIndex(membersCol, memberUserIdxName)) {
      result.indexesExisting.push(`${COLLECTIONS.COMPANY_MEMBERS}.${memberUserIdxName}`);
    } else {
      await membersCol.createIndex({ userId: 1 }, { name: memberUserIdxName, sparse: true });
      result.indexesCreated.push(`${COLLECTIONS.COMPANY_MEMBERS}.${memberUserIdxName}`);
    }
  } catch (err: any) {
    console.error('Error scanning company_members indexes:', err?.message || err);
  }

  // 5. Connections indexes
  try {
    const fromIdxName = 'idx_connections_fromUserId';
    if (await hasIndex(connectionsCol, fromIdxName)) {
      result.indexesExisting.push(`${COLLECTIONS.CONNECTIONS}.${fromIdxName}`);
    } else {
      await connectionsCol.createIndex({ fromUserId: 1 }, { name: fromIdxName });
      result.indexesCreated.push(`${COLLECTIONS.CONNECTIONS}.${fromIdxName}`);
    }

    const toIdxName = 'idx_connections_toProfileId';
    if (await hasIndex(connectionsCol, toIdxName)) {
      result.indexesExisting.push(`${COLLECTIONS.CONNECTIONS}.${toIdxName}`);
    } else {
      await connectionsCol.createIndex({ toProfileId: 1 }, { name: toIdxName });
      result.indexesCreated.push(`${COLLECTIONS.CONNECTIONS}.${toIdxName}`);
    }
  } catch (err: any) {
    console.error('Error creating connections indexes:', err?.message || err);
  }

  return result;
}
