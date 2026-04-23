"use client";
import { useState } from "react";
const mono = { fontFamily: "'JetBrains Mono',monospace" };

const COLLECTIONS = [
  { id: "COL_001", name: "VARSITY 2026", items: 12, status: "LIVE", color: "#7C3AED", date: "2026-04-01" },
  { id: "COL_002", name: "STREETWEAR DROP", items: 8, status: "DRAFT", color: "#9ca3af", date: "2026-04-15" },
  { id: "COL_003", name: "NEXT PLAYER OG", items: 6, status: "LIVE", color: "#7C3AED", date: "2026-03-20" },
  { id: "COL_004", name: "CLASS A5 EXCLUSIVE", items: 4, status: "SCHEDULED", color: "#c8a0f0", date: "2026-05-01" },
];

const DESIGNS = [
  { id: "DSG_101", name: "Dragon Logo Tee", collection: "VARSITY 2026", pushed: true, price: "$24.99" },
  { id: "DSG_102", name: "Cosmic Raglan", collection: "STREETWEAR DROP", pushed: false, price: "$29.99" },
  { id: "DSG_103", name: "A5 Class Jersey", collection: "CLASS A5 EXCLUSIVE", pushed: true, price: "$34.99" },
  { id: "DSG_104", name: "Galaxy Hoodie", collection: "NEXT PLAYER OG", pushed: false, price: "$39.99" },
  { id: "DSG_105", name: "Mascot Polo", collection: "VARSITY 2026", pushed: true, price: "$27.99" },
];

export default function CollectionsPage() {
  const [tab, setTab] = useState<"collections"|"designs">("collections");
  return (
    <div className="max-w-[1600px] mx-auto">
      <div className="mb-6 flex flex-col gap-1">
        <div className="flex items-center gap-2 text-[#7C3AED] text-xs mb-2" style={mono}>
          <span className="material-symbols-outlined text-[14px]">terminal</span>
          <span>root@unispace:~# ./manage_collections.sh</span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight uppercase" style={mono}>COLLECTIONS <span className="text-[#7C3AED] font-normal">// MARKETPLACE</span></h2>
        <p className="text-sm text-[#9ca3af]" style={mono}>Manage collections and push designs to the homepage storefront.</p>
      </div>

      {/* Tab toggle */}
      <div className="flex gap-2 mb-6">
        {(["collections","designs"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-xs uppercase tracking-widest transition-colors ${tab === t ? 'bg-[#7C3AED]/20 border border-[#7C3AED]/50 text-[#7C3AED]' : 'border border-white/10 text-[#9ca3af] hover:bg-white/5'}`} style={mono}>{t}</button>
        ))}
        <button className="ml-auto px-4 py-2 text-xs uppercase tracking-widest bg-[#7C3AED] text-white hover:bg-[#7C3AED]/80 transition-colors flex items-center gap-2" style={mono}>
          <span className="material-symbols-outlined text-[14px]">add</span>
          {tab === "collections" ? "NEW COLLECTION" : "NEW DESIGN"}
        </button>
      </div>

      {tab === "collections" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {COLLECTIONS.map(c => (
            <div key={c.id} className="p-5 group hover:border-[#7C3AED]/30 transition-all" style={{ background: 'rgba(26,26,26,0.6)', backdropFilter: 'blur(16px)', border: '1px solid rgba(51,51,51,1)' }}>
              <div className="flex justify-between items-start mb-3">
                <span className="text-[10px] text-[#9ca3af] uppercase tracking-widest" style={mono}>{c.id}</span>
                <span className="text-[10px] uppercase tracking-widest px-2 py-0.5" style={{ ...mono, color: c.color, background: `${c.color}20`, border: `1px solid ${c.color}50` }}>
                  <span className="inline-block w-1.5 h-1.5 mr-1.5" style={{ background: c.color }} />{c.status}
                </span>
              </div>
              <h3 className="text-lg font-black uppercase tracking-wider mb-2">{c.name}</h3>
              <div className="flex gap-6 text-xs text-[#9ca3af] mb-4" style={mono}>
                <span>{c.items} ITEMS</span><span>CREATED: {c.date}</span>
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 text-[10px] uppercase tracking-wider border border-[#7C3AED]/30 text-[#7C3AED] hover:bg-[#7C3AED]/10 transition-colors flex items-center gap-1" style={mono}>
                  <span className="material-symbols-outlined text-[12px]">rocket_launch</span>PUSH TO STORE
                </button>
                <button className="px-3 py-1.5 text-[10px] uppercase tracking-wider border border-white/10 text-[#9ca3af] hover:text-white hover:bg-white/5 transition-colors flex items-center gap-1" style={mono}>
                  <span className="material-symbols-outlined text-[12px]">edit</span>EDIT
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="w-full overflow-x-auto" style={{ background: 'rgba(26,26,26,0.6)', backdropFilter: 'blur(16px)', border: '1px solid rgba(124,58,237,0.15)' }}>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#262626] border-b border-white/20">
                {["Design ID","Name","Collection","Price","On Store","Actions"].map((h,i) => (
                  <th key={h} className={`py-3 px-4 text-xs font-semibold text-[#7C3AED] uppercase tracking-wider ${i < 5 ? 'border-r border-[rgba(124,58,237,0.08)]' : ''}`} style={mono}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="text-sm">
              {DESIGNS.map((d, idx) => (
                <tr key={d.id} className={`hover:bg-[#7C3AED]/10 transition-colors ${idx % 2 === 1 ? 'bg-black/20' : ''}`} style={{ borderBottom: '1px solid rgba(124,58,237,0.08)' }}>
                  <td className="py-3 px-4 text-xs text-[#9ca3af] border-r border-[rgba(124,58,237,0.08)]" style={mono}>{d.id}</td>
                  <td className="py-3 px-4 font-bold border-r border-[rgba(124,58,237,0.08)]">{d.name}</td>
                  <td className="py-3 px-4 text-xs text-[#9ca3af] border-r border-[rgba(124,58,237,0.08)]" style={mono}>{d.collection}</td>
                  <td className="py-3 px-4 border-r border-[rgba(124,58,237,0.08)]" style={mono}>{d.price}</td>
                  <td className="py-3 px-4 border-r border-[rgba(124,58,237,0.08)]">
                    {d.pushed ? (
                      <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 bg-[#7C3AED]/20 border border-[#7C3AED]/50 text-[#7C3AED]" style={mono}>● LIVE</span>
                    ) : (
                      <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 bg-white/5 border border-white/10 text-[#9ca3af]" style={mono}>○ UNPUBLISHED</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <button className="text-[#7C3AED] hover:text-white text-[10px] uppercase tracking-wider flex items-center gap-1 transition-colors" style={mono}>
                      <span className="material-symbols-outlined text-[14px]">{d.pushed ? 'remove_circle_outline' : 'rocket_launch'}</span>
                      {d.pushed ? 'UNPUBLISH' : 'PUSH LIVE'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
