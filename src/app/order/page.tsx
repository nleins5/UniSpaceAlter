"use client";

import React, { useState, useEffect, useCallback, useId } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

type SizeKey = "XS" | "S" | "M" | "L" | "XL" | "XXL";

interface OrderInfo {
  name: string;
  phone: string;
  address: string;
  className: string;
  note: string;
  sizes: Record<SizeKey, number>;
  projectName?: string;
  garmentType?: string;
  color?: string;
}

const SIZES: SizeKey[] = ["XS", "S", "M", "L", "XL", "XXL"];

export default function OrderPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  // useId() is SSR-safe and stable — avoids hydration mismatch without needing useEffect
  const rawId = useId();
  const orderId = "ORD-" + rawId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase();

  const [info, setInfo] = useState<OrderInfo>(() => {
    // Lazy init from sessionStorage to avoid hydration mismatch
    const defaultInfo: OrderInfo = {
      name: "", phone: "", address: "", className: "", note: "",
      sizes: { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0 },
      projectName: "", garmentType: "RAGLAN", color: "",
    };
    if (typeof window === 'undefined') return defaultInfo;
    try {
      const configStr = sessionStorage.getItem("design_config");
      if (configStr) {
        const config = JSON.parse(configStr);
        defaultInfo.garmentType = config.garmentType || defaultInfo.garmentType;
        defaultInfo.color = config.tshirtColor || defaultInfo.color;
        defaultInfo.projectName = config.projectName || defaultInfo.projectName;
      }
      const saved = sessionStorage.getItem("order_draft");
      if (saved) {
        Object.assign(defaultInfo, JSON.parse(saved));
      }
    } catch {}
    return defaultInfo;
  });
  const [previews] = useState<{front: string; back: string} | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const front = sessionStorage.getItem("design_preview_front");
      const back = sessionStorage.getItem("design_preview_back");
      if (front && back) return { front, back };
    } catch {}
    return null;
  });

  const [isAdmin] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem("admin_logged_in") === "true";
  });

  // Auto-save draft
  useEffect(() => {
    sessionStorage.setItem("order_draft", JSON.stringify(info));
  }, [info]);

  const setField = useCallback(
    (key: keyof Omit<OrderInfo, "sizes">, val: string) =>
      setInfo((p) => ({ ...p, [key]: val })),
    []
  );

  const setSize = useCallback(
    (size: SizeKey, val: number) =>
      setInfo((p) => ({ ...p, sizes: { ...p.sizes, [size]: Math.max(0, val) } })),
    []
  );

  const totalQty = Object.values(info.sizes).reduce((a, b) => a + b, 0);
  const isValid = info.name.trim() && info.phone.trim() && info.address.trim() && totalQty > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || isSubmitting) return;
    setIsSubmitting(true);
    try {
      // Build FormData matching the API route's expected schema
      const fd = new FormData();
      fd.append("name", info.name.trim());
      fd.append("phone", info.phone.trim());
      fd.append("address", info.address.trim());
      fd.append("email", "");
      fd.append("size", Object.entries(info.sizes)
        .filter(([, v]) => v > 0)
        .map(([k, v]) => `${k}×${v}`)
        .join(", ") || "M");
      fd.append("color", info.color || "#ffffff");
      fd.append("quantity", String(totalQty));
      fd.append("notes", [
        info.className ? `Lớp: ${info.className}` : "",
        info.note || "",
      ].filter(Boolean).join(" | "));
      fd.append("shirtType", info.garmentType || "RAGLAN");

      // Convert base64 data URL to Blob directly (avoids CSP issues with fetch(dataUrl))
      const dataUrlToBlob = (dataUrl: string): Blob => {
        const [meta, base64] = dataUrl.split(",");
        const mime = meta.match(/:(.*?);/)?.[1] || "image/png";
        const bytes = atob(base64);
        const arr = new Uint8Array(bytes.length);
        for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
        return new Blob([arr], { type: mime });
      };

      const frontDataUrl = sessionStorage.getItem("design_preview_front");
      const backDataUrl = sessionStorage.getItem("design_preview_back");

      if (frontDataUrl) {
        fd.append("frontDesign", dataUrlToBlob(frontDataUrl), "front_design.png");
      }
      if (backDataUrl) {
        fd.append("backDesign", dataUrlToBlob(backDataUrl), "back_design.png");
      }

      const response = await fetch("/api/orders", { method: "POST", body: fd });
      const result = await response.json();

      if (!response.ok) {
        alert(`Lỗi: ${result.error || "Gửi đơn thất bại"}`);
        setIsSubmitting(false);
        return;
      }
    } catch (err) {
      console.error("Order submit error:", err);
      alert("Không thể gửi đơn hàng. Vui lòng thử lại.");
      setIsSubmitting(false);
      return;
    }

    // Success — cleanup
    sessionStorage.removeItem("order_draft");
    sessionStorage.removeItem("design_preview_front");
    sessionStorage.removeItem("design_preview_back");
    sessionStorage.removeItem("design_config");
    setSubmitted(true);
    setIsSubmitting(false);
  };

  if (submitted) {
    return <SuccessScreen orderId={orderId} onReturn={() => router.push("/design")} />;
  }

  return (
    <div className="order-page-root">
      <div className="order-grid-bg" />
      <div className="order-watermark" aria-hidden="true">{isAdmin ? "ADMIN_CTRL" : "CONFIRMED"}</div>

      {/* ── Header ── */}
      <header className="order-header">
        <div className="order-header-left">
          <Link href="/design" className="order-back-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 12H5" /><polyline points="12 19 5 12 12 5" />
            </svg>
            BACK_TO_DESIGNER
          </Link>
          <div className="order-header-divider" />
          <div className="order-header-brand">UNISPACE_STUDIO</div>
        </div>
        <div className="order-header-right">
          <span className="order-status-dot" />
          <span className="order-status-label">{isAdmin ? "ADMIN_OVERRIDE_ACTIVE" : "ORDER_FORM_ACTIVE"}</span>
          <div className="order-header-id">REF: {orderId}</div>
        </div>
      </header>

      <main className="order-main">
        {/* Page title */}
        <div className="order-page-title">
          <div className="order-page-breadcrumb">
            root@unispace:~# ./submit_order.sh
          </div>
          <h1 className="order-page-h1">
            {isAdmin ? "DESIGN_MANAGEMENT" : "ORDER_FULFILLMENT"} <span className="order-page-h1-dim">{'/'+'/'}</span> {isAdmin ? "ARCHIVE_WORKFLOW" : "CUSTOMER_DATA"}
          </h1>
          <p className="order-page-subtitle">
            {isAdmin 
              ? "Review design specs and publish to the public collection."
              : `Điền thông tin trước khi gửi cho admin — SYSTEM_ID: ${orderId}`
            }
          </p>
        </div>

        <form onSubmit={handleSubmit} className="order-grid-layout">

          {/* ── LEFT: Preview & Specs ── */}
          <aside className="order-left-col">
            {/* Preview card */}
            <div className="order-card">
              <div className="order-confirmed-badge">READY_TO_SEND</div>
              <div className="order-preview-img-wrap">
                {previews?.front ? (
                  <div className="flex flex-col gap-4 p-4">
                    <div className="order-preview-side">
                      <div className="text-[10px] font-black text-violet-400 mb-1 tracking-widest uppercase opacity-60">Front View</div>
                      <Image src={previews.front} alt="Front Design" width={800} height={960} unoptimized className="w-full rounded-xl border border-white/5 bg-white/5" />
                    </div>
                    <div className="order-preview-side">
                      <div className="text-[10px] font-black text-violet-400 mb-1 tracking-widest uppercase opacity-60">Back View</div>
                      <Image src={previews.back} alt="Back Design" width={800} height={960} unoptimized className="w-full rounded-xl border border-white/5 bg-white/5" />
                    </div>
                  </div>
                ) : (
                  <div className="order-preview-placeholder">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.3">
                      <path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.57a1 1 0 00.99.84H5v10a2 2 0 002 2h10a2 2 0 002-2V10h1.15a1 1 0 00.99-.84l.58-3.57a2 2 0 00-1.34-2.23z" />
                    </svg>
                    <span className="order-preview-label">DESIGN_PREVIEW</span>
                    <span className="order-preview-sub">Quay lại Designer để xem thiết kế</span>
                  </div>
                )}
              </div>
            </div>

            {/* Technical specs */}
            <div className="order-card">
              <h3 className="order-card-title">TECHNICAL_SPECS</h3>
              <div className="order-specs-grid">
                {[
                  ["PROJECT_NAME:", info.projectName || "UNTITLED", true],
                  ["GARMENT_TYPE:", info.garmentType || "—", false],
                  ["COLOR_CODE:", info.color || "—", false],
                  ["FABRIC:", "POLY-COTTON", false],
                  ["PRINT_METHOD:", "SCREEN_PRINT", false],
                  ["TOTAL_QTY:", `${totalQty} áo`, totalQty > 0],
                ].map(([k, v, accent]) => (
                  <div key={String(k)} className="order-spec-row">
                    <span className="order-spec-key">{k}</span>
                    <span className={`order-spec-val${accent ? " order-spec-accent" : ""}`}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* System log */}
            <div className="order-card order-log-card">
              <div className="order-log-line"><span className="order-log-time">[SYS]</span><span className="order-log-text order-log-accent">FORM_SESSION_INITIALIZED</span></div>
              <div className="order-log-line"><span className="order-log-time">[INF]</span><span className="order-log-text">Awaiting user input...</span></div>
              <div className="order-log-line"><span className="order-log-time">[ENC]</span><span className="order-log-text">SECURE_CHANNEL: ACTIVE</span></div>
              <div className="order-log-line">
                <span className="order-log-time">[QTY]</span>
                <span className="order-log-text">Total_units: <strong className="text-white">{totalQty}</strong></span>
              </div>
              <div className="order-log-blink">
                <span className="order-log-cursor">█</span>
                <span className="order-log-text">STATUS: WAITING_FOR_SUBMIT</span>
              </div>
            </div>
          </aside>

          {/* ── RIGHT: Form ── */}
          <section className="order-right-col">
            <div className="order-card">
              <h3 className="order-card-title">FULFILLMENT_DETAILS</h3>

              {isAdmin ? (
                <div className="p-8 border-2 border-dashed border-violet-500/20 rounded-2xl bg-violet-500/5 flex flex-col items-center justify-center text-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-violet-500/10 flex items-center justify-center text-violet-400">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                      <polyline points="17 21 17 13 7 13 7 21" />
                      <polyline points="7 3 7 8 15 8" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-lg">ADMIN_PUBLISH_MODE</h4>
                    <p className="text-slate-400 text-sm max-w-xs mt-1">
                      You are logged in as admin. Use the collection system to save this design to the homepage.
                    </p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setShowSaveModal(true)}
                    className="px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white font-black rounded-xl transition-all scale-100 hover:scale-105 active:scale-95 shadow-lg shadow-violet-600/20"
                  >
                    SAVE_TO_COLLECTION_NOW
                  </button>
                </div>
              ) : (
                <>
                  <div className="order-field">
                    <label className="order-label">HỌ TÊN *</label>
                    <input type="text" className="order-input" placeholder="NGUYEN_VAN_A..." value={info.name}
                      onChange={(e) => setField("name", e.target.value)} required />
                  </div>

                  <div className="order-field-row">
                    <div className="order-field">
                      <label className="order-label">SỐ ĐIỆN THOẠI *</label>
                      <input type="tel" className="order-input" placeholder="0901_234_567..." value={info.phone}
                        onChange={(e) => setField("phone", e.target.value)} required />
                    </div>
                    <div className="order-field">
                      <label className="order-label">LỚP / TRƯỜNG</label>
                      <input type="text" className="order-input" placeholder="12A1 — THPT..." value={info.className}
                        onChange={(e) => setField("className", e.target.value)} />
                    </div>
                  </div>

                  <div className="order-field">
                    <label className="order-label">ĐỊA CHỈ GIAO HÀNG *</label>
                    <textarea className="order-input order-textarea" placeholder="123 DUONG_ABC, QUAN_1, TP.HCM..." rows={2}
                      value={info.address} onChange={(e) => setField("address", e.target.value)} required />
                  </div>

                  <div className="order-field">
                    <label className="order-label">GHI CHÚ</label>
                    <textarea className="order-input order-textarea" placeholder="YEU_CAU_THEM, MAU_SAC_DAC_BIET..." rows={2}
                      value={info.note} onChange={(e) => setField("note", e.target.value)} />
                  </div>
                </>
              )}
            </div>

            {/* Quantity matrix */}
            <div className="order-card">
              <h3 className="order-card-title">QUANTITY_MATRIX</h3>
              <div className="order-size-table-wrap">
                <table className="order-size-table">
                  <thead>
                    <tr>
                      {SIZES.map((s) => (
                        <th key={s} className="order-size-th">{s}</th>
                      ))}
                      <th className="order-size-th order-size-total-th">TOTAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      {SIZES.map((s) => (
                        <td key={s} className="order-size-td">
                          <input type="number" min={0} max={999}
                            aria-label={`Số lượng size ${s}`}
                            value={info.sizes[s]}
                            onChange={(e) => setSize(s, parseInt(e.target.value) || 0)}
                            className="order-size-input" />
                        </td>
                      ))}
                      <td className="order-size-td order-size-total">{totalQty}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="order-qty-note">
                TOTAL_UNITS: <strong className="text-white">{totalQty} áo</strong>
                {totalQty === 0 && <span className="order-qty-warn"> — Vui lòng nhập số lượng</span>}
              </p>
            </div>

            {/* Submit bar */}
            <div className="order-submit-wrap">
              <Link href="/design" className="order-cancel-btn">{isAdmin ? "BACK_TO_EDITOR" : "HỦY_ĐƠN"}</Link>
              {!isAdmin && (
                <button type="submit" disabled={!isValid || isSubmitting} className="order-submit-btn">
                  <span className="order-submit-slide" />
                  <span className="order-submit-content">
                    {isSubmitting ? (
                      <>
                        <span className="order-spinner" />
                        PROCESSING...
                      </>
                    ) : (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                        </svg>
                        INITIATE_PRODUCTION →
                      </>
                    )}
                  </span>
                </button>
              )}
              {isAdmin && (
                <button 
                  type="button" 
                  onClick={() => setShowSaveModal(true)}
                  className="order-submit-btn"
                >
                  <span className="order-submit-slide" />
                  <span className="order-submit-content">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                    </svg>
                    SAVE_AS_COLLECTION_ITEM
                  </span>
                </button>
              )}
            </div>
          </section>
        </form>
      </main>

      <footer className="order-footer">
        <div className="order-footer-left">
          <span className="order-footer-dot" />
          SYSTEM_OPERATIONAL
        </div>
        <div className="order-footer-center">
          {'© 2024 UNISPACE DESIGN STUDIO'} <span className="order-footer-sep">{'/'+'/'}</span> ORDER_PROCESSING_v2.0
        </div>
        <div className="order-footer-right">
          <a href="#">ENCRYPTION_POLICY</a>
          <a href="#">CORE_SUPPORT</a>
        </div>
      </footer>

      {showSaveModal && previews && (
        <React.Suspense fallback={<div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center text-white font-mono">LOADING_ARCHIVE_SYSTEM...</div>}>
          <SaveToCollectionModal 
            previewUrl={previews.front}
            garmentType={info.garmentType || "RAGLAN"}
            color={info.color || "#ffffff"}
            onClose={() => setShowSaveModal(false)}
            onSaved={() => {
              alert("Thiết kế đã được lưu và xuất hiện trên trang chủ!");
              setShowSaveModal(false);
            }}
          />
        </React.Suspense>
      )}
    </div>
  );
}

// Lazy load the modal to keep the main bundle lean
const SaveToCollectionModal = React.lazy(() => 
  import("@/components/SaveToCollectionModal").then(m => ({ default: m.SaveToCollectionModal }))
);

function SuccessScreen({ orderId, onReturn }: { orderId: string; onReturn: () => void }) {
  return (
    <div className="order-success-root">
      <div className="order-grid-bg" />
      <div className="order-watermark" aria-hidden="true">CONFIRMED</div>
      <div className="order-success-card">
        <div className="order-success-icon-wrap">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="1.5">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
        <div className="order-success-id">ORDER_ID: {orderId}</div>
        <h2 className="order-success-title">PRODUCTION_INITIATED</h2>
        <p className="order-success-sub">
          Đơn hàng đã được gửi thành công. Admin sẽ liên hệ trong vòng 24 giờ.
        </p>
        <div className="order-success-log">
          <div><span className="order-log-accent">[OK]</span> ORDER_SUBMITTED :: {new Date().toLocaleTimeString()}</div>
          <div><span className="order-log-accent">[OK]</span> NOTIFICATION_QUEUED :: ADMIN_CHANNEL</div>
          <div><span className="order-log-accent">[OK]</span> SESSION_CLOSED :: SECURE</div>
        </div>
        <button onClick={onReturn} className="order-success-btn">
          ← RETURN_TO_DESIGNER
        </button>
      </div>
    </div>
  );
}
