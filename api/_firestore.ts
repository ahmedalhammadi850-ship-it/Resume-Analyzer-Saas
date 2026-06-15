const PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID ?? "";
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  plan: string;
  remainingScans: number;
  role: string;
  resumeName: string | null;
  suspended: boolean;
  upgradeRequest: string | null;
  createdAt: string;
}

function fromFirestore(doc: Record<string, unknown>): UserProfile {
  const f = (doc.fields ?? {}) as Record<string, Record<string, unknown>>;
  const str = (k: string, fallback = "") => (f[k]?.stringValue as string) ?? fallback;
  const int = (k: string, fallback = 0) => {
    const v = f[k];
    if (!v) return fallback;
    return Number(v.integerValue ?? v.doubleValue ?? fallback);
  };
  const bool = (k: string) => !!(f[k]?.booleanValue);
  const name = (doc.name as string ?? "").split("/").pop() ?? "";
  return {
    id: str("id") || name,
    name: str("name"),
    email: str("email"),
    plan: str("plan", "free"),
    remainingScans: int("remainingScans", 1),
    role: str("role", "user"),
    resumeName: f["resumeName"] ? str("resumeName") : null,
    suspended: bool("suspended"),
    upgradeRequest: f["upgradeRequest"] ? str("upgradeRequest") : null,
    createdAt: str("createdAt"),
  };
}

function toFirestoreFields(data: Partial<UserProfile>): Record<string, unknown> {
  const fields: Record<string, unknown> = {};
  if (data.id !== undefined) fields.id = { stringValue: data.id };
  if (data.name !== undefined) fields.name = { stringValue: data.name };
  if (data.email !== undefined) fields.email = { stringValue: data.email };
  if (data.plan !== undefined) fields.plan = { stringValue: data.plan };
  if (data.remainingScans !== undefined) fields.remainingScans = { integerValue: String(data.remainingScans) };
  if (data.role !== undefined) fields.role = { stringValue: data.role };
  if (data.resumeName !== undefined) fields.resumeName = { stringValue: data.resumeName ?? "" };
  if (data.suspended !== undefined) fields.suspended = { booleanValue: data.suspended };
  if (data.upgradeRequest !== undefined) fields.upgradeRequest = { stringValue: data.upgradeRequest ?? "" };
  if (data.createdAt !== undefined) fields.createdAt = { stringValue: data.createdAt };
  return fields;
}

/** إنشاء/تحديث وثيقة المستخدم في Firestore باستخدام Firebase ID token */
export async function firestoreSetUser(uid: string, idToken: string, data: UserProfile): Promise<void> {
  const url = `${BASE}/users/${uid}`;
  await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ fields: toFirestoreFields(data) }),
  });
}

/** قراءة وثيقة المستخدم من Firestore باستخدام Firebase ID token */
export async function firestoreGetUser(uid: string, idToken: string): Promise<UserProfile | null> {
  const url = `${BASE}/users/${uid}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${idToken}` },
  });
  if (!res.ok) return null;
  const doc = await res.json() as Record<string, unknown>;
  if (!doc.fields) return null;
  return fromFirestore(doc);
}
