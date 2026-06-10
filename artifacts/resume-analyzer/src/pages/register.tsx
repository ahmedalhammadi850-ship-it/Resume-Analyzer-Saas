import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { register } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({ title: t("auth.passwordMismatch"), variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: t("auth.passwordMin"), variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      await register(email, password, name);
      toast({ title: t("common.analysisComplete"), description: t("auth.registerSuccess") || "Welcome!" });
      setLocation("/dashboard");
    } catch (error: any) {
      let description = t("common.error");
      if (error.code === "auth/email-already-in-use") {
        description = t("auth.emailInUse") || "This email is already registered. Try signing in instead.";
      } else if (error.code === "auth/invalid-email") {
        description = t("auth.invalidEmail") || "The email address is not valid.";
      } else if (error.code === "auth/weak-password") {
        description = t("auth.passwordMin");
      } else if (error.code === "auth/network-request-failed") {
        description = t("auth.networkError") || "Network error. Check your connection.";
      } else if (error.code === "auth/operation-not-allowed") {
        description = t("auth.notAllowed") || "Email/password sign-up is not enabled.";
      }
      toast({ title: t("auth.registerFailed") || "Registration Failed", description, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-muted/30 p-4">
      <Link href="/" className="absolute top-6 start-6 font-bold text-xl tracking-tight text-primary flex items-center gap-2">
        <span className="bg-primary text-primary-foreground px-2 py-1 rounded-md">AI</span>
        <span>{t("brand")}</span>
      </Link>

      <Card className="w-full max-w-md border-border/50 shadow-xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight">{t("auth.registerTitle")}</CardTitle>
          <CardDescription>{t("auth.registerSubtitle")}</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t("auth.fullName")}</Label>
              <Input
                id="name"
                placeholder={t("auth.namePlaceholder")}
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t("auth.emailPlaceholder")}
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("auth.password")}</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t("auth.confirmPassword")}</Label>
              <Input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? t("auth.registering") : t("auth.registerBtn")}
            </Button>
            <div className="text-sm text-center text-muted-foreground">
              {t("auth.hasAccount")}{" "}
              <Link href="/login" className="font-semibold text-primary hover:underline">
                {t("auth.signIn")}
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
