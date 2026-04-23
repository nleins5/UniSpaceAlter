"use client";

export default function AnalyticsPage() {
  return (
    <div className="max-w-[1600px] mx-auto">
      <div className="mb-6">
        <div className="adm-mono flex items-center gap-2 text-[#7C3AED] text-xs mb-2">
          <span className="material-symbols-outlined text-[14px]">terminal</span>
          <span>root@unispace:~# ./analytics_engine.sh</span>
        </div>
        <h2 className="adm-mono text-2xl font-bold tracking-tight uppercase">ANALYTICS <span className="text-[#7C3AED] font-normal">{'// INSIGHTS'}</span></h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { label: "Top Selling Design", value: "Dragon Logo Tee", sub: "342 units / 30D" },
          { label: "Revenue This Month", value: "$12,847.50", sub: "+18.3% vs last month" },
          { label: "AI Generations", value: "1,247", sub: "Avg 41.5/day" },
          { label: "Return Rate", value: "2.1%", sub: "Below industry avg (4.2%)" },
        ].map(s => (
          <div key={s.label} className="adm-glass p-6 group">
            <span className="adm-mono text-[10px] text-[#9ca3af] uppercase tracking-widest block mb-2">{s.label}</span>
            <div className="adm-mono text-3xl font-bold text-[#7C3AED] mb-1">{s.value}</div>
            <span className="adm-mono text-xs text-[#9ca3af]">{s.sub}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
