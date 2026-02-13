"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Clock,
  ExternalLink,
  Link2,
  Plus,
  QrCode,
} from "lucide-react";
import { apiFetch, API_BASE } from "@/lib/api";
import { type UrlLink } from "@/lib/urlmd";

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

type ActivityItem = {
  id: string;
  type: "link" | "qr";
  sourceId: number;
  name: string;
  shortUrl: string;
  destination: string;
  clicks: number;
  uniqueClicks: number;
  status: string;
  redirectType?: string;
  updatedAtLabel?: string;
  createdAtMs: number;
  createdAtLabel: string;
  isFlagged: boolean;
  approvalStatus: "none" | "requested" | "approved" | "denied";
};

export default function DashboardPage() {
  const [qrs, setQrs] = useState<DashboardQr[]>([]);
  const [urlLinks, setUrlLinks] = useState<UrlLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [assetTypeFilter, setAssetTypeFilter] = useState<"all" | "link" | "qr">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "paused" | "blocked" | "expired">("all");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const fetchDashboardData = async () => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    if (!storedUser.id) {
      setLoading(false);
      return;
    }

    try {
      const [qrsRes, linksRes] = await Promise.all([
        apiFetch(`/get_dashboard_data.php?user_id=${storedUser.id}`),
        apiFetch(`/urlmd_get_links.php?status=all`),
      ]);

      const [qrsData, linksData] = await Promise.all([qrsRes.json(), linksRes.json()]);

      if (qrsData.success) {
        setQrs(qrsData.data || []);
      }
      if (linksData.success) {
        setUrlLinks(linksData.data || []);
      }
    } catch (err) {
      console.error("Failed to load dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const normalizedQuery = useMemo(() => query.trim().toLowerCase(), [query]);

  const combinedAssets = useMemo<ActivityItem[]>(() => {
    const parseCreatedAt = (value: unknown) => {
      const ms = new Date(String(value ?? "")).getTime();
      return Number.isFinite(ms) ? ms : 0;
    };

    const qrItems: ActivityItem[] = (qrs || []).map((qr) => ({
      id: `qr-${qr.id}`,
      type: "qr",
      sourceId: Number(qr.id),
      name: qr.title || `QR /${qr.short_code}`,
      shortUrl: `${API_BASE}/redirect.php?c=${qr.short_code}`,
      destination: String(qr.destination_url || "—"),
      clicks: Number.parseInt(String(qr.total_scans ?? "0"), 10) || 0,
      uniqueClicks: Number.parseInt(String(qr.total_scans ?? "0"), 10) || 0,
      status: String(qr.status || "active").toLowerCase(),
      createdAtMs: parseCreatedAt(qr.created_at),
      createdAtLabel: qr.created_at ? new Date(qr.created_at).toLocaleDateString() : "—",
      isFlagged: !!qr.is_flagged,
      approvalStatus: qr.approval_request_status || "none",
    }));

    const linkItems: ActivityItem[] = (urlLinks || []).map((link) => ({
      id: `link-${link.id}`,
      type: "link",
      sourceId: Number(link.id),
      name: link.title || `Short Link /${link.short_code}`,
      shortUrl: `${API_BASE}/redirect.php?c=${link.short_code}`,
      destination: String(link.destination_url || "—"),
      clicks: Number.parseInt(String(link.total_clicks ?? "0"), 10) || 0,
      uniqueClicks: Number.parseInt(String(link.unique_visitors ?? "0"), 10) || 0,
      status: String(link.status || "active").toLowerCase(),
      redirectType: link.redirect_type,
      updatedAtLabel: link.updated_at ? new Date(link.updated_at).toLocaleDateString() : undefined,
      createdAtMs: parseCreatedAt(link.created_at),
      createdAtLabel: link.created_at ? new Date(link.created_at).toLocaleDateString() : "—",
      isFlagged: false, // Links don't have is_flagged in this type definition yet, assuming safe or update Text later
      approvalStatus: "none",
    }));

    const combined = [...qrItems, ...linkItems].sort((a, b) => b.createdAtMs - a.createdAtMs);

    if (!normalizedQuery) return combined;

    return combined.filter((item) => {
      const haystack = [item.name, item.shortUrl, item.destination, item.status, item.type].join(" ").toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [normalizedQuery, qrs, urlLinks]);

  const filteredAssets = useMemo(() => {
    let list = combinedAssets;

    if (assetTypeFilter !== "all") {
      list = list.filter((item) => item.type === assetTypeFilter);
    }

    if (statusFilter !== "all") {
      list = list.filter((item) => item.status === statusFilter);
    }

    return list;
  }, [assetTypeFilter, combinedAssets, statusFilter]);

  const pageCount = useMemo(() => Math.max(1, Math.ceil(filteredAssets.length / pageSize)), [filteredAssets.length]);
  const safePage = Math.min(page, pageCount);
  const pagedAssets = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredAssets.slice(start, start + pageSize);
  }, [filteredAssets, safePage]);

  const rangeLabel = useMemo(() => {
    if (filteredAssets.length === 0) return "0";
    const start = (safePage - 1) * pageSize + 1;
    const end = Math.min(filteredAssets.length, safePage * pageSize);
    return `${start}-${end} of ${filteredAssets.length}`;
  }, [filteredAssets.length, safePage]);

  useEffect(() => {
    setPage(1);
  }, [assetTypeFilter, query, statusFilter]);

  const totalQrClicks = qrs.reduce((acc, curr) => acc + Number(curr.total_scans || 0), 0);
  const totalShortLinkClicks = urlLinks.reduce((acc, curr) => acc + Number(curr.total_clicks || 0), 0);
  const totalClicks = totalQrClicks + totalShortLinkClicks;
  const totalQrs = qrs.length;
  const totalAssets = qrs.length + urlLinks.length;
  const activeQrs = qrs.filter((qr) => String(qr.status || "active").toLowerCase() === "active").length;
  const activeShortLinks = urlLinks.filter((link) => link.status === "active").length;
  const avgClicksPerAsset = totalAssets > 0 ? Math.round(totalClicks / totalAssets) : 0;

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
        fetchDashboardData();
      } else {
        alert("Error: " + (data.error || "Failed"));
      }
    } catch (e) {
      alert("Network error");
    }
  };

  if (loading) {
    return <div className="p-8 text-muted-foreground animate-pulse">Loading your dashboard...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-card border border-border rounded-2xl p-6 shadow-sm">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard Overview</h1>
          <p className="text-muted-foreground mt-2">Track short links and QR campaigns from one clean command center.</p>
        </div>
        <Link
          href="/dashboard/new-asset"
          className="bg-primary text-primary-foreground px-5 py-3 rounded-xl hover:bg-primary/90 transition shadow-md shadow-primary/20 font-medium flex items-center gap-2"
        >
          <Plus size={20} /> New Asset
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        <div className="bg-card p-6 rounded-2xl shadow-sm border border-border">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
              <Link2 size={24} />
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium">Active Short Links</p>
              <p className="text-2xl font-bold text-card-foreground">{activeShortLinks}</p>
            </div>
          </div>
        </div>
        <div className="bg-card p-6 rounded-2xl shadow-sm border border-border">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <QrCode size={24} />
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium">Total QR Codes</p>
              <p className="text-2xl font-bold text-card-foreground">{totalQrs}</p>
            </div>
          </div>
        </div>
        <div className="bg-card p-6 rounded-2xl shadow-sm border border-border">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
              <ArrowUpRight size={24} />
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium">Total Clicks</p>
              <p className="text-2xl font-bold text-card-foreground">{totalClicks}</p>
            </div>
          </div>
        </div>
        <div className="bg-card p-6 rounded-2xl shadow-sm border border-border">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded-xl">
              <Link2 size={24} />
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium">Total Assets</p>
              <p className="text-2xl font-bold text-card-foreground">{totalAssets}</p>
            </div>
          </div>
        </div>
        <div className="bg-card p-6 rounded-2xl shadow-sm border border-border">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
              <QrCode size={24} />
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium">Active QRs</p>
              <p className="text-2xl font-bold text-card-foreground">{activeQrs}</p>
            </div>
          </div>
        </div>
        <div className="bg-card p-6 rounded-2xl shadow-sm border border-border">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <ArrowUpRight size={24} />
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium">Avg Clicks / Asset</p>
              <p className="text-2xl font-bold text-card-foreground">{avgClicksPerAsset}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 md:p-6 shadow-sm">
        <h2 className="text-xl font-bold text-card-foreground mb-6">Recent Activity</h2>

        <div className="mb-5 flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, short URL, destination, or status…"
              className="h-10 w-full md:w-[420px] max-w-full text-sm bg-card border border-border rounded-lg px-3 outline-none focus:border-primary transition text-card-foreground placeholder:text-muted-foreground"
            />

            <select
              value={assetTypeFilter}
              onChange={(e) => setAssetTypeFilter(e.target.value as "all" | "link" | "qr")}
              className="h-10 text-sm bg-card border border-border rounded-lg px-3 outline-none focus:border-primary text-card-foreground"
            >
              <option value="all">All Types</option>
              <option value="link">Short Links</option>
              <option value="qr">QRs</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "paused" | "blocked" | "expired")}
              className="h-10 text-sm bg-card border border-border rounded-lg px-3 outline-none focus:border-primary text-card-foreground"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="blocked">Blocked</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          <div className="text-sm text-muted-foreground">Showing {rangeLabel}</div>
        </div>

        {filteredAssets.length === 0 ? (
          <div className="text-center py-24 bg-card rounded-3xl border border-dashed border-border">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 text-muted-foreground">
              <Link2 size={32} />
            </div>
            <h3 className="text-lg font-bold text-card-foreground mb-2">No links or QR codes found.</h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">No links or QR codes found. Create your first asset to get started.</p>
            <Link href="/dashboard/new-asset" className="text-primary font-medium hover:underline">
              Create your first asset &rarr;
            </Link>
          </div>
        ) : (
          <div className="bg-background rounded-2xl border border-border overflow-hidden">
            <div className="grid grid-cols-12 gap-3 px-4 py-3 bg-muted/40 border-b border-border text-xs font-bold uppercase tracking-wide text-muted-foreground">
              <div className="col-span-12 md:col-span-3">Asset Name</div>
              <div className="col-span-12 md:col-span-3">Short URL</div>
              <div className="col-span-12 md:col-span-3">Destination</div>
              <div className="col-span-12 md:col-span-3">Scans/Clicks</div>
            </div>

            {pagedAssets.map((item) => (
              <div key={item.id} className="grid grid-cols-12 gap-3 px-4 py-4 border-b border-border/70 last:border-b-0 items-center">
                <div className="col-span-12 md:col-span-3 min-w-0">
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 text-muted-foreground">
                      {item.type === "link" ? <Link2 size={16} /> : <QrCode size={16} />}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-card-foreground truncate" title={item.name}>{item.name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Clock size={12} /> {item.createdAtLabel}
                        <span className="mx-1">•</span>
                        <span className="uppercase">{item.type}</span>
                      </p>
                      <p className="text-[11px] mt-1">
                        <span className={
                          "inline-flex items-center rounded-full px-2 py-0.5 border font-semibold uppercase " +
                          (item.status === "active"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                            : item.status === "paused"
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                              : "bg-destructive/10 text-destructive border-destructive/20")
                        }>
                          {item.status}
                        </span>

                        {(item.status === 'banned' || item.status === 'paused') && item.approvalStatus === 'none' && item.type === 'qr' ? (
                          <button
                            onClick={() => handleRequestApproval(item.sourceId)}
                            className="ml-2 text-xs text-primary underline hover:no-underline"
                          >
                            Request Approval
                          </button>
                        ) : null}

                        {item.approvalStatus === 'requested' ? (
                          <span className="ml-2 text-xs text-amber-600 bg-amber-100 dark:bg-amber-900/30 px-1.5 py-0.5 rounded">
                            Review Pending
                          </span>
                        ) : null}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="col-span-12 md:col-span-3 min-w-0">
                  <a
                    href={item.shortUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-primary hover:underline inline-flex items-center gap-1 max-w-full truncate"
                    title={item.shortUrl}
                  >
                    {item.shortUrl} <ExternalLink size={12} />
                  </a>
                </div>

                <div className="col-span-12 md:col-span-3 min-w-0">
                  <a
                    href={item.destination}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-muted-foreground hover:text-foreground hover:underline max-w-full truncate block"
                    title={item.destination}
                  >
                    {item.destination}
                  </a>
                  <p className="text-[11px] text-muted-foreground mt-1 truncate" title={item.redirectType ? `Redirect: ${item.redirectType}` : ""}>
                    {item.type === "link" && item.redirectType ? `Redirect: ${item.redirectType}` : "QR Redirect"}
                    {item.updatedAtLabel ? ` • Updated: ${item.updatedAtLabel}` : ""}
                  </p>
                </div>

                <div className="col-span-12 md:col-span-3">
                  <p className="text-sm font-semibold text-card-foreground">{item.clicks}</p>
                  <p className="text-[11px] text-muted-foreground">Unique: {item.uniqueClicks}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredAssets.length > 0 ? (
          <div className="mt-4 flex items-center justify-end gap-2">
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
    </div >
  );
}
