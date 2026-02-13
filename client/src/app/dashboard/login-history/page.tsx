"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

type LoginSessionRow = {
  id: number;
  login_time: string;
  logout_time: string | null;
  session_duration_seconds: number | null;
  ip_address: string | null;
  country: string | null;
  device_type: string | null;
  os: string | null;
  browser: string | null;
};

type AuthUser = { id?: number; email: string; role: string; name?: string };

function formatDuration(seconds: number | null) {
  if (seconds == null || Number.isNaN(seconds)) return "—";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  if (mins <= 0) return `${secs}s`;
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  if (hours <= 0) return `${mins}m ${secs}s`;
  return `${hours}h ${remMins}m`;
}

function formatDateTime(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function LoginHistoryPage() {
  const router = useRouter();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [rows, setRows] = useState<LoginSessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/login");
      return;
    }
    try {
      setUser(JSON.parse(storedUser));
    } catch {
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    const run = async () => {
      if (!user?.id) return;
      setLoading(true);
      setError(null);
      try {
        const res = await apiFetch(`/get_login_history.php?limit=50`, { method: "GET" });
        const data = await res.json();
        if (!data.success) {
          setError(data.error || "Failed to load login history.");
          setRows([]);
        } else {
          setRows((data.data || []) as LoginSessionRow[]);
        }
      } catch {
        setError("Unable to connect to server.");
        setRows([]);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [user?.id]);

  const title = useMemo(() => {
    const name = user?.name || user?.email || "";
    return name ? `Login History for ${name}` : "Login History";
  }, [user?.name, user?.email]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
        <p className="text-slate-600 mt-1">
          Recent sign-ins, devices, and session durations.
        </p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="text-left font-semibold px-4 py-3">Login</th>
                <th className="text-left font-semibold px-4 py-3">Logout</th>
                <th className="text-left font-semibold px-4 py-3">Duration</th>
                <th className="text-left font-semibold px-4 py-3">IP</th>
                <th className="text-left font-semibold px-4 py-3">Country</th>
                <th className="text-left font-semibold px-4 py-3">Device</th>
                <th className="text-left font-semibold px-4 py-3">OS</th>
                <th className="text-left font-semibold px-4 py-3">Browser</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td className="px-4 py-6 text-slate-500" colSpan={8}>
                    Loading...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-slate-500" colSpan={8}>
                    No login sessions recorded yet.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-4 py-3 text-slate-900">
                      {formatDateTime(row.login_time)}
                    </td>
                    <td className="px-4 py-3 text-slate-900">
                      {row.logout_time ? (
                        formatDateTime(row.logout_time)
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-900">
                      {row.logout_time
                        ? formatDuration(row.session_duration_seconds)
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{row.ip_address || "—"}</td>
                    <td className="px-4 py-3 text-slate-700">{row.country || "—"}</td>
                    <td className="px-4 py-3 text-slate-700">{row.device_type || "—"}</td>
                    <td className="px-4 py-3 text-slate-700">{row.os || "—"}</td>
                    <td className="px-4 py-3 text-slate-700">{row.browser || "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
