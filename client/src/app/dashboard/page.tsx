"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  BarChart2,
  Clock,
  Edit,
  ExternalLink,
  Link2,
  Plus,
  QrCode,
  Trash2,
} from "lucide-react";
import { apiFetch, API_BASE } from "@/lib/api";
import { type UrlLink, urlmdDeleteLink } from "@/lib/urlmd";

type DashboardQr = {
  id: number;
  short_code: string;
  destination_url: string;
  total_scans?: number | string;
  status?: string;
  created_at?: string;
  title?: string;
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
};

export default function DashboardPage() {
  const [qrs, setQrs] = useState<DashboardQr[]>([]);
  const [urlLinks, setUrlLinks] = useState<UrlLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

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

  const handleDeleteAsset = async (item: ActivityItem) => {
    if (item.type === "qr") {
      if (!confirm("Delete this QR code? This action cannot be undone.")) return;
      try {
        const res = await apiFetch("/delete_qr.php", {
          method: "POST",
          body: JSON.stringify({ qr_id: item.sourceId }),
        });
        const data = await res.json();
        if (!data.success) {
          alert(data.error || "Failed to delete QR code.");
          return;
        }
        setQrs((prev) => prev.filter((qr) => qr.id !== item.sourceId));
      } catch {
        alert("Server error while deleting QR.");
      }
      return;
    }

    if (!confirm("Delete this short link? This action cannot be undone.")) return;
    try {
      const data = await urlmdDeleteLink(item.sourceId);
      if (!data.success) {
        alert(data.error || "Failed to delete short link.");
        return;
      }
      setUrlLinks((prev) => prev.filter((link) => link.id !== item.sourceId));
    } catch {
      alert("Server error while deleting short link.");
    }
  };

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
    }));

    const combined = [...qrItems, ...linkItems].sort((a, b) => b.createdAtMs - a.createdAtMs);

    if (!normalizedQuery) return combined;

    return combined.filter((item) => {
      const haystack = [item.name, item.shortUrl, item.destination, item.status, item.type].join(" ").toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [normalizedQuery, qrs, urlLinks]);

  const totalQrClicks = qrs.reduce((acc, curr) => acc + Number(curr.total_scans || 0), 0);
  const totalShortLinkClicks = urlLinks.reduce((acc, curr) => acc + Number(curr.total_clicks || 0), 0);
  const totalClicks = totalQrClicks + totalShortLinkClicks;
  const totalQrs = qrs.length;
  const activeShortLinks = urlLinks.filter((link) => link.status === "active").length;

  if (loading) {
    return <div className="p-8 text-muted-foreground animate-pulse">Loading your dashboard...</div>;
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">URLMD Overview</h1>
          <p className="text-muted-foreground mt-2">Track your short links and QR campaigns from one command center.</p>
        </div>
        <Link
          href="/dashboard/new-asset"
          className="bg-primary text-primary-foreground px-5 py-3 rounded-xl hover:bg-primary/90 transition shadow-lg shadow-primary/20 font-medium flex items-center gap-2"
        >
          <Plus size={20} /> New Asset
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
      </div>

      <div>
        <h2 className="text-xl font-bold text-card-foreground mb-6">Recent Activity</h2>

        <div className="mb-5">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, short URL, destination, or status…"
            className="h-10 w-full md:w-[460px] max-w-full text-sm bg-card border border-border rounded-lg px-3 outline-none focus:border-primary transition text-card-foreground placeholder:text-muted-foreground"
          />
        </div>

        {combinedAssets.length === 0 ? (
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
          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="grid grid-cols-12 gap-3 px-4 py-3 bg-muted/40 border-b border-border text-xs font-bold uppercase tracking-wide text-muted-foreground">
              <div className="col-span-12 md:col-span-3">Asset Name</div>
              <div className="col-span-12 md:col-span-3">Short URL</div>
              <div className="col-span-12 md:col-span-3">Destination</div>
              <div className="col-span-6 md:col-span-1">Scans/Clicks</div>
              <div className="col-span-6 md:col-span-2">Actions</div>
            </div>

            {combinedAssets.map((item) => (
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

                <div className="col-span-6 md:col-span-1">
                  <p className="text-sm font-semibold text-card-foreground">{item.clicks}</p>
                  <p className="text-[11px] text-muted-foreground">Unique: {item.uniqueClicks}</p>
                </div>

                <div className="col-span-6 md:col-span-2 flex items-center justify-end gap-2">
                  <Link
                    href={item.type === "qr" ? `/dashboard/analytics/${item.sourceId}` : `/dashboard/urlmd/${item.sourceId}`}
                    className="p-2 text-muted-foreground hover:bg-primary/10 hover:text-primary rounded-lg transition border border-transparent hover:border-primary/20"
                    title="Analytics"
                  >
                    <BarChart2 size={16} />
                  </Link>
                  <Link
                    href={item.type === "qr" ? `/dashboard/edit/${item.sourceId}` : `/dashboard/urlmd/${item.sourceId}`}
                    className="p-2 text-muted-foreground hover:bg-blue-500/10 hover:text-blue-600 rounded-lg transition border border-transparent hover:border-blue-500/20"
                    title="Edit"
                  >
                    <Edit size={16} />
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDeleteAsset(item)}
                    className="p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-lg transition border border-transparent hover:border-destructive/20"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
