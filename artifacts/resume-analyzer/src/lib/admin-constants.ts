export const ADMIN_EMAILS = ["123qwr23fsf@gmail.com"];

export function isAdminEmail(email: string): boolean {
  const normalized = (email ?? "").trim().toLowerCase();
  return ADMIN_EMAILS.some(e => e.trim().toLowerCase() === normalized);
}
