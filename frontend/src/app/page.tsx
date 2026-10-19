"use client";

import Link from "next/link";
import Image from "next/image";
import { 
  Activity, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles, 
  ChevronRight
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col selection:bg-cyan-500 selection:text-white">
      {/* Top Header Bar (Deep Burgundy #5E1224) */}
      <header className="border-b border-[#470c1b] bg-[#5E1224] text-white sticky top-0 z-50 px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-white border border-rose-200/50 flex items-center justify-center p-1 overflow-hidden shadow-lg shadow-rose-950/20 group-hover:scale-105 group-hover:border-rose-300 transition-all shrink-0">
              <Image
                src="/jlab-logo.png"
                alt="PULSE LAB Logo"
                width={40}
                height={40}
                priority
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="font-bold text-lg text-white tracking-tight flex items-center gap-1.5">
                PULSE LAB
              </div>
              <div className="text-[10px] text-neutral-400">Diagnostic Laboratory Management Cloud</div>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-6 text-xs text-neutral-300 font-medium">
            <a href="#features" className="hover:text-cyan-400 transition-colors">Features</a>
            <a href="#workflow" className="hover:text-cyan-400 transition-colors">Lab Workflow</a>
            <a href="#comparison" className="hover:text-cyan-400 transition-colors">Why PULSE LAB</a>
            <a href="#pricing" className="hover:text-cyan-400 transition-colors">Pricing</a>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://wa.me/917899514777?text=Hello%20PULSE%20LAB%2C%20I%20want%20to%20buy%20the%20PULSE%20LAB%20Diagnostic%20Software%20License."
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all items-center gap-1.5"
            >
              <span>Buy Software</span>
            </a>
            <Link
              href="/login"
              className="px-4 py-2 rounded-xl bg-white hover:bg-rose-50 text-[#5E1224] font-bold text-xs shadow-md flex items-center gap-1.5 transition-all"
            >
              <span>Staff Login</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section (Fully White) */}
      <section className="relative overflow-hidden pt-16 pb-20 px-6 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-[#5E1224] text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-[#5E1224]" />
            <span>Modern Diagnostic Laboratory Cloud Operating System</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-[1.1]">
            Faster Results. Fewer Errors. <br />
            <span className="bg-gradient-to-r from-[#5E1224] via-[#721C24] to-rose-700 bg-clip-text text-transparent">
              Zero Diagnostic Delays.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            The next-generation LIMS designed for pathology labs, clinical centers, and diagnostic franchises. 
            Unified bill-first intake, spreadsheet-speed manual result entry with clinical guardrails, 
            pathologist e-signatures, and report-locked billing.
          </p>

          {/* Quick CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Link
              href="/login"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-[#5E1224] hover:bg-[#721C24] text-white font-bold text-sm shadow-xl shadow-rose-950/20 flex items-center justify-center gap-2 transition-all"
            >
              <Activity className="w-4 h-4 text-rose-300" />
              <span>Laboratory Staff Login</span>
            </Link>

            <a
              href="https://wa.me/917899514777?text=Hello%20J%20LAB%2C%20I%20would%20like%20to%20purchase%20the%20Diagnostic%20Software%20License%20and%20onboard%20my%20lab."
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-xs"
            >
              <span>Purchase License &amp; Onboard</span>
              <ChevronRight className="w-4 h-4 text-[#5E1224]" />
            </a>
          </div>

          {/* Quick Stats Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-10 max-w-3xl mx-auto">
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
              <div className="text-2xl font-black text-cyan-700 font-mono">30s</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Average Bill Intake</div>
            </div>
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
              <div className="text-2xl font-black text-emerald-700 font-mono">100%</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Differential Sum Check</div>
            </div>
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
              <div className="text-2xl font-black text-indigo-700 font-mono">SHA-256</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Tamper-Proof QR Seals</div>
            </div>
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
              <div className="text-2xl font-black text-amber-700 font-mono">0 Loss</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Report-Locked Dues Gate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Complete Workflow Section (Fully White) */}
      <section id="workflow" className="py-16 px-6 bg-slate-50/70 border-y border-slate-200">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <h2 className="text-xs font-bold text-cyan-700 uppercase tracking-widest">
              END-TO-END CLINICAL ARCHITECTURE
            </h2>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Crafted for Real-World Diagnostic Speed
            </h3>
            <p className="text-xs text-slate-500">
              Every stage was modeled after high-volume Indian pathology operations to eliminate friction.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-cyan-400 transition-all space-y-4 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-cyan-100 border border-cyan-200 text-cyan-800 flex items-center justify-center font-bold">
                1
              </div>
              <h4 className="font-bold text-slate-900 text-base">Bill-First Intake &amp; Tube Barcoding</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Front-desk registers patient, selects test profiles, prints color-coded vacutainer tube stickers, and collects payment on one unified screen.
              </p>
              <div className="text-[11px] font-mono text-cyan-700 flex items-center gap-1 font-semibold">
                <span>Route:</span> <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded border border-slate-200">/lab/orders/new</code>
              </div>
            </div>

            {/* Card 2 */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-emerald-400 transition-all space-y-4 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-200 text-emerald-800 flex items-center justify-center font-bold">
                2
              </div>
              <h4 className="font-bold text-slate-900 text-base">Technician Hotkey Entry &amp; Guardrails</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Spreadsheet-fast manual entry with Tab-key speed, live WBC differential % check (sum = 100%), auto-calculated lipid ratios, and historical delta shift alerts.
              </p>
              <div className="text-[11px] font-mono text-emerald-700 flex items-center gap-1 font-semibold">
                <span>Route:</span> <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded border border-slate-200">/lab/technician</code>
              </div>
            </div>

            {/* Card 3 */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-indigo-400 transition-all space-y-4 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 border border-indigo-200 text-indigo-800 flex items-center justify-center font-bold">
                3
              </div>
              <h4 className="font-bold text-slate-900 text-base">Pathologist Approval &amp; E-Signature</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Pathologist reviews abnormal flags and delta trends in clinical queue. One-click cryptographic digital sign-off locks results and stamps report.
              </p>
              <div className="text-[11px] font-mono text-indigo-700 flex items-center gap-1 font-semibold">
                <span>Route:</span> <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded border border-slate-200">/lab/approvals</code>
              </div>
            </div>

            {/* Card 4 */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-amber-400 transition-all space-y-4 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 text-amber-800 flex items-center justify-center font-bold">
                4
              </div>
              <h4 className="font-bold text-slate-900 text-base">NABL Printable Reports &amp; Stationary Mode</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Toggle between diagnostic letterhead with NABL logos or blank stationary mode for pre-printed paper stock. High-contrast clinical typography.
              </p>
              <div className="text-[11px] font-mono text-amber-700 flex items-center gap-1 font-semibold">
                <span>Route:</span> <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded border border-slate-200">/lab/reports</code>
              </div>
            </div>

            {/* Card 5 */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-rose-400 transition-all space-y-4 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-rose-100 border border-rose-200 text-rose-800 flex items-center justify-center font-bold">
                5
              </div>
              <h4 className="font-bold text-slate-900 text-base">Report-Locked Revenue Protection</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Prevents test delivery, WhatsApp dispatch, and PDF downloads if patient dues are unpaid, unless an authorized administrator approves a credit override.
              </p>
              <div className="text-[11px] font-mono text-rose-700 flex items-center gap-1 font-semibold">
                <span>Route:</span> <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded border border-slate-200">/lab/billing</code>
              </div>
            </div>

            {/* Card 6 */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-teal-400 transition-all space-y-4 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-teal-100 border border-teal-200 text-teal-800 flex items-center justify-center font-bold">
                6
              </div>
              <h4 className="font-bold text-slate-900 text-base">Public QR Authenticity Certificate</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Scanned QR code verifies lab accreditation, patient UHID, pathologist medical license, and test timestamp directly on the public trust ledger.
              </p>
              <div className="text-[11px] font-mono text-teal-700 flex items-center gap-1 font-semibold">
                <span>Route:</span> <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded border border-slate-200">/verify/[hash]</code>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Section: Legacy LIMS vs PulseLab OS (Fully White) */}
      <section id="comparison" className="py-16 px-6 bg-white">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-xs font-bold text-cyan-700 uppercase tracking-widest">
              LEGACY SOFTWARE VS MODERN SAAS
            </h2>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Why Diagnostic Labs Are Upgrading
            </h3>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-4">Feature / Workflow</th>
                  <th className="p-4 text-slate-500">Legacy LIMS / AyusLab</th>
                  <th className="p-4 text-cyan-900 font-bold bg-cyan-50">PULSE LAB (Modern SaaS)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr>
                  <td className="p-4 font-semibold text-slate-900">Result Entry Guardrails</td>
                  <td className="p-4 text-slate-500">Unrestricted input, manual math errors</td>
                  <td className="p-4 text-cyan-800 font-bold bg-cyan-50/50">Live WBC 100% sum check &amp; auto-calculated lipid formulas</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-slate-900">Historical Delta Shifts</td>
                  <td className="p-4 text-slate-500">Requires opening past records manually</td>
                  <td className="p-4 text-cyan-800 font-bold bg-cyan-50/50">Instant inline side-by-side comparison with previous tests</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-slate-900">Revenue Leak Protection</td>
                  <td className="p-4 text-slate-500">Staff print reports even when bills are unpaid</td>
                  <td className="p-4 text-cyan-800 font-bold bg-cyan-50/50">Report-locked billing gate with administrative credit override</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-slate-900">Public Report Verification</td>
                  <td className="p-4 text-slate-500">Generic QR linking to raw PDF</td>
                  <td className="p-4 text-cyan-800 font-bold bg-cyan-50/50">Cryptographic SHA-256 digital certificate authentication</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-slate-900">Deployment &amp; Multi-tenancy</td>
                  <td className="p-4 text-slate-500">Local desktop or clunky monolithic web</td>
                  <td className="p-4 text-cyan-800 font-bold bg-cyan-50/50">Multi-tenant Cloud SaaS, Next.js 16 + FastAPI + PostgreSQL</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Pricing Tiers (Fully White) */}
      <section id="pricing" className="py-16 px-6 bg-slate-50/70 border-t border-slate-200">
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <h2 className="text-xs font-bold text-[#5E1224] uppercase tracking-widest">
              FLEXIBLE SAAS TIERS &amp; LICENSES
            </h2>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Predictable Pricing for Any Diagnostic Center
            </h3>
            <p className="text-xs text-slate-500">
              Zero hidden charges. Transparent yearly licenses with guaranteed NABL catalog setup.
            </p>
          </div>

          {/* Onboarding Notice Banner */}
          <div className="rounded-2xl bg-[#FFF0F4] border border-[#5E1224]/20 p-5 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#5E1224] text-white flex items-center justify-center shrink-0 shadow-md">
                <Sparkles className="w-5 h-5 text-rose-200" />
              </div>
              <div className="space-y-0.5">
                <p className="font-bold text-[#5E1224] text-sm">
                  White-Glove Private Laboratory Provisioning
                </p>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Public self-registration is closed to ensure clinical integrity. When you buy a license, our team provisions your dedicated lab, pre-clones 265+ test profiles with 767 parameters, and sends administrator credentials straight to your WhatsApp.
                </p>
              </div>
            </div>
            <a
              href="https://wa.me/917899514777?text=Hello%20J%20LAB%2C%20I%20want%20to%20discuss%20buying%20a%20Diagnostic%20Software%20License."
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shrink-0 transition-all flex items-center gap-1.5"
            >
              <span>WhatsApp Onboarding Desk</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Starter */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-5 shadow-sm hover:border-[#5E1224]/30 transition-all">
              <div>
                <h4 className="font-bold text-slate-900 text-base">Starter Clinic</h4>
                <p className="text-xs text-slate-500 mt-1">For single-counter sample collection centers &amp; small labs</p>
              </div>
              <div className="text-3xl font-black text-slate-900 font-mono">
                ₹1,499 <span className="text-xs text-slate-500 font-normal">/ month (Billed Yearly)</span>
              </div>
              <ul className="text-xs text-slate-600 space-y-2.5">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Up to 500 reports/month</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Bill-First Patient Intake</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Manual Result Entry Workbench</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> 265+ Test Catalog Pre-Loaded</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> WhatsApp PDF Notifications</li>
              </ul>
              <a
                href="https://wa.me/917899514777?text=Hello%20J%20LAB%2C%20I%20want%20to%20purchase%20the%20Starter%20Clinic%20License%20and%20onboard%20my%20lab."
                target="_blank"
                rel="noopener noreferrer"
                className="w-full block text-center py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-bold text-xs transition-colors"
              >
                Buy Starter License
              </a>
            </div>

            {/* Professional */}
            <div className="p-6 rounded-2xl bg-white border-2 border-[#5E1224] space-y-5 shadow-lg relative">
              <span className="absolute -top-3 right-6 bg-[#5E1224] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Most Popular
              </span>
              <div>
                <h4 className="font-bold text-slate-900 text-base">Professional Diagnostic</h4>
                <p className="text-xs text-slate-500 mt-1">For busy pathology centers with in-house testing &amp; doctors</p>
              </div>
              <div className="text-3xl font-black text-slate-900 font-mono">
                ₹3,999 <span className="text-xs text-slate-500 font-normal">/ month (Billed Yearly)</span>
              </div>
              <ul className="text-xs text-slate-600 space-y-2.5">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-rose-700" /> Unlimited Monthly Reports</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-rose-700" /> Pathologist Digital E-Signatures</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-rose-700" /> Tamper-Proof QR Public Verification</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-rose-700" /> Report-Locked Revenue Protection</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-rose-700" /> All 265 Tests &amp; 767 Parameters Included</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-rose-700" /> Multi-counter Staff Accounts (up to 20)</li>
              </ul>
              <a
                href="https://wa.me/917899514777?text=Hello%20J%20LAB%2C%20I%20want%20to%20purchase%20the%20Professional%20Diagnostic%20License%20and%20onboard%20my%20lab."
                target="_blank"
                rel="noopener noreferrer"
                className="w-full block text-center py-2.5 rounded-xl bg-[#5E1224] hover:bg-[#721C24] text-white font-bold text-xs shadow-md shadow-rose-900/20 transition-all"
              >
                Buy Professional License
              </a>
            </div>

            {/* Enterprise */}
            <div className="p-6 rounded-2xl bg-white border border-rose-200 space-y-5 shadow-sm hover:border-[#5E1224]/30 transition-all">
              <div>
                <h4 className="font-bold text-slate-900 text-base">Enterprise Hospital</h4>
                <p className="text-xs text-slate-500 mt-1">Multi-branch hospital chains &amp; franchise laboratories</p>
              </div>
              <div className="text-3xl font-black text-slate-900 font-mono">
                ₹8,999 <span className="text-xs text-slate-500 font-normal">/ month (Billed Yearly)</span>
              </div>
              <ul className="text-xs text-slate-600 space-y-2.5">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-rose-700" /> Multi-branch Centralized Cockpit</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-rose-700" /> Custom Subdomain &amp; White-labeling</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-rose-700" /> Role-based Segregation of Duties</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-rose-700" /> Dedicated Account Manager &amp; SLA</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-rose-700" /> Priority 24/7 Phone &amp; On-Site Support</li>
              </ul>
              <a
                href="https://wa.me/917899514777?text=Hello%20J%20LAB%2C%20I%20want%20to%20purchase%20the%20Enterprise%20Tier%20for%20our%20Hospital%20Chain."
                target="_blank"
                rel="noopener noreferrer"
                className="w-full block text-center py-2.5 rounded-xl bg-[#5E1224] hover:bg-[#721C24] text-white font-bold text-xs transition-colors"
              >
                Contact Enterprise Sales
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-8 px-6 text-center text-xs text-slate-500 bg-white space-y-2">
        <div className="flex items-center justify-center gap-2 font-bold text-slate-900">
          <Image
            src="/jlab-logo.png"
            alt="PULSE LAB"
            width={24}
            height={24}
            className="w-6 h-6 rounded-md object-contain bg-white p-0.5 shadow-xs border border-slate-200"
          />
          <span>PULSE LAB Diagnostic Platform</span>
        </div>
        <div>
          Designed for diagnostic laboratories, pathology clinics, and medical testing centers.
        </div>
        <div className="text-[11px] text-slate-400">
          © 2026 PULSE LAB Technologies. All rights reserved. NABL &amp; ISO 15189:2022 compliant design.
        </div>
      </footer>
    </div>
  );
}
