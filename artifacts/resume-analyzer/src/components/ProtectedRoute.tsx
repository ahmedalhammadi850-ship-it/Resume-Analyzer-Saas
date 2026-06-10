import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireRole?: UserRole;
}

export function ProtectedRoute({ children, requireRole }: ProtectedRouteProps) {
  const { currentUser, userProfile, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading) {
      if (!currentUser) {
        setLocation("/login");
      } else if (requireRole && userProfile?.role !== requireRole) {
        setLocation("/dashboard");
      }
    }
  }, [loading, currentUser, userProfile, requireRole, setLocation]);

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

  if (!currentUser) return null;
  if (requireRole && userProfile?.role !== requireRole) return null;

  return <>{children}</>;
}
