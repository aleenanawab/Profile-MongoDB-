import React from 'react';
import crypto from 'crypto';
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { consumeAndResolveShareLink } from '@/lib/db';
import { checkRateLimit } from '@/lib/sharing/rateLimit';
import { SharedProfileClient } from './SharedProfileClient';

export const dynamic = 'force-dynamic';

interface SharedRouteProps {
  params: Promise<{ token: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

/**
 * Intentionally generic metadata so link preview bots never expose private profile details
 * and never consume single-use share tokens during metadata unfurling.
 */
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Shared Profile | Avtive',
    description: 'View a permission-scoped digital profile card on Avtive.',
    robots: { index: false, follow: false }
  };
}

export default async function SharedProfilePage({ params, searchParams }: SharedRouteProps) {
  const { token } = await params;
  const resolvedQuery = searchParams ? await searchParams : {};
  const srcParam = typeof resolvedQuery.src === 'string' ? resolvedQuery.src : undefined;

  const hdrs = await headers();
  const userAgent = hdrs.get('user-agent') || '';
  const forwardedFor = hdrs.get('x-forwarded-for') || hdrs.get('x-real-ip') || 'unknown';
  const clientIp = forwardedFor.split(',')[0].trim();

  const clientSignature = crypto
    .createHash('sha256')
    .update(`${clientIp}|${userAgent}`)
    .digest('hex')
    .slice(0, 16);

  const rl = checkRateLimit(`share:visit:${clientSignature}`, 60, 60_000);
  if (!rl.allowed) {
    return <SharedProfileClient result={{ outcome: 'rate_limited' }} />;
  }

  const purposeHeader = (hdrs.get('purpose') || hdrs.get('sec-purpose') || '').toLowerCase();
  const isNextPrefetch = Boolean(hdrs.get('next-router-prefetch') || purposeHeader.includes('prefetch'));
  const isBotCrawler = /bot|crawler|spider|whatsapp|slackbot|twitterbot|facebookexternalhit|linkedinbot|discordbot|telegrambot/i.test(
    userAgent
  );

  // Never let a bot preview or speculative prefetch burn a 1-view token!
  if (isBotCrawler) {
    return <SharedProfileClient result={{ outcome: 'not_found' }} isBotPreview />;
  }

  const result = await consumeAndResolveShareLink(token, {
    channel: srcParam,
    clientSignature,
    isPrefetch: isNextPrefetch
  });

  return <SharedProfileClient result={result} />;
}
