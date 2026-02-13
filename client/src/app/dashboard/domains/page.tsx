"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Globe, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { apiFetch } from "@/lib/api";

type Domain = {
    id: number;
    domain: string;
    status: "pending" | "active" | "invalid";
    created_at: string;
};

export default function DomainsPage() {
    const [domains, setDomains] = useState<Domain[]>([]);
    const [loading, setLoading] = useState(true);
    const [newDomain, setNewDomain] = useState("");
    const [adding, setAdding] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchDomains();
    }, []);

    const fetchDomains = async () => {
        try {
            const res = await apiFetch("/domains.php");
            const data = await res.json();
            if (data.success) {
                setDomains(data.data);
            }
        } catch (err) {
            console.error("Failed to fetch domains", err);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDomain.trim()) return;

        setAdding(true);
        setError(null);

        try {
            const res = await apiFetch("/domains.php", {
                method: "POST",
                body: JSON.stringify({ domain: newDomain }),
            });
            const data = await res.json();

            if (data.success) {
                setNewDomain("");
                fetchDomains();
            } else {
                setError(data.error || "Failed to add domain");
            }
        } catch (err) {
            setError("Failed to connect to server");
        } finally {
            setAdding(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure? Any QR codes using this domain will revert to default.")) return;
        try {
            await apiFetch(`/domains.php?id=${id}`, { method: "DELETE" });
            setDomains((prev) => prev.filter((d) => d.id !== id));
        } catch (err) {
            alert("Failed to delete domain");
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Loading domains...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Custom Domains</h1>
                <p className="text-slate-500">Connect your own domains to brand your short links.</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <form onSubmit={handleAdd} className="flex gap-4 items-start">
                    <div className="flex-1">
                        <div className="relative">
                            <Globe className="absolute left-3 top-3 text-slate-400" size={20} />
                            <input
                                type="text"
                                value={newDomain}
                                onChange={(e) => setNewDomain(e.target.value)}
                                placeholder="link.yourbrand.com"
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none"
                            />
                        </div>
                        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
                        <p className="mt-2 text-xs text-slate-500">
                            Point a CNAME record from your subdomain to <b>qr.yourserver.com</b> (or localhost)
                        </p>
                    </div>
                    <button
                        type="submit"
                        disabled={adding || !newDomain.trim()}
                        className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition disabled:opacity-50 flex items-center gap-2"
                    >
                        {adding ? "Adding..." : <><Plus size={20} /> Add Domain</>}
                    </button>
                </form>
            </div>

            <div className="grid gap-4">
                {domains.length === 0 ? (
                    <div className="text-center p-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <Globe className="mx-auto text-slate-300 mb-4" size={48} />
                        <p className="text-slate-500 font-medium">No custom domains connected yet.</p>
                    </div>
                ) : (
                    domains.map((d) => (
                        <div key={d.id} className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
                                    <Globe size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900">{d.domain}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        {d.status === 'active' ? (
                                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                                <CheckCircle size={12} /> Active
                                            </span>
                                        ) : d.status === 'pending' ? (
                                            <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                                                <Clock size={12} /> Pending Verification
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                                                <AlertCircle size={12} /> Invalid DNS
                                            </span>
                                        )}
                                        <span className="text-xs text-slate-400">Added on {new Date(d.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => handleDelete(d.id)}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                title="Remove Domain"
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
