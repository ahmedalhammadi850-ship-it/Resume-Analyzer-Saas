import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
} from "firebase/auth";
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
import { UserPlus, Mail, Lock, User, MailCheck, RefreshCw } from "lucide-react";

export default function Register() {
  const { userProfile, loading } = useAuth();
  const [, setLocation] = useLocation();
  const { t } = useTranslation();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [resending, setResending] = useState(false);

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
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      if (name.trim()) {
        await updateProfile(credential.user, { displayName: name.trim() });
      }
      await sendEmailVerification(credential.user);
      setVerificationSent(true);
    } catch (err: any) {
      switch (err.code) {
        case "auth/email-already-in-use":
          setError("An account with this email already exists.");
          break;
        case "auth/weak-password":
          setError("Password must be at least 6 characters.");
          break;
        case "auth/invalid-email":
          setError("Please enter a valid email address.");
          break;
        default:
          setError(err.message || "Registration failed. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend() {
    const user = auth.currentUser;
    if (!user) return;
    setResending(true);
    try {
      await sendEmailVerification(user);
    } catch {
    } finally {
      setResending(false);
    }
  }

  if (verificationSent) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-muted/30 p-4">
        <Link
          href="/"
          className="absolute top-6 start-6 font-bold text-xl tracking-tight text-primary flex items-center gap-2"
        >
          <span className="bg-primary text-primary-foreground px-2 py-1 rounded-md">AI</span>
          <span>{t("brand")}</span>
        </Link>

        <Card className="w-full max-w-md border-border/50 shadow-xl text-center">
          <CardHeader className="space-y-4 pb-2">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <MailCheck className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">
              Check your inbox
            </CardTitle>
            <CardDescription className="text-base">
              We sent a verification link to{" "}
              <span className="font-semibold text-foreground">{email}</span>.
              Click the link to activate your account and access the dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 pt-4">
            <p className="text-sm text-muted-foreground">
              Didn't receive the email? Check your spam folder or resend it.
            </p>
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={handleResend}
              disabled={resending}
            >
              <RefreshCw className={`h-4 w-4 ${resending ? "animate-spin" : ""}`} />
              {resending ? "Sending..." : "Resend verification email"}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Already verified?{" "}
              <Link href="/login" className="font-semibold text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    );
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
              <Label htmlFor="name">Full Name</Label>
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
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={submitting}
                />
              </div>
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
