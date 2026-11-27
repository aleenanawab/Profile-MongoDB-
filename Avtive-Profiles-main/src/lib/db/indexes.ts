import { Db, IndexDescription, Collection, CreateIndexesOptions } from 'mongodb';
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
  const shareLinksCol = db.collection(COLLECTIONS.SHARE_LINKS);
  const shareTemplatesCol = db.collection(COLLECTIONS.SHARE_TEMPLATES);
  const shareEventsCol = db.collection(COLLECTIONS.SHARE_EVENTS);
  const contactTagsCol = db.collection(COLLECTIONS.CONTACT_TAGS);
  const contactTagLinksCol = db.collection(COLLECTIONS.CONTACT_TAG_LINKS);

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
    partialFilterExpression?: Record<string, unknown>
  ) {
    try {
      if (await hasIndex(col, name)) {
        result.indexesExisting.push(`${colName}.${name}`);
        return;
      }
      const indexOpts: CreateIndexesOptions = { name, unique, background: true };
      if (partialFilterExpression) {
        indexOpts.partialFilterExpression = partialFilterExpression;
      } else if (sparse) {
        indexOpts.sparse = true;
      }
      await col.createIndex(key, indexOpts);
      result.indexesCreated.push(`${colName}.${name}`);
    } catch (err: unknown) {
      const mongoErr = err as { code?: number; codeName?: string; message?: string };
      if (mongoErr.code === 11000 || mongoErr.codeName === 'DuplicateKey') {
        result.conflicts.push({
          collection: colName,
          field: name,
          conflictCount: 1,
          conflicts: [{ value: 'Duplicate key during index build', ids: [], count: 1 }]
        });
        result.success = false;
      } else {
        console.warn(`[ensureIndexes] Warning creating ${colName}.${name}:`, mongoErr?.message || String(err));
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

  // 7. Share Links
  await safeCreateIndex(
    shareLinksCol,
    COLLECTIONS.SHARE_LINKS,
    { tokenHash: 1 },
    'idx_share_links_token_hash_unique',
    true
  );
  await safeCreateIndex(
    shareLinksCol,
    COLLECTIONS.SHARE_LINKS,
    { ownerUserId: 1, createdAt: -1 },
    'idx_share_links_owner_created',
    false
  );
  await safeCreateIndex(
    shareLinksCol,
    COLLECTIONS.SHARE_LINKS,
    { profileId: 1 },
    'idx_share_links_profile_id',
    false
  );
  await safeCreateIndex(
    shareLinksCol,
    COLLECTIONS.SHARE_LINKS,
    { expiresAt: 1 },
    'idx_share_links_expires_at',
    false
  );

  // 8. Share Templates
  await safeCreateIndex(
    shareTemplatesCol,
    COLLECTIONS.SHARE_TEMPLATES,
    { ownerUserId: 1, updatedAt: -1 },
    'idx_share_templates_owner_updated',
    false
  );

  // 9. Share Events
  await safeCreateIndex(
    shareEventsCol,
    COLLECTIONS.SHARE_EVENTS,
    { shareLinkId: 1, timestamp: -1 },
    'idx_share_events_link_time',
    false
  );
  await safeCreateIndex(
    shareEventsCol,
    COLLECTIONS.SHARE_EVENTS,
    { ownerUserId: 1, timestamp: -1 },
    'idx_share_events_owner_time',
    false
  );
  await safeCreateIndex(
    shareEventsCol,
    COLLECTIONS.SHARE_EVENTS,
    { ownerUserId: 1, profileId: 1, timestamp: -1 },
    'idx_share_events_owner_profile_time',
    false
  );
  await safeCreateIndex(
    shareEventsCol,
    COLLECTIONS.SHARE_EVENTS,
    { ownerUserId: 1, eventType: 1, timestamp: -1 },
    'idx_share_events_owner_type_time',
    false
  );
  await safeCreateIndex(
    shareEventsCol,
    COLLECTIONS.SHARE_EVENTS,
    { dedupKey: 1 },
    'idx_share_events_dedup_key',
    false,
    true
  );

  // 10. Owner-scoped Contact Tags & Recipient Tag Links
  await safeCreateIndex(
    contactTagsCol,
    COLLECTIONS.CONTACT_TAGS,
    { ownerUserId: 1, normalizedName: 1 },
    'idx_contact_tags_owner_name_unique',
    true
  );
  await safeCreateIndex(
    contactTagLinksCol,
    COLLECTIONS.CONTACT_TAG_LINKS,
    { ownerUserId: 1, recipientId: 1 },
    'idx_contact_tag_links_owner_recipient_unique',
    true
  );

  indexesEnsured = true;
  return result;
}

let indexesPromise: Promise<void> | null = null;

/**
 * Called before every DB operation. Connection errors propagate (once) so the
 * request fails fast with a single timeout; index-creation problems never block
 * a request, and a failed attempt is retried on a later request instead of being
 * marked as done.
 */
export async function lazyEnsureIndexes(): Promise<void> {
  if (indexesEnsured) return;

  // Connect first: if Atlas is unreachable, fail here (one timeout), not twice.
  await getMongoDb();

  if (!indexesPromise) {
    indexesPromise = ensureIndexes()
      .then(() => undefined)
      .catch((err: unknown) => {
        console.warn('[lazyEnsureIndexes] Index setup failed, will retry:', err instanceof Error ? err.message : String(err));
        indexesPromise = null;
      });
  }
  await indexesPromise;
}
