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

  if (loading) return <div className="text-sm text-muted-foreground animate-pulse p-8">Loading QRs...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-start md:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Assets / QRs</p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">QRs</h1>
          <p className="text-muted-foreground mt-1">All QR assets and their scan details.</p>
        </div>
        <Link href="/dashboard/create" className="h-10 px-4 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 inline-flex items-center gap-2">
          <QrCode size={16} /> Create QR
        </Link>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/30 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search QRs"
              className="h-9 px-3 bg-card border border-border rounded-lg text-sm"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "paused" | "banned")}
              className="h-9 text-sm bg-card border border-border rounded-lg px-3"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="banned">Banned</option>
            </select>
          </div>
          <span className="text-xs text-muted-foreground">Showing {rangeLabel}</span>
        </div>

        {filteredQrs.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3 text-muted-foreground">
              <QrCode size={24} />
            </div>
            <h3 className="text-sm font-bold text-foreground">No QRs found</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
              Try adjusting your filters or create a new QR code to get started.
            </p>
          </div>
        ) : (
          <div className="bg-background rounded-2xl border border-border overflow-hidden">
            <div className="grid grid-cols-12 gap-3 px-4 py-3 bg-muted/40 border-b border-border text-xs font-bold uppercase tracking-wide text-muted-foreground">
              <div className="col-span-12 md:col-span-4">QR / Status</div>
              <div className="col-span-12 md:col-span-4">Target URL</div>
              <div className="col-span-12 md:col-span-2 text-right">Scans</div>
              <div className="col-span-12 md:col-span-2 text-right">Actions</div>
            </div>

            <div className="divide-y divide-border">
              {pagedQrs.map((qr) => (
                <div key={qr.id} className="grid grid-cols-12 gap-3 px-4 py-4 border-b border-border/70 last:border-b-0 items-center hover:bg-muted/30 transition-colors">
                  <div className="col-span-12 md:col-span-4 min-w-0">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-primary/10 text-primary rounded-lg shrink-0">
                        <QrCode size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-foreground truncate" title={qr.title}>{qr.title || `QR /${qr.short_code}`}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className={
                            "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase " +
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
                              className="text-[10px] font-bold text-primary underline hover:no-underline"
                            >
                              Request Approval
                            </button>
                          ) : null}

                          {(qr.approval_request_status === 'requested') ? (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 font-bold">
                              Pending Review
                            </span>
                          ) : null}

                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Clock size={10} /> {qr.created_at ? new Date(qr.created_at).toLocaleDateString() : "—"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-span-12 md:col-span-4 min-w-0">
                    <a
                      href={qr.destination_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-foreground hover:underline truncate block"
                      title={qr.destination_url}
                    >
                      {qr.destination_url}
                    </a>
                    <a
                      href={`${API_BASE}/redirect.php?c=${qr.short_code}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-primary hover:underline mt-0.5 inline-flex items-center gap-1"
                    >
                      /{qr.short_code} <ExternalLink size={10} />
                    </a>
                  </div>

                  <div className="col-span-12 md:col-span-2 text-right">
                    <span className="text-sm font-bold text-foreground">{Number(qr.total_scans || 0)}</span>
                  </div>

                  <div className="col-span-12 md:col-span-2 flex items-center justify-end gap-2">
                    <Link
                      href={`/dashboard/analytics/${qr.id}`}
                      className="p-2 h-8 w-8 inline-flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      title="Analytics"
                    >
                      <BarChart2 size={14} />
                    </Link>
                    <Link
                      href={`/dashboard/edit/${qr.id}`}
                      className="p-2 h-8 w-8 inline-flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      title="Edit"
                    >
                      <Edit size={14} />
                    </Link>
                    <button
                      type="button"
                      onClick={() => onDeleteQr(qr.id)}
                      className="p-2 h-8 w-8 inline-flex items-center justify-center rounded-lg border border-destructive/20 text-destructive hover:bg-destructive/10 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {filteredQrs.length > 0 ? (
          <div className="p-4 border-t border-border flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className="h-9 px-3 rounded-lg border border-border text-sm hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Prev
            </button>
            <span className="text-sm text-muted-foreground">Page {safePage} / {pageCount}</span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              disabled={safePage >= pageCount}
              className="h-9 px-3 rounded-lg border border-border text-sm hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
