"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Logo } from "../../components/Logo";

interface DesignElement {
  id: string;
  url: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  side: "front" | "back";
}

interface DesignData {
  elements: DesignElement[];
  tshirtColor: string;
}

function TShirtSVG({ color }: { color: string }) {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const isLight = (r * 299 + g * 587 + b * 114) / 1000 > 128;

  return (
    <svg width="100%" height="100%" viewBox="0 0 400 480" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`pv-fabric-${hex}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={isLight ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.08)"} />
          <stop offset="40%" stopColor="rgba(0,0,0,0)" />
          <stop offset="100%" stopColor={isLight ? "rgba(0,0,0,0.06)" : "rgba(0,0,0,0.15)"} />
        </linearGradient>
        <filter id="pvShadow" x="-10%" y="-5%" width="120%" height="115%">
          <feDropShadow dx="0" dy="3" stdDeviation="5" floodOpacity="0.1" />
        </filter>
      </defs>
      <g filter="url(#pvShadow)">
        <path
          d="M200 18 L148 18 C142 18 137 20 134 24 L95 62 L45 102 C38 107 36 115 38 122 L58 158 C61 164 68 167 74 164 L112 132 L112 430 C112 440 120 448 130 448 L270 448 C280 448 288 440 288 430 L288 132 L326 164 C332 167 339 164 342 158 L362 122 C364 115 362 107 355 102 L305 62 L266 24 C263 20 258 18 252 18 L200 18Z"
          fill={color}
          stroke={isLight ? "#d4d4d4" : "rgba(255,255,255,0.06)"}
          strokeWidth="1"
        />
        <path
          d="M200 18 L148 18 C142 18 137 20 134 24 L95 62 L45 102 C38 107 36 115 38 122 L58 158 C61 164 68 167 74 164 L112 132 L112 430 C112 440 120 448 130 448 L270 448 C280 448 288 440 288 430 L288 132 L326 164 C332 167 339 164 342 158 L362 122 C364 115 362 107 355 102 L305 62 L266 24 C263 20 258 18 252 18 L200 18Z"
          fill={`url(#pv-fabric-${hex})`}
        />
        <path d="M160 18 C168 42 182 54 200 58 C218 54 232 42 240 18" fill={isLight ? "rgba(0,0,0,0.03)" : "rgba(0,0,0,0.12)"} />
        <path d="M160 18 C168 42 182 54 200 58 C218 54 232 42 240 18" fill="none" stroke={isLight ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.1)"} strokeWidth="2" strokeLinecap="round" />
      </g>
    </svg>
  );
}

function PreviewCanvas({
  elements, side, tshirtColor, canvasRef,
}: {
  elements: DesignElement[];
  side: "front" | "back";
  tshirtColor: string;
  canvasRef?: React.RefObject<HTMLDivElement | null>;
}) {
  const sideElements = elements.filter((el) => el.side === side);
  return (
    <div ref={canvasRef} className="relative w-full max-w-[300px] aspect-[400/480] mx-auto">
      <TShirtSVG color={tshirtColor} />
      <style>{sideElements.map(el =>
        `.order-el-${el.id.replace(/[^a-z0-9]/gi, '')} { left: ${(el.x / 400) * 100}%; top: ${(el.y / 480) * 100}%; width: ${(el.width / 400) * 100}%; height: ${(el.height / 480) * 100}%; }`
      ).join(' ')}</style>
      {sideElements.map((el) => (
        <div key={el.id} className={`absolute order-el-${el.id.replace(/[^a-z0-9]/gi, '')}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={el.url} alt={el.label} className="w-full h-full object-contain" draggable={false} />
        </div>
      ))}
    </div>
  );
}

export default function OrderPage() {
  const [designData, setDesignData] = useState<DesignData | null>(null);
  const [previewSide, setPreviewSide] = useState<"front" | "back">("front");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [orderId, setOrderId] = useState("");
  const frontRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    name: "", phone: "", email: "", address: "",
    size: "M", quantity: "1", notes: "",
  });
  const [showErrors, setShowErrors] = useState(false);
  const [shaking, setShaking] = useState(false);

  useEffect(() => {
    const data = sessionStorage.getItem("designData");
    if (data) setDesignData(JSON.parse(data));
  }, []);

  const captureCanvas = useCallback(
    async (ref: React.RefObject<HTMLDivElement | null>): Promise<Blob | null> => {
      if (!ref.current) return null;
      try {
        const html2canvas = (await import("html2canvas-pro")).default;
        const canvas = await html2canvas(ref.current, { backgroundColor: null, scale: 2, useCORS: true, allowTaint: true });
        return new Promise((resolve) => { canvas.toBlob((blob) => resolve(blob), "image/png", 1.0); });
      } catch (err) {
        console.error("Capture error:", err);
        return null;
      }
    },
    []
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!designData) return;
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("phone", form.phone);
      formData.append("email", form.email);
      formData.append("address", form.address);
      formData.append("size", form.size);
      formData.append("color", designData.tshirtColor);
      formData.append("quantity", form.quantity);
      formData.append("notes", form.notes);

      setPreviewSide("front");
      await new Promise((r) => setTimeout(r, 200));
      const frontBlob = await captureCanvas(frontRef);
      if (frontBlob) formData.append("frontDesign", frontBlob, "front_design.png");

      setPreviewSide("back");
      await new Promise((r) => setTimeout(r, 200));
      const backBlob = await captureCanvas(backRef);
      if (backBlob) formData.append("backDesign", backBlob, "back_design.png");

      setPreviewSide("front");

      const res = await fetch("/api/orders", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
        setOrderId(data.orderId);
        sessionStorage.removeItem("designData");
      } else {
        alert("Có lỗi xảy ra. Vui lòng thử lại!");
      }
    } catch (error) {
      console.error("Submit error:", error);
      alert("Có lỗi xảy ra. Vui lòng thử lại!");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="order-success-bg">
        <div className="order-success-card">
          <div className="order-success-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 className="order-success-title">Đặt hàng thành công! 🎉</h1>
          <p className="order-success-sub">Đơn hàng của bạn đã được gửi đến nhà sản xuất.</p>
          <div className="order-success-id">
            <p className="order-success-id-label">Mã đơn hàng</p>
            <p className="order-success-id-value">{orderId}</p>
          </div>
          <p className="order-success-note">
            Nhà sản xuất xem thiết kế tại:<br />
            <code className="order-success-code">/manufacturer/{orderId}</code>
          </p>
          <div className="order-success-actions">
            <Link href="/design" className="order-btn-back">Thiết kế thêm</Link>
            <Link href="/" className="order-btn-submit">Về trang chủ</Link>
          </div>
        </div>
      </div>
    );
  }

  if (!designData) {
    return (
      <div className="order-success-bg">
        <div className="order-success-card order-success-card--center">
          <h1 className="order-success-title">Chưa có thiết kế</h1>
          <p className="order-success-sub">Bạn cần tạo thiết kế trước khi đặt hàng.</p>
          <div className="order-success-actions">
            <Link href="/design" className="order-btn-submit">Bắt đầu thiết kế</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="order-page">
      {/* Header */}
      <header className="order-header">
        <div className="order-header-inner">
          <Link href="/" className="order-logo" style={{ textDecoration: 'none' }}>
            <Logo scale={0.5} />
          </Link>
          <div className="order-steps">
            <span className="order-step done">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              Thiết kế
            </span>
            <span className="order-step-arrow">›</span>
            <span className="order-step active">
              <span className="order-step-dot"/>
              Đặt hàng
            </span>
          </div>
        </div>
      </header>

      <div className="order-body">
        <div className="order-page-title">
          <h1>Hoàn tất đơn hàng</h1>
          <p>Kiểm tra thiết kế và điền thông tin để chúng tôi giao áo đến bạn.</p>
        </div>

        <div className="order-grid">
          {/* Left: Preview */}
          <aside className="order-preview-col">
            <div className="order-preview-card">
              <div className="order-preview-card-header">
                <span className="order-preview-badge">Xem trước</span>
                <div className="order-side-toggle">
                  <button className={previewSide === "front" ? "active" : ""} onClick={() => setPreviewSide("front")}>Mặt trước</button>
                  <button className={previewSide === "back" ? "active" : ""} onClick={() => setPreviewSide("back")}>Mặt sau</button>
                </div>
              </div>

              <div className="order-preview-canvas-wrap">
                <PreviewCanvas elements={designData.elements} side={previewSide} tshirtColor={designData.tshirtColor} canvasRef={previewSide === "front" ? frontRef : backRef} />
              </div>

              <div className="fixed -left-[9999px] opacity-0 pointer-events-none">
                {previewSide !== "front" && <PreviewCanvas elements={designData.elements} side="front" tshirtColor={designData.tshirtColor} canvasRef={frontRef} />}
                {previewSide !== "back" && <PreviewCanvas elements={designData.elements} side="back" tshirtColor={designData.tshirtColor} canvasRef={backRef} />}
              </div>

              <div className="order-preview-meta">
                <div className="order-meta-chip">
                  <style>{`.order-preview-dot { background-color: ${designData.tshirtColor}; border-color: ${designData.tshirtColor === '#ffffff' ? '#ddd' : 'transparent'}; }`}</style>
                  <span className="order-preview-dot"/>
                  Màu áo
                </div>
                <div className="order-meta-chip">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><polyline points="21 15 16 10 5 21"/></svg>
                  {designData.elements.filter(e => e.side === 'front').length} mặt trước
                </div>
                <div className="order-meta-chip">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><polyline points="21 15 16 10 5 21"/></svg>
                  {designData.elements.filter(e => e.side === 'back').length} mặt sau
                </div>
              </div>
            </div>
          </aside>

          {/* Right: Form */}
          <main className="order-form-col">
            <form onSubmit={handleSubmit} className="order-form-new">

              <div className="order-section-card">
                <div className="order-section-head">
                  <span className="order-section-num">01</span>
                  <div>
                    <h2 className="order-section-title">Thông tin khách hàng</h2>
                    <p className="order-section-sub">Để chúng tôi liên hệ xác nhận đơn</p>
                  </div>
                </div>
                <div className="order-field-grid">
                  <div className={`order-field ${showErrors && !form.name ? 'order-field-error' : ''}`}>
                    <label htmlFor="ord-name">Họ và tên <span className="order-required">*</span></label>
                    <input id="ord-name" type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nguyễn Văn A" required />
                  </div>
                  <div className={`order-field ${showErrors && !form.phone ? 'order-field-error' : ''}`}>
                    <label htmlFor="ord-phone">Số điện thoại <span className="order-required">*</span></label>
                    <input id="ord-phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="0901 234 567" required />
                  </div>
                </div>
                <div className="order-field">
                  <label htmlFor="ord-email">Email <span className="order-optional">(tuỳ chọn)</span></label>
                  <input id="ord-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" />
                </div>
                <div className={`order-field ${showErrors && !form.address ? 'order-field-error' : ''}`}>
                  <label htmlFor="ord-address">Địa chỉ giao hàng <span className="order-required">*</span></label>
                  <textarea id="ord-address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố" rows={3} required />
                </div>
              </div>

              <div className="order-section-card">
                <div className="order-section-head">
                  <span className="order-section-num">02</span>
                  <div>
                    <h2 className="order-section-title">Chi tiết sản phẩm</h2>
                    <p className="order-section-sub">Chọn size và số lượng áo</p>
                  </div>
                </div>
                <div className="order-field">
                  <label>Size áo</label>
                  <div className="order-size-chips">
                    {["XS","S","M","L","XL","XXL"].map(s => (
                      <button key={s} type="button" className={`order-size-chip ${form.size === s ? "active" : ""}`} onClick={() => setForm({ ...form, size: s })}>{s}</button>
                    ))}
                  </div>
                </div>
                <div className="order-field order-field-qty">
                  <label htmlFor="ord-qty">Số lượng</label>
                  <div className="order-qty-control">
                    <button type="button" className="order-qty-btn" onClick={() => setForm({...form, quantity: String(Math.max(1, +form.quantity - 1))})}>−</button>
                    <input id="ord-qty" type="number" min="1" max="100" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
                    <button type="button" className="order-qty-btn" onClick={() => setForm({...form, quantity: String(Math.min(100, +form.quantity + 1))})}>+</button>
                  </div>
                </div>
                <div className="order-field">
                  <label htmlFor="ord-notes">Ghi chú <span className="order-optional">(tuỳ chọn)</span></label>
                  <textarea id="ord-notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Yêu cầu đặc biệt, chất liệu mong muốn..." rows={2} />
                </div>
              </div>

              {/* Validation hint */}
              {showErrors && (!form.name || !form.phone || !form.address) && (
                <div className="order-validation-hint">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  Vui lòng điền đầy đủ các mục có dấu
                  <span className="order-required">*</span>
                </div>
              )}

              <div className={`order-actions ${shaking ? 'order-actions-shake' : ''}`}>
                <Link href="/design" className="order-btn-back">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
                  Quay lại chỉnh sửa
                </Link>
                <button
                  type="submit"
                  className={`order-btn-submit ${!form.name || !form.phone || !form.address ? 'order-btn-submit--disabled' : ''}`}
                  disabled={isSubmitting}
                  onClick={(e) => {
                    if (!form.name || !form.phone || !form.address) {
                      e.preventDefault();
                      setShowErrors(true);
                      setShaking(true);
                      setTimeout(() => setShaking(false), 500);
                      // scroll to first missing field
                      const firstEmpty = document.querySelector('.order-field-error input, .order-field-error textarea') as HTMLElement;
                      if (firstEmpty) firstEmpty.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                      Đang gửi đơn...
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 2 15 22 11 13 2 9 22 2"/></svg>
                      Đặt hàng ngay
                    </>
                  )}
                </button>
              </div>
            </form>
          </main>
        </div>
      </div>
    </div>
  );
}
