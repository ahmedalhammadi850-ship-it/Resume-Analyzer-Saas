import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { useTranslation } from "react-i18next";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Register from "@/pages/register";
import ForgotPassword from "@/pages/forgot-password";
import Dashboard from "@/pages/dashboard";
import Analyze from "@/pages/analyze";
import History from "@/pages/history";
import AnalysisResult from "@/pages/analysis";
import Pricing from "@/pages/pricing";
import PublicPricing from "@/pages/public-pricing";
import About from "@/pages/about";
import Settings from "@/pages/settings";
import Admin from "@/pages/admin";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/pricing" component={PublicPricing} />
      <Route path="/about" component={About} />
      
      {/* Protected Routes */}
      <Route path="/dashboard">
        <ProtectedRoute><Dashboard /></ProtectedRoute>
      </Route>
      <Route path="/analyze">
        <ProtectedRoute><Analyze /></ProtectedRoute>
      </Route>
      <Route path="/history">
        <ProtectedRoute><History /></ProtectedRoute>
      </Route>
      <Route path="/analysis/:id">
        <ProtectedRoute><AnalysisResult /></ProtectedRoute>
      </Route>
      <Route path="/plans">
        <ProtectedRoute><Pricing /></ProtectedRoute>
      </Route>
      <Route path="/settings">
        <ProtectedRoute><Settings /></ProtectedRoute>
      </Route>
      
      {/* Admin Route */}
      <Route path="/admin">
        <ProtectedRoute requireRole="admin"><Admin /></ProtectedRoute>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function RtlSync() {
  const { i18n } = useTranslation();
  useEffect(() => {
    const dir = i18n.language === "ar" ? "rtl" : "ltr";
    document.documentElement.dir = dir;
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);
  return null;
}

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <RtlSync />
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
