"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BarChart2, Link2, Plus, Search, Trash2 } from "lucide-react";
import {
  buildShortUrl,
  type UrlLink,
  urlmdCreateLink,
  urlmdDeleteLink,
  urlmdGetLinks,
  urlmdUpdateLink,
} from "@/lib/urlmd";

export default function UrlmdPage() {
  const [links, setLinks] = useState<UrlLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [statusTab, setStatusTab] = useState<"all" | "active" | "paused" | "expired" | "blocked">("all");

  const [destinationUrl, setDestinationUrl] = useState("");
  const [shortCode, setShortCode] = useState("");
  const [title, setTitle] = useState("");
  const [redirectType, setRedirectType] = useState<"301" | "302">("302");

  const loadLinks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await urlmdGetLinks({ status: statusTab, q: query.trim() });
      if (data.success) {
        setLinks(data.data || []);
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
    if (!q) return links;
    return links.filter((link) => {
      const hay = `${link.short_code} ${link.destination_url} ${link.title || ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [links, query]);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destinationUrl.trim()) return;
    setSaving(true);
    try {
      const data = await urlmdCreateLink({
        destination_url: destinationUrl.trim(),
        short_code: shortCode.trim() || undefined,
        title: title.trim() || undefined,
        redirect_type: redirectType,
      });
      if (!data.success) {
        alert(data.error || "Failed to create link");
        return;
      }
      setDestinationUrl("");
      setShortCode("");
      setTitle("");
      await loadLinks();
    } catch {
      alert("Network error");
    } finally {
      setSaving(false);
    }
  };

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
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">URLMD</h1>
          <p className="text-muted-foreground mt-1">Uniform Resource Locator Management Dashboard</p>
        </div>
      </div>

      <form onSubmit={onCreate} className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-foreground">
          <Plus size={16} /> Create short URL
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
          <input
            type="url"
            required
            value={destinationUrl}
            onChange={(e) => setDestinationUrl(e.target.value)}
            placeholder="https://destination.example.com"
            className="lg:col-span-2 h-10 px-3 bg-background border border-border rounded-lg outline-none focus:border-primary"
          />
          <input
            value={shortCode}
            onChange={(e) => setShortCode(e.target.value)}
            placeholder="custom code (optional)"
            className="h-10 px-3 bg-background border border-border rounded-lg outline-none focus:border-primary"
          />
          <select
            value={redirectType}
            onChange={(e) => setRedirectType(e.target.value as "301" | "302")}
            className="h-10 px-3 bg-background border border-border rounded-lg outline-none focus:border-primary"
          >
            <option value="302">302 (Temporary)</option>
            <option value="301">301 (Permanent)</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Optional title"
            className="flex-1 h-10 px-3 bg-background border border-border rounded-lg outline-none focus:border-primary"
          />
          <button
            disabled={saving}
            className="h-10 px-4 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-70"
          >
            {saving ? "Creating..." : "Create"}
          </button>
        </div>
      </form>

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
          </div>
        </div>

        {loading ? (
          <div className="p-6 text-sm text-muted-foreground">Loading links...</div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">No links found.</div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((link) => (
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
                    <button
                      onClick={() => onTogglePause(link)}
                      className="h-8 px-3 text-xs rounded border border-border hover:bg-muted"
                    >
                      {link.status === "active" ? "Pause" : "Activate"}
                    </button>
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
      </div>
    </div>
  );
}
