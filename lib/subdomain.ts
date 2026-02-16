const SUBDOMAIN_MAX_LENGTH = 63;
const SUBDOMAIN_MIN_LENGTH = 3;

const RESERVED_SUBDOMAINS = new Set([
  'www',
  'api',
  'app',
  'admin',
  'mail',
  'ftp',
  'root',
  'support',
  'help',
  'blog',
]);

export const SUBDOMAIN_REGEX = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

export function normalizeSubdomain(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, SUBDOMAIN_MAX_LENGTH);
}

export function isReservedSubdomain(value: string): boolean {
  return RESERVED_SUBDOMAINS.has(value.toLowerCase());
}

export function getSubdomainValidationError(value: string): string | null {
  if (!value) {
    return 'Subdomain is required.';
  }

  if (value.length < SUBDOMAIN_MIN_LENGTH || value.length > SUBDOMAIN_MAX_LENGTH) {
    return 'Subdomain must be 3-63 characters.';
  }

  if (!SUBDOMAIN_REGEX.test(value)) {
    return 'Use lowercase letters, numbers, and hyphens only.';
  }

  if (isReservedSubdomain(value)) {
    return 'This subdomain is reserved.';
  }

  return null;
}

export function createSubdomainSeed(input: string, fallback = 'site'): string {
  const normalizedInput = normalizeSubdomain(input);
  if (normalizedInput.length >= SUBDOMAIN_MIN_LENGTH) {
    return normalizedInput;
  }

  const normalizedFallback = normalizeSubdomain(fallback) || 'site';
  if (normalizedFallback.length >= SUBDOMAIN_MIN_LENGTH) {
    return normalizedFallback;
  }

  return 'site';
}

export function withNumericSuffix(base: string, number: number): string {
  if (number <= 1) {
    return base.slice(0, SUBDOMAIN_MAX_LENGTH);
  }

  const suffix = `-${number}`;
  const maxBaseLength = SUBDOMAIN_MAX_LENGTH - suffix.length;
  const trimmedBase = base.slice(0, Math.max(1, maxBaseLength)).replace(/-+$/g, '');
  return `${trimmedBase}${suffix}`;
}

export function generateSubdomainCandidates(seed: string, count = 20): string[] {
  const candidates: string[] = [];
  const normalizedSeed = createSubdomainSeed(seed);

  for (let i = 1; i <= count; i++) {
    const candidate = withNumericSuffix(normalizedSeed, i);
    if (!candidates.includes(candidate)) {
      candidates.push(candidate);
    }
  }

  return candidates;
}

export function buildDeploymentUrl(
  subdomain: string,
  origin: string,
  rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN,
): string {
  if (!subdomain) {
    return origin;
  }

  const normalizedRootDomain = rootDomain?.trim().toLowerCase();
  if (normalizedRootDomain) {
    const protocol = origin.startsWith('http://') ? 'http' : 'https';
    return `${protocol}://${subdomain}.${normalizedRootDomain}`;
  }

  return `${origin.replace(/\/$/, '')}/preview/${subdomain}`;
}

