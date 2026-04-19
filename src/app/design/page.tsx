"use client";
import React, { useState, useRef, useCallback, useEffect, useId } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Logo } from "../../components/Logo";
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
  slot?: "shirt" | "neck-label" | "hang-tag" | "logo-detail" | "packaging" | "front-artwork" | "back-artwork";
  locked?: boolean;
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
function TShirtSVG({ color, side = "front" }: { color: string; side?: "front" | "back" }) {
  const imgUrl = `/mockups/v_tshirt_${side}.png`;
  const uniqueId = useId().replace(/:/g, "-");
  
  return (
    <div className="relative w-full h-full drop-shadow-md">
      <style>{`
        .tshirt-mask-${uniqueId} {
          position: absolute;
          inset: 0;
          background-color: ${color};
          -webkit-mask-image: url('${imgUrl}');
          mask-image: url('${imgUrl}');
          -webkit-mask-size: contain;
          mask-size: contain;
          -webkit-mask-repeat: no-repeat;
          mask-repeat: no-repeat;
          -webkit-mask-position: center;
          mask-position: center;
          transition: background-color 0.4s ease;
        }
      `}</style>
      {/* Base Color Fill Mask */}
      <div className={`tshirt-mask-${uniqueId}`} />
      {/* Detail Lines Overlay - Preserves shadows and highlights */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img 
        src={imgUrl} 
        alt="T-Shirt Mockup" 
        className="absolute inset-0 w-full h-full object-contain pointer-events-none opacity-[0.9] mix-blend-multiply" 
      />
    </div>
  );
}


interface DesignCanvasProps {
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
  slot?: "shirt" | "neck-label" | "hang-tag" | "logo-detail" | "packaging" | "front-artwork" | "back-artwork";
  isPositionMode?: boolean;
  activeLocation?: string;
}
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
  slot = "shirt",
  isPositionMode = false,
  activeLocation = "full-front",
}: DesignCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDropTarget, setIsDropTarget] = useState(false);
  // Filter elements by side AND slot (if shirt) OR just slot
  const sideElements = elements.filter((el) => {
    if (slot === "shirt") return el.side === side && (el.slot === "shirt" || !el.slot);
    return el.slot === slot;
  });
  const neckLabelElement = elements.find(el => el.slot === "neck-label");
  // Stable ref — updated after every render so event handlers always see latest value
  const pushHistoryRef = useRef(onPushHistory);
  useEffect(() => { pushHistoryRef.current = onPushHistory; });
  // Track whether mouse actually moved during drag — prevents post-drag click from deselecting
  const hasMovedRef = useRef(false);
  const handleElementMouseDown = useCallback(
    (e: React.MouseEvent | React.TouchEvent, el: DesignElement) => {
      e.stopPropagation();
      if (e.cancelable) e.preventDefault();
      onSelectElement(el.id);
      if (el.locked) return; // Prevent dragging locked elements
      hasMovedRef.current = false;
      const rect = canvasRef.current!.getBoundingClientRect();
      const scale = zoom / 100;
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
      setDragOffset({
        x: (clientX - rect.left) / scale - el.x,
        y: (clientY - rect.top) / scale - el.y,
      });
      setIsDragging(true);
    },
    [onSelectElement, zoom]
  );
  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent | React.TouchEvent, el: DesignElement, corner: 'tl' | 'tr' | 'bl' | 'br' = 'br') => {
      if (el.locked) return;
      setIsResizing(true);
      onSelectElement(el.id);
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
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
      const el = elements.find(item => item.id === selectedId);
      if (!el || el.locked) return; // Disallow dragging if not found or if fixed slot
      
      hasMovedRef.current = true;
      const rect = canvasRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / scale - dragOffset.x;
      const y = (e.clientY - rect.top) / scale - dragOffset.y;
      onMoveElement(selectedId, x, y);
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (!canvasRef.current || !e.touches[0]) return;
      const el = elements.find(item => item.id === selectedId);
      if (!el || el.locked) return; // Disallow dragging if not found or if fixed slot
      
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
  }, [isDragging, selectedId, dragOffset, onMoveElement, zoom, elements]);
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
        
        // Cumulative scale calculation
        // We use the actual rendered width vs defined width to find the true visually applied scale
        const visualScale = rect.width / (slot === "shirt" ? 400 : 300); // 400 is the standard DesignCanvas width for shirts
        
        const x = (e.clientX - rect.left) / visualScale - 50; 
        const y = (e.clientY - rect.top) / visualScale - 50;
        
        onDropImage(image, x, y);
      } catch (err) {
        console.error("Drop error:", err);
      }
    },
    [onDropImage, slot]
  );
  return (
    <>
      {/* Dynamic CSS — no inline styles needed */}
      <style>{`
        .canva-canvas { 
          --canvas-scale: ${zoom / 100}; 
          /* No local pan/zoom here as it's handled by the workspace parent */
          transform-origin: center center;
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
          .el-${el.id}.canva-element-locked {
            cursor: default !important;
            border: 1px dashed rgba(139, 61, 255, 0.5);
          }
        `).join('')}
      `}</style>
      <div
        ref={canvasRef}
        className={`canva-canvas ${isDropTarget ? "canva-canvas-drop-active" : ""}`}
        onMouseDown={(e: React.MouseEvent) => {
          // Only deselect if the click target is the canvas itself (not a child element)
          // AND no movement occurred (not the end of a drag)
          if (e.target === e.currentTarget && !hasMovedRef.current) {
            onSelectElement(null);
          }
          hasMovedRef.current = false;
        }}
        onTouchEnd={(e: React.TouchEvent) => {
          // Tap on canvas (shirt area) but not on an element → deselect on mobile
          if (e.target === e.currentTarget && !hasMovedRef.current) {
            onSelectElement(null);
          }
          hasMovedRef.current = false;
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {slot === "shirt" && (
           <div className="absolute inset-0 pointer-events-none z-0">
              {/* TECHNICAL GRID & HEADERS */}
              <div className="absolute inset-0 blueprint-grid" />
              <div className="absolute top-4 left-4 right-4 flex justify-between items-start opacity-60">
                <div className="flex flex-col gap-0.5">
                   <span className="text-[7px] font-black uppercase tracking-widest text-black">Technical Data Sheet</span>
                   <span className="text-[6px] font-mono text-gray-500">REF: REBEL-4P-2026</span>
                </div>
                <div className="text-[6px] font-mono text-right text-gray-400">
                   <div>PROPERTY OF UNISPACE</div>
                   <div>DO NOT DUPLICATE</div>
                </div>
              </div>
              
              {/* REGISTRATION MARKS */}
              <div className="absolute top-2 left-2 text-[10px] text-red-500 font-light">+</div>
              <div className="absolute top-2 right-2 text-[10px] text-red-500 font-light">+</div>
              <div className="absolute bottom-2 left-2 text-[10px] text-red-500 font-light">+</div>
              <div className="absolute bottom-2 right-2 text-[10px] text-red-500 font-light">+</div>

              <style>{`
                .design-zone { border: 0.5px solid #ef4444; position: absolute; display: flex; align-items: center; justify-content: center; font-family: 'JetBrains Mono', monospace; font-size: 6px; color: #ef4444; font-weight: 400; background: rgba(239, 68, 68, 0.01); }
                .zone-label { background: #ef4444; color: #fff; padding: 1px 4px; position: absolute; top: -10px; left: 0; font-weight: 800; transform: skewX(-15deg); }
                .dimension-line { position: absolute; border-top: 0.5px solid #ef4444; height: 1px; }
                .z-front-artwork { left: 80px; top: 130px; width: 240px; height: 100px; }
                .z-neck-woven { left: 175px; top: 35px; width: 50px; height: 50px; }
                .z-hem-authentic { left: 260px; top: 380px; width: 45px; height: 22px; }
                .z-back-artwork { left: 100px; top: 70px; width: 200px; height: 180px; }
              `}</style>
              {side === "front" && (
                <>
                  <div className="design-zone z-front-artwork"><span className="zone-label">FRONT ARTWORK</span></div>
                  <div className="design-zone z-neck-woven"><span className="zone-label">WOVEN TAG</span></div>
                  <div className="design-zone z-hem-authentic"><span className="zone-label">AUTH TAG</span></div>
                </>
              )}
              {side === "back" && (
                <>
                  <div className="design-zone z-back-artwork"><span className="zone-label">BACK ARTWORK</span></div>
                </>
              )}
           </div>
        )}
        {slot === "shirt" ? (
          <TShirtSVG color={tshirtColor} side={side} />
        ) : (
          <div className="tag-slot-mesh">
            <div className="tag-slot-grid" />
            <div className="tag-slot-border" />
            {/* Contextual Shape Overlays */}
            {slot === "hang-tag" && (
              <svg className="tag-shape-overlay" viewBox="0 0 200 300" preserveAspectRatio="xMidYMid meet">
                <rect x="40" y="20" width="120" height="260" rx="8" fill="white" stroke="#ddd" strokeWidth="2" />
                <circle cx="100" cy="45" r="6" fill="#fff" stroke="#ccc" strokeWidth="1.5" />
                <rect x="60" y="240" width="80" height="20" rx="2" fill="none" stroke="#eee" strokeWidth="1" strokeDasharray="2 2" />
              </svg>
            )}
            {slot === "neck-label" && (
              <svg className="tag-shape-overlay" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid meet">
                <rect x="30" y="60" width="140" height="80" rx="4" fill="white" stroke="#ddd" strokeWidth="2" />
                <path d="M 50,85 L 150,85" stroke="#eee" strokeWidth="1" />
                <path d="M 50,115 L 150,115" stroke="#eee" strokeWidth="1" />
              </svg>
            )}
          </div>
        )}
        {/* Neck Label Synchronized Preview (Visible only on front, shirt slot) */}
        {slot === "shirt" && side === "front" && neckLabelElement && (
          <div className="neck-label-preview">
            {neckLabelElement.type === "image" ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={neckLabelElement.url} alt="" className="w-full h-full object-contain" />
            ) : (
              <span className="neck-label-text">{neckLabelElement.text}</span>
            )}
          </div>
        )}
        {/* Print area guide */}
        <div className="canva-print-area -z-10">
          <span className="canva-print-label">Vùng in {side === "front" ? "mặt trước" : "mặt sau"}</span>
        </div>
        {/* Print Position Technical Guides */}
        {slot === "shirt" && isPositionMode && (
          <div className="technical-print-guides pointer-events-none">
            <div className={`print-guide-box pg-full-front ${activeLocation === 'full-front' ? 'active' : ''}`} />
            <div className={`print-guide-box pg-oversize-front ${activeLocation === 'oversize-front' ? 'active' : ''}`} />
            <div className={`print-guide-box pg-left-chest ${activeLocation === 'left-chest' ? 'active' : ''}`} />
            <div className={`print-guide-box pg-right-chest ${activeLocation === 'right-chest' ? 'active' : ''}`} />
            <div className={`print-guide-box pg-center-chest ${activeLocation === 'center-chest' ? 'active' : ''}`} />
            <div className={`print-guide-box pg-full-back ${activeLocation === 'full-back' ? 'active' : ''}`} />
            <div className={`print-guide-box pg-back-collar ${activeLocation === 'back-collar' ? 'active' : ''}`} />
            <div className={`print-guide-box pg-upper-back ${activeLocation === 'upper-back' ? 'active' : ''}`} />
            <div className={`print-guide-box pg-sleeve ${activeLocation === 'sleeve' ? 'active' : ''}`} />
          </div>
        )}
        {sideElements.map((el) => (
          <div key={el.id} className="canva-element-wrapper z-50">
            <div
              className={`canva-element el-${el.id} ${selectedId === el.id ? "canva-element-selected" : ""} ${el.locked ? "canva-element-locked !pointer-events-none" : ""}`}
              onMouseDown={(e) => !el.locked && handleElementMouseDown(e, el)}
              onTouchStart={(e) => !el.locked && handleElementMouseDown(e, el)}
            >
              {el.type === "image" && el.url && (
                <Image 
                  src={el.url} 
                  alt={el.label || "Element"} 
                  width={800} 
                  height={800} 
                  unoptimized 
                  className="w-full h-full object-contain pointer-events-none canva-element-img-blend" 
                />
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
        {elements.length === 0 && !isDropTarget && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none canva-drop-hint">
            <div className="text-center opacity-40">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mx-auto mb-3 opacity-40">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
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
  const [tshirtColor, setTshirtColor] = useState("#fbcfe8"); // ASSC Pink

  const shirtType = "tshirt";
  const [activeColorTarget, setActiveColorTarget] = useState<"body">("body");
  const [activeSlot, setActiveSlot] = useState<"shirt" | "neck-label" | "hang-tag" | "logo-detail" | "packaging">("shirt");
  const [elements, setElements] = useState<DesignElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [zoom, setZoom] = useState(85);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [activePanel, setActivePanel] = useState<"ai" | "text" | "elements" | "layers" | "upload" | "position" | null>("ai");
  const [printLocation, setPrintLocation] = useState<string>("full-front");
  const [textInput, setTextInput] = useState("");
  const [textFont, setTextFont] = useState("Inter");
  const [textSize, setTextSize] = useState(28);
  const [textColor, setTextColor] = useState("#000000");
  const [uploadedImages, setUploadedImages] = useState<AIImage[]>([]);
  const [uploadDragOver, setUploadDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const slotLabel = (s: string) => {
    switch (s) {
      case "shirt": return "Áo";
      case "neck-label": return "Gáy cổ";
      case "hang-tag": return "Thẻ bài";
      case "logo-detail": return "Logo";
      case "packaging": return "Bao bì";
      default: return s;
    }
  };
  // Undo / Redo
  const [historyStack, setHistoryStack] = useState<DesignElement[][]>([]);
  const [redoStack, setRedoStack] = useState<DesignElement[][]>([]);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isPanningWrapper, setIsPanningWrapper] = useState(false);
  const workspaceRef = useRef<HTMLElement>(null);
  const isPanningRef = useRef(false);
  const touchDistRef = useRef<number | null>(null);
  const touchZoomStartRef = useRef<number>(100);
  // Space key for drag-pan cursor
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") return;
      if (e.code === "Space") { e.preventDefault(); setIsSpacePressed(true); }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") { setIsSpacePressed(false); setIsPanningWrapper(false); }
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [setIsSpacePressed]);
  // ─── Auto-fit Tech Pack to screen width/height ───
  useEffect(() => {
    const timer = setTimeout(() => {
      const el = workspaceRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const frameWidth = 1150;
      // Fit to width with 40px side padding
      const fitZoom = ((rect.width - 40) / frameWidth) * 100;
      setZoom(Math.floor(fitZoom));
      setPan({ x: 0, y: 0 });
    }, 100);
    return () => clearTimeout(timer);
  }, [setZoom, setPan]);
  // Non-passive wheel: Ctrl/Cmd + scroll/pinch = zoom, plain two-finger scroll = pan
  useEffect(() => {
    const el = workspaceRef.current;
    if (!el) return;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        // Pinch-to-zoom or Ctrl+Scroll
        setZoom((z: number) => {
          const zoomSpeed = 0.005; // Weighted zoom speed
          const factor = Math.exp(-e.deltaY * zoomSpeed);
          const newZ = Math.min(400, Math.max(10, z * factor));
          if (newZ === z) return z;
          const scaleDelta = newZ / z;
          const rect = el.getBoundingClientRect();
          const px = e.clientX - rect.left - rect.width / 2;
          const py = e.clientY - rect.top - rect.height / 2;
          setPan((p: {x: number, y: number}) => ({
            x: p.x - (px - p.x) * (scaleDelta - 1),
            y: p.y - (py - p.y) * (scaleDelta - 1)
          }));
          return newZ;
        });
      } else {
        // Trackpad 2-finger pan or regular Mouse Wheel pan
        setPan((p: {x: number, y: number}) => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
      }
    };
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [setZoom, setPan]);
  // Middle-mouse drag and Space+LMB drag or plain drag on background
  useEffect(() => {
    const el = workspaceRef.current;
    if (!el) return;
    const onMouseDown = (e: MouseEvent) => {
      // Allow panning if middle-click, space+drag, or if dragging directly on the gray background (workspace)
      if (e.button === 1 || isSpacePressed || (e.button === 0 && e.target === e.currentTarget)) {
        e.preventDefault();
        isPanningRef.current = true;
        setIsPanningWrapper(true);
      }
    };
    const onMouseMove = (e: MouseEvent) => {
      if (isPanningRef.current) {
        setPan(p => ({ x: p.x + e.movementX, y: p.y + e.movementY }));
      }
    };
    const onMouseUp = () => {
      isPanningRef.current = false;
      setIsPanningWrapper(false);
    };
    el.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      el.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [isSpacePressed]);
  // Touch: 2-finger pinch = zoom, 2-finger pan
  useEffect(() => {
    const el = workspaceRef.current;
    if (!el) return;
    const getTouchDist = (e: TouchEvent) => {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        touchDistRef.current = getTouchDist(e);
        touchZoomStartRef.current = zoom;
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const dist = getTouchDist(e);
        if (touchDistRef.current) {
          const scale = dist / touchDistRef.current;
          setZoom(Math.min(300, Math.max(10, touchZoomStartRef.current * scale)));
        }
      }
    };
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
    };
  }, [zoom]);
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
    setRedoStack((r: DesignElement[][]) => {
      if (r.length === 0) return r;
      const newRedo = r.slice(0, -1);
      const next = r[r.length - 1];
      setHistoryStack((h: DesignElement[][]) => [...h, elements]);
      setElements(next);
      return newRedo;
    });
  }, [elements]);
  const handleSnapToPosition = (preset: string) => {
    if (!selectedId) return;
    setElements((prev) => {
      pushHistory(prev);
      return prev.map((el) => {
        if (el.id !== selectedId) return el;
        const pos = getPresetPosition(preset, el.slot || "shirt");
        
        // Auto-switch side
        const isBack = preset.includes("back") || preset.includes("neck");
        const targetSide = isBack ? "back" : "front";
        if (targetSide !== side) setSide(targetSide);

        return {
          ...el,
          side: targetSide,
          x: pos.x,
          y: pos.y,
          width: pos.w,
          height: pos.h,
          rotation: 0
        };
      });
    });
  };
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
  // ─── Sync panel → selected text element (live update on canvas) ───
  useEffect(() => {
    if (!selectedId) return;
    setElements((prev: DesignElement[]) => prev.map((el: DesignElement) =>
      el.id === selectedId && el.type === "text"
        ? { ...el, textColor, fontFamily: textFont, fontSize: textSize }
        : el
    ));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textColor, textFont, textSize]);
  // ─── Sync selected text element → panel (when user clicks text) ───
  useEffect(() => {
    if (!selectedId) return;
    const el = elements.find(e => e.id === selectedId);
    if (el?.type === "text") {
      if (el.textColor) setTextColor(el.textColor);
      if (el.fontFamily) setTextFont(el.fontFamily);
      if (el.fontSize) setTextSize(el.fontSize);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);
  // ─── AI Chat (Image Generation) ─────────────────────────────────
  const handleSendMessage = useCallback(async (content: string) => {
    const userMsg: ChatMessage = { id: `msg-${Date.now()}`, role: "user", content };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    try {
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
      const methodLabel = data.method === "t8star" || data.method === "ai" || data.method === "cloudflare"
        ? "🖼️ AI"
        : data.method === "smart"
          ? "🎨 Mẫu thông minh"
          : "📦 Mẫu demo";
      const aiMsg: ChatMessage = {
        id: `msg-${Date.now()}-ai`,
        role: "ai",
        content: `${methodLabel} — Thêm ${data.images.length} mẫu mới! 👇`,
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
  const handleDragStart = (e: React.DragEvent, image: AIImage) => {
    e.dataTransfer.setData("application/json", JSON.stringify(image));
    e.dataTransfer.effectAllowed = "copy";
  };
  const getPresetPosition = useCallback((loc: string, slot: string) => {
    if (slot !== "shirt") return { x: 40, y: 40, w: 120, h: 120 };
    // Canvas 400x480. Body center x=200.
    switch (loc) {
      case "front-artwork": return { x: 80, y: 130, w: 240, h: 100 }; 
      case "back-artwork": return { x: 100, y: 70, w: 200, h: 180 }; 
      case "neck-woven": return { x: 175, y: 35, w: 50, h: 50 }; 
      case "hem-authentic": return { x: 260, y: 380, w: 45, h: 22 }; // Authentic Tag at bottom right (viewer left)
      default: return { x: 106, y: 130, w: 140, h: 140 };
    }
  }, []);
  const handleDropImage = useCallback(
    (image: AIImage) => {
      setElements((prev: DesignElement[]) => {
        pushHistory(prev);
        
        // Force slot based on printLocation
        const isBack = printLocation.includes("back") || printLocation === "back-artwork";
        const effectiveSide = isBack ? "back" : "front";

        // Auto switch side for better UX
        if (effectiveSide !== side) {
          setSide(effectiveSide as "front" | "back");
        }

        const pos = getPresetPosition(printLocation, activeSlot);
        const finalX = pos.x;
        const finalY = pos.y;
        const finalW = pos.w;
        const finalH = pos.h;

        const elIdx = prev.findIndex((e: DesignElement) => 
          e.side === effectiveSide && 
          e.slot === activeSlot
        );

        if (elIdx !== -1) {
          const newElements = [...prev];
          newElements[elIdx] = {
            ...newElements[elIdx],
            url: image.url,
            label: image.label,
            x: finalX,
            y: finalY,
            width: finalW,
            height: finalH,
            locked: true // Movements are restricted to the brand slot
          };
          return newElements;
        }

        const el: DesignElement = {
          id: `brand-el-${Date.now()}`,
          type: "image",
          label: image.label,
          url: image.url,
          x: finalX,
          y: finalY,
          width: finalW,
          height: finalH,
          rotation: 0,
          side: effectiveSide,
          slot: activeSlot,
          locked: true,
        };

        return [...prev, el];
      });
    },
    [side, activeSlot, printLocation, getPresetPosition, pushHistory]
  );
  const handleAddText = () => {
    if (!textInput.trim()) return;
    const el: DesignElement = {
      id: `text-${Date.now()}`,
      type: "text",
      label: `Text ${elements.length + 1}`,
      text: textInput,
      x: activeSlot === "shirt" ? 120 : 25,
      y: activeSlot === "shirt" ? 150 : 35,
      width: activeSlot === "shirt" ? 160 : 150,
      height: activeSlot === "shirt" ? 40 : 30,
      rotation: 0,
      side,
      slot: activeSlot,
      fontSize: textSize,
      fontFamily: textFont,
      textColor: textColor,
      locked: true,
    };
    setElements((prev: DesignElement[]) => {
      pushHistory(prev);
      return [...prev, el];
    });
    setSelectedId(el.id);
    setTextInput("");
  };
  const handleMoveElement = useCallback((id: string, x: number, y: number) => {
    setElements((prev: DesignElement[]) => prev.map((el: DesignElement) => (el.id === id ? { ...el, x, y } : el)));
  }, []);
  const handleResizeElement = useCallback((id: string, width: number, height: number, x?: number, y?: number) => {
    setElements((prev: DesignElement[]) => prev.map((el: DesignElement) => (
      el.id === id ? { ...el, width, height, ...(x !== undefined ? { x } : {}), ...(y !== undefined ? { y } : {}) } : el
    )));
  }, []);
  const handleDeleteSelected = useCallback(() => {
    if (!selectedId) return;
    setElements((prev: DesignElement[]) => {
      pushHistory(prev);
      return prev.filter((el: DesignElement) => el.id !== selectedId);
    });
    setSelectedId(null);
  }, [selectedId, pushHistory]);
  const handleDuplicateSelected = useCallback(() => {
    if (!selectedId) return;
    const original = elements.find((el) => el.id === selectedId);
    if (!original) return;
    const dup = { ...original, id: `el-${Date.now()}`, x: original.x + 15, y: original.y + 15 };
    setElements((prev: DesignElement[]) => {
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
    sessionStorage.setItem("designData", JSON.stringify({ 
      elements, 
      tshirtColor, 
      shirtType 
    }));
    router.push("/order");
  };
  const handleUpload = useCallback((files: FileList | File[]) => {
    const fileArr = Array.from(files).filter(f => f.type.startsWith("image/"));
    fileArr.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        const url = e.target?.result as string;
        const img: AIImage = {
          id: `upload-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          label: file.name.replace(/\.[^.]+$/, "").slice(0, 20),
          url,
        };
        setUploadedImages((prev: AIImage[]) => [img, ...prev]);
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
    handleDropImage(img);
  };
  const frontCount = elements.filter((e) => e.side === "front").length;
  const backCount = elements.filter((e) => e.side === "back").length;
  // Technical Header Data removed
  const suggestions = [
    "🔥 Hiphop Graffiti lớp A1 cực cháy",
    "🐯 Streetwear Panther Y2k Chrome",
    "🛸 Cyber Sigilism Y2K Class 12A",
    "🖼️ Oversized Streetwear Art",
    "🦅 Fire Phoenix Hiphop Style",
    "🎨 Graffiti Spray Paint Logo",
    "🏁 Racing Team Varsity Aesthetic",
    "🛹 Urban Skater Mascot Design",
  ];
  return (
    <div className="canva-layout">
      {/* ═══ TRAM DONG PHUC DOUBLE HEADER ═══ */}
      <header className="tram-header">
        <div className="section-header-top">
          <div className="container-fluid tram-container clearfix">
            <Link href="/" className="tram-logo">
              <Logo scale={0.4} />
            </Link>
            <div className="tram-search">
              <div className="tram-search-inner">
                <span className="tram-search-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                </span>
                <input type="text" placeholder="Tìm kiếm..." />
              </div>
            </div>
            <div className="tram-top-links ms-auto">
              <a href="#">Bản tin Unispace</a>
              <a href="#">Tuyển dụng</a>
              <a href="#">Liên hệ</a>
            </div>
          </div>
        </div>
        <div className="section-header-menu">
          <div className="container-fluid tram-container">
            <nav className="tram-nav">
              <ul className="tram-nav-left">
                <li><a href="#">Trạm đồng phục <small>▼</small></a></li>
                <li><a href="#" className="active">Thiết kế</a></li>
              </ul>
              <ul className="tram-nav-right ms-auto">
                <li><a href="#">Khuyến mãi & Quà tặng</a></li>
                <li><a href="#">Giao hàng & Thanh toán</a></li>
                <li><a href="#">FAQ</a></li>
              </ul>
            </nav>
          </div>
        </div>
        {/* Floating actions for the canvas, since we replaced topbar */}
        <div className="tram-canvas-actions">
          <div className="canva-topbar-center">
            <button
              className="canva-topbar-btn" title="Hoàn tác (Ctrl+Z)"
              onClick={handleUndo} disabled={historyStack.length === 0}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /></svg>
            </button>
            <button
              className="canva-topbar-btn" title="Làm lại (Ctrl+Shift+Z)"
              onClick={handleRedo} disabled={redoStack.length === 0}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>
            </button>
          </div>
          <div className="canva-topbar-right">
            {selectedId && (
              <>
                <button
                  onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onClick={handleDuplicateSelected}
                  onTouchEnd={(e) => { e.preventDefault(); handleDuplicateSelected(); }}
                  className="canva-topbar-btn" title="Nhân bản (Ctrl+D)"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                </button>
                <button
                  onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onClick={handleDeleteSelected}
                  onTouchEnd={(e) => { e.preventDefault(); handleDeleteSelected(); }}
                  className="canva-topbar-btn canva-topbar-btn-danger" title="Xóa (Delete)"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                </button>
                <div className="canva-topbar-divider" />
              </>
            )}
            <button onClick={handleComplete} className="canva-btn-complete magnetic-btn" disabled={elements.length === 0}>
              <span className="canva-complete-full">Hoàn thành thiết kế</span>
              <span className="canva-complete-short">Đặt hàng</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
          </div>
        </div>
      </header>
      <div className="canva-body">
        {/* ═══ LEFT TOOLBAR ═══ */}
        <aside className="canva-sidebar-left flex-shrink-0">
          <button
            className={`canva-tool-btn ${activePanel === "ai" ? "active" : ""}`}
            onClick={() => setActivePanel(activePanel === "ai" ? null : "ai")}
            title="AI Design"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
            </svg>
            <span>AI</span>
          </button>
          <button
            className={`canva-tool-btn ${activePanel === "upload" ? "active" : ""}`}
            onClick={() => setActivePanel(activePanel === "upload" ? null : "upload")}
            title="Tải ảnh lên"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" /><path d="M16 5l2 2 4-4" />
            </svg>
            <span>Ảnh</span>
          </button>
          <button
            className={`canva-tool-btn ${activePanel === "text" ? "active" : ""}`}
            onClick={() => setActivePanel(activePanel === "text" ? null : "text")}
            title="Thêm chữ"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <polyline points="4 7 4 4 20 4 20 7" /><line x1="9" y1="20" x2="15" y2="20" /><line x1="12" y1="4" x2="12" y2="20" />
            </svg>
            <span>Chữ</span>
          </button>
          <button
            className={`canva-tool-btn ${activePanel === "elements" ? "active" : ""}`}
            onClick={() => setActivePanel(activePanel === "elements" ? null : "elements")}
            title="Màu áo"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="13.5" cy="6.5" r="2.5" /><circle cx="17.5" cy="10.5" r="2.5" /><circle cx="8.5" cy="7.5" r="2.5" />
              <circle cx="6.5" cy="12.5" r="2.5" /><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" />
            </svg>
            <span>Màu</span>
          </button>
          <button
            className={`canva-tool-btn ${activePanel === "layers" ? "active" : ""}`}
            onClick={() => setActivePanel(activePanel === "layers" ? null : "layers")}
            title="Layers"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="2" y="7" width="15" height="15" rx="2" ry="2" /><path d="M17 2h2a2 2 0 0 1 2 2v2" /><path d="M17 22h2a2 2 0 0 0 2-2v-2" /><path d="M7 2h-2a2 2 0 0 0-2 2v2" />
            </svg>
            <span>Layers</span>
          </button>
          <button
            className={`canva-tool-btn ${activePanel === "position" ? "active" : ""}`}
            onClick={() => setActivePanel(activePanel === "position" ? null : "position")}
            title="Vị trí in"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M21 12H3M12 3v18" />
            </svg>
            <span>Vị trí</span>
          </button>
          <div className="canva-sidebar-spacer" />
          {/* Side switcher */}
          <button
            className="canva-tool-btn"
            onClick={() => setSide(side === "front" ? "back" : "front")}
            title={`Chuyển sang mặt ${side === "front" ? "sau" : "trước"}`}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" />
              <polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
            </svg>
            <span>{side === "front" ? "Trước" : "Sau"}</span>
          </button>
        </aside>
        {/* ═══ LEFT PANEL (content) ═══ */}
        {activePanel && (
          <>
            {/* Mobile tap-outside overlay — closes panel when tapping canvas */}
            <div className="canva-panel-overlay" onClick={() => setActivePanel(null)} />
            <div className="canva-panel">
              {/* AI Panel */}
              {activePanel === "ai" && (
                <div className="canva-panel-content ai-magic-media-panel">
                  <div className="canva-panel-header">
                    <h3>Magic Media AI {activeSlot !== "shirt" && <span className="active-slot-badge">{slotLabel(activeSlot)}</span>}</h3>
                    <button onClick={() => setActivePanel(null)} className="canva-panel-close" aria-label="Đóng">×</button>
                  </div>
                  <div className="ai-magic-scroll-area pt-2">
                    <div className="ai-canva-card">
                      <label className="ai-canva-label">Mô tả thiết kế lý tưởng của bạn</label>
                      <div className="ai-canva-input-row">
                        <button className="ai-icon-btn" aria-label="Tải lên hình ảnh">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
                        </button>
                        <textarea
                          className="ai-canva-textarea"
                          aria-label="Mô tả thiết kế lý tưởng của bạn"
                          placeholder="Nhập yêu cầu tại đây..."
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              if (chatInput.trim() && !isLoading) {
                                handleSendMessage(chatInput.trim());
                                setChatInput("");
                              }
                            }
                          }}
                          rows={3}
                        />
                        <button className="ai-icon-btn" aria-label="Nhập bằng giọng nói">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="22" /></svg>
                        </button>
                      </div>
                    </div>
                    <button
                      className="ai-canva-generate-btn magnetic-btn"
                      disabled={isLoading || !chatInput.trim()}
                      onClick={() => {
                        if (chatInput.trim() && !isLoading) {
                          handleSendMessage(chatInput.trim());
                          setChatInput("");
                        }
                      }}
                    >
                      {isLoading ? (
                        <div className="ai-btn-loading">
                          <div className="canva-typing-dot" /><div className="canva-typing-dot" /><div className="canva-typing-dot" />
                        </div>
                      ) : (
                        <>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>
                          <span>Tạo thiết kế</span>
                        </>
                      )}
                    </button>
                    <div className="ai-suggestions-chips">
                      {suggestions.map((s, i) => (
                        <button key={i} onClick={() => setChatInput(s)} className="ai-suggestion-chip">{s}</button>
                      ))}
                    </div>
                    <div className="ai-magic-results text-center">
                      {isLoading && (
                        <div className="ai-loading-placeholder p-4">
                          <p className="text-sm text-[#8b3dff] font-medium animate-pulse">AI đang vẽ tác phẩm của bạn...</p>
                        </div>
                      )}
                      <div className="canva-ai-grid mt-4">
                        {messages.filter(m => m.role === "ai").slice().reverse().map((m, mi) => (
                           <React.Fragment key={mi}>
                             {m.images?.map((img) => (
                              <div key={img.id} className="canva-ai-grid-item-wrapper group">
                                <div className="canva-ai-item" onClick={() => handleDropImage(img)}>
                                  <Image src={img.url} alt={img.label} className="w-full h-full object-cover" width={100} height={100} unoptimized />
                                  <div className="canva-ai-item-overlay">
                                    <span>Dùng mẫu này</span>
                                  </div>
                                </div>
                                <div className="canva-ai-item-label truncate text-[10px] mt-1 opacity-60 text-center px-1">
                                  {img.label}
                                </div>
                              </div>
                            ))}
                           </React.Fragment>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {/* Upload Panel */}
              {activePanel === "upload" && (
                <div className="canva-panel-content">
                  <div className="canva-panel-header">
                    <h3>Tải ảnh lên {activeSlot !== "shirt" && <span className="active-slot-badge">{slotLabel(activeSlot)}</span>}</h3>
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
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
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
                              <Image src={img.url} alt={img.label} width={80} height={80} unoptimized />
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
                    <h3>Thêm chữ {activeSlot !== "shirt" && <span className="active-slot-badge">{slotLabel(activeSlot)}</span>}</h3>
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
                          <style>{`.cdot{background:${textColor}}`}</style>
                          <div className="canva-color-dot cdot" />
                          <span className="canva-color-hex">{textColor}</span>
                        </div>
                      </div>
                    </div>
                    <div className="canva-quick-colors">
                      <label className="canva-label">Bảng màu</label>
                      {(() => {
                        const palette = [
                          ['#000000', '#1a1a1a', '#333333', '#4d4d4d', '#666666', '#808080', '#999999', '#b3b3b3', '#cccccc', '#ffffff'],
                          ['#ff0000', '#e60000', '#cc0000', '#b30000', '#ff4d4d', '#ff8080', '#ff9999', '#ffb3b3', '#ffcccc', '#ffe5e5'],
                          ['#ff6600', '#ff8c00', '#ffa500', '#ffbf00', '#ffd700', '#ffe066', '#fff0a0', '#f1c40f', '#fdcb6e', '#fff9c4'],
                          ['#00b894', '#00a381', '#27ae60', '#2ecc71', '#a8e063', '#00c853', '#69f0ae', '#b9f6ca', '#c8e6c9', '#e8f5e9'],
                          ['#0984e3', '#1565c0', '#1976d2', '#2196f3', '#42a5f5', '#64b5f6', '#74b9ff', '#90caf9', '#bbdefb', '#e3f2fd'],
                          ['#6c5ce7', '#7c4dff', '#673ab7', '#9c27b0', '#ab47bc', '#ba68c8', '#a29bfe', '#ce93d8', '#e1bee7', '#ede7f6'],
                          ['#e84393', '#e91e63', '#f06292', '#f48fb1', '#fd79a8', '#ff80ab', '#ffb3d1', '#fce4ec', '#d63031', '#e17055'],
                        ];
                        const allColors = palette.flat();
                        return (
                          <>
                            <style>{allColors.map((c, i) => `.csw-${i}{background:${c}}`).join('')}</style>
                            <div className="canva-palette-grid">
                              {allColors.map((c, i) => (
                                <button
                                  key={c + i}
                                  title={c}
                                  onClick={() => setTextColor(c)}
                                  className={`canva-palette-cell csw-${i}${textColor === c ? ' canva-swatch-active' : ''}`}
                                />
                              ))}
                            </div>
                          </>
                        );
                      })()}
                    </div>
                    <button onClick={handleAddText} className="canva-btn-add magnetic-btn" disabled={!textInput.trim()}>
                      Thêm chữ vào áo
                    </button>
                    <div className="canva-text-presets">
                      <p className="canva-label">Mẫu nhanh</p>
                      {["CLASS OF 2026", "12A1 ❤️", "TOGETHER WE ARE ONE", "KỶ NIỆM", "FRIENDSHIP"].map((t: string) => (
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
                    <div className="canva-layer-toggle mb-4">
                      <button
                        className={`flex-1 py-2 px-4 rounded-full text-sm font-medium transition-all ${activeColorTarget === "body" ? "bg-black text-white" : "bg-gray-100"}`}
                        onClick={() => setActiveColorTarget("body")}
                      >
                        Thân
                      </button>
                    </div>
                    <div className="canva-color-preview canva-color-preview--mb">
                      <style>{`.scdot{background:${tshirtColor}}`}</style>
                      <div className="canva-color-dot scdot" />
                    </div>
                    {(() => {
                      const palette = [
                        ['#ffffff', '#f5f5f5', '#e0e0e0', '#bdbdbd', '#9e9e9e', '#757575', '#616161', '#424242', '#212121', '#000000'],
                        ['#ffebee', '#ffcdd2', '#ef9a9a', '#e57373', '#ef5350', '#f44336', '#e53935', '#d32f2f', '#c62828', '#b71c1c'],
                        ['#fff3e0', '#ffe0b2', '#ffcc80', '#ffa726', '#ff9800', '#fb8c00', '#f57c00', '#e65100', '#bf360c', '#8d3c00'],
                        ['#fffff9', '#fff9c4', '#fff176', '#ffee58', '#ffeb3b', '#fdd835', '#f9a825', '#f57f17', '#e65100', '#ff6f00'],
                        ['#e8f5e9', '#c8e6c9', '#a5d6a7', '#81c784', '#66bb6a', '#4caf50', '#43a047', '#388e3c', '#2e7d32', '#1b5e20'],
                        ['#e3f2fd', '#bbdefb', '#90caf9', '#64b5f6', '#42a5f5', '#2196f3', '#1e88e5', '#1976d2', '#1565c0', '#0d47a1'],
                        ['#ede7f6', '#d1c4e9', '#b39ddb', '#9575cd', '#7e57c2', '#673ab7', '#5e35b1', '#4527a0', '#311b92', '#1a237e'],
                        ['#fce4ec', '#f8bbd0', '#f48fb1', '#f06292', '#ec407a', '#e91e63', '#d81b60', '#c2185b', '#ad1457', '#880e4f'],
                      ];
                      const allColors = palette.flat();
                      return (
                        <>
                          <style>{allColors.map((c, i) => `.sc-${i}{background:${c}; border-color:${c === '#ffffff' || c === '#fffff9' ? '#ddd' : 'transparent'}}`).join('')}</style>
                          <div className="canva-palette-grid">
                            {allColors.map((c, i) => (
                              <button
                                key={c + i}
                                title={c}
                                onClick={() => setTshirtColor(c)}
                                className={`canva-palette-cell sc-${i}${tshirtColor === c ? ' canva-swatch-active' : ''}`}
                              >
                                {tshirtColor === c && (
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={['#ffffff', '#fffff9', '#ffebee', '#fff3e0', '#fffff9', '#e8f5e9', '#e3f2fd', '#ede7f6', '#fce4ec', '#f5f5f5'].includes(c) ? '#333' : '#fff'} strokeWidth="4">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                )}
                              </button>
                            ))}
                          </div>
                          <div className="mt-8 pt-6 border-t border-gray-100">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[#8b3dff] mb-4 block">Màu tùy chỉnh</label>
                            <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-3xl">
                              <div className="relative group">
                                <input
                                  type="color"
                                  title="Chọn màu áo"
                                  aria-label="Chọn màu áo"
                                  value={tshirtColor}
                                  onChange={(e) => setTshirtColor(e.target.value)}
                                  className="w-14 h-14 rounded-2xl border-4 border-white shadow-xl cursor-pointer p-0 overflow-hidden appearance-none"
                                />
                              </div>
                              <div className="flex-1">
                                <div className="text-[12px] font-bold text-gray-800 uppercase font-mono">
                                  {tshirtColor}
                                </div>
                                <div className="text-[10px] text-gray-400 font-medium tracking-tight">Mã màu HEX</div>
                              </div>
                            </div>
                          </div>
                        </>
                      );
                    })()}
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
                        {elements.filter((el: DesignElement) => el.side === side).map((el: DesignElement, i: number) => (
                          <div key={el.id} className={`canva-layer-item ${selectedId === el.id ? "active" : ""}`} onClick={() => setSelectedId(el.id)}>
                            <span className="canva-layer-idx">{i + 1}</span>
                            <span className="canva-layer-icon">{el.type === "text" ? "T" : "🖼"}</span>
                            <span className="canva-layer-name">{el.label}</span>
                            <div className="flex items-center gap-1">
                              <button onClick={(e: React.MouseEvent) => { e.stopPropagation(); setElements((prev: DesignElement[]) => { pushHistory(prev); return prev.filter((p: DesignElement) => p.id !== el.id); }); if (selectedId === el.id) setSelectedId(null); }} className="canva-layer-delete" aria-label="Xóa layer">×</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
              {/* Position Presets Panel */}
              {activePanel === "position" && (
                <div className="canva-panel-content">
                  <div className="canva-panel-header">
                    <h3>Vị trí in chuẩn</h3>
                    <button onClick={() => setActivePanel(null)} className="canva-panel-close" aria-label="Đóng">×</button>
                  </div>
                  <div className="canva-panel-body">
                    <p className="text-[11px] text-gray-400 mb-4 leading-relaxed uppercase font-bold tracking-wider">Hệ thống vị trí REBEL 4-Points</p>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { id: "front-artwork", label: "Front Artwork", icon: "📐" },
                        { id: "back-artwork", label: "Back Artwork", icon: "📏" },
                        { id: "neck-woven", label: "Neck Woven Tag", icon: "🏷️" },
                        { id: "hem-authentic", label: "Hem Authentic Tag", icon: "🔖" },
                      ].map((loc) => (
                        <button
                          key={loc.id}
                          className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all group ${printLocation === loc.id ? 'border-[#8b3dff] bg-[#8b3dff]/5' : 'border-gray-50 hover:border-gray-200 bg-gray-50/50'}`}
                          onClick={() => {
                            setPrintLocation(loc.id);
                            const isFront = loc.id === "front-artwork" || loc.id === "neck-woven" || loc.id === "hem-authentic";
                            setSide(isFront ? "front" : "back");
                            setActiveSlot("shirt");
                          }}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-transform group-hover:scale-110 ${printLocation === loc.id ? 'bg-[#8b3dff] text-white' : 'bg-white shadow-sm'}`}>
                            {loc.icon}
                          </div>
                          <span className={`text-[10px] font-black uppercase tracking-tight text-left leading-tight ${printLocation === loc.id ? 'text-[#8b3dff]' : 'text-gray-600'}`}>
                            {loc.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
  
            </div>
          </>
        )}
        {/* Scoped Dynamic Styles to avoid Inline CSS Warnings */}
        <style>{`
          .tech-pack-frame-dynamic {
            --pan-x: ${pan.x}px;
            --pan-y: ${pan.y}px;
            --tech-zoom: ${zoom / 100};
            --swatch-color: ${tshirtColor};
          }
          .tech-pack-sheet-scale {
            transform: translate(calc(var(--pan-x) * 1px), calc(var(--pan-y) * 1px)) scale(var(--tech-zoom));
            transform-origin: center center;
          }
          .tech-pack .blueprint-grid {
            background-size: 20px 20px;
            background-image:
              linear-gradient(to right, rgba(0, 0, 0, 0.05) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(0, 0, 0, 0.05) 1px, transparent 1px);
          }
          .tech-pack-swatch-bg {
            background-color: var(--swatch-color);
          }
        `}</style>
        {/* ═══ CENTER CANVAS ═══ */}
        <main
          ref={workspaceRef}
          className="canva-workspace"
          onTouchStart={(e: React.TouchEvent) => {
            if (e.target === e.currentTarget) setSelectedId(null);
          }}
        >
          {/* SNAP PLACEMENT TOOLBAR */}
          {selectedId && (
            <div className="canva-snap-toolbar">
              <span className="canva-snap-label">Vị trí in chuẩn</span>
              <button className="canva-snap-btn" onClick={() => handleSnapToPosition("left-chest")} title="Ngực trái">Ngực trái</button>

              <button className="canva-snap-btn" onClick={() => handleSnapToPosition("center-chest")} title="Giữa ngực">Giữa ngực</button>
              <button className="canva-snap-btn" onClick={() => handleSnapToPosition("full-front")} title="Full Front">Full Front</button>
              <button className="canva-snap-btn" onClick={() => handleSnapToPosition("back-neck")} title="Sau gáy">Sau gáy</button>
              <button className="canva-snap-btn" onClick={() => handleSnapToPosition("upper-back")} title="Lưng trên">Lưng trên</button>
              <button className="canva-snap-btn" onClick={() => handleSnapToPosition("full-back")} title="Full Back">Full Back</button>
            </div>
          )}

          {/* Canvas area with Urban Core Layout */}
          <div
            className={`canva-canvas-wrapper ${isPanningWrapper ? "cursor-grabbing" : isSpacePressed ? "cursor-grab" : ""
              }`}
            onMouseDown={(e: React.MouseEvent) => {
              if (!isSpacePressed && e.target === e.currentTarget) setSelectedId(null);
            }}
          >
            <div className="tech-pack-frame tech-pack-panned bg-transparent flex items-center justify-center rounded-[2rem] tech-pack-frame-dynamic w-full h-full">
              
              <div className="relative w-[1150px] h-[850px] bg-white border-[2px] border-[#ccc] shadow-2xl mx-auto origin-center overflow-hidden text-[#111] font-sans tech-pack-sheet-scale">
                
                {/* ─── HEADER TABLE ─── */}
                <div className="grid grid-cols-4 border-b-[1.5px] border-[#888] text-[11px]">
                  <div className="border-r-[1.5px] border-b-[1.5px] border-[#888] p-2 px-4 font-bold bg-white">Design</div>
                  <div className="border-r-[1.5px] border-b-[1.5px] border-[#888] p-2 px-4 text-gray-600">UniSpace Tee</div>
                  <div className="border-r-[1.5px] border-b-[1.5px] border-[#888] p-2 px-4 font-bold bg-white">Size</div>
                  <div className="border-b-[1.5px] border-[#888] p-2 px-4 text-gray-600">XS / S / M / L / XL</div>
                  
                  <div className="border-r-[1.5px] border-b-[1.5px] border-[#888] p-2 px-4 font-bold bg-white">Brand</div>
                  <div className="border-r-[1.5px] border-b-[1.5px] border-[#888] p-2 px-4 text-gray-600">UniSpace</div>
                  <div className="border-r-[1.5px] border-b-[1.5px] border-[#888] p-2 px-4 font-bold bg-white">Date Created</div>
                  <div className="border-b-[1.5px] border-[#888] p-2 px-4 text-gray-600">01/01/2026</div>
                  
                  <div className="border-r-[1.5px] border-b-[1.5px] border-[#888] p-2 px-4 font-bold bg-white">Category</div>
                  <div className="border-r-[1.5px] border-b-[1.5px] border-[#888] p-2 px-4 text-gray-600">T-Shirt</div>
                  <div className="border-r-[1.5px] border-b-[1.5px] border-[#888] p-2 px-4 font-bold bg-white">Batch</div>
                  <div className="border-b-[1.5px] border-[#888] p-2 px-4 text-gray-600">TS-001</div>
                  
                  <div className="border-r-[1.5px] border-[#888] p-2 px-4 font-bold bg-white">Material</div>
                  <div className="border-r-[1.5px] border-[#888] p-2 px-4 text-gray-600">Cotton Combed 24s</div>
                  <div className="border-r-[1.5px] border-[#888] p-2 px-4 font-bold bg-white">Designer</div>
                  <div className="p-2 px-4 text-gray-600">Matsero</div>
                </div>

                {/* ─── MAIN WORKSPACE: 2 shirts side by side ─── */}
                <div className="relative blueprint-grid flex flex-row h-[calc(100%-140px)] overflow-hidden">

                  {/* ══ LEFT: FRONT SHIRT ══ */}
                  <div className="relative flex-1 border-r border-[#ccc]">

                    {/* Center Front label */}
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 text-red-500 text-[10px] italic font-semibold z-30 pointer-events-none">Center Front</div>

                    {/* Annotations left of shirt */}
                    <div className="absolute top-[75px] left-4 text-red-500 text-[8px] font-bold uppercase leading-tight z-30">
                      MATCHING SELF<br/>FABRIC NECK TAPE
                    </div>
                    <div className="absolute top-[52px] left-4 text-red-500 text-[8px] font-bold uppercase leading-tight z-30">
                      PRINTED MAIN<br/>LABEL
                    </div>
                    <div className="absolute bottom-[100px] left-4 text-red-500 text-[8px] font-bold uppercase leading-tight z-30">
                      PRINTED WOVEN<br/>PATCH
                    </div>

                    {/* Annotations right of shirt */}
                    <div className="absolute top-[90px] right-4 text-red-500 text-[8px] font-bold uppercase leading-tight z-30 text-right">
                      PRINT
                    </div>
                    <div className="absolute top-[120px] right-4 text-red-500 text-[8px] font-bold uppercase leading-tight z-30 text-right">
                      TWIN NEEDLE<br/>TOP STITCH
                    </div>
                    <div className="absolute bottom-[90px] right-4 text-red-500 text-[8px] font-bold uppercase leading-tight z-30 text-right">
                      TWIN NEEDLE<br/>TOP STITCH
                    </div>

                    {/* Front T-shirt canvas — centered, scaled to fit better */}
                    <div className="absolute inset-0 flex items-center justify-center pt-2 pb-12 z-40">
                      <div className="w-[450px] h-[500px] cursor-pointer flex-shrink-0 flex items-center justify-center" onClick={() => setSide('front')}>
                        <div className="scale-[0.85] origin-center">
                          <DesignCanvas
                            elements={elements}
                            selectedId={selectedId}
                            onSelectElement={setSelectedId}
                            onMoveElement={handleMoveElement}
                            onResizeElement={handleResizeElement}
                            onPushHistory={() => pushHistory(elements)}
                            onDropImage={handleDropImage}
                            side="front"
                            tshirtColor={tshirtColor}
                            zoom={zoom}
                            slot="shirt"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Leader lines SVG */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-20">
                      <line x1="90" y1="85" x2="185" y2="90" stroke="#ef4444" strokeWidth="0.8"/>
                      <line x1="90" y1="62" x2="185" y2="75" stroke="#ef4444" strokeWidth="0.8"/>
                      <line x1="90" y1="285" x2="190" y2="310" stroke="#ef4444" strokeWidth="0.8"/>
                      <line x1="340" y1="100" x2="285" y2="110" stroke="#ef4444" strokeWidth="0.8"/>
                      <line x1="340" y1="135" x2="285" y2="140" stroke="#ef4444" strokeWidth="0.8"/>
                      <line x1="340" y1="285" x2="290" y2="305" stroke="#ef4444" strokeWidth="0.8"/>
                    </svg>

                    {/* Front Design thumbnail */}
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex flex-col items-center z-30">
                      <div className="text-[9px] font-bold italic mb-1 text-gray-700">Front Design</div>
                      <div className="w-[90px] h-[75px] border border-[#888] bg-white flex items-center justify-center overflow-hidden">
                        {elements.find(e => e.side === 'front' && e.url) ? (
                          <Image
                            src={elements.find(e => e.side === 'front' && e.url)?.url || ''}
                            width={90} height={75}
                            className="w-full h-full object-contain p-1"
                            alt="Front Design"
                          />
                        ) : (
                          <span className="text-[7px] text-gray-300 font-bold uppercase text-center">No Design</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ══ RIGHT: BACK SHIRT ══ */}
                  <div className="relative flex-1">

                    {/* Center Back label */}
                    <div className="absolute bottom-[60px] left-1/2 -translate-x-1/2 text-red-500 text-[10px] italic font-semibold z-30 pointer-events-none">Center Back</div>

                    {/* Annotations right side */}
                    <div className="absolute bottom-[90px] right-4 text-red-500 text-[8px] font-bold uppercase leading-tight z-30 text-right">
                      TWIN NEEDLE<br/>TOP STITCH
                    </div>

                    {/* Back T-shirt canvas — centered, scaled to fit better */}
                    <div className="absolute inset-0 flex items-center justify-center pt-2 pb-12 z-40">
                      <div className="w-[450px] h-[500px] cursor-pointer flex-shrink-0 flex items-center justify-center" onClick={() => setSide('back')}>
                        <div className="scale-[0.85] origin-center">
                          <DesignCanvas
                            elements={elements}
                            selectedId={selectedId}
                            onSelectElement={setSelectedId}
                            onMoveElement={handleMoveElement}
                            onResizeElement={handleResizeElement}
                            onPushHistory={() => pushHistory(elements)}
                            onDropImage={handleDropImage}
                            side="back"
                            tshirtColor={tshirtColor}
                            zoom={zoom}
                            slot="shirt"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Leader lines SVG */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-20">
                      <line x1="340" y1="290" x2="290" y2="300" stroke="#ef4444" strokeWidth="0.8"/>
                    </svg>

                    {/* Back Design thumbnail */}
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex flex-col items-center z-30">
                      <div className="text-[9px] font-bold italic mb-1 text-gray-700">Back Design</div>
                      <div className="w-[90px] h-[75px] border border-[#888] bg-white flex items-center justify-center overflow-hidden">
                        {elements.find(e => e.side === 'back' && e.url) ? (
                          <Image
                            src={elements.find(e => e.side === 'back' && e.url)?.url || ''}
                            width={90} height={75}
                            className="w-full h-full object-contain p-1"
                            alt="Back Design"
                          />
                        ) : (
                          <span className="text-[7px] text-gray-300 font-bold uppercase text-center">No Design</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ─── FOOTER ─── */}
                <div className="border-t-[1.5px] border-[#888] h-[60px] grid grid-cols-3 divide-x-[1.5px] divide-[#888] bg-white text-[10px]">
                  {/* Logo */}
                  <div className="flex items-center justify-center p-2">
                    <div className="text-center">
                      <div className="font-black text-[18px] leading-none tracking-tighter">Uni<span className="text-violet-600">Space</span></div>
                    </div>
                  </div>
                  {/* Color Palette */}
                  <div className="flex flex-col items-center justify-center p-2">
                    <div className="font-bold text-[10px] mb-1">Color Palette</div>
                    <div className="flex gap-1.5">
                      {[
                        { hex: tshirtColor || '#FFF4EA', label: tshirtColor || '#FFF4EA' },
                        { hex: '#F8D484', label: '#F8D484' },
                        { hex: '#DE5656', label: '#DE5656' },
                        { hex: '#79C365', label: '#79C365' },
                        { hex: '#452424', label: '#452424' },
                      ].map((c) => (
                        <div key={c.hex} className="flex flex-col items-center">
                          <div className="w-[50px] h-[16px] border border-[#888] p-swatch-dynamic" data-hex={c.hex} ref={(el) => { if(el) el.style.setProperty('--swatch-bg', c.hex); }} />
                          <div className="text-[6px] font-mono mt-0.5 text-gray-500">{c.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Manufacturer */}
                  <div className="flex flex-col items-center justify-center p-2">
                    <div className="font-bold text-[10px]">Manufacturer</div>
                    <div className="text-gray-500 text-[10px] mt-0.5">Kittl Design</div>
                  </div>
                </div>

              </div>
              </div>
            </div>

            {/* Bottom bar */}
            <div className="canva-bottombar">
              <div className="canva-zoom">
                <input
                  type="range"
                  className="canva-zoom-slider"
                  min="20"
                  max="200"
                  value={zoom}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setZoom(Number(e.target.value))}
                  aria-label="Điều chỉnh thu phóng"
                />
                <span className="canva-zoom-val">{zoom}%</span>
              </div>
              <div className="canva-side-indicator">
                <button onClick={() => setSide("front")} className={side === "front" ? "active" : ""}>
                  Mặt trước {frontCount > 0 && <span className="canva-badge">{frontCount}</span>}
                </button>
                <button onClick={() => setSide("back")} className={side === "back" ? "active" : ""}>
                  Mặt sau {backCount > 0 && <span className="canva-badge">{backCount}</span>}
                </button>
              </div>
            </div>
          </main>
        </div>
      {/* ── Mobile Bottom Tab Bar (hidden on desktop via CSS) ── */}
      <nav className="canva-mobile-tabs">
        {/* Side toggle: front / back */}
        <button
          className={`canva-mobile-tab canva-mobile-side-tab ${side === "front" ? "active" : ""}`}
          onClick={() => setSide("front")}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="9" y1="3" x2="9" y2="21" /></svg>
          <span>Trước{frontCount > 0 && ` (${frontCount})`}</span>
        </button>
        <button
          className={`canva-mobile-tab canva-mobile-side-tab ${side === "back" ? "active" : ""}`}
          onClick={() => setSide("back")}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="15" y1="3" x2="15" y2="21" /></svg>
          <span>Sau{backCount > 0 && ` (${backCount})`}</span>
        </button>
        <div className="canva-mobile-tab-sep" />
        {/* Shirt type toggle - LOCKED TO T-SHIRT */}
        <button
          className="canva-mobile-tab canva-mobile-side-tab active cursor-default"
          onClick={(e) => e.preventDefault()}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3L4 7v2l3-1v11h10V8l3 1V7l-8-4z" /></svg>
          <span>T-Shirt</span>
        </button>
        <div className="canva-mobile-tab-sep" />
        {[
          { id: "ai", label: "AI", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg> },
          { id: "upload", label: "Ảnh", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg> },
          { id: "text", label: "Chữ", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 7 4 4 20 4 20 7" /><line x1="9" y1="20" x2="15" y2="20" /><line x1="12" y1="4" x2="12" y2="20" /></svg> },
          { id: "elements", label: "Màu", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="13.5" cy="6.5" r="2.5" /><circle cx="17.5" cy="10.5" r="2.5" /><circle cx="8.5" cy="7.5" r="2.5" /><circle cx="6.5" cy="12.5" r="2.5" /><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" /></svg> },
          { id: "layers", label: "Layer", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></svg> },
        ].map((tab) => (
          <button
            key={tab.id}
            className={`canva-mobile-tab ${activePanel === tab.id ? "active" : ""}`}
            onClick={() => setActivePanel(activePanel === tab.id ? null : tab.id as "ai" | "upload" | "text" | "elements" | "layers" | "position")}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
