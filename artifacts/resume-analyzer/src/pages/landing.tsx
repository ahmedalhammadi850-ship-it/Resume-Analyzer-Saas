import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { PublicLayout } from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FileText, Target, Zap, TrendingUp, CheckCircle2, Award, ArrowRight, Star, Users, BarChart3 } from "lucide-react";

export default function Landing() {
  const { t } = useTranslation();

  return (
    <PublicLayout>

      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden py-20 md:py-28 lg:py-36 bg-background">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,hsl(var(--primary)/0.12),transparent)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.3)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.3)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,black,transparent)]" />

        <div className="container relative z-10 text-center space-y-6 md:space-y-8 max-w-4xl mx-auto px-4">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            {t("landing.badge")}
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground leading-[1.1]">
            {t("landing.heroTitle1")}<br />
            <span className="text-primary bg-clip-text">{t("landing.heroTitle2")}</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {t("landing.heroSubtitle")}
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button size="lg" asChild className="h-13 px-8 text-base font-semibold rounded-full shadow-lg shadow-primary/25 w-full sm:w-auto">
              <Link href="/register">
                {t("landing.ctaAnalyze")} <ArrowRight className="ms-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="h-13 px-8 text-base rounded-full w-full sm:w-auto">
              <Link href="/pricing">{t("landing.ctaPricing")}</Link>
            </Button>
          </div>

          {/* Trust signals */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-5 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
              {t("landing.freeTrial")}
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
              {t("landing.noCreditCard")}
            </span>
          </div>
        </div>
      </section>

      {/* ─── Social proof bar ─── */}
      <div className="border-y bg-muted/40 py-5">
        <div className="container px-4">
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-14 text-center">
            <div className="flex flex-col items-center">
              <span className="text-2xl font-black text-foreground">50K+</span>
              <span className="text-xs text-muted-foreground mt-0.5">{t("landing.stat1Label") || "Resume Analyzed"}</span>
            </div>
            <div className="hidden sm:block h-8 w-px bg-border" />
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1">
                <span className="text-2xl font-black text-foreground">4.9</span>
                <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
              </div>
              <span className="text-xs text-muted-foreground mt-0.5">{t("landing.stat2Label") || "User Rating"}</span>
            </div>
            <div className="hidden sm:block h-8 w-px bg-border" />
            <div className="flex flex-col items-center">
              <span className="text-2xl font-black text-foreground">87%</span>
              <span className="text-xs text-muted-foreground mt-0.5">{t("landing.stat3Label") || "More Interviews"}</span>
            </div>
            <div className="hidden sm:block h-8 w-px bg-border" />
            <div className="flex flex-col items-center">
              <span className="text-2xl font-black text-foreground">&lt;30s</span>
              <span className="text-xs text-muted-foreground mt-0.5">{t("landing.stat4Label") || "Analysis Time"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── How it Works ─── */}
      <section className="py-20 md:py-28 bg-background">
        <div className="container px-4 md:px-10">
          <div className="text-center mb-12 md:mb-16 space-y-3">
            <p className="text-sm font-semibold text-primary uppercase tracking-widest">{t("landing.howItWorksTag") || "Simple Process"}</p>
            <h2 className="text-3xl md:text-4xl font-bold">{t("landing.howItWorksTitle")}</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">{t("landing.howItWorksSubtitle")}</p>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 relative">
            {/* Connector line (desktop) */}
            <div className="hidden md:block absolute top-10 start-1/4 end-1/4 h-px bg-border" />

            {[
              { icon: FileText, step: "01", title: t("landing.step1Title"), desc: t("landing.step1Desc") },
              { icon: Target, step: "02", title: t("landing.step2Title"), desc: t("landing.step2Desc") },
              { icon: Zap, step: "03", title: t("landing.step3Title"), desc: t("landing.step3Desc") },
            ].map(({ icon: Icon, step, title, desc }) => (
              <Card key={step} className="bg-card border shadow-sm hover:shadow-md transition-shadow relative">
                <CardContent className="pt-8 pb-7 px-6 space-y-4 text-center">
                  <div className="relative inline-flex">
                    <div className="h-16 w-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto">
                      <Icon className="h-8 w-8" />
                    </div>
                    <span className="absolute -top-2 -end-2 h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shadow">
                      {step.slice(1)}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold">{title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section className="py-20 md:py-28 bg-muted/30">
        <div className="container px-4 md:px-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

            {/* Text */}
            <div className="space-y-8">
              <div className="space-y-3">
                <p className="text-sm font-semibold text-primary uppercase tracking-widest">{t("landing.featuresTag") || "Features"}</p>
                <h2 className="text-3xl md:text-4xl font-bold leading-tight">{t("landing.featuresTitle")}</h2>
              </div>
              <ul className="space-y-7">
                {[
                  { icon: Award, title: t("landing.feature1Title"), desc: t("landing.feature1Desc") },
                  { icon: TrendingUp, title: t("landing.feature2Title"), desc: t("landing.feature2Desc") },
                  { icon: CheckCircle2, title: t("landing.feature3Title"), desc: t("landing.feature3Desc") },
                ].map(({ icon: Icon, title, desc }) => (
                  <li key={title} className="flex gap-4">
                    <div className="mt-0.5 bg-primary text-primary-foreground p-2 rounded-xl h-fit shadow-sm shadow-primary/20">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold mb-1">{title}</h4>
                      <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Mock UI Card */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-blue-500/10 rounded-3xl transform translate-x-3 translate-y-3 blur-sm" />
              <Card className="relative z-10 shadow-2xl bg-background overflow-hidden rounded-2xl border">
                {/* Card header bar */}
                <div className="h-10 bg-muted/60 border-b flex items-center px-4 gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-red-400" />
                  <span className="h-3 w-3 rounded-full bg-amber-400" />
                  <span className="h-3 w-3 rounded-full bg-green-400" />
                  <span className="ms-3 text-xs text-muted-foreground font-mono">cv-audit-tool.vercel.app</span>
                </div>
                <CardContent className="p-6 space-y-5">
                  {/* ATS Score */}
                  <div className="flex items-center justify-between pb-5 border-b">
                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-1">{t("landing.overallAtsScore")}</div>
                      <div className="text-6xl font-black text-green-500 leading-none">86%</div>
                    </div>
                    <div className="h-16 w-16 rounded-full border-4 border-green-500/30 flex items-center justify-center">
                      <BarChart3 className="h-8 w-8 text-green-500/60" />
                    </div>
                  </div>

                  {/* Score bars */}
                  <div className="space-y-3">
                    {[
                      { label: "Keywords Match", val: 82, color: "bg-blue-500" },
                      { label: "Format Score", val: 95, color: "bg-green-500" },
                      { label: "Skills Gap", val: 70, color: "bg-amber-500" },
                    ].map(({ label, val, color }) => (
                      <div key={label}>
                        <div className="flex justify-between text-xs font-medium mb-1">
                          <span className="text-muted-foreground">{label}</span>
                          <span className="text-foreground">{val}%</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className={`h-full ${color} rounded-full`} style={{ width: `${val}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Missing keywords */}
                  <div>
                    <h5 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">{t("landing.missingKeywords")}</h5>
                    <div className="flex flex-wrap gap-1.5">
                      {["React.js", "TypeScript", "GraphQL"].map((kw) => (
                        <span key={kw} className="px-2.5 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full text-xs font-medium">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="py-20 md:py-28 bg-primary text-primary-foreground">
        <div className="container px-4 text-center space-y-6 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 border border-primary-foreground/20 px-4 py-1.5 text-xs font-semibold">
            <Users className="h-3.5 w-3.5" />
            {t("landing.ctaBadge") || "Join 50,000+ job seekers"}
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold">{t("landing.ctaTitle") || t("landing.ctaAnalyze")}</h2>
          <p className="text-primary-foreground/75 text-lg">{t("landing.ctaSubtitle") || t("landing.heroSubtitle")}</p>
          <Button size="lg" variant="secondary" asChild className="h-13 px-10 text-base font-semibold rounded-full shadow-xl">
            <Link href="/register">
              {t("landing.ctaAnalyze")} <ArrowRight className="ms-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="py-20 md:py-28 bg-background">
        <div className="container max-w-2xl px-4 md:px-6">
          <div className="text-center mb-10 space-y-2">
            <p className="text-sm font-semibold text-primary uppercase tracking-widest">{t("landing.faqTag") || "FAQ"}</p>
            <h2 className="text-3xl font-bold">{t("landing.faqTitle")}</h2>
          </div>
          <Accordion type="single" collapsible className="w-full space-y-2">
            {(["item-1", "item-2", "item-3"] as const).map((val, idx) => (
              <AccordionItem key={val} value={val} className="border rounded-xl px-5 shadow-sm bg-card">
                <AccordionTrigger className="text-sm font-semibold py-4 hover:no-underline text-start">
                  {t(`landing.faq${idx + 1}Q`)}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm pb-4 leading-relaxed">
                  {t(`landing.faq${idx + 1}A`)}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

    </PublicLayout>
  );
}
