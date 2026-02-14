"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BarChart2, Clock, Edit, ExternalLink, QrCode, Trash2 } from "lucide-react";
import { apiFetch, API_BASE } from "@/lib/api";

type DashboardQr = {
  id: number;
  short_code: string;
  destination_url: string;
  total_scans?: number | string;
  status?: string;
  created_at?: string;
  title?: string;
  is_flagged?: number | boolean;
  approval_request_status?: "none" | "requested" | "approved" | "denied";
};

export default function QrsPage() {
  const [qrs, setQrs] = useState<DashboardQr[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "paused" | "banned">("all");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    const run = async () => {
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      if (!storedUser.id) {
        setLoading(false);
        return;
      }

      try {
        const res = await apiFetch(`/get_dashboard_data.php?user_id=${storedUser.id}`);
        const data = await res.json();
        if (data.success) {
          setQrs(data.data || []);
        }
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  const filteredQrs = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = qrs;

    if (statusFilter !== "all") {
      list = list.filter((qr) => String(qr.status || "").toLowerCase() === statusFilter);
    }

    if (!q) return list;
    return list.filter((qr) => {
      const hay = `${qr.title || ""} ${qr.short_code || ""} ${qr.destination_url || ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [qrs, query, statusFilter]);

  const pageCount = useMemo(() => Math.max(1, Math.ceil(filteredQrs.length / pageSize)), [filteredQrs.length]);
  const safePage = Math.min(page, pageCount);
  const pagedQrs = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredQrs.slice(start, start + pageSize);
  }, [filteredQrs, safePage]);

  const rangeLabel = useMemo(() => {
    if (filteredQrs.length === 0) return "0";
    const start = (safePage - 1) * pageSize + 1;
    const end = Math.min(filteredQrs.length, safePage * pageSize);
    return `${start}-${end} of ${filteredQrs.length}`;
  }, [filteredQrs.length, safePage]);

  useEffect(() => {
    setPage(1);
  }, [query, statusFilter]);

  const onDeleteQr = async (id: number) => {
    if (!confirm("Delete this QR code? This action cannot be undone.")) return;
    try {
      const res = await apiFetch("/delete_qr.php", {
        method: "POST",
        body: JSON.stringify({ qr_id: id }),
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.error || "Failed to delete QR code.");
        return;
      }
      setQrs((prev) => prev.filter((qr) => qr.id !== id));
    } catch {
      alert("Server error while deleting QR.");
    }
  };

  const handleRequestApproval = async (id: number) => {
    const note = prompt("Please explain why this should be unbanned:");
    if (note === null) return;

    try {
      const res = await apiFetch("/request_qr_approval.php", {
        method: "POST",
        body: JSON.stringify({ qr_id: id, note }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Request submitted successfully!");
        // Refresh data
        window.location.reload();
      } else {
        alert("Error: " + (data.error || "Failed"));
      }
    } catch (e) {
      alert("Network error");
    }
  };

  const stats = useMemo(() => {
    const total = qrs.length;
    const active = qrs.filter(q => String(q.status).toLowerCase() === 'active').length;
    const scans = qrs.reduce((acc, curr) => acc + Number(curr.total_scans || 0), 0);
    return { total, active, scans };
  }, [qrs]);

  if (loading) return <div className="text-sm text-muted-foreground animate-pulse p-8">Loading QRs...</div>;

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border/40 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">QR Generator</h1>
          <p className="text-muted-foreground mt-1 text-sm">Design, track, and manage your QR codes.</p>
        </div>
        <Link
          href="/dashboard/create"
          className="h-9 px-4 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 inline-flex items-center gap-2 text-sm shadow-sm transition-all hover:shadow-md"
        >
          <QrCode size={16} /> Design QR Code
        </Link>
      </div>

      {/* --- DASHBOARD STATS --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card p-5 rounded-xl border border-border/60 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Total QRs</span>
            <QrCode size={16} className="text-muted-foreground" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-foreground">{stats.total}</span>
            <span className="text-xs text-muted-foreground">lifetime</span>
          </div>
        </div>

        <div className="bg-card p-5 rounded-xl border border-border/60 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Active QRs</span>
              <span className="flex h-2 w-2 rounded-full sky-500 bg-emerald-500"></span>
            </div>
            <Clock size={16} className="text-muted-foreground" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-foreground">{stats.active}</span>
            <span className="text-xs text-muted-foreground">active campaigns</span>
          </div>
          <div className="w-full bg-muted/50 rounded-full h-1 mt-3 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${stats.total > 0 ? (stats.active / stats.total) * 100 : 0}%` }}></div>
          </div>
        </div>

        <div className="bg-card p-5 rounded-xl border border-border/60 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Total Scans</span>
            <BarChart2 size={16} className="text-muted-foreground" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-foreground">{stats.scans.toLocaleString()}</span>
            <span className="text-xs text-muted-foreground">engagements</span>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border/60 rounded-xl shadow-sm">
        <div className="p-5 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-base font-semibold text-foreground">All QR Codes</h2>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search QRs..."
                className="h-8 w-full sm:w-[200px] text-xs bg-muted/50 border border-border rounded-md px-3 outline-none focus:border-primary transition text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "paused" | "banned")}
              className="h-8 text-xs bg-muted/50 border border-border rounded-md px-2 outline-none focus:border-primary text-foreground cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="banned">Banned</option>
            </select>
          </div>
        </div>

        {filteredQrs.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3 text-muted-foreground">
              <QrCode size={24} />
            </div>
            <h3 className="text-sm font-medium text-foreground">No QRs found</h3>
            <p className="text-xs text-muted-foreground mt-1 mb-4">
              Try adjusting your filters or create a new QR code to get started.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-muted/20 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <th className="px-5 py-3 font-medium">QR Code</th>
                  <th className="px-5 py-3 font-medium">Destination</th>
                  <th className="px-5 py-3 font-medium text-right">Scans</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {pagedQrs.map((qr) => (
                  <tr key={qr.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-5 py-3.5">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-purple-500/10 text-purple-600 rounded-md shrink-0">
                          <QrCode size={18} />
                        </div>
                        <div className="min-w-0 max-w-[200px]">
                          <p className="font-medium text-foreground truncate" title={qr.title}>{qr.title || `QR /${qr.short_code}`}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className={
                              "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase " +
                              (qr.status === "active"
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : qr.status === "paused"
                                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                  : "bg-destructive/10 text-destructive")
                            }>
                              {qr.status || "active"}
                            </span>

                            {(qr.status === 'banned' || qr.status === 'paused') && (!qr.approval_request_status || qr.approval_request_status === 'none') ? (
                              <button
                                onClick={() => handleRequestApproval(qr.id)}
                                className="text-[10px] text-primary hover:underline"
                              >
                                Request Review
                              </button>
                            ) : null}

                            {(qr.approval_request_status === 'requested') ? (
                              <span className="text-[10px] text-amber-600">Pending Review</span>
                            ) : null}

                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Clock size={10} /> {qr.created_at ? new Date(qr.created_at).toLocaleDateString() : "—"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <a
                        href={qr.destination_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-muted-foreground hover:text-foreground hover:underline truncate block max-w-[200px] text-xs mb-1"
                        title={qr.destination_url}
                      >
                        {qr.destination_url}
                      </a>
                      <a
                        href={`${API_BASE}/redirect.php?c=${qr.short_code}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline inline-flex items-center gap-1 text-sm font-medium"
                      >
                        /{qr.short_code} <ExternalLink size={10} className="opacity-50" />
                      </a>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="font-semibold text-foreground">{Number(qr.total_scans || 0)}</span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/dashboard/analytics/${qr.id}`}
                          className="p-1.5 h-7 w-7 inline-flex items-center justify-center rounded border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          title="Analytics"
                        >
                          <BarChart2 size={14} />
                        </Link>
                        <Link
                          href={`/dashboard/edit/${qr.id}`}
                          className="p-1.5 h-7 w-7 inline-flex items-center justify-center rounded border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          title="Edit"
                        >
                          <Edit size={14} />
                        </Link>
                        <button
                          type="button"
                          onClick={() => onDeleteQr(qr.id)}
                          className="p-1.5 h-7 w-7 inline-flex items-center justify-center rounded border border-destructive/20 text-destructive hover:bg-destructive/10 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filteredQrs.length > 0 ? (
          <div className="px-5 py-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground bg-muted/20">
            <div>
              Showing {rangeLabel}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className="px-2 py-1 rounded border border-border bg-card hover:bg-muted disabled:opacity-50 transition-colors"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                disabled={safePage >= pageCount}
                className="px-2 py-1 rounded border border-border bg-card hover:bg-muted disabled:opacity-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
