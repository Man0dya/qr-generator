"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
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
  const [user, setUser] = useState<AuthUser | null>(null);

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
    <div className="min-h-screen bg-background flex font-sans text-foreground selection:bg-primary selection:text-primary-foreground relative">

      {/* --- SIDEBAR  --- */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-card border-r border-border p-4 flex flex-col z-20 transition-colors duration-300 overflow-hidden">
        <div className="flex items-center gap-3 mb-6 px-2">
          <Logo className="w-8 h-8" />
          <h1 className="text-lg font-bold text-foreground">
            URLMD Console
          </h1>
        </div>

        <nav className="space-y-1 flex-1">
          <Link
            href="/dashboard"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group font-medium text-sm ${pathname === '/dashboard'
              ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
          >
            <LayoutDashboard size={18} className={pathname === '/dashboard' ? "text-primary-foreground" : "text-muted-foreground group-hover:text-accent-foreground transition-colors"} />
            Dashboard
          </Link>

          <div className="pt-3 pb-1">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-3 opacity-70">Links</p>
          </div>

          <Link
            href="/dashboard/urlmd"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group font-medium text-sm ${pathname.startsWith('/dashboard/urlmd')
              ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
          >
            <Link2 size={18} className={pathname.startsWith('/dashboard/urlmd') ? "text-primary-foreground" : "text-muted-foreground group-hover:text-accent-foreground transition-colors"} />
            Manage Links
          </Link>

          <Link
            href="/dashboard/urlmd/create"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group font-medium text-sm ${pathname === '/dashboard/urlmd/create'
              ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
          >
            <PlusCircle size={18} className={pathname === '/dashboard/urlmd/create' ? "text-primary-foreground" : "text-muted-foreground group-hover:text-accent-foreground transition-colors"} />
            New Short Link
          </Link>

          <div className="pt-3 pb-1">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-3 opacity-70">QR Codes</p>
          </div>

          <Link
            href="/dashboard/create"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group font-medium text-sm ${pathname === '/dashboard/create'
              ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
          >
            <PlusCircle size={18} className={pathname === '/dashboard/create' ? "text-primary-foreground" : "text-muted-foreground group-hover:text-accent-foreground transition-colors"} />
            Create QR
          </Link>

          <Link
            href="/dashboard/qrs"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group font-medium text-sm ${pathname === '/dashboard/qrs'
              ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
          >
            <QrCode size={18} className={pathname === '/dashboard/qrs' ? "text-primary-foreground" : "text-muted-foreground group-hover:text-accent-foreground transition-colors"} />
            My QRs
          </Link>

          <Link
            href="/dashboard/login-history"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group font-medium text-sm ${pathname === '/dashboard/login-history'
              ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
          >
            <History size={18} className={pathname === '/dashboard/login-history' ? "text-primary-foreground" : "text-muted-foreground group-hover:text-accent-foreground transition-colors"} />
            History
          </Link>

          <Link
            href="/dashboard/settings"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group font-medium text-sm ${pathname === '/dashboard/settings'
              ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
          >
            <UserCog size={18} className={pathname === '/dashboard/settings' ? "text-primary-foreground" : "text-muted-foreground group-hover:text-accent-foreground transition-colors"} />
            Settings
          </Link>

          <div className="pt-4 pb-2">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-3 opacity-70">Enterprise</p>
          </div>

          <Link
            href="/dashboard/domains"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group font-medium text-sm ${pathname === '/dashboard/domains'
              ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
          >
            <Globe size={18} className={pathname === '/dashboard/domains' ? "text-primary-foreground" : "text-muted-foreground group-hover:text-accent-foreground transition-colors"} />
            Custom Domains
          </Link>

          <Link
            href="/dashboard/teams"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group font-medium text-sm ${pathname === '/dashboard/teams'
              ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
          >
            <Users size={18} className={pathname === '/dashboard/teams' ? "text-primary-foreground" : "text-muted-foreground group-hover:text-accent-foreground transition-colors"} />
            Teams
          </Link>

          <Link
            href="/dashboard/bulk"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group font-medium text-sm ${pathname === '/dashboard/bulk'
              ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
          >
            <Upload size={18} className={pathname === '/dashboard/bulk' ? "text-primary-foreground" : "text-muted-foreground group-hover:text-accent-foreground transition-colors"} />
            Bulk Import
          </Link>

          <Link
            href="/dashboard/developers"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group font-medium text-sm ${pathname === '/dashboard/developers'
              ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
          >
            <Terminal size={18} className={pathname === '/dashboard/developers' ? "text-primary-foreground" : "text-muted-foreground group-hover:text-accent-foreground transition-colors"} />
            Developers
          </Link>

          {(user.role === 'admin' || user.role === 'super_admin') && (
            <Link
              href={user.role === 'super_admin' ? "/super-admin" : "/admin"}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-amber-500 hover:bg-amber-500/10 transition-all font-medium mt-6 text-sm"
            >
              <ShieldCheck size={18} />
              {user.role === 'super_admin' ? 'Super Admin' : 'Admin Panel'}
            </Link>
          )}
        </nav>

        <div className="mt-auto pt-4 space-y-4">
          <div className="flex items-center gap-3 px-2 py-2 mb-2 bg-muted/40 rounded-xl border border-border/50">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-bold text-xs shrink-0">
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
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-destructive hover:bg-destructive/10 border border-destructive/20 hover:border-destructive/30 transition-all font-medium text-sm"
            >
              <LogOut size={16} />
              Logout
            </button>
            <ThemeToggle />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 flex-1 flex flex-col h-screen overflow-hidden">
        <div className="flex-1 overflow-y-auto w-full p-8 transition-all duration-300">
          <div className="w-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}