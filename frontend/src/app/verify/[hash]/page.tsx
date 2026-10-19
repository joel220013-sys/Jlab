"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { 
  ShieldCheck, 
  AlertTriangle, 
  Building2, 
  User, 
  FileText, 
  Lock, 
  ExternalLink,
  Award
} from "lucide-react";
import { apiFetch } from "@/lib/api";

interface VerificationData {
  verified: boolean;
  report_number: string;
  status: string;
  laboratory: {
    name: string;
    legal_name: string;
    city: string;
    phone: string;
  };
  patient: {
    name: string;
    uhid: string;
    age_gender: string;
  };
  order: {
    order_number: string;
    lab_number: string;
    collected_date: string;
  };
  verified_by: {
    name: string;
    license: string;
    verified_at: string;
  };
}

export default function VerifyReportPage() {
  const params = useParams();
  const hash = (params?.hash as string) || "";
  const [data, setData] = useState<VerificationData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hash) return;

    const verifyHash = async () => {
      setLoading(true);
      try {
        const res = await apiFetch(`/reports/verify/${hash}`);
        if (res && res.verified) {
          setData(res);
        } else {
          setData(null);
        }
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    verifyHash();
  }, [hash]);

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col justify-between selection:bg-cyan-500 selection:text-white">
      {/* Brand Navigation Bar (Deep Burgundy Header Bar) */}
      <header className="border-b border-[#470c1b] bg-[#5E1224] text-white px-4 py-3 sticky top-0 z-40 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white border border-rose-200/50 flex items-center justify-center p-0.5 overflow-hidden shadow-md shrink-0">
              <Image
                src="/jlab-logo.png"
                alt="PULSE LAB Logo"
                width={32}
                height={32}
                priority
                className="w-full h-full object-contain"
              />
            </div>
            <div className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
              PULSE LAB <span className="text-cyan-400 font-mono text-xs">VERIFY</span>
            </div>
          </Link>

          <div className="text-[11px] text-neutral-300 flex items-center gap-1.5 font-medium">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Public Trust Registry</span>
          </div>
        </div>
      </header>

      {/* Main Container (Crisp White UI) */}
      <main className="max-w-xl mx-auto w-full px-4 py-10 flex-1 flex flex-col justify-center">
        {loading ? (
          <div className="p-8 text-center text-slate-500 space-y-3">
            <div className="w-10 h-10 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs">Verifying cryptographic report hash against ledger...</p>
          </div>
        ) : data && data.verified ? (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xl space-y-6">
            {/* Authenticity Certificate Banner */}
            <div className="bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-800 p-6 text-white text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>

              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 mx-auto flex items-center justify-center shadow-lg mb-3">
                <ShieldCheck className="w-8 h-8 text-white" />
              </div>

              <span className="text-[10px] font-bold tracking-widest uppercase bg-white/20 px-2.5 py-0.5 rounded-full inline-block mb-1.5">
                Official Digital Certificate
              </span>
              <h1 className="text-lg font-black tracking-tight">
                Authentic Clinical Diagnostic Report
              </h1>
              <p className="text-xs text-emerald-100 mt-1 max-w-sm mx-auto">
                This document is certified genuine, tamper-free, and authorized by a licensed medical pathologist.
              </p>
            </div>

            {/* Information Grid */}
            <div className="px-6 space-y-5">
              {/* Lab Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                <Building2 className="w-5 h-5 text-cyan-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <div className="font-bold text-slate-900 text-sm">{data.laboratory.legal_name}</div>
                  <div className="text-slate-500 mt-0.5">{data.laboratory.city}</div>
                  <div className="text-[11px] text-cyan-700 font-semibold mt-1">
                    Accredited Diagnostics Lab · Ph: {data.laboratory.phone}
                  </div>
                </div>
              </div>

              {/* Patient Demographics */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between text-xs border-b border-slate-200 pb-2">
                  <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                    <User className="w-3.5 h-3.5 text-cyan-600" /> Patient Identity
                  </span>
                  <span className="font-mono text-cyan-800 font-bold">{data.patient.uhid}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500 text-[11px] block">Patient Name</span>
                    <span className="font-bold text-slate-900 text-sm">{data.patient.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px] block">Age &amp; Gender</span>
                    <span className="font-medium text-slate-800">{data.patient.age_gender}</span>
                  </div>
                </div>
              </div>

              {/* Order & Accession */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between text-xs border-b border-slate-200 pb-2">
                  <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                    <FileText className="w-3.5 h-3.5 text-cyan-600" /> Laboratory Order
                  </span>
                  <span className="font-mono text-emerald-700 font-bold">Accession #{data.order.lab_number}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500 text-[11px] block">Report Number</span>
                    <span className="font-mono font-bold text-slate-900">{data.report_number}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px] block">Collection Date</span>
                    <span className="font-medium text-slate-700">{data.order.collected_date}</span>
                  </div>
                </div>
              </div>

              {/* Pathologist Authority Sign-off */}
              <div className="p-4 rounded-xl bg-cyan-50/60 border border-cyan-200 flex items-start gap-3">
                <Award className="w-5 h-5 text-cyan-700 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <div className="font-bold text-slate-900">Authorized Medical Officer</div>
                  <div className="font-bold text-cyan-900 mt-0.5">{data.verified_by.name}</div>
                  <div className="text-[11px] text-slate-600">License: {data.verified_by.license}</div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    Timestamp: {data.verified_by.verified_at}
                  </div>
                </div>
              </div>

              {/* SHA-256 Digest Pill */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-[10px] font-mono text-slate-600 break-all text-center">
                <span className="text-slate-500 block text-[9px] mb-0.5 uppercase tracking-wider font-sans font-bold">
                  Cryptographic Verification Fingerprint (SHA-256)
                </span>
                {hash}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 text-center">
              <Link
                href="/login"
                className="text-xs text-cyan-700 hover:text-cyan-800 font-bold inline-flex items-center gap-1"
              >
                PULSE LAB Provider Login <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-rose-50 border border-rose-300 rounded-2xl p-6 text-center space-y-4">
            <AlertTriangle className="w-12 h-12 text-rose-600 mx-auto" />
            <h2 className="text-lg font-bold text-rose-950">Unverified Document Warning</h2>
            <p className="text-xs text-rose-700">
              The verification hash provided does not match any authorized clinical report in the PULSE LAB trust network. 
              The document may be altered, invalid, or forged.
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-4 text-center text-xs text-slate-500 bg-white flex items-center justify-center gap-1.5">
        <Image
          src="/jlab-logo.png"
          alt="PULSE LAB"
          width={20}
          height={20}
          className="w-5 h-5 rounded-md object-contain bg-white p-0.5 border border-slate-200"
        />
        <span>Powered by PULSE LAB · Tamper-Resistant Diagnostic Cloud</span>
      </footer>
    </div>
  );
}
