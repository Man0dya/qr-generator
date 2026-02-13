"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard, PlusCircle, LogOut,
  ShieldCheck, UserCog, History, Globe, Users, Upload, Terminal, Link2, QrCode
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
      <aside className="fixed left-0 top-0 h-full w-60 bg-card/95 backdrop-blur border-r border-border p-3 flex flex-col z-20 transition-colors duration-300">
        <div className="flex items-center gap-2.5 mb-4 px-1.5">
          <Logo className="w-8 h-8" />
          <h1 className="text-base font-bold text-foreground">
            URLMD Console
          </h1>
        </div>

        <nav className="space-y-0.5 flex-1 overflow-y-auto pr-1">
          <Link
            href="/dashboard"
            className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all duration-200 group font-medium text-sm ${pathname === '/dashboard'
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
          >
            <LayoutDashboard size={16} className={pathname === '/dashboard' ? "text-primary-foreground" : "text-muted-foreground group-hover:text-accent-foreground transition-colors"} />
            Dashboard
          </Link>

          <Link
            href="/dashboard/new-asset"
            className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all duration-200 group font-medium text-sm ${pathname === '/dashboard/new-asset'
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
          >
            <PlusCircle size={16} className={pathname === '/dashboard/new-asset' ? "text-primary-foreground" : "text-muted-foreground group-hover:text-accent-foreground transition-colors"} />
            New Asset
          </Link>

          <div className="pt-2.5 pb-1">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-2.5 opacity-70">Assets</p>
          </div>

          <Link
            href="/dashboard/urlmd?view=with-qr"
            className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all duration-200 group font-medium text-sm ${(pathname === '/dashboard/urlmd' && urlmdView === 'with-qr')
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
          >
            <Link2 size={16} className={(pathname === '/dashboard/urlmd' && urlmdView === 'with-qr') ? "text-primary-foreground" : "text-muted-foreground group-hover:text-accent-foreground transition-colors"} />
            Short Links with QR
          </Link>

          <Link
            href="/dashboard/urlmd"
            className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all duration-200 group font-medium text-sm ${(pathname === '/dashboard/urlmd' && urlmdView !== 'with-qr')
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
          >
            <Link2 size={16} className={(pathname === '/dashboard/urlmd' && urlmdView !== 'with-qr') ? "text-primary-foreground" : "text-muted-foreground group-hover:text-accent-foreground transition-colors"} />
            Short Links
          </Link>

          <Link
            href="/dashboard/qrs"
            className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all duration-200 group font-medium text-sm ${pathname === '/dashboard/qrs'
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
          >
            <QrCode size={16} className={pathname === '/dashboard/qrs' ? "text-primary-foreground" : "text-muted-foreground group-hover:text-accent-foreground transition-colors"} />
            QRs
          </Link>

          <div className="pt-3 pb-1">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-2.5 opacity-70">Workspace</p>
          </div>

          <Link
            href="/dashboard/login-history"
            className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all duration-200 group font-medium text-sm ${pathname === '/dashboard/login-history'
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
          >
            <History size={16} className={pathname === '/dashboard/login-history' ? "text-primary-foreground" : "text-muted-foreground group-hover:text-accent-foreground transition-colors"} />
            History
          </Link>

          <Link
            href="/dashboard/settings"
            className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all duration-200 group font-medium text-sm ${pathname === '/dashboard/settings'
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
          >
            <UserCog size={16} className={pathname === '/dashboard/settings' ? "text-primary-foreground" : "text-muted-foreground group-hover:text-accent-foreground transition-colors"} />
            Settings
          </Link>

          <div className="pt-3 pb-1">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-2.5 opacity-70">Enterprise</p>
          </div>

          <Link
            href="/dashboard/domains"
            className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all duration-200 group font-medium text-sm ${pathname === '/dashboard/domains'
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
          >
            <Globe size={16} className={pathname === '/dashboard/domains' ? "text-primary-foreground" : "text-muted-foreground group-hover:text-accent-foreground transition-colors"} />
            Custom Domains
          </Link>

          <Link
            href="/dashboard/teams"
            className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all duration-200 group font-medium text-sm ${pathname === '/dashboard/teams'
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
          >
            <Users size={16} className={pathname === '/dashboard/teams' ? "text-primary-foreground" : "text-muted-foreground group-hover:text-accent-foreground transition-colors"} />
            Teams
          </Link>

          <Link
            href="/dashboard/bulk"
            className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all duration-200 group font-medium text-sm ${pathname === '/dashboard/bulk'
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
          >
            <Upload size={16} className={pathname === '/dashboard/bulk' ? "text-primary-foreground" : "text-muted-foreground group-hover:text-accent-foreground transition-colors"} />
            Bulk Import
          </Link>

          <Link
            href="/dashboard/developers"
            className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all duration-200 group font-medium text-sm ${pathname === '/dashboard/developers'
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
          >
            <Terminal size={16} className={pathname === '/dashboard/developers' ? "text-primary-foreground" : "text-muted-foreground group-hover:text-accent-foreground transition-colors"} />
            Developers
          </Link>

          {(user.role === 'admin' || user.role === 'super_admin') && (
            <Link
              href={user.role === 'super_admin' ? "/super-admin" : "/admin"}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-amber-500 hover:bg-amber-500/10 transition-all font-medium mt-4 text-sm"
            >
              <ShieldCheck size={16} />
              {user.role === 'super_admin' ? 'Super Admin' : 'Admin Panel'}
            </Link>
          )}
        </nav>

        <div className="mt-auto pt-3 space-y-3 border-t border-border/60">
          <div className="flex items-center gap-2.5 px-2 py-2 bg-muted/40 rounded-xl border border-border/50">
            <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-bold text-xs shrink-0">
              {initial}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate text-foreground">{displayName}</p>
              <p className="text-[10px] text-muted-foreground truncate">{displayEmail}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleLogout}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-destructive hover:bg-destructive/10 border border-destructive/20 hover:border-destructive/30 transition-all font-medium text-sm"
            >
              <LogOut size={14} />
              Logout
            </button>
            <ThemeToggle />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-60 flex-1 flex flex-col h-screen overflow-hidden">
        <div className="flex-1 overflow-y-auto w-full p-6 lg:p-7 transition-all duration-300">
          <div className="w-full max-w-[1400px] mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}