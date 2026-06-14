import { useEffect } from "react";

export default function ForgotPassword() {
  useEffect(() => {
    (window.top || window).location.href = "/api/replit-auth/login";
  }, []);

  return null;
}
