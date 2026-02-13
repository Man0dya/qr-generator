"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft, Download, Palette, Image as ImageIcon,
    Settings, Save, CheckCircle2, AlertTriangle, Loader2, ChevronLeft, ChevronRight,
    Link as LinkIcon, Contact, AppWindow, Wifi, FileText
} from "lucide-react";
import StyledQrCode from "@/app/dashboard/_components/StyledQrCode";
import { buildQrCodeStylingOptions, QR_STYLE_PRESETS, type QrStylePreset } from "@/lib/qrStyling";
import { apiFetch, API_BASE } from "@/lib/api";
import { type UrlLink, urlmdCreateLink, urlmdGetLinks } from "@/lib/urlmd";

type QrType = "url" | "vcard" | "bio" | "wifi";

export default function CreateQRPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    // Dynamic Data for Types
    const [qrType, setQrType] = useState<QrType>("url");
    const [domains, setDomains] = useState<any[]>([]);
    const [selectedDomain, setSelectedDomain] = useState<number | null>(null);
    const [availableLinks, setAvailableLinks] = useState<UrlLink[]>([]);
    const [linkMode, setLinkMode] = useState<"none" | "existing" | "create">("none");
    const [selectedLinkId, setSelectedLinkId] = useState<number | null>(null);

    // Form Data
    const [url, setUrl] = useState("");
    const [vcard, setVcard] = useState({ first_name: "", last_name: "", phone: "", email: "", website: "" });
    const [bio, setBio] = useState({ title: "", description: "", image: "", links: [{ label: "My Website", url: "" }] });
    const [wifi, setWifi] = useState({ ssid: "", password: "", encryption: "WPA" });

    // Generated
    const [generatedLink, setGeneratedLink] = useState("");

    // Design State
    const [fgColor, setFgColor] = useState("#000000");
    const [bgColor, setBgColor] = useState("#ffffff");
    const [logoUrl, setLogoUrl] = useState("");
    const [logoSize, setLogoSize] = useState(30);
    const [qrStyle, setQrStyle] = useState<QrStylePreset>("square");
    const [qrSize, setQrSize] = useState(1024);
    const [downloadFormat, setDownloadFormat] = useState<"png" | "jpeg" | "webp" | "svg">("png");

    useEffect(() => {
        // Fetch custom domains
        apiFetch("/domains.php").then(res => res.json()).then(data => {
            if (data.success) setDomains(data.data);
        }).catch(() => { });

        urlmdGetLinks({ status: "all" })
            .then((data) => {
                if (data.success) {
                    setAvailableLinks(data.data || []);
                }
            })
            .catch(() => { });
    }, []);

    // Helper for QR Content Preview
    const getQrValueForPreview = () => {
        if (isSaved) return generatedLink;
        if (qrType === 'url') return url || "https://example.com";
        return "https://example.com/preview-placeholder";
    };

    const qrValue = getQrValueForPreview();

    const styleIndex = Math.max(0, QR_STYLE_PRESETS.findIndex((preset) => preset.key === qrStyle));
    const styleCount = QR_STYLE_PRESETS.length;
    const currentStyleLabel = QR_STYLE_PRESETS[styleIndex]?.label || "Style";
    const goPrevStyle = () => {
        if (isSaved) return;
        const nextIndex = (styleIndex - 1 + styleCount) % styleCount;
        setQrStyle(QR_STYLE_PRESETS[nextIndex]!.key);
    };
    const goNextStyle = () => {
        if (isSaved) return;
        const nextIndex = (styleIndex + 1) % styleCount;
        setQrStyle(QR_STYLE_PRESETS[nextIndex]!.key);
    };

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
                    if (width > height) { if (width > maxSize) { height *= maxSize / width; width = maxSize; } }
                    else { if (height > maxSize) { width *= maxSize / height; height = maxSize; } }
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
                alert("Error processing image.");
            }
        }
    };

    const handleDownload = () => {
        if (!isSaved) return alert("Please save the QR code first.");
        const filename = `qr-code-${Date.now()}`;
        const doDownload = async () => {
            const mod = await import("qr-code-styling");
            const QRCodeStyling = mod.default;
            const tempContainer = document.createElement("div");
            tempContainer.style.position = "fixed"; tempContainer.style.left = "-9999px";
            document.body.appendChild(tempContainer);

            const designConfig = { fgColor, bgColor, logo: logoUrl, logoSize, style: qrStyle };
            const format = downloadFormat === "svg" ? "svg" : "canvas";
            const exportSize = downloadFormat === "svg" ? 1024 : qrSize;

            const qr = new QRCodeStyling(buildQrCodeStylingOptions({ data: qrValue, size: exportSize, format, design: designConfig }));
            qr.append(tempContainer);
            await new Promise((r) => requestAnimationFrame(() => r(null)));
            const raw = await qr.getRawData(downloadFormat);
            if (!raw) { document.body.removeChild(tempContainer); return; }

            const mime = downloadFormat === "svg" ? "image/svg+xml" : `image/${downloadFormat}`;
            const blob = raw instanceof Blob ? raw : new Blob([raw as any], { type: mime });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url; link.download = `${filename}.${downloadFormat}`;
            link.click();
            URL.revokeObjectURL(url);
            document.body.removeChild(tempContainer);
        };
        doDownload();
    };

    const handleSave = async () => {
        setLoading(true);
        const designConfig = { fgColor, bgColor, logo: logoUrl, logoSize, style: qrStyle };

        // Construct Payload
        const payload: any = {
            qr_type: qrType,
            custom_domain_id: selectedDomain,
            design_config: designConfig
        };

        if (qrType === 'url') {
            if (!url) { alert("Enter URL"); setLoading(false); return; }
            payload.destination_url = url;

            if (linkMode === "existing") {
                if (!selectedLinkId) {
                    alert("Select a short link to attach.");
                    setLoading(false);
                    return;
                }
                payload.url_link_id = selectedLinkId;
            } else if (linkMode === "create") {
                const created = await urlmdCreateLink({
                    destination_url: url,
                    title: `QR link ${new Date().toLocaleString()}`,
                    redirect_type: "302",
                });

                if (!created?.success || !created?.data?.id) {
                    alert(created?.error || "Failed to create short link");
                    setLoading(false);
                    return;
                }

                payload.url_link_id = created.data.id;
            }
        } else if (qrType === 'vcard') {
            payload.qr_data = vcard;
            payload.destination_url = "dynamic"; // Placeholder
        } else if (qrType === 'bio') {
            payload.qr_data = bio;
            payload.destination_url = "dynamic";
        } else if (qrType === 'wifi') {
            payload.qr_data = wifi;
            payload.destination_url = "dynamic";
        }

        try {
            const res = await apiFetch("/create_qr.php", {
                method: "POST",
                body: JSON.stringify(payload),
            });
            const data = await res.json();

            if (data.success) {
                let domainHost = API_BASE;
                if (selectedDomain) {
                    const d = domains.find(d => d.id === selectedDomain);
                    if (d) {
                        domainHost = `http://${d.domain}`;
                    }
                }
                const trackingUrl = `${domainHost}/redirect.php?c=${data.short_code}`;

                setGeneratedLink(trackingUrl);
                setIsSaved(true);
            } else {
                alert(data.error || "Failed to save.");
            }
        } catch (err) {
            alert("Network error.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto pb-20">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <button onClick={() => router.back()} className="flex items-center text-muted-foreground hover:text-primary transition mb-2">
                        <ArrowLeft size={16} className="mr-1" /> Back
                    </button>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight">Design Studio</h1>
                </div>

                {!isSaved ? (
                    <button onClick={handleSave} disabled={loading} className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold hover:bg-primary/90 transition shadow-lg shadow-primary/20 flex items-center gap-2 disabled:opacity-50">
                        {loading ? <><Loader2 className="animate-spin" size={20} /> Saving...</> : <><Save size={20} /> Generate & Save</>}
                    </button>
                ) : (
                    <div className="flex gap-3">
                        <button onClick={() => router.push('/dashboard')} className="px-6 py-3 rounded-xl font-bold text-muted-foreground hover:bg-muted transition">Done</button>
                        <button className="bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 cursor-default pointer-events-none"><CheckCircle2 size={20} /> Saved</button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* LEFT: CONTROLS */}
                <div className="lg:col-span-7 space-y-6">

                    {/* TYPE SELECTOR */}
                    <div className="bg-card p-4 rounded-2xl border border-border shadow-sm overflow-hidden flex gap-2">
                        {[
                            { id: 'url', icon: LinkIcon, label: 'Website' },
                            { id: 'vcard', icon: Contact, label: 'vCard' },
                            { id: 'bio', icon: FileText, label: 'Bio Page' },
                        ].map((t) => (
                            <button
                                key={t.id}
                                onClick={() => !isSaved && setQrType(t.id as QrType)}
                                disabled={isSaved}
                                className={`flex-1 py-3 px-2 rounded-xl flex flex-col items-center gap-2 transition ${qrType === t.id ? 'bg-primary/10 text-primary font-bold ring-2 ring-primary/20' : 'text-muted-foreground hover:bg-muted'}`}
                            >
                                <t.icon size={20} /> <span className="text-xs">{t.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* DYNAMIC CONTENT FORM */}
                    <div className="bg-card p-6 rounded-2xl border border-border shadow-sm relative">
                        {isSaved && <div className="absolute inset-0 bg-background/50 z-10 cursor-not-allowed"></div>}

                        <div className="mb-6">
                            <label className="block text-xs font-bold text-muted-foreground mb-2 uppercase">Domain (White-label)</label>
                            <select
                                value={selectedDomain || ""}
                                onChange={(e) => setSelectedDomain(Number(e.target.value) || null)}
                                className="w-full p-3 bg-muted/50 border border-border rounded-xl outline-none focus:border-primary text-foreground"
                            >
                                <option value="">Default (System)</option>
                                {domains.map(d => (
                                    <option key={d.id} value={d.id}>{d.domain}</option>
                                ))}
                            </select>
                        </div>

                        {qrType === 'url' && (
                            <div className="space-y-4">
                                <label className="block text-sm font-semibold text-foreground mb-2">Destination URL</label>
                                <input type="url" placeholder="https://example.com" value={url} onChange={(e) => setUrl(e.target.value)} className="w-full p-3 bg-muted/50 border border-border rounded-xl outline-none focus:border-primary text-foreground placeholder:text-muted-foreground" />

                                <div className="border border-border rounded-xl p-4 bg-background/40 space-y-3">
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Short Link Options</p>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => { setLinkMode("none"); setSelectedLinkId(null); }}
                                            className={`h-9 rounded-lg border text-xs font-bold ${linkMode === "none" ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground hover:bg-muted"}`}
                                        >
                                            No managed link
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setLinkMode("existing")}
                                            className={`h-9 rounded-lg border text-xs font-bold ${linkMode === "existing" ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground hover:bg-muted"}`}
                                        >
                                            Attach existing
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setLinkMode("create")}
                                            className={`h-9 rounded-lg border text-xs font-bold ${linkMode === "create" ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground hover:bg-muted"}`}
                                        >
                                            Track this QR with URLMD
                                        </button>
                                    </div>

                                    {linkMode === "existing" && (
                                        <select
                                            value={selectedLinkId || ""}
                                            onChange={(e) => setSelectedLinkId(Number(e.target.value) || null)}
                                            className="w-full p-3 bg-muted/50 border border-border rounded-xl outline-none focus:border-primary text-foreground"
                                        >
                                            <option value="">Select URLMD link</option>
                                            {availableLinks.map((link) => (
                                                <option key={link.id} value={link.id}>
                                                    {link.short_code} • {link.title || link.destination_url}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                            </div>
                        )}

                        {qrType === 'vcard' && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <input placeholder="First Name" value={vcard.first_name} onChange={e => setVcard({ ...vcard, first_name: e.target.value })} className="p-3 bg-muted/50 border border-border rounded-xl w-full text-foreground placeholder:text-muted-foreground" />
                                    <input placeholder="Last Name" value={vcard.last_name} onChange={e => setVcard({ ...vcard, last_name: e.target.value })} className="p-3 bg-muted/50 border border-border rounded-xl w-full text-foreground placeholder:text-muted-foreground" />
                                </div>
                                <input placeholder="Phone" value={vcard.phone} onChange={e => setVcard({ ...vcard, phone: e.target.value })} className="p-3 bg-muted/50 border border-border rounded-xl w-full text-foreground placeholder:text-muted-foreground" />
                                <input placeholder="Email" value={vcard.email} onChange={e => setVcard({ ...vcard, email: e.target.value })} className="p-3 bg-muted/50 border border-border rounded-xl w-full text-foreground placeholder:text-muted-foreground" />
                                <input placeholder="Website" value={vcard.website} onChange={e => setVcard({ ...vcard, website: e.target.value })} className="p-3 bg-muted/50 border border-border rounded-xl w-full text-foreground placeholder:text-muted-foreground" />
                            </div>
                        )}

                        {qrType === 'bio' && (
                            <div className="space-y-4">
                                <input placeholder="Page Title (e.g. My Links)" value={bio.title} onChange={e => setBio({ ...bio, title: e.target.value })} className="p-3 bg-muted/50 border border-border rounded-xl w-full text-foreground placeholder:text-muted-foreground" />
                                <textarea placeholder="Description" value={bio.description} onChange={e => setBio({ ...bio, description: e.target.value })} className="p-3 bg-muted/50 border border-border rounded-xl w-full h-20 text-foreground placeholder:text-muted-foreground" />
                                {bio.links.map((link, idx) => (
                                    <div key={idx} className="flex gap-2">
                                        <input placeholder="Label" value={link.label} onChange={e => { const newLinks = [...bio.links]; newLinks[idx].label = e.target.value; setBio({ ...bio, links: newLinks }) }} className="p-3 bg-muted/50 border border-border rounded-xl flex-1 text-foreground placeholder:text-muted-foreground" />
                                        <input placeholder="URL" value={link.url} onChange={e => { const newLinks = [...bio.links]; newLinks[idx].url = e.target.value; setBio({ ...bio, links: newLinks }) }} className="p-3 bg-muted/50 border border-border rounded-xl flex-1 text-foreground placeholder:text-muted-foreground" />
                                    </div>
                                ))}
                                <button onClick={() => setBio({ ...bio, links: [...bio.links, { label: "", url: "" }] })} className="text-sm text-primary font-bold">+ Add Link</button>
                            </div>
                        )}
                    </div>

                    {/* APPEARANCE */}
                    <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
                        <h3 className="text-sm font-bold text-foreground uppercase tracking-wide mb-6 flex items-center gap-2"><Palette size={16} /> Appearance</h3>
                        <div className="grid grid-cols-2 gap-6 mb-6">
                            <div>
                                <label className="block text-xs font-bold text-muted-foreground mb-2">Foreground</label>
                                <div className="flex items-center gap-3">
                                    <input type="color" value={fgColor} onChange={(e) => setFgColor(e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0" />
                                    <span className="text-sm font-mono text-muted-foreground uppercase">{fgColor}</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-muted-foreground mb-2">Background</label>
                                <div className="flex items-center gap-3">
                                    <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0" />
                                    <span className="text-sm font-mono text-muted-foreground uppercase">{bgColor}</span>
                                </div>
                            </div>
                        </div>
                        <div className="pt-6 border-t border-border">
                            <div className="flex items-center gap-4">
                                <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg text-sm font-medium transition">
                                    <ImageIcon size={16} /> Choose Logo
                                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                                </label>
                                {logoUrl && <button onClick={() => setLogoUrl("")} className="text-destructive text-sm hover:underline">Remove</button>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT: PREVIEW */}
                <div className="lg:col-span-5">
                    <div className="sticky top-8">
                        <div className="bg-card p-8 rounded-3xl border border-border shadow-xl shadow-black/5 flex flex-col items-center justify-center min-h-[400px]">
                            <div className="relative group w-full flex flex-col items-center">
                                {isSaved ? (
                                    <div className="mb-4 flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-bold border border-emerald-500/20"><CheckCircle2 size={14} /> Tracking Active</div>
                                ) : (
                                    <div className="mb-4 flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full text-xs font-bold border border-amber-500/20"><AlertTriangle size={14} /> Preview Mode</div>
                                )}

                                <div className="w-full flex items-center justify-between mb-3">
                                    <button type="button" onClick={goPrevStyle} disabled={isSaved} className="px-3 py-2 rounded-lg border border-border bg-card text-muted-foreground disabled:opacity-50 hover:bg-muted"><ChevronLeft size={18} /></button>
                                    <div className="text-center">
                                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Style</p>
                                        <p className="text-sm font-bold text-foreground">{currentStyleLabel}</p>
                                    </div>
                                    <button type="button" onClick={goNextStyle} disabled={isSaved} className="px-3 py-2 rounded-lg border border-border bg-card text-muted-foreground disabled:opacity-50 hover:bg-muted"><ChevronRight size={18} /></button>
                                </div>

                                <div className="p-4 bg-white/50 dark:bg-black/20 rounded-xl shadow-sm border border-border backdrop-blur-sm">
                                    <StyledQrCode value={qrValue} size={300} design={{ fgColor, bgColor, logo: logoUrl, logoSize, style: qrStyle }} className="w-[300px] h-[300px]" />
                                </div>
                                <p className="text-center text-xs text-muted-foreground mt-6 font-mono max-w-xs break-all">Target: {qrType === 'url' ? qrValue : `[${qrType.toUpperCase()} DATA]`}</p>
                            </div>

                            {isSaved && (
                                <button onClick={handleDownload} className="w-full mt-6 py-3 bg-foreground text-background rounded-xl font-bold hover:bg-foreground/90 transition flex items-center justify-center gap-2">
                                    <Download size={18} /> Download Final QR
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}