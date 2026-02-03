"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, BarChart2, ExternalLink, Flag } from "lucide-react";

type UserQrRow = {
  id: number;
  short_code: string;
  destination_url: string;
  status: "active" | "banned" | "paused";
  created_at: string;
  updated_at: string;
  total_scans: number | string;
  is_flagged?: number | string | boolean;
  flag_reason?: string | null;
  flagged_at?: string | null;
};

type Props = {
  userId: number;
  analyticsBasePath: string;
  onBack: () => void;
};

function normalizeBool(value: unknown): boolean {
  if (value === true) return true;
  if (value === false) return false;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") return value !== "0" && value.toLowerCase() !== "false" && value !== "";
  return false;
}

export default function UserQrsView({ userId, analyticsBasePath, onBack }: Props) {
  const router = useRouter();
  const [rows, setRows] = useState<UserQrRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const url = new URL("http://localhost:8000/get_user_qrs_admin.php");
        url.searchParams.set("user_id", String(userId));
        const res = await fetch(url.toString());
        const data = await res.json();
        if (!data.success) {
          setError(data.error || "Failed to load user QR codes.");
          setRows([]);
        } else {
          setRows((data.data || []) as UserQrRow[]);
        }
      } catch {
        setError("Unable to connect to server.");
        setRows([]);
      } finally {
        setLoading(false);
      }
    };

    if (userId > 0) run();
  }, [userId]);

  const totalLinks = rows.length;
  const totalScans = useMemo(() => {
    return rows.reduce((acc, r) => acc + Number(r.total_scans || 0), 0);
  }, [rows]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 transition"
          >
            <ArrowLeft size={16} /> Back to Users
          </button>
          <h2 className="text-xl font-bold text-slate-900 mt-2">QR Codes for User #{userId}</h2>
          <p className="text-sm text-slate-500">{totalLinks} links • {totalScans} total scans</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase">Short Code</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase">Target URL</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase">Scans</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase">Created</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td className="p-6 text-slate-500" colSpan={6}>
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td className="p-6 text-slate-500" colSpan={6}>
                    No QR codes found.
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  const isFlagged = normalizeBool(r.is_flagged);
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-4 font-mono text-indigo-600 font-bold">/{r.short_code}</td>
                      <td className="p-4 text-sm text-slate-600 max-w-[520px] truncate" title={r.destination_url}>
                        {r.destination_url}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              r.status === "active"
                                ? "bg-emerald-100 text-emerald-700"
                                : r.status === "paused"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-red-100 text-red-700"
                            }`}
                          >
                            {r.status}
                          </span>
                          {isFlagged ? (
                            <span
                              title={r.flag_reason || "Flagged"}
                              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-700"
                            >
                              <Flag size={12} /> Flagged
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="p-4 text-sm text-slate-700">{Number(r.total_scans || 0)}</td>
                      <td className="p-4 text-sm text-slate-500">{new Date(r.created_at).toLocaleDateString()}</td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => router.push(`${analyticsBasePath}/analytics/${r.id}`)}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                            title="View analytics"
                          >
                            <BarChart2 size={18} />
                          </button>
                          <a
                            href={r.destination_url}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                            title="Open target"
                          >
                            <ExternalLink size={18} />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
