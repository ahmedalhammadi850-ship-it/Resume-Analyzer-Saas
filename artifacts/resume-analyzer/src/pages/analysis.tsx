import { useState, useEffect } from "react";
import { useRoute, Link } from "wouter";
import { getAnalysis } from "@/lib/firestore";
import { Analysis } from "@/types";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, CheckCircle2, XCircle, AlertTriangle, Target, Lightbulb, TrendingUp } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function AnalysisResult() {
  const [, params] = useRoute("/analysis/:id");
  const analysisId = params?.id;
  const { t } = useTranslation();

  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (analysisId) {
        try {
          const data = await getAnalysis(analysisId);
          setAnalysis(data);
        } catch (error) {
          console.error("Failed to load analysis", error);
        } finally {
          setIsLoading(false);
        }
      }
    }
    loadData();
  }, [analysisId]);

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid gap-6 md:grid-cols-3">
            <Skeleton className="h-48 md:col-span-1" />
            <Skeleton className="h-48 md:col-span-2" />
          </div>
          <Skeleton className="h-96" />
        </div>
      </Layout>
    );
  }

  if (!analysis) {
    return (
      <Layout>
        <div className="py-20 text-center space-y-4">
          <h2 className="text-2xl font-bold">{t("analysis.analysisNotFound")}</h2>
          <p className="text-muted-foreground">{t("analysis.notFoundDesc")}</p>
          <Button asChild><Link href="/dashboard">{t("analysis.returnToDashboard")}</Link></Button>
        </div>
      </Layout>
    );
  }

  const { results } = analysis;
  const score = analysis.score || 0;
  const scoreColor = score >= 80 ? "text-green-500" : score >= 60 ? "text-yellow-500" : "text-red-500";

  const {
    ats_score,
    match_score,
    missing_skills,
    missing_keywords,
    strengths,
    weaknesses,
    recommendations,
    ai_insights,
    job_title,
    ...dynamicFields
  } = results;

  const scoreLabel = score >= 80
    ? t("analysis.excellent")
    : score >= 60
    ? t("analysis.good")
    : t("analysis.needsWork");

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" asChild className="shrink-0 mt-1">
            <Link href="/history"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight flex flex-wrap items-center gap-2">
              <span>{t("analysis.resultsFor")}</span>
              <span className="truncate max-w-xs">{analysis.fileName}</span>
              <Badge variant={analysis.analysisType === "jd_match" ? "default" : "secondary"}>
                {analysis.analysisType === "jd_match" ? t("analysis.jdMatch") : t("analysis.general")}
              </Badge>
            </h1>
            {job_title != null && (
              <p className="text-muted-foreground mt-1 text-sm">
                {t("analysis.targeting")} {String(job_title)}
              </p>
            )}
          </div>
        </div>

        {/* Score + Breakdown */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="flex flex-col items-center justify-center py-8">
            <CardHeader className="p-0 mb-4 text-center">
              <CardTitle className="text-base font-medium text-muted-foreground">
                {t("analysis.overallScore")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 text-center">
              <div className={`text-6xl font-black ${scoreColor}`}>{score}%</div>
              <p className="text-sm text-muted-foreground mt-2">{scoreLabel}</p>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>{t("analysis.scoreBreakdown")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {ats_score !== undefined && (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">{t("analysis.atsParsability")}</span>
                    <span className="font-bold">{ats_score}%</span>
                  </div>
                  <Progress value={Number(ats_score)} className="h-2" />
                  <p className="text-xs text-muted-foreground">{t("analysis.atsParsabilityDesc")}</p>
                </div>
              )}
              {match_score !== undefined && (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">{t("analysis.jobMatchScore")}</span>
                    <span className="font-bold">{match_score}%</span>
                  </div>
                  <Progress value={Number(match_score)} className="h-2" />
                  <p className="text-xs text-muted-foreground">{t("analysis.jobMatchScoreDesc")}</p>
                </div>
              )}
              {ats_score === undefined && match_score === undefined && (
                <p className="text-sm text-muted-foreground">{t("analysis.noData")}</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Strengths & Weaknesses */}
        <div className="grid gap-4 md:grid-cols-2">
          {strengths && Array.isArray(strengths) && strengths.length > 0 && (
            <Card className="border-green-500/20 bg-green-500/5">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400 text-base">
                  <CheckCircle2 className="h-5 w-5" /> {t("analysis.strengths")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {(strengths as string[]).map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-green-500 mt-0.5 shrink-0">•</span>
                      <span>{String(s)}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {weaknesses && Array.isArray(weaknesses) && weaknesses.length > 0 && (
            <Card className="border-red-500/20 bg-red-500/5">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400 text-base">
                  <AlertTriangle className="h-5 w-5" /> {t("analysis.areasForImprovement")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {(weaknesses as string[]).map((w, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-red-500 mt-0.5 shrink-0">•</span>
                      <span>{String(w)}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Missing Skills & Keywords */}
        {(missing_skills || missing_keywords) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" /> {t("analysis.keywordSkillGap")}
              </CardTitle>
              <CardDescription>{t("analysis.keywordSkillGapDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {missing_skills && Array.isArray(missing_skills) && missing_skills.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-3">{t("analysis.missingSkills")}</h4>
                  <div className="flex flex-wrap gap-2">
                    {(missing_skills as string[]).map((s, i) => (
                      <Badge key={i} variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/20 hover:bg-orange-500/20">
                        {String(s)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {missing_keywords && Array.isArray(missing_keywords) && missing_keywords.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-3">{t("analysis.missingKeywords")}</h4>
                  <div className="flex flex-wrap gap-2">
                    {(missing_keywords as string[]).map((k, i) => (
                      <Badge key={i} variant="secondary">{String(k)}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Recommendations */}
        {recommendations && Array.isArray(recommendations) && recommendations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-500" /> {t("analysis.actionableRecommendations")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(recommendations as string[]).map((rec, i) => (
                  <div key={i} className="flex gap-4 p-4 rounded-lg bg-muted/50 border">
                    <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold text-sm">
                      {i + 1}
                    </div>
                    <div className="flex-1 mt-1 text-sm leading-relaxed">{String(rec)}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dynamic AI Insights */}
        {Object.keys(dynamicFields).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" /> {t("analysis.aiInsights")}
              </CardTitle>
              <CardDescription>{t("analysis.additionalInsights")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {Object.entries(dynamicFields).map(([key, value]) => (
                  <div key={key} className="space-y-1 p-3 rounded-md bg-muted/30">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {key.replace(/_/g, ' ')}
                    </div>
                    <div className="text-sm">
                      {typeof value === 'string' ? value :
                       Array.isArray(value) ? value.join(", ") :
                       JSON.stringify(value)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
