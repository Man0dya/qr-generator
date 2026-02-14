"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { BarChart2, Clock, Edit, ExternalLink, Link2, Plus, Search, Trash2, Pause, Play } from "lucide-react";
import {
  buildShortUrl,
  type UrlLink,
  urlmdDeleteLink,
  urlmdGetLinks,
  urlmdUpdateLink,
} from "@/lib/urlmd";
import { apiFetch } from "@/lib/api";

export default function UrlmdPage() {
  const searchParams = useSearchParams();
  const [links, setLinks] = useState<UrlLink[]>([]);
  const [linkedUrlIds, setLinkedUrlIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusTab, setStatusTab] = useState<"all" | "active" | "paused" | "expired" | "blocked">("all");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const assetView = searchParams.get("view") === "with-qr" ? "with-qr" : "all";

  const loadLinks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await urlmdGetLinks({ status: statusTab, q: query.trim() });
      if (data.success) {
        setLinks(data.data || []);
      }

      const qrsRes = await apiFetch(`/get_dashboard_data.php`);
      const qrsData = await qrsRes.json();
      if (qrsData?.success) {
        const ids = new Set<number>();
        for (const row of qrsData.data || []) {
          const linkId = Number(row?.url_link_id || 0);
          if (linkId > 0) ids.add(linkId);
        }
        setLinkedUrlIds(ids);
      }
    } catch {
      // no-op
    } finally {
      setLoading(false);
    }
  }, [query, statusTab]);

  useEffect(() => {
    loadLinks();
  }, [loadLinks]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = links;

    if (assetView === "with-qr") {
      list = list.filter((link) => linkedUrlIds.has(link.id));
    } else {
      list = list.filter((link) => !linkedUrlIds.has(link.id));
    }

    if (!q) return list;
    return list.filter((link) => {
      const hay = `${link.short_code} ${link.destination_url} ${link.title || ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [assetView, linkedUrlIds, links, query]);

  const pageCount = useMemo(() => Math.max(1, Math.ceil(filtered.length / pageSize)), [filtered.length]);
  const safePage = Math.min(page, pageCount);
  const pagedLinks = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage]);

  const rangeLabel = useMemo(() => {
    if (filtered.length === 0) return "0";
    const start = (safePage - 1) * pageSize + 1;
    const end = Math.min(filtered.length, safePage * pageSize);
    return `${start}-${end} of ${filtered.length}`;
  }, [filtered.length, safePage]);

  useEffect(() => {
    setPage(1);
  }, [assetView, query, statusTab]);

  const onDelete = async (id: number) => {
    if (!confirm("Delete this short link?")) return;
    const data = await urlmdDeleteLink(id);
    if (!data.success) {
      alert(data.error || "Delete failed");
      return;
    }
    await loadLinks();
  };

  const onTogglePause = async (link: UrlLink) => {
    const next = link.status === "active" ? "paused" : "active";
    const data = await urlmdUpdateLink({ id: link.id, status: next });
    if (!data.success) {
      alert(data.error || "Update failed");
      return;
    }
    await loadLinks();
    await loadLinks();
  };

  const handleRequestApproval = async (id: number) => {
    const note = prompt("Please explain why this should be unbanned/activated:");
    if (note === null) return;

    try {
      const res = await apiFetch("/request_url_approval.php", {
        method: "POST",
        body: JSON.stringify({ link_id: id, note }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Request submitted successfully!");
        loadLinks();
      } else {
        alert("Error: " + (data.error || "Failed"));
      }
    } catch (e) {
      alert("Network error");
    }
  };

  const stats = useMemo(() => {
    const total = links.length;
    const active = links.filter(l => l.status === 'active').length;
    const clicks = links.reduce((acc, curr) => acc + Number(curr.total_clicks || 0), 0);
    return { total, active, clicks };
  }, [links]);

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border/40 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {assetView === "with-qr" ? "Short Links with QR" : "Short Links"}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {assetView === "with-qr"
              ? "Links that are already connected to one or more QR assets."
              : "Track, manage, and analyze your short URLs."}
          </p>
        </div>

        <Link
          href="/dashboard/urlmd/create"
          className="h-9 px-4 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 inline-flex items-center gap-2 text-sm shadow-sm transition-all hover:shadow-md"
        >
          <Plus size={16} /> Create Short Link
        </Link>
      </div>

      {/* --- DASHBOARD STATS --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card p-5 rounded-xl border border-border/60 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Total Links</span>
            <Link2 size={16} className="text-muted-foreground" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-foreground">{stats.total}</span>
            <span className="text-xs text-muted-foreground">lifetime</span>
          </div>
        </div>

        <div className="bg-card p-5 rounded-xl border border-border/60 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Active Links</span>
              <span className="flex h-2 w-2 rounded-full sky-500 bg-emerald-500"></span>
            </div>
            <Play size={16} className="text-muted-foreground" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-foreground">{stats.active}</span>
            <span className="text-xs text-muted-foreground">active assets</span>
          </div>
          <div className="w-full bg-muted/50 rounded-full h-1 mt-3 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${stats.total > 0 ? (stats.active / stats.total) * 100 : 0}%` }}></div>
          </div>
        </div>

        <div className="bg-card p-5 rounded-xl border border-border/60 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Total Clicks</span>
            <BarChart2 size={16} className="text-muted-foreground" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-foreground">{stats.clicks.toLocaleString()}</span>
            <span className="text-xs text-muted-foreground">engagements</span>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border/60 rounded-xl shadow-sm">
        <div className="p-5 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {(["all", "active", "paused", "expired", "blocked"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusTab(tab)}
                type="button"
                className={
                  "h-7 px-3 rounded-md text-xs font-medium capitalize transition-colors " +
                  (statusTab === tab ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:bg-muted border border-transparent")
                }
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-auto">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search links..."
                className="h-8 w-full sm:w-[200px] text-xs bg-muted/50 border border-border rounded-md px-3 outline-none focus:border-primary transition text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <button
              type="button"
              onClick={loadLinks}
              className="h-8 px-3 text-xs border border-border rounded-md hover:bg-muted transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-muted-foreground animate-pulse">Loading links...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3 text-muted-foreground">
              <Link2 size={24} />
            </div>
            <h3 className="text-sm font-medium text-foreground">No links found</h3>
            <p className="text-xs text-muted-foreground mt-1 mb-4">
              {assetView === "with-qr" ? "No short links with QR found." : "Create a short link to get started."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-muted/20 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <th className="px-5 py-3 font-medium">Link Info</th>
                  <th className="px-5 py-3 font-medium">Target URL</th>
                  <th className="px-5 py-3 font-medium text-right">Clicks</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {pagedLinks.map((link) => (
                  <tr key={link.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-5 py-3.5">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-md shrink-0">
                          <Link2 size={18} />
                        </div>
                        <div className="min-w-0 max-w-[200px]">
                          <p className="font-medium text-foreground truncate" title={link.title || link.short_code}>{link.title || link.short_code}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className={
                              "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase " +
                              (link.status === "active"
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : link.status === "paused"
                                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                  : "bg-destructive/10 text-destructive")
                            }>
                              {link.status}
                            </span>

                            {(link.status === 'blocked' || link.status === 'paused') && (!link.approval_request_status || link.approval_request_status === 'none') ? (
                              <button
                                onClick={() => handleRequestApproval(link.id)}
                                className="text-[10px] text-primary hover:underline"
                              >
                                Request Review
                              </button>
                            ) : null}

                            {(link.approval_request_status === 'requested') ? (
                              <span className="text-[10px] text-amber-600">Pending Review</span>
                            ) : null}

                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Clock size={10} /> {new Date(link.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <a
                        href={link.destination_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-muted-foreground hover:text-foreground hover:underline truncate block max-w-[200px] text-xs mb-1"
                        title={link.destination_url}
                      >
                        {link.destination_url}
                      </a>
                      <a
                        href={buildShortUrl(link.short_code, link.custom_domain)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline inline-flex items-center gap-1 text-sm font-medium"
                      >
                        /{link.short_code} <ExternalLink size={10} className="opacity-50" />
                      </a>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="font-semibold text-foreground">{Number(link.total_clicks || 0)}</span>
                      <p className="text-[10px] text-muted-foreground">Unique: {Number(link.unique_visitors || 0)}</p>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/dashboard/urlmd/${link.id}`}
                          className="p-1.5 h-7 w-7 inline-flex items-center justify-center rounded border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          title="Analytics"
                        >
                          <BarChart2 size={14} />
                        </Link>
                        <Link
                          href={`/dashboard/urlmd/edit/${link.id}`}
                          className="p-1.5 h-7 w-7 inline-flex items-center justify-center rounded border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          title="Edit"
                        >
                          <Edit size={14} />
                        </Link>

                        {(link.status === "active" || link.status === "paused") && (
                          <button
                            onClick={() => onTogglePause(link)}
                            className="p-1.5 h-7 w-7 inline-flex items-center justify-center rounded border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            title={link.status === "active" ? "Pause" : "Activate"}
                          >
                            {link.status === "active" ? <Pause size={14} /> : <Play size={14} />}
                          </button>
                        )}

                        <button
                          onClick={() => onDelete(link.id)}
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

        {filtered.length > 0 ? (
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
