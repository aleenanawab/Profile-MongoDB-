import { NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/db/client';

export const dynamic = 'force-dynamic';

/**
 * Deployment diagnostic. Reports only whether config is present (never values)
 * and whether MongoDB answers a ping. Safe to remove once production is stable.
 */
export async function GET() {
  const present = (name: string) => Boolean(process.env[name] && process.env[name]!.trim());
  const env = {
    MONGODB_URI: present('MONGODB_URI'),
    MONGODB_DB_NAME: present('MONGODB_DB_NAME'),
    SESSION_SECRET_or_JWT_SECRET: present('SESSION_SECRET') || present('JWT_SECRET'),
    GOOGLE_CLIENT_ID: present('GOOGLE_CLIENT_ID') || present('AUTH_GOOGLE_ID'),
    GOOGLE_CLIENT_SECRET: present('GOOGLE_CLIENT_SECRET') || present('AUTH_GOOGLE_SECRET'),
    CLOUDINARY: present('CLOUDINARY_CLOUD_NAME') && present('CLOUDINARY_API_KEY') && present('CLOUDINARY_API_SECRET'),
    NEXT_PUBLIC_APP_URL_is_localhost: (process.env.NEXT_PUBLIC_APP_URL || '').includes('localhost')
  };

  let mongo: 'ok' | 'failed' | 'skipped' = 'skipped';
  if (env.MONGODB_URI) {
    try {
      const db = await getMongoDb();
      await db.command({ ping: 1 });
      mongo = 'ok';
    } catch (err) {
      mongo = 'failed';
      console.error('[health] Mongo ping failed:', err instanceof Error ? err.message : String(err));
    }
  }

  const healthy = env.MONGODB_URI && env.SESSION_SECRET_or_JWT_SECRET && mongo === 'ok';
  return NextResponse.json({ healthy, mongo, env }, { status: healthy ? 200 : 503 });
}
