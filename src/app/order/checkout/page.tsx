"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";

interface DesignElement {
  id: string; type?: "image" | "text"; url?: string; text?: string;
  fontSize?: number; fontFamily?: string; textColor?: string; label: string;
  x: number; y: number; width: number; height: number; rotation?: number;
  side: "front" | "back";
}
interface DesignData {
  elements: DesignElement[]; tshirtColor: string;
  sleeveColor?: string; collarColor?: string; shirtType?: string;
}

function MiniShirt({ color, side = "front" }: { color: string; side?: "front" | "back" }) {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) || 200;
  const g = parseInt(hex.substring(2, 4), 16) || 200;
  const b = parseInt(hex.substring(4, 6), 16) || 200;
  const isLight = (r * 299 + g * 587 + b * 114) / 1000 > 160;
  const stroke = isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.06)";
  const shadow = isLight ? "rgba(0,0,0,0.05)" : "rgba(0,0,0,0.12)";
  const hl = isLight ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.05)";
  const tPath = side === "back"
    ? "M200 30 L155 30 C150 30 145 32 142 35 L105 62 L52 100 C46 104 43 112 45 119 L62 152 C64 157 70 160 76 158 L112 132 L112 430 C112 438 118 444 126 444 L274 444 C282 444 288 438 288 430 L288 132 L324 158 C330 160 336 157 338 152 L355 119 C357 112 354 104 348 100 L295 62 L258 35 C255 32 250 30 245 30 L200 30Z"
    : "M200 22 L155 22 C150 22 145 24 142 27 L105 55 L52 93 C46 97 43 105 45 112 L62 145 C64 150 70 153 76 151 L112 125 L112 430 C112 438 118 444 126 444 L274 444 C282 444 288 438 288 430 L288 125 L324 151 C330 153 336 150 338 145 L355 112 C357 105 354 97 348 93 L295 55 L258 27 C255 24 250 22 245 22 L200 22Z";
  const gId = `ck-fab-${side}`;
  return (
    <svg width="100%" height="100%" viewBox="0 0 400 480" fill="none">
      <defs><linearGradient id={gId} x1="0.3" y1="0" x2="0.7" y2="1"><stop offset="0%" stopColor={hl} /><stop offset="100%" stopColor={shadow} /></linearGradient></defs>
      <path d={tPath} fill={color} stroke={stroke} strokeWidth="1.2" />
      <path d={tPath} fill={`url(#${gId})`} />
    </svg>
  );
}

function MiniPreview({ elements, side, tshirtColor, shirtType }: {
  elements: DesignElement[]; side: "front" | "back"; tshirtColor: string; shirtType?: string;
}) {
  const sideEls = elements.filter(el => el.side === side);
  return (
    <div className="relative w-full aspect-[400/480]">
      <MiniShirt color={tshirtColor} side={side} />
      <style>{sideEls.map(el => {
        const cls = `.ck-el-${el.id.replace(/[^a-z0-9]/gi, '')}`;
        let css = `${cls}{left:${(el.x / 400) * 100}%;top:${(el.y / 480) * 100}%;width:${(el.width / 400) * 100}%;height:${(el.height / 480) * 100}%;position:absolute;}`;
        if (el.rotation) css = css.replace('}', `transform:rotate(${el.rotation}deg);}`);
        if (el.type === "text") css += `${cls} .ck-txt{width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:${((el.fontSize || 24) / 400) * 100}vw;font-family:${el.fontFamily || 'sans-serif'};color:${el.textColor || '#fff'};font-weight:bold;text-align:center;}`;
        return css;
      }).join(' ')}</style>
      {sideEls.map(el => (
        <div key={el.id} className={`ck-el-${el.id.replace(/[^a-z0-9]/gi, '')}`}>
          {el.type === "text"
            ? <div className="ck-txt">{el.text}</div>
            // eslint-disable-next-line @next/next/no-img-element
            : <img src={el.url} alt={el.label} className="w-full h-full object-contain" draggable={false} />}
        </div>
      ))}
    </div>
  );
}

/* Suppress unused-var: shirtType is passed through but MiniPreview doesn't render polo variants */
void (0 as unknown as typeof MiniPreview);

export default function CheckoutPage() {
  const [designData, setDesignData] = useState<DesignData | null>(null);
  const [shirtType, setShirtType] = useState("tshirt");
  const [qty, setQty] = useState<Record<string, number>>({ S: 0, M: 0, L: 0, XL: 0, XXL: 0 });
  const [previewSide, setPreviewSide] = useState<"front" | "back">("front");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [orderId, setOrderId] = useState("");
  const frontRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);
  const [form, setForm] = useState({ name: "", phone: "", entity: "", address: "", notes: "" });
  const totalQty = Object.values(qty).reduce((a, b) => a + b, 0);

  useEffect(() => {
    const raw = sessionStorage.getItem("designData");
    const qtyRaw = sessionStorage.getItem("orderQty");
    if (raw) {
      const parsed: DesignData = JSON.parse(raw);
      setDesignData(parsed);
      setShirtType(parsed.shirtType ?? "tshirt");
    }
    if (qtyRaw) setQty(JSON.parse(qtyRaw));
  }, []);

  const captureCanvas = useCallback(async (ref: React.RefObject<HTMLDivElement | null>): Promise<Blob | null> => {
    if (!ref.current) return null;
    try {
      const html2canvas = (await import("html2canvas-pro")).default;
      const canvas = await html2canvas(ref.current, { backgroundColor: null, scale: 2, useCORS: true, allowTaint: true });
      return new Promise(resolve => { canvas.toBlob(blob => resolve(blob), "image/png", 1.0); });
    } catch { return null; }
  }, []);

  const handleSubmit = async () => {
    if (!designData || !form.name || !form.phone || !form.address) return;
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("phone", form.phone);
      formData.append("email", form.entity);
      formData.append("address", form.address);
      formData.append("color", designData.tshirtColor);
      formData.append("quantity", String(totalQty));
      formData.append("notes", `${form.notes}\nSizes: ${JSON.stringify(qty)}`);
      formData.append("shirtType", shirtType);

      setPreviewSide("front"); await new Promise(r => setTimeout(r, 200));
      const fb = await captureCanvas(frontRef);
      if (fb) formData.append("frontDesign", fb, "front.png");
      setPreviewSide("back"); await new Promise(r => setTimeout(r, 200));
      const bb = await captureCanvas(backRef);
      if (bb) formData.append("backDesign", bb, "back.png");
      setPreviewSide("front");

      const res = await fetch("/api/orders", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true); setOrderId(data.orderId);
        sessionStorage.removeItem("designData");
        sessionStorage.removeItem("orderQty");
      } else alert("Có lỗi xảy ra. Vui lòng thử lại!");
    } catch { alert("Có lỗi xảy ra!"); }
    finally { setIsSubmitting(false); }
  };

  if (submitted) return (
    <div className="gl-order-bg gl-order-centered">
      <div className="gl-glass-panel gl-order-success-card">
        <span className="material-symbols-outlined gl-success-icon">check_circle</span>
        <h1 className="gl-success-title">Đơn hàng đã gửi</h1>
        <p className="gl-success-label">Mã đơn hàng:</p>
        <p className="gl-success-id">{orderId}</p>
        <p className="gl-success-note">
          {"Nhà sản xuất xem tại: "}
          <code className="gl-success-code">/manufacturer/{orderId}</code>
        </p>
        <div className="gl-success-actions">
          <Link href="/design" className="gl-btn-ghost">Thiết kế thêm</Link>
          <Link href="/" className="gl-btn-primary">Về trang chủ</Link>
        </div>
      </div>
    </div>
  );

  if (!designData) return (
    <div className="gl-order-bg gl-order-centered">
      <div className="gl-order-empty">
        <h1>Không có dữ liệu</h1>
        <Link href="/design" className="gl-btn-primary">Quay lại thiết kế</Link>
      </div>
    </div>
  );

  const canSubmit = form.name && form.phone && form.address;

  return (
    <div className="gl-order-bg">
      <header className="gl-order-header">
        <div className="gl-order-header-inner">
          <Link href="/" className="gl-order-brand">UNISPACE</Link>
          <nav className="gl-order-nav">
            <Link href="/design" className="gl-nav-link">Designer</Link>
            <Link href="/order" className="gl-nav-link">Review</Link>
            <span className="gl-nav-link gl-nav-active">Checkout</span>
          </nav>
          <div className="gl-order-header-icons">
            <button className="gl-icon-btn"><span className="material-symbols-outlined">settings</span></button>
            <button className="gl-icon-btn"><span className="material-symbols-outlined">account_circle</span></button>
          </div>
        </div>
      </header>

      <main className="gl-order-main">
        <div className="gl-order-title-bar">
          <h2>FULFILLMENT DETAILS</h2>
          <p className="gl-order-sysid">Điền thông tin để chúng tôi giao áo đến bạn</p>
        </div>

        <div className="gl-order-grid">
          {/* LEFT: Mini preview + order summary */}
          <section className="gl-order-left">
            <div className="gl-glass-elevated gl-order-preview gl-order-preview-compact">
              <div className="gl-order-stamp">CONFIRMED</div>
              <div className="gl-order-side-tabs">
                <button onClick={() => setPreviewSide("front")} className={previewSide === "front" ? "active" : ""}>FRONT</button>
                <button onClick={() => setPreviewSide("back")} className={previewSide === "back" ? "active" : ""}>BACK</button>
              </div>
              <div ref={previewSide === "front" ? frontRef : backRef}>
                <MiniPreview elements={designData.elements} side={previewSide} tshirtColor={designData.tshirtColor} shirtType={shirtType} />
              </div>
              {/* Hidden capture targets */}
              <div className="gl-hidden-capture">
                {previewSide !== "front" && <div ref={frontRef}><MiniPreview elements={designData.elements} side="front" tshirtColor={designData.tshirtColor} shirtType={shirtType} /></div>}
                {previewSide !== "back" && <div ref={backRef}><MiniPreview elements={designData.elements} side="back" tshirtColor={designData.tshirtColor} shirtType={shirtType} /></div>}
              </div>
              <div className="gl-order-preview-gradient" />
            </div>

            <div className="gl-glass-panel gl-order-specs">
              <h3>ORDER SUMMARY</h3>
              <div className="gl-spec-rows">
                {Object.entries(qty).filter(([, v]) => v > 0).map(([size, count]) => (
                  <div key={size} className="gl-spec-row">
                    <span>SIZE {size}:</span>
                    <span className="gl-spec-val">{count} cái</span>
                  </div>
                ))}
                {totalQty === 0 && (
                  <div className="gl-spec-row">
                    <span className="gl-spec-empty">Chưa chọn size</span>
                  </div>
                )}
                <div className="gl-spec-row gl-spec-row-total">
                  <span>TOTAL:</span>
                  <span className="gl-spec-val gl-spec-accent gl-spec-total-val">{totalQty} áo</span>
                </div>
              </div>
            </div>
          </section>

          {/* RIGHT: Fulfillment form */}
          <section className="gl-order-right">
            <div className="gl-glass-panel gl-order-form-panel">
              <h3>FULFILLMENT DETAILS</h3>
              <div className="gl-form-fields">
                <div className="gl-field">
                  <label>FULL NAME <span className="gl-field-required">*</span></label>
                  <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="NGUYEN VAN A" />
                </div>
                <div className="gl-field-row">
                  <div className="gl-field">
                    <label>PHONE <span className="gl-field-required">*</span></label>
                    <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+84 901 234 567" />
                  </div>
                  <div className="gl-field">
                    <label>ENTITY</label>
                    <input type="text" value={form.entity} onChange={e => setForm({ ...form, entity: e.target.value })} placeholder="COMPANY / GROUP" />
                  </div>
                </div>
                <div className="gl-field">
                  <label>SHIPPING ADDRESS <span className="gl-field-required">*</span></label>
                  <textarea value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder={"123 NGUYEN HUE\nHO CHI MINH, VN"} rows={2} />
                </div>
                <div className="gl-field">
                  <label>NOTES <span className="gl-field-optional">(tuỳ chọn)</span></label>
                  <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Yêu cầu đặc biệt, chất liệu mong muốn..." rows={2} />
                </div>
              </div>
            </div>

            <div className="gl-order-actions">
              <button
                className={`gl-order-cta ${!canSubmit ? 'gl-order-cta-disabled' : ''}`}
                disabled={isSubmitting || !canSubmit}
                onClick={handleSubmit}
              >
                <span>{isSubmitting ? 'PROCESSING...' : 'INITIATE PRODUCTION'}</span>
                <span className="material-symbols-outlined gl-cta-arrow">arrow_forward</span>
              </button>
              <Link href="/order" className="gl-btn-back-link">
                <span className="material-symbols-outlined gl-back-icon">arrow_back</span>
                Quay lại xem đơn
              </Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
