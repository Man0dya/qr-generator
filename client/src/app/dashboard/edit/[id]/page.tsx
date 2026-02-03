"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, Link as LinkIcon, Save, X, 
  Info, QrCode, Calendar, Globe, ExternalLink 
} from "lucide-react";

export default function EditQRPage() {
  const params = useParams();
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [qrInfo, setQrInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 1. Load current data
  useEffect(() => {
    fetch(`http://localhost:8000/get_analytics_details.php?qr_id=${params.id}`)
      .then(res => res.json())
      .then(data => {
        if(data.success) {
            setUrl(data.qr_info.destination_url);
            setQrInfo(data.qr_info);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [params.id]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    setSaving(true);
    
    try {
        await fetch("http://localhost:8000/update_qr.php", {
            method: "POST",
            body: JSON.stringify({ qr_id: params.id, user_id: user.id, url }),
        });
        router.push("/dashboard");
    } catch (err) {
        alert("Failed to update");
        setSaving(false);
    }
  };

  if(loading) return (
    <div className="flex items-center justify-center h-64 text-slate-400 gap-2">
        <div className="w-5 h-5 border-2 border-slate-300 border-t-indigo-600 rounded-full animate-spin"/>
        Loading QR details...
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto pb-20">
      
      {/* --- HEADER --- */}
      <div className="mb-8">
        <Link 
            href="/dashboard" 
            className="inline-flex items-center text-sm text-slate-500 hover:text-indigo-600 mb-4 transition"
        >
            <ArrowLeft size={16} className="mr-1" /> Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Edit Destination</h1>
        <p className="text-slate-500 mt-1">Update where your QR code sends users.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* --- LEFT: EDIT FORM --- */}
        <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8">
                
                <form onSubmit={handleUpdate}>
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">New Destination URL</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition">
                                <LinkIcon size={18} />
                            </div>
                            <input
                                type="url"
                                required
                                value={url} 
                                onChange={e => setUrl(e.target.value)}
                                className="block w-full pl-10 pr-3 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition shadow-sm"
                            />
                        </div>
                    </div>

                    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-start gap-3 mb-8">
                        <Info className="text-indigo-600 shrink-0 mt-0.5" size={20} />
                        <div>
                            <p className="text-sm font-bold text-indigo-900">Dynamic Update</p>
                            <p className="text-sm text-indigo-700 mt-1">
                                Changing this link will <strong>not</strong> change the appearance of your QR code. 
                                You do not need to reprint anything.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
                        <button 
                            type="submit" 
                            disabled={saving}
                            className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 flex items-center gap-2 disabled:opacity-70"
                        >
                            {saving ? "Saving..." : <><Save size={18} /> Save Changes</>}
                        </button>
                        <Link 
                            href="/dashboard"
                            className="text-slate-500 font-medium hover:text-slate-900 px-4 py-2 rounded-lg hover:bg-slate-50 transition flex items-center gap-2"
                        >
                            <X size={18} /> Cancel
                        </Link>
                    </div>
                </form>
            </div>
        </div>

        {/* --- RIGHT: CONTEXT CARD --- */}
        <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">QR Identity</h3>
                
                <div className="space-y-4">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-slate-50 rounded-lg text-slate-500">
                            <Globe size={18} />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-medium">Short Link</p>
                            <div className="flex items-center gap-1">
                                <p className="font-mono text-sm font-bold text-slate-900">/{qrInfo?.short_code}</p>
                                <ExternalLink size={12} className="text-slate-400" />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-slate-50 rounded-lg text-slate-500">
                            <Calendar size={18} />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-medium">Created On</p>
                            <p className="text-sm font-bold text-slate-900">
                                {qrInfo ? new Date(qrInfo.created_at).toLocaleDateString() : '...'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-slate-50 rounded-lg text-slate-500">
                            <QrCode size={18} />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-medium">Current Status</p>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 mt-1">
                                Active
                            </span>
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100">
                     <div className="w-full aspect-square bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 text-xs">
                        QR Pattern Preview
                     </div>
                     <p className="text-center text-xs text-slate-400 mt-2">Pattern remains locked</p>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
}