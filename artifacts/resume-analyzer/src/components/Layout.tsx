import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageToggle } from "./LanguageToggle";
import { NotificationsBell } from "./NotificationsBell";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  FileText, 
  History, 
  Settings as SettingsIcon, 
  ShieldAlert,
  LogOut,
  Menu,
  CreditCard,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

const ADMIN_EMAILS = ["123qwr23fdf@gmail.com"];

export function Layout({ children }: { children: React.ReactNode }) {
  const { t, i18n } = useTranslation();
  const { userProfile, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const [open, setOpen] = useState(false);
  const isRtl = i18n.language === "ar";

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  const navItems = [
    { href: "/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
    { href: "/analyze", label: t("nav.newAnalysis"), icon: FileText },
    { href: "/history", label: t("nav.history"), icon: History },
    { href: "/plans", label: t("nav.pricing"), icon: CreditCard },
    { href: "/settings", label: t("nav.settings"), icon: SettingsIcon },
  ];

  const isAdmin = userProfile?.role === "admin" || ADMIN_EMAILS.includes(userProfile?.email ?? "");
  if (isAdmin) {
    navItems.push({ href: "/admin", label: t("nav.adminPanel"), icon: ShieldAlert });
  }

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight text-primary">
          <span className="bg-primary text-primary-foreground px-2 py-1 rounded-md">AI</span>
          <span>{t("brand")}</span>
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href || location.startsWith(`${item.href}/`);
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors cursor-pointer ${
                  isActive 
                    ? "bg-primary text-primary-foreground font-medium" 
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
                onClick={() => setOpen(false)}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t space-y-4">
        <div className="px-3 py-2 rounded-md bg-secondary/50">
          <div className="text-sm font-medium truncate">{userProfile?.name}</div>
          <div className="text-xs text-muted-foreground truncate">{userProfile?.email}</div>
          <div className="mt-2 flex items-center justify-between">
            <Badge variant={userProfile?.plan === "pro" ? "default" : "secondary"} className="uppercase text-[10px]">
              {userProfile?.plan === "pro" ? t("common.pro") : t("common.free")} PLAN
            </Badge>
            {userProfile?.plan === "free" && (
              <span className="text-xs text-muted-foreground">{userProfile.remainingScans} {t("common.scansLeft")}</span>
            )}
          </div>
        </div>

        <Button 
          variant="ghost" 
          className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5 me-3" />
          {t("nav.logOut")}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-[100dvh] flex bg-muted/30">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col bg-background border-r fixed inset-y-0 z-10">
        <NavContent />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:pl-64 rtl:lg:pr-64 rtl:lg:pl-0 min-h-[100dvh]">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between p-4 bg-background border-b sticky top-0 z-20">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side={isRtl ? "right" : "left"} className="p-0 w-72">
              <SheetTitle className="sr-only">{t("nav.menu")}</SheetTitle>
              <SheetDescription className="sr-only">{t("nav.menu")}</SheetDescription>
              <NavContent />
            </SheetContent>
          </Sheet>
          
          <Link href="/" className="font-bold text-lg text-primary tracking-tight">
            AI {t("brand")}
          </Link>
          
          <div className="flex items-center gap-2">
            <NotificationsBell />
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </header>

        {/* Desktop Header */}
        <header className="hidden lg:flex justify-end p-4 sticky top-0 z-10 bg-muted/30 backdrop-blur-sm gap-3 items-center">
          <NotificationsBell />
          <LanguageToggle />
          <ThemeToggle />
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
