"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Building2,
  User,
  Lock,
  GitBranch,
  ShieldCheck,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  FileBadge,
  Sparkles,
  Eye,
  KeyRound,
  ExternalLink,
  Plus
} from "lucide-react";
import { apiFetch } from "@/lib/api";

interface LaboratoryInfo {
  id: string;
  slug: string;
  name: string;
  legal_name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  logo_url?: string | null;
  header_template_url?: string | null;
  subscription_status: string;
  is_active: boolean;
  plan_name: string;
  plan_code: string;
  created_at?: string | null;
}

interface UserInfo {
  id: string;
  full_name: string;
  username: string;
  phone: string;
  email?: string | null;
  role: string;
}

interface BranchItem {
  id: string;
  name: string;
  code: string;
  is_main_lab: boolean;
  phone: string;
  address: string;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"lab" | "profile" | "security" | "branches" | "subscription">("lab");
  const [loading, setLoading] = useState(true);
  const [savingLab, setSavingLab] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingSecurity, setSavingSecurity] = useState(false);
  const [savingBranch, setSavingBranch] = useState(false);

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Lab Form State
  const [labData, setLabData] = useState<LaboratoryInfo | null>(null);
  const [labName, setLabName] = useState("");
  const [legalName, setLegalName] = useState("");
  const [labPhone, setLabPhone] = useState("");
  const [labEmail, setLabEmail] = useState("");
  const [labAddress, setLabAddress] = useState("");
  const [labCity, setLabCity] = useState("Bangalore");
  const [labState, setLabState] = useState("Karnataka");
  const [labPincode, setLabPincode] = useState("560001");
  const [labLogoUrl, setLabLogoUrl] = useState("");
  const [headerTemplateUrl, setHeaderTemplateUrl] = useState("");

  // Profile & Staff Form State
  const [userData, setUserData] = useState<UserInfo | null>(null);
  const [fullName, setFullName] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [designation, setDesignation] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [signatureUrl, setSignatureUrl] = useState("");
  const [isSignatory, setIsSignatory] = useState(true);

  // Security Password State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Branches
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [showAddBranch, setShowAddBranch] = useState(false);
  const [newBranchName, setNewBranchName] = useState("");
  const [newBranchCode, setNewBranchCode] = useState("");
  const [newBranchPhone, setNewBranchPhone] = useState("");
  const [newBranchAddress, setNewBranchAddress] = useState("");

  const showNotification = (msg: string, isError = false) => {
    if (isError) {
      setErrorMsg(msg);
      setSuccessMsg(null);
    } else {
      setSuccessMsg(msg);
      setErrorMsg(null);
    }
    setTimeout(() => {
      setSuccessMsg(null);
      setErrorMsg(null);
    }, 4000);
  };

  const loadAllSettings = async () => {
    setLoading(true);
    try {
      const data = await apiFetch("/settings");
      if (data) {
        if (data.laboratory) {
          setLabData(data.laboratory);
          setLabName(data.laboratory.name || "");
          setLegalName(data.laboratory.legal_name || data.laboratory.name || "");
          setLabPhone(data.laboratory.phone || "");
          setLabEmail(data.laboratory.email || "");
          setLabAddress(data.laboratory.address || "");
          setLabCity(data.laboratory.city || "Bangalore");
          setLabState(data.laboratory.state || "Karnataka");
          setLabPincode(data.laboratory.pincode || "560001");
          setLabLogoUrl(data.laboratory.logo_url || "");
          setHeaderTemplateUrl(data.laboratory.header_template_url || "");
        }
        if (data.user) {
          setUserData(data.user);
          setFullName(data.user.full_name || "");
          setUserPhone(data.user.phone || "");
          setUserEmail(data.user.email || "");
        }
        if (data.staff) {
          setDesignation(data.staff.designation || "");
          setLicenseNumber(data.staff.medical_license_number || "");
          setSignatureUrl(data.staff.digital_signature_url || "");
          setIsSignatory(Boolean(data.staff.is_signatory));
        }
        if (data.branches) {
          setBranches(data.branches);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load laboratory settings";
      showNotification(msg, true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllSettings();
  }, []);

  // Save Laboratory Profile
  const handleSaveLaboratory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!labName.trim()) {
      showNotification("Laboratory name is required", true);
      return;
    }
    setSavingLab(true);
    try {
      const res = await apiFetch("/settings/laboratory", {
        method: "PUT",
        body: JSON.stringify({
          name: labName.trim(),
          legal_name: legalName.trim() || labName.trim(),
          phone: labPhone.trim(),
          email: labEmail.trim(),
          address: labAddress.trim(),
          city: labCity.trim(),
          state: labState.trim(),
          pincode: labPincode.trim(),
          logo_url: labLogoUrl.trim() || null,
          header_template_url: headerTemplateUrl.trim() || null
        })
      });

      if (res && res.status === "success") {
        showNotification("Laboratory details and report header updated successfully!");
        setLabData(prev => prev ? { ...prev, ...res.laboratory } : null);

        // Update local session context so Navbar immediately reflects the new name
        try {
          const stored = localStorage.getItem("jlab_user") || localStorage.getItem("pulselab_user");
          if (stored) {
            const parsed = JSON.parse(stored);
            parsed.labName = labName.trim();
            localStorage.setItem("jlab_user", JSON.stringify(parsed));
            localStorage.setItem("pulselab_user", JSON.stringify(parsed));
            window.dispatchEvent(new Event("storage"));
          }
        } catch {
          // ignore
        }
      }
    } catch (err: unknown) {
      showNotification(err instanceof Error ? err.message : "Failed to update laboratory details", true);
    } finally {
      setSavingLab(false);
    }
  };

  // Save User Profile & Signatory
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      showNotification("Full name is required", true);
      return;
    }
    setSavingProfile(true);
    try {
      const res = await apiFetch("/settings/profile", {
        method: "PUT",
        body: JSON.stringify({
          full_name: fullName.trim(),
          phone: userPhone.trim() || null,
          email: userEmail.trim() || null,
          designation: designation.trim() || null,
          medical_license_number: licenseNumber.trim() || null,
          digital_signature_url: signatureUrl.trim() || null,
          is_signatory: isSignatory
        })
      });

      if (res && res.status === "success") {
        showNotification("User profile and clinical credentials updated successfully!");
        setUserData(prev => prev ? { ...prev, ...res.user } : null);

        // Update local session context
        try {
          const stored = localStorage.getItem("jlab_user") || localStorage.getItem("pulselab_user");
          if (stored) {
            const parsed = JSON.parse(stored);
            parsed.fullName = fullName.trim();
            localStorage.setItem("jlab_user", JSON.stringify(parsed));
            localStorage.setItem("pulselab_user", JSON.stringify(parsed));
            window.dispatchEvent(new Event("storage"));
          }
        } catch {
          // ignore
        }
      }
    } catch (err: unknown) {
      showNotification(err instanceof Error ? err.message : "Failed to update profile", true);
    } finally {
      setSavingProfile(false);
    }
  };

  // Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      showNotification("New password must be at least 6 characters long", true);
      return;
    }
    if (newPassword !== confirmPassword) {
      showNotification("New password and confirmation do not match", true);
      return;
    }
    setSavingSecurity(true);
    try {
      const res = await apiFetch("/settings/profile", {
        method: "PUT",
        body: JSON.stringify({
          full_name: fullName.trim() || "Lab Administrator",
          current_password: currentPassword || undefined,
          new_password: newPassword
        })
      });

      if (res && res.status === "success") {
        showNotification("Account password updated successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (err: unknown) {
      showNotification(err instanceof Error ? err.message : "Failed to update password", true);
    } finally {
      setSavingSecurity(false);
    }
  };

  // Add Branch
  const handleAddBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchName.trim()) {
      showNotification("Center name is required", true);
      return;
    }
    setSavingBranch(true);
    try {
      const res = await apiFetch("/settings/branches", {
        method: "POST",
        body: JSON.stringify({
          name: newBranchName.trim(),
          code: newBranchCode.trim() || undefined,
          phone: newBranchPhone.trim() || undefined,
          address: newBranchAddress.trim() || undefined,
          is_main_lab: false
        })
      });

      if (res && res.status === "success") {
        showNotification("New branch center added successfully!");
        setBranches(prev => [...prev, res.branch]);
        setNewBranchName("");
        setNewBranchCode("");
        setNewBranchPhone("");
        setNewBranchAddress("");
        setShowAddBranch(false);
      }
    } catch (err: unknown) {
      showNotification(err instanceof Error ? err.message : "Failed to add branch", true);
    } finally {
      setSavingBranch(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-5 pb-12">
      {/* Page Title & Breadcrumb Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-rose-200/90 p-4 rounded-xl shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#5E1224] text-white flex items-center justify-center shadow-xs shrink-0">
            <Building2 className="w-5 h-5 text-rose-200" />
          </div>
          <div>
            <h1 className="text-lg font-black text-rose-950 tracking-tight flex items-center gap-2">
              Laboratory & Profile Settings
            </h1>
            <p className="text-xs text-slate-500">
              Manage your diagnostic centre branding, clinical signatories, addresses, and account credentials
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadAllSettings}
            disabled={loading}
            className="px-3 py-1.5 border border-rose-200 bg-white hover:bg-rose-50 text-rose-900 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Reload</span>
          </button>
        </div>
      </div>

      {/* Floating Alert Notifications */}
      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2.5 shadow-sm animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs font-bold flex items-center gap-2.5 shadow-sm animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Settings Navigation Tabs */}
      <div className="flex items-center gap-1.5 border-b border-rose-200 bg-white px-2 py-1.5 rounded-xl shadow-2xs overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab("lab")}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "lab"
              ? "bg-[#5E1224] text-white shadow-xs"
              : "text-slate-600 hover:text-rose-950 hover:bg-rose-50"
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Laboratory Details</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("profile")}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "profile"
              ? "bg-[#5E1224] text-white shadow-xs"
              : "text-slate-600 hover:text-rose-950 hover:bg-rose-50"
          }`}
        >
          <User className="w-4 h-4" />
          <span>Profile & Signatory</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("security")}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "security"
              ? "bg-[#5E1224] text-white shadow-xs"
              : "text-slate-600 hover:text-rose-950 hover:bg-rose-50"
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Security & Password</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("branches")}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "branches"
              ? "bg-[#5E1224] text-white shadow-xs"
              : "text-slate-600 hover:text-rose-950 hover:bg-rose-50"
          }`}
        >
          <GitBranch className="w-4 h-4" />
          <span>Branches & Hubs</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("subscription")}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "subscription"
              ? "bg-[#5E1224] text-white shadow-xs"
              : "text-slate-600 hover:text-rose-950 hover:bg-rose-50"
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>License & Plan</span>
        </button>
      </div>

      {loading ? (
        <div className="bg-white border border-rose-200/90 rounded-2xl p-12 text-center text-slate-400 space-y-3 shadow-2xs">
          <div className="w-8 h-8 border-2 border-rose-700 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-mono">Loading laboratory settings...</p>
        </div>
      ) : (
        <>
          {/* TAB 1: LABORATORY PROFILE */}
          {activeTab === "lab" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Form Column */}
              <div className="lg:col-span-2 bg-white border border-rose-200/90 rounded-2xl p-5 shadow-2xs space-y-5">
                <div className="border-b border-rose-100 pb-3">
                  <h2 className="text-sm font-black text-rose-950 tracking-tight flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-rose-700" />
                    <span>Laboratory Information & Letterhead</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    This information appears on printed reports, bill invoices, and patient WhatsApp/SMS dispatches
                  </p>
                </div>

                <form onSubmit={handleSaveLaboratory} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Lab Name */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Laboratory Display Name <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={labName}
                        onChange={(e) => setLabName(e.target.value)}
                        placeholder="e.g. Sai Balaji Diagnostic Centre"
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-rose-600 focus:ring-1 focus:ring-rose-600"
                      />
                      <span className="text-[10px] text-slate-400 mt-0.5 block">
                        Shown on patient reports and notification banners
                      </span>
                    </div>

                    {/* Legal Entity Name */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Legal / Registered Entity Name
                      </label>
                      <input
                        type="text"
                        value={legalName}
                        onChange={(e) => setLegalName(e.target.value)}
                        placeholder="e.g. Sai Balaji Diagnostics & Healthcare Pvt Ltd"
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-rose-600 focus:ring-1 focus:ring-rose-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Phone */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Primary Contact Phone / WhatsApp <span className="text-rose-600">*</span>
                      </label>
                      <div className="relative">
                        <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          required
                          value={labPhone}
                          onChange={(e) => setLabPhone(e.target.value)}
                          placeholder="+91 9876543210"
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-8 pr-3 py-2 text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-rose-600 focus:ring-1 focus:ring-rose-600"
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Official Laboratory Email <span className="text-rose-600">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="email"
                          required
                          value={labEmail}
                          onChange={(e) => setLabEmail(e.target.value)}
                          placeholder="contact@saibalaji.com"
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-8 pr-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-rose-600 focus:ring-1 focus:ring-rose-600"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Street Address */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Facility Street Address <span className="text-rose-600">*</span>
                    </label>
                    <textarea
                      required
                      rows={2}
                      value={labAddress}
                      onChange={(e) => setLabAddress(e.target.value)}
                      placeholder="#12, 1st Cross, Near Metro Station, Main Road..."
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-rose-600 focus:ring-1 focus:ring-rose-600"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* City */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">City</label>
                      <input
                        type="text"
                        value={labCity}
                        onChange={(e) => setLabCity(e.target.value)}
                        placeholder="Bangalore"
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-rose-600 focus:ring-1 focus:ring-rose-600"
                      />
                    </div>

                    {/* State */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">State</label>
                      <input
                        type="text"
                        value={labState}
                        onChange={(e) => setLabState(e.target.value)}
                        placeholder="Karnataka"
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-rose-600 focus:ring-1 focus:ring-rose-600"
                      />
                    </div>

                    {/* Pincode */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">Pincode</label>
                      <input
                        type="text"
                        value={labPincode}
                        onChange={(e) => setLabPincode(e.target.value)}
                        placeholder="560001"
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-rose-600 focus:ring-1 focus:ring-rose-600"
                      />
                    </div>
                  </div>

                  {/* Logo URL */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Laboratory Logo Image URL
                    </label>
                    <input
                      type="text"
                      value={labLogoUrl}
                      onChange={(e) => setLabLogoUrl(e.target.value)}
                      placeholder="https://.../logo.png or /jlab-logo.png"
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-rose-600 focus:ring-1 focus:ring-rose-600"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      Leave empty to use the standard default high-resolution laboratory seal
                    </span>
                  </div>

                  <div className="pt-2 flex items-center justify-end">
                    <button
                      type="submit"
                      disabled={savingLab}
                      className="px-5 py-2.5 bg-[#5E1224] hover:bg-[#721C24] text-white text-xs font-bold rounded-lg flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>{savingLab ? "Saving Changes..." : "Save Laboratory Information"}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Preview Card Column */}
              <div className="space-y-4">
                <div className="bg-white border border-rose-200/90 rounded-2xl p-5 shadow-2xs space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-rose-950 uppercase tracking-wider border-b border-rose-100 pb-2">
                    <Eye className="w-3.5 h-3.5 text-rose-700" />
                    <span>Live Report Letterhead Preview</span>
                  </div>

                  {/* Mocked Letterhead Box */}
                  <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-2xs text-center space-y-1.5 relative overflow-hidden">
                    <div className="w-10 h-10 rounded-lg bg-rose-50 border border-rose-200 mx-auto flex items-center justify-center p-1 overflow-hidden">
                      {labLogoUrl ? (
                        <Image
                          src={labLogoUrl}
                          alt="Lab Logo Preview"
                          width={36}
                          height={36}
                          className="max-h-full max-w-full object-contain"
                          unoptimized
                        />
                      ) : (
                        <span className="text-lg">🏥</span>
                      )}
                    </div>
                    <div className="font-black text-sm text-slate-900 uppercase tracking-tight">
                      {labName || "Diagnostic Centre"}
                    </div>
                    <div className="text-[10px] text-slate-500 leading-tight">
                      {labAddress ? `${labAddress}, ${labCity} - ${labPincode}` : "Laboratory Street Address, City - Pincode"}
                    </div>
                    <div className="text-[10px] font-mono text-slate-600">
                      Ph: {labPhone || "+91 XXXXXXXXXX"} · Email: {labEmail || "info@lab.com"}
                    </div>
                    <div className="mt-2 pt-2 border-t border-dashed border-slate-200 text-[9px] text-emerald-700 font-bold flex items-center justify-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      <span>NABL Accredited & Certified Diagnostic Facility</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 italic text-center">
                    This header is automatically rendered on all printed test reports and digital QR verification links.
                  </p>
                </div>

                {/* Quick Info Box */}
                <div className="bg-rose-50/60 border border-rose-200 rounded-xl p-4 space-y-2 text-xs text-rose-950">
                  <div className="font-bold flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-rose-700" />
                    <span>Multi-Tenant Isolation Notice</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Changes made here only apply to your registered laboratory account (<strong>{labData?.slug || "tenant"}</strong>). All patient reports and WhatsApp alerts will immediately reflect your updated branding.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PROFILE & SIGNATORY */}
          {activeTab === "profile" && (
            <div className="max-w-3xl bg-white border border-rose-200/90 rounded-2xl p-6 shadow-2xs space-y-6">
              <div className="border-b border-rose-100 pb-3">
                <h2 className="text-sm font-black text-rose-950 tracking-tight flex items-center gap-2">
                  <User className="w-4 h-4 text-rose-700" />
                  <span>Personal Profile & Clinical Signatory Information</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update your contact details and doctor/pathologist credentials printed on test approvals
                </p>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Full Name <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Dr. Rajesh Sharma"
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-rose-600 focus:ring-1 focus:ring-rose-600"
                    />
                  </div>

                  {/* Username (Readonly) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">Username / Login ID</label>
                    <input
                      type="text"
                      disabled
                      value={userData?.username || ""}
                      className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-500 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Phone */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">Personal Phone Number</label>
                    <input
                      type="text"
                      value={userPhone}
                      onChange={(e) => setUserPhone(e.target.value)}
                      placeholder="+91 9876543210"
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-rose-600 focus:ring-1 focus:ring-rose-600"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">Personal Email</label>
                    <input
                      type="email"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      placeholder="doctor@hospital.com"
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-rose-600 focus:ring-1 focus:ring-rose-600"
                    />
                  </div>
                </div>

                <div className="border-t border-rose-100 pt-4 space-y-4">
                  <div className="font-bold text-xs text-rose-950 flex items-center gap-1.5">
                    <FileBadge className="w-4 h-4 text-rose-700" />
                    <span>Clinical Signatory & Report Stamp Credentials</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Designation */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Professional Designation
                      </label>
                      <input
                        type="text"
                        value={designation}
                        onChange={(e) => setDesignation(e.target.value)}
                        placeholder="e.g. Consultant Pathologist / MD Pathology"
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-rose-600 focus:ring-1 focus:ring-rose-600"
                      />
                      <span className="text-[10px] text-slate-400 mt-0.5 block">
                        Printed beneath the signature line on patient test reports
                      </span>
                    </div>

                    {/* Medical License */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Medical License / NABL Registration No.
                      </label>
                      <input
                        type="text"
                        value={licenseNumber}
                        onChange={(e) => setLicenseNumber(e.target.value)}
                        placeholder="e.g. KMC-78945 / NABL-2026"
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-rose-600 focus:ring-1 focus:ring-rose-600"
                      />
                    </div>
                  </div>

                  {/* Digital Signature URL */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Digital Signature Image URL
                    </label>
                    <input
                      type="text"
                      value={signatureUrl}
                      onChange={(e) => setSignatureUrl(e.target.value)}
                      placeholder="https://.../signature.png or transparent PNG URL"
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-rose-600 focus:ring-1 focus:ring-rose-600"
                    />
                    {signatureUrl && (
                      <div className="mt-2 p-2 bg-slate-50 border border-slate-200 rounded-lg inline-block">
                        <span className="text-[10px] text-slate-500 block mb-1">Signature Preview:</span>
                        <Image
                          src={signatureUrl}
                          alt="Signature Preview"
                          width={140}
                          height={48}
                          className="h-12 object-contain"
                          unoptimized
                        />
                      </div>
                    )}
                  </div>

                  {/* Signatory Toggle */}
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="isSignatory"
                      checked={isSignatory}
                      onChange={(e) => setIsSignatory(e.target.checked)}
                      className="rounded border-slate-300 text-rose-700 focus:ring-rose-600 w-4 h-4 cursor-pointer"
                    />
                    <label htmlFor="isSignatory" className="text-xs font-bold text-slate-800 cursor-pointer">
                      Authorized Medical Signatory (Approved to sign verified reports)
                    </label>
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-end">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="px-5 py-2.5 bg-[#5E1224] hover:bg-[#721C24] text-white text-xs font-bold rounded-lg flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>{savingProfile ? "Saving Profile..." : "Save Profile & Credentials"}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: SECURITY & PASSWORD */}
          {activeTab === "security" && (
            <div className="max-w-xl bg-white border border-rose-200/90 rounded-2xl p-6 shadow-2xs space-y-6">
              <div className="border-b border-rose-100 pb-3">
                <h2 className="text-sm font-black text-rose-950 tracking-tight flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-rose-700" />
                  <span>Change Account Password</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ensure your account is protected with a strong, distinct password
                </p>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-4">
                {/* Current Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-rose-600 focus:ring-1 focus:ring-rose-600"
                  />
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    New Password <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-rose-600 focus:ring-1 focus:ring-rose-600"
                  />
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Confirm New Password <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-type new password"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-rose-600 focus:ring-1 focus:ring-rose-600"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end">
                  <button
                    type="submit"
                    disabled={savingSecurity}
                    className="px-5 py-2.5 bg-[#5E1224] hover:bg-[#721C24] text-white text-xs font-bold rounded-lg flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                  >
                    <Lock className="w-4 h-4" />
                    <span>{savingSecurity ? "Updating Password..." : "Update Password"}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 4: BRANCHES & HUBS */}
          {activeTab === "branches" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-black text-rose-950 tracking-tight">
                    Registered Branches & Processing Hubs
                  </h2>
                  <p className="text-xs text-slate-500">
                    Collection centers and regional processing laboratories affiliated with your license
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddBranch(true)}
                  className="px-3.5 py-1.5 bg-[#5E1224] hover:bg-[#721C24] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Branch Center</span>
                </button>
              </div>

              {/* Add Branch Modal / Panel */}
              {showAddBranch && (
                <div className="bg-white border-2 border-rose-300 rounded-2xl p-5 shadow-md space-y-4 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between border-b border-rose-100 pb-2">
                    <span className="text-xs font-black text-rose-950">Add New Collection / Branch Hub</span>
                    <button
                      type="button"
                      onClick={() => setShowAddBranch(false)}
                      className="text-xs text-slate-400 hover:text-slate-600"
                    >
                      ✕ Cancel
                    </button>
                  </div>

                  <form onSubmit={handleAddBranch} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Center Name *</label>
                        <input
                          type="text"
                          required
                          value={newBranchName}
                          onChange={(e) => setNewBranchName(e.target.value)}
                          placeholder="e.g. Indiranagar Collection Hub"
                          className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Center Code</label>
                        <input
                          type="text"
                          value={newBranchCode}
                          onChange={(e) => setNewBranchCode(e.target.value)}
                          placeholder="e.g. BR-IND01"
                          className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs font-mono text-slate-900 focus:bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Phone</label>
                        <input
                          type="text"
                          value={newBranchPhone}
                          onChange={(e) => setNewBranchPhone(e.target.value)}
                          placeholder="+91 9876543210"
                          className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs font-mono text-slate-900 focus:bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Center Address</label>
                      <input
                        type="text"
                        value={newBranchAddress}
                        onChange={(e) => setNewBranchAddress(e.target.value)}
                        placeholder="Street address, city, pincode..."
                        className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:bg-white"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowAddBranch(false)}
                        className="px-3 py-1.5 border border-slate-300 text-slate-700 text-xs font-bold rounded"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={savingBranch}
                        className="px-4 py-1.5 bg-[#5E1224] hover:bg-[#721C24] text-white text-xs font-bold rounded shadow-xs"
                      >
                        {savingBranch ? "Saving..." : "Add Center"}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Branches Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {branches.map((b) => (
                  <div key={b.id} className="bg-white border border-rose-200/90 rounded-xl p-4 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-rose-950 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-rose-700" />
                        {b.name}
                      </span>
                      {b.is_main_lab && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-900 border border-rose-300">
                          Main Lab Hub
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] font-mono text-slate-500">
                      Code: {b.code}
                    </div>
                    {b.phone && (
                      <div className="text-xs text-slate-600 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{b.phone}</span>
                      </div>
                    )}
                    {b.address && (
                      <div className="text-[11px] text-slate-500 line-clamp-2">
                        {b.address}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: SUBSCRIPTION & PLAN */}
          {activeTab === "subscription" && (
            <div className="max-w-2xl bg-white border border-rose-200/90 rounded-2xl p-6 shadow-2xs space-y-5">
              <div className="border-b border-rose-100 pb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-black text-rose-950 tracking-tight flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Software License & Diagnostic Tier</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Your active laboratory software operating system deployment status
                  </p>
                </div>

                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{labData?.subscription_status || "ACTIVE"}</span>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3.5 bg-rose-50/50 rounded-xl border border-rose-100">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">License Package</span>
                  <span className="text-sm font-black text-rose-950">{labData?.plan_name || "Professional Tier"}</span>
                </div>

                <div className="p-3.5 bg-rose-50/50 rounded-xl border border-rose-100">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Activation Date</span>
                  <span className="text-sm font-bold text-slate-800">{labData?.created_at || "18-Oct-2026"}</span>
                </div>
              </div>

              <div className="space-y-2 border-t border-rose-100 pt-3">
                <span className="text-xs font-bold text-slate-800 block">Active Plan Entitlements:</span>
                <ul className="text-xs text-slate-600 space-y-1.5">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Full Diagnostic Test Catalog: <strong>265+ NABL Tests & 767 Parameters</strong></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Automated Clinical Differential & Critical Range Bounds Validator</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Cryptographic Public QR Code Report Verification Engine</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Direct WhatsApp & SMS Patient Dispatch System</span>
                  </li>
                </ul>
              </div>

              <div className="pt-2 text-right">
                <Link
                  href="/lab/communication"
                  className="text-xs font-bold text-rose-700 hover:text-rose-900 inline-flex items-center gap-1"
                >
                  <span>Configure WhatsApp & SMS Notification Templates</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
