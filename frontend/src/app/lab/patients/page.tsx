"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { 
  Home, 
  Search, 
  PlusCircle, 
  UserPlus, 
  Barcode, 
  X, 
  Printer, 
  ArrowUpDown, 
  User, 
  CheckCircle2, 
  ChevronRight
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import BarcodeGenerator from "@/components/BarcodeGenerator";

interface PatientItem {
  id: string;
  laboratory_id: string;
  uhid: string;
  full_name: string;
  phone: string;
  email?: string | null;
  gender: string;
  age_years: number;
  age_months?: number;
  blood_group?: string | null;
  address?: string | null;
  created_at: string;
}

export default function PatientsDirectoryPage() {
  // Search & Filter inputs (matching AyusLab exact fields)
  const [nameSearch, setNameSearch] = useState("");
  const [patientNoSearch, setPatientNoSearch] = useState("");
  const [mobileSearch, setMobileSearch] = useState("");
  const [emailSearch, setEmailSearch] = useState("");
  const [ipNoSearch, setIpNoSearch] = useState("");
  const [opNoSearch, setOpNoSearch] = useState("");

  // Patients data state
  const [patients, setPatients] = useState<PatientItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sorting
  const [sortField, setSortField] = useState<"name" | "uhid" | "age" | "created_at">("created_at");
  const [sortAsc, setSortAsc] = useState(false);

  // Modals state
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [selectedPatientForDetails, setSelectedPatientForDetails] = useState<PatientItem | null>(null);
  const [patientDetailsLoading, setPatientDetailsLoading] = useState(false);
  const [patientOrderHistory, setPatientOrderHistory] = useState<any[]>([]);
  const [barcodePatient, setBarcodePatient] = useState<PatientItem | null>(null);

  // Current Logged-in User Session State
  const [currentUser, setCurrentUser] = useState<{
    userId?: string;
    fullName?: string;
    role?: string;
    labId?: string;
    labName?: string;
  } | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("jlab_user") || localStorage.getItem("pulselab_user");
        if (stored) {
          setCurrentUser(JSON.parse(stored));
        }
      } catch (err) {
        console.error("Failed to parse user session", err);
      }
    }
  }, []);

  // New patient registration form state
  const [prefix, setPrefix] = useState("Mr.");
  const [regFullName, setRegFullName] = useState("");
  const [regMobile, setRegMobile] = useState("");
  const [regGender, setRegGender] = useState<"MALE" | "FEMALE" | "OTHER">("MALE");
  const [regAgeYears, setRegAgeYears] = useState("30");
  const [regEmail, setRegEmail] = useState("");
  const [regBloodGroup, setRegBloodGroup] = useState("");
  const [regAddress, setRegAddress] = useState("");
  const [regLoading, setRegLoading] = useState(false);
  const [regSuccessMsg, setRegSuccessMsg] = useState<string | null>(null);

  // Auto-sync Prefix & Gender for registration
  const handleRegPrefixChange = (newPrefix: string) => {
    setPrefix(newPrefix);
    if (newPrefix === "Mr." || newPrefix === "Master") {
      setRegGender("MALE");
    } else if (newPrefix === "Mrs." || newPrefix === "Ms." || newPrefix === "Smt.") {
      setRegGender("FEMALE");
    }
  };

  const handleRegGenderChange = (newGender: "MALE" | "FEMALE" | "OTHER") => {
    setRegGender(newGender);
    if (newGender === "MALE" && (prefix === "Mrs." || prefix === "Ms." || prefix === "Smt.")) {
      setPrefix("Mr.");
    } else if (newGender === "FEMALE" && (prefix === "Mr." || prefix === "Master")) {
      setPrefix("Mrs.");
    }
  };

  // Fetch patients from API
  const fetchPatients = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (nameSearch.trim()) params.append("name", nameSearch.trim());
      if (patientNoSearch.trim()) params.append("uhid", patientNoSearch.trim());
      if (mobileSearch.trim()) params.append("phone", mobileSearch.trim());
      if (emailSearch.trim()) params.append("email", emailSearch.trim());

      const queryStr = params.toString() ? `?${params.toString()}` : "";
      const data = await apiFetch(`/patients${queryStr}`);
      if (Array.isArray(data)) {
        setPatients(data);
      } else {
        setPatients([]);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load patients catalog");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  // Handle Search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPatients();
  };

  // Reset Filters
  const handleResetFilters = () => {
    setNameSearch("");
    setPatientNoSearch("");
    setMobileSearch("");
    setEmailSearch("");
    setIpNoSearch("");
    setOpNoSearch("");
    // Re-fetch all
    apiFetch("/patients").then((data) => {
      if (Array.isArray(data)) setPatients(data);
    });
  };

  // Sorted list
  const sortedPatients = useMemo(() => {
    const list = [...patients];
    list.sort((a, b) => {
      let comparison = 0;
      if (sortField === "name") {
        comparison = a.full_name.localeCompare(b.full_name);
      } else if (sortField === "uhid") {
        comparison = a.uhid.localeCompare(b.uhid);
      } else if (sortField === "age") {
        comparison = a.age_years - b.age_years;
      } else if (sortField === "created_at") {
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      return sortAsc ? comparison : -comparison;
    });
    return list;
  }, [patients, sortField, sortAsc]);

  const toggleSort = (field: "name" | "uhid" | "age" | "created_at") => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  // Open Details Modal and fetch history
  const handleOpenDetails = async (patient: PatientItem) => {
    setSelectedPatientForDetails(patient);
    setPatientDetailsLoading(true);
    setPatientOrderHistory([]);
    try {
      const res = await apiFetch(`/patients/${patient.id}`);
      if (res && res.orders) {
        setPatientOrderHistory(res.orders);
      }
    } catch {
      // Fallback
    } finally {
      setPatientDetailsLoading(false);
    }
  };

  // Register New Patient Submit
  const handleRegisterPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regFullName.trim() || !regMobile.trim()) {
      alert("Please provide patient full name and mobile number.");
      return;
    }

    setRegLoading(true);
    try {
      const fullNameWithPrefix = `${prefix} ${regFullName.trim()}`;
      const newPatient = await apiFetch("/patients", {
        method: "POST",
        body: JSON.stringify({
          full_name: fullNameWithPrefix,
          phone: regMobile.trim(),
          gender: regGender,
          age_years: parseInt(regAgeYears) || 30,
          age_months: 0,
          email: regEmail.trim() || null,
          blood_group: regBloodGroup || null,
          address: regAddress.trim() || null
        })
      });

      setRegSuccessMsg(`Patient registered successfully with UHID ${newPatient.uhid}`);
      fetchPatients();
      setTimeout(() => {
        setShowRegisterModal(false);
        setRegSuccessMsg(null);
        // Clear inputs
        setRegFullName("");
        setRegMobile("");
        setRegEmail("");
        setRegAddress("");
      }, 1500);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to register patient");
    } finally {
      setRegLoading(false);
    }
  };

  // Print Barcode Label (Thermal / 50mm x 25mm standard label)
  const handlePrintBarcode = (patient: PatientItem) => {
    const printWindow = window.open("", "_blank", "width=420,height=320");
    const svgEl = document.getElementById("patient-uhid-barcode-svg");
    const svgHtml = svgEl ? svgEl.outerHTML : "";

    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>UHID Barcode - ${patient.uhid}</title>
            <style>
              @page {
                size: 50mm 30mm;
                margin: 2mm;
              }
              body {
                font-family: Arial, sans-serif;
                text-align: center;
                margin: 0;
                padding: 4px;
                color: #000;
              }
              .lab-header {
                font-size: 10px;
                font-weight: 900;
                letter-spacing: 0.5px;
                text-transform: uppercase;
                margin-bottom: 2px;
              }
              .barcode-container {
                display: flex;
                justify-content: center;
                align-items: center;
                margin: 2px 0;
              }
              .barcode-container svg {
                max-width: 100%;
                height: 48px;
              }
              .patient-info {
                border-top: 1px dashed #444;
                margin-top: 3px;
                padding-top: 3px;
                font-size: 9px;
                font-weight: bold;
                text-align: left;
                display: flex;
                justify-content: space-between;
              }
            </style>
          </head>
          <body onload="window.print(); setTimeout(() => window.close(), 600);">
            <div class="lab-header">${(currentUser?.labName || "DIAGNOSTIC LABORATORY").toUpperCase()}</div>
            <div class="barcode-container">
              ${svgHtml}
            </div>
            <div class="patient-info">
              <div><strong>${patient.full_name}</strong> (${patient.gender.slice(0, 1)} / ${patient.age_years}Y)</div>
              <div>Ph: ${patient.phone}</div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
    } else {
      window.print();
    }
  };

  return (
    <div className="space-y-4 max-w-[1500px] mx-auto">
      {/* Top Breadcrumb & Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rose-200/80 pb-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
          <Link href="/lab/dashboard" className="text-slate-400 hover:text-rose-700 transition-colors flex items-center gap-1">
            <Home className="w-3.5 h-3.5" />
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-rose-300" />
          <span className="text-rose-950 flex items-center gap-1.5">
            PATIENTS
          </span>
          <span className="ml-2 text-[10px] font-mono bg-rose-100 text-rose-900 border border-rose-300 px-2 py-0.5 rounded-full lowercase">
            {patients.length} registered
          </span>
        </div>

        {/* Top-Right Action Buttons */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/lab/orders/new"
            className="px-3.5 py-2 rounded-lg bg-[#5E1224] hover:bg-[#721C24] text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all"
          >
            <PlusCircle className="w-3.5 h-3.5 text-rose-200" />
            <span>+ New Order</span>
          </Link>
          <button
            type="button"
            onClick={() => setShowRegisterModal(true)}
            className="px-3.5 py-2 rounded-lg bg-white hover:bg-rose-50 text-rose-900 border border-rose-200 font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all"
          >
            <UserPlus className="w-3.5 h-3.5 text-rose-700" />
            <span>Register Patient</span>
          </button>
        </div>
      </div>

      {/* Filter / Search Bar (Pale Pink Card) */}
      <form onSubmit={handleSearchSubmit} className="p-4 rounded-xl bg-[#FFF0F4] border border-rose-200/90 shadow-2xs">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          <div>
            <input
              type="text"
              value={nameSearch}
              onChange={(e) => setNameSearch(e.target.value)}
              placeholder="Name search"
              className="w-full bg-white border border-rose-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-400/20 focus:border-rose-400"
            />
          </div>

          <div>
            <input
              type="text"
              value={patientNoSearch}
              onChange={(e) => setPatientNoSearch(e.target.value)}
              placeholder="Patient No search"
              className="w-full bg-white border border-rose-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-400/20 focus:border-rose-400 font-mono"
            />
          </div>

          <div>
            <input
              type="text"
              value={mobileSearch}
              onChange={(e) => setMobileSearch(e.target.value)}
              placeholder="Mobile No"
              className="w-full bg-white border border-rose-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-400/20 focus:border-rose-400 font-mono"
            />
          </div>

          <div>
            <input
              type="text"
              value={emailSearch}
              onChange={(e) => setEmailSearch(e.target.value)}
              placeholder="Email search"
              className="w-full bg-white border border-rose-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-400/20 focus:border-rose-400"
            />
          </div>

          <div>
            <input
              type="text"
              value={ipNoSearch}
              onChange={(e) => setIpNoSearch(e.target.value)}
              placeholder="IP No search"
              className="w-full bg-white border border-rose-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-400/20 focus:border-rose-400"
            />
          </div>

          <div>
            <input
              type="text"
              value={opNoSearch}
              onChange={(e) => setOpNoSearch(e.target.value)}
              placeholder="OP No search"
              className="w-full bg-white border border-rose-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-400/20 focus:border-rose-400"
            />
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-rose-200/60">
          <div className="text-[11px] text-slate-500 font-medium">
            Search by full name, phone number, or patient registration number (UHID).
          </div>
          <div className="flex items-center gap-2">
            {(nameSearch || patientNoSearch || mobileSearch || emailSearch || ipNoSearch || opNoSearch) && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-3 py-1.5 rounded-lg bg-white border border-rose-200 hover:bg-rose-50 text-rose-800 text-xs font-semibold transition-colors"
              >
                Reset
              </button>
            )}
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-[#5E1224] hover:bg-[#721C24] text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all"
            >
              <Search className="w-3.5 h-3.5 text-rose-200" />
              <span>Search</span>
            </button>
          </div>
        </div>
      </form>

      {/* Main Patients Table */}
      <div className="bg-white border border-rose-200/90 rounded-xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#FFF0F4] text-rose-950 font-bold border-b border-rose-200/80 select-none">
                <th 
                  className="py-3 px-4 cursor-pointer hover:bg-rose-100/60 transition-colors"
                  onClick={() => toggleSort("name")}
                >
                  <div className="flex items-center gap-1">
                    <span>Name</span>
                    <ArrowUpDown className="w-3 h-3 text-rose-400" />
                  </div>
                </th>
                <th 
                  className="py-3 px-4 cursor-pointer hover:bg-rose-100/60 transition-colors"
                  onClick={() => toggleSort("uhid")}
                >
                  <div className="flex items-center gap-1">
                    <span>Patient / Passport No</span>
                    <ArrowUpDown className="w-3 h-3 text-rose-400" />
                  </div>
                </th>
                <th 
                  className="py-3 px-4 cursor-pointer hover:bg-rose-100/60 transition-colors"
                  onClick={() => toggleSort("age")}
                >
                  <div className="flex items-center gap-1">
                    <span>Age</span>
                    <ArrowUpDown className="w-3 h-3 text-rose-400" />
                  </div>
                </th>
                <th className="py-3 px-4 font-bold">Email</th>
                <th className="py-3 px-4 font-bold">Mobile</th>
                <th className="py-3 px-4 font-bold">Venue</th>
                <th className="py-3 px-4 text-center font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rose-100/70">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Loading patient directory...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-rose-500 font-medium">
                    {error}
                  </td>
                </tr>
              ) : sortedPatients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No patients found matching your search criteria.
                  </td>
                </tr>
              ) : (
                sortedPatients.map((patient, idx) => (
                  <tr 
                    key={patient.id} 
                    className={`hover:bg-rose-50/50 transition-colors ${idx % 2 === 1 ? "bg-rose-50/20" : "bg-white"}`}
                  >
                    {/* Patient Name */}
                    <td className="py-2.5 px-4 font-bold">
                      <button
                        type="button"
                        onClick={() => handleOpenDetails(patient)}
                        className="text-rose-900 hover:text-rose-700 hover:underline text-left font-bold"
                      >
                        {patient.full_name}
                      </button>
                    </td>

                    {/* Patient / Passport No (UHID) */}
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-800">
                      {patient.uhid}
                    </td>

                    {/* Age */}
                    <td className="py-2.5 px-4 text-slate-700">
                      {patient.age_years ? `${patient.age_years} Yrs` : "-"}
                    </td>

                    {/* Email */}
                    <td className="py-2.5 px-4 text-slate-500 font-mono text-[11px]">
                      {patient.email || ""}
                    </td>

                    {/* Mobile */}
                    <td className="py-2.5 px-4 font-mono text-slate-800">
                      {patient.phone || "-"}
                    </td>

                    {/* Venue */}
                    <td className="py-2.5 px-4 text-slate-600 font-semibold text-[11px]">
                      {currentUser?.labName || "Diagnostic Laboratory"}
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenDetails(patient)}
                          className="px-2.5 py-1 rounded-md border border-rose-200 hover:border-rose-400 hover:bg-rose-50 text-[11px] font-semibold text-rose-900 transition-colors shadow-2xs"
                        >
                          Details
                        </button>
                        <button
                          type="button"
                          onClick={() => setBarcodePatient(patient)}
                          className="px-2.5 py-1 rounded-md border border-rose-200 hover:border-rose-400 hover:bg-rose-50 text-[11px] font-semibold text-rose-900 transition-colors flex items-center gap-1 shadow-2xs"
                        >
                          <Barcode className="w-3 h-3 text-rose-700" />
                          <span>Barcode</span>
                        </button>
                        <Link
                          href={`/lab/orders/new?patientId=${patient.id}`}
                          className="p-1 rounded-md border border-rose-300 bg-rose-100 hover:border-rose-400 hover:bg-rose-200 text-rose-900 transition-colors shadow-2xs"
                          title={`Create New Order for ${patient.full_name}`}
                        >
                          <PlusCircle className="w-3.5 h-3.5 text-rose-700" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Register Patient (👤 Register Patient) */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-[#5E1224] text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-rose-300" />
                <span className="font-bold text-sm tracking-tight">Register New Patient</span>
              </div>
              <button 
                type="button" 
                onClick={() => setShowRegisterModal(false)}
                className="text-rose-200/70 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Registration Form */}
            <form onSubmit={handleRegisterPatient} className="p-5 space-y-4 text-xs">
              {regSuccessMsg && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-900 font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{regSuccessMsg}</span>
                </div>
              )}

              {/* Title Prefix & Full Name */}
              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-3">
                  <label className="block text-slate-700 font-semibold mb-1">Prefix</label>
                  <select
                    value={prefix}
                    onChange={(e) => handleRegPrefixChange(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-2 text-xs text-slate-900 focus:outline-none focus:border-cyan-600"
                  >
                    <option value="Mr.">Mr.</option>
                    <option value="Mrs.">Mrs.</option>
                    <option value="Smt.">Smt.</option>
                    <option value="Ms.">Ms.</option>
                    <option value="Master">Master</option>
                    <option value="Baby">Baby</option>
                    <option value="Dr.">Dr.</option>
                  </select>
                </div>

                <div className="col-span-9">
                  <label className="block text-slate-700 font-semibold mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    placeholder="Patient's name (e.g. LATHA G M)"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-cyan-600"
                  />
                </div>
              </div>

              {/* Mobile Number & Gender */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Mobile Number <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-2 rounded-l-lg border border-r-0 border-slate-300 bg-slate-100 text-slate-600 text-xs font-semibold font-mono">
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={regMobile}
                      onChange={(e) => setRegMobile(e.target.value)}
                      placeholder="9876543210"
                      className="w-full bg-slate-50 border border-slate-300 rounded-r-lg px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-cyan-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Gender</label>
                  <select
                    value={regGender}
                    onChange={(e) => handleRegGenderChange(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-cyan-600"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              {/* Age (Years, Months) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Age (Years)</label>
                  <input
                    type="number"
                    min="0"
                    max="120"
                    value={regAgeYears}
                    onChange={(e) => setRegAgeYears(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-cyan-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Blood Group</label>
                  <select
                    value={regBloodGroup}
                    onChange={(e) => setRegBloodGroup(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-cyan-600"
                  >
                    <option value="">Unknown / None</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Email Address</label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="patient@example.com (optional)"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-cyan-600"
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Residential Address</label>
                <textarea
                  rows={2}
                  value={regAddress}
                  onChange={(e) => setRegAddress(e.target.value)}
                  placeholder="Street / City / Pin Code (optional)"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-cyan-600 resize-none"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={regLoading}
                  className="px-5 py-2 rounded-lg bg-[#5E1224] hover:bg-[#721C24] text-white font-bold shadow-xs transition-all flex items-center gap-1.5"
                >
                  {regLoading ? "Registering..." : "Register Patient"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Patient Barcode Sticker (Barcode button) */}
      {barcodePatient && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-[#5E1224] text-white px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Barcode className="w-4 h-4 text-rose-300" />
                <span className="font-bold text-xs tracking-tight">Patient UHID Barcode</span>
              </div>
              <button 
                type="button" 
                onClick={() => setBarcodePatient(null)}
                className="text-rose-200/70 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sticker Preview */}
            <div className="p-5 space-y-4">
              <div className="p-4 bg-white border-2 border-dashed border-rose-300 rounded-xl space-y-2 text-center text-black">
                <div className="font-black text-[11px] uppercase tracking-wider text-slate-900">
                  {(currentUser?.labName || "DIAGNOSTIC LABORATORY").toUpperCase()}
                </div>
                
                {/* Visual Barcode: Standard Real Code 128 */}
                <div className="py-1 flex flex-col items-center justify-center">
                  <BarcodeGenerator
                    id="patient-uhid-barcode-svg"
                    value={barcodePatient.uhid}
                    format="CODE128"
                    width={2}
                    height={52}
                    displayValue={true}
                    text={`*${barcodePatient.uhid}*`}
                    fontSize={14}
                    margin={4}
                  />
                </div>

                <div className="border-t border-slate-200 pt-1.5 text-xs text-left space-y-0.5">
                  <div className="font-bold text-slate-900 truncate">
                    {barcodePatient.full_name}
                  </div>
                  <div className="flex justify-between text-[11px] font-mono text-slate-700">
                    <span>{barcodePatient.age_years} Y / {barcodePatient.gender.slice(0, 1)}</span>
                    <span>Ph: {barcodePatient.phone}</span>
                  </div>
                </div>
              </div>

              {/* Print Action */}
              <button
                type="button"
                onClick={() => handlePrintBarcode(barcodePatient)}
                className="w-full py-2.5 rounded-xl bg-[#5E1224] hover:bg-[#721C24] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4 text-rose-200" />
                <span>Print Barcode Label</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Patient Details Profile (Details button) */}
      {selectedPatientForDetails && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-[#5E1224] text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-rose-300" />
                <span className="font-bold text-sm tracking-tight">Patient 360° Profile</span>
              </div>
              <button 
                type="button" 
                onClick={() => setSelectedPatientForDetails(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Demographics Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Patient Name</span>
                  <span className="font-bold text-slate-900 text-sm">{selectedPatientForDetails.full_name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">UHID / Patient No</span>
                  <span className="font-mono font-bold text-cyan-800">{selectedPatientForDetails.uhid}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Age &amp; Gender</span>
                  <span className="font-semibold text-slate-800">{selectedPatientForDetails.age_years} Yrs · {selectedPatientForDetails.gender}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Mobile Phone</span>
                  <span className="font-mono font-semibold text-slate-800">{selectedPatientForDetails.phone}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Email</span>
                  <span className="text-slate-700">{selectedPatientForDetails.email || "Not Provided"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Blood Group</span>
                  <span className="font-bold text-rose-700">{selectedPatientForDetails.blood_group || "N/A"}</span>
                </div>
              </div>

              {/* Order History */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1.5">
                  <span>Diagnostic Order History</span>
                  <Link
                    href={`/lab/orders/new?patientId=${selectedPatientForDetails.id}`}
                    className="text-xs text-cyan-700 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <span>+ Book New Test</span>
                  </Link>
                </div>

                {patientDetailsLoading ? (
                  <div className="py-6 text-center text-xs text-slate-400">Loading order records...</div>
                ) : patientOrderHistory.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400 bg-slate-50 border border-dashed border-slate-200 rounded-lg">
                    No past diagnostic orders found for this patient.
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-2">Order #</th>
                          <th className="p-2">Lab No</th>
                          <th className="p-2">Date</th>
                          <th className="p-2">Status</th>
                          <th className="p-2 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {patientOrderHistory.map((ord) => (
                          <tr key={ord.id} className="hover:bg-slate-50">
                            <td className="p-2 font-mono font-bold text-cyan-700">{ord.order_number}</td>
                            <td className="p-2 font-mono">{ord.lab_number}</td>
                            <td className="p-2 text-slate-500">{ord.created_at}</td>
                            <td className="p-2">
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                                {ord.status}
                              </span>
                            </td>
                            <td className="p-2 text-right font-mono font-bold text-slate-900">
                              ₹{ord.total_amount?.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Close Button */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedPatientForDetails(null)}
                  className="px-4 py-2 rounded-lg bg-[#5E1224] hover:bg-[#721C24] text-white text-xs font-bold transition-all"
                >
                  Close Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
