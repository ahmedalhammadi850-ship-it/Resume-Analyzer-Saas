import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { PublicLayout } from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, Target, Eye } from "lucide-react";

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
      {/* Hero */}
      <section className="py-24 lg:py-32 bg-background relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 [mask-image:linear-gradient(to_bottom,white,transparent)]" />
        <div className="container relative z-10 max-w-3xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold bg-primary/10 text-primary">
            {t("about.badge")}
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground leading-tight">
            {t("about.title")}
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            {t("about.subtitle")}
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container">
          <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto text-center">
            {stats.map((stat) => (
              <div key={stat.label} data-testid={`stat-${stat.label}`}>
                <div className="text-4xl md:text-5xl font-black mb-2">{stat.value}</div>
                <div className="text-primary-foreground/70 text-sm font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-24 bg-background">
        <div className="container max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-8">{t("about.storyTitle")}</h2>
          <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
            <p>{t("about.storyP1")}</p>
            <p>{t("about.storyP2")}</p>
            <p>{t("about.storyP3")}</p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 bg-muted/30">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">{t("about.valuesTitle")}</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {values.map((v) => {
              const Icon = v.icon;
              return (
                <Card key={v.title} className="bg-background border-none shadow-md">
                  <CardContent className="pt-8 space-y-4 text-center">
                    <div className="h-14 w-14 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto">
                      <Icon className="h-7 w-7" />
                    </div>
                    <h3 className="text-xl font-bold">{v.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{v.desc}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-background">
        <div className="container max-w-2xl mx-auto text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold">{t("about.ctaTitle")}</h2>
          <p className="text-lg text-muted-foreground">{t("about.ctaSubtitle")}</p>
          <Button size="lg" asChild className="h-14 px-10 text-lg">
            <Link href="/register">{t("about.ctaBtn")}</Link>
          </Button>
        </div>
      </section>
    </PublicLayout>
  );
}
