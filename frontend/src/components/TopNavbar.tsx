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
  Building2, 
  BarChart3, 
  MessageSquare,
  Bell,
  Plus,
  Menu,
  X
} from "lucide-react";
import { apiFetch } from "@/lib/api";

export function TopNavbar() {
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const token = typeof window !== "undefined" ? (localStorage.getItem("jlab_token") || localStorage.getItem("pulselab_token")) : null;
    if (!token) {
      router.push("/login");
      return;
    }

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
      label: "Dashboard", 
      href: "/lab/dashboard", 
      icon: Activity,
      exact: true
    },
    { 
      label: "Patients", 
      href: "/lab/patients", 
      icon: Users 
    },
    { 
      label: "New Order", 
      href: "/lab/orders/new", 
      icon: Plus 
    },
    { 
      label: "Technician Workbench", 
      href: "/lab/technician", 
      icon: FlaskConical, 
      badge: pendingTechCount > 0 ? pendingTechCount : undefined 
    },
    { 
      label: "Approvals", 
      href: "/lab/approvals", 
      icon: CheckCircle2, 
      badge: pendingApprovalCount > 0 ? pendingApprovalCount : undefined 
    },
    { 
      label: "Reports", 
      href: "/lab/reports", 
      icon: FileText 
    },
    { 
      label: "Billing", 
      href: "/lab/billing", 
      icon: Receipt 
    },
    { 
      label: "Alerts & SMS", 
      href: "/lab/communication", 
      icon: MessageSquare 
    },
    { 
      label: "Day Closing", 
      href: "/lab/summaries", 
      icon: BarChart3 
    },
  ];

  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase() || "LB";
  };

  return (
    <header className="bg-[#5E1224] text-white border-b border-[#470c1b] sticky top-0 z-40 shadow-md print:hidden">
      {/* Main Top Horizontal Bar */}
      <div className="max-w-[1920px] mx-auto px-3 sm:px-4 flex items-center justify-between h-12 gap-2">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3 shrink-0">
          <Link href="/lab/dashboard" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-white border border-rose-200/50 flex items-center justify-center p-0.5 overflow-hidden shadow-xs group-hover:scale-105 transition-transform shrink-0">
              <Image
                src="/jlab-logo.png"
                alt="J LAB Logo"
                width={32}
                height={32}
                priority
                className="w-full h-full object-contain"
              />
            </div>
            <div className="hidden sm:block">
              <div className="font-bold text-sm tracking-tight text-white flex items-center gap-1">
                J LAB
              </div>
              <div className="text-[9px] text-rose-200/70 -mt-0.5 font-medium leading-none">Diagnostic Cloud</div>
            </div>
          </Link>
        </div>

        {/* Desktop Horizontal Navigation Tabs (Matching Reference Image) */}
        <nav className="hidden xl:flex items-center gap-0.5 overflow-x-auto no-scrollbar py-1">
          {navItems.map((item) => {
            const isActive = item.exact 
              ? pathname === item.href 
              : pathname === item.href || (item.href !== "/lab/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-2.5 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  isActive
                    ? "bg-[#16A34A] text-white shadow-xs"
                    : "text-rose-100/90 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0 opacity-90" />
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span className={`text-[10px] font-mono font-black px-1.5 py-0.2 rounded-full ${
                    isActive 
                      ? "bg-white text-emerald-900" 
                      : "bg-rose-500 text-white"
                  }`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Medium Screen Responsive Scroll Tabs (For laptops 1024px - 1280px) */}
        <nav className="hidden lg:flex xl:hidden items-center gap-0.5 overflow-x-auto no-scrollbar py-1 max-w-[55%]">
          {navItems.map((item) => {
            const isActive = item.exact 
              ? pathname === item.href 
              : pathname === item.href || (item.href !== "/lab/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-2 py-1 rounded text-[11px] font-bold transition-all flex items-center gap-1 whitespace-nowrap ${
                  isActive
                    ? "bg-[#16A34A] text-white shadow-xs"
                    : "text-rose-100/90 hover:bg-white/10 hover:text-white"
                }`}
                title={item.label}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span className="text-[9px] font-mono font-black px-1 rounded-full bg-rose-500 text-white">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Side Widgets: Tenant Lab, Notifications, User Profile & Logout */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Tenant Lab Context Pill */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#470c1b] border border-rose-800/40 text-xs">
            <Building2 className="w-3 h-3 text-rose-300 shrink-0" />
            <span className="font-semibold text-rose-100 truncate max-w-[160px] text-[11px]" title={userInfo.labName}>
              {userInfo.labName}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" title="Licensed Active"></span>
          </div>

          {/* Notifications Bell */}
          <button 
            type="button" 
            className="p-1.5 text-rose-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors relative cursor-pointer"
            title="Lab Notifications"
          >
            <Bell className="w-4 h-4" />
            {(pendingTechCount > 0 || pendingApprovalCount > 0) && (
              <span className="w-2 h-2 rounded-full bg-rose-400 absolute top-1 right-1"></span>
            )}
          </button>

          {/* User Profile Pill */}
          <div className="flex items-center gap-2 pl-1 border-l border-rose-800/60">
            <div className="w-7 h-7 rounded-full bg-rose-800/90 border border-rose-300/40 text-white flex items-center justify-center font-bold text-[10px] shadow-2xs shrink-0">
              {getInitials(userInfo.fullName)}
            </div>
            <div className="hidden sm:block text-left leading-tight">
              <div className="text-xs font-bold text-white truncate max-w-[110px]" title={userInfo.fullName}>
                {userInfo.fullName.split(" ")[0]}
              </div>
              <div className="text-[9px] text-rose-200/70 font-mono leading-none">
                {userInfo.role}
              </div>
            </div>

            {/* Logout Button */}
            <button
              type="button"
              onClick={handleLogout}
              className="p-1.5 text-rose-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Menu Hamburger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 text-rose-200 hover:text-white hover:bg-white/10 rounded-lg cursor-pointer"
            title="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Dropdown (when hamburger is clicked on mobile) */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#470c1b] border-t border-rose-800/40 px-3 py-2 space-y-1 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
            {navItems.map((item) => {
              const isActive = item.exact 
                ? pathname === item.href 
                : pathname === item.href || (item.href !== "/lab/dashboard" && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`p-2 rounded text-xs font-bold flex items-center gap-1.5 transition-colors ${
                    isActive
                      ? "bg-[#16A34A] text-white"
                      : "text-rose-100 hover:bg-white/10"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{item.label}</span>
                  {item.badge !== undefined && (
                    <span className="text-[9px] font-mono font-black px-1 rounded-full bg-rose-500 text-white ml-auto">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
