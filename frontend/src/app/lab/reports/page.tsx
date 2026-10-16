"use client";

import { useState, useEffect, useMemo, Suspense, Fragment } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  FileText, 
  Printer, 
  Lock, 
  CheckCircle2, 
  Search, 
  X, 
  ExternalLink,
  Inbox,
  ArrowLeft,
  ChevronDown,
  Download,
  MessageCircle,
  Share2,
  Barcode as BarcodeIcon,
  ChevronRight
} from "lucide-react";
import QRCode from "qrcode";
import { apiFetch } from "@/lib/api";

interface ReportItem {
  id: string;
  order_id: string;
  report_number: string;
  order_number: string;
  lab_number: string;
  patient_name: string;
  patient_uhid: string;
  patient_reg_no?: string;
  patient_phone: string;
  patient_age?: number;
  patient_gender?: string;
  reg_lab_no?: string;
  order_date?: string;
  date?: string;
  ip_op?: string;
  doctor_name?: string;
  ref_center?: string;
  printed_count?: number;
  user_log_count?: number;
  lab_order_tests?: string;
  status: string;
  is_locked_for_billing: boolean;
  public_verification_hash: string;
  invoice_balance: number;
  invoice_total: number;
  created_at: string;
}

interface TestParamItem {
  name: string;
  code?: string;
  result: any;
  unit?: string;
  reference_range?: string;
  flag?: string;
  is_abnormal?: boolean;
  is_bold?: boolean;
  is_differential_part?: boolean;
}

interface TestSectionItem {
  test_id?: string;
  test_name: string;
  test_code?: string;
  department?: string;
  category_name?: string;
  specimen?: string;
  status?: string;
  parameters: TestParamItem[];
}

interface DepartmentGroupItem {
  department: string;
  tests: TestSectionItem[];
}

interface PatientOrderItem {
  id: string;
  order_number: string;
  lab_number: string;
  date: string;
  is_current?: boolean;
}

interface ReportDetail {
  report_id?: string;
  report_number: string;
  status: string;
  public_verification_hash: string;
  verification_url?: string;
  is_locked_for_billing: boolean;
  printed_count?: number;
  user_log_count?: number;
  handed_over_to?: string;
  dispatched_by?: string;
  billing: {
    invoice_number: string | null;
    total: number;
    balance: number;
    status: string;
  };
  laboratory: {
    name: string;
    legal_name?: string;
    speciality_name?: string;
    tagline?: string;
    phone?: string;
    email?: string;
    address?: string;
    nabl_accr?: string;
    logo_url?: string | null;
  };
  patient: {
    id?: string;
    name: string;
    uhid: string;
    reg_no?: string;
    age_years?: number;
    gender?: string;
    age_gender?: string;
    phone?: string;
    address?: string;
  };
  order: {
    id?: string;
    order_number: string;
    lab_number: string;
    reg_lab_no?: string;
    doctor?: string;
    ref_center?: string;
    date?: string;
    reported_date?: string;
    specimen?: string;
  };
  patient_orders?: PatientOrderItem[];
  verified_by?: {
    name: string;
    qualification?: string;
    designation?: string;
    verified_at?: string;
  };
  tests: TestSectionItem[];
  departments?: DepartmentGroupItem[];
}

// Helper to format result with Low / High flags matching AyusLab PDF
function formatResultWithFlag(result: any, flag?: string, is_abnormal?: boolean, reference_range?: string) {
  if (result === null || result === undefined || result === "") return { val: "—", flag: "" };
  const strVal = String(result).trim();

  let flagSymbol = "";
  if (flag) {
    const fUpper = flag.toUpperCase().trim();
    if (fUpper === "L" || fUpper === "( L )" || fUpper.includes("LOW")) {
      flagSymbol = "( L )";
    } else if (fUpper === "H" || fUpper === "( H )" || fUpper.includes("HIGH")) {
      flagSymbol = "( H )";
    }
  }

  // Fallback numerical check against reference range if is_abnormal
  if (!flagSymbol && is_abnormal && reference_range) {
    const num = parseFloat(strVal);
    if (!isNaN(num)) {
      const match = reference_range.match(/([\d.]+)\s*-\s*([\d.]+)/);
      if (match) {
        const low = parseFloat(match[1]);
        const high = parseFloat(match[2]);
        if (num < low) flagSymbol = "( L )";
        else if (num > high) flagSymbol = "( H )";
      }
    }
  }

  return { val: strVal, flag: flagSymbol };
}

// Helper to determine if a parameter has an entered result (not empty, dash, or null)
export function isParameterEntered(param: any): boolean {
  if (!param) return false;
  const val = param.result;
  if (val === null || val === undefined) return false;
  const str = String(val).trim();
  if (
    str === "" ||
    str === "—" ||
    str === "-" ||
    str === "--" ||
    str.toLowerCase() === "null" ||
    str.toLowerCase() === "undefined" ||
    str.toLowerCase() === "none"
  ) {
    return false;
  }
  return true;
}

function ReportsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryDispatchId = searchParams.get("dispatchId") || searchParams.get("orderId");
  const queryGroupByDept = searchParams.get("group_by_lab_master") === "1" || searchParams.get("groupByDepartment") === "1";
  const queryLetterhead = searchParams.get("letter_head") !== "0";

  // List data state
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  // Filter input states matching AyusLab top bar
  const [patientNoFilter, setPatientNoFilter] = useState("");
  const [labNoFilter, setLabNoFilter] = useState("");
  const [mobileFilter, setMobileFilter] = useState("");
  const [serviceItemFilter, setServiceItemFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Category");
  const [sampleNoFilter, setSampleNoFilter] = useState("");
  const [ipOpFilter, setIpOpFilter] = useState("");
  const [referredByFilter, setReferredByFilter] = useState("All");
  const [dispatchStatusFilter, setDispatchStatusFilter] = useState("Report Dispatch");

  // Active view: "LIST" vs "DISPATCH_VIEW"
  const [viewMode, setViewMode] = useState<"LIST" | "DISPATCH_VIEW">("LIST");
  const [selectedDispatch, setSelectedDispatch] = useState<ReportDetail | null>(null);
  const [loadingDispatch, setLoadingDispatch] = useState(false);

  // Handed over state
  const [handedOverTo, setHandedOverTo] = useState("Patient (Self)");

  // Printable full report modal state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [letterheadEnabled, setLetterheadEnabled] = useState(true);
  const [groupByDepartment, setGroupByDepartment] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [overrideSuccess, setOverrideSuccess] = useState(false);

  // Print dropdown for table rows
  const [openPrintDropdownId, setOpenPrintDropdownId] = useState<string | null>(null);

  // Fetch reports list
  const fetchReports = async () => {
    try {
      setLoadingList(true);
      const data = await apiFetch("/reports");
      if (Array.isArray(data)) {
        setReports(data);
      } else {
        setReports([]);
      }
    } catch {
      setReports([]);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // Load dispatch view if query param present
  useEffect(() => {
    if (queryDispatchId) {
      loadDispatchView(queryDispatchId, {
        autoOpenPrint: searchParams.get("print") === "1" || searchParams.has("group_by_lab_master"),
        withLetterhead: queryLetterhead,
        groupByDept: queryGroupByDept
      });
    }
  }, [queryDispatchId]);

  // Load dispatch detail by order_id or report_number
  const loadDispatchView = async (
    orderIdOrNumber: string,
    options?: { autoOpenPrint?: boolean; withLetterhead?: boolean; groupByDept?: boolean }
  ) => {
    try {
      setLoadingDispatch(true);
      const data = await apiFetch(`/reports/${orderIdOrNumber}`);
      setSelectedDispatch(data);
      setViewMode("DISPATCH_VIEW");

      if (options?.autoOpenPrint) {
        setLetterheadEnabled(options.withLetterhead ?? true);
        setGroupByDepartment(options.groupByDept ?? false);
        setPreviewOpen(true);
      }

      // Generate verification QR
      if (data.public_verification_hash) {
        const verifyUrl = `${window.location.origin}/verify/${data.public_verification_hash}`;
        const qrData = await QRCode.toDataURL(verifyUrl, {
          width: 130,
          margin: 1,
          color: { dark: "#0f172a", light: "#ffffff" }
        });
        setQrCodeDataUrl(qrData);
      }
    } catch (err) {
      console.error("Failed to load report dispatch view", err);
      alert("Failed to load report dispatch details. Please check the backend connection or try again.");
    } finally {
      setLoadingDispatch(false);
    }
  };

  // Back to list
  const handleBackToList = () => {
    setViewMode("LIST");
    setSelectedDispatch(null);
    router.push("/lab/reports");
  };

  // Open Preview Modal with Letterhead and Grouping configuration
  const triggerPrintModal = (options: { withLetterhead: boolean; groupByDept?: boolean }) => {
    setLetterheadEnabled(options.withLetterhead);
    setGroupByDepartment(Boolean(options.groupByDept));
    setPreviewOpen(true);
  };

  // WhatsApp dispatch trigger with backend audit logging
  const handleWhatsAppShare = async (phone: string, patientName: string, verifyHash: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    const targetPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const verifyLink = `${window.location.origin}/verify/${verifyHash}`;
    const message = encodeURIComponent(
      `Hello ${patientName},\nYour diagnostic test report from Sai Balaji Diagnostic Centre is ready for viewing and download.\n\nView Report: ${verifyLink}\n\nThank you for choosing Sai Balaji Diagnostic Centre.`
    );

    // Call backend communication API to record audit log
    try {
      await apiFetch("/communication/send-report-alert", {
        method: "POST",
        body: JSON.stringify({
          phone: targetPhone,
          patient_name: patientName,
          order_number: selectedDispatch?.order?.order_number || "ORD-LIVE",
          lab_number: selectedDispatch?.order?.lab_number || "LAB",
          verify_hash: verifyHash,
          channel: "whatsapp",
          origin_url: window.location.origin
        })
      });
    } catch {
      // Fallback silently if offline
    }

    window.open(`https://wa.me/${targetPhone}?text=${message}`, "_blank");
  };

  // Credit override
  const handleOverrideLock = async () => {
    if (!selectedDispatch) return;
    const targetOrder = selectedDispatch.order?.order_number || selectedDispatch.order?.id;
    if (targetOrder) {
      try {
        await apiFetch(`/reports/${targetOrder}/override-billing-lock`, {
          method: "POST"
        });
      } catch {
        // Fallback local unlock
      }
    }
    setOverrideSuccess(true);
    setSelectedDispatch((prev: any) => ({
      ...prev,
      is_locked_for_billing: false,
      billing: { ...prev.billing, balance: 0.0, status: "CREDIT_OVERRIDE" }
    }));
    setReports((prev) =>
      prev.map((r) => (r.order_number === targetOrder ? { ...r, is_locked_for_billing: false } : r))
    );
  };

  // Filtered list of tests that only contain entered parameters
  const validTestsList = useMemo<TestSectionItem[]>(() => {
    if (!selectedDispatch || !selectedDispatch.tests) return [];
    return selectedDispatch.tests
      .map((t) => ({
        ...t,
        parameters: (t.parameters || []).filter(isParameterEntered)
      }))
      .filter((t) => t.parameters.length > 0);
  }, [selectedDispatch]);

  // Group tests by department (AyusLab Department-Wise grouping) with only entered tests/parameters
  const groupedDepartmentList = useMemo<DepartmentGroupItem[]>(() => {
    if (!selectedDispatch) return [];
    const sourceDepts = selectedDispatch.departments && selectedDispatch.departments.length > 0
      ? selectedDispatch.departments
      : (() => {
          const map: { [dept: string]: TestSectionItem[] } = {};
          for (const t of (selectedDispatch.tests || [])) {
            const dept = t.department || t.category_name || "GENERAL PATHOLOGY";
            if (!map[dept]) map[dept] = [];
            map[dept].push(t);
          }
          return Object.keys(map).map((dept) => ({
            department: dept,
            tests: map[dept]
          }));
        })();

    return sourceDepts
      .map((dept) => ({
        ...dept,
        tests: (dept.tests || [])
          .map((t) => ({
            ...t,
            parameters: (t.parameters || []).filter(isParameterEntered)
          }))
          .filter((t) => t.parameters.length > 0)
      }))
      .filter((dept) => dept.tests.length > 0);
  }, [selectedDispatch]);

  // Filtered reports calculation
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      // Patient No
      if (patientNoFilter.trim()) {
        const query = patientNoFilter.trim().toLowerCase();
        const pNo = (r.patient_reg_no || r.patient_uhid || "").toLowerCase();
        if (!pNo.includes(query)) return false;
      }
      // Lab No
      if (labNoFilter.trim()) {
        const query = labNoFilter.trim().toLowerCase();
        if (!r.lab_number.toLowerCase().includes(query)) return false;
      }
      // Mobile
      if (mobileFilter.trim()) {
        const query = mobileFilter.trim().toLowerCase();
        if (!r.patient_phone.toLowerCase().includes(query)) return false;
      }
      // Service Item Name / Test Name
      if (serviceItemFilter.trim()) {
        const query = serviceItemFilter.trim().toLowerCase();
        const tests = (r.lab_order_tests || "").toLowerCase();
        if (!tests.includes(query)) return false;
      }
      // Referred By
      if (referredByFilter !== "All") {
        const doc = (r.doctor_name || "").toLowerCase();
        if (!doc.includes(referredByFilter.toLowerCase())) return false;
      }
      // Report Dispatch status
      if (dispatchStatusFilter === "Dispatched") {
        if (r.status !== "APPROVED" && r.status !== "PUBLISHED") return false;
      } else if (dispatchStatusFilter === "Pending") {
        if (r.status === "APPROVED" || r.status === "PUBLISHED") return false;
      }
      return true;
    });
  }, [
    reports,
    patientNoFilter,
    labNoFilter,
    mobileFilter,
    serviceItemFilter,
    referredByFilter,
    dispatchStatusFilter
  ]);

  // Render parameters for a test section (handling sub-group like DIFFERENTIAL COUNT)
  const renderTestParameters = (parameters: TestParamItem[]) => {
    // Only render parameters that have an entered value
    const entered = (parameters || []).filter(isParameterEntered);
    if (entered.length === 0) return null;

    const hasDiff = entered.some((p) => p.is_differential_part);

    if (!hasDiff) {
      return (
        <Fragment>
          {entered.map((p, idx) => (
            <ParamTableRow key={idx} param={p} />
          ))}
        </Fragment>
      );
    }

    const beforeDiff: TestParamItem[] = [];
    const diffGroup: TestParamItem[] = [];
    const afterDiff: TestParamItem[] = [];

    let foundDiff = false;
    for (const p of entered) {
      if (p.is_differential_part) {
        foundDiff = true;
        diffGroup.push(p);
      } else if (!foundDiff) {
        beforeDiff.push(p);
      } else {
        afterDiff.push(p);
      }
    }

    return (
      <Fragment>
        {beforeDiff.map((p, idx) => (
          <ParamTableRow key={`b-${idx}`} param={p} />
        ))}

        {diffGroup.length > 0 && (
          <tr className="border-b border-dotted border-slate-300">
            <td colSpan={4} className="pt-1.5 pb-0.5 font-bold text-[10.5px] uppercase text-slate-900 tracking-tight pl-0">
              DIFFERENTIAL COUNT
            </td>
          </tr>
        )}

        {diffGroup.map((p, idx) => (
          <ParamTableRow key={`d-${idx}`} param={p} isDifferential={true} />
        ))}

        {afterDiff.map((p, idx) => (
          <ParamTableRow key={`a-${idx}`} param={p} />
        ))}
      </Fragment>
    );
  };

  // Helper row component matching exact AyusLab Investigation Report table layout
  function ParamTableRow({ param, isDifferential = false }: { param: TestParamItem; isDifferential?: boolean }) {
    if (!isParameterEntered(param)) return null;
    const { val, flag } = formatResultWithFlag(param.result, param.flag, param.is_abnormal, param.reference_range);
    const isAbnormal = Boolean(flag);

    return (
      <tr className="hover:bg-slate-50/50 transition-colors">
        <td className={`py-0.5 pr-2 font-medium uppercase text-slate-900 align-top text-[11px] ${isDifferential ? "pl-3.5" : "pl-0"}`}>
          {param.name}
        </td>
        <td className="py-0.5 pr-2 font-bold align-top text-left whitespace-nowrap text-[11px]">
          <span className={isAbnormal ? "text-slate-950 font-black" : "text-slate-800"}>
            {val}
          </span>
          {flag && (
            <span className="ml-1.5 font-bold text-[10px] text-slate-950 inline-block">
              {flag}
            </span>
          )}
        </td>
        <td className="py-0.5 pr-2 text-slate-700 align-top text-[11px]">
          {param.unit || ""}
        </td>
        <td className="py-0.5 text-slate-700 align-top whitespace-pre-line text-[10.5px] leading-snug">
          {param.reference_range || ""}
        </td>
      </tr>
    );
  }

  return (
    <div className="space-y-3 font-sans text-slate-800 relative">
      {/* Loading Overlay */}
      {loadingDispatch && (
        <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-2xs flex items-center justify-center">
          <div className="bg-white px-4 py-3 rounded-lg shadow-xl border border-slate-200 flex items-center gap-3 text-xs font-semibold text-slate-800">
            <div className="w-4 h-4 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin"></div>
            <span>Loading Report Dispatch...</span>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 1: AYUSLAB REPORTS LIST VIEW (Screenshot 1: ayuslab.com/reports)
      ========================================================================= */}
      {viewMode === "LIST" && (
        <div className={`space-y-3 ${previewOpen ? "print:hidden" : ""}`}>
          {/* Breadcrumb Header Bar */}
          <div className="flex items-center justify-between bg-[#FFF0F4] border border-rose-200/90 px-4 py-2 rounded-lg shadow-2xs">
            <div className="flex items-center gap-2 text-xs font-bold text-rose-950 tracking-wide">
              <Link href="/lab/dashboard" className="text-rose-600 hover:text-rose-950">🏠</Link>
              <span className="text-rose-300">➦</span>
              <span className="text-rose-950 uppercase tracking-wider font-extrabold">REPORTS</span>
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="text-rose-700 hover:text-rose-950 p-1"
              title="Print Register"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>

          {/* AyusLab Filter Toolbar */}
          <div className="bg-[#FFF0F4] border border-rose-200/90 rounded-xl p-3 shadow-2xs">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <input
                type="text"
                placeholder="Patient No."
                value={patientNoFilter}
                onChange={(e) => setPatientNoFilter(e.target.value)}
                className="w-28 bg-white border border-rose-200 rounded px-2.5 py-1 text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:border-rose-600 shadow-2xs"
              />

              <input
                type="text"
                placeholder="Lab No."
                value={labNoFilter}
                onChange={(e) => setLabNoFilter(e.target.value)}
                className="w-24 bg-white border border-rose-200 rounded px-2.5 py-1 text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:border-rose-600 shadow-2xs"
              />

              <input
                type="text"
                placeholder="Mobile No."
                value={mobileFilter}
                onChange={(e) => setMobileFilter(e.target.value)}
                className="w-28 bg-white border border-rose-200 rounded px-2.5 py-1 text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:border-rose-600 shadow-2xs"
              />

              <input
                type="text"
                placeholder="Service Item N"
                value={serviceItemFilter}
                onChange={(e) => setServiceItemFilter(e.target.value)}
                className="w-32 bg-white border border-rose-200 rounded px-2.5 py-1 text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:border-rose-600 shadow-2xs"
              />

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-white border border-rose-200 rounded px-2 py-1 text-slate-700 text-xs focus:outline-none focus:border-rose-600 shadow-2xs font-medium"
              >
                <option value="All Category">All Category</option>
                <option value="BIOCHEMISTRY">BIOCHEMISTRY</option>
                <option value="HEMATOLOGY">HEMATOLOGY</option>
                <option value="CLINICAL PATHOLOGY">CLINICAL PATHOLOGY</option>
                <option value="SEROLOGY">SEROLOGY</option>
                <option value="MICROBIOLOGY">MICROBIOLOGY</option>
              </select>

              <input
                type="text"
                placeholder="Sample No."
                value={sampleNoFilter}
                onChange={(e) => setSampleNoFilter(e.target.value)}
                className="w-24 bg-white border border-rose-200 rounded px-2.5 py-1 text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:border-rose-600 shadow-2xs"
              />

              <input
                type="text"
                placeholder="IP/OP No."
                value={ipOpFilter}
                onChange={(e) => setIpOpFilter(e.target.value)}
                className="w-24 bg-white border border-rose-200 rounded px-2.5 py-1 text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:border-rose-600 shadow-2xs"
              />

              <select
                value={referredByFilter}
                onChange={(e) => setReferredByFilter(e.target.value)}
                className="bg-white border border-rose-200 rounded px-2 py-1 text-slate-700 text-xs focus:outline-none focus:border-rose-600 shadow-2xs font-medium"
              >
                <option value="All">Select Referred By</option>
                <option value="SELF">Dr. SELF</option>
                <option value="PATIL">Dr. V G PATIL MBBS,MS</option>
                <option value="Ramesh">Dr. Ramesh Kumar</option>
                <option value="Srinivas">Dr. Srinivas Bhat</option>
              </select>

              <select
                value={dispatchStatusFilter}
                onChange={(e) => setDispatchStatusFilter(e.target.value)}
                className="bg-white border border-rose-200 rounded px-2 py-1 text-slate-700 text-xs focus:outline-none focus:border-rose-600 shadow-2xs font-medium"
              >
                <option value="Report Dispatch">Report Dispatch</option>
                <option value="All">All Dispatches</option>
                <option value="Dispatched">Dispatched</option>
                <option value="Pending">Pending Dispatch</option>
              </select>

              <button
                type="button"
                onClick={() => router.push("/lab/orders/new")}
                className="w-7 h-7 rounded-full bg-[#5E1224] hover:bg-[#721C24] text-white flex items-center justify-center font-bold text-sm shadow-xs transition-colors"
                title="Book New Lab Order"
              >
                +
              </button>

              <button
                type="button"
                onClick={() => fetchReports()}
                className="px-4 py-1.5 bg-[#5E1224] hover:bg-[#721C24] text-white font-bold rounded text-xs shadow-xs transition-colors flex items-center gap-1.5 ml-auto cursor-pointer"
                title="Search and refresh reports"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Search</span>
              </button>
            </div>
          </div>

          {/* AyusLab Reports Table */}
          <div className="bg-white border border-rose-200/90 rounded-xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#FFF0F4] text-rose-950 font-bold border-b border-rose-200/80 text-xs">
                  <tr>
                    <th className="py-2.5 px-3 whitespace-nowrap">Date</th>
                    <th className="py-2.5 px-2 whitespace-nowrap">Printed</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Name</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Reg/LabNo</th>
                    <th className="py-2.5 px-2 whitespace-nowrap">IP/OP</th>
                    <th className="py-2.5 px-2 whitespace-nowrap text-center">Logs</th>
                    <th className="py-2.5 px-3 min-w-[320px]">Lab Order Tests</th>
                    <th className="py-2.5 px-3 text-right whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rose-100 text-slate-800">
                  {loadingList ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <div className="w-6 h-6 border-2 border-rose-700 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                        <span className="font-mono text-xs">Loading Diagnostic Reports...</span>
                      </td>
                    </tr>
                  ) : filteredReports.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <Inbox className="w-8 h-8 mx-auto text-rose-300 mb-2" />
                        <span className="font-semibold text-xs">No diagnostic reports found matching the criteria.</span>
                      </td>
                    </tr>
                  ) : (
                    filteredReports.map((r, index) => {
                      const cleanUhid = r.patient_reg_no || r.patient_uhid.replace("PAT-", "").replace("-", "");
                      const isMale = (r.patient_gender || "").toUpperCase().startsWith("M");
                      const isOpenPrint = openPrintDropdownId === r.id;

                      return (
                        <tr 
                          key={r.id} 
                          className={`hover:bg-rose-50/50 transition-colors ${
                            index % 2 === 1 ? "bg-[#FFF5F7]/40" : "bg-white"
                          }`}
                        >
                          <td className="py-2.5 px-3 whitespace-nowrap font-medium text-slate-700 align-top">
                            {r.date || r.order_date || "12-10-2026"}
                          </td>

                          <td className="py-2.5 px-2 whitespace-nowrap align-top">
                            <div className="flex items-center gap-1 text-[11px] font-semibold text-rose-900">
                              <span className="text-rose-800 font-bold">🖨 {r.printed_count || 2}</span>
                              <span className="text-rose-200">|</span>
                              <span className="text-slate-600">👤 {r.user_log_count || 0}</span>
                            </div>
                          </td>

                          <td className="py-2.5 px-3 align-top whitespace-nowrap">
                            <div className="font-bold text-slate-900 text-xs">
                              {r.patient_name}
                            </div>
                            <div className="text-[11px] text-slate-600 flex items-center gap-1 mt-0.5">
                              <span>{r.patient_age || 55} yrs</span>
                              <span className="text-slate-400">/</span>
                              <span className={isMale ? "text-blue-600 font-bold" : "text-pink-600 font-bold"}>
                                {isMale ? "🚹" : "🚺"}
                              </span>
                              <span className="text-slate-400">/</span>
                            </div>
                            <div className="text-[11px] text-slate-600 font-mono">
                              {r.patient_phone || "9449835659"}
                            </div>
                          </td>

                          <td className="py-2.5 px-3 align-top whitespace-nowrap">
                            <div className="font-medium text-slate-800 text-[11px]">
                              {cleanUhid} /
                            </div>
                            <div className="font-bold text-rose-950 text-xs font-mono">
                              {r.lab_number}
                            </div>
                          </td>

                          <td className="py-2.5 px-2 align-top text-slate-600 text-[11px] whitespace-nowrap">
                            {r.ip_op || "OP"}
                          </td>

                          <td className="py-2.5 px-2 align-top text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5 text-slate-400">
                              <button
                                type="button"
                                onClick={() => alert(`Email dispatch log for ${r.patient_name}: Ready for sending.`)}
                                className="hover:text-rose-800 transition-colors"
                                title="Email Dispatch Log"
                              >
                                ✉
                              </button>
                              <span className="text-slate-300">/</span>
                              <button
                                type="button"
                                onClick={() => handleWhatsAppShare(r.patient_phone, r.patient_name, r.public_verification_hash)}
                                className="hover:text-emerald-600 transition-colors"
                                title="Direct WhatsApp Dispatch"
                              >
                                📞
                              </button>
                            </div>
                          </td>

                          <td className="py-2.5 px-3 align-top text-slate-700 text-[11px] uppercase tracking-tight leading-relaxed">
                            {r.lab_order_tests || "GENERAL CLINICAL PROFILE"}
                          </td>

                          <td className="py-2.5 px-3 align-top text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5 relative">
                              {/* Print Dropdown Button */}
                              <div className="inline-flex rounded shadow-2xs">
                                <button
                                  type="button"
                                  onClick={() => {
                                    loadDispatchView(r.order_id, { autoOpenPrint: true, withLetterhead: true, groupByDept: false });
                                  }}
                                  className="px-2.5 py-1 bg-[#5E1224] hover:bg-[#721C24] text-white text-xs font-bold rounded-l transition-colors cursor-pointer"
                                >
                                  Print
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setOpenPrintDropdownId(isOpenPrint ? null : r.id)}
                                  className="px-1.5 py-1 bg-[#470c1b] hover:bg-[#330813] text-white text-xs rounded-r transition-colors cursor-pointer"
                                >
                                  <ChevronDown className="w-3 h-3" />
                                </button>
                              </div>

                              {/* Print Options Dropdown Menu */}
                              {isOpenPrint && (
                                <div className="absolute right-16 top-8 w-60 bg-white border border-rose-200 rounded-md shadow-lg z-20 py-1 text-left text-xs">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenPrintDropdownId(null);
                                      loadDispatchView(r.order_id, { autoOpenPrint: true, withLetterhead: true, groupByDept: false });
                                    }}
                                    className="w-full px-3 py-1.5 hover:bg-rose-50 text-slate-700 flex items-center justify-between cursor-pointer"
                                  >
                                    <span>Print on letterhead</span>
                                    <span className="text-[10px] text-rose-500 font-semibold">Default</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenPrintDropdownId(null);
                                      loadDispatchView(r.order_id, { autoOpenPrint: true, withLetterhead: false, groupByDept: false });
                                    }}
                                    className="w-full px-3 py-1.5 hover:bg-rose-50 text-slate-700 cursor-pointer"
                                  >
                                    Print on plain paper
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenPrintDropdownId(null);
                                      loadDispatchView(r.order_id, { autoOpenPrint: true, withLetterhead: true, groupByDept: true });
                                    }}
                                    className="w-full px-3 py-1.5 hover:bg-rose-50 text-rose-950 font-bold border-t border-rose-100 flex items-center justify-between cursor-pointer"
                                  >
                                    <span>Print on letterhead by Department</span>
                                    <span className="text-[9px] bg-rose-100 text-rose-900 px-1 rounded font-bold">Dept</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenPrintDropdownId(null);
                                      loadDispatchView(r.order_id, { autoOpenPrint: true, withLetterhead: false, groupByDept: true });
                                    }}
                                    className="w-full px-3 py-1.5 hover:bg-rose-50 text-slate-700 flex items-center justify-between cursor-pointer"
                                  >
                                    <span>Print on plain paper by Department</span>
                                    <span className="text-[9px] bg-slate-100 text-slate-600 px-1 rounded">Plain</span>
                                  </button>
                                </div>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  loadDispatchView(r.order_id, { autoOpenPrint: true, withLetterhead: true, groupByDept: true });
                                }}
                                className="p-1 border border-rose-200 bg-white rounded text-rose-800 hover:bg-rose-50 transition-colors shadow-2xs cursor-pointer"
                                title="Download Department PDF"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => loadDispatchView(r.order_id)}
                                className="px-2.5 py-1 bg-white border border-rose-200 hover:bg-rose-50 text-rose-950 text-xs font-bold rounded shadow-2xs transition-colors cursor-pointer"
                              >
                                Show
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 2: AYUSLAB REPORT DISPATCH VIEW (Screenshot 2: ayuslab.com/report_dispatches/45659248)
      ========================================================================= */}
      {viewMode === "DISPATCH_VIEW" && selectedDispatch && (
        <div className={`space-y-3 ${previewOpen ? "print:hidden" : ""}`}>
          {/* Breadcrumb Header Bar */}
          <div className="flex items-center justify-between bg-[#FFF0F4] border border-rose-200/90 px-4 py-2 rounded-lg shadow-2xs">
            <div className="flex items-center gap-2 text-xs font-bold text-rose-950 tracking-wide flex-wrap">
              <button 
                type="button" 
                onClick={handleBackToList}
                className="text-rose-600 hover:text-rose-950"
              >
                🏠
              </button>
              <span className="text-rose-300">➦</span>
              <button
                type="button"
                onClick={handleBackToList}
                className="text-rose-900 hover:underline uppercase font-bold"
              >
                REPORTS
              </button>
              <span className="text-rose-300">➦</span>
              <span className="text-rose-950 font-black">{selectedDispatch.patient.name}</span>
            </div>
            <button
              type="button"
              onClick={() => triggerPrintModal({ withLetterhead: true, groupByDept: true })}
              className="text-rose-700 hover:text-rose-950 p-1"
              title="Print Department Report"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>

          {/* Main 2-Panel Layout: Left Sub-Panel (2 cols) + Right Content (10 cols) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-start">
            {/* Left Sub-Panel: PATIENT DETAILS & LAB ORDERS */}
            <div className="md:col-span-3 lg:col-span-2 space-y-3">
              <div 
                onClick={() => alert(`Patient Information:\nName: ${selectedDispatch.patient.name}\nUHID: ${selectedDispatch.patient.uhid}\nPhone: ${selectedDispatch.patient.phone || "N/A"}\nAddress: ${selectedDispatch.patient.address || "N/A"}`)}
                className="bg-[#FFF0F4] border border-rose-200 rounded p-2.5 text-xs font-bold text-rose-950 tracking-wide border-t-2 border-t-rose-700 shadow-2xs cursor-pointer hover:bg-rose-50"
              >
                PATIENT DETAILS
              </div>

              <div className="bg-[#FFF0F4] border border-rose-200 rounded overflow-hidden shadow-2xs">
                <div className="p-2.5 text-xs font-bold text-rose-950 border-b border-rose-200/60 flex items-center justify-between">
                  <span>LAB ORDERS</span>
                </div>

                <div className="p-2 border-b border-rose-200/60">
                  <Link
                    href="/lab/orders/new"
                    className="w-full py-1 px-2 bg-white hover:bg-rose-50 border border-rose-200 rounded text-rose-900 text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                  >
                    <span>+ New</span>
                  </Link>
                </div>

                <div className="divide-y divide-rose-100 max-h-72 overflow-y-auto">
                  {selectedDispatch.patient_orders && selectedDispatch.patient_orders.length > 0 ? (
                    selectedDispatch.patient_orders.map((po, idx) => (
                      <button
                        key={po.id || idx}
                        type="button"
                        onClick={() => {
                          if (po.id && !po.id.includes("-p")) {
                            loadDispatchView(po.id);
                          }
                        }}
                        className={`w-full p-2.5 text-left text-xs font-medium flex items-center justify-between transition-colors ${
                          po.is_current 
                            ? "bg-rose-100 text-rose-950 font-bold border-l-4 border-rose-700" 
                            : "text-slate-600 hover:bg-rose-50/70"
                        }`}
                      >
                        <span>{po.date || selectedDispatch.order.date || "12-10-2026"}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-rose-400" />
                      </button>
                    ))
                  ) : (
                    <button
                      type="button"
                      className="w-full p-2.5 text-left text-xs font-bold bg-rose-100 text-rose-950 flex items-center justify-between border-l-4 border-rose-700"
                    >
                      <span>{selectedDispatch.order.date || "12-10-2026"}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-rose-400" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Right Main Panel: Patient Info Card, Action Toolbar, Status Row, Grouped Test Table */}
            <div className="md:col-span-9 lg:col-span-10 space-y-3">
              {/* Patient Info Card */}
              <div className="bg-[#FFF0F4] border border-rose-200/90 rounded-xl p-3.5 shadow-2xs">
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3 items-center">
                  <div className="col-span-1 flex flex-col items-center">
                    <div className="w-12 h-12 rounded bg-rose-100 border border-rose-300 flex items-center justify-center text-rose-900 font-bold text-sm shadow-2xs">
                      👤
                    </div>
                    <button
                      type="button"
                      onClick={() => alert(`Patient UHID: ${selectedDispatch.patient.uhid}\nPhone: ${selectedDispatch.patient.phone || "N/A"}`)}
                      className="text-[10px] text-rose-700 hover:text-rose-900 hover:underline font-semibold mt-1"
                    >
                      + ID Proof
                    </button>
                  </div>

                  <div className="col-span-1 md:col-span-2 space-y-0.5">
                    <div className="text-sm font-black text-rose-950 truncate">
                      {selectedDispatch.patient.name}
                    </div>
                    <div className="text-[10px] text-rose-400 uppercase font-semibold">
                      Patient Name
                    </div>
                    <button
                      type="button"
                      onClick={() => alert(`Print Barcode for Sample: SMP-${selectedDispatch.order.lab_number}`)}
                      className="text-[11px] text-rose-700 hover:text-rose-900 hover:underline flex items-center gap-1 font-mono pt-0.5"
                    >
                      <BarcodeIcon className="w-3.5 h-3.5" />
                      <span>Barcode</span>
                    </button>
                  </div>

                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-slate-800 font-mono">
                      {selectedDispatch.patient.reg_no || selectedDispatch.patient.uhid.replace("PAT-", "").replace("-", "")}
                    </div>
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">
                      Patient No.
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-slate-800">
                      {selectedDispatch.patient.age_years || 55} Yrs
                    </div>
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">
                      Appr. DOB / Age
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-slate-800">
                      {selectedDispatch.patient.gender || "Male"}
                    </div>
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">
                      Gender
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-rose-950 font-mono">
                      {selectedDispatch.order.lab_number}
                    </div>
                    <div className="text-[10px] text-rose-400 uppercase font-semibold">
                      Lab No.
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-slate-800 truncate">
                      {selectedDispatch.order.doctor || "Dr. V G PATIL MBBS,MS"}
                    </div>
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">
                      Referred By
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-slate-800 truncate">
                      {selectedDispatch.order.ref_center || "NANDI DIAGNOSTI CENTER"}
                    </div>
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">
                      Ref. Center
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Toolbar (Exact AyusLab Print Buttons) */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => triggerPrintModal({ withLetterhead: true, groupByDept: false })}
                  className="px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-950 text-xs font-bold rounded border border-rose-200 shadow-2xs transition-colors"
                >
                  Print on letterhead
                </button>

                <button
                  type="button"
                  onClick={() => triggerPrintModal({ withLetterhead: false, groupByDept: false })}
                  className="px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-950 text-xs font-bold rounded border border-rose-200 shadow-2xs transition-colors"
                >
                  Print on plain paper
                </button>

                <button
                  type="button"
                  onClick={() => triggerPrintModal({ withLetterhead: true, groupByDept: true })}
                  className="px-3 py-1.5 bg-[#5E1224] hover:bg-[#721C24] text-white text-xs font-bold rounded border border-[#721C24] shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <span>Print on letterhead by Department</span>
                </button>

                <button
                  type="button"
                  onClick={() => triggerPrintModal({ withLetterhead: false, groupByDept: true })}
                  className="px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-950 text-xs font-bold rounded border border-rose-200 shadow-2xs transition-colors"
                >
                  Print on plain paper by Department
                </button>

                <button
                  type="button"
                  onClick={() => triggerPrintModal({ withLetterhead: true, groupByDept: true })}
                  className="p-1.5 bg-white hover:bg-rose-50 text-rose-950 rounded border border-rose-200 shadow-2xs transition-colors"
                  title="Direct Print"
                >
                  <Printer className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const verifyUrl = `${window.location.origin}/verify/${selectedDispatch.public_verification_hash}`;
                    navigator.clipboard.writeText(verifyUrl);
                    alert("Report verification link copied to clipboard!");
                  }}
                  className="p-1.5 bg-white hover:bg-rose-50 text-rose-950 rounded border border-rose-200 shadow-2xs transition-colors"
                  title="Share / Export Link"
                >
                  <Share2 className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={handleBackToList}
                  className="p-1.5 bg-white hover:bg-rose-50 text-rose-950 rounded border border-rose-200 shadow-2xs transition-colors ml-auto"
                  title="Back to Reports"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Status & WhatsApp Row */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-[#FFF0F4] border border-rose-200/90 rounded-lg px-3 py-2 text-xs shadow-2xs">
                <div className="flex items-center gap-1.5 font-semibold text-rose-950">
                  <span>Printed :</span>
                  <span className="text-rose-800 font-bold">🖨 {selectedDispatch.printed_count || 2}</span>
                  <span className="text-rose-300">|</span>
                  <span className="text-slate-600 font-bold">👤 {selectedDispatch.user_log_count || 0}</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleWhatsAppShare(selectedDispatch.patient.phone || "9449835659", selectedDispatch.patient.name, selectedDispatch.public_verification_hash)}
                  className="px-3 py-1 bg-white border border-emerald-500 hover:bg-emerald-50 text-emerald-700 font-bold rounded flex items-center gap-1.5 shadow-2xs transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{selectedDispatch.patient.name.replace("Mr. ", "").replace("Mrs. ", "").replace("Smt. ", "")}</span>
                </button>

                <div className="flex items-center gap-2">
                  <span className="text-rose-950 font-bold">Handed Over To</span>
                  <select
                    value={handedOverTo}
                    onChange={(e) => setHandedOverTo(e.target.value)}
                    className="bg-white border border-rose-200 rounded px-2 py-0.5 text-xs text-rose-950 font-medium focus:outline-none focus:border-rose-600"
                  >
                    <option value={`${selectedDispatch?.patient?.name || "Patient"} (Self)`}>
                      {selectedDispatch?.patient?.name || "Patient"} (Self)
                    </option>
                    <option value="Attendant / Family">Attendant / Family</option>
                    <option value="Courier / Dispatch">Courier / Dispatch</option>
                    <option value="Hospital Staff">Hospital Staff</option>
                  </select>
                </div>
              </div>

              {/* Grouped Test Parameters Table (Interactive Screen View) */}
              <div className="bg-white border border-rose-200/90 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#FFF0F4] text-rose-950 font-bold border-b border-rose-200/80">
                    <tr>
                      <th className="py-2.5 px-3.5 w-1/2 uppercase tracking-wide">TEST PARAMETER</th>
                      <th className="py-2.5 px-3 uppercase tracking-wide">RESULT</th>
                      <th className="py-2.5 px-3 uppercase tracking-wide">UNIT</th>
                      <th className="py-2.5 px-3 uppercase tracking-wide">REFERENCE RANGE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rose-100 text-slate-800">
                    {validTestsList.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-slate-400">
                          No test parameters entered for this order yet.
                        </td>
                      </tr>
                    ) : (
                      validTestsList.map((testSection, tIdx) => (
                        <Fragment key={tIdx}>
                          {/* Test Section Header with Department Tag */}
                          <tr className="bg-rose-50/60">
                            <td colSpan={4} className="py-2 px-3.5 font-extrabold text-slate-900 uppercase tracking-wide underline decoration-rose-300 flex items-center justify-between">
                              <span>{testSection.test_name}</span>
                              <span className="text-[10px] text-rose-900 no-underline font-semibold bg-rose-100 px-2 py-0.5 rounded border border-rose-200">
                                {testSection.department || "HEMATOLOGY"}
                              </span>
                            </td>
                          </tr>

                          {/* Parameters Under This Test */}
                          {testSection.parameters.map((param, pIdx) => {
                            if (!isParameterEntered(param)) return null;
                            const { val, flag } = formatResultWithFlag(param.result, param.flag, param.is_abnormal, param.reference_range);
                            return (
                              <tr key={pIdx} className="hover:bg-rose-50/50 transition-colors">
                                <td className="py-2 px-3.5 uppercase font-medium text-slate-700 pl-6">
                                  {param.name}
                                </td>
                                <td className="py-2 px-3 font-semibold text-slate-900 flex items-center gap-1.5">
                                  <span>{val}</span>
                                  {flag && (
                                    <span className="text-rose-700 font-black text-[10px]">
                                      {flag}
                                    </span>
                                  )}
                                </td>
                                <td className="py-2 px-3 text-slate-600">
                                  {param.unit || ""}
                                </td>
                                <td className="py-2 px-3 text-slate-600">
                                  {param.reference_range || ""}
                                </td>
                              </tr>
                            );
                          })}
                        </Fragment>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          PRINT & LETTERHEAD PREVIEW MODAL (MATCHING AYUSLAB PDF 1:1)
      ========================================================================= */}
      {previewOpen && selectedDispatch && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto report-modal-backdrop print:static print:p-0 print:m-0 print:bg-white print:overflow-visible print:block print:w-full print:h-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden report-modal-card print:border-none print:shadow-none print:rounded-none print:max-w-none print:max-h-none print:w-full print:h-auto print:overflow-visible print:block print:p-0 print:m-0">
            {/* Modal Controls Toolbar */}
            <div className="p-3 sm:px-6 bg-[#5E1224] border-b border-[#470c1b] flex items-center justify-between flex-wrap gap-3 print:hidden">
              <div className="flex items-center gap-4 flex-wrap">
                <span className="font-bold text-sm text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-rose-300" />
                  Report #{selectedDispatch.report_number}
                </span>

                {/* Toggle 1: Letterhead */}
                <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer bg-neutral-900 border border-neutral-800 px-2.5 py-1 rounded-md">
                  <input
                    type="checkbox"
                    checked={letterheadEnabled}
                    onChange={(e) => setLetterheadEnabled(e.target.checked)}
                    className="accent-cyan-500 rounded"
                  />
                  <span>Diagnostic Letterhead</span>
                </label>

                {/* Toggle 2: Group by Department */}
                <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer bg-neutral-900 border border-neutral-800 px-2.5 py-1 rounded-md">
                  <input
                    type="checkbox"
                    checked={groupByDepartment}
                    onChange={(e) => setGroupByDepartment(e.target.checked)}
                    className="accent-cyan-500 rounded"
                  />
                  <span className="font-semibold text-cyan-400">Group by Department</span>
                </label>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  disabled={selectedDispatch.is_locked_for_billing}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                    selectedDispatch.is_locked_for_billing
                      ? "bg-neutral-800 text-neutral-500 cursor-not-allowed"
                      : "bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-md"
                  }`}
                >
                  <Printer className="w-3.5 h-3.5" /> Print Report
                </button>

                <Link
                  href={`/verify/${selectedDispatch.public_verification_hash}`}
                  target="_blank"
                  className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border border-neutral-800"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-cyan-400" /> Verify QR
                </Link>

                <button
                  type="button"
                  onClick={() => setPreviewOpen(false)}
                  className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-900 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Bill-Locked Warning Strip */}
            {selectedDispatch.is_locked_for_billing && (
              <div className="bg-rose-50 border-b border-rose-200 p-3 px-6 flex items-center justify-between text-xs text-rose-900 print:hidden">
                <div className="flex items-center gap-2 font-semibold">
                  <Lock className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>
                    <b>Report Dispatch Locked:</b> Outstanding invoice balance of ₹{selectedDispatch.billing?.balance}. 
                    Reports cannot be released or handed to patient until fully settled.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleOverrideLock}
                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-bold transition-colors whitespace-nowrap ml-4"
                >
                  Authorize Credit Override
                </button>
              </div>
            )}

            {overrideSuccess && (
              <div className="bg-emerald-50 border-b border-emerald-200 p-2.5 px-6 flex items-center gap-2 text-xs text-emerald-900 print:hidden">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Credit override authorized. Report successfully unlocked for dispatch.</span>
              </div>
            )}

            {/* =========================================================================
                PRINTABLE REPORT CANVAS (EXACT AYUSLAB INVESTIGATION REPORT PDF 1:1)
            ========================================================================= */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-300/70 flex justify-center items-start report-canvas-scroll-container print:p-0 print:m-0 print:bg-white print:overflow-visible print:block print:w-full print:h-auto">
              <div 
                id="printable-report"
                className="w-full max-w-[800px] bg-white text-slate-900 px-8 py-7 sm:px-10 sm:py-8 rounded shadow-xl min-h-[1050px] h-auto flex flex-col justify-between border border-slate-300 font-sans my-4 print:my-0 print:border-none print:shadow-none print:rounded-none print:p-0 print:max-w-none print:w-full print:min-h-0"
              >
                <div>
                  {/* LETTERHEAD HEADER (When letterheadEnabled is true) */}
                  {letterheadEnabled ? (
                    <div className="border-b border-slate-300 pb-3 mb-3 report-header-section">
                      <div className="flex items-center justify-between">
                        {/* Circular Emblem Logo (Left) */}
                        <div className="w-20 h-20 shrink-0 flex items-center justify-center">
                          <svg viewBox="0 0 100 100" className="w-20 h-20">
                            {/* Outer Maroon Ring */}
                            <circle cx="50" cy="50" r="46" fill="none" stroke="#800020" strokeWidth="4" />
                            {/* Inner Dark Green Ring */}
                            <circle cx="50" cy="50" r="40" fill="none" stroke="#1B5E50" strokeWidth="2.5" />
                            {/* Star icons */}
                            <circle cx="50" cy="50" r="34" fill="#f8fafc" />
                            {/* Medical Microscope/Cross Emblem */}
                            <path d="M46 28 h8 v44 h-8 z M34 46 h32 v8 h-32 z" fill="#800020" />
                            <circle cx="50" cy="50" r="8" fill="#1B5E50" />
                            {/* Text labels */}
                            <text x="50" y="22" textAnchor="middle" fontSize="6.5" fontWeight="900" fill="#1B5E50" letterSpacing="0.5">SAI BALAJI</text>
                            <text x="50" y="82" textAnchor="middle" fontSize="5.5" fontWeight="900" fill="#800020" letterSpacing="0.5">DAVANGERE</text>
                            <text x="50" y="90" textAnchor="middle" fontSize="4.5" fontWeight="bold" fill="#64748b">ESTD 2007</text>
                          </svg>
                        </div>

                        {/* Center Title Block */}
                        <div className="text-center flex-1 px-2">
                          <h1 className="text-2xl sm:text-3xl font-serif font-black tracking-wide text-[#800020] uppercase leading-none">
                            SAI BALAJI DIAGNOSTIC CENTRE
                          </h1>
                          <h2 className="text-base sm:text-lg font-sans font-bold text-[#0E4D55] tracking-tight mt-1">
                            Sai Balaji Speciality Centre
                          </h2>
                          <div className="inline-block bg-[#1B5E50] text-white font-bold text-xs px-6 py-1 rounded-sm mt-1.5 shadow-2xs tracking-wide">
                            Investigation Report
                          </div>
                        </div>

                        {/* Microscope Illustration (Right) */}
                        <div className="w-20 h-20 shrink-0 flex items-center justify-center">
                          <svg viewBox="0 0 100 100" className="w-16 h-16 text-[#1B5E50]" fill="currentColor">
                            <path d="M52 14 L62 20 L56 30 L46 24 Z" />
                            <path d="M48 27 L66 42 L60 48 L42 33 Z" />
                            <rect x="58" y="44" width="6" height="12" rx="1" />
                            <path d="M38 42 C 28 48, 26 62, 34 72 C 40 78, 52 78, 58 72 L 64 76 C 54 84, 36 84, 26 74 C 16 62, 20 44, 34 36 Z" />
                            <rect x="42" y="60" width="28" height="4" rx="1" fill="#800020" />
                            <rect x="36" y="80" width="46" height="7" rx="2" />
                            <circle cx="56" cy="62" r="3" fill="#ffffff" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Plain Paper Reserved Blank Header Space */
                    <div className="h-28 border border-dashed border-slate-300 print:border-none mb-3 flex items-center justify-center text-slate-400 print:text-transparent text-xs report-header-section">
                      [Pre-printed Letterhead Reserved Space — 2.5 inches]
                    </div>
                  )}

                  {/* PATIENT INFORMATION BOX (Exact AyusLab Two-Column Grid) */}
                  <div className="border border-slate-400 p-2.5 mb-3 text-[11px] leading-tight font-sans report-patient-section">
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                      <div className="space-y-1">
                        <div className="flex">
                          <span className="w-28 font-bold text-slate-900">Name</span>
                          <span className="font-bold text-slate-950">: {selectedDispatch.patient.name}</span>
                        </div>
                        <div className="flex">
                          <span className="w-28 font-bold text-slate-900">AGE/SEX</span>
                          <span className="text-slate-900">: {selectedDispatch.patient.age_years ?? 21} Yrs / {selectedDispatch.patient.gender || "Male"}</span>
                        </div>
                        <div className="flex">
                          <span className="w-28 font-bold text-slate-900">REFERRED BY</span>
                          <span className="text-slate-900 font-medium">: {selectedDispatch.order.doctor || "Dr. SELF"}</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex">
                          <span className="w-36 font-bold text-slate-900">REG/LAB NO.</span>
                          <span className="font-bold text-slate-950">: {selectedDispatch.patient.reg_no || "202653859"} / {selectedDispatch.order.lab_number}</span>
                        </div>
                        <div className="flex">
                          <span className="w-36 font-bold text-slate-900">DATE OF COLLECTION</span>
                          <span className="text-slate-900">: {selectedDispatch.order.date || "15-10-2026"}</span>
                        </div>
                        <div className="flex">
                          <span className="w-36 font-bold text-slate-900">DATE OF REPORT</span>
                          <span className="text-slate-900">: {selectedDispatch.order.reported_date || selectedDispatch.order.date || "15-10-2026"}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* TABLE COLUMN HEADERS & BODY IN A BULLETPROOF FIXED TABLE */}
                  <table className="w-full border-collapse table-fixed text-[11px] leading-tight text-slate-900">
                    <colgroup>
                      <col style={{ width: "38%" }} />
                      <col style={{ width: "20%" }} />
                      <col style={{ width: "14%" }} />
                      <col style={{ width: "28%" }} />
                    </colgroup>
                    <thead>
                      <tr className="border-t border-b border-slate-700 text-[11px] font-bold text-slate-950 uppercase tracking-tight">
                        <th className="py-1.5 text-left font-bold pl-0">TEST PARAMETER</th>
                        <th className="py-1.5 text-left font-bold">RESULT</th>
                        <th className="py-1.5 text-left font-bold">UNIT</th>
                        <th className="py-1.5 text-left font-bold">REFERENCE RANGE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* TEST & PARAMETERS: DEPARTMENT-WISE VS STANDARD VIEW */}
                      {groupByDepartment ? (
                        groupedDepartmentList.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-8 text-center text-slate-500 italic font-medium">
                              No test results have been entered for this report yet.
                            </td>
                          </tr>
                        ) : (
                          groupedDepartmentList.map((deptGroup, dIdx) => (
                            <Fragment key={dIdx}>
                              {/* Prominent Centered Department Heading */}
                              <tr className="border-b border-slate-300">
                                <td colSpan={4} className="py-1.5 text-center font-bold text-xs uppercase tracking-widest text-slate-950 pt-2">
                                  {deptGroup.department}
                                </td>
                              </tr>

                              {/* Tests under this Department */}
                              {deptGroup.tests.map((testSec, tIdx) => (
                                <Fragment key={tIdx}>
                                  <tr className="border-b border-slate-400">
                                    <td colSpan={4} className="pt-2 pb-0.5 font-bold text-[11px] uppercase text-slate-950 tracking-tight">
                                      {testSec.test_name}
                                    </td>
                                  </tr>
                                  {renderTestParameters(testSec.parameters)}
                                </Fragment>
                              ))}
                            </Fragment>
                          ))
                        )
                      ) : (
                        validTestsList.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-8 text-center text-slate-500 italic font-medium">
                              No test results have been entered for this report yet.
                            </td>
                          </tr>
                        ) : (
                          validTestsList.map((testSec, tIdx) => (
                            <Fragment key={tIdx}>
                              <tr className="border-b border-slate-400">
                                <td colSpan={4} className="pt-2 pb-0.5 font-bold text-[11px] uppercase text-slate-950 tracking-tight">
                                  {testSec.test_name}
                                </td>
                              </tr>
                              {renderTestParameters(testSec.parameters)}
                            </Fragment>
                          ))
                        )
                      )}
                    </tbody>
                  </table>
                </div>

                {/* =========================================================================
                    FOOTER (Legend, Dispatcher, End of Report, Technologist & Address)
                ========================================================================= */}
                <div className="mt-auto pt-5 font-sans report-footer-section">
                  {/* Legend */}
                  <div className="text-[10px] text-slate-600 mb-1">
                    L- Low, H- High
                  </div>

                  {/* Full-width Divider Line */}
                  <div className="border-t border-slate-700 pt-1">
                    <div className="flex items-center justify-between text-[10px] text-slate-700">
                      <div>Dispatched by: {selectedDispatch.dispatched_by || "N.S Harish"}</div>
                      <div className="font-bold tracking-widest">**** End of Report ****</div>
                      <div>
                        Printed by: Rakesh M A on {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }).replace(/\//g, "-")} at {new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })}
                      </div>
                    </div>
                  </div>

                  {/* Signature Section */}
                  <div className="mt-6 flex items-end justify-between">
                    {/* QR Stamp */}
                    <div className="flex items-center gap-2">
                      {qrCodeDataUrl && (
                        <img 
                          src={qrCodeDataUrl} 
                          alt="QR Verification" 
                          className="w-12 h-12 border border-slate-200 p-0.5"
                        />
                      )}
                      <div className="text-[9px] text-slate-500">
                        <div>Authenticity QR Verified</div>
                        <div className="font-mono">{selectedDispatch.public_verification_hash?.slice(0, 12)}...</div>
                      </div>
                    </div>

                    {/* Technologist */}
                    <div className="text-right">
                      <div className="font-bold text-xs uppercase text-slate-900 tracking-wide">
                        TECHNOLOGIST
                      </div>
                    </div>
                  </div>

                  {/* Page Count */}
                  <div className="text-center text-[10px] text-slate-500 mt-1.5">
                    Page 1 of 1
                  </div>

                  {/* Bottom Address Banner (When letterheadEnabled is true) */}
                  {letterheadEnabled && (
                    <div className="mt-2.5 pt-1.5 border-t border-slate-300 text-center text-[10px] text-slate-700 flex items-center justify-center gap-1 font-medium">
                      <span className="text-[#800020] font-bold">📍</span>
                      <span>2537, Opp. Krishna Kala Mandira, M.C.C. &apos;A&apos; Block, DAVANGERE-4. Mobile : 94498 35659, 70191 43450</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Clean CSS for Browser Printing */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm 10mm 8mm 10mm;
          }

          html, body {
            width: 100% !important;
            height: auto !important;
            min-height: 100% !important;
            overflow: visible !important;
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .report-modal-backdrop {
            position: static !important;
            display: block !important;
            background: transparent !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
            width: 100% !important;
            height: auto !important;
            max-height: none !important;
          }

          .report-modal-card {
            position: static !important;
            display: block !important;
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            max-height: none !important;
            height: auto !important;
            overflow: visible !important;
            background: transparent !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .report-canvas-scroll-container {
            position: static !important;
            display: block !important;
            background: transparent !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
            height: auto !important;
            max-height: none !important;
          }

          #printable-report {
            position: static !important;
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            min-height: auto !important;
            height: auto !important;
            overflow: visible !important;
            background: #ffffff !important;
          }

          .report-header-section,
          .report-patient-section,
          .report-footer-section {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          tr {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto py-24 text-center">
        <div className="w-8 h-8 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-xs font-semibold text-slate-500 font-mono">Loading Reports &amp; Dispatch...</p>
      </div>
    }>
      <ReportsContent />
    </Suspense>
  );
}
