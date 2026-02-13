"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BarChart2, Edit, Trash2, ExternalLink,
  QrCode, Plus, ArrowUpRight, Clock, Download
} from "lucide-react";
import StyledQrCode from "@/app/dashboard/_components/StyledQrCode";
import { buildQrCodeStylingOptions, parseDesignConfig } from "@/lib/qrStyling";
import { apiFetch, API_BASE } from "@/lib/api";

export default function DashboardPage() {
  const [qrs, setQrs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [requestingApprovalId, setRequestingApprovalId] = useState<number | null>(null);

  const [statusTab, setStatusTab] = useState<"all" | "active" | "paused" | "banned">("all");
  const [query, setQuery] = useState<string>("");
  const [sort, setSort] = useState<
    "created_desc" | "created_asc" | "scans_desc" | "scans_asc" | "code_asc"
  >("created_desc");
  const [pageSize, setPageSize] = useState<10 | 25 | 50>(10);
  const [page, setPage] = useState<number>(1);

  const handleDownloadQr = async (shortCode: string, designConfigRaw: unknown) => {
    const mod = await import("qr-code-styling");
    const QRCodeStyling = mod.default;

    const design = parseDesignConfig(designConfigRaw);
    const tempContainer = document.createElement("div");
    tempContainer.style.position = "fixed";
    tempContainer.style.left = "-99999px";
    tempContainer.style.top = "-99999px";
    document.body.appendChild(tempContainer);

    const qr = new QRCodeStyling(
      buildQrCodeStylingOptions({
        data: `${API_BASE}/redirect.php?c=${shortCode}`,
        size: 1024,
        format: "canvas",
        design,
      })
    );
    qr.append(tempContainer);

    await new Promise((r) => requestAnimationFrame(() => r(null)));

    const raw = await qr.getRawData("png");
    if (!raw) {
      document.body.removeChild(tempContainer);
      alert("Failed to generate download.");
      return;
    }

    const blob = raw instanceof Blob ? raw : new Blob([raw as any], { type: "image/png" });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = `qr-${shortCode}.png`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(tempContainer);
  };

  // 1. Fetch Data
  const fetchQRs = async () => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    setUser(storedUser);
    if (!storedUser.id) return;

    try {
      const res = await apiFetch(`/get_dashboard_data.php?user_id=${storedUser.id}`);
      const data = await res.json();
      if (data.success) {
        setQrs(data.data);
      }
    } catch (err) {
      console.error("Failed to load QRs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQRs();
  }, []);

  const normalizedQuery = useMemo(() => query.trim().toLowerCase(), [query]);

  const filteredQrs = useMemo(() => {
    let list = qrs || [];

    if (statusTab !== "all") {
      list = list.filter((qr) => String(qr.status || "").toLowerCase() === statusTab);
    }

    if (normalizedQuery) {
      list = list.filter((qr) => {
        const haystack = [
          qr.short_code,
          qr.destination_url,
          qr.flag_reason,
          qr.approval_request_note,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(normalizedQuery);
      });
    }

    const parseScans = (v: unknown) => {
      const n = Number.parseInt(String(v ?? "0"), 10);
      return Number.isFinite(n) ? n : 0;
    };

    const parseCreated = (v: unknown) => {
      const t = new Date(String(v ?? "")).getTime();
      return Number.isFinite(t) ? t : 0;
    };

    const copy = list.slice();
    copy.sort((a, b) => {
      switch (sort) {
        case "created_asc":
          return parseCreated(a.created_at) - parseCreated(b.created_at);
        case "scans_desc":
          return parseScans(b.total_scans) - parseScans(a.total_scans);
        case "scans_asc":
          return parseScans(a.total_scans) - parseScans(b.total_scans);
        case "code_asc":
          return String(a.short_code || "").localeCompare(String(b.short_code || ""));
        case "created_desc":
        default:
          return parseCreated(b.created_at) - parseCreated(a.created_at);
      }
    });

    return copy;
  }, [normalizedQuery, qrs, sort, statusTab]);

  const pageCount = useMemo(
    () => Math.max(1, Math.ceil(filteredQrs.length / pageSize)),
    [filteredQrs.length, pageSize]
  );

  const safePage = useMemo(
    () => Math.min(Math.max(1, page), pageCount),
    [page, pageCount]
  );

  const pagedQrs = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredQrs.slice(start, start + pageSize);
  }, [filteredQrs, pageSize, safePage]);

  const rangeLabel = useMemo(() => {
    if (filteredQrs.length === 0) return "0";
    const start = (safePage - 1) * pageSize + 1;
    const end = Math.min(filteredQrs.length, safePage * pageSize);
    return `${start}-${end} of ${filteredQrs.length}`;
  }, [filteredQrs.length, pageSize, safePage]);

  // 2. Handle Delete Logic
  const handleDelete = async (qrId: number) => {
    if (!confirm("Are you sure you want to delete this QR code? This action cannot be undone.")) {
      return;
    }

    try {
      const res = await apiFetch("/delete_qr.php", {
        method: "POST",
        body: JSON.stringify({ qr_id: qrId }),
      });

      const data = await res.json();
      if (data.success) {
        setQrs(qrs.filter(q => q.id !== qrId));
      } else {
        alert(data.error || "Failed to delete");
      }
    } catch (err) {
      alert("Server error");
    }
  };

  const handleRequestApprove = async (qrId: number) => {
    if (!user?.id) return;
    if (!confirm("Request approval for this QR? An admin will review it.")) return;

    const note = window.prompt("Optional note for the admin (why should this be approved)?", "") || "";

    setRequestingApprovalId(qrId);
    try {
      const res = await apiFetch("/request_qr_approval.php", {
        method: "POST",
        body: JSON.stringify({ qr_id: qrId, note }),
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.error || "Failed to request approval");
        return;
      }
      await fetchQRs();
    } catch (err) {
      alert("Server error");
    } finally {
      setRequestingApprovalId(null);
    }
  };

  // Quick Stats
  const totalScans = qrs.reduce((acc, curr) => acc + parseInt(curr.total_scans || 0), 0);
  const activeLinks = qrs.filter(q => q.status === 'active').length;

  if (loading) return <div className="p-8 text-muted-foreground animate-pulse">Loading your dashboard...</div>;

  return (
    <div className="space-y-10">

      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-2">Welcome back! Here's what's happening with your links.</p>
        </div>
        <Link
          href="/dashboard/create"
          className="bg-primary text-primary-foreground px-5 py-3 rounded-xl hover:bg-primary/90 transition shadow-lg shadow-primary/20 font-medium flex items-center gap-2"
        >
          <Plus size={20} /> Create New QR
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card p-6 rounded-2xl shadow-sm border border-border">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 text-primary rounded-xl">
              <QrCode size={24} />
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium">Total QR Codes</p>
              <p className="text-2xl font-bold text-card-foreground">{qrs.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-card p-6 rounded-2xl shadow-sm border border-border">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <ArrowUpRight size={24} />
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium">Total Scans</p>
              <p className="text-2xl font-bold text-card-foreground">{totalScans}</p>
            </div>
          </div>
        </div>
        <div className="bg-card p-6 rounded-2xl shadow-sm border border-border">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium">Active Links</p>
              <p className="text-2xl font-bold text-card-foreground">{activeLinks}</p>
            </div>
          </div>
        </div>
      </div>

      {/* --- QR LIST --- */}
      <div>
        <h2 className="text-xl font-bold text-card-foreground mb-6">Recent Codes</h2>

        {qrs.length > 0 ? (
          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden mb-5">
            <div className="p-4 border-b border-border bg-muted/30 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center rounded-lg border border-border bg-card p-1">
                  {["all", "active", "paused", "banned"].map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => {
                        setStatusTab(tab as any);
                        setPage(1);
                      }}
                      className={
                        "h-8 px-3 rounded-md text-xs font-bold transition capitalize " +
                        (statusTab === tab
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted")
                      }
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                <span className="text-xs font-bold text-muted-foreground ml-1">Sort</span>
                <select
                  value={sort}
                  onChange={(e) => {
                    setSort(e.target.value as any);
                    setPage(1);
                  }}
                  className="h-9 text-sm bg-card border border-border rounded-lg px-3 outline-none focus:border-primary transition text-card-foreground"
                >
                  <option value="created_desc">Created (newest)</option>
                  <option value="created_asc">Created (oldest)</option>
                  <option value="scans_desc">Scans (most)</option>
                  <option value="scans_asc">Scans (least)</option>
                  <option value="code_asc">Code (A-Z)</option>
                </select>

                <input
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search code or url…"
                  className="h-9 w-64 max-w-full text-sm bg-card border border-border rounded-lg px-3 outline-none focus:border-primary transition text-card-foreground placeholder:text-muted-foreground"
                />
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2">
                <span className="text-sm text-card-foreground">
                  <span className="text-muted-foreground">Showing</span> {rangeLabel}
                </span>
                <span className="text-xs font-bold text-muted-foreground ml-1">Show</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value) as 10 | 25 | 50);
                    setPage(1);
                  }}
                  className="h-9 text-sm bg-card border border-border rounded-lg px-3 outline-none focus:border-primary transition text-card-foreground"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage <= 1}
                  className={
                    "h-9 px-3 rounded-lg border text-xs font-bold transition " +
                    (safePage <= 1
                      ? "bg-muted text-muted-foreground border-border cursor-not-allowed"
                      : "bg-card text-card-foreground border-border hover:bg-muted")
                  }
                >
                  Prev
                </button>
                <span className="text-xs font-bold text-muted-foreground">
                  Page {safePage} / {pageCount}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                  disabled={safePage >= pageCount}
                  className={
                    "h-9 px-3 rounded-lg border text-xs font-bold transition " +
                    (safePage >= pageCount
                      ? "bg-muted text-muted-foreground border-border cursor-not-allowed"
                      : "bg-card text-card-foreground border-border hover:bg-muted")
                  }
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {qrs.length === 0 ? (
          <div className="text-center py-24 bg-card rounded-3xl border border-dashed border-border">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 text-muted-foreground">
              <QrCode size={32} />
            </div>
            <h3 className="text-lg font-bold text-card-foreground mb-2">No QR Codes yet</h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">Create your first dynamic QR code to start tracking connections.</p>
            <Link
              href="/dashboard/create"
              className="text-primary font-medium hover:underline"
            >
              Create one now &rarr;
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {pagedQrs.map((qr) => (
              <div key={qr.id} className="group bg-card p-5 rounded-2xl shadow-sm hover:shadow-md border border-border transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-6">

                {/* Left: Icon & Info */}
                <div className="flex items-start gap-5">
                  <div className="w-16 h-16 bg-muted border border-border rounded-xl flex items-center justify-center shrink-0 overflow-hidden relative group">
                    {qr?.short_code ? (
                      <button
                        type="button"
                        onClick={() =>
                          handleDownloadQr(qr.short_code, qr.design_config).catch((err) => {
                            console.error(err);
                            alert("Download failed. Try again or remove the logo.");
                          })
                        }
                        className="w-16 h-16 p-1 flex items-center justify-center hover:bg-accent transition"
                        title="Download QR"
                      >
                        <StyledQrCode
                          value={`${API_BASE}/redirect.php?c=${qr.short_code}`}
                          size={64}
                          design={parseDesignConfig(qr.design_config)}
                          className="w-[64px] h-[64px]"
                        />

                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="flex items-center gap-1.5 text-white text-xs font-bold">
                            <Download size={14} />
                          </div>
                        </div>
                      </button>
                    ) : (
                      <QrCode className="text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-mono font-bold text-primary text-lg">/{qr.short_code}</span>
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${qr.status === 'active'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                        : qr.status === 'paused'
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                          : 'bg-destructive/10 text-destructive border-destructive/20'
                        }`}>
                        {qr.status}
                      </span>

                      {qr?.approval_request_status === "requested" ? (
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border bg-amber-500/10 text-amber-600 border-amber-500/20">
                          approval requested
                        </span>
                      ) : qr?.approval_request_status === "denied" ? (
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border bg-muted text-muted-foreground border-border">
                          approval denied
                        </span>
                      ) : null}
                    </div>

                    <div className="space-y-1">
                      {/* QR tracking link */}
                      <a
                        href={`${API_BASE}/redirect.php?c=${qr.short_code}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-muted-foreground text-sm hover:text-primary hover:underline flex items-center gap-1 max-w-[250px] md:max-w-md truncate transition"
                        title={`${API_BASE}/redirect.php?c=${qr.short_code}`}
                      >
                        {`${API_BASE}/redirect.php?c=${qr.short_code}`} <ExternalLink size={12} />
                      </a>

                      {/* Destination */}
                      <a
                        href={qr.destination_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition max-w-[250px] md:max-w-md truncate block"
                        title={qr.destination_url}
                      >
                        Destination: {qr.destination_url}
                      </a>
                    </div>

                    <p className="text-xs text-muted-foreground/60 mt-2 flex items-center gap-1">
                      <Clock size={12} /> Created: {new Date(qr.created_at).toLocaleDateString()}
                    </p>

                    {qr?.flag_reason ? (
                      <p className="text-xs text-destructive mt-1 max-w-[250px] md:max-w-md truncate" title={qr.flag_reason}>
                        Reason: {qr.flag_reason}
                      </p>
                    ) : null}
                  </div>
                </div>

                {/* Right: Stats & Actions */}
                <div className="flex items-center justify-between md:justify-end gap-8 w-full md:w-auto border-t md:border-t-0 border-border pt-4 md:pt-0">
                  <div className="text-center md:text-right px-4">
                    <p className="text-2xl font-bold text-card-foreground">{qr.total_scans}</p>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Scans</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {qr.status !== "active" && (qr?.approval_request_status || "none") === "none" ? (
                      <button
                        type="button"
                        onClick={() => handleRequestApprove(qr.id)}
                        disabled={requestingApprovalId === qr.id}
                        className="px-3 py-2 text-xs font-bold rounded-lg border border-amber-500/20 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Request admin approval"
                      >
                        {requestingApprovalId === qr.id ? "Requesting..." : "Request approve"}
                      </button>
                    ) : null}

                    <Link
                      href={`/dashboard/analytics/${qr.id}`}
                      className="p-2.5 text-muted-foreground hover:bg-primary/10 hover:text-primary rounded-lg transition border border-transparent hover:border-primary/20"
                      title="Analytics"
                    >
                      <BarChart2 size={18} />
                    </Link>
                    <Link
                      href={`/dashboard/edit/${qr.id}`}
                      className="p-2.5 text-muted-foreground hover:bg-blue-500/10 hover:text-blue-600 rounded-lg transition border border-transparent hover:border-blue-500/20"
                      title="Edit URL"
                    >
                      <Edit size={18} />
                    </Link>
                    <button
                      onClick={() => handleDelete(qr.id)}
                      className="p-2.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-lg transition border border-transparent hover:border-destructive/20"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
