import { TopNavbar } from "@/components/TopNavbar";

export default function LabLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#FFF5F7] text-slate-900 font-sans antialiased flex flex-col print:block print:min-h-0 print:bg-white">
      {/* Top Horizontal Operational & Navigation Taskbar (Matching Reference Photo) */}
      <TopNavbar />

      {/* Main Full-Width Content Area */}
      <main className="flex-1 p-3.5 sm:p-5 overflow-y-auto bg-[#FFF5F7] text-slate-900 print:p-0 print:m-0 print:overflow-visible print:block print:w-full">
        {children}
      </main>
    </div>
  );
}
