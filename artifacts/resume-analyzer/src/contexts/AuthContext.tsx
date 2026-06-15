import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { signOut as firebaseSignOut } from "firebase/auth";
import { auth } from "@/firebase";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  plan: string;
  remainingScans: number;
  role: string;
  resumeName?: string;
  createdAt: string;
}

const JWT_STORAGE_KEY = "auth_token";

interface AuthContextType {
  userProfile: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  setJwtSession: (token: string, profile: UserProfile) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export function getStoredToken(): string | null {
  return localStorage.getItem(JWT_STORAGE_KEY);
}

async function fetchProfileWithToken(token: string): Promise<UserProfile | null> {
  try {
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
  const [loading, setLoading] = useState(true);

  function setJwtSession(token: string, profile: UserProfile) {
    localStorage.setItem(JWT_STORAGE_KEY, token);
    setUserProfile(profile);
    setLoading(false);
  }

  const refreshProfile = useCallback(async () => {
    const stored = getStoredToken();
    if (stored) {
      const profile = await fetchProfileWithToken(stored);
      if (profile) setUserProfile(profile);
    }
  }, []);

  useEffect(() => {
    const stored = getStoredToken();
    if (stored) {
      fetchProfileWithToken(stored).then((profile) => {
        if (profile) {
          setUserProfile(profile);
        } else {
          localStorage.removeItem(JWT_STORAGE_KEY);
          setUserProfile(null);
        }
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  async function logout() {
    localStorage.removeItem(JWT_STORAGE_KEY);
    setUserProfile(null);
    try {
      await firebaseSignOut(auth);
    } catch {}
  }

  return (
    <AuthContext.Provider value={{ userProfile, loading, logout, refreshProfile, setJwtSession }}>
      {children}
    </AuthContext.Provider>
  );
}
