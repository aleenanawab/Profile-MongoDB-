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
  const username = process.env.MONGODB_USERNAME?.trim();
  const password = process.env.MONGODB_PASSWORD?.trim();
  if (username && password && uri.includes('@')) {
    uri = uri.replace(
      /(mongodb(?:\+srv)?:\/\/)([^:]+):([^@]+)@/,
      `$1${encodeURIComponent(username)}:${encodeURIComponent(password)}@`
    );
  }
  return uri.trim();
}

export function getMongoDbName(): string {
  let dbName = process.env.MONGODB_DB_NAME || 'avtive_fresh';
  dbName = dbName.trim();
  if ((dbName.startsWith('"') && dbName.endsWith('"')) || (dbName.startsWith("'") && dbName.endsWith("'"))) {
    dbName = dbName.slice(1, -1);
  }
  return dbName.trim() || 'avtive_fresh';
}

const MONGO_CLIENT_OPTIONS = {
  maxPoolSize: 10,
  minPoolSize: 1,
  maxIdleTimeMS: 60000,
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 10000
};

let clientPromise: Promise<MongoClient> | null = null;

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

export function getMongoClientPromise(): Promise<MongoClient> {
  const uri = getMongoUri();

  if (process.env.NODE_ENV === 'development') {
    if (!global._mongoClientPromise) {
      const client = new MongoClient(uri, MONGO_CLIENT_OPTIONS);
      global._mongoClientPromise = client.connect().catch((err) => {
        global._mongoClientPromise = undefined;
        throw err;
      });
    }
    return global._mongoClientPromise;
  }

  // Module singleton in production (serverless instance)
  if (!clientPromise) {
    const client = new MongoClient(uri, MONGO_CLIENT_OPTIONS);
    clientPromise = client.connect().catch((err) => {
      clientPromise = null;
      throw err;
    });
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
