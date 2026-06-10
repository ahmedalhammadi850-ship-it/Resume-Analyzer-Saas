import { Link, useLocation } from "wouter";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background selection:bg-primary selection:text-primary-foreground">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2 font-bold text-xl tracking-tight text-primary">
            <span className="bg-primary text-primary-foreground px-2 py-1 rounded-md">AI</span>
            <span>Resume</span>
          </Link>

          <nav className="flex items-center gap-4">
            <ThemeToggle />
            {currentUser ? (
              <Button asChild variant="default">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" className="hidden sm:inline-flex">
                  <Link href="/login">Log in</Link>
                </Button>
                <Button asChild>
                  <Link href="/register">Get Started</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="border-t bg-muted/50">
        <div className="container py-12 md:py-16 lg:py-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
            <div className="col-span-2">
              <Link href="/" className="flex items-center space-x-2 font-bold text-xl tracking-tight text-primary mb-4">
                <span className="bg-primary text-primary-foreground px-2 py-1 rounded-md">AI</span>
                <span>Resume</span>
              </Link>
              <p className="text-muted-foreground text-sm max-w-sm">
                Precision tools for the modern job hunt. We analyze your resume against job descriptions using advanced AI to help you land the interview.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-foreground">Product</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="/pricing" className="hover:text-primary transition-colors">Pricing</Link></li>
                <li><Link href="/login" className="hover:text-primary transition-colors">Sign in</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-foreground">Legal</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} AI Resume Analyzer. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
