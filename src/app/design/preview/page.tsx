"use client";
import { useEffect, useState } from "react";

interface DesignConfig {
  garmentType: string;
  tshirtColor: string;
  projectName: string;
}

export default function DesignPreviewPage() {
  const [front] = useState<string | null>(() =>
    typeof window !== "undefined" ? sessionStorage.getItem("design_preview_front") : null
  );
  const [back] = useState<string | null>(() =>
    typeof window !== "undefined" ? sessionStorage.getItem("design_preview_back") : null
  );
  const [config] = useState<DesignConfig | null>(() => {
    if (typeof window === "undefined") return null;
    const c = sessionStorage.getItem("design_config");
    if (!c) return null;
    try { return JSON.parse(c) as DesignConfig; } catch { return null; }
  });
  const [activeView, setActiveView] = useState<"front" | "back" | "composite">("front");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Asynchronous update to avoid cascading render warning
    const t = setTimeout(() => setLoaded(true), 0);
    return () => clearTimeout(t);
  }, []);

  const downloadPng = (dataUrl: string, filename: string) => {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = filename;
    a.click();
  };

  const downloadComposite = () => {
    if (!front || !back) return;
    const canvas = document.createElement("canvas");
    canvas.width = 1600;
    canvas.height = 960;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#f5f5f5";
    ctx.fillRect(0, 0, 1600, 960);

    const loadImg = (src: string): Promise<HTMLImageElement> =>
      new Promise((res, rej) => {
        const img = new window.Image();
        img.onload = () => res(img);
        img.onerror = rej;
        img.src = src;
      });

    Promise.all([loadImg(front), loadImg(back)]).then(([fImg, bImg]) => {
      ctx.drawImage(fImg, 0, 0, 800, 960);
      ctx.drawImage(bImg, 800, 0, 800, 960);
      // Divider
      ctx.strokeStyle = "#ddd";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(800, 0);
      ctx.lineTo(800, 960);
      ctx.stroke();
      // Labels
      ctx.fillStyle = "#888";
      ctx.font = "700 22px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("FRONT", 400, 940);
      ctx.fillText("BACK", 1200, 940);

      const link = document.createElement("a");
      link.download = `${config?.projectName || "unispace-design"}-composite-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    });
  };

  const projectName = config?.projectName || "UNTITLED DESIGN";
  const garmentType = config?.garmentType || "RAGLAN";
  const ts = new Date().toLocaleDateString("vi-VN");

  if (!loaded) {
    return (
      <div className="preview-loading">
        <div className="preview-spinner" />
        <p>Đang tải thiết kế...</p>
      </div>
    );
  }

  if (!front && !back) {
    return (
      <div className="preview-empty">
        <div className="preview-empty-icon">📭</div>
        <h2>Không có dữ liệu thiết kế</h2>
        <p>Vui lòng quay lại trang thiết kế và bấm <strong>SAVE</strong> trước.</p>
        <button onClick={() => window.close()}>Đóng tab này</button>
      </div>
    );
  }

  const currentImg = activeView === "front" ? front : back;

  return (
    <div className="preview-root">
      {/* ── HEADER ── */}
      <header className="preview-header">
        <div className="preview-header-left">
          <div className="preview-logo">
            <span>U</span>
          </div>
          <div>
            <div className="preview-title">{projectName}</div>
            <div className="preview-meta">
              {garmentType} &nbsp;·&nbsp; {ts}
            </div>
          </div>
        </div>

        <div className="preview-tabs">
          <button
            className={`preview-tab ${activeView === "front" ? "active" : ""}`}
            onClick={() => setActiveView("front")}
          >
            MẶT TRƯỚC
          </button>
          <button
            className={`preview-tab ${activeView === "back" ? "active" : ""}`}
            onClick={() => setActiveView("back")}
          >
            MẶT SAU
          </button>
          <button
            className={`preview-tab ${activeView === "composite" ? "active" : ""}`}
            onClick={() => setActiveView("composite")}
          >
            TỔNG HỢP
          </button>
        </div>

        <div className="preview-actions">
          {activeView === "composite" ? (
            <button className="preview-btn-dl primary" onClick={downloadComposite}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              TẢI COMPOSITE
            </button>
          ) : (
            <>
              <button
                className="preview-btn-dl"
                disabled={!front}
                onClick={() => front && downloadPng(front, `${projectName}-front-${Date.now()}.png`)}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                TẢI TRƯỚC
              </button>
              <button
                className="preview-btn-dl"
                disabled={!back}
                onClick={() => back && downloadPng(back, `${projectName}-back-${Date.now()}.png`)}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                TẢI SAU
              </button>
              <button className="preview-btn-dl primary" onClick={downloadComposite}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                TẢI COMPOSITE
              </button>
            </>
          )}
        </div>
      </header>

      {/* ── CANVAS AREA ── */}
      <main className="preview-main">
        {activeView === "composite" ? (
          /* Side-by-side composite view */
          <div className="preview-composite">
            <div className="preview-composite-panel">
              <div className="preview-composite-label">MẶT TRƯỚC</div>
              {front && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={front} alt="Front design" className="preview-img" />
              )}
            </div>
            <div className="preview-composite-divider" />
            <div className="preview-composite-panel">
              <div className="preview-composite-label">MẶT SAU</div>
              {back && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={back} alt="Back design" className="preview-img" />
              )}
            </div>
          </div>
        ) : (
          /* Single-side view */
          <div className="preview-single">
            {currentImg ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentImg}
                alt={activeView === "front" ? "Front design" : "Back design"}
                className="preview-img-large"
              />
            ) : (
              <div className="preview-no-side">Không có dữ liệu mặt này</div>
            )}
          </div>
        )}
      </main>

      {/* ── FOOTER INFO ── */}
      <footer className="preview-footer">
        <div className="preview-footer-status">
          <span className="preview-dot" />
          <span>UNISPACE ADMIN PREVIEW</span>
        </div>
        <div className="preview-footer-info">
          {garmentType} &nbsp;·&nbsp; {config?.tshirtColor || "#ffffff"} &nbsp;·&nbsp; {ts}
        </div>
        <div className="preview-footer-hint">
          Dành riêng cho admin — không chia sẻ link này
        </div>
      </footer>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0a0f; color: #fff; font-family: 'JetBrains Mono', 'Courier New', monospace; }

        .preview-root {
          display: flex;
          flex-direction: column;
          height: 100dvh;
          background: #0a0a0f;
          overflow: hidden;
        }

        /* LOADING */
        .preview-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100dvh;
          background: #0a0a0f;
          color: #9ca3af;
          gap: 1rem;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.75rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
        .preview-spinner {
          width: 32px; height: 32px;
          border: 2px solid rgba(124, 58, 237, 0.2);
          border-top-color: #7C3AED;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* EMPTY */
        .preview-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100dvh;
          background: #0a0a0f;
          color: #9ca3af;
          gap: 1rem;
          font-family: 'JetBrains Mono', monospace;
          text-align: center;
          padding: 2rem;
        }
        .preview-empty-icon { font-size: 3rem; }
        .preview-empty h2 { color: #fff; font-size: 1.1rem; letter-spacing: 0.05em; }
        .preview-empty p { font-size: 0.75rem; line-height: 1.6; max-width: 320px; }
        .preview-empty button {
          margin-top: 0.5rem;
          padding: 0.6rem 1.5rem;
          background: #7C3AED;
          color: #fff;
          border: none;
          font-family: inherit;
          font-size: 0.7rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          cursor: pointer;
        }

        /* HEADER */
        .preview-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 1.5rem;
          height: 60px;
          background: #111118;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          shrink: 0;
          gap: 1rem;
          flex-shrink: 0;
        }
        .preview-header-left {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-shrink: 0;
        }
        .preview-logo {
          width: 32px; height: 32px;
          background: #7C3AED;
          display: flex; align-items: center; justify-content: center;
          font-weight: 900; font-size: 14px;
          flex-shrink: 0;
        }
        .preview-title {
          font-size: 0.75rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: #fff;
          line-height: 1.2;
        }
        .preview-meta {
          font-size: 0.62rem;
          color: #6b7280;
          letter-spacing: 0.08em;
          margin-top: 1px;
        }

        /* TABS */
        .preview-tabs {
          display: flex;
          gap: 0.25rem;
          background: rgba(255,255,255,0.04);
          padding: 3px;
          border: 1px solid rgba(255,255,255,0.08);
        }
        .preview-tab {
          padding: 6px 14px;
          font-family: inherit;
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #6b7280;
          background: transparent;
          border: none;
          cursor: pointer;
          transition: all 0.15s;
          white-space: nowrap;
        }
        .preview-tab:hover { color: #fff; }
        .preview-tab.active {
          background: #7C3AED;
          color: #fff;
        }

        /* ACTIONS */
        .preview-actions {
          display: flex;
          gap: 0.5rem;
          align-items: center;
          flex-shrink: 0;
        }
        .preview-btn-dl {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 7px 14px;
          font-family: inherit;
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          background: rgba(255,255,255,0.06);
          color: #d1d5db;
          border: 1px solid rgba(255,255,255,0.12);
          cursor: pointer;
          transition: all 0.15s;
          white-space: nowrap;
        }
        .preview-btn-dl:hover:not(:disabled) {
          background: rgba(255,255,255,0.1);
          color: #fff;
          border-color: rgba(255,255,255,0.25);
        }
        .preview-btn-dl.primary {
          background: #7C3AED;
          color: #fff;
          border-color: transparent;
        }
        .preview-btn-dl.primary:hover {
          background: #6d28d9;
        }
        .preview-btn-dl:disabled { opacity: 0.35; cursor: not-allowed; }

        /* MAIN AREA */
        .preview-main {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          overflow: hidden;
          background:
            radial-gradient(ellipse at 20% 50%, rgba(124,58,237,0.04) 0%, transparent 60%),
            #0a0a0f;
        }

        /* SINGLE VIEW */
        .preview-single {
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .preview-img-large {
          max-height: 100%;
          max-width: 100%;
          object-fit: contain;
          filter: drop-shadow(0 20px 60px rgba(0,0,0,0.6));
          transition: opacity 0.2s;
        }
        .preview-no-side {
          color: #6b7280;
          font-size: 0.75rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        /* COMPOSITE VIEW */
        .preview-composite {
          display: flex;
          align-items: center;
          gap: 0;
          height: 100%;
          width: 100%;
          max-width: 1200px;
        }
        .preview-composite-panel {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          height: 100%;
          justify-content: center;
        }
        .preview-composite-label {
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #6b7280;
        }
        .preview-img {
          max-height: calc(100% - 40px);
          max-width: 100%;
          object-fit: contain;
          filter: drop-shadow(0 10px 40px rgba(0,0,0,0.5));
        }
        .preview-composite-divider {
          width: 1px;
          height: 80%;
          background: rgba(255,255,255,0.08);
          flex-shrink: 0;
        }

        /* FOOTER */
        .preview-footer {
          height: 40px;
          background: #111118;
          border-top: 1px solid rgba(255,255,255,0.06);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 1.5rem;
          flex-shrink: 0;
        }
        .preview-footer-status {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.6rem;
          letter-spacing: 0.12em;
          color: #6b7280;
          text-transform: uppercase;
        }
        .preview-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #22c55e;
          animation: pulse-dot 2s ease-in-out infinite;
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .preview-footer-info {
          font-size: 0.6rem;
          letter-spacing: 0.08em;
          color: #4b5563;
          text-transform: uppercase;
        }
        .preview-footer-hint {
          font-size: 0.6rem;
          letter-spacing: 0.06em;
          color: #374151;
          text-transform: uppercase;
        }

        @media (max-width: 768px) {
          .preview-header {
            flex-wrap: wrap;
            height: auto;
            padding: 0.75rem 1rem;
            gap: 0.5rem;
          }
          .preview-actions { flex-wrap: wrap; }
          .preview-composite { flex-direction: column; }
          .preview-composite-divider { width: 80%; height: 1px; }
        }
      `}</style>
    </div>
  );
}
