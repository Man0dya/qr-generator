"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { QRCodeCanvas } from "qrcode.react";
import { 
  BarChart2, Edit, Trash2, ExternalLink, 
  QrCode, Plus, ArrowUpRight, Clock, Download
} from "lucide-react";

export default function DashboardPage() {
  const [qrs, setQrs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

  const handleDownloadQr = (qrId: number, shortCode: string) => {
    const canvas = document.getElementById(`qr-canvas-${qrId}`) as HTMLCanvasElement | null;
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = `qr-${shortCode}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  // 1. Fetch Data
  const fetchQRs = async () => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    setUser(storedUser);
    if (!storedUser.id) return;

    try {
      const res = await fetch(`http://localhost:8000/get_dashboard_data.php?user_id=${storedUser.id}`);
      const data = await res.json();
      if (data.success) {
        setQrs(data.data);
      }
    } catch (err) {
      console.error("Failed to load QRs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQRs();
  }, []);

  // 2. Handle Delete Logic
  const handleDelete = async (qrId: number) => {
    if (!confirm("Are you sure you want to delete this QR code? This action cannot be undone.")) {
      return;
    }

    try {
      const res = await fetch("http://localhost:8000/delete_qr.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qr_id: qrId, user_id: user.id }),
      });

      const data = await res.json();
      if (data.success) {
        setQrs(qrs.filter(q => q.id !== qrId));
      } else {
        alert(data.error || "Failed to delete");
      }
    } catch (err) {
      alert("Server error");
    }
  };

  // Quick Stats
  const totalScans = qrs.reduce((acc, curr) => acc + parseInt(curr.total_scans || 0), 0);
  const activeLinks = qrs.filter(q => q.status === 'active').length;

  if (loading) return <div className="p-8 text-slate-500 animate-pulse">Loading your dashboard...</div>;

  return (
    <div className="space-y-10">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-slate-500 mt-2">Welcome back! Here's what's happening with your links.</p>
        </div>
        <Link 
          href="/dashboard/create" 
          className="bg-indigo-600 text-white px-5 py-3 rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 font-medium flex items-center gap-2"
        >
          <Plus size={20} /> Create New QR
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                    <QrCode size={24} />
                </div>
                <div>
                    <p className="text-slate-500 text-sm font-medium">Total QR Codes</p>
                    <p className="text-2xl font-bold text-slate-900">{qrs.length}</p>
                </div>
            </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                    <ArrowUpRight size={24} />
                </div>
                <div>
                    <p className="text-slate-500 text-sm font-medium">Total Scans</p>
                    <p className="text-2xl font-bold text-slate-900">{totalScans}</p>
                </div>
            </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                    <Clock size={24} />
                </div>
                <div>
                    <p className="text-slate-500 text-sm font-medium">Active Links</p>
                    <p className="text-2xl font-bold text-slate-900">{activeLinks}</p>
                </div>
            </div>
        </div>
      </div>

      {/* --- QR LIST --- */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-6">Recent Codes</h2>
        
        {qrs.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-slate-300">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                <QrCode size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">No QR Codes yet</h3>
            <p className="text-slate-500 mb-6 max-w-sm mx-auto">Create your first dynamic QR code to start tracking connections.</p>
            <Link 
              href="/dashboard/create" 
              className="text-indigo-600 font-medium hover:underline"
            >
              Create one now &rarr;
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {qrs.map((qr) => (
              <div key={qr.id} className="group bg-white p-5 rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-100 transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-6">
                
                {/* Left: Icon & Info */}
                <div className="flex items-start gap-5">
                    <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center shrink-0 overflow-hidden relative group">
                        {qr?.short_code ? (
                          <button
                            type="button"
                            onClick={() => handleDownloadQr(qr.id, qr.short_code)}
                            className="w-16 h-16 p-1 flex items-center justify-center hover:bg-slate-100 active:bg-slate-200 transition"
                            title="Download QR"
                          >
                            <QRCodeCanvas
                              id={`qr-canvas-${qr.id}`}
                              value={`${apiBaseUrl}/redirect.php?c=${qr.short_code}`}
                              size={64}
                              className="block"
                            />

                            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-slate-900/45 opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="flex items-center gap-1.5 text-white text-xs font-bold">
                                <Download size={14} />
                              </div>
                            </div>
                          </button>
                        ) : (
                          <QrCode className="text-slate-400" />
                        )}
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <span className="font-mono font-bold text-indigo-600 text-lg">/{qr.short_code}</span>
                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                                qr.status === 'active' 
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                                : 'bg-red-50 text-red-600 border-red-100'
                            }`}>
                                {qr.status}
                            </span>
                        </div>

                        <div className="space-y-1">
                          {/* QR tracking link (the one encoded into the QR) */}
                          <a
                            href={`${apiBaseUrl}/redirect.php?c=${qr.short_code}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-slate-500 text-sm hover:text-indigo-600 hover:underline flex items-center gap-1 max-w-[250px] md:max-w-md truncate transition"
                            title={`${apiBaseUrl}/redirect.php?c=${qr.short_code}`}
                          >
                            {`${apiBaseUrl}/redirect.php?c=${qr.short_code}`} <ExternalLink size={12} />
                          </a>

                          {/* Destination (secondary) */}
                          <a
                            href={qr.destination_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-slate-400 hover:text-slate-600 transition max-w-[250px] md:max-w-md truncate block"
                            title={qr.destination_url}
                          >
                            Destination: {qr.destination_url}
                          </a>
                        </div>

                        <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                            <Clock size={12} /> Created: {new Date(qr.created_at).toLocaleDateString()}
                        </p>
                    </div>
                </div>

                {/* Right: Stats & Actions */}
                <div className="flex items-center justify-between md:justify-end gap-8 w-full md:w-auto border-t md:border-t-0 border-slate-50 pt-4 md:pt-0">
                    <div className="text-center md:text-right px-4">
                        <p className="text-2xl font-bold text-slate-900">{qr.total_scans}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Scans</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link 
                            href={`/dashboard/analytics/${qr.id}`}
                            className="p-2.5 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition tooltip border border-transparent hover:border-indigo-100" 
                            title="Analytics"
                        >
                            <BarChart2 size={18} />
                        </Link>
                        <Link 
                            href={`/dashboard/edit/${qr.id}`}
                            className="p-2.5 text-slate-500 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition border border-transparent hover:border-blue-100" 
                            title="Edit URL"
                        >
                            <Edit size={18} />
                        </Link>
                        <button 
                            onClick={() => handleDelete(qr.id)}
                            className="p-2.5 text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition border border-transparent hover:border-red-100" 
                            title="Delete"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}