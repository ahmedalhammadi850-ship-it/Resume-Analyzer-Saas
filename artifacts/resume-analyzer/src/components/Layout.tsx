import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  FileText, 
  History, 
  Settings as SettingsIcon, 
  ShieldAlert,
  LogOut,
  Menu
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

export function Layout({ children }: { children: React.ReactNode }) {
  const { userProfile, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/analyze", label: "New Analysis", icon: FileText },
    { href: "/history", label: "History", icon: History },
    { href: "/settings", label: "Settings", icon: SettingsIcon },
  ];

  if (userProfile?.role === "admin") {
    navItems.push({ href: "/admin", label: "Admin Panel", icon: ShieldAlert });
  }

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6">
        <Link href="/" className="flex items-center space-x-2 font-bold text-xl tracking-tight text-primary">
          <span className="bg-primary text-primary-foreground px-2 py-1 rounded-md">AI</span>
          <span>Resume</span>
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
              {userProfile?.plan} PLAN
            </Badge>
            {userProfile?.plan === "free" && (
              <span className="text-xs text-muted-foreground">{userProfile.remainingScans} scans left</span>
            )}
          </div>
        </div>

        <Button 
          variant="ghost" 
          className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5 mr-3" />
          Log out
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
      <div className="flex-1 flex flex-col lg:pl-64 min-h-[100dvh]">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between p-4 bg-background border-b sticky top-0 z-20">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72">
              <NavContent />
            </SheetContent>
          </Sheet>
          
          <Link href="/" className="font-bold text-lg text-primary tracking-tight">
            AI Resume
          </Link>
          
          <ThemeToggle />
        </header>

        {/* Desktop Header (just theme toggle for now) */}
        <header className="hidden lg:flex justify-end p-4 sticky top-0 z-10 bg-muted/30 backdrop-blur-sm">
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
