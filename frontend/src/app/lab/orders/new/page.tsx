"use client";

import { useState, useEffect, useMemo, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  FlaskConical, 
  Receipt, 
  Barcode, 
  Check, 
  Search, 
  X, 
  Printer, 
  CreditCard, 
  Banknote, 
  QrCode,
  FileText,
  UserCheck,
  Phone,
  User,
  Hash,
  Mail,
  MapPin,
  Lock,
  Stethoscope,
  Building2,
  Plus
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { INITIAL_TEST_CATALOG, DEPARTMENTS, DepartmentName, CatalogTestItem } from "@/lib/testCatalog";
import { 
  SHORTCUTS_BY_CODE, 
  matchesTestShortcut
} from "@/lib/testShortcuts";

function NewOrderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientIdParam = searchParams.get("patientId") || searchParams.get("patient_id");

  // Existing Patient linking state
  const [existingPatient, setExistingPatient] = useState<{
    id: string;
    uhid: string;
    full_name: string;
    phone: string;
    gender: string;
    age_years: number;
    age_months?: number;
    age_days?: number;
    email?: string | null;
    blood_group?: string | null;
    address?: string | null;
  } | null>(null);
  const [patientLoading, setPatientLoading] = useState(false);

  // Test catalog state
  const [catalog, setCatalog] = useState<CatalogTestItem[]>(INITIAL_TEST_CATALOG);
  const [selectedDept, setSelectedDept] = useState<DepartmentName>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [customPrices, setCustomPrices] = useState<Record<string, number>>({});
  const [showAllTests, setShowAllTests] = useState(false);

  // Fast keyboard feedback
  const [shortcutFeedback, setShortcutFeedback] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // AyusLab Patient Details State
  const [mobile, setMobile] = useState("");
  const [sendSms, setSendSms] = useState(true);
  const [prefix, setPrefix] = useState("Mr.");
  const [fullName, setFullName] = useState("");
  const [patientNo, setPatientNo] = useState("001");
  const [gender, setGender] = useState<"MALE" | "FEMALE" | "OTHER">("MALE");
  const [ageYears, setAgeYears] = useState("30");
  const [ageMonths, setAgeMonths] = useState("0");
  const [ageDays, setAgeDays] = useState("0");
  const [email, setEmail] = useState("");
  const [sendEmail, setSendEmail] = useState(false);
  const [bloodGroup, setBloodGroup] = useState("");
  const [address, setAddress] = useState("");

  // AyusLab Test Order Details State
  const [registrationType, setRegistrationType] = useState("Walk-in");
  const [doctorName, setDoctorName] = useState("Self / Direct");
  const [doctorsList, setDoctorsList] = useState<{ id: string; full_name: string }[]>([]);
  const [refCenter, setRefCenter] = useState("SAIBALAJI DIAGNOSTIC CENTER (Main Hub)");
  const [centersList, setCentersList] = useState<{ id: string; name: string }[]>([
    { id: "main", name: "SAIBALAJI DIAGNOSTIC CENTER (Main Hub)" },
    { id: "sec4", name: "Sai Balaji Collection Branch - Sector 4" },
    { id: "tieup", name: "Sai Balaji City Hospital Tie-up" },
  ]);

  // Modal states for New Doctor & New Center
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [newDoctorName, setNewDoctorName] = useState("");
  const [newDoctorClinic, setNewDoctorClinic] = useState("");
  const [newDoctorPhone, setNewDoctorPhone] = useState("");
  const [savingDoctor, setSavingDoctor] = useState(false);

  const [showCenterModal, setShowCenterModal] = useState(false);
  const [newCenterName, setNewCenterName] = useState("");
  const [newCenterPhone, setNewCenterPhone] = useState("");
  const [newCenterAddress, setNewCenterAddress] = useState("");
  const [savingCenter, setSavingCenter] = useState(false);

  // Modal states for New Custom Test
  const [showCustomTestModal, setShowCustomTestModal] = useState(false);
  const [customTestName, setCustomTestName] = useState("");
  const [customTestCode, setCustomTestCode] = useState("");
  const [customTestCategory, setCustomTestCategory] = useState<DepartmentName>("BIOCHEMISTRY");
  const [customTestSpecimen, setCustomTestSpecimen] = useState("Serum");
  const [customTestTube, setCustomTestTube] = useState("Yellow / Gel SST");
  const [customTestPrice, setCustomTestPrice] = useState("350");
  const [customTestUnit, setCustomTestUnit] = useState("");
  const [customTestRange, setCustomTestRange] = useState("");
  const [customAutoSelect, setCustomAutoSelect] = useState(true);
  const [savingCustomTest, setSavingCustomTest] = useState(false);
  const [labNo, setLabNo] = useState("23351");
  const [insurance, setInsurance] = useState("None / Self Pay");
  const [provisionalDiagnosis, setProvisionalDiagnosis] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [remark, setRemark] = useState("Normal Routine");
  const [orderDate, setOrderDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [isEmergency, setIsEmergency] = useState(false);
  const [isMedicoLegal, setIsMedicoLegal] = useState(false);

  // Billing state
  const [discount, setDiscount] = useState("0");
  const [paymentStatus, setPaymentStatus] = useState<"PAID" | "UNPAID">("PAID");
  const [paymentMethod, setPaymentMethod] = useState<"UPI" | "CASH" | "CARD">("UPI");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Auto-sync Prefix & Gender
  const handlePrefixChange = (newPrefix: string) => {
    setPrefix(newPrefix);
    if (newPrefix === "Mr." || newPrefix === "Master") {
      setGender("MALE");
    } else if (newPrefix === "Mrs." || newPrefix === "Ms." || newPrefix === "Smt.") {
      setGender("FEMALE");
    }
  };

  const handleGenderChange = (newGender: "MALE" | "FEMALE" | "OTHER") => {
    setGender(newGender);
    if (newGender === "MALE" && (prefix === "Mrs." || prefix === "Ms." || prefix === "Smt.")) {
      setPrefix("Mr.");
    } else if (newGender === "FEMALE" && (prefix === "Mr." || prefix === "Master")) {
      setPrefix("Mrs.");
    }
  };

  // Create new Doctor handler
  const handleCreateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newDoctorName.trim();
    if (!trimmed) return;
    setSavingDoctor(true);
    const fullNameFormatted = trimmed.toLowerCase().startsWith("dr.") ? trimmed : `Dr. ${trimmed}`;
    try {
      const res = await apiFetch("/patients/doctors", {
        method: "POST",
        body: JSON.stringify({
          full_name: fullNameFormatted,
          clinic_hospital_name: newDoctorClinic.trim() || undefined,
          phone: newDoctorPhone.trim() || undefined,
        })
      });
      const finalDoc = (res && res.full_name) ? res : { id: `doc-${Date.now()}`, full_name: fullNameFormatted };
      setDoctorsList((prev) => {
        if (prev.some((d) => d.id === finalDoc.id || d.full_name.toLowerCase() === finalDoc.full_name.toLowerCase())) {
          return prev;
        }
        return [...prev, finalDoc];
      });
      setDoctorName(finalDoc.full_name);
      setShowDoctorModal(false);
      setNewDoctorName("");
      setNewDoctorClinic("");
      setNewDoctorPhone("");
    } catch {
      const fallbackDoc = { id: `doc-${Date.now()}`, full_name: fullNameFormatted };
      setDoctorsList((prev) => [...prev, fallbackDoc]);
      setDoctorName(fallbackDoc.full_name);
      setShowDoctorModal(false);
      setNewDoctorName("");
      setNewDoctorClinic("");
      setNewDoctorPhone("");
    } finally {
      setSavingDoctor(false);
    }
  };

  // Create new Center handler
  const handleCreateCenter = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCenterName.trim();
    if (!trimmed) return;
    setSavingCenter(true);
    try {
      const res = await apiFetch("/patients/branches", {
        method: "POST",
        body: JSON.stringify({
          name: trimmed,
          phone: newCenterPhone.trim() || undefined,
          address: newCenterAddress.trim() || undefined,
        })
      });
      const finalCenter = (res && res.name) ? res : { id: `center-${Date.now()}`, name: trimmed };
      setCentersList((prev) => {
        if (prev.some((c) => c.id === finalCenter.id || c.name.toLowerCase() === finalCenter.name.toLowerCase())) {
          return prev;
        }
        return [...prev, finalCenter];
      });
      setRefCenter(finalCenter.name);
      setShowCenterModal(false);
      setNewCenterName("");
      setNewCenterPhone("");
      setNewCenterAddress("");
    } catch {
      const fallbackCenter = { id: `center-${Date.now()}`, name: trimmed };
      setCentersList((prev) => [...prev, fallbackCenter]);
      setRefCenter(trimmed);
      setShowCenterModal(false);
      setNewCenterName("");
      setNewCenterPhone("");
      setNewCenterAddress("");
    } finally {
      setSavingCenter(false);
    }
  };

  // Create new Custom Test handler
  const handleCreateCustomTest = async (e: React.FormEvent) => {
    e.preventDefault();
    const nameTrimmed = customTestName.trim();
    if (!nameTrimmed) return;
    setSavingCustomTest(true);
    const priceVal = parseFloat(customTestPrice) || 350;
    try {
      const res = await apiFetch("/tests", {
        method: "POST",
        body: JSON.stringify({
          name: nameTrimmed,
          code: customTestCode.trim() || undefined,
          category_name: customTestCategory,
          specimen_type: customTestSpecimen,
          tube_color: customTestTube,
          standard_price: priceVal,
          unit: customTestUnit.trim() || undefined,
          reference_range: customTestRange.trim() || undefined,
        })
      });

      const newTestItem: CatalogTestItem = {
        id: res?.id || `custom-${Date.now()}`,
        code: res?.code || (customTestCode.trim().toUpperCase() || nameTrimmed.slice(0, 6).toUpperCase()),
        name: res?.name || nameTrimmed,
        category: (res?.category_name as DepartmentName) || customTestCategory,
        tube: res?.tube_color || customTestTube,
        specimen: res?.specimen_type || customTestSpecimen,
        price: res?.standard_price || priceVal
      };

      setCatalog((prev) => {
        if (prev.some((t) => t.code === newTestItem.code)) return prev;
        return [newTestItem, ...prev];
      });

      if (customAutoSelect) {
        setSelectedCodes((prev) => {
          if (prev.includes(newTestItem.code)) return prev;
          return [...prev, newTestItem.code];
        });
      }

      setShowCustomTestModal(false);
      setCustomTestName("");
      setCustomTestCode("");
      setCustomTestUnit("");
      setCustomTestRange("");
      setCustomTestPrice("350");
    } catch {
      const fallbackCode = customTestCode.trim().toUpperCase() || `CUST_${Date.now().toString().slice(-4)}`;
      const fallbackItem: CatalogTestItem = {
        id: `custom-${Date.now()}`,
        code: fallbackCode,
        name: nameTrimmed,
        category: customTestCategory,
        tube: customTestTube,
        specimen: customTestSpecimen,
        price: priceVal
      };
      setCatalog((prev) => [fallbackItem, ...prev]);
      if (customAutoSelect) {
        setSelectedCodes((prev) => [...prev, fallbackItem.code]);
      }
      setShowCustomTestModal(false);
      setCustomTestName("");
      setCustomTestCode("");
      setCustomTestUnit("");
      setCustomTestRange("");
    } finally {
      setSavingCustomTest(false);
    }
  };

  // Keyboard shortcut listener: Press '/' or 'Ctrl+K' to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === "/" && (e.target as HTMLElement).tagName !== "INPUT" && (e.target as HTMLElement).tagName !== "TEXTAREA") ||
        (e.ctrlKey && e.key.toLowerCase() === "k")
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Load catalog from backend API if available
  useEffect(() => {
    let isMounted = true;
    apiFetch("/tests")
      .then((data: any) => {
        if (isMounted && Array.isArray(data) && data.length > 0) {
          const uniqueMap = new Map<string, any>();
          for (const item of data) {
            const c = (item.code || "").toUpperCase();
            if (c && !uniqueMap.has(c)) {
              uniqueMap.set(c, item);
            }
          }
          const mapped: CatalogTestItem[] = Array.from(uniqueMap.values())
            .filter((t: any) => t.code !== "CBC_141" && !t.code?.includes("141"))
            .map((t: any) => ({
              id: t.id,
              code: t.code,
              name: t.name,
              category: t.category_name,
              tube: t.tube_color || "Yellow / Gel SST",
              specimen: t.specimen_type || "Serum",
              price: t.standard_price || 350
            }));
          setCatalog(mapped);
        }
      })
      .catch(() => {
        // Fallback already pre-loaded from INITIAL_TEST_CATALOG
      });

    // Load doctors from backend
    apiFetch("/patients/doctors")
      .then((data: any) => {
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setDoctorsList(data);
        }
      })
      .catch(() => {});

    // Load branches / referral centers from backend
    apiFetch("/patients/branches")
      .then((data: any) => {
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setCentersList(data);
          if (data[0]?.name) {
            setRefCenter(data[0].name);
          }
        }
      })
      .catch(() => {});

    // Compute next sequential Patient No (starting from 001) & Lab No only if not an existing patient
    apiFetch("/patients")
      .then((data: any) => {
        if (isMounted && Array.isArray(data) && !patientIdParam) {
          const nextSeq = data.length + 1;
          setPatientNo(String(nextSeq).padStart(3, "0"));
        }
      })
      .catch(() => {});

    apiFetch("/orders")
      .then((data: any) => {
        if (isMounted && Array.isArray(data)) {
          setLabNo((23351 + data.length).toString());
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [patientIdParam]);

  // Helper to populate patient fields from an existing patient record
  const applyPatientData = (p: any) => {
    setExistingPatient(p);
    setPatientNo(p.uhid || "");

    // Parse prefix and full name
    const rawName = (p.full_name || "").trim();
    const prefixes = ["Mr.", "Mrs.", "Smt.", "Ms.", "Master", "Baby", "Dr."];
    let matchedPrefix = "Mr.";
    let namePart = rawName;
    for (const pref of prefixes) {
      if (rawName.startsWith(pref + " ")) {
        matchedPrefix = pref;
        namePart = rawName.substring(pref.length + 1).trim();
        break;
      }
    }
    setPrefix(matchedPrefix);
    setFullName(namePart);

    // Clean phone number (strip +91 or any non-digit chars, take 10 digits)
    const digitsOnly = (p.phone || "").replace(/\D/g, "");
    const phone10 = digitsOnly.length > 10 ? digitsOnly.slice(-10) : digitsOnly;
    setMobile(phone10);

    // Gender
    const gUpper = (p.gender || "").toUpperCase();
    if (gUpper === "MALE" || gUpper === "FEMALE" || gUpper === "OTHER") {
      setGender(gUpper as any);
    }

    // Age
    setAgeYears((p.age_years ?? "").toString());
    setAgeMonths((p.age_months ?? "0").toString());
    setAgeDays((p.age_days ?? "0").toString());

    // Optional email & address
    if (p.email) {
      setEmail(p.email);
      setSendEmail(true);
    }
    if (p.blood_group) {
      setBloodGroup(p.blood_group);
    }
    if (p.address) {
      setAddress(p.address);
    }
  };

  // Clear existing patient linkage and restore blank inputs
  const clearExistingPatient = () => {
    setExistingPatient(null);
    setFullName("");
    setMobile("");
    setEmail("");
    setAddress("");
    setBloodGroup("");
    apiFetch("/patients").then((data: any) => {
      if (Array.isArray(data)) {
        const nextSeq = data.length + 1;
        setPatientNo(String(nextSeq).padStart(3, "0"));
      }
    }).catch(() => {});
  };

  // Load existing patient when patientId is present in URL
  useEffect(() => {
    if (patientIdParam) {
      setPatientLoading(true);
      apiFetch(`/patients/${patientIdParam}`)
        .then((data: any) => {
          if (data && data.patient) {
            applyPatientData(data.patient);
          }
        })
        .catch((err) => {
          console.warn("Failed to load patient from URL param:", err);
        })
        .finally(() => {
          setPatientLoading(false);
        });
    }
  }, [patientIdParam]);

  // Auto-lookup existing patient by 10-digit mobile number if not already linked
  useEffect(() => {
    if (existingPatient || mobile.length !== 10) return;
    const timer = setTimeout(() => {
      apiFetch(`/patients?phone=${mobile}`)
        .then((data: any) => {
          if (Array.isArray(data) && data.length > 0) {
            applyPatientData(data[0]);
          }
        })
        .catch(() => {});
    }, 400);
    return () => clearTimeout(timer);
  }, [mobile, existingPatient]);

  // Quick toggle a test
  const toggleTest = (code: string) => {
    setSelectedCodes(prev => {
      if (prev.includes(code)) {
        setCustomPrices(cp => {
          const next = { ...cp };
          delete next[code];
          return next;
        });
        return prev.filter(c => c !== code);
      } else {
        return [...prev, code];
      }
    });
  };

  // Clear all selections
  const clearSelection = () => {
    setSelectedCodes([]);
    setCustomPrices({});
  };

  // Handle price change for a specific test
  const handlePriceChange = (code: string, value: string) => {
    const num = parseFloat(value);
    setCustomPrices(prev => ({
      ...prev,
      [code]: isNaN(num) ? 0 : Math.max(0, num)
    }));
  };

  // Filtered tests with ranking: exact shortcut/code matches rank highest!
  const filteredTests = useMemo(() => {
    const activeCatalog = catalog.filter(t => t.code !== "CBC_141" && !t.code?.includes("141"));
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      return activeCatalog.filter(t => selectedDept === "ALL" || t.category === selectedDept);
    }
    // Auto-search across ALL departments when search term is active!
    const matched = activeCatalog.filter(t => matchesTestShortcut(t, term));
    return matched.sort((a, b) => {
      const aCode = a.code.toLowerCase();
      const bCode = b.code.toLowerCase();
      const aShortcuts = (SHORTCUTS_BY_CODE[a.code] || []).map(s => s.toLowerCase());
      const bShortcuts = (SHORTCUTS_BY_CODE[b.code] || []).map(s => s.toLowerCase());

      const aExact = aCode === term || aShortcuts.includes(term);
      const bExact = bCode === term || bShortcuts.includes(term);
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;

      const aStarts = aCode.startsWith(term) || a.name.toLowerCase().startsWith(term);
      const bStarts = bCode.startsWith(term) || b.name.toLowerCase().startsWith(term);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;

      return 0;
    });
  }, [catalog, selectedDept, searchTerm]);

  // Fast keyboard selection: Pressing Enter selects top matched test
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (filteredTests.length > 0) {
        const topTest = filteredTests[0];
        toggleTest(topTest.code);
        const primarySc = SHORTCUTS_BY_CODE[topTest.code]?.[0] || topTest.code;
        const isNowSelected = !selectedCodes.includes(topTest.code);
        setShortcutFeedback(isNowSelected ? `Added ${primarySc} (${topTest.name})` : `Removed ${primarySc}`);
        setTimeout(() => setShortcutFeedback(null), 3000);
        searchInputRef.current?.select();
      }
    } else if (e.key === "Escape") {
      setSearchTerm("");
    }
  };

  // Group filtered tests by category for organized multi-column view
  const groupedTests = useMemo(() => {
    const groups: Record<string, CatalogTestItem[]> = {};
    for (const test of filteredTests) {
      if (!groups[test.category]) {
        groups[test.category] = [];
      }
      groups[test.category].push(test);
    }
    return groups;
  }, [filteredTests]);

  // Selected test objects & totals
  const selectedTestObjects = useMemo(() => {
    const codeMap = new Map(catalog.map(t => [t.code, t]));
    return selectedCodes.map(code => codeMap.get(code)).filter(Boolean) as CatalogTestItem[];
  }, [catalog, selectedCodes]);

  const actualCatalogTotal = useMemo(() => {
    return selectedTestObjects.reduce((acc, t) => acc + t.price, 0);
  }, [selectedTestObjects]);

  const subtotal = useMemo(() => {
    return selectedTestObjects.reduce((acc, t) => {
      const price = customPrices[t.code] !== undefined ? customPrices[t.code] : t.price;
      return acc + price;
    }, 0);
  }, [selectedTestObjects, customPrices]);

  const discountVal = parseFloat(discount) || 0;
  const netTotal = Math.max(0, subtotal - discountVal);

  // Group tubes needed
  const tubesNeeded = useMemo(() => {
    const tubeMap: Record<string, number> = {};
    for (const test of selectedTestObjects) {
      tubeMap[test.tube] = (tubeMap[test.tube] || 0) + 1;
    }
    return Object.entries(tubeMap).map(([tube, count]) => ({ tube, count }));
  }, [selectedTestObjects]);

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !mobile) {
      alert("Please provide patient name and mobile number.");
      return;
    }
    if (selectedCodes.length === 0) {
      alert("Please select at least one laboratory test.");
      return;
    }

    const composedFullName = `${prefix} ${fullName.trim()}`.trim();
    const combinedHistory = [
      provisionalDiagnosis ? `Diagnosis: ${provisionalDiagnosis}` : null,
      orderNotes ? `Notes: ${orderNotes}` : null,
      remark && remark !== "Select Remark" ? `Remark: ${remark}` : null,
      insurance && insurance !== "None / Self Pay" ? `Insurance: ${insurance}` : null,
      refCenter ? `Ref Center: ${refCenter}` : null,
      doctorName ? `Ref By: ${doctorName}` : null,
      isEmergency ? `[EMERGENCY STAT]` : null,
      isMedicoLegal ? `[MEDICO-LEGAL CASE]` : null,
    ].filter(Boolean).join(" | ");

    setLoading(true);
    try {
      const customPriceMap: Record<string, number> = {};
      for (const t of selectedTestObjects) {
        if (customPrices[t.code] !== undefined) {
          customPriceMap[t.id] = customPrices[t.code];
        }
      }

      const orderPayload: any = {
        test_ids: selectedTestObjects.map(t => t.id),
        custom_prices: Object.keys(customPriceMap).length > 0 ? customPriceMap : undefined,
        total_amount: subtotal,
        clinical_history: combinedHistory || undefined,
        discount_amount: discountVal,
        payment_method: paymentMethod,
        initial_payment: paymentStatus === "PAID" ? netTotal : 0
      };

      if (existingPatient) {
        orderPayload.patient_id = existingPatient.id;
      } else {
        orderPayload.new_patient = {
          full_name: composedFullName,
          phone: mobile.trim(),
          gender: gender,
          age_years: parseInt(ageYears) || 0,
          age_months: parseInt(ageMonths) || 0,
          age_days: parseInt(ageDays) || 0,
          email: email.trim() || undefined,
          blood_group: bloodGroup || undefined,
          address: address.trim() || undefined
        };
      }

      const newOrder = await apiFetch("/orders", {
        method: "POST",
        body: JSON.stringify(orderPayload)
      });
      setSuccess(true);
      setTimeout(() => {
        if (newOrder && newOrder.id) {
          router.push(`/lab/technician?orderId=${newOrder.id}`);
        } else {
          router.push("/lab/technician");
        }
      }, 1000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to register order. Please verify backend connection.");
    } finally {
      setLoading(false);
    }
  };

  // Helper for tube pill colors
  const getTubeBadgeStyle = (tube: string) => {
    if (tube.includes("Lavender") || tube.includes("EDTA")) {
      return "bg-purple-100 text-purple-800 border-purple-200";
    }
    if (tube.includes("Yellow") || tube.includes("SST")) {
      return "bg-amber-100 text-amber-900 border-amber-200";
    }
    if (tube.includes("Gray") || tube.includes("Fluoride")) {
      return "bg-slate-200 text-slate-800 border-slate-300";
    }
    if (tube.includes("Blue") || tube.includes("Citrate")) {
      return "bg-sky-100 text-sky-800 border-sky-200";
    }
    if (tube.includes("Container") || tube.includes("Sterile")) {
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    }
    if (tube.includes("Formalin")) {
      return "bg-rose-100 text-rose-800 border-rose-200";
    }
    return "bg-slate-100 text-slate-700 border-slate-200";
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Bill-First Patient Intake &amp; Test Booking
            </h1>
            <span className="text-[11px] font-bold bg-rose-100 text-rose-900 border border-rose-300 px-2.5 py-0.5 rounded-full">
              Full 260+ Test Catalog
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Register patient, select from 10 clinical departments, calculate live bill, and auto-generate vacutainer barcodes.
          </p>
        </div>
      </div>

      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-sm flex items-center gap-3 shadow-xs">
          <Check className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <div className="font-bold">Order Registered Successfully!</div>
            <div className="text-xs text-emerald-700">
              Accession created with {selectedTestObjects.length} tests and {tubesNeeded.length} required specimen tubes. Redirecting to technician bench...
            </div>
          </div>
        </div>
      )}

      {/* Main Layout: Full-Width Clinical Workflow (Patient Intake -> Test Catalog -> Billing & Settlement) */}
      <form onSubmit={handleSubmit} className="space-y-4">
          {/* AyusLab Top Breadcrumb */}
          <div className="flex items-center justify-between bg-[#FFF0F4] border border-rose-200/90 px-4 py-2.5 rounded-lg shadow-2xs">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 tracking-wide">
              <span className="text-slate-500">🏠</span>
              <span className="text-rose-400">➦</span>
              <span className="tracking-wider">NEW ORDER</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => router.push("/lab/dashboard")}
                className="text-xs text-slate-400 hover:text-rose-700 p-1 transition-colors"
                title="Orders Dashboard"
              >
                <FileText className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Section 1: Patient Details (Pale Pink Form Box) */}
          <div className="p-5 rounded-xl bg-[#FFF0F4] border border-rose-200/90 shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between border-b border-rose-200/60 pb-2.5">
              <div className="text-xs font-bold text-slate-800 tracking-wide flex items-center gap-2">
                <span>Patient Details</span>
                {existingPatient && (
                  <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full font-bold">
                    <UserCheck className="w-3 h-3 text-emerald-600" /> Existing Patient Linked ({existingPatient.uhid})
                  </span>
                )}
                {patientLoading && (
                  <span className="text-[10px] text-rose-600 font-semibold animate-pulse">
                    Loading existing patient profile...
                  </span>
                )}
              </div>
              {existingPatient && (
                <button
                  type="button"
                  onClick={clearExistingPatient}
                  className="text-[10px] text-slate-500 hover:text-rose-600 font-medium underline"
                >
                  Clear / Register as New Patient
                </button>
              )}
            </div>

            {existingPatient && (
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-lg px-3 py-2 text-xs text-emerald-900 flex items-center justify-between">
                <div>
                  Existing record for <strong>{prefix} {fullName}</strong> · Mobile: <strong className="font-mono">{mobile}</strong> · UHID: <strong className="font-mono">{existingPatient.uhid}</strong>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                  All Details Auto-Filled
                </span>
              </div>
            )}

            {/* Structured 2-Row Patient Demographics & Identification Grid */}
            <div className="space-y-3">
              {/* Row 1: Primary Demographics (Mobile, Name with Prefix, Gender, Age) */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                {/* Mobile with +91 prefix and inline SMS Alert toggle */}
                <div className="sm:col-span-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-rose-600" /> Mobile <span className="text-rose-500">*</span>
                    </label>
                    <label className="inline-flex items-center gap-1 text-[10px] text-slate-500 cursor-pointer font-medium hover:text-rose-700 select-none">
                      <input
                        id="send-sms"
                        type="checkbox"
                        checked={sendSms}
                        onChange={(e) => setSendSms(e.target.checked)}
                        className="w-3 h-3 rounded border-rose-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                      />
                      <span>SMS Alert</span>
                    </label>
                  </div>
                  <div className="flex h-9 rounded-lg border border-rose-200 overflow-hidden bg-white focus-within:ring-2 focus-within:ring-rose-400/20 focus-within:border-rose-400">
                    <span className="inline-flex items-center px-2.5 bg-rose-50/60 border-r border-rose-200 text-slate-700 text-xs font-mono font-medium select-none">
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      placeholder="Phone number"
                      className="w-full h-full px-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                {/* Patient Salutation & Full Name (Integrated Compound Field) */}
                <div className="sm:col-span-4 space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-700">
                    <span className="inline-flex items-center gap-1">
                      <User className="w-3 h-3 text-rose-600" /> Patient Name <span className="text-rose-500">*</span>
                    </span>
                  </label>
                  <div className="flex h-9 rounded-lg border border-rose-200 overflow-hidden bg-white focus-within:ring-2 focus-within:ring-rose-400/20 focus-within:border-rose-400">
                    <select
                      value={prefix}
                      onChange={(e) => handlePrefixChange(e.target.value)}
                      className="bg-rose-50/60 border-r border-rose-200 px-2 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                      title="Salutation"
                    >
                      <option value="Mr.">Mr.</option>
                      <option value="Mrs.">Mrs.</option>
                      <option value="Smt.">Smt.</option>
                      <option value="Ms.">Ms.</option>
                      <option value="Master">Master</option>
                      <option value="Baby">Baby</option>
                      <option value="Dr.">Dr.</option>
                    </select>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter Full Name"
                      className="w-full h-full px-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none font-medium"
                    />
                  </div>
                </div>

                {/* Gender */}
                <div className="sm:col-span-2 space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-700">
                    Gender <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => handleGenderChange(e.target.value as any)}
                    className="w-full h-9 bg-white border border-rose-200 rounded-lg px-2 text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-rose-400/20 focus:border-rose-400 cursor-pointer"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                {/* Age (Years, Months, Days side-by-side with crisp badges) */}
                <div className="sm:col-span-3 space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-700">
                    Age (Years / Mos / Days)
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 h-9">
                    <div className="relative h-full">
                      <input
                        type="number"
                        min="0"
                        max="125"
                        placeholder="0"
                        value={ageYears}
                        onChange={(e) => setAgeYears(e.target.value)}
                        className="w-full h-full bg-white border border-rose-200 rounded-lg pl-1.5 pr-4 text-xs text-center text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-rose-400/20 focus:border-rose-400"
                        title="Age in Years"
                      />
                      <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] font-semibold text-slate-400 pointer-events-none select-none">
                        Y
                      </span>
                    </div>
                    <div className="relative h-full">
                      <input
                        type="number"
                        min="0"
                        max="11"
                        placeholder="0"
                        value={ageMonths}
                        onChange={(e) => setAgeMonths(e.target.value)}
                        className="w-full h-full bg-white border border-rose-200 rounded-lg pl-1.5 pr-4 text-xs text-center text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-rose-400/20 focus:border-rose-400"
                        title="Age in Months"
                      />
                      <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] font-semibold text-slate-400 pointer-events-none select-none">
                        M
                      </span>
                    </div>
                    <div className="relative h-full">
                      <input
                        type="number"
                        min="0"
                        max="31"
                        placeholder="0"
                        value={ageDays}
                        onChange={(e) => setAgeDays(e.target.value)}
                        className="w-full h-full bg-white border border-rose-200 rounded-lg pl-1.5 pr-4 text-xs text-center text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-rose-400/20 focus:border-rose-400"
                        title="Age in Days"
                      />
                      <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] font-semibold text-slate-400 pointer-events-none select-none">
                        D
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 2: Secondary Identifiers & Contact (UHID, Email, Blood Group, Address) */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end pt-1">
                {/* Patient UHID / No (Auto-assigned, Non-editable) */}
                <div className="sm:col-span-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                      <Hash className="w-3 h-3 text-rose-600" /> Patient No / UHID <span className="text-rose-500">*</span>
                    </label>
                    <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 uppercase tracking-wider">
                      <Lock className="w-2.5 h-2.5" />
                      {existingPatient ? "Existing" : "Auto"}
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={patientNo}
                      readOnly
                      tabIndex={-1}
                      className={`w-full h-9 rounded-lg pl-3 pr-8 text-xs font-mono font-bold cursor-not-allowed select-none focus:outline-none transition-colors ${
                        existingPatient 
                          ? "bg-emerald-50/80 border border-emerald-300 text-emerald-900" 
                          : "bg-slate-100 border border-slate-300 text-slate-800"
                      }`}
                      title="Patient UHID is auto-generated and permanently locked (non-editable)"
                    />
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>

                {/* Email with Send Email Checkbox */}
                <div className="sm:col-span-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                      <Mail className="w-3 h-3 text-rose-600" /> Email
                    </label>
                    <label className="inline-flex items-center gap-1 text-[10px] text-slate-500 cursor-pointer font-medium hover:text-rose-700 select-none">
                      <input
                        id="send-email"
                        type="checkbox"
                        checked={sendEmail}
                        onChange={(e) => setSendEmail(e.target.checked)}
                        className="w-3 h-3 rounded border-rose-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                      />
                      <span>Email PDF</span>
                    </label>
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="patient@example.com"
                    className="w-full h-9 bg-white border border-rose-200 rounded-lg px-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-400/20 focus:border-rose-400"
                  />
                </div>

                {/* Blood Group */}
                <div className="sm:col-span-2 space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-700">
                    Blood Group
                  </label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="w-full h-9 bg-white border border-rose-200 rounded-lg px-2 text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-rose-400/20 focus:border-rose-400 cursor-pointer"
                  >
                    <option value="">Select Group</option>
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

                {/* Residential Address */}
                <div className="sm:col-span-4 space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-rose-600" /> Residential Address
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="House/Flat No, Street, Landmark, City"
                    className="w-full h-9 bg-white border border-rose-200 rounded-lg px-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-400/20 focus:border-rose-400"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Test Order Details (Exact AyusLab Box) */}
          <div className="p-5 rounded-xl bg-[#FFF0F4] border border-rose-200/90 shadow-2xs space-y-3.5">
            <div className="text-xs font-bold text-slate-800 tracking-wide border-b border-rose-200/60 pb-2.5">
              Test Order Details
            </div>

            {/* Row 1: Registration Type, Referred By, Ref Center, Lab No */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5 items-end">
              {/* Registration Type */}
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-700">
                  Registration Type
                </label>
                <select
                  value={registrationType}
                  onChange={(e) => setRegistrationType(e.target.value)}
                  className="w-full h-9 bg-white border border-rose-200 rounded-lg px-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-rose-400/20 focus:border-rose-400 cursor-pointer"
                >
                  <option value="Walk-in">Walk-in</option>
                  <option value="Home Collection">Home Collection</option>
                  <option value="Out-Patient (OP)">Out-Patient (OP)</option>
                  <option value="In-Patient (IP)">In-Patient (IP)</option>
                  <option value="Corporate B2B">Corporate B2B</option>
                </select>
              </div>

              {/* Select Referred By Doctor */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-slate-700">
                    Referred By
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowDoctorModal(true)}
                    className="text-[10px] font-bold text-rose-700 hover:text-rose-800 hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <Plus className="w-2.5 h-2.5" /> New Doctor
                  </button>
                </div>
                <select
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  className="w-full h-9 bg-white border border-rose-200 rounded-lg px-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-rose-400/20 focus:border-rose-400 cursor-pointer"
                >
                  <option value="Self / Direct">Select Referred By (Self / Direct)</option>
                  {doctorsList.map((doc) => (
                    <option key={doc.id} value={doc.full_name}>
                      {doc.full_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Ref. Center */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-slate-700">
                    Ref Center
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowCenterModal(true)}
                    className="text-[10px] font-bold text-rose-700 hover:text-rose-800 hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <Plus className="w-2.5 h-2.5" /> New Center
                  </button>
                </div>
                <select
                  value={refCenter}
                  onChange={(e) => setRefCenter(e.target.value)}
                  className="w-full h-9 bg-white border border-rose-200 rounded-lg px-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-rose-400/20 focus:border-rose-400 cursor-pointer truncate"
                >
                  {centersList.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Lab No */}
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-700">
                  Lab Accession No
                </label>
                <input
                  type="text"
                  value={labNo}
                  onChange={(e) => setLabNo(e.target.value)}
                  className="w-full h-9 bg-rose-50/50 border border-rose-200 rounded-lg px-2.5 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-rose-400/20 focus:border-rose-400"
                />
              </div>
            </div>

            {/* Row 2: Enter Lab Test Name + Insurance + Live Total Price */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-3 pt-2.5 border-t border-rose-200/60">
              <div className="flex items-center gap-2 w-full md:w-auto flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-rose-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    placeholder="Search test name or shortcut (e.g. CBC, LFT, FBS)..."
                    className="w-full h-9 bg-white border border-rose-200 rounded-lg pl-9 pr-12 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-400/20 focus:border-rose-400 font-medium"
                  />
                  {searchTerm ? (
                    <button
                      type="button"
                      onClick={() => setSearchTerm("")}
                      className="text-slate-400 hover:text-rose-700 absolute right-2.5 top-1/2 -translate-y-1/2 p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <span className="text-[10px] font-mono text-rose-700 bg-rose-100/70 px-1.5 py-0.5 rounded border border-rose-200 absolute right-2.5 top-1/2 -translate-y-1/2">
                      /
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowAllTests((prev) => !prev);
                    if (!showAllTests) {
                      setSelectedDept("ALL");
                    }
                  }}
                  className={`h-9 px-3 rounded-lg border text-[11px] font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                    showAllTests
                      ? "bg-rose-700 text-white border-rose-800 shadow-xs"
                      : "bg-white hover:bg-rose-50 text-rose-900 border-rose-300"
                  }`}
                  title={showAllTests ? "Click to collapse test catalog" : "Click to view all tests"}
                >
                  <FlaskConical className="w-3.5 h-3.5" />
                  <span>{showAllTests ? "▲ Hide Tests" : `▼ View All Tests (${catalog.length})`}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowCustomTestModal(true)}
                  className="h-9 px-3.5 rounded-lg bg-[#5E1224] hover:bg-[#721C24] text-white text-[11px] font-bold shadow-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                  title="Add an additional test manually to catalog and current order"
                >
                  <Plus className="w-3.5 h-3.5 text-rose-200" />
                  <span>+ Add New Test</span>
                </button>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto shrink-0">
                <select
                  value={insurance}
                  onChange={(e) => setInsurance(e.target.value)}
                  className="h-9 bg-white border border-rose-200 rounded-lg px-2.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-400/20 focus:border-rose-400 cursor-pointer"
                >
                  <option value="None / Self Pay">Insurance: None (Self Pay)</option>
                  <option value="Star Health Insurance">Star Health Insurance</option>
                  <option value="MediAssist TPA">MediAssist TPA</option>
                  <option value="Ayushman Bharat (PM-JAY)">Ayushman Bharat (PM-JAY)</option>
                  <option value="HDFC ERGO Health">HDFC ERGO Health</option>
                  <option value="CGHS Govt Scheme">CGHS Govt Scheme</option>
                </select>

                <div className="h-9 px-3.5 rounded-lg bg-rose-100 border border-rose-300 flex items-center gap-2 shrink-0">
                  <span className="text-xs font-semibold text-rose-900">Live Total:</span>
                  <span className="font-mono text-sm font-black text-rose-950">₹{netTotal.toFixed(0)}</span>
                </div>
              </div>
            </div>

            {/* Keyboard Feedback Toast */}
            {shortcutFeedback && (
              <div className="bg-[#5E1224] text-white text-xs px-3 py-1.5 rounded-lg flex items-center justify-between font-mono font-bold shadow-xs border border-[#721C24]">
                <span className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-rose-300 shrink-0" />
                  <span>{shortcutFeedback}</span>
                </span>
                <span className="text-[10px] text-rose-200/80 font-sans font-normal">
                  Type next shortcut &amp; hit Enter
                </span>
              </div>
            )}

            {/* Collapsible Test Catalog & Department Tabs */}
            {(showAllTests || searchTerm.trim().length > 0) ? (
              <div className="space-y-3 pt-1 animate-in fade-in slide-in-from-top-2 duration-150">
                {/* Department Filter Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs border-b border-rose-200/60 no-scrollbar">
                  {DEPARTMENTS.map((dept) => {
                    const count = dept === "ALL" 
                      ? catalog.length 
                      : catalog.filter(t => t.category === dept).length;
                    const isActive = selectedDept === dept;
                    return (
                      <button
                        key={dept}
                        type="button"
                        onClick={() => setSelectedDept(dept)}
                        className={`px-2.5 py-1 rounded-md whitespace-nowrap text-xs font-semibold transition-all flex items-center gap-1.5 ${
                          isActive 
                            ? "bg-rose-700 text-white shadow-xs" 
                            : "bg-white hover:bg-rose-50 text-slate-700 border border-rose-200"
                        }`}
                      >
                        <span>{dept}</span>
                        <span className={`text-[10px] px-1 py-0.2 rounded-full font-mono ${
                          isActive ? "bg-white/20 text-white" : "bg-rose-100 text-rose-800"
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Test Cards Grid */}
                <div className="max-h-[460px] overflow-y-auto pr-1 space-y-5">
                  {Object.keys(groupedTests).length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      No tests found matching &quot;{searchTerm}&quot;. Try typing a shortcut like <b>CBC</b>, <b>LFT</b>, <b>KFT</b>, <b>MCH</b>, or <b>FBS</b>.
                    </div>
                  ) : (
                    Object.entries(groupedTests).map(([category, tests]) => (
                      <div key={category} className="space-y-2">
                        <div className="sticky top-0 bg-[#FFF0F4]/95 backdrop-blur-xs py-1 z-10 border-b border-rose-200/80 flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-2">
                            <FlaskConical className="w-3.5 h-3.5 text-rose-600" />
                            {category}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500 font-semibold">
                            {tests.length} tests
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 pt-0.5">
                          {tests.map((test) => {
                            const isSelected = selectedCodes.includes(test.code);
                            const shortcuts = SHORTCUTS_BY_CODE[test.code] || [];
                            const primaryShortcut = shortcuts[0];
                            return (
                              <label
                                key={test.id || test.code}
                                className={`p-2.5 rounded-lg border flex items-start gap-2 cursor-pointer select-none transition-all ${
                                  isSelected
                                    ? "bg-rose-50 border-rose-500 text-rose-950 shadow-2xs font-semibold"
                                    : "bg-white border-rose-200/80 hover:border-rose-300 text-slate-800 hover:bg-rose-50/50"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleTest(test.code)}
                                  className="w-3.5 h-3.5 mt-0.5 rounded border-rose-300 text-rose-600 focus:ring-rose-500 shrink-0 cursor-pointer"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1 mb-0.5 flex-wrap">
                                    <span className={`text-[9px] font-mono font-bold px-1 py-0.2 rounded border shrink-0 ${
                                      isSelected 
                                        ? "bg-white text-rose-900 border-rose-300 shadow-2xs" 
                                        : "bg-rose-50/80 text-slate-700 border-rose-200/80 shadow-2xs"
                                    }`}>
                                      {primaryShortcut || test.code}
                                    </span>
                                  </div>
                                  <div className="text-xs font-bold leading-snug line-clamp-2 text-slate-900" title={test.name}>
                                    {test.name}
                                  </div>
                                  <div className="flex items-center justify-between gap-1 mt-1.5 flex-wrap">
                                    <span className={`text-[9px] px-1.5 py-0.2 rounded border font-mono ${getTubeBadgeStyle(test.tube)}`}>
                                      {test.tube.split("/")[0]}
                                    </span>
                                    <span className="text-xs font-mono font-bold text-slate-900">
                                      ₹{test.price}
                                    </span>
                                  </div>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              /* Compact Banner when catalog is hidden */
              <div className="bg-white/80 border border-dashed border-rose-200/90 rounded-lg p-2.5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="text-base">⚡</span>
                  <span>
                    Search by name or shortcut (e.g. <b>CBC</b>, <b>LFT</b>, <b>FBS</b>) above, or click <b>View All Tests</b> to browse.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowAllTests(true);
                    setSelectedDept("ALL");
                  }}
                  className="text-xs font-bold text-rose-800 hover:text-rose-950 hover:underline flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <FlaskConical className="w-3.5 h-3.5 text-rose-600" />
                  <span>Browse All Tests ({catalog.length})</span>
                  <span className="text-[10px]">▼</span>
                </button>
              </div>
            )}

            {/* Row 4: Clinical History, Notes, Remark, Order Date, Emergency & Medico-Legal Checkboxes */}
            <div className="pt-3.5 border-t border-rose-200/60 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-end">
                {/* Provisional Diagnosis */}
                <div className="md:col-span-3 space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-700">
                    Provisional Diagnosis
                  </label>
                  <input
                    type="text"
                    value={provisionalDiagnosis}
                    onChange={(e) => setProvisionalDiagnosis(e.target.value)}
                    placeholder="e.g. Type 2 Diabetes, Fever, Routine"
                    className="w-full h-9 bg-white border border-rose-200 rounded-lg px-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-400/20 focus:border-rose-400"
                  />
                </div>

                {/* Notes */}
                <div className="md:col-span-3 space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-700">
                    Clinical / Lab Notes
                  </label>
                  <input
                    type="text"
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="Special instructions or clinical history"
                    className="w-full h-9 bg-white border border-rose-200 rounded-lg px-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-400/20 focus:border-rose-400"
                  />
                </div>

                {/* Select Remark */}
                <div className="md:col-span-2 space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-700">
                    Order Remark
                  </label>
                  <select
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    className="w-full h-9 bg-white border border-rose-200 rounded-lg px-2 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-rose-400/20 focus:border-rose-400 cursor-pointer"
                  >
                    <option value="Select Remark">Select Remark</option>
                    <option value="Normal Routine">Normal Routine</option>
                    <option value="Fasting Confirmed">Fasting Confirmed</option>
                    <option value="Sample Repeated">Sample Repeated</option>
                    <option value="STAT Critical">STAT Critical</option>
                  </select>
                </div>

                {/* Order Date */}
                <div className="md:col-span-2 space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-700">
                    Order Date
                  </label>
                  <input
                    type="date"
                    value={orderDate}
                    onChange={(e) => setOrderDate(e.target.value)}
                    className="w-full h-9 bg-white border border-rose-200 rounded-lg px-2 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-rose-400/20 focus:border-rose-400"
                  />
                </div>

                {/* Clinical Checkboxes (Neat Micro-Toggles without Overlap) */}
                <div className="md:col-span-2 space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-700">
                    Urgency &amp; Flags
                  </label>
                  <div className="h-9 flex items-center gap-1.5">
                    <label className={`flex-1 h-full rounded-lg border px-1.5 flex items-center justify-center gap-1 cursor-pointer text-[10px] font-bold select-none transition-all ${
                      isEmergency 
                        ? "bg-rose-100 border-rose-400 text-rose-800 shadow-2xs" 
                        : "bg-white border-rose-200 text-slate-600 hover:bg-rose-50"
                    }`}>
                      <input
                        id="emergency-report"
                        type="checkbox"
                        checked={isEmergency}
                        onChange={(e) => setIsEmergency(e.target.checked)}
                        className="w-3 h-3 rounded border-rose-300 text-rose-600 focus:ring-rose-500"
                      />
                      <span>STAT</span>
                    </label>
                    <label className={`flex-1 h-full rounded-lg border px-1.5 flex items-center justify-center gap-1 cursor-pointer text-[10px] font-bold select-none transition-all ${
                      isMedicoLegal 
                        ? "bg-amber-100 border-amber-300 text-amber-900 shadow-2xs" 
                        : "bg-white border-rose-200 text-slate-600 hover:bg-rose-50"
                    }`}>
                      <input
                        id="medico-legal"
                        type="checkbox"
                        checked={isMedicoLegal}
                        onChange={(e) => setIsMedicoLegal(e.target.checked)}
                        className="w-3 h-3 rounded border-rose-300 text-amber-600 focus:ring-amber-500"
                      />
                      <span>MLC</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Order Summary, Vacutainer Specimen Guide & Billing Settlement (Directly Below Tests) */}
          <div className="p-5 rounded-xl bg-[#FFF0F4] border border-rose-200/90 shadow-2xs space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rose-200/60 pb-3">
              <div className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Receipt className="w-4 h-4 text-rose-600" /> Order Summary &amp; Billing Settlement
              </div>
              <div className="flex items-center gap-3">
                {selectedCodes.length > 0 && (
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="text-xs text-rose-600 hover:underline font-semibold"
                  >
                    Clear All ({selectedCodes.length})
                  </button>
                )}
                <span className="text-xs font-mono font-bold text-rose-950 bg-rose-100 border border-rose-300 px-3 py-1 rounded-full">
                  {selectedTestObjects.length} Tests Selected · Subtotal ₹{subtotal.toFixed(0)}
                </span>
              </div>
            </div>

            {/* 2-Column Responsive Split */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column (7 cols): Selected Tests Review & Vacutainer Specimen Tubes */}
              <div className="lg:col-span-7 space-y-4">
                {/* Selected Tests 3-Column Table (Tests, Actual Price, Editable Price) */}
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wide flex items-center justify-between">
                    <span>Selected Tests ({selectedTestObjects.length})</span>
                    <div className="flex items-center gap-2 font-mono text-xs">
                      {subtotal !== actualCatalogTotal && (
                        <span className="text-slate-400 line-through">Catalog: ₹{actualCatalogTotal.toFixed(2)}</span>
                      )}
                      <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-rose-200">
                        Total: ₹{subtotal.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {selectedTestObjects.length === 0 ? (
                    <div className="p-6 rounded-xl bg-white border border-dashed border-rose-200 text-center text-slate-400 text-xs">
                      No tests selected yet. Click or use shortcuts (e.g. <b>CBC</b>, <b>LFT</b>) in the catalog above to add tests.
                    </div>
                  ) : (
                    <div className="bg-white rounded-xl border border-rose-200 overflow-hidden shadow-2xs">
                      <div className="max-h-72 overflow-y-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-rose-50/80 text-rose-950 font-bold uppercase text-[10px] tracking-wider border-b border-rose-200 sticky top-0 z-10 backdrop-blur-xs">
                            <tr>
                              <th className="py-2.5 px-3">Tests</th>
                              <th className="py-2.5 px-3 text-right w-28">Actual Price</th>
                              <th className="py-2.5 px-3 text-right w-36">Editable Price</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-rose-100 text-slate-800">
                            {selectedTestObjects.map((t) => {
                              const currentPrice = customPrices[t.code] !== undefined ? customPrices[t.code] : t.price;
                              const isPriceModified = customPrices[t.code] !== undefined && customPrices[t.code] !== t.price;

                              return (
                                <tr key={t.id || t.code} className="hover:bg-rose-50/40 transition-colors">
                                  {/* Column 1: Tests */}
                                  <td className="py-2.5 px-3">
                                    <div className="flex items-start gap-2">
                                      <button
                                        type="button"
                                        onClick={() => toggleTest(t.code)}
                                        className="text-slate-400 hover:text-rose-600 mt-0.5 shrink-0 transition-colors cursor-pointer"
                                        title={`Remove ${t.name}`}
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                      <div className="min-w-0">
                                        <div className="font-bold text-slate-900 text-xs leading-snug">
                                          {t.name}
                                        </div>
                                        <div className="text-[10px] text-slate-500 font-mono mt-0.5 flex items-center gap-1.5 flex-wrap">
                                          <span className="px-1.5 py-0.2 rounded bg-rose-50 text-rose-800 border border-rose-200 font-bold text-[9px]">
                                            {t.code}
                                          </span>
                                          <span>·</span>
                                          <span className="text-slate-600">{t.tube.split("/")[0]}</span>
                                          <span>·</span>
                                          <span className="text-slate-400">{t.category}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </td>

                                  {/* Column 2: Actual Price */}
                                  <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-700 align-middle">
                                    ₹{t.price.toFixed(2)}
                                  </td>

                                  {/* Column 3: Editable Price */}
                                  <td className="py-2.5 px-3 text-right align-middle">
                                    <div className="inline-flex items-center justify-end relative">
                                      <span className="absolute left-2.5 text-xs font-bold text-slate-400 pointer-events-none">
                                        ₹
                                      </span>
                                      <input
                                        type="number"
                                        min="0"
                                        step="1"
                                        value={currentPrice}
                                        onChange={(e) => handlePriceChange(t.code, e.target.value)}
                                        className={`w-28 h-8 pl-6 pr-2.5 bg-white border rounded-lg text-xs font-mono font-bold text-right transition-all shadow-2xs focus:outline-none focus:ring-2 ${
                                          isPriceModified
                                            ? "border-emerald-500 text-emerald-800 focus:ring-emerald-400/20 bg-emerald-50/30"
                                            : "border-rose-300 text-slate-900 focus:ring-rose-400/20 focus:border-rose-500"
                                        }`}
                                        title="Click to edit test price"
                                      />
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

                {/* Required Vacutainer Specimen Tubes */}
                <div className="pt-3 border-t border-rose-200/60 space-y-2">
                  <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wide flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Barcode className="w-3.5 h-3.5 text-rose-600" /> Required Vacutainer Specimen Tubes ({tubesNeeded.length})
                    </span>
                    {tubesNeeded.length > 0 && (
                      <span className="text-[10px] font-semibold text-rose-950 bg-rose-100 border border-rose-300 px-2 py-0.5 rounded-full font-mono">
                        {tubesNeeded.length} Tubes to Draw
                      </span>
                    )}
                  </div>
                  {tubesNeeded.length === 0 ? (
                    <div className="text-[11px] text-slate-400 italic">
                      Select tests to auto-compute required specimen collection tubes.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {tubesNeeded.map(({ tube }, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs p-2 rounded-lg bg-white border border-rose-200"
                        >
                          <span className="font-semibold text-slate-800 truncate mr-2 text-[11px]">{tube}</span>
                          <span className="font-mono text-rose-950 bg-rose-100 border border-rose-300 px-2 py-0.5 rounded text-[10px] font-bold shrink-0">
                            1 Tube
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column (5 cols): Financial Settlement & Invoice Breakdown */}
              <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-rose-200/90 shadow-2xs space-y-4">
                <div className="text-[11px] font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5 border-b border-rose-200/60 pb-2">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-600" /> Invoice Breakdown &amp; Payment
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="font-medium">Catalog Subtotal:</span>
                    <span className="font-mono font-bold text-slate-900 text-sm">₹{subtotal.toFixed(2)}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 font-medium">Discount Concession:</span>
                    <div className="w-28 flex items-center h-8 bg-rose-50/40 border border-rose-200 rounded-lg px-2 focus-within:border-rose-400 focus-within:ring-2 focus-within:ring-rose-400/20">
                      <span className="text-slate-400 text-xs mr-1 font-mono">₹</span>
                      <input
                        type="number"
                        min="0"
                        max={subtotal}
                        value={discount}
                        onChange={(e) => setDiscount(e.target.value)}
                        className="w-full text-right font-mono font-bold text-xs text-slate-900 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-rose-200/60 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">Net Payable Total:</span>
                    <span className="font-mono text-2xl font-black text-emerald-600">₹{netTotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Payment Status Toggle */}
                <div className="pt-2 border-t border-rose-200/60 space-y-2">
                  <div className="text-[11px] font-semibold text-slate-700">Payment Status:</div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentStatus("PAID")}
                      className={`py-2 rounded-lg text-xs font-bold transition-all ${
                        paymentStatus === "PAID"
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "bg-white border border-rose-200 text-slate-700 hover:bg-rose-50"
                      }`}
                    >
                      ✓ Collect Now (Paid)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentStatus("UNPAID")}
                      className={`py-2 rounded-lg text-xs font-bold transition-all ${
                        paymentStatus === "UNPAID"
                          ? "bg-amber-600 text-white shadow-xs"
                          : "bg-white border border-rose-200 text-slate-700 hover:bg-rose-50"
                      }`}
                    >
                      ⏱ Pay Later (Dues)
                    </button>
                  </div>

                  {paymentStatus === "PAID" && (
                    <div className="pt-2 space-y-1.5">
                      <div className="text-[11px] font-semibold text-slate-600">Payment Channel:</div>
                      <div className="grid grid-cols-3 gap-1.5">
                        {[
                          { id: "UPI" as const, label: "UPI", icon: QrCode },
                          { id: "CASH" as const, label: "Cash", icon: Banknote },
                          { id: "CARD" as const, label: "Card", icon: CreditCard },
                        ].map(({ id, label, icon: Icon }) => (
                          <button
                            key={id}
                            type="button"
                            onClick={() => setPaymentMethod(id)}
                            className={`p-2 rounded-lg border text-center transition-all ${
                              paymentMethod === id
                                ? "bg-rose-50 border-rose-500 text-rose-900 font-bold"
                                : "bg-white border-rose-200 text-slate-600 hover:bg-rose-50"
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5 mx-auto mb-1 text-slate-600" />
                            <span className="text-[10px] block font-medium">{label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Submit & Generate Barcodes Button */}
                <button
                  type="submit"
                  disabled={loading || selectedTestObjects.length === 0}
                  className={`w-full py-3.5 rounded-xl text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all mt-2 ${
                    selectedTestObjects.length === 0
                      ? "bg-rose-200 text-rose-400 cursor-not-allowed"
                      : "bg-rose-700 hover:bg-rose-800 cursor-pointer"
                  }`}
                >
                  {loading ? (
                    <span>Registering &amp; Generating Barcodes...</span>
                  ) : (
                    <>
                      <Printer className="w-4 h-4 text-rose-100" />
                      <span>Register &amp; Print Tube Barcodes</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>

      {/* Modal 1: Register New Doctor */}
      {showDoctorModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#5E1224] text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-rose-300" />
                <span className="font-bold text-sm tracking-tight">Register Referring Doctor</span>
              </div>
              <button 
                type="button" 
                onClick={() => setShowDoctorModal(false)}
                className="text-rose-200/70 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateDoctor} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Doctor Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Dr. Ramesh Kumar"
                  value={newDoctorName}
                  onChange={(e) => setNewDoctorName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-rose-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Clinic / Hospital Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. City Care Clinic / Apollo Hospital"
                  value={newDoctorClinic}
                  onChange={(e) => setNewDoctorClinic(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-rose-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={newDoctorPhone}
                  onChange={(e) => setNewDoctorPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-rose-600 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDoctorModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingDoctor || !newDoctorName.trim()}
                  className="px-5 py-2 rounded-lg bg-[#5E1224] hover:bg-[#721C24] text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {savingDoctor ? "Saving..." : "Add & Select Doctor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Register New Center */}
      {showCenterModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#5E1224] text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-rose-300" />
                <span className="font-bold text-sm tracking-tight">Register Referral Center / Branch</span>
              </div>
              <button 
                type="button" 
                onClick={() => setShowCenterModal(false)}
                className="text-rose-200/70 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCenter} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Center / Branch Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Indiranagar Sample Collection Hub"
                  value={newCenterName}
                  onChange={(e) => setNewCenterName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-rose-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contact Phone (Optional)
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 080-23456789"
                  value={newCenterPhone}
                  onChange={(e) => setNewCenterPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-rose-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Address / Location (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. #42, Main Road, Near Metro"
                  value={newCenterAddress}
                  onChange={(e) => setNewCenterAddress(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-rose-600 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCenterModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCenter || !newCenterName.trim()}
                  className="px-5 py-2 rounded-lg bg-[#5E1224] hover:bg-[#721C24] text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {savingCenter ? "Saving..." : "Add & Select Center"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Add Custom / Additional Test */}
      {showCustomTestModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#5E1224] text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-rose-300" />
                <span className="font-bold text-sm tracking-tight">Add New / Custom Investigation</span>
              </div>
              <button 
                type="button" 
                onClick={() => setShowCustomTestModal(false)}
                className="text-rose-200/70 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomTest} className="p-5 space-y-4 max-h-[82vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Test Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="e.g. Serum Zinc Level, Troponin-I Rapid Card"
                    value={customTestName}
                    onChange={(e) => setCustomTestName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-rose-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Test Code / Shortcut (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ZINC, TROP_I"
                    value={customTestCode}
                    onChange={(e) => setCustomTestCode(e.target.value.toUpperCase())}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-rose-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Department / Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={customTestCategory}
                    onChange={(e) => setCustomTestCategory(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-rose-600 focus:bg-white cursor-pointer"
                  >
                    {DEPARTMENTS.filter(d => d !== "ALL").map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Specimen / Sample Type
                  </label>
                  <select
                    value={customTestSpecimen}
                    onChange={(e) => setCustomTestSpecimen(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-rose-600 focus:bg-white cursor-pointer"
                  >
                    <option value="Serum">Serum</option>
                    <option value="Whole Blood EDTA">Whole Blood EDTA</option>
                    <option value="Plasma Fluoride">Plasma Fluoride</option>
                    <option value="Citrated Plasma">Citrated Plasma</option>
                    <option value="Urine (Spot / 24H)">Urine (Spot / 24H)</option>
                    <option value="Stool">Stool</option>
                    <option value="Body Fluid / Swab">Body Fluid / Swab</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Vacutainer Tube / Container
                  </label>
                  <select
                    value={customTestTube}
                    onChange={(e) => setCustomTestTube(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-rose-600 focus:bg-white cursor-pointer"
                  >
                    <option value="Yellow / Gel SST">Yellow / Gel SST</option>
                    <option value="Lavender / EDTA">Lavender / EDTA</option>
                    <option value="Gray / Fluoride">Gray / Fluoride</option>
                    <option value="Light Blue / Citrate">Light Blue / Citrate</option>
                    <option value="Red / Plain Clot">Red / Plain Clot</option>
                    <option value="Container / Sterile">Container / Sterile</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Standard Price (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    required
                    placeholder="350"
                    value={customTestPrice}
                    onChange={(e) => setCustomTestPrice(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-rose-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Result Unit (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. mg/dL, ng/mL, %"
                    value={customTestUnit}
                    onChange={(e) => setCustomTestUnit(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-rose-600 focus:bg-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Normal Reference Range (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 70.0 - 110.0, or Negative / Non-Reactive"
                    value={customTestRange}
                    onChange={(e) => setCustomTestRange(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-rose-600 focus:bg-white"
                  />
                </div>
              </div>

              <div className="p-3 bg-rose-50/70 rounded-xl border border-rose-200 flex items-center justify-between text-xs">
                <label htmlFor="custom-auto-select" className="text-slate-700 font-medium cursor-pointer">
                  Immediately select this test for the current patient order
                </label>
                <input
                  id="custom-auto-select"
                  type="checkbox"
                  checked={customAutoSelect}
                  onChange={(e) => setCustomAutoSelect(e.target.checked)}
                  className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCustomTestModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCustomTest || !customTestName.trim()}
                  className="px-5 py-2 rounded-lg bg-[#5E1224] hover:bg-[#721C24] text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{savingCustomTest ? "Adding Test..." : "Create & Add Test"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NewOrderPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto py-16 text-center text-xs font-semibold text-slate-500 font-mono">
        <div className="w-6 h-6 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        Loading Order Entry Form...
      </div>
    }>
      <NewOrderContent />
    </Suspense>
  );
}
