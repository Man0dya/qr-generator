"use client";

import { useMemo, useState } from "react";
import { Crown, Search, Trash2, Users, AlertTriangle } from "lucide-react";

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
    <div className="bg-card border border-border/60 rounded-xl shadow-sm overflow-hidden">
      <div className="p-5 border-b border-border/60 bg-muted/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 text-primary rounded-lg shrink-0">
            <Users size={18} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground">Team Management</h2>
            <p className="text-xs text-muted-foreground">Manage workspaces and teams</p>
          </div>
        </div>

        <div className="relative w-64 max-w-full">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search team or owner"
            className="h-9 w-full pl-9 pr-3 text-sm bg-background border border-border rounded-md outline-none focus:border-primary transition text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-primary/20"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border/60 bg-muted/20 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <th className="px-5 py-3 font-medium">Team Name</th>
              <th className="px-5 py-3 font-medium">Owner</th>
              <th className="px-5 py-3 font-medium">Members</th>
              <th className="px-5 py-3 font-medium">Created</th>
              <th className="px-5 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {rows.length === 0 ? (
              <tr>
                <td className="px-5 py-12 text-center text-muted-foreground" colSpan={5}>
                  <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3 opacity-50">
                    <Users size={24} />
                  </div>
                  <p>No teams found.</p>
                </td>
              </tr>
            ) : (
              rows.map((team) => (
                <tr key={team.id} className="hover:bg-muted/30 transition-colors group">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500 font-bold text-xs shrink-0">
                        {team.name.charAt(0).toUpperCase()}
                      </span>
                      <span className="font-semibold text-foreground">{team.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground">
                    <div className="inline-flex items-center gap-1.5">
                      <Crown size={12} className="text-amber-500" />
                      <span className="truncate max-w-[200px]" title={team.owner_email}>{team.owner_email || "Unknown"}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-muted border border-border text-xs">
                      {Number(team.member_count || 0)} members
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground">{new Date(team.created_at).toLocaleDateString()}</td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => onAction(team.id, "delete")}
                      className="inline-flex items-center justify-center h-8 w-8 rounded border border-destructive/20 text-destructive hover:bg-destructive/10 transition-colors"
                      title="Delete Team"
                    >
                      <Trash2 size={14} />
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
