"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Lock,
  Unlock,
  Building2,
  Key,
  CheckCircle2,
  Copy,
  Plus,
  Search,
  Share2,
  RefreshCw,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  Users,
  FlaskConical,
  CreditCard,
  X
} from "lucide-react";
import { apiFetch } from "@/lib/api";

interface SubscriptionPlan {
  id: string;
  code: string;
  name: string;
  monthly_price_inr: number;
  yearly_price_inr: number;
  max_monthly_orders: number;
  max_staff_accounts: number;
  max_branches: number;
}

interface ClientLab {
  id: string;
  name: string;
  legal_name: string;
  slug: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  subscription_status: string;
  is_active: boolean;
  plan_name: string;
  plan_code: string;
  created_at: string;
  admin: {
    user_id: string | null;
    full_name: string;
    username: string | null;
    phone: string | null;
  };
  metrics: {
    staff_count: number;
    orders_count: number;
    tests_count: number;
  };
}

export default function MasterProvisioningPage() {
  // Master PIN Security Gate
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinLoading, setPinLoading] = useState<boolean>(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<"provision" | "directory">("provision");

  // Plans & Labs Data
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [labs, setLabs] = useState<ClientLab[]>([]);
  const [loadingLabs, setLoadingLabs] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Provisioning Form State
  const [labName, setLabName] = useState<string>("");
  const [legalName, setLegalName] = useState<string>("");
  const [slug, setSlug] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [city, setCity] = useState<string>("Bangalore");
  const [state, setState] = useState<string>("Karnataka");
  const [pincode, setPincode] = useState<string>("560001");
  const [selectedPlanCode, setSelectedPlanCode] = useState<string>("PROFESSIONAL");
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>("ACTIVE");
  const [validDays, setValidDays] = useState<number>(365);
  const [adminName, setAdminName] = useState<string>("");
  const [adminUsername, setAdminUsername] = useState<string>("");
  const [adminPhone, setAdminPhone] = useState<string>("");
  const [adminPassword, setAdminPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [autoSeedCatalog, setAutoSeedCatalog] = useState<boolean>(true);

  // Submission States
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [provisionSuccessModal, setProvisionSuccessModal] = useState<any | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Password Reset Modal
  const [resetModalLab, setResetModalLab] = useState<ClientLab | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState<string>("");
  const [resettingPassword, setResettingPassword] = useState<boolean>(false);
  const [resetSuccessMsg, setResetSuccessMsg] = useState<string | null>(null);

  // Check saved session on mount
  useEffect(() => {
    const savedMaster = sessionStorage.getItem("jlab_master_auth") || sessionStorage.getItem("pulselab_master_auth");
    if (savedMaster === "authorized") {
      setIsAuthenticated(true);
      loadInitialData();
    }
  }, []);

  const handleVerifyPin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setPinLoading(true);
    setPinError(null);

    try {
      const res = await apiFetch("/admin/verify-pin", {
        method: "POST",
        body: JSON.stringify({ pin: pinInput })
      });

      if (res.authorized) {
        setIsAuthenticated(true);
        sessionStorage.setItem("jlab_master_auth", "authorized");
        sessionStorage.setItem("pulselab_master_auth", "authorized");
        if (res.session_token) {
          sessionStorage.setItem("jlab_master_token", res.session_token);
          sessionStorage.setItem("pulselab_master_token", res.session_token);
        }
        loadInitialData();
      } else {
        throw new Error("Invalid Master Authorization PIN");
      }
    } catch {
      setPinError("Invalid Master PIN. Please enter authorized software vendor credentials.");
    } finally {
      setPinLoading(false);
    }
  };

  const handleLogoutMaster = () => {
    sessionStorage.removeItem("jlab_master_auth");
    sessionStorage.removeItem("jlab_master_token");
    sessionStorage.removeItem("pulselab_master_auth");
    sessionStorage.removeItem("pulselab_master_token");
    setIsAuthenticated(false);
    setPinInput("");
  };

  const loadInitialData = async () => {
    try {
      const plansData = await apiFetch("/admin/plans");
      setPlans(plansData);
      loadClientLabs();
    } catch (err) {
      console.error("Failed to load admin plans", err);
    }
  };

  const loadClientLabs = async () => {
    setLoadingLabs(true);
    try {
      const labsData = await apiFetch("/admin/labs");
      setLabs(labsData);
    } catch (err) {
      console.error("Failed to load client labs", err);
    } finally {
      setLoadingLabs(false);
    }
  };

  // Auto-generate slug and username as user types lab name
  const handleLabNameChange = (val: string) => {
    setLabName(val);
    if (!legalName) setLegalName(val);
    const clean = val.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 16);
    if (!slug) setSlug(clean);
    if (!adminUsername && clean) setAdminUsername(`${clean}_admin`);
  };

  // Generate a strong random password
  const generateStrongPassword = () => {
    const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%";
    let pwd = "";
    for (let i = 0; i < 10; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setAdminPassword(pwd);
    setShowPassword(true);
  };

  // Handle Form Submission
  const handleProvisionLab = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    if (!adminPassword || adminPassword.length < 5) {
      setFormError("Please provide an administrator password of at least 5 characters.");
      setSubmitting(false);
      return;
    }

    try {
      const res = await apiFetch("/admin/provision-lab", {
        method: "POST",
        body: JSON.stringify({
          lab_name: labName,
          legal_name: legalName || labName,
          slug: slug,
          phone: phone,
          email: email,
          address: address,
          city: city,
          state: state,
          pincode: pincode,
          plan_code: selectedPlanCode,
          subscription_status: subscriptionStatus,
          valid_days: validDays,
          admin_name: adminName || `${labName} Director`,
          admin_username: adminUsername,
          admin_phone: adminPhone || phone,
          admin_password: adminPassword,
          auto_seed_catalog: autoSeedCatalog
        })
      });

      if (res.success) {
        setProvisionSuccessModal(res);
        // Refresh directory
        loadClientLabs();
        // Reset form
        setLabName("");
        setLegalName("");
        setSlug("");
        setPhone("");
        setEmail("");
        setAddress("");
        setAdminName("");
        setAdminUsername("");
        setAdminPhone("");
        setAdminPassword("");
      } else {
        throw new Error(res.detail || "Failed to provision laboratory");
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to provision laboratory. Verify username/phone uniqueness.";
      setFormError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Lab Status (Suspend/Activate)
  const handleToggleStatus = async (lab: ClientLab) => {
    const newStatus = lab.subscription_status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    const confirmMsg = `Are you sure you want to change status of "${lab.name}" to ${newStatus}?`;
    if (!confirm(confirmMsg)) return;

    try {
      await apiFetch(`/admin/labs/${lab.id}/status`, {
        method: "POST",
        body: JSON.stringify({ status: newStatus })
      });
      loadClientLabs();
    } catch {
      alert("Failed to update laboratory status.");
    }
  };

  // Reset Lab Admin Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalLab || !newPasswordInput) return;

    setResettingPassword(true);
    setResetSuccessMsg(null);
    try {
      const res = await apiFetch(`/admin/labs/${resetModalLab.id}/reset-password`, {
        method: "POST",
        body: JSON.stringify({ new_password: newPasswordInput })
      });
      setResetSuccessMsg(`Password successfully updated! New password: ${res.new_password}`);
      setTimeout(() => {
        setResetModalLab(null);
        setNewPasswordInput("");
        setResetSuccessMsg(null);
      }, 3000);
    } catch {
      alert("Failed to reset password.");
    } finally {
      setResettingPassword(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2500);
  };

  // Filtered Client Labs for Directory
  const filteredLabs = labs.filter((l) => {
    const q = searchQuery.toLowerCase();
    return (
      l.name.toLowerCase().includes(q) ||
      l.slug.toLowerCase().includes(q) ||
      l.city.toLowerCase().includes(q) ||
      (l.admin.username && l.admin.username.toLowerCase().includes(q)) ||
      (l.phone && l.phone.includes(q))
    );
  });

  // =========================================================================
  // VIEW 1: SECURITY GATE (RESTRICTED MASTER PASSCODE)
  // =========================================================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-center items-center p-4 selection:bg-rose-600 selection:text-white">
        <div className="w-full max-w-md bg-slate-800/90 border border-slate-700/80 rounded-2xl p-8 shadow-2xl backdrop-blur-md space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-white border border-slate-700/80 mx-auto flex items-center justify-center p-1.5 shadow-lg shadow-black/40">
              <Image
                src="/jlab-logo.png"
                alt="PULSE LAB Logo"
                width={56}
                height={56}
                priority
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-xl font-black tracking-tight text-white mt-2">
              PULSE LAB Master Terminal
            </h1>
            <p className="text-xs text-slate-400">
              Authorized Software Seller &amp; Client Account Provisioning.
              <br />
              <span className="text-[11px] text-rose-400 font-mono">Restricted Access (Not Visible to Public)</span>
            </p>
          </div>

          {pinError && (
            <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{pinError}</span>
            </div>
          )}

          <form onSubmit={handleVerifyPin} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Enter Master Admin Passcode / PIN
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="Enter 4-digit Master PIN or Key"
                  required
                  autoFocus
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 font-mono"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Master PIN: 7899 or 7899514777</p>
            </div>

            <button
              type="submit"
              disabled={pinLoading}
              className="w-full py-3 rounded-xl bg-[#5E1224] hover:bg-[#721C24] text-white font-bold text-xs shadow-lg shadow-rose-950/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Unlock className="w-4 h-4" />
              <span>{pinLoading ? "Authenticating..." : "Unlock Provisioning Terminal"}</span>
            </button>
          </form>

          <div className="pt-2 text-center">
            <Link href="/" className="text-xs text-slate-400 hover:text-white transition-colors">
              ← Return to Public Homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: MASTER PROVISIONING & CLIENT MANAGEMENT CONSOLE
  // =========================================================================
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col selection:bg-rose-700 selection:text-white">
      {/* Top Header */}
      <header className="bg-[#5E1224] text-white px-6 py-3.5 border-b border-[#470c1b] sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white border border-rose-200/50 flex items-center justify-center p-0.5 overflow-hidden shadow-md shrink-0">
              <Image
                src="/jlab-logo.png"
                alt="PULSE LAB"
                width={36}
                height={36}
                priority
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="font-bold text-sm tracking-tight flex items-center gap-2">
                <span>PULSE LAB</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-900/80 border border-rose-700/60 font-mono text-rose-200">
                  MASTER LICENSING CONSOLE
                </span>
              </div>
              <div className="text-[11px] text-rose-200/80">
                Software Seller Hub · Manual Account Creation &amp; Client Tenant Provisioning
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleLogoutMaster}
              className="px-3 py-1.5 rounded-lg bg-rose-900/60 hover:bg-rose-900 border border-rose-700/80 text-xs font-semibold text-rose-200 hover:text-white transition-all flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Lock Terminal</span>
            </button>
            <Link
              href="/login"
              target="_blank"
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-all"
            >
              Open Staff Login ↗
            </Link>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-7xl mx-auto w-full p-6 flex-1 space-y-6">
        {/* Metric Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-2xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-900 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Client Laboratories</div>
              <div className="text-xl font-black text-rose-950 font-mono">{labs.length} Active</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-2xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-50 text-cyan-800 flex items-center justify-center shrink-0">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Catalog Ready</div>
              <div className="text-xl font-black text-slate-900 font-mono">265 Tests / 767 Params</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-2xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Software Tiers</div>
              <div className="text-xl font-black text-emerald-950 font-mono">3 License Plans</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-2xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-800 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Public Access</div>
              <div className="text-xs font-bold text-purple-900 mt-1">Direct Login Only (No Self-Signup)</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-rose-200 pb-2">
          <button
            onClick={() => setActiveTab("provision")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "provision"
                ? "bg-[#5E1224] text-white shadow-2xs"
                : "bg-white text-slate-700 hover:bg-rose-50 border border-slate-200"
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Provision New Lab Client (When Lab Buys Software)</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("directory");
              loadClientLabs();
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "directory"
                ? "bg-[#5E1224] text-white shadow-2xs"
                : "bg-white text-slate-700 hover:bg-rose-50 border border-slate-200"
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>All Client Labs &amp; Licenses ({labs.length})</span>
          </button>
        </div>

        {/* =====================================================================
            TAB 1: PROVISION NEW CLIENT LAB FORM
        ===================================================================== */}
        {activeTab === "provision" && (
          <div className="bg-white border border-rose-200 rounded-2xl p-6 sm:p-8 shadow-sm">
            <div className="max-w-4xl mx-auto space-y-6">
              <div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-rose-700" />
                  <span>Onboard &amp; Provision New Diagnostic Laboratory Client</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Fill in the client lab details below when a customer purchases PULSE LAB. 
                  This creates their database tenant, initial Administrator account, and initializes all 265+ tests with 767 parameters.
                </p>
              </div>

              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-300 text-rose-800 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleProvisionLab} className="space-y-6">
                {/* 1. Laboratory Details */}
                <div className="bg-[#FFF0F4]/40 border border-rose-200/80 rounded-xl p-5 space-y-4">
                  <h3 className="text-xs font-bold text-rose-950 uppercase tracking-wider flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-rose-700" />
                    <span>1. Laboratory Entity Details</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Diagnostic Lab / Center Name *
                      </label>
                      <input
                        type="text"
                        value={labName}
                        onChange={(e) => handleLabNameChange(e.target.value)}
                        placeholder="e.g. Apex Diagnostic & Research Center"
                        required
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-rose-600"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Legal Business Entity Name
                      </label>
                      <input
                        type="text"
                        value={legalName}
                        onChange={(e) => setLegalName(e.target.value)}
                        placeholder="e.g. Apex Diagnostics & Imaging Pvt Ltd"
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-rose-600"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Subdomain / System Slug *
                      </label>
                      <input
                        type="text"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ""))}
                        placeholder="e.g. apexlab"
                        required
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-rose-600"
                      />
                      <span className="text-[10px] text-slate-500">Unique tenant identifier</span>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Contact Phone / WhatsApp *
                      </label>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value);
                          if (!adminPhone) setAdminPhone(e.target.value);
                        }}
                        placeholder="e.g. 9845012345"
                        required
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-rose-600"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Official Lab Email *
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. info@apexdiagnostics.com"
                        required
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-rose-600"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        City, State &amp; Pincode
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="text"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="City"
                          className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-rose-600"
                        />
                        <input
                          type="text"
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          placeholder="State"
                          className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-rose-600"
                        />
                        <input
                          type="text"
                          value={pincode}
                          onChange={(e) => setPincode(e.target.value)}
                          placeholder="Pincode"
                          className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-rose-600"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Full Physical Address *
                      </label>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="e.g. #14, Main Road, Near Civil Hospital"
                        required
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-rose-600"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. License & Subscription Plan */}
                <div className="bg-[#FFF0F4]/40 border border-rose-200/80 rounded-xl p-5 space-y-4">
                  <h3 className="text-xs font-bold text-rose-950 uppercase tracking-wider flex items-center gap-2">
                    <Key className="w-4 h-4 text-rose-700" />
                    <span>2. Software License &amp; Purchase Package</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {plans.map((p) => {
                      const isSelected = selectedPlanCode === p.code;
                      return (
                        <div
                          key={p.id}
                          onClick={() => setSelectedPlanCode(p.code)}
                          className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                            isSelected
                              ? "border-[#5E1224] bg-white shadow-md ring-2 ring-rose-200"
                              : "border-slate-200 bg-white/70 hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-xs text-slate-900">{p.name}</span>
                            <input
                              type="radio"
                              name="plan_choice"
                              checked={isSelected}
                              onChange={() => setSelectedPlanCode(p.code)}
                              className="text-rose-700"
                            />
                          </div>
                          <div className="text-lg font-black text-rose-950 font-mono">
                            ₹{p.yearly_price_inr.toLocaleString("en-IN")}{" "}
                            <span className="text-[10px] font-normal text-slate-500">/year</span>
                          </div>
                          <ul className="text-[11px] text-slate-600 mt-2 space-y-1">
                            <li>• Up to {p.max_branches} branch(es)</li>
                            <li>• Up to {p.max_staff_accounts} staff accounts</li>
                            <li>• {p.max_monthly_orders.toLocaleString("en-IN")} orders/month</li>
                          </ul>
                        </div>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Subscription License Status
                      </label>
                      <select
                        value={subscriptionStatus}
                        onChange={(e) => setSubscriptionStatus(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-rose-600 font-semibold"
                      >
                        <option value="ACTIVE">ACTIVE (Paid License)</option>
                        <option value="TRIAL">TRIAL (14-Day Evaluation)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        License Validity Duration
                      </label>
                      <select
                        value={validDays}
                        onChange={(e) => setValidDays(parseInt(e.target.value))}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-rose-600 font-semibold"
                      >
                        <option value={365}>1 Year (365 Days) — Standard Annual</option>
                        <option value={730}>2 Years (730 Days) — Multi-Year</option>
                        <option value={180}>6 Months (180 Days) — Semi-Annual</option>
                        <option value={30}>1 Month (30 Days) — Monthly</option>
                        <option value={14}>14 Days — Free Trial</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 3. Initial Lab Admin Account Setup */}
                <div className="bg-[#FFF0F4]/40 border border-rose-200/80 rounded-xl p-5 space-y-4">
                  <h3 className="text-xs font-bold text-rose-950 uppercase tracking-wider flex items-center gap-2">
                    <Users className="w-4 h-4 text-rose-700" />
                    <span>3. Primary Lab Administrator Login Credentials</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Lab Director / Admin Full Name *
                      </label>
                      <input
                        type="text"
                        value={adminName}
                        onChange={(e) => setAdminName(e.target.value)}
                        placeholder="e.g. Dr. Ramesh Kumar, MBBS, MD"
                        required
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-rose-600"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Admin Login Username *
                      </label>
                      <input
                        type="text"
                        value={adminUsername}
                        onChange={(e) => setAdminUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                        placeholder="e.g. apex_admin"
                        required
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-rose-600"
                      />
                      <span className="text-[10px] text-slate-500">Username for client login at /login</span>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Admin Mobile Phone *
                      </label>
                      <input
                        type="text"
                        value={adminPhone}
                        onChange={(e) => setAdminPhone(e.target.value)}
                        placeholder="e.g. 9845012345"
                        required
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-rose-600"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-slate-700">
                          Initial Password *
                        </label>
                        <button
                          type="button"
                          onClick={generateStrongPassword}
                          className="text-[11px] font-bold text-rose-800 hover:text-rose-950 flex items-center gap-1 cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Generate Strong Password</span>
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={adminPassword}
                          onChange={(e) => setAdminPassword(e.target.value)}
                          placeholder="Password for initial login"
                          required
                          className="w-full bg-white border border-slate-300 rounded-lg pl-3 pr-10 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-rose-600"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Automated Catalog & Setup Checkbox */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="autoSeedCheck"
                    checked={autoSeedCatalog}
                    onChange={(e) => setAutoSeedCatalog(e.target.checked)}
                    className="mt-0.5 text-rose-700 rounded"
                  />
                  <label htmlFor="autoSeedCheck" className="text-xs text-slate-700">
                    <span className="font-bold text-slate-900 block">
                      Auto-clone standard diagnostic catalog (265+ tests across all 10 departments)
                    </span>
                    Automatically pre-loads Complete Blood Count, Liver Function Test, Lipid Profile, Renal Function Test, Urine Routine, Semen Analysis, Stool Examination, Thyroid profiles, and all 767 NABL / ThinkLab reference ranges into the client lab.
                  </label>
                </div>

                {/* Submit Button */}
                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-8 py-3.5 rounded-xl bg-[#5E1224] hover:bg-[#721C24] text-white font-bold text-xs shadow-lg shadow-rose-950/20 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{submitting ? "Provisioning Laboratory & Populating 767 Parameters..." : "🚀 Provision & Activate Laboratory License"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 2: ALL CLIENT LABS & LICENSES DIRECTORY
        ===================================================================== */}
        {activeTab === "directory" && (
          <div className="bg-white border border-rose-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Active Client Laboratories Directory
                </h2>
                <p className="text-xs text-slate-500">
                  All labs operating on PULSE LAB. Manage licenses, reset passwords, and view system metrics.
                </p>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search lab, city, admin..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-rose-600"
                  />
                </div>
                <button
                  onClick={loadClientLabs}
                  className="p-2 border border-slate-300 hover:bg-slate-50 rounded-lg text-slate-600 transition-colors"
                  title="Refresh list"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {loadingLabs ? (
              <div className="py-16 text-center text-slate-400 text-xs font-mono">
                Loading client laboratories...
              </div>
            ) : filteredLabs.length === 0 ? (
              <div className="py-16 text-center text-slate-500 text-xs">
                No client laboratories found matching &quot;{searchQuery}&quot;.
              </div>
            ) : (
              <div className="overflow-x-auto border border-rose-100 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#FFF0F4] border-b border-rose-200 text-[11px] font-bold text-rose-950 uppercase">
                      <th className="py-3 px-4">Laboratory Name &amp; Tenant</th>
                      <th className="py-3 px-4">City / Contact</th>
                      <th className="py-3 px-4">Plan &amp; License Status</th>
                      <th className="py-3 px-4">Admin Username</th>
                      <th className="py-3 px-4 text-center">Metrics</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rose-100 text-slate-800">
                    {filteredLabs.map((lab) => {
                      const isActive = lab.subscription_status === "ACTIVE";

                      return (
                        <tr key={lab.id} className="hover:bg-rose-50/40 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900 text-xs">{lab.name}</div>
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                              Slug: {lab.slug} · Created: {lab.created_at || "Recent"}
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <div className="font-medium text-slate-800">{lab.city}, {lab.state}</div>
                            <div className="text-[11px] text-slate-500 font-mono">{lab.phone}</div>
                          </td>

                          <td className="py-3 px-4">
                            <div className="inline-flex items-center gap-1.5">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                  isActive
                                    ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                    : "bg-rose-100 text-rose-800 border border-rose-300"
                                }`}
                              >
                                {lab.subscription_status}
                              </span>
                              <span className="text-[11px] font-semibold text-slate-700">
                                {lab.plan_name}
                              </span>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <div className="font-mono text-xs font-bold text-slate-900">
                              {lab.admin.username || "N/A"}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {lab.admin.full_name}
                            </div>
                          </td>

                          <td className="py-3 px-4 text-center">
                            <div className="inline-flex items-center gap-2 text-[10px] font-mono text-slate-600">
                              <span title="Active Staff">👥 {lab.metrics.staff_count}</span>
                              <span title="Total Orders">📋 {lab.metrics.orders_count}</span>
                              <span title="Tests in Catalog">🧪 {lab.metrics.tests_count}</span>
                            </div>
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  const text = `PULSE LAB Login Credentials:\nURL: http://localhost:3000/login\nLab: ${lab.name}\nAdmin Username: ${lab.admin.username}\nPhone: ${lab.admin.phone}`;
                                  copyToClipboard(text, lab.id);
                                }}
                                className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition-colors"
                                title="Copy Login Credentials"
                              >
                                {copiedText === lab.id ? "✓ Copied" : "Copy Login"}
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setResetModalLab(lab);
                                  setNewPasswordInput("");
                                }}
                                className="px-2.5 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-semibold text-[11px] transition-colors"
                              >
                                Reset Password
                              </button>

                              <button
                                type="button"
                                onClick={() => handleToggleStatus(lab)}
                                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                                  isActive
                                    ? "bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200"
                                    : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200"
                                }`}
                              >
                                {isActive ? "Suspend" : "Activate"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      {/* =========================================================================
          MODAL 1: PROVISION SUCCESS CARD & WHATSAPP SHARE SLIP
      ========================================================================= */}
      {provisionSuccessModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-rose-200 w-full max-w-lg overflow-hidden space-y-4">
            <div className="bg-[#5E1224] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-tight">Laboratory License Provisioned!</h3>
                  <p className="text-[11px] text-rose-200/80">Account activated &amp; pre-loaded with full catalog.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setProvisionSuccessModal(null)}
                className="text-rose-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {/* Credentials Slip */}
              <div className="bg-[#FFF0F4] border border-rose-200 rounded-xl p-4 space-y-2.5">
                <div className="flex justify-between border-b border-rose-200/80 pb-2">
                  <span className="text-slate-600 font-medium">Laboratory Name</span>
                  <span className="font-bold text-slate-900">{provisionSuccessModal.laboratory.name}</span>
                </div>
                <div className="flex justify-between border-b border-rose-200/80 pb-2">
                  <span className="text-slate-600 font-medium">License Key</span>
                  <span className="font-mono font-bold text-rose-950">{provisionSuccessModal.license.license_key}</span>
                </div>
                <div className="flex justify-between border-b border-rose-200/80 pb-2">
                  <span className="text-slate-600 font-medium">License Valid Until</span>
                  <span className="font-bold text-emerald-900">{provisionSuccessModal.license.valid_until}</span>
                </div>
                <div className="flex justify-between border-b border-rose-200/80 pb-2">
                  <span className="text-slate-600 font-medium">Admin Username</span>
                  <span className="font-mono font-bold text-slate-900">{provisionSuccessModal.credentials.username}</span>
                </div>
                <div className="flex justify-between border-b border-rose-200/80 pb-2">
                  <span className="text-slate-600 font-medium">Initial Password</span>
                  <span className="font-mono font-bold text-rose-800 bg-white px-2 py-0.5 rounded border border-rose-200">
                    {provisionSuccessModal.credentials.password}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 font-medium">Pre-loaded Catalog</span>
                  <span className="font-bold text-slate-900">
                    {provisionSuccessModal.catalog_summary.tests_created} Tests · {provisionSuccessModal.catalog_summary.parameters_created} Parameters
                  </span>
                </div>
              </div>

              {/* Ready WhatsApp Message Box */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Ready WhatsApp Welcome Message for Buyer:
                </label>
                <textarea
                  readOnly
                  rows={6}
                  value={provisionSuccessModal.whatsapp_onboarding_message}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-[11px] font-mono text-slate-800 leading-relaxed"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => copyToClipboard(provisionSuccessModal.whatsapp_onboarding_message, "modal_wa")}
                  className="flex-1 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedText === "modal_wa" ? "✓ Message Copied!" : "Copy WhatsApp Credentials"}</span>
                </button>

                <a
                  href={`https://wa.me/?text=${encodeURIComponent(provisionSuccessModal.whatsapp_onboarding_message)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Send via WhatsApp ↗</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: PASSWORD RESET MODAL
      ========================================================================= */}
      {resetModalLab && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-rose-200 w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-rose-200 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Reset Administrator Password</h3>
                <p className="text-[11px] text-slate-500">{resetModalLab.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setResetModalLab(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {resetSuccessMsg ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-bold text-center">
                {resetSuccessMsg}
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    New Password for admin &quot;{resetModalLab.admin.username}&quot;
                  </label>
                  <input
                    type="text"
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    placeholder="Enter new password"
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-rose-600"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setResetModalLab(null)}
                    className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resettingPassword}
                    className="px-4 py-2 rounded-lg bg-[#5E1224] hover:bg-[#721C24] text-white font-bold text-xs"
                  >
                    {resettingPassword ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
