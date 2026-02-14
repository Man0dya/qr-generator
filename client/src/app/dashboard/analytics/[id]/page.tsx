"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Calendar, Smartphone, Globe, Activity,
  Monitor, ExternalLink, Download
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';

const COLORS = ['#4f46e5', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card p-3 border border-border shadow-xl rounded-xl text-xs text-card-foreground">
        <p className="font-bold mb-1">{label}</p>
        <p className="text-primary font-semibold">
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
        const res = await apiFetch(`/get_analytics_details.php?qr_id=${params.id}`);
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
    <div className="flex items-center justify-center h-64 text-muted-foreground gap-2">
      <div className="w-5 h-5 border-2 border-muted border-t-primary rounded-full animate-spin" />
      Loading data...
    </div>
  );

  if (!data) return <div className="p-8 text-center text-destructive">Failed to load analytics data.</div>;

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
            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-2 transition"
          >
            <ArrowLeft size={16} className="mr-1" /> Back to Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Analytics</h1>
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-mono font-bold border border-primary/20">
              /{data.qr_info.short_code}
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <a
            href={data.qr_info.destination_url}
            target="_blank"
            className="flex items-center gap-2 px-4 py-2 bg-card border border-border text-foreground rounded-lg text-sm font-medium hover:bg-muted transition"
          >
            Visit Link <ExternalLink size={14} />
          </a>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition shadow-lg shadow-primary/20">
            <Download size={14} /> Export Report
          </button>
        </div>
      </div>

      {/* --- KPI CARDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium">Total Scans</p>
              <h3 className="text-3xl font-bold text-card-foreground mt-2">{totalScans}</h3>
            </div>
            <div className="p-3 bg-primary/10 text-primary rounded-xl">
              <Activity size={24} />
            </div>
          </div>
          <div className="mt-4 text-xs text-emerald-600 font-medium bg-emerald-500/10 inline-block px-2 py-1 rounded">
            +12% vs last week (Mock)
          </div>
        </div>

        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium">Top Device</p>
              <h3 className="text-3xl font-bold text-card-foreground mt-2">
                {data.charts.devices[0]?.name || "N/A"}
              </h3>
            </div>
            <div className="p-3 bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded-xl">
              <Smartphone size={24} />
            </div>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">Most used platform</p>
        </div>

        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium">Target URL</p>
              <p className="text-sm font-medium text-card-foreground mt-2 line-clamp-2 break-all">
                {data.qr_info.destination_url}
              </p>
            </div>
            <div className="p-3 bg-muted text-muted-foreground rounded-xl">
              <Globe size={24} />
            </div>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">Created {new Date(data.qr_info.created_at).toLocaleDateString()}</p>
        </div>
      </div>

      {/* --- MAIN CHART: TIMELINE --- */}
      <div className="bg-card p-6 md:p-8 rounded-2xl border border-border shadow-sm">
        <div className="flex items-center gap-2 mb-8">
          <Calendar className="text-primary" size={20} />
          <h3 className="text-lg font-bold text-card-foreground">Performance Over Time</h3>
        </div>

        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.charts.timeline}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1 }} />
              <Area
                type="monotone"
                dataKey="count"
                stroke="hsl(var(--primary))"
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
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Smartphone className="text-violet-500" size={20} />
            <h3 className="text-lg font-bold text-card-foreground">Device Distribution</h3>
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
                  stroke="hsl(var(--card))"
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
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Monitor className="text-emerald-500" size={20} />
            <h3 className="text-lg font-bold text-card-foreground">Operating Systems</h3>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.charts.os} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={80}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted)/0.5)' }} />
                <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Age Groups (Simulated) */}
        <div className="lg:col-span-2 bg-card p-6 rounded-2xl border border-border shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="text-amber-500" size={20} />
            <h3 className="text-lg font-bold text-card-foreground">Demographics (Estimated)</h3>
          </div>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.charts.age_groups}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  dy={10}
                />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted)/0.5)' }} />
                <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}