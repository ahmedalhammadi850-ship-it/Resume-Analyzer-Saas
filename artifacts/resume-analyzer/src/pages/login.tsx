import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password);
      setLocation("/dashboard");
    } catch (error: any) {
      let description = t("auth.emailRequired");
      if (error.code === "auth/invalid-credential" || error.code === "auth/wrong-password" || error.code === "auth/user-not-found") {
        description = t("auth.invalidCredentials") || "Invalid email or password.";
      } else if (error.code === "auth/too-many-requests") {
        description = t("auth.tooManyRequests") || "Too many attempts. Please try again later.";
      } else if (error.code === "auth/network-request-failed") {
        description = t("auth.networkError") || "Network error. Check your connection.";
      }
      toast({
        title: t("auth.loginFailed") || "Login Failed",
        description,
        variant: "destructive",
      });
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
          <CardTitle className="text-2xl font-bold tracking-tight">{t("auth.loginTitle")}</CardTitle>
          <CardDescription>{t("auth.loginSubtitle")}</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
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
              <div className="flex items-center justify-between">
                <Label htmlFor="password">{t("auth.password")}</Label>
                <Link href="/forgot-password" className="text-sm font-medium text-primary hover:underline">
                  {t("auth.forgotPassword") || "Forgot password?"}
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? t("auth.loggingIn") : t("auth.loginBtn")}
            </Button>
            <div className="text-sm text-center text-muted-foreground">
              {t("auth.noAccount")}{" "}
              <Link href="/register" className="font-semibold text-primary hover:underline">
                {t("auth.signUp")}
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
