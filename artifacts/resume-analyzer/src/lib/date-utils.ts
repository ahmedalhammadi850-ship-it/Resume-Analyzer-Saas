type FirestoreTimestamp = { seconds?: number; _seconds?: number; nanoseconds?: number };

export function safeDate(value: unknown): Date | null {
  if (value == null) return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  if (typeof value === "number") {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === "string") {
    if (!value) return null;
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === "object") {
    const ts = value as FirestoreTimestamp;
    const secs = ts.seconds ?? ts._seconds;
    if (typeof secs === "number") {
      const d = new Date(secs * 1000);
      return isNaN(d.getTime()) ? null : d;
    }
  }
  return null;
}

export function fmtDate(
  value: unknown,
  formatFn: (d: Date) => string,
  fallback = "—",
): string {
  const d = safeDate(value);
  return d ? formatFn(d) : fallback;
}
