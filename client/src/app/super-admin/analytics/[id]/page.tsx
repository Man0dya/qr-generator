"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Smartphone,
  Monitor,
  ExternalLink,
  ShieldAlert,
  User,
  Clock,
} from "lucide-react";
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

type TooltipProps = { active?: boolean; payload?: Array<{ value: number | string }>; label?: string };

type AnalyticsDetails = {
  qr_info: {
    short_code: string;
    destination_url: string;
    user_id: number;
    created_at: string;
  };
  charts: {
    timeline: Array<{ date: string; count: number | string }>;
    devices: Array<{ name: string; value: number | string }>;
    os: Array<{ name: string; value: number | string }>;
  };
};

const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-slate-100 shadow-xl rounded-xl text-xs z-50">
        <p className="font-bold text-slate-900 mb-1">{label}</p>
        <p className="text-indigo-600 font-semibold">{payload[0].value} Scans</p>
      </div>
    );
  }
  return null;
};

export default function SuperAdminAnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<AnalyticsDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user.role !== "super_admin") {
      router.push("/dashboard");
      return;
    }

    const fetchData = async () => {
      try {
        const res = await fetch(
          `http://localhost:8000/get_analytics_details.php?qr_id=${params.id}`,
        );
        const json = (await res.json()) as {
          success?: boolean;
          qr_info?: AnalyticsDetails["qr_info"];
          charts?: AnalyticsDetails["charts"];
        };

        if (json.success && json.qr_info && json.charts) {
          setData({ qr_info: json.qr_info, charts: json.charts });
        }
      } catch {
        console.error("Error loading analytics");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id, router]);

  if (loading)
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-400">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 border-2 border-slate-300 border-t-indigo-600 rounded-full animate-spin" />
          Loading Audit Data...
        </div>
      </div>
    );

  if (!data)
    return (
      <div className="p-8 text-center text-red-500">Failed to load analytics data.</div>
    );

  const totalScans = data.charts.timeline.reduce((acc, curr) => {
    const asNumber = typeof curr.count === "number" ? curr.count : parseInt(String(curr.count), 10);
    return acc + (Number.isFinite(asNumber) ? asNumber : 0);
  }, 0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-8">
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <Link
              href="/super-admin?view=moderation"
              className="inline-flex items-center text-sm text-slate-500 hover:text-indigo-600 mb-2 transition"
            >
              <ArrowLeft size={16} className="mr-1" /> Back to Moderation
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                Audit Analytics
              </h1>
              <span className="bg-slate-200 text-slate-700 px-3 py-1 rounded-full text-xs font-mono font-bold border border-slate-300">
                /{data.qr_info.short_code}
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-500 rounded-lg text-sm font-medium shadow-sm">
              <User size={14} /> User ID: {data.qr_info.user_id}
            </div>
            <a
              href={data.qr_info.destination_url}
              target="_blank"
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 border border-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition shadow-lg shadow-indigo-200"
            >
              Inspect Target <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">
              Total Scans
            </p>
            <h3 className="text-3xl font-bold text-slate-900 mt-2">{totalScans}</h3>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">
              Top Device
            </p>
            <h3 className="text-xl font-bold text-slate-900 mt-2 truncate">
              {data.charts.devices[0]?.name || "N/A"}
            </h3>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">
              Created On
            </p>
            <div className="flex items-center gap-2 mt-2 text-slate-900 font-bold">
              <Clock size={18} className="text-slate-400" />
              {new Date(data.qr_info.created_at).toLocaleDateString()}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">
              Security Status
            </p>
            <div className="flex items-center gap-2 mt-2 text-emerald-600 font-bold bg-emerald-50 w-fit px-2 py-1 rounded">
              <ShieldAlert size={18} /> Safe
            </div>
          </div>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-8">
            <Calendar className="text-indigo-600" size={20} />
            <h3 className="text-lg font-bold text-slate-900">Traffic Timeline</h3>
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
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#6366f1", strokeWidth: 1 }} />
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <Smartphone className="text-violet-600" size={20} />
              <h3 className="text-lg font-bold text-slate-900">Device Breakdown</h3>
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
                    {data.charts.devices.map((entry, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <Monitor className="text-emerald-600" size={20} />
              <h3 className="text-lg font-bold text-slate-900">OS Distribution</h3>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.charts.os} layout="vertical">
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={true}
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={100}
                    tick={{ fill: "#64748b", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f8fafc" }} />
                  <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
