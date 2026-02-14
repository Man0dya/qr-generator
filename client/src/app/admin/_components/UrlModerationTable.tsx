"use client";

import { useMemo, useState } from "react";
import { Ban, CheckCircle2, PauseCircle, ExternalLink, Clock, AlertTriangle, Trash2, ArrowUpDown, BarChart2 } from "lucide-react";
import { API_BASE } from "@/lib/api";

type UrlModerationRow = {
  id: number;
  short_code: string;
  destination_url: string;
  status: "active" | "paused" | "expired" | "blocked";
  email: string;
  total_clicks: number | string;
  is_flagged?: number | boolean;
  flag_reason?: string | null;
  approval_request_status?: "none" | "requested" | "approved" | "denied" | string;
  approval_request_note?: string | null;
  approval_requested_at?: string | null;
  created_at?: string;
};

type Props = {
  links: UrlModerationRow[];
  onAction: (id: number, action: "activate" | "pause" | "block" | "delete" | "approve_request" | "deny_request") => void;
};

type SortKey = "date_desc" | "date_asc" | "clicks_desc" | "clicks_asc" | "code_asc";

export default function UrlModerationTable({ links, onAction }: Props) {
  const [sort, setSort] = useState<SortKey>("date_desc");

  const sortedLinks = useMemo(() => {
    return [...links].sort((a, b) => {
      switch (sort) {
        case "date_asc":
          return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
        case "clicks_desc":
          return Number(b.total_clicks || 0) - Number(a.total_clicks || 0);
        case "clicks_asc":
          return Number(a.total_clicks || 0) - Number(b.total_clicks || 0);
        case "code_asc":
          return a.short_code.localeCompare(b.short_code);
        case "date_desc":
        default:
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime(); // Assuming IDs roughly correlate to date if date missing, or just 0
      }
    });
  }, [links, sort]);

  return (
    <div className="bg-card border border-border/60 rounded-xl shadow-sm overflow-hidden">
      <div className="p-5 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/20">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold text-foreground">URL Moderation</h2>
          <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-md border border-border/50">{links.length} Links</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
            <ArrowUpDown size={12} /> Sort:
          </span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="h-8 text-xs bg-background border border-border rounded-md px-2 outline-none focus:border-primary transition text-foreground"
          >
            <option value="date_desc">Newest First</option>
            <option value="date_asc">Oldest First</option>
            <option value="clicks_desc">Most Clicks</option>
            <option value="clicks_asc">Least Clicks</option>
            <option value="code_asc">Short Code (A-Z)</option>
          </select>
        </div>
      </div>

      {sortedLinks.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3 text-muted-foreground">
            <Ban size={24} />
          </div>
          <h3 className="text-sm font-medium text-foreground">No links found</h3>
          <p className="text-xs text-muted-foreground mt-1">
            There are no URL shortener links to display.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/20 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <th className="px-5 py-3 font-medium">Short Link</th>
                <th className="px-5 py-3 font-medium">Target / User</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Clicks</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {sortedLinks.map((link) => (
                <tr key={link.id} className="hover:bg-muted/30 transition-colors group">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-primary font-medium">/{link.short_code}</span>
                      <a
                        href={`${API_BASE}/s/${link.short_code}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="max-w-[300px]">
                      <a
                        href={link.destination_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-foreground hover:underline truncate block text-xs mb-1"
                        title={link.destination_url}
                      >
                        {link.destination_url}
                      </a>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <span className="truncate">{link.email}</span>
                      </p>

                      {link.flag_reason && (
                        <div className="flex items-start gap-1 mt-1 text-destructive text-[10px]">
                          <AlertTriangle size={10} className="mt-0.5" />
                          <span>Flagged: {link.flag_reason}</span>
                        </div>
                      )}

                      {link.approval_request_status === 'requested' && (
                        <div className="mt-2 text-[10px] bg-amber-500/10 border border-amber-500/20 p-2 rounded text-amber-700 dark:text-amber-400">
                          <strong>Appeal:</strong> {link.approval_request_note || "No note"}
                          <div className="flex items-center gap-1 mt-1 opacity-70">
                            <Clock size={8} /> {link.approval_requested_at}
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={
                      "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase " +
                      (link.status === "active"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : link.status === "paused"
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          : "bg-destructive/10 text-destructive")
                    }>
                      {link.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono text-xs">
                    {Number(link.total_clicks || 0).toLocaleString()}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <a
                        href={`/admin/url-analytics/${link.id}`}
                        className="p-1.5 h-7 w-7 inline-flex items-center justify-center rounded border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        title="Analytics"
                      >
                        <BarChart2 size={14} />
                      </a>

                      {link.approval_request_status === 'requested' ? (
                        <>
                          <button
                            onClick={() => onAction(link.id, "approve_request")}
                            className="h-7 px-2 rounded-md bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 text-[10px] font-bold transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => onAction(link.id, "deny_request")}
                            className="h-7 px-2 rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20 text-[10px] font-bold transition-colors"
                          >
                            Deny
                          </button>
                        </>
                      ) : (
                        <>
                          {/* Only show Activate if NOT active */}
                          {link.status !== 'active' && (
                            <button
                              onClick={() => onAction(link.id, "activate")}
                              title="Activate"
                              className="p-1.5 h-7 w-7 inline-flex items-center justify-center rounded border border-border text-emerald-600 hover:bg-emerald-500/10 transition-colors"
                            >
                              <CheckCircle2 size={14} />
                            </button>
                          )}

                          {/* Only show Pause if NOT paused/blocked/expired? Or just let them pause active? */}
                          {link.status === 'active' && (
                            <button
                              onClick={() => onAction(link.id, "pause")}
                              title="Pause"
                              className="p-1.5 h-7 w-7 inline-flex items-center justify-center rounded border border-border text-amber-600 hover:bg-amber-500/10 transition-colors"
                            >
                              <PauseCircle size={14} />
                            </button>
                          )}

                          {/* Block is always an option unless already blocked? logic can vary, let's keep it simple or hide if blocked */}
                          {link.status !== 'blocked' && (
                            <button
                              onClick={() => onAction(link.id, "block")}
                              title="Block"
                              className="p-1.5 h-7 w-7 inline-flex items-center justify-center rounded border border-border text-destructive hover:bg-destructive/10 transition-colors"
                            >
                              <Ban size={14} />
                            </button>
                          )}

                          <button
                            onClick={() => onAction(link.id, "delete")}
                            title="Delete"
                            className="p-1.5 h-7 w-7 inline-flex items-center justify-center rounded border border-destructive/30 text-destructive hover:bg-destructive/20 transition-colors ml-1"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
