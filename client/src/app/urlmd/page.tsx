import Link from "next/link";
import { ArrowRight, Link2, ShieldCheck, BarChart3, QrCode } from "lucide-react";

export default function UrlmdStandalonePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="max-w-3xl">
          <p className="text-xs font-bold tracking-widest text-primary uppercase">URLMD</p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mt-3">
            Uniform Resource Locator Management Dashboard
          </h1>
          <p className="text-muted-foreground mt-5 text-lg">
            Create and manage short links, monitor click analytics, and connect links directly to dynamic QR campaigns.
          </p>
          <div className="flex flex-wrap gap-3 mt-8">
            <Link href="/login" className="h-11 px-5 rounded-xl bg-primary text-primary-foreground inline-flex items-center gap-2 font-medium">
              Open URLMD Console <ArrowRight size={16} />
            </Link>
            <Link href="/dashboard/create" className="h-11 px-5 rounded-xl border border-border inline-flex items-center gap-2 font-medium hover:bg-muted">
              Generate QR with URLMD <QrCode size={16} />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-16">
          <Feature icon={Link2} title="Short Link Management" description="Create custom short codes, pause links, add expiry windows, and manage branded domains." />
          <Feature icon={BarChart3} title="Analytics Dashboard" description="Track clicks, unique visitors, referrers, devices, and country trends in one place." />
          <Feature icon={ShieldCheck} title="Safety & Moderation" description="Automatic risk checks, admin moderation controls, and audit-ready URL governance." />
        </div>
      </div>
    </main>
  );
}

function Feature({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary inline-flex items-center justify-center">
        <Icon size={18} />
      </div>
      <h3 className="font-bold mt-4">{title}</h3>
      <p className="text-sm text-muted-foreground mt-2">{description}</p>
    </div>
  );
}
