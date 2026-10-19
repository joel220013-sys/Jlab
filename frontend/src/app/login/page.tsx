"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { 
  Lock, 
  User, 
  ArrowRight, 
  AlertCircle
} from "lucide-react";
import { apiFetch } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionNotice, setSessionNotice] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("expired")) {
        setSessionNotice("Your database connection was updated to Supabase. Please sign in to initialize your new session.");
      }
    }
  }, []);

  const setDemoCredentials = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
  };

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, username_or_phone: username, password })
      });

      if (data.access_token) {
        localStorage.setItem("jlab_token", data.access_token);
        localStorage.setItem("pulselab_token", data.access_token);
        const userData = JSON.stringify({
          userId: data.user_id,
          fullName: data.full_name,
          role: data.role,
          labId: data.laboratory_id,
          labName: data.laboratory_name
        });
        localStorage.setItem("jlab_user", userData);
        localStorage.setItem("pulselab_user", userData);
        router.push("/lab/dashboard");
      } else {
        throw new Error(data.detail || "Authentication failed");
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Invalid username or password. Please verify your credentials.";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col justify-between selection:bg-cyan-500 selection:text-white">
      {/* Top Banner (Burgundy Header) */}
      <header className="px-6 py-4 border-b border-[#470c1b] bg-[#5E1224] text-white flex items-center justify-between shadow-sm">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-white border border-rose-200/50 flex items-center justify-center p-0.5 overflow-hidden shadow-md shrink-0">
            <Image
              src="/jlab-logo.png"
              alt="PULSE LAB Logo"
              width={36}
              height={36}
              priority
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <div className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
              PULSE LAB
            </div>
            <div className="text-[10px] text-rose-200/70 -mt-0.5">Diagnostic Management OS</div>
          </div>
        </Link>

        <div className="text-xs text-rose-200/90 flex items-center gap-2 bg-[#470c1b]/60 px-3 py-1.5 rounded-full border border-rose-800/40">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-medium text-[11px]">Licensed Diagnostic Centers Only</span>
        </div>
      </header>

      {/* Center Container (Clean White Card) */}
      <div className="flex-1 flex items-center justify-center p-4 py-8">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 rounded-2xl bg-white border border-slate-200 shadow-md mb-1">
              <Image
                src="/jlab-logo.png"
                alt="PULSE LAB"
                width={56}
                height={56}
                priority
                className="w-14 h-14 object-contain rounded-lg"
              />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Laboratory Sign In
            </h1>
            <p className="text-xs text-slate-500">
              Enter your authorized staff or laboratory administrator credentials to access your diagnostic console.
            </p>
          </div>

          {sessionNotice && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start gap-2.5 shadow-sm">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
              <div className="space-y-1">
                <span className="font-semibold block">Supabase Connected</span>
                <span className="text-[11px] leading-relaxed block">{sessionNotice}</span>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-300 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Login Pill for Seeded Accounts */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Quick Sign In (Seeded Accounts)
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setDemoCredentials("sbdcrakesh", "7899353535")}
                className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-[#5E1224] border border-rose-200 text-[11px] font-medium transition-all"
              >
                👑 Lab Admin (sbdcrakesh)
              </button>
              <button
                type="button"
                onClick={() => setDemoCredentials("tech_arun", "tech123")}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-[11px] font-medium transition-all"
              >
                🔬 Technician (tech_arun)
              </button>
              <button
                type="button"
                onClick={() => setDemoCredentials("dr_bhat", "patho123")}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-[11px] font-medium transition-all"
              >
                🩺 Pathologist (dr_bhat)
              </button>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Username / Staff ID
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="Enter username or staff ID"
                  className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#5E1224] focus:ring-1 focus:ring-[#5E1224]/20 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••••"
                  className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#5E1224] focus:ring-1 focus:ring-[#5E1224]/20 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#5E1224] hover:bg-[#721C24] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer hover:shadow-lg hover:shadow-rose-950/20"
            >
              {loading ? "Authenticating Session..." : "Sign In to Laboratory Console"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Account Creation & Licensing Information */}
          <div className="rounded-xl bg-[#FFF0F4] border border-[#5E1224]/20 p-4 space-y-2.5 text-xs text-slate-700">
            <div className="flex items-start gap-2.5">
              <span className="p-1 rounded-md bg-[#5E1224] text-white shrink-0 mt-0.5">
                <Lock className="w-3 h-3" />
              </span>
              <div>
                <p className="font-bold text-[#5E1224] text-xs">
                  Public Self-Registration is Closed
                </p>
                <p className="text-[11px] text-slate-600 leading-relaxed mt-0.5">
                  Laboratory accounts and administrator logins are provisioned exclusively when a software license is purchased.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-[#5E1224]/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px]">
              <span className="text-slate-600">Want to buy a license or get onboarded?</span>
              <a
                href="https://wa.me/917899514777?text=Hello%20J%20LAB%2C%20I%20would%20like%20to%20purchase%20a%20Diagnostic%20Software%20License%20and%20create%20my%20lab%20account."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-all shrink-0"
              >
                <span>WhatsApp: +91 7899514777</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-3 text-center text-xs text-slate-500 bg-white flex items-center justify-center gap-1.5">
        <Image
          src="/jlab-logo.png"
          alt="PULSE LAB"
          width={20}
          height={20}
          className="w-5 h-5 rounded-md object-contain bg-white p-0.5 border border-slate-200"
        />
        <span>PULSE LAB · HIPAA &amp; NABL Compliant SaaS Laboratory Architecture</span>
      </footer>
    </div>
  );
}
