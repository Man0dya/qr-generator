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
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border/40 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1 text-sm">Overview of your links, QR codes, and performance.</p>
        </div>
        <Link
          href="/dashboard/new-asset"
          className="h-9 px-4 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 inline-flex items-center gap-2 text-sm shadow-sm transition-all hover:shadow-md"
        >
          <Plus size={16} /> Create New
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card p-5 rounded-xl border border-border/60 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Total Assets</span>
            <Link2 size={16} className="text-muted-foreground" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-foreground">{totalAssets}</span>
            <span className="text-xs text-muted-foreground">links & QRs</span>
          </div>
        </div>

        <div className="bg-card p-5 rounded-xl border border-border/60 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Total Clicks</span>
            <ArrowUpRight size={16} className="text-muted-foreground" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-foreground">{totalClicks.toLocaleString()}</span>
            <span className="text-xs text-muted-foreground">engagements</span>
          </div>
        </div>

        <div className="bg-card p-5 rounded-xl border border-border/60 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Active Links</span>
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-foreground">{activeShortLinks}</span>
            <span className="text-xs text-muted-foreground">of {urlLinks.length} total</span>
          </div>
        </div>

        <div className="bg-card p-5 rounded-xl border border-border/60 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Active QRs</span>
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-foreground">{activeQrs}</span>
            <span className="text-xs text-muted-foreground">of {totalQrs} total</span>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border/60 rounded-xl shadow-sm">
        <div className="p-5 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-base font-semibold text-foreground">Recent Activity</h2>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Computed search..."
                className="h-8 w-full sm:w-[200px] text-xs bg-muted/50 border border-border rounded-md px-3 outline-none focus:border-primary transition text-foreground placeholder:text-muted-foreground"
              />
            </div>

            <select
              value={assetTypeFilter}
              onChange={(e) => setAssetTypeFilter(e.target.value as "all" | "link" | "qr")}
              className="h-8 text-xs bg-muted/50 border border-border rounded-md px-2 outline-none focus:border-primary text-foreground cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="link">Links</option>
              <option value="qr">QR Codes</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "paused" | "blocked" | "expired")}
              className="h-8 text-xs bg-muted/50 border border-border rounded-md px-2 outline-none focus:border-primary text-foreground cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="blocked">Blocked</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>

        {filteredAssets.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3 text-muted-foreground">
              <Link2 size={24} />
            </div>
            <h3 className="text-sm font-medium text-foreground">No assets found</h3>
            <p className="text-xs text-muted-foreground mt-1 mb-4">
              Get started by creating your first short link or QR code.
            </p>
            <Link href="/dashboard/new-asset" className="text-primary text-xs font-medium hover:underline">
              Create Asset &rarr;
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-muted/20 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <th className="px-5 py-3 font-medium">Asset</th>
                  <th className="px-5 py-3 font-medium">Short Link</th>
                  <th className="px-5 py-3 font-medium">Destination</th>
                  <th className="px-5 py-3 font-medium text-right">Clicks</th>
                  <th className="px-5 py-3 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {pagedAssets.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-5 py-3.5">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-md shrink-0 ${item.type === 'qr' ? 'bg-purple-500/10 text-purple-600' : 'bg-blue-500/10 text-blue-600'}`}>
                          {item.type === "link" ? <Link2 size={16} /> : <QrCode size={16} />}
                        </div>
                        <div className="min-w-0 max-w-[200px]">
                          <p className="font-medium text-foreground truncate" title={item.name}>{item.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Clock size={10} /> {item.createdAtLabel}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <a
                        href={item.shortUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline flex items-center gap-1 truncate max-w-[180px] font-medium"
                        title={item.shortUrl}
                      >
                        {item.shortUrl.replace(API_BASE, "")} <ExternalLink size={10} className="opacity-50" />
                      </a>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="max-w-[250px] truncate text-muted-foreground text-xs" title={item.destination}>
                        {item.destination}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {item.type === "link" && item.redirectType ? `Type: ${item.redirectType}` : "Direct Redirect"}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="font-semibold text-foreground">{item.clicks}</span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex flex-col items-end gap-1">
                        <span className={
                          "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase border " +
                          (item.status === "active"
                            ? "bg-emerald-500/5 text-emerald-600 border-emerald-500/20"
                            : item.status === "paused"
                              ? "bg-amber-500/5 text-amber-600 border-amber-500/20"
                              : "bg-destructive/5 text-destructive border-destructive/20")
                        }>
                          {item.status}
                        </span>
                        {(item.status === 'banned' || item.status === 'paused') && item.approvalStatus === 'none' && item.type === 'qr' && (
                          <button
                            onClick={() => handleRequestApproval(item.sourceId)}
                            className="text-[10px] text-primary hover:underline"
                          >
                            Request Review
                          </button>
                        )}
                        {item.approvalStatus === 'requested' && (
                          <span className="text-[10px] text-amber-600">Review Pending</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filteredAssets.length > 0 && (
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
        )}
      </div>
    </div>
  );
}
