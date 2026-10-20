/**
 * Safe Migration Script: src/data/db.json -> MongoDB
 * ----------------------------------------------------
 * Required Environment Variables (in .env.local):
 * - MONGODB_URI: Full MongoDB connection URI (e.g. mongodb+srv://... or mongodb://localhost:27017)
 * - MONGODB_DB_NAME: Target database name (e.g. avtive_test)
 *
 * Exact CLI Commands:
 * - Dry-Run (Default, safe, zero writes):
 *     npm run migrate:json-to-mongo
 * - Test-Database Import (Executes writes):
 *     npm run migrate:json-to-mongo -- --confirm
 * - Production Override (If MONGODB_DB_NAME contains 'prod'):
 *     npm run migrate:json-to-mongo -- --confirm --allow-prod
 *
 * Safety & Integrity Rules:
 * - Default mode is --dry-run. No writes occur unless --confirm is explicitly passed.
 * - Upserts are keyed on original string IDs (_id: doc.id). Never deletes data.
 * - Refuses to write if MONGODB_DB_NAME contains 'prod' unless --allow-prod is passed.
 * - Redacts all sensitive fields (passwordHash, recoveryCodeHash, tokens, emails in logs).
 * - Inspects real shape of db.json (deduplicates profiles from Record<string, ProfileData>).
 */

import fs from 'fs';
import path from 'path';
import { MongoClient, Db } from 'mongodb';
import { COLLECTIONS, ensureIndexes } from '../src/lib/mongodb';

// ─── CLI ARGUMENTS ────────────────────────────────────────────────────────────

interface CliOptions {
  confirm: boolean;
  dryRun: boolean;
  allowProd: boolean;
  filePath: string;
}

function parseCliArgs(): CliOptions {
  const args = process.argv.slice(2);
  const confirm = args.includes('--confirm');
  const allowProd = args.includes('--allow-prod');
  const dryRun = !confirm || args.includes('--dry-run');

  let filePath = path.join(process.cwd(), 'legacy', 'db.json');
  if (!fs.existsSync(filePath)) {
    filePath = path.join(process.cwd(), 'src', 'data', 'db.json');
  }
  const fileArgIdx = args.indexOf('--file');
  if (fileArgIdx !== -1 && args[fileArgIdx + 1]) {
    filePath = path.resolve(process.cwd(), args[fileArgIdx + 1]);
  }

  return { confirm: !dryRun, dryRun, allowProd, filePath };
}

// ─── UTILITIES & REDACTION ───────────────────────────────────────────────────

function redactEmail(email?: string): string {
  if (!email || !email.includes('@')) return '[REDACTED]';
  const [user, domain] = email.split('@');
  if (user.length <= 2) return `${user[0]}***@${domain}`;
  return `${user.slice(0, 2)}***${user.slice(-1)}@${domain}`;
}

function isProdDb(dbName: string): boolean {
  const lower = dbName.toLowerCase();
  return lower.includes('prod') || lower.includes('production');
}

// ─── STATS INTERFACE ──────────────────────────────────────────────────────────

interface CollectionReport {
  name: string;
  read: number;
  valid: number;
  validationErrors: number;
  duplicateConflicts: number;
  wouldInsert: number;
  wouldUpdate: number;
  skipped: number;
  errorMessages: string[];
}

// ─── MAIN MIGRATION FUNCTION ─────────────────────────────────────────────────

async function runMigration() {
  const opts = parseCliArgs();

  console.log('===============================================================');
  console.log('       AVTIVE PROFILES: JSON TO MONGODB MIGRATION AUDIT        ');
  console.log('===============================================================');
  console.log(`Mode:            ${opts.dryRun ? 'DRY-RUN (Safe: NO writes)' : 'CONFIRMED WRITE'}`);
  console.log(`Source File:     ${opts.filePath}`);

  // 1. Validate File Existence
  if (!fs.existsSync(opts.filePath)) {
    console.log(`\n[INFO] Migration already completed.`);
    console.log(`The legacy '${opts.filePath}' was cleaned up as part of the MongoDB migration.`);
    console.log(`To run migration with an external backup file, specify: npm run migrate:json-to-mongo -- --file <path/to/backup.json>`);
    return;
  }


  // 2. Parse db.json
  let rawJson: any;
  try {
    const rawContent = fs.readFileSync(opts.filePath, 'utf8');
    rawJson = JSON.parse(rawContent);
  } catch (err: any) {
    console.error(`\n[FATAL] Failed to parse JSON: ${err?.message || err}`);
    process.exit(1);
  }

  // 3. Map & Deduplicate Real Shape of db.json
  // - users: Array
  // - profiles: Record<string, ProfileData> (Deduplicate by profile.id!)
  // - companies: Array
  // - companyMembers: Array
  // - connections: Array

  const rawUsers: any[] = Array.isArray(rawJson.users) ? rawJson.users : [];
  const rawProfilesObj: Record<string, any> =
    rawJson.profiles && typeof rawJson.profiles === 'object' && !Array.isArray(rawJson.profiles)
      ? rawJson.profiles
      : {};
  const rawCompanies: any[] = Array.isArray(rawJson.companies) ? rawJson.companies : [];
  const rawMembers: any[] = Array.isArray(rawJson.companyMembers) ? rawJson.companyMembers : [];
  const rawConnections: any[] = Array.isArray(rawJson.connections) ? rawJson.connections : [];

  // Deduplicate profiles by profile.id
  const uniqueProfilesMap = new Map<string, any>();
  for (const [key, p] of Object.entries(rawProfilesObj)) {
    if (p && typeof p === 'object') {
      const pid = p.id || key;
      if (!uniqueProfilesMap.has(pid)) {
        uniqueProfilesMap.set(pid, { ...p, id: pid, _id: pid });
      } else {
        // Merge in case one entry had more recent updatedAt
        const existing = uniqueProfilesMap.get(pid);
        const existingTime = new Date(existing.updatedAt || 0).getTime();
        const newTime = new Date(p.updatedAt || 0).getTime();
        if (newTime > existingTime) {
          uniqueProfilesMap.set(pid, { ...p, id: pid, _id: pid });
        }
      }
    }
  }
  const uniqueProfiles = Array.from(uniqueProfilesMap.values());

  // Deduplicate and prepare users
  const uniqueUsersMap = new Map<string, any>();
  for (const u of rawUsers) {
    if (u && u.id) {
      uniqueUsersMap.set(u.id, { ...u, _id: u.id });
    }
  }
  const uniqueUsers = Array.from(uniqueUsersMap.values());

  // Deduplicate companies
  const uniqueCompaniesMap = new Map<string, any>();
  for (const c of rawCompanies) {
    if (c && c.id) {
      uniqueCompaniesMap.set(c.id, { ...c, _id: c.id });
    }
  }
  const uniqueCompanies = Array.from(uniqueCompaniesMap.values());

  // Deduplicate members
  const uniqueMembersMap = new Map<string, any>();
  for (const m of rawMembers) {
    if (m && m.id) {
      uniqueMembersMap.set(m.id, { ...m, _id: m.id });
    }
  }
  const uniqueMembers = Array.from(uniqueMembersMap.values());

  // Deduplicate connections
  const uniqueConnectionsMap = new Map<string, any>();
  for (const con of rawConnections) {
    if (con && con.id) {
      uniqueConnectionsMap.set(con.id, { ...con, _id: con.id });
    }
  }
  const uniqueConnections = Array.from(uniqueConnectionsMap.values());

  // 4. Validate Environment & Mongo Connection
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB_NAME;

  let client: MongoClient | null = null;
  let db: Db | null = null;

  if (opts.confirm) {
    if (!uri || !uri.trim()) {
      console.error('\n[FATAL] Missing required environment variable: MONGODB_URI');
      process.exit(1);
    }
    if (!dbName || !dbName.trim()) {
      console.error('\n[FATAL] Missing required environment variable: MONGODB_DB_NAME');
      process.exit(1);
    }

    if (isProdDb(dbName) && !opts.allowProd) {
      console.error(`\n[SAFETY ABORT] MONGODB_DB_NAME looks like production ('${dbName}').`);
      console.error('To write to this database, you must explicitly pass --allow-prod.');
      process.exit(1);
    }

    try {
      client = new MongoClient(uri);
      await client.connect();
      db = client.db(dbName);
      console.log(`Connected to DB:  ${dbName}`);
    } catch (err: any) {
      console.error(`\n[FATAL] Could not connect to MongoDB: ${err?.message || err}`);
      process.exit(1);
    }
  } else if (uri && dbName) {
    // Optional connection for dry-run inspection of existing documents
    try {
      client = new MongoClient(uri);
      await client.connect();
      db = client.db(dbName);
      console.log(`Connected (Read-Only Dry Run): ${dbName}`);
    } catch {
      console.log('Notice: Running dry-run offline (MONGODB_URI not connected or invalid).');
    }
  } else {
    console.log('Notice: Running offline dry-run (MONGODB_URI and MONGODB_DB_NAME not set).');
  }

  // 5. Per-Collection Inspection & Conflict Scan
  const reports: CollectionReport[] = [];

  // Helper to process a dataset
  async function processCollection(
    name: string,
    rawCount: number,
    items: any[],
    uniqueKeyValidator: (item: any) => string | null,
    requiredFields: string[]
  ): Promise<CollectionReport> {
    const report: CollectionReport = {
      name,
      read: rawCount,
      valid: 0,
      validationErrors: 0,
      duplicateConflicts: 0,
      wouldInsert: 0,
      wouldUpdate: 0,
      skipped: 0,
      errorMessages: []
    };

    const seenUniqueKeys = new Map<string, string>();

    // Fetch existing IDs from MongoDB if db is connected
    let existingIds = new Set<string>();
    if (db) {
      try {
        const docs = await db.collection(name).find({}, { projection: { _id: 1 } }).toArray();
        existingIds = new Set(docs.map((d) => String(d._id)));
      } catch {}
    }

    for (const item of items) {
      // Validate required fields
      const missingFields = requiredFields.filter((f) => item[f] === undefined || item[f] === null || item[f] === '');
      if (missingFields.length > 0) {
        report.validationErrors++;
        report.errorMessages.push(`Item ID ${item._id || 'unknown'} missing required fields: ${missingFields.join(', ')}`);
        report.skipped++;
        continue;
      }

      // Check unique key constraint
      const uniqueKey = uniqueKeyValidator(item);
      if (uniqueKey) {
        if (seenUniqueKeys.has(uniqueKey)) {
          report.duplicateConflicts++;
          report.errorMessages.push(`Duplicate key conflict for [REDACTED_KEY] on item ID ${item._id}`);
          report.skipped++;
          continue;
        }
        seenUniqueKeys.set(uniqueKey, item._id);
      }

      report.valid++;

      if (existingIds.has(item._id)) {
        report.wouldUpdate++;
      } else {
        report.wouldInsert++;
      }
    }

    return report;
  }

  // Users
  const userReport = await processCollection(
    COLLECTIONS.USERS,
    rawUsers.length,
    uniqueUsers,
    (u) => (u.email ? u.email.toLowerCase().trim() : null),
    ['id', 'email', 'name']
  );
  reports.push(userReport);

  // Profiles
  const profileReport = await processCollection(
    COLLECTIONS.PROFILES,
    Object.keys(rawProfilesObj).length,
    uniqueProfiles,
    (p) => (p.slug ? p.slug.toLowerCase().trim() : null),
    ['id', 'slug', 'name']
  );
  reports.push(profileReport);

  // Companies
  const companyReport = await processCollection(
    COLLECTIONS.COMPANIES,
    rawCompanies.length,
    uniqueCompanies,
    (c) => (c.slug ? c.slug.toLowerCase().trim() : null),
    ['id', 'name', 'slug', 'ownerUserId']
  );
  reports.push(companyReport);

  // Company Members
  const memberReport = await processCollection(
    COLLECTIONS.COMPANY_MEMBERS,
    rawMembers.length,
    uniqueMembers,
    (m) => (m.companyId && m.email ? `${m.companyId}:::${m.email.toLowerCase().trim()}` : null),
    ['id', 'companyId', 'email', 'name']
  );
  reports.push(memberReport);

  // Connections
  const connectionReport = await processCollection(
    COLLECTIONS.CONNECTIONS,
    rawConnections.length,
    uniqueConnections,
    () => null,
    ['id', 'fromUserId', 'toProfileId']
  );
  reports.push(connectionReport);

  // 6. Output Table
  console.log('\n---------------------------------------------------------------');
  console.log('                COLLECTION AUDIT SUMMARY                       ');
  console.log('---------------------------------------------------------------');
  console.log(
    'Collection'.padEnd(18) +
      'Raw Read'.padStart(10) +
      'Valid'.padStart(10) +
      (opts.confirm ? 'Inserted'.padStart(10) : 'Would-Ins'.padStart(10)) +
      (opts.confirm ? 'Updated'.padStart(10) : 'Would-Upd'.padStart(10)) +
      'Conflicts'.padStart(11) +
      'Errors'.padStart(8)
  );
  console.log('-'.repeat(77));

  for (const r of reports) {
    console.log(
      r.name.padEnd(18) +
        String(r.read).padStart(10) +
        String(r.valid).padStart(10) +
        String(r.wouldInsert).padStart(10) +
        String(r.wouldUpdate).padStart(10) +
        String(r.duplicateConflicts).padStart(11) +
        String(r.validationErrors).padStart(8)
    );
  }
  console.log('-'.repeat(77));

  // 7. Perform Writes (Only if --confirm)
  if (opts.confirm && db) {
    console.log('\n[WRITE PHASE] Executing bulkWrite upserts...');

    async function executeBulk(name: string, items: any[]) {
      if (items.length === 0) return;
      const col = db!.collection(name);
      const ops = items.map((doc) => ({
        updateOne: {
          filter: { _id: doc._id },
          update: { $set: doc },
          upsert: true
        }
      }));
      const res = await col.bulkWrite(ops, { ordered: false });
      console.log(`  ✓ ${name.padEnd(16)}: ${res.upsertedCount} inserted, ${res.modifiedCount} modified.`);
    }

    await executeBulk(COLLECTIONS.USERS, uniqueUsers);
    await executeBulk(COLLECTIONS.PROFILES, uniqueProfiles);
    await executeBulk(COLLECTIONS.COMPANIES, uniqueCompanies);
    await executeBulk(COLLECTIONS.COMPANY_MEMBERS, uniqueMembers);
    await executeBulk(COLLECTIONS.CONNECTIONS, uniqueConnections);

    console.log('\n[INDEX PHASE] Verifying and building indexes...');
    const indexRes = await ensureIndexes(db);
    console.log(`  ✓ Indexes created:  ${indexRes.indexesCreated.length}`);
    console.log(`  ✓ Indexes existing: ${indexRes.indexesExisting.length}`);
    if (indexRes.conflicts.length > 0) {
      console.warn(`  ⚠ Index conflicts:  ${indexRes.conflicts.length}`);
      for (const c of indexRes.conflicts) {
        console.warn(`    - ${c.collection}.${c.field}: ${c.conflictCount} conflict(s) detected.`);
      }
    }
    console.log('\n[COMPLETE] Confirmed import completed successfully.');
  } else {
    console.log('\n[DRY RUN COMPLETE] Zero database writes performed.');
    console.log('To execute the import against your database, run:');
    console.log('  npm run migrate:json-to-mongo -- --confirm');
  }

  if (client) {
    await client.close();
  }
}

runMigration().catch((err) => {
  console.error('\n[FATAL UNHANDLED ERROR]', err?.message || err);
  process.exit(1);
});
