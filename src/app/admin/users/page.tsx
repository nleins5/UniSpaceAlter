"use client";
const mono = { fontFamily: "'JetBrains Mono',monospace" };
const USERS = [
  { id: "USR_0921", name: "Elenor Vance", email: "e.vance@outpost-7.net", orders: 14, spent: "$1,245.50", status: "ACTIVE_LINK", statusColor: "#7C3AED" },
  { id: "USR_0884", name: "Marcus Thorne", email: "mthorne@stellar-sys.co", orders: 3, spent: "$450.00", status: "PENDING_AUTH", statusColor: "#c8a0f0" },
  { id: "USR_0752", name: "Sarah Jenkins", email: "s.jenkins@void-corp.com", orders: 42, spent: "$8,920.75", status: "OFFLINE", statusColor: "#9ca3af" },
  { id: "USR_0611", name: "David Chen", email: "dchen_99@nebula.io", orders: 8, spent: "$1,105.20", status: "ACTIVE_LINK", statusColor: "#7C3AED" },
  { id: "USR_0543", name: "Elena Rostova", email: "erostova@deleted.net", orders: 0, spent: "$0.00", status: "SUSPENDED", statusColor: "#ff6b6b", suspended: true },
  { id: "USR_0499", name: "James Wilson", email: "j.wilson@core-systems.net", orders: 1, spent: "$150.00", status: "OFFLINE", statusColor: "#9ca3af" },
];

export default function UsersPage() {
  return (
    <div className="max-w-[1600px] mx-auto">
      <div className="mb-6 flex flex-col gap-1">
        <div className="flex items-center gap-2 text-[#7C3AED] text-xs mb-2" style={mono}>
          <span className="material-symbols-outlined text-[14px]">terminal</span>
          <span>root@unispace:~# ./view_users.sh</span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight uppercase" style={mono}>USER DIRECTORY <span className="text-[#7C3AED] font-normal">// DATABASE_01</span></h2>
        <p className="text-sm text-[#9ca3af]" style={mono}>Displaying 6 records. Filter: None. Sorting: Last Active (DESC).</p>
      </div>

      {/* Toolbar */}
      <div className="flex justify-between items-center mb-4 p-3" style={{ background: 'rgba(26,26,26,0.6)', backdropFilter: 'blur(16px)', border: '1px solid rgba(124,58,237,0.15)' }}>
        <div className="flex gap-2">
          {[{ icon: "filter_alt", label: "FILTER_RECORDS" }, { icon: "download", label: "EXPORT_CSV" }].map(b => (
            <button key={b.label} className="px-3 py-1.5 bg-[#262626] border border-white/20 text-white text-xs hover:bg-[#7C3AED]/10 transition-colors flex items-center gap-2" style={mono}>
              <span className="material-symbols-outlined text-[14px]">{b.icon}</span>{b.label}
            </button>
          ))}
        </div>
        <div className="text-xs text-[#9ca3af]" style={mono}>STATUS: <span className="text-[#7C3AED]">ONLINE</span> | LATENCY: 24ms</div>
      </div>

      {/* Table */}
      <div className="w-full overflow-x-auto shadow-lg" style={{ background: 'rgba(26,26,26,0.6)', backdropFilter: 'blur(16px)', border: '1px solid rgba(124,58,237,0.15)' }}>
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-[#262626] border-b border-white/20">
              {["User ID","Name","Email Address","Orders","Total Spent","Status","Actions"].map((h,i) => (
                <th key={h} className={`py-3 px-4 text-xs font-semibold text-[#7C3AED] uppercase tracking-wider ${i < 6 ? 'border-r border-[rgba(124,58,237,0.08)]' : ''} ${i === 3 || i === 4 ? 'text-right' : ''}`} style={mono}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="text-sm">
            {USERS.map((u, idx) => (
              <tr key={u.id} className={`hover:bg-[#7C3AED]/10 transition-colors group ${idx % 2 === 1 ? 'bg-black/20' : ''}`} style={{ borderBottom: '1px solid rgba(124,58,237,0.08)' }}>
                <td className={`py-3 px-4 text-xs group-hover:text-[#7C3AED] transition-colors border-r border-[rgba(124,58,237,0.08)] ${u.suspended ? 'text-[#ff6b6b]' : 'text-[#9ca3af]'}`} style={mono}>{u.id}</td>
                <td className={`py-3 px-4 font-bold border-r border-[rgba(124,58,237,0.08)] ${u.suspended ? 'opacity-50 line-through' : ''}`}>{u.name}</td>
                <td className={`py-3 px-4 text-[#9ca3af] text-xs border-r border-[rgba(124,58,237,0.08)] ${u.suspended ? 'opacity-50' : ''}`} style={mono}>{u.email}</td>
                <td className={`py-3 px-4 text-right border-r border-[rgba(124,58,237,0.08)] ${u.suspended ? 'opacity-50' : ''}`} style={mono}>{u.orders}</td>
                <td className={`py-3 px-4 text-right border-r border-[rgba(124,58,237,0.08)] ${u.suspended ? 'opacity-50' : ''}`} style={mono}>{u.spent}</td>
                <td className="py-3 px-4 border-r border-[rgba(124,58,237,0.08)]">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] uppercase tracking-widest" style={{
                    ...mono,
                    color: u.statusColor,
                    background: `${u.statusColor}20`,
                    border: `1px solid ${u.statusColor}50`,
                  }}>
                    <span className="w-1.5 h-1.5" style={{ background: u.statusColor, boxShadow: u.status === 'ACTIVE_LINK' ? `0 0 5px ${u.statusColor}` : 'none' }} />
                    {u.status}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex gap-3">
                    {u.suspended ? (
                      <button className="text-[#9ca3af] hover:text-white text-[10px] uppercase tracking-wider flex items-center gap-1 transition-colors" style={mono}>
                        <span className="material-symbols-outlined text-[14px]">lock_open</span>Unlock
                      </button>
                    ) : (
                      <button className="text-[#7C3AED] hover:text-white text-[10px] uppercase tracking-wider flex items-center gap-1 transition-colors" style={mono}>
                        <span className="material-symbols-outlined text-[14px]">edit_attributes</span>Edit
                      </button>
                    )}
                    <button className="text-[#9ca3af] hover:text-white text-[10px] uppercase tracking-wider flex items-center gap-1 transition-colors" style={mono}>
                      <span className="material-symbols-outlined text-[14px]">history</span>Log
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex justify-between items-center text-xs text-[#9ca3af]" style={mono}>
        <div>SHOWING 1-6 OF 1,204 RECORDS</div>
        <div className="flex gap-1">
          <button className="px-2 py-1 border border-white/10 hover:bg-white/10 hover:text-[#7C3AED] transition-colors">PREV</button>
          <button className="px-2 py-1 bg-[#7C3AED]/20 border border-[#7C3AED]/50 text-[#7C3AED]">1</button>
          {[2,3].map(n => <button key={n} className="px-2 py-1 border border-white/10 hover:bg-white/10 hover:text-[#7C3AED] transition-colors">{n}</button>)}
          <span className="px-2 py-1">...</span>
          <button className="px-2 py-1 border border-white/10 hover:bg-white/10 hover:text-[#7C3AED] transition-colors">201</button>
          <button className="px-2 py-1 border border-white/10 hover:bg-white/10 hover:text-[#7C3AED] transition-colors">NEXT</button>
        </div>
      </div>
    </div>
  );
}
