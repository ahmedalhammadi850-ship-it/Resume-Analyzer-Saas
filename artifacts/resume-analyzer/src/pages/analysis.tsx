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

export default function AnalysisResult() {
  const [, params] = useRoute("/analysis/:id");
  const analysisId = params?.id;
  
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
          <h2 className="text-2xl font-bold">Analysis Not Found</h2>
          <p className="text-muted-foreground">The analysis you are looking for does not exist or has been deleted.</p>
          <Button asChild><Link href="/dashboard">Return to Dashboard</Link></Button>
        </div>
      </Layout>
    );
  }

  const { results } = analysis;
  const score = analysis.score || 0;
  const scoreColor = score >= 80 ? "text-green-500" : score >= 60 ? "text-yellow-500" : "text-red-500";
  
  // Extract known fields to render specifically, collect others for dynamic section
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

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/history"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
              Results: {analysis.fileName}
              <Badge variant={analysis.analysisType === "jd_match" ? "default" : "secondary"}>
                {analysis.analysisType === "jd_match" ? "JD Match" : "General"}
              </Badge>
            </h1>
            {job_title != null && <p className="text-muted-foreground mt-1">Targeting: {String(job_title)}</p>}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="flex flex-col items-center justify-center py-8">
            <CardHeader className="p-0 mb-4 text-center">
              <CardTitle className="text-lg font-medium text-muted-foreground">Overall Score</CardTitle>
            </CardHeader>
            <CardContent className="p-0 text-center">
              <div className={`text-6xl font-black ${scoreColor}`}>{score}%</div>
              <p className="text-sm text-muted-foreground mt-2">
                {score >= 80 ? "Excellent. Ready to apply." : score >= 60 ? "Good, but needs tweaks." : "Needs significant revision."}
              </p>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Score Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {ats_score !== undefined && (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">ATS Parsability</span>
                    <span className="font-bold">{ats_score}%</span>
                  </div>
                  <Progress value={Number(ats_score)} className="h-2" />
                  <p className="text-xs text-muted-foreground">How well applicant tracking systems can read your resume.</p>
                </div>
              )}
              {match_score !== undefined && (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Job Match Score</span>
                    <span className="font-bold">{match_score}%</span>
                  </div>
                  <Progress value={Number(match_score)} className="h-2" />
                  <p className="text-xs text-muted-foreground">How well your experience aligns with the job description.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {strengths && Array.isArray(strengths) && strengths.length > 0 && (
            <Card className="border-green-500/20 bg-green-500/5">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                  <CheckCircle2 className="h-5 w-5" /> Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-green-500 mt-0.5">•</span>
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
                <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
                  <AlertTriangle className="h-5 w-5" /> Areas for Improvement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {weaknesses.map((w, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-red-500 mt-0.5">•</span>
                      <span>{String(w)}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        {(missing_skills || missing_keywords) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" /> Keyword & Skill Gap
              </CardTitle>
              <CardDescription>Add these to your resume if you have the experience.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {missing_skills && Array.isArray(missing_skills) && missing_skills.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-3">Missing Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {missing_skills.map((s, i) => (
                      <Badge key={i} variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/20 hover:bg-orange-500/20">
                        {String(s)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {missing_keywords && Array.isArray(missing_keywords) && missing_keywords.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-3">Missing Keywords</h4>
                  <div className="flex flex-wrap gap-2">
                    {missing_keywords.map((k, i) => (
                      <Badge key={i} variant="secondary">
                        {String(k)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {recommendations && Array.isArray(recommendations) && recommendations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-500" /> Actionable Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recommendations.map((rec, i) => (
                  <div key={i} className="flex gap-4 p-4 rounded-lg bg-muted/50 border">
                    <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold">
                      {i + 1}
                    </div>
                    <div className="flex-1 mt-1 text-sm leading-relaxed">
                      {String(rec)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dynamic Fields Section */}
        {Object.keys(dynamicFields).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" /> AI Insights
              </CardTitle>
              <CardDescription>Additional extracted insights</CardDescription>
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
