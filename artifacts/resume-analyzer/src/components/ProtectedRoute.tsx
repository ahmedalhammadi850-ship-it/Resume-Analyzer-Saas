import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";

const ADMIN_EMAILS = ["123qwr23fdf@gmail.com"];

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireRole?: string;
}

export function ProtectedRoute({ children, requireRole }: ProtectedRouteProps) {
  const { userProfile, loading } = useAuth();
  const [, setLocation] = useLocation();

  const isAdmin =
    userProfile?.role === "admin" ||
    ADMIN_EMAILS.includes(userProfile?.email ?? "");

  const hasAccess = !requireRole || (requireRole === "admin" ? isAdmin : userProfile?.role === requireRole);

  useEffect(() => {
    if (!loading) {
      if (!userProfile) {
        window.location.href = "/api/replit-auth/login";
      } else if (!hasAccess) {
        setLocation("/dashboard");
      }
    }
  }, [loading, userProfile, hasAccess, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse flex flex-col items-center space-y-4">
          <div className="h-12 w-12 bg-primary/20 rounded-full animate-spin"></div>
          <div className="text-muted-foreground font-medium">Loading...</div>
        </div>
      </div>
    );
  }

  if (!userProfile) return null;
  if (!hasAccess) return null;

  return <>{children}</>;
}
