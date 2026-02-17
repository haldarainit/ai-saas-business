type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const memoryStore = new Map<string, RateLimitEntry>();

export function enforceRateLimit(params: {
  key: string;
  windowMs: number;
  maxRequests: number;
}) {
  const { key, windowMs, maxRequests } = params;
  const now = Date.now();
  const existing = memoryStore.get(key);

  if (!existing || existing.resetAt <= now) {
    memoryStore.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return { allowed: true, remaining: maxRequests - 1, resetAt: now + windowMs };
  }

  if (existing.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  memoryStore.set(key, existing);

  return {
    allowed: true,
    remaining: Math.max(0, maxRequests - existing.count),
    resetAt: existing.resetAt,
  };
}

export function getClientIpAddress(request: Request): string {
  const xForwardedFor = request.headers.get("x-forwarded-for");
  if (xForwardedFor) {
    return xForwardedFor.split(",")[0].trim();
  }

  return request.headers.get("x-real-ip") || "unknown-ip";
}
