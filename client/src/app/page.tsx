"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useQRCode } from "next-qrcode";
import {
  ArrowRight, BarChart2, Zap,
  Globe, Layers, ChevronRight, Shield, RefreshCw, LayoutTemplate, Link2, QrCode
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "@/components/Logo";

export default function LandingPage() {
  const { Canvas } = useQRCode();
  const [demoUrl, setDemoUrl] = useState("https://example.com");
  const [qrColor, setQrColor] = useState('#020617');
  const [logoSrc, setLogoSrc] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20 selection:text-primary">

      {/* --- NAVBAR --- */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 border-b ${scrolled ? 'bg-background/80 backdrop-blur-md border-border py-3' : 'bg-transparent border-transparent py-5'
        }`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo className="w-8 h-8" />
            <span className="text-lg font-bold tracking-tight">URLMD</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How it Works</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link
              href="/login"
              className="hidden md:block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition shadow-sm flex items-center gap-2"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="pt-20 pb-24 px-6 md:pt-36 md:pb-32 relative overflow-hidden">
        <div aria-hidden className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 left-1/2 h-72 w-[32rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-32 left-10 h-72 w-72 rounded-full bg-secondary/60 blur-3xl" />
          <div className="absolute top-24 right-10 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />
        </div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-4 text-foreground leading-tight">
            <span className="text-primary">The Complete Link & QR Management Platform</span>
          </h1>

          <p className="text-2xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed">
            URLMD allows you to shorten URLs, track analytics, and generate dynamic QR codes—all from one dashboard.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm md:text-base text-muted-foreground mb-10">
            <span className="inline-flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Create short links
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Track analytics
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Generate QRs
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Link href="/register" aria-label="Start for free" className="h-14 px-10 rounded-xl bg-primary text-primary-foreground font-medium flex items-center gap-2 hover:bg-primary/90 transition shadow-lg shadow-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30">
              Start for free <ArrowRight size={18} />
            </Link>
            <Link href="#features" aria-label="Explore features" className="h-14 px-10 rounded-xl bg-secondary text-secondary-foreground font-medium flex items-center gap-2 hover:bg-secondary/80 transition border border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20">
              Explore features
            </Link>
          </div>

          {/* Wrapper for the interactive demo to sit nicely */}
          <div className="max-w-5xl mx-auto bg-card rounded-2xl border border-border shadow-xl overflow-hidden relative group">
            {/* Simple UI Mockup Header */}
            <div className="h-10 bg-muted/50 border-b border-border flex items-center px-4 gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400/20 border border-red-400/50"></div>
                <div className="w-3 h-3 rounded-full bg-amber-400/20 border border-amber-400/50"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-400/20 border border-emerald-400/50"></div>
              </div>
              <div className="flex-1 text-center" />
            </div>

            <div className="grid md:grid-cols-2 min-h-[400px]">
              {/* Left: Input */}
              <div className="p-8 md:p-12 flex flex-col justify-center border-r border-border bg-card">
                <div className="space-y-6 text-left">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Destination URL</label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={demoUrl}
                        onChange={(e) => setDemoUrl(e.target.value)}
                        aria-label="Destination URL"
                        aria-describedby="demo-url-help"
                        className="flex-1 h-10 md:h-12 px-3 rounded-lg border border-input bg-background text-sm md:text-base focus-visible:ring-2 focus-visible:ring-primary/30 focus:border-primary outline-none transition"
                        placeholder="https://example.com"
                      />
                    </div>
                    <p id="demo-url-help" className="text-sm text-muted-foreground mt-2">
                      Try a website URL like https://example.com — preview updates as you type.
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-3 block">Style Preview</label>
                    <div className="flex gap-3 items-center">
                      {['#000000', '#4f46e5', '#db2777', '#059669'].map(c => (
                        <button
                          key={c}
                          type="button"
                          aria-label={`Preview color ${c}`}
                          onClick={() => setQrColor(c)}
                          className={`w-8 h-8 rounded-full border hover:scale-110 transition shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${qrColor === c ? 'ring-2 ring-offset-2 ring-primary' : ''}`}
                          style={{ backgroundColor: c }}
                        ></button>
                      ))}

                      <input
                        aria-label="Custom color"
                        type="color"
                        value={qrColor}
                        onChange={(e) => setQrColor(e.target.value)}
                        className="w-8 h-8 p-0 border border-border rounded-full"
                      />
                    </div>

                    <div className="mt-3">
                      <label className="text-sm font-medium text-foreground mb-2 block">Logo</label>
                      <div className="flex items-center gap-3">
                        <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-background border border-border text-sm cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const reader = new FileReader();
                              reader.onload = () => setLogoSrc(String(reader.result));
                              reader.readAsDataURL(file);
                            }}
                            className="hidden"
                          />
                          Upload logo
                        </label>
                        {logoSrc && (
                          <button type="button" onClick={() => setLogoSrc(null)} className="text-sm text-destructive">Remove</button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Output */}
              <div className="bg-muted/30 p-8 md:p-12 flex items-center justify-center flex-col">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-border/50 mb-4 relative">
                  <Canvas
                    text={demoUrl}
                    options={{
                      errorCorrectionLevel: 'M',
                      margin: 2,
                      scale: 4,
                      width: 220,
                      color: { dark: qrColor, light: '#ffffff' },
                    }}
                  />
                  {logoSrc && (
                    <Image
                      src={logoSrc}
                      alt="logo"
                      width={56}
                      height={56}
                      unoptimized
                      className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                      style={{ objectFit: 'contain', borderRadius: 8 }}
                    />
                  )}
                </div>
                <p className="text-xs md:text-sm text-muted-foreground font-medium flex items-center gap-1.5">
                  <RefreshCw size={12} className="animate-spin-slow" /> Live Preview — updates as you type
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- FEATURES GRID --- */}
      <section id="features" className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-16 md:text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tight text-foreground mb-4">Everything needed to manage links end-to-end</h2>
            <p className="text-muted-foreground text-lg">
              URLMD combines short-link operations, QR delivery, and analytics in one platform.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Link2 className="text-blue-500" size={24} />}
              title="URL Shortening"
              desc="Build branded short URLs for campaigns, products, and internal workflows with centralized status controls."
            />
            <FeatureCard
              icon={<BarChart2 className="text-indigo-500" size={24} />}
              title="Track Analytics"
              desc="Measure clicks, scans, geography, and devices across links and QR assets from one dashboard."
            />
            <FeatureCard
              icon={<QrCode className="text-violet-500" size={24} />}
              title="Generate QRs"
              desc="Design dynamic and static QRs, then route traffic through URLMD-managed short links when needed."
            />
            <FeatureCard
              icon={<Globe className="text-blue-500" size={24} />}
              title="Global Tracking"
              desc="Real-time analytics showing exactly where your users are scanning from. Country, city, and device data."
            />
            <FeatureCard
              icon={<LayoutTemplate className="text-violet-500" size={24} />}
              title="Custom Designs"
              desc="Match your brand identity with custom colors, logos, and frames. Stand out from generic black-and-white codes."
            />
            <FeatureCard
              icon={<Shield className="text-emerald-500" size={24} />}
              title="Enterprise Security"
              desc="SSO, Role-Based Access Control, and automated malicious link detection to keep your users safe."
            />
            <FeatureCard
              icon={<Zap className="text-amber-500" size={24} />}
              title="Dynamic Links"
              desc="Change the destination URL anytime, even after printing. Never reprint a QR code again."
            />
            <FeatureCard
              icon={<Layers className="text-pink-500" size={24} />}
              title="Bulk Operations"
              desc="Generate thousands of unique QR codes in seconds via CSV upload or our robust API."
            />
          </div>
        </div>
      </section>

      {/* --- HOW IT WORKS --- */}
      <section id="how-it-works" className="py-24 px-6 bg-background border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16 md:text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tight text-foreground mb-4">How it works</h2>
            <p className="text-muted-foreground text-lg">
              Choose the asset type you need, launch instantly, and optimize performance with unified analytics.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 items-stretch">
            <StepCard
              step="01"
              icon={<Link2 size={22} className="text-foreground" />}
              title="Create"
              desc="Create a short link or QR asset and define your destination in seconds."
            />
            <StepCard
              step="02"
              icon={<QrCode size={22} className="text-foreground" />}
              title="Deliver"
              desc="Use smart QRs backed by short links, or publish static QR formats for offline use cases."
            />
            <StepCard
              step="03"
              icon={<BarChart2 size={22} className="text-foreground" />}
              title="Track"
              desc="Monitor scans and clicks in one timeline, then iterate campaigns with confidence."
            />
          </div>

          <div className="mt-10 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              Create <ChevronRight size={14} /> Design <ChevronRight size={14} /> Track
            </span>
          </div>
        </div>
      </section>

      {/* --- PRICING --- */}
      <section id="pricing" className="py-24 px-6 bg-muted/30 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16 md:text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tight text-foreground mb-4">Simple pricing</h2>
            <p className="text-muted-foreground text-lg">Start free, then upgrade when you need more control and scale.</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 items-stretch">
            <PricingCard
              name="Starter"
              price="Free"
              tagline="For personal projects"
              features={["Unlimited scans", "Dynamic links", "Basic analytics"]}
              ctaLabel="Get started"
              ctaHref="/register"
            />
            <PricingCard
              name="Pro"
              price="Paid"
              tagline="For teams & campaigns"
              highlighted
              features={["Teams & roles", "Advanced analytics", "Bulk operations"]}
              ctaLabel="Start Pro"
              ctaHref="/register"
            />
            <PricingCard
              name="Enterprise"
              price="Custom"
              tagline="For large orgs"
              features={["SSO & security controls", "Audit logs", "Priority support"]}
              ctaLabel="Talk to sales"
              ctaHref="/register"
            />
          </div>

          <p className="mt-8 text-sm text-muted-foreground md:text-center">
            Need help choosing? Start free — you can upgrade anytime.
          </p>
        </div>
      </section>

      {/* --- FAQ --- */}
      <section className="py-24 px-6 bg-background border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 md:text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tight text-foreground mb-4">FAQ</h2>
            <p className="text-muted-foreground text-lg">Quick answers to the most common questions.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <FaqItem
              q="What’s a dynamic QR code?"
              a="A dynamic QR lets you change the destination URL after printing. Your QR stays the same; the target can evolve."
            />
            <FaqItem
              q="Can I track scans?"
              a="Yes — analytics help you understand where and when scans happen so you can improve placements and messaging."
            />
            <FaqItem
              q="Is it safe to use in production?"
              a="The platform includes security-focused controls like role-based access and moderation features for safer links."
            />
            <FaqItem
              q="Can I generate many QR codes at once?"
              a="Yes — bulk workflows help you create lots of codes quickly for inventory, events, or large campaigns."
            />
          </div>
        </div>
      </section>

      {/* --- CTA --- */}
      <section className="py-24 px-6 bg-card border-t border-border">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground mb-6">Ready to get started?</h2>
          <p className="text-muted-foreground text-lg mb-10">
            Join teams building, tracking, and scaling links with URLMD.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/register" className="h-12 px-8 rounded-xl bg-foreground text-background font-medium flex items-center gap-2 hover:bg-foreground/90 transition">
              Create Free Account
            </Link>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-background border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Logo className="w-6 h-6" />
            <span className="font-bold text-foreground">URLMD</span>
          </div>

          <div className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} URLMD Inc. All rights reserved.
          </div>

          <div className="flex gap-6 text-sm font-medium text-muted-foreground">
            <a href="#" className="hover:text-foreground">Privacy</a>
            <a href="#" className="hover:text-foreground">Terms</a>
            <a href="#" className="hover:text-foreground">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="bg-card p-6 rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow">
      <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mb-4 border border-border/50">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground leading-relaxed text-sm">
        {desc}
      </p>
    </div>
  )
}

function StepCard({ step, icon, title, desc }: { step: string, icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="bg-card p-6 rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center border border-border/50">
          {icon}
        </div>
        <span className="text-xs font-mono text-muted-foreground">{step}</span>
      </div>
      <h3 className="text-lg font-bold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground leading-relaxed text-sm">{desc}</p>
    </div>
  )
}

function PricingCard({
  name,
  price,
  tagline,
  features,
  ctaLabel,
  ctaHref,
  highlighted,
}: {
  name: string,
  price: string,
  tagline: string,
  features: string[],
  ctaLabel: string,
  ctaHref: string,
  highlighted?: boolean,
}) {
  return (
    <div className={`bg-card p-7 rounded-2xl border shadow-sm ${highlighted ? 'border-primary/40 shadow-lg shadow-primary/10' : 'border-border'} `}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-foreground">{name}</h3>
          <p className="text-sm text-muted-foreground mt-1">{tagline}</p>
        </div>
        {highlighted ? (
          <span className="inline-flex items-center rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground border border-border">
            Popular
          </span>
        ) : null}
      </div>

      <div className="mt-6">
        <div className="text-3xl font-bold tracking-tight text-foreground">{price}</div>
      </div>

      <div className="mt-6 space-y-3">
        {features.map((f) => (
          <div key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            <span>{f}</span>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <Link
          href={ctaHref}
          className={`h-12 w-full rounded-xl font-medium flex items-center justify-center gap-2 transition border ${highlighted
            ? 'bg-primary text-primary-foreground hover:bg-primary/90 border-transparent'
            : 'bg-background text-foreground hover:bg-muted/30 border-border'
            }`}
        >
          {ctaLabel} <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  )
}

function FaqItem({ q, a }: { q: string, a: string }) {
  return (
    <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
      <h3 className="text-base font-bold text-foreground mb-2">{q}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{a}</p>
    </div>
  )
}
