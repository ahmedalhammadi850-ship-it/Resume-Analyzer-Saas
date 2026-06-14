import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { PublicLayout } from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, ArrowRight, Loader2 } from "lucide-react";
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
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="py-20 bg-muted/30 text-center">
        <div className="container max-w-3xl space-y-4">
          <Badge variant="secondary" className="uppercase tracking-widest text-xs mb-2">{t("pubPricing.badge")}</Badge>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">{t("pubPricing.title")}</h1>
          <p className="text-xl text-muted-foreground max-w-xl mx-auto">{t("pubPricing.subtitle")}</p>
        </div>
      </section>

      {/* Cards */}
      <section className="py-20">
        <div className="container">
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">

            {/* Free */}
            {pricing.free.visible && (
              <Card className="flex flex-col">
                <CardHeader>
                  <CardTitle className="text-2xl">{t("pricing.freePlan")}</CardTitle>
                  <CardDescription>{t("pricing.freeDesc")}</CardDescription>
                  <div className="mt-4">
                    <span className="text-5xl font-black">${pricing.free.price}</span>
                    <span className="text-muted-foreground text-sm ms-1">{billingLabel(pricing.free.billing)}</span>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-3 text-sm">
                    {pricing.free.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  {userProfile ? (
                    <Button variant="outline" className="w-full" asChild>
                      <Link href="/dashboard">{t("pubPricing.goToDashboard")}</Link>
                    </Button>
                  ) : (
                    <Button variant="outline" className="w-full" asChild>
                      <Link href="/register">{t("pricing.getStartedFree")}</Link>
                    </Button>
                  )}
                </CardFooter>
              </Card>
            )}

            {/* Starter */}
            {pricing.starter.visible && (
              <Card className={`flex flex-col relative border-amber-400 overflow-hidden ${pricing.starter.mostPopular ? "shadow-xl ring-2 ring-amber-400" : ""}`}>
                <div className="absolute inset-0 bg-gradient-to-br from-amber-50/60 to-transparent dark:from-amber-900/10 pointer-events-none" />
                {pricing.starter.mostPopular && (
                  <div className="absolute top-0 end-0 bg-amber-400 text-white px-3 py-1 text-xs font-semibold rounded-bl-lg">{t("pricing.mostPopular")}</div>
                )}
                <CardHeader>
                  <CardTitle className="text-2xl text-amber-600 dark:text-amber-400">{t("pricing.starterPlan")}</CardTitle>
                  <CardDescription>{t("pricing.starterDesc")}</CardDescription>
                  <div className="mt-4">
                    <span className="text-5xl font-black">${pricing.starter.price}</span>
                    <span className="text-muted-foreground text-sm ms-1">{billingLabel(pricing.starter.billing)}</span>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-3 text-sm">
                    {pricing.starter.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  {userProfile && isStarter ? (
                    <Button className="w-full h-12 text-base font-semibold bg-amber-500 hover:bg-amber-600" disabled>{t("dashPricing.currentPlanBtn")}</Button>
                  ) : userProfile ? (
                    <Button className="w-full h-12 text-base font-semibold bg-amber-500 hover:bg-amber-600" asChild>
                      <Link href="/upgrade">{t("pricing.upgradeStarter")} <ArrowRight className="ms-2 h-4 w-4" /></Link>
                    </Button>
                  ) : (
                    <Button className="w-full h-12 text-base font-semibold bg-amber-500 hover:bg-amber-600" asChild>
                      <Link href="/register">{t("pricing.getStarted")} <ArrowRight className="ms-2 h-4 w-4" /></Link>
                    </Button>
                  )}
                </CardFooter>
              </Card>
            )}

            {/* Pro */}
            {pricing.pro.visible && (
              <Card className={`flex flex-col relative border-primary overflow-hidden ${pricing.pro.mostPopular ? "shadow-2xl ring-2 ring-primary" : ""}`}>
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
                {pricing.pro.mostPopular && (
                  <div className="absolute top-0 end-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-semibold rounded-bl-lg tracking-wider">{t("pricing.mostPopular")}</div>
                )}
                <CardHeader>
                  <CardTitle className="text-2xl text-primary">{t("pricing.proPlan")}</CardTitle>
                  <CardDescription>{t("pricing.proDesc")}</CardDescription>
                  <div className="mt-4">
                    <span className="text-5xl font-black">${pricing.pro.price}</span>
                    <span className="text-muted-foreground text-sm ms-1">{billingLabel(pricing.pro.billing)}</span>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-3 text-sm">
                    {pricing.pro.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                        <span className="font-medium">{f}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  {userProfile && isPro ? (
                    <Button className="w-full h-12 text-base font-semibold" disabled>{t("dashPricing.currentPlanBtn")}</Button>
                  ) : userProfile ? (
                    <Button className="w-full h-12 text-base font-semibold" asChild>
                      <Link href="/upgrade">{t("pricing.upgradePro")} <ArrowRight className="ms-2 h-4 w-4" /></Link>
                    </Button>
                  ) : (
                    <Button className="w-full h-12 text-base font-semibold" asChild>
                      <Link href="/register">{t("pricing.getStarted")} <ArrowRight className="ms-2 h-4 w-4" /></Link>
                    </Button>
                  )}
                </CardFooter>
              </Card>
            )}

          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-muted/30">
        <div className="container max-w-3xl">
          <h2 className="text-2xl font-bold text-center mb-10">{t("pubPricing.faqTitle")}</h2>
          <div className="grid sm:grid-cols-2 gap-x-10 gap-y-6">
            <div><p className="font-semibold mb-1">{t("pubPricing.faq1Q")}</p><p className="text-sm text-muted-foreground">{t("pubPricing.faq1A")}</p></div>
            <div><p className="font-semibold mb-1">{t("pubPricing.faq2Q")}</p><p className="text-sm text-muted-foreground">{t("pubPricing.faq2A")}</p></div>
            <div><p className="font-semibold mb-1">{t("pubPricing.faq3Q")}</p><p className="text-sm text-muted-foreground">{t("pubPricing.faq3A")}</p></div>
            <div><p className="font-semibold mb-1">{t("pubPricing.faq4Q")}</p><p className="text-sm text-muted-foreground">{t("pubPricing.faq4A")}</p></div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 text-center">
        <div className="container max-w-2xl space-y-6">
          <h2 className="text-3xl font-bold">{t("pubPricing.ctaTitle")}</h2>
          <p className="text-muted-foreground">{t("pubPricing.ctaSubtitle")}</p>
          <Button size="lg" className="h-14 px-10 text-lg" asChild>
            <Link href="/register">{t("pubPricing.ctaBtn")} <ArrowRight className="ms-2 h-5 w-5" /></Link>
          </Button>
        </div>
      </section>
    </PublicLayout>
  );
}
