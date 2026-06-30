// Admin access is granted by email via the ADMIN_EMAILS env var
// (comma-separated). This avoids needing to flip a DB flag in production.
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const allowed = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  return allowed.includes(email.toLowerCase());
}
