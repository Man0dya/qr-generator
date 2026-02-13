"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, ArrowRight, AlertCircle, ChevronLeft, Eye, EyeOff } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Logo } from "@/components/Logo";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await apiFetch("/login.php", {
                method: "POST",
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (data.success) {
                localStorage.setItem("user", JSON.stringify(data.user));
                if (data.session_id != null) {
                    localStorage.setItem("session_id", String(data.session_id));
                }
                const role = data.user?.role;
                const destination =
                    role === "super_admin" ? "/super-admin" : role === "admin" ? "/admin" : "/dashboard";
                setTimeout(() => router.push(destination), 500);
            } else {
                setError(data.error || "Invalid credentials.");
                setLoading(false);
            }
        } catch {
            setError("Unable to connect to server.");
            setLoading(false);
        }
    };

    return (
        <div className="h-screen flex bg-white text-slate-900 font-sans overflow-hidden">

            {/* --- BRANDING --- */}
            <div className="hidden lg:flex w-1/2 bg-slate-900 relative flex-col justify-between p-12 text-white">
                <div className="absolute inset-0 z-0 opacity-20">
                    <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-indigo-600 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2"></div>
                    <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-blue-600 rounded-full blur-[100px] translate-x-1/3 translate-y-1/3"></div>
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px]"></div>
                </div>

                <div className="relative z-10 flex items-center gap-3">
                    <Logo className="w-8 h-8" />
                    <span className="text-lg font-bold tracking-tight">QR Generator</span>
                </div>

                <div className="relative z-10 max-w-lg">
                    <h2 className="text-3xl font-bold leading-tight mb-4">
                        Manage your connections <br /> with dynamic intelligence.
                    </h2>
                    <p className="text-slate-400 text-base leading-relaxed">
                        &quot;This platform revolutionized how we track physical marketing assets. The dynamic editing feature alone saved us thousands.&quot;
                    </p>
                </div>

                <div className="relative z-10 text-xs text-slate-500">
                    © 2026 QR Generator Inc.
                </div>
            </div>

            {/* --- FORM --- */}
            <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 relative bg-white h-full">

                <div className="absolute top-8 left-8">
                    <Link
                        href="/"
                        className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition group"
                    >
                        <ChevronLeft size={16} className="mr-1 group-hover:-translate-x-1 transition" />
                        Back
                    </Link>
                </div>

                <div className="w-full max-w-[400px]">

                    <div className="mb-6 text-center lg:text-left">
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">Welcome back</h1>
                        <p className="text-sm text-slate-500">Please enter your details to sign in.</p>
                    </div>

                    {error && (
                        <div className="mb-4 bg-red-50 border border-red-100 text-red-600 px-3 py-2 rounded-lg text-xs flex items-center gap-2">
                            <AlertCircle size={14} className="shrink-0" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-4">

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-900 uppercase tracking-wide">Email</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition">
                                    <Mail size={18} />
                                </div>
                                <input
                                    type="email"
                                    required
                                    className="block w-full pl-10 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition text-sm font-medium"
                                    placeholder="name@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-semibold text-slate-900 uppercase tracking-wide">Password</label>
                                <a href="#" className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold hover:underline">Forgot?</a>
                            </div>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    className="block w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition text-sm font-medium"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 focus:ring-4 focus:ring-slate-200 transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed text-sm mt-2"
                        >
                            {loading ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>Sign in <ArrowRight size={16} /></>
                            )}
                        </button>
                    </form>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-100"></div>
                        </div>
                        <div className="relative flex justify-center text-[10px] uppercase tracking-wide">
                            <span className="px-3 bg-white text-slate-400 font-bold">Or continue with</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <button className="flex justify-center items-center py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 transition hover:border-slate-300">
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none"><path d="M23.766 12.2764C23.766 11.4607 23.6999 10.6406 23.5588 9.83807H12.24V14.4591H18.7217C18.4528 15.9494 17.5885 17.2678 16.323 18.1056V21.1039H20.19C22.4608 19.0139 23.766 15.9274 23.766 12.2764Z" fill="#4285F4" /><path d="M12.24 24.0008C15.4765 24.0008 18.2059 22.9382 20.1945 21.1039L16.3275 18.1055C15.2517 18.8375 13.8627 19.252 12.2445 19.252C9.11388 19.252 6.45946 17.1399 5.50705 14.3003H1.5166V17.3912C3.55371 21.4434 7.7029 24.0008 12.24 24.0008Z" fill="#34A853" /><path d="M5.50253 14.3003C5.00236 12.8199 5.00236 11.1799 5.50253 9.69951V6.60861H1.5166C-0.18558 10.0056 -0.18558 13.9945 1.5166 17.3915L5.50253 14.3003Z" fill="#FBBC05" /><path d="M12.24 4.74966C13.9509 4.7232 15.6044 5.36697 16.8434 6.54867L20.2695 3.12262C18.1001 1.0855 15.2208 -0.0344664 12.24 0.000808666C7.7029 0.000808666 3.55371 2.55822 1.5166 6.60861L5.50253 9.69951C6.45064 6.86154 9.10947 4.74966 12.24 4.74966Z" fill="#EA4335" /></svg>
                        </button>
                        <button className="flex justify-center items-center py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 transition hover:border-slate-300 text-slate-600">
                            <svg className="w-5 h-5" viewBox="0 0 88 88" fill="currentColor"><path d="M0 12.402l35.687-4.86.016 34.423-35.67.203L0 12.402zm35.67 33.329l-.028 34.79L0 75.814V46.632h35.67zm5.296-39.245L88 0v41.559H40.966V6.486zM88 46.823v40.353L40.995 80.91V46.823H88z" /></svg>
                        </button>
                        <button className="flex justify-center items-center py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 transition hover:border-slate-300 text-slate-600">
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                        </button>
                    </div>

                    <p className="mt-6 text-center text-sm text-slate-500">
                        Don&apos;t have an account?{" "}
                        <Link href="/register" className="font-bold text-indigo-600 hover:text-indigo-700 hover:underline transition">
                            Sign up
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}