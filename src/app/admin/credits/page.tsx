"use client";
import { useState } from "react";
const mono = { fontFamily: "'JetBrains Mono',monospace" };

const PLANS = [
  { name: "STARTER", credits: 50, price: "$4.99", perCredit: "$0.10", popular: false },
  { name: "PRO", credits: 200, price: "$14.99", perCredit: "$0.075", popular: true },
  { name: "ENTERPRISE", credits: 1000, price: "$49.99", perCredit: "$0.05", popular: false },
];

const HISTORY = [
  { date: "2026-04-23", action: "AI_GENERATE", prompt: "logo lớp A5 varsity", credits: -1, balance: 47 },
  { date: "2026-04-23", action: "AI_GENERATE", prompt: "dragon mascot jersey", credits: -1, balance: 48 },
  { date: "2026-04-22", action: "CREDIT_PURCHASE", prompt: "PRO Pack — 200 credits", credits: 200, balance: 49 },
  { date: "2026-04-20", action: "AI_GENERATE", prompt: "galaxy cosmic neon", credits: -1, balance: -151 },
  { date: "2026-04-20", action: "BG_REMOVE", prompt: "Background removal", credits: -1, balance: -150 },
];

export default function CreditsPage() {
  const [balance] = useState(47);
  return (
    <div className="max-w-[1600px] mx-auto">
      <div className="mb-6 flex flex-col gap-1">
        <div className="flex items-center gap-2 text-[#7C3AED] text-xs mb-2" style={mono}>
          <span className="material-symbols-outlined text-[14px]">terminal</span>
          <span>root@unispace:~# ./credits_manager.sh</span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight uppercase" style={mono}>AI CREDITS <span className="text-[#7C3AED] font-normal">// BILLING</span></h2>
        <p className="text-sm text-[#9ca3af]" style={mono}>Purchase credits to power AI design generation.</p>
      </div>

      {/* Balance card */}
      <div className="mb-8 p-6 flex items-center justify-between" style={{ background: 'rgba(26,26,26,0.6)', backdropFilter: 'blur(16px)', border: '1px solid rgba(124,58,237,0.3)' }}>
        <div>
          <span className="text-[10px] text-[#9ca3af] uppercase tracking-widest block mb-1" style={mono}>CURRENT_BALANCE</span>
          <span className="text-5xl font-bold text-[#7C3AED]" style={mono}>{balance}</span>
          <span className="text-lg text-[#9ca3af] ml-2" style={mono}>CREDITS</span>
        </div>
        <div className="text-right text-xs text-[#9ca3af]" style={mono}>
          <div>1 CREDIT = 1 AI GENERATION</div>
          <div className="mt-1">STATUS: <span className="text-[#7C3AED]">ACTIVE</span></div>
        </div>
      </div>

      {/* Pricing grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {PLANS.map(p => (
          <div key={p.name} className={`p-6 flex flex-col transition-all hover:border-[#7C3AED]/40 ${p.popular ? 'ring-2 ring-[#7C3AED]/50' : ''}`}
            style={{ background: p.popular ? 'rgba(124,58,237,0.08)' : 'rgba(26,26,26,0.6)', backdropFilter: 'blur(16px)', border: `1px solid ${p.popular ? 'rgba(124,58,237,0.4)' : 'rgba(51,51,51,1)'}` }}>
            {p.popular && <span className="text-[10px] text-[#7C3AED] uppercase tracking-widest mb-3 flex items-center gap-1" style={mono}>
              <span className="material-symbols-outlined text-[12px]">star</span>MOST POPULAR
            </span>}
            <h3 className="text-lg font-black uppercase tracking-wider mb-1">{p.name}</h3>
            <div className="text-3xl font-bold text-[#7C3AED] mb-1" style={mono}>{p.price}</div>
            <div className="text-xs text-[#9ca3af] mb-4" style={mono}>{p.credits} credits • {p.perCredit}/credit</div>
            <button className={`mt-auto w-full py-3 text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 ${
              p.popular ? 'bg-[#7C3AED] text-white hover:bg-[#7C3AED]/80' : 'border border-[#7C3AED]/30 text-[#7C3AED] hover:bg-[#7C3AED]/10'
            }`} style={mono}>
              <span className="material-symbols-outlined text-[14px]">shopping_cart</span>
              PURCHASE
            </button>
          </div>
        ))}
      </div>

      {/* Usage history */}
      <div className="w-full overflow-x-auto" style={{ background: 'rgba(26,26,26,0.6)', backdropFilter: 'blur(16px)', border: '1px solid rgba(124,58,237,0.15)' }}>
        <div className="px-4 py-3 border-b border-white/10">
          <h3 className="text-sm font-black uppercase tracking-widest">USAGE HISTORY</h3>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#262626] border-b border-white/20">
              {["Date","Action","Details","Credits","Balance"].map((h,i) => (
                <th key={h} className={`py-3 px-4 text-xs font-semibold text-[#7C3AED] uppercase tracking-wider ${i < 4 ? 'border-r border-[rgba(124,58,237,0.08)]' : ''}`} style={mono}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="text-sm">
            {HISTORY.map((h, idx) => (
              <tr key={idx} className={`hover:bg-[#7C3AED]/10 transition-colors ${idx % 2 === 1 ? 'bg-black/20' : ''}`} style={{ borderBottom: '1px solid rgba(124,58,237,0.08)' }}>
                <td className="py-3 px-4 text-xs text-[#9ca3af] border-r border-[rgba(124,58,237,0.08)]" style={mono}>{h.date}</td>
                <td className="py-3 px-4 border-r border-[rgba(124,58,237,0.08)]">
                  <span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 ${
                    h.action === 'CREDIT_PURCHASE' ? 'bg-[#7C3AED]/20 border border-[#7C3AED]/50 text-[#7C3AED]' : 'bg-white/5 border border-white/10 text-[#9ca3af]'
                  }`} style={mono}>{h.action}</span>
                </td>
                <td className="py-3 px-4 text-[#9ca3af] text-xs border-r border-[rgba(124,58,237,0.08)]" style={mono}>{h.prompt}</td>
                <td className={`py-3 px-4 border-r border-[rgba(124,58,237,0.08)] ${h.credits > 0 ? 'text-[#7C3AED]' : 'text-[#ff6b6b]'}`} style={mono}>{h.credits > 0 ? `+${h.credits}` : h.credits}</td>
                <td className="py-3 px-4" style={mono}>{h.balance}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
