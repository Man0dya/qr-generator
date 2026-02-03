"use client";

import { useEffect, useState } from "react";
import { Save, User, Mail, CheckCircle2, AlertCircle } from "lucide-react";

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      const u = JSON.parse(stored);
      setUser(u);
      setName(u.name || "");
      setEmail(u.email || "");
    }
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess("");
    setError("");

    try {
      const res = await fetch("http://localhost:8000/update_profile.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, name, email }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        localStorage.setItem("user", JSON.stringify(data.user));
        setUser(data.user);
        setSuccess("Saved successfully");
        setTimeout(() => window.location.reload(), 800);
      } else {
        setError(data.error || "Update failed");
      }
    } catch (err) {
      setError("Server connection failed");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div className="p-8 text-slate-500 animate-pulse">Loading...</div>;

  const displayName = name || user.email;

  return (
    <div className="max-w-md mx-auto pb-20 mt-6">
      
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Account Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Update your profile details below.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
        
        {/* Profile Avatar Header*/}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
            <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-md">
                {displayName.charAt(0).toUpperCase()}
            </div>
            <div>
                <h3 className="text-lg font-bold text-slate-900 truncate max-w-[200px]">{displayName}</h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase tracking-wide mt-1">
                    {user.role} Plan
                </span>
            </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
            
            {/* Name Input */}
            <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-900 uppercase tracking-wide">Full Name</label>
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition">
                        <User size={18} />
                    </div>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition text-sm font-medium"
                        placeholder="Your Name"
                    />
                </div>
            </div>

            {/* Email Input */}
            <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-900 uppercase tracking-wide">Email Address</label>
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition">
                        <Mail size={18} />
                    </div>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition text-sm font-medium"
                    />
                </div>
            </div>

            {/* Notifications (Compact) */}
            {success && (
                <div className="bg-emerald-50 text-emerald-700 px-3 py-2 rounded-lg flex items-center gap-2 text-xs font-bold border border-emerald-100 animate-in fade-in slide-in-from-top-1">
                    <CheckCircle2 size={14} /> {success}
                </div>
            )}

            {error && (
                <div className="bg-red-50 text-red-600 px-3 py-2 rounded-lg flex items-center gap-2 text-xs font-bold border border-red-100 animate-in fade-in slide-in-from-top-1">
                    <AlertCircle size={14} /> {error}
                </div>
            )}

            {/* Action Buttons */}
            <div className="pt-4 flex justify-end">
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition shadow-lg shadow-slate-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed text-sm"
                >
                    {loading ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <>Save Changes <Save size={16} /></>
                    )}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
}