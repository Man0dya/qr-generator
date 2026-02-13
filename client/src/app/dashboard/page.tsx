"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  BarChart2,
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
};

type ActivityItem = {
  id: string;
  type: "link" | "qr";
  sourceId: number;
  name: string;
  shortUrl: string;
  destination: string;
  clicks: number;
  status: string;
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

  const normalizedQuery = useMemo(() => query.trim().toLowerCase(), [query]);

  const recentActivity = useMemo<ActivityItem[]>(() => {
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
      status: String(link.status || "active").toLowerCase(),
      createdAtMs: parseCreatedAt(link.created_at),
      createdAtLabel: link.created_at ? new Date(link.created_at).toLocaleDateString() : "—",
    }));

    const combined = [...qrItems, ...linkItems].sort((a, b) => b.createdAtMs - a.createdAtMs);

    if (!normalizedQuery) return combined;

    return combined.filter((item) => {
      const haystack = [item.name, item.shortUrl, item.destination, item.status].join(" ").toLowerCase();
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

        {recentActivity.length === 0 ? (
          <div className="text-center py-24 bg-card rounded-3xl border border-dashed border-border">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 text-muted-foreground">
              <Link2 size={32} />
            </div>
            <h3 className="text-lg font-bold text-card-foreground mb-2">No activity yet</h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">Create your first short link or QR asset to start tracking engagement.</p>
            <Link href="/dashboard/new-asset" className="text-primary font-medium hover:underline">
              Create your first asset &rarr;
            </Link>
          </div>
        ) : (
          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="grid grid-cols-12 gap-3 px-4 py-3 bg-muted/40 border-b border-border text-xs font-bold uppercase tracking-wide text-muted-foreground">
              <div className="col-span-12 md:col-span-3">Name / Title</div>
              <div className="col-span-12 md:col-span-3">Short URL</div>
              <div className="col-span-12 md:col-span-3">Destination</div>
              <div className="col-span-6 md:col-span-1">Scans/Clicks</div>
              <div className="col-span-6 md:col-span-2">Status</div>
            </div>

            {recentActivity.map((item) => (
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
                </div>

                <div className="col-span-6 md:col-span-1">
                  <p className="text-sm font-semibold text-card-foreground">{item.clicks}</p>
                </div>

                <div className="col-span-6 md:col-span-2 flex items-center justify-between gap-3">
                  <span
                    className={
                      "text-[10px] uppercase font-bold px-2 py-1 rounded-full border " +
                      (item.status === "active"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                        : item.status === "paused"
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                          : "bg-destructive/10 text-destructive border-destructive/20")
                    }
                  >
                    {item.status}
                  </span>

                  <Link
                    href={item.type === "qr" ? `/dashboard/analytics/${item.sourceId}` : `/dashboard/urlmd/${item.sourceId}`}
                    className="p-2 text-muted-foreground hover:bg-primary/10 hover:text-primary rounded-lg transition border border-transparent hover:border-primary/20"
                    title={item.type === "qr" ? "QR Analytics" : "Link Details"}
                  >
                    {item.type === "qr" ? <BarChart2 size={16} /> : <ArrowUpRight size={16} />}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
