"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    Calendar,
    Smartphone,
    Globe,
    Activity,
    Monitor,
    ExternalLink,
    Users,
    Bot,
    MousePointerClick,
    User,
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
import { apiFetch } from "@/lib/api";

const COLORS = ["#4f46e5", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444"];

type UrlmdAnalyticsResponse = {
    success?: boolean;
    link: {
        id: number;
        user_id: number;
        short_code: string;
        destination_url: string;
        created_at?: string;
        title?: string;
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
            <div className="bg-card p-3 border border-border shadow-xl rounded-xl text-xs z-50">
                <p className="font-bold text-foreground mb-1">{label}</p>
                <p className="text-primary font-semibold">{payload[0].value} Clicks</p>
            </div>
        );
    }
    return null;
};

export default function AdminUrlAnalyticsPage() {
    const params = useParams();
    const router = useRouter();
    const id = Number(params.id);
    const [data, setData] = useState<UrlmdAnalyticsResponse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Verify Admin
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        if (user.role !== "admin" && user.role !== "super_admin") {
            router.push("/dashboard");
            return;
        }

        const run = async () => {
            try {
                const res = await apiFetch(`/urlmd_get_link_analytics.php?id=${id}`);
                const json = await res.json();
                if (json.success) setData(json);
            } catch {
                console.error("Failed to fetch data");
            } finally {
                setLoading(false);
            }
        };

        if (id) run();
    }, [id, router]);

    const totalClicks = useMemo(() => Number(data?.summary?.total_clicks || 0), [data]);
    const uniqueVisitors = useMemo(() => Number(data?.summary?.unique_visitors || 0), [data]);
    const botClicks = useMemo(() => Number(data?.summary?.bot_clicks || 0), [data]);
    const topDevice = useMemo(() => data?.charts?.devices?.[0]?.name || "N/A", [data]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground gap-2">
                <div className="w-5 h-5 border-2 border-border border-t-primary rounded-full animate-spin" />
                Loading audit data...
            </div>
        );
    }

    if (!data) {
        return <div className="p-8 text-center text-destructive">Failed to load analytics data.</div>;
    }

    return (
        <div className="space-y-8 pb-12 animate-fade-in-up">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-6">
                <div>
                    <Link href="/admin?view=url-moderation" className="inline-flex items-center text-xs text-muted-foreground hover:text-primary mb-2 transition-colors">
                        <ArrowLeft size={14} className="mr-1" /> Back to URL Moderation
                    </Link>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-foreground tracking-tight">URL Analytics</h1>
                        <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-mono font-bold border border-primary/20">
                            /{data.link.short_code}
                        </span>
                    </div>
                </div>

                <div className="flex gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-card border border-border text-muted-foreground rounded-lg text-xs font-medium shadow-sm">
                        <User size={14} /> User ID: {data.link.user_id}
                    </div>
                    <a
                        href={data.link.destination_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition shadow-sm"
                    >
                        Visit Link <ExternalLink size={14} />
                    </a>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="bg-card p-5 rounded-xl border border-border/60 shadow-sm md:col-span-2">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Total Clicks</p>
                            <h3 className="text-3xl font-bold text-foreground mt-2">{totalClicks}</h3>
                        </div>
                        <div className="p-2 bg-primary/10 text-primary rounded-lg">
                            <Activity size={20} />
                        </div>
                    </div>
                    <div className="mt-4 text-[10px] text-emerald-600 font-bold bg-emerald-500/10 inline-block px-2 py-0.5 rounded">
                        Verified Traffic
                    </div>
                </div>

                <div className="bg-card p-5 rounded-xl border border-border/60 shadow-sm">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Unique Visitors</p>
                            <h3 className="text-3xl font-bold text-foreground mt-2">{uniqueVisitors}</h3>
                        </div>
                        <div className="p-2 bg-sky-500/10 text-sky-600 rounded-lg">
                            <Users size={20} />
                        </div>
                    </div>
                    <p className="mt-4 text-[10px] text-muted-foreground">Distinct IPs</p>
                </div>

                <div className="bg-card p-5 rounded-xl border border-border/60 shadow-sm">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Bot Clicks</p>
                            <h3 className="text-3xl font-bold text-foreground mt-2">{botClicks}</h3>
                        </div>
                        <div className="p-2 bg-rose-500/10 text-rose-600 rounded-lg">
                            <Bot size={20} />
                        </div>
                    </div>
                    <p className="mt-4 text-[10px] text-muted-foreground">Automated</p>
                </div>

                <div className="bg-card p-5 rounded-xl border border-border/60 shadow-sm">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Top Device</p>
                            <h3 className="text-3xl font-bold text-foreground mt-2 truncate text-sm">{topDevice}</h3>
                        </div>
                        <div className="p-2 bg-violet-500/10 text-violet-600 rounded-lg">
                            <Smartphone size={20} />
                        </div>
                    </div>
                    <p className="mt-4 text-[10px] text-muted-foreground">Most popular</p>
                </div>
            </div>

            <div className="bg-card p-5 rounded-xl border border-border/60 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Target URL</p>
                        <p className="text-sm font-medium text-foreground mt-1 break-all">{data.link.destination_url}</p>
                    </div>
                    <div className="p-2 bg-muted text-muted-foreground rounded-lg">
                        <Globe size={20} />
                    </div>
                </div>
                <p className="mt-4 text-xs text-muted-foreground">
                    Created {data.link.created_at ? new Date(data.link.created_at).toLocaleDateString() : "N/A"}
                </p>
            </div>

            <div className="bg-card p-6 md:p-8 rounded-xl border border-border/60 shadow-sm">
                <div className="flex items-center gap-2 mb-8">
                    <Calendar className="text-primary" size={20} />
                    <h3 className="text-lg font-bold text-foreground">Performance Over Time</h3>
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
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.4} />
                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                            <Tooltip content={<CustomTooltip />} cursor={{ stroke: "hsl(var(--primary))", strokeWidth: 1 }} />
                            <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorCountUrlmd)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-card p-6 rounded-xl border border-border/60 shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                        <Smartphone className="text-violet-500" size={20} />
                        <h3 className="text-lg font-bold text-foreground">Device Distribution</h3>
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

                <div className="bg-card p-6 rounded-xl border border-border/60 shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                        <Monitor className="text-emerald-500" size={20} />
                        <h3 className="text-lg font-bold text-foreground">Operating Systems</h3>
                    </div>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={toNum(data.charts.os)} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} stroke="hsl(var(--border))" opacity={0.4} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={90} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted))", opacity: 0.2 }} />
                                <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} barSize={30} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-card p-6 rounded-xl border border-border/60 shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                        <Monitor className="text-sky-500" size={20} />
                        <h3 className="text-lg font-bold text-foreground">Browsers</h3>
                    </div>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={toNum(data.charts.browsers)} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} stroke="hsl(var(--border))" opacity={0.4} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={90} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted))", opacity: 0.2 }} />
                                <Bar dataKey="value" fill="#0ea5e9" radius={[0, 4, 4, 0]} barSize={30} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-card p-6 rounded-xl border border-border/60 shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                        <Globe className="text-emerald-500" size={20} />
                        <h3 className="text-lg font-bold text-foreground">Top Countries</h3>
                    </div>
                    <div className="space-y-3">
                        {toNum(data.charts.countries).length === 0 ? (
                            <p className="text-sm text-muted-foreground">No data</p>
                        ) : (
                            toNum(data.charts.countries).map((entry) => (
                                <div key={entry.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/40">
                                    <span className="text-sm text-foreground">{entry.name}</span>
                                    <span className="text-sm font-semibold text-foreground">{entry.value}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="lg:col-span-2 bg-card p-6 rounded-xl border border-border/60 shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                        <MousePointerClick className="text-indigo-500" size={20} />
                        <h3 className="text-lg font-bold text-foreground">Top Referrers</h3>
                    </div>
                    <div className="space-y-3">
                        {toNum(data.charts.referrers).length === 0 ? (
                            <p className="text-sm text-muted-foreground">No data</p>
                        ) : (
                            toNum(data.charts.referrers).map((entry) => (
                                <div key={entry.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/40">
                                    <span className="text-sm text-foreground truncate pr-3">{entry.name}</span>
                                    <span className="text-sm font-semibold text-foreground">{entry.value}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function toNum(list: Array<{ name: string; value: number | string }> = []) {
    return list.map((item) => ({ name: item.name, value: Number(item.value || 0) }));
}
