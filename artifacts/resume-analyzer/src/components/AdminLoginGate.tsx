import { useState, useEffect } from "react";
import { ShieldAlert, Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const ADMIN_GATE_KEY = "admin_gate_session";
const ADMIN_NAME = "ahmed";
const ADMIN_PASSWORD = "admin7707";

function isGateOpen(): boolean {
  try {
    const raw = localStorage.getItem(ADMIN_GATE_KEY);
    if (!raw) return false;
    const { expires } = JSON.parse(raw) as { expires: number };
    return Date.now() < expires;
  } catch {
    return false;
  }
}

function openGate() {
  const expires = Date.now() + 8 * 60 * 60 * 1000;
  localStorage.setItem(ADMIN_GATE_KEY, JSON.stringify({ expires }));
}

export function closeAdminGate() {
  localStorage.removeItem(ADMIN_GATE_KEY);
}

interface AdminLoginGateProps {
  children: React.ReactNode;
}

export function AdminLoginGate({ children }: AdminLoginGateProps) {
  const [authenticated, setAuthenticated] = useState(false);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    setAuthenticated(isGateOpen());
    setChecking(false);
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (authenticated) {
    return <>{children}</>;
  }

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    setTimeout(() => {
      const nameOk = name.trim().toLowerCase() === ADMIN_NAME.toLowerCase();
      const passOk = password === ADMIN_PASSWORD;

      if (nameOk && passOk) {
        openGate();
        setAuthenticated(true);
      } else {
        setError("الاسم أو كلمة المرور غير صحيحة");
      }
      setLoading(false);
    }, 600);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="h-16 w-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4 border border-destructive/20">
            <ShieldAlert className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">لوحة الإدارة</h1>
          <p className="text-muted-foreground text-sm mt-1">منطقة محمية — أدمن فقط</p>
        </div>

        <Card className="shadow-lg border-border/60">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Lock className="h-4 w-4 text-muted-foreground" />
              تسجيل الدخول
            </CardTitle>
            <CardDescription className="text-xs">
              أدخل بيانات الأدمن للوصول إلى لوحة التحكم
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="admin-name" className="text-sm">الاسم</Label>
                <Input
                  id="admin-name"
                  type="text"
                  placeholder="اسم الأدمن"
                  value={name}
                  onChange={e => { setName(e.target.value); setError(""); }}
                  autoComplete="username"
                  autoFocus
                  className="h-10"
                  dir="ltr"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="admin-password" className="text-sm">كلمة المرور</Label>
                <div className="relative">
                  <Input
                    id="admin-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError(""); }}
                    autoComplete="current-password"
                    className="h-10 pe-10"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="absolute inset-y-0 end-0 flex items-center pe-3 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2 text-center">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-10"
                disabled={loading || !name.trim() || !password}
              >
                {loading ? (
                  <><Loader2 className="h-4 w-4 animate-spin me-2" />جاري التحقق...</>
                ) : (
                  "دخول"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          الجلسة تنتهي تلقائياً بعد 8 ساعات
        </p>
      </div>
    </div>
  );
}
