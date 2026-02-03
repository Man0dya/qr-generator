"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RefreshCw, AlertTriangle } from "lucide-react";

// Import Components
import AnalyticsView from "./_components/AnalyticsView";
import UsersTable from "./_components/UsersTable";
import ModerationTable from "./_components/ModerationTable";
import UserQrsView from "./_components/UserQrsView";

type UserRole = "user" | "admin" | "super_admin";
type AuthUser = { id?: number; email?: string; role?: UserRole };

type AdminUserRow = {
  id: number;
  email: string;
  role: UserRole;
  created_at: string;
};

type AdminQrRow = {
  id: number;
  short_code: string;
  destination_url: string;
  status: "active" | "banned" | "paused";
  creator: string;
  is_flagged?: number | boolean;
  flag_reason?: string | null;
  flagged_at?: string | null;
};

type AdminGetStatsResponse = {
  success: boolean;
  users: AdminUserRow[];
  qrs: AdminQrRow[];
};

type AdminGlobalStatsResponse = {
  success: boolean;
  total_scans: number;
  active_links: number;
  timeline: Array<{ date: string; count: number | string }>;
  devices: Array<{ name: string; value: number | string }>;
  os: Array<{ name: string; value: number | string }>;
  top_qrs: Array<{ short_code: string; destination_url: string; scans: number | string }>;
};

export default function AdminDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentView = searchParams.get('view') || 'analytics';
  const userQrsUserId = Number(searchParams.get('user_id') || "0");

  const [data, setData] = useState<AdminGetStatsResponse | null>(null);
  const [globalStats, setGlobalStats] = useState<AdminGlobalStatsResponse | null>(null);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}") as AuthUser;
    setCurrentUser(user);

    if (user.role === "super_admin") {
      router.push("/super-admin");
      return;
    }
    if (user.role !== "admin") {
      router.push("/dashboard");
      return;
    }

    const fetchAllData = async () => {
        setLoading(true);
        setError("");
        try {
            // 1. Load Basic Data (Users, QR List)
            const basicRes = await fetch("http://localhost:8000/admin_get_stats.php");
            const basicJson: AdminGetStatsResponse = await basicRes.json();
            if (basicJson.success) setData(basicJson);
            else throw new Error("Failed to load basic admin data");

            // 2. Load Global Analytics (Only if needed)
            if (currentView === 'analytics') {
                const globalRes = await fetch("http://localhost:8000/admin_global_stats.php");
                const globalJson: AdminGlobalStatsResponse = await globalRes.json();
                if (globalJson.success) setGlobalStats(globalJson);
            }

            // Note: system settings are managed in /super-admin

        } catch (err) {
            console.error(err);
            setError("Failed to connect to server.");
        } finally {
            setLoading(false);
        }
    };

    fetchAllData();
  }, [router, currentView]);

  // Central Action Handler
  const handleAction = async (endpoint: string, payload: Record<string, unknown>) => {
    if (!confirm("Are you sure?")) return;
    await fetch(`http://localhost:8000/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    window.location.reload();
  };

  if (loading) return (
      <div className="flex items-center justify-center min-h-[60vh] text-slate-400">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw className="animate-spin text-indigo-500" size={32} />
            <p>Loading Admin Console...</p>
          </div>
      </div>
  );

  if (error) return (
      <div className="p-8 text-center bg-red-50 text-red-600 rounded-xl border border-red-100">
          <AlertTriangle className="mx-auto mb-2" size={32} />
          <p className="font-bold">{error}</p>
      </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight capitalize">
            {currentView === 'analytics' ? 'Global Platform Overview' : 
             currentView === 'users' ? 'User Management' : 
             currentView === 'moderation' ? 'QR Code Moderation' :
             currentView === 'user-qrs' ? 'User QR Codes' : 'System Controls'}
        </h1>
        <p className="text-slate-500 mt-2">
            {currentView === 'analytics' ? 'Real-time performance metrics across the entire system.' : 
             currentView === 'users' ? 'Manage registered users and permissions.' : 
             currentView === 'moderation' ? 'Review, audit, and ban suspicious links.' :
             currentView === 'user-qrs' ? 'View QR codes created by a specific user.' : 'Advanced system configuration.'}
        </p>
      </div>

      {/* Render Components Based on View */}
      {currentView === "analytics" && globalStats && data && (
        <AnalyticsView stats={globalStats} totalUsers={data.users.length || 0} />
      )}

      {currentView === "users" && data && (
        <UsersTable 
            users={data.users} 
            currentUser={currentUser} 
            onAction={(action: string, id: number, extra?: Record<string, unknown>) =>
              handleAction('super_admin_action.php', { action, target_id: id, ...(extra || {}) })
            } 
            onViewQrs={(id: number) => router.push(`/admin?view=user-qrs&user_id=${id}`)}
        />
      )}

      {currentView === "moderation" && data && (
        <ModerationTable 
            qrs={data.qrs} 
            onToggleStatus={(id: number, action: "ban" | "activate" | "approve") =>
              handleAction('admin_moderate.php', { qr_id: id, action, actor_user_id: currentUser?.id })
            } 
        />
      )}

      {currentView === "user-qrs" && userQrsUserId > 0 && (
        <UserQrsView
          userId={userQrsUserId}
          analyticsBasePath="/admin"
          onBack={() => router.push("/admin?view=users")}
        />
      )}

      {/* System controls intentionally moved to /super-admin */}
    </div>
  );
}