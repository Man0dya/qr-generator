"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Calendar, Smartphone, Monitor, ExternalLink, ShieldAlert, User, Clock,
  Globe, LayoutTemplate, Share2
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import { apiFetch } from "@/lib/api";

const COLORS = ['#4f46e5', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

// Custom Tooltip for Charts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card p-3 border border-border shadow-xl rounded-xl text-xs z-50">
        <p className="font-bold text-foreground mb-1">{label}</p>
        <p className="text-primary font-semibold">
          {payload[0].value} Scans
        </p>
      </div>
    );
  }
  return null;
};

export default function AdminAnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verify Admin Status
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user.role !== "admin" && user.role !== "super_admin") {
      router.push("/dashboard");
      return;
    }

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
  }, [params.id, router]);

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">
      <div className="flex flex-col items-center gap-2">
        <div className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin" />
        <p className="text-sm">Loading Audit Data...</p>
      </div>
    </div>
  );

  if (!data) return <div className="p-8 text-center text-destructive">Failed to load analytics data.</div>;

  const totalScans = (data.charts.timeline || []).reduce(
    (acc: number, curr: any) => acc + parseInt(curr.count),
    0
  );

  return (
    <div className="space-y-8 pb-12 animate-fade-in-up">

      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-6">
        <div>
          <Link
            href="/admin?view=moderation"
            className="inline-flex items-center text-xs text-muted-foreground hover:text-primary mb-2 transition-colors"
          >
            <ArrowLeft size={14} className="mr-1" /> Back to Moderation
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Audit Analytics</h1>
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-mono font-bold border border-primary/20">
              /{data.qr_info.short_code}
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-card border border-border text-muted-foreground rounded-lg text-xs font-medium shadow-sm">
            <User size={14} /> User ID: {data.qr_info.user_id}
          </div>
          <a
            href={data.qr_info.destination_url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition shadow-sm"
          >
            Inspect Target <ExternalLink size={14} />
          </a>
        </div>
      </div>


      {/* --- KPI CARDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card p-5 rounded-xl border border-border/60 shadow-sm">
          <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Total Scans</p>
          <h3 className="text-3xl font-bold text-foreground mt-2">{totalScans}</h3>
        </div>

        <div className="bg-card p-5 rounded-xl border border-border/60 shadow-sm">
          <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Top Device</p>
          <h3 className="text-xl font-bold text-foreground mt-2 truncate">
            {data.charts.devices[0]?.name || "N/A"}
          </h3>
        </div>

        <div className="bg-card p-5 rounded-xl border border-border/60 shadow-sm">
          <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Created On</p>
          <div className="flex items-center gap-2 mt-2 text-foreground font-bold">
            <Clock size={18} className="text-muted-foreground" />
            {new Date(data.qr_info.created_at).toLocaleDateString()}
          </div>
        </div>

        <div className="bg-card p-5 rounded-xl border border-border/60 shadow-sm">
          <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Security Status</p>
          <div className="flex items-center gap-2 mt-2 text-emerald-600 font-bold bg-emerald-500/10 w-fit px-2 py-1 rounded">
            <ShieldAlert size={18} /> Safe
          </div>
        </div>
      </div>

      {/* --- MAIN CHART --- */}
      <div className="bg-card p-6 md:p-8 rounded-xl border border-border/60 shadow-sm">
        <div className="flex items-center gap-2 mb-8">
          <Calendar className="text-primary" size={20} />
          <h3 className="text-lg font-bold text-foreground">Traffic Timeline</h3>
        </div>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.charts.timeline}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.4} />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1 }} />
              <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* --- SECONDARY METRICS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card p-6 rounded-xl border border-border/60 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Smartphone className="text-violet-500" size={20} />
            <h3 className="text-lg font-bold text-foreground">Device Breakdown</h3>
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

        <div className="bg-card p-6 rounded-xl border border-border/60 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Monitor className="text-emerald-500" size={20} />
            <h3 className="text-lg font-bold text-foreground">OS Distribution</h3>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.charts.os} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" opacity={0.4} />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={100}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.2 }} />
                <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}