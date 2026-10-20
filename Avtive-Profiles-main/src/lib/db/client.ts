import { MongoClient, Db } from 'mongodb';

if (typeof window !== 'undefined') {
  throw new Error('src/lib/db/client.ts is server-only and cannot be imported in the browser.');
}

export const COLLECTIONS = {
  USERS: 'users',
  PROFILES: 'profiles',
  COMPANIES: 'companies',
  COMPANY_MEMBERS: 'company_members',
  CONNECTIONS: 'connections',
  SESSIONS: 'sessions'
} as const;

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];

export function getMongoUri(): string {
  let uri = process.env.MONGODB_URI;
  if (!uri || !uri.trim()) {
    throw new Error('Missing required environment variable: MONGODB_URI');
  }
  uri = uri.trim();
  if ((uri.startsWith('"') && uri.endsWith('"')) || (uri.startsWith("'") && uri.endsWith("'"))) {
    uri = uri.slice(1, -1);
  }
  return uri.trim();
}

export function getMongoDbName(): string {
  let dbName = process.env.MONGODB_DB_NAME;
  if (!dbName || !dbName.trim()) {
    throw new Error('Missing required environment variable: MONGODB_DB_NAME');
  }
  dbName = dbName.trim();
  if ((dbName.startsWith('"') && dbName.endsWith('"')) || (dbName.startsWith("'") && dbName.endsWith("'"))) {
    dbName = dbName.slice(1, -1);
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
