import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { api } from "@/lib/api";
import { AdminStats, UserProfile, UpgradeRequest, AppSettings } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Users, FileText, DollarSign, TrendingUp, ShieldAlert, Trash2, Ban,
  PlusCircle, CheckCircle2, XCircle, Clock, RefreshCw, Settings,
  Lock, Unlock, Loader2, Crown, UserCheck, UserX, ShieldCheck, Shield,
  BarChart3, AlertTriangle, Tag, Plus, Minus, Eye, EyeOff, Star, Save, LogOut,
  Bell, Send, Sparkles, UserPlus
} from "lucide-react";
import { closeAdminGate } from "@/components/AdminLoginGate";
import { useLocation } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { type PricingConfig } from "@/types";
import { invalidatePricingCache } from "@/hooks/usePricing";

export default function Admin() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [upgradeRequests, setUpgradeRequests] = useState<UpgradeRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);
  const [scanInputs, setScanInputs] = useState<Record<string, string>>({});
  const [addingScans, setAddingScans] = useState<Record<string, boolean>>({});
  const [processingRequest, setProcessingRequest] = useState<Record<string, boolean>>({});
  const [processingUser, setProcessingUser] = useState<Record<string, boolean>>({});
  const [appSettings, setAppSettings] = useState<AppSettings>({ resumeNameChangeFree: false });
  const [savingSettings, setSavingSettings] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [pricingConfig, setPricingConfig] = useState<PricingConfig | null>(null);
  const [editingPricing, setEditingPricing] = useState<PricingConfig | null>(null);
  const [savingPricing, setSavingPricing] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [notifyDialog, setNotifyDialog] = useState<{ uid: string; name: string; email: string } | null>(null);
  const [notifyTitle, setNotifyTitle] = useState("");
  const [notifyMessage, setNotifyMessage] = useState("");
  const [notifyType, setNotifyType] = useState("upgrade");
  const [sendingNotify, setSendingNotify] = useState(false);

  function handleAdminLogout() {
    closeAdminGate();
    setLocation("/");
  }

  function openNotifyDialog(user: any) {
    setNotifyDialog({ uid: user.id, name: user.name || user.email, email: user.email });
    setNotifyTitle("عرض ترقية حصري 🎉");
    setNotifyMessage(`مرحباً ${user.name || ""}،\n\nنودّ إعلامك بأن حسابك مؤهل للترقية إلى خطة Pro بشكل فوري. تواصل معنا للاستفادة من هذا العرض.`);
    setNotifyType("upgrade");
  }

  async function sendNotification() {
    if (!notifyDialog || !notifyTitle.trim() || !notifyMessage.trim()) return;
    setSendingNotify(true);
    try {
      await api.admin.notifyUser(notifyDialog.uid, notifyTitle.trim(), notifyMessage.trim(), notifyType);
      toast({ title: `✅ تم إرسال الإشعار إلى ${notifyDialog.name}` });
      setNotifyDialog(null);
      setNotifyTitle("");
      setNotifyMessage("");
    } catch (e: any) {
      toast({ title: "فشل إرسال الإشعار", description: e.message, variant: "destructive" });
    } finally {
      setSendingNotify(false);
    }
  }

  const newestUsers = [...users].sort((a, b) =>
    new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
  ).slice(0, 6);

  useEffect(() => {
    loadData();
    loadUpgradeRequests();
    loadAppSettings();
    loadPricing();
  }, []);

  async function loadAppSettings() {
    try {
      const s = await api.settings.get();
      setAppSettings(s);
    } catch {}
  }

  async function loadPricing() {
    try {
      const p = await api.pricing.get();
      setPricingConfig(p);
      setEditingPricing(JSON.parse(JSON.stringify(p)));
    } catch {}
  }

  async function savePricing() {
    if (!editingPricing) return;
    setSavingPricing(true);
    try {
      const updated = await api.pricing.update(editingPricing as any);
      setPricingConfig(updated);
      setEditingPricing(JSON.parse(JSON.stringify(updated)));
      invalidatePricingCache();
      toast({ title: "✅ تم حفظ إعدادات التسعير" });
    } catch (e: any) {
      toast({ title: "فشل الحفظ", description: e.message, variant: "destructive" });
    } finally {
      setSavingPricing(false);
    }
  }

  function updatePlanField(plan: keyof PricingConfig, field: string, value: unknown) {
    setEditingPricing(prev => {
      if (!prev) return prev;
      return { ...prev, [plan]: { ...prev[plan], [field]: value } };
    });
  }

  function updateFeature(plan: keyof PricingConfig, idx: number, value: string) {
    setEditingPricing(prev => {
      if (!prev) return prev;
      const features = [...prev[plan].features];
      features[idx] = value;
      return { ...prev, [plan]: { ...prev[plan], features } };
    });
  }

  function addFeature(plan: keyof PricingConfig) {
    setEditingPricing(prev => {
      if (!prev) return prev;
      return { ...prev, [plan]: { ...prev[plan], features: [...prev[plan].features, ""] } };
    });
  }

  function removeFeature(plan: keyof PricingConfig, idx: number) {
    setEditingPricing(prev => {
      if (!prev) return prev;
      const features = prev[plan].features.filter((_, i) => i !== idx);
      return { ...prev, [plan]: { ...prev[plan], features } };
    });
  }

  async function toggleSetting(key: keyof AppSettings) {
    const newVal = !appSettings[key];
    setSavingSettings(prev => ({ ...prev, [key]: true }));
    try {
      await api.settings.update({ [key]: newVal });
      setAppSettings(prev => ({ ...prev, [key]: newVal }));
      toast({ title: newVal ? "✅ تم التفعيل" : "🔒 تم التعطيل" });
    } catch (e: any) {
      toast({ title: "فشل حفظ الإعداد", description: e.message, variant: "destructive" });
    } finally {
      setSavingSettings(prev => ({ ...prev, [key]: false }));
    }
  }

  async function loadData() {
    setIsLoading(true);
    try {
      const [statsData, usersData] = await Promise.all([api.admin.stats(), api.admin.users()]);
      setStats(statsData);
      setUsers(usersData.map((u: any) => ({ ...u, uid: u.id })));
    } catch (error) {
      console.error("Admin load error", error);
      toast({ title: "فشل تحميل بيانات الإدارة", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }

  async function loadUpgradeRequests() {
    setIsLoadingRequests(true);
    try {
      const data = await api.admin.upgradeRequests();
      setUpgradeRequests(data);
    } catch (error) {
      console.error("Failed to load upgrade requests", error);
    } finally {
      setIsLoadingRequests(false);
    }
  }

  const withUserAction = (uid: string, fn: () => Promise<void>) => async () => {
    setProcessingUser(prev => ({ ...prev, [uid]: true }));
    try { await fn(); } finally {
      setProcessingUser(prev => ({ ...prev, [uid]: false }));
    }
  };

  const handleSuspend = (uid: string) => withUserAction(uid, async () => {
    if (!confirm("هل أنت متأكد من تعليق هذا المستخدم؟")) return;
    await api.admin.suspendUser(uid);
    setUsers(prev => prev.map(u => u.id === uid ? { ...u, suspended: true } as any : u));
    toast({ title: "تم تعليق المستخدم" });
  })();

  const handleUnsuspend = (uid: string) => withUserAction(uid, async () => {
    await api.admin.unsuspendUser(uid);
    setUsers(prev => prev.map(u => u.id === uid ? { ...u, suspended: false } as any : u));
    toast({ title: "✅ تم إلغاء تعليق المستخدم" });
  })();

  const handleDelete = async (uid: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا المستخدم نهائياً؟")) return;
    setProcessingUser(prev => ({ ...prev, [uid]: true }));
    try {
      await api.admin.deleteUser(uid);
      setUsers(users.filter(u => u.id !== uid));
      toast({ title: "تم حذف المستخدم" });
    } finally {
      setProcessingUser(prev => ({ ...prev, [uid]: false }));
    }
  };

  const handleChangeRole = (uid: string, currentRole: string) => withUserAction(uid, async () => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    if (!confirm(`هل تريد ${newRole === "admin" ? "ترقية هذا المستخدم إلى أدمن" : "إزالة صلاحيات الأدمن"}؟`)) return;
    await api.admin.changeRole(uid, newRole);
    setUsers(prev => prev.map(u => u.id === uid ? { ...u, role: newRole as any } : u));
    toast({ title: newRole === "admin" ? "✅ تمت الترقية إلى أدمن" : "تم تغيير الدور إلى مستخدم عادي" });
  })();

  const handleChangePlan = (uid: string, currentPlan: string) => withUserAction(uid, async () => {
    const newPlan = currentPlan === "pro" ? "free" : "pro";
    if (!confirm(`هل تريد تغيير الخطة إلى ${newPlan === "pro" ? "Pro" : "مجانية"}؟`)) return;
    await api.admin.changePlan(uid, newPlan);
    setUsers(prev => prev.map(u => u.id === uid ? { ...u, plan: newPlan as any } : u));
    toast({ title: `✅ تم تغيير الخطة إلى ${newPlan === "pro" ? "Pro" : "مجانية"}` });
  })();

  const handleAddScans = async (uid: string) => {
    const amount = parseInt(scanInputs[uid] || "5", 10);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "أدخل عدداً صحيحاً أكبر من 0", variant: "destructive" });
      return;
    }
    setAddingScans(prev => ({ ...prev, [uid]: true }));
    try {
      await api.admin.addScans(uid, amount);
      toast({ title: `✅ تمت إضافة ${amount} فحص للمستخدم` });
      setScanInputs(prev => ({ ...prev, [uid]: "" }));
      await loadData();
    } catch (e: any) {
      toast({ title: "فشلت إضافة الفحوصات", description: e.message, variant: "destructive" });
    } finally {
      setAddingScans(prev => ({ ...prev, [uid]: false }));
    }
  };

  const handleApprove = async (req: UpgradeRequest) => {
    setProcessingRequest(prev => ({ ...prev, [req.requestId]: true }));
    try {
      await api.admin.approveUpgrade(req.requestId);
      setUpgradeRequests(prev => prev.map(r => r.requestId === req.requestId ? { ...r, status: "approved" } : r));
      toast({ title: `✅ تمت الموافقة على ترقية ${req.name}` });
      await loadData();
    } catch (e: any) {
      toast({ title: "فشلت الموافقة", description: e.message, variant: "destructive" });
    } finally {
      setProcessingRequest(prev => ({ ...prev, [req.requestId]: false }));
    }
  };

  const handleReject = async (req: UpgradeRequest) => {
    setProcessingRequest(prev => ({ ...prev, [req.requestId]: true }));
    try {
      await api.admin.rejectUpgrade(req.requestId);
      setUpgradeRequests(prev => prev.map(r => r.requestId === req.requestId ? { ...r, status: "rejected" } : r));
      toast({ title: `❌ تم رفض طلب ترقية ${req.name}` });
    } catch (e: any) {
      toast({ title: "فشل الرفض", description: e.message, variant: "destructive" });
    } finally {
      setProcessingRequest(prev => ({ ...prev, [req.requestId]: false }));
    }
  };

  const pendingCount = upgradeRequests.filter(r => r.status === "pending").length;
  const suspendedCount = users.filter((u: any) => u.suspended).length;
  const proCount = users.filter(u => u.plan === "pro").length;

  const filteredUsers = users.filter(u =>
    !searchQuery ||
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statusBadge = (status: UpgradeRequest["status"]) => {
    if (status === "pending") return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />قيد المراجعة</Badge>;
    if (status === "approved") return <Badge className="bg-green-600 gap-1"><CheckCircle2 className="h-3 w-3" />مقبول</Badge>;
    return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />مرفوض</Badge>;
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Notify Dialog */}
        <Dialog open={!!notifyDialog} onOpenChange={open => !open && setNotifyDialog(null)}>
          <DialogContent className="sm:max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-amber-500" />
                إرسال إشعار إلى {notifyDialog?.name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label className="text-sm">نوع الإشعار</Label>
                <div className="flex gap-2">
                  {[
                    { value: "upgrade", label: "ترقية", icon: Crown },
                    { value: "info", label: "معلومة", icon: Bell },
                    { value: "warning", label: "تنبيه", icon: AlertTriangle },
                  ].map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setNotifyType(value)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md border text-xs font-medium transition-colors ${notifyType === value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted"}`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="notify-title" className="text-sm">العنوان</Label>
                <Input
                  id="notify-title"
                  value={notifyTitle}
                  onChange={e => setNotifyTitle(e.target.value)}
                  placeholder="عنوان الإشعار..."
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="notify-msg" className="text-sm">الرسالة</Label>
                <Textarea
                  id="notify-msg"
                  value={notifyMessage}
                  onChange={e => setNotifyMessage(e.target.value)}
                  placeholder="اكتب رسالتك هنا..."
                  rows={4}
                  className="resize-none text-sm"
                />
              </div>
            </div>
            <DialogFooter className="gap-2 flex-row-reverse sm:flex-row-reverse">
              <Button variant="outline" onClick={() => setNotifyDialog(null)}>إلغاء</Button>
              <Button
                onClick={sendNotification}
                disabled={sendingNotify || !notifyTitle.trim() || !notifyMessage.trim()}
                className="gap-2"
              >
                {sendingNotify ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                إرسال
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <ShieldAlert className="h-8 w-8 text-destructive" />
              لوحة الإدارة
            </h1>
            <p className="text-muted-foreground mt-1">نظرة شاملة على المنصة وإدارة المستخدمين.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => { loadData(); loadUpgradeRequests(); }} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 me-2 ${isLoading ? "animate-spin" : ""}`} />
              تحديث
            </Button>
            <Button variant="ghost" size="sm" onClick={handleAdminLogout} className="text-muted-foreground hover:text-destructive">
              <LogOut className="h-4 w-4 me-2" />
              خروج
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            { title: "إجمالي المستخدمين", icon: Users, value: stats?.totalUsers, sub: `${proCount} Pro · ${suspendedCount} موقوف`, color: "" },
            { title: "إجمالي التحليلات", icon: FileText, value: stats?.totalAnalyses, sub: "فحص تم إجراؤه", color: "" },
            { title: "الإيراد الشهري", icon: DollarSign, value: stats ? `$${stats.monthlyRevenue}` : undefined, sub: `${stats?.activeSubscribers ?? 0} مشترك Pro`, color: "text-green-600" },
            { title: "جدد هذا الشهر", icon: TrendingUp, value: stats ? `+${stats.monthlyGrowth}` : undefined, sub: "تسجيل جديد", color: "text-blue-600" },
          ].map(({ title, icon: Icon, value, sub, color }) => (
            <Card key={title} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${color}`}>
                  {isLoading ? <Skeleton className="h-8 w-16" /> : value ?? "—"}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Newest Users */}
        {!isLoading && newestUsers.length > 0 && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" />
                أحدث المستخدمين
                <Badge variant="secondary" className="text-xs">{newestUsers.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {newestUsers.map((user: any) => (
                  <div key={user.id} className="flex items-center gap-3 p-3 rounded-lg bg-background border hover:shadow-sm transition-shadow">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 font-bold text-primary text-sm">
                      {(user.name || user.email || "?")[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{user.name || "—"}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                        {user.createdAt ? format(new Date(user.createdAt), "MMM d, yyyy") : "—"}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant={user.plan === "pro" ? "default" : "secondary"} className="text-[10px] h-4 px-1.5">
                        {user.plan === "pro" ? "Pro" : "Free"}
                      </Badge>
                      <Button
                        variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-amber-600"
                        title="إرسال إشعار"
                        onClick={() => openNotifyDialog(user)}
                      >
                        <Bell className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              المستخدمون
              {isLoading ? null : <span className="h-5 min-w-5 px-1 rounded-full bg-muted text-muted-foreground text-xs flex items-center justify-center">{users.length}</span>}
            </TabsTrigger>
            <TabsTrigger value="upgrades" className="gap-2">
              <Crown className="h-4 w-4" />
              طلبات الترقية
              {pendingCount > 0 && <span className="h-5 min-w-5 px-1 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-bold">{pendingCount}</span>}
            </TabsTrigger>
            <TabsTrigger value="pricing" className="gap-2">
              <Tag className="h-4 w-4" />
              الأسعار
            </TabsTrigger>
            <TabsTrigger value="system" className="gap-2">
              <Settings className="h-4 w-4" />
              الإعدادات
            </TabsTrigger>
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              نظرة عامة
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <CardTitle>إدارة المستخدمين</CardTitle>
                <Input
                  placeholder="بحث بالاسم أو البريد..."
                  className="max-w-xs h-8 text-sm"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">لا يوجد مستخدمون</p>
                  </div>
                ) : (
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>المستخدم</TableHead>
                          <TableHead>الخطة</TableHead>
                          <TableHead>الدور</TableHead>
                          <TableHead>الفحوصات</TableHead>
                          <TableHead>الحالة</TableHead>
                          <TableHead>إضافة فحوصات</TableHead>
                          <TableHead>تاريخ الانضمام</TableHead>
                          <TableHead className="text-center">إجراءات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.map((user: any) => (
                          <TableRow key={user.id} className={user.suspended ? "opacity-60 bg-red-50/30 dark:bg-red-900/10" : ""}>
                            <TableCell>
                              <div>
                                <div className="font-medium text-sm">{user.name || "—"}</div>
                                <div className="text-xs text-muted-foreground">{user.email}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <button
                                onClick={() => handleChangePlan(user.id, user.plan)}
                                disabled={processingUser[user.id]}
                                title="اضغط لتغيير الخطة"
                                className="cursor-pointer"
                              >
                                <Badge variant={user.plan === "pro" ? "default" : "secondary"} className="gap-1">
                                  {user.plan === "pro" ? <><Crown className="h-3 w-3" />Pro</> : "مجاني"}
                                </Badge>
                              </button>
                            </TableCell>
                            <TableCell>
                              <button
                                onClick={() => handleChangeRole(user.id, user.role)}
                                disabled={processingUser[user.id]}
                                title="اضغط لتغيير الدور"
                                className="cursor-pointer"
                              >
                                <Badge variant={user.role === "admin" ? "destructive" : "outline"} className="gap-1">
                                  {user.role === "admin" ? <><ShieldCheck className="h-3 w-3" />أدمن</> : <><Shield className="h-3 w-3" />مستخدم</>}
                                </Badge>
                              </button>
                            </TableCell>
                            <TableCell>
                              {user.plan === "pro"
                                ? <span className="text-green-600 font-medium text-sm">∞</span>
                                : <span className={`font-bold text-sm ${(user.remainingScans ?? 0) === 0 ? "text-red-500" : ""}`}>{user.remainingScans ?? 0}</span>
                              }
                            </TableCell>
                            <TableCell>
                              {user.suspended
                                ? <Badge variant="destructive" className="text-xs gap-1"><AlertTriangle className="h-3 w-3" />موقوف</Badge>
                                : <Badge variant="outline" className="text-xs text-green-600 border-green-300 gap-1"><CheckCircle2 className="h-3 w-3" />نشط</Badge>
                              }
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Input
                                  type="number" min="1" max="100" placeholder="5"
                                  className="w-16 h-8 text-sm"
                                  value={scanInputs[user.id] ?? ""}
                                  onChange={(e) => setScanInputs(prev => ({ ...prev, [user.id]: e.target.value }))}
                                  disabled={user.plan === "pro"}
                                />
                                <Button
                                  variant="outline" size="sm" className="h-8 px-2"
                                  onClick={() => handleAddScans(user.id)}
                                  disabled={user.plan === "pro" || addingScans[user.id]}
                                >
                                  {addingScans[user.id] ? <Loader2 className="h-3 w-3 animate-spin" /> : <PlusCircle className="h-4 w-4 text-green-600" />}
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {user.createdAt ? format(new Date(user.createdAt), "MMM d, yyyy") : "—"}
                            </TableCell>
                            <TableCell>
                              <div className="flex justify-center gap-1">
                                {processingUser[user.id] ? (
                                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                ) : (
                                  <>
                                    <Button variant="ghost" size="icon" title="إرسال إشعار" onClick={() => openNotifyDialog(user)}>
                                      <Bell className="h-4 w-4 text-amber-500" />
                                    </Button>
                                    {user.suspended ? (
                                      <Button variant="ghost" size="icon" title="إلغاء التعليق" onClick={() => handleUnsuspend(user.id)}>
                                        <UserCheck className="h-4 w-4 text-green-500" />
                                      </Button>
                                    ) : (
                                      <Button variant="ghost" size="icon" title="تعليق المستخدم" onClick={() => handleSuspend(user.id)}>
                                        <UserX className="h-4 w-4 text-orange-500" />
                                      </Button>
                                    )}
                                    <Button variant="ghost" size="icon" title="حذف المستخدم" onClick={() => handleDelete(user.id)}>
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Upgrade Requests Tab */}
          <TabsContent value="upgrades" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>طلبات الترقية إلى Pro</CardTitle>
                <Button variant="outline" size="sm" onClick={loadUpgradeRequests} disabled={isLoadingRequests}>
                  <RefreshCw className={`h-4 w-4 me-1 ${isLoadingRequests ? "animate-spin" : ""}`} />تحديث
                </Button>
              </CardHeader>
              <CardContent>
                {isLoadingRequests ? (
                  <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
                ) : upgradeRequests.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Clock className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">لا توجد طلبات ترقية بعد</p>
                  </div>
                ) : (
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>الاسم</TableHead>
                          <TableHead>البريد الإلكتروني</TableHead>
                          <TableHead>الحالة</TableHead>
                          <TableHead>n8n</TableHead>
                          <TableHead>تاريخ الطلب</TableHead>
                          <TableHead className="text-center">الإجراءات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {upgradeRequests.map((req) => (
                          <TableRow key={req.requestId}>
                            <TableCell className="font-medium">{req.name || "—"}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{req.email}</TableCell>
                            <TableCell>{statusBadge(req.status)}</TableCell>
                            <TableCell>
                              {req.n8nSent
                                ? <Badge variant="outline" className="text-green-600 border-green-300 text-xs">أُرسل ✓</Badge>
                                : <Badge variant="outline" className="text-muted-foreground text-xs">لم يُرسل</Badge>
                              }
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {req.createdAt ? format(new Date(req.createdAt), "MMM d, yyyy – HH:mm") : "—"}
                            </TableCell>
                            <TableCell>
                              {req.status === "pending" ? (
                                <div className="flex justify-center gap-2">
                                  <Button
                                    size="sm" className="bg-green-600 hover:bg-green-700 h-8 px-3 text-xs gap-1"
                                    disabled={processingRequest[req.requestId]}
                                    onClick={() => handleApprove(req)}
                                  >
                                    {processingRequest[req.requestId] ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                                    موافقة
                                  </Button>
                                  <Button
                                    size="sm" variant="destructive" className="h-8 px-3 text-xs gap-1"
                                    disabled={processingRequest[req.requestId]}
                                    onClick={() => handleReject(req)}
                                  >
                                    {processingRequest[req.requestId] ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                                    رفض
                                  </Button>
                                </div>
                              ) : (
                                <div className="text-center text-xs text-muted-foreground">
                                  {req.reviewedAt ? format(new Date(req.reviewedAt), "MMM d") : "—"}
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pricing Tab */}
          <TabsContent value="pricing" className="mt-4 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">إدارة خطط التسعير</h2>
                <p className="text-sm text-muted-foreground">التغييرات تنعكس فوراً على صفحة التسعير العامة.</p>
              </div>
              <Button onClick={savePricing} disabled={savingPricing || !editingPricing} className="gap-2">
                {savingPricing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                حفظ التغييرات
              </Button>
            </div>

            {!editingPricing ? (
              <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
            ) : (
              <div className="grid md:grid-cols-3 gap-5">
                {(["free", "starter", "pro"] as const).map(plan => {
                  const p = editingPricing[plan];
                  const planColors: Record<string, string> = {
                    free: "border-border",
                    starter: "border-amber-400",
                    pro: "border-primary",
                  };
                  const planLabels: Record<string, string> = {
                    free: "مجاني",
                    starter: "Starter",
                    pro: "Pro",
                  };
                  return (
                    <Card key={plan} className={`border-2 ${planColors[plan]}`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{planLabels[plan]}</CardTitle>
                          <div className="flex items-center gap-2">
                            <Label htmlFor={`visible-${plan}`} className="text-xs text-muted-foreground">ظاهر</Label>
                            <Switch
                              id={`visible-${plan}`}
                              checked={p.visible}
                              onCheckedChange={v => updatePlanField(plan, "visible", v)}
                            />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Price */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">السعر ($)</Label>
                            <Input
                              type="number" min="0" step="0.5"
                              value={p.price}
                              onChange={e => updatePlanField(plan, "price", parseFloat(e.target.value) || 0)}
                              className="h-8 text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">عدد الفحوصات</Label>
                            <Input
                              type="number" min="0"
                              value={p.scanLimit}
                              onChange={e => updatePlanField(plan, "scanLimit", parseInt(e.target.value) || 0)}
                              className="h-8 text-sm"
                            />
                          </div>
                        </div>

                        {/* Billing label */}
                        <div className="space-y-1">
                          <Label className="text-xs">نوع الفوترة</Label>
                          <select
                            value={p.billing}
                            onChange={e => updatePlanField(plan, "billing", e.target.value)}
                            className="w-full h-8 rounded-md border border-input bg-background px-3 text-sm"
                          >
                            <option value="forever">مجاني للأبد</option>
                            <option value="one-time">دفعة واحدة</option>
                            <option value="/month">شهرياً</option>
                            <option value="/year">سنوياً</option>
                          </select>
                        </div>

                        {/* Toggles */}
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-1.5 text-muted-foreground">
                              <Star className="h-3.5 w-3.5" />الأكثر شيوعاً
                            </span>
                            <Switch
                              checked={p.mostPopular}
                              onCheckedChange={v => updatePlanField(plan, "mostPopular", v)}
                            />
                          </div>
                        </div>

                        {/* Features */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs">المزايا</Label>
                            <Button size="sm" variant="ghost" className="h-6 px-2 text-xs gap-1" onClick={() => addFeature(plan)}>
                              <Plus className="h-3 w-3" /> إضافة
                            </Button>
                          </div>
                          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                            {p.features.map((f, i) => (
                              <div key={i} className="flex items-center gap-1">
                                <Input
                                  value={f}
                                  onChange={e => updateFeature(plan, i, e.target.value)}
                                  className="h-7 text-xs flex-1"
                                  placeholder={`ميزة ${i + 1}`}
                                />
                                <Button
                                  size="icon" variant="ghost" className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                                  onClick={() => removeFeature(plan, i)}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Preview badge */}
                        <div className={`text-xs rounded-md p-2 text-center font-medium ${p.visible ? "bg-green-50 text-green-700 dark:bg-green-900/20" : "bg-muted text-muted-foreground"}`}>
                          {p.visible ? <><Eye className="inline h-3 w-3 me-1" />ظاهر للزوار</> : <><EyeOff className="inline h-3 w-3 me-1" />مخفي</>}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Live preview summary */}
            {editingPricing && (
              <Card className="bg-muted/40 border-dashed">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Eye className="h-4 w-4" /> معاينة — كيف ستظهر للزوار
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-6 flex-wrap">
                    {(["free", "starter", "pro"] as const).map(plan => {
                      const p = editingPricing[plan];
                      if (!p.visible) return null;
                      const labels = { free: "مجاني", starter: "Starter", pro: "Pro" };
                      const billing = p.billing === "forever" ? "للأبد" : p.billing === "one-time" ? "مرة واحدة" : p.billing;
                      return (
                        <div key={plan} className="flex items-baseline gap-2 border rounded-md px-4 py-2 bg-background">
                          <span className="font-bold">{labels[plan]}</span>
                          <span className="text-xl font-black">${p.price}</span>
                          <span className="text-xs text-muted-foreground">{billing}</span>
                          <span className="text-xs text-muted-foreground">· {p.scanLimit} فحص</span>
                          {p.mostPopular && <Badge className="text-[10px] h-4">الأكثر شيوعاً</Badge>}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* System Settings Tab */}
          <TabsContent value="system" className="mt-4 space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center gap-2">
                <Settings className="h-5 w-5 text-muted-foreground" />
                <CardTitle>إعدادات الميزات</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${appSettings.resumeNameChangeFree ? "border-green-400 bg-green-50/40 dark:bg-green-900/10" : "border-border bg-muted/20"}`}>
                  <div className="flex items-center gap-3">
                    <div className={`h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 ${appSettings.resumeNameChangeFree ? "bg-green-100 dark:bg-green-900/30" : "bg-muted"}`}>
                      {appSettings.resumeNameChangeFree ? <Unlock className="h-4 w-4 text-green-600" /> : <Lock className="h-4 w-4 text-muted-foreground" />}
                    </div>
                    <div>
                      <div className="font-medium text-sm">تغيير اسم السيرة الذاتية</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {appSettings.resumeNameChangeFree ? "مجاني — يمكن لأي مستخدم تغيير اسمه بحرية" : "مدفوع — يحتاج دفع لتغيير الاسم المحفوظ"}
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={appSettings.resumeNameChangeFree ? "destructive" : "default"}
                    className="min-w-[90px] gap-1.5"
                    disabled={savingSettings.resumeNameChangeFree}
                    onClick={() => toggleSetting("resumeNameChangeFree")}
                  >
                    {savingSettings.resumeNameChangeFree
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : appSettings.resumeNameChangeFree
                        ? <><Lock className="h-3.5 w-3.5" />اجعله مدفوعاً</>
                        : <><Unlock className="h-3.5 w-3.5" />اجعله مجانياً</>
                    }
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">توزيع الخطط</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {isLoading ? (
                    <div className="space-y-2">{[...Array(2)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full bg-primary" />
                          <span className="text-sm font-medium">Pro</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="h-2 bg-muted rounded-full w-32 overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: users.length ? `${(proCount / users.length) * 100}%` : "0%" }} />
                          </div>
                          <span className="text-sm font-bold w-8 text-right">{proCount}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full bg-muted-foreground" />
                          <span className="text-sm font-medium">مجاني</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="h-2 bg-muted rounded-full w-32 overflow-hidden">
                            <div className="h-full bg-muted-foreground rounded-full" style={{ width: users.length ? `${((users.length - proCount) / users.length) * 100}%` : "0%" }} />
                          </div>
                          <span className="text-sm font-bold w-8 text-right">{users.length - proCount}</span>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">ملخص سريع</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { label: "إجمالي المستخدمين", value: stats?.totalUsers ?? "—", icon: Users },
                    { label: "مشتركو Pro", value: stats?.activeSubscribers ?? "—", icon: Crown },
                    { label: "مستخدمون موقوفون", value: suspendedCount, icon: Ban },
                    { label: "إجمالي الفحوصات", value: stats?.totalAnalyses ?? "—", icon: FileText },
                  ].map(({ label, value, icon: Icon }) => (
                    <div key={label} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Icon className="h-4 w-4" />
                        {label}
                      </div>
                      <span className="font-bold">{isLoading ? <Skeleton className="h-4 w-8" /> : value}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    كيفية الوصول للوحة الإدارة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground space-y-2 bg-muted/30 p-4 rounded-lg">
                    <p>• المستخدمون الذين يملكون دور <strong>"أدمن"</strong> يمكنهم الوصول لهذه اللوحة تلقائياً.</p>
                    <p>• لترقية مستخدم إلى أدمن: اضغط على badge الدور في جدول المستخدمين.</p>
                    <p>• لتغيير خطة مستخدم: اضغط على badge الخطة في جدول المستخدمين.</p>
                    <p>• إذا كنت أول مستخدم ولا يوجد أدمن بعد، استخدم endpoint: <code className="bg-muted px-1 rounded">/api/admin/setup</code></p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
