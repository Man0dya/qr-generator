"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Clock3, Globe, Search, ShieldX, Trash2, XCircle } from "lucide-react";

type DomainRow = {
  id: number;
  user_id: number;
  domain: string;
  status: "active" | "pending" | "invalid";
  created_at: string;
  user_email?: string;
  user_name?: string;
};

type Props = {
  domains: DomainRow[];
  onAction: (id: number, action: "activate" | "pending" | "invalidate" | "delete") => void;
};

type StatusFilter = "all" | "active" | "pending" | "invalid";

export default function DomainsModerationTable({ domains, onAction }: Props) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");

  const normalizedQuery = useMemo(() => query.trim().toLowerCase(), [query]);

  const rows = useMemo(() => {
    let list = domains || [];

    if (status !== "all") {
      list = list.filter((d) => d.status === status);
    }

    if (normalizedQuery) {
      list = list.filter((d) =>
        [d.domain, d.user_email, d.user_name]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery)
      );
    }

    return list;
  }, [domains, normalizedQuery, status]);

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-border bg-muted/40 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="text-sm font-bold text-foreground">Domain Management</div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-60 max-w-full">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search domain or owner"
              className="h-9 w-full pl-8 pr-3 text-sm bg-card border border-border rounded-lg outline-none focus:border-primary transition text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as StatusFilter)}
            className="h-9 text-sm bg-card border border-border rounded-lg px-3 outline-none focus:border-primary text-foreground"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="invalid">Invalid</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="p-4 text-xs font-bold text-muted-foreground uppercase">Domain</th>
              <th className="p-4 text-xs font-bold text-muted-foreground uppercase">Owner</th>
              <th className="p-4 text-xs font-bold text-muted-foreground uppercase">Status</th>
              <th className="p-4 text-xs font-bold text-muted-foreground uppercase">Created</th>
              <th className="p-4 text-xs font-bold text-muted-foreground uppercase text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.length === 0 ? (
              <tr>
                <td className="p-6 text-muted-foreground" colSpan={5}>No domains found.</td>
              </tr>
            ) : (
              rows.map((domain) => (
                <tr key={domain.id} className="hover:bg-muted/40 transition">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-primary/10 text-primary"><Globe size={14} /></span>
                      <span className="font-semibold text-foreground">{domain.domain}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">{domain.user_email || "Unknown"}</td>
                  <td className="p-4">
                    <span className={
                      "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium " +
                      (domain.status === "active"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : domain.status === "pending"
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          : "bg-destructive/10 text-destructive")
                    }>
                      {domain.status === "active" ? <CheckCircle2 size={12} /> : domain.status === "pending" ? <Clock3 size={12} /> : <XCircle size={12} />}
                      <span className="capitalize">{domain.status}</span>
                    </span>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">{new Date(domain.created_at).toLocaleDateString()}</td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end items-center gap-2 flex-wrap">
                      <button
                        onClick={() => onAction(domain.id, "activate")}
                        className="h-8 px-3 rounded border border-emerald-300 text-emerald-700 hover:bg-emerald-50 text-xs inline-flex items-center gap-1"
                      >
                        <CheckCircle2 size={14} /> Activate
                      </button>
                      <button
                        onClick={() => onAction(domain.id, "pending")}
                        className="h-8 px-3 rounded border border-amber-300 text-amber-700 hover:bg-amber-50 text-xs inline-flex items-center gap-1"
                      >
                        <Clock3 size={14} /> Pending
                      </button>
                      <button
                        onClick={() => onAction(domain.id, "invalidate")}
                        className="h-8 px-3 rounded border border-destructive/40 text-destructive hover:bg-destructive/10 text-xs inline-flex items-center gap-1"
                      >
                        <ShieldX size={14} /> Invalidate
                      </button>
                      <button
                        onClick={() => onAction(domain.id, "delete")}
                        className="h-8 px-3 rounded border border-destructive/40 text-destructive hover:bg-destructive/10 text-xs inline-flex items-center gap-1"
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
