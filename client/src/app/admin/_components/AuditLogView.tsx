"use client";

import { useEffect, useState } from "react";

type AuditLogRow = {
  id: number;
  actor_user_id: number | null;
  actor_email: string | null;
  action: string;
  target_type: string | null;
  target_id: number | null;
  details: string | null;
  ip_address: string | null;
  created_at: string;
};

function formatDateTime(value: string) {
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

export default function AuditLogView() {
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<AuditLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const url = new URL("http://localhost:8000/super_admin_audit_logs.php");
        url.searchParams.set("limit", "200");
        if (query.trim()) url.searchParams.set("q", query.trim());

        const res = await fetch(url.toString());
        const data = await res.json();
        if (!data.success) {
          setError(data.error || "Failed to load audit logs.");
          setRows([]);
        } else {
          setRows((data.data || []) as AuditLogRow[]);
        }
      } catch {
        setError("Unable to connect to server.");
        setRows([]);
      } finally {
        setLoading(false);
      }
    };

    const t = setTimeout(run, 250);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Audit Logs</h2>
          <p className="text-sm text-slate-500">Actions performed by admins/super admins.</p>
        </div>
        <div className="w-full sm:w-[420px]">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search actor, action, target…"
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
                <th className="p-4 text-xs font-bold text-slate-500 uppercase">Time</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase">Actor</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase">Action</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase">Target</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase">IP</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td className="p-6 text-slate-500" colSpan={6}>
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td className="p-6 text-slate-500" colSpan={6}>
                    No logs found.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-4 text-sm text-slate-700 whitespace-nowrap">
                      {formatDateTime(r.created_at)}
                    </td>
                    <td className="p-4 text-sm text-slate-900">
                      {r.actor_email || (r.actor_user_id ? `User #${r.actor_user_id}` : "—")}
                    </td>
                    <td className="p-4 text-sm font-semibold text-slate-900">{r.action}</td>
                    <td className="p-4 text-sm text-slate-700">
                      {r.target_type ? `${r.target_type}${r.target_id != null ? ` #${r.target_id}` : ""}` : "—"}
                    </td>
                    <td className="p-4 text-sm text-slate-700">{r.ip_address || "—"}</td>
                    <td className="p-4 text-xs text-slate-600 max-w-[420px] truncate" title={r.details || ""}>
                      {r.details || "—"}
                    </td>
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
