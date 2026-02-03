"use client";

import { useEffect, useMemo, useState } from "react";

type UserRole = "user" | "admin" | "super_admin";

type LoginSessionAdminRow = {
  id: number;
  user_id: number;
  email: string;
  role: UserRole;
  name: string | null;
  login_time: string;
  logout_time: string | null;
  session_duration_seconds: number | null;
  ip_address: string | null;
  country: string | null;
  device_type: string | null;
  os: string | null;
  browser: string | null;
  user_agent: string | null;
};

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

export default function LoginHistoryView() {
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<LoginSessionAdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const url = new URL("http://localhost:8000/admin_get_login_history.php");
        url.searchParams.set("limit", "100");
        if (query.trim()) url.searchParams.set("q", query.trim());

        const res = await fetch(url.toString());
        const data = await res.json();
        if (!data.success) {
          setError(data.error || "Failed to load login sessions.");
          setRows([]);
        } else {
          setRows((data.data || []) as LoginSessionAdminRow[]);
        }
      } catch {
        setError("Unable to connect to server.");
        setRows([]);
      } finally {
        setLoading(false);
      }
    };

    // Debounce a bit
    const t = setTimeout(run, 250);
    return () => clearTimeout(t);
  }, [query]);

  const activeCount = useMemo(
    () => rows.filter((r) => r.logout_time == null).length,
    [rows]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Login Sessions</h2>
          <p className="text-sm text-slate-500">
            {loading ? "Loading…" : `${rows.length} sessions (${activeCount} active)`}
          </p>
        </div>

        <div className="w-full sm:w-[360px]">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search email, IP, country…"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 text-sm"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase">User</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase">Role</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase">Login</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase">Logout</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase">Duration</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase">IP</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase">Country</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase">Device</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase">OS</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase">Browser</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td className="p-6 text-slate-500" colSpan={10}>
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td className="p-6 text-slate-500" colSpan={10}>
                    No sessions found.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-4">
                      <div className="font-semibold text-slate-900 truncate max-w-[240px]">
                        {r.email}
                      </div>
                      <div className="text-xs text-slate-500">#{r.user_id}{r.name ? ` • ${r.name}` : ""}</div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          r.role === "super_admin"
                            ? "bg-purple-100 text-purple-700"
                            : r.role === "admin"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {r.role}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-slate-700">{formatDateTime(r.login_time)}</td>
                    <td className="p-4 text-sm text-slate-700">
                      {r.logout_time ? (
                        formatDateTime(r.logout_time)
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-sm text-slate-700">
                      {r.logout_time ? formatDuration(r.session_duration_seconds) : "—"}
                    </td>
                    <td className="p-4 text-sm text-slate-700">{r.ip_address || "—"}</td>
                    <td className="p-4 text-sm text-slate-700">{r.country || "—"}</td>
                    <td className="p-4 text-sm text-slate-700">{r.device_type || "—"}</td>
                    <td className="p-4 text-sm text-slate-700">{r.os || "—"}</td>
                    <td className="p-4 text-sm text-slate-700">{r.browser || "—"}</td>
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
