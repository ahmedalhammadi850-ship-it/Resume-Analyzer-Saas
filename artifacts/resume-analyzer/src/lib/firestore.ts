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
export async function runJdAnalysis(
  file: File,
  jobTitle: string,
  jobDescription: string
): Promise<AnalysisResults> {
  const form = new FormData();
  form.append("resume_file", file);
  form.append("job_title", jobTitle);
  form.append("job_description", jobDescription);
  const res = await fetch(N8N_WEBHOOK_JD, { method: "POST", body: form });
  if (!res.ok) throw new Error("Analysis failed. Please try again.");
  return res.json();
}

export async function runGeneralAnalysis(file: File): Promise<AnalysisResults> {
  const form = new FormData();
  form.append("resume_file", file);
  const res = await fetch(N8N_WEBHOOK_GENERAL, { method: "POST", body: form });
  if (!res.ok) throw new Error("Analysis failed. Please try again.");
  return res.json();
}

// ── Save & Fetch Analyses ────────────────────────────────────────────────────
export async function saveAnalysis(
  userId: string,
  analysisType: AnalysisType,
  fileName: string,
  results: AnalysisResults
): Promise<string> {
  const score =
    results.ats_score ??
    results.match_score ??
    results.score ??
    0;
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
