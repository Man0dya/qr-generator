"use client";

import { useState, useEffect } from "react";
import { Key, Trash2, Plus, Copy, Check, Terminal } from "lucide-react";
import { apiFetch } from "@/lib/api";

type ApiKey = {
    id: number;
    name: string;
    api_key: string;
    last_used_at: string | null;
    created_at: string;
};

export default function DevelopersPage() {
    const [keys, setKeys] = useState<ApiKey[]>([]);
    const [loading, setLoading] = useState(true);
    const [newKeyName, setNewKeyName] = useState("");
    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    useEffect(() => {
        fetchKeys();
    }, []);

    const fetchKeys = async () => {
        try {
            const res = await apiFetch("/api_keys.php");
            const data = await res.json();
            if (data.success) {
                setKeys(data.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const createKey = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newKeyName) return;
        try {
            const res = await apiFetch("/api_keys.php", {
                method: "POST",
                body: JSON.stringify({ name: newKeyName })
            });
            const data = await res.json();
            if (data.success) {
                setNewKeyName("");
                fetchKeys();
            }
        } catch (err) {
            alert("Failed to create key");
        }
    };

    const deleteKey = async (id: number) => {
        if (!confirm("Revoke this API Key? Any applications using it will stop working.")) return;
        try {
            await apiFetch(`/api_keys.php?id=${id}`, { method: "DELETE" });
            setKeys(prev => prev.filter(k => k.id !== id));
        } catch (err) {
            alert("Failed to delete");
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedKey(text);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Developer API</h1>
                <p className="text-slate-500">Manage API keys and view documentation to integrate QR generation into your apps.</p>
            </div>

            {/* CREATE KEY */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Key className="text-indigo-600" size={20} /> Create New API Key
                </h2>
                <form onSubmit={createKey} className="flex gap-4">
                    <input
                        placeholder="Key Name (e.g. My Mobile App)"
                        value={newKeyName}
                        onChange={e => setNewKeyName(e.target.value)}
                        className="flex-1 p-3 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                    />
                    <button type="submit" className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 transition">
                        <Plus size={18} /> Create Key
                    </button>
                </form>
            </div>

            {/* KEY LIST */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                    <h3 className="font-bold text-slate-900">Your API Keys</h3>
                </div>
                <div className="divide-y divide-slate-100">
                    {keys.map(key => (
                        <div key={key.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-800">{key.name}</span>
                                    <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">Active</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <code className="bg-slate-100 px-2 py-1 rounded text-sm text-slate-600 font-mono">{key.api_key}</code>
                                    <button onClick={() => copyToClipboard(key.api_key)} className="text-slate-400 hover:text-indigo-600 transition">
                                        {copiedKey === key.api_key ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                                    </button>
                                </div>
                                <p className="text-xs text-slate-400">Created: {new Date(key.created_at).toLocaleDateString()} • Last used: {key.last_used_at ? new Date(key.last_used_at).toLocaleDateString() : 'Never'}</p>
                            </div>
                            <button onClick={() => deleteKey(key.id)} className="text-slate-400 hover:text-red-600 transition p-2 hover:bg-red-50 rounded-lg self-start md:self-center">
                                <Trash2 size={20} />
                            </button>
                        </div>
                    ))}
                    {keys.length === 0 && <p className="p-8 text-center text-slate-400">No API keys generated yet.</p>}
                </div>
            </div>

            {/* DOCUMENTATION */}
            <div className="bg-slate-900 text-slate-300 rounded-2xl overflow-hidden shadow-lg">
                <div className="p-6 border-b border-white/10 flex items-center gap-2">
                    <Terminal size={20} className="text-emerald-400" />
                    <h3 className="font-bold text-white">API Documentation</h3>
                </div>
                <div className="p-6 space-y-6">
                    <div>
                        <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Endpoint</h4>
                        <div className="bg-black/30 p-4 rounded-xl font-mono text-sm flex gap-4">
                            <span className="text-emerald-400 font-bold">POST</span>
                            <span className="text-slate-400">/server/api/v1/create.php</span>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Headers</h4>
                        <div className="bg-black/30 p-4 rounded-xl font-mono text-sm space-y-2">
                            <div className="flex justify-between">
                                <span className="text-indigo-400">Authorization</span>
                                <span className="text-slate-400">Bearer &lt;YOUR_API_KEY&gt;</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-indigo-400">Content-Type</span>
                                <span className="text-slate-400">application/json</span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Example Request</h4>
                        <pre className="bg-black/30 p-4 rounded-xl font-mono text-sm overflow-x-auto text-slate-300">
                            {`curl -X POST https://qr.yourdomain.com/server/api/v1/create.php \\
  -H "Authorization: Bearer pk_123456789..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://example.com",
    "domain_id": 1
  }'`}
                        </pre>
                    </div>
                </div>
            </div>
        </div>
    );
}
