import { Link } from "wouter";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function Pricing() {
  const { userProfile } = useAuth();
  
  const isPro = userProfile?.plan === "pro";

  return (
    <Layout>
      <div className="space-y-8 py-8">
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">Simple, transparent pricing</h1>
          <p className="text-xl text-muted-foreground">
            Get the insights you need to land your dream job. Upgrade to Pro for unlimited power.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto pt-8">
          {/* Free Plan */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="text-2xl">Basic</CardTitle>
              <CardDescription>Perfect for testing the waters</CardDescription>
              <div className="mt-4 text-4xl font-bold">$0<span className="text-lg text-muted-foreground font-normal">/forever</span></div>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500" />
                  <span>5 total resume scans</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500" />
                  <span>Basic ATS scoring</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500" />
                  <span>Job Description matching</span>
                </li>
                <li className="flex items-center gap-3 text-muted-foreground">
                  <X className="h-5 w-5" />
                  <span>AI Insight breakdown</span>
                </li>
                <li className="flex items-center gap-3 text-muted-foreground">
                  <X className="h-5 w-5" />
                  <span>Cover letter generation</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" disabled={!isPro}>
                {isPro ? "Downgrade" : "Current Plan"}
              </Button>
            </CardFooter>
          </Card>

          {/* Pro Plan */}
          <Card className="flex flex-col border-primary shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-semibold rounded-bl-lg">
              POPULAR
            </div>
            <CardHeader>
              <CardTitle className="text-2xl text-primary">Pro</CardTitle>
              <CardDescription>For serious job seekers</CardDescription>
              <div className="mt-4 text-4xl font-bold">$19<span className="text-lg text-muted-foreground font-normal">/month</span></div>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500" />
                  <span className="font-semibold">Unlimited resume scans</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500" />
                  <span>Advanced ATS scoring</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500" />
                  <span>Deep Job Description matching</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500" />
                  <span>Full AI Insight breakdown</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500" />
                  <span>Priority support</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button className="w-full text-lg h-12" disabled={isPro}>
                {isPro ? "Current Plan" : "Upgrade to Pro"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
