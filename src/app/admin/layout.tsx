"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

const NAV = [
  { href: "/admin", icon: "dashboard", label: "Dashboard" },
  { href: "/admin/orders", icon: "inventory_2", label: "Orders" },
  { href: "/admin/users", icon: "group", label: "Users" },
  { href: "/admin/collections", icon: "storefront", label: "Collections" },
  { href: "/admin/credits", icon: "toll", label: "AI Credits" },
  { href: "/admin/analytics", icon: "analytics", label: "Analytics" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const path = usePathname();
  return (
    <div className="flex h-screen bg-[#1a1a1a] text-white overflow-hidden" style={{ fontFamily: "'Inter',sans-serif" }}>
      {/* Sidebar */}
      <nav className="hidden md:flex flex-col w-64 shrink-0 border-r border-white/10 bg-[#1a1a1a]/75 backdrop-blur-2xl z-50">
        <div className="p-6 border-b border-white/10">
          <h1 className="text-xl font-bold tracking-widest uppercase" style={{ fontFamily: "'JetBrains Mono',monospace" }}>GARMENT OS</h1>
          <p className="text-xs text-[#9ca3af] mt-1" style={{ fontFamily: "'JetBrains Mono',monospace" }}>v2.4.0-STABLE</p>
          <div className="mt-4 flex items-center gap-3">
            <div className="w-8 h-8 bg-[#262626] border border-white/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-sm text-[#9ca3af]">person</span>
            </div>
            <span className="text-xs text-white" style={{ fontFamily: "'JetBrains Mono',monospace" }}>System Operator</span>
          </div>
          <Link href="/design"
            className="mt-4 w-full py-2 border border-[#7C3AED]/30 text-[#7C3AED] hover:bg-[#7C3AED]/10 transition-colors text-xs font-bold tracking-widest uppercase flex items-center justify-center gap-2"
            style={{ fontFamily: "'JetBrains Mono',monospace" }}>
            <span className="material-symbols-outlined text-[14px]">add</span>
            New Design
          </Link>
        </div>
        <div className="flex-1 flex flex-col gap-1 px-2 py-4 overflow-y-auto">
          {NAV.map(n => {
            const active = path === n.href || (n.href !== "/admin" && path.startsWith(n.href));
            const exact = n.href === "/admin" && path === "/admin";
            const isActive = active || exact;
            return (
              <Link key={n.href} href={n.href}
                className={`flex items-center px-4 py-3 text-xs uppercase tracking-wider transition-all duration-300 ${
                  isActive
                    ? "text-white bg-[#7C3AED]/20 border-r-2 border-[#7C3AED]"
                    : "text-[#9ca3af] hover:bg-white/5 hover:text-white hover:translate-x-1"
                }`} style={{ fontFamily: "'JetBrains Mono',monospace" }}>
                <span className="material-symbols-outlined mr-3 text-[18px]">{n.icon}</span>
                {n.label}
              </Link>
            );
          })}
        </div>
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#262626] flex items-center justify-center border border-white/20">
              <span className="material-symbols-outlined text-sm text-[#9ca3af]">person</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-white" style={{ fontFamily: "'JetBrains Mono',monospace" }}>System Operator</span>
              <span className="text-[10px] text-[#7C3AED]" style={{ fontFamily: "'JetBrains Mono',monospace" }}>ADMIN_AUTH</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Top bar */}
        <header className="bg-[#1a1a1a]/60 backdrop-blur-lg border-b border-white/10 flex justify-between items-center px-6 h-16 shrink-0 z-40">
          <div className="flex items-center gap-4">
            <span className="text-lg font-black tracking-tighter uppercase" style={{ fontFamily: "'JetBrains Mono',monospace" }}>GLACIER DESIGN</span>
            <div className="h-4 w-px bg-white/20" />
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-sm text-[#9ca3af]">search</span>
              <input className="bg-[#262626]/50 border border-white/20 text-white text-sm pl-9 pr-4 py-1.5 focus:outline-none focus:border-[#7C3AED]/50 placeholder:text-[#9ca3af] w-64 transition-all"
                placeholder="QUERY_DATABASE..." style={{ fontFamily: "'JetBrains Mono',monospace" }} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 text-[#9ca3af] hover:bg-[#7C3AED]/10 hover:text-white transition-colors">
              <span className="material-symbols-outlined">settings</span>
            </button>
            <button className="p-2 text-[#9ca3af] hover:bg-[#7C3AED]/10 hover:text-white transition-colors relative">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#ff6b6b]" />
            </button>
            <button className="p-2 text-[#9ca3af] hover:bg-[#7C3AED]/10 hover:text-white transition-colors border-l border-white/10 ml-2 pl-4">
              <span className="material-symbols-outlined">account_circle</span>
            </button>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-6 md:p-8">{children}</div>
      </main>

      {/* Material Icons */}
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />
    </div>
  );
}
