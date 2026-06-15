import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageToggle } from "./LanguageToggle";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, Users, Tag, Crown, Settings, LogOut,
  ShieldAlert, Menu, Bell, BarChart3
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { closeAdminGate } from "./AdminLoginGate";

const adminNavItems = [
  { href: "/admin", label: "نظرة عامة", icon: LayoutDashboard },
  { href: "/admin#users", label: "المستخدمون", icon: Users },
  { href: "/admin#pricing", label: "إدارة الأسعار", icon: Tag },
  { href: "/admin#upgrades", label: "طلبات الترقية", icon: Crown },
  { href: "/admin#notifications", label: "الإشعارات", icon: Bell },
  { href: "/admin#overview", label: "الإحصائيات", icon: BarChart3 },
  { href: "/admin#system", label: "الإعدادات", icon: Settings },
];

interface AdminLayoutProps {
  children: React.ReactNode;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export function AdminLayout({ children, activeTab, onTabChange }: AdminLayoutProps) {
  const [open, setOpen] = useState(false);
  const { i18n } = useTranslation();
  const [location, navigate] = useLocation();
  const isRtl = i18n.language === "ar";

  function handleLogout() {
    closeAdminGate();
    navigate("/");
  }

  function handleNav(tab: string) {
    onTabChange?.(tab);
    setOpen(false);
  }

  const tabMap: Record<string, string> = {
    users: "المستخدمون",
    pricing: "إدارة الأسعار",
    upgrades: "طلبات الترقية",
    notifications: "الإشعارات",
    overview: "الإحصائيات",
    system: "الإعدادات",
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-red-900/30">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-destructive flex items-center justify-center">
            <ShieldAlert className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="font-bold text-sm">لوحة الإدارة</div>
            <div className="text-[10px] text-muted-foreground">Admin Panel</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        {/* Overview (full page, no tab) */}
        <button
          onClick={() => handleNav("overview-top")}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors text-start ${
            !activeTab || activeTab === "overview-top"
              ? "bg-destructive/15 text-destructive font-medium border border-destructive/20"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <LayoutDashboard className="h-4 w-4 shrink-0" />
          نظرة عامة
        </button>

        <div className="pt-1 pb-0.5 px-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">الإدارة</p>
        </div>

        {[
          { tab: "users", label: "المستخدمون", icon: Users },
          { tab: "pricing", label: "إدارة الأسعار", icon: Tag },
          { tab: "upgrades", label: "طلبات الترقية", icon: Crown },
        ].map(({ tab, label, icon: Icon }) => (
          <button
            key={tab}
            onClick={() => handleNav(tab)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors text-start ${
              activeTab === tab
                ? "bg-destructive/15 text-destructive font-medium border border-destructive/20"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </button>
        ))}

        <div className="pt-2 pb-0.5 px-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">النظام</p>
        </div>

        {[
          { tab: "overview", label: "الإحصائيات", icon: BarChart3 },
          { tab: "system", label: "إعدادات النظام", icon: Settings },
        ].map(({ tab, label, icon: Icon }) => (
          <button
            key={tab}
            onClick={() => handleNav(tab)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors text-start ${
              activeTab === tab
                ? "bg-destructive/15 text-destructive font-medium border border-destructive/20"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border space-y-2">
        <div className="px-3 py-2 rounded-md bg-destructive/5 border border-destructive/10">
          <div className="text-xs font-semibold text-destructive flex items-center gap-1.5">
            <ShieldAlert className="h-3.5 w-3.5" />
            مدير النظام
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">ahmed · admin7707</div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-9"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 me-2" />
          تسجيل الخروج
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-[100dvh] flex bg-muted/20" dir={isRtl ? "rtl" : "ltr"}>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-60 flex-col bg-background border-e fixed inset-y-0 z-10 shadow-sm">
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col ${isRtl ? "lg:pr-60" : "lg:pl-60"} min-h-[100dvh]`}>
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between p-4 bg-background border-b sticky top-0 z-20">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side={isRtl ? "right" : "left"} className="p-0 w-64">
              <SidebarContent />
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-1.5 font-bold text-destructive text-sm">
            <ShieldAlert className="h-4 w-4" />
            لوحة الإدارة
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </header>

        {/* Desktop top-bar */}
        <header className="hidden lg:flex justify-between items-center px-8 py-3 sticky top-0 z-10 bg-muted/20 backdrop-blur-sm border-b border-border/40">
          <div className="text-sm text-muted-foreground">
            {activeTab && tabMap[activeTab] ? (
              <span>الإدارة ← <span className="text-foreground font-medium">{tabMap[activeTab]}</span></span>
            ) : (
              <span className="text-foreground font-medium">نظرة عامة</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
