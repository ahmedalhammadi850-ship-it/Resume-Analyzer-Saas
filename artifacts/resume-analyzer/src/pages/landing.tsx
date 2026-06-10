import { Link } from "wouter";
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
  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden py-24 lg:py-32 bg-background">
        <div className="absolute inset-0 bg-primary/5 [mask-image:linear-gradient(to_bottom,white,transparent)]" />
        <div className="container relative z-10 text-center space-y-8 max-w-4xl mx-auto">
          <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary/10 text-primary">
            New: Deep ATS Parsing Algorithm
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-foreground">
            Stop guessing.<br />
            <span className="text-primary">Start landing interviews.</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Upload your resume. Paste a job description. Get an instant, AI-driven ATS score and actionable gap analysis telling you exactly what to change.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button size="lg" asChild className="h-14 px-8 text-lg w-full sm:w-auto">
              <Link href="/register">Analyze My Resume Now <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="h-14 px-8 text-lg w-full sm:w-auto">
              <Link href="/pricing">View Pricing</Link>
            </Button>
          </div>
          <div className="pt-8 text-sm text-muted-foreground flex items-center justify-center gap-6">
            <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Free trial available</span>
            <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> No credit card required</span>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-24 bg-muted/30">
        <div className="container">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold">How it works</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Three simple steps to optimize your application.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-background border-none shadow-md">
              <CardContent className="pt-8 space-y-4 text-center">
                <div className="h-16 w-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
                  <FileText className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold">1. Upload Resume</h3>
                <p className="text-muted-foreground">Upload your current resume in PDF or DOCX format. Our parser extracts all your experience instantly.</p>
              </CardContent>
            </Card>
            <Card className="bg-background border-none shadow-md">
              <CardContent className="pt-8 space-y-4 text-center">
                <div className="h-16 w-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
                  <Target className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold">2. Add Job Target</h3>
                <p className="text-muted-foreground">Paste the description of the specific job you want. We analyze exactly what the employer is looking for.</p>
              </CardContent>
            </Card>
            <Card className="bg-background border-none shadow-md">
              <CardContent className="pt-8 space-y-4 text-center">
                <div className="h-16 w-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
                  <Zap className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold">3. Get Insights</h3>
                <p className="text-muted-foreground">Receive a detailed ATS score, missing keywords, and actionable recommendations to beat the bots.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <h2 className="text-3xl md:text-4xl font-bold leading-tight">Data-driven insights to perfect your application.</h2>
              <ul className="space-y-6">
                <li className="flex gap-4">
                  <div className="mt-1 bg-primary/10 p-2 rounded-lg text-primary h-fit"><Award className="h-6 w-6" /></div>
                  <div>
                    <h4 className="text-xl font-bold mb-2">ATS Score Simulation</h4>
                    <p className="text-muted-foreground">See exactly how recruiting software reads your resume before a human ever does.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="mt-1 bg-primary/10 p-2 rounded-lg text-primary h-fit"><TrendingUp className="h-6 w-6" /></div>
                  <div>
                    <h4 className="text-xl font-bold mb-2">Keyword Gap Analysis</h4>
                    <p className="text-muted-foreground">Identify the exact skills and keywords you're missing from the job description.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="mt-1 bg-primary/10 p-2 rounded-lg text-primary h-fit"><CheckCircle2 className="h-6 w-6" /></div>
                  <div>
                    <h4 className="text-xl font-bold mb-2">Actionable Recommendations</h4>
                    <p className="text-muted-foreground">Get specific instructions on how to reword bullet points for maximum impact.</p>
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
                        <div className="text-sm font-medium text-muted-foreground">Overall ATS Score</div>
                        <div className="text-5xl font-black text-green-500">86%</div>
                      </div>
                      <Target className="h-12 w-12 text-muted-foreground/30" />
                    </div>
                    <div>
                      <h5 className="font-semibold mb-3">Missing Keywords</h5>
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
        <div className="container max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Frequently Asked Questions</h2>
          </div>
          <Accordion type="single" collapsible className="w-full bg-background rounded-lg border px-6">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-lg">What is an ATS?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                An Applicant Tracking System (ATS) is software used by 99% of Fortune 500 companies to filter, scan, and rank resumes before a human reads them. Our tool simulates this process to ensure your resume passes the filter.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger className="text-lg">How does the job match work?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                We use advanced AI to compare your resume's content against the specific job description you provide, identifying missing skills, keywords, and experience gaps.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger className="text-lg">Is my data secure?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes. We don't share your resume data with third-party employers. Your documents are securely processed and stored only for your personal history.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>
    </PublicLayout>
  );
}
