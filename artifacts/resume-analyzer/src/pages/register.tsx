import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";

export default function Register() {
  const { userProfile, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading) {
      if (userProfile) {
        setLocation("/dashboard");
      } else {
        (window.top || window).location.href = "/api/replit-auth/login";
      }
    }
  }, [loading, userProfile, setLocation]);

  return null;
}
