"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Clock3, Globe, Search, ShieldX, Trash2, XCircle, Filter } from "lucide-react";

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
    <div className="bg-card border border-border/60 rounded-xl shadow-sm overflow-hidden">
      <div className="p-5 border-b border-border/60 bg-muted/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 text-primary rounded-lg shrink-0">
            <Globe size={18} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground">Domain Management</h2>
            <p className="text-xs text-muted-foreground">Moderate custom domains</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-60 max-w-full">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search domain or owner"
              className="h-9 w-full pl-9 pr-3 text-sm bg-background border border-border rounded-md outline-none focus:border-primary transition text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-primary/20"
            />
          </div>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as StatusFilter)}
            className="h-9 text-sm bg-background border border-border rounded-md px-3 outline-none focus:border-primary text-foreground"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="invalid">Invalid</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border/60 bg-muted/20 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <th className="px-5 py-3 font-medium">Domain</th>
              <th className="px-5 py-3 font-medium">Owner</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Created</th>
              <th className="px-5 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {rows.length === 0 ? (
              <tr>
                <td className="px-5 py-12 text-center text-muted-foreground" colSpan={5}>
                  <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3 opacity-50">
                    <Filter size={24} />
                  </div>
                  <p>No domains found.</p>
                </td>
              </tr>
            ) : (
              rows.map((domain) => (
                <tr key={domain.id} className="hover:bg-muted/30 transition-colors group">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{domain.domain}</span>
                      <a href={`http://${domain.domain}`} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary"><Globe size={12} /></a>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground">
                    <span className="truncate max-w-[200px]" title={domain.user_email}>{domain.user_email || "Unknown"}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={
                      "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase " +
                      (domain.status === "active"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : domain.status === "pending"
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          : "bg-destructive/10 text-destructive")
                    }>
                      {domain.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground">{new Date(domain.created_at).toLocaleDateString()}</td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex justify-end items-center gap-1.5 flex-wrap">
                      <button
                        onClick={() => onAction(domain.id, "activate")}
                        className="inline-flex items-center justify-center h-7 w-7 rounded border border-border text-emerald-600 hover:bg-emerald-500/10 transition-colors"
                        title="Activate"
                      >
                        <CheckCircle2 size={14} />
                      </button>
                      <button
                        onClick={() => onAction(domain.id, "pending")}
                        className="inline-flex items-center justify-center h-7 w-7 rounded border border-border text-amber-600 hover:bg-amber-500/10 transition-colors"
                        title="Mark Pending"
                      >
                        <Clock3 size={14} />
                      </button>
                      <button
                        onClick={() => onAction(domain.id, "invalidate")}
                        className="inline-flex items-center justify-center h-7 w-7 rounded border border-border text-destructive hover:bg-destructive/10 transition-colors"
                        title="Invalidate"
                      >
                        <ShieldX size={14} />
                      </button>
                      <button
                        onClick={() => onAction(domain.id, "delete")}
                        className="inline-flex items-center justify-center h-7 w-7 rounded border border-destructive/20 text-destructive hover:bg-destructive/10 transition-colors"
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
    </div>
  );
}
