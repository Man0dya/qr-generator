"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { QRCodeSVG, QRCodeCanvas } from "qrcode.react";
import { 
  ArrowLeft, Download, Palette, Image as ImageIcon, 
  Settings, Save, CheckCircle2, AlertTriangle, Loader2
} from "lucide-react";

export default function CreateQRPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // Core Data
  const [inputUrl, setInputUrl] = useState("");
  const [generatedLink, setGeneratedLink] = useState(""); 
  const [isSaved, setIsSaved] = useState(false);
  
  // Design State
  const [fgColor, setFgColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoSize, setLogoSize] = useState(30);
  const [qrSize, setQrSize] = useState(1024);
  const [downloadFormat, setDownloadFormat] = useState("png");

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // QR Value Logic
  const qrValue = isSaved ? generatedLink : inputUrl;

  // Compresses logo to ensure it fits in the database
  const resizeImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxSize = 512;

          if (width > height) {
            if (width > maxSize) {
              height *= maxSize / width;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width *= maxSize / height;
              height = maxSize;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/png', 0.8));
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const resizedLogo = await resizeImage(file);
        setLogoUrl(resizedLogo);
      } catch (err) {
        alert("Error processing image. Please try a smaller file.");
      }
    }
  };

  const handleDownload = () => {
    if (!isSaved) return alert("Please save the QR code first to generate the tracking link.");
    
    const filename = `qr-code-${Date.now()}`;

    if (downloadFormat === 'svg') {
        if (!svgRef.current) return;
        const svgData = new XMLSerializer().serializeToString(svgRef.current);
        const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${filename}.svg`;
        link.click();
    } else {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        setTimeout(() => {
            const link = document.createElement("a");
            link.download = `${filename}.${downloadFormat}`;
            link.href = canvas.toDataURL(`image/${downloadFormat}`);
            link.click();
        }, 100);
    }
  };

  const handleSave = async () => {
    if (!inputUrl) return alert("Please enter a URL first");
    setLoading(true);
    
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    
    const designConfig = {
        fgColor,
        bgColor,
        logo: logoUrl,
        logoSize,
    };

    try {
      const res = await fetch("http://localhost:8000/create_qr.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            user_id: user.id,
            destination_url: inputUrl,
            design_config: designConfig
        }),
      });
      
      const text = await res.text();
      try {
          const data = JSON.parse(text);
          if (data.success) {
            const trackingUrl = `http://localhost:8000/redirect.php?c=${data.short_code}`;
            setGeneratedLink(trackingUrl);
            setIsSaved(true);
          } else {
            alert(data.error || "Failed to save. Try removing the logo.");
          }
      } catch (e) {
          console.error("Server Error:", text);
          alert("Server error. Your logo might be too large.");
      }
    } catch (err) {
      alert("Network error. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-20">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
            <button onClick={() => router.back()} className="flex items-center text-slate-500 hover:text-indigo-600 transition mb-2">
                <ArrowLeft size={16} className="mr-1" /> Back
            </button>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Design Studio</h1>
        </div>
        
        {!isSaved ? (
            <button 
                onClick={handleSave}
                disabled={loading || !inputUrl}
                className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 flex items-center gap-2 disabled:opacity-50"
            >
                {loading ? <><Loader2 className="animate-spin" size={20} /> Saving...</> : <><Save size={20} /> Generate & Save</>}
            </button>
        ) : (
             <div className="flex gap-3">
                <button 
                    onClick={() => router.push('/dashboard')}
                    className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                    Done
                </button>
                <button 
                    className="bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 cursor-default pointer-events-none"
                >
                    <CheckCircle2 size={20} /> Saved
                </button>
            </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT: CONTROLS */}
        <div className="lg:col-span-7 space-y-6">
            
            {/* 1. Content Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                {isSaved && <div className="absolute inset-0 bg-white/50 z-10 cursor-not-allowed"></div>}
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4 flex items-center gap-2">
                    <Settings size={16} /> Content
                </h3>
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Destination URL</label>
                    <input 
                        type="url" 
                        placeholder="https://example.com"
                        value={inputUrl}
                        onChange={(e) => setInputUrl(e.target.value)}
                        disabled={isSaved}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition font-medium disabled:opacity-70"
                    />
                </div>
            </div>

            {/* 2. Customization Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-6 flex items-center gap-2">
                    <Palette size={16} /> Appearance
                </h3>
                
                <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-2">Foreground</label>
                        <div className="flex items-center gap-3">
                            <input 
                                type="color" 
                                value={fgColor}
                                onChange={(e) => setFgColor(e.target.value)}
                                className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0"
                            />
                            <span className="text-sm font-mono text-slate-600 uppercase">{fgColor}</span>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-2">Background</label>
                        <div className="flex items-center gap-3">
                            <input 
                                type="color" 
                                value={bgColor}
                                onChange={(e) => setBgColor(e.target.value)}
                                className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0"
                            />
                            <span className="text-sm font-mono text-slate-600 uppercase">{bgColor}</span>
                        </div>
                    </div>
                </div>

                <div className="pt-6 border-t border-slate-100">
                    <label className="block text-xs font-bold text-slate-500 mb-3 flex items-center justify-between">
                        <span>Upload Logo</span>
                        {logoUrl && <button onClick={() => setLogoUrl("")} className="text-red-500 hover:underline">Remove</button>}
                    </label>
                    <div className="flex items-center gap-4">
                        <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition">
                            <ImageIcon size={16} /> Choose Image
                            <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                        </label>
                        {logoUrl && <span className="text-xs text-emerald-600 flex items-center gap-1"><CheckCircle2 size={12}/> Ready</span>}
                    </div>

                    {logoUrl && (
                        <div className="mt-4">
                             <label className="block text-xs font-bold text-slate-500 mb-2">Logo Scale: {logoSize}%</label>
                             <input 
                                type="range" 
                                min="10" max="40" 
                                value={logoSize} 
                                onChange={(e) => setLogoSize(parseInt(e.target.value))}
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                             />
                        </div>
                    )}
                </div>
            </div>

            {/* 3. Download Options */}
            <div className={`bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-opacity duration-300 ${!isSaved ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                        <Download size={16} /> Export Settings
                    </h3>
                    {!isSaved && <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded">Save to Unlock</span>}
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-2">Format</label>
                        <select 
                            value={downloadFormat}
                            onChange={(e) => setDownloadFormat(e.target.value)}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500"
                        >
                            <option value="png">PNG (Image)</option>
                            <option value="jpeg">JPEG (Image)</option>
                            <option value="webp">WebP (Web)</option>
                            <option value="svg">SVG (Vector)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-2">Size (px)</label>
                        <select 
                            value={qrSize}
                            onChange={(e) => setQrSize(parseInt(e.target.value))}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500"
                            disabled={downloadFormat === 'svg'}
                        >
                            <option value="512">512px</option>
                            <option value="1024">1024px</option>
                            <option value="2048">2048px (High)</option>
                            <option value="4096">4096px (Print)</option>
                        </select>
                    </div>
                </div>
                
                <button 
                    onClick={handleDownload}
                    className="w-full mt-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition flex items-center justify-center gap-2"
                >
                    <Download size={18} /> Download Final QR
                </button>
            </div>
        </div>

        {/* RIGHT: PREVIEW */}
        <div className="lg:col-span-5">
            <div className="sticky top-8">
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 flex flex-col items-center justify-center min-h-[400px]">
                    
                    {!inputUrl ? (
                        <div className="text-center text-slate-400">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Settings size={24} />
                            </div>
                            <p>Enter a destination URL to generate preview</p>
                        </div>
                    ) : (
                        <div className="relative group w-full flex flex-col items-center">
                            
                            {!isSaved ? (
                                <div className="mb-4 flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full text-xs font-bold border border-amber-100">
                                    <AlertTriangle size={14} /> Preview Mode (Direct Link)
                                </div>
                            ) : (
                                <div className="mb-4 flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-100">
                                    <CheckCircle2 size={14} /> Live Tracking Link Active
                                </div>
                            )}

                            {/* Visible SVG for Preview */}
                            <div className="p-4 bg-white rounded-xl shadow-sm border border-slate-100">
                                <QRCodeSVG
                                    ref={svgRef}
                                    value={qrValue} 
                                    size={300}
                                    fgColor={fgColor}
                                    bgColor={bgColor}
                                    level="H"
                                    includeMargin={true}
                                    imageSettings={logoUrl ? {
                                        src: logoUrl,
                                        height: 300 * (logoSize / 100),
                                        width: 300 * (logoSize / 100),
                                        excavate: true,
                                    } : undefined}
                                />
                            </div>

                            {/* Hidden Canvas for Download Generation */}
                            <div className="hidden">
                                <QRCodeCanvas
                                    ref={canvasRef}
                                    value={qrValue}
                                    size={qrSize}
                                    fgColor={fgColor}
                                    bgColor={bgColor}
                                    level="H"
                                    includeMargin={true}
                                    imageSettings={logoUrl ? {
                                        src: logoUrl,
                                        height: qrSize * (logoSize / 100),
                                        width: qrSize * (logoSize / 100),
                                        excavate: true,
                                    } : undefined}
                                />
                            </div>
                            
                            <p className="text-center text-xs text-slate-400 mt-6 font-mono max-w-xs break-all">
                                Target: {qrValue}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>

      </div>
    </div>
  );
}