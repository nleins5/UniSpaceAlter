"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";

/* ─── Types ─── */
interface DesignElement {
  id: string;
  type?: "image" | "text";
  url?: string;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  textColor?: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  side: "front" | "back";
}

interface DesignData {
  elements: DesignElement[];
  tshirtColor: string;
  sleeveColor?: string;
  collarColor?: string;
  shirtType?: "tshirt" | "polo" | "raglan" | "polo-a1" | "polo-d5";
}

/* ─── SVG Shirt (reused from original) ─── */
function ShirtSVG({ color, side = "front", shirtType = "tshirt" }: {
  color: string; side?: "front" | "back"; shirtType?: string;
}) {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) || 255;
  const g = parseInt(hex.substring(2, 4), 16) || 255;
  const b = parseInt(hex.substring(4, 6), 16) || 255;
  const isLight = (r * 299 + g * 587 + b * 114) / 1000 > 160;
  const stroke = isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.06)";
  const shadow = isLight ? "rgba(0,0,0,0.05)" : "rgba(0,0,0,0.12)";
  const hl = isLight ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.05)";

  const tPath = side === "back"
    ? "M200 30 L155 30 C150 30 145 32 142 35 L105 62 L52 100 C46 104 43 112 45 119 L62 152 C64 157 70 160 76 158 L112 132 L112 430 C112 438 118 444 126 444 L274 444 C282 444 288 438 288 430 L288 132 L324 158 C330 160 336 157 338 152 L355 119 C357 112 354 104 348 100 L295 62 L258 35 C255 32 250 30 245 30 L200 30Z"
    : "M200 22 L155 22 C150 22 145 24 142 27 L105 55 L52 93 C46 97 43 105 45 112 L62 145 C64 150 70 153 76 151 L112 125 L112 430 C112 438 118 444 126 444 L274 444 C282 444 288 438 288 430 L288 125 L324 151 C330 153 336 150 338 145 L355 112 C357 105 354 97 348 93 L295 55 L258 27 C255 24 250 22 245 22 L200 22Z";

  const pPath = side === "back"
    ? "M200 38 L148 38 C142 38 137 40 134 44 L95 72 L40 115 C34 120 30 128 32 136 L50 168 C52 174 58 177 64 175 L105 145 L105 435 C105 443 111 449 119 449 L281 449 C289 449 295 443 295 435 L295 145 L336 175 C342 177 348 174 350 168 L368 136 C370 128 366 120 360 115 L305 72 L266 44 C263 40 258 42 252 38 L200 38Z"
    : "M200 42 L148 42 C142 42 137 44 134 48 L95 76 L40 118 C34 123 30 131 32 139 L50 170 C52 176 58 179 64 177 L105 148 L105 435 C105 443 111 449 119 449 L281 449 C289 449 295 443 295 435 L295 148 L336 177 C342 179 348 176 350 170 L368 139 C370 131 366 123 360 118 L305 76 L266 48 C263 44 258 42 252 42 L200 42Z";

  const isPolo = shirtType?.startsWith("polo");
  const bodyPath = isPolo ? pPath : tPath;
  const gId = `gl-fab-${side}`;

  return (
    <svg width="100%" height="100%" viewBox="0 0 400 480" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={gId} x1="0.3" y1="0" x2="0.7" y2="1">
          <stop offset="0%" stopColor={hl} /><stop offset="100%" stopColor={shadow} />
        </linearGradient>
      </defs>
      <g>
        <path d={bodyPath} fill={color} stroke={stroke} strokeWidth="1.2" />
        <path d={bodyPath} fill={`url(#${gId})`} />
        {shirtType === "tshirt" && side === "front" && (
          <>
            <path d="M163 22 C170 48 184 58 200 62 C216 58 230 48 237 22" fill={shadow} />
            <path d="M163 22 C170 48 184 58 200 62 C216 58 230 48 237 22" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
          </>
        )}
        {shirtType === "tshirt" && side === "back" && (
          <>
            <path d="M170 30 C178 40 188 44 200 45 C212 44 222 40 230 30" fill={shadow} />
            <path d="M170 30 C178 40 188 44 200 45 C212 44 222 40 230 30" fill="none" stroke={stroke} strokeWidth="1.5" />
          </>
        )}
      </g>
    </svg>
  );
}

/* ─── Preview Canvas ─── */
function PreviewCanvas({ elements, side, tshirtColor, shirtType, canvasRef }: {
  elements: DesignElement[]; side: "front" | "back"; tshirtColor: string;
  shirtType?: string; canvasRef?: React.RefObject<HTMLDivElement | null>;
}) {
  const sideEls = elements.filter((el) => el.side === side);
  return (
    <div ref={canvasRef} className="relative w-full max-w-[320px] aspect-[400/480] mx-auto">
      <ShirtSVG color={tshirtColor} side={side} shirtType={shirtType} />
      <style>{sideEls.map(el => {
        const cls = `.gl-el-${el.id.replace(/[^a-z0-9]/gi, '')}`;
        let css = `${cls} { left: ${(el.x / 400) * 100}%; top: ${(el.y / 480) * 100}%; width: ${(el.width / 400) * 100}%; height: ${(el.height / 480) * 100}%;`;
        if (el.rotation) css += ` transform: rotate(${el.rotation}deg);`;
        css += ` }`;
        if (el.type === "text") {
          css += ` ${cls} .gl-txt { width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:${((el.fontSize || 24) / 400) * 100}vw;font-family:${el.fontFamily || 'sans-serif'};color:${el.textColor || '#fff'};font-weight:bold;text-align:center;line-height:1.2;white-space:pre-wrap;word-break:break-word; }`;
        }
        return css;
      }).join(' ')}</style>
      {sideEls.map((el) => (
        <div key={el.id} className={`absolute gl-el-${el.id.replace(/[^a-z0-9]/gi, '')}`}>
          {el.type === "text" ? (
            <div className="gl-txt">{el.text}</div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={el.url} alt={el.label} className="w-full h-full object-contain" draggable={false} />
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── Color name map ─── */
function getColorName(hex: string): string {
  const map: Record<string, string> = {
    '#ffffff': 'ARCTIC WHITE', '#000000': 'OBSIDIAN BLACK', '#1a1a1a': 'CARBON BLACK',
    '#2d2d2d': 'GRAPHITE', '#4a4a4a': 'SLATE GREY', '#c62828': 'CRIMSON RED',
    '#1565c0': 'COBALT BLUE', '#2e7d32': 'FOREST GREEN', '#f9a825': 'SOLAR YELLOW',
    '#6a1b9a': 'ROYAL VIOLET', '#e91e63': 'NEON PINK', '#ff6f00': 'BLAZE ORANGE',
    '#00838f': 'TEAL DEEP', '#FFB6C1': 'BLUSH PINK',
  };
  return map[hex.toLowerCase()] || hex.toUpperCase();
}

/* ─── SIZES ─── */
const SIZES = ["S", "M", "L", "XL", "XXL"] as const;

/* ─── Main Page ─── */
export default function OrderPage() {
  const [designData, setDesignData] = useState<DesignData | null>(null);
  const [shirtType, setShirtType] = useState<string>("tshirt");
  const [previewSide, setPreviewSide] = useState<"front" | "back">("front");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [orderId, setOrderId] = useState("");
  const frontRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);
  const [orderSysId] = useState(() => `SYS-${Math.floor(1000 + Math.random() * 8999)}-${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`);

  const [form, setForm] = useState({
    name: "", phone: "", entity: "", address: "", notes: "",
  });
  const [qty, setQty] = useState<Record<string, number>>({ S: 0, M: 0, L: 0, XL: 0, XXL: 0 });
  const totalQty = Object.values(qty).reduce((a, b) => a + b, 0);

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
      } catch { return null; }
    }, []
  );

  const handleSubmit = async () => {
    if (!designData || !form.name || !form.phone || !form.address || totalQty < 1) return;
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("phone", form.phone);
      formData.append("email", form.entity);
      formData.append("address", form.address);
      formData.append("color", designData.tshirtColor);
      formData.append("quantity", String(totalQty));
      formData.append("notes", `${form.notes}\nQty: ${JSON.stringify(qty)}`);
      formData.append("shirtType", shirtType);

      setPreviewSide("front");
      await new Promise((r) => setTimeout(r, 200));
      const fb = await captureCanvas(frontRef);
      if (fb) formData.append("frontDesign", fb, "front.png");
      setPreviewSide("back");
      await new Promise((r) => setTimeout(r, 200));
      const bb = await captureCanvas(backRef);
      if (bb) formData.append("backDesign", bb, "back.png");
      setPreviewSide("front");

      const res = await fetch("/api/orders", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) { setSubmitted(true); setOrderId(data.orderId); sessionStorage.removeItem("designData"); }
      else alert("Có lỗi xảy ra. Vui lòng thử lại!");
    } catch { alert("Có lỗi xảy ra!"); }
    finally { setIsSubmitting(false); }
  };

  /* ── Success ── */
  if (submitted) {
    return (
      <div className="gl-order-bg">
        <div className="gl-order-success">
          <div className="gl-order-check"><span className="material-symbols-outlined">check_circle</span></div>
          <h1>Đơn hàng đã được gửi</h1>
          <p className="gl-order-sub">Mã đơn: <code>{orderId}</code></p>
          <div className="gl-order-success-actions">
            <Link href="/design" className="gl-btn-ghost">Thiết kế thêm</Link>
            <Link href="/" className="gl-btn-primary">Về trang chủ</Link>
          </div>
        </div>
      </div>
    );
  }

  /* ── No design ── */
  if (!designData) {
    return (
      <div className="gl-order-bg">
        <div className="gl-order-success">
          <h1>Chưa có thiết kế</h1>
          <p className="gl-order-sub">Bạn cần tạo thiết kế trước khi đặt hàng.</p>
          <Link href="/design" className="gl-btn-primary" >Bắt đầu thiết kế</Link>
        </div>
      </div>
    );
  }

  const colorName = getColorName(designData.tshirtColor);
  const typeLabel = shirtType === "polo-d5" ? "POLO D5" : shirtType === "polo-a1" ? "POLO A1" : "T-SHIRT";
  const canSubmit = form.name && form.phone && form.address && totalQty > 0;

  return (
    <div className="gl-order-bg">
      {/* ── Header ── */}
      <header className="gl-order-header">
        <div className="gl-order-header-inner">
          <Link href="/" className="gl-order-brand">UNISPACE</Link>
          <nav className="gl-order-nav">
            <Link href="/design" className="gl-nav-link">Designer</Link>
            <span className="gl-nav-link gl-nav-active">Orders</span>
          </nav>
          <div className="gl-order-header-icons">
            <button className="gl-icon-btn"><span className="material-symbols-outlined">settings</span></button>
            <button className="gl-icon-btn"><span className="material-symbols-outlined">account_circle</span></button>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="gl-order-main">
        <div className="gl-order-title-bar">
          <h2>ORDER REVIEW</h2>
          <p className="gl-order-sysid">ID: #{orderSysId}</p>
        </div>

        <div className="gl-order-grid">
          {/* ── Left Column ── */}
          <section className="gl-order-left">
            {/* Preview */}
            <div className="gl-glass-elevated gl-order-preview">
              <div className="gl-order-stamp">
                {totalQty > 0 ? 'CONFIRMED' : 'DRAFT'}
              </div>
              <div className="gl-order-canvas-area">
                <div className="gl-order-side-tabs">
                  <button onClick={() => setPreviewSide("front")} className={previewSide === "front" ? "active" : ""}>FRONT</button>
                  <button onClick={() => setPreviewSide("back")} className={previewSide === "back" ? "active" : ""}>BACK</button>
                </div>
                <PreviewCanvas
                  elements={designData.elements} side={previewSide}
                  tshirtColor={designData.tshirtColor} shirtType={shirtType}
                  canvasRef={previewSide === "front" ? frontRef : backRef}
                />
                {/* Hidden canvases for capture */}
                <div className="fixed -left-[9999px] opacity-0 pointer-events-none">
                  {previewSide !== "front" && <PreviewCanvas elements={designData.elements} side="front" tshirtColor={designData.tshirtColor} shirtType={shirtType} canvasRef={frontRef} />}
                  {previewSide !== "back" && <PreviewCanvas elements={designData.elements} side="back" tshirtColor={designData.tshirtColor} shirtType={shirtType} canvasRef={backRef} />}
                </div>
              </div>
              <div className="gl-order-preview-gradient" />
            </div>

            {/* Technical Specs */}
            <div className="gl-glass-panel gl-order-specs">
              <h3>TECHNICAL SPECIFICATIONS</h3>
              <div className="gl-spec-rows">
                <div className="gl-spec-row"><span>FABRIC:</span><span className="gl-spec-val gl-spec-accent">HEAVYWEIGHT COTTON JERSEY</span></div>
                <div className="gl-spec-row"><span>COLOR:</span><span className="gl-spec-val">{colorName}</span></div>
                <div className="gl-spec-row"><span>TYPE:</span><span className="gl-spec-val">{typeLabel}</span></div>
                <div className="gl-spec-row"><span>SIZE RANGE:</span><span className="gl-spec-val">S — XXL</span></div>
                <div className="gl-spec-row gl-spec-row-last"><span>PRINT METHOD:</span><span className="gl-spec-val">SCREEN PRINTING</span></div>
              </div>
            </div>
          </section>

          {/* ── Right Column ── */}
          <section className="gl-order-right">
            {/* Fulfillment */}
            <div className="gl-glass-panel gl-order-form-panel">
              <h3>FULFILLMENT DETAILS</h3>
              <div className="gl-form-fields">
                <div className="gl-field">
                  <label>FULL NAME</label>
                  <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="NGUYEN VAN A" />
                </div>
                <div className="gl-field-row">
                  <div className="gl-field">
                    <label>PHONE</label>
                    <input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="+84 901 234 567" />
                  </div>
                  <div className="gl-field">
                    <label>ENTITY</label>
                    <input type="text" value={form.entity} onChange={e => setForm({...form, entity: e.target.value})} placeholder="COMPANY / GROUP" />
                  </div>
                </div>
                <div className="gl-field">
                  <label>SHIPPING ADDRESS</label>
                  <textarea value={form.address} onChange={e => setForm({...form, address: e.target.value})} placeholder={"123 NGUYEN HUE\nHO CHI MINH, VN"} rows={2} />
                </div>
              </div>
            </div>

            {/* Quantity Matrix */}
            <div className="gl-glass-panel gl-order-qty-panel">
              <h3>QUANTITY MATRIX</h3>
              <div className="gl-qty-table-wrap">
                <table className="gl-qty-table">
                  <thead>
                    <tr>
                      {SIZES.map(s => <th key={s}>{s}</th>)}
                      <th className="gl-qty-total-head">TOTAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      {SIZES.map(s => (
                        <td key={s}>
                          <input
                            type="number" min={0} max={999}
                            value={qty[s] || ""}
                            onChange={e => setQty({...qty, [s]: Math.max(0, parseInt(e.target.value) || 0)})}
                            placeholder="0"
                            className="gl-qty-input"
                          />
                        </td>
                      ))}
                      <td className="gl-qty-total-cell">{totalQty}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Notes */}
            <div className="gl-glass-panel gl-order-notes-panel">
              <div className="gl-field">
                <label>NOTES</label>
                <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Special requirements..." rows={2} />
              </div>
            </div>

            {/* CTA */}
            <button
              className={`gl-order-cta ${!canSubmit ? 'gl-order-cta-disabled' : ''}`}
              disabled={isSubmitting || !canSubmit}
              onClick={handleSubmit}
            >
              <span>{isSubmitting ? 'PROCESSING...' : 'INITIATE PRODUCTION'}</span>
              <span className="material-symbols-outlined gl-cta-arrow">arrow_forward</span>
            </button>
          </section>
        </div>
      </main>
    </div>
  );
}
