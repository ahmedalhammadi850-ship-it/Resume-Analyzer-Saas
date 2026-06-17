import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { PublicLayout } from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, Target, Eye, ArrowRight } from "lucide-react";

export default function About() {
  const { t } = useTranslation();

  const values = [
    { icon: Eye, title: t("about.value1Title"), desc: t("about.value1Desc") },
    { icon: Target, title: t("about.value2Title"), desc: t("about.value2Desc") },
    { icon: ShieldCheck, title: t("about.value3Title"), desc: t("about.value3Desc") },
  ];

  const stats = [
    { value: t("about.stat1Value"), label: t("about.stat1Label") },
    { value: t("about.stat2Value"), label: t("about.stat2Label") },
    { value: t("about.stat3Value"), label: t("about.stat3Label") },
  ];

  return (
    <PublicLayout>

      {/* ─── Hero ─── */}
      <section className="py-24 lg:py-32 bg-background relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,hsl(var(--primary)/0.1),transparent)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.3)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.3)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,black,transparent)]" />
        <div className="relative z-10 w-full max-w-3xl mx-auto text-center space-y-6 px-4">
          <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary">
            {t("about.badge")}
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1]">
            {t("about.title")}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            {t("about.subtitle")}
          </p>
        </div>
      </section>

      {/* ─── Stats ─── */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="w-full max-w-3xl mx-auto px-4">
          <div className="grid grid-cols-3 divide-x divide-primary-foreground/20 text-center">
            {stats.map((stat) => (
              <div key={stat.label} className="px-4 py-2">
                <div className="text-3xl md:text-5xl font-black mb-1 tabular-nums">{stat.value}</div>
                <div className="text-primary-foreground/70 text-xs md:text-sm font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Story ─── */}
      <section className="py-24 bg-background">
        <div className="w-full max-w-2xl mx-auto px-4">
          <div className="space-y-2 mb-10">
            <p className="text-sm font-semibold text-primary uppercase tracking-widest">{t("about.storyTag") || "Our Story"}</p>
            <h2 className="text-3xl font-bold">{t("about.storyTitle")}</h2>
          </div>
          <div className="space-y-5 text-muted-foreground leading-relaxed border-s-2 border-primary/20 ps-6">
            <p>{t("about.storyP1")}</p>
            <p>{t("about.storyP2")}</p>
            <p>{t("about.storyP3")}</p>
          </div>
        </div>
      </section>

      {/* ─── Values ─── */}
      <section className="py-24 bg-muted/30">
        <div className="w-full max-w-screen-xl mx-auto px-4">
          <div className="text-center mb-12 space-y-2">
            <p className="text-sm font-semibold text-primary uppercase tracking-widest">{t("about.valuesTag") || "Our Values"}</p>
            <h2 className="text-3xl font-bold">{t("about.valuesTitle")}</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {values.map((v) => {
              const Icon = v.icon;
              return (
                <Card key={v.title} className="bg-background border shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="pt-8 pb-7 px-6 space-y-4 text-center">
                    <div className="h-14 w-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto">
                      <Icon className="h-7 w-7" />
                    </div>
                    <h3 className="text-lg font-bold">{v.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{v.desc}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-24 bg-background">
        <div className="w-full max-w-xl mx-auto text-center space-y-6 px-4">
          <h2 className="text-3xl md:text-4xl font-bold">{t("about.ctaTitle")}</h2>
          <p className="text-muted-foreground">{t("about.ctaSubtitle")}</p>
          <Button size="lg" asChild className="h-12 px-10 text-base rounded-full shadow-lg shadow-primary/25">
            <Link href="/register">
              {t("about.ctaBtn")} <ArrowRight className="ms-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

    </PublicLayout>
  );
}
