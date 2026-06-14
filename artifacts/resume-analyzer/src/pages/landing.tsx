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
import { FileText, Target, Zap, TrendingUp, CheckCircle2, Award, ArrowRight } from "lucide-react";

export default function Landing() {
  const { t } = useTranslation();

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden py-24 lg:py-32 bg-background">
        <div className="absolute inset-0 bg-primary/5 [mask-image:linear-gradient(to_bottom,white,transparent)]" />
        <div className="container relative z-10 text-center space-y-8 max-w-4xl mx-auto">
          <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold border-transparent bg-primary/10 text-primary">
            {t("landing.badge")}
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-foreground">
            {t("landing.heroTitle1")}<br />
            <span className="text-primary">{t("landing.heroTitle2")}</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {t("landing.heroSubtitle")}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button size="lg" asChild className="h-14 px-8 text-lg w-full sm:w-auto">
              <Link href="/register">
                {t("landing.ctaAnalyze")} <ArrowRight className="ms-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="h-14 px-8 text-lg w-full sm:w-auto">
              <Link href="/pricing">{t("landing.ctaPricing")}</Link>
            </Button>
          </div>
          <div className="pt-8 text-sm text-muted-foreground flex items-center justify-center gap-6">
            <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> {t("landing.freeTrial")}</span>
            <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> {t("landing.noCreditCard")}</span>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-24 bg-muted/30">
        <div className="container px-10">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold">{t("landing.howItWorksTitle")}</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{t("landing.howItWorksSubtitle")}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-background border-none shadow-md">
              <CardContent className="pt-8 space-y-4 text-center">
                <div className="h-16 w-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
                  <FileText className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold">{t("landing.step1Title")}</h3>
                <p className="text-muted-foreground">{t("landing.step1Desc")}</p>
              </CardContent>
            </Card>
            <Card className="bg-background border-none shadow-md">
              <CardContent className="pt-8 space-y-4 text-center">
                <div className="h-16 w-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
                  <Target className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold">{t("landing.step2Title")}</h3>
                <p className="text-muted-foreground">{t("landing.step2Desc")}</p>
              </CardContent>
            </Card>
            <Card className="bg-background border-none shadow-md">
              <CardContent className="pt-8 space-y-4 text-center">
                <div className="h-16 w-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
                  <Zap className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold">{t("landing.step3Title")}</h3>
                <p className="text-muted-foreground">{t("landing.step3Desc")}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24">
        <div className="container px-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <h2 className="text-3xl md:text-4xl font-bold leading-tight">{t("landing.featuresTitle")}</h2>
              <ul className="space-y-6">
                <li className="flex gap-4">
                  <div className="mt-1 bg-primary/10 p-2 rounded-lg text-primary h-fit"><Award className="h-6 w-6" /></div>
                  <div>
                    <h4 className="text-xl font-bold mb-2">{t("landing.feature1Title")}</h4>
                    <p className="text-muted-foreground">{t("landing.feature1Desc")}</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="mt-1 bg-primary/10 p-2 rounded-lg text-primary h-fit"><TrendingUp className="h-6 w-6" /></div>
                  <div>
                    <h4 className="text-xl font-bold mb-2">{t("landing.feature2Title")}</h4>
                    <p className="text-muted-foreground">{t("landing.feature2Desc")}</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="mt-1 bg-primary/10 p-2 rounded-lg text-primary h-fit"><CheckCircle2 className="h-6 w-6" /></div>
                  <div>
                    <h4 className="text-xl font-bold mb-2">{t("landing.feature3Title")}</h4>
                    <p className="text-muted-foreground">{t("landing.feature3Desc")}</p>
                  </div>
                </li>
              </ul>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent rounded-2xl transform translate-x-4 translate-y-4"></div>
              <Card className="relative z-10 border shadow-2xl bg-background overflow-hidden">
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b pb-4">
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">{t("landing.overallAtsScore")}</div>
                        <div className="text-5xl font-black text-green-500">86%</div>
                      </div>
                      <Target className="h-12 w-12 text-muted-foreground/30" />
                    </div>
                    <div>
                      <h5 className="font-semibold mb-3">{t("landing.missingKeywords")}</h5>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full text-sm">React.js</span>
                        <span className="px-3 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full text-sm">TypeScript</span>
                        <span className="px-3 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full text-sm">GraphQL</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 bg-muted/30">
        <div className="container max-w-3xl px-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">{t("landing.faqTitle")}</h2>
          </div>
          <Accordion type="single" collapsible className="w-full bg-background rounded-lg border px-6">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-lg">{t("landing.faq1Q")}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{t("landing.faq1A")}</AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger className="text-lg">{t("landing.faq2Q")}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{t("landing.faq2A")}</AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger className="text-lg">{t("landing.faq3Q")}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{t("landing.faq3A")}</AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>
    </PublicLayout>
  );
}
