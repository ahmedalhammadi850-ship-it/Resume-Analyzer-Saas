import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { userProfile, resetPassword } = useAuth();
  const { toast } = useToast();
  const [isResetting, setIsResetting] = useState(false);

  const handlePasswordReset = async () => {
    if (!userProfile?.email) return;
    setIsResetting(true);
    try {
      await resetPassword(userProfile.email);
      toast({
        title: "Reset link sent",
        description: "Check your email for instructions to reset your password.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send reset link",
        variant: "destructive"
      });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-8 max-w-4xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your account preferences and profile.</p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Your personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" value={userProfile?.name || ""} readOnly disabled className="bg-muted/50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" value={userProfile?.email || ""} readOnly disabled className="bg-muted/50" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Subscription & Billing</CardTitle>
              <CardDescription>Manage your plan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                <div>
                  <div className="font-medium flex items-center gap-2">
                    Current Plan 
                    <Badge variant={userProfile?.plan === "pro" ? "default" : "secondary"} className="uppercase">
                      {userProfile?.plan}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {userProfile?.plan === "free" 
                      ? `You have ${userProfile?.remainingScans} scans remaining.` 
                      : "You have unlimited scans."}
                  </div>
                </div>
                {userProfile?.plan === "free" && (
                  <Button asChild>
                    <a href="/pricing">Upgrade</a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <CardDescription>Keep your account secure</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Password</div>
                  <div className="text-sm text-muted-foreground">A reset link will be sent to your email address.</div>
                </div>
                <Button variant="outline" onClick={handlePasswordReset} disabled={isResetting}>
                  {isResetting ? "Sending..." : "Reset Password"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
