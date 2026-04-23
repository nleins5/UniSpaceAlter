"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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

function ShirtSVG({ color, side = "front", shirtType = "tshirt" }: {
  color: string; side?: "front" | "back"; shirtType?: string;
}) {
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

  const pPath = side === "back"
    ? "M200 38 L148 38 C142 38 137 40 134 44 L95 72 L40 115 C34 120 30 128 32 136 L50 168 C52 174 58 177 64 175 L105 145 L105 435 C105 443 111 449 119 449 L281 449 C289 449 295 443 295 435 L295 145 L336 175 C342 177 348 174 350 168 L368 136 C370 128 366 120 360 115 L305 72 L266 44 C263 40 258 42 252 38 L200 38Z"
    : "M200 42 L148 42 C142 42 137 44 134 48 L95 76 L40 118 C34 123 30 131 32 139 L50 170 C52 176 58 179 64 177 L105 148 L105 435 C105 443 111 449 119 449 L281 449 C289 449 295 443 295 435 L295 148 L336 177 C342 179 348 176 350 170 L368 139 C370 131 366 123 360 118 L305 76 L266 48 C263 44 258 42 252 42 L200 42Z";

  const bodyPath = shirtType?.startsWith("polo") ? pPath : tPath;
  const gId = `rv-fab-${side}`;

  return (
    <svg width="100%" height="100%" viewBox="0 0 400 480" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={gId} x1="0.3" y1="0" x2="0.7" y2="1">
          <stop offset="0%" stopColor={hl} /><stop offset="100%" stopColor={shadow} />
        </linearGradient>
      </defs>
      <path d={bodyPath} fill={color} stroke={stroke} strokeWidth="1.2" />
      <path d={bodyPath} fill={`url(#${gId})`} />
      {shirtType === "tshirt" && side === "front" && (
        <path d="M163 22 C170 48 184 58 200 62 C216 58 230 48 237 22" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
      )}
    </svg>
  );
}

function PreviewCanvas({ elements, side, tshirtColor, shirtType }: {
  elements: DesignElement[]; side: "front" | "back";
  tshirtColor: string; shirtType?: string;
}) {
  const sideEls = elements.filter(el => el.side === side);
  return (
    <div className="relative w-full max-w-[340px] aspect-[400/480] mx-auto">
      <ShirtSVG color={tshirtColor} side={side} shirtType={shirtType} />
      <style>{sideEls.map(el => {
        const cls = `.rv-el-${el.id.replace(/[^a-z0-9]/gi, '')}`;
        let css = `${cls}{left:${(el.x / 400) * 100}%;top:${(el.y / 480) * 100}%;width:${(el.width / 400) * 100}%;height:${(el.height / 480) * 100}%;position:absolute;}`;
        if (el.rotation) css = css.replace('}', `transform:rotate(${el.rotation}deg);}`);
        if (el.type === "text") css += `${cls} .rv-txt{width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:${((el.fontSize || 24) / 400) * 100}vw;font-family:${el.fontFamily || 'sans-serif'};color:${el.textColor || '#fff'};font-weight:bold;text-align:center;}`;
        return css;
      }).join(' ')}</style>
      {sideEls.map(el => (
        <div key={el.id} className={`rv-el-${el.id.replace(/[^a-z0-9]/gi, '')}`}>
          {el.type === "text"
            ? <div className="rv-txt">{el.text}</div>
            // eslint-disable-next-line @next/next/no-img-element
            : <img src={el.url} alt={el.label} className="w-full h-full object-contain" draggable={false} />
          }
        </div>
      ))}
    </div>
  );
}

const SIZES = ["S", "M", "L", "XL", "XXL"] as const;

function getColorName(hex: string) {
  const map: Record<string, string> = {
    '#ffffff': 'ARCTIC WHITE', '#000000': 'OBSIDIAN BLACK', '#1a1a1a': 'CARBON BLACK',
    '#2d2d2d': 'GRAPHITE', '#c62828': 'CRIMSON RED', '#1565c0': 'COBALT BLUE',
    '#2e7d32': 'FOREST GREEN', '#6a1b9a': 'ROYAL VIOLET', '#e91e63': 'NEON PINK',
    '#ff6f00': 'BLAZE ORANGE', '#FFB6C1': 'BLUSH PINK',
  };
  return map[hex.toLowerCase()] || hex.toUpperCase();
}

/* Color swatch — uses ref to avoid inline style warning */
function ColorSwatch({ color }: { color: string }) {
  return (
    <span
      className="gl-color-swatch"
      ref={(el) => { if (el) { el.style.background = color; } }}
    />
  );
}

function readDesignData(): DesignData | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem("designData");
  if (!raw) return null;
  try { return JSON.parse(raw) as DesignData; } catch { return null; }
}

export default function OrderReviewPage() {
  const router = useRouter();
  const [designData] = useState<DesignData | null>(readDesignData);
  const shirtType = designData?.shirtType ?? "tshirt";
  const [previewSide, setPreviewSide] = useState<"front" | "back">("front");
  const [qty, setQty] = useState<Record<string, number>>({ S: 0, M: 0, L: 0, XL: 0, XXL: 0 });
  const totalQty = Object.values(qty).reduce((a, b) => a + b, 0);
  const [sysId] = useState(() => `SYS-${Math.floor(1000 + Math.random() * 8999)}-${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`);

  const handleProceed = () => {
    sessionStorage.setItem("orderQty", JSON.stringify(qty));
    router.push("/order/checkout");
  };

  if (!designData) {
    return (
      <div className="gl-order-bg gl-order-centered">
        <div className="gl-order-empty">
          <h1>Chưa có thiết kế</h1>
          <p className="gl-order-empty-sub">Bạn cần tạo thiết kế trước khi đặt hàng.</p>
          <Link href="/design" className="gl-btn-primary">Bắt đầu thiết kế</Link>
        </div>
      </div>
    );
  }

  const colorName = getColorName(designData.tshirtColor);
  const typeLabel = shirtType === "polo-d5" ? "POLO D5" : shirtType === "polo-a1" ? "POLO A1" : "T-SHIRT";

  return (
    <div className="gl-order-bg">
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

      <main className="gl-order-main">
        <div className="gl-order-title-bar">
          <h2>ORDER REVIEW</h2>
          <p className="gl-order-sysid">ID: #{sysId}</p>
        </div>

        <div className="gl-order-grid">
          {/* LEFT: Preview */}
          <section className="gl-order-left">
            <div className="gl-glass-elevated gl-order-preview">
              <div className="gl-order-stamp">CONFIRMED</div>
              <div className="gl-order-canvas-area">
                <div className="gl-order-side-tabs">
                  <button onClick={() => setPreviewSide("front")} className={previewSide === "front" ? "active" : ""}>FRONT</button>
                  <button onClick={() => setPreviewSide("back")} className={previewSide === "back" ? "active" : ""}>BACK</button>
                </div>
                <PreviewCanvas elements={designData.elements} side={previewSide} tshirtColor={designData.tshirtColor} shirtType={shirtType} />
              </div>
              <div className="gl-order-preview-gradient" />
            </div>

            <div className="gl-glass-panel gl-order-specs">
              <h3>TECHNICAL SPECIFICATIONS</h3>
              <div className="gl-spec-rows">
                <div className="gl-spec-row"><span>FABRIC:</span><span className="gl-spec-val gl-spec-accent">HEAVYWEIGHT COTTON JERSEY</span></div>
                <div className="gl-spec-row">
                  <span>COLOR:</span>
                  <span className="gl-spec-val gl-spec-color-row">
                    <ColorSwatch color={designData.tshirtColor} />
                    {colorName}
                  </span>
                </div>
                <div className="gl-spec-row"><span>TYPE:</span><span className="gl-spec-val">{typeLabel}</span></div>
                <div className="gl-spec-row"><span>SIZE RANGE:</span><span className="gl-spec-val">S — XXL</span></div>
                <div className="gl-spec-row gl-spec-row-last"><span>PRINT METHOD:</span><span className="gl-spec-val">SCREEN PRINTING</span></div>
              </div>
            </div>
          </section>

          {/* RIGHT: Quantity + Proceed */}
          <section className="gl-order-right">
            <div className="gl-glass-panel gl-order-qty-panel">
              <h3>QUANTITY MATRIX</h3>
              <p className="gl-qty-hint">Nhập số lượng cho từng size</p>
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
                            onChange={e => setQty({ ...qty, [s]: Math.max(0, parseInt(e.target.value) || 0) })}
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

            <div className="gl-glass-panel gl-order-summary-panel">
              <h3 className="gl-summary-heading">DESIGN SUMMARY</h3>
              <div className="gl-summary-chips">
                <div className="gl-summary-chip">
                  <span className="material-symbols-outlined gl-chip-icon">checkroom</span>
                  {typeLabel}
                </div>
                <div className="gl-summary-chip">
                  <ColorSwatch color={designData.tshirtColor} />
                  {colorName}
                </div>
                <div className="gl-summary-chip">
                  <span className="material-symbols-outlined gl-chip-icon">image</span>
                  {designData.elements.filter(e => e.side === 'front').length} FRONT ELEMENTS
                </div>
                <div className="gl-summary-chip">
                  <span className="material-symbols-outlined gl-chip-icon">image</span>
                  {designData.elements.filter(e => e.side === 'back').length} BACK ELEMENTS
                </div>
              </div>
            </div>

            <div className="gl-order-actions">
              <button
                className={`gl-order-cta ${totalQty < 1 ? 'gl-order-cta-disabled' : ''}`}
                disabled={totalQty < 1}
                onClick={handleProceed}
              >
                <span>PROCEED TO CHECKOUT</span>
                <span className="material-symbols-outlined gl-cta-arrow">arrow_forward</span>
              </button>
              <Link href="/design" className="gl-btn-back-link">
                <span className="material-symbols-outlined gl-back-icon">arrow_back</span>
                Quay lại chỉnh sửa
              </Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
