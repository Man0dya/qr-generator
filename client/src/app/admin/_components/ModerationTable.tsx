"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, CheckCircle, Ban, BarChart2 } from "lucide-react";

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
    onToggleStatus: (id: number, action: "ban" | "activate" | "approve" | "approve_request" | "deny_request") => void;
    analyticsBasePath?: string;
};

type FilterKey = "all" | "requested" | "banned" | "paused" | "active";

type PageSize = 10 | 25 | 50;

function formatWhen(value: unknown): string {
    if (!value) return "";
    const d = new Date(String(value));
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleString();
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
                "px-3 py-1.5 rounded-lg text-xs font-bold transition border " +
                (active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground border-border hover:bg-muted/50")
            }
        >
            {label}
            <span
                className={
                    "ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] " +
                    (active ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground")
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
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/30 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <ShieldAlert size={16} /> Global link monitoring.
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <FilterButton active={filter === "all"} label="All" count={counts.all} onClick={() => setFilter("all")} />
                    <FilterButton
                        active={filter === "requested"}
                        label="Requested"
                        count={counts.requested}
                        onClick={() => {
                            setFilter("requested");
                            setPage(1);
                        }}
                    />
                    <FilterButton
                        active={filter === "banned"}
                        label="Banned"
                        count={counts.banned}
                        onClick={() => {
                            setFilter("banned");
                            setPage(1);
                        }}
                    />
                    <FilterButton
                        active={filter === "paused"}
                        label="Paused"
                        count={counts.paused}
                        onClick={() => {
                            setFilter("paused");
                            setPage(1);
                        }}
                    />
                    <FilterButton
                        active={filter === "active"}
                        label="Active"
                        count={counts.active}
                        onClick={() => {
                            setFilter("active");
                            setPage(1);
                        }}
                    />
                </div>
            </div>

            <div className="px-4 py-3 border-b border-border bg-card flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <div className="text-sm text-muted-foreground">
                        <span className="font-bold text-foreground">{filter === "all" ? "All" : filter}</span>
                        <span className="ml-2 text-muted-foreground">Showing {rangeLabel}</span>
                        {normalizedQuery ? <span className="ml-2 text-muted-foreground/70">for “{query.trim()}”</span> : null}
                    </div>

                    <input
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setPage(1);
                        }}
                        placeholder="Search url / code / creator"
                        className="h-9 w-64 max-w-full text-sm bg-card border border-border rounded-lg px-3 outline-none focus:border-primary transition text-foreground placeholder:text-muted-foreground"
                    />
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2">
                    <span className="text-xs font-bold text-muted-foreground">Show</span>
                    <select
                        value={pageSize}
                        onChange={(e) => {
                            setPageSize(Number(e.target.value) as PageSize);
                            setPage(1);
                        }}
                        className="h-9 text-sm bg-card border border-border rounded-lg px-3 outline-none focus:border-primary transition text-foreground"
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
                                ? "bg-muted text-muted-foreground border-border cursor-not-allowed opacity-50"
                                : "bg-card text-foreground border-border hover:bg-muted")
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
                                ? "bg-muted text-muted-foreground border-border cursor-not-allowed opacity-50"
                                : "bg-card text-foreground border-border hover:bg-muted")
                        }
                    >
                        Next
                    </button>
                </div>
            </div>
            <table className="w-full text-left border-collapse">
                <thead className="bg-muted/50 border-b border-border">
                    <tr>
                        <th className="p-4 text-xs font-bold text-muted-foreground uppercase">Short Code</th>
                        <th className="p-4 text-xs font-bold text-muted-foreground uppercase">Target URL</th>
                        <th className="p-4 text-xs font-bold text-muted-foreground uppercase">Creator</th>
                        <th className="p-4 text-xs font-bold text-muted-foreground uppercase">Status</th>
                        <th className="p-4 text-xs font-bold text-muted-foreground uppercase text-right">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {pagedRows.length === 0 ? (
                        <tr>
                            <td className="p-6 text-muted-foreground" colSpan={5}>
                                No links match this filter.
                            </td>
                        </tr>
                    ) : (
                        pagedRows.map((q) => (
                            <tr key={q.id} className="hover:bg-muted/50 transition">
                                <td className="p-4 font-mono text-primary font-bold">/{q.short_code}</td>
                                <td className="p-4">
                                    <div className="text-sm text-foreground max-w-[520px] truncate" title={q.destination_url}>
                                        {q.destination_url}
                                    </div>
                                    {q.flag_reason ? (
                                        <div className="mt-1 text-xs text-destructive max-w-[520px] truncate" title={q.flag_reason}>
                                            Reason: {q.flag_reason}
                                        </div>
                                    ) : null}

                                    {(q.approval_request_status || "none") === "requested" && q.approval_request_note ? (
                                        <div className="mt-1">
                                            <div className="text-xs text-amber-600 dark:text-amber-400 max-w-[520px] truncate" title={q.approval_request_note}>
                                                Request note: {q.approval_request_note}
                                            </div>
                                            {q.approval_requested_at ? (
                                                <div className="text-[11px] text-muted-foreground mt-0.5">
                                                    Requested: {formatWhen(q.approval_requested_at)}
                                                </div>
                                            ) : null}
                                        </div>
                                    ) : null}
                                </td>
                                <td className="p-4 text-sm text-muted-foreground">{q.creator}</td>
                                <td className="p-4">
                                    <div className="flex items-center gap-2">
                                        {q.status === "active" ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                                <CheckCircle size={12} /> Active
                                            </span>
                                        ) : q.status === "paused" ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                                Paused
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive">
                                                <Ban size={12} /> Banned
                                            </span>
                                        )}

                                        {(q.approval_request_status || "none") === "requested" ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                                Approval requested
                                            </span>
                                        ) : null}

                                    </div>
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end items-center gap-2 flex-wrap">
                                        <button
                                            onClick={() => router.push(`${analyticsBasePath}/analytics/${q.id}`)}
                                            className="inline-flex items-center justify-center h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition"
                                            title="View analytics"
                                        >
                                            <BarChart2 size={18} />
                                        </button>

                                        {(q.approval_request_status || "none") === "requested" ? (
                                            <>
                                                <button
                                                    onClick={() => onToggleStatus(q.id, "approve_request")}
                                                    className="inline-flex items-center h-9 px-3 rounded-lg text-xs font-bold transition bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400"
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => onToggleStatus(q.id, "deny_request")}
                                                    className="inline-flex items-center h-9 px-3 rounded-lg text-xs font-bold transition bg-muted text-muted-foreground hover:bg-muted/80"
                                                >
                                                    Deny
                                                </button>
                                            </>
                                        ) : null}

                                        {q.status !== "banned" ? (
                                            <button
                                                onClick={() => onToggleStatus(q.id, "ban")}
                                                className="inline-flex items-center h-9 px-3 rounded-lg text-xs font-bold transition bg-destructive/10 text-destructive hover:bg-destructive/20"
                                            >
                                                Ban
                                            </button>
                                        ) : null}
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}