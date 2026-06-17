import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { PublicLayout } from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowRight, Loader2, ShieldCheck, RefreshCw, Zap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePricing } from "@/hooks/usePricing";

export default function PublicPricing() {
  const { t } = useTranslation();
  const { userProfile } = useAuth();
  const { pricing, loading } = usePricing();

  const isPro = userProfile?.plan === "pro";
  const isStarter = userProfile?.plan === "starter";

  const billingLabel = (b: string) => {
    if (b === "forever") return t("pubPricing.forever");
    if (b === "one-time") return t("pricing.oneTime");
    return b;
  };

  if (loading) {
    return (
      <PublicLayout>
        <div className="flex items-center justify-center py-40">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>

      {/* ─── Hero ─── */}
      <section className="py-20 md:py-28 bg-background relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,hsl(var(--primary)/0.1),transparent)]" />
        <div className="container max-w-3xl relative z-10 text-center space-y-5 px-4">
          <Badge variant="secondary" className="uppercase tracking-widest text-xs px-4 py-1.5 rounded-full">
            {t("pubPricing.badge")}
          </Badge>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.1]">
            {t("pubPricing.title")}
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            {t("pubPricing.subtitle")}
          </p>
        </div>
      </section>

      {/* ─── Trust bar ─── */}
      <div className="border-y bg-muted/30 py-4">
        <div className="container px-4">
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-12 text-sm text-muted-foreground">
            {[
              { icon: ShieldCheck, label: t("pubPricing.trust1") || "Secure & Private" },
              { icon: RefreshCw, label: t("pubPricing.trust2") || "Cancel Anytime" },
              { icon: Zap, label: t("pubPricing.trust3") || "Instant Access" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-primary" />
                <span className="font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Cards ─── */}
      <section className="py-20 md:py-24">
        <div className="container px-4">
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">

            {/* Free */}
            {pricing.free.visible && (
              <Card className="flex flex-col border shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl">{t("pricing.freePlan")}</CardTitle>
                  <CardDescription className="text-sm">{t("pricing.freeDesc")}</CardDescription>
                  <div className="mt-5 flex items-end gap-1">
                    <span className="text-5xl font-black leading-none">${pricing.free.price}</span>
                    <span className="text-muted-foreground text-sm mb-1">{billingLabel(pricing.free.billing)}</span>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 pt-4">
                  <ul className="space-y-2.5">
                    {pricing.free.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm">
                        <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="pt-6">
                  <Button variant="outline" className="w-full rounded-full" asChild>
                    <Link href={userProfile ? "/dashboard" : "/register"}>
                      {userProfile ? t("pubPricing.goToDashboard") : t("pricing.getStartedFree")}
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            )}

            {/* Starter */}
            {pricing.starter.visible && (
              <Card className={`flex flex-col relative overflow-hidden transition-shadow ${pricing.starter.mostPopular ? "shadow-xl ring-2 ring-amber-400 scale-[1.02]" : "border shadow-sm hover:shadow-md"}`}>
                <div className="absolute inset-0 bg-gradient-to-br from-amber-50/70 to-transparent dark:from-amber-900/10 pointer-events-none" />
                {pricing.starter.mostPopular && (
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-400 to-orange-400" />
                )}
                {pricing.starter.mostPopular && (
                  <div className="relative z-10 mx-auto -mt-0 mb-0 pt-4 pb-0">
                    <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 text-xs font-semibold px-3 py-1 rounded-full border border-amber-300/50">
                      {t("pricing.mostPopular")}
                    </span>
                  </div>
                )}
                <CardHeader className="pb-2 relative z-10">
                  <CardTitle className="text-xl text-amber-600 dark:text-amber-400">{t("pricing.starterPlan")}</CardTitle>
                  <CardDescription className="text-sm">{t("pricing.starterDesc")}</CardDescription>
                  <div className="mt-5 flex items-end gap-1">
                    <span className="text-5xl font-black leading-none">${pricing.starter.price}</span>
                    <span className="text-muted-foreground text-sm mb-1">{billingLabel(pricing.starter.billing)}</span>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 pt-4 relative z-10">
                  <ul className="space-y-2.5">
                    {pricing.starter.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm">
                        <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="pt-6 relative z-10">
                  <Button
                    className="w-full h-11 text-sm font-semibold rounded-full bg-amber-500 hover:bg-amber-600"
                    disabled={userProfile ? isStarter : false}
                    asChild={!(userProfile && isStarter)}
                  >
                    {userProfile && isStarter ? (
                      <span>{t("dashPricing.currentPlanBtn")}</span>
                    ) : (
                      <Link href={userProfile ? "/upgrade" : "/register"}>
                        {userProfile ? t("pricing.upgradeStarter") : t("pricing.getStarted")}
                        <ArrowRight className="ms-2 h-4 w-4" />
                      </Link>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            )}

            {/* Pro */}
            {pricing.pro.visible && (
              <Card className={`flex flex-col relative overflow-hidden transition-shadow ${pricing.pro.mostPopular ? "shadow-2xl ring-2 ring-primary scale-[1.02]" : "border shadow-sm hover:shadow-md"}`}>
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
                {pricing.pro.mostPopular && (
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary to-blue-400" />
                )}
                {pricing.pro.mostPopular && (
                  <div className="relative z-10 mx-auto pt-4 pb-0">
                    <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full border border-primary/20">
                      {t("pricing.mostPopular")}
                    </span>
                  </div>
                )}
                <CardHeader className="pb-2 relative z-10">
                  <CardTitle className="text-xl text-primary">{t("pricing.proPlan")}</CardTitle>
                  <CardDescription className="text-sm">{t("pricing.proDesc")}</CardDescription>
                  <div className="mt-5 flex items-end gap-1">
                    <span className="text-5xl font-black leading-none">${pricing.pro.price}</span>
                    <span className="text-muted-foreground text-sm mb-1">{billingLabel(pricing.pro.billing)}</span>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 pt-4 relative z-10">
                  <ul className="space-y-2.5">
                    {pricing.pro.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm">
                        <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                        <span className="font-medium">{f}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="pt-6 relative z-10">
                  <Button
                    className="w-full h-11 text-sm font-semibold rounded-full shadow-md shadow-primary/20"
                    disabled={userProfile ? isPro : false}
                    asChild={!(userProfile && isPro)}
                  >
                    {userProfile && isPro ? (
                      <span>{t("dashPricing.currentPlanBtn")}</span>
                    ) : (
                      <Link href={userProfile ? "/upgrade" : "/register"}>
                        {userProfile ? t("pricing.upgradePro") : t("pricing.getStarted")}
                        <ArrowRight className="ms-2 h-4 w-4" />
                      </Link>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            )}

          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="py-20 bg-muted/30">
        <div className="container max-w-3xl px-4">
          <div className="text-center mb-10 space-y-2">
            <p className="text-sm font-semibold text-primary uppercase tracking-widest">FAQ</p>
            <h2 className="text-2xl font-bold">{t("pubPricing.faqTitle")}</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-x-10 gap-y-6">
            {([1, 2, 3, 4] as const).map((n) => (
              <div key={n} className="space-y-1.5">
                <p className="font-semibold text-sm">{t(`pubPricing.faq${n}Q`)}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{t(`pubPricing.faq${n}A`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-20 text-center bg-background">
        <div className="container max-w-xl space-y-6 px-4">
          <h2 className="text-3xl font-bold">{t("pubPricing.ctaTitle")}</h2>
          <p className="text-muted-foreground">{t("pubPricing.ctaSubtitle")}</p>
          <Button size="lg" className="h-13 px-10 text-base rounded-full shadow-lg shadow-primary/25" asChild>
            <Link href="/register">
              {t("pubPricing.ctaBtn")} <ArrowRight className="ms-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

    </PublicLayout>
  );
}
