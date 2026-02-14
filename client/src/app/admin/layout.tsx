"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Users, ShieldAlert, LogOut, BarChart3, Link2, Globe
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "@/components/Logo";

type UserRole = "user" | "admin" | "super_admin";
type AuthUser = { id?: number; email: string; role: UserRole; name?: string };

type NavItemProps = {
  href: string;
  active: boolean;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
};

function NavItem({ href, active, icon: Icon, label }: NavItemProps) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group font-medium ${active
        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/20"
        : "text-slate-400 hover:bg-white/5 hover:text-white"
        }`}
    >
      <Icon
        size={20}
        className={
          active
            ? "text-white"
            : "text-slate-500 group-hover:text-white transition-colors"
        }
      />
      {label}
    </Link>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={null}>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </Suspense>
  );
}

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // LOGIC: Determine which tab is active
  let currentView = searchParams.get('view');
  if (currentView === 'user-qrs') {
    currentView = 'users';
  }
  if (!currentView) {
    if (pathname.includes('/admin/analytics/')) {
      currentView = 'moderation';
    } else {
      currentView = 'analytics';
    }
  }

  useEffect(() => {
    try {
      const storedUser = window.localStorage.getItem("user");
      if (storedUser) {
        setUser(JSON.parse(storedUser) as AuthUser);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setAuthChecked(true);
    }
  }, []);

  useEffect(() => {
    if (!authChecked) return;
    if (!user) {
      router.push("/login");
      return;
    }

    if (user.role === "super_admin") {
      router.push("/super-admin");
      return;
    }
    if (user.role !== "admin") {
      router.push("/dashboard");
      return;
    }
  }, [router, user, authChecked]);

  const handleLogout = async () => {
    try {
      await apiFetch("/logout.php", { method: "POST" });
    } catch {
      // Best-effort only
    } finally {
      localStorage.removeItem("session_id");
      localStorage.removeItem("user");
      router.push("/login");
    }
  };

  if (!authChecked) return null;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-background flex font-sans text-foreground selection:bg-primary selection:text-primary-foreground relative">

      {/* --- SIDEBAR --- */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-card border-r border-border py-3 px-3 flex flex-col z-20 transition-colors duration-300 overflow-hidden">

        {/* Brand */}
        <div className="flex items-center gap-3 mb-4 px-2">
          <Logo className="w-8 h-8" />
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Admin Console
            </h1>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-6 flex-1 mt-4">

          {/* Analytics Group */}
          <div className="space-y-1">
            <p className="px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 opacity-70">Analytics</p>
            <Link
              href="/admin?view=analytics"
              className={`flex items-center gap-3 px-3 py-1.5 rounded-md transition-all duration-200 group font-medium text-sm border-l-2 ${currentView === "analytics"
                ? "bg-primary/5 text-primary border-primary"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground border-transparent"
                }`}
            >
              <BarChart3 size={18} className={currentView === "analytics" ? "text-primary-foreground" : "text-muted-foreground group-hover:text-accent-foreground transition-colors"} />
              Global Analytics
            </Link>
          </div>

          {/* Moderation Group */}
          <div className="space-y-1">
            <p className="px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 opacity-70">Moderation</p>
            <Link
              href="/admin?view=moderation"
              className={`flex items-center gap-3 px-3 py-1.5 rounded-md transition-all duration-200 group font-medium text-sm border-l-2 ${currentView === "moderation"
                ? "bg-primary/5 text-primary border-primary"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground border-transparent"
                }`}
            >
              <ShieldAlert size={18} className={currentView === "moderation" ? "text-primary-foreground" : "text-muted-foreground group-hover:text-accent-foreground transition-colors"} />
              QR Moderation
            </Link>

            <Link
              href="/admin?view=url-moderation"
              className={`flex items-center gap-3 px-3 py-1.5 rounded-md transition-all duration-200 group font-medium text-sm border-l-2 ${currentView === "url-moderation"
                ? "bg-primary/5 text-primary border-primary"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground border-transparent"
                }`}
            >
              <Link2 size={18} className={currentView === "url-moderation" ? "text-primary-foreground" : "text-muted-foreground group-hover:text-accent-foreground transition-colors"} />
              URL Moderation
            </Link>
          </div>

          {/* Management Group */}
          <div className="space-y-1">
            <p className="px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 opacity-70">Management</p>
            <Link
              href="/admin?view=users"
              className={`flex items-center gap-3 px-3 py-1.5 rounded-md transition-all duration-200 group font-medium text-sm border-l-2 ${currentView === "users"
                ? "bg-primary/5 text-primary border-primary"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground border-transparent"
                }`}
            >
              <Users size={18} className={currentView === "users" ? "text-primary-foreground" : "text-muted-foreground group-hover:text-accent-foreground transition-colors"} />
              User Management
            </Link>

            <Link
              href="/admin?view=teams"
              className={`flex items-center gap-3 px-3 py-1.5 rounded-md transition-all duration-200 group font-medium text-sm border-l-2 ${currentView === "teams"
                ? "bg-primary/5 text-primary border-primary"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground border-transparent"
                }`}
            >
              <Users size={18} className={currentView === "teams" ? "text-primary-foreground" : "text-muted-foreground group-hover:text-accent-foreground transition-colors"} />
              Team Management
            </Link>

            <Link
              href="/admin?view=domains"
              className={`flex items-center gap-3 px-3 py-1.5 rounded-md transition-all duration-200 group font-medium text-sm border-l-2 ${currentView === "domains"
                ? "bg-primary/5 text-primary border-primary"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground border-transparent"
                }`}
            >
              <Globe size={18} className={currentView === "domains" ? "text-primary-foreground" : "text-muted-foreground group-hover:text-accent-foreground transition-colors"} />
              Domain Management
            </Link>
          </div>
        </nav>

        {/* --- FOOTER SECTION --- */}
        <div className="mt-auto pt-2 space-y-4">



          <div className="flex items-center gap-3 px-2 py-1.5 mb-1 bg-muted/40 rounded-xl border border-border/50">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-bold text-xs shrink-0">
              {user.email.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate text-foreground">Administrator</p>
              <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleLogout}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-destructive hover:bg-destructive/10 border border-destructive/20 hover:border-destructive/30 transition-all font-medium text-sm"
            >
              <LogOut size={16} />
              Sign Out
            </button>
            <ThemeToggle />
          </div>
        </div>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
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