import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { ADMIN_EMAILS } from "@/lib/admin-constants";

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
        setLocation("/login");
      } else if (!hasAccess) {
        setLocation("/dashboard");
      }
    }
  }, [loading, userProfile, hasAccess, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <div className="text-muted-foreground font-medium">Loading...</div>
        </div>
      </div>
    );
  }

  if (!userProfile || !hasAccess) return null;

  return <>{children}</>;
}
