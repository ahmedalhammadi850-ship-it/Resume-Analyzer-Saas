import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import {
  getAdminStats, getAllUsers, suspendUser, deleteUser,
  addScansToUser, getUpgradeRequests, approveUpgradeRequest, rejectUpgradeRequest,
  getAppSettings, updateAppSettings,
} from "@/lib/firestore";
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
  Users, FileText, DollarSign, TrendingUp, ShieldAlert,
  Trash2, Ban, PlusCircle, CheckCircle2, XCircle, Clock, RefreshCw,
  Settings, Lock, Unlock, Loader2,
} from "lucide-react";
import { format } from "date-fns";

export default function Admin() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [upgradeRequests, setUpgradeRequests] = useState<UpgradeRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);
  const [scanInputs, setScanInputs] = useState<Record<string, string>>({});
  const [addingScans, setAddingScans] = useState<Record<string, boolean>>({});
  const [processingRequest, setProcessingRequest] = useState<Record<string, boolean>>({});
  const [appSettings, setAppSettings] = useState<AppSettings>({ resumeNameChangeFree: false });
  const [savingSettings, setSavingSettings] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  useEffect(() => {
    loadData();
    loadUpgradeRequests();
    loadAppSettings();
  }, []);

  async function loadAppSettings() {
    try {
      const s = await getAppSettings();
      setAppSettings(s);
    } catch {}
  }

  async function toggleSetting(key: keyof AppSettings) {
    const newVal = !appSettings[key];
    setSavingSettings(prev => ({ ...prev, [key]: true }));
    try {
      await updateAppSettings({ [key]: newVal });
      setAppSettings(prev => ({ ...prev, [key]: newVal }));
      toast({ title: newVal ? "✅ تم التفعيل" : "🔒 تم التعطيل" });
    } catch (e: any) {
      toast({ title: "فشل حفظ الإعداد", description: e.message, variant: "destructive" });
    } finally {
      setSavingSettings(prev => ({ ...prev, [key]: false }));
    }
  }

  async function loadData() {
    try {
      const [statsData, usersData] = await Promise.all([getAdminStats(), getAllUsers()]);
      setStats(statsData);
      setUsers(usersData);
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
      const data = await getUpgradeRequests();
      setUpgradeRequests(data);
    } catch (error) {
      console.error("Failed to load upgrade requests", error);
    } finally {
      setIsLoadingRequests(false);
    }
  }

  const handleSuspend = async (uid: string) => {
    if (confirm("هل أنت متأكد من تعليق هذا المستخدم؟")) {
      await suspendUser(uid);
      toast({ title: "تم تعليق المستخدم" });
    }
  };

  const handleDelete = async (uid: string) => {
    if (confirm("هل أنت متأكد من حذف هذا المستخدم نهائياً؟")) {
      await deleteUser(uid);
      setUsers(users.filter(u => u.uid !== uid));
      toast({ title: "تم حذف المستخدم" });
    }
  };

  const handleAddScans = async (uid: string) => {
    const amount = parseInt(scanInputs[uid] || "5", 10);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "أدخل عدداً صحيحاً أكبر من 0", variant: "destructive" });
      return;
    }
    setAddingScans(prev => ({ ...prev, [uid]: true }));
    try {
      await addScansToUser(uid, amount);
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
      await approveUpgradeRequest(req.requestId, req.userId);
      setUpgradeRequests(prev =>
        prev.map(r => r.requestId === req.requestId ? { ...r, status: "approved" } : r)
      );
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
      await rejectUpgradeRequest(req.requestId);
      setUpgradeRequests(prev =>
        prev.map(r => r.requestId === req.requestId ? { ...r, status: "rejected" } : r)
      );
      toast({ title: `❌ تم رفض طلب ترقية ${req.name}` });
    } catch (e: any) {
      toast({ title: "فشل الرفض", description: e.message, variant: "destructive" });
    } finally {
      setProcessingRequest(prev => ({ ...prev, [req.requestId]: false }));
    }
  };

  const pendingCount = upgradeRequests.filter(r => r.status === "pending").length;

  const statusBadge = (status: UpgradeRequest["status"]) => {
    if (status === "pending")
      return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />قيد المراجعة</Badge>;
    if (status === "approved")
      return <Badge className="bg-green-600 gap-1"><CheckCircle2 className="h-3 w-3" />مقبول</Badge>;
    return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />مرفوض</Badge>;
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <ShieldAlert className="h-8 w-8 text-destructive" />
            لوحة الإدارة
          </h1>
          <p className="text-muted-foreground mt-1">نظرة عامة على المنصة وإدارة المستخدمين.</p>
        </div>

        {/* STATS */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي المستخدمين</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? <Skeleton className="h-8 w-16" /> : stats?.totalUsers}</div>
              <p className="text-xs text-muted-foreground mt-1">حساب مسجّل</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي التحليلات</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? <Skeleton className="h-8 w-16" /> : stats?.totalAnalyses}</div>
              <p className="text-xs text-muted-foreground mt-1">فحص تم إجراؤه</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الإيراد الشهري</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{isLoading ? <Skeleton className="h-8 w-16" /> : `$${stats?.monthlyRevenue}`}</div>
              <p className="text-xs text-muted-foreground mt-1">متكرر</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">جدد هذا الشهر</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? <Skeleton className="h-8 w-16" /> : `+${stats?.monthlyGrowth}`}</div>
              <p className="text-xs text-muted-foreground mt-1">تسجيلات</p>
            </CardContent>
          </Card>
        </div>

        {/* TABS */}
        <Tabs defaultValue="upgrades" className="w-full">
          <TabsList>
            <TabsTrigger value="upgrades" className="gap-2">
              طلبات الترقية
              {pendingCount > 0 && (
                <span className="h-5 min-w-5 px-1 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-bold">
                  {pendingCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="users">إدارة المستخدمين</TabsTrigger>
            <TabsTrigger value="system">حالة النظام</TabsTrigger>
          </TabsList>

          {/* ── Upgrade Requests Tab ── */}
          <TabsContent value="upgrades" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>طلبات الترقية إلى Pro</CardTitle>
                <Button variant="outline" size="sm" onClick={loadUpgradeRequests} disabled={isLoadingRequests}>
                  <RefreshCw className={`h-4 w-4 me-1 ${isLoadingRequests ? "animate-spin" : ""}`} />
                  تحديث
                </Button>
              </CardHeader>
              <CardContent>
                {isLoadingRequests ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
                  </div>
                ) : upgradeRequests.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Clock className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">لا توجد طلبات ترقية بعد</p>
                  </div>
                ) : (
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
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
                            <TableCell className="text-sm">
                              {req.createdAt ? format(new Date(req.createdAt), "MMM d, yyyy – HH:mm") : "—"}
                            </TableCell>
                            <TableCell>
                              {req.status === "pending" ? (
                                <div className="flex justify-center gap-2">
                                  <Button
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700 h-8 px-3 text-xs gap-1"
                                    disabled={processingRequest[req.requestId]}
                                    onClick={() => handleApprove(req)}
                                  >
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    موافقة
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    className="h-8 px-3 text-xs gap-1"
                                    disabled={processingRequest[req.requestId]}
                                    onClick={() => handleReject(req)}
                                  >
                                    <XCircle className="h-3.5 w-3.5" />
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

          {/* ── Users Tab ── */}
          <TabsContent value="users" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>جميع المستخدمين</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>الاسم</TableHead>
                        <TableHead>البريد الإلكتروني</TableHead>
                        <TableHead>الخطة</TableHead>
                        <TableHead>الفحوصات المتبقية</TableHead>
                        <TableHead>إضافة فحوصات</TableHead>
                        <TableHead>تاريخ الانضمام</TableHead>
                        <TableHead className="text-right">الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">جارٍ تحميل المستخدمين...</TableCell>
                        </TableRow>
                      ) : (
                        users.map((user) => (
                          <TableRow key={user.uid}>
                            <TableCell className="font-medium">{user.name}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                            <TableCell>
                              <Badge variant={user.plan === "pro" ? "default" : "secondary"}>
                                {user.plan === "pro" ? "Pro" : "مجاني"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {user.plan === "pro" ? (
                                <span className="text-green-600 font-medium">∞ غير محدود</span>
                              ) : (
                                <span className={`font-bold ${(user.remainingScans ?? 0) === 0 ? "text-red-500" : "text-foreground"}`}>
                                  {user.remainingScans ?? 0}
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Input
                                  type="number"
                                  min="1"
                                  max="100"
                                  placeholder="5"
                                  className="w-16 h-8 text-sm"
                                  value={scanInputs[user.uid] ?? ""}
                                  onChange={(e) => setScanInputs(prev => ({ ...prev, [user.uid]: e.target.value }))}
                                  disabled={user.plan === "pro"}
                                />
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 px-2"
                                  onClick={() => handleAddScans(user.uid)}
                                  disabled={user.plan === "pro" || addingScans[user.uid]}
                                  title="إضافة فحوصات"
                                >
                                  {addingScans[user.uid] ? (
                                    <span className="text-xs">...</span>
                                  ) : (
                                    <PlusCircle className="h-4 w-4 text-green-600" />
                                  )}
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">
                              {user.createdAt ? format(new Date(user.createdAt), "MMM d, yyyy") : "—"}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="icon" title="تعليق المستخدم" onClick={() => handleSuspend(user.uid)}>
                                  <Ban className="h-4 w-4 text-orange-500" />
                                </Button>
                                <Button variant="ghost" size="icon" title="حذف المستخدم" onClick={() => handleDelete(user.uid)}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── System Tab ── */}
          <TabsContent value="system" className="mt-4 space-y-4">

            {/* ── Feature Toggles ── */}
            <Card>
              <CardHeader className="flex flex-row items-center gap-2">
                <Settings className="h-5 w-5 text-muted-foreground" />
                <CardTitle>إعدادات الميزات</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">

                {/* Resume Name Change */}
                <div className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                  appSettings.resumeNameChangeFree
                    ? "border-green-400 bg-green-50/40 dark:bg-green-900/10"
                    : "border-border bg-muted/20"
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                      appSettings.resumeNameChangeFree ? "bg-green-100 dark:bg-green-900/30" : "bg-muted"
                    }`}>
                      {appSettings.resumeNameChangeFree
                        ? <Unlock className="h-4 w-4 text-green-600" />
                        : <Lock className="h-4 w-4 text-muted-foreground" />
                      }
                    </div>
                    <div>
                      <div className="font-medium text-sm">تغيير اسم السيرة الذاتية</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {appSettings.resumeNameChangeFree
                          ? "مجاني — يمكن لأي مستخدم تغيير اسمه بحرية"
                          : "مدفوع — يحتاج دفع لتغيير الاسم المحفوظ"
                        }
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
                    {savingSettings.resumeNameChangeFree ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : appSettings.resumeNameChangeFree ? (
                      <><Lock className="h-3.5 w-3.5" />اجعله مدفوعاً</>
                    ) : (
                      <><Unlock className="h-3.5 w-3.5" />اجعله مجانياً</>
                    )}
                  </Button>
                </div>

              </CardContent>
            </Card>

            {/* ── Webhooks Status ── */}
            <Card>
              <CardHeader>
                <CardTitle>تكاملات النظام</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: "N8N Webhook (مطابقة الوظيفة)", desc: "الطرف النشط" },
                  { label: "N8N Webhook (مراجعة شاملة)", desc: "الطرف النشط" },
                  { label: "N8N Webhook (طلبات الترقية)", desc: "استقبال صور الحوالات" },
                  { label: "Firebase Storage", desc: "رفع PDF/DOCX" },
                ].map(({ label, desc }) => (
                  <div key={label} className="flex items-center justify-between p-4 border rounded-md">
                    <div>
                      <div className="font-medium text-sm">{label}</div>
                      <div className="text-xs text-muted-foreground">{desc}</div>
                    </div>
                    <Badge className="bg-green-500">يعمل</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
