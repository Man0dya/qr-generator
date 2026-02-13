"use client";

import { useEffect, useMemo, useState } from "react";
import { UserPlus, Settings, AlertTriangle, ToggleLeft, ToggleRight } from "lucide-react";

type SystemSetting = { setting_key: string; setting_value: string };

type Props = {
    maintenance: string;
    settings?: SystemSetting[];
    onToggleMaintenance: (newVal: string) => void;
    onCreateUser: (payload: Record<string, unknown>) => void;
    onUpdateSettings?: (settings: Record<string, string>) => void;
};

function getSetting(settings: SystemSetting[] | undefined, key: string, fallback = ""): string {
    const found = (settings || []).find((s) => s.setting_key === key);
    return found?.setting_value ?? fallback;
}

function parseList(value: string): string[] {
    const parts = value
        .split(/[\r\n,]+/)
        .map((s) => s.trim())
        .filter(Boolean);
    const unique = new Set<string>();
    for (const p of parts) unique.add(p);
    return Array.from(unique);
}

function serializeList(items: string[]): string {
    return items
        .map((s) => s.trim())
        .filter(Boolean)
        .join("\n");
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
    return (
        <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-xs font-semibold border border-border">
            <span className="truncate max-w-[220px]" title={label}>
                {label}
            </span>
            <button
                type="button"
                onClick={onRemove}
                className="w-5 h-5 inline-flex items-center justify-center rounded-full bg-card border border-border text-muted-foreground hover:text-destructive hover:border-destructive/30 transition"
                aria-label={`Remove ${label}`}
                title="Remove"
            >
                ×
            </button>
        </span>
    );
}

export default function SystemControls({ maintenance, settings, onToggleMaintenance, onCreateUser, onUpdateSettings }: Props) {
    const [newUserEmail, setNewUserEmail] = useState("");
    const [newUserPass, setNewUserPass] = useState("");
    const [newUserRole, setNewUserRole] = useState("user");

    const [blockedDomains, setBlockedDomains] = useState("");
    const [blockedKeywords, setBlockedKeywords] = useState("");
    const [blockedTlds, setBlockedTlds] = useState("");
    const [autoFlagThreshold, setAutoFlagThreshold] = useState("40");
    const [autoBanThreshold, setAutoBanThreshold] = useState("80");

    const [newDomainRule, setNewDomainRule] = useState("");
    const [newKeywordRule, setNewKeywordRule] = useState("");
    const [newTldRule, setNewTldRule] = useState("");
    const [showAdvanced, setShowAdvanced] = useState(false);

    useEffect(() => {
        setBlockedDomains(getSetting(settings, "blocked_domains", ""));
        setBlockedKeywords(getSetting(settings, "blocked_keywords", ""));
        setBlockedTlds(getSetting(settings, "blocked_tlds", ""));
        setAutoFlagThreshold(getSetting(settings, "auto_flag_score_threshold", "40"));
        setAutoBanThreshold(getSetting(settings, "auto_ban_score_threshold", "80"));
    }, [settings]);

    const thresholdsOk = useMemo(() => {
        const f = Number(autoFlagThreshold);
        const b = Number(autoBanThreshold);
        if (!Number.isFinite(f) || !Number.isFinite(b)) return false;
        if (f < 0 || f > 100 || b < 0 || b > 100) return false;
        return b >= f;
    }, [autoFlagThreshold, autoBanThreshold]);

    const domainList = useMemo(() => parseList(blockedDomains), [blockedDomains]);
    const keywordList = useMemo(() => parseList(blockedKeywords), [blockedKeywords]);
    const tldList = useMemo(() => parseList(blockedTlds), [blockedTlds]);

    const addDomain = () => {
        const next = newDomainRule.trim();
        if (!next) return;
        setBlockedDomains(serializeList([...domainList, next]));
        setNewDomainRule("");
    };

    const addKeyword = () => {
        const next = newKeywordRule.trim();
        if (!next) return;
        setBlockedKeywords(serializeList([...keywordList, next]));
        setNewKeywordRule("");
    };

    const addTld = () => {
        const next = newTldRule.trim();
        if (!next) return;
        setBlockedTlds(serializeList([...tldList, next]));
        setNewTldRule("");
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onCreateUser({ email: newUserEmail, password: newUserPass, role: newUserRole });
    };

    const handleSaveSafety = (e: React.FormEvent) => {
        e.preventDefault();
        if (!onUpdateSettings) return;
        if (!thresholdsOk) {
            alert("Thresholds must be numbers 0-100 and auto-ban must be >= auto-flag.");
            return;
        }
        onUpdateSettings({
            blocked_domains: blockedDomains,
            blocked_keywords: blockedKeywords,
            blocked_tlds: blockedTlds,
            auto_flag_score_threshold: autoFlagThreshold,
            auto_ban_score_threshold: autoBanThreshold,
        });
    };

    return (
        <div className="space-y-8">
            {/* Unwanted Link Detection (primary) */}
            <div className="bg-card p-8 rounded-2xl border border-border shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-destructive/10 text-destructive rounded-lg"><AlertTriangle size={20} /></div>
                    <div>
                        <h3 className="text-lg font-bold text-foreground">Unwanted Links</h3>
                        <p className="text-xs text-muted-foreground">Auto-flag / auto-ban rules</p>
                    </div>
                </div>

                <form onSubmit={handleSaveSafety} className="space-y-4">
                    {/* Blocked Domains */}
                    <div className="p-4 rounded-xl border border-border bg-muted/30">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <label className="block text-sm font-bold text-foreground">Blocked domains</label>
                                <p className="text-xs text-muted-foreground mt-0.5">Supports exact, <span className="font-mono">.example.com</span>, and <span className="font-mono">*.example.com</span></p>
                            </div>
                        </div>

                        <div className="mt-3 flex gap-2">
                            <input
                                className="flex-1 bg-background border border-border rounded-lg p-2.5 outline-none focus:border-primary transition text-sm text-foreground placeholder:text-muted-foreground"
                                value={newDomainRule}
                                onChange={(e) => setNewDomainRule(e.target.value)}
                                placeholder="Add domain rule"
                            />
                            <button
                                type="button"
                                onClick={addDomain}
                                className="px-3 py-2.5 rounded-lg text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition"
                            >
                                Add
                            </button>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                            {domainList.length === 0 ? (
                                <span className="text-xs text-muted-foreground">No blocked domains.</span>
                            ) : (
                                domainList.map((d) => (
                                    <Chip
                                        key={d}
                                        label={d}
                                        onRemove={() => setBlockedDomains(serializeList(domainList.filter((x) => x !== d)))}
                                    />
                                ))
                            )}
                        </div>
                    </div>

                    {/* Blocked Keywords */}
                    <div className="p-4 rounded-xl border border-border bg-muted/30">
                        <div>
                            <label className="block text-sm font-bold text-foreground">Blocked keywords</label>
                            <p className="text-xs text-muted-foreground mt-0.5">Matched against the full URL (case-insensitive)</p>
                        </div>

                        <div className="mt-3 flex gap-2">
                            <input
                                className="flex-1 bg-background border border-border rounded-lg p-2.5 outline-none focus:border-primary transition text-sm text-foreground placeholder:text-muted-foreground"
                                value={newKeywordRule}
                                onChange={(e) => setNewKeywordRule(e.target.value)}
                                placeholder="Add keyword"
                            />
                            <button
                                type="button"
                                onClick={addKeyword}
                                className="px-3 py-2.5 rounded-lg text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition"
                            >
                                Add
                            </button>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                            {keywordList.length === 0 ? (
                                <span className="text-xs text-muted-foreground">No blocked keywords.</span>
                            ) : (
                                keywordList.map((k) => (
                                    <Chip
                                        key={k}
                                        label={k}
                                        onRemove={() => setBlockedKeywords(serializeList(keywordList.filter((x) => x !== k)))}
                                    />
                                ))
                            )}
                        </div>
                    </div>

                    {/* Blocked TLDs */}
                    <div className="p-4 rounded-xl border border-border bg-muted/30">
                        <div>
                            <label className="block text-sm font-bold text-foreground">Blocked TLDs (optional)</label>
                            <p className="text-xs text-muted-foreground mt-0.5">Examples: <span className="font-mono">zip</span>, <span className="font-mono">mov</span></p>
                        </div>

                        <div className="mt-3 flex gap-2">
                            <input
                                className="flex-1 bg-background border border-border rounded-lg p-2.5 outline-none focus:border-primary transition text-sm text-foreground placeholder:text-muted-foreground"
                                value={newTldRule}
                                onChange={(e) => setNewTldRule(e.target.value)}
                                placeholder="Add TLD"
                            />
                            <button
                                type="button"
                                onClick={addTld}
                                className="px-3 py-2.5 rounded-lg text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition"
                            >
                                Add
                            </button>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                            {tldList.length === 0 ? (
                                <span className="text-xs text-muted-foreground">No blocked TLDs.</span>
                            ) : (
                                tldList.map((t) => (
                                    <Chip
                                        key={t}
                                        label={t}
                                        onRemove={() => setBlockedTlds(serializeList(tldList.filter((x) => x !== t)))}
                                    />
                                ))
                            )}
                        </div>
                    </div>

                    {/* Thresholds */}
                    <div className="p-4 rounded-xl border border-border bg-muted/30">
                        <label className="block text-sm font-bold text-foreground mb-3">Heuristic thresholds</label>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-semibold text-muted-foreground mb-1">Auto-flag score</label>
                                <input
                                    type="number"
                                    min={0}
                                    max={100}
                                    className="w-full bg-background border border-border rounded-lg p-2.5 outline-none focus:border-primary transition text-foreground"
                                    value={autoFlagThreshold}
                                    onChange={(e) => setAutoFlagThreshold(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-muted-foreground mb-1">Auto-ban score</label>
                                <input
                                    type="number"
                                    min={0}
                                    max={100}
                                    className="w-full bg-background border border-border rounded-lg p-2.5 outline-none focus:border-primary transition text-foreground"
                                    value={autoBanThreshold}
                                    onChange={(e) => setAutoBanThreshold(e.target.value)}
                                />
                            </div>
                        </div>
                        {!thresholdsOk ? (
                            <p className="text-xs text-destructive mt-2">Auto-ban must be greater than or equal to auto-flag.</p>
                        ) : null}
                    </div>

                    {/* Advanced */}
                    <div className="pt-2">
                        <button
                            type="button"
                            onClick={() => setShowAdvanced((v) => !v)}
                            className="text-xs font-bold text-muted-foreground hover:text-foreground transition"
                        >
                            {showAdvanced ? "Hide" : "Show"} advanced bulk edit
                        </button>
                        {showAdvanced ? (
                            <div className="mt-3 space-y-3">
                                <div>
                                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">Blocked domains (raw)</label>
                                    <textarea
                                        className="w-full bg-background border border-border rounded-lg p-2.5 outline-none focus:border-primary transition min-h-[86px] text-sm text-foreground"
                                        value={blockedDomains}
                                        onChange={(e) => setBlockedDomains(e.target.value)}
                                        placeholder="one per line"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">Blocked keywords (raw)</label>
                                    <textarea
                                        className="w-full bg-background border border-border rounded-lg p-2.5 outline-none focus:border-primary transition min-h-[86px] text-sm text-foreground"
                                        value={blockedKeywords}
                                        onChange={(e) => setBlockedKeywords(e.target.value)}
                                        placeholder="one per line"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">Blocked TLDs (raw)</label>
                                    <textarea
                                        className="w-full bg-background border border-border rounded-lg p-2.5 outline-none focus:border-primary transition min-h-[60px] text-sm text-foreground"
                                        value={blockedTlds}
                                        onChange={(e) => setBlockedTlds(e.target.value)}
                                        placeholder="zip\nmov\nclick"
                                    />
                                </div>
                            </div>
                        ) : null}
                    </div>

                    <button
                        type="submit"
                        disabled={!onUpdateSettings || !thresholdsOk}
                        className={
                            "w-full font-bold py-3 rounded-xl transition shadow-lg mt-2 " +
                            (thresholdsOk
                                ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/20"
                                : "bg-muted text-muted-foreground cursor-not-allowed")
                        }
                    >
                        Save Link Safety Rules
                    </button>
                </form>
            </div>

            {/* Secondary controls */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* System Controls */}
                <div className="bg-card p-8 rounded-2xl border border-border shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-muted text-muted-foreground rounded-lg"><Settings size={20} /></div>
                        <div>
                            <h3 className="text-lg font-bold text-foreground">System Controls</h3>
                            <p className="text-xs text-muted-foreground">Operational switches and safety</p>
                        </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-muted/30 border border-border rounded-xl">
                        <div className="flex items-center gap-3">
                            <div className="text-amber-500"><AlertTriangle size={20} /></div>
                            <div>
                                <p className="font-bold text-foreground">Maintenance Mode</p>
                                <p className="text-xs text-muted-foreground">Stop new QR creation</p>
                            </div>
                        </div>
                        <button onClick={() => onToggleMaintenance(maintenance === 'true' ? 'false' : 'true')} className={`transition-transform duration-200 hover:scale-110 ${maintenance === 'true' ? 'text-primary' : 'text-muted-foreground/50'}`}>
                            {maintenance === 'true' ? <ToggleRight size={40} /> : <ToggleLeft size={40} />}
                        </button>
                    </div>
                </div>

                {/* Create User */}
                <div className="bg-card p-8 rounded-2xl border border-border shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-primary/10 text-primary rounded-lg"><UserPlus size={20} /></div>
                        <div>
                            <h3 className="text-lg font-bold text-foreground">Create Account</h3>
                            <p className="text-xs text-muted-foreground">Provision a new user quickly</p>
                        </div>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-muted-foreground mb-1">Email Address</label>
                            <input type="email" required className="w-full bg-background border border-border rounded-lg p-2.5 outline-none focus:border-primary transition text-foreground" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-muted-foreground mb-1">Password</label>
                            <input type="password" required className="w-full bg-background border border-border rounded-lg p-2.5 outline-none focus:border-primary transition text-foreground" value={newUserPass} onChange={e => setNewUserPass(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-muted-foreground mb-1">Role</label>
                            <select className="w-full bg-background border border-border rounded-lg p-2.5 outline-none focus:border-primary transition text-foreground" value={newUserRole} onChange={e => setNewUserRole(e.target.value)}>
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                                <option value="super_admin">Super Admin</option>
                            </select>
                        </div>
                        <button type="submit" className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl hover:bg-primary/90 transition shadow-lg shadow-primary/20 mt-2">
                            Create Account
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}