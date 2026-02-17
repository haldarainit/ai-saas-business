export function isAdminEmail(email?: string | null): boolean {
  if (!email) {
    return false;
  }

  const configuredEmails =
    process.env.ADMIN_EMAILS?.split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean) || [];

  return configuredEmails.includes(email.toLowerCase());
}
