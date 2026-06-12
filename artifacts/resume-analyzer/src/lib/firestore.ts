import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  orderBy,
  limit,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/firebase";
import {
  Analysis,
  AnalysisResults,
  AnalysisType,
  UserProfile,
  AdminStats,
  UpgradeRequest,
  N8N_WEBHOOK_JD,
  N8N_WEBHOOK_GENERAL,
} from "@/types";

// ── File Upload ──────────────────────────────────────────────────────────────
export async function uploadResumeFile(userId: string, file: File): Promise<string> {
  const path = `resumes/${userId}/${Date.now()}_${file.name}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

// ── Analysis Webhooks ────────────────────────────────────────────────────────

/**
 * Validates that the N8N response actually contains analysis data.
 * N8N webhook-test URLs return empty/error responses when not in active test mode.
 */
function validateN8nResponse(data: unknown, webhookUrl: string): AnalysisResults {
  // Handle array response (N8N sometimes returns [{...}])
  const result = Array.isArray(data) ? data[0] : data;

  if (!result || typeof result !== "object") {
    throw new Error(
      webhookUrl.includes("webhook-test")
        ? "N8N webhook-test لم يستجب. تأكد أن الـ workflow مفتوح في وضع الاختبار في N8N، أو استخدم رابط webhook الإنتاجي بدلاً من webhook-test."
        : "لم يتم استلام بيانات من N8N. تحقق من إعدادات الـ workflow."
    );
  }

  // Check for N8N error/info messages instead of real data
  const r = result as Record<string, unknown>;
  if (
    Object.keys(r).length === 0 ||
    (r.message && !r.score && !r.match_level && !r.analysis)
  ) {
    throw new Error(
      webhookUrl.includes("webhook-test")
        ? "N8N webhook-test غير نشط. افتح الـ workflow في N8N واضغط 'Test workflow' ثم أعد المحاولة، أو فعّل الـ workflow واستخدم رابط /webhook/ بدلاً من /webhook-test/."
        : `N8N لم يُرجع نتائج تحليل. الرد: ${JSON.stringify(r).slice(0, 200)}`
    );
  }

  return result as AnalysisResults;
}

export async function runJdAnalysis(
  file: File,
  jobTitle: string,
  jobDescription: string
): Promise<AnalysisResults> {
  const form = new FormData();
  form.append("resume_file", file);
  form.append("job_title", jobTitle);
  form.append("job_description", jobDescription);

  let res: Response;
  try {
    res = await fetch(N8N_WEBHOOK_JD, { method: "POST", body: form });
  } catch {
    throw new Error("تعذّر الاتصال بـ N8N. تحقق من اتصالك بالإنترنت أو رابط الـ webhook.");
  }

  if (!res.ok) {
    throw new Error(`N8N رجع بخطأ (${res.status}). تحقق من إعدادات الـ webhook.`);
  }

  const data = await res.json();
  return validateN8nResponse(data, N8N_WEBHOOK_JD);
}

export async function runGeneralAnalysis(file: File): Promise<AnalysisResults> {
  const form = new FormData();
  form.append("resume_file", file);

  let res: Response;
  try {
    res = await fetch(N8N_WEBHOOK_GENERAL, { method: "POST", body: form });
  } catch {
    throw new Error("تعذّر الاتصال بـ N8N. تحقق من اتصالك بالإنترنت أو رابط الـ webhook.");
  }

  if (!res.ok) {
    throw new Error(`N8N رجع بخطأ (${res.status}). تحقق من إعدادات الـ webhook.`);
  }

  const data = await res.json();
  return validateN8nResponse(data, N8N_WEBHOOK_GENERAL);
}

// ── Save & Fetch Analyses ────────────────────────────────────────────────────
function extractScore(results: AnalysisResults): number {
  const candidates = [
    results.ats_score,
    results.match_score,
    results.score,
    (results as Record<string, unknown>)["Score"],
    (results as Record<string, unknown>)["overall_score"],
  ];
  for (const c of candidates) {
    const n = Number(c);
    if (!isNaN(n) && n > 0) return n;
  }
  return 0;
}

export async function saveAnalysis(
  userId: string,
  analysisType: AnalysisType,
  fileName: string,
  results: AnalysisResults
): Promise<string> {
  const score = extractScore(results);
  const ref = await addDoc(collection(db, "analyses"), {
    userId,
    analysisType,
    fileName,
    results,
    score: Number(score),
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getUserAnalyses(userId: string): Promise<Analysis[]> {
  const q = query(
    collection(db, "analyses"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    analysisId: d.id,
    ...(d.data() as Omit<Analysis, "analysisId">),
    createdAt:
      d.data().createdAt instanceof Timestamp
        ? d.data().createdAt.toDate().toISOString()
        : d.data().createdAt,
  }));
}

export async function getAnalysis(id: string): Promise<Analysis | null> {
  const snap = await getDoc(doc(db, "analyses", id));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    analysisId: snap.id,
    ...(data as Omit<Analysis, "analysisId">),
    createdAt:
      data.createdAt instanceof Timestamp
        ? data.createdAt.toDate().toISOString()
        : data.createdAt,
  };
}

export async function getRecentAnalyses(userId: string, count = 5): Promise<Analysis[]> {
  const q = query(
    collection(db, "analyses"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
    limit(count)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    analysisId: d.id,
    ...(d.data() as Omit<Analysis, "analysisId">),
    createdAt:
      d.data().createdAt instanceof Timestamp
        ? d.data().createdAt.toDate().toISOString()
        : d.data().createdAt,
  }));
}

// ── Scan Limit Enforcement ───────────────────────────────────────────────────
export async function decrementScans(userId: string): Promise<void> {
  const ref = doc(db, "users", userId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const profile = snap.data() as UserProfile;
  if (profile.plan === "pro") return;
  await updateDoc(ref, { remainingScans: Math.max(0, (profile.remainingScans ?? 0) - 1) });
}

// ── Admin ────────────────────────────────────────────────────────────────────
export async function getAllUsers(): Promise<UserProfile[]> {
  const snap = await getDocs(collection(db, "users"));
  return snap.docs.map((d) => ({
    ...(d.data() as UserProfile),
    uid: d.id,
    createdAt:
      d.data().createdAt instanceof Timestamp
        ? d.data().createdAt.toDate().toISOString()
        : d.data().createdAt ?? "",
  }));
}

export async function suspendUser(uid: string): Promise<void> {
  await updateDoc(doc(db, "users", uid), { suspended: true });
}

export async function deleteUser(uid: string): Promise<void> {
  await deleteDoc(doc(db, "users", uid));
}

export async function addScansToUser(uid: string, amount: number): Promise<void> {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("User not found");
  const profile = snap.data() as UserProfile;
  const current = profile.remainingScans ?? 0;
  await updateDoc(ref, { remainingScans: current + amount });
}

// ── Upgrade Requests ─────────────────────────────────────────────────────────
export async function createUpgradeRequest(
  userId: string,
  email: string,
  name: string,
  n8nSent: boolean
): Promise<string> {
  const ref = await addDoc(collection(db, "upgradeRequests"), {
    userId,
    email,
    name,
    status: "pending",
    n8nSent,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getUpgradeRequests(): Promise<UpgradeRequest[]> {
  const q = query(
    collection(db, "upgradeRequests"),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    requestId: d.id,
    ...(d.data() as Omit<UpgradeRequest, "requestId" | "createdAt" | "reviewedAt">),
    createdAt:
      d.data().createdAt instanceof Timestamp
        ? d.data().createdAt.toDate().toISOString()
        : d.data().createdAt ?? "",
    reviewedAt:
      d.data().reviewedAt instanceof Timestamp
        ? d.data().reviewedAt.toDate().toISOString()
        : d.data().reviewedAt,
  }));
}

export async function approveUpgradeRequest(requestId: string, userId: string): Promise<void> {
  await Promise.all([
    updateDoc(doc(db, "upgradeRequests", requestId), {
      status: "approved",
      reviewedAt: serverTimestamp(),
    }),
    updateDoc(doc(db, "users", userId), {
      plan: "pro",
    }),
  ]);
}

export async function rejectUpgradeRequest(requestId: string): Promise<void> {
  await updateDoc(doc(db, "upgradeRequests", requestId), {
    status: "rejected",
    reviewedAt: serverTimestamp(),
  });
}

export async function getAdminStats(): Promise<AdminStats> {
  const [usersSnap, analysesSnap] = await Promise.all([
    getDocs(collection(db, "users")),
    getDocs(collection(db, "analyses")),
  ]);
  const users = usersSnap.docs.map((d) => d.data() as UserProfile);
  const activeSubscribers = users.filter((u) => u.plan === "pro").length;
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const newThisMonth = users.filter((u) => {
    if (!u.createdAt) return false;
    return new Date(u.createdAt) >= monthStart;
  }).length;
  return {
    totalUsers: users.length,
    totalAnalyses: analysesSnap.size,
    activeSubscribers,
    monthlyGrowth: newThisMonth,
    monthlyRevenue: activeSubscribers * 19,
  };
}
