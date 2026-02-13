"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { BarChart2, Edit, Link2, Plus, Search, Trash2 } from "lucide-react";
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

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {assetView === "with-qr" ? "Short Links with QR" : "Short Links"}
          </h1>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Assets / {assetView === "with-qr" ? "Short Links with QR" : "Short Links"}</p>
          <p className="text-muted-foreground mt-1">
            {assetView === "with-qr"
              ? "Links that are already connected to one or more QR assets."
              : "Uniform Resource Locator Management Dashboard"}
          </p>
        </div>

        <Link
          href="/dashboard/urlmd/create"
          className="h-10 px-4 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 inline-flex items-center gap-2"
        >
          <Plus size={16} /> Create Short Link
        </Link>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/30 flex flex-col lg:flex-row lg:items-center gap-3 lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {(["all", "active", "paused", "expired", "blocked"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusTab(tab)}
                type="button"
                className={
                  "h-8 px-3 rounded-md text-xs font-bold capitalize " +
                  (statusTab === tab ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted")
                }
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-2.5 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search links"
                className="h-9 pl-8 pr-3 bg-card border border-border rounded-lg text-sm"
              />
            </div>
            <button
              type="button"
              onClick={loadLinks}
              className="h-9 px-3 text-sm border border-border rounded-lg hover:bg-muted"
            >
              Filter
            </button>
            <span className="text-xs text-muted-foreground ml-1">Showing {rangeLabel}</span>
          </div>
        </div>

        {loading ? (
          <div className="p-6 text-sm text-muted-foreground">Loading links...</div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">
            {assetView === "with-qr" ? "No short links with QR found." : "No standalone short links found."}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {pagedLinks.map((link) => (
              <div key={link.id} className="p-4 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                      <Link2 size={14} />
                      <span className="truncate">{link.title || link.short_code}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground uppercase">{link.status}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 break-all">{buildShortUrl(link.short_code, link.custom_domain)}</p>
                    <p className="text-xs text-foreground mt-1 break-all">→ {link.destination_url}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/dashboard/urlmd/${link.id}`}
                      className="h-8 px-3 text-xs rounded border border-border hover:bg-muted inline-flex items-center gap-1"
                    >
                      <BarChart2 size={14} /> Analytics
                    </Link>
                    <Link
                      href={`/dashboard/urlmd/edit/${link.id}`}
                      className="h-8 px-3 text-xs rounded border border-border hover:bg-muted inline-flex items-center gap-1"
                    >
                      <Edit size={14} /> Edit
                    </Link>

                    {(link.status === "active" || link.status === "paused") && (
                      <button
                        onClick={() => onTogglePause(link)}
                        className="h-8 px-3 text-xs rounded border border-border hover:bg-muted"
                      >
                        {link.status === "active" ? "Pause" : "Activate"}
                      </button>
                    )}

                    {(link.status === 'blocked' || link.status === 'paused') && (!link.approval_request_status || link.approval_request_status === 'none') ? (
                      <button
                        onClick={() => handleRequestApproval(link.id)}
                        className="h-8 px-3 text-xs rounded border border-primary/30 text-primary hover:bg-primary/10 font-medium"
                      >
                        Request Approval
                      </button>
                    ) : null}

                    {(link.approval_request_status === 'requested') ? (
                      <span className="h-8 px-3 text-xs rounded border border-amber-200 bg-amber-50 text-amber-700 flex items-center font-bold">
                        Review Pending
                      </span>
                    ) : null}

                    <button
                      onClick={() => onDelete(link.id)}
                      className="h-8 w-8 rounded border border-destructive/30 text-destructive hover:bg-destructive/10 inline-flex items-center justify-center"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground flex gap-4">
                  <span>Clicks: {Number(link.total_clicks || 0)}</span>
                  <span>Unique: {Number(link.unique_visitors || 0)}</span>
                  <span>Updated: {new Date(link.updated_at || link.created_at).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {filtered.length > 0 ? (
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
