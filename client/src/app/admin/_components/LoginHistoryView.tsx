"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";

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
  const [tab, setTab] = useState<"all" | "active" | "ended">("all");
  const [sort, setSort] = useState<
    "login_desc" | "login_asc" | "email_asc" | "email_desc" | "duration_desc"
  >("login_desc");
  const [pageSize, setPageSize] = useState<10 | 25 | 50>(10);
  const [page, setPage] = useState<number>(1);
  const [rows, setRows] = useState<LoginSessionAdminRow[]>([]);
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

        const res = await apiFetch(`/admin_get_login_history.php?${queryParams.toString()}`);
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

  const filtered = useMemo(() => {
    if (tab === "active") return rows.filter((r) => r.logout_time == null);
    if (tab === "ended") return rows.filter((r) => r.logout_time != null);
    return rows;
  }, [rows, tab]);

  const sorted = useMemo(() => {
    const copy = filtered.slice();
    copy.sort((a, b) => {
      const aLogin = new Date(a.login_time).getTime();
      const bLogin = new Date(b.login_time).getTime();
      switch (sort) {
        case "login_asc":
          return aLogin - bLogin;
        case "email_asc":
          return a.email.localeCompare(b.email);
        case "email_desc":
          return b.email.localeCompare(a.email);
        case "duration_desc":
          return (b.session_duration_seconds ?? -1) - (a.session_duration_seconds ?? -1);
        case "login_desc":
        default:
          return bLogin - aLogin;
      }
    });
    return copy;
  }, [filtered, sort]);

  const pageCount = useMemo(
    () => Math.max(1, Math.ceil(sorted.length / pageSize)),
    [sorted.length, pageSize]
  );

  const safePage = useMemo(
    () => Math.min(Math.max(1, page), pageCount),
    [page, pageCount]
  );

  const paged = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [pageSize, safePage, sorted]);

  const rangeLabel = useMemo(() => {
    if (sorted.length === 0) return "0";
    const start = (safePage - 1) * pageSize + 1;
    const end = Math.min(sorted.length, safePage * pageSize);
    return `${start}-${end} of ${sorted.length}`;
  }, [pageSize, safePage, sorted.length]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground">Login Sessions</h2>
          <p className="text-sm text-muted-foreground">
            {loading ? "Loading…" : `${rows.length} sessions (${activeCount} active)`}
          </p>
        </div>

        <div className="w-full sm:w-[360px]">
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search email, IP, country…"
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
        <div className="p-4 border-b border-border bg-muted/30 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center rounded-lg border border-border bg-card p-1">
              <button
                type="button"
                onClick={() => {
                  setTab("all");
                  setPage(1);
                }}
                className={
                  "h-8 px-3 rounded-md text-xs font-bold transition " +
                  (tab === "all" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted")
                }
              >
                All
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab("active");
                  setPage(1);
                }}
                className={
                  "h-8 px-3 rounded-md text-xs font-bold transition " +
                  (tab === "active" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "text-muted-foreground hover:bg-muted")
                }
              >
                Active
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab("ended");
                  setPage(1);
                }}
                className={
                  "h-8 px-3 rounded-md text-xs font-bold transition " +
                  (tab === "ended" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted")
                }
              >
                Ended
              </button>
            </div>

            <span className="text-xs font-bold text-muted-foreground ml-1">Sort</span>
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value as typeof sort);
                setPage(1);
              }}
              className="h-9 text-sm bg-card border border-border rounded-lg px-3 outline-none focus:border-primary transition text-foreground"
            >
              <option value="login_desc">Login (newest)</option>
              <option value="login_asc">Login (oldest)</option>
              <option value="email_asc">Email (A-Z)</option>
              <option value="email_desc">Email (Z-A)</option>
              <option value="duration_desc">Duration (longest)</option>
            </select>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <span className="text-sm text-muted-foreground">
              <span className="text-muted-foreground/70">Showing</span> {rangeLabel}
            </span>

            <span className="text-xs font-bold text-muted-foreground ml-1">Show</span>
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
                  ? "bg-muted text-muted-foreground border-border cursor-not-allowed opacity-50"
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
                  ? "bg-muted text-muted-foreground border-border cursor-not-allowed opacity-50"
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
                <th className="p-4 text-xs font-bold text-muted-foreground uppercase">User</th>
                <th className="p-4 text-xs font-bold text-muted-foreground uppercase">Role</th>
                <th className="p-4 text-xs font-bold text-muted-foreground uppercase">Login</th>
                <th className="p-4 text-xs font-bold text-muted-foreground uppercase">Logout</th>
                <th className="p-4 text-xs font-bold text-muted-foreground uppercase">Duration</th>
                <th className="p-4 text-xs font-bold text-muted-foreground uppercase">IP</th>
                <th className="p-4 text-xs font-bold text-muted-foreground uppercase">Country</th>
                <th className="p-4 text-xs font-bold text-muted-foreground uppercase">Device</th>
                <th className="p-4 text-xs font-bold text-muted-foreground uppercase">OS</th>
                <th className="p-4 text-xs font-bold text-muted-foreground uppercase">Browser</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td className="p-6 text-muted-foreground" colSpan={10}>
                    Loading…
                  </td>
                </tr>
              ) : paged.length === 0 ? (
                <tr>
                  <td className="p-6 text-muted-foreground" colSpan={10}>
                    No sessions found.
                  </td>
                </tr>
              ) : (
                paged.map((r) => (
                  <tr key={r.id} className="hover:bg-muted/50 transition">
                    <td className="p-4">
                      <div className="font-semibold text-foreground truncate max-w-[240px]">
                        {r.email}
                      </div>
                      <div className="text-xs text-muted-foreground">#{r.user_id}{r.name ? ` • ${r.name}` : ""}</div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${r.role === "super_admin"
                          ? "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                          : r.role === "admin"
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                            : "bg-muted text-muted-foreground"
                          }`}
                      >
                        {r.role}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">{formatDateTime(r.login_time)}</td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {r.logout_time ? (
                        formatDateTime(r.logout_time)
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 dark:text-emerald-400">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {r.logout_time ? formatDuration(r.session_duration_seconds) : "—"}
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">{r.ip_address || "—"}</td>
                    <td className="p-4 text-sm text-muted-foreground">{r.country || "—"}</td>
                    <td className="p-4 text-sm text-muted-foreground">{r.device_type || "—"}</td>
                    <td className="p-4 text-sm text-muted-foreground">{r.os || "—"}</td>
                    <td className="p-4 text-sm text-muted-foreground">{r.browser || "—"}</td>
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
