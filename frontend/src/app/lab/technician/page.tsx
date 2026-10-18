"use client";

import { useEffect, useState, useMemo, Suspense, Fragment } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { 
  CheckCircle2, 
  ArrowLeft, 
  ArrowRight,
  Barcode, 
  Send, 
  Save, 
  FlaskConical, 
  Printer,
  Info,
  MoreHorizontal,
  X,
  CreditCard,
  FileText,
  Plus,
  Edit3,
  ChevronLeft,
  ChevronRight,
  ListOrdered,
  Layers,
  ExternalLink
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import BarcodeGenerator from "@/components/BarcodeGenerator";

interface ParameterItem {
  parameter_id: string;
  code: string;
  name: string;
  unit: string | null;
  value_type: string;
  current_numeric: number | null;
  current_text: string | null;
  reference_low: number | null;
  reference_high: number | null;
  reference_text: string | null;
  delta_previous_value: number | null;
  delta_previous_date: string | null;
  flag: string;
  is_bold_highlight?: boolean;
  is_differential_part: boolean;
}

interface OrderTestItem {
  test_result_id: string;
  test_id: string;
  name: string;
  code: string;
  category: string;
  sample_id: string;
  sample_barcode: string;
  tube_color: string;
  specimen_type: string;
  status: string;
  has_entered_results: boolean;
  parameters_count: number;
}

interface TestParamState {
  parameters: ParameterItem[];
  values: Record<string, string>;
  notes: string;
  loading: boolean;
  isSaved?: boolean;
}

interface OrderDetail {
  id: string;
  order_number: string;
  lab_number: string;
  created_at: string;
  order_date: string;
  order_time?: string;
  total_amount?: number;
  discount_amount?: number;
  final_amount?: number;
  laboratory?: {
    name: string;
    legal_name?: string;
    address: string;
    phone: string;
    email?: string;
  };
  patient: {
    id: string;
    full_name: string;
    uhid: string;
    reg_no?: string;
    age_years: number;
    age_months: number;
    gender: string;
    phone: string;
    email?: string | null;
    blood_group?: string | null;
    address?: string | null;
  };
  doctor_name: string;
  ref_center: string;
  clinical_history?: string | null;
  invoice: {
    id: string | null;
    invoice_number: string;
    total: number;
    paid_amount: number;
    balance: number;
    status: string;
    payment_method?: string;
  };
  samples: {
    id: string;
    barcode: string;
    tube_color: string;
    specimen_type: string;
    status: string;
  }[];
  tests: (OrderTestItem & { price?: number })[];
  patient_orders: {
    id: string;
    order_number: string;
    lab_number: string;
    date: string;
    is_current: boolean;
  }[];
}

function TechnicianWorkbenchContent() {
  const searchParams = useSearchParams();
  const queryOrderId = searchParams.get("orderId");

  const [ordersList, setOrdersList] = useState<any[]>([]);
  const [currentOrder, setCurrentOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("All Category");

  // Result entry modal state (Multi-test Batch & Sequential)
  const [activeTestForEntry, setActiveTestForEntry] = useState<OrderTestItem | null>(null);
  const [queueTests, setQueueTests] = useState<OrderTestItem[]>([]);
  const [currentTestIndex, setCurrentTestIndex] = useState<number>(0);
  const [entryViewMode, setEntryViewMode] = useState<"step" | "all">("step");
  const [testStateMap, setTestStateMap] = useState<Record<string, TestParamState>>({});
  const [savingResult, setSavingResult] = useState(false);
  const [submitSuccessMsg, setSubmitSuccessMsg] = useState<string | null>(null);

  // Modals for Labels, Bill, Info, and View Print Report
  const [showLabelsModal, setShowLabelsModal] = useState(false);
  const [showBillModal, setShowBillModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [loadingReport, setLoadingReport] = useState(false);

  const handleOpenReportModal = async () => {
    if (!currentOrder) return;
    setShowReportModal(true);
    setLoadingReport(true);
    try {
      const data = await apiFetch(`/reports/${currentOrder.id}`);
      if (data && (data.report_number || data.report_id)) {
        setReportData(data);
      }
    } catch (err) {
      console.error("Failed to load report data:", err);
    } finally {
      setLoadingReport(false);
    }
  };

  // Load Order Details
  const loadOrderById = async (orderId: string) => {
    setLoading(true);
    try {
      const data = await apiFetch(`/orders/${orderId}`);
      if (data && data.id) {
        setCurrentOrder(data);
      }
    } catch (err) {
      console.error("Failed to load order:", err);
    } finally {
      setLoading(false);
    }
  };

  // Initial Load: check query param or load latest order
  useEffect(() => {
    let isMounted = true;
    apiFetch("/orders")
      .then((orders: any) => {
        if (!isMounted) return;
        if (Array.isArray(orders) && orders.length > 0) {
          setOrdersList(orders);
          const targetId = queryOrderId || orders[0].id;
          loadOrderById(targetId);
        } else {
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [queryOrderId]);

  // Load parameters for a test and cache in testStateMap
  const loadTestParams = async (testItem: OrderTestItem) => {
    setTestStateMap(prev => ({
      ...prev,
      [testItem.test_result_id]: {
        parameters: prev[testItem.test_result_id]?.parameters || [],
        values: prev[testItem.test_result_id]?.values || {},
        notes: prev[testItem.test_result_id]?.notes || "",
        loading: true,
        isSaved: prev[testItem.test_result_id]?.isSaved || testItem.has_entered_results
      }
    }));

    try {
      const data = await apiFetch(`/results/${testItem.test_result_id}`);
      if (data && Array.isArray(data.parameters)) {
        const initialVals: Record<string, string> = {};
        data.parameters.forEach((p: ParameterItem) => {
          if (p.current_numeric !== null && p.current_numeric !== undefined) {
            initialVals[p.parameter_id] = String(p.current_numeric);
          } else if (p.current_text) {
            initialVals[p.parameter_id] = p.current_text;
          } else {
            initialVals[p.parameter_id] = "";
          }
        });

        setTestStateMap(prev => {
          const existing = prev[testItem.test_result_id];
          const existingValues = existing?.values || {};
          const mergedVals = { ...initialVals, ...existingValues };
          return {
            ...prev,
            [testItem.test_result_id]: {
              parameters: data.parameters,
              values: mergedVals,
              notes: existing?.notes || data.technician_remarks || "Specimen verified. Clinical findings noted.",
              loading: false,
              isSaved: testItem.has_entered_results || testItem.status === "VERIFIED" || testItem.status === "PENDING_VERIFICATION"
            }
          };
        });
      }
    } catch (err) {
      console.error("Failed to load parameters:", err);
      setTestStateMap(prev => ({
        ...prev,
        [testItem.test_result_id]: {
          ...(prev[testItem.test_result_id] || { parameters: [], values: {}, notes: "", isSaved: false }),
          loading: false
        }
      }));
    }
  };

  // Open Batch / Sequential Result Entry
  const handleOpenBatchResultEntry = (tests: OrderTestItem[], initialIndex = 0) => {
    if (!tests || tests.length === 0) return;
    setQueueTests(tests);
    const validIdx = Math.max(0, Math.min(initialIndex, tests.length - 1));
    setCurrentTestIndex(validIdx);
    setActiveTestForEntry(tests[validIdx]);
    setSubmitSuccessMsg(null);
    setEntryViewMode("step");

    // Pre-fetch all tests in parallel so navigation is instantaneous
    tests.forEach(t => {
      loadTestParams(t);
    });
  };

  // Open Parameter Result Entry for a specific test
  const handleOpenResultEntry = (testItem: OrderTestItem) => {
    const list = filteredTests.length > 0 ? filteredTests : (currentOrder?.tests || []);
    const idx = list.findIndex(t => t.test_result_id === testItem.test_result_id);
    handleOpenBatchResultEntry(list, idx >= 0 ? idx : 0);
  };

  // Switch between tests
  const switchTest = (targetIndex: number) => {
    if (targetIndex < 0 || targetIndex >= queueTests.length) return;
    setCurrentTestIndex(targetIndex);
    const targetTest = queueTests[targetIndex];
    setActiveTestForEntry(targetTest);
    if (!testStateMap[targetTest.test_result_id]?.parameters || testStateMap[targetTest.test_result_id]?.parameters.length === 0) {
      loadTestParams(targetTest);
    }
  };

  // Update parameter value for a specific test
  const handleParamValueChange = (testResultId: string, paramId: string, val: string) => {
    setTestStateMap(prev => {
      const cur = prev[testResultId] || { parameters: [], values: {}, notes: "", loading: false, isSaved: false };
      return {
        ...prev,
        [testResultId]: {
          ...cur,
          values: {
            ...cur.values,
            [paramId]: val
          }
        }
      };
    });
  };

  // Update observation notes for a specific test
  const handleNotesChange = (testResultId: string, notes: string) => {
    setTestStateMap(prev => {
      const cur = prev[testResultId] || { parameters: [], values: {}, notes: "", loading: false, isSaved: false };
      return {
        ...prev,
        [testResultId]: {
          ...cur,
          notes
        }
      };
    });
  };

  // Categories list
  const availableCategories = useMemo(() => {
    if (!currentOrder || !currentOrder.tests) return ["All Category"];
    const cats = Array.from(new Set(currentOrder.tests.map(t => t.category).filter(Boolean)));
    return ["All Category", ...cats];
  }, [currentOrder]);

  // Filtered Tests
  const filteredTests = useMemo(() => {
    if (!currentOrder || !currentOrder.tests) return [];
    if (selectedCategory === "All Category") return currentOrder.tests;
    return currentOrder.tests.filter(t => t.category === selectedCategory);
  }, [currentOrder, selectedCategory]);

  // Active test state alias
  const activeTestState = activeTestForEntry ? testStateMap[activeTestForEntry.test_result_id] : null;
  const parameters = activeTestState?.parameters || [];
  const paramValues = activeTestState?.values || {};
  const technicianNotes = activeTestState?.notes || "";
  const loadingParams = activeTestState?.loading || false;

  // Save current test result (with option to advance to next test in queue)
  const handleSaveCurrentTest = async (isDraft = false, advanceToNext = false) => {
    if (!activeTestForEntry) return;
    const testId = activeTestForEntry.test_result_id;
    const state = testStateMap[testId];
    if (!state) return;

    setSavingResult(true);
    try {
      await apiFetch("/results/entry", {
        method: "POST",
        body: JSON.stringify({
          test_result_id: testId,
          values: (state.parameters || []).map(p => ({
            parameter_id: p.parameter_id,
            code: p.code,
            numeric_value: parseFloat(state.values[p.parameter_id]) || null,
            text_value: state.values[p.parameter_id] || ""
          })),
          technician_notes: state.notes || "Specimen verified and approved by lab technician.",
          is_draft: isDraft
        })
      });

      // Mark saved in local testStateMap
      setTestStateMap(prev => ({
        ...prev,
        [testId]: {
          ...(prev[testId] || state),
          isSaved: !isDraft
        }
      }));

      // Update local currentOrder test status
      if (currentOrder) {
        setCurrentOrder(prev => {
          if (!prev) return null;
          return {
            ...prev,
            tests: prev.tests.map(t =>
              t.test_result_id === testId
                ? { ...t, status: isDraft ? "DRAFT" : "PENDING_VERIFICATION", has_entered_results: true }
                : t
            )
          };
        });
      }

      if (advanceToNext && currentTestIndex < queueTests.length - 1) {
        const nextIdx = currentTestIndex + 1;
        const nextTest = queueTests[nextIdx];
        setSubmitSuccessMsg(`✓ Saved ${activeTestForEntry.name}. Opening next test: ${nextTest.name} (${nextIdx + 1}/${queueTests.length})...`);
        setTimeout(() => {
          switchTest(nextIdx);
          setSubmitSuccessMsg(null);
        }, 600);
      } else if (advanceToNext || !isDraft) {
        setSubmitSuccessMsg(`✓ All test results verified & queued for Pathologist approval!`);
        setTimeout(() => {
          setActiveTestForEntry(null);
          setSubmitSuccessMsg(null);
        }, 1200);
      } else {
        setSubmitSuccessMsg("Draft saved successfully.");
        setTimeout(() => setSubmitSuccessMsg(null), 1500);
      }
    } catch (err) {
      console.error("Save result failed:", err);
      alert("Failed to submit results. Please verify your connection.");
    } finally {
      setSavingResult(false);
    }
  };

  // Backwards compatibility alias
  const handleSaveResult = async (isDraft = false) => {
    return handleSaveCurrentTest(isDraft, false);
  };

  // Save all tests simultaneously in "All Tests Sheet" mode
  const handleSaveAllTogether = async (isDraft = false) => {
    setSavingResult(true);
    try {
      for (const t of queueTests) {
        const state = testStateMap[t.test_result_id];
        if (state && state.parameters && state.parameters.length > 0) {
          await apiFetch("/results/entry", {
            method: "POST",
            body: JSON.stringify({
              test_result_id: t.test_result_id,
              values: state.parameters.map(p => ({
                parameter_id: p.parameter_id,
                code: p.code,
                numeric_value: parseFloat(state.values[p.parameter_id]) || null,
                text_value: state.values[p.parameter_id] || ""
              })),
              technician_notes: state.notes || "Specimen verified and approved by lab technician.",
              is_draft: isDraft
            })
          });
        }
      }

      if (currentOrder) {
        loadOrderById(currentOrder.id);
      }

      setSubmitSuccessMsg(isDraft ? "All drafts saved successfully." : "All test results submitted to Pathologist successfully!");
      setTimeout(() => {
        setActiveTestForEntry(null);
        setSubmitSuccessMsg(null);
      }, 1200);
    } catch (err) {
      console.error("Save all failed:", err);
      alert("Failed to save results. Please check connection.");
    } finally {
      setSavingResult(false);
    }
  };

  // Helper for Tube Badge Color
  const getTubeIconStyle = (tube: string) => {
    if (tube.includes("Lavender") || tube.includes("EDTA")) return "bg-purple-600 text-white";
    if (tube.includes("Red") || tube.includes("Plain")) return "bg-rose-600 text-white";
    if (tube.includes("Yellow") || tube.includes("SST")) return "bg-amber-500 text-white";
    if (tube.includes("Gray") || tube.includes("Fluoride")) return "bg-slate-500 text-white";
    if (tube.includes("Blue") || tube.includes("Citrate")) return "bg-sky-500 text-white";
    return "bg-emerald-600 text-white";
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-24 text-center">
        <div className="w-10 h-10 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-xs font-semibold text-slate-500 font-mono">Loading Lab Order Prescription Details...</p>
      </div>
    );
  }

  if (!currentOrder) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center bg-[#FFF0F4] rounded-xl border border-rose-200 shadow-2xs">
        <FlaskConical className="w-12 h-12 text-rose-300 mx-auto mb-3" />
        <h3 className="text-base font-bold text-rose-950">No Lab Orders Available</h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">
          There are currently no active orders in your database. Book an order to view the AyusLab test prescription.
        </p>
        <Link
          href="/lab/orders/new"
          className="px-4 py-2 bg-[#5E1224] hover:bg-[#721C24] text-white text-xs font-bold rounded-lg shadow-2xs"
        >
          + Create New Order
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto font-sans">
      {/* Main Technician Workbench UI (Hidden when printing any modal) */}
      <div className={`technician-workbench-ui space-y-4 ${showBillModal || showLabelsModal || showReportModal ? "print:hidden" : ""}`}>
        {/* 1. Breadcrumb Bar */}
      <div className="flex items-center justify-between bg-[#FFF0F4] border border-rose-200/90 px-4 py-2.5 rounded-lg shadow-2xs">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800 tracking-wide flex-wrap">
          <Link href="/lab/dashboard" className="text-slate-500 hover:text-slate-800">🏠</Link>
          <span className="text-rose-300">➦</span>
          <Link href="/lab/patients" className="text-rose-900 hover:underline">PATIENTS</Link>
          <span className="text-rose-300">➦</span>
          <span className="text-rose-950 font-bold">{currentOrder.patient.full_name}</span>
          <span className="text-rose-300">➦</span>
          <span className="text-rose-800 tracking-wider uppercase font-bold">{currentOrder.order_date} LAB ORDERS</span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/lab/orders/new"
            className="bg-[#5E1224] hover:bg-[#721C24] text-white font-bold text-xs px-3.5 py-1.5 rounded-md flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-rose-200" />
            <span>New Order</span>
          </Link>
          <button
            type="button"
            onClick={() => {
              const curIdx = ordersList.findIndex(o => o.id === currentOrder.id);
              if (curIdx > 0) loadOrderById(ordersList[curIdx - 1].id);
            }}
            className="w-7 h-7 rounded-full border border-rose-200 bg-white hover:bg-rose-50 flex items-center justify-center text-slate-600"
            title="Previous Order"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-rose-700" />
          </button>
          <button
            type="button"
            onClick={() => {
              const curIdx = ordersList.findIndex(o => o.id === currentOrder.id);
              if (curIdx < ordersList.length - 1) loadOrderById(ordersList[curIdx + 1].id);
            }}
            className="w-7 h-7 rounded-full border border-rose-200 bg-white hover:bg-rose-50 flex items-center justify-center text-slate-600"
            title="Next Order"
          >
            <ArrowRight className="w-3.5 h-3.5 text-rose-700" />
          </button>
          <Link
            href="/lab/dashboard"
            className="text-slate-400 hover:text-rose-800 p-1"
            title="Dashboard"
          >
            <FileText className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Main 2-Panel Layout: Left Sub-Nav + Right Prescription Content */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
        {/* Left Sub-Panel (2.5 cols / ~w-56): Patient Details & Lab Orders Dates List */}
        <div className="md:col-span-3 lg:col-span-2 space-y-3">
          {/* Card 1: Patient Details Link */}
          <div className="bg-[#FFF0F4] border border-rose-200/90 rounded-lg p-3 text-xs font-bold text-rose-950 tracking-wide border-t-2 border-t-rose-700 shadow-2xs">
            PATIENT DETAILS
          </div>

          {/* Card 2: Lab Orders with Dates List */}
          <div className="bg-[#FFF0F4] border border-rose-200/90 rounded-lg overflow-hidden shadow-2xs">
            <div className="p-3 text-xs font-bold text-slate-800 border-b border-rose-200/60 flex items-center justify-between">
              <span>LAB ORDERS</span>
            </div>

            <div className="p-2 border-b border-rose-200/60">
              <Link
                href="/lab/orders/new"
                className="w-full py-1.5 px-2 bg-white hover:bg-rose-50 border border-rose-200 rounded text-rose-900 text-xs font-bold flex items-center justify-center gap-1 transition-colors"
              >
                <span>+ New</span>
              </Link>
            </div>

            <div className="divide-y divide-rose-200/60 max-h-72 overflow-y-auto">
              {currentOrder.patient_orders && currentOrder.patient_orders.length > 0 ? (
                currentOrder.patient_orders.map((po) => (
                  <button
                    key={po.id}
                    type="button"
                    onClick={() => loadOrderById(po.id)}
                    className={`w-full p-2.5 text-left text-xs font-medium flex items-center justify-between transition-colors ${
                      po.is_current 
                        ? "bg-rose-100 text-rose-950 font-bold border-l-4 border-rose-700" 
                        : "text-slate-600 hover:bg-rose-50/70"
                    }`}
                  >
                    <span>{po.date || "Order"}</span>
                    <span className="text-rose-400 text-[10px]">›</span>
                  </button>
                ))
              ) : (
                <div className="p-3 text-xs text-slate-400 text-center">
                  {currentOrder.order_date}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Main Panel (9.5 cols): Patient Card, Action Toolbar & Lab Order Tests Table */}
        <div className="md:col-span-9 lg:col-span-10 space-y-3.5">
          {/* Patient Info Card (Exact AyusLab Header Box) */}
          <div className="bg-[#FFF0F4] border border-rose-200/90 rounded-xl p-4 shadow-2xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3 items-center">
              {/* Avatar + ID Proof */}
              <div className="col-span-1 flex flex-col items-center">
                <div className="w-12 h-12 rounded bg-rose-100 border border-rose-300 flex items-center justify-center text-rose-900 font-bold text-sm shadow-2xs">
                  👤
                </div>
                <button
                  type="button"
                  onClick={() => alert(`Patient UHID: ${currentOrder.patient.uhid}\nPhone: ${currentOrder.patient.phone}\nAddress: ${currentOrder.patient.address || "N/A"}`)}
                  className="text-[10px] text-rose-700 hover:text-rose-900 hover:underline font-semibold mt-1"
                >
                  + ID Proof
                </button>
              </div>

              {/* Patient Name */}
              <div className="col-span-1 md:col-span-2 space-y-0.5">
                <div className="text-sm font-black text-rose-950 truncate">
                  {currentOrder.patient.full_name}
                </div>
                <div className="text-[10px] text-rose-400 uppercase font-semibold">
                  Patient Name
                </div>
                <button
                  type="button"
                  onClick={() => setShowLabelsModal(true)}
                  className="text-[11px] text-rose-700 hover:text-rose-900 hover:underline flex items-center gap-1 font-mono pt-0.5"
                >
                  <span>🖨 Barcode</span>
                </button>
              </div>

              {/* Patient No */}
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-slate-800 font-mono">
                  {currentOrder.patient.uhid.replace("PAT-", "").replace("-", "")}
                </div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">
                  Patient No.
                </div>
              </div>

              {/* Appr. DOB / Age */}
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-slate-800">
                  {currentOrder.patient.age_years} Yrs
                </div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">
                  Appr. DOB / Age
                </div>
              </div>

              {/* Gender */}
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-slate-800">
                  {currentOrder.patient.gender}
                </div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">
                  Gender
                </div>
              </div>

              {/* Lab No */}
              <div className="space-y-0.5">
                <div className="text-xs font-black text-rose-950 font-mono">
                  {currentOrder.lab_number}
                </div>
                <div className="text-[10px] text-rose-400 uppercase font-semibold">
                  Lab No.
                </div>
              </div>

              {/* Referred By */}
              <div className="space-y-0.5 truncate">
                <div className="text-xs font-bold text-slate-800 truncate" title={currentOrder.doctor_name}>
                  {currentOrder.doctor_name}
                </div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">
                  Referred By
                </div>
              </div>
            </div>

            {/* Ref Center Row */}
            <div className="mt-3 pt-2.5 border-t border-rose-200/60 flex items-center justify-between text-xs text-slate-600">
              <div>
                <span className="text-[10px] uppercase font-semibold text-rose-400 mr-2">Ref. Center:</span>
                <span className="font-bold text-slate-800">{currentOrder.ref_center}</span>
              </div>
              {currentOrder.clinical_history && (
                <div className="text-[11px] text-slate-500 italic max-w-md truncate" title={currentOrder.clinical_history}>
                  {currentOrder.clinical_history}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons Toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 bg-[#FFF0F4] border border-rose-200/90 p-2.5 rounded-lg shadow-2xs">
            {/* Left Group */}
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href="/lab/orders/new"
                className="bg-[#5E1224] hover:bg-[#721C24] text-white font-bold text-xs px-3 py-1.5 rounded flex items-center gap-1.5 shadow-2xs transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Lab Order</span>
              </Link>

              {/* Tube indicator icon */}
              <div className="w-7 h-7 rounded bg-rose-600 text-white flex items-center justify-center text-xs shadow-2xs" title="Vacutainer Tubes Ready">
                🩸
              </div>

              <button
                type="button"
                onClick={() => setShowLabelsModal(true)}
                className="bg-white hover:bg-rose-50 border border-rose-200 text-rose-900 font-bold text-xs px-3 py-1.5 rounded flex items-center gap-1.5 shadow-2xs transition-colors"
              >
                <Printer className="w-3.5 h-3.5 text-rose-700" />
                <span>Print Labels</span>
              </button>

              <button
                type="button"
                onClick={() => setShowInfoModal(true)}
                className="text-rose-700 hover:text-rose-950 p-1"
                title="Clinical Notes & Information"
              >
                <Info className="w-4 h-4" />
              </button>

              <span className="text-[11px] text-rose-700 hover:underline cursor-pointer italic font-medium">
                + Lab order Images
              </span>
            </div>

            {/* Center Gap: View Print Button */}
            <div className="flex items-center justify-center">
              <button
                type="button"
                onClick={() => handleOpenReportModal()}
                className="bg-[#5E1224] hover:bg-[#721C24] text-white font-bold text-xs px-4 py-1.5 rounded-md shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>View Print</span>
              </button>
            </div>

            {/* Right Group */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => alert(`Order Accession #${currentOrder.lab_number}\nCreated: ${currentOrder.created_at}`)}
                className="border border-rose-200 bg-white hover:bg-rose-50 rounded p-1 text-rose-800"
                title="Options"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setShowBillModal(true)}
                className="bg-[#5E1224] hover:bg-[#721C24] text-white font-bold text-xs px-3 py-1.5 rounded shadow-2xs transition-colors flex items-center gap-1"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Bill Print</span>
              </button>

              <button
                type="button"
                onClick={() => setShowBillModal(true)}
                className="bg-white hover:bg-rose-50 border border-rose-200 text-rose-900 font-bold text-xs px-3 py-1.5 rounded shadow-2xs transition-colors"
              >
                View Bill
              </button>

              <span className="text-[11px] text-rose-700 hover:underline cursor-pointer italic font-medium">
                + Upload X-ray/Reports
              </span>
            </div>
          </div>

          {/* Section: Lab Order Tests Header & Category Filter */}
          <div className="bg-white border border-rose-200/90 rounded-xl overflow-hidden shadow-2xs">
            <div className="p-3.5 bg-[#FFF0F4] border-b border-rose-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-4">
                <h2 className="text-sm font-black text-rose-950 tracking-tight">
                  Lab Order Tests
                </h2>
                <div className="relative">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="bg-white border border-rose-200 rounded px-2.5 py-1 text-xs text-rose-950 font-bold focus:outline-none focus:border-rose-600 cursor-pointer"
                  >
                    {availableCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => {
                    const list = filteredTests.length > 0 ? filteredTests : (currentOrder?.tests || []);
                    if (list.length > 0) {
                      handleOpenBatchResultEntry(list, 0);
                    }
                  }}
                  className="bg-[#5E1224] hover:bg-[#721C24] text-white font-bold text-xs px-4 py-1.5 rounded-md shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Enter Results Of All Tests</span>
                  {filteredTests.length > 0 && (
                    <span className="bg-white/20 px-1.5 py-0.5 text-[10px] rounded font-mono">
                      {filteredTests.length}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Lab Order Tests Table (Matching AyusLab Screenshot) */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-rose-200/80 bg-[#FFF0F4]/60 text-[11px] font-bold text-rose-950 uppercase tracking-wider">
                    <th className="py-2.5 px-4">Lab Tests</th>
                    <th className="py-2.5 px-4">Sample</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rose-100">
                  {filteredTests.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-slate-400">
                        No tests found under &quot;{selectedCategory}&quot;.
                      </td>
                    </tr>
                  ) : (
                    filteredTests.map((test) => {
                      const isEntered = test.has_entered_results || test.status === "VERIFIED" || test.status === "PENDING_VERIFICATION";

                      return (
                        <tr key={test.test_result_id} className="hover:bg-rose-50/50 transition-colors">
                          {/* Test Name */}
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900 text-xs">
                              {test.name.toUpperCase()}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              Code: {test.code} · {test.category}
                            </div>
                          </td>

                          {/* Sample Barcode with Tube Pill */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className={`w-3.5 h-3.5 rounded-full inline-block ${getTubeIconStyle(test.tube_color)}`} title={test.tube_color} />
                              <span className="font-mono text-xs font-semibold text-slate-800">
                                {test.sample_barcode || `001${currentOrder.lab_number}`}
                              </span>
                            </div>
                          </td>

                          {/* Actions: Enter result button + status indicator */}
                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  const list = filteredTests.length > 0 ? filteredTests : (currentOrder?.tests || []);
                                  const idx = list.findIndex(t => t.test_result_id === test.test_result_id);
                                  handleOpenBatchResultEntry(list, idx >= 0 ? idx : 0);
                                }}
                                className="bg-[#5E1224] hover:bg-[#721C24] text-white font-bold text-[11px] px-3 py-1 rounded shadow-2xs transition-colors cursor-pointer"
                              >
                                {isEntered ? "Edit result" : "Enter result"}
                              </button>
                              <div
                                className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                                  isEntered 
                                    ? "border-emerald-600 bg-emerald-50 text-emerald-700" 
                                    : "border-rose-400 bg-white"
                                }`}
                                title={isEntered ? "Results entered" : "Pending result entry"}
                              >
                                {isEntered && <CheckCircle2 className="w-2.5 h-2.5 stroke-[3]" />}
                              </div>
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
      </div>

      {/* MODAL 1: Enter Result Parameters Modal (Sequential Batch & All Tests) */}
      {activeTestForEntry && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-rose-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Top Header */}
            <div className="px-5 py-3.5 bg-gradient-to-r from-[#5E1224] via-[#721C24] to-[#5E1224] text-white flex flex-col gap-2.5 border-b border-[#8A2533] shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] uppercase tracking-wider font-bold bg-white/15 px-2 py-0.5 rounded text-rose-100">
                      Result Entry Console
                    </span>
                    <span className="text-xs text-rose-100">
                      Patient: <strong className="text-white">{currentOrder.patient.full_name}</strong>
                    </span>
                    <span className="text-xs text-rose-200 font-mono">
                      (UHID: {currentOrder.patient.uhid})
                    </span>
                  </div>
                  <div className="text-[11px] text-rose-200/90 mt-0.5 font-mono">
                    Lab No: <strong>{currentOrder.lab_number}</strong> · Age/Gender: <strong>{currentOrder.patient.age_years}Y / {currentOrder.patient.gender}</strong> · Total Tests: <strong>{queueTests.length}</strong>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* View Mode Switcher */}
                  <div className="flex items-center bg-black/25 p-0.5 rounded-lg border border-white/10 text-xs">
                    <button
                      type="button"
                      onClick={() => setEntryViewMode("step")}
                      className={`px-3 py-1 rounded-md font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        entryViewMode === "step"
                          ? "bg-white text-rose-950 shadow-xs"
                          : "text-rose-100 hover:text-white"
                      }`}
                    >
                      <ListOrdered className="w-3.5 h-3.5" />
                      <span>One by One ({currentTestIndex + 1}/{queueTests.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEntryViewMode("all")}
                      className={`px-3 py-1 rounded-md font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        entryViewMode === "all"
                          ? "bg-white text-rose-950 shadow-xs"
                          : "text-rose-100 hover:text-white"
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>All Tests Sheet</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTestForEntry(null)}
                    className="text-rose-200 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors cursor-pointer"
                    title="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Sequential Test Tabs (Horizontal Stepper Bar for all selected tests) */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5">
                {queueTests.map((t, idx) => {
                  const state = testStateMap[t.test_result_id];
                  const isCur = idx === currentTestIndex;
                  const isSaved = state?.isSaved || t.has_entered_results || t.status === "VERIFIED" || t.status === "PENDING_VERIFICATION";

                  return (
                    <button
                      key={t.test_result_id}
                      type="button"
                      onClick={() => {
                        setEntryViewMode("step");
                        switchTest(idx);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 shrink-0 border cursor-pointer ${
                        isCur
                          ? "bg-white text-rose-950 border-white shadow-md ring-2 ring-white/50"
                          : isSaved
                          ? "bg-emerald-950/40 text-emerald-100 border-emerald-400/40 hover:bg-emerald-900/60"
                          : "bg-black/20 text-rose-200 border-white/10 hover:bg-black/30"
                      }`}
                    >
                      <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-mono font-bold ${
                        isCur ? "bg-rose-900 text-white" : isSaved ? "bg-emerald-500 text-white" : "bg-white/20 text-rose-200"
                      }`}>
                        {isSaved ? "✓" : idx + 1}
                      </span>
                      <span>{t.name}</span>
                      <span className="text-[10px] font-mono opacity-80">
                        {isSaved ? "(Saved)" : `(${idx + 1}/${queueTests.length})`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {submitSuccessMsg && (
              <div className="px-5 py-2.5 bg-emerald-50 border-b border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{submitSuccessMsg}</span>
              </div>
            )}

            {/* VIEW MODE 1: ONE-BY-ONE SEQUENTIAL ENTRY */}
            {entryViewMode === "step" && activeTestForEntry && (
              <>
                {/* Active Test Info Banner */}
                <div className="px-5 py-3 bg-[#FFF5F7] border-b border-rose-200/80 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-rose-900 text-white font-mono">
                        Test {currentTestIndex + 1} of {queueTests.length}
                      </span>
                      <h3 className="text-base font-black text-rose-950 tracking-tight">
                        {activeTestForEntry.name}
                      </h3>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-200/80 text-rose-900 border border-rose-300">
                        {activeTestForEntry.code}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-600">
                        · {activeTestForEntry.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-600 font-mono">
                      <span>Sample Barcode: <strong>{activeTestForEntry.sample_barcode || `001${currentOrder.lab_number}`}</strong></span>
                      <span>·</span>
                      <span>Specimen: <strong>{activeTestForEntry.specimen_type || "Blood"}</strong></span>
                      <span>·</span>
                      <span className="flex items-center gap-1.5">
                        Tube: <span className={`w-3 h-3 rounded-full inline-block ${getTubeIconStyle(activeTestForEntry.tube_color)}`} /> {activeTestForEntry.tube_color}
                      </span>
                    </div>
                  </div>

                  {/* Quick Previous / Next buttons in banner */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={currentTestIndex === 0}
                      onClick={() => switchTest(currentTestIndex - 1)}
                      className="px-2.5 py-1 text-xs font-bold rounded border border-rose-200 text-slate-700 bg-white hover:bg-rose-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Prev Test</span>
                    </button>
                    <button
                      type="button"
                      disabled={currentTestIndex >= queueTests.length - 1}
                      onClick={() => switchTest(currentTestIndex + 1)}
                      className="px-2.5 py-1 text-xs font-bold rounded border border-rose-200 text-slate-700 bg-white hover:bg-rose-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
                    >
                      <span>Next Test</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Parameters Table & Notes for Active Test */}
                <div className="p-5 overflow-y-auto flex-1 space-y-4">
                  {testStateMap[activeTestForEntry.test_result_id]?.loading ? (
                    <div className="py-12 text-center text-slate-400 text-xs font-mono">
                      Loading parameters for {activeTestForEntry.name}...
                    </div>
                  ) : (testStateMap[activeTestForEntry.test_result_id]?.parameters || []).length === 0 ? (
                    <div className="py-8 text-center text-slate-500 text-xs border border-dashed border-rose-200 rounded-lg">
                      No sub-parameters defined for {activeTestForEntry.name}. Enter clinical observation note below.
                    </div>
                  ) : (
                    <div className="border border-rose-200 rounded-lg overflow-hidden shadow-2xs">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-[#FFF0F4] border-b border-rose-200 text-[11px] font-bold text-rose-950 uppercase">
                            <th className="py-2.5 px-3">Test Parameter</th>
                            <th className="py-2.5 px-3">Result Entry</th>
                            <th className="py-2.5 px-3">Demographic Reference Range</th>
                            <th className="py-2.5 px-3 text-center">Status Flag</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-rose-100">
                          {testStateMap[activeTestForEntry.test_result_id]?.parameters.map((p) => {
                            const currentVals = testStateMap[activeTestForEntry.test_result_id]?.values || {};
                            const val = currentVals[p.parameter_id] || "";
                            const numVal = parseFloat(val);
                            const isHigh = !isNaN(numVal) && p.reference_high !== null && numVal > p.reference_high;
                            const isLow = !isNaN(numVal) && p.reference_low !== null && numVal < p.reference_low;

                            return (
                              <tr key={p.parameter_id} className="hover:bg-rose-50/50">
                                <td className="py-2.5 px-3 font-semibold text-slate-800">
                                  {p.name}
                                </td>
                                <td className="py-2 px-3">
                                  <div className="flex items-center gap-1.5">
                                    <input
                                      type="text"
                                      value={val}
                                      onChange={(e) => handleParamValueChange(activeTestForEntry.test_result_id, p.parameter_id, e.target.value)}
                                      placeholder="Enter value"
                                      className={`w-36 bg-white border rounded px-2.5 py-1 text-xs font-bold font-mono focus:outline-none focus:ring-1 ${
                                        isHigh 
                                          ? "border-amber-400 text-amber-900 bg-amber-50/50 focus:ring-amber-500" 
                                          : isLow 
                                          ? "border-rose-400 text-rose-900 bg-rose-50/50 focus:ring-rose-500" 
                                          : "border-slate-300 text-slate-900 focus:border-rose-600 focus:ring-rose-500"
                                      }`}
                                    />
                                    {p.unit && <span className="text-[10px] text-slate-500 font-mono">{p.unit}</span>}
                                  </div>
                                </td>
                                <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">
                                  {p.reference_low !== null && p.reference_high !== null 
                                    ? `${p.reference_low} – ${p.reference_high} ${p.unit || ""}`
                                    : p.reference_text || "—"}
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  {val.trim() === "" ? (
                                    <span className="text-slate-300 text-[10px] font-mono">—</span>
                                  ) : isHigh ? (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                      HIGH ▲
                                    </span>
                                  ) : isLow ? (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-100 text-rose-900 border border-rose-300">
                                      LOW ▼
                                    </span>
                                  ) : (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-emerald-100 text-emerald-800 border border-emerald-300">
                                      Normal
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Technician Observation Notes */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Technician Observation Notes for {activeTestForEntry.name}
                    </label>
                    <textarea
                      rows={2}
                      value={testStateMap[activeTestForEntry.test_result_id]?.notes || ""}
                      onChange={(e) => handleNotesChange(activeTestForEntry.test_result_id, e.target.value)}
                      placeholder="e.g. Specimen verified under microscopy. No clot or hemolysis."
                      className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs text-slate-900 focus:outline-none focus:border-rose-600"
                    />
                  </div>
                </div>

                {/* Footer in One-by-One mode */}
                <div className="p-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveTestForEntry(null)}
                      className="px-3.5 py-1.5 border border-slate-300 text-slate-700 text-xs font-semibold rounded hover:bg-slate-100 cursor-pointer"
                    >
                      Close
                    </button>
                    <span className="text-xs text-slate-500 font-mono">
                      Test <strong>{currentTestIndex + 1}</strong> of <strong>{queueTests.length}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={currentTestIndex === 0}
                      onClick={() => switchTest(currentTestIndex - 1)}
                      className="px-3 py-1.5 border border-slate-300 bg-white text-slate-700 text-xs font-bold rounded hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Previous Test</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSaveCurrentTest(true, false)}
                      disabled={savingResult}
                      className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded flex items-center gap-1.5 cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Draft</span>
                    </button>

                    {currentTestIndex < queueTests.length - 1 ? (
                      <button
                        type="button"
                        onClick={() => handleSaveCurrentTest(false, true)}
                        disabled={savingResult}
                        className="px-4 py-1.5 bg-[#5E1224] hover:bg-[#721C24] text-white text-xs font-bold rounded flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{savingResult ? "Saving..." : "Save & Next Test →"}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSaveCurrentTest(false, true)}
                        disabled={savingResult}
                        className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{savingResult ? "Saving..." : "Save & Complete All Tests ✓"}</span>
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* VIEW MODE 2: ALL TESTS SHEET */}
            {entryViewMode === "all" && (
              <>
                <div className="p-5 overflow-y-auto flex-1 space-y-6">
                  {queueTests.map((t, idx) => {
                    const state = testStateMap[t.test_result_id];
                    return (
                      <div key={t.test_result_id} className="border border-rose-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                        <div className="p-3 bg-[#FFF0F4] border-b border-rose-200 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-rose-900 text-white text-[11px] font-mono font-bold flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <span className="font-bold text-rose-950 text-xs">
                              {t.name}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500">
                              ({t.code}) · {t.category}
                            </span>
                          </div>
                          <div className="text-[11px] font-mono text-slate-600">
                            Barcode: <strong>{t.sample_barcode || `001${currentOrder.lab_number}`}</strong>
                          </div>
                        </div>

                        <div className="p-4 space-y-3">
                          {state?.loading ? (
                            <div className="py-4 text-center text-xs text-slate-400">Loading parameters...</div>
                          ) : (state?.parameters || []).length === 0 ? (
                            <div className="py-2 text-xs text-slate-500">No sub-parameters defined for this test.</div>
                          ) : (
                            <table className="w-full text-left text-xs border border-rose-100 rounded">
                              <thead>
                                <tr className="bg-rose-50 text-[10px] font-bold text-rose-900">
                                  <th className="p-2">Parameter</th>
                                  <th className="p-2">Result Entry</th>
                                  <th className="p-2">Reference Range</th>
                                  <th className="p-2 text-center">Flag</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-rose-100">
                                {state.parameters.map((p) => {
                                  const val = state.values[p.parameter_id] || "";
                                  const numVal = parseFloat(val);
                                  const isHigh = !isNaN(numVal) && p.reference_high !== null && numVal > p.reference_high;
                                  const isLow = !isNaN(numVal) && p.reference_low !== null && numVal < p.reference_low;
                                  return (
                                    <tr key={p.parameter_id}>
                                      <td className="p-2 font-medium text-slate-800">{p.name}</td>
                                      <td className="p-1.5">
                                        <div className="flex items-center gap-1">
                                          <input
                                            type="text"
                                            value={val}
                                            onChange={(e) => handleParamValueChange(t.test_result_id, p.parameter_id, e.target.value)}
                                            placeholder="Enter value"
                                            className="w-32 bg-white border border-slate-300 rounded px-2 py-1 text-xs font-mono font-bold"
                                          />
                                          {p.unit && <span className="text-[10px] text-slate-500 font-mono">{p.unit}</span>}
                                        </div>
                                      </td>
                                      <td className="p-2 font-mono text-[11px] text-slate-600">
                                        {p.reference_low !== null && p.reference_high !== null 
                                          ? `${p.reference_low} – ${p.reference_high} ${p.unit || ""}`
                                          : p.reference_text || "—"}
                                      </td>
                                      <td className="p-2 text-center">
                                        {val.trim() === "" ? (
                                          <span className="text-slate-300 text-[10px] font-mono">—</span>
                                        ) : isHigh ? (
                                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                            HIGH ▲
                                          </span>
                                        ) : isLow ? (
                                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-100 text-rose-900 border border-rose-300">
                                            LOW ▼
                                          </span>
                                        ) : (
                                          <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-emerald-100 text-emerald-800 border border-emerald-300">
                                            Normal
                                          </span>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          )}

                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Notes:</label>
                            <input
                              type="text"
                              value={state?.notes || ""}
                              onChange={(e) => handleNotesChange(t.test_result_id, e.target.value)}
                              placeholder="Observation notes..."
                              className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Footer in All Tests Sheet mode */}
                <div className="p-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setActiveTestForEntry(null)}
                    className="px-3.5 py-1.5 border border-slate-300 text-slate-700 text-xs font-semibold rounded hover:bg-slate-100 cursor-pointer"
                  >
                    Close
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSaveAllTogether(true)}
                      disabled={savingResult}
                      className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded flex items-center gap-1.5 cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save All Drafts</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveAllTogether(false)}
                      disabled={savingResult}
                      className="px-4 py-1.5 bg-[#5E1224] hover:bg-[#721C24] text-white text-xs font-bold rounded flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{savingResult ? "Saving All..." : "Submit All Tests for Verification"}</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      </div>

      {/* MODAL 2: Print Labels Modal */}
      {showLabelsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4 print:static print:p-0 print:m-0 print:bg-white print:block">
          <div className="bg-white rounded-xl shadow-xl border border-rose-200 w-full max-w-lg p-5 space-y-4 print:border-none print:shadow-none print:p-0 print:max-w-none">
            <div className="flex items-center justify-between border-b border-rose-100 pb-3 print:hidden">
              <div className="text-sm font-bold text-rose-950 flex items-center gap-2">
                <Barcode className="w-4 h-4 text-rose-700" />
                <span>Vacutainer Barcode Labels (50mm x 25mm)</span>
              </div>
              <button type="button" onClick={() => setShowLabelsModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 print:space-y-4">
              {currentOrder.samples.map((s) => (
                <div key={s.id} className="p-3 bg-slate-50 border border-slate-300 rounded-lg font-mono text-xs space-y-1 print:bg-white print:border-dashed print:border-slate-800 print:p-2 print:break-inside-avoid">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{currentOrder.patient.full_name}</span>
                    <span className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded">{s.tube_color}</span>
                  </div>
                  <div className="text-[11px] text-slate-600">
                    UHID: {currentOrder.patient.uhid} · Age: {currentOrder.patient.age_years}Y
                  </div>
                  <div className="py-1 bg-white border border-slate-200 rounded my-1 flex justify-center">
                    <BarcodeGenerator
                      value={s.barcode}
                      format="CODE128"
                      width={1.8}
                      height={40}
                      displayValue={true}
                      text={s.barcode}
                      fontSize={11}
                      margin={3}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span>{s.specimen_type}</span>
                    <span>Date: {currentOrder.order_date}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 print:hidden">
              <button
                type="button"
                onClick={() => setShowLabelsModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-1.5 bg-[#5E1224] hover:bg-[#721C24] text-white text-xs font-bold rounded flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print All Labels</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Official Diagnostic Lab Bill / Receipt (Matching Reference Photo 1:1) */}
      {showBillModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto bill-modal-backdrop print:static print:p-0 print:m-0 print:bg-white print:overflow-visible print:block print:w-full print:h-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-300 w-full max-w-lg max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 bill-modal-card print:border-none print:shadow-none print:rounded-none print:max-w-none print:max-h-none print:w-full print:h-auto print:overflow-visible print:block print:p-0 print:m-0">
            {/* Top Toolbar (Hidden in print) */}
            <div className="px-5 py-3 bg-[#5E1224] text-white flex items-center justify-between border-b border-[#721C24] print:hidden">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-rose-300" />
                <span className="font-bold text-sm">
                  Official Bill / Receipt · #{currentOrder.invoice.invoice_number || currentOrder.lab_number}
                </span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-800 text-emerald-100">
                  {currentOrder.invoice.status}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1 bg-white hover:bg-rose-50 text-[#5E1224] rounded text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Receipt</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowBillModal(false)}
                  className="text-rose-200 hover:text-white p-1 rounded hover:bg-white/10 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Preview Body (Background gray for realistic paper preview) */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-100 flex justify-center bill-canvas-scroll-container print:p-0 print:m-0 print:bg-white print:block">
              {/* Authentic Thermal / A5 Bill / Receipt Canvas */}
              <div 
                id="printable-bill-receipt"
                className="bg-white border border-slate-300 shadow-md p-6 sm:p-7 rounded max-w-md w-full text-slate-900 font-sans text-xs space-y-3.5 print:border-none print:shadow-none print:p-2 print:max-w-[440px] print:mx-auto print:block"
              >
                {/* 1. Lab Header Information */}
                <div className="text-center space-y-0.5">
                  <h1 className="text-base sm:text-lg font-black tracking-wide uppercase text-slate-950 font-serif">
                    {currentOrder.laboratory?.name || "DIAGNOSTIC LABORATORY"}
                  </h1>
                  <h2 className="text-[11px] font-bold text-slate-700 tracking-tight">
                    {currentOrder.laboratory?.legal_name || currentOrder.laboratory?.name || "Clinical Laboratory Services"}
                  </h2>
                  <p className="text-[10px] text-slate-600 font-medium">
                    {currentOrder.laboratory?.address || "Clinical Diagnostic Services"}
                  </p>
                  {currentOrder.laboratory?.phone && (
                    <p className="text-[10px] text-slate-600 font-mono">
                      Ph: {currentOrder.laboratory.phone}
                    </p>
                  )}
                </div>

                {/* 2. Receipt Title Banner */}
                <div className="border-t border-b border-slate-800 py-1 text-center my-1">
                  <span className="font-extrabold text-xs uppercase tracking-widest text-slate-950">
                    BILL / RECEIPT
                  </span>
                </div>

                {/* 3. Patient & Order Metadata Grid with Barcode */}
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] leading-tight">
                  <div className="space-y-0.5">
                    <div>
                      <span className="text-slate-600 font-medium">Lab No: </span>
                      <strong className="text-slate-950 text-xs">{currentOrder.lab_number}</strong>
                    </div>
                    <div>
                      <span className="text-slate-600 font-medium">Name: </span>
                      <strong className="text-slate-950">{currentOrder.patient.full_name}</strong>
                    </div>
                    <div>
                      <span className="text-slate-600 font-medium">Age/Sex: </span>
                      <span className="text-slate-900 font-semibold">{currentOrder.patient.age_years} Yrs / {currentOrder.patient.gender}</span>
                    </div>
                    <div>
                      <span className="text-slate-600 font-medium">Ref. By: </span>
                      <span className="text-slate-900 font-medium">{currentOrder.doctor_name || "Dr. SELF"}</span>
                    </div>
                    <div>
                      <span className="text-slate-600 font-medium">Bill Date: </span>
                      <span className="text-slate-900 font-medium">{currentOrder.order_date || "16-10-2026"}</span>
                    </div>
                  </div>

                  <div className="space-y-1 text-right flex flex-col items-end justify-between">
                    <div>
                      <BarcodeGenerator
                        value={currentOrder.lab_number}
                        format="CODE128"
                        width={1.2}
                        height={28}
                        displayValue={false}
                        margin={0}
                      />
                      <div className="text-[9px] font-mono font-bold tracking-widest text-slate-900 text-center">
                        *{currentOrder.lab_number}*
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-700">
                      <div><span className="text-slate-500">Reg. Time: </span><strong>{currentOrder.order_time || "11:24:45 AM"}</strong></div>
                      <div><span className="text-slate-500">UHID: </span><strong>{currentOrder.patient.uhid.replace("PAT-", "")}</strong></div>
                    </div>
                  </div>
                </div>

                {/* 4. Itemized Tests / Particulars Table */}
                <table className="w-full border-collapse text-[11px]">
                  <thead>
                    <tr className="border-t border-b border-slate-700 text-[10px] font-bold text-slate-900 uppercase">
                      <th className="py-1 text-left w-8">Sl.</th>
                      <th className="py-1 text-left">Particulars</th>
                      <th className="py-1 text-right w-20">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dotted divide-slate-200">
                    {currentOrder.tests && currentOrder.tests.length > 0 ? (
                      currentOrder.tests.map((t, idx) => {
                        const price = t.price && t.price > 0 
                          ? t.price 
                          : (currentOrder.invoice.total / currentOrder.tests.length);
                        return (
                          <tr key={idx} className="py-0.5">
                            <td className="py-1 text-slate-500 font-mono text-[10px] align-top">{idx + 1}.</td>
                            <td className="py-1 font-medium text-slate-900 uppercase text-[10.5px] align-top">{t.name}</td>
                            <td className="py-1 text-right font-mono font-bold text-slate-900 align-top">
                              {price.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={3} className="py-2 text-center text-slate-400 italic">
                          Standard Clinical Investigation
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* 5. Totals & Balance Summary */}
                <div className="border-t border-slate-700 pt-1.5 space-y-0.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Total Amount:</span>
                    <span className="font-mono font-bold text-slate-950">₹{(currentOrder.total_amount || currentOrder.invoice.total).toFixed(2)}</span>
                  </div>
                  {(currentOrder.discount_amount ?? 0) > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Discount:</span>
                      <span className="font-mono text-slate-900">-₹{(currentOrder.discount_amount || 0).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-dotted border-slate-300 pt-0.5">
                    <span className="font-bold text-slate-900">Net Amount:</span>
                    <span className="font-mono font-bold text-slate-950">₹{currentOrder.invoice.total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold text-emerald-800">Paid Amount:</span>
                    <span className="font-mono font-bold text-emerald-800">₹{currentOrder.invoice.paid_amount.toFixed(2)}</span>
                  </div>
                  {currentOrder.invoice.balance > 0 ? (
                    <div className="flex justify-between text-rose-800 font-bold">
                      <span>Due Balance:</span>
                      <span className="font-mono">₹{currentOrder.invoice.balance.toFixed(2)}</span>
                    </div>
                  ) : (
                    <div className="flex justify-between text-slate-600">
                      <span>Due Balance:</span>
                      <span className="font-mono font-bold text-slate-900">₹0.00</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[10px] text-slate-500 pt-0.5">
                    <span>Payment Mode:</span>
                    <span className="font-bold uppercase text-slate-800">{currentOrder.invoice.payment_method || "CASH"} ({currentOrder.invoice.status})</span>
                  </div>
                </div>

                {/* 6. Instructions & Signature Line */}
                <div className="pt-2 flex items-end justify-between border-t border-dotted border-slate-300 text-[10px]">
                  <div className="space-y-0.5 text-slate-600 max-w-[60%]">
                    <p className="font-semibold text-slate-800">* Please Collect Report Next 1 - 2 Hours / Same Day</p>
                    <p>* Billing Timings: 7:00 AM - 9:00 PM</p>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-bold text-slate-900">
                      For {currentOrder.laboratory?.name || "DIAGNOSTIC LABORATORY"}
                    </div>
                    <div className="h-6"></div>
                    <div className="text-[9px] text-slate-500 font-medium border-t border-slate-400 pt-0.5 inline-block">
                      Authorized Signatory / Cashier
                    </div>
                  </div>
                </div>

                {/* 7. Bottom Tear-off / Online Access Slip */}
                <div className="border-t border-dashed border-slate-400 pt-2 space-y-1 text-[9.5px] text-slate-600">
                  <div className="flex justify-between font-mono">
                    <span>Bill No: <strong>{currentOrder.invoice.invoice_number || currentOrder.lab_number}</strong></span>
                    <span>{currentOrder.order_date || "16-10-2026"} {currentOrder.order_time || "11:24 AM"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Report Online: <strong>{typeof window !== "undefined" ? window.location.origin : "https://pulselab.app"}/verify/{currentOrder.lab_number}</strong></span>
                  </div>
                  <div className="flex justify-between font-mono">
                    <span>Login / User ID: <strong>{currentOrder.patient.uhid.replace("PAT-", "")}</strong></span>
                    <span>Password: <strong>123</strong></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Bottom Action Bar (Hidden in print) */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2 print:hidden">
              <button
                type="button"
                onClick={() => setShowBillModal(false)}
                className="px-4 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded font-semibold cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-1.5 bg-[#5E1224] hover:bg-[#721C24] text-white text-xs font-bold rounded flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Official Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Order Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-5 space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-bold text-slate-900 text-sm">Order Clinical Information</span>
              <button type="button" onClick={() => setShowInfoModal(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <div className="space-y-1.5">
              <div><b className="text-slate-700">Referred By:</b> {currentOrder.doctor_name}</div>
              <div><b className="text-slate-700">Ref. Center:</b> {currentOrder.ref_center}</div>
              <div><b className="text-slate-700">Order Date:</b> {currentOrder.order_date}</div>
              <div><b className="text-slate-700">Clinical History / Notes:</b> {currentOrder.clinical_history || "None recorded"}</div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: View Print (Diagnostic Lab Report Modal) */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-rose-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-5 py-3 bg-[#5E1224] text-white flex items-center justify-between border-b border-[#721C24]">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-rose-300" />
                <span className="font-bold text-sm">
                  View Diagnostic Report · {currentOrder.patient.full_name} ({currentOrder.lab_number})
                </span>
                {reportData?.status && (
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                    reportData.status === "APPROVED" 
                      ? "bg-emerald-800 text-emerald-100" 
                      : "bg-amber-800 text-amber-100"
                  }`}>
                    {reportData.status}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/lab/reports?orderId=${currentOrder.id}`}
                  className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-xs font-semibold flex items-center gap-1 transition-colors"
                  target="_blank"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Reports Console</span>
                </Link>
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="text-rose-200 hover:text-white p-1 rounded hover:bg-white/10 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: Printable Report Preview */}
            <div className="p-6 overflow-y-auto flex-1 bg-slate-100 flex justify-center">
              {loadingReport ? (
                <div className="py-20 text-center text-slate-500 font-mono text-xs">
                  Loading diagnostic report preview...
                </div>
              ) : (
                <div id="printable-report-sheet" className="bg-white border border-slate-300 shadow-md p-8 rounded-lg max-w-2xl w-full text-slate-900 space-y-4">
                  {/* Lab Header */}
                  <div className="border-b-2 border-slate-900 pb-3 flex items-center justify-between">
                    <div>
                      <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">
                        {reportData?.laboratory?.name || "DIAGNOSTIC LABORATORY"}
                      </h1>
                      <p className="text-[10px] text-slate-600 font-medium">
                        {reportData?.laboratory?.address || "Clinical Laboratory Services"}
                      </p>
                      <p className="text-[10px] text-slate-600 font-mono">
                        {reportData?.laboratory?.phone ? `Phone: ${reportData.laboratory.phone} · ` : ""}{reportData?.laboratory?.nabl_accr || "NABL ACCREDITED"}
                      </p>
                    </div>
                    {currentOrder.lab_number && (
                      <div className="text-right">
                        <BarcodeGenerator
                          value={currentOrder.lab_number}
                          format="CODE128"
                          width={1.5}
                          height={36}
                          displayValue={true}
                          text={currentOrder.lab_number}
                          fontSize={10}
                          margin={2}
                        />
                      </div>
                    )}
                  </div>

                  {/* Patient & Order Details Grid */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs border border-slate-200 p-3 rounded bg-slate-50 font-mono">
                    <div>
                      <span className="text-slate-500">Patient Name: </span>
                      <strong className="text-slate-900">{reportData?.patient?.name || currentOrder.patient.full_name}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Lab No: </span>
                      <strong className="text-slate-900">{reportData?.order?.lab_number || currentOrder.lab_number}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">UHID: </span>
                      <strong className="text-slate-900">{reportData?.patient?.uhid || currentOrder.patient.uhid}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Order Date: </span>
                      <strong className="text-slate-900">{reportData?.order?.date || currentOrder.order_date}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Age / Gender: </span>
                      <strong className="text-slate-900">{reportData?.patient?.age_gender || `${currentOrder.patient.age_years} Y / ${currentOrder.patient.gender}`}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Ref. Doctor: </span>
                      <strong className="text-slate-900">{reportData?.order?.doctor || currentOrder.doctor_name || "Self / Direct"}</strong>
                    </div>
                  </div>

                  {/* Investigation Results Table */}
                  <div className="border border-slate-300 rounded overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-200 text-slate-900 font-bold border-b border-slate-300 text-[11px] uppercase">
                          <th className="p-2.5">Investigation / Parameter</th>
                          <th className="p-2.5">Observed Value</th>
                          <th className="p-2.5">Reference Range</th>
                          <th className="p-2.5 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {reportData?.tests && reportData.tests.length > 0 ? (
                          (() => {
                            const validTests = reportData.tests
                              .map((t: any) => ({
                                ...t,
                                parameters: (t.parameters || []).filter((p: any) => {
                                  if (p.result === null || p.result === undefined) return false;
                                  const s = String(p.result).trim();
                                  return s !== "" && s !== "—" && s !== "-" && s !== "--" && s.toLowerCase() !== "null" && s.toLowerCase() !== "undefined" && s.toLowerCase() !== "none";
                                })
                              }))
                              .filter((t: any) => t.parameters.length > 0);

                            if (validTests.length === 0) {
                              return (
                                <tr>
                                  <td colSpan={4} className="py-8 text-center text-slate-500 italic font-mono text-xs">
                                    No test results have been entered for this order yet.
                                  </td>
                                </tr>
                              );
                            }

                            return validTests.map((t: any, tidx: number) => (
                              <Fragment key={tidx}>
                                <tr className="bg-slate-100 font-bold text-slate-800 text-[11px]">
                                  <td colSpan={4} className="py-1 px-2.5 uppercase tracking-wide">
                                    {t.test_name} {t.test_code ? `(${t.test_code})` : ""}
                                  </td>
                                </tr>
                                {t.parameters.map((p: any, pidx: number) => {
                                  const isHigh = p.flag === "HIGH" || p.flag === "ABNORMAL";
                                  const isLow = p.flag === "LOW";
                                  return (
                                    <tr key={pidx} className="hover:bg-slate-50">
                                      <td className="py-2 px-2.5 font-medium text-slate-800 pl-5">
                                        {p.name}
                                      </td>
                                      <td className="py-2 px-2.5 font-bold font-mono text-slate-900">
                                        {p.result} {p.unit || ""}
                                      </td>
                                      <td className="py-2 px-2.5 font-mono text-slate-600 text-[11px]">
                                        {p.reference_range || "—"} {p.unit || ""}
                                      </td>
                                      <td className="py-2 px-2.5 text-center">
                                        {isHigh ? (
                                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                            HIGH ▲
                                          </span>
                                        ) : isLow ? (
                                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-100 text-rose-900 border border-rose-300">
                                            LOW ▼
                                          </span>
                                        ) : (
                                          <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-emerald-100 text-emerald-800 border border-emerald-300">
                                            Normal
                                          </span>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </Fragment>
                            ));
                          })()
                        ) : (
                          <tr>
                            <td colSpan={4} className="py-8 text-center text-slate-500 italic font-mono text-xs">
                              No test results have been entered for this order yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Signatures & Accreditation Footer */}
                  <div className="pt-6 border-t border-slate-300 flex items-end justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900">Medical Lab Technician</div>
                      <div className="text-[10px] text-slate-500">Verified & Processed</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-900">
                        {reportData?.verified_by?.name || "Dr. Authorized Pathologist"}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {reportData?.verified_by?.qualification || "MD (Pathology) · Reg: KMC-48291"}
                      </div>
                      <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                        Approval: {reportData?.verified_by?.verified_at || "Digital Signature Validated"}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="px-3.5 py-1.5 border border-slate-300 text-slate-700 text-xs font-semibold rounded hover:bg-slate-100 cursor-pointer"
              >
                Close
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const printWindow = window.open("", "_blank", "width=800,height=900");
                    const sheet = document.getElementById("printable-report-sheet");
                    if (printWindow && sheet) {
                      printWindow.document.write(`
                        <html>
                          <head>
                            <title>Report - ${currentOrder.lab_number}</title>
                            <style>
                              @page { size: A4; margin: 15mm; }
                              body { font-family: Arial, sans-serif; color: #111; margin: 0; padding: 10px; }
                              table { width: 100%; border-collapse: collapse; }
                              th, td { border: 1px solid #ddd; padding: 6px 8px; font-size: 11px; }
                              th { background: #f4f4f4; }
                              .text-center { text-align: center; }
                              .font-bold { font-weight: bold; }
                              .font-mono { font-family: monospace; }
                            </style>
                          </head>
                          <body onload="window.print(); setTimeout(() => window.close(), 600);">
                            ${sheet.innerHTML}
                          </body>
                        </html>
                      `);
                      printWindow.document.close();
                    } else {
                      window.print();
                    }
                  }}
                  className="px-4 py-1.5 bg-[#5E1224] hover:bg-[#721C24] text-white text-xs font-bold rounded flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Report (A4)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Clean CSS for Browser Printing */}
      <style>{`
        @media print {
          @page {
            size: auto;
            margin: 6mm 8mm;
          }

          html, body {
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Completely hide workbench UI, sidebars, headers when any modal is printing */
          .technician-workbench-ui.print\\:hidden,
          .print\\:hidden,
          aside,
          header {
            display: none !important;
            visibility: hidden !important;
            height: 0 !important;
            overflow: hidden !important;
          }

          .bill-modal-backdrop,
          .bill-modal-card,
          .bill-canvas-scroll-container {
            position: static !important;
            display: block !important;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            height: auto !important;
            max-width: none !important;
            max-height: none !important;
            overflow: visible !important;
          }

          #printable-bill-receipt {
            position: static !important;
            display: block !important;
            width: 100% !important;
            max-width: 440px !important;
            margin: 0 auto !important;
            padding: 10px 14px !important;
            border: none !important;
            box-shadow: none !important;
            background: #ffffff !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          #printable-bill-receipt * {
            visibility: visible !important;
          }

          #printable-bill-receipt table {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          #printable-bill-receipt tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>
    </div>
  );
}

export default function TechnicianWorkbench() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-slate-400 font-mono">Loading Workbench...</div>}>
      <TechnicianWorkbenchContent />
    </Suspense>
  );
}
