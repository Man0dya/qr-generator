"use client";

import { 
  TrendingUp, CheckCircle, Users, BarChart2 
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#4f46e5', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

export default function AnalyticsView({ stats, totalUsers }: { stats: any, totalUsers: number }) {
  if (!stats) return <div className="text-center p-10 text-slate-400">No data available</div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><TrendingUp size={24} /></div>
                <div>
                    <p className="text-slate-500 text-xs font-bold uppercase">Total Scans</p>
                    <p className="text-3xl font-bold text-slate-900">{stats.total_scans}</p>
                </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><CheckCircle size={24} /></div>
                <div>
                    <p className="text-slate-500 text-xs font-bold uppercase">Active Links</p>
                    <p className="text-3xl font-bold text-slate-900">{stats.active_links}</p>
                </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Users size={24} /></div>
                <div>
                    <p className="text-slate-500 text-xs font-bold uppercase">Total Users</p>
                    <p className="text-3xl font-bold text-slate-900">{totalUsers}</p>
                </div>
            </div>
        </div>

        {/* Timeline Chart */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Traffic (30 Days)</h3>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.timeline}>
                        <defs>
                            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                        <Tooltip />
                        <Area type="monotone" dataKey="count" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Bottom Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Top Links */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-6">Top Links</h3>
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th className="p-3 text-xs font-bold text-slate-500 uppercase">Short Code</th>
                            <th className="p-3 text-xs font-bold text-slate-500 uppercase">Scans</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stats.top_qrs.map((qr:any, i:number) => (
                            <tr key={i} className="border-b border-slate-50 last:border-0">
                                <td className="p-3 font-mono text-indigo-600 font-medium">/{qr.short_code}</td>
                                <td className="p-3 font-bold text-slate-900">{qr.scans}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Device Chart */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-6">Device Usage</h3>
                <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={stats.devices} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                {stats.devices.map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    </div>
  );
}