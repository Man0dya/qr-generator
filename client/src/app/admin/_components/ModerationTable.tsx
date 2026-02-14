"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, CheckCircle, Ban, BarChart2, Filter, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";

type QrRow = {
    id: number;
    short_code: string;
    destination_url: string;
    status: "active" | "banned" | "paused";
    creator?: string;
    is_flagged?: number | boolean;
    flag_reason?: string | null;
    flagged_at?: string | null;
    approval_request_status?: "none" | "requested" | "approved" | "denied" | string;
    approval_requested_at?: string | null;
    approval_request_note?: string | null;
    approval_resolved_at?: string | null;
    approval_resolved_by?: number | string | null;
};

type Props = {
    qrs: QrRow[];
    onToggleStatus: (id: number, action: "ban" | "activate" | "approve" | "approve_request" | "deny_request" | "delete") => void;
    analyticsBasePath?: string;
};

type FilterKey = "all" | "requested" | "banned" | "paused" | "active";

type PageSize = 10 | 25 | 50;

function formatWhen(value: unknown): string {
    if (!value) return "";
    const d = new Date(String(value));
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString();
}

function FilterButton({
    active,
    label,
    count,
    onClick,
}: {
    active: boolean;
    label: string;
    count: number;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={
                "px-3 py-1.5 rounded-md text-xs font-medium transition-all border " +
                (active
                    ? "bg-primary/10 text-primary border-primary/20"
                    : "bg-transparent text-muted-foreground border-transparent hover:bg-muted hover:text-foreground")
            }
        >
            {label}
            <span
                className={
                    "ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] " +
                    (active ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground")
                }
            >
                {count}
            </span>
        </button>
    );
}

export default function ModerationTable({
    qrs,
    onToggleStatus,
    analyticsBasePath = "/admin",
}: Props) {
    const router = useRouter();
    const [filter, setFilter] = useState<FilterKey>("all");
    const [query, setQuery] = useState<string>("");
    const [pageSize, setPageSize] = useState<PageSize>(10);
    const [page, setPage] = useState<number>(1);

    const enriched = useMemo(() => {
        return qrs || [];
    }, [qrs]);

    const counts = useMemo(() => {
        const base = { all: 0, requested: 0, banned: 0, paused: 0, active: 0 };
        for (const q of enriched) {
            base.all += 1;
            if ((q.approval_request_status || "none") === "requested") base.requested += 1;
            if (q.status === "banned") base.banned += 1;
            if (q.status === "paused") base.paused += 1;
            if (q.status === "active") base.active += 1;
        }
        return base;
    }, [enriched]);

    const rows = useMemo(() => {
        switch (filter) {
            case "requested":
                return enriched.filter((q) => (q.approval_request_status || "none") === "requested");
            case "banned":
                return enriched.filter((q) => q.status === "banned");
            case "paused":
                return enriched.filter((q) => q.status === "paused");
            case "active":
                return enriched.filter((q) => q.status === "active");
            case "all":
            default:
                return enriched;
        }
    }, [enriched, filter]);

    const normalizedQuery = useMemo(() => query.trim().toLowerCase(), [query]);

    const searchedRows = useMemo(() => {
        if (!normalizedQuery) return rows;
        return rows.filter((q) => {
            const haystack = [
                q.short_code,
                q.destination_url,
                q.creator,
                q.flag_reason,
                q.approval_request_note,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();
            return haystack.includes(normalizedQuery);
        });
    }, [rows, normalizedQuery]);

    const pageCount = useMemo(() => {
        return Math.max(1, Math.ceil(searchedRows.length / pageSize));
    }, [searchedRows.length, pageSize]);

    const safePage = useMemo(() => Math.min(Math.max(1, page), pageCount), [page, pageCount]);

    const pagedRows = useMemo(() => {
        const start = (safePage - 1) * pageSize;
        return searchedRows.slice(start, start + pageSize);
    }, [pageSize, safePage, searchedRows]);

    const rangeLabel = useMemo(() => {
        if (searchedRows.length === 0) return "0";
        const start = (safePage - 1) * pageSize + 1;
        const end = Math.min(searchedRows.length, safePage * pageSize);
        return `${start}-${end} of ${searchedRows.length}`;
    }, [pageSize, safePage, searchedRows.length]);

    return (
        <div className="bg-card border border-border/60 rounded-xl shadow-sm overflow-hidden">
            {/* Header / Filters */}
            <div className="p-5 border-b border-border/60 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-muted/20">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 text-primary rounded-lg shrink-0">
                        <ShieldAlert size={18} />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-foreground">QR Moderation</h2>
                        <p className="text-xs text-muted-foreground">Monitor and manage flagged QR codes</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-muted/40 p-1 rounded-lg border border-border/40">
                    <FilterButton active={filter === "all"} label="All" count={counts.all} onClick={() => setFilter("all")} />
                    <FilterButton
                        active={filter === "requested"}
                        label="Requested"
                        count={counts.requested}
                        onClick={() => { setFilter("requested"); setPage(1); }}
                    />
                    <FilterButton
                        active={filter === "banned"}
                        label="Banned"
                        count={counts.banned}
                        onClick={() => { setFilter("banned"); setPage(1); }}
                    />
                    <FilterButton
                        active={filter === "paused"}
                        label="Paused"
                        count={counts.paused}
                        onClick={() => { setFilter("paused"); setPage(1); }}
                    />
                </div>
            </div>

            {/* Sub-Header / Search */}
            <div className="px-5 py-3 border-b border-border/60 bg-muted/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative">
                    <input
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setPage(1);
                        }}
                        placeholder="Search code, url, creator..."
                        className="h-9 w-64 max-w-full text-sm bg-background border border-border rounded-md px-3 outline-none focus:border-primary transition text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-primary/20"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Rows:</span>
                    <select
                        value={pageSize}
                        onChange={(e) => {
                            setPageSize(Number(e.target.value) as PageSize);
                            setPage(1);
                        }}
                        className="h-8 text-xs bg-background border border-border rounded-md px-2 outline-none focus:border-primary transition text-foreground"
                    >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="border-b border-border/60 bg-muted/20 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            <th className="px-5 py-3 font-medium">Short Code</th>
                            <th className="px-5 py-3 font-medium">Target URL</th>
                            <th className="px-5 py-3 font-medium">Creator</th>
                            <th className="px-5 py-3 font-medium">Status</th>
                            <th className="px-5 py-3 font-medium text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                        {pagedRows.length === 0 ? (
                            <tr>
                                <td className="px-5 py-12 text-center text-muted-foreground" colSpan={5}>
                                    <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3 opacity-50">
                                        <Filter size={24} />
                                    </div>
                                    <p>No QR codes match this filter.</p>
                                </td>
                            </tr>
                        ) : (
                            pagedRows.map((q) => (
                                <tr key={q.id} className="hover:bg-muted/30 transition-colors group">
                                    <td className="px-5 py-3.5 font-mono text-primary font-medium">
                                        /{q.short_code}
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <div className="max-w-[300px]">
                                            <div className="text-sm text-foreground truncate" title={q.destination_url}>
                                                {q.destination_url}
                                            </div>
                                            {q.flag_reason ? (
                                                <div className="mt-1 text-xs text-destructive truncate" title={q.flag_reason}>
                                                    Reason: {q.flag_reason}
                                                </div>
                                            ) : null}

                                            {(q.approval_request_status || "none") === "requested" && q.approval_request_note ? (
                                                <div className="mt-2 text-[10px] bg-amber-500/10 border border-amber-500/20 p-2 rounded text-amber-700 dark:text-amber-400">
                                                    <strong>Appeal:</strong> {q.approval_request_note}
                                                    {q.approval_requested_at ? (
                                                        <div className="opacity-70 mt-0.5">
                                                            {formatWhen(q.approval_requested_at)}
                                                        </div>
                                                    ) : null}
                                                </div>
                                            ) : null}
                                        </div>
                                    </td>
                                    <td className="px-5 py-3.5 text-sm text-muted-foreground">
                                        {q.creator}
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center gap-2">
                                            {q.status === "active" ? (
                                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                                    <CheckCircle size={10} /> Active
                                                </span>
                                            ) : q.status === "paused" ? (
                                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                                    Paused
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-destructive/10 text-destructive">
                                                    <Ban size={10} /> Banned
                                                </span>
                                            )}

                                            {(q.approval_request_status || "none") === "requested" ? (
                                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                                    Review
                                                </span>
                                            ) : null}
                                        </div>
                                    </td>
                                    <td className="px-5 py-3.5 text-right">
                                        <div className="flex justify-end items-center gap-1.5 flex-wrap">
                                            <button
                                                onClick={() => router.push(`/admin/analytics/${q.id}`)}
                                                className="p-1.5 h-7 w-7 inline-flex items-center justify-center rounded border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                                title="View analytics"
                                            >
                                                <BarChart2 size={14} />
                                            </button>

                                            {(q.approval_request_status || "none") === "requested" ? (
                                                <>
                                                    <button
                                                        onClick={() => onToggleStatus(q.id, "approve_request")}
                                                        className="h-7 px-2 rounded-md bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 text-[10px] font-bold transition-colors"
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => onToggleStatus(q.id, "deny_request")}
                                                        className="h-7 px-2 rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20 text-[10px] font-bold transition-colors"
                                                    >
                                                        Deny
                                                    </button>
                                                </>
                                            ) : null}

                                            {/* Hide Activate if already active */}
                                            {q.status !== "active" && q.status !== "banned" && (
                                                <button
                                                    onClick={() => onToggleStatus(q.id, "activate")}
                                                    className="h-7 px-2 rounded-md border border-border text-emerald-600 hover:bg-emerald-500/10 text-[10px] font-bold transition-colors"
                                                >
                                                    Activate
                                                </button>
                                            )}

                                            {q.status !== "banned" ? (
                                                <button
                                                    onClick={() => onToggleStatus(q.id, "ban")}
                                                    className="h-7 px-2 rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20 text-[10px] font-bold transition-colors"
                                                >
                                                    Ban
                                                </button>
                                            ) : null}

                                            <button
                                                onClick={() => onToggleStatus(q.id, "delete")}
                                                className="h-7 w-7 inline-flex items-center justify-center rounded-md border border-destructive/30 text-destructive hover:bg-destructive/20 transition-colors ml-1"
                                                title="Delete"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Footer Pagination */}
            {pagedRows.length > 0 && (
                <div className="px-5 py-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground bg-muted/20">
                    <div>
                        Showing {rangeLabel}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={safePage <= 1}
                            className="p-1 rounded-md border border-border bg-card hover:bg-muted disabled:opacity-50 transition-colors"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button
                            type="button"
                            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                            disabled={safePage >= pageCount}
                            className="p-1 rounded-md border border-border bg-card hover:bg-muted disabled:opacity-50 transition-colors"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}