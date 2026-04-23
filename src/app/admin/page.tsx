"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminHubPage() {
  const router = useRouter();
  const [status, setStatus] = useState("Đang khởi tạo phiên admin...");

  const enterAsAdmin = () => {
    // Inject a mock admin session so auth guards pass
    sessionStorage.setItem("user", JSON.stringify({
      username: "admin",
      admin: true,
      token: "dev-test-token-unispace-admin-2026",
    }));
    setStatus("✅ Phiên admin đã được tạo. Đang chuyển hướng...");
    setTimeout(() => router.push("/admin/designs"), 800);
  };

  useEffect(() => {
    // Auto-enter if already has admin session
    const raw = sessionStorage.getItem("user");
    if (raw) {
      try {
        const u = JSON.parse(raw);
        if (u.admin) { router.push("/admin/designs"); return; }
      } catch { /* continue */ }
    }
    setStatus("Chưa có phiên admin. Nhấn nút bên dưới để vào test.");
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0c081c] flex items-center justify-center p-6">
      {/* Blueprint grid */}
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: "linear-gradient(rgba(167,139,250,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(167,139,250,0.04) 1px, transparent 1px)",
        backgroundSize: "40px 40px"
      }} />

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="rounded-3xl overflow-hidden border border-violet-400/15"
          style={{ background: "rgba(20,12,40,0.92)", backdropFilter: "blur(24px)" }}>

          {/* Header */}
          <div className="px-8 py-6 border-b border-violet-400/10"
            style={{ background: "rgba(12,8,28,0.8)" }}>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-violet-400/60 font-mono">
                UniSpace Admin
              </span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Admin Panel
            </h1>
            <p className="text-[12px] text-violet-300/50 mt-1 font-mono">
              Development Test Mode
            </p>
          </div>

          {/* Body */}
          <div className="px-8 py-8 flex flex-col gap-5">
            {/* Status message */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-violet-400/15"
              style={{ background: "rgba(124,58,237,0.08)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><path d="M12 8v4l2 2"/>
              </svg>
              <span className="text-[11px] text-violet-300/70 font-mono">{status}</span>
            </div>

            {/* Warning */}
            <div className="px-4 py-3 rounded-xl border border-yellow-400/15"
              style={{ background: "rgba(234,179,8,0.05)" }}>
              <p className="text-[10px] text-yellow-400/60 font-mono leading-relaxed">
                ⚠️ Trang này chỉ dùng để test. Phiên admin giả sẽ được tạo trong sessionStorage và mất khi đóng tab.
              </p>
            </div>

            {/* Enter button */}
            <button
              onClick={enterAsAdmin}
              className="w-full py-4 rounded-2xl text-[12px] font-black uppercase tracking-[0.2em] text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: "linear-gradient(135deg, #7C3AED 0%, #a78bfa 100%)", boxShadow: "0 0 32px rgba(124,58,237,0.35)" }}
            >
              🚀 Vào Admin Panel
            </button>

            {/* Nav links */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              {[
                { label: "📋 Đơn hàng", href: "/admin/designs" },
                { label: "👥 Người dùng", href: "/admin/users" },
                { label: "🎨 Design Studio", href: "/design" },
                { label: "🏠 Trang chủ", href: "/" },
              ].map(({ label, href }) => (
                <a key={href} href={href}
                  className="flex items-center justify-center py-2.5 px-3 rounded-xl text-[11px] font-bold text-violet-300/60 hover:text-violet-200 transition-all border border-violet-400/10 hover:border-violet-400/25"
                  style={{ background: "rgba(124,58,237,0.06)" }}>
                  {label}
                </a>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 py-4 border-t border-violet-400/08 flex items-center justify-between">
            <span className="text-[9px] font-mono text-violet-400/30 uppercase tracking-widest">
              UniSpace Admin v1.0
            </span>
            <span className="text-[9px] font-mono text-violet-400/30">
              DEV BUILD
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
