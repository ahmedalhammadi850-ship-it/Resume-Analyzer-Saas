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
import {
  ArrowLeft, CheckCircle2, AlertTriangle,
  TrendingUp, Star, XCircle, FileText,
  Sparkles
} from "lucide-react";
import { useTranslation } from "react-i18next";

// ── Helpers ──────────────────────────────────────────────────────────────────

function toStringArray(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === "string") {
    return value
      .split(/[,،\n]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

function toString(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") return value.trim();
  return String(value).trim();
}

function extractNumber(value: unknown): number | undefined {
  if (value === undefined || value === null) return undefined;
  const n = Number(value);
  return isNaN(n) ? undefined : n;
}

// Normalize whatever the N8N webhook returns into a consistent shape
interface NormalizedResults {
  overallScore: number;
  matchLevel?: string;
  atsScore?: number;
  matchScore?: number;
  foundSkills: string[];
  missingSkills: string[];
  missingKeywords: string[];
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  analysis: string;
  jobTitle?: string;
}

function normalizeResults(raw: Record<string, unknown>, savedScore: number): NormalizedResults {
  const get = (keys: string[]): unknown => {
    for (const k of keys) {
      if (raw[k] !== undefined && raw[k] !== null && raw[k] !== "") return raw[k];
    }
    return undefined;
  };

  const scoreRaw = get(["Score", "score", "ats_score", "match_score", "overall_score"]);
  const overallScore = extractNumber(scoreRaw) ?? savedScore ?? 0;

  const matchLevel = toString(get(["Match Level", "match_level", "matchLevel", "level"]));
  const atsScore = extractNumber(get(["ats_score", "ATS Score", "ats score"]));
  const matchScore = extractNumber(get(["match_score", "Match Score", "match score"]));

  const foundSkills = toStringArray(get(["Found Skills", "found_skills", "foundSkills", "strengths", "Strengths"]));
  const missingSkills = toStringArray(get(["Missing Skills", "missing_skills", "missingSkills"]));
  const missingKeywords = toStringArray(get(["Missing Keywords", "missing_keywords", "missingKeywords"]));

  const strengthsRaw = toStringArray(get(["strengths", "Strengths"]));
  const weaknessesRaw = toStringArray(get(["weaknesses", "Weaknesses", "Areas for Improvement"]));
  const recommendations = toStringArray(
    get(["Recommendation", "Recommendations", "recommendations", "recommendation"])
  );

  const analysis = toString(get(["Analysis", "analysis", "feedback", "Feedback", "summary", "Summary"]));

  const jobTitle = toString(get(["job_title", "Job Title", "jobTitle"]));

  return {
    overallScore,
    matchLevel: matchLevel || undefined,
    atsScore,
    matchScore,
    foundSkills,
    missingSkills,
    missingKeywords,
    strengths: strengthsRaw,
    weaknesses: weaknessesRaw,
    recommendations,
    analysis,
    jobTitle: jobTitle || undefined,
  };
}

// ── Sub-components ───────────────────────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const color =
    score >= 80 ? "text-green-500" :
    score >= 60 ? "text-yellow-500" :
    "text-red-500";
  const bg =
    score >= 80 ? "bg-green-500/10" :
    score >= 60 ? "bg-yellow-500/10" :
    "bg-red-500/10";
  return (
    <div className={`flex flex-col items-center justify-center py-8 ${bg} rounded-xl`}>
      <div className={`text-7xl font-black tabular-nums ${color}`}>{score}%</div>
    </div>
  );
}

function SkillBadge({ label, variant }: { label: string; variant: "found" | "missing" | "keyword" }) {
  const cls =
    variant === "found"
      ? "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30"
      : variant === "missing"
      ? "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/30"
      : "bg-muted text-muted-foreground border-border";
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}

function SectionCard({
  icon,
  title,
  description,
  children,
  className = "",
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          {icon}
          {title}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

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
          <Button asChild>
            <Link href="/dashboard">{t("analysis.returnToDashboard")}</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const norm = normalizeResults(
    analysis.results as Record<string, unknown>,
    analysis.score ?? 0
  );

  const { overallScore, matchLevel, atsScore, matchScore } = norm;

  const scoreLabel =
    overallScore >= 80 ? t("analysis.excellent") :
    overallScore >= 60 ? t("analysis.good") :
    t("analysis.needsWork");

  const scoreColor =
    overallScore >= 80 ? "text-green-600 dark:text-green-400" :
    overallScore >= 60 ? "text-yellow-600 dark:text-yellow-400" :
    "text-red-600 dark:text-red-400";

  const matchLevelColor =
    matchLevel?.toLowerCase().includes("strong") ? "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30" :
    matchLevel?.toLowerCase().includes("good") ? "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30" :
    matchLevel?.toLowerCase().includes("partial") ? "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30" :
    "bg-muted text-muted-foreground";

  const hasScoreBreakdown = atsScore !== undefined || matchScore !== undefined;
  const hasFoundSkills = norm.foundSkills.length > 0;
  const hasMissingSkills = norm.missingSkills.length > 0 || norm.missingKeywords.length > 0;
  const hasStrengths = norm.strengths.length > 0;
  const hasWeaknesses = norm.weaknesses.length > 0;
  const hasRecs = norm.recommendations.length > 0;
  const hasAnalysis = norm.analysis.length > 0;

  const jobTitle = norm.jobTitle || (analysis.results as Record<string, unknown>)?.job_title as string | undefined;

  return (
    <Layout>
      <div className="space-y-5 max-w-4xl mx-auto">

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
            {jobTitle && (
              <p className="text-muted-foreground mt-1 text-sm">
                {t("analysis.targeting")} <span className="font-medium text-foreground">{jobTitle}</span>
              </p>
            )}
          </div>
        </div>

        {/* ─── Score Row ─── */}
        <div className="grid gap-4 md:grid-cols-3">

          {/* Overall Score */}
          <Card className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-sm font-medium text-muted-foreground mb-3">{t("analysis.overallScore")}</p>
            <div className={`text-7xl font-black tabular-nums ${scoreColor}`}>{overallScore}%</div>
            {matchLevel && (
              <span className={`mt-3 inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${matchLevelColor}`}>
                {matchLevel}
              </span>
            )}
            <p className="text-sm text-muted-foreground mt-2 px-4">{scoreLabel}</p>
          </Card>

          {/* Score Breakdown */}
          <Card className="md:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t("analysis.scoreBreakdown")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {hasScoreBreakdown ? (
                <>
                  {atsScore !== undefined && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{t("analysis.atsParsability")}</span>
                        <span className="font-bold">{atsScore}%</span>
                      </div>
                      <Progress value={Number(atsScore)} className="h-2" />
                      <p className="text-xs text-muted-foreground">{t("analysis.atsParsabilityDesc")}</p>
                    </div>
                  )}
                  {matchScore !== undefined && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{t("analysis.jobMatchScore")}</span>
                        <span className="font-bold">{matchScore}%</span>
                      </div>
                      <Progress value={Number(matchScore)} className="h-2" />
                      <p className="text-xs text-muted-foreground">{t("analysis.jobMatchScoreDesc")}</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{t("analysis.overallScore")}</span>
                      <span className={`font-bold ${scoreColor}`}>{overallScore}%</span>
                    </div>
                    <Progress value={overallScore} className="h-2" />
                  </div>
                  {matchLevel && (
                    <div className="flex items-center gap-2 text-sm p-3 rounded-lg bg-muted/40 border">
                      <Star className="h-4 w-4 text-yellow-500 shrink-0" />
                      <span className="text-muted-foreground">مستوى التطابق:</span>
                      <span className="font-semibold">{matchLevel}</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ─── Skills Section ─── */}
        {(hasFoundSkills || hasMissingSkills) && (
          <div className="grid gap-4 md:grid-cols-2">

            {/* Found / Strong Skills */}
            {hasFoundSkills && (
              <SectionCard
                icon={<CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />}
                title="المهارات الموجودة"
                className="border-green-500/20 bg-green-500/5"
              >
                <div className="flex flex-wrap gap-2">
                  {norm.foundSkills.map((skill, i) => (
                    <SkillBadge key={i} label={skill} variant="found" />
                  ))}
                </div>
              </SectionCard>
            )}

            {/* Missing Skills */}
            {hasMissingSkills && (
              <SectionCard
                icon={<XCircle className="h-4 w-4 text-orange-500 shrink-0" />}
                title={t("analysis.keywordSkillGap")}
                description={t("analysis.keywordSkillGapDesc")}
              >
                <div className="space-y-3">
                  {norm.missingSkills.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        {t("analysis.missingSkills")}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {norm.missingSkills.map((s, i) => (
                          <SkillBadge key={i} label={s} variant="missing" />
                        ))}
                      </div>
                    </div>
                  )}
                  {norm.missingKeywords.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        {t("analysis.missingKeywords")}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {norm.missingKeywords.map((k, i) => (
                          <SkillBadge key={i} label={k} variant="keyword" />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </SectionCard>
            )}
          </div>
        )}

        {/* ─── Strengths & Weaknesses ─── */}
        {(hasStrengths || hasWeaknesses) && (
          <div className="grid gap-4 md:grid-cols-2">
            {hasStrengths && (
              <SectionCard
                icon={<CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />}
                title={t("analysis.strengths")}
                className="border-green-500/20 bg-green-500/5"
              >
                <ul className="space-y-2">
                  {norm.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-green-500 mt-0.5 shrink-0">✓</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </SectionCard>
            )}
            {hasWeaknesses && (
              <SectionCard
                icon={<AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />}
                title={t("analysis.areasForImprovement")}
                className="border-red-500/20 bg-red-500/5"
              >
                <ul className="space-y-2">
                  {norm.weaknesses.map((w, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-red-500 mt-0.5 shrink-0">•</span>
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>
              </SectionCard>
            )}
          </div>
        )}

        {/* ─── AI Analysis ─── */}
        {hasAnalysis && (
          <SectionCard
            icon={<Sparkles className="h-4 w-4 text-blue-500 shrink-0" />}
            title="تحليل الذكاء الاصطناعي"
            description="قراءة معمّقة لسيرتك الذاتية مقارنةً بمتطلبات الوظيفة"
          >
            <div className="prose prose-sm dark:prose-invert max-w-none">
              {norm.analysis.split(/\n+/).map((para, i) => {
                if (!para.trim()) return null;
                return (
                  <p key={i} className="text-sm leading-relaxed text-foreground mb-3 last:mb-0">
                    {para.trim()}
                  </p>
                );
              })}
            </div>
          </SectionCard>
        )}

        {/* ─── Recommendations ─── */}
        {hasRecs && (
          <SectionCard
            icon={<TrendingUp className="h-4 w-4 text-blue-500 shrink-0" />}
            title={t("analysis.actionableRecommendations")}
          >
            <ol className="space-y-3">
              {norm.recommendations.map((rec, i) => (
                <li key={i} className="flex gap-3 p-3 rounded-lg bg-muted/50 border">
                  <span className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold text-sm">
                    {i + 1}
                  </span>
                  <span className="flex-1 text-sm leading-relaxed mt-0.5">{rec}</span>
                </li>
              ))}
            </ol>
          </SectionCard>
        )}

        {/* ─── Resume Improvement Tips (if nothing else) ─── */}
        {!hasFoundSkills && !hasMissingSkills && !hasStrengths && !hasWeaknesses && !hasRecs && !hasAnalysis && (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center space-y-2">
              <FileText className="h-10 w-10 text-muted-foreground mx-auto" />
              <p className="font-medium">{t("analysis.noData")}</p>
              <p className="text-sm text-muted-foreground">لم يتم إرجاع تفاصيل إضافية من التحليل.</p>
            </CardContent>
          </Card>
        )}

      </div>
    </Layout>
  );
}
