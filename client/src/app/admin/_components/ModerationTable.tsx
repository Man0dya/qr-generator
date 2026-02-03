"use client";

import { useRouter } from "next/navigation";
import { ShieldAlert, CheckCircle, Ban, BarChart2, Flag } from "lucide-react";

type QrRow = {
    id: number;
    short_code: string;
    destination_url: string;
    status: "active" | "banned" | "paused";
    creator?: string;
    is_flagged?: number | boolean;
    flag_reason?: string | null;
    flagged_at?: string | null;
};

type Props = {
    qrs: QrRow[];
    onToggleStatus: (id: number, action: "ban" | "activate" | "approve") => void;
    analyticsBasePath?: string;
};

export default function ModerationTable({
    qrs,
    onToggleStatus,
    analyticsBasePath = "/admin",
}: Props) {
  const router = useRouter();

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2 text-slate-500 text-sm">
            <ShieldAlert size={16} /> Global link monitoring.
        </div>
        <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase">Short Code</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase">Target URL</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase">Creator</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase text-right">Action</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {qrs.map((q) => (
                    <tr key={q.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-4 font-mono text-indigo-600 font-bold">/{q.short_code}</td>
                        <td className="p-4 text-sm text-slate-500 max-w-xs truncate" title={q.destination_url}>{q.destination_url}</td>
                        <td className="p-4 text-sm text-slate-500">{q.creator}</td>
                        <td className="p-4">
                                                        <div className="flex items-center gap-2">
                                                            {q.status === 'active' ? (
                                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700"><CheckCircle size={12}/> Active</span>
                                                            ) : q.status === 'paused' ? (
                                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">Paused</span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700"><Ban size={12}/> Banned</span>
                                                            )}

                                                            {q.is_flagged ? (
                                                                <span
                                                                    title={q.flag_reason || "Flagged"}
                                                                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-700"
                                                                >
                                                                    <Flag size={12} /> Flagged
                                                                </span>
                                                            ) : null}
                                                        </div>
                        </td>
                        <td className="p-4 text-right">
                            <div className="flex justify-end gap-2">
                                <button 
                                    onClick={() => router.push(`${analyticsBasePath}/analytics/${q.id}`)}
                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                >
                                    <BarChart2 size={18} />
                                </button>
                                <button 
                                                                    onClick={() => onToggleStatus(q.id, q.status === 'active' ? 'ban' : 'activate')}
                                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                                                                            q.status === 'active' ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                                                    }`}
                                >
                                  {q.status === 'active' ? "Ban Link" : "Activate"}
                                </button>

                                                                {q.is_flagged ? (
                                                                    <button
                                                                        onClick={() => onToggleStatus(q.id, 'approve')}
                                                                        className="px-3 py-1.5 rounded-lg text-xs font-bold transition bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                                                                        title={q.flag_reason || undefined}
                                                                    >
                                                                        Approve
                                                                    </button>
                                                                ) : null}
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
  );
}