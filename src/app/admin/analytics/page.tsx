"use client";
const mono = { fontFamily: "'JetBrains Mono',monospace" };
export default function AnalyticsPage() {
  return (
    <div className="max-w-[1600px] mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-[#7C3AED] text-xs mb-2" style={mono}>
          <span className="material-symbols-outlined text-[14px]">terminal</span>
          <span>root@unispace:~# ./analytics_engine.sh</span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight uppercase" style={mono}>ANALYTICS <span className="text-[#7C3AED] font-normal">// INSIGHTS</span></h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { label: "Top Selling Design", value: "Dragon Logo Tee", sub: "342 units / 30D" },
          { label: "Revenue This Month", value: "$12,847.50", sub: "+18.3% vs last month" },
          { label: "AI Generations", value: "1,247", sub: "Avg 41.5/day" },
          { label: "Return Rate", value: "2.1%", sub: "Below industry avg (4.2%)" },
        ].map(s => (
          <div key={s.label} className="p-6 group" style={{ background:'rgba(26,26,26,0.6)', backdropFilter:'blur(16px)', border:'1px solid rgba(51,51,51,1)' }}>
            <span className="text-[10px] text-[#9ca3af] uppercase tracking-widest block mb-2" style={mono}>{s.label}</span>
            <div className="text-3xl font-bold text-[#7C3AED] mb-1" style={mono}>{s.value}</div>
            <span className="text-xs text-[#9ca3af]" style={mono}>{s.sub}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
