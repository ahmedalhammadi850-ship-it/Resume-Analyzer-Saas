import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { getAdminStats, getAllUsers, suspendUser, deleteUser, addScansToUser } from "@/lib/firestore";
import { AdminStats, UserProfile } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Users, FileText, DollarSign, TrendingUp, ShieldAlert, Trash2, Ban, PlusCircle } from "lucide-react";
import { format } from "date-fns";

export default function Admin() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [scanInputs, setScanInputs] = useState<Record<string, string>>({});
  const [addingScans, setAddingScans] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [statsData, usersData] = await Promise.all([
        getAdminStats(),
        getAllUsers()
      ]);
      setStats(statsData);
      setUsers(usersData);
    } catch (error) {
      console.error("Admin load error", error);
      toast({ title: "Failed to load admin data", variant: "destructive" });
    } finally {
      setIsLoading(false);
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
        <Tabs defaultValue="users" className="w-full">
          <TabsList>
            <TabsTrigger value="users">إدارة المستخدمين</TabsTrigger>
            <TabsTrigger value="system">حالة النظام</TabsTrigger>
          </TabsList>

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

          <TabsContent value="system" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>تكاملات النظام</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-md">
                  <div>
                    <div className="font-medium">N8N Webhook (مطابقة الوظيفة)</div>
                    <div className="text-sm text-muted-foreground">الطرف النشط</div>
                  </div>
                  <Badge className="bg-green-500">يعمل</Badge>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-md">
                  <div>
                    <div className="font-medium">N8N Webhook (مراجعة شاملة)</div>
                    <div className="text-sm text-muted-foreground">الطرف النشط</div>
                  </div>
                  <Badge className="bg-green-500">يعمل</Badge>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-md">
                  <div>
                    <div className="font-medium">Firebase Storage</div>
                    <div className="text-sm text-muted-foreground">رفع PDF/DOCX</div>
                  </div>
                  <Badge className="bg-green-500">يعمل</Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
