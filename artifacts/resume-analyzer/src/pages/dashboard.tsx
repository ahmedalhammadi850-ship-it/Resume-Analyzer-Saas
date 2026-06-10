import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { getRecentAnalyses } from "@/lib/firestore";
import { Analysis } from "@/types";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Plus, Target, Zap, Clock, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function Dashboard() {
  const { userProfile } = useAuth();
  const [, setLocation] = useLocation();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (userProfile?.uid) {
        try {
          const recent = await getRecentAnalyses(userProfile.uid, 5);
          setAnalyses(recent);
        } catch (error) {
          console.error("Failed to load recent analyses", error);
        } finally {
          setIsLoading(false);
        }
      }
    }
    loadData();
  }, [userProfile?.uid]);

  const totalAnalyses = analyses.length; // Approximate, but good for recent view
  const avgScore = totalAnalyses > 0 
    ? Math.round(analyses.reduce((acc, curr) => acc + (curr.score || 0), 0) / totalAnalyses) 
    : 0;

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Welcome back, {userProfile?.name}. Ready to optimize your resume?</p>
          </div>
          <Button onClick={() => setLocation("/analyze")} className="gap-2 shrink-0">
            <Plus className="h-4 w-4" />
            New Analysis
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Analyses</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? <Skeleton className="h-8 w-16" /> : totalAnalyses}</div>
              <p className="text-xs text-muted-foreground mt-1">resumes scanned</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Score</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? <Skeleton className="h-8 w-16" /> : `${avgScore}%`}</div>
              <p className="text-xs text-muted-foreground mt-1">across all scans</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Remaining Scans</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {userProfile?.plan === "pro" ? "Unlimited" : userProfile?.remainingScans}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {userProfile?.plan === "free" ? "on free plan" : "pro plan active"}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-primary text-primary-foreground">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-primary-foreground/80">Current Plan</CardTitle>
              <Target className="h-4 w-4 text-primary-foreground/80" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">{userProfile?.plan}</div>
              {userProfile?.plan === "free" && (
                <Button variant="secondary" size="sm" className="mt-3 w-full" onClick={() => setLocation("/pricing")}>
                  Upgrade to Pro
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Recent Analyses</CardTitle>
              <CardDescription>
                Your most recently scanned resumes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-[250px]" />
                        <Skeleton className="h-4 w-[200px]" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : analyses.length > 0 ? (
                <div className="space-y-6">
                  {analyses.map((analysis) => (
                    <div key={analysis.analysisId} className="flex items-center group cursor-pointer hover:bg-muted/50 p-2 rounded-lg transition-colors -mx-2" onClick={() => setLocation(`/analysis/${analysis.analysisId}`)}>
                      <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="ml-4 space-y-1 flex-1 min-w-0">
                        <p className="text-sm font-medium leading-none truncate">
                          {analysis.fileName}
                        </p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(analysis.createdAt), { addSuffix: true })}
                          <span className="mx-1">•</span>
                          {analysis.analysisType === "jd_match" ? "JD Match" : "General Review"}
                        </p>
                      </div>
                      <div className="ml-auto font-medium flex items-center gap-4">
                        <div className={`text-lg ${analysis.score >= 80 ? "text-green-500" : analysis.score >= 60 ? "text-yellow-500" : "text-red-500"}`}>
                          {analysis.score}%
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium">No analyses yet</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-4">
                    Upload your first resume to get actionable feedback and see your ATS score.
                  </p>
                  <Button onClick={() => setLocation("/analyze")}>Start Analysis</Button>
                </div>
              )}
            </CardContent>
            {analyses.length > 0 && (
              <CardFooter className="border-t pt-6">
                <Button variant="ghost" className="w-full" onClick={() => setLocation("/history")}>
                  View All History
                </Button>
              </CardFooter>
            )}
          </Card>
          
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tools to boost your job hunt</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full justify-start h-auto p-4" onClick={() => setLocation("/analyze")}>
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                    <Target className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">Target a Job Description</div>
                    <div className="text-xs text-muted-foreground mt-0.5">Match your resume to a specific role</div>
                  </div>
                </div>
              </Button>
              <Button variant="outline" className="w-full justify-start h-auto p-4" onClick={() => setLocation("/analyze")}>
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center shrink-0">
                    <Zap className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">General Resume Review</div>
                    <div className="text-xs text-muted-foreground mt-0.5">Get overall improvements and score</div>
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
