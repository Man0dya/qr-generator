"use client";

import {
    TrendingUp, CheckCircle, Users, BarChart2
} from "lucide-react";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';

// ... imports

// Update COLORS if needed for dark mode, but these hex codes usually work on dark too.
// Maybe slightly unrelated to theme tokens, but let's keep them for now.
const COLORS = ['#4f46e5', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

export default function AnalyticsView({ stats, totalUsers }: { stats: any, totalUsers: number }) {
    if (!stats) return <div className="text-center p-10 text-muted-foreground">No data available</div>;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-xl"><TrendingUp size={24} /></div>
                    <div>
                        <p className="text-muted-foreground text-xs font-bold uppercase">Total Scans</p>
                        <p className="text-3xl font-bold text-card-foreground">{stats.total_scans}</p>
                    </div>
                </div>
                <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl"><CheckCircle size={24} /></div>
                    <div>
                        <p className="text-muted-foreground text-xs font-bold uppercase">Active Links</p>
                        <p className="text-3xl font-bold text-card-foreground">{stats.active_links}</p>
                    </div>
                </div>
                <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl"><Users size={24} /></div>
                    <div>
                        <p className="text-muted-foreground text-xs font-bold uppercase">Total Users</p>
                        <p className="text-3xl font-bold text-card-foreground">{totalUsers}</p>
                    </div>
                </div>
            </div>

            {/* Timeline Chart */}
            <div className="bg-card p-8 rounded-2xl border border-border shadow-sm">
                <h3 className="text-lg font-bold text-card-foreground mb-6">Traffic (30 Days)</h3>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stats.timeline}>
                            <defs>
                                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" strokeOpacity={0.2} />
                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
                            <Tooltip
                                contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--card-foreground)' }}
                                itemStyle={{ color: 'var(--card-foreground)' }}
                                labelStyle={{ color: 'var(--muted-foreground)' }}
                            />
                            <Area type="monotone" dataKey="count" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Bottom Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Top Links */}
                <div className="bg-card p-8 rounded-2xl border border-border shadow-sm">
                    <h3 className="text-lg font-bold text-card-foreground mb-6">Top Links</h3>
                    <table className="w-full text-left">
                        <thead className="bg-muted/50 border-b border-border">
                            <tr>
                                <th className="p-3 text-xs font-bold text-muted-foreground uppercase">Short Code</th>
                                <th className="p-3 text-xs font-bold text-muted-foreground uppercase">Scans</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.top_qrs.map((qr: any, i: number) => (
                                <tr key={i} className="border-b border-border last:border-0">
                                    <td className="p-3 font-mono text-primary font-medium">/{qr.short_code}</td>
                                    <td className="p-3 font-bold text-card-foreground">{qr.scans}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Device Chart */}
                <div className="bg-card p-8 rounded-2xl border border-border shadow-sm">
                    <h3 className="text-lg font-bold text-card-foreground mb-6">Device Usage</h3>
                    <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={stats.devices} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                    {stats.devices.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--card-foreground)' }}
                                />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}