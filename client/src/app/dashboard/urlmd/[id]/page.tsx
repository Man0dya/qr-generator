"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Smartphone,
  Globe,
  Activity,
  Monitor,
  ExternalLink,
  Download,
  Users,
  Bot,
  MousePointerClick,
} from "lucide-react";
import { urlmdGetAnalytics } from "@/lib/urlmd";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";

const COLORS = ["#4f46e5", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444"];

type UrlmdAnalyticsResponse = {
  success?: boolean;
  link: {
    short_code: string;
    destination_url: string;
    created_at?: string;
  };
  summary?: {
    total_clicks?: number | string;
    unique_visitors?: number | string;
    bot_clicks?: number | string;
    last_click_at?: string | null;
  };
  charts: {
    timeline: Array<{ date: string; count: number | string }>;
    devices: Array<{ name: string; value: number | string }>;
    os: Array<{ name: string; value: number | string }>;
    browsers: Array<{ name: string; value: number | string }>;
    countries: Array<{ name: string; value: number | string }>;
    referrers: Array<{ name: string; value: number | string }>;
    age_groups: Array<{ name: string; value: number | string }>;
  };
};

type TooltipEntry = { value: number | string };
type ChartTooltipProps = { active?: boolean; payload?: TooltipEntry[]; label?: string };

const CustomTooltip = ({ active, payload, label }: ChartTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card p-3 border border-border shadow-xl rounded-xl text-xs">
        <p className="font-bold text-foreground mb-1">{label}</p>
        <p className="text-primary font-semibold">{payload[0].value} Clicks</p>
      </div>
    );
  }
  return null;
};

export default function UrlmdAnalyticsPage() {
  const params = useParams();
  const id = Number(params.id);
  const [data, setData] = useState<UrlmdAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      try {
        const json = await urlmdGetAnalytics(id);
        if (json.success) setData(json);
      } catch {
      } finally {
        setLoading(false);
      }
    };

    if (id) run();
  }, [id]);

  const totalClicks = useMemo(() => Number(data?.summary?.total_clicks || 0), [data]);
  const uniqueVisitors = useMemo(() => Number(data?.summary?.unique_visitors || 0), [data]);
  const botClicks = useMemo(() => Number(data?.summary?.bot_clicks || 0), [data]);
  const topDevice = useMemo(() => data?.charts?.devices?.[0]?.name || "N/A", [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground gap-2">
        <div className="w-5 h-5 border-2 border-border border-t-primary rounded-full animate-spin" />
        Loading data...
      </div>
    );
  }

  if (!data) {
    return <div className="p-8 text-center text-destructive">Failed to load analytics data.</div>;
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link href="/dashboard/urlmd" className="inline-flex items-center text-sm text-slate-500 hover:text-indigo-600 mb-2 transition">
            <ArrowLeft size={16} className="mr-1" /> Back to Short Links
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Analytics</h1>
            <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-mono font-bold border border-indigo-100">
              /{data.link.short_code}
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <a
            href={data.link.destination_url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition"
          >
            Visit Link <ExternalLink size={14} />
          </a>
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition shadow-lg shadow-slate-200">
            <Download size={14} /> Export Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] md:col-span-2">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-500 text-sm font-medium">Total Clicks</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-2">{totalClicks}</h3>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <Activity size={24} />
            </div>
          </div>
          <div className="mt-4 text-xs text-emerald-600 font-medium bg-emerald-50 inline-block px-2 py-1 rounded">
            Core traffic metric
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-500 text-sm font-medium">Unique Visitors</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-2">{uniqueVisitors}</h3>
            </div>
            <div className="p-3 bg-sky-50 text-sky-600 rounded-xl">
              <Users size={24} />
            </div>
          </div>
          <p className="mt-4 text-xs text-slate-400">Distinct IP count</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-500 text-sm font-medium">Bot Clicks</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-2">{botClicks}</h3>
            </div>
            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
              <Bot size={24} />
            </div>
          </div>
          <p className="mt-4 text-xs text-slate-400">Automated traffic flagged</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-500 text-sm font-medium">Top Device</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-2">{topDevice}</h3>
            </div>
            <div className="p-3 bg-violet-50 text-violet-600 rounded-xl">
              <Smartphone size={24} />
            </div>
          </div>
          <p className="mt-4 text-xs text-slate-400">Most used platform</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-slate-500 text-sm font-medium">Target URL</p>
            <p className="text-sm font-medium text-slate-900 mt-2 break-all">{data.link.destination_url}</p>
          </div>
          <div className="p-3 bg-slate-50 text-slate-600 rounded-xl">
            <Globe size={24} />
          </div>
        </div>
        <p className="mt-4 text-xs text-slate-400">
          Created {data.link.created_at ? new Date(data.link.created_at).toLocaleDateString() : "N/A"}
        </p>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="flex items-center gap-2 mb-8">
          <Calendar className="text-indigo-600" size={20} />
          <h3 className="text-lg font-bold text-slate-900">Performance Over Time</h3>
        </div>

        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.charts.timeline || []}>
              <defs>
                <linearGradient id="colorCountUrlmd" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#6366f1", strokeWidth: 1 }} />
              <Area type="monotone" dataKey="count" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorCountUrlmd)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex items-center gap-2 mb-6">
            <Smartphone className="text-violet-600" size={20} />
            <h3 className="text-lg font-bold text-slate-900">Device Distribution</h3>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={toNum(data.charts.devices)} innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                  {toNum(data.charts.devices).map((entry, index) => (
                    <Cell key={`${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex items-center gap-2 mb-6">
            <Monitor className="text-emerald-600" size={20} />
            <h3 className="text-lg font-bold text-slate-900">Operating Systems</h3>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={toNum(data.charts.os)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={90} tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f8fafc" }} />
                <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex items-center gap-2 mb-6">
            <Monitor className="text-sky-600" size={20} />
            <h3 className="text-lg font-bold text-slate-900">Browsers</h3>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={toNum(data.charts.browsers)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={90} tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f8fafc" }} />
                <Bar dataKey="value" fill="#0ea5e9" radius={[0, 4, 4, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex items-center gap-2 mb-6">
            <Globe className="text-emerald-600" size={20} />
            <h3 className="text-lg font-bold text-slate-900">Top Countries</h3>
          </div>
          <div className="space-y-3">
            {toNum(data.charts.countries).length === 0 ? (
              <p className="text-sm text-slate-400">No data</p>
            ) : (
              toNum(data.charts.countries).map((entry) => (
                <div key={entry.name} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-sm text-slate-700">{entry.name}</span>
                  <span className="text-sm font-semibold text-slate-900">{entry.value}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex items-center gap-2 mb-6">
            <MousePointerClick className="text-indigo-600" size={20} />
            <h3 className="text-lg font-bold text-slate-900">Top Referrers</h3>
          </div>
          <div className="space-y-3">
            {toNum(data.charts.referrers).length === 0 ? (
              <p className="text-sm text-slate-400">No data</p>
            ) : (
              toNum(data.charts.referrers).map((entry) => (
                <div key={entry.name} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-sm text-slate-700 truncate pr-3">{entry.name}</span>
                  <span className="text-sm font-semibold text-slate-900">{entry.value}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="text-amber-500" size={20} />
            <h3 className="text-lg font-bold text-slate-900">Demographics (Estimated)</h3>
          </div>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={toNum(data.charts.age_groups)}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} dy={10} />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f8fafc" }} />
                <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function toNum(list: Array<{ name: string; value: number | string }> = []) {
  return list.map((item) => ({ name: item.name, value: Number(item.value || 0) }));
}
