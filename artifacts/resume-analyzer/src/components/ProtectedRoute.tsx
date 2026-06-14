import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";

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

  useEffect(() => {
    if (!loading) {
      if (!firebaseUser) {
        setLocation("/login");
      } else if (userProfile && !hasAccess) {
        setLocation("/dashboard");
      }
    }
  }, [loading, firebaseUser, userProfile, hasAccess, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <div className="text-muted-foreground font-medium">Loading...</div>
        </div>
      </div>
    );
  }

  if (!firebaseUser) return null;
  if (userProfile && !hasAccess) return null;

  return <>{children}</>;
}
