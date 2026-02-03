"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Users,
  ShieldAlert,
  Settings,
  LogOut,
  ArrowLeft,
  BarChart3,
  Crown,
  History,
  ScrollText,
} from "lucide-react";

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
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group font-medium ${
        active
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

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  let currentView = searchParams.get("view");

  // Keep the Users tab active while drilling into a specific user's QR list.
  if (currentView === "user-qrs") {
    currentView = "users";
  }
  if (!currentView) {
    if (pathname.includes("/super-admin/analytics/")) {
      currentView = "moderation";
    } else {
      currentView = "analytics";
    }
  }

  useEffect(() => {
    // IMPORTANT: do not read localStorage during render (prevents hydration mismatch)
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

    if (user.role !== "super_admin") {
      router.push("/dashboard");
      return;
    }

  }, [router, user, authChecked]);

  const handleLogout = async () => {
    try {
      const storedUser = localStorage.getItem("user");
      const storedSessionId = localStorage.getItem("session_id");
      const parsedUser = storedUser ? (JSON.parse(storedUser) as AuthUser) : null;

      if (parsedUser?.id && storedSessionId) {
        await fetch("http://localhost:8000/logout.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: parsedUser.id,
            session_id: Number(storedSessionId),
          }),
        });
      }
    } catch {
      // Best-effort only
    } finally {
      localStorage.removeItem("session_id");
      localStorage.removeItem("user");
      router.push("/login");
    }
  };

  // Render nothing until we've checked localStorage on the client.
  // This keeps server HTML and first client render in sync (no hydration mismatch).
  if (!authChecked) return null;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-white flex font-sans text-slate-900 selection:bg-indigo-500 selection:text-white relative">
      {/* --- SIDEBAR --- */}
      <aside className="w-72 bg-slate-900 text-slate-300 h-screen sticky top-0 flex flex-col z-50 shadow-2xl shrink-0">
        {/* Brand */}
        <div className="p-8 flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/30 text-white font-bold text-lg">
            <Crown size={18} />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight text-white block leading-none">
              Super Admin
            </span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Full Control
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2 mt-2">
          <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
            Platform
          </p>

          <NavItem
            href="/super-admin?view=analytics"
            active={currentView === "analytics"}
            icon={BarChart3}
            label="Global Analytics"
          />
          <NavItem
            href="/super-admin?view=users"
            active={currentView === "users"}
            icon={Users}
            label="User Management"
          />
          <NavItem
            href="/super-admin?view=moderation"
            active={currentView === "moderation"}
            icon={ShieldAlert}
            label="QR Moderation"
          />
          <NavItem
            href="/super-admin?view=system"
            active={currentView === "system"}
            icon={Settings}
            label="System Controls"
          />

          <NavItem
            href="/super-admin?view=logins"
            active={currentView === "logins"}
            icon={History}
            label="Login History"
          />

          <NavItem
            href="/super-admin?view=audit"
            active={currentView === "audit"}
            icon={ScrollText}
            label="Audit Logs"
          />
        </nav>

        {/* --- FOOTER SECTION --- */}
        <div className="mt-auto p-5 border-t border-white/5 bg-slate-900/50">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 mb-6 group font-medium text-slate-400 hover:bg-white/5 hover:text-white"
          >
            <ArrowLeft
              size={20}
              className="text-slate-500 group-hover:text-white transition-colors"
            />
            Return to App
          </Link>

          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/5 mb-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold shadow-md text-sm">
              {user.email.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-white truncate">Super Admin</p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm font-bold text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 overflow-y-auto relative z-10 bg-slate-50">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        </div>

        <div className="max-w-7xl mx-auto p-8 md:p-12 relative z-10">{children}</div>
      </main>
    </div>
  );
}
