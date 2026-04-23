"use client";
const mono = { fontFamily: "'JetBrains Mono',monospace" };

const KPIS = [
  { id: "082", label: "Revenue Stream", value: "$1.24M", trend: "+14.2%", status: "OPTIMIZED", color: "#7C3AED", up: true },
  { id: "104", label: "Active Orders", value: "8,492", trend: "-0.4%", status: "STABLE", color: "#fff", up: false },
  { id: "019", label: "Total Users", value: "142.5K", trend: "+22.8%", status: "SURGE", color: "#7C3AED", up: true },
  { id: "211", label: "Conversion Rate", value: "4.12%", trend: "-1.2%", status: "DEVIATION", color: "#ff6b6b", up: false },
];

const LOGS = [
  { time: "14:02:11", msg: "AUTH_SUCCESS: User_ID #9021", type: "normal" },
  { time: "14:01:45", msg: "SYNC_INIT: Node_Alpha → Node_Beta", type: "normal" },
  { time: "13:59:02", msg: "WARN: Payload size exceeds threshold (8.2MB)", type: "error" },
  { time: "13:55:18", msg: "DB_QUERY: Index optimized (+14ms)", type: "normal" },
  { time: "13:50:00", msg: "CRON: Scheduled backup complete.", type: "accent" },
];

export default function AdminDashboard() {
  return (
    <div className="max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="mb-8 border-b border-[#333] pb-4">
        <h1 className="text-3xl font-black tracking-tighter uppercase">SYSTEM OVERVIEW // REAL-TIME METRICS</h1>
        <div className="flex items-center mt-2 gap-4 text-xs text-[#9ca3af]" style={mono}>
          <span className="flex items-center"><span className="w-2 h-2 bg-[#7C3AED] mr-2" /> TERMINAL_ACTIVE</span>
          <span>|</span><span>UPTIME: 94:12:08</span><span>|</span>
          <span className="text-[#7C3AED]">SECURE_CONNECTION</span>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-[#333] p-px mb-8">
        {KPIS.map(k => (
          <div key={k.id} className="p-6 relative group" style={{ background: 'rgba(26,26,26,0.6)', backdropFilter: 'blur(16px)', border: '1px solid rgba(51,51,51,1)' }}>
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest" style={mono}>METRIC_ID: {k.id}</span>
              <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 border" style={{
                ...mono,
                color: k.color,
                background: k.color === '#fff' ? 'rgba(255,255,255,0.1)' : `${k.color}15`,
                borderColor: k.color === '#fff' ? 'rgba(255,255,255,0.2)' : `${k.color}30`,
              }}>STATUS: {k.status}</span>
            </div>
            <div className="text-sm font-bold mb-1 uppercase tracking-wider">{k.label}</div>
            <div className="text-4xl font-bold mb-2" style={{ ...mono, color: k.color === '#fff' ? '#fff' : k.color }}>{k.value}</div>
            <div className="flex items-center text-xs" style={{ ...mono, color: k.color === '#fff' ? '#9ca3af' : k.color }}>
              <span className="material-symbols-outlined text-[14px] mr-1">{k.up ? 'trending_up' : k.trend.startsWith('-') ? 'trending_down' : 'trending_flat'}</span>
              {k.trend} / CYCL
            </div>
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r opacity-0 group-hover:opacity-100 transition-opacity" style={{ borderColor: `${k.color}80` }} />
          </div>
        ))}
      </div>

      {/* Chart + Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart */}
        <div className="lg:col-span-2 p-6 flex flex-col" style={{ background: 'rgba(26,26,26,0.6)', backdropFilter: 'blur(16px)', border: '1px solid rgba(51,51,51,1)' }}>
          <div className="flex justify-between items-center mb-6 border-b border-[#333] pb-4">
            <div>
              <h3 className="text-lg font-black uppercase tracking-widest">Performance Growth</h3>
              <p className="text-xs text-[#9ca3af] mt-1" style={mono}>DATA_SET: Q3_AGGREGATE // INTERVAL: H1</p>
            </div>
            <div className="flex gap-2">
              {["1D","7D","30D"].map((t,i) => (
                <button key={t} className={`px-3 py-1 text-xs border transition-colors ${i===1 ? 'border-[#7C3AED] bg-[#7C3AED]/10 text-[#7C3AED]' : 'border-[#333] text-[#9ca3af] hover:bg-[#333] hover:text-white'}`} style={mono}>{t}</button>
              ))}
            </div>
          </div>
          <div className="flex-1 relative min-h-[300px] border-l border-b border-[#333] ml-10">
            {/* Y axis */}
            <div className="absolute left-[-40px] top-0 bottom-0 flex flex-col justify-between text-[10px] text-[#9ca3af] text-right w-8" style={mono}>
              <span>100</span><span>75</span><span>50</span><span>25</span><span>0</span>
            </div>
            {/* Grid */}
            <div className="absolute inset-0 flex flex-col justify-between opacity-10 pointer-events-none">
              {[0,1,2,3].map(i => <div key={i} className="w-full border-t border-white border-dashed" />)}
              <div className="w-full" />
            </div>
            {/* SVG Chart */}
            <svg className="absolute inset-0 w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M0,80 L20,60 L40,65 L60,30 L80,45 L100,10" fill="none" stroke="rgba(124,58,237,0.3)" strokeWidth="4" filter="url(#blur)" />
              <path d="M0,80 L20,60 L40,65 L60,30 L80,45 L100,10" fill="none" stroke="#7C3AED" strokeWidth="2" />
              <circle cx="80" cy="45" r="4" fill="#1a1a1a" stroke="#7C3AED" strokeWidth="2" />
              <circle cx="80" cy="45" r="8" fill="none" stroke="#7C3AED" strokeWidth="1" strokeDasharray="2,2">
                <animateTransform attributeName="transform" type="rotate" from="0 80 45" to="360 80 45" dur="4s" repeatCount="indefinite" />
              </circle>
            </svg>
            {/* Tooltip */}
            <div className="absolute left-[80%] top-[35%] -translate-x-1/2 -translate-y-full mb-2 bg-[#1a1a1a] border border-[#7C3AED]/50 p-2 text-xs shadow-lg" style={mono}>
              <div className="text-[#7C3AED] mb-1">VAL: 84.2K</div>
              <div className="text-[#9ca3af]">TME: 14:00</div>
            </div>
            {/* X axis */}
            <div className="absolute bottom-[-24px] left-0 right-0 flex justify-between text-[10px] text-[#9ca3af] px-4" style={mono}>
              {["MON","TUE","WED","THU","FRI","SAT"].map((d,i) => (
                <span key={d} className={i===4 ? 'text-[#7C3AED] font-bold' : ''}>{d}</span>
              ))}
            </div>
          </div>
        </div>

        {/* System Logs */}
        <div className="p-6 flex flex-col" style={{ background: 'rgba(26,26,26,0.6)', backdropFilter: 'blur(16px)', border: '1px solid rgba(51,51,51,1)' }}>
          <h3 className="text-lg font-black uppercase tracking-widest border-b border-[#333] pb-4 mb-4">System Logs</h3>
          <div className="flex-1 overflow-hidden space-y-3 text-xs" style={mono}>
            {LOGS.map((l,i) => (
              <div key={i} className="flex items-start">
                <span className={`mr-2 ${l.type === 'error' ? 'text-[#ff6b6b]' : l.type === 'accent' ? 'text-[#7C3AED]' : 'text-white'}`}>[{l.time}]</span>
                <span className={l.type === 'error' ? 'text-[#ff6b6b]' : l.type === 'accent' ? 'text-[#7C3AED]' : 'text-[#9ca3af]'}>{l.msg}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-[#333] flex justify-between items-center">
            <span className="text-[10px] text-[#9ca3af]" style={mono}>STATUS: LISTENING...</span>
            <button className="text-xs font-bold uppercase hover:text-[#7C3AED] transition-colors">Export Logs</button>
          </div>
        </div>
      </div>
    </div>
  );
}
