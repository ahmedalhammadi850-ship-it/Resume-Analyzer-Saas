import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";

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

interface AuthContextType {
  userProfile: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      const user = await api.auth.me();
      setUserProfile(user);
    } catch {
      setUserProfile(null);
    }
  }, []);

  useEffect(() => {
    fetchProfile().finally(() => setLoading(false));
  }, [fetchProfile]);

  async function logout() {
    await api.auth.logout();
    setUserProfile(null);
  }

  async function refreshProfile() {
    await fetchProfile();
  }

  return (
    <AuthContext.Provider value={{ userProfile, loading, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
