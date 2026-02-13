"use client";

import { useState } from "react";
import { Upload, FileText, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { apiFetch } from "@/lib/api";

export default function BulkPage() {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setFile(e.target.files[0]);
            setResult(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        setLoading(true);

        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await apiFetch("/bulk_import.php", {
                method: "POST",
                body: formData,
                // Don't set Content-Type header manually for FormData, browser does it
            });
            // apiFetch in lib/api.ts likely sets JSON header by default.
            // We need to bypass JSON header for FormData.
            // Let's assume we need to handle this or modify apiFetch.
            // Actually, looking at previous views of api.ts, it sets 'Content-Type': 'application/json' if not formData.
            // But I can't see api.ts properly right now.
            // Assuming apiFetch checks input type?
            // If apiFetch sets default headers, I might need to override.
            // If I pass a FormData body to fetch, it automatically sets multipart/form-data with boundary.
            // If I force Content-Type: application/json, it will break.

            // Let's rely on apiFetch being smart or fetch acting normal.
            // If apiFetch forces JSON, I might need to use raw fetch with credentials.

        } catch (err) {
            // ...
        }

        // Using raw fetch for safety here since I can't easily verify apiFetch behavior
        try {
            // We need credentials for session
            // Get URL from helper or Env? The helper is internal.
            // I'll assume standard layout.
            // Actually, let's look at api.ts next tool call to be sure.
            // For now, I'll write the code assuming I can fix apiFetch or use a known pattern.

            // TEMPORARY: using raw fetch logic inline to ensure FormData works
            // But I need the API_BASE.
            // It's usually /server or similar.
            // I'll assume relative path worked for apiFetch so it's proxied or base URL is known.
            // actually NEXT_PUBLIC_API_BASE_URL is used.
            // I'll import API_BASE from lib/api
        } catch (e) { }

        // Real implementation below
    };

    const doUpload = async () => {
        if (!file) return;
        setLoading(true);

        // Using standard XMLHTTPRequest or fetch allows FormData
        // apiFetch might be strict.

        const formData = new FormData();
        formData.append("file", file);

        try {
            // We need to get the session cookie sent.
            // apiFetch wrapper usually handles this. 
            // If apiFetch checks for FormData, great. If not, I'll update api.ts.
            // I'll use apiFetch and hope/fix.
            const res = await apiFetch("/bulk_import.php", {
                method: "POST",
                body: formData,
                headers: {} // Override headers?
            });
            // Note: if apiFetch does `headers['Content-Type'] = 'application/json'`, passing `{}` might not clear it depending on merge logic.
            // I will verify apiFetch in next step.

            const data = await res.json();
            setResult(data);
        } catch (err) {
            alert("Upload failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Bulk Operations</h1>
                <p className="text-slate-500">Create multiple QR codes at once by uploading a CSV.</p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center">
                <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Upload size={32} />
                </div>
                <h2 className="text-lg font-bold text-slate-900 mb-2">Upload CSV File</h2>
                <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">
                    Your CSV should have one column containing the destination URLs.
                    Limit: 50 rows per batch.
                </p>

                <label className="inline-flex flex-col items-center gap-2 cursor-pointer">
                    <input type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
                    <span className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition">
                        {file ? "Change File" : "Select CSV"}
                    </span>
                    {file && <span className="text-sm font-medium text-indigo-600 mt-2 flex items-center gap-1"><FileText size={14} /> {file.name}</span>}
                </label>

                {file && (
                    <div className="mt-8 pt-8 border-t border-slate-100">
                        <button
                            onClick={doUpload}
                            disabled={loading}
                            className="w-full max-w-xs px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition disabled:opacity-50"
                        >
                            {loading ? "Processing..." : "Start Import"}
                        </button>
                    </div>
                )}
            </div>

            {result && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                        {result.success ? <CheckCircle className="text-emerald-500" /> : <AlertCircle className="text-red-500" />}
                        Import Results
                    </h3>
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="p-4 bg-slate-50 rounded-xl text-center">
                            <p className="text-xs text-slate-500 uppercase font-bold">Processed</p>
                            <p className="text-2xl font-bold text-slate-900">{result.total_processed}</p>
                        </div>
                        <div className="p-4 bg-emerald-50 rounded-xl text-center">
                            <p className="text-xs text-emerald-600 uppercase font-bold">Created</p>
                            <p className="text-2xl font-bold text-emerald-700">{result.created}</p>
                        </div>
                        <div className="p-4 bg-red-50 rounded-xl text-center">
                            <p className="text-xs text-red-600 uppercase font-bold">Errors</p>
                            <p className="text-2xl font-bold text-red-700">{result.errors}</p>
                        </div>
                    </div>

                    {result.details && (
                        <div className="max-h-60 overflow-y-auto border border-slate-100 rounded-xl">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 font-bold sticky top-0">
                                    <tr>
                                        <th className="p-3">Row</th>
                                        <th className="p-3">Status</th>
                                        <th className="p-3">Result</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {result.details.map((row: any, i: number) => (
                                        <tr key={i}>
                                            <td className="p-3 text-slate-500">#{row.row}</td>
                                            <td className="p-3">
                                                {row.status === 'success' ?
                                                    <span className="text-emerald-600 font-bold text-xs bg-emerald-50 px-2 py-1 rounded">Success</span> :
                                                    <span className="text-red-600 font-bold text-xs bg-red-50 px-2 py-1 rounded">Error</span>
                                                }
                                            </td>
                                            <td className="p-3 text-slate-700 truncate max-w-xs">{row.short_code ? `Code: ${row.short_code}` : row.message}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
