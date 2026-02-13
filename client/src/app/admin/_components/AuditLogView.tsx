"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";

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

const actionColor = (action: string) => {
  const a = action.toUpperCase();
  if (a.includes("DELETE") || a.includes("BAN") || a.includes("REMOVE")) return "text-destructive bg-destructive/10";
  if (a.includes("UPDATE") || a.includes("EDIT") || a.includes("MODIFY")) return "text-amber-600 bg-amber-500/10 dark:text-amber-400";
  if (a.includes("CREATE") || a.includes("ADD") || a.includes("NEW")) return "text-emerald-600 bg-emerald-500/10 dark:text-emerald-400";
  return "text-muted-foreground bg-muted";
};

export default function AuditLogView() {
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<AuditLogRow[]>([]);
  const [pageSize, setPageSize] = useState<10 | 25 | 50>(10);
  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const queryParams = new URLSearchParams();
        queryParams.set("limit", "500");
        if (query.trim()) queryParams.set("q", query.trim());

        const res = await apiFetch(`/super_admin_audit_logs.php?${queryParams.toString()}`);
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

  const pageCount = useMemo(
    () => Math.max(1, Math.ceil(rows.length / pageSize)),
    [rows.length, pageSize]
  );

  const safePage = useMemo(
    () => Math.min(Math.max(1, page), pageCount),
    [page, pageCount]
  );

  const paged = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [pageSize, safePage, rows]);

  const rangeLabel = useMemo(() => {
    if (rows.length === 0) return "0";
    const start = (safePage - 1) * pageSize + 1;
    const end = Math.min(rows.length, safePage * pageSize);
    return `${start}-${end} of ${rows.length}`;
  }, [pageSize, rows.length, safePage]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground">Audit Logs</h2>
          <p className="text-sm text-muted-foreground">Actions performed by admins/super admins.</p>
        </div>
        <div className="w-full sm:w-[420px]">
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search actor, action, target…"
            className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary text-sm text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-sm text-muted-foreground">
            <span className="text-muted-foreground">Showing</span> {rangeLabel}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <span className="text-xs font-bold text-muted-foreground">Show</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value) as 10 | 25 | 50);
                setPage(1);
              }}
              className="h-9 text-sm bg-card border border-border rounded-lg px-3 outline-none focus:border-primary transition text-foreground"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>

            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className={
                "h-9 px-3 rounded-lg border text-xs font-bold transition " +
                (safePage <= 1
                  ? "bg-muted text-muted-foreground border-border cursor-not-allowed"
                  : "bg-card text-foreground border-border hover:bg-muted")
              }
            >
              Prev
            </button>
            <span className="text-xs font-bold text-muted-foreground">
              Page {safePage} / {pageCount}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              disabled={safePage >= pageCount}
              className={
                "h-9 px-3 rounded-lg border text-xs font-bold transition " +
                (safePage >= pageCount
                  ? "bg-muted text-muted-foreground border-border cursor-not-allowed"
                  : "bg-card text-foreground border-border hover:bg-muted")
              }
            >
              Next
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="p-4 text-xs font-bold text-muted-foreground uppercase">Time</th>
                <th className="p-4 text-xs font-bold text-muted-foreground uppercase">Actor</th>
                <th className="p-4 text-xs font-bold text-muted-foreground uppercase">Action</th>
                <th className="p-4 text-xs font-bold text-muted-foreground uppercase">Target</th>
                <th className="p-4 text-xs font-bold text-muted-foreground uppercase">IP</th>
                <th className="p-4 text-xs font-bold text-muted-foreground uppercase">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td className="p-6 text-muted-foreground" colSpan={6}>
                    Loading…
                  </td>
                </tr>
              ) : paged.length === 0 ? (
                <tr>
                  <td className="p-6 text-muted-foreground" colSpan={6}>
                    No logs found.
                  </td>
                </tr>
              ) : (
                paged.map((r) => (
                  <tr key={r.id} className="hover:bg-muted/50 transition">
                    <td className="p-4 text-sm text-muted-foreground whitespace-nowrap">
                      {formatDateTime(r.created_at)}
                    </td>
                    <td className="p-4 text-sm text-foreground">
                      {r.actor_email || (r.actor_user_id ? `User #${r.actor_user_id}` : "—")}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-md text-xs font-bold ${actionColor(r.action)}`}>
                        {r.action}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-foreground">
                      {r.target_type ? `${r.target_type}${r.target_id != null ? ` #${r.target_id}` : ""}` : "—"}
                    </td>
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
