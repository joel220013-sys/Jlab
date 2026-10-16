"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  CheckCircle2, 
  XCircle, 
  ShieldCheck, 
  FileText, 
  Stamp,
  Inbox,
  Clock,
  Barcode
} from "lucide-react";
import { apiFetch } from "@/lib/api";

interface QueueItem {
  test_result_id: string;
  order_id: string;
  order_number: string;
  lab_number: string;
  barcode: string;
  patient_name: string;
  patient_uhid: string;
  patient_age_gender: string;
  test_name: string;
  test_code: string;
  specimen_type: string;
  status: string;
  created_at: string;
}

export default function PathologistApprovalsPage() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvedReport, setApprovedReport] = useState<string | null>(null);
  const [rejectedReport, setRejectedReport] = useState<string | null>(null);
  const [remarks, setRemarks] = useState("Clinically correlated. Results verified and authorized for digital release.");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [signatoryName, setSignatoryName] = useState("Authorized Consultant Pathologist");

  const fetchQueue = () => {
    setLoading(true);
    apiFetch("/approvals/queue")
      .then((data) => {
        if (Array.isArray(data)) {
          setQueue(data);
        } else {
          setQueue([]);
        }
      })
      .catch(() => {
        setQueue([]);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchQueue();
    try {
      const stored = localStorage.getItem("jlab_user") || localStorage.getItem("pulselab_user");
      if (stored) {
        const u = JSON.parse(stored);
        if (u.fullName) setSignatoryName(u.fullName);
      }
    } catch {
      // Ignore localStorage parse errors
    }
  }, []);

  const handleApprove = async (item: QueueItem) => {
    setProcessingId(item.test_result_id);
    try {
      await apiFetch(`/approvals/${item.test_result_id}/approve`, {
        method: "POST",
        body: JSON.stringify({ remarks })
      });
      setApprovedReport(item.order_number);
      fetchQueue();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Approval failed");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (item: QueueItem) => {
    setProcessingId(item.test_result_id);
    try {
      await apiFetch(`/approvals/${item.test_result_id}/reject`, {
        method: "POST",
        body: JSON.stringify({ remarks: "Rejected by pathologist. Please re-run aliquot and verify." })
      });
      setRejectedReport(item.order_number);
      fetchQueue();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Rejection failed");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-rose-950 tracking-tight flex items-center gap-2">
            Pathologist Clinical Verification Queue
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review technician entered values, historical delta shifts, and authorize digital e-signatures.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs bg-[#FFF0F4] border border-rose-200 px-3 py-1.5 rounded-lg text-rose-950 shadow-xs">
          <ShieldCheck className="w-4 h-4 text-rose-700" />
          <span>Signatory: <b>{signatoryName}</b></span>
        </div>
      </div>

      {approvedReport && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-sm flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <div className="font-bold">Order #{approvedReport} Approved &amp; Certified!</div>
              <div className="text-xs text-emerald-700">Digital cryptographic seal applied. Report unlocked for patient dispatch.</div>
            </div>
          </div>
          <Link
            href="/lab/reports"
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
          >
            View in Reports →
          </Link>
        </div>
      )}

      {rejectedReport && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-sm flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <div className="font-bold">Order #{rejectedReport} Returned for Review</div>
              <div className="text-xs text-rose-700">Specimen returned to technician workbench for re-analysis.</div>
            </div>
          </div>
          <button
            onClick={() => setRejectedReport(null)}
            className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg text-xs font-bold transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center text-slate-400 text-xs">
          Loading verification queue...
        </div>
      ) : queue.length === 0 ? (
        <div className="bg-[#FFF0F4] rounded-xl border border-rose-200/90 p-12 text-center shadow-2xs">
          <Inbox className="w-12 h-12 text-rose-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-rose-950">Verification Queue is Empty</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            All submitted results have been reviewed and published. Pending laboratory tests will appear here once submitted by technicians.
          </p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <Link
              href="/lab/dashboard"
              className="px-4 py-2 bg-[#5E1224] hover:bg-[#721C24] text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
            >
              Back to Cockpit
            </Link>
            <button
              onClick={fetchQueue}
              className="px-4 py-2 bg-white hover:bg-rose-50 border border-rose-200 text-rose-950 text-xs font-bold rounded-lg transition-colors"
            >
              Refresh Queue
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {queue.map((item) => (
            <div key={item.test_result_id} className="bg-white rounded-xl border border-rose-200/90 overflow-hidden shadow-2xs">
              <div className="p-4 border-b border-rose-200/80 bg-[#FFF0F4] flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-rose-100 text-rose-950 border border-rose-300 flex items-center justify-center font-bold font-mono text-xs">
                    #{item.lab_number}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      {item.patient_name} ({item.patient_age_gender})
                      <span className="text-[10px] bg-rose-50 text-rose-900 px-2 py-0.5 rounded font-mono border border-rose-200">
                        {item.patient_uhid}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                      <span>Order: {item.order_number}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1 font-mono text-slate-700">
                        <Barcode className="w-3.5 h-3.5 text-rose-700" /> {item.barcode} ({item.specimen_type})
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-600" /> Awaiting Pathologist Review
                  </span>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div className="p-4 rounded-xl bg-[#FFF5F7] border border-rose-200">
                  <div className="font-bold text-sm text-rose-950 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-rose-700" /> {item.test_name} ({item.test_code})
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Specimen: {item.specimen_type} · Submitted for clinical authorization.
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-rose-950 block mb-1">
                    Pathologist Clinical Remarks &amp; Certification Note
                  </label>
                  <textarea
                    rows={2}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="w-full bg-white border border-rose-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:border-rose-600"
                    placeholder="Enter diagnostic notes..."
                  />
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-rose-200/80 flex-wrap gap-3">
                  <button
                    onClick={() => handleReject(item)}
                    disabled={processingId === item.test_result_id}
                    className="px-4 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" /> Reject &amp; Rerun Aliquot
                  </button>

                  <button
                    onClick={() => handleApprove(item)}
                    disabled={processingId === item.test_result_id}
                    className="px-5 py-2 rounded-lg bg-[#5E1224] hover:bg-[#721C24] text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all disabled:opacity-50"
                  >
                    <Stamp className="w-4 h-4" />
                    <span>{processingId === item.test_result_id ? "Certifying..." : "Authorize & Sign Report"}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
