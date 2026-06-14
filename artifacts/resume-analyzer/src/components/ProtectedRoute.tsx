import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

const ADMIN_EMAILS = ["123qwr23fdf@gmail.com"];

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireRole?: string;
}

export function ProtectedRoute({ children, requireRole }: ProtectedRouteProps) {
  const { firebaseUser, userProfile, loading } = useAuth();
  const [, setLocation] = useLocation();

  const isAdmin =
    userProfile?.role === "admin" ||
    ADMIN_EMAILS.includes(userProfile?.email ?? "");

  const hasAccess = !requireRole || (requireRole === "admin" ? isAdmin : userProfile?.role === requireRole);

  const profileLoading = !!firebaseUser && !userProfile;

  useEffect(() => {
    if (!loading && !profileLoading) {
      if (!firebaseUser) {
        setLocation("/login");
      } else if (!hasAccess) {
        setLocation("/dashboard");
      }
    }
  }, [loading, profileLoading, firebaseUser, hasAccess, setLocation]);

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <div className="text-muted-foreground font-medium">Loading...</div>
        </div>
      </div>
    );
  }

  if (!firebaseUser || !hasAccess) return null;

  return <>{children}</>;
}
