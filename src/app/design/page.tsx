"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ─── Types ───────────────────────────────────────────────────
interface DesignElement {
  id: string;
  type: "image" | "text";
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
  rotation: number;
  side: "front" | "back";
}

interface AIImage {
  id: string;
  label: string;
  url: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "ai";
  content: string;
  images?: AIImage[];
}

// ─── T-Shirt SVG Component ──────────────────────────────────
function TShirtSVG({ color }: { color: string }) {
  // Determine if color is light to adjust shading direction
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const isLight = (r * 299 + g * 587 + b * 114) / 1000 > 128;

  return (
    <svg width="100%" height="100%" viewBox="0 0 400 480" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        {/* Fabric gradient for 3D depth */}
        <linearGradient id={`fabric-${color.replace('#','')}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={isLight ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.08)"} />
          <stop offset="40%" stopColor="rgba(0,0,0,0)" />
          <stop offset="100%" stopColor={isLight ? "rgba(0,0,0,0.06)" : "rgba(0,0,0,0.15)"} />
        </linearGradient>
        {/* Vertical body shading */}
        <linearGradient id={`bodyShade-${color.replace('#','')}`} x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="rgba(0,0,0,0)" />
          <stop offset="70%" stopColor="rgba(0,0,0,0.03)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.07)" />
        </linearGradient>
        {/* Left side shading */}
        <linearGradient id={`sideShade-${color.replace('#','')}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(0,0,0,0.05)" />
          <stop offset="30%" stopColor="rgba(0,0,0,0)" />
          <stop offset="70%" stopColor="rgba(0,0,0,0)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.04)" />
        </linearGradient>
        {/* Collar inner shadow */}
        <radialGradient id={`collarShadow-${color.replace('#','')}`} cx="0.5" cy="0" r="0.6">
          <stop offset="0%" stopColor="rgba(0,0,0,0.08)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
        {/* Outer shadow filter */}
        <filter id="tshirtShadow" x="-10%" y="-5%" width="120%" height="115%">
          <feDropShadow dx="0" dy="4" stdDeviation="8" floodOpacity="0.12" />
        </filter>
        {/* Subtle noise for fabric texture */}
        <filter id="fabricNoise">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" result="noise" />
          <feComposite in="SourceGraphic" in2="noise" operator="in" result="textured" />
          <feBlend in="SourceGraphic" in2="textured" mode="soft-light"/>
        </filter>
      </defs>

      <g filter="url(#tshirtShadow)">
        {/* ─── Main T-Shirt Body ─── */}
        <path
          d="M200 18
             L148 18 C142 18 137 20 134 24
             L95 62 L45 102 C38 107 36 115 38 122
             L58 158 C61 164 68 167 74 164
             L112 132 L112 430 C112 440 120 448 130 448
             L270 448 C280 448 288 440 288 430
             L288 132 L326 164 C332 167 339 164 342 158
             L362 122 C364 115 362 107 355 102
             L305 62 L266 24 C263 20 258 18 252 18
             L200 18Z"
          fill={color}
          stroke={isLight ? "#d4d4d4" : "rgba(255,255,255,0.06)"}
          strokeWidth="1"
        />

        {/* Fabric gradient overlay */}
        <path
          d="M200 18 L148 18 C142 18 137 20 134 24 L95 62 L45 102 C38 107 36 115 38 122 L58 158 C61 164 68 167 74 164 L112 132 L112 430 C112 440 120 448 130 448 L270 448 C280 448 288 440 288 430 L288 132 L326 164 C332 167 339 164 342 158 L362 122 C364 115 362 107 355 102 L305 62 L266 24 C263 20 258 18 252 18 L200 18Z"
          fill={`url(#fabric-${color.replace('#','')})`}
        />

        {/* Body vertical shading */}
        <rect x="112" y="130" width="176" height="318" rx="0" fill={`url(#bodyShade-${color.replace('#','')})`} clipPath="inset(0)" />

        {/* Side shading */}
        <rect x="112" y="130" width="176" height="318" rx="0" fill={`url(#sideShade-${color.replace('#','')})`} />

        {/* ─── Collar ─── */}
        {/* Collar opening (neck area) */}
        <path
          d="M160 18 C168 42 182 54 200 58 C218 54 232 42 240 18"
          fill={isLight ? "rgba(0,0,0,0.03)" : "rgba(0,0,0,0.12)"}
        />
        {/* Collar rib outline */}
        <path
          d="M160 18 C168 42 182 54 200 58 C218 54 232 42 240 18"
          fill="none"
          stroke={isLight ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.1)"}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Inner collar ring for depth */}
        <path
          d="M164 20 C171 40 184 50 200 53 C216 50 229 40 236 20"
          fill="none"
          stroke={isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.03)"}
          strokeWidth="1"
          strokeLinecap="round"
        />

        {/* ─── Wrinkle / Fold Details ─── */}
        {/* Left chest area fold */}
        <path d="M135 90 Q145 110 140 140" fill="none" stroke={isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.03)"} strokeWidth="0.8" />
        <path d="M150 75 Q155 100 148 130" fill="none" stroke={isLight ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.02)"} strokeWidth="0.6" />

        {/* Right chest area fold */}
        <path d="M265 90 Q255 110 260 140" fill="none" stroke={isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.03)"} strokeWidth="0.8" />
        <path d="M250 75 Q245 100 252 130" fill="none" stroke={isLight ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.02)"} strokeWidth="0.6" />

        {/* Center vertical fold hint */}
        <path d="M200 65 L200 280" fill="none" stroke={isLight ? "rgba(0,0,0,0.015)" : "rgba(255,255,255,0.01)"} strokeWidth="0.5" />

        {/* Lower body wrinkles */}
        <path d="M145 350 Q170 345 195 355" fill="none" stroke={isLight ? "rgba(0,0,0,0.025)" : "rgba(255,255,255,0.02)"} strokeWidth="0.6" />
        <path d="M205 360 Q230 350 260 355" fill="none" stroke={isLight ? "rgba(0,0,0,0.025)" : "rgba(255,255,255,0.02)"} strokeWidth="0.6" />

        {/* Left sleeve fold */}
        <path d="M112 85 Q115 105 112 130" fill="none" stroke={isLight ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.03)"} strokeWidth="0.7" />

        {/* Right sleeve fold */}
        <path d="M288 85 Q285 105 288 130" fill="none" stroke={isLight ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.03)"} strokeWidth="0.7" />

        {/* ─── Stitching Details ─── */}
        {/* Left sleeve hem stitch */}
        <path d="M74 162 L112 132" fill="none" stroke={isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.05)"} strokeWidth="0.5" strokeDasharray="3 2" />

        {/* Right sleeve hem stitch */}
        <path d="M326 162 L288 132" fill="none" stroke={isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.05)"} strokeWidth="0.5" strokeDasharray="3 2" />

        {/* Bottom hem stitch */}
        <path d="M130 443 L270 443" fill="none" stroke={isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.04)"} strokeWidth="0.5" strokeDasharray="4 3" />
        <path d="M130 446 L270 446" fill="none" stroke={isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.03)"} strokeWidth="0.5" strokeDasharray="4 3" />

        {/* Side seam stitches */}
        <path d="M112 132 L112 430" fill="none" stroke={isLight ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.02)"} strokeWidth="0.4" strokeDasharray="5 4" />
        <path d="M288 132 L288 430" fill="none" stroke={isLight ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.02)"} strokeWidth="0.4" strokeDasharray="5 4" />
      </g>
    </svg>
  );
}

// ─── Canva-style Design Canvas ──────────────────────────────
function DesignCanvas({
  elements,
  selectedId,
  onSelectElement,
  onMoveElement,
  onResizeElement,
  onPushHistory,
  onDropImage,
  side,
  tshirtColor,
  zoom,
}: {
  elements: DesignElement[];
  selectedId: string | null;
  onSelectElement: (id: string | null) => void;
  onMoveElement: (id: string, x: number, y: number) => void;
  onResizeElement: (id: string, width: number, height: number, x?: number, y?: number) => void;
  onPushHistory: () => void;
  onDropImage: (image: AIImage, x: number, y: number) => void;
  side: "front" | "back";
  tshirtColor: string;
  zoom: number;
}) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDropTarget, setIsDropTarget] = useState(false);

  // Stable ref — updated after every render so event handlers always see latest value
  const pushHistoryRef = useRef(onPushHistory);
  useEffect(() => { pushHistoryRef.current = onPushHistory; });

  // Track whether mouse actually moved during drag — prevents post-drag click from deselecting
  const hasMovedRef = useRef(false);

  const sideElements = elements.filter((el) => el.side === side);

  const handleElementMouseDown = useCallback(
    (e: React.MouseEvent | React.TouchEvent, el: DesignElement) => {
      e.stopPropagation();
      e.preventDefault();
      hasMovedRef.current = false;
      onSelectElement(el.id);
      const rect = canvasRef.current!.getBoundingClientRect();
      const scale = zoom / 100;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      setDragOffset({
        x: (clientX - rect.left) / scale - el.x,
        y: (clientY - rect.top) / scale - el.y,
      });
      setIsDragging(true);
    },
    [onSelectElement, zoom]
  );

  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent | React.TouchEvent, el: DesignElement, corner: 'tl'|'tr'|'bl'|'br' = 'br') => {
      // e.stopPropagation and preventDefault are called at the call site on handle divs
      setIsResizing(true);
      onSelectElement(el.id);
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const startX = clientX;
      const startY = clientY;
      const startWidth = el.width;
      const startHeight = el.height;
      const startElX = el.x;
      const startElY = el.y;
      const scale = zoom / 100;

      const handleMouseMove = (moveE: MouseEvent) => {
        const dx = (moveE.clientX - startX) / scale;
        const dy = (moveE.clientY - startY) / scale;
        let newWidth = startWidth;
        let newHeight = startHeight;
        let newX = startElX;
        let newY = startElY;

        if (corner === 'br') { newWidth = Math.max(20, startWidth + dx); newHeight = Math.max(20, startHeight + dy); }
        if (corner === 'bl') { newWidth = Math.max(20, startWidth - dx); newHeight = Math.max(20, startHeight + dy); newX = startElX + dx; }
        if (corner === 'tr') { newWidth = Math.max(20, startWidth + dx); newHeight = Math.max(20, startHeight - dy); newY = startElY + dy; }
        if (corner === 'tl') { newWidth = Math.max(20, startWidth - dx); newHeight = Math.max(20, startHeight - dy); newX = startElX + dx; newY = startElY + dy; }

        onResizeElement(el.id, newWidth, newHeight, newX, newY);
      };

      const handleMouseUp = () => {
        pushHistoryRef.current();
        setIsResizing(false);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.removeEventListener("touchmove", handleTouchMove);
        document.removeEventListener("touchend", handleMouseUp);
      };
      const handleTouchMove = (moveE: TouchEvent) => {
        if (!moveE.touches[0]) return;
        const dx = (moveE.touches[0].clientX - startX) / scale;
        const dy = (moveE.touches[0].clientY - startY) / scale;
        let newWidth = startWidth, newHeight = startHeight, newX = startElX, newY = startElY;
        if (corner === 'br') { newWidth = Math.max(20, startWidth + dx); newHeight = Math.max(20, startHeight + dy); }
        if (corner === 'bl') { newWidth = Math.max(20, startWidth - dx); newHeight = Math.max(20, startHeight + dy); newX = startElX + dx; }
        if (corner === 'tr') { newWidth = Math.max(20, startWidth + dx); newHeight = Math.max(20, startHeight - dy); newY = startElY + dy; }
        if (corner === 'tl') { newWidth = Math.max(20, startWidth - dx); newHeight = Math.max(20, startHeight - dy); newX = startElX + dx; newY = startElY + dy; }
        onResizeElement(el.id, newWidth, newHeight, newX, newY);
      };
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.addEventListener("touchmove", handleTouchMove, { passive: false });
      document.addEventListener("touchend", handleMouseUp);
    },
    [onSelectElement, onResizeElement, zoom]
  );

  useEffect(() => {
    if (!isDragging || !selectedId) return;
    const scale = zoom / 100;

    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current) return;
      hasMovedRef.current = true;
      const rect = canvasRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / scale - dragOffset.x;
      const y = (e.clientY - rect.top) / scale - dragOffset.y;
      onMoveElement(selectedId, x, y);
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (!canvasRef.current || !e.touches[0]) return;
      e.preventDefault();
      hasMovedRef.current = true;
      const rect = canvasRef.current.getBoundingClientRect();
      const x = (e.touches[0].clientX - rect.left) / scale - dragOffset.x;
      const y = (e.touches[0].clientY - rect.top) / scale - dragOffset.y;
      onMoveElement(selectedId, x, y);
    };
    const handleMouseUp = () => {
      pushHistoryRef.current();
      setIsDragging(false);
    };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleMouseUp);
    };
  }, [isDragging, selectedId, dragOffset, onMoveElement, zoom]); // no onPushHistory in deps


  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setIsDropTarget(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDropTarget(false), []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDropTarget(false);
      const data = e.dataTransfer.getData("application/json");
      if (!data) return;
      try {
        const image: AIImage = JSON.parse(data);
        const rect = canvasRef.current!.getBoundingClientRect();
        const scale = zoom / 100;
        const x = (e.clientX - rect.left) / scale - 40;
        const y = (e.clientY - rect.top) / scale - 40;
        onDropImage(image, x, y);
      } catch (err) {
        console.error("Drop error:", err);
      }
    },
    [onDropImage, zoom]
  );

  return (
    <>
      {/* Dynamic CSS — no inline styles needed */}
      <style>{`
        .canva-canvas { 
          --canvas-scale: ${zoom / 100}; 
          transform: scale(var(--canvas-scale, 1));
          transform-origin: top left;
        }
        ${sideElements.map(el => `
          .el-${el.id} {
            left: ${el.x}px; top: ${el.y}px;
            width: ${el.width}px; height: ${el.height}px;
            transform: rotate(${el.rotation}deg);
          }
          .canva-handle-tl.hdl-${el.id} { left: ${el.x}px; top: ${el.y}px; }
          .canva-handle-tr.hdl-${el.id} { left: ${el.x + el.width}px; top: ${el.y}px; }
          .canva-handle-bl.hdl-${el.id} { left: ${el.x}px; top: ${el.y + el.height}px; }
          .canva-handle-br.hdl-${el.id} { left: ${el.x + el.width}px; top: ${el.y + el.height}px; }
          .el-text-${el.id} {
            font-size: ${el.fontSize || 24}px;
            font-family: "${el.fontFamily || 'Inter'}", sans-serif;
            color: ${el.textColor || '#000'};
          }
        `).join('')}
      `}</style>

      <div
        ref={canvasRef}
        className={`canva-canvas ${isDropTarget ? "canva-canvas-drop-active" : ""}`}
        onMouseDown={(e) => {
          // Only deselect if the click target is the canvas itself (not a child element)
          // AND no movement occurred (not the end of a drag)
          if (e.target === e.currentTarget && !hasMovedRef.current) {
            onSelectElement(null);
          }
          hasMovedRef.current = false;
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <TShirtSVG color={tshirtColor} />

        {/* Print area guide */}
        <div className="canva-print-area">
          <span className="canva-print-label">Vùng in {side === "front" ? "mặt trước" : "mặt sau"}</span>
        </div>

        {sideElements.map((el) => (
          <div key={el.id} className="canva-element-wrapper">
            <div
              className={`canva-element el-${el.id} ${selectedId === el.id ? "canva-element-selected" : ""}`}
              onMouseDown={(e) => handleElementMouseDown(e, el)}
              onTouchStart={(e) => handleElementMouseDown(e, el)}
            >
              {el.type === "image" && el.url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={el.url} alt={el.label} className="w-full h-full object-contain pointer-events-none" draggable={false} />
              )}
              {el.type === "text" && (
                <div className={`canva-text-element el-text-${el.id}`}>
                  {el.text}
                </div>
              )}
            </div>
            {selectedId === el.id && !isDragging && !isResizing && (
              <>
                <div className={`canva-handle canva-handle-tl hdl-${el.id}`} onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); handleResizeMouseDown(e, el, 'tl'); }} onTouchStart={(e) => { e.stopPropagation(); e.preventDefault(); handleResizeMouseDown(e, el, 'tl'); }} />
                <div className={`canva-handle canva-handle-tr hdl-${el.id}`} onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); handleResizeMouseDown(e, el, 'tr'); }} onTouchStart={(e) => { e.stopPropagation(); e.preventDefault(); handleResizeMouseDown(e, el, 'tr'); }} />
                <div className={`canva-handle canva-handle-bl hdl-${el.id}`} onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); handleResizeMouseDown(e, el, 'bl'); }} onTouchStart={(e) => { e.stopPropagation(); e.preventDefault(); handleResizeMouseDown(e, el, 'bl'); }} />
                <div className={`canva-handle canva-handle-br hdl-${el.id}`} onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); handleResizeMouseDown(e, el, 'br'); }} onTouchStart={(e) => { e.stopPropagation(); e.preventDefault(); handleResizeMouseDown(e, el, 'br'); }} />
              </>
            )}
          </div>
        ))}

      {sideElements.length === 0 && !isDropTarget && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none canva-drop-hint">
          <div className="text-center opacity-40">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mx-auto mb-3 opacity-40">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            <p className="text-sm font-medium">Kéo hình vào đây</p>
            <p className="text-xs mt-1">hoặc dùng công cụ bên trái</p>
          </div>
        </div>
      )}
    </div>
    </>
  );
}

// ─── Main Design Page (Canva-like) ──────────────────────────
export default function DesignPage() {
  const router = useRouter();
  const [side, setSide] = useState<"front" | "back">("front");
  const [tshirtColor, setTshirtColor] = useState("#ffffff");
  const [elements, setElements] = useState<DesignElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [zoom, setZoom] = useState(100);
  const [activePanel, setActivePanel] = useState<"ai" | "text" | "elements" | "layers" | "upload" | null>("ai");
  const [textInput, setTextInput] = useState("");
  const [textFont, setTextFont] = useState("Inter");
  const [textSize, setTextSize] = useState(28);
  const [textColor, setTextColor] = useState("#000000");
  const [uploadedImages, setUploadedImages] = useState<AIImage[]>([]);
  const [uploadDragOver, setUploadDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Undo / Redo
  const [historyStack, setHistoryStack] = useState<DesignElement[][]>([]);
  const [redoStack, setRedoStack] = useState<DesignElement[][]>([]);

  const pushHistory = useCallback((prev: DesignElement[]) => {
    setHistoryStack(h => [...h.slice(-49), prev]);
    setRedoStack([]);
  }, []);

  const handleUndo = useCallback(() => {
    setHistoryStack(h => {
      if (h.length === 0) return h;
      const newHistory = h.slice(0, -1);
      const prev = h[h.length - 1];
      setRedoStack(r => [...r, elements]);
      setElements(prev);
      return newHistory;
    });
  }, [elements]);

  const handleRedo = useCallback(() => {
    setRedoStack(r => {
      if (r.length === 0) return r;
      const newRedo = r.slice(0, -1);
      const next = r[r.length - 1];
      setHistoryStack(h => [...h, elements]);
      setElements(next);
      return newRedo;
    });
  }, [elements]);

  const colors = [
    { name: "Trắng", value: "#ffffff" },
    { name: "Đen", value: "#1a1a1a" },
    { name: "Xám", value: "#6b7280" },
    { name: "Navy", value: "#1e3a5f" },
    { name: "Đỏ", value: "#ef4444" },
    { name: "Xanh dương", value: "#3b82f6" },
    { name: "Xanh lá", value: "#22c55e" },
    { name: "Tím", value: "#8b5cf6" },
    { name: "Hồng", value: "#ec4899" },
    { name: "Vàng", value: "#f59e0b" },
  ];

  const fonts = [
    // Sans Serif
    "Inter", "Roboto", "Open Sans", "Montserrat", "Poppins", "Nunito", "Raleway", "Oswald", "Ubuntu", "Quicksand",
    // Serif
    "Playfair Display", "Merriweather", "Lora", "PT Serif", "Crimson Text",
    // Display & Decorative
    "Bebas Neue", "Righteous", "Pacifico", "Lobster", "Permanent Marker", "Bungee", "Fredoka One", "Abril Fatface",
    // Handwriting
    "Dancing Script", "Caveat", "Satisfy", "Great Vibes", "Sacramento",
    // Monospace
    "JetBrains Mono", "Fira Code", "Source Code Pro",
    // System fallbacks
    "Arial", "Georgia", "Impact", "Courier New", "Verdana",
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ─── AI Chat (Gemini Integration) ─────────────────────────────────
  const handleSendMessage = useCallback(async (content: string) => {
    const userMsg: ChatMessage = { id: `msg-${Date.now()}`, role: "user", content };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // Use AbortController for timeout (90s max)
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 90000);

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: content }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const methodLabel = data.method === "imagen"
        ? "🖼️ Imagen AI"
        : data.method === "native" 
          ? "🤖 Gemini AI" 
          : data.method === "svg"
            ? "✨ Gemini AI"
            : data.method === "smart"
              ? "🎨 Mẫu thông minh"
              : "📦 Mẫu demo";

      const aiMsg: ChatMessage = {
        id: `msg-${Date.now()}-ai`,
        role: "ai",
        content: `${methodLabel} — Đã tạo ${data.images.length} mẫu! Kéo hình vào áo để sử dụng 👇`,
        images: data.images,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const errorMsg = (err as Error).name === "AbortError" 
        ? "⏱️ AI đang quá tải, vui lòng thử lại sau vài giây!"
        : "⚠️ Có lỗi xảy ra. Vui lòng thử lại! 🙏";
      setMessages((prev) => [
        ...prev,
        { id: `msg-${Date.now()}-err`, role: "ai", content: errorMsg },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isLoading) return;
    handleSendMessage(chatInput.trim());
    setChatInput("");
  };

  const handleDragStart = (e: React.DragEvent, image: AIImage) => {
    e.dataTransfer.setData("application/json", JSON.stringify(image));
    e.dataTransfer.effectAllowed = "copy";
  };

  // ─── Canvas Actions ──────────────────────────
  const handleDropImage = useCallback(
    (image: AIImage, x: number, y: number) => {
      const el: DesignElement = {
        id: `el-${Date.now()}`,
        type: "image",
        url: image.url,
        label: image.label,
        x: Math.max(0, x),
        y: Math.max(0, y),
        width: 80,
        height: 80,
        rotation: 0,
        side,
      };
      setElements((prev) => {
        pushHistory(prev);
        return [...prev, el];
      });
      setSelectedId(el.id);
    },
    [side, pushHistory]
  );

  const handleAddText = () => {
    if (!textInput.trim()) return;
    const el: DesignElement = {
      id: `el-${Date.now()}`,
      type: "text",
      text: textInput,
      fontSize: textSize,
      fontFamily: textFont,
      textColor: textColor,
      label: textInput,
      x: 130,
      y: 200,
      width: 140,
      height: 50,
      rotation: 0,
      side,
    };
    setElements((prev) => {
      pushHistory(prev);
      return [...prev, el];
    });
    setSelectedId(el.id);
    setTextInput("");
  };

  const handleMoveElement = useCallback((id: string, x: number, y: number) => {
    setElements((prev) => prev.map((el) => (el.id === id ? { ...el, x, y } : el)));
  }, []);

  const handleResizeElement = useCallback((id: string, width: number, height: number, x?: number, y?: number) => {
    setElements((prev) => prev.map((el) => (
      el.id === id ? { ...el, width, height, ...(x !== undefined ? { x } : {}), ...(y !== undefined ? { y } : {}) } : el
    )));
  }, []);

  const handleDeleteSelected = useCallback(() => {
    if (!selectedId) return;
    setElements((prev) => {
      pushHistory(prev);
      return prev.filter((el) => el.id !== selectedId);
    });
    setSelectedId(null);
  }, [selectedId, pushHistory]);

  const handleDuplicateSelected = useCallback(() => {
    if (!selectedId) return;
    const original = elements.find((el) => el.id === selectedId);
    if (!original) return;
    const dup = { ...original, id: `el-${Date.now()}`, x: original.x + 15, y: original.y + 15 };
    setElements((prev) => {
      pushHistory(prev);
      return [...prev, dup];
    });
    setSelectedId(dup.id);
  }, [selectedId, elements, pushHistory]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") return;
      if (e.key === "Delete" || e.key === "Backspace") handleDeleteSelected();
      if (e.key === "Escape") setSelectedId(null);
      if ((e.metaKey || e.ctrlKey) && e.key === "d") { e.preventDefault(); handleDuplicateSelected(); }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "z") { e.preventDefault(); handleRedo(); }
      else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") { e.preventDefault(); handleUndo(); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleDeleteSelected, handleDuplicateSelected, handleUndo, handleRedo]);

  const handleComplete = () => {
    sessionStorage.setItem("designData", JSON.stringify({ elements, tshirtColor }));
    router.push("/order");
  };

  const handleUpload = useCallback((files: FileList | File[]) => {
    const fileArr = Array.from(files).filter(f => f.type.startsWith("image/"));
    fileArr.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target?.result as string;
        const img: AIImage = {
          id: `upload-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          label: file.name.replace(/\.[^.]+$/, "").slice(0, 20),
          url,
        };
        setUploadedImages(prev => [img, ...prev]);
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const handleUploadFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleUpload(e.target.files);
    e.target.value = "";
  };

  const handleUploadDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setUploadDragOver(false);
    if (e.dataTransfer.files) handleUpload(e.dataTransfer.files);
  };

  const addUploadedImageToCanvas = (img: AIImage) => {
    const el: DesignElement = {
      id: `el-${Date.now()}`,
      type: "image",
      label: img.label,
      url: img.url,
      x: 110, y: 130, width: 140, height: 140, rotation: 0, side,
    };
    setElements(prev => [...prev, el]);
    setSelectedId(el.id);
  };

  const frontCount = elements.filter((e) => e.side === "front").length;
  const backCount = elements.filter((e) => e.side === "back").length;
  const selectedElement = elements.find((el) => el.id === selectedId);

  const suggestions = [
    "Logo lớp 12A1 phong cách vintage 🏫",
    "Trái tim galaxy 💜",
    "Ngôi sao retro ⭐",
    "Hình rồng phong cách Nhật 🐉",
    "Logo đội bóng đá ⚽",
    "Biểu tượng vô cực ♾️",
    "Hoa anh đào sakura 🌸",
    "Wolf howling at moon 🐺",
  ];

  return (
    <div className="canva-layout">
      {/* ═══ TOP BAR ═══ */}
      <header className="canva-topbar">
        <div className="canva-topbar-left">
          <Link href="/" className="canva-logo">
            <span className="canva-logo-accent">Uni</span>Space
          </Link>
          <div className="canva-topbar-divider" />
          <span className="canva-file-name">Thiết kế áo lớp</span>
        </div>

        <div className="canva-topbar-center">
          <button
            className="canva-topbar-btn"
            title="Hoàn tác (Ctrl+Z)"
            aria-label="Hoàn tác"
            onClick={handleUndo}
            disabled={historyStack.length === 0}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
          </button>
          <button
            className="canva-topbar-btn"
            title="Làm lại (Ctrl+Shift+Z)"
            aria-label="Làm lại"
            onClick={handleRedo}
            disabled={redoStack.length === 0}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
          </button>
        </div>

        <div className="canva-topbar-right">
          {selectedId && (
            <>
              <button onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleDuplicateSelected(); }} className="canva-topbar-btn" title="Nhân bản (Ctrl+D)" aria-label="Nhân bản">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              </button>
              <button onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteSelected(); }} className="canva-topbar-btn canva-topbar-btn-danger" title="Xóa (Delete)" aria-label="Xóa">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
              <div className="canva-topbar-divider" />
            </>
          )}
          <button onClick={handleComplete} className="canva-btn-complete" disabled={elements.length === 0}>
            Hoàn thành thiết kế
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      </header>

      <div className="canva-body">
        {/* ═══ LEFT TOOLBAR ═══ */}
        <aside className="canva-sidebar-left">
          <button
            className={`canva-tool-btn ${activePanel === "ai" ? "active" : ""}`}
            onClick={() => setActivePanel(activePanel === "ai" ? null : "ai")}
            title="AI Design"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
            </svg>
            <span>AI</span>
          </button>
          <button
            className={`canva-tool-btn ${activePanel === "upload" ? "active" : ""}`}
            onClick={() => setActivePanel(activePanel === "upload" ? null : "upload")}
            title="Tải ảnh lên"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/><path d="M16 5l2 2 4-4"/>
            </svg>
            <span>Ảnh</span>
          </button>
          <button
            className={`canva-tool-btn ${activePanel === "text" ? "active" : ""}`}
            onClick={() => setActivePanel(activePanel === "text" ? null : "text")}
            title="Thêm chữ"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/>
            </svg>
            <span>Chữ</span>
          </button>
          <button
            className={`canva-tool-btn ${activePanel === "elements" ? "active" : ""}`}
            onClick={() => setActivePanel(activePanel === "elements" ? null : "elements")}
            title="Màu áo"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="13.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="10.5" r="2.5"/><circle cx="8.5" cy="7.5" r="2.5"/>
              <circle cx="6.5" cy="12.5" r="2.5"/><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>
            </svg>
            <span>Màu</span>
          </button>
          <button
            className={`canva-tool-btn ${activePanel === "layers" ? "active" : ""}`}
            onClick={() => setActivePanel(activePanel === "layers" ? null : "layers")}
            title="Layers"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="2" y="7" width="15" height="15" rx="2" ry="2"/><path d="M17 2h2a2 2 0 0 1 2 2v2"/><path d="M17 22h2a2 2 0 0 0 2-2v-2"/><path d="M7 2h-2a2 2 0 0 0-2 2v2"/>
            </svg>
            <span>Layers</span>
          </button>

          <div className="canva-sidebar-spacer" />

          {/* Side switcher */}
          <button
            className="canva-tool-btn"
            onClick={() => setSide(side === "front" ? "back" : "front")}
            title={`Chuyển sang mặt ${side === "front" ? "sau" : "trước"}`}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/>
              <polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
            </svg>
            <span>{side === "front" ? "Trước" : "Sau"}</span>
          </button>
        </aside>

        {/* ═══ LEFT PANEL (content) ═══ */}
        {activePanel && (
          <div className="canva-panel">
            {/* AI Panel */}
            {activePanel === "ai" && (
              <div className="canva-panel-content">
                <div className="canva-panel-header">
                  <h3>Gemini AI Design</h3>
                  <button onClick={() => setActivePanel(null)} className="canva-panel-close" aria-label="Đóng">×</button>
                </div>

                <div className="canva-chat-messages">
                  {messages.length === 0 && (
                    <div className="canva-chat-empty">
                      <div className="canva-chat-empty-icon">🎨</div>
                      <p className="canva-chat-empty-title">Mô tả thiết kế bạn muốn</p>
                      <p className="canva-chat-empty-sub">Gemini AI sẽ tạo hình ảnh để bạn kéo vào áo</p>
                      <div className="canva-suggestions">
                        {suggestions.map((s, i) => (
                          <button key={i} onClick={() => handleSendMessage(s)} className="canva-suggestion-btn">{s}</button>
                        ))}
                      </div>
                    </div>
                  )}

                  {messages.map((msg) => (
                    <div key={msg.id} className={`canva-chat-msg ${msg.role}`}>
                      <p>{msg.content}</p>
                      {msg.images && msg.images.length > 0 && (
                        <>
                          <div className="canva-ai-grid">
                            {msg.images.map((img) => (
                              <div key={img.id} className="canva-ai-item" draggable onDragStart={(e) => handleDragStart(e, img)} onClick={() => {
                                const el: DesignElement = {
                                  id: `el-${Date.now()}`, type: "image", label: img.label, url: img.url,
                                  x: 100, y: 120, width: 140, height: 140, rotation: 0, side,
                                };
                                setElements((prev) => [...prev, el]);
                                setSelectedId(el.id);
                              }}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={img.url} alt={img.label} />
                                <div className="canva-ai-item-overlay">
                                  <span>Nhấn hoặc kéo</span>
                                </div>
                                <span className="canva-ai-item-label">{img.label}</span>
                              </div>
                            ))}
                          </div>
                          {msg.role === "ai" && !isLoading && (
                            <button className="canva-btn-more" onClick={() => handleSendMessage(messages.filter(m => m.role === "user").pop()?.content || "thiết kế")}>
                              ↻ Tạo thêm mẫu
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  ))}

                  {isLoading && (
                    <div className="canva-typing">
                      <div className="canva-typing-dot" /><div className="canva-typing-dot" /><div className="canva-typing-dot" />
                      <span className="canva-typing-label">Gemini đang tạo thiết kế...</span>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleChatSubmit} className="canva-chat-input">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Mô tả hình ảnh bạn muốn..."
                    disabled={isLoading}
                  />
                  <button type="submit" disabled={!chatInput.trim() || isLoading} aria-label="Gửi">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                  </button>
                </form>
              </div>
            )}

            {/* Upload Panel */}
            {activePanel === "upload" && (
              <div className="canva-panel-content">
                <div className="canva-panel-header">
                  <h3>Tải ảnh lên</h3>
                  <button onClick={() => setActivePanel(null)} className="canva-panel-close" aria-label="Đóng">×</button>
                </div>
                <div className="canva-panel-body">
                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="upload-file-input"
                    onChange={handleUploadFileChange}
                    aria-label="Chọn ảnh từ máy tính"
                  />

                  {/* Drop zone */}
                  <div
                    className={`upload-dropzone ${uploadDragOver ? "active" : ""}`}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setUploadDragOver(true); }}
                    onDragLeave={() => setUploadDragOver(false)}
                    onDrop={handleUploadDrop}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
                    aria-label="Kéo thả ảnh hoặc nhấp để chọn"
                  >
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="upload-dropzone-icon">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    <p className="upload-dropzone-title">Kéo ảnh vào đây</p>
                    <p className="upload-dropzone-sub">hoặc <strong>nhấp để chọn file</strong></p>
                    <p className="upload-dropzone-hint">PNG, JPG, SVG, WEBP</p>
                  </div>

                  {/* Uploaded gallery */}
                  {uploadedImages.length > 0 && (
                    <>
                      <div className="upload-gallery-header">
                        <span className="canva-label upload-count-label">{uploadedImages.length} ẢNH ĐÃ TẢI</span>
                        <button
                          className="upload-clear-btn"
                          onClick={() => setUploadedImages([])}
                        >
                          Xóa tất cả
                        </button>
                      </div>
                      <div className="canva-ai-grid">
                        {uploadedImages.map((img) => (
                          <div
                            key={img.id}
                            className="canva-ai-item"
                            draggable
                            onDragStart={(e) => handleDragStart(e, img)}
                            onClick={() => addUploadedImageToCanvas(img)}
                            title={img.label}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={img.url} alt={img.label} />
                            <div className="canva-ai-item-overlay">
                              <span>Nhấn hoặc kéo</span>
                            </div>
                            <button
                              className="upload-delete-img"
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                setUploadedImages(prev => prev.filter(i => i.id !== img.id));
                              }}
                              aria-label="Xóa ảnh"
                            >×</button>
                            <span className="canva-ai-item-label">{img.label}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Text Panel */}
            {activePanel === "text" && (
              <div className="canva-panel-content">
                <div className="canva-panel-header">
                  <h3>Thêm chữ</h3>
                  <button onClick={() => setActivePanel(null)} className="canva-panel-close" aria-label="Đóng">×</button>
                </div>
                <div className="canva-panel-body">
                  <label className="canva-label">Nội dung</label>
                  <input
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Nhập chữ muốn thêm..."
                    className="canva-input"
                    onKeyDown={(e) => { if (e.key === "Enter" && textInput.trim()) handleAddText(); }}
                  />

                  <label className="canva-label">Font chữ</label>
                  <style>{fonts.map((f, i) => `.font-btn-${i} { font-family: "${f}", sans-serif; }`).join(' ')}</style>
                  <div className="canva-font-picker">
                    {fonts.map((f, i) => (
                      <button
                        key={f}
                        className={`canva-font-item font-btn-${i} ${textFont === f ? "active" : ""}`}
                        onClick={() => setTextFont(f)}
                      >
                        {f}
                      </button>
                    ))}
                  </div>

                  <div className="canva-row">
                    <div className="canva-half">
                      <label className="canva-label">Cỡ chữ</label>
                      <input type="number" value={textSize} onChange={(e) => setTextSize(Number(e.target.value))} className="canva-input" min={10} max={120} placeholder="28" />
                    </div>
                    <div className="canva-half">
                      <label className="canva-label">Màu chữ</label>
                      <div className="canva-color-preview">
                        <input
                          type="color"
                          value={textColor}
                          readOnly
                          tabIndex={-1}
                          className="canva-color-dot-native"
                        />
                        <span className="canva-color-hex">{textColor}</span>
                      </div>
                    </div>
                  </div>

                  <div className="canva-quick-colors">
                    <label className="canva-label">Màu nhanh</label>
                    <div className="canva-swatch-row">
                      {['#000000','#ffffff','#e84393','#6c5ce7','#0984e3','#00b894','#f1c40f','#e17055','#2d3436','#fdcb6e','#ff7675','#74b9ff'].map(c => (
                        <button
                          key={c}
                          title={c}
                          onClick={() => setTextColor(c)}
                          className={`canva-swatch${textColor === c ? ' canva-swatch-active' : ''}`}
                          data-color={c}
                        />
                      ))}
                      <label title="Màu tùy chỉnh" className="canva-swatch-custom">
                        🎨
                        <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="canva-color-hidden" />
                      </label>
                    </div>
                  </div>

                  <button onClick={handleAddText} className="canva-btn-add" disabled={!textInput.trim()}>
                    Thêm chữ vào áo
                  </button>

                  <div className="canva-text-presets">
                    <p className="canva-label">Mẫu nhanh</p>
                    {["CLASS OF 2026", "12A1 ❤️", "TOGETHER WE ARE ONE", "KỶ NIỆM", "FRIENDSHIP"].map((t) => (
                      <button key={t} className="canva-preset-btn" onClick={() => { setTextInput(t); }}>{t}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Color Panel */}
            {activePanel === "elements" && (
              <div className="canva-panel-content">
                <div className="canva-panel-header">
                  <h3>Màu áo</h3>
                  <button onClick={() => setActivePanel(null)} className="canva-panel-close" aria-label="Đóng">×</button>
                </div>
                <div className="canva-panel-body">
                  <div className="canva-color-grid">
                    <style>{colors.map(c => {
                      const cls = c.value.replace('#', 'c');
                      return `.swatch-${cls} { background-color: ${c.value}; border-color: ${c.value === '#ffffff' ? '#ddd' : c.value}; }`;
                    }).join(' ')}</style>
                    {colors.map((c) => (
                      <button
                        key={c.value}
                        onClick={() => setTshirtColor(c.value)}
                        className={`canva-color-swatch swatch-${c.value.replace('#', 'c')} ${tshirtColor === c.value ? "active" : ""}`}
                        title={c.name}
                        aria-label={`Chọn màu ${c.name}`}
                      >
                        {tshirtColor === c.value && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c.value === "#ffffff" || c.value === "#f59e0b" ? "#333" : "#fff"} strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                      </button>
                    ))}
                  </div>
                  <p className="canva-color-name">Đang chọn: <strong>{colors.find(c => c.value === tshirtColor)?.name}</strong></p>
                </div>
              </div>
            )}

            {/* Layers Panel */}
            {activePanel === "layers" && (
              <div className="canva-panel-content">
                <div className="canva-panel-header">
                  <h3>Layers</h3>
                  <button onClick={() => setActivePanel(null)} className="canva-panel-close" aria-label="Đóng">×</button>
                </div>
                <div className="canva-panel-body">
                  <div className="canva-layers-side">
                    <button className={side === "front" ? "active" : ""} onClick={() => setSide("front")}>Mặt trước ({frontCount})</button>
                    <button className={side === "back" ? "active" : ""} onClick={() => setSide("back")}>Mặt sau ({backCount})</button>
                  </div>
                  {elements.filter((el) => el.side === side).length === 0 ? (
                    <p className="canva-layers-empty">Chưa có element nào</p>
                  ) : (
                    <div className="canva-layers-list">
                      {elements.filter((el) => el.side === side).map((el, i) => (
                        <div key={el.id} className={`canva-layer-item ${selectedId === el.id ? "active" : ""}`} onClick={() => setSelectedId(el.id)}>
                          <span className="canva-layer-idx">{i + 1}</span>
                          <span className="canva-layer-icon">{el.type === "text" ? "T" : "🖼"}</span>
                          <span className="canva-layer-name">{el.label}</span>
                          <button onClick={(e) => { e.stopPropagation(); setElements((prev) => { pushHistory(prev); return prev.filter((p) => p.id !== el.id); }); if (selectedId === el.id) setSelectedId(null); }} className="canva-layer-delete" aria-label="Xóa layer">×</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ CENTER CANVAS ═══ */}
        <main className="canva-workspace">
          {/* Canvas area with checkerboard bg */}
          <div
            className="canva-canvas-wrapper"
            onMouseDown={(e) => {
              // Click on checkered background (outside t-shirt canvas) → deselect
              if (e.target === e.currentTarget) setSelectedId(null);
            }}
          >
            <DesignCanvas
              elements={elements}
              selectedId={selectedId}
              onSelectElement={setSelectedId}
              onMoveElement={handleMoveElement}
              onResizeElement={handleResizeElement}
              onPushHistory={() => pushHistory(elements)}
              onDropImage={handleDropImage}
              side={side}
              tshirtColor={tshirtColor}
              zoom={zoom}
            />
          </div>

          {/* Bottom bar */}
          <div className="canva-bottombar">
            <div className="canva-zoom">
              <button onClick={() => setZoom((z) => Math.max(50, z - 10))} className="canva-zoom-btn" aria-label="Thu nhỏ">−</button>
              <span className="canva-zoom-val">{zoom}%</span>
              <button onClick={() => setZoom((z) => Math.min(200, z + 10))} className="canva-zoom-btn" aria-label="Phóng to">+</button>
            </div>
            <div className="canva-side-indicator">
              <button onClick={() => setSide("front")} className={side === "front" ? "active" : ""}>
                Mặt trước {frontCount > 0 && <span className="canva-badge">{frontCount}</span>}
              </button>
              <button onClick={() => setSide("back")} className={side === "back" ? "active" : ""}>
                Mặt sau {backCount > 0 && <span className="canva-badge">{backCount}</span>}
              </button>
            </div>
            {selectedElement && (
              <div className="canva-element-info">
                <span className="canva-info-label">{selectedElement.type === "text" ? "Text" : "Image"}: {selectedElement.label}</span>
                <span className="canva-info-pos">{Math.round(selectedElement.x)}, {Math.round(selectedElement.y)}</span>
                <span className="canva-info-size">{Math.round(selectedElement.width)} × {Math.round(selectedElement.height)}</span>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ── Mobile Bottom Tab Bar (hidden on desktop via CSS) ── */}
      <nav className="canva-mobile-tabs">
        {([
          { id: "ai",       label: "AI",      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 8v4l3 3"/><circle cx="18" cy="6" r="3" fill="currentColor" stroke="none"/></svg> },
          { id: "upload",   label: "Ảnh",     icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg> },
          { id: "text",     label: "Chữ",     icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg> },
          { id: "elements", label: "Mẫu",     icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg> },
          { id: "layers",   label: "Layer",   icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg> },
        ] as const).map(tab => (
          <button
            key={tab.id}
            className={`canva-mobile-tab ${activePanel === tab.id ? "active" : ""}`}
            onClick={() => setActivePanel(activePanel === tab.id ? null : tab.id)}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
