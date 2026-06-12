import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Check, X, Zap, Crown, Star, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { FREE_PLAN_LIMIT, STARTER_PLAN_LIMIT, PRO_PLAN_LIMIT } from "@/types";

export default function Pricing() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const { userProfile } = useAuth();

  const plan = userProfile?.plan ?? "free";
  const isPro = plan === "pro";
  const isStarter = plan === "starter";
  const totalScans = isPro ? PRO_PLAN_LIMIT : isStarter ? STARTER_PLAN_LIMIT : FREE_PLAN_LIMIT;
  const remaining = userProfile?.remainingScans ?? totalScans;
  const usagePercent = Math.min(100, ((totalScans - remaining) / totalScans) * 100);

  const freeFeatures = [
    { included: true,  text: t("dashPricing.free.f1") },
    { included: true,  text: t("dashPricing.free.f2") },
    { included: true,  text: t("dashPricing.free.f3") },
    { included: true,  text: t("dashPricing.free.f4") },
    { included: false, text: t("dashPricing.free.f5") },
    { included: false, text: t("dashPricing.free.f6") },
  ];

  const starterFeatures = [
    { included: true,  text: t("dashPricing.starter.f1") },
    { included: true,  text: t("dashPricing.starter.f2") },
    { included: true,  text: t("dashPricing.starter.f3") },
    { included: true,  text: t("dashPricing.starter.f4") },
    { included: true,  text: t("dashPricing.starter.f5") },
    { included: true,  text: t("dashPricing.starter.f6") },
  ];

  const proFeatures = [
    { text: t("dashPricing.pro.f1") },
    { text: t("dashPricing.pro.f2") },
    { text: t("dashPricing.pro.f3") },
    { text: t("dashPricing.pro.f4") },
    { text: t("dashPricing.pro.f5") },
    { text: t("dashPricing.pro.f6") },
  ];

  return (
    <Layout>
      <div className="space-y-10 py-4">

        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{t("dashPricing.title")}</h1>
          <p className="text-muted-foreground">{t("dashPricing.subtitle")}</p>
        </div>

        {/* Current Plan Card */}
        <Card className={`border-2 ${isPro ? "border-primary bg-primary/5" : isStarter ? "border-amber-400 bg-amber-50/30 dark:bg-amber-900/10" : "border-border"}`}>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={`h-12 w-12 rounded-full flex items-center justify-center ${isPro ? "bg-primary text-primary-foreground" : isStarter ? "bg-amber-400 text-white" : "bg-secondary text-secondary-foreground"}`}>
                  {isPro ? <Crown className="h-6 w-6" /> : isStarter ? <Star className="h-6 w-6" /> : <Zap className="h-6 w-6" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold">{t("dashPricing.currentPlanLabel")}</h2>
                    <Badge variant={isPro ? "default" : "secondary"} className="uppercase text-[10px] tracking-wider">
                      {isPro ? t("pricing.proPlan") : isStarter ? t("pricing.starterPlan") : t("pricing.freePlan")}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {isPro ? t("dashPricing.proActiveDesc") : isStarter ? t("dashPricing.starterActiveDesc") : t("dashPricing.freeActiveDesc")}
                  </p>
                </div>
              </div>
              {!isPro && (
                <div className="flex gap-2 shrink-0 flex-wrap">
                  {!isStarter && (
                    <Button size="lg" variant="outline" onClick={() => navigate("/upgrade")}>
                      <Star className="h-4 w-4 me-2" />
                      {t("dashPricing.upgradeStarterBtn")}
                    </Button>
                  )}
                  <Button size="lg" onClick={() => navigate("/upgrade")}>
                    <Crown className="h-4 w-4 me-2" />
                    {t("dashPricing.upgradeBtn")}
                  </Button>
                </div>
              )}
            </div>

            {!isPro && (
              <div className="mt-6 pt-5 border-t space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{t("dashPricing.monthlyUsage")}</span>
                  <span className="text-muted-foreground">
                    {userProfile?.remainingScans ?? 0} {t("dashPricing.scansRemaining")}
                  </span>
                </div>
                <Progress value={usagePercent} className={`h-2.5 ${usagePercent >= 100 ? "[&>div]:bg-destructive" : usagePercent >= 70 ? "[&>div]:bg-amber-500" : ""}`} />
                {(userProfile?.remainingScans ?? 0) === 0 && (
                  <p className="text-sm text-destructive font-medium">{t("dashPricing.noScansLeft")}</p>
                )}
              </div>
            )}

            {isPro && (
              <div className="mt-4 pt-4 border-t flex items-center gap-2 text-sm text-muted-foreground">
                <RefreshCw className="h-4 w-4" />
                {t("dashPricing.renewsInfo")}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Plan Cards — 3 columns */}
        <div>
          <h2 className="text-xl font-semibold mb-6">{t("dashPricing.comparePlans")}</h2>
          <div className="grid md:grid-cols-3 gap-5 max-w-5xl">

            {/* Free */}
            <Card className={`flex flex-col ${plan === "free" ? "ring-2 ring-primary" : "opacity-80"}`}>
              {plan === "free" && (
                <div className="bg-primary text-primary-foreground text-center text-xs font-semibold py-1.5 rounded-t-lg tracking-wider">
                  {t("dashPricing.activePlan")}
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-xl">{t("pricing.freePlan")}</CardTitle>
                <CardDescription>{t("pricing.freeDesc")}</CardDescription>
                <div className="mt-3">
                  <span className="text-4xl font-black">$0</span>
                  <span className="text-muted-foreground text-sm ms-1">{t("pubPricing.forever")}</span>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-2.5 text-sm">
                  {freeFeatures.map((f, i) => (
                    <li key={i} className={`flex items-start gap-2.5 ${!f.included ? "text-muted-foreground" : ""}`}>
                      {f.included ? <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" /> : <X className="h-4 w-4 mt-0.5 shrink-0" />}
                      {f.text}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" disabled>
                  {plan === "free" ? t("dashPricing.currentPlanBtn") : t("dashPricing.downgradeBtn")}
                </Button>
              </CardFooter>
            </Card>

            {/* Starter */}
            <Card className={`flex flex-col relative overflow-hidden border-amber-400 ${plan === "starter" ? "ring-2 ring-amber-400 shadow-lg" : ""}`}>
              <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 to-transparent dark:from-amber-900/10 pointer-events-none" />
              {plan === "starter" && (
                <div className="bg-amber-400 text-white text-center text-xs font-semibold py-1.5 rounded-t-lg tracking-wider">
                  {t("dashPricing.activePlan")}
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-xl text-amber-600 dark:text-amber-400">{t("pricing.starterPlan")}</CardTitle>
                <CardDescription>{t("pricing.starterDesc")}</CardDescription>
                <div className="mt-3">
                  <span className="text-4xl font-black">$3</span>
                  <span className="text-muted-foreground text-sm ms-1">{t("pricing.oneTime")}</span>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-2.5 text-sm">
                  {starterFeatures.map((f, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span>{f.text}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  className="w-full border-amber-400 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                  disabled={isStarter || isPro}
                  onClick={() => navigate("/upgrade")}
                >
                  {isStarter ? t("dashPricing.currentPlanBtn") : t("pricing.upgradeStarter")}
                </Button>
              </CardFooter>
            </Card>

            {/* Pro */}
            <Card className={`flex flex-col relative overflow-hidden border-primary shadow-xl ${isPro ? "ring-2 ring-primary" : ""}`}>
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
              {isPro && (
                <div className="bg-primary text-primary-foreground text-center text-xs font-semibold py-1.5 rounded-t-lg tracking-wider">
                  {t("dashPricing.activePlan")}
                </div>
              )}
              {!isPro && (
                <div className="absolute top-4 end-4">
                  <Badge className="bg-primary text-primary-foreground text-[10px] tracking-widest uppercase">
                    {t("pricing.mostPopular")}
                  </Badge>
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-xl text-primary">{t("pricing.proPlan")}</CardTitle>
                <CardDescription>{t("pricing.proDesc")}</CardDescription>
                <div className="mt-3">
                  <span className="text-4xl font-black">$10</span>
                  <span className="text-muted-foreground text-sm ms-1">{t("pricing.perMonth")}</span>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-2.5 text-sm">
                  {proFeatures.map((f, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span className="font-medium">{f.text}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full h-11 text-base font-semibold"
                  disabled={isPro}
                  onClick={() => !isPro && navigate("/upgrade")}
                >
                  {isPro ? t("dashPricing.currentPlanBtn") : t("dashPricing.upgradeBtn")}
                </Button>
              </CardFooter>
            </Card>

          </div>
        </div>

        {/* FAQ strip */}
        <Card className="bg-muted/40 border-none">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">{t("dashPricing.faqTitle")}</h3>
            <div className="grid sm:grid-cols-2 gap-x-10 gap-y-4 text-sm text-muted-foreground">
              <div><p className="font-medium text-foreground mb-1">{t("dashPricing.faq1Q")}</p><p>{t("dashPricing.faq1A")}</p></div>
              <div><p className="font-medium text-foreground mb-1">{t("dashPricing.faq2Q")}</p><p>{t("dashPricing.faq2A")}</p></div>
              <div><p className="font-medium text-foreground mb-1">{t("dashPricing.faq3Q")}</p><p>{t("dashPricing.faq3A")}</p></div>
              <div><p className="font-medium text-foreground mb-1">{t("dashPricing.faq4Q")}</p><p>{t("dashPricing.faq4A")}</p></div>
            </div>
          </CardContent>
        </Card>

      </div>
    </Layout>
  );
}
