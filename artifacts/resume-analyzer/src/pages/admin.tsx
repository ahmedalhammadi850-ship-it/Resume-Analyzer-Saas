import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { getAdminStats, getAllUsers, suspendUser, deleteUser } from "@/lib/firestore";
import { AdminStats, UserProfile } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Users, FileText, DollarSign, TrendingUp, ShieldAlert, Trash2, Ban } from "lucide-react";
import { format } from "date-fns";

export default function Admin() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
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
    loadData();
  }, [toast]);

  const handleSuspend = async (uid: string) => {
    if (confirm("Are you sure you want to suspend this user?")) {
      await suspendUser(uid);
      toast({ title: "User suspended" });
    }
  };

  const handleDelete = async (uid: string) => {
    if (confirm("Are you sure you want to permanently delete this user?")) {
      await deleteUser(uid);
      setUsers(users.filter(u => u.uid !== uid));
      toast({ title: "User deleted" });
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <ShieldAlert className="h-8 w-8 text-destructive" />
            Admin Control Panel
          </h1>
          <p className="text-muted-foreground mt-1">Platform overview and user management.</p>
        </div>

        {/* STATS */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? <Skeleton className="h-8 w-16" /> : stats?.totalUsers}</div>
              <p className="text-xs text-muted-foreground mt-1">registered accounts</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Analyses</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? <Skeleton className="h-8 w-16" /> : stats?.totalAnalyses}</div>
              <p className="text-xs text-muted-foreground mt-1">scans performed</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{isLoading ? <Skeleton className="h-8 w-16" /> : `$${stats?.monthlyRevenue}`}</div>
              <p className="text-xs text-muted-foreground mt-1">recurring</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New This Month</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? <Skeleton className="h-8 w-16" /> : `+${stats?.monthlyGrowth}`}</div>
              <p className="text-xs text-muted-foreground mt-1">signups</p>
            </CardContent>
          </Card>
        </div>

        {/* TABS */}
        <Tabs defaultValue="users" className="w-full">
          <TabsList>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="system">System Status</TabsTrigger>
          </TabsList>
          
          <TabsContent value="users" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>All Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">Loading users...</TableCell>
                        </TableRow>
                      ) : (
                        users.map((user) => (
                          <TableRow key={user.uid}>
                            <TableCell className="font-medium">{user.name}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              <Badge variant={user.plan === "pro" ? "default" : "secondary"}>
                                {user.plan}
                              </Badge>
                            </TableCell>
                            <TableCell>{user.role}</TableCell>
                            <TableCell>{user.createdAt ? format(new Date(user.createdAt), "MMM d, yyyy") : "N/A"}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="icon" title="Suspend User" onClick={() => handleSuspend(user.uid)}>
                                  <Ban className="h-4 w-4 text-orange-500" />
                                </Button>
                                <Button variant="ghost" size="icon" title="Delete User" onClick={() => handleDelete(user.uid)}>
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
                <CardTitle>System Integrations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-md">
                  <div>
                    <div className="font-medium">N8N Webhook (JD Match)</div>
                    <div className="text-sm text-muted-foreground truncate max-w-md">Endpoint active</div>
                  </div>
                  <Badge className="bg-green-500">Operational</Badge>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-md">
                  <div>
                    <div className="font-medium">N8N Webhook (General)</div>
                    <div className="text-sm text-muted-foreground truncate max-w-md">Endpoint active</div>
                  </div>
                  <Badge className="bg-green-500">Operational</Badge>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-md">
                  <div>
                    <div className="font-medium">Firebase Storage</div>
                    <div className="text-sm text-muted-foreground">PDF/DOCX Uploads</div>
                  </div>
                  <Badge className="bg-green-500">Operational</Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
