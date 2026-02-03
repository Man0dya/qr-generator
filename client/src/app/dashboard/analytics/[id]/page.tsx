"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, Calendar, Smartphone, Globe, Activity, 
  Monitor, ExternalLink, Download 
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';

const COLORS = ['#4f46e5', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-slate-100 shadow-xl rounded-xl text-xs">
        <p className="font-bold text-slate-900 mb-1">{label}</p>
        <p className="text-indigo-600 font-semibold">
          {payload[0].value} Scans
        </p>
      </div>
    );
  }
  return null;
};

export default function AnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`http://localhost:8000/get_analytics_details.php?qr_id=${params.id}`);
        const json = await res.json();
        if (json.success) setData(json);
      } catch (err) {
        console.error("Error loading analytics");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.id]);

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-slate-400 gap-2">
        <div className="w-5 h-5 border-2 border-slate-300 border-t-indigo-600 rounded-full animate-spin"/>
        Loading data...
    </div>
  );

  if (!data) return <div className="p-8 text-center text-red-500">Failed to load analytics data.</div>;

  // Calculate total scans for KPI (safe when there are 0 scans)
  const totalScans = (data.charts.timeline || []).reduce(
    (acc: number, curr: any) => acc + parseInt(curr.count),
    0
  );

  return (
    <div className="space-y-8 pb-12">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <Link 
                href="/dashboard" 
                className="inline-flex items-center text-sm text-slate-500 hover:text-indigo-600 mb-2 transition"
            >
                <ArrowLeft size={16} className="mr-1" /> Back to Dashboard
            </Link>
            <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Analytics</h1>
                <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-mono font-bold border border-indigo-100">
                    /{data.qr_info.short_code}
                </span>
            </div>
        </div>
        
        <div className="flex gap-3">
            <a 
                href={data.qr_info.destination_url}
                target="_blank"
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition"
            >
                Visit Link <ExternalLink size={14} />
            </a>
            {/* Placeholder for export functionality */}
            <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition shadow-lg shadow-slate-200">
                <Download size={14} /> Export Report
            </button>
        </div>
      </div>

      {/* --- KPI CARDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-slate-500 text-sm font-medium">Total Scans</p>
                    <h3 className="text-3xl font-bold text-slate-900 mt-2">{totalScans}</h3>
                </div>
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                    <Activity size={24} />
                </div>
            </div>
            <div className="mt-4 text-xs text-emerald-600 font-medium bg-emerald-50 inline-block px-2 py-1 rounded">
                +12% vs last week (Mock)
            </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-slate-500 text-sm font-medium">Top Device</p>
                    <h3 className="text-3xl font-bold text-slate-900 mt-2">
                        {data.charts.devices[0]?.name || "N/A"}
                    </h3>
                </div>
                <div className="p-3 bg-violet-50 text-violet-600 rounded-xl">
                    <Smartphone size={24} />
                </div>
            </div>
             <p className="mt-4 text-xs text-slate-400">Most used platform</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-slate-500 text-sm font-medium">Target URL</p>
                    <p className="text-sm font-medium text-slate-900 mt-2 line-clamp-2 break-all">
                        {data.qr_info.destination_url}
                    </p>
                </div>
                <div className="p-3 bg-slate-50 text-slate-600 rounded-xl">
                    <Globe size={24} />
                </div>
            </div>
             <p className="mt-4 text-xs text-slate-400">Created {new Date(data.qr_info.created_at).toLocaleDateString()}</p>
        </div>
      </div>

      {/* --- MAIN CHART: TIMELINE --- */}
      <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="flex items-center gap-2 mb-8">
            <Calendar className="text-indigo-600" size={20} />
            <h3 className="text-lg font-bold text-slate-900">Performance Over Time</h3>
        </div>
        
        <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.charts.timeline}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 12}} 
                    dy={10}
                />
                <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 12}} 
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#6366f1', strokeWidth: 1 }} />
                <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#4f46e5" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#colorCount)" 
                />
              </AreaChart>
            </ResponsiveContainer>
        </div>
      </div>

      {/* --- SECONDARY CHARTS GRID --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Device Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <div className="flex items-center gap-2 mb-6">
                <Smartphone className="text-violet-600" size={20} />
                <h3 className="text-lg font-bold text-slate-900">Device Distribution</h3>
            </div>
            <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.charts.devices}
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {data.charts.devices.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Operating Systems */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <div className="flex items-center gap-2 mb-6">
                <Monitor className="text-emerald-600" size={20} />
                <h3 className="text-lg font-bold text-slate-900">Operating Systems</h3>
            </div>
            <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.charts.os} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                    <XAxis type="number" hide />
                    <YAxis 
                        dataKey="name" 
                        type="category" 
                        width={80} 
                        tick={{fill: '#64748b', fontSize: 12}} 
                        axisLine={false} 
                        tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc'}} />
                    <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} barSize={30} />
                  </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Age Groups (Simulated) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <div className="flex items-center gap-2 mb-6">
                <Activity className="text-amber-500" size={20} />
                <h3 className="text-lg font-bold text-slate-900">Demographics (Estimated)</h3>
            </div>
            <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.charts.age_groups}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: '#94a3b8', fontSize: 12}} 
                        dy={10}
                    />
                    <YAxis hide />
                    <Tooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc'}} />
                    <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={50} />
                  </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

      </div>
    </div>
  );
}