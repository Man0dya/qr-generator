"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Globe,
  Info,
  Link as LinkIcon,
  QrCode,
  Save,
} from "lucide-react";
import { apiFetch, API_BASE } from "@/lib/api";

type QrInfo = {
  id: number;
  short_code: string;
  destination_url: string;
  created_at?: string;
  status?: string;
  url_link_id?: number | null;
};

export default function EditQRPage() {
  const params = useParams();
  const router = useRouter();

  const [url, setUrl] = useState("");
  const [qrInfo, setQrInfo] = useState<QrInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiFetch(`/get_analytics_details.php?qr_id=${params.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setUrl(data.qr_info.destination_url || "");
          setQrInfo(data.qr_info || null);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params.id]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await apiFetch("/update_qr.php", {
        method: "POST",
        body: JSON.stringify({ qr_id: params.id, url }),
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.error || "Failed to update QR.");
        setSaving(false);
        return;
      }
      router.push("/dashboard/qrs");
    } catch {
      alert("Failed to update");
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground gap-2">
        <div className="w-5 h-5 border-2 border-border border-t-primary rounded-full animate-spin" />
        Loading QR details...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <div className="flex items-center justify-between mb-8">
        <div>
          <button
            type="button"
            onClick={() => router.push("/dashboard/qrs")}
            className="flex items-center text-muted-foreground hover:text-primary transition mb-2"
          >
            <ArrowLeft size={16} className="mr-1" /> Back to QRs
          </button>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Assets / QRs / Edit</p>
          <h1 className="text-3xl font-bold text-foreground tracking-tight mt-1">Edit QR Destination</h1>
        </div>

        <button
          type="submit"
          form="qr-edit-form"
          disabled={saving}
          className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold hover:bg-primary/90 transition shadow-lg shadow-primary/20 flex items-center gap-2 disabled:opacity-50"
        >
          <Save size={20} /> {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm text-foreground flex items-start gap-2">
            <Info size={16} className="mt-0.5 text-primary" />
            Updating destination keeps the same QR image. Printed QR codes continue working without reprint.
          </div>

          <form id="qr-edit-form" onSubmit={handleUpdate} className="bg-card border border-border rounded-2xl p-6 space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Destination URL</label>
              <div className="relative">
                <LinkIcon size={14} className="absolute left-3 top-4 text-muted-foreground" />
                <input
                  type="url"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full h-12 pl-8 pr-3 bg-muted/50 border border-border rounded-xl outline-none focus:border-primary text-foreground"
                />
              </div>
            </div>
          </form>
        </div>

        <div className="lg:col-span-5">
          <div className="sticky top-8">
            <div className="bg-card p-8 rounded-3xl border border-border shadow-xl shadow-black/5 min-h-[400px]">
              <div className="mb-4 flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full text-xs font-bold border border-amber-500/20 w-fit">
                <CheckCircle2 size={14} /> Identity Context
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Short URL</p>
                  <a
                    href={`${API_BASE}/redirect.php?c=${qrInfo?.short_code || ""}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-primary mt-1 break-all inline-flex items-center gap-1"
                  >
                    /{qrInfo?.short_code || "-"} <ExternalLink size={12} />
                  </a>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Current Destination</p>
                  <p className="text-sm text-foreground mt-1 break-all">{qrInfo?.destination_url || "-"}</p>
                </div>

                <div className="pt-2 border-t border-border space-y-2 text-xs text-muted-foreground">
                  <p className="inline-flex items-center gap-1"><Calendar size={12} /> Created: {qrInfo?.created_at ? new Date(qrInfo.created_at).toLocaleDateString() : "-"}</p>
                  <p className="inline-flex items-center gap-1"><QrCode size={12} /> Status: {qrInfo?.status || "active"}</p>
                  {qrInfo?.url_link_id ? (
                    <Link href={`/dashboard/urlmd/${qrInfo.url_link_id}`} className="inline-flex items-center gap-1 text-primary hover:underline">
                      <Globe size={12} /> Manage linked short link
                    </Link>
                  ) : null}
                </div>
              </div>

              <div className="mt-8">
                <Link href="/dashboard/qrs" className="h-11 px-4 border border-border rounded-xl text-sm font-medium text-foreground hover:bg-muted transition inline-flex items-center gap-2">
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
