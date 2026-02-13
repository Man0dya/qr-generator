"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Users, Trash2, Search, Crown } from "lucide-react";

type TeamRow = {
    id: number;
    owner_id: number;
    name: string;
    created_at: string;
    owner_email?: string;
    owner_name?: string;
    member_count: number;
};

export default function TeamsTable() {
    const [teams, setTeams] = useState<TeamRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const fetchTeams = async () => {
        setLoading(true);
        try {
            const res = await apiFetch("/admin_get_teams.php");
            const data = await res.json();
            if (data.success) {
                setTeams(data.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTeams();
    }, []);

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this team? All members will be removed.")) return;
        try {
            await apiFetch("/super_admin_action.php", {
                method: "POST",
                body: JSON.stringify({ action: "delete_team", target_id: id })
            });
            fetchTeams();
        } catch (err) {
            alert("Failed to delete team");
        }
    };

    const filtered = teams.filter(t =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.owner_email?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-foreground">Teams</h2>
                    <p className="text-sm text-muted-foreground">{teams.length} teams created</p>
                </div>
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                    <input
                        placeholder="Search teams..."
                        className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground placeholder:text-muted-foreground"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-left">
                        <thead className="bg-muted/50 border-b border-border">
                            <tr>
                                <th className="p-4 text-xs font-bold text-muted-foreground uppercase">Team Name</th>
                                <th className="p-4 text-xs font-bold text-muted-foreground uppercase">Owner</th>
                                <th className="p-4 text-xs font-bold text-muted-foreground uppercase">Members</th>
                                <th className="p-4 text-xs font-bold text-muted-foreground uppercase">Created</th>
                                <th className="p-4 text-xs font-bold text-muted-foreground uppercase text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Loading teams...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No teams found.</td></tr>
                            ) : (
                                filtered.map(team => (
                                    <tr key={team.id} className="hover:bg-muted/50 transition">
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 bg-indigo-500/10 text-indigo-500 rounded-lg">
                                                    <Users size={16} />
                                                </div>
                                                <span className="font-semibold text-foreground">{team.name}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <Crown size={14} className="text-amber-500" />
                                                <div>
                                                    <div className="text-sm font-medium text-foreground">{team.owner_email}</div>
                                                    {team.owner_name && <div className="text-xs text-muted-foreground">{team.owner_name}</div>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                                                {team.member_count} members
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm text-muted-foreground">
                                            {new Date(team.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={() => handleDelete(team.id)}
                                                className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition"
                                                title="Delete Team"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
