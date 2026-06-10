import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { uploadResumeFile, runJdAnalysis, runGeneralAnalysis, saveAnalysis, decrementScans } from "@/lib/firestore";
import { FileUp, Target, Zap, AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function Analyze() {
  const { userProfile, refreshProfile } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState("jd_match");
  const [file, setFile] = useState<File | null>(null);
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const isFreeUser = userProfile?.plan === "free";
  const outOfScans = isFreeUser && (userProfile?.remainingScans || 0) <= 0;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (selected.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Max file size is 10MB",
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
        title: "Out of Scans",
        description: "Please upgrade to Pro to continue scanning.",
        variant: "destructive"
      });
      setLocation("/pricing");
      return;
    }
    if (!file) {
      toast({ title: "File required", description: "Please upload a resume", variant: "destructive" });
      return;
    }

    setIsProcessing(true);
    try {
      // Run analysis
      const results = activeTab === "jd_match" 
        ? await runJdAnalysis(file, jobTitle, jobDescription)
        : await runGeneralAnalysis(file);

      // Save to db
      const analysisId = await saveAnalysis(
        userProfile.uid, 
        activeTab as "jd_match" | "general_review", 
        file.name, 
        results
      );

      // Decrement scans for free users
      if (isFreeUser) {
        await decrementScans(userProfile.uid);
        await refreshProfile();
      }

      toast({
        title: "Analysis Complete",
        description: "Your results are ready.",
      });
      setLocation(`/analysis/${analysisId}`);
    } catch (error: any) {
      toast({
        title: "Analysis Failed",
        description: error.message || "An error occurred during analysis",
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
          <h1 className="text-3xl font-bold tracking-tight">New Analysis</h1>
          <p className="text-muted-foreground mt-1">Upload your resume and get actionable insights instantly.</p>
        </div>

        {outOfScans && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Scan limit reached</AlertTitle>
            <AlertDescription className="flex items-center justify-between mt-2">
              <span>You have used all your free scans. Upgrade to Pro for unlimited analyses.</span>
              <Button variant="outline" size="sm" onClick={() => setLocation("/pricing")}>
                View Plans
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {isProcessing ? (
          <Card className="border-border/50 shadow-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-primary/5 animate-pulse" />
            <CardContent className="flex flex-col items-center justify-center py-24 space-y-6 relative z-10">
              <Loader2 className="h-16 w-16 text-primary animate-spin" />
              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold">Analyzing your resume...</h3>
                <p className="text-muted-foreground max-w-md">
                  Our AI is currently reviewing your document, extracting skills, checking formatting, and scoring it against industry standards. This usually takes 10-30 seconds.
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
                    Target Job Match
                  </TabsTrigger>
                  <TabsTrigger value="general_review" className="gap-2">
                    <Zap className="h-4 w-4" />
                    General Review
                  </TabsTrigger>
                </TabsList>
              </CardHeader>
              
              <form onSubmit={handleAnalyze}>
                <CardContent className="space-y-6 pt-6">
                  {/* Shared File Upload */}
                  <div className="space-y-2">
                    <Label htmlFor="resume">Resume Document</Label>
                    <div className="mt-2 flex justify-center rounded-lg border border-dashed border-border px-6 py-10 bg-muted/10 hover:bg-muted/30 transition-colors">
                      <div className="text-center">
                        <FileUp className="mx-auto h-12 w-12 text-muted-foreground" aria-hidden="true" />
                        <div className="mt-4 flex text-sm leading-6 text-muted-foreground justify-center">
                          <label
                            htmlFor="file-upload"
                            className="relative cursor-pointer rounded-md bg-background font-semibold text-primary focus-within:outline-none hover:text-primary/80 px-2 py-1 border shadow-sm"
                          >
                            <span>Upload a file</span>
                            <input id="file-upload" name="file-upload" type="file" className="sr-only" accept=".pdf,.docx" onChange={handleFileChange} />
                          </label>
                          <p className="pl-2 flex items-center">or drag and drop</p>
                        </div>
                        <p className="text-xs leading-5 text-muted-foreground mt-2">
                          PDF or DOCX up to 10MB
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
                      <Label htmlFor="jobTitle">Job Title</Label>
                      <Input 
                        id="jobTitle" 
                        placeholder="e.g. Senior Frontend Engineer" 
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        required={activeTab === "jd_match"}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="jobDescription">Job Description</Label>
                      <Textarea 
                        id="jobDescription" 
                        placeholder="Paste the full job description here..." 
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
                      <AlertTitle>General Review Mode</AlertTitle>
                      <AlertDescription>
                        This mode will analyze your resume for general best practices, formatting, impact, and clarity without targeting a specific role.
                      </AlertDescription>
                    </Alert>
                  </TabsContent>
                </CardContent>
                
                <CardFooter className="border-t bg-muted/20 py-4 flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {isFreeUser ? (
                      <span><strong>{userProfile?.remainingScans}</strong> free scans remaining</span>
                    ) : (
                      <span>Unlimited Pro scans</span>
                    )}
                  </div>
                  <Button type="submit" disabled={isProcessing || outOfScans || !file} size="lg">
                    {activeTab === "jd_match" ? "Analyze Match" : "Review Resume"}
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
