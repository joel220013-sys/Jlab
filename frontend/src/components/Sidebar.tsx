"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { 
  Activity, 
  FlaskConical, 
  CheckCircle2, 
  FileText, 
  Receipt, 
  Users,
  LogOut, 
  ShieldCheck, 
  Building2, 
  ExternalLink,
  BarChart3,
  TrendingUp,
  MessageSquare
} from "lucide-react";
import { apiFetch } from "@/lib/api";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const [userInfo, setUserInfo] = useState<{
    fullName: string;
    role: string;
    labName: string;
    username?: string;
  }>({
    fullName: "Staff Member",
    role: "LAB_ADMIN",
    labName: "Diagnostic Laboratory",
    username: ""
  });

  const [pendingTechCount, setPendingTechCount] = useState<number>(0);
  const [pendingApprovalCount, setPendingApprovalCount] = useState<number>(0);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("jlab_user") || localStorage.getItem("pulselab_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        setUserInfo({
          fullName: parsed.fullName || "Lab Administrator",
          role: parsed.role || "LAB_ADMIN",
          labName: parsed.labName || "Diagnostic Laboratory",
          username: parsed.username || ""
        });
      }
    } catch {
      // fallback
    }

    // Live query for pending counts
    apiFetch("/dashboard/stats")
      .then((stats: any) => {
        if (stats) {
          setPendingTechCount(stats.pending_technician || 0);
          setPendingApprovalCount(stats.pending_verifications || 0);
        }
      })
      .catch(() => {
        setPendingTechCount(0);
        setPendingApprovalCount(0);
      });
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem("jlab_token");
    localStorage.removeItem("jlab_user");
    localStorage.removeItem("pulselab_token");
    localStorage.removeItem("pulselab_user");
    router.push("/login");
  };

  const navItems = [
    {
      group: "CLINICAL WORKFLOW",
      items: [
        { label: "Workspace Cockpit", href: "/lab/dashboard", icon: Activity },
        { label: "Patients", href: "/lab/patients", icon: Users },
        { 
          label: "Technician Workbench", 
          href: "/lab/technician", 
          icon: FlaskConical, 
          badge: pendingTechCount > 0 ? `${pendingTechCount} Pending` : undefined 
        },
        { 
          label: "Pathologist Approvals", 
          href: "/lab/approvals", 
          icon: CheckCircle2, 
          badge: pendingApprovalCount > 0 ? `${pendingApprovalCount} Review` : undefined 
        },
      ]
    },
    {
      group: "FINANCE & DISPATCH",
      items: [
        { label: "Reports & Dispatch", href: "/lab/reports", icon: FileText },
        { label: "Patient Alerts & SMS", href: "/lab/communication", icon: MessageSquare },
        { label: "Invoices & Billing", href: "/lab/billing", icon: Receipt },
      ]
    },
    {
      group: "STATISTICS & AUDIT",
      items: [
        { label: "Day Closing Summary", href: "/lab/summaries", icon: BarChart3 },
        { label: "Receipts Summary", href: "/lab/summaries?tab=receipts", icon: TrendingUp },
      ]
    }
  ];

  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase() || "LB";
  };

  return (
    <aside className="w-64 bg-[#5E1224] text-rose-100 border-r border-[#470c1b] flex flex-col h-screen sticky top-0 shrink-0 print:hidden">
      {/* Brand Header */}
      <div className="p-4 border-b border-[#470c1b] bg-[#5E1224]">
        <Link href="/lab/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-white border border-rose-200/50 flex items-center justify-center p-1 overflow-hidden shadow-lg shadow-rose-950/30 group-hover:scale-105 group-hover:border-rose-300 transition-all shrink-0">
            <Image
              src="/pulselab-logo.png"
              alt="PULSE LAB Logo"
              width={40}
              height={40}
              priority
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <div className="font-bold text-base text-white tracking-tight flex items-center gap-1.5">
              PULSE LAB
            </div>
            <div className="text-[11px] text-rose-200/70 font-medium">Diagnostic LIMS SaaS</div>
          </div>
        </Link>
      </div>

      {/* Tenant Context Pill */}
      <div className="p-3 mx-3 my-2 rounded-lg bg-[#470c1b] border border-[#721C24]">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-rose-200/80 flex items-center gap-1.5 font-medium">
            <Building2 className="w-3.5 h-3.5 text-rose-300" /> Tenant Lab
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-300 bg-emerald-500/20 px-1.5 py-0.2 rounded-full border border-emerald-500/30 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Active
          </span>
        </div>
        <div className="font-semibold text-xs text-white truncate" title={userInfo.labName}>
          {userInfo.labName}
        </div>
        <div className="text-[10px] text-rose-200/70 flex items-center gap-1 mt-0.5">
          <ShieldCheck className="w-3 h-3 text-rose-300" /> NABL Compliant Ready
        </div>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-5">
        {navItems.map((group, idx) => (
          <div key={idx}>
            <div className="text-[10px] font-bold text-rose-200/60 uppercase tracking-wider px-2 mb-1.5">
              {group.group}
            </div>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? "bg-[#721C24] text-white border border-rose-300/30 shadow-xs font-semibold"
                        : "text-rose-200/80 hover:text-white hover:bg-[#721C24]/50"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-rose-300/70"}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                        isActive 
                          ? "bg-white text-[#5E1224] font-bold" 
                          : "bg-[#470c1b] text-rose-200 border border-[#721C24]"
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer Profile & Switcher */}
      <div className="p-3 border-t border-[#470c1b] bg-[#470c1b]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-[#5E1224] border border-[#721C24] flex items-center justify-center font-bold text-xs text-rose-200 shrink-0">
              {getInitials(userInfo.fullName)}
            </div>
            <div className="truncate">
              <div className="text-xs font-semibold text-white leading-tight truncate">{userInfo.fullName}</div>
              <div className="text-[10px] text-rose-200/70 truncate">{userInfo.role}</div>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            title="Sign out of laboratory session" 
            className="text-rose-200/80 hover:text-rose-300 p-1.5 hover:bg-[#5E1224] rounded-lg transition-colors cursor-pointer shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        <Link 
          href="/" 
          className="w-full flex items-center justify-center gap-1.5 text-[11px] text-rose-200/80 hover:text-white py-1.5 border border-dashed border-[#721C24] hover:border-rose-400 rounded-lg transition-colors"
         >
          <span>Visit Product Site</span>
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
    </aside>
  );
}
