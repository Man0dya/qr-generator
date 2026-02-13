"use client";

import Link from "next/link";
import { ArrowRight, Link2, QrCode, Wifi } from "lucide-react";

const options = [
  {
    key: "short-link",
    title: "Short Link",
    description: "Pure URL tracking with URLMD analytics and lifecycle controls.",
    icon: Link2,
    href: "/dashboard/urlmd/create",
    cta: "Create Short Link",
  },
  {
    key: "smart-qr",
    title: "Smart QR",
    description: "A QR code automatically backed by a URLMD short link for full tracking.",
    icon: QrCode,
    href: "/dashboard/create?mode=smart",
    cta: "Create Smart QR",
  },
  {
    key: "static-qr",
    title: "Static QR",
    description: "Static QR payloads like WiFi, vCard, and profile data for offline use.",
    icon: Wifi,
    href: "/dashboard/create?mode=static",
    cta: "Create Static QR",
  },
];

export default function NewAssetPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">New Asset</h1>
        <p className="text-muted-foreground mt-2">Choose what you want to create in URLMD.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {options.map((option) => {
          const Icon = option.icon;
          return (
            <div key={option.key} className="bg-card p-6 rounded-2xl border border-border shadow-sm flex flex-col">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                <Icon size={22} />
              </div>
              <h2 className="text-lg font-bold text-card-foreground mb-2">{option.title}</h2>
              <p className="text-sm text-muted-foreground mb-6 flex-1">{option.description}</p>
              <Link
                href={option.href}
                className="h-11 rounded-xl bg-primary text-primary-foreground px-4 font-medium inline-flex items-center justify-center gap-2 hover:bg-primary/90 transition"
              >
                {option.cta} <ArrowRight size={16} />
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
