const INSECURE_SECRET_VALUES = new Set([
  "your-secret-key",
  "your_jwt_secret_key_here",
  "your_nextauth_secret_here",
  "fallback-secret",
]);

function normalizeSecret(value?: string | null) {
  return (value || "").trim();
}

export function getAuthJwtSecret(): string | null {
  const candidate = normalizeSecret(
    process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET
  );

  if (!candidate) {
    return null;
  }

  if (INSECURE_SECRET_VALUES.has(candidate.toLowerCase())) {
    return null;
  }

  return candidate;
}

export function getRequiredAuthJwtSecret(): string {
  const secret = getAuthJwtSecret();
  if (!secret) {
    throw new Error(
      "Secure JWT secret is not configured. Set JWT_SECRET or NEXTAUTH_SECRET."
    );
  }

  return secret;
}
