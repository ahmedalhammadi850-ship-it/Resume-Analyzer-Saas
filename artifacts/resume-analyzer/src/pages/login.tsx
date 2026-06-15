import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { GoogleAuthProvider, signInWithRedirect } from "firebase/auth";
import { auth } from "@/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import { LogIn, Mail, Lock, Chrome } from "lucide-react";

export default function Login() {
  const { userProfile, loading, setJwtSession } = useAuth();
  const [, setLocation] = useLocation();
  const { t } = useTranslation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && userProfile) {
      setLocation("/dashboard");
    }
  }, [loading, userProfile, setLocation]);

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/login-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed. Please try again.");
        return;
      }
      setJwtSession(data.token, data.user);
      setLocation("/dashboard");
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogleLogin() {
    setError("");
    setSubmitting(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithRedirect(auth, provider);
    } catch (err: any) {
      setError(err.message || "Google sign-in failed.");
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-muted/30 p-4">
      <Link href="/" className="absolute top-6 start-6 font-bold text-xl tracking-tight text-primary flex items-center gap-2">
        <span className="bg-primary text-primary-foreground px-2 py-1 rounded-md">AI</span>
        <span>{t("brand")}</span>
      </Link>

      <Card className="w-full max-w-md border-border/50 shadow-xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight">Welcome back</CardTitle>
          <CardDescription>Sign in to your account to continue</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Button variant="outline" className="w-full gap-2" onClick={handleGoogleLogin} disabled={submitting}>
            <Chrome className="h-4 w-4" />
            Continue with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleEmailLogin} className="flex flex-col gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="email" type="email" placeholder="you@example.com" className="pl-10"
                  value={email} onChange={e => setEmail(e.target.value)} required disabled={submitting} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="/forgot-password" className="text-sm text-primary hover:underline">Forgot password?</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="password" type="password" placeholder="••••••••" className="pl-10"
                  value={password} onChange={e => setPassword(e.target.value)} required disabled={submitting} />
              </div>
            </div>

            {error && <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">{error}</p>}

            <Button type="submit" className="w-full gap-2" disabled={submitting}>
              <LogIn className="h-4 w-4" />
              {submitting ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <p className="text-sm text-center text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-semibold text-primary hover:underline">Sign up</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
