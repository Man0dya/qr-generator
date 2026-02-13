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

  if (loading) return <div className="text-sm text-muted-foreground">Loading QRs...</div>;

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
          <div className="p-8 text-sm text-muted-foreground">No QRs found.</div>
        ) : (
          <div className="divide-y divide-border">
            {pagedQrs.map((qr) => (
              <div key={qr.id} className="p-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                    <QrCode size={14} />
                    <span className="truncate">{qr.title || `QR /${qr.short_code}`}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground uppercase">{qr.status || "active"}</span>
                  </div>
                  <a href={`${API_BASE}/redirect.php?c=${qr.short_code}`} target="_blank" rel="noreferrer" className="text-xs text-muted-foreground mt-1 break-all inline-flex items-center gap-1">
                    {`${API_BASE}/redirect.php?c=${qr.short_code}`} <ExternalLink size={11} />
                  </a>
                  <p className="text-xs text-foreground mt-1 break-all">→ {qr.destination_url}</p>
                  <p className="text-xs text-muted-foreground mt-1 inline-flex items-center gap-1"><Clock size={11} /> {qr.created_at ? new Date(qr.created_at).toLocaleDateString() : "—"}</p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground">{Number(qr.total_scans || 0)}</p>
                    <p className="text-[11px] text-muted-foreground">Scans</p>
                  </div>
                  <Link href={`/dashboard/analytics/${qr.id}`} className="h-8 px-3 text-xs rounded border border-border hover:bg-muted inline-flex items-center gap-1">
                    <BarChart2 size={14} /> Analytics
                  </Link>
                  <Link href={`/dashboard/edit/${qr.id}`} className="h-8 px-3 text-xs rounded border border-border hover:bg-muted inline-flex items-center gap-1">
                    <Edit size={14} /> Edit
                  </Link>
                  <button
                    type="button"
                    onClick={() => onDeleteQr(qr.id)}
                    className="h-8 w-8 rounded border border-destructive/30 text-destructive hover:bg-destructive/10 inline-flex items-center justify-center"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
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
