"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { 
  Clock, 
  Plus, 
  Filter, 
  ChevronRight, 
  Search, 
  RefreshCw, 
  FlaskConical, 
  Calendar,
  CheckCircle2,
  Inbox
} from "lucide-react";
import { apiFetch } from "@/lib/api";

interface OrderRow {
  id: string;
  lab_number: string;
  order_number: string;
  patient_name: string;
  patient_uhid: string;
  final_amount: number;
  invoice_status: string;
  samples: Array<{
    id: string;
    barcode: string;
    specimen_type: string;
    tube_color: string;
    status: string;
  }>;
  created_at: string;
}

export default function SampleTrackingQueuePage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [dateFilter, setDateFilter] = useState<"ALL" | "TODAY" | "YESTERDAY" | "WEEK">("ALL");
  const [categoryFilterOpen, setCategoryFilterOpen] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>("");

  const loadQueue = async () => {
    try {
      const data = await apiFetch("/orders");
      if (Array.isArray(data)) {
        setOrders(data);
      }
      setLastRefreshed(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadQueue();
    const interval = setInterval(loadQueue, 30000); // 30s auto-refresh
    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = () => {
    setRefreshing(true);
    loadQueue();
  };

  // Filter helpers
  const isToday = (dateStr: string) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  };

  const isYesterday = (dateStr: string) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return d.getFullYear() === yesterday.getFullYear() && d.getMonth() === yesterday.getMonth() && d.getDate() === yesterday.getDate();
  };

  const isWithinPastDays = (dateStr: string, days: number) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return d >= cutoff;
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      // 1. Text Search Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const s = o.samples?.[0];
        const matchLab = o.lab_number.toLowerCase().includes(q);
        const matchOrder = o.order_number.toLowerCase().includes(q);
        const matchPatient = o.patient_name.toLowerCase().includes(q);
        const matchUhid = o.patient_uhid.toLowerCase().includes(q);
        const matchBarcode = s?.barcode?.toLowerCase().includes(q);
        if (!matchLab && !matchOrder && !matchPatient && !matchUhid && !matchBarcode) {
          return false;
        }
      }

      // 2. Status Filter
      if (statusFilter !== "ALL") {
        const s = o.samples?.[0];
        const currentStatus = s?.status || "PENDING";
        if (currentStatus !== statusFilter) {
          return false;
        }
      }

      // 3. Date Filter
      if (dateFilter === "TODAY") {
        return isToday(o.created_at);
      } else if (dateFilter === "YESTERDAY") {
        return isYesterday(o.created_at);
      } else if (dateFilter === "WEEK") {
        return isWithinPastDays(o.created_at, 7);
      }

      return true;
    });
  }, [orders, searchQuery, statusFilter, dateFilter]);

  // Tube color styling helper
  const getTubeBadgeStyle = (tubeColor?: string) => {
    if (!tubeColor) return "bg-slate-100 text-slate-700 border-slate-200";
    if (tubeColor.includes("Lavender") || tubeColor.includes("EDTA")) {
      return "bg-purple-50 text-purple-800 border-purple-200";
    }
    if (tubeColor.includes("Yellow") || tubeColor.includes("SST") || tubeColor.includes("Gel")) {
      return "bg-amber-50 text-amber-800 border-amber-200";
    }
    if (tubeColor.includes("Gray") || tubeColor.includes("Fluoride")) {
      return "bg-slate-100 text-slate-800 border-slate-300";
    }
    if (tubeColor.includes("Red") || tubeColor.includes("Plain")) {
      return "bg-rose-50 text-rose-800 border-rose-200";
    }
    if (tubeColor.includes("Blue") || tubeColor.includes("Citrate")) {
      return "bg-sky-50 text-sky-800 border-sky-200";
    }
    if (tubeColor.includes("Green") || tubeColor.includes("Heparin")) {
      return "bg-emerald-50 text-emerald-800 border-emerald-200";
    }
    return "bg-slate-100 text-slate-700 border-slate-200";
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title & Action Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Clock className="w-6 h-6 text-rose-700" />
              <span>Live Sample Tracking Queue</span>
            </h1>
            <span className="text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
              Live Queue
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time accessioning, sample tube tracking, and technician turnaround monitoring across all dates.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-rose-300 hover:bg-rose-50 text-rose-950 font-bold text-xs shadow-2xs transition-all cursor-pointer"
            title="Refresh queue"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-rose-700 ${refreshing ? "animate-spin" : ""}`} />
            <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
          </button>

          <Link
            href="/lab/technician"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-rose-300 hover:bg-rose-50 text-rose-950 font-bold text-xs shadow-2xs transition-all cursor-pointer"
          >
            <FlaskConical className="w-4 h-4 text-rose-700" />
            <span>Technician Workbench</span>
          </Link>

          <Link
            href="/lab/orders/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#5E1224] hover:bg-[#721C24] text-white font-semibold text-xs shadow-sm transition-all"
          >
            <Plus className="w-4 h-4 text-rose-200" />
            <span>New Order (Bill-First)</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-rose-200/90 rounded-xl p-3.5 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Accession #, Barcode, Patient, Phone..."
              className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-rose-600 focus:ring-1 focus:ring-rose-600"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2 text-xs text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Date Filters */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-slate-500 mr-1 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-rose-700" /> Date:
            </span>
            {(["ALL", "TODAY", "YESTERDAY", "WEEK"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setDateFilter(mode)}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  dateFilter === mode
                    ? "bg-[#5E1224] text-white shadow-2xs"
                    : "bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-950"
                }`}
              >
                {mode === "ALL" && "All Time"}
                {mode === "TODAY" && "Today"}
                {mode === "YESTERDAY" && "Yesterday"}
                {mode === "WEEK" && "Past 7 Days"}
              </button>
            ))}
          </div>
        </div>

        {lastRefreshed && (
          <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-100">
            <span>Auto-synced with laboratory accession drawer</span>
            <span>Last refreshed: {lastRefreshed}</span>
          </div>
        )}
      </div>

      {/* Main Workbench Orders Table (Matching Reference Screenshot) */}
      <div className="bg-white border border-rose-200/90 rounded-xl overflow-hidden shadow-2xs">
        {/* Table Header Bar */}
        <div className="p-4 border-b border-rose-200/80 flex items-center justify-between flex-wrap gap-3 bg-[#FFF0F4]">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold text-slate-900">Live Sample Tracking Queue</h2>
            
            {/* Category Filter Pill Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setCategoryFilterOpen(!categoryFilterOpen)}
                className="flex items-center gap-1.5 text-[11px] bg-white border border-rose-200 hover:border-rose-300 px-2.5 py-1 rounded-lg text-rose-900 font-bold shadow-2xs transition-colors cursor-pointer"
              >
                <Filter className="w-3 h-3 text-rose-600" />
                <span>
                  {statusFilter === "ALL" && "All Categories"}
                  {statusFilter === "COLLECTED" && "Collected"}
                  {statusFilter === "RECEIVED" && "Received"}
                  {statusFilter === "PROCESSING" && "Processing"}
                  {statusFilter === "VERIFIED" && "Verified"}
                </span>
                <ChevronRight className={`w-3 h-3 transition-transform ${categoryFilterOpen ? "rotate-90" : ""}`} />
              </button>

              {categoryFilterOpen && (
                <div className="absolute left-0 top-full mt-1.5 w-44 bg-white border border-rose-200 rounded-lg shadow-lg z-20 py-1 text-xs">
                  {[
                    { label: "All Categories", val: "ALL" },
                    { label: "Collected", val: "COLLECTED" },
                    { label: "Received at Lab", val: "RECEIVED" },
                    { label: "In Analysis", val: "PROCESSING" },
                    { label: "Verified", val: "VERIFIED" }
                  ].map((cat) => (
                    <button
                      key={cat.val}
                      type="button"
                      onClick={() => {
                        setStatusFilter(cat.val);
                        setCategoryFilterOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 hover:bg-rose-50 transition-colors flex items-center justify-between ${
                        statusFilter === cat.val ? "font-bold text-rose-950 bg-rose-50/50" : "text-slate-700"
                      }`}
                    >
                      <span>{cat.label}</span>
                      {statusFilter === cat.val && <CheckCircle2 className="w-3.5 h-3.5 text-rose-700" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">Active Count:</span>
            <span className="bg-rose-100 text-rose-900 border border-rose-300 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
              {filteredOrders.length} Orders
            </span>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs font-mono">
            Loading live sample tracking queue...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-16 text-center text-slate-500 bg-white">
            <Inbox className="w-10 h-10 text-rose-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-700">No matching orders in tracking queue</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {searchQuery || statusFilter !== "ALL" || dateFilter !== "ALL"
                ? "Try clearing your filters or search term to see all sample records."
                : "No patient accession orders have been registered yet."}
            </p>
            <div className="flex items-center justify-center gap-2.5 mt-4 flex-wrap">
              {(searchQuery || statusFilter !== "ALL" || dateFilter !== "ALL") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("ALL");
                    setDateFilter("ALL");
                  }}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  Clear Filters
                </button>
              )}
              <Link
                href="/lab/orders/new"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#5E1224] hover:bg-[#721C24] text-white text-xs font-bold transition-all shadow-xs"
              >
                <Plus className="w-3.5 h-3.5 text-rose-200" />
                <span>+ Create New Order (Bill-First)</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FFF0F4]/90 border-b border-rose-200/80 text-rose-950 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Lab / Accession No</th>
                  <th className="py-3 px-4">Sample Barcode</th>
                  <th className="py-3 px-4">Patient Information</th>
                  <th className="py-3 px-4">Registration Time</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Bill</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rose-100/70 text-slate-800">
                {filteredOrders.map((o) => {
                  const s = o.samples?.[0];
                  return (
                    <tr key={o.id} className="hover:bg-rose-50/50 transition-colors group">
                      {/* Accession & Order ID */}
                      <td className="py-3.5 px-4 font-mono font-bold text-rose-900 text-xs">
                        #{o.lab_number}
                        <div className="text-[10px] text-slate-400 font-sans font-normal">{o.order_number}</div>
                      </td>

                      {/* Barcode & Tube Color Pill */}
                      <td className="py-3.5 px-4 font-mono">
                        <div className="font-semibold text-slate-900 text-xs">{s?.barcode || "N/A"}</div>
                        {s?.tube_color && (
                          <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded mt-0.5 font-medium border ${getTubeBadgeStyle(s.tube_color)}`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                            {s.tube_color}
                          </span>
                        )}
                      </td>

                      {/* Patient Name & UHID */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{o.patient_name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{o.patient_uhid}</div>
                      </td>

                      {/* Registration Time */}
                      <td className="py-3.5 px-4">
                        <div className="text-slate-700 font-medium">
                          {new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(o.created_at).toLocaleDateString()}
                        </div>
                      </td>

                      {/* Status Pill */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          s?.status === "RECEIVED" || s?.status === "COLLECTED"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                            : s?.status === "PROCESSING"
                            ? "bg-amber-50 text-amber-800 border-amber-300"
                            : s?.status === "VERIFIED"
                            ? "bg-blue-50 text-blue-800 border-blue-300"
                            : "bg-rose-50 text-rose-800 border-rose-200"
                        }`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                          {s?.status || "PENDING"}
                        </span>
                      </td>

                      {/* Bill / Payment Status */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">₹{o.final_amount.toFixed(2)}</div>
                        <span className={`text-[10px] font-bold ${o.invoice_status === "PAID" ? "text-emerald-600" : "text-rose-600"}`}>
                          {o.invoice_status}
                        </span>
                      </td>

                      {/* Action -> Workbench */}
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/lab/technician`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-300 text-xs font-bold transition-all shadow-xs cursor-pointer"
                        >
                          <span>Workbench</span>
                          <ChevronRight className="w-3.5 h-3.5 text-rose-600" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
