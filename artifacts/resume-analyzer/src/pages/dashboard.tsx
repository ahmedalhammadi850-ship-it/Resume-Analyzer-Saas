import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { Analysis } from "@/types";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Plus, Target, Zap, Clock, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useTranslation } from "react-i18next";

export default function Dashboard() {
  const { userProfile } = useAuth();
  const [, setLocation] = useLocation();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    async function loadData() {
      if (userProfile?.id) {
        try {
          const recent = await api.analyses.list(5);
          setAnalyses(recent);
        } catch (error) {
          console.error("Failed to load recent analyses", error);
        } finally {
          setIsLoading(false);
        }
      }
    }
    loadData();
  }, [userProfile?.id]);

  const totalAnalyses = analyses.length;
  const avgScore = totalAnalyses > 0
    ? Math.round(analyses.reduce((acc, curr) => acc + (curr.score || 0), 0) / totalAnalyses)
    : 0;

  return (
    <Layout>
      <div className="space-y-6 md:space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t("dashboard.title")}</h1>
            <p className="text-muted-foreground mt-1">
              {t("dashboard.welcomeBack")}, {userProfile?.name}. {t("analyze.subtitle")}
            </p>
          </div>
          <Button onClick={() => setLocation("/analyze")} className="gap-2 shrink-0">
            <Plus className="h-4 w-4" />
            {t("nav.newAnalysis")}
          </Button>
        </div>

        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">{t("dashboard.totalAnalyses")}</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground hidden sm:block" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? <Skeleton className="h-8 w-16" /> : totalAnalyses}</div>
              <p className="text-xs text-muted-foreground mt-1">{t("common.resumesScanned")}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">{t("dashboard.avgAtsScore")}</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground hidden sm:block" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? <Skeleton className="h-8 w-16" /> : `${avgScore}%`}</div>
              <p className="text-xs text-muted-foreground mt-1">{t("common.acrossAllScans")}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">{t("dashboard.remainingScans")}</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground hidden sm:block" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {userProfile?.plan === "pro" ? t("dashboard.unlimited") : userProfile?.remainingScans}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {userProfile?.plan === "free" ? t("common.onFreePlan") : t("common.proPlanActive")}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-primary text-primary-foreground">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-primary-foreground/80">{t("dashboard.currentPlan")}</CardTitle>
              <Target className="h-4 w-4 text-primary-foreground/80 hidden sm:block" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">{userProfile?.plan}</div>
              {userProfile?.plan === "free" && (
                <Button variant="secondary" size="sm" className="mt-3 w-full text-xs" onClick={() => setLocation("/pricing")}>
                  {t("analyze.upgradePro")}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
          <Card className="lg:col-span-4">
            <CardHeader>
              <CardTitle>{t("dashboard.recentAnalyses")}</CardTitle>
              <CardDescription>{t("common.recentAnalysesDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-12 w-12 rounded-full shrink-0" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-full max-w-[250px]" />
                        <Skeleton className="h-4 w-full max-w-[200px]" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : analyses.length > 0 ? (
                <div className="space-y-4">
                  {analyses.map((analysis) => (
                    <div
                      key={analysis.id}
                      className="flex items-center group cursor-pointer hover:bg-muted/50 p-2 rounded-lg transition-colors -mx-2"
                      onClick={() => setLocation(`/analysis/${analysis.id}`)}
                    >
                      <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                      </div>
                      <div className="ms-3 space-y-1 flex-1 min-w-0">
                        <p className="text-sm font-medium leading-none truncate">{analysis.fileName}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3 shrink-0" />
                          <span className="truncate">
                            {formatDistanceToNow(new Date(analysis.createdAt), { addSuffix: true })}
                            <span className="mx-1">•</span>
                            {analysis.analysisType === "jd_match" ? t("dashboard.jdMatch") : t("dashboard.generalReview")}
                          </span>
                        </p>
                      </div>
                      <div className="ms-auto font-medium flex items-center gap-2 shrink-0">
                        <div className={`text-base sm:text-lg ${analysis.score >= 80 ? "text-green-500" : analysis.score >= 60 ? "text-yellow-500" : "text-red-500"}`}>
                          {analysis.score}%
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-4">
                    <FileText className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <h3 className="text-base font-medium">{t("dashboard.noAnalysesYet")}</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-4">
                    {t("dashboard.startFirstAnalysis")}
                  </p>
                  <Button onClick={() => setLocation("/analyze")}>{t("dashboard.analyzeNow")}</Button>
                </div>
              )}
            </CardContent>
            {analyses.length > 0 && (
              <CardFooter className="border-t pt-4">
                <Button variant="ghost" className="w-full" onClick={() => setLocation("/history")}>
                  {t("dashboard.viewAll")}
                </Button>
              </CardFooter>
            )}
          </Card>

          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>{t("dashboard.quickActions")}</CardTitle>
              <CardDescription>{t("common.quickActionsDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start h-auto p-4" onClick={() => setLocation("/analyze")}>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                    <Target className="h-4 w-4" />
                  </div>
                  <div className="text-start">
                    <div className="font-semibold text-sm">{t("dashboard.jdMatch")}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{t("dashboard.jdMatchDesc")}</div>
                  </div>
                </div>
              </Button>
              <Button variant="outline" className="w-full justify-start h-auto p-4" onClick={() => setLocation("/analyze")}>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center shrink-0">
                    <Zap className="h-4 w-4" />
                  </div>
                  <div className="text-start">
                    <div className="font-semibold text-sm">{t("dashboard.generalReview")}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{t("dashboard.generalReviewDesc")}</div>
                  </div>
                </div>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
