"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  Plus, 
  Receipt,
  ChevronRight,
  TrendingUp,
  Settings,
  Calendar
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

export default function LabDashboard() {
  const [stats, setStats] = useState({
    today_orders: 0,
    pending_verifications: 0,
    completed_reports: 0,
    today_collections: 0,
    pending_dues: 0,
    avg_tat: "—",
    tat_compliance_rate: "—"
  });

  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [todayDateStr, setTodayDateStr] = useState("");

  useEffect(() => {
    let isMounted = true;
    
    // Set formatted local date for "Today"
    setTodayDateStr(
      new Date().toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric"
      })
    );

    apiFetch("/dashboard/stats")
      .then((data) => {
        if (isMounted && data) {
          setStats((prev) => ({ ...prev, ...data }));
        }
      })
      .catch(() => {});

    apiFetch("/orders")
      .then((data) => {
        if (isMounted && Array.isArray(data)) {
          setOrders(data);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Strict local date matcher for "Today's Orders"
  const isOrderToday = (dateStr: string) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const now = new Date();
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  };

  const todayOrders = orders.filter((o) => isOrderToday(o.created_at));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title & Action Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Clinical Workspace Cockpit
            </h1>
            <span className="text-[11px] font-bold bg-rose-100 text-rose-900 border border-rose-300 px-2.5 py-0.5 rounded-full">
              Main Hub Live
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time accessioning, sample tube tracking, and technician turnaround monitoring.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/lab/settings"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-rose-300 hover:bg-rose-50 text-rose-950 font-bold text-xs shadow-2xs transition-all cursor-pointer"
            title="Configure Laboratory Details & Account"
          >
            <Settings className="w-4 h-4 text-rose-700" />
            <span>Lab Settings</span>
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

      {/* KPI Stats Grid (Pale Pink Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="p-4 rounded-xl bg-[#FFF0F4] border border-rose-200/90 shadow-2xs relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-600 font-medium">Today&apos;s Patients</span>
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 border border-rose-300 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">{todayOrders.length}</span>
            <span className="text-xs text-emerald-600 font-semibold flex items-center">
              <TrendingUp className="w-3 h-3 mr-0.5" /> Live Today
            </span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Daily accession throughput</div>
        </div>

        {/* KPI 2 */}
        <div className="p-4 rounded-xl bg-[#FFF0F4] border border-rose-200/90 shadow-2xs relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-600 font-medium">Pending Approvals</span>
            <div className="w-8 h-8 rounded-lg bg-amber-100/80 text-amber-800 border border-amber-300 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">{stats.pending_verifications}</span>
            <span className="text-xs text-amber-600 font-semibold">Verification</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Pathologist verification queue</div>
        </div>

        {/* KPI 3 */}
        <div className="p-4 rounded-xl bg-[#FFF0F4] border border-rose-200/90 shadow-2xs relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-600 font-medium">Completed Reports</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100/80 text-emerald-800 border border-emerald-300 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">{stats.completed_reports}</span>
            <span className="text-xs text-emerald-600 font-semibold">{stats.tat_compliance_rate} TAT</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Signed &amp; QR dispatched</div>
        </div>

        {/* KPI 4 */}
        <div className="p-4 rounded-xl bg-[#FFF0F4] border border-rose-200/90 shadow-2xs relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-600 font-medium">Today&apos;s Revenue</span>
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-800 border border-rose-300 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">₹{Number(stats.today_collections || 0).toLocaleString()}</span>
            <span className="text-xs text-rose-600 font-semibold">₹{Number(stats.pending_dues || 0)} Due</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Reconciled UPI &amp; Cash drawer</div>
        </div>
      </div>

      {/* Today's Orders Table (Strictly Today's Orders Only) */}
      <div className="bg-white border border-rose-200/90 rounded-xl overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-rose-200/80 flex items-center justify-between flex-wrap gap-3 bg-[#FFF0F4]">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-rose-700" />
              <span>Today&apos;s Orders</span>
            </h2>
            <div className="flex items-center gap-1.5 text-[11px] bg-white border border-rose-200 px-2.5 py-0.5 rounded-lg text-rose-950 font-bold shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>{todayDateStr || "Today"}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-medium">Active Count:</span>
            <span className="bg-rose-100 text-rose-900 border border-rose-300 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
              {todayOrders.length} Orders
            </span>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs font-mono">
            Loading today&apos;s orders...
          </div>
        ) : todayOrders.length === 0 ? (
          <div className="py-14 px-4 text-center text-slate-500 bg-white">
            <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto mb-3 text-rose-700 shadow-2xs">
              <Calendar className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-800">
              No orders registered today ({todayDateStr || "Today"})
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              This table strictly displays orders placed today. Click below to register a new order.
            </p>
            <div className="flex items-center justify-center gap-3 mt-5 flex-wrap">
              <Link
                href="/lab/orders/new"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#5E1224] hover:bg-[#721C24] text-white text-xs font-bold transition-all shadow-xs"
              >
                <Plus className="w-3.5 h-3.5 text-rose-200" />
                <span>+ New Order (Bill-First)</span>
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
                {todayOrders.map((o) => {
                  const s = o.samples?.[0];
                  return (
                    <tr key={o.id} className="hover:bg-rose-50/50 transition-colors group">
                      <td className="py-3.5 px-4 font-mono font-bold text-rose-900 text-xs">
                        #{o.lab_number}
                        <div className="text-[10px] text-slate-400 font-sans font-normal">{o.order_number}</div>
                      </td>

                      <td className="py-3.5 px-4 font-mono">
                        <div className="font-semibold text-slate-900 text-xs">{s?.barcode || "N/A"}</div>
                        {s?.tube_color && (
                          <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded mt-0.5 font-medium ${
                            s.tube_color.includes("Lavender")
                              ? "bg-purple-50 text-purple-800 border border-purple-200"
                              : s.tube_color.includes("Yellow")
                              ? "bg-amber-50 text-amber-800 border border-amber-200"
                              : s.tube_color.includes("Gray")
                              ? "bg-slate-100 text-slate-800 border border-slate-300"
                              : "bg-slate-100 text-slate-700 border border-slate-200"
                          }`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                            {s.tube_color}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{o.patient_name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{o.patient_uhid}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-slate-700 font-medium">
                          {new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(o.created_at).toLocaleDateString()}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          s?.status === "RECEIVED" || s?.status === "COLLECTED"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                            : "bg-rose-50 text-rose-800 border-rose-200"
                        }`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                          {s?.status || "PENDING"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">₹{o.final_amount.toFixed(2)}</div>
                        <span className={`text-[10px] font-bold ${o.invoice_status === "PAID" ? "text-emerald-600" : "text-rose-600"}`}>
                          {o.invoice_status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/lab/technician`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-300 text-xs font-bold transition-all shadow-xs"
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
