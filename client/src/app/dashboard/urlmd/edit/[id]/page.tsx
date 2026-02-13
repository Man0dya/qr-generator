"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, CheckCircle2, Link2, Save } from "lucide-react";
import { type UrlLink, urlmdGetLinks, urlmdUpdateLink } from "@/lib/urlmd";

export default function UrlmdEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [shortCode, setShortCode] = useState("");
  const [destinationUrl, setDestinationUrl] = useState("");
  const [title, setTitle] = useState("");
  const [redirectType, setRedirectType] = useState<"301" | "302">("302");
  const [status, setStatus] = useState<"active" | "paused" | "expired" | "blocked">("active");

  useEffect(() => {
    const run = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        const data = await urlmdGetLinks({ status: "all" });
        if (!data?.success) {
          setLoading(false);
          return;
        }

        const link: UrlLink | undefined = (data.data || []).find((row: UrlLink) => Number(row.id) === id);
        if (!link) {
          setLoading(false);
          return;
        }

        setShortCode(link.short_code || "");
        setDestinationUrl(link.destination_url || "");
        setTitle(link.title || "");
        setRedirectType((link.redirect_type || "302") as "301" | "302");
        setStatus((link.status || "active") as "active" | "paused" | "expired" | "blocked");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [id]);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    if (!destinationUrl.trim()) {
      alert("Destination URL is required.");
      return;
    }

    setSaving(true);
    try {
      const data = await urlmdUpdateLink({
        id,
        destination_url: destinationUrl.trim(),
        title: title.trim() || undefined,
        redirect_type: redirectType,
        status,
      });

      if (!data?.success) {
        alert(data?.error || "Failed to update short link.");
        return;
      }

      router.push("/dashboard/urlmd");
    } catch {
      alert("Network error.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading short link...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <div className="flex items-center justify-between mb-8">
        <div>
          <button
            type="button"
            onClick={() => router.push("/dashboard/urlmd")}
            className="flex items-center text-muted-foreground hover:text-primary transition mb-2"
          >
            <ArrowLeft size={16} className="mr-1" /> Back to Short Links
          </button>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Assets / Short Links / Edit</p>
          <h1 className="text-3xl font-bold text-foreground tracking-tight mt-1">Edit Short Link</h1>
        </div>

        <button
          type="submit"
          form="short-link-edit-form"
          disabled={saving}
          className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold hover:bg-primary/90 transition shadow-lg shadow-primary/20 flex items-center gap-2 disabled:opacity-50"
        >
          <Save size={20} /> {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm text-foreground flex items-start gap-2">
            <CheckCircle2 size={16} className="mt-0.5 text-primary" />
            Update destination, redirect mode, and status while keeping your existing short code live.
          </div>

          <form id="short-link-edit-form" onSubmit={onSave} className="bg-card border border-border rounded-2xl p-6 space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Destination URL</label>
              <input
                type="url"
                required
                value={destinationUrl}
                onChange={(e) => setDestinationUrl(e.target.value)}
                className="w-full h-12 px-3 bg-muted/50 border border-border rounded-xl outline-none focus:border-primary text-foreground"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Title</label>
                <div className="relative">
                  <Link2 size={14} className="absolute left-3 top-4 text-muted-foreground" />
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full h-12 pl-8 pr-3 bg-muted/50 border border-border rounded-xl outline-none focus:border-primary text-foreground"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Redirect Type</label>
                <select
                  value={redirectType}
                  onChange={(e) => setRedirectType(e.target.value as "301" | "302")}
                  className="w-full h-12 px-3 bg-muted/50 border border-border rounded-xl outline-none focus:border-primary text-foreground"
                >
                  <option value="302">302 (Temporary)</option>
                  <option value="301">301 (Permanent)</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as "active" | "paused" | "expired" | "blocked")}
                className="w-full h-12 px-3 bg-muted/50 border border-border rounded-xl outline-none focus:border-primary text-foreground"
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="expired">Expired</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>
          </form>
        </div>

        <div className="lg:col-span-5">
          <div className="sticky top-8">
            <div className="bg-card p-8 rounded-3xl border border-border shadow-xl shadow-black/5 min-h-[400px]">
              <div className="mb-4 flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full text-xs font-bold border border-amber-500/20 w-fit">
                <ArrowUpRight size={14} /> Preview Mode
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Short URL</p>
                  <p className="text-sm text-primary mt-1 break-all">/{shortCode || "-"}</p>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Link Title</p>
                  <p className="text-sm font-bold text-foreground mt-1">{title || "Untitled"}</p>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Destination</p>
                  <p className="text-sm text-foreground mt-1 break-all">{destinationUrl || "-"}</p>
                </div>

                <div className="pt-2 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                  <span>Redirect: {redirectType}</span>
                  <span>Status: {status}</span>
                </div>
              </div>

              <div className="mt-8">
                <Link href="/dashboard/urlmd" className="h-11 px-4 border border-border rounded-xl text-sm font-medium text-foreground hover:bg-muted transition inline-flex items-center gap-2">
                  <ArrowLeft size={14} /> Back to list
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
