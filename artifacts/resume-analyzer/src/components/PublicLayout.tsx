import { useState } from "react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageToggle } from "./LanguageToggle";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const { t, i18n } = useTranslation();
  const { userProfile } = useAuth();
  const [open, setOpen] = useState(false);
  const isRtl = i18n.language === "ar";

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background selection:bg-primary selection:text-primary-foreground">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight text-primary">
            <span className="bg-primary text-primary-foreground px-2 py-1 rounded-md">AI</span>
            <span>{t("brand")}</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <Link href="/pricing">{t("nav.pricing")}</Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <Link href="/about">{t("nav.aboutUs")}</Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <Link href="/">{t("nav.home")}</Link>
            </Button>
            <div className="w-px h-5 bg-border mx-1" />
            <LanguageToggle />
            <ThemeToggle />
            {userProfile ? (
              <Button asChild variant="default" size="sm">
                <Link href="/dashboard">{t("nav.dashboard")}</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/login">{t("nav.logIn")}</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/register">{t("nav.getStarted")}</Link>
                </Button>
              </>
            )}
          </nav>

          {/* Mobile nav */}
          <div className="flex md:hidden items-center gap-1">
            <LanguageToggle />
            <ThemeToggle />
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">القائمة</span>
                </Button>
              </SheetTrigger>
              <SheetContent side={isRtl ? "right" : "left"} className="w-72 flex flex-col">
                <SheetTitle className="sr-only">القائمة</SheetTitle>
                <SheetDescription className="sr-only">روابط التنقل</SheetDescription>
                <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-primary mb-8 mt-2">
                  <span className="bg-primary text-primary-foreground px-2 py-1 rounded-md">AI</span>
                  <span>{t("brand")}</span>
                </div>
                <nav className="flex flex-col gap-2 flex-1">
                  <Link href="/" onClick={() => setOpen(false)}>
                    <div className="px-3 py-2.5 rounded-md text-foreground hover:bg-muted transition-colors font-medium">
                      {t("nav.home")}
                    </div>
                  </Link>
                  <Link href="/pricing" onClick={() => setOpen(false)}>
                    <div className="px-3 py-2.5 rounded-md text-foreground hover:bg-muted transition-colors font-medium">
                      {t("nav.pricing")}
                    </div>
                  </Link>
                  <Link href="/about" onClick={() => setOpen(false)}>
                    <div className="px-3 py-2.5 rounded-md text-foreground hover:bg-muted transition-colors font-medium">
                      {t("nav.aboutUs")}
                    </div>
                  </Link>
                </nav>
                <div className="flex flex-col gap-2 pt-4 border-t">
                  {userProfile ? (
                    <Button asChild onClick={() => setOpen(false)}>
                      <Link href="/dashboard">{t("nav.dashboard")}</Link>
                    </Button>
                  ) : (
                    <>
                      <Button asChild variant="outline" onClick={() => setOpen(false)}>
                        <Link href="/login">{t("nav.logIn")}</Link>
                      </Button>
                      <Button asChild onClick={() => setOpen(false)}>
                        <Link href="/register">{t("nav.getStarted")}</Link>
                      </Button>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="border-t bg-muted/50">
        <div className="container px-4 md:px-10 py-12 md:py-16 lg:py-20">
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
