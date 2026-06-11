import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { uploadResumeFile, runJdAnalysis, runGeneralAnalysis, saveAnalysis, decrementScans, addScansToUser } from "@/lib/firestore";
import { FileUp, Target, Zap, AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useTranslation } from "react-i18next";

const ADMIN_EMAILS = ["123qwr23fdf@gmail.com"];

export default function Analyze() {
  const { userProfile, currentUser, refreshProfile } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState("jd_match");
  const [file, setFile] = useState<File | null>(null);
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAddingScans, setIsAddingScans] = useState(false);

  const isFreeUser = userProfile?.plan === "free";
  const outOfScans = isFreeUser && (userProfile?.remainingScans || 0) <= 0;
  const isAdmin = ADMIN_EMAILS.includes(currentUser?.email ?? "");

  const handleAddScans = async () => {
    if (!userProfile?.uid) return;
    setIsAddingScans(true);
    try {
      await addScansToUser(userProfile.uid, 10);
      await refreshProfile();
      toast({ title: "✅ تمت إضافة 10 فحوصات لحسابك" });
    } catch (e: any) {
      toast({ title: "فشلت العملية", description: e.message, variant: "destructive" });
    } finally {
      setIsAddingScans(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (selected.size > 10 * 1024 * 1024) {
        toast({
          title: t("analyze.fileTooLarge"),
          description: t("analyze.uploadDesc"),
          variant: "destructive"
        });
        return;
      }
      setFile(selected);
    }
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile?.uid) return;
    if (outOfScans) {
      toast({
        title: t("analyze.outOfScans"),
        description: t("analyze.upgradeMsg"),
        variant: "destructive"
      });
      setLocation("/pricing");
      return;
    }
    if (!file) {
      toast({ title: t("analyze.fileRequired"), description: t("analyze.fileRequired"), variant: "destructive" });
      return;
    }

    setIsProcessing(true);
    try {
      const results = activeTab === "jd_match"
        ? await runJdAnalysis(file, jobTitle, jobDescription)
        : await runGeneralAnalysis(file);

      const analysisId = await saveAnalysis(
        userProfile.uid,
        activeTab as "jd_match" | "general_review",
        file.name,
        results
      );

      if (isFreeUser) {
        await decrementScans(userProfile.uid);
        await refreshProfile();
      }

      toast({
        title: t("common.analysisComplete"),
        description: t("common.analysisCompleteMsg"),
      });
      setLocation(`/analysis/${analysisId}`);
    } catch (error: any) {
      toast({
        title: t("common.analysisFailed"),
        description: error.message || t("common.analysisFailedMsg"),
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("analyze.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("analyze.subtitle")}</p>
        </div>

        {outOfScans && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t("analyze.scanLimitReached")}</AlertTitle>
            <AlertDescription className="mt-2 space-y-3">
              <span>{t("analyze.scanLimitMsg")}</span>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => setLocation("/pricing")}>
                  {t("analyze.viewPlans")}
                </Button>
                {isAdmin && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddScans}
                    disabled={isAddingScans}
                    className="border-green-500 text-green-700 hover:bg-green-50"
                  >
                    {isAddingScans ? (
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3 w-3 mr-1" />
                    )}
                    إضافة 10 فحوصات (مدير)
                  </Button>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {isProcessing ? (
          <Card className="border-border/50 shadow-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-primary/5 animate-pulse" />
            <CardContent className="flex flex-col items-center justify-center py-24 space-y-6 relative z-10">
              <Loader2 className="h-16 w-16 text-primary animate-spin" />
              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold">{t("analyze.analyzing")}</h3>
                <p className="text-muted-foreground max-w-md">
                  {t("analyze.analyzingDesc")}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border/50 shadow-lg">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <CardHeader className="border-b bg-muted/20 pb-0">
                <TabsList className="w-full grid w-full grid-cols-2 bg-muted/50 mb-4">
                  <TabsTrigger value="jd_match" className="gap-2">
                    <Target className="h-4 w-4" />
                    {t("analyze.targetJobMatch")}
                  </TabsTrigger>
                  <TabsTrigger value="general_review" className="gap-2">
                    <Zap className="h-4 w-4" />
                    {t("analyze.generalReview")}
                  </TabsTrigger>
                </TabsList>
              </CardHeader>

              <form onSubmit={handleAnalyze}>
                <CardContent className="space-y-6 pt-6">
                  {/* File Upload */}
                  <div className="space-y-2">
                    <Label htmlFor="resume">{t("analyze.resumeDocument")}</Label>
                    <div className="mt-2 flex justify-center rounded-lg border border-dashed border-border px-6 py-10 bg-muted/10 hover:bg-muted/30 transition-colors">
                      <div className="text-center">
                        <FileUp className="mx-auto h-12 w-12 text-muted-foreground" aria-hidden="true" />
                        <div className="mt-4 flex text-sm leading-6 text-muted-foreground justify-center">
                          <label
                            htmlFor="file-upload"
                            className="relative cursor-pointer rounded-md bg-background font-semibold text-primary focus-within:outline-none hover:text-primary/80 px-2 py-1 border shadow-sm"
                          >
                            <span>{t("analyze.uploadFile")}</span>
                            <input
                              id="file-upload"
                              name="file-upload"
                              type="file"
                              className="sr-only"
                              accept=".pdf,.docx"
                              onChange={handleFileChange}
                            />
                          </label>
                          <p className="pl-2 flex items-center">{t("analyze.dragDrop")}</p>
                        </div>
                        <p className="text-xs leading-5 text-muted-foreground mt-2">
                          {t("analyze.uploadDesc")}
                        </p>
                        {file && (
                          <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                            <FileUp className="h-4 w-4 mr-2" />
                            {file.name}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <TabsContent value="jd_match" className="space-y-4 m-0">
                    <div className="space-y-2">
                      <Label htmlFor="jobTitle">{t("analyze.jobTitle")}</Label>
                      <Input
                        id="jobTitle"
                        placeholder={t("analyze.jobTitlePlaceholder")}
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        required={activeTab === "jd_match"}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="jobDescription">{t("analyze.jobDescription")}</Label>
                      <Textarea
                        id="jobDescription"
                        placeholder={t("analyze.jobDescPlaceholder")}
                        className="min-h-[200px]"
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        required={activeTab === "jd_match"}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="general_review" className="m-0">
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>{t("analyze.generalReviewMode")}</AlertTitle>
                      <AlertDescription>
                        {t("analyze.generalReviewModeDesc")}
                      </AlertDescription>
                    </Alert>
                  </TabsContent>
                </CardContent>

                <CardFooter className="border-t bg-muted/20 py-4 flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {isFreeUser ? (
                      <span>
                        <strong>{userProfile?.remainingScans}</strong> {t("analyze.freeScansRemaining")}
                      </span>
                    ) : (
                      <span>{t("analyze.unlimitedScans")}</span>
                    )}
                  </div>
                  <Button type="submit" disabled={isProcessing || outOfScans || !file} size="lg">
                    {activeTab === "jd_match" ? t("analyze.analyzeBtn") : t("analyze.reviewBtn")}
                  </Button>
                </CardFooter>
              </form>
            </Tabs>
          </Card>
        )}
      </div>
    </Layout>
  );
}
