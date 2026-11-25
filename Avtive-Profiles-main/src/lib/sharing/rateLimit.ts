interface RateBucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, RateBucket>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Lightweight sliding-window fixed-interval rate limiter for share API protection.
 */
export function checkRateLimit(
  key: string,
  limit: number = 30,
  windowMs: number = 60_000
): RateLimitResult {
  const now = Date.now();

  // Opportunistic cleanup to avoid unbounded map growth
  if (buckets.size > 2000) {
    for (const [k, b] of buckets.entries()) {
      if (b.resetAt <= now) buckets.delete(k);
    }
  }

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: Math.max(0, limit - 1), resetAt };
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: Math.max(0, limit - existing.count),
    resetAt: existing.resetAt
  };
}

export function resetRateLimitsForTests(): void {
  buckets.clear();
}
