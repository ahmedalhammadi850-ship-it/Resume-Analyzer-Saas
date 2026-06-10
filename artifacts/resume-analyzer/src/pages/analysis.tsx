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
import { ArrowLeft, CheckCircle2, AlertTriangle, Target, Lightbulb, TrendingUp } from "lucide-react";
import { useTranslation } from "react-i18next";

// Safely try to parse a JSON string
function tryParseJson(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
    try { return JSON.parse(trimmed); } catch { /* ignore */ }
  }
  return value;
}

// Render a single dynamic insight value nicely
function InsightValue({ value }: { value: unknown }) {
  const parsed = tryParseJson(value);

  if (parsed === null || parsed === undefined) return <span className="text-muted-foreground text-sm">—</span>;

  if (typeof parsed === "object" && !Array.isArray(parsed)) {
    const entries = Object.entries(parsed as Record<string, unknown>);
    return (
      <div className="space-y-1.5 mt-1">
        {entries.map(([k, v]) => (
          <div key={k} className="flex flex-wrap gap-1 text-sm">
            <span className="font-medium text-muted-foreground capitalize">{k.replace(/_/g, " ")}:</span>
            <span className="text-foreground">
              {Array.isArray(v) ? (v as unknown[]).join(", ") : String(v)}
            </span>
          </div>
        ))}
      </div>
    );
  }

  if (Array.isArray(parsed)) {
    return (
      <div className="flex flex-wrap gap-1.5 mt-1">
        {(parsed as unknown[]).map((item, i) => (
          <Badge key={i} variant="secondary" className="text-xs">{String(item)}</Badge>
        ))}
      </div>
    );
  }

  const str = String(parsed);
  return <p className="text-sm mt-1 leading-relaxed text-foreground">{str}</p>;
}

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

  const scoreLabel =
    score >= 80 ? t("analysis.excellent") :
    score >= 60 ? t("analysis.good") :
    t("analysis.needsWork");

  const hasScoreBreakdown = ats_score !== undefined || match_score !== undefined;
  const hasStrengths = strengths && Array.isArray(strengths) && strengths.length > 0;
  const hasWeaknesses = weaknesses && Array.isArray(weaknesses) && weaknesses.length > 0;
  const hasMissing = (missing_skills && Array.isArray(missing_skills) && missing_skills.length > 0) ||
                     (missing_keywords && Array.isArray(missing_keywords) && missing_keywords.length > 0);
  const hasRecs = recommendations && Array.isArray(recommendations) && recommendations.length > 0;
  const hasDynamic = Object.keys(dynamicFields).length > 0;

  return (
    <Layout>
      <div className="space-y-5">

        {/* ─── Header ─── */}
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" asChild className="shrink-0 mt-0.5">
            <Link href="/history"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl md:text-2xl font-bold tracking-tight truncate max-w-sm">
                {analysis.fileName}
              </h1>
              <Badge variant={analysis.analysisType === "jd_match" ? "default" : "secondary"}>
                {analysis.analysisType === "jd_match" ? t("analysis.jdMatch") : t("analysis.general")}
              </Badge>
            </div>
            {job_title != null && (
              <p className="text-muted-foreground mt-1 text-sm">
                {t("analysis.targeting")} {String(job_title)}
              </p>
            )}
          </div>
        </div>

        {/* ─── Score Row ─── */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* Overall */}
          <Card className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-sm font-medium text-muted-foreground mb-3">{t("analysis.overallScore")}</p>
            <div className={`text-7xl font-black ${scoreColor}`}>{score}%</div>
            <p className="text-sm text-muted-foreground mt-3 px-4">{scoreLabel}</p>
          </Card>

          {/* Breakdown */}
          <Card className="md:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t("analysis.scoreBreakdown")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {ats_score !== undefined && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{t("analysis.atsParsability")}</span>
                    <span className="font-bold">{ats_score}%</span>
                  </div>
                  <Progress value={Number(ats_score)} className="h-2" />
                  <p className="text-xs text-muted-foreground">{t("analysis.atsParsabilityDesc")}</p>
                </div>
              )}
              {match_score !== undefined && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{t("analysis.jobMatchScore")}</span>
                    <span className="font-bold">{match_score}%</span>
                  </div>
                  <Progress value={Number(match_score)} className="h-2" />
                  <p className="text-xs text-muted-foreground">{t("analysis.jobMatchScoreDesc")}</p>
                </div>
              )}
              {!hasScoreBreakdown && (
                <p className="text-sm text-muted-foreground">{t("analysis.noData")}</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ─── Strengths & Weaknesses ─── */}
        {(hasStrengths || hasWeaknesses) && (
          <div className="grid gap-4 md:grid-cols-2">
            {hasStrengths && (
              <Card className="border-green-500/30 bg-green-500/5">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400 text-base">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    {t("analysis.strengths")}
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
            {hasWeaknesses && (
              <Card className="border-red-500/30 bg-red-500/5">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400 text-base">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    {t("analysis.areasForImprovement")}
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
        )}

        {/* ─── Skill / Keyword Gap ─── */}
        {hasMissing && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="h-4 w-4 text-primary shrink-0" />
                {t("analysis.keywordSkillGap")}
              </CardTitle>
              <CardDescription>{t("analysis.keywordSkillGapDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {missing_skills && Array.isArray(missing_skills) && missing_skills.length > 0 && (
                <div>
                  <p className="text-sm font-semibold mb-2">{t("analysis.missingSkills")}</p>
                  <div className="flex flex-wrap gap-2">
                    {(missing_skills as string[]).map((s, i) => (
                      <Badge key={i} variant="outline"
                        className="bg-orange-500/10 text-orange-600 border-orange-500/30 hover:bg-orange-500/20 text-xs">
                        {String(s)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {missing_keywords && Array.isArray(missing_keywords) && missing_keywords.length > 0 && (
                <div>
                  <p className="text-sm font-semibold mb-2">{t("analysis.missingKeywords")}</p>
                  <div className="flex flex-wrap gap-2">
                    {(missing_keywords as string[]).map((k, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">{String(k)}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ─── Recommendations ─── */}
        {hasRecs && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4 text-blue-500 shrink-0" />
                {t("analysis.actionableRecommendations")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3">
                {(recommendations as string[]).map((rec, i) => (
                  <li key={i} className="flex gap-3 p-3 rounded-lg bg-muted/50 border">
                    <span className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold text-sm">
                      {i + 1}
                    </span>
                    <span className="flex-1 text-sm leading-relaxed mt-0.5">{String(rec)}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        )}

        {/* ─── AI Insights (dynamic) ─── */}
        {hasDynamic && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Lightbulb className="h-4 w-4 text-yellow-500 shrink-0" />
                {t("analysis.aiInsights")}
              </CardTitle>
              <CardDescription>{t("analysis.additionalInsights")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2">
                {Object.entries(dynamicFields).map(([key, value]) => {
                  const parsed = tryParseJson(value);
                  const isComplex = typeof parsed === "object" && parsed !== null;
                  return (
                    <div
                      key={key}
                      className={`p-3 rounded-lg bg-muted/30 border border-border/50 ${isComplex ? "md:col-span-2" : ""}`}
                    >
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                        {key.replace(/_/g, " ")}
                      </p>
                      <InsightValue value={value} />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </Layout>
  );
}
