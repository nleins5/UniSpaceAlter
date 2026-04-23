"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface UserRecord {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  admin: boolean;
  createdAt: string;
  lastActive?: string;
  ordersCount?: number;
  totalSpent?: number;
}

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: "dashboard", href: "/dashboard" },
  { key: "orders", label: "Orders", icon: "inventory_2", href: "/admin/designs" },
  { key: "users", label: "Users", icon: "group", href: "/admin/users" },
];

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<UserRecord | null>(null);

  useEffect(() => {
    const userData = sessionStorage.getItem("user");
    if (!userData) { router.push("/login"); return; }
    const parsedUser = JSON.parse(userData);
    if (!parsedUser.admin) { router.push("/dashboard"); return; }

    const token = parsedUser.token;
    fetch("/api/users", {
      headers: token ? { "Authorization": `Bearer ${token}` } : {}
    })
      .then(r => {
        if (r.status === 401) { sessionStorage.removeItem("user"); router.push("/login"); return null; }
        return r.json();
      })
      .then((data: { users: UserRecord[] } | null) => {
        if (data) setUsers(data.users || []);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [router]);

  const filtered = users.filter(u => {
    if (!search) return true;
    const q = search.toLowerCase();
    return [u.email, u.firstName, u.lastName, u.id].some(v => v?.toLowerCase().includes(q));
  });

  const now = useMemo(() => Date.now(), [users]);

  const totalUsers = users.length;
  const adminCount = users.filter(u => u.admin).length;
  const activeThisWeek = users.filter(u => {
    if (!u.lastActive) return false;
    const diff = now - new Date(u.lastActive).getTime();
    return diff < 7 * 24 * 60 * 60 * 1000;
  }).length;

  const fmtDate = (d: string) => new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  const fmtTime = (d: string) => {
    const diff = now - new Date(d).getTime();
    if (diff < 60000) return "Vừa xong";
    if (diff < 3600000) return `${Math.floor(diff / 60000)} phút trước`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} giờ trước`;
    return `${Math.floor(diff / 86400000)} ngày trước`;
  };
  const fmtMoney = (n: number) => n.toLocaleString("vi-VN") + "₫";

  const isRecentlyActive = (lastActive?: string) => {
    if (!lastActive) return false;
    return (now - new Date(lastActive).getTime()) < 86400000;
  };

  return (
    <div className="min-h-screen bg-[#0D0D12] text-white font-['Inter',sans-serif]">
      {/* ── SIDEBAR ── */}
      <aside className="fixed left-0 top-0 bottom-0 w-[220px] bg-[#0D0D12] border-r border-white/5 flex flex-col z-50">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#7C3AED] flex items-center justify-center text-[10px] font-black tracking-tighter text-white">
              U
            </div>
            <div>
              <span className="text-[11px] font-black uppercase tracking-[0.15em] text-white">GARMENT OS</span>
              <span className="block text-[8px] font-mono text-gray-500 tracking-widest">v2.4.0-STABLE</span>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map(item => (
            <Link
              key={item.key}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 text-[11px] font-black uppercase tracking-[0.12em] transition-all no-underline ${
                item.key === "users"
                  ? "bg-[#7C3AED]/15 text-[#7C3AED] border-l-2 border-[#7C3AED]"
                  : "text-gray-500 hover:text-gray-300 hover:bg-white/3 border-l-2 border-transparent"
              }`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {item.icon === "dashboard" && <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>}
                {item.icon === "inventory_2" && <><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" /></>}
                {item.icon === "group" && <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></>}
              </svg>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* System Status */}
        <div className="px-5 py-4 border-t border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-[8px] font-mono text-gray-500 uppercase tracking-widest">System Operational</span>
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="ml-[220px] min-h-screen">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 bg-[#0D0D12]/90 backdrop-blur-xl border-b border-white/5 px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-[13px] font-black uppercase tracking-[0.15em] text-white">
              USER DIRECTORY {" "}<span className="text-gray-500 font-mono text-[10px]">{"// DATABASE_01"}</span>
            </h1>
            <p className="text-[9px] font-mono text-gray-500 mt-0.5">
              Displaying {filtered.length} records. Filter: {search ? `"${search}"` : "None"}. Sorting: Last Active (DESC).
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
              <input
                type="text"
                placeholder="Tìm kiếm user..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="bg-white/5 border border-white/10 text-[10px] font-mono text-gray-300 pl-8 pr-4 py-2 w-[200px] focus:outline-none focus:border-[#7C3AED]/50 placeholder:text-gray-600 transition-colors"
              />
            </div>
          </div>
        </header>

        {/* Stats Row */}
        <div className="px-8 py-6">
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: "TOTAL USERS", value: totalUsers, sub: `${adminCount} admin`, accent: "#7C3AED" },
              { label: "ACTIVE (7D)", value: activeThisWeek, sub: "trong tuần qua", accent: "#10b981" },
              { label: "TOTAL ORDERS", value: users.reduce((s, u) => s + (u.ordersCount || 0), 0), sub: "tổng đơn hàng", accent: "#f59e0b" },
            ].map(s => (
              <div key={s.label} className="bg-white/[0.03] border border-white/5 p-5">
                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2">{s.label}</p>
                <p className="text-2xl font-black text-white">{s.value}</p>
                <p className="text-[9px] font-mono text-gray-500 mt-1">{s.sub}</p>
              </div>
            ))}
          </div>

          {/* User Table */}
          {loading ? (
            <div className="text-center py-32 text-gray-500 font-mono text-[10px] uppercase tracking-widest">
              <div className="w-5 h-5 border-2 border-[#7C3AED] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Loading user database...
            </div>
          ) : (
            <div className="border border-white/5 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-white/[0.02] border-b border-white/5">
                    {["ID", "USER", "EMAIL", "ROLE", "ORDERS", "TOTAL SPENT", "REGISTERED", "LAST ACTIVE", ""].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[8px] font-black uppercase tracking-[0.2em] text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-white/5 hover:bg-white/[0.03] transition-colors cursor-pointer group"
                      onClick={() => setSelected(user)}
                    >
                      <td className="px-4 py-3.5">
                        <code className="text-[9px] font-mono text-gray-500">{user.id.slice(-6).toUpperCase()}</code>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 bg-[#7C3AED]/20 border border-[#7C3AED]/30 flex items-center justify-center text-[9px] font-black text-[#7C3AED]">
                            {(user.firstName?.[0] || "").toUpperCase()}{(user.lastName?.[0] || "").toUpperCase()}
                          </div>
                          <div>
                            <p className="text-[11px] font-bold text-white">{user.firstName} {user.lastName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-[10px] font-mono text-gray-400">{user.email}</td>
                      <td className="px-4 py-3.5">
                        <span className={`text-[8px] font-black uppercase tracking-[0.15em] px-2 py-1 ${
                          user.admin
                            ? "bg-[#7C3AED]/20 text-[#7C3AED] border border-[#7C3AED]/30"
                            : "bg-white/5 text-gray-400 border border-white/10"
                        }`}>
                          {user.admin ? "ADMIN" : "USER"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-[11px] font-black text-white">{user.ordersCount || 0}</td>
                      <td className="px-4 py-3.5 text-[10px] font-mono text-gray-400">{fmtMoney(user.totalSpent || 0)}</td>
                      <td className="px-4 py-3.5 text-[10px] font-mono text-gray-500">{fmtDate(user.createdAt)}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${isRecentlyActive(user.lastActive) ? "bg-green-400" : "bg-gray-600"}`} />
                          <span className="text-[9px] font-mono text-gray-500">
                            {user.lastActive ? fmtTime(user.lastActive) : "—"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <button title="Xem chi tiết" className="text-gray-600 hover:text-[#7C3AED] transition-colors opacity-0 group-hover:opacity-100">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Footer */}
              <div className="px-4 py-3 bg-white/[0.02] border-t border-white/5 flex items-center justify-between">
                <span className="text-[8px] font-mono text-gray-500 uppercase tracking-widest">
                  {filtered.length} / {totalUsers} records
                </span>
                <span className="text-[8px] font-mono text-gray-600 uppercase tracking-widest">
                  GARMENT_OS // USER_DB
                </span>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── USER DETAIL MODAL ── */}
      {selected && (
        <div className="fixed inset-0 z-[999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-[#111118] border border-white/10 max-w-md w-full overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="bg-[#7C3AED] px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-[11px] font-black uppercase tracking-[0.15em] text-white">USER PROFILE</h2>
                <p className="text-[9px] font-mono text-white/60 mt-0.5">{selected.id}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-white/60 hover:text-white transition-colors text-lg">✕</button>
            </div>

            {/* Avatar + Name */}
            <div className="px-6 py-6 flex items-center gap-4 border-b border-white/5">
              <div className="w-14 h-14 bg-[#7C3AED]/20 border border-[#7C3AED]/30 flex items-center justify-center text-lg font-black text-[#7C3AED]">
                {(selected.firstName?.[0] || "").toUpperCase()}{(selected.lastName?.[0] || "").toUpperCase()}
              </div>
              <div>
                <h3 className="text-base font-black text-white">{selected.firstName} {selected.lastName}</h3>
                <p className="text-[10px] font-mono text-gray-400 mt-0.5">{selected.email}</p>
                <span className={`inline-block mt-1.5 text-[7px] font-black uppercase tracking-[0.15em] px-2 py-0.5 ${
                  selected.admin
                    ? "bg-[#7C3AED]/20 text-[#7C3AED] border border-[#7C3AED]/30"
                    : "bg-white/5 text-gray-400 border border-white/10"
                }`}>
                  {selected.admin ? "ADMIN" : "USER"}
                </span>
              </div>
            </div>

            {/* Details Grid */}
            <div className="px-6 py-5 space-y-4">
              {([
                ["REGISTERED", fmtDate(selected.createdAt)],
                ["LAST ACTIVE", selected.lastActive ? `${fmtTime(selected.lastActive)} — ${fmtDate(selected.lastActive)}` : "—"],
                ["ORDERS", String(selected.ordersCount || 0)],
                ["TOTAL SPENT", fmtMoney(selected.totalSpent || 0)],
              ] as [string, string][]).map(([label, val]) => (
                <div key={label} className="flex justify-between items-center">
                  <span className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-500">{label}</span>
                  <span className="text-[11px] font-mono text-gray-300">{val}</span>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="px-6 pb-5">
              <button
                onClick={() => setSelected(null)}
                className="w-full py-2.5 border border-white/10 text-[10px] font-black uppercase tracking-[0.15em] text-gray-400 hover:text-white hover:border-white/30 transition-all"
              >
                CLOSE RECORD
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
