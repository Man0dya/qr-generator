"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RefreshCw, AlertTriangle } from "lucide-react";
import { apiFetch } from "@/lib/api";

import AnalyticsView from "@/app/admin/_components/AnalyticsView";
import UsersTable from "@/app/admin/_components/UsersTable";
import ModerationTable from "@/app/admin/_components/ModerationTable";
import SystemControls from "@/app/admin/_components/SystemControls";
import LoginHistoryView from "@/app/admin/_components/LoginHistoryView";
import AuditLogView from "@/app/admin/_components/AuditLogView";
import UserQrsView from "@/app/admin/_components/UserQrsView";
import DomainsTable from "./_components/DomainsTable";
import TeamsTable from "./_components/TeamsTable";

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
  approval_request_status?: "none" | "requested" | "approved" | "denied" | string;
  approval_requested_at?: string | null;
  approval_request_note?: string | null;
  approval_resolved_at?: string | null;
  approval_resolved_by?: number | string | null;
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

type SystemSetting = { setting_key: string; setting_value: string };

export default function SuperAdminDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw className="animate-spin text-primary" size={32} />
            <p>Loading Super Admin Console...</p>
          </div>
        </div>
      }
    >
      <SuperAdminDashboard />
    </Suspense>
  );
}

function SuperAdminDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentView = searchParams.get("view") || "analytics";
  const userQrsUserId = Number(searchParams.get("user_id") || "0");

  const [data, setData] = useState<AdminGetStatsResponse | null>(null);
  const [globalStats, setGlobalStats] = useState<AdminGlobalStatsResponse | null>(null);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [maintenance, setMaintenance] = useState("false");
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}") as AuthUser;
    setCurrentUser(user);

    if (user.role !== "super_admin") {
      router.push("/dashboard");
      return;
    }

    const fetchAllData = async () => {
      setLoading(true);
      setError("");
      try {
        const basicRes = await apiFetch("/admin_get_stats.php");
        const basicJson: AdminGetStatsResponse = await basicRes.json();
        if (basicJson.success) setData(basicJson);
        else throw new Error("Failed to load basic admin data");

        if (currentView === "analytics") {
          const globalRes = await apiFetch("/admin_global_stats.php");
          const globalJson: AdminGlobalStatsResponse = await globalRes.json();
          if (globalJson.success) setGlobalStats(globalJson);
        }

        const settingsRes = await apiFetch("/system_settings.php");
        const settingsJson: SystemSetting[] = await settingsRes.json();
        setSettings(settingsJson || []);
        const mode = settingsJson.find((s) => s.setting_key === "maintenance_mode");
        if (mode) setMaintenance(mode.setting_value);
      } catch (err) {
        console.error(err);
        setError("Failed to connect to server.");
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [router, currentView]);

  const handleAction = async (endpoint: string, payload: Record<string, unknown>) => {
    if (!confirm("Are you sure?")) return;
    try {
      await apiFetch(`/${endpoint}`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      window.location.reload();
    } catch (err) {
      alert("Action failed");
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="animate-spin text-primary" size={32} />
          <p>Loading Super Admin Console...</p>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="p-8 text-center bg-red-50 text-red-600 rounded-xl border border-red-100">
        <AlertTriangle className="mx-auto mb-2" size={32} />
        <p className="font-bold">{error}</p>
      </div>
    );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground tracking-tight capitalize">
          {currentView === "analytics"
            ? "Global Platform Overview"
            : currentView === "users"
              ? "User Management"
              : currentView === "teams"
                ? "Team Workspaces"
                : currentView === "domains"
                  ? "Custom Domains"
                  : currentView === "moderation"
                    ? "QR Code Moderation"
                    : currentView === "system"
                      ? "System Controls"
                      : currentView === "audit"
                        ? "Audit Logs"
                        : currentView === "user-qrs"
                          ? "User QR Codes"
                          : "Login History"}
        </h1>
        <p className="text-muted-foreground mt-2">
          {currentView === "analytics"
            ? "Real-time performance metrics across the entire system."
            : currentView === "users"
              ? "Manage registered users and permissions."
              : currentView === "teams"
                ? "Oversee team workspaces and owner assignments."
                : currentView === "domains"
                  ? "Monitor and moderate custom domains."
                  : currentView === "moderation"
                    ? "Review, audit, and ban suspicious links."
                    : currentView === "system"
                      ? "Advanced system configuration."
                      : currentView === "audit"
                        ? "Track sensitive admin/super-admin actions system-wide."
                        : currentView === "user-qrs"
                          ? "Review QR codes created by a specific user."
                          : "View user sign-ins, devices, IPs, and session durations."}
        </p>
      </div>

      {currentView === "analytics" && globalStats && data && (
        <AnalyticsView stats={globalStats} totalUsers={data.users.length || 0} />
      )}

      {currentView === "users" && data && (
        <UsersTable
          users={data.users}
          currentUser={currentUser}
          onAction={(action: string, id: number, extra?: Record<string, unknown>) =>
            handleAction("super_admin_action.php", { action, target_id: id, ...(extra || {}) })
          }
          onViewQrs={(id: number) => router.push(`/super-admin?view=user-qrs&user_id=${id}`)}
        />
      )}

      {currentView === "teams" && <TeamsTable />}

      {currentView === "domains" && <DomainsTable />}

      {currentView === "moderation" && data && (
        <ModerationTable
          qrs={data.qrs}
          analyticsBasePath="/super-admin"
          onToggleStatus={(id: number, action: "ban" | "activate" | "approve" | "approve_request" | "deny_request") =>
            handleAction("admin_moderate.php", { qr_id: id, action })
          }
        />
      )}

      {currentView === "system" && (
        <SystemControls
          maintenance={maintenance}
          settings={settings}
          onToggleMaintenance={(newVal: string) =>
            handleAction("system_settings.php", { maintenance_mode: newVal })
          }
          onCreateUser={(userData: Record<string, unknown>) =>
            handleAction("super_admin_action.php", { action: "create_user", ...userData })
          }
          onUpdateSettings={(newSettings: Record<string, string>) =>
            handleAction("system_settings.php", { settings: newSettings })
          }
        />
      )}

      {currentView === "logins" && <LoginHistoryView />}

      {currentView === "audit" && <AuditLogView />}

      {currentView === "user-qrs" && userQrsUserId > 0 && (
        <UserQrsView
          userId={userQrsUserId}
          analyticsBasePath="/super-admin"
          onBack={() => router.push("/super-admin?view=users")}
        />
      )}
    </div>
  );
}
