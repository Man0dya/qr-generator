"use client";

import { useState, useEffect } from "react";
import { Plus, Users, Trash2, UserPlus, Shield, Crown } from "lucide-react";
import { apiFetch } from "@/lib/api";

type TeamMember = {
    id: number;
    name: string;
    email: string;
    role: "admin" | "editor" | "viewer";
    joined_at: string;
};

type Team = {
    id: number;
    name: string;
    owner_id: number;
    role: "owner" | "admin" | "editor" | "viewer";
};

export default function TeamsPage() {
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTeam, setActiveTeam] = useState<Team | null>(null);
    const [members, setMembers] = useState<TeamMember[]>([]);

    // Forms
    const [newTeamName, setNewTeamName] = useState("");
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState("viewer");
    const [showCreate, setShowCreate] = useState(false);

    useEffect(() => {
        fetchTeams();
    }, []);

    const fetchTeams = async () => {
        try {
            const res = await apiFetch("/teams.php");
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

    const fetchTeamDetails = async (team: Team) => {
        setActiveTeam(team);
        try {
            const res = await apiFetch(`/teams.php?id=${team.id}`);
            const data = await res.json();
            if (data.success) {
                setMembers(data.members);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const createTeam = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTeamName) return;
        try {
            const res = await apiFetch("/teams.php", {
                method: "POST",
                body: JSON.stringify({ name: newTeamName })
            });
            const data = await res.json();
            if (data.success) {
                setNewTeamName("");
                setShowCreate(false);
                fetchTeams();
            }
        } catch (err) {
            alert("Failed to create team");
        }
    };

    const inviteMember = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeTeam || !inviteEmail) return;
        try {
            const res = await apiFetch("/teams.php", {
                method: "POST",
                body: JSON.stringify({ team_id: activeTeam.id, email: inviteEmail, role: inviteRole })
            });
            const data = await res.json();
            if (data.success) {
                setInviteEmail("");
                fetchTeamDetails(activeTeam);
                alert("Member added!");
            } else {
                alert(data.error || "Failed to add member");
            }
        } catch (err) {
            alert("Error inviting member");
        }
    };

    const removeMember = async (userId: number) => {
        if (!activeTeam || !confirm("Remove this member?")) return;
        try {
            await apiFetch(`/teams.php?team_id=${activeTeam.id}&member_id=${userId}`, { method: "DELETE" });
            setMembers(prev => prev.filter(m => m.id !== userId)); // Note: this logic assumes member_id in DELETE is user_id
            // But my API expects user_id for member_id param.
        } catch (err) {
            alert("Failed to remove");
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Loading teams...</div>;

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Team Workspaces</h1>
                    <p className="text-slate-500">Collaborate with your team on QR campaigns.</p>
                </div>
                <button onClick={() => setShowCreate(!showCreate)} className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-indigo-700 transition flex items-center gap-2">
                    <Plus size={20} /> New Team
                </button>
            </div>

            {showCreate && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-top-4">
                    <form onSubmit={createTeam} className="flex gap-4">
                        <input
                            placeholder="Team Name (e.g. Marketing)"
                            value={newTeamName}
                            onChange={e => setNewTeamName(e.target.value)}
                            className="flex-1 p-3 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                            autoFocus
                        />
                        <button type="submit" className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold">Create</button>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* TEAM LIST */}
                <div className="space-y-4">
                    <h3 className="font-bold text-slate-400 text-xs uppercase tracking-wide px-2">Your Teams</h3>
                    {teams.length === 0 && <p className="text-slate-500 text-sm px-2">No teams yet.</p>}
                    {teams.map(team => (
                        <button
                            key={team.id}
                            onClick={() => fetchTeamDetails(team)}
                            className={`w-full text-left p-4 rounded-xl border transition flex items-center justify-between group ${activeTeam?.id === team.id ? 'bg-white border-indigo-500 shadow-md ring-1 ring-indigo-500/20' : 'bg-slate-50 border-slate-200 hover:bg-white hover:border-slate-300'}`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${team.role === 'owner' ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'}`}>
                                    {team.role === 'owner' ? <Crown size={18} /> : <Users size={18} />}
                                </div>
                                <span className="font-bold text-slate-700">{team.name}</span>
                            </div>
                        </button>
                    ))}
                </div>

                {/* TEAM DETAILS */}
                <div className="md:col-span-2">
                    {activeTeam ? (
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                                <h2 className="text-xl font-bold text-slate-800">{activeTeam.name} <span className="text-slate-400 font-normal text-sm ml-2">Members</span></h2>
                                {(activeTeam.role === 'owner' || activeTeam.role === 'admin') && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-slate-400">Invite:</span>
                                    </div>
                                )}
                            </div>

                            {/* INVITE FORM */}
                            {(activeTeam.role === 'owner' || activeTeam.role === 'admin') && (
                                <div className="p-4 bg-slate-50 border-b border-slate-100">
                                    <form onSubmit={inviteMember} className="flex gap-2">
                                        <input
                                            type="email"
                                            placeholder="colleague@example.com"
                                            value={inviteEmail}
                                            onChange={e => setInviteEmail(e.target.value)}
                                            className="flex-1 p-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                                        />
                                        <select
                                            value={inviteRole}
                                            onChange={e => setInviteRole(e.target.value)}
                                            className="p-2.5 text-sm border border-slate-200 rounded-lg outline-none bg-white"
                                        >
                                            <option value="viewer">Viewer</option>
                                            <option value="editor">Editor</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                        <button type="submit" className="p-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                                            <UserPlus size={18} />
                                        </button>
                                    </form>
                                </div>
                            )}

                            <div className="divide-y divide-slate-100">
                                {members.map(member => (
                                    <div key={member.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                                                {member.email.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900">{member.name || member.email}</p>
                                                <p className="text-xs text-slate-500">{member.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-xs font-bold px-2 py-1 bg-slate-100 text-slate-600 rounded uppercase">{member.role}</span>
                                            {(activeTeam.role === 'owner' || activeTeam.role === 'admin') && (
                                                <button onClick={() => removeMember(member.id)} className="text-slate-400 hover:text-red-600 transition">
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {members.length === 0 && <p className="p-8 text-center text-slate-400 text-sm">No other members in this team.</p>}
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 p-12 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                            <Users size={48} className="mb-4 text-slate-300" />
                            <p>Select a team to view members</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
