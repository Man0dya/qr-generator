"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { 
  LayoutDashboard, PlusCircle, LogOut,
  ShieldCheck, UserCog, History
} from "lucide-react";

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
      const storedUser = localStorage.getItem("user");
      const storedSessionId = localStorage.getItem("session_id");
      const parsedUser = storedUser ? JSON.parse(storedUser) : null;

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

  if (!user) return null;

  // Determine Display Name
  const displayName = user.name || "User";
  const displayEmail = user.email;
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-white flex font-sans text-slate-900 selection:bg-indigo-500 selection:text-white relative">
      
      {/* --- GRID BACKGROUND --- */}
      <div className="fixed inset-0 z-0 pointer-events-none left-72">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      </div>

      {/* --- SIDEBAR  --- */}
      <aside className="w-72 bg-slate-800 text-slate-300 h-screen sticky top-0 flex flex-col z-20 shadow-2xl">
        
        {/* Brand */}
        <div className="p-8 flex items-center gap-3 shrink-0">
          <img src="/logo.svg" alt="QR Generator" className="w-8 h-8 object-contain filter invert" />
          <span className="font-bold text-xl tracking-tight text-white">QR Generator</span>
        </div>
        
        {/* Navigation */}
        <nav className="p-4 space-y-2 mt-2">
          <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Main Menu</p>
          
          <Link 
            href="/dashboard" 
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group font-medium ${
              pathname === '/dashboard' 
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/20" 
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <LayoutDashboard size={20} className={pathname === '/dashboard' ? "text-white" : "text-slate-400 group-hover:text-white transition-colors"} />
            My QR Codes
          </Link>

          <Link 
            href="/dashboard/create" 
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group font-medium ${
              pathname === '/dashboard/create' 
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/20" 
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <PlusCircle size={20} className={pathname === '/dashboard/create' ? "text-white" : "text-slate-400 group-hover:text-white transition-colors"} />
            Create New
          </Link>

          <Link 
            href="/dashboard/login-history" 
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group font-medium ${
              pathname === '/dashboard/login-history' 
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/20" 
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <History size={20} className={pathname === '/dashboard/login-history' ? "text-white" : "text-slate-400 group-hover:text-white transition-colors"} />
            Login History
          </Link>

          {(user.role === 'admin' || user.role === 'super_admin') && (
            <Link 
              href={user.role === 'super_admin' ? "/super-admin" : "/admin"}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-white/5 hover:text-white transition-all duration-200 group font-medium"
            >
              <ShieldCheck size={20} className="text-slate-400 group-hover:text-white transition-colors" />
              {user.role === 'super_admin' ? 'Super Admin' : 'Admin Console'}
            </Link>
          )}
        </nav>

        {/* --- FOOTER SECTION --- */}
        <div className="mt-auto p-5 border-t border-white/5 bg-slate-900/20">
           
           {/* Settings Link */}
           <Link 
                href="/dashboard/settings" 
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 mb-6 group font-medium ${
                  pathname === '/dashboard/settings'
                    ? "bg-white/10 text-white" 
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <UserCog size={20} className={pathname === '/dashboard/settings' ? "text-white" : "text-slate-400 group-hover:text-white transition-colors"} />
                Settings
           </Link>

           {/* User Profile Card */}
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/5 mb-3 group hover:border-white/10 transition">
            <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold shadow-md text-sm">
              {initial}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-white truncate group-hover:text-indigo-200 transition">{displayName}</p>
              <p className="text-xs text-slate-400 truncate group-hover:text-slate-300 transition">{displayEmail}</p>
            </div>
          </div>
          
          <button 
            onClick={handleLogout} 
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm font-bold text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 overflow-y-auto p-8 md:p-12 relative z-10 bg-white/50">
        <div className="max-w-6xl mx-auto">
           {children}
        </div>
      </main>
    </div>
  );
}