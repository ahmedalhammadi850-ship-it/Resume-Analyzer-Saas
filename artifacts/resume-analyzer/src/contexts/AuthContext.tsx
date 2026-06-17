import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { onAuthStateChanged, signOut as firebaseSignOut, type User as FirebaseUser } from "firebase/auth";
import { auth } from "@/firebase";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  plan: string;
  remainingScans: number;
  role: string;
  createdAt: string;
}

interface AuthContextType {
  userProfile: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  needsVerification: boolean;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  recheckVerification: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

async function fetchProfile(firebaseUser: FirebaseUser): Promise<UserProfile | null> {
  try {
    const token = await firebaseUser.getIdToken();
    const res = await fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsVerification, setNeedsVerification] = useState(false);

  const refreshProfile = useCallback(async () => {
    if (!firebaseUser) return;
    const profile = await fetchProfile(firebaseUser);
    if (profile) setUserProfile(profile);
  }, [firebaseUser]);

  const recheckVerification = useCallback(async (): Promise<boolean> => {
    const user = auth.currentUser;
    if (!user) return false;
    try {
      await user.reload();
      const refreshed = auth.currentUser;
      if (refreshed?.emailVerified) {
        setFirebaseUser(refreshed);
        setNeedsVerification(false);
        const profile = await fetchProfile(refreshed);
        setUserProfile(profile);
        return true;
      }
    } catch {}
    return false;
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        if (!fbUser.emailVerified) {
          setNeedsVerification(true);
        } else {
          setNeedsVerification(false);
        }
        const profile = await fetchProfile(fbUser);
        setUserProfile(profile);
      } else {
        setNeedsVerification(false);
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  async function logout() {
    await firebaseSignOut(auth);
    setUserProfile(null);
    setFirebaseUser(null);
    setNeedsVerification(false);
  }

  return (
    <AuthContext.Provider value={{ userProfile, firebaseUser, loading, needsVerification, logout, refreshProfile, recheckVerification }}>
      {children}
    </AuthContext.Provider>
  );
}
