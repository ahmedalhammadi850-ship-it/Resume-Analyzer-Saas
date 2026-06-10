import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageToggle } from "./LanguageToggle";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const { currentUser } = useAuth();

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background selection:bg-primary selection:text-primary-foreground">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight text-primary">
            <span className="bg-primary text-primary-foreground px-2 py-1 rounded-md">AI</span>
            <span>{t("brand")}</span>
          </Link>

          <nav className="flex items-center gap-1 sm:gap-2">
            <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex text-muted-foreground hover:text-foreground">
              <Link href="/pricing">{t("nav.pricing")}</Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex text-muted-foreground hover:text-foreground">
              <Link href="/about">{t("nav.aboutUs")}</Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex text-muted-foreground hover:text-foreground">
              <Link href="/">{t("nav.home")}</Link>
            </Button>
            <div className="hidden md:block w-px h-5 bg-border mx-1" />
            <LanguageToggle />
            <ThemeToggle />
            {currentUser ? (
              <Button asChild variant="default" size="sm">
                <Link href="/dashboard">{t("nav.dashboard")}</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                  <Link href="/login">{t("nav.logIn")}</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/register">{t("nav.getStarted")}</Link>
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
              <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight text-primary mb-4">
                <span className="bg-primary text-primary-foreground px-2 py-1 rounded-md">AI</span>
                <span>{t("brand")}</span>
              </Link>
              <p className="text-muted-foreground text-sm max-w-sm">
                {t("footer.tagline")}
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-foreground">{t("footer.product")}</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="/pricing" className="hover:text-primary transition-colors">{t("footer.pricing")}</Link></li>
                <li><Link href="/login" className="hover:text-primary transition-colors">{t("footer.signIn")}</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-foreground">{t("footer.legal")}</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-primary transition-colors">{t("footer.privacyPolicy")}</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">{t("footer.termsOfService")}</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} {t("footer.copyright")}
          </div>
        </div>
      </footer>
    </div>
  );
}
