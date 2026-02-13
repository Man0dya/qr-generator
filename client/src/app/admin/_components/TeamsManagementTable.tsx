"use client";

import { useMemo, useState } from "react";
import { Crown, Search, Trash2, Users } from "lucide-react";

type TeamRow = {
  id: number;
  owner_id: number;
  name: string;
  created_at: string;
  owner_email?: string;
  owner_name?: string;
  member_count: number | string;
};

type Props = {
  teams: TeamRow[];
  onAction: (id: number, action: "delete") => void;
};

export default function TeamsManagementTable({ teams, onAction }: Props) {
  const [query, setQuery] = useState("");

  const normalizedQuery = useMemo(() => query.trim().toLowerCase(), [query]);

  const rows = useMemo(() => {
    if (!normalizedQuery) return teams || [];
    return (teams || []).filter((team) =>
      [team.name, team.owner_email, team.owner_name]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }, [teams, normalizedQuery]);

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-border bg-muted/40 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="text-sm font-bold text-foreground">Team Management</div>

        <div className="relative w-64 max-w-full">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search team or owner"
            className="h-9 w-full pl-8 pr-3 text-sm bg-card border border-border rounded-lg outline-none focus:border-primary transition text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="p-4 text-xs font-bold text-muted-foreground uppercase">Team</th>
              <th className="p-4 text-xs font-bold text-muted-foreground uppercase">Owner</th>
              <th className="p-4 text-xs font-bold text-muted-foreground uppercase">Members</th>
              <th className="p-4 text-xs font-bold text-muted-foreground uppercase">Created</th>
              <th className="p-4 text-xs font-bold text-muted-foreground uppercase text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.length === 0 ? (
              <tr>
                <td className="p-6 text-muted-foreground" colSpan={5}>No teams found.</td>
              </tr>
            ) : (
              rows.map((team) => (
                <tr key={team.id} className="hover:bg-muted/40 transition">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500"><Users size={14} /></span>
                      <span className="font-semibold text-foreground">{team.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">
                    <div className="inline-flex items-center gap-1.5">
                      <Crown size={14} className="text-amber-500" /> {team.owner_email || "Unknown"}
                    </div>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">{Number(team.member_count || 0)}</td>
                  <td className="p-4 text-sm text-muted-foreground">{new Date(team.created_at).toLocaleDateString()}</td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => onAction(team.id, "delete")}
                      className="h-8 px-3 rounded border border-destructive/40 text-destructive hover:bg-destructive/10 text-xs inline-flex items-center gap-1"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
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
