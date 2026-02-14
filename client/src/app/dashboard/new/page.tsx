"use client";

import Link from "next/link";
import { ArrowLeft, Link2, QrCode, ArrowRight } from "lucide-react";

export default function NewAssetPage() {
    return (
        <div className="max-w-5xl mx-auto py-12">
            <div className="mb-8">
                <Link
                    href="/dashboard"
                    className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4 transition"
                >
                    <ArrowLeft size={16} className="mr-1" /> Back to Dashboard
                </Link>
                <h1 className="text-3xl font-bold text-foreground tracking-tight">Create New Asset</h1>
                <p className="text-muted-foreground mt-2 text-lg">Choose the type of asset you want to create.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Option 1: Short Link */}
                <Link
                    href="/dashboard/urlmd/create"
                    className="group relative bg-card hover:bg-muted/50 border border-border rounded-2xl p-8 transition-all hover:shadow-lg hover:border-primary/50 flex flex-col h-full"
                >
                    <div className="w-14 h-14 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <Link2 size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground mb-3">Short Link</h2>
                    <p className="text-muted-foreground mb-8 flex-1">
                        Shorten a long URL, track clicks, and manage redirects. Perfect for sharing on social media, emails, or SMS.
                    </p>
                    <div className="flex items-center text-primary font-bold text-sm bg-primary/5 w-fit px-4 py-2 rounded-lg group-hover:bg-primary/10 transition-colors">
                        Create Short Link <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                </Link>

                {/* Option 2: QR Code */}
                <Link
                    href="/dashboard/create"
                    className="group relative bg-card hover:bg-muted/50 border border-border rounded-2xl p-8 transition-all hover:shadow-lg hover:border-primary/50 flex flex-col h-full"
                >
                    <div className="w-14 h-14 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <QrCode size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground mb-3">QR Code</h2>
                    <p className="text-muted-foreground mb-8 flex-1">
                        Design a custom QR code for WiFi, vCards, Bio Pages, or URLs. Includes customization options and logo support.
                    </p>
                    <div className="flex items-center text-emerald-600 dark:text-emerald-400 font-bold text-sm bg-emerald-500/10 w-fit px-4 py-2 rounded-lg group-hover:bg-emerald-500/20 transition-colors">
                        Design QR Code <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                </Link>
            </div>
        </div>
    );
}
