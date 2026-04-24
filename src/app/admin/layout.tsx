"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useState, useEffect, useRef, useCallback } from "react";

const NAV = [
  { href: "/admin",             icon: "dashboard",   label: "Dashboard" },
  { href: "/admin/orders",      icon: "inventory_2", label: "Orders" },
  { href: "/admin/users",       icon: "group",       label: "Users" },
  { href: "/admin/collections", icon: "storefront",  label: "Collections" },
  { href: "/admin/credits",     icon: "toll",        label: "AI Credits" },
  { href: "/admin/analytics",   icon: "analytics",   label: "Analytics" },
  { href: "/design?admin=1",    icon: "edit_note",   label: "Design Studio" },
];

type SearchResult = {
  type: "order" | "user";
  id: string;
  label: string;
  sub: string;
  href: string;
};

function AdminSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); setOpen(false); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/orders");

      const items: SearchResult[] = [];
      const ql = q.toLowerCase();

      if (res.ok) {
        const { orders } = await res.json();
        for (const o of orders || []) {
          if (
            o.orderId?.toLowerCase().includes(ql) ||
            o.customerName?.toLowerCase().includes(ql) ||
            o.phone?.includes(ql) ||
            o.email?.toLowerCase().includes(ql)
          ) {
            items.push({
              type: "order",
              id: o.orderId,
              label: o.customerName,
              sub: `${o.orderId} · ${o.status?.toUpperCase()}`,
              href: `/admin/orders/${o.orderId}`,
            });
          }
          if (items.length >= 6) break;
        }
      }

      setResults(items);
      setOpen(items.length > 0);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce
  useEffect(() => {
    const t = setTimeout(() => search(query), 250);
    return () => clearTimeout(t);
  }, [query, search]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setActiveIdx(-1);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); }
    else if (e.key === "Enter" && activeIdx >= 0) {
      e.preventDefault();
      const r = results[activeIdx];
      router.push(r.href);
      setOpen(false); setQuery(""); setActiveIdx(-1);
      inputRef.current?.blur();
    }
    else if (e.key === "Escape") { setOpen(false); setActiveIdx(-1); inputRef.current?.blur(); }
  };

  const handleSelect = (r: SearchResult) => {
    router.push(r.href);
    setOpen(false); setQuery(""); setActiveIdx(-1);
  };

  return (
    <div ref={containerRef} className="relative">
      <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[16px] leading-none text-[#9ca3af] peer-focus:text-[#7C3AED] transition-colors pointer-events-none select-none z-10">
        {loading ? "hourglass_empty" : "search"}
      </span>
      <input
        ref={inputRef}
        value={query}
        onChange={e => { setQuery(e.target.value); setActiveIdx(-1); }}
        onFocus={() => { if (results.length > 0) setOpen(true); }}
        onKeyDown={handleKeyDown}
        className="adm-mono peer bg-[#262626]/40 border border-white/10 text-white text-[11px] pl-8 pr-4 py-2 focus:outline-none focus:border-[#7C3AED]/40 focus:bg-[#262626]/60 placeholder:text-[#9ca3af]/60 w-72 transition-all rounded-lg uppercase tracking-wider"
        placeholder="QUERY_DATABASE..."
        autoComplete="off"
        spellCheck={false}
      />
      <div className="absolute bottom-0 left-0 w-0 h-[1px] bg-[#7C3AED]/60 peer-focus:w-full transition-all duration-500" />

      {/* Dropdown */}
      {open && results.length > 0 && (
        <div className="absolute top-full left-0 mt-1.5 w-80 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-2xl shadow-black/60 z-[200] overflow-hidden">
          {/* Orders group */}
          {results.some(r => r.type === "order") && (
            <>
              <div className="adm-mono text-[9px] text-[#7C3AED] px-3 pt-2.5 pb-1 uppercase tracking-widest flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[12px]">inventory_2</span>
                Orders
              </div>
              {results.filter(r => r.type === "order").map((r, i) => {
                const idx = results.indexOf(r);
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => handleSelect(r)}
                    className={`w-full text-left px-3 py-2.5 flex items-center gap-3 transition-colors ${activeIdx === idx ? "bg-[#7C3AED]/20" : "hover:bg-white/5"}`}
                  >
                    <span className="material-symbols-outlined text-[14px] text-[#7C3AED] shrink-0">receipt_long</span>
                    <div className="min-w-0">
                      <p className="adm-mono text-[11px] text-white font-bold truncate">{r.label}</p>
                      <p className="adm-mono text-[9px] text-[#9ca3af] truncate">{r.sub}</p>
                    </div>
                    <span className="material-symbols-outlined text-[12px] text-[#9ca3af] ml-auto shrink-0">chevron_right</span>
                  </button>
                );
              })}
            </>
          )}
          {/* Users group */}
          {results.some(r => r.type === "user") && (
            <>
              <div className="adm-mono text-[9px] text-[#7C3AED] px-3 pt-2.5 pb-1 uppercase tracking-widest flex items-center gap-1.5 border-t border-white/5">
                <span className="material-symbols-outlined text-[12px]">group</span>
                Users
              </div>
              {results.filter(r => r.type === "user").map((r) => {
                const idx = results.indexOf(r);
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => handleSelect(r)}
                    className={`w-full text-left px-3 py-2.5 flex items-center gap-3 transition-colors ${activeIdx === idx ? "bg-[#7C3AED]/20" : "hover:bg-white/5"}`}
                  >
                    <span className="material-symbols-outlined text-[14px] text-[#7C3AED] shrink-0">person</span>
                    <div className="min-w-0">
                      <p className="adm-mono text-[11px] text-white font-bold truncate">{r.label}</p>
                      <p className="adm-mono text-[9px] text-[#9ca3af] truncate">{r.sub}</p>
                    </div>
                    <span className="material-symbols-outlined text-[12px] text-[#9ca3af] ml-auto shrink-0">chevron_right</span>
                  </button>
                );
              })}
            </>
          )}
          <div className="px-3 py-2 border-t border-white/5">
            <p className="adm-mono text-[9px] text-[#9ca3af]/60">
              ↑↓ điều hướng · Enter để chọn · Esc để đóng
            </p>
          </div>
        </div>
      )}

      {/* No results */}
      {open && results.length === 0 && query.trim() && !loading && (
        <div className="absolute top-full left-0 mt-1.5 w-72 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-2xl z-[200] px-4 py-3">
          <p className="adm-mono text-[10px] text-[#9ca3af]">Không tìm thấy kết quả cho &quot;{query}&quot;</p>
        </div>
      )}
    </div>
  );
}

// Extracted outside to avoid "component created during render" error
function AdminSidebar({ mobile, onClose }: { mobile?: boolean; onClose?: () => void }) {
  const path = usePathname();
  return (
    <nav className={
      mobile
        ? "flex flex-col w-72 h-full bg-[#1a1a1a] border-r border-white/10"
        : "hidden md:flex flex-col w-64 shrink-0 border-r border-white/10 bg-[#1a1a1a]/75 backdrop-blur-2xl z-50"
    }>
      <div className="p-6 border-b border-white/10">
        <h1 className="adm-mono text-xl font-bold tracking-widest uppercase">UNISPACE OS</h1>
        <p className="adm-mono text-xs text-[#9ca3af] mt-1">v2.4.0-STABLE</p>
        <div className="mt-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-[#262626] border border-white/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-sm text-[#9ca3af]">person</span>
          </div>
          <span className="adm-mono text-xs text-white">System Operator</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-1 px-2 py-4 overflow-y-auto">
        {NAV.map(n => {
          const active = path === n.href || (n.href !== "/admin" && path.startsWith(n.href));
          const isActive = active || (n.href === "/admin" && path === "/admin");
          return (
            <Link
              key={n.href}
              href={n.href}
              onClick={onClose}
              className={`adm-mono group flex items-center px-4 py-3 text-xs uppercase tracking-wider transition-all duration-300 ${
                isActive
                  ? "text-white bg-[#7C3AED]/20 border-r-2 border-[#7C3AED]"
                  : "text-[#9ca3af] hover:bg-white/5 hover:text-white hover:translate-x-1"
              }`}
            >
              <span className="material-symbols-outlined mr-4 text-[22px] group-hover:scale-110 transition-transform">{n.icon}</span>
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
            <span className="adm-mono text-xs text-white">System Operator</span>
            <span className="adm-mono text-[10px] text-[#7C3AED]">ADMIN_AUTH</span>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Mark admin session on mount
  if (typeof window !== "undefined") {
    sessionStorage.setItem("admin_logged_in", "1");
  }

  return (
    <div className="flex h-screen bg-[#1a1a1a] text-white overflow-hidden font-[Inter,sans-serif]">

      {/* Desktop sidebar */}
      <AdminSidebar />

      {/* Mobile drawer overlay */}
      {mobileNavOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="relative z-10 h-full animate-in slide-in-from-left duration-200">
            <AdminSidebar mobile onClose={() => setMobileNavOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Top bar */}
        <header className="bg-[#1a1a1a]/60 backdrop-blur-lg border-b border-white/10 flex justify-between items-center px-4 md:px-6 h-14 md:h-16 shrink-0 z-40">
          <div className="flex items-center gap-3 md:gap-4">
            {/* Hamburger — mobile only */}
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="md:hidden p-2 text-[#9ca3af] hover:text-white transition-colors"
              aria-label="Mở menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M3 12h18M3 6h18M3 18h18"/>
              </svg>
            </button>

            <span className="adm-mono text-base md:text-lg font-black tracking-tighter uppercase">UNISPACE</span>

            {/* Search — desktop only */}
            <div className="hidden md:flex items-center gap-4">
              <div className="h-4 w-px bg-white/20" />
              <AdminSearch />
            </div>
          </div>

          <div className="flex items-center gap-1 md:gap-2">
            <button type="button" className="p-2 text-[#9ca3af] hover:bg-[#7C3AED]/10 hover:text-white transition-colors">
              <span className="material-symbols-outlined text-[20px]">settings</span>
            </button>
            <button type="button" className="p-2 text-[#9ca3af] hover:bg-[#7C3AED]/10 hover:text-white transition-colors relative">
              <span className="material-symbols-outlined text-[20px]">notifications</span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#ff6b6b]" />
            </button>
            <button type="button" className="p-2 text-[#9ca3af] hover:bg-[#7C3AED]/10 hover:text-white transition-colors border-l border-white/10 ml-1 pl-3">
              <span className="material-symbols-outlined text-[20px]">account_circle</span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}
