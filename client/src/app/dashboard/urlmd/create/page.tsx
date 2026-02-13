"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Link2, Save } from "lucide-react";
import { urlmdCreateLink } from "@/lib/urlmd";

export default function UrlmdCreatePage() {
  const router = useRouter();
  const [destinationUrl, setDestinationUrl] = useState("");
  const [shortCode, setShortCode] = useState("");
  const [title, setTitle] = useState("");
  const [redirectType, setRedirectType] = useState<"301" | "302">("302");
  const [saving, setSaving] = useState(false);

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
        alert(data.error || "Failed to create short link");
        return;
      }

      router.push("/dashboard/urlmd");
    } catch {
      alert("Network error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Link href="/dashboard/urlmd" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft size={14} className="mr-1" /> Back to Manage Links
        </Link>
        <h1 className="text-2xl font-bold text-foreground mt-2">New Short Link</h1>
      </div>

      <form onSubmit={onCreate} className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">Destination URL</label>
          <input
            type="url"
            required
            value={destinationUrl}
            onChange={(e) => setDestinationUrl(e.target.value)}
            placeholder="https://destination.example.com"
            className="w-full h-11 px-3 bg-background border border-border rounded-lg outline-none focus:border-primary"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Custom Code (optional)</label>
            <div className="relative">
              <Link2 size={14} className="absolute left-3 top-3.5 text-muted-foreground" />
              <input
                value={shortCode}
                onChange={(e) => setShortCode(e.target.value)}
                placeholder="campaign-2026"
                className="w-full h-11 pl-8 pr-3 bg-background border border-border rounded-lg outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Redirect Type</label>
            <select
              value={redirectType}
              onChange={(e) => setRedirectType(e.target.value as "301" | "302")}
              className="w-full h-11 px-3 bg-background border border-border rounded-lg outline-none focus:border-primary"
            >
              <option value="302">302 (Temporary)</option>
              <option value="301">301 (Permanent)</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">Title (optional)</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Spring Campaign"
            className="w-full h-11 px-3 bg-background border border-border rounded-lg outline-none focus:border-primary"
          />
        </div>

        <button
          disabled={saving}
          className="h-11 px-5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-70 inline-flex items-center gap-2"
        >
          <Save size={16} /> {saving ? "Creating..." : "Create Short Link"}
        </button>
      </form>
    </div>
  );
}
