import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { signInWithCustomToken } from "firebase/auth";
import { auth } from "@/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import { UserPlus, User, Lock } from "lucide-react";

export default function Register() {
  const { userProfile, loading } = useAuth();
  const [, setLocation] = useLocation();
  const { t } = useTranslation();

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && userProfile) {
      setLocation("/dashboard");
    }
  }, [loading, userProfile, setLocation]);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/register-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password,
          name: name.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed. Please try again.");
        return;
      }
      await signInWithCustomToken(auth, data.customToken);
    } catch {
      setError("Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-muted/30 p-4">
      <Link
        href="/"
        className="absolute top-6 start-6 font-bold text-xl tracking-tight text-primary flex items-center gap-2"
      >
        <span className="bg-primary text-primary-foreground px-2 py-1 rounded-md">AI</span>
        <span>{t("brand")}</span>
      </Link>

      <Card className="w-full max-w-md border-border/50 shadow-xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight">Create an account</CardTitle>
          <CardDescription>Start analyzing your resume for free</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <form onSubmit={handleRegister} className="flex flex-col gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Your name"
                  className="pl-10"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium select-none">@</span>
                <Input
                  id="username"
                  type="text"
                  placeholder="your_username"
                  className="pl-8"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  required
                  minLength={3}
                  maxLength={30}
                  disabled={submitting}
                  autoComplete="username"
                />
              </div>
              <p className="text-xs text-muted-foreground">3–30 characters: letters, numbers, underscores</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Min. 6 characters"
                  className="pl-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  disabled={submitting}
                  autoComplete="new-password"
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full gap-2" disabled={submitting}>
              <UserPlus className="h-4 w-4" />
              {submitting ? "Creating account..." : "Create Account"}
            </Button>
          </form>

          <p className="text-sm text-center text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
