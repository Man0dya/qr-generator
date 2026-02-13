"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Link2, MousePointerClick } from "lucide-react";
import { urlmdGetAnalytics } from "@/lib/urlmd";

type UrlmdAnalyticsResponse = {
  link: {
    short_code: string;
    destination_url: string;
  };
  summary?: {
    total_clicks?: number | string;
    unique_visitors?: number | string;
    bot_clicks?: number | string;
  };
  charts: {
    timeline: Array<{ date: string; count: number | string }>;
    countries: Array<{ name: string; value: number | string }>;
    referrers: Array<{ name: string; value: number | string }>;
  };
};

export default function UrlmdAnalyticsPage() {
  const params = useParams();
  const id = Number(params.id);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<UrlmdAnalyticsResponse | null>(null);

  useEffect(() => {
    if (!id) return;
    const run = async () => {
      setLoading(true);
      try {
        const json = await urlmdGetAnalytics(id);
        if (json.success) {
          setData(json);
        }
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [id]);

  const total = useMemo(() => Number(data?.summary?.total_clicks || 0), [data]);
  const unique = useMemo(() => Number(data?.summary?.unique_visitors || 0), [data]);
  const bots = useMemo(() => Number(data?.summary?.bot_clicks || 0), [data]);

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading analytics...</div>;
  }

  if (!data) {
    return <div className="text-sm text-destructive">Failed to load URLMD analytics.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/urlmd" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft size={14} className="mr-1" /> Back to URLMD
        </Link>
        <h1 className="text-2xl font-bold text-foreground mt-2">Link Analytics</h1>
        <p className="text-sm text-muted-foreground break-all mt-1">
          <Link2 size={14} className="inline mr-1" />{data.link.short_code} → {data.link.destination_url}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Total Clicks</p>
          <p className="text-2xl font-bold mt-1">{total}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Unique Visitors</p>
          <p className="text-2xl font-bold mt-1">{unique}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Bot Clicks</p>
          <p className="text-2xl font-bold mt-1">{bots}</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border font-bold text-sm flex items-center gap-2">
          <MousePointerClick size={14} /> Daily Timeline
        </div>
        <div className="divide-y divide-border">
          {(data.charts.timeline || []).length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">No clicks yet.</div>
          ) : (
            data.charts.timeline.map((item) => (
              <div key={item.date} className="p-3 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{item.date}</span>
                <span className="font-bold text-foreground">{Number(item.count)}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SimpleBreakdown title="Top Countries" items={(data.charts.countries || []).map((item) => ({ name: item.name, value: Number(item.value) }))} />
        <SimpleBreakdown title="Top Referrers" items={(data.charts.referrers || []).map((item) => ({ name: item.name, value: Number(item.value) }))} />
      </div>
    </div>
  );
}

function SimpleBreakdown({ title, items }: { title: string; items: Array<{ name: string; value: number }> }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="p-4 border-b border-border font-bold text-sm">{title}</div>
      <div className="divide-y divide-border">
        {items.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">No data</div>
        ) : (
          items.map((item, index) => (
            <div key={`${item.name}-${index}`} className="p-3 flex items-center justify-between text-sm">
              <span className="text-muted-foreground truncate pr-3">{item.name}</span>
              <span className="font-bold text-foreground">{item.value}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
