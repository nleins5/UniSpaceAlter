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
  shirtType?: "tshirt" | "polo";
}

function OrderShirtSVG({ color, side = "front", shirtType = "tshirt" }: { color: string; side?: "front" | "back"; shirtType?: "tshirt" | "polo" }) {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) || 255;
  const g = parseInt(hex.substring(2, 4), 16) || 255;
  const b = parseInt(hex.substring(4, 6), 16) || 255;
  const isLight = (r * 299 + g * 587 + b * 114) / 1000 > 160;
  const strokeColor = isLight ? "rgba(0,0,0,0.10)" : "rgba(255,255,255,0.08)";
  const shadowColor = isLight ? "rgba(0,0,0,0.04)" : "rgba(0,0,0,0.12)";
  const highlightColor = isLight ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.06)";
  const collarColor = "#ffffff";
  const collarStroke = isLight ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.15)";

  const tshirtPath = side === "back"
    ? "M200 30 L155 30 C150 30 145 32 142 35 L105 62 L52 100 C46 104 43 112 45 119 L62 152 C64 157 70 160 76 158 L112 132 L112 430 C112 438 118 444 126 444 L274 444 C282 444 288 438 288 430 L288 132 L324 158 C330 160 336 157 338 152 L355 119 C357 112 354 104 348 100 L295 62 L258 35 C255 32 250 30 245 30 L200 30Z"
    : "M200 22 L155 22 C150 22 145 24 142 27 L105 55 L52 93 C46 97 43 105 45 112 L62 145 C64 150 70 153 76 151 L112 125 L112 430 C112 438 118 444 126 444 L274 444 C282 444 288 438 288 430 L288 125 L324 151 C330 153 336 150 338 145 L355 112 C357 105 354 97 348 93 L295 55 L258 27 C255 24 250 22 245 22 L200 22Z";

  const poloPath = side === "back"
    ? "M200 40 L155 40 C150 40 145 42 142 45 L105 68 L52 105 C46 109 43 117 45 124 L62 155 C64 160 70 163 76 161 L112 137 L112 430 C112 438 118 444 126 444 L274 444 C282 444 288 438 288 430 L288 137 L324 161 C330 163 336 160 338 155 L355 124 C357 117 354 109 348 105 L295 68 L258 45 C255 42 250 40 245 40 L200 40Z"
    : "M200 45 L155 45 C150 45 145 47 142 50 L105 73 L52 110 C46 114 43 122 45 129 L62 160 C64 165 70 168 76 166 L112 142 L112 430 C112 438 118 444 126 444 L274 444 C282 444 288 438 288 430 L288 142 L324 166 C330 168 336 165 338 160 L355 129 C357 122 354 114 348 110 L295 73 L258 50 C255 47 250 45 245 45 L200 45Z";

  const bodyPath = shirtType === "polo" ? poloPath : tshirtPath;
  const gradId = `ord-fab-${shirtType}-${side}`;
  const filtId = `ord-shd-${shirtType}-${side}`;

  return (
    <svg width="100%" height="100%" viewBox="0 0 400 480" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={gradId} x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0%" stopColor={highlightColor} /><stop offset="50%" stopColor="transparent" /><stop offset="100%" stopColor={shadowColor} />
        </linearGradient>
        <filter id={filtId}><feDropShadow dx="0" dy="3" stdDeviation="5" floodOpacity="0.10" /></filter>
      </defs>
      <g filter={`url(#${filtId})`}>
        <path d={bodyPath} fill={color} stroke={strokeColor} strokeWidth="1.2" />
        <path d={bodyPath} fill={`url(#${gradId})`} />
        {/* Neckline / Collar details */}
        {shirtType === "tshirt" && side === "front" && (
          <>
            <path d="M163 22 C170 48 184 58 200 62 C216 58 230 48 237 22" fill={shadowColor} />
            <path d="M163 22 C170 48 184 58 200 62 C216 58 230 48 237 22" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" />
          </>
        )}
        {shirtType === "tshirt" && side === "back" && (
          <>
            <path d="M170 30 C178 40 188 44 200 45 C212 44 222 40 230 30" fill={shadowColor} />
            <path d="M170 30 C178 40 188 44 200 45 C212 44 222 40 230 30" fill="none" stroke={strokeColor} strokeWidth="1.5" />
          </>
        )}
        {shirtType === "polo" && side === "front" && (
          <>
            {/* Collar band */}
            <path d="M160 45 Q160 22 175 14 Q188 8 200 8 Q212 8 225 14 Q240 22 240 45" fill={collarColor} stroke={collarStroke} strokeWidth="1" />
            {/* Left collar flap */}
            <path d="M160 45 Q158 28 168 18 L145 52 Q150 58 160 60 Q168 58 175 52 L195 38 Q185 42 175 45 Z" fill={collarColor} stroke={collarStroke} strokeWidth="1" strokeLinejoin="round" />
            {/* Right collar flap */}
            <path d="M240 45 Q242 28 232 18 L255 52 Q250 58 240 60 Q232 58 225 52 L205 38 Q215 42 225 45 Z" fill={collarColor} stroke={collarStroke} strokeWidth="1" strokeLinejoin="round" />
            {/* V-opening shadow */}
            <path d="M195 38 L200 85 L205 38" fill={shadowColor} stroke="none" />
            {/* Button placket */}
            <rect x="197" y="45" width="6" height="65" rx="1.5" fill={collarColor} stroke={collarStroke} strokeWidth="0.6" />
            {/* Buttons */}
            <circle cx="200" cy="52" r="2.5" fill="none" stroke={collarStroke} strokeWidth="0.8" />
            <circle cx="200" cy="67" r="2.5" fill="none" stroke={collarStroke} strokeWidth="0.8" />
            <circle cx="200" cy="82" r="2.5" fill="none" stroke={collarStroke} strokeWidth="0.8" />
          </>
        )}
        {shirtType === "polo" && side === "back" && (
          <>
            {/* Collar band (back) */}
            <path d="M158 40 Q158 20 170 14 Q185 8 200 8 Q215 8 230 14 Q242 20 242 40" fill={collarColor} stroke={collarStroke} strokeWidth="1.2" />
            {/* Collar fold line */}
            <path d="M162 32 Q180 26 200 25 Q220 26 238 32" fill="none" stroke={collarStroke} strokeWidth="0.8" strokeDasharray="3 2" />
            {/* Inner neck shadow */}
            <path d="M168 40 Q184 34 200 33 Q216 34 232 40" fill={shadowColor} />
          </>
        )}
      </g>
    </svg>
  );
}

function PreviewCanvas({
  elements, side, tshirtColor, shirtType, canvasRef,
}: {
  elements: DesignElement[];
  side: "front" | "back";
  tshirtColor: string;
  shirtType: "tshirt" | "polo";
  canvasRef?: React.RefObject<HTMLDivElement | null>;
}) {
  const sideElements = elements.filter((el) => el.side === side);
  return (
    <div ref={canvasRef} className="relative w-full max-w-[300px] aspect-[400/480] mx-auto">
      <OrderShirtSVG color={tshirtColor} side={side} shirtType={shirtType} />
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
  const [shirtType, setShirtType] = useState<"tshirt" | "polo">("tshirt");
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
    if (data) {
      const parsed = JSON.parse(data);
      setDesignData(parsed);
      if (parsed.shirtType) setShirtType(parsed.shirtType);
    }
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
      formData.append("shirtType", shirtType);

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
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
              Thiết kế
            </span>
            <span className="order-step-arrow">›</span>
            <span className="order-step active">
              <span className="order-step-dot" />
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
                <PreviewCanvas elements={designData.elements} side={previewSide} tshirtColor={designData.tshirtColor} shirtType={shirtType} canvasRef={previewSide === "front" ? frontRef : backRef} />
              </div>

              <div className="fixed -left-[9999px] opacity-0 pointer-events-none">
                {previewSide !== "front" && <PreviewCanvas elements={designData.elements} side="front" tshirtColor={designData.tshirtColor} shirtType={shirtType} canvasRef={frontRef} />}
                {previewSide !== "back" && <PreviewCanvas elements={designData.elements} side="back" tshirtColor={designData.tshirtColor} shirtType={shirtType} canvasRef={backRef} />}
              </div>

              <div className="order-preview-meta">
                <div className="order-meta-chip">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3L4 7v2l3-1v11h10V8l3 1V7l-8-4z" /></svg>
                  {shirtType === "polo" ? "Áo polo" : "Áo thun"}
                </div>
                <div className="order-meta-chip">
                  <style>{`.order-preview-dot { background-color: ${designData.tshirtColor}; border-color: ${designData.tshirtColor === '#ffffff' ? '#ddd' : 'transparent'}; }`}</style>
                  <span className="order-preview-dot" />
                  Màu áo
                </div>
                <div className="order-meta-chip">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><polyline points="21 15 16 10 5 21" /></svg>
                  {designData.elements.filter(e => e.side === 'front').length} mặt trước
                </div>
                <div className="order-meta-chip">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><polyline points="21 15 16 10 5 21" /></svg>
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
                    {["XS", "S", "M", "L", "XL", "XXL"].map(s => (
                      <button key={s} type="button" className={`order-size-chip ${form.size === s ? "active" : ""}`} onClick={() => setForm({ ...form, size: s })}>{s}</button>
                    ))}
                  </div>
                </div>
                <div className="order-field order-field-qty">
                  <label htmlFor="ord-qty">Số lượng</label>
                  <div className="order-qty-control">
                    <button type="button" className="order-qty-btn" onClick={() => setForm({ ...form, quantity: String(Math.max(1, +form.quantity - 1)) })}>−</button>
                    <input id="ord-qty" type="number" min="1" max="100" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
                    <button type="button" className="order-qty-btn" onClick={() => setForm({ ...form, quantity: String(Math.min(100, +form.quantity + 1)) })}>+</button>
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
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                  Vui lòng điền đầy đủ các mục có dấu
                  <span className="order-required">*</span>
                </div>
              )}

              <div className={`order-actions ${shaking ? 'order-actions-shake' : ''}`}>
                <Link href="/design" className="order-btn-back">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
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
                      <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                      Đang gửi đơn...
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 2 15 22 11 13 2 9 22 2" /></svg>
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
