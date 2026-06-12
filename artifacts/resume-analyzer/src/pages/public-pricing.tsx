import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { PublicLayout } from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function PublicPricing() {
  const { t } = useTranslation();
  const { currentUser, userProfile } = useAuth();

  const isPro = userProfile?.plan === "pro";
  const isStarter = userProfile?.plan === "starter";

  const freeFeatures = [
    { included: true,  text: t("pubPricing.free.f1") },
    { included: true,  text: t("pubPricing.free.f2") },
    { included: true,  text: t("pubPricing.free.f3") },
    { included: true,  text: t("pubPricing.free.f4") },
    { included: false, text: t("pubPricing.free.f5") },
    { included: false, text: t("pubPricing.free.f6") },
  ];

  const starterFeatures = [
    { text: t("pubPricing.starter.f1") },
    { text: t("pubPricing.starter.f2") },
    { text: t("pubPricing.starter.f3") },
    { text: t("pubPricing.starter.f4") },
    { text: t("pubPricing.starter.f5") },
    { text: t("pubPricing.starter.f6") },
  ];

  const proFeatures = [
    { text: t("pubPricing.pro.f1") },
    { text: t("pubPricing.pro.f2") },
    { text: t("pubPricing.pro.f3") },
    { text: t("pubPricing.pro.f4") },
    { text: t("pubPricing.pro.f5") },
    { text: t("pubPricing.pro.f6") },
  ];

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

      {/* Cards — 3 columns */}
      <section className="py-20">
        <div className="container">
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">

            {/* Free */}
            <Card className="flex flex-col">
              <CardHeader>
                <CardTitle className="text-2xl">{t("pricing.freePlan")}</CardTitle>
                <CardDescription>{t("pricing.freeDesc")}</CardDescription>
                <div className="mt-4">
                  <span className="text-5xl font-black">$0</span>
                  <span className="text-muted-foreground text-sm ms-1">{t("pubPricing.forever")}</span>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-3 text-sm">
                  {freeFeatures.map((f) => (
                    <li key={f.text} className={`flex items-start gap-3 ${!f.included ? "text-muted-foreground" : ""}`}>
                      {f.included
                        ? <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                        : <X className="h-4 w-4 mt-0.5 shrink-0" />}
                      {f.text}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                {currentUser ? (
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

            {/* Starter */}
            <Card className="flex flex-col relative border-amber-400 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-50/60 to-transparent dark:from-amber-900/10 pointer-events-none" />
              <CardHeader>
                <CardTitle className="text-2xl text-amber-600 dark:text-amber-400">{t("pricing.starterPlan")}</CardTitle>
                <CardDescription>{t("pricing.starterDesc")}</CardDescription>
                <div className="mt-4">
                  <span className="text-5xl font-black">$3</span>
                  <span className="text-muted-foreground text-sm ms-1">{t("pricing.oneTime")}</span>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-3 text-sm">
                  {starterFeatures.map((f) => (
                    <li key={f.text} className="flex items-start gap-3">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      {f.text}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                {currentUser && isStarter ? (
                  <Button className="w-full h-12 text-base font-semibold bg-amber-500 hover:bg-amber-600" disabled>
                    {t("dashPricing.currentPlanBtn")}
                  </Button>
                ) : currentUser ? (
                  <Button className="w-full h-12 text-base font-semibold bg-amber-500 hover:bg-amber-600" asChild>
                    <Link href="/upgrade">
                      {t("pricing.upgradeStarter")} <ArrowRight className="ms-2 h-4 w-4" />
                    </Link>
                  </Button>
                ) : (
                  <Button className="w-full h-12 text-base font-semibold bg-amber-500 hover:bg-amber-600" asChild>
                    <Link href="/register">
                      {t("pricing.getStarted")} <ArrowRight className="ms-2 h-4 w-4" />
                    </Link>
                  </Button>
                )}
              </CardFooter>
            </Card>

            {/* Pro */}
            <Card className="flex flex-col relative border-primary shadow-2xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
              <div className="absolute top-0 end-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-semibold rounded-bl-lg tracking-wider">
                {t("pricing.mostPopular")}
              </div>
              <CardHeader>
                <CardTitle className="text-2xl text-primary">{t("pricing.proPlan")}</CardTitle>
                <CardDescription>{t("pricing.proDesc")}</CardDescription>
                <div className="mt-4">
                  <span className="text-5xl font-black">$10</span>
                  <span className="text-muted-foreground text-sm ms-1">{t("pricing.perMonth")}</span>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-3 text-sm">
                  {proFeatures.map((f) => (
                    <li key={f.text} className="flex items-start gap-3">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span className="font-medium">{f.text}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                {currentUser && isPro ? (
                  <Button className="w-full h-12 text-base font-semibold" disabled>
                    {t("dashPricing.currentPlanBtn")}
                  </Button>
                ) : currentUser ? (
                  <Button className="w-full h-12 text-base font-semibold" asChild>
                    <Link href="/upgrade">
                      {t("pricing.upgradePro")} <ArrowRight className="ms-2 h-4 w-4" />
                    </Link>
                  </Button>
                ) : (
                  <Button className="w-full h-12 text-base font-semibold" asChild>
                    <Link href="/register">
                      {t("pricing.getStarted")} <ArrowRight className="ms-2 h-4 w-4" />
                    </Link>
                  </Button>
                )}
              </CardFooter>
            </Card>

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
            <Link href="/register">
              {t("pubPricing.ctaBtn")} <ArrowRight className="ms-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </PublicLayout>
  );
}
