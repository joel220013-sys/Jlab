"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Send, 
  Smartphone, 
  CheckCircle2, 
  Clock, 
  Settings, 
  ShieldCheck, 
  RefreshCw, 
  ExternalLink,
  Radio,
  FileText,
  Sparkles,
  Copy,
  Check
} from "lucide-react";
import { apiFetch } from "@/lib/api";

interface CommunicationSettings {
  whatsapp_enabled: boolean;
  sms_enabled: boolean;
  active_provider: string;
  meta_api_token: string;
  meta_phone_number_id: string;
  fast2sms_api_key: string;
  msg91_auth_key: string;
  msg91_sender_id: string;
  twilio_account_sid: string;
  twilio_auth_token: string;
  twilio_phone_number: string;
  lab_display_name: string;
  auto_send_on_approval: boolean;
  auto_send_on_booking: boolean;
  templates: {
    report_ready: string;
    booking_confirmed: string;
    invoice_receipt: string;
  };
}

interface AlertLog {
  id: string;
  timestamp: string;
  patient_name: string;
  phone: string;
  type: string;
  channel: string;
  provider: string;
  status: string;
  message_preview: string;
  direct_url: string;
  order_number: string;
}

export default function CommunicationPage() {
  const [settings, setSettings] = useState<CommunicationSettings | null>(null);
  const [logs, setLogs] = useState<AlertLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Test Simulator State
  const [testPhone, setTestPhone] = useState("9449835659");
  const [testChannel, setTestChannel] = useState<"whatsapp" | "sms">("whatsapp");
  const [testMessage, setTestMessage] = useState(
    "Hello! This is a test alert from Diagnostic Centre. Your notification system is working perfectly."
  );
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<"simulator" | "templates" | "providers" | "logs">("simulator");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [settingsRes, logsRes] = await Promise.all([
        apiFetch("/communication/settings"),
        apiFetch("/communication/logs")
      ]);
      setSettings(settingsRes);
      setLogs(Array.isArray(logsRes) ? logsRes : []);
    } catch (err) {
      console.error("Failed to load communication config:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("jlab_user") || localStorage.getItem("pulselab_user");
        if (stored) {
          const u = JSON.parse(stored);
          if (u?.labName) {
            setTestMessage(
              `Hello! This is a test alert from ${u.labName}. Your notification system is working perfectly.`
            );
          }
        }
      } catch {}
    }
    fetchData();
  }, []);

  const handleSaveSettings = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await apiFetch("/communication/settings", {
        method: "POST",
        body: JSON.stringify(settings)
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleSendTest = async () => {
    if (!testPhone.trim()) {
      alert("Please enter a valid recipient phone number.");
      return;
    }
    setSendingTest(true);
    setTestResult(null);
    try {
      const res = await apiFetch("/communication/test", {
        method: "POST",
        body: JSON.stringify({
          phone: testPhone,
          channel: testChannel,
          message: testMessage
        })
      });
      setTestResult(res);
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to send test alert");
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-rose-400 uppercase tracking-wider">
            <Link href="/lab/dashboard" className="hover:text-rose-800 text-rose-600">🏠 HOME</Link>
            <span>➦</span>
            <span className="text-rose-950 font-black">COMMUNICATION &amp; PATIENT ALERTS</span>
          </div>
          <h1 className="text-2xl font-black text-rose-950 tracking-tight mt-1 flex items-center gap-2">
            <span>Patient Alerts &amp; Messaging Hub</span>
            <span className="text-xs bg-rose-100 text-rose-900 font-extrabold px-2.5 py-0.5 rounded-full border border-rose-300">
              Live Gateway Active
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Automate WhatsApp report links, SMS sample booking alerts, and dispatch receipts directly to patients.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchData}
            disabled={loading}
            className="p-2 bg-white border border-rose-200 rounded-lg text-rose-900 hover:bg-rose-50 text-xs font-bold flex items-center gap-1.5 shadow-2xs disabled:opacity-60"
            title="Refresh Logs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-rose-700" : ""}`} />
            <span>{loading ? "Syncing..." : "Refresh"}</span>
          </button>

          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={saving}
            className="px-4 py-2 bg-[#5E1224] hover:bg-[#721C24] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{saving ? "Saving..." : "Save Configuration"}</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Communication preferences and template changes saved successfully.</span>
        </div>
      )}

      {/* KPI Highlight Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-[#FFF0F4] border border-rose-200/90 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-rose-400 text-xs font-semibold">
            <span>WhatsApp Channel</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
          <div className="text-xl font-black text-rose-950 mt-1 flex items-center gap-2">
            <span>100% Free</span>
            <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-bold">Direct Click-to-Chat</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Instant delivery with zero Meta API fee</div>
        </div>

        <div className="bg-[#FFF0F4] border border-rose-200/90 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-rose-400 text-xs font-semibold">
            <span>Automated Triggers</span>
            <Radio className="w-3.5 h-3.5 text-rose-700" />
          </div>
          <div className="text-xl font-black text-rose-950 mt-1">2 Active</div>
          <div className="text-[11px] text-slate-500 mt-1">Auto-Alert on Approval &amp; Booking</div>
        </div>

        <div className="bg-[#FFF0F4] border border-rose-200/90 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-rose-400 text-xs font-semibold">
            <span>Dispatched Alerts</span>
            <Send className="w-3.5 h-3.5 text-rose-700" />
          </div>
          <div className="text-xl font-black text-rose-950 mt-1">{logs.length} Sent</div>
          <div className="text-[11px] text-slate-500 mt-1">Logged in diagnostic audit history</div>
        </div>

        <div className="bg-[#FFF0F4] border border-rose-200/90 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-rose-400 text-xs font-semibold">
            <span>Active Sender ID</span>
            <ShieldCheck className="w-3.5 h-3.5 text-rose-700" />
          </div>
          <div className="text-xl font-black text-rose-950 mt-1 truncate">
            {settings?.lab_display_name || "Diagnostic Centre"}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Verified Diagnostic Center</div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="bg-white border border-rose-200/90 rounded-xl shadow-2xs overflow-hidden">
        <div className="flex items-center border-b border-rose-200/80 bg-[#FFF0F4] p-1.5 gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveTab("simulator")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "simulator"
                ? "bg-[#5E1224] text-white shadow-2xs"
                : "text-rose-950 hover:bg-rose-100/60"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Live Dispatch Simulator</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("templates")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "templates"
                ? "bg-[#5E1224] text-white shadow-2xs"
                : "text-rose-950 hover:bg-rose-100/60"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Message Templates</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("providers")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "providers"
                ? "bg-[#5E1224] text-white shadow-2xs"
                : "text-rose-950 hover:bg-rose-100/60"
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Gateway &amp; API Credentials</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("logs")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "logs"
                ? "bg-[#5E1224] text-white shadow-2xs"
                : "text-rose-950 hover:bg-rose-100/60"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Dispatch Audit Log ({logs.length})</span>
          </button>
        </div>

        {/* =========================================================================
            TAB 1: LIVE TEST SIMULATOR
        ========================================================================= */}
        {activeTab === "simulator" && (
          <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            <div className="md:col-span-7 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-rose-950 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-rose-700" />
                  Instant Patient Alert Dispatcher
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Send a live test alert to verify delivery on your own phone or any patient number.
                </p>
              </div>

              <div className="space-y-3 bg-[#FFF5F7] p-4 rounded-xl border border-rose-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-rose-950 uppercase block mb-1">
                      Recipient Mobile No.
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-rose-500">
                        +91
                      </span>
                      <input
                        type="text"
                        value={testPhone}
                        onChange={(e) => setTestPhone(e.target.value)}
                        placeholder="9449835659"
                        className="w-full bg-white border border-rose-200 rounded-lg pl-11 pr-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-rose-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-rose-950 uppercase block mb-1">
                      Communication Channel
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setTestChannel("whatsapp")}
                        className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                          testChannel === "whatsapp"
                            ? "bg-emerald-600 text-white border-emerald-700 shadow-2xs"
                            : "bg-white text-slate-700 border-rose-200 hover:bg-rose-50"
                        }`}
                      >
                        <span>WhatsApp</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setTestChannel("sms")}
                        className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                          testChannel === "sms"
                            ? "bg-[#5E1224] text-white border-[#721C24] shadow-2xs"
                            : "bg-white text-slate-700 border-rose-200 hover:bg-rose-50"
                        }`}
                      >
                        <span>SMS Text</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-rose-950 uppercase">
                      Message Content
                    </label>
                    <span className="text-[10px] text-rose-400 font-mono">
                      {testMessage.length} characters
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    className="w-full bg-white border border-rose-200 rounded-lg p-2.5 text-xs text-slate-800 leading-relaxed focus:outline-none focus:border-rose-600 font-sans"
                    placeholder="Type your message here..."
                  />
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSendTest}
                    disabled={sendingTest}
                    className="px-5 py-2.5 bg-[#5E1224] hover:bg-[#721C24] text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm transition-all disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>{sendingTest ? "Dispatching Alert..." : `Send Live ${testChannel.toUpperCase()} Alert`}</span>
                  </button>

                  {testResult?.direct_whatsapp_url && (
                    <a
                      href={testResult.direct_whatsapp_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2.5 bg-white border border-rose-200 hover:bg-rose-50 text-rose-950 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-rose-700" />
                      <span>Open WhatsApp Web Directly</span>
                    </a>
                  )}
                </div>
              </div>

              {testResult && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-xs text-emerald-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Alert Dispatched Successfully!</span>
                    </div>
                    <span className="text-[10px] text-emerald-700 font-mono bg-white px-2 py-0.5 rounded border border-emerald-200">
                      HTTP 200 OK
                    </span>
                  </div>
                  <p className="text-xs text-emerald-800">{testResult.message}</p>
                  {testResult.direct_whatsapp_url && (
                    <div className="pt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(testResult.direct_whatsapp_url);
                          setCopiedLink(true);
                          setTimeout(() => setCopiedLink(false), 2000);
                        }}
                        className="px-3 py-1 bg-white border border-emerald-300 text-emerald-800 rounded text-xs font-semibold flex items-center gap-1 hover:bg-emerald-100"
                      >
                        {copiedLink ? <Check className="w-3 h-3 text-emerald-700" /> : <Copy className="w-3 h-3 text-slate-600" />}
                        <span>{copiedLink ? "Link Copied!" : "Copy WhatsApp URL"}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right: Phone Live Mockup */}
            <div className="md:col-span-5 flex flex-col items-center">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Live Patient Screen Preview
              </div>
              <div className="w-72 bg-neutral-900 rounded-[36px] p-3 shadow-2xl border-4 border-neutral-800">
                {/* Speaker pill */}
                <div className="w-24 h-4 bg-black rounded-full mx-auto mb-3 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-neutral-800 mr-2"></div>
                  <div className="w-10 h-1 bg-neutral-800 rounded-full"></div>
                </div>

                {/* WhatsApp Chat View */}
                <div className="bg-[#e5ddd5] rounded-[24px] h-[360px] p-3 flex flex-col justify-between overflow-hidden relative">
                  {/* Chat header */}
                  <div className="bg-[#075e54] text-white p-2 rounded-t-xl -mx-3 -mt-3 flex items-center gap-2 shadow-sm">
                    <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold uppercase">
                      {(settings?.lab_display_name || "DC").slice(0, 2)}
                    </div>
                    <div>
                      <div className="text-xs font-bold leading-none">{settings?.lab_display_name || "Diagnostic Centre"}</div>
                      <div className="text-[9px] text-emerald-200 mt-0.5">Official Lab Verification</div>
                    </div>
                  </div>

                  {/* Message Bubble */}
                  <div className="my-auto space-y-2">
                    <div className="bg-white rounded-lg p-2.5 text-[11px] text-slate-800 shadow-sm max-w-[92%] leading-relaxed whitespace-pre-wrap rounded-tl-none border-l-4 border-l-emerald-500">
                      {testMessage}
                      <div className="text-[9px] text-slate-400 text-right mt-1 font-mono">
                        Just now · ✓✓
                      </div>
                    </div>
                  </div>

                  {/* Bottom Chat Bar */}
                  <div className="bg-white rounded-full p-2 flex items-center justify-between text-slate-400 text-xs px-3 shadow-2xs">
                    <span className="text-[10px]">Type a message...</span>
                    <Send className="w-3 h-3 text-emerald-600" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: MESSAGE TEMPLATES
        ========================================================================= */}
        {activeTab === "templates" && settings && (
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-rose-950">
                Dynamic Patient Notification Templates
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Customize the exact text sent to patients. Dynamic tags like <code className="bg-rose-100 text-rose-900 px-1 py-0.5 rounded font-mono text-[10px]">{"{patient_name}"}</code> and <code className="bg-rose-100 text-rose-900 px-1 py-0.5 rounded font-mono text-[10px]">{"{report_url}"}</code> will automatically be filled.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Template 1: Report Ready */}
              <div className="bg-[#FFF0F4] border border-rose-200/90 rounded-xl p-4 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-rose-950 uppercase tracking-wide flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-rose-700" />
                    1. Verified Report Ready Alert
                  </span>
                  <span className="text-[10px] text-emerald-700 bg-emerald-100 font-bold px-2 py-0.5 rounded">
                    Includes QR Link
                  </span>
                </div>
                <textarea
                  rows={6}
                  value={settings.templates.report_ready}
                  onChange={(e) => setSettings({
                    ...settings,
                    templates: { ...settings.templates, report_ready: e.target.value }
                  })}
                  className="w-full bg-white border border-rose-200 rounded-lg p-3 text-xs text-slate-800 leading-relaxed font-mono focus:outline-none focus:border-rose-600"
                />
                <div className="text-[10px] text-slate-500">
                  Tags: <span className="font-mono text-rose-800 font-bold">{"{patient_name}, {order_number}, {lab_number}, {report_url}, {lab_name}"}</span>
                </div>
              </div>

              {/* Template 2: Booking Confirmation */}
              <div className="bg-[#FFF0F4] border border-rose-200/90 rounded-xl p-4 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-rose-950 uppercase tracking-wide flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    2. Sample Booking &amp; Registration
                  </span>
                  <span className="text-[10px] text-rose-800 bg-rose-100 font-bold px-2 py-0.5 rounded border border-rose-200">
                    Accession Alert
                  </span>
                </div>
                <textarea
                  rows={6}
                  value={settings.templates.booking_confirmed}
                  onChange={(e) => setSettings({
                    ...settings,
                    templates: { ...settings.templates, booking_confirmed: e.target.value }
                  })}
                  className="w-full bg-white border border-rose-200 rounded-lg p-3 text-xs text-slate-800 leading-relaxed font-mono focus:outline-none focus:border-rose-600"
                />
                <div className="text-[10px] text-slate-500">
                  Tags: <span className="font-mono text-rose-800 font-bold">{"{patient_name}, {lab_number}, {tests}, {lab_name}"}</span>
                </div>
              </div>

              {/* Template 3: Invoice & Payment Receipt */}
              <div className="bg-[#FFF0F4] border border-rose-200/90 rounded-xl p-4 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-rose-950 uppercase tracking-wide flex items-center gap-1.5">
                    <Radio className="w-4 h-4 text-rose-700" />
                    3. Payment Receipt &amp; Balance Alert
                  </span>
                  <span className="text-[10px] text-rose-900 bg-rose-100 font-bold px-2 py-0.5 rounded border border-rose-200">
                    Accounts Receipt
                  </span>
                </div>
                <textarea
                  rows={6}
                  value={settings.templates.invoice_receipt}
                  onChange={(e) => setSettings({
                    ...settings,
                    templates: { ...settings.templates, invoice_receipt: e.target.value }
                  })}
                  className="w-full bg-white border border-rose-200 rounded-lg p-3 text-xs text-slate-800 leading-relaxed font-mono focus:outline-none focus:border-rose-600"
                />
                <div className="text-[10px] text-slate-500">
                  Tags: <span className="font-mono text-rose-800 font-bold">{"{patient_name}, {amount}, {invoice_number}, {balance}, {lab_name}"}</span>
                </div>
              </div>

              {/* Automated Dispatch Checkboxes */}
              <div className="bg-[#FFF0F4] border border-rose-200/90 rounded-xl p-4 space-y-4 shadow-2xs">
                <div className="font-bold text-xs text-rose-950 uppercase tracking-wide">
                  Automated Trigger Rules
                </div>

                <label className="flex items-start gap-3 text-xs text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.auto_send_on_approval}
                    onChange={(e) => setSettings({ ...settings, auto_send_on_approval: e.target.checked })}
                    className="w-4 h-4 text-[#5E1224] rounded accent-[#5E1224] mt-0.5"
                  />
                  <div>
                    <span className="font-bold text-rose-950">Auto-Send Report Link on Pathologist Approval</span>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      Automatically triggers WhatsApp / SMS alert as soon as the pathologist authorizes and digitally certifies the test.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 text-xs text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.auto_send_on_booking}
                    onChange={(e) => setSettings({ ...settings, auto_send_on_booking: e.target.checked })}
                    className="w-4 h-4 text-[#5E1224] rounded accent-[#5E1224] mt-0.5"
                  />
                  <div>
                    <span className="font-bold text-rose-950">Auto-Send Sample Booking Confirmation</span>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      Sends immediate notification when a new order is registered at the reception desk.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 3: GATEWAY & PROVIDER SETTINGS
        ========================================================================= */}
        {activeTab === "providers" && settings && (
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-rose-950">
                Gateway &amp; API Integration Settings
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Choose between 100% Free 1-Click Direct WhatsApp or connect your official Cloud API keys.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Provider 1: Direct WhatsApp */}
              <div 
                onClick={() => setSettings({ ...settings, active_provider: "DIRECT_WHATSAPP" })}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  settings.active_provider === "DIRECT_WHATSAPP"
                    ? "border-emerald-500 bg-emerald-50/50 shadow-xs"
                    : "border-rose-200 hover:border-rose-300 bg-white"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs text-slate-900">1. Direct WhatsApp</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded">
                    100% Free
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Opens WhatsApp Web / Desktop instantly with pre-formatted patient report link. Zero API keys or Meta approval needed.
                </p>
                <div className="mt-3 text-[10px] text-emerald-700 font-bold">
                  ✓ Recommended for instant launch
                </div>
              </div>

              {/* Provider 2: Meta Cloud API */}
              <div 
                onClick={() => setSettings({ ...settings, active_provider: "META_CLOUD_API" })}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  settings.active_provider === "META_CLOUD_API"
                    ? "border-[#5E1224] bg-rose-50/50 shadow-xs"
                    : "border-rose-200 hover:border-rose-300 bg-white"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs text-slate-900">2. Meta Cloud API</span>
                  <span className="text-[10px] bg-rose-100 text-rose-900 font-extrabold px-2 py-0.5 rounded border border-rose-300">
                    1,000 Free/Mo
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Official WhatsApp Business Platform by Meta. Fully automated background delivery with verified green tick.
                </p>
                <div className="mt-3 text-[10px] text-rose-800 font-bold">
                  ✓ Hands-free background dispatch
                </div>
              </div>

              {/* Provider 3: Fast2SMS / MSG91 */}
              <div 
                onClick={() => setSettings({ ...settings, active_provider: "FAST2SMS" })}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  settings.active_provider === "FAST2SMS"
                    ? "border-[#5E1224] bg-rose-50/50 shadow-xs"
                    : "border-rose-200 hover:border-rose-300 bg-white"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs text-slate-900">3. Fast2SMS / MSG91</span>
                  <span className="text-[10px] bg-slate-100 text-slate-800 font-extrabold px-2 py-0.5 rounded">
                    SMS Gateway
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  India DLT-compliant SMS text alerts. Fallback for patients without WhatsApp on basic feature phones.
                </p>
                <div className="mt-3 text-[10px] text-slate-700 font-bold">
                  ✓ ~₹0.18 per SMS in India
                </div>
              </div>
            </div>

            {/* Provider Form Fields */}
            <div className="bg-[#FFF0F4] border border-rose-200/90 rounded-xl p-5 space-y-4">
              <div className="font-bold text-xs text-rose-950 uppercase">
                Active Provider Credentials: <span className="text-rose-800 font-black">{settings.active_provider}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-rose-950 block mb-1">
                    Laboratory Display Name
                  </label>
                  <input
                    type="text"
                    value={settings.lab_display_name}
                    onChange={(e) => setSettings({ ...settings, lab_display_name: e.target.value })}
                    className="w-full bg-white border border-rose-200 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none focus:border-rose-600 font-bold"
                  />
                </div>

                {settings.active_provider === "META_CLOUD_API" && (
                  <>
                    <div>
                      <label className="text-[11px] font-bold text-rose-950 block mb-1">
                        Meta Phone Number ID
                      </label>
                      <input
                        type="text"
                        value={settings.meta_phone_number_id}
                        onChange={(e) => setSettings({ ...settings, meta_phone_number_id: e.target.value })}
                        placeholder="e.g. 105948392019485"
                        className="w-full bg-white border border-rose-200 rounded-lg p-2.5 text-xs font-mono text-slate-900 focus:outline-none focus:border-rose-600"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-bold text-rose-950 block mb-1">
                        Permanent Graph API Access Token
                      </label>
                      <input
                        type="password"
                        value={settings.meta_api_token}
                        onChange={(e) => setSettings({ ...settings, meta_api_token: e.target.value })}
                        placeholder="EAAB..."
                        className="w-full bg-white border border-rose-200 rounded-lg p-2.5 text-xs font-mono text-slate-900 focus:outline-none focus:border-rose-600"
                      />
                    </div>
                  </>
                )}

                {settings.active_provider === "FAST2SMS" && (
                  <>
                    <div>
                      <label className="text-[11px] font-bold text-rose-950 block mb-1">
                        Fast2SMS Authorization API Key
                      </label>
                      <input
                        type="password"
                        value={settings.fast2sms_api_key}
                        onChange={(e) => setSettings({ ...settings, fast2sms_api_key: e.target.value })}
                        placeholder="Enter Fast2SMS API Key"
                        className="w-full bg-white border border-rose-200 rounded-lg p-2.5 text-xs font-mono text-slate-900 focus:outline-none focus:border-rose-600"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-rose-950 block mb-1">
                        DLT Header / Sender ID
                      </label>
                      <input
                        type="text"
                        value={settings.msg91_sender_id}
                        onChange={(e) => setSettings({ ...settings, msg91_sender_id: e.target.value })}
                        placeholder="SAIBAL"
                        className="w-full bg-white border border-rose-200 rounded-lg p-2.5 text-xs font-mono text-slate-900 focus:outline-none focus:border-rose-600"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 4: DISPATCH AUDIT LOG
        ========================================================================= */}
        {activeTab === "logs" && (
          <div className="p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-rose-950">
                  Notification Audit History
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Complete record of alerts sent to patients with delivery timestamps and verification links.
                </p>
              </div>
              <button
                type="button"
                onClick={fetchData}
                className="text-xs text-rose-700 hover:text-rose-950 hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" /> Refresh Table
              </button>
            </div>

            {loading ? (
              <div className="py-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-rose-700" />
                <span>Loading dispatch history...</span>
              </div>
            ) : logs.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No notification logs recorded yet. Send a test alert from the simulator tab to see it appear here.
              </div>
            ) : (
              <div className="overflow-x-auto border border-rose-200 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#FFF0F4] border-b border-rose-200/80 text-rose-950 font-bold uppercase text-[10px]">
                      <th className="py-2.5 px-3">Timestamp</th>
                      <th className="py-2.5 px-3">Patient Name</th>
                      <th className="py-2.5 px-3">Mobile Number</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Channel</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rose-100">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-rose-50/50 transition-colors">
                        <td className="py-2 px-3 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                          {log.timestamp}
                        </td>
                        <td className="py-2 px-3 font-bold text-slate-900">
                          {log.patient_name}
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-700">
                          +{log.phone}
                        </td>
                        <td className="py-2 px-3">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-900 border border-rose-200">
                            {log.type}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            log.channel === "WHATSAPP"
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : "bg-rose-100 text-rose-900 border border-rose-300"
                          }`}>
                            {log.channel}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>{log.status}</span>
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right">
                          {log.direct_url ? (
                            <a
                              href={log.direct_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-800 hover:text-rose-950"
                            >
                              <span>Open Chat</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-slate-400 text-[10px]">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
