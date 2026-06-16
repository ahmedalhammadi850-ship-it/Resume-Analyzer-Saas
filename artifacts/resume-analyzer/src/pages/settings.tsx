import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Settings() {
  const { t } = useTranslation();
  const { userProfile } = useAuth();

  return (
    <Layout>
      <div className="space-y-8 max-w-4xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("settings.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("settings.subtitle")}</p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("settings.profileInfo")}</CardTitle>
              <CardDescription>{t("settings.personalDetails")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t("settings.name")}</Label>
                  <Input id="name" value={userProfile?.name || ""} readOnly disabled className="bg-muted/50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t("settings.email")}</Label>
                  <Input id="email" value={userProfile?.email || ""} readOnly disabled className="bg-muted/50" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("settings.subscriptionBilling")}</CardTitle>
              <CardDescription>{t("settings.manageYourPlan")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                <div>
                  <div className="font-medium flex items-center gap-2">
                    {t("settings.plan")}
                    <Badge variant={userProfile?.plan === "pro" ? "default" : "secondary"} className="uppercase">
                      {userProfile?.plan}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {userProfile?.plan === "free"
                      ? t("settings.scansRemaining", { count: userProfile?.remainingScans })
                      : t("settings.unlimitedScans")}
                  </div>
                </div>
                {userProfile?.plan === "free" && (
                  <Button asChild>
                    <a href="/pricing">{t("settings.upgrade")}</a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("settings.account")}</CardTitle>
              <CardDescription>{t("settings.manageLogin")}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {t("settings.firebaseAuthNote")}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
