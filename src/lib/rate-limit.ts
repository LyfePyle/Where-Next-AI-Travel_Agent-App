type RateLimitResult = {
  ok: boolean;
  remaining: number;
  retryAfter: number;
  resetAt: number;
};

type RateLimitOptions = {
  key: string;
  limit: number;
  windowMs: number;
};

const memoryStore = new Map<string, { count: number; resetAt: number }>();

export function rateLimit({ key, limit, windowMs }: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const entry = memoryStore.get(key);

  if (!entry || now >= entry.resetAt) {
    const resetAt = now + windowMs;
    memoryStore.set(key, { count: 1, resetAt });
    return {
      ok: true,
      remaining: Math.max(0, limit - 1),
      retryAfter: Math.ceil(windowMs / 1000),
      resetAt,
    };
  }

  if (entry.count >= limit) {
    const retryAfterMs = Math.max(0, entry.resetAt - now);
    return {
      ok: false,
      remaining: 0,
      retryAfter: Math.ceil(retryAfterMs / 1000),
      resetAt: entry.resetAt,
    };
  }

  entry.count += 1;
  memoryStore.set(key, entry);
  return {
    ok: true,
    remaining: Math.max(0, limit - entry.count),
    retryAfter: Math.ceil((entry.resetAt - now) / 1000),
    resetAt: entry.resetAt,
  };
}
