export function isAdminEmail(email?: string | null): boolean {
  if (!email) {
    return false;
  }

  const configuredEmails = new Set<string>();

  for (const item of process.env.ADMIN_EMAILS?.split(",") || []) {
    const normalized = item.trim().toLowerCase();
    if (normalized) {
      configuredEmails.add(normalized);
    }
  }

  for (const directAdminEmail of [
    process.env.PRIMARY_ADMIN_EMAIL,
    process.env.ADMIN_BOOTSTRAP_EMAIL,
  ]) {
    const normalized = (directAdminEmail || "").trim().toLowerCase();
    if (normalized) {
      configuredEmails.add(normalized);
    }
  }

  return configuredEmails.has(email.toLowerCase());
}
