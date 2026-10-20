import { Db, IndexDescription, Collection } from 'mongodb';
import { getMongoDb, COLLECTIONS } from './client';

let indexesEnsured = false;

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

export async function ensureIndexes(dbInstance?: Db, force: boolean = false): Promise<EnsureIndexesResult> {
  if (indexesEnsured && !force) {
    return { success: true, indexesCreated: [], indexesExisting: ['cached'], conflicts: [] };
  }

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

  // If old unique index on userId was created, drop it so users can own both individual and company profiles
  try {
    const pIdxs = await profilesCol.indexes();
    if (pIdxs.some((i) => i.name === 'idx_profiles_userId_unique')) {
      await profilesCol.dropIndex('idx_profiles_userId_unique');
    }
  } catch {}

  // If old googleSub index was sparse without partialFilterExpression, upgrade it to prevent null collision
  try {
    const uIdxs = await usersCol.indexes();
    const gIdx = uIdxs.find((i) => i.name === 'idx_users_google_sub_unique');
    if (gIdx && !(gIdx as any).partialFilterExpression) {
      await usersCol.dropIndex('idx_users_google_sub_unique');
    }
  } catch {}

  async function hasIndex(col: Collection, name: string): Promise<boolean> {
    try {
      const idxs: IndexDescription[] = await col.indexes();
      return idxs.some((i) => i.name === name);
    } catch {
      return false;
    }
  }

  async function safeCreateIndex(
    col: Collection,
    colName: string,
    key: Record<string, 1 | -1>,
    name: string,
    unique: boolean = false,
    sparse: boolean = false,
    partialFilterExpression?: Record<string, any>
  ) {
    try {
      if (await hasIndex(col, name)) {
        result.indexesExisting.push(`${colName}.${name}`);
        return;
      }
      const indexOpts: any = { name, unique, background: true };
      if (partialFilterExpression) {
        indexOpts.partialFilterExpression = partialFilterExpression;
      } else if (sparse) {
        indexOpts.sparse = true;
      }
      await col.createIndex(key as any, indexOpts);
      result.indexesCreated.push(`${colName}.${name}`);
    } catch (err: any) {
      if (err.code === 11000 || err.codeName === 'DuplicateKey') {
        result.conflicts.push({
          collection: colName,
          field: name,
          conflictCount: 1,
          conflicts: [{ value: 'Duplicate key during index build', ids: [], count: 1 }]
        });
        result.success = false;
      } else {
        console.warn(`[ensureIndexes] Warning creating ${colName}.${name}:`, err.message);
      }
    }
  }

  // 1. Users
  await safeCreateIndex(usersCol, COLLECTIONS.USERS, { email: 1 }, 'idx_users_email_unique', true);
  await safeCreateIndex(
    usersCol,
    COLLECTIONS.USERS,
    { googleSub: 1 },
    'idx_users_google_sub_unique',
    true,
    false,
    { googleSub: { $type: 'string' } }
  );

  // 2. Profiles (slug unique; userId indexed)
  await safeCreateIndex(profilesCol, COLLECTIONS.PROFILES, { slug: 1 }, 'idx_profiles_slug_unique', true);
  await safeCreateIndex(profilesCol, COLLECTIONS.PROFILES, { userId: 1 }, 'idx_profiles_user_id', false);

  // 3. Companies (slug unique; ownerUserId indexed)
  await safeCreateIndex(companiesCol, COLLECTIONS.COMPANIES, { slug: 1 }, 'idx_companies_slug_unique', true);
  await safeCreateIndex(companiesCol, COLLECTIONS.COMPANIES, { ownerUserId: 1 }, 'idx_companies_owner_user_id', false);

  // 4. Company Members
  await safeCreateIndex(
    membersCol,
    COLLECTIONS.COMPANY_MEMBERS,
    { companyId: 1, email: 1 },
    'idx_company_members_company_email_unique',
    true
  );
  await safeCreateIndex(membersCol, COLLECTIONS.COMPANY_MEMBERS, { userId: 1 }, 'idx_company_members_user_id', false);

  // 5. Connections
  await safeCreateIndex(
    connectionsCol,
    COLLECTIONS.CONNECTIONS,
    { fromUserId: 1, toProfileId: 1 },
    'idx_connections_user_profile',
    false
  );

  // 6. Sessions
  const sessionsCol = db.collection(COLLECTIONS.SESSIONS);
  await safeCreateIndex(
    sessionsCol,
    COLLECTIONS.SESSIONS,
    { tokenHash: 1 },
    'idx_sessions_token_hash',
    false
  );
  await safeCreateIndex(
    sessionsCol,
    COLLECTIONS.SESSIONS,
    { expiresAt: 1 },
    'idx_sessions_expires_at',
    false
  );

  indexesEnsured = true;
  return result;
}

let indexesPromise: Promise<EnsureIndexesResult> | null = null;

export async function lazyEnsureIndexes(): Promise<void> {
  if (indexesEnsured) {
    return;
  }

  if (indexesPromise) {
    try {
      await indexesPromise;
    } catch {
      // Non-blocking
    }
    return;
  }

  try {
    indexesPromise = ensureIndexes();
    await indexesPromise;
  } catch (err: any) {
    console.warn('[lazyEnsureIndexes] Failed to ensure indexes (non-blocking):', err?.message || err);
  } finally {
    // Prevent repeated index runs on failed or glitchy connection in this serverless instance
    indexesEnsured = true;
  }
}
