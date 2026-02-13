"use client";

import { Ban, CheckCircle2, PauseCircle } from "lucide-react";

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
};

export default function UrlModerationTable({
  links,
  onAction,
}: {
  links: UrlModerationRow[];
  onAction: (id: number, action: "activate" | "pause" | "block" | "approve_request" | "deny_request") => void;
}) {
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-border bg-muted/40 text-sm font-bold text-foreground">
        URLMD Link Moderation
      </div>

      {links.length === 0 ? (
        <div className="p-4 text-sm text-muted-foreground">No URL links found.</div>
      ) : (
        <div className="divide-y divide-border">
          {links.map((link) => (
            <div key={link.id} className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-bold text-foreground">/{link.short_code}</p>
                <p className="text-xs text-muted-foreground truncate">{link.email}</p>
                <p className="text-xs text-foreground break-all mt-1">{link.destination_url}</p>
                <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                  <span className="uppercase">{link.status}</span>
                  <span>Clicks: {Number(link.total_clicks || 0)}</span>
                </div>
                {link.flag_reason ? <p className="text-xs text-amber-600 mt-1">Reason: {link.flag_reason}</p> : null}

                {link.approval_request_status === 'requested' && (
                  <div className="mt-2 text-xs bg-amber-50 border border-amber-200 p-2 rounded text-amber-800">
                    <strong>Appeal Pending:</strong> {link.approval_request_note || "No note provided"}
                    <br />
                    <span className="text-[10px] text-amber-600">{link.approval_requested_at}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 shrink-0 items-end">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onAction(link.id, "activate")}
                    className="h-8 px-3 rounded border border-emerald-300 text-emerald-700 hover:bg-emerald-50 text-xs inline-flex items-center gap-1"
                  >
                    <CheckCircle2 size={14} /> Activate
                  </button>
                  <button
                    onClick={() => onAction(link.id, "pause")}
                    className="h-8 px-3 rounded border border-amber-300 text-amber-700 hover:bg-amber-50 text-xs inline-flex items-center gap-1"
                  >
                    <PauseCircle size={14} /> Pause
                  </button>
                  <button
                    onClick={() => onAction(link.id, "block")}
                    className="h-8 px-3 rounded border border-destructive/40 text-destructive hover:bg-destructive/10 text-xs inline-flex items-center gap-1"
                  >
                    <Ban size={14} /> Block
                  </button>
                </div>

                {link.approval_request_status === 'requested' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onAction(link.id, "approve_request")}
                      className="h-7 px-2 rounded bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold"
                    >
                      Approve Appeal
                    </button>
                    <button
                      onClick={() => onAction(link.id, "deny_request")}
                      className="h-7 px-2 rounded bg-destructive text-white hover:bg-destructive/90 text-xs font-bold"
                    >
                      Deny
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
