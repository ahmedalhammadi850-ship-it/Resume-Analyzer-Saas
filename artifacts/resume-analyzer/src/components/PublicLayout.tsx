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
        {/* 3-column grid so center nav is always truly centered */}
        <div className="w-full max-w-screen-xl mx-auto grid grid-cols-3 h-16 items-center px-4 md:px-8">

          {/* Col 1 — Logo (start) */}
          <div className="flex justify-start">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight text-primary">
              <span className="bg-primary text-primary-foreground px-2 py-0.5 rounded-md text-sm font-extrabold">AI</span>
              <span className="hidden sm:inline">{t("brand")}</span>
            </Link>
          </div>

          {/* Col 2 — Center nav (desktop only) */}
          <div className="hidden md:flex justify-center">
            <nav className="flex items-center gap-0.5 bg-muted/60 rounded-full px-2 py-1">
              <Button asChild variant="ghost" size="sm" className="rounded-full text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-background transition-all">
                <Link href="/">{t("nav.home")}</Link>
              </Button>
              <Button asChild variant="ghost" size="sm" className="rounded-full text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-background transition-all">
                <Link href="/pricing">{t("nav.pricing")}</Link>
              </Button>
              <Button asChild variant="ghost" size="sm" className="rounded-full text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-background transition-all">
                <Link href="/about">{t("nav.aboutUs")}</Link>
              </Button>
            </nav>
          </div>

          {/* Col 2 mobile placeholder */}
          <div className="md:hidden" />

          {/* Col 3 — Actions (end) */}
          <div className="flex justify-end items-center gap-1.5">
            {/* Desktop actions */}
            <div className="hidden md:flex items-center gap-1.5">
              <LanguageToggle />
              <ThemeToggle />
              <div className="w-px h-5 bg-border mx-1" />
              {userProfile ? (
                <Button asChild size="sm" className="rounded-full px-5">
                  <Link href="/dashboard">{t("nav.dashboard")}</Link>
                </Button>
              ) : (
                <>
                  <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                    <Link href="/login">{t("nav.logIn")}</Link>
                  </Button>
                  <Button asChild size="sm" className="rounded-full px-5 shadow-sm">
                    <Link href="/register">{t("nav.getStarted")}</Link>
                  </Button>
                </>
              )}
            </div>

            {/* Mobile actions */}
            <div className="flex md:hidden items-center gap-1">
              <LanguageToggle />
              <ThemeToggle />
              <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
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
                  <nav className="flex flex-col gap-1 flex-1">
                    {[
                      { href: "/", label: t("nav.home") },
                      { href: "/pricing", label: t("nav.pricing") },
                      { href: "/about", label: t("nav.aboutUs") },
                    ].map(({ href, label }) => (
                      <Link key={href} href={href} onClick={() => setOpen(false)}>
                        <div className="px-3 py-2.5 rounded-lg text-foreground hover:bg-muted transition-colors font-medium text-sm">
                          {label}
                        </div>
                      </Link>
                    ))}
                  </nav>
                  <div className="flex flex-col gap-2 pt-4 border-t">
                    {userProfile ? (
                      <Button asChild onClick={() => setOpen(false)} className="rounded-full">
                        <Link href="/dashboard">{t("nav.dashboard")}</Link>
                      </Button>
                    ) : (
                      <>
                        <Button asChild variant="outline" onClick={() => setOpen(false)} className="rounded-full">
                          <Link href="/login">{t("nav.logIn")}</Link>
                        </Button>
                        <Button asChild onClick={() => setOpen(false)} className="rounded-full">
                          <Link href="/register">{t("nav.getStarted")}</Link>
                        </Button>
                      </>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="border-t bg-muted/30">
        <div className="w-full max-w-screen-xl mx-auto px-4 md:px-10 py-12 md:py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
            <div className="col-span-2">
              <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight text-primary mb-4">
                <span className="bg-primary text-primary-foreground px-2 py-1 rounded-md text-sm">AI</span>
                <span>{t("brand")}</span>
              </Link>
              <p className="text-muted-foreground text-sm max-w-sm leading-relaxed">
                {t("footer.tagline")}
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-foreground text-sm uppercase tracking-wide">{t("footer.product")}</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="/pricing" className="hover:text-primary transition-colors">{t("footer.pricing")}</Link></li>
                <li><Link href="/login" className="hover:text-primary transition-colors">{t("footer.signIn")}</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-foreground text-sm uppercase tracking-wide">{t("footer.legal")}</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-primary transition-colors">{t("footer.privacyPolicy")}</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">{t("footer.termsOfService")}</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-10 pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <span>&copy; {new Date().getFullYear()} {t("footer.copyright")}</span>
            <div className="flex items-center gap-1">
              <span className="inline-flex items-center gap-1.5 bg-green-500/10 text-green-700 dark:text-green-400 text-xs font-medium px-2.5 py-1 rounded-full">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 inline-block" />
                All systems operational
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
