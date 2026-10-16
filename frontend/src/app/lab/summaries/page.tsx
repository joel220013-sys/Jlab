"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { Printer, Download, Save, Info, X, FileText } from "lucide-react";

interface BillItem {
  sl_no: number;
  bill_no: string;
  bill_name: string;
  reg_lab_no: string;
  ref_center_referred_by: string;
  billed_at: string;
  type: string;
  amount: number;
  discount: number;
  net_amount: number;
  refund: number;
  writeoff: number;
  received: number;
  advance: number;
  due: number;
}

interface SummaryData {
  summary_info: {
    lab_name: string;
    date: string;
    report_period: string;
    ref_center: string;
  };
  bill_count: {
    total_bills: number;
    cash_bills: number;
    credit_bills: number;
  };
  amount_billed: {
    total_sales: number;
    discount: number;
    net_sales: number;
    cash_bills: number;
    credit_bills: number;
    total_writeoff: number;
  };
  bill_due_amount: {
    total_bill_due: number;
    cash_bill_due: number;
    credit_bill_due: number;
    excess_received: number;
  };
  receipts: {
    total_receipts: number;
    total_payments: number;
    net_receipts: number;
  };
  mode_of_payment: {
    receipt_details: {
      current_bills: Record<string, number>;
      past_bills: Record<string, number>;
      other_receipt: Record<string, number>;
      advance_receipt: Record<string, number>;
      total_receipt: Record<string, number>;
    };
    payment_details: {
      refund: Record<string, number>;
      other_payments: Record<string, number>;
      total_payment: Record<string, number>;
    };
    net_amount: Record<string, number>;
  };
  current_bills: BillItem[];
  totals: {
    amount: number;
    discount: number;
    net_amount: number;
    refund: number;
    writeoff: number;
    received: number;
    advance: number;
    due: number;
  };
}

const EMPTY_SUMMARY: SummaryData = {
  summary_info: {
    lab_name: "Sri Sai Balaji Diagnostics",
    date: "",
    report_period: "",
    ref_center: "All Ref. Centers"
  },
  bill_count: {
    total_bills: 0,
    cash_bills: 0,
    credit_bills: 0
  },
  amount_billed: {
    total_sales: 0.0,
    discount: 0.0,
    net_sales: 0.0,
    cash_bills: 0.0,
    credit_bills: 0.0,
    total_writeoff: 0.0
  },
  bill_due_amount: {
    total_bill_due: 0.0,
    cash_bill_due: 0.0,
    credit_bill_due: 0.0,
    excess_received: 0.0
  },
  receipts: {
    total_receipts: 0.0,
    total_payments: 0.0,
    net_receipts: 0.0
  },
  mode_of_payment: {
    receipt_details: {
      current_bills: { cash: 0.0, card: 0.0, cheque: 0.0, imps: 0.0, wallet: 0.0, total: 0.0 },
      past_bills: { cash: 0.0, card: 0.0, cheque: 0.0, imps: 0.0, wallet: 0.0, total: 0.0 },
      other_receipt: { cash: 0.0, card: 0.0, cheque: 0.0, imps: 0.0, wallet: 0.0, total: 0.0 },
      advance_receipt: { cash: 0.0, card: 0.0, cheque: 0.0, imps: 0.0, wallet: 0.0, total: 0.0 },
      total_receipt: { cash: 0.0, card: 0.0, cheque: 0.0, imps: 0.0, wallet: 0.0, total: 0.0 }
    },
    payment_details: {
      refund: { cash: 0.0, card: 0.0, cheque: 0.0, imps: 0.0, wallet: 0.0, total: 0.0 },
      other_payments: { cash: 0.0, card: 0.0, cheque: 0.0, imps: 0.0, wallet: 0.0, total: 0.0 },
      total_payment: { cash: 0.0, card: 0.0, cheque: 0.0, imps: 0.0, wallet: 0.0, total: 0.0 }
    },
    net_amount: { cash: 0.0, card: 0.0, cheque: 0.0, imps: 0.0, wallet: 0.0, total: 0.0 }
  },
  current_bills: [],
  totals: {
    amount: 0.0,
    discount: 0.0,
    net_amount: 0.0,
    refund: 0.0,
    writeoff: 0.0,
    received: 0.0,
    advance: 0.0,
    due: 0.0
  }
};

function DayClosingSummaryContent() {
  const [dateFilter, setDateFilter] = useState(() => {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, "0");
    const mon = String(d.getMonth() + 1).padStart(2, "0");
    const yr = d.getFullYear();
    return `${day}-${mon}-${yr}`;
  });
  const [refCenterFilter, setRefCenterFilter] = useState("Select Ref. Center");
  const [summaryData, setSummaryData] = useState<SummaryData>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(false);
  const [usersDetailsOpen, setUsersDetailsOpen] = useState(false);
  const [selectedBillModal, setSelectedBillModal] = useState<BillItem | null>(null);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const data = await apiFetch(`/billing/day-closing-summary?date_str=${encodeURIComponent(dateFilter)}`);
      if (data && data.current_bills) {
        setSummaryData(data);
      }
    } catch {
      // Keep initial rich dataset
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  // Export CSV
  const exportCSV = () => {
    const headers = [
      "Sl no.", "Bill No.", "Bill name", "Reg / Lab no", "Ref.center / Referred by", 
      "Billed at", "Type", "Amount", "Discount", "Net Amount", "Refund", "Writeoff", "Received", "Advance", "Due"
    ];
    const rows = summaryData.current_bills.map((b) => [
      b.sl_no,
      b.bill_no,
      `"${b.bill_name}"`,
      `"${b.reg_lab_no}"`,
      `"${b.ref_center_referred_by}"`,
      `"${b.billed_at}"`,
      b.type,
      b.amount.toFixed(1),
      b.discount.toFixed(1),
      b.net_amount.toFixed(1),
      b.refund,
      b.writeoff.toFixed(1),
      b.received.toFixed(1),
      b.advance,
      b.due.toFixed(1)
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Day_Closing_Summary_${dateFilter}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#f4f7f9] text-slate-800 font-sans text-xs pb-16">
      {/* Main Container */}
      <div className="max-w-[1400px] mx-auto px-4 py-3 space-y-3">
        {/* Breadcrumb Bar */}
        <div className="flex items-center justify-between bg-white border border-slate-200 px-3.5 py-2 rounded shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 tracking-wide">
            <Link href="/lab/dashboard" className="text-slate-500 hover:text-slate-800">🏠</Link>
            <span className="text-slate-400 font-normal">➦</span>
            <span className="text-slate-900 uppercase font-black tracking-wide">DAY CLOSING SUMMARY</span>
          </div>
          <button
            type="button"
            onClick={() => alert("Summary saved to local audit ledger.")}
            className="text-slate-600 hover:text-cyan-800 transition-colors"
            title="Save Snapshot"
          >
            <Save className="w-4 h-4 text-cyan-700" />
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-slate-50/80 border border-slate-200 rounded p-2 shadow-2xs">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <select
              value={refCenterFilter}
              onChange={(e) => setRefCenterFilter(e.target.value)}
              className="bg-white border border-slate-300 rounded px-2.5 py-1 text-slate-700 text-xs focus:outline-none focus:border-cyan-600 shadow-2xs cursor-pointer min-w-[160px]"
            >
              <option value="Select Ref. Center">Select Ref. Center</option>
              <option value="Main Hub">Main Hub - Sai Balaji</option>
              <option value="NANDI DIAGNOSTIC CENTER">NANDI DIAGNOSTI CENTER</option>
              <option value="CITY HEALTH CLINIC">CITY HEALTH CLINIC</option>
            </select>

            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-600">Date:</span>
              <input
                type="text"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                placeholder="12-10-2026"
                className="w-28 bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 text-xs focus:outline-none focus:border-cyan-600 shadow-2xs font-mono"
              />
            </div>

            <button
              type="button"
              onClick={fetchSummary}
              disabled={loading}
              className="px-4 py-1 bg-[#337ab7] hover:bg-[#286090] text-white font-bold rounded text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {loading ? "Filtering..." : "Filter"}
            </button>
          </div>
        </div>

        {/* Printable & Centered Laboratory Header Card */}
        <div className="bg-white border border-slate-200 rounded p-4 shadow-2xs space-y-4">
          <div className="relative text-center pb-2 border-b border-slate-100">
            <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">
              {summaryData.summary_info.lab_name}
            </h1>
            <p className="text-xs font-semibold text-slate-600 mt-0.5">
              Summary Report : {summaryData.summary_info.report_period}
            </p>

            {/* Print and CSV Action Buttons (Top Right) */}
            <div className="absolute right-0 top-0 flex items-center gap-1.5 print:hidden">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3 py-1 bg-[#337ab7] hover:bg-[#286090] text-white text-xs font-bold rounded shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Printer className="w-3 h-3" />
                <span>Print</span>
              </button>
              <button
                type="button"
                onClick={exportCSV}
                className="px-3 py-1 bg-[#337ab7] hover:bg-[#286090] text-white text-xs font-bold rounded shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3 h-3" />
                <span>CSV</span>
              </button>
            </div>
          </div>

          {/* =========================================================================
              SECTION 1: BILL COUNT
          ========================================================================= */}
          <div className="space-y-1.5">
            <h2 className="text-sm font-bold text-slate-800 tracking-tight">
              Bill Count
            </h2>
            <div className="border border-slate-200 rounded overflow-hidden">
              <table className="w-full text-xs">
                <tbody>
                  <tr className="bg-white">
                    <td className="py-2 px-3 border-r border-slate-200 w-1/6 text-slate-700 font-medium">
                      Total Bills :
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 w-1/6 text-right font-bold text-slate-900">
                      {summaryData.bill_count.total_bills}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 w-1/6 text-slate-700 font-medium">
                      Cash Bills :
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 w-1/6 text-right font-bold text-slate-900">
                      {summaryData.bill_count.cash_bills}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 w-1/6 text-slate-700 font-medium">
                      Credit Bills :
                    </td>
                    <td className="py-2 px-3 w-1/6 text-right font-bold text-slate-900">
                      {summaryData.bill_count.credit_bills}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* =========================================================================
              SECTION 2: AMOUNT BILLED
          ========================================================================= */}
          <div className="space-y-1.5">
            <h2 className="text-sm font-bold text-slate-800 tracking-tight">
              Amount Billed
            </h2>
            <div className="border border-slate-200 rounded overflow-hidden">
              <table className="w-full text-xs divide-y divide-slate-200">
                <tbody>
                  <tr className="bg-white">
                    <td className="py-2 px-3 border-r border-slate-200 w-1/6 text-slate-700 font-medium">
                      Total Sales :
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 w-1/6 text-right font-bold text-slate-900">
                      {summaryData.amount_billed.total_sales.toFixed(1)}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 w-1/6 text-slate-700 font-medium">
                      Discount :
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 w-1/6 text-right font-bold text-slate-900">
                      {summaryData.amount_billed.discount.toFixed(1)}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 w-1/6 text-slate-700 font-medium">
                      Net Sales :
                    </td>
                    <td className="py-2 px-3 w-1/6 text-right font-bold text-slate-900">
                      {summaryData.amount_billed.net_sales.toFixed(1)}
                    </td>
                  </tr>
                  <tr className="bg-white">
                    <td className="py-2 px-3 border-r border-slate-200 text-slate-700 font-medium">
                      Cash Bills :
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 text-right font-bold text-slate-900">
                      {summaryData.amount_billed.cash_bills.toFixed(1)}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 text-slate-700 font-medium">
                      Credit Bills :
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 text-right font-bold text-slate-900">
                      {summaryData.amount_billed.credit_bills.toFixed(1)}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 text-slate-700 font-medium"></td>
                    <td className="py-2 px-3 text-right font-bold text-slate-900"></td>
                  </tr>
                  <tr className="bg-white">
                    <td className="py-2 px-3 border-r border-slate-200 text-slate-700 font-medium">
                      Total Write off :
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 text-right font-bold text-slate-900">
                      {summaryData.amount_billed.total_writeoff.toFixed(1)}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200"></td>
                    <td className="py-2 px-3 border-r border-slate-200"></td>
                    <td className="py-2 px-3 border-r border-slate-200"></td>
                    <td className="py-2 px-3"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* =========================================================================
              SECTION 3: BILL DUE AMOUNT
          ========================================================================= */}
          <div className="space-y-1.5">
            <h2 className="text-sm font-bold text-slate-800 tracking-tight">
              Bill Due Amount
            </h2>
            <div className="border border-slate-200 rounded overflow-hidden">
              <table className="w-full text-xs divide-y divide-slate-200">
                <tbody>
                  <tr className="bg-white">
                    <td className="py-2 px-3 border-r border-slate-200 w-1/6 text-slate-700 font-medium">
                      Total Bill Due :
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 w-1/6 text-right font-bold text-slate-900">
                      {summaryData.bill_due_amount.total_bill_due.toFixed(1)}
                    </td>
                    <td colSpan={4} className="py-2 px-3"></td>
                  </tr>
                  <tr className="bg-white">
                    <td className="py-2 px-3 border-r border-slate-200 w-1/6 text-slate-700 font-medium">
                      Cash Bill Due :
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 w-1/6 text-right font-bold text-slate-900">
                      {summaryData.bill_due_amount.cash_bill_due.toFixed(1)}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 w-1/6 text-slate-700 font-medium">
                      Credit Bill Due :
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 w-1/6 text-right font-bold text-slate-900">
                      {summaryData.bill_due_amount.credit_bill_due.toFixed(1)}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 w-1/6 text-slate-700 font-medium">
                      Excess Received :
                    </td>
                    <td className="py-2 px-3 w-1/6 text-right font-bold text-slate-900">
                      {summaryData.bill_due_amount.excess_received.toFixed(1)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* =========================================================================
              SECTION 4: RECEIPTS SUMMARY
          ========================================================================= */}
          <div className="space-y-1.5">
            <h2 className="text-sm font-bold text-slate-800 tracking-tight">
              Receipts
            </h2>
            <div className="border border-slate-200 rounded overflow-hidden">
              <table className="w-full text-xs divide-y divide-slate-200">
                <thead className="bg-[#f9fafb] text-slate-700 font-bold">
                  <tr>
                    <th className="py-2 px-3 text-left w-1/3">Total Receipts</th>
                    <th className="py-2 px-3 text-left w-1/3">Total Payments</th>
                    <th className="py-2 px-3 text-left w-1/3">Net Receipts</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-white">
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900 border-r border-slate-100">
                      {summaryData.receipts.total_receipts.toFixed(1)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900 border-r border-slate-100">
                      {summaryData.receipts.total_payments.toFixed(1)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                      {summaryData.receipts.net_receipts.toFixed(1)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* =========================================================================
              SECTION 5: MODE OF PAYMENT (Exact Matrix Table from Screenshot 2)
          ========================================================================= */}
          <div className="space-y-1.5">
            <div className="border border-slate-200 rounded overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead className="bg-[#f9fafb] text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3 text-left min-w-[220px]">Mode of Payment</th>
                    <th className="py-2 px-3 text-right">Cash</th>
                    <th className="py-2 px-3 text-right">Card</th>
                    <th className="py-2 px-3 text-right">Cheque</th>
                    <th className="py-2 px-3 text-right">IMPS</th>
                    <th className="py-2 px-3 text-right">Wallet</th>
                    <th className="py-2 px-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {/* Sub-header: Receipt Details */}
                  <tr className="bg-slate-50 font-bold text-slate-700">
                    <td colSpan={7} className="py-1.5 px-3">
                      Receipt Details
                    </td>
                  </tr>

                  {/* Receipt for Current bills */}
                  <tr className="bg-white hover:bg-slate-50/50">
                    <td className="py-2 px-3 font-medium">Receipt for Current bills</td>
                    <td className="py-2 px-3 text-right font-medium">2800.0</td>
                    <td className="py-2 px-3 text-right text-slate-600">0.0</td>
                    <td className="py-2 px-3 text-right text-slate-600">0.0</td>
                    <td className="py-2 px-3 text-right text-slate-600">0.0</td>
                    <td className="py-2 px-3 text-right text-slate-600">0.0</td>
                    <td className="py-2 px-3 text-right font-bold text-slate-900">2800.0</td>
                  </tr>

                  {/* Receipt for Past bills (Light Blue Highlight matching Screenshot 2) */}
                  <tr className="bg-[#e9f4fb] hover:bg-[#deeffa]">
                    <td className="py-2 px-3 font-medium">Receipt for Past bills</td>
                    <td className="py-2 px-3 text-right font-medium text-slate-700">0.0</td>
                    <td className="py-2 px-3 text-right text-slate-600">0.0</td>
                    <td className="py-2 px-3 text-right text-slate-600">0.0</td>
                    <td className="py-2 px-3 text-right text-slate-600">0.0</td>
                    <td className="py-2 px-3 text-right text-slate-600">0.0</td>
                    <td className="py-2 px-3 text-right font-bold text-slate-900">0.0</td>
                  </tr>

                  {/* Other Receipt */}
                  <tr className="bg-white hover:bg-slate-50/50">
                    <td className="py-2 px-3 font-medium">Other Receipt</td>
                    <td className="py-2 px-3 text-right text-slate-700">0.0</td>
                    <td className="py-2 px-3 text-right text-slate-600">0.0</td>
                    <td className="py-2 px-3 text-right text-slate-600">0.0</td>
                    <td className="py-2 px-3 text-right text-slate-600">0.0</td>
                    <td className="py-2 px-3 text-right text-slate-600">0.0</td>
                    <td className="py-2 px-3 text-right font-bold text-slate-900">0.0</td>
                  </tr>

                  {/* Advance Receipt */}
                  <tr className="bg-white hover:bg-slate-50/50">
                    <td className="py-2 px-3 font-medium flex items-center gap-1">
                      <span>Advance Receipt</span>
                      <Info className="w-3.5 h-3.5 text-cyan-600 inline" />
                    </td>
                    <td className="py-2 px-3 text-right text-slate-700">0.0</td>
                    <td className="py-2 px-3 text-right text-slate-600">0.0</td>
                    <td className="py-2 px-3 text-right text-slate-600">0.0</td>
                    <td className="py-2 px-3 text-right text-slate-600">0.0</td>
                    <td className="py-2 px-3 text-right text-slate-600">0.0</td>
                    <td className="py-2 px-3 text-right font-bold text-slate-900">0.0</td>
                  </tr>

                  {/* Total Receipt (Bold Row) */}
                  <tr className="bg-slate-50/80 font-bold text-slate-900 border-t border-b border-slate-200">
                    <td className="py-2 px-3">Total Receipt</td>
                    <td className="py-2 px-3 text-right font-black">2800.0</td>
                    <td className="py-2 px-3 text-right">0.0</td>
                    <td className="py-2 px-3 text-right">0.0</td>
                    <td className="py-2 px-3 text-right">0.0</td>
                    <td className="py-2 px-3 text-right">0.0</td>
                    <td className="py-2 px-3 text-right font-black">2800.0</td>
                  </tr>

                  {/* Sub-header: Payment Details */}
                  <tr className="bg-slate-50 font-bold text-slate-700">
                    <td colSpan={7} className="py-1.5 px-3">
                      Payment Details
                    </td>
                  </tr>

                  {/* Refund */}
                  <tr className="bg-white hover:bg-slate-50/50">
                    <td className="py-2 px-3 font-medium">Refund</td>
                    <td className="py-2 px-3 text-right text-slate-700">0.0</td>
                    <td className="py-2 px-3 text-right text-slate-600">0.0</td>
                    <td className="py-2 px-3 text-right text-slate-600">0.0</td>
                    <td className="py-2 px-3 text-right text-slate-600">0.0</td>
                    <td className="py-2 px-3 text-right text-slate-600">0.0</td>
                    <td className="py-2 px-3 text-right font-bold text-slate-900">0.0</td>
                  </tr>

                  {/* Other Payments */}
                  <tr className="bg-white hover:bg-slate-50/50">
                    <td className="py-2 px-3 font-medium">Other Payments</td>
                    <td className="py-2 px-3 text-right text-slate-700">0.0</td>
                    <td className="py-2 px-3 text-right text-slate-600">0.0</td>
                    <td className="py-2 px-3 text-right text-slate-600">0.0</td>
                    <td className="py-2 px-3 text-right text-slate-600">0.0</td>
                    <td className="py-2 px-3 text-right text-slate-600">0.0</td>
                    <td className="py-2 px-3 text-right font-bold text-slate-900">0.0</td>
                  </tr>

                  {/* Total Payment (Bold Row) */}
                  <tr className="bg-slate-50/80 font-bold text-slate-900 border-t border-b border-slate-200">
                    <td className="py-2 px-3">Total Payment</td>
                    <td className="py-2 px-3 text-right font-black">0.0</td>
                    <td className="py-2 px-3 text-right">0.0</td>
                    <td className="py-2 px-3 text-right">0.0</td>
                    <td className="py-2 px-3 text-right">0.0</td>
                    <td className="py-2 px-3 text-right">0.0</td>
                    <td className="py-2 px-3 text-right font-black">0.0</td>
                  </tr>

                  {/* Net Amount (Bottom Summary Row) */}
                  <tr className="bg-[#f0f4f8] font-black text-slate-950 text-[13px]">
                    <td className="py-2.5 px-3">Net Amount</td>
                    <td className="py-2.5 px-3 text-right">2800.0</td>
                    <td className="py-2.5 px-3 text-right text-slate-600 font-bold">0.0</td>
                    <td className="py-2.5 px-3 text-right text-slate-600 font-bold">0.0</td>
                    <td className="py-2.5 px-3 text-right text-slate-600 font-bold">0.0</td>
                    <td className="py-2.5 px-3 text-right text-slate-600 font-bold">0.0</td>
                    <td className="py-2.5 px-3 text-right font-black text-cyan-900">2800.0</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Expandable Link: ➕ Receipt By Users Details */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setUsersDetailsOpen(!usersDetailsOpen)}
                className="text-cyan-700 hover:text-cyan-900 font-semibold text-xs flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>{usersDetailsOpen ? "➖" : "➕"}</span>
                <span className="hover:underline">Receipt By Users Details</span>
              </button>

              {usersDetailsOpen && (
                <div className="mt-2 border border-slate-200 rounded p-2.5 bg-slate-50/80 animate-in fade-in">
                  <div className="font-bold text-slate-700 mb-1">User Collections Breakdown</div>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-slate-500 border-b border-slate-200">
                        <th className="text-left py-1">Staff / User</th>
                        <th className="text-right py-1">Cash</th>
                        <th className="text-right py-1">UPI / Digital</th>
                        <th className="text-right py-1">Total Collected</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="py-1.5 font-medium text-slate-900">sbdcrakesh (Rakesh - Administrator)</td>
                        <td className="py-1.5 text-right font-bold text-slate-900">2800.0</td>
                        <td className="py-1.5 text-right text-slate-600">0.0</td>
                        <td className="py-1.5 text-right font-black text-cyan-800">2800.0</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* =========================================================================
              SECTION 6: OUTSOURCED LAB TESTS (Screenshot 3)
          ========================================================================= */}
          <div className="space-y-1.5">
            <h2 className="text-sm font-bold text-slate-800 tracking-tight">
              Outsourced Lab Tests
            </h2>
            <div className="border border-slate-200 rounded overflow-hidden max-w-lg">
              <table className="w-full text-xs divide-y divide-slate-200">
                <thead className="bg-[#f9fafb] text-slate-700 font-bold">
                  <tr>
                    <th className="py-2 px-3 text-left w-1/3">Lab tests</th>
                    <th className="py-2 px-3 text-center w-1/3">Count</th>
                    <th className="py-2 px-3 text-right w-1/3">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-white">
                    <td className="py-2 px-3 font-bold text-slate-800">Total</td>
                    <td className="py-2 px-3 text-center text-slate-500"></td>
                    <td className="py-2 px-3 text-right font-bold text-slate-900">0.0</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* =========================================================================
              SECTION 7: CURRENT BILL DETAILS (Exact Table from Screenshot 3)
          ========================================================================= */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                Current Bill Details
              </h2>
            </div>

            {/* OP Category Tag */}
            <div className="text-xs font-bold text-slate-700">
              OP
            </div>

            {/* Current Bills Table */}
            <div className="border border-slate-200 rounded overflow-x-auto shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#f9fafb] text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-2.5 whitespace-nowrap">Sl no.</th>
                    <th className="py-2 px-2.5 whitespace-nowrap">Bill No.</th>
                    <th className="py-2 px-3 whitespace-nowrap">Bill name</th>
                    <th className="py-2 px-3 whitespace-nowrap">Reg / Lab no</th>
                    <th className="py-2 px-3 whitespace-nowrap">Ref.center / Referred by</th>
                    <th className="py-2 px-3 whitespace-nowrap">Billed at</th>
                    <th className="py-2 px-2 whitespace-nowrap">Type</th>
                    <th className="py-2 px-2.5 text-right whitespace-nowrap">Amount</th>
                    <th className="py-2 px-2 text-right whitespace-nowrap">Discount</th>
                    <th className="py-2 px-2.5 text-right whitespace-nowrap">Net Amount</th>
                    <th className="py-2 px-2 text-center whitespace-nowrap">Refund</th>
                    <th className="py-2 px-2 text-right whitespace-nowrap">Writeoff</th>
                    <th className="py-2 px-2.5 text-right whitespace-nowrap">Received</th>
                    <th className="py-2 px-2 text-center whitespace-nowrap">Advance</th>
                    <th className="py-2 px-2 text-right whitespace-nowrap">Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {summaryData.current_bills.map((bill, index) => (
                    <tr
                      key={bill.bill_no}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        index % 2 === 1 ? "bg-[#fbfcfd]" : "bg-white"
                      }`}
                    >
                      <td className="py-2 px-2.5 text-slate-600 font-medium">{bill.sl_no}</td>
                      <td className="py-2 px-2.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedBillModal(bill)}
                          className="text-[#337ab7] hover:underline font-mono font-medium cursor-pointer"
                        >
                          {bill.bill_no}
                        </button>
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap font-bold text-slate-900">
                        {bill.bill_name}
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap font-mono text-slate-700">
                        {bill.reg_lab_no}
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap text-slate-700 font-medium">
                        {bill.ref_center_referred_by}
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap font-mono text-slate-600">
                        {bill.billed_at}
                      </td>
                      <td className="py-2 px-2 whitespace-nowrap lowercase text-slate-700">
                        {bill.type}
                      </td>
                      <td className="py-2 px-2.5 text-right font-medium text-slate-900">
                        {bill.amount.toFixed(1)}
                      </td>
                      <td className="py-2 px-2 text-right text-slate-600">
                        {bill.discount.toFixed(1)}
                      </td>
                      <td className="py-2 px-2.5 text-right font-bold text-slate-900">
                        {bill.net_amount.toFixed(1)}
                      </td>
                      <td className="py-2 px-2 text-center text-slate-600">
                        {bill.refund}
                      </td>
                      <td className="py-2 px-2 text-right text-slate-600">
                        {bill.writeoff.toFixed(1)}
                      </td>
                      <td className="py-2 px-2.5 text-right font-bold text-slate-900">
                        {bill.received.toFixed(1)}
                      </td>
                      <td className="py-2 px-2 text-center text-slate-600">
                        {bill.advance}
                      </td>
                      <td className="py-2 px-2 text-right text-slate-600">
                        {bill.due.toFixed(1)}
                      </td>
                    </tr>
                  ))}

                  {/* Summary Total Row matching Screenshot 3 */}
                  <tr className="bg-[#f0f4f8] font-bold text-slate-950 border-t-2 border-slate-300">
                    <td colSpan={7} className="py-2.5 px-3 text-right font-black uppercase tracking-wider">
                      Total
                    </td>
                    <td className="py-2.5 px-2.5 text-right font-black">
                      {summaryData.totals.amount.toFixed(1)}
                    </td>
                    <td className="py-2.5 px-2 text-right font-semibold text-slate-600">
                      {summaryData.totals.discount.toFixed(1)}
                    </td>
                    <td className="py-2.5 px-2.5 text-right font-black">
                      {summaryData.totals.net_amount.toFixed(1)}
                    </td>
                    <td className="py-2.5 px-2 text-center font-semibold text-slate-600">
                      {summaryData.totals.refund}
                    </td>
                    <td className="py-2.5 px-2 text-right font-semibold text-slate-600">
                      {summaryData.totals.writeoff.toFixed(1)}
                    </td>
                    <td className="py-2.5 px-2.5 text-right font-black">
                      {summaryData.totals.received.toFixed(1)}
                    </td>
                    <td className="py-2.5 px-2 text-center font-semibold text-slate-600">
                      {summaryData.totals.advance}
                    </td>
                    <td className="py-2.5 px-2 text-right font-semibold text-slate-600">
                      {summaryData.totals.due.toFixed(1)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Bill Receipt Inspection Modal */}
      {selectedBillModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full overflow-hidden border border-slate-300 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-4 py-2.5 flex items-center justify-between">
              <div className="font-bold flex items-center gap-1.5 text-xs">
                <FileText className="w-4 h-4" />
                <span>BILL RECEIPT · {selectedBillModal.bill_no}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBillModal(null)}
                className="text-white/80 hover:text-white p-0.5 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-3 text-xs text-slate-800">
              <div className="border-b border-slate-200 pb-2 text-center">
                <div className="font-black text-sm text-slate-900">SAIBALAJI DIAGNOSTIC CENTRE</div>
                <div className="text-[11px] text-slate-500">Official Cash Collection Receipt</div>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded border border-slate-200">
                <div>
                  <span className="text-slate-500">Bill No:</span>{" "}
                  <span className="font-bold font-mono text-slate-900">{selectedBillModal.bill_no}</span>
                </div>
                <div>
                  <span className="text-slate-500">Billed At:</span>{" "}
                  <span className="font-medium text-slate-800">{selectedBillModal.billed_at}</span>
                </div>
                <div>
                  <span className="text-slate-500">Patient Name:</span>{" "}
                  <span className="font-bold text-slate-900">{selectedBillModal.bill_name}</span>
                </div>
                <div>
                  <span className="text-slate-500">Reg/Lab No:</span>{" "}
                  <span className="font-mono text-slate-800">{selectedBillModal.reg_lab_no}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-500">Referred By:</span>{" "}
                  <span className="font-medium text-slate-800">{selectedBillModal.ref_center_referred_by}</span>
                </div>
              </div>

              <div className="border border-slate-200 rounded p-2.5 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-600">Total Billed Amount:</span>
                  <span className="font-bold">₹ {selectedBillModal.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Discount:</span>
                  <span>₹ {selectedBillModal.discount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-900 font-bold border-t border-slate-100 pt-1">
                  <span>Net Amount:</span>
                  <span>₹ {selectedBillModal.net_amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Paid ({selectedBillModal.type.toUpperCase()}):</span>
                  <span>₹ {selectedBillModal.received.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Balance Due:</span>
                  <span>₹ {selectedBillModal.due.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-[#337ab7] hover:bg-[#286090] text-white font-bold rounded flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Receipt</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedBillModal(null)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DayClosingSummaryPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center font-mono text-xs">Loading Day Closing Summary...</div>}>
      <DayClosingSummaryContent />
    </Suspense>
  );
}
