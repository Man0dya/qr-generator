"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard, PlusCircle, LogOut,
  ShieldCheck, UserCog, History, Globe, Users, Upload, Terminal, Link2, QrCode, Palette
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "@/components/Logo";

type UserRole = "user" | "admin" | "super_admin";
type AuthUser = { id?: number; email: string; role: UserRole; name?: string };

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<AuthUser | null>(null);

  const urlmdView = searchParams.get("view") || "all";

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/login");
    } else {
      setUser(JSON.parse(storedUser));
    }
  }, [router]);

  const handleLogout = async () => {
    try {
      // apiFetch handles credentials
      await apiFetch("/logout.php", { method: "POST" });
    } catch {
      // Best-effort only
    } finally {
      localStorage.removeItem("session_id");
      localStorage.removeItem("user");
      router.push("/login");
    }
  };

  if (!user) return null;

  // Determine Display Name
  const displayName = user.name || "User";
  const displayEmail = user.email;
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex font-sans text-foreground selection:bg-primary selection:text-primary-foreground relative">

      {/* --- SIDEBAR  --- */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-card border-r border-border/60 flex flex-col z-20 transition-colors duration-300">
        <div className="h-14 flex items-center gap-3 px-6 border-b border-border/60">
          <Logo className="w-7 h-7" />
          <h1 className="text-sm font-bold text-foreground tracking-tight">
            URLMD Console
          </h1>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
          <Link
            href="/dashboard"
            className={`flex items-center gap-3 px-3 py-1.5 rounded-md transition-all duration-200 group font-medium text-sm border-l-2 ${pathname === '/dashboard'
              ? "bg-primary/5 text-primary border-primary"
              : "text-muted-foreground hover:bg-muted/50 hover:text-foreground border-transparent"
              }`}
          >
            <LayoutDashboard size={18} className={pathname === '/dashboard' ? "text-primary" : "text-muted-foreground group-hover:text-foreground transition-colors"} />
            Overview
          </Link>

          <Link
            href="/dashboard/new-asset"
            className={`flex items-center gap-3 px-3 py-1.5 rounded-md transition-all duration-200 group font-medium text-sm border-l-2 ${pathname === '/dashboard/new-asset'
              ? "bg-primary/5 text-primary border-primary"
              : "text-muted-foreground hover:bg-muted/50 hover:text-foreground border-transparent"
              }`}
          >
            <PlusCircle size={18} className={pathname === '/dashboard/new-asset' ? "text-primary" : "text-muted-foreground group-hover:text-foreground transition-colors"} />
            New Asset
          </Link>

          {/* --- URL SHORTENER --- */}
          <div className="pt-3 pb-1 px-3">
            <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">Products</p>
          </div>

          <Link
            href="/dashboard/urlmd"
            className={`flex items-center gap-3 px-3 py-1.5 rounded-md transition-all duration-200 group font-medium text-sm border-l-2 ${pathname.startsWith('/dashboard/urlmd')
              ? "bg-primary/5 text-primary border-primary"
              : "text-muted-foreground hover:bg-muted/50 hover:text-foreground border-transparent"
              }`}
          >
            <Link2 size={18} className={pathname.startsWith('/dashboard/urlmd') ? "text-primary" : "text-muted-foreground group-hover:text-foreground transition-colors"} />
            URL Shortener
          </Link>

          <Link
            href="/dashboard/qrs"
            className={`flex items-center gap-3 px-3 py-1.5 rounded-md transition-all duration-200 group font-medium text-sm border-l-2 ${pathname.startsWith('/dashboard/qrs')
              ? "bg-primary/5 text-primary border-primary"
              : "text-muted-foreground hover:bg-muted/50 hover:text-foreground border-transparent"
              }`}
          >
            <QrCode size={18} className={pathname.startsWith('/dashboard/qrs') ? "text-primary" : "text-muted-foreground group-hover:text-foreground transition-colors"} />
            QR Generator
          </Link>

          <div className="pt-3 pb-1 px-3">
            <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">Workspace</p>
          </div>

          <Link
            href="/dashboard/login-history"
            className={`flex items-center gap-3 px-3 py-1.5 rounded-md transition-all duration-200 group font-medium text-sm border-l-2 ${pathname === '/dashboard/login-history'
              ? "bg-primary/5 text-primary border-primary"
              : "text-muted-foreground hover:bg-muted/50 hover:text-foreground border-transparent"
              }`}
          >
            <History size={18} className={pathname === '/dashboard/login-history' ? "text-primary" : "text-muted-foreground group-hover:text-foreground transition-colors"} />
            History
          </Link>

          <Link
            href="/dashboard/settings"
            className={`flex items-center gap-3 px-3 py-1.5 rounded-md transition-all duration-200 group font-medium text-sm border-l-2 ${pathname === '/dashboard/settings'
              ? "bg-primary/5 text-primary border-primary"
              : "text-muted-foreground hover:bg-muted/50 hover:text-foreground border-transparent"
              }`}
          >
            <UserCog size={18} className={pathname === '/dashboard/settings' ? "text-primary" : "text-muted-foreground group-hover:text-foreground transition-colors"} />
            Settings
          </Link>

          <div className="pt-3 pb-1 px-3">
            <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">Enterprise</p>
          </div>

          <Link
            href="/dashboard/domains"
            className={`flex items-center gap-3 px-3 py-1.5 rounded-md transition-all duration-200 group font-medium text-sm border-l-2 ${pathname === '/dashboard/domains'
              ? "bg-primary/5 text-primary border-primary"
              : "text-muted-foreground hover:bg-muted/50 hover:text-foreground border-transparent"
              }`}
          >
            <Globe size={18} className={pathname === '/dashboard/domains' ? "text-primary" : "text-muted-foreground group-hover:text-foreground transition-colors"} />
            Custom Domains
          </Link>

          <Link
            href="/dashboard/teams"
            className={`flex items-center gap-3 px-3 py-1.5 rounded-md transition-all duration-200 group font-medium text-sm border-l-2 ${pathname === '/dashboard/teams'
              ? "bg-primary/5 text-primary border-primary"
              : "text-muted-foreground hover:bg-muted/50 hover:text-foreground border-transparent"
              }`}
          >
            <Users size={18} className={pathname === '/dashboard/teams' ? "text-primary" : "text-muted-foreground group-hover:text-foreground transition-colors"} />
            Teams
          </Link>

          <Link
            href="/dashboard/bulk"
            className={`flex items-center gap-3 px-3 py-1.5 rounded-md transition-all duration-200 group font-medium text-sm border-l-2 ${pathname === '/dashboard/bulk'
              ? "bg-primary/5 text-primary border-primary"
              : "text-muted-foreground hover:bg-muted/50 hover:text-foreground border-transparent"
              }`}
          >
            <Upload size={18} className={pathname === '/dashboard/bulk' ? "text-primary" : "text-muted-foreground group-hover:text-foreground transition-colors"} />
            Bulk Import
          </Link>

          <Link
            href="/dashboard/developers"
            className={`flex items-center gap-3 px-3 py-1.5 rounded-md transition-all duration-200 group font-medium text-sm border-l-2 ${pathname === '/dashboard/developers'
              ? "bg-primary/5 text-primary border-primary"
              : "text-muted-foreground hover:bg-muted/50 hover:text-foreground border-transparent"
              }`}
          >
            <Terminal size={18} className={pathname === '/dashboard/developers' ? "text-primary" : "text-muted-foreground group-hover:text-foreground transition-colors"} />
            Developers
          </Link>

          {(user.role === 'admin' || user.role === 'super_admin') && (
            <div className="pt-3 px-3">
              <Link
                href={user.role === 'super_admin' ? "/super-admin" : "/admin"}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-md text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 transition-all font-medium text-sm border border-amber-500/20"
              >
                <ShieldCheck size={16} />
                {user.role === 'super_admin' ? 'Super Admin' : 'Admin Panel'}
              </Link>
            </div>
          )}
        </nav>

        <div className="p-3 border-t border-border/60 bg-muted/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-xs shrink-0">
              {initial}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold truncate text-foreground">{displayName}</p>
              <p className="text-xs text-muted-foreground truncate opacity-80">{displayEmail}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleLogout}
              className="flex-1 flex items-center justify-center gap-2 h-8 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all font-medium text-xs border border-border hover:border-destructive/20"
            >
              <LogOut size={14} />
              Logout
            </button>
            <div className="scale-90 origin-right">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 flex-1 flex flex-col h-screen overflow-hidden">
        <div className="flex-1 overflow-y-auto w-full p-8 transition-all duration-300">
          <div className="w-full max-w-[1400px] mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}