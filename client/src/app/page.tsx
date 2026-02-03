"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useQRCode } from "next-qrcode";
import { 
  ArrowRight, BarChart2, Lock, Smartphone, Zap, 
  Globe, Layers, ChevronRight
} from "lucide-react";

export default function LandingPage() {
  const { Canvas } = useQRCode();
  const [demoUrl, setDemoUrl] = useState("https://example.com");
  const [activeTab, setActiveTab] = useState("preview");
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-500 selection:text-white relative">
      
      {/* --- FLOATING NAVBAR --- */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'py-4' : 'py-6'}`}>
        <div className={`max-w-6xl mx-auto px-6 h-16 flex items-center justify-between transition-all duration-300 ${
            scrolled 
            ? 'bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl mx-4 lg:mx-auto' 
            : 'bg-transparent'
        }`}>
          {/* Logo */}
          <div className="flex items-center gap-2 pl-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center">
              <img src="/logo.svg" alt="QR Generator" className="w-7 h-7 object-contain filter invert" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">QR Generator</span>
          </div>

          {/* Links  */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-slate-300 hover:text-white transition">Features</a>
            <a href="#demo" className="text-sm font-medium text-slate-300 hover:text-white transition">Generator</a>
          </div>

          {/* CTA Buttons */}
          <div className="flex items-center gap-3 pr-1">
            <Link 
              href="/login" 
              className="hidden md:block text-sm font-medium text-slate-300 hover:text-white transition px-3 py-2"
            >
              Log in
            </Link>
            <Link 
              href="/register" 
              className="bg-white text-slate-900 px-5 py-2 rounded-full text-sm font-bold hover:bg-indigo-50 transition shadow-lg flex items-center gap-2"
            >
              Get Started <ChevronRight size={14} className="text-indigo-600"/>
            </Link>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION--- */}
      <section className="relative pt-40 pb-32 px-6 bg-slate-900 overflow-hidden">
        {/* Abstract Background */}
        <div className="absolute inset-0 z-0 opacity-30">
             <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-indigo-600 rounded-full blur-[120px] -translate-y-1/2"></div>
             <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-blue-600 rounded-full blur-[100px] translate-y-1/2"></div>
             <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px]"></div>
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-10 pt-8">
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-8 leading-[1.1]">
            The Enterprise-Grade <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-400">QR Infrastructure</span>
          </h1>
          
          <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed mb-12">
            Create dynamic, trackable QR codes that scale with your business. Edit destinations in real-time and get deep insights into user behavior.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Link href="/register" className="h-14 px-8 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-2 transition shadow-xl shadow-indigo-900/20 text-lg">
              Start for free <ArrowRight size={20} />
            </Link>
            <Link href="#demo" className="h-14 px-8 rounded-full bg-white/5 border border-white/10 text-white font-bold flex items-center gap-2 hover:bg-white/10 transition backdrop-blur-sm text-lg">
              View live demo
            </Link>
          </div>
        </div>
      </section>

      {/* --- OVERLAPPING GENERATOR WIDGET --- */}
      <section className="relative z-20 px-6 -mt-24">
        <div id="demo" className="max-w-5xl mx-auto bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-200 overflow-hidden">
          {/* Widget Header */}
          <div className="flex border-b border-slate-100 bg-slate-50/50 backdrop-blur-xl">
            <button 
              onClick={() => setActiveTab('preview')}
              className={`px-8 py-5 text-sm font-bold border-r border-slate-100 transition flex items-center gap-2 ${activeTab === 'preview' ? 'bg-white text-indigo-600 border-b-2 border-b-indigo-600' : 'text-slate-500 hover:text-slate-900'}`}
            >
              <Zap size={16} /> Generate QR
            </button>
            <button 
              onClick={() => setActiveTab('analytics')}
              className={`px-8 py-5 text-sm font-bold border-r border-slate-100 transition flex items-center gap-2 ${activeTab === 'analytics' ? 'bg-white text-indigo-600 border-b-2 border-b-indigo-600' : 'text-slate-500 hover:text-slate-900'}`}
            >
              <BarChart2 size={16} /> Analytics View
            </button>
          </div>

          <div className="p-8 md:p-12 min-h-[400px] flex items-center justify-center bg-white">
            {activeTab === 'preview' ? (
              <div className="w-full grid md:grid-cols-2 gap-12 items-center animate-in fade-in duration-500">
                <div className="space-y-8">
                  <div>
                    <label className="block text-sm font-bold text-slate-900 mb-2">Destination URL</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={demoUrl}
                        onChange={(e) => setDemoUrl(e.target.value)}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition shadow-sm font-medium"
                        placeholder="https://your-website.com"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-slate-900 mb-3">Customization</label>
                    <div className="flex gap-3">
                      {['#000000', '#2563eb', '#dc2626', '#16a34a'].map((color) => (
                        <div key={color} className="w-10 h-10 rounded-full cursor-pointer shadow-sm hover:scale-110 transition border-2 border-white ring-2 ring-transparent hover:ring-indigo-100" style={{ backgroundColor: color }}></div>
                      ))}
                    </div>
                  </div>

                  <div className="p-5 bg-indigo-50 rounded-2xl border border-indigo-100/50 flex gap-4">
                    <div className="bg-white p-2 rounded-xl text-indigo-600 shadow-sm h-fit">
                      <Zap size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-indigo-900">Dynamic Link Active</p>
                      <p className="text-sm text-indigo-600/80 mt-1 leading-relaxed">
                        Change this destination later without reprinting. Ideal for marketing campaigns.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center p-10 bg-slate-50 rounded-3xl border border-slate-100 shadow-inner">
                  <div className="bg-white p-5 rounded-2xl shadow-xl shadow-slate-200/50 mb-6">
                    <Canvas
                      text={demoUrl}
                      options={{
                        errorCorrectionLevel: 'M',
                        margin: 2,
                        scale: 4,
                        width: 220,
                        color: { dark: '#1e293b', light: '#ffffff' },
                      }}
                    />
                  </div>
                  <p className="text-sm text-slate-400 font-bold uppercase tracking-wider">Live Preview</p>
                </div>
              </div>
            ) : (
              <div className="w-full text-center py-10 animate-in fade-in duration-500">
                 <div className="inline-flex p-5 bg-slate-50 border border-slate-100 shadow-xl rounded-2xl mb-6">
                    <BarChart2 className="text-indigo-600" size={48} />
                 </div>
                 <h3 className="text-2xl font-bold text-slate-900 mb-3">Unlock Real-Time Data</h3>
                 <p className="text-slate-500 max-w-md mx-auto mb-8 text-lg">
                    See exactly who is scanning your codes, from where, and on what device.
                 </p>
                 <Link href="/register" className="inline-flex items-center gap-2 text-white bg-slate-900 px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition">
                    Create Free Account <ArrowRight size={16} />
                 </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* --- FEATURES BENTO GRID --- */}
      <section id="features" className="py-32 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-20 md:text-center max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">Everything needed to scale</h2>
            <p className="text-slate-500 text-xl leading-relaxed">
              We built the tools developers and marketers need. Secure, fast, and packed with data.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Card 1: Large */}
            <div className="md:col-span-2 bg-white p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 transition group">
              <div className="mb-8 w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:scale-110 transition duration-300">
                <Globe size={28} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Global Location Tracking</h3>
              <p className="text-slate-500 leading-relaxed mb-8 text-lg">
                Understand your audience with precision. Our system resolves IP addresses to countries and cities instantly, giving you a heatmap of where your products are being scanned.
              </p>
              <div className="h-40 bg-slate-50 rounded-2xl border border-slate-100 relative overflow-hidden group-hover:border-indigo-100 transition">
                <div className="absolute inset-0 bg-[radial-gradient(#e0e7ff_1px,transparent_1px)] [background-size:16px_16px] opacity-50"></div>
                <div className="absolute bottom-6 right-6 px-4 py-2 bg-white rounded-xl shadow-lg border border-slate-100 text-sm font-bold text-indigo-600 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span> Sri Lanka: 45 Scans
                </div>
              </div>
            </div>

            {/* Card 2: Small */}
            <div className="bg-white p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 transition group">
              <div className="mb-8 w-14 h-14 bg-violet-50 rounded-2xl flex items-center justify-center text-violet-600 group-hover:scale-110 transition duration-300">
                <Smartphone size={28} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Device Intelligence</h3>
              <p className="text-slate-500 leading-relaxed text-lg">
                Know if your users are on iOS, Android, or Desktop. Optimize your landing pages based on real device data.
              </p>
            </div>

            {/* Card 3: Small */}
            <div className="bg-white p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 transition group">
              <div className="mb-8 w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:scale-110 transition duration-300">
                <Lock size={28} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Enterprise Security</h3>
              <p className="text-slate-500 leading-relaxed text-lg">
                Automated malicious link detection, SSO integration, and role-based access control (RBAC) for teams.
              </p>
            </div>

            {/* Card 4: Large */}
            <div className="md:col-span-2 bg-white p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 transition group">
              <div className="mb-8 w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 group-hover:scale-110 transition duration-300">
                <Layers size={28} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Brand Customization</h3>
              <p className="text-slate-500 leading-relaxed mb-8 text-lg">
                Upload your logo, choose your brand colors, and select custom frames. Your QR codes should look like *your* company.
              </p>
              <div className="flex gap-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-900 shadow-lg"></div>
                <div className="w-14 h-14 rounded-2xl bg-indigo-600 shadow-lg"></div>
                <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-400 shadow-lg">Logo</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- CTA SECTION (Dark) --- */}
      <section className="py-24 px-6 bg-slate-900 border-t border-white/10 relative overflow-hidden">
         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[100px] pointer-events-none"></div>
         <div className="max-w-4xl mx-auto text-center relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready to get started?</h2>
            <p className="text-slate-400 text-xl mb-10">Join thousands of companies using our platform to connect the physical and digital worlds.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/register" className="h-14 px-8 rounded-full bg-white text-slate-900 font-bold flex items-center gap-2 hover:bg-indigo-50 transition text-lg">
                    Create Free Account
                </Link>
                <Link href="/login" className="h-14 px-8 rounded-full bg-transparent border border-white/20 text-white font-bold flex items-center gap-2 hover:bg-white/10 transition text-lg">
                    Login to Dashboard
                </Link>
            </div>
         </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-slate-900 text-slate-400 py-16 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-12">
            <div className="col-span-1 md:col-span-2">
                <div className="flex items-center gap-2 mb-6">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                      <img src="/logo.svg" alt="QR Generator" className="w-7 h-7 object-contain" />
                    </div>
                    <span className="text-xl font-bold text-white">QR Generator</span>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
                    The complete platform for generating, managing, and tracking QR codes at scale. Built for developers and marketers.
                </p>
            </div>
            
            <div>
                <h4 className="text-white font-bold mb-6">Product</h4>
                <ul className="space-y-4 text-sm">
                    <li><a href="#" className="hover:text-white transition">Dynamic QR</a></li>
                    <li><a href="#" className="hover:text-white transition">Static QR</a></li>
                    <li><a href="#" className="hover:text-white transition">API Documentation</a></li>
                </ul>
            </div>

            <div>
                <h4 className="text-white font-bold mb-6">Company</h4>
                <ul className="space-y-4 text-sm">
                    <li><a href="#" className="hover:text-white transition">About</a></li>
                    <li><a href="#" className="hover:text-white transition">Contact</a></li>
                    <li><a href="#" className="hover:text-white transition">Terms of Service</a></li>
                </ul>
            </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 pt-8 mt-12 border-t border-white/10 text-xs text-slate-500 flex flex-col md:flex-row justify-between gap-4">
            <p>© 2026 QR Generator Inc. All rights reserved.</p>
            <p className="flex items-center gap-1">Designed by <span className="text-slate-300 font-bold">SiliconCrib</span></p>
        </div>
      </footer>
    </div>
  );
}