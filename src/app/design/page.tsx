"use client";
import React, { useState, useRef, useCallback, useEffect, useLayoutEffect } from "react";

import Link from "next/link";
import Image from "next/image";
import { Zap, Plus, Undo2, Redo2, Image as ImageIcon, Type as TypeIcon, Palette as PaletteIcon, Layers as LayersIcon, Trash2, Maximize2 } from "lucide-react";



// ─── Types ───────────────────────────────────────────────────
interface DesignElement {
  id: string;
  type: "image" | "text";
  url?: string;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
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
  techSlot?: string;
}

interface AIImage {
  id: string;
  label: string;
  url: string;
}

// Removed unused TechSlotConfig interface


interface ChatMessage {
  id: string;
  role: "user" | "ai";
  content: string;
  images?: AIImage[];
}

// ─── Component: TShirtSVG (High-Fidelity Vector) ───────────────
function TShirtSVG({ color, side = "front" }: { color: string; side?: "front" | "back" }) {
  const isFront = side === "front";
  const uid = React.useId().replace(/:/g, '_');

  return (
    <svg viewBox="0 0 500 520" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <filter id={`sh_${uid}`} x="-4%" y="-4%" width="108%" height="108%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="1.2" />
          <feOffset dx="0" dy="1.5" result="offsetblur" />
          <feComponentTransfer><feFuncA type="linear" slope="0.05" /></feComponentTransfer>
          <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <pattern id={`rib_${uid}`} patternUnits="userSpaceOnUse" width="3.5" height="3.5">
          <line x1="1.75" y1="0" x2="1.75" y2="3.5" stroke="#777" strokeWidth="0.5"/>
        </pattern>
      </defs>

      {/* 1. EXTREME BOXY SILHOUETTE */}
      <g filter={`url(#sh_${uid})`}>
        <path
          d={isFront ?
            "M 80,140 L 180,95 C 220,135 280,135 320,95 L 420,140 L 480,240 L 420,270 L 390,215 L 390,480 L 110,480 L 110,215 L 80,270 L 20,240 Z" :
            "M 80,140 L 180,95 C 220,80 280,80 320,95 L 420,140 L 480,240 L 420,270 L 390,215 L 390,480 L 110,480 L 110,215 L 80,270 L 20,240 Z"
          }
          fill={color}
          stroke="#111"
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
      </g>

      {/* 2. INNER CONJUNCTION */}
      {isFront && (
        <path
          d="M 180,95 C 220,78 280,78 320,95 C 290,110 210,110 180,95 Z"
          fill="#e8e8e8"
          stroke="#444"
          strokeWidth="0.4"
        />
      )}

      {/* 3. HEAVY RIB BAND */}
      <g>
        <path
          d={isFront ?
            "M 180,95 C 220,135 280,135 320,95 C 320,85 180,85 180,95 Z" :
            "M 180,95 C 220,80 280,80 320,95 C 320,110 180,110 180,95 Z"
          }
          fill={color}
          stroke="#111"
          strokeWidth="1.1"
        />
        <path
          d={isFront ?
            "M 180,95 C 220,135 280,135 320,95 C 320,85 180,85 180,95 Z" :
            "M 180,95 C 220,80 280,80 320,95 C 320,110 180,110 180,95 Z"
          }
          fill={`url(#rib_${uid})`}
          opacity="0.3"
        />
      </g>

      {/* 4. TECHNICAL STITCHING */}
      <g fill="none" stroke="#111" strokeWidth="0.4">
        <path
          d={isFront ? "M 175,102 C 220,142 280,142 325,102" : "M 175,88 C 220,75 280,75 325,88"}
          strokeDasharray="2.5 1.5" opacity="0.6"
        />
        <path d="M 80,140 L 110,215" opacity="0.2"/>
        <path d="M 420,140 L 390,215" opacity="0.2"/>
        <g strokeDasharray="3 2" opacity="0.5">
          <path d="M 110,472 L 390,472" />
          <path d="M 110,476 L 390,476" />
          <path d="M 42,248 L 88,274" />
          <path d="M 46,252 L 92,278" />
          <path d="M 458,248 L 412,274" />
          <path d="M 454,252 L 408,278" />
        </g>
      </g>
    </svg>
  );
}

// ─── Component: DesignCanvas (Interactive Surface) ──────────────
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
  slot?: string;
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
}: DesignCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDropTarget, setIsDropTarget] = useState(false);

  const sideElements = elements.filter((el) => el.side === side && (el.slot === slot || !el.slot));
  const pushHistoryRef = useRef(onPushHistory);
  useEffect(() => { pushHistoryRef.current = onPushHistory; });
  const hasMovedRef = useRef(false);

  const handleElementMouseDown = useCallback(
    (e: React.MouseEvent | React.TouchEvent, el: DesignElement) => {
      e.stopPropagation();
      onSelectElement(el.id);
      if (el.locked) return;
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
        let newWidth = startWidth, newHeight = startHeight, newX = startElX, newY = startElY;
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
      };
      
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [onSelectElement, onResizeElement, zoom]
  );

  useEffect(() => {
    if (!isDragging || !selectedId) return;
    const scale = zoom / 100;
    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current) return;
      const el = elements.find(item => item.id === selectedId);
      if (!el || el.locked) return;
      hasMovedRef.current = true;
      const rect = canvasRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / scale - dragOffset.x;
      const y = (e.clientY - rect.top) / scale - dragOffset.y;
      onMoveElement(selectedId, x, y);
    };
    const handleMouseUp = () => {
      pushHistoryRef.current();
      setIsDragging(false);
    };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, selectedId, dragOffset, onMoveElement, zoom, elements]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDropTarget(false);
      const data = e.dataTransfer.getData("application/json");
      if (!data) return;
      try {
        const image: AIImage = JSON.parse(data);
        const rect = canvasRef.current!.getBoundingClientRect();
        const internalWidth = 400;
        const internalHeight = 480;
        const x = ((e.clientX - rect.left) / rect.width) * internalWidth - 50;
        const y = ((e.clientY - rect.top) / rect.height) * internalHeight - 50;
        onDropImage(image, x, y);
      } catch (err) { console.error(err); }
    },
    [onDropImage]
  );

  return (
    <div
      ref={canvasRef}
      className={`relative w-full h-full canva-canvas ${isDropTarget ? "bg-violet-50/10" : ""}`}
      onMouseDown={(e) => (e.target === e.currentTarget && onSelectElement(null))}
      onDragOver={(e) => { e.preventDefault(); setIsDropTarget(true); }}
      onDragLeave={() => setIsDropTarget(false)}
      onDrop={handleDrop}
    >
      <TShirtSVG color={tshirtColor} side={side} />
      
      {/* Design Guides */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
         <div className="absolute left-[80px] top-[130px] w-[240px] h-[100px] border border-red-500/50" />
         <div className="absolute left-[100px] top-[70px] w-[200px] h-[180px] border border-blue-500/50" />
      </div>

      <DesignElementsRenderer 
        elements={sideElements} 
        selectedId={selectedId} 
        isDragging={isDragging} 
        onMouseDown={handleElementMouseDown}
        onResizeMouseDown={handleResizeMouseDown}
      />
    </div>
  );
}

// ─── Sub-Component: High-Performance Renderer ──────────────────
function DesignElementsRenderer({ 
  elements, 
  selectedId, 
  isDragging, 
  onMouseDown,
  onResizeMouseDown 
}: { 
  elements: DesignElement[], 
  selectedId: string | null,
  isDragging: boolean,
  onMouseDown: (e: React.MouseEvent | React.TouchEvent, el: DesignElement) => void,
  onResizeMouseDown: (e: React.MouseEvent | React.TouchEvent, el: DesignElement, corner: 'br') => void
}) {
  return (
    <>
      {elements.map((el) => <DesignElementItem key={el.id} el={el} selectedId={selectedId} isDragging={isDragging} onMouseDown={onMouseDown} onResizeMouseDown={onResizeMouseDown} />)}
    </>
  );
}

function DesignElementItem({ 
  el, 
  selectedId, 
  isDragging, 
  onMouseDown,
  onResizeMouseDown 
}: { 
  el: DesignElement, 
  selectedId: string | null,
  isDragging: boolean,
  onMouseDown: (e: React.MouseEvent | React.TouchEvent, el: DesignElement) => void,
  onResizeMouseDown: (e: React.MouseEvent | React.TouchEvent, el: DesignElement, corner: 'br') => void
}) {
  const ref = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!ref.current) return;
    ref.current.style.setProperty("--target-x", `${el.x}px`);
    ref.current.style.setProperty("--target-y", `${el.y}px`);
    ref.current.style.setProperty("--target-w", `${el.width}px`);
    ref.current.style.setProperty("--target-h", `${el.height}px`);
    ref.current.style.setProperty("--target-rot", `${el.rotation}deg`);
    
    if (textRef.current && el.type === "text") {
      textRef.current.style.setProperty("--text-size", `${el.fontSize}px`);
      textRef.current.style.setProperty("--text-font", el.fontFamily || "");
      textRef.current.style.setProperty("--text-weight", el.fontWeight || "");
      textRef.current.style.setProperty("--text-color", el.textColor || "");
    }
  }, [el]);

  return (
    <div 
      ref={ref}
      className="absolute design-element-layer"
    >
      <div
        className={`w-full h-full relative cursor-move ${selectedId === el.id ? "ring-2 ring-violet-500 ring-offset-2" : ""}`}
        onMouseDown={(e) => onMouseDown(e, el)}
      >
        {el.type === "image" && el.url && (
          <Image src={el.url} alt={el.label} width={400} height={400} unoptimized className="w-full h-full object-contain pointer-events-none" />
        )}
        {el.type === "text" && (
          <div ref={textRef} className="whitespace-nowrap design-text-element">
            {el.text}
          </div>
        )}
        
        {selectedId === el.id && !isDragging && (
          <div 
            className="absolute -right-2 -bottom-2 w-4 h-4 bg-violet-600 rounded-full border-2 border-white cursor-nwse-resize shadow-lg z-50"
            onMouseDown={(e) => { e.stopPropagation(); onResizeMouseDown(e, el, 'br'); }}
          />
        )}
      </div>
    </div>
  );
}

// ─── Main Design Page ──────────────────────────────────────────
export default function DesignPage() {
  const [activeTab, setActiveTab] = useState<"ai" | "assets" | "type" | "color" | "layers">("ai");
  const [side, setSide] = useState<"front" | "back">("front");
  const [tshirtColor, setTshirtColor] = useState("#FFFFFF");
  const [elements, setElements] = useState<DesignElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init_suggest",
      role: "ai",
      content: "Initial suggested artifacts for your project.",
      images: [
        { id: 's1', url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=500&q=80', label: 'NEON_SIG' },
        { id: 's2', url: 'https://images.unsplash.com/photo-1549490349-8643362247b5?w=500&q=80', label: 'URBAN_TEX' },
        { id: 's3', url: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=500&q=80', label: 'BLUEPRINT' },
        { id: 's4', url: 'https://images.unsplash.com/photo-1533158307587-828f0a76ef46?w=500&q=80', label: 'CYBER_GRID' },
        { id: 's5', url: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=500&q=80', label: 'SYNTH_WAVE' },
        { id: 's6', url: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=500&q=80', label: 'PLASMA_FLX' },
        { id: 's7', url: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?w=500&q=80', label: 'MONO_STR' },
        { id: 's8', url: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=500&q=80', label: 'GEO_ARTI' },
        { id: 's9', url: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=500&q=80', label: 'VIBRANT_GR' },
        { id: 's10', url: 'https://images.unsplash.com/photo-1620121692029-d088224ddc74?w=500&q=80', label: 'ABSTRACT_P' }
      ]
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const workspaceRef = useRef<HTMLElement>(null);
  const [historyStack, setHistoryStack] = useState<DesignElement[][]>([]);
  const [redoStack, setRedoStack] = useState<DesignElement[][]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const pushHistory = useCallback((prev: DesignElement[]) => {
    setHistoryStack(h => [...h.slice(-49), prev]);
    setRedoStack([]);
  }, []);

  const handleUndo = useCallback(() => {
    if (historyStack.length === 0) return;
    const prev = historyStack[historyStack.length - 1];
    setRedoStack(r => [...r, elements]);
    setElements(prev);
    setHistoryStack(h => h.slice(0, -1));
  }, [historyStack, elements]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setHistoryStack(h => [...h, elements]);
    setElements(next);
    setRedoStack(r => r.slice(0, -1));
  }, [redoStack, elements]);

  const handleSendMessage = useCallback(async (content: string) => {
    const userMsg: ChatMessage = { id: `msg-${Date.now()}`, role: "user", content };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: content }),
      });
      const data = await res.json();
      const aiMsg: ChatMessage = {
        id: `msg-${Date.now()}-ai`,
        role: "ai",
        content: `Intelligence Protocol Online — extracted ${data.images.length} creative artifacts.`,
        images: data.images,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
       console.error(err);
    } finally { setIsLoading(false); }
  }, []);

  const handleDropImage = useCallback((image: AIImage, x: number, y: number) => {
    setElements(prev => {
      pushHistory(prev);
      return [...prev, {
        id: `el-${Date.now()}`,
        type: "image",
        label: image.label,
        url: image.url,
        x, y,
        width: 140, height: 140,
        rotation: 0,
        side,
        locked: false
      }];
    });
  }, [side, pushHistory]);

  const handleAddText = useCallback((text: string, font: string) => {
    setElements(prev => {
      pushHistory(prev);
      return [...prev, {
        id: `el-${Date.now()}`,
        type: "text",
        label: "Typography Artifact",
        text,
        fontSize: 32,
        fontFamily: font,
        fontWeight: "900",
        textColor: "#000000",
        x: 100, y: 150,
        width: 250, height: 60,
        rotation: 0,
        side,
        locked: false
      }];
    });
  }, [side, pushHistory]);

  const handleMoveElement = useCallback((id: string, x: number, y: number) => {

    setElements(prev => prev.map(el => el.id === id ? { ...el, x, y } : el));
  }, []);

  const handleResizeElement = useCallback((id: string, width: number, height: number, x?: number, y?: number) => {
    setElements(prev => prev.map(el => (el.id === id ? { ...el, width, height, ...(x !== undefined ? { x } : {}), ...(y !== undefined ? { y } : {}) } : el)));
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-screen bg-[#f8f9fa] overflow-hidden">
      
      {/* ─── TECHNICAL HEADER ─── */}
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shrink-0 z-50">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-black text-xl tracking-tighter">Uni<span className="text-violet-600">Space</span></Link>
          <div className="h-8 w-[1px] bg-gray-200" />
          <nav className="flex items-center gap-2">
             <button onClick={handleUndo} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Undo (Ctrl+Z)" aria-label="Undo"><Undo2 size={18} /></button>
             <button onClick={handleRedo} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Redo (Ctrl+Shift+Z)" aria-label="Redo"><Redo2 size={18} /></button>
          </nav>
        </div>
        
        <div className="flex items-center gap-4">
           <button onClick={() => setSide(side === "front" ? "back" : "front")} className="px-6 py-2 bg-black text-white rounded-full text-[11px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all" title="Toggle Side" aria-label="Toggle Side">
              Switch to {side === "front" ? "Back" : "Front"}
           </button>
           <button className="px-6 py-2 border-2 border-black text-black rounded-full text-[11px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all" title="Export Design" aria-label="Export Design">
              Export Tech Pack
           </button>
        </div>
      </header>

      {/* ─── MAIN WORKSPACE SPLIT ─── */}
      <main className="flex-1 flex overflow-hidden">
        
        <section ref={workspaceRef} className="flex-[0.70] h-full bg-[#E5E7EB] p-8 overflow-y-auto scrollbar-hide flex flex-col items-center">
           
           <div className="relative w-[1000px] bg-white border border-gray-300 shadow-2xl overflow-hidden font-sans mb-32 p-1 bg-grid-slate-100">
              
              {/* 1:1 PIXEL PERFECT TECHNICAL HEADER */}
              <div className="border border-gray-900 mb-1">
                {/* TOP ROW: 4 COLS */}
                <div className="grid grid-cols-4 border-b border-gray-900">
                  <div className="border-r border-gray-900 p-3 h-28 flex flex-col">
                    <span className="text-[7px] font-black uppercase text-gray-400 mb-3 tracking-widest">Brand Logo</span>
                    <div className="flex-1 flex flex-col items-center justify-center">
                      <div className="bg-black text-white px-5 py-2 text-[14px] font-black uppercase tracking-tighter rounded-full leading-none">Street Face</div>
                      <span className="text-[6px] font-black uppercase tracking-[0.3em] mt-2 text-gray-400">clothing.co</span>
                    </div>
                  </div>
                  <div className="border-r border-gray-900 p-3 h-28 flex flex-col">
                    <span className="text-[7px] font-black uppercase text-gray-400 mb-2 tracking-widest">Project Name:</span>
                    <span className="text-[11px] font-black leading-tight uppercase">Fire Hustle 1995<br/>Short pants</span>
                  </div>
                  <div className="border-r border-gray-900 p-3 h-28 flex flex-col">
                    <span className="text-[7px] font-black uppercase text-gray-400 mb-2 tracking-widest">Fabric:</span>
                    <span className="text-[11px] font-black leading-tight uppercase">Heavy Cotton<br/>20S</span>
                  </div>
                  <div className="p-3 h-28 flex flex-col">
                    <span className="text-[7px] font-black uppercase text-gray-400 mb-2 tracking-widest">Category:</span>
                    <span className="text-[11px] font-black uppercase">Top</span>
                  </div>
                </div>

                {/* BOTTOM ROW: 3 COLS */}
                <div className="grid grid-cols-3">
                  <div className="border-r border-gray-900 p-3 h-20 flex flex-col">
                    <span className="text-[7px] font-black uppercase text-gray-400 mb-2 tracking-widest">Color:</span>
                    <span className="text-[10px] font-black uppercase">White, Green</span>
                  </div>
                  <div className="border-r border-gray-900 p-3 h-20 flex flex-col">
                    <span className="text-[7px] font-black uppercase text-gray-400 mb-2 tracking-widest">Date:</span>
                    <span className="text-[10px] font-black uppercase leading-tight">July 2024</span>
                  </div>
                  <div className="p-3 h-20 flex flex-col">
                    <span className="text-[7px] font-black uppercase text-gray-400 mb-2 tracking-widest">Size Range:</span>
                    <span className="text-[11px] font-black uppercase">L - XXL</span>
                  </div>
                </div>
              </div>

              {/* VERTICAL STACKED INTERACTION AREA (Matches Screenshot) */}
              <div className="relative bg-[#fcfcfc] overflow-hidden group mb-1 border border-gray-900 p-12 space-y-32">
                 <div className="absolute inset-0 blueprint-grid opacity-60 pointer-events-none" />
                 
                 {/* STICKY LEFT COLUMN ARTIFACTS (Swatches & Side View) */}
                 <div className="absolute left-10 top-10 space-y-12 z-20">
                    <div>
                       <span className="text-[8px] font-black uppercase text-violet-600 block mb-2 tracking-widest">Color<br/>Swatches</span>
                       <div className="space-y-1">
                          <div className="flex items-center gap-2">
                             <div className="w-6 h-3 overflow-hidden">
                                <TshirtSwatch color={tshirtColor} />
                             </div>
                             <span className="text-[6px] font-mono font-bold">CMYK: 21 0 85 7</span>
                          </div>
                          <div className="flex items-center gap-2">
                             <div className="w-6 h-3 border border-gray-300 rounded-sm bg-gray-100" />
                             <span className="text-[6px] font-mono font-bold text-gray-400">CMYK: 0 0 0 0</span>
                          </div>
                       </div>
                    </div>

                    <div className="border border-gray-900 p-2 bg-white w-32 shadow-sm">
                       <span className="text-[7px] font-black uppercase text-gray-400 block mb-2 tracking-widest">Side View</span>
                       <div className="w-full aspect-video bg-gray-50 flex items-center justify-center opacity-30">
                          <LayersIcon size={10} className="text-gray-400" />
                       </div>
                       <div className="mt-2 h-[1px] w-full bg-violet-200" />
                    </div>
                 </div>

                 {/* 3-ELEVATION TECHNICAL ECOSYSTEM (Front, Back, Side) */}
                 <div className="relative flex flex-col items-center gap-16 py-8">
                    {/* TOP SECTION: BACK & SIDE */}
                    <div className="flex items-center gap-12">
                       {/* SIDE VIEW ARTIFACT */}
                       <div className="w-56 h-80 bg-white border border-gray-900 p-2 shadow-sm relative">
                          <span className="absolute -top-6 left-0 text-[10px] font-black uppercase text-violet-600 tracking-widest">Side Profile 0.3</span>
                          <div className="w-full h-full bg-[#f9f9f9] flex flex-col items-center justify-center opacity-40">
                             <LayersIcon size={32} className="text-gray-300 mb-4" />
                             <div className="w-12 h-1 bg-violet-200 mb-2" />
                             <span className="text-[7px] font-mono text-gray-400">OFFSET_PROFILE_L</span>
                          </div>
                          {/* Pointer line to main body */}
                          <div className="absolute top-1/2 -right-12 w-12 h-[1px] bg-violet-600/30" />
                       </div>

                       {/* BACK VIEW MAIN */}
                       <div className="w-[350px] aspect-square relative design-container bg-white/50 border border-gray-900/10 shadow-lg">
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
                            zoom={65}
                          />
                          <span className="absolute top-3 left-3 px-2 py-1 bg-black text-white text-[9px] font-black uppercase tracking-tighter">Back Elevation</span>
                       </div>
                    </div>

                    <div className="h-[2px] w-full max-w-4xl bg-gray-900/10 border-dashed border-t" />

                    {/* BOTTOM SECTION: FRONT VIEW */}
                    <div className="w-[350px] aspect-square relative design-container bg-white/50 border border-gray-900/10 shadow-lg transition-all hover:border-violet-600/30">
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
                         zoom={65}
                       />
                       <span className="absolute top-3 left-3 px-2 py-1 bg-black text-white text-[9px] font-black uppercase tracking-tighter">Front Elevation</span>
                       
                       {/* Zoom/Detail Indicator Front */}
                       <div className="absolute -right-24 top-1/2 -translate-y-1/2 w-20 h-20 border border-gray-900 p-1 bg-white flex items-center justify-center opacity-30">
                          <Maximize2 size={12} />
                       </div>
                    </div>
                 </div>

              </div>

              {/* Sheet Footer */}
              <div className="bg-white p-4 flex justify-between items-center border border-gray-900">
                 <div className="text-[7px] font-mono opacity-60 uppercase leading-none space-y-1">
                    <div>TECHNICAL PROPERTY OF UNISPACE STUDIO</div>
                    <div className="text-violet-600 font-bold">STRICTLY CONFIDENTIAL / NON-REPLICABLE</div>
                 </div>
                 <div className="flex items-center gap-8">
                    <div className="flex flex-col items-end">
                       <span className="text-[7px] font-black uppercase text-gray-500">Protocol</span>
                       <span className="text-[10px] font-bold font-mono text-green-600 animate-pulse">ACTIVE_STATE</span>
                    </div>
                    <div className="w-[1px] h-8 bg-gray-200" />
                    <div className="text-right">
                       <span className="text-[7px] font-black uppercase text-gray-500">Sheet</span>
                       <span className="text-[12px] font-bold font-mono">01 OF 01</span>
                    </div>
                 </div>
              </div>
           </div>
        </section>

        {/* RIGHT: MULTI-TAB INTELLIGENCE SIDEBAR (30%) */}
        <aside className="flex-[0.30] h-full bg-white border-l border-gray-200 flex flex-col shadow-2xl z-40 overflow-hidden">
           
           {/* Tab Navigation (Horizontal Strip) */}
           <div className="flex bg-black p-1 shrink-0 overflow-x-auto scrollbar-hide">
              {([
                { id: "ai", icon: Zap, label: "AI" },
                { id: "assets", icon: ImageIcon, label: "Library" },
                { id: "type", icon: TypeIcon, label: "Type" },
                { id: "color", icon: PaletteIcon, label: "Color" },
                { id: "layers", icon: LayersIcon, label: "Layers" }
              ] as const).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex-1 flex flex-col items-center py-3 px-1 rounded-xl transition-all ${activeTab === t.id ? 'bg-violet-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                  title={t.label}
                  aria-label={t.label}
                >
                  <t.icon size={18} />
                  <span className="text-[8px] font-bold uppercase mt-1 tracking-widest">{t.label}</span>
                </button>
              ))}
           </div>

           {/* ADDED: Side Selector for adding elements */}
           <div className="bg-gray-50 border-b border-gray-200 p-2 flex gap-1">
              <button 
                onClick={() => setSide("front")}
                className={`flex-1 py-1 text-[8px] font-black uppercase rounded-lg border transition-all ${side === 'front' ? 'bg-black text-white border-black' : 'bg-white text-gray-400 border-gray-200'}`}
              >
                Front View Active
              </button>
              <button 
                onClick={() => setSide("back")}
                className={`flex-1 py-1 text-[8px] font-black uppercase rounded-lg border transition-all ${side === 'back' ? 'bg-black text-white border-black' : 'bg-white text-gray-400 border-gray-200'}`}
              >
                Back View Active
              </button>
           </div>

           <div className="flex-1 overflow-y-auto scrollbar-hide p-6 bg-[#fcfcfc]">
              
              {/* Tab Content: AI GENERATION */}
              {activeTab === "ai" && (
                 <div className="flex flex-col h-full animate-in fade-in duration-300">
                   <div className="px-6 py-4 bg-black/95 text-white">
                      <span className="text-[9px] font-black uppercase tracking-[0.3em] text-violet-400 block mb-1">Intelligence Engine v4</span>
                      <p className="text-[10px] text-gray-500 font-medium leading-relaxed">System pre-loaded with high-fidelity streetwear artifacts.</p>
                   </div>
                   
                   <div className="flex-1 overflow-y-auto p-4 scrollbar-hide space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        {messages.filter(m => m.role === "ai").flatMap(m => m.images || []).map((img) => (
                           <button 
                              key={img.id} 
                              onClick={() => handleDropImage(img, 130, 150)} 
                              className="group relative aspect-square rounded-2xl bg-white border border-gray-100 overflow-hidden hover:scale-105 transition-all shadow-sm"
                              title={`Add ${img.label}`}
                              aria-label={`Add ${img.label}`}
                           >
                              <Image src={img.url} alt={img.label} width={200} height={200} unoptimized className="w-full h-full object-cover grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300" />
                              <div className="absolute inset-0 bg-violet-600/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                 <Plus size={20} className="text-white" />
                              </div>
                              <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/80 text-[6px] font-black text-white uppercase tracking-widest">{img.label}</div>
                           </button>
                        ))}
                      </div>
                   </div>

                   {isLoading && (
                     <div className="py-8 flex flex-col items-center justify-center animate-pulse text-violet-600 gap-2 bg-gray-50 border-y border-gray-100">
                        <Zap className="animate-bounce" size={16} />
                        <span className="text-[8px] font-black uppercase tracking-[0.2em]">Synthesizing Artifacts...</span>
                     </div>
                   )}

                   <div className="p-4 bg-white border-t border-gray-100">
                      <div className="relative">
                         <input 
                           value={chatInput}
                           onChange={(e) => setChatInput(e.target.value)}
                           onKeyDown={(e) => e.key === 'Enter' && chatInput.trim() && (handleSendMessage(chatInput.trim()), setChatInput(""))}
                           placeholder="Describe new motif (e.g. Chrome Lotus)..." 
                           className="w-full bg-gray-50 border border-gray-200 rounded-full pl-6 pr-12 py-3 text-[11px] text-black focus:ring-2 focus:ring-violet-500 outline-none transition-all" 
                         />
                         <button 
                           onClick={() => chatInput.trim() && (handleSendMessage(chatInput.trim()), setChatInput(""))}
                           disabled={isLoading}
                           className="absolute right-1.5 top-1.5 w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center hover:scale-110 active:scale-95 transition-all disabled:opacity-30 shadow-lg text-white"
                           title="Generate Designs"
                           aria-label="Generate Designs"
                         >
                            <Zap size={12} fill="currentColor" />
                         </button>
                      </div>
                   </div>
                 </div>
               )}

              {/* Tab Content: IMAGE LIBRARY (STREETWEAR GRID - 1:1 PARITY) */}
              {activeTab === "assets" && (
                <div className="flex flex-col h-[750px] bg-[#f8f8f8] p-4 rounded-[3rem] border border-gray-200 shadow-inner animate-in fade-in duration-500">
                   
                   {/* Header Pill */}
                   <div className="flex items-center justify-between mb-8 px-4 mt-2">
                      <div className="flex gap-2 items-center">
                         <div className="w-10 h-6 border-[2px] border-black rounded-full flex items-center justify-center text-[10px] font-black">000</div>
                         <div className="w-6 h-0.5 border-t border-dashed border-gray-400" />
                         <div className="px-8 py-2 border-[2px] border-black rounded-full text-[12px] font-black uppercase tracking-widest bg-white">Font Pairing Guide</div>
                         <div className="w-6 h-0.5 border-t border-dashed border-gray-400" />
                         <div className="w-10 h-6 border-[2px] border-black rounded-full flex items-center justify-center text-[10px] font-black">000</div>
                      </div>
                   </div>

                   <p className="text-[10px] font-black uppercase text-center mb-10 tracking-widest leading-relaxed text-gray-400 px-12">
                      AND REMEMBER THAT EVEN WITH THE BEST INSTRUCTIONS<br/>YOU ALWAYS HAVE TO LEARN ON THE GO
                   </p>

                   <div className="flex-1 overflow-y-auto scrollbar-hide px-6 space-y-20 pb-12">
                      {/* ROW 1: Font & Get Ready */}
                      <div className="grid grid-cols-2 gap-12 items-end">
                         <div className="cursor-pointer group flex flex-col" onClick={() => handleAddText("Font", "Cormorant Garamond")}>
                            <div className="text-[64px] font-serif italic leading-[0.8] group-hover:text-violet-600 transition-colors">Font</div>
                            <div className="text-[16px] font-black uppercase tracking-widest mt-1 text-black">Pairing + Guide</div>
                            <div className="text-[8px] font-mono mt-2 opacity-40">TM 2024</div>
                         </div>
                         <div className="cursor-pointer group text-right flex flex-col items-end" onClick={() => handleAddText("Get Ready", "Permanent Marker")}>
                            <div className="text-[10px] font-black uppercase tracking-tighter mb-2 opacity-40">All tickets available</div>
                            <div className="text-[48px] font-marker leading-none group-hover:text-violet-600 transition-colors -rotate-2">Get Ready</div>
                            <div className="text-[10px] font-black mt-2 opacity-40">MAY 15TH</div>
                         </div>
                      </div>

                      {/* ROW 2: Broken Heart & Milk & Honey */}
                      <div className="grid grid-cols-2 gap-12 items-center border-y-2 border-dashed border-gray-200 py-16">
                         <div className="cursor-pointer group flex flex-col" onClick={() => handleAddText("BROKEN HEART", "Space Grotesk")}>
                            <div className="text-[38px] font-black leading-none tracking-tighter group-hover:text-violet-600 transition-colors uppercase">BROKEN</div>
                            <div className="flex items-center gap-2 my-2 w-full">
                               <div className="h-[2px] flex-1 bg-black" />
                               <span className="text-[8px] font-mono font-bold">W / S 2025</span>
                               <div className="h-[2px] flex-1 bg-black" />
                            </div>
                            <div className="text-[42px] font-black leading-none tracking-tighter group-hover:text-violet-600 transition-colors uppercase text-black">HEART</div>
                            <div className="text-[7px] font-black uppercase text-center mt-2 tracking-widest opacity-40">The Open Theater Comedy</div>
                         </div>
                         <div className="cursor-pointer group flex flex-col" onClick={() => handleAddText("MILK & HONEY", "Space Grotesk")}>
                             <div className="text-[52px] font-black leading-[0.85] tracking-tighter group-hover:text-violet-600 transition-colors">MILK</div>
                             <div className="text-[48px] font-black leading-[0.85] tracking-tighter group-hover:text-violet-600 transition-colors">& HONEY</div>
                             <div className="text-[9px] font-mono font-bold mt-2 text-right opacity-40 uppercase">RESERVED</div>
                         </div>
                      </div>

                      {/* ROW 3: Learn & Weird */}
                      <div className="grid grid-cols-2 gap-12 items-start">
                         <div className="cursor-pointer group flex flex-col" onClick={() => handleAddText("Learn", "Cormorant Garamond")}>
                            <div className="text-[64px] font-serif italic leading-none group-hover:text-violet-600 transition-colors">Learn</div>
                            <div className="text-[18px] font-black uppercase tracking-widest -mt-2">free font to LISTEN</div>
                         </div>
                         <div className="cursor-pointer group text-right flex flex-col items-end" onClick={() => handleAddText("Weird", "DM Serif Display")}>
                            <div className="text-[58px] font-serif leading-none group-hover:text-violet-600 transition-colors">Weird</div>
                            <div className="text-[10px] font-black uppercase mt-1 tracking-widest text-black">People rule the world</div>
                            <div className="text-[8px] font-mono opacity-40 mt-1 uppercase">May 2025</div>
                         </div>
                      </div>

                      {/* Footer Artifacts (QR + Made By) */}
                      <div className="pt-16 border-t border-dashed border-gray-200 flex flex-col items-center gap-10">
                          <div className="flex gap-10 items-center">
                             <div className="w-28 h-28 border-[3px] border-black p-2 bg-white flex items-center justify-center">
                                <div className="w-full h-full relative">
                                   <div className="absolute inset-0 grid grid-cols-5 grid-rows-5 gap-1 p-1">
                                      {Array.from({length: 25}).map((_, i) => (
                                         <div key={i} className={`bg-black ${ (i % 3 === 0 || i % 4 === 1 || i === 22) ? 'opacity-100' : 'opacity-0' }`} />
                                      ))}
                                   </div>
                                </div>
                             </div>
                             <div className="flex-1 text-left">
                                <p className="text-[10px] font-black uppercase text-gray-400 mb-6 leading-relaxed">
                                   YOUR DESIGN IS SPECIAL ONLY BECAUSE<br/>
                                   S MADE BY YOU, SO PUT SOME OF YOUR SOUL INTO IT
                                </p>
                                <div className="flex gap-3 items-center">
                                   <div className="px-10 py-3 border-[3px] border-black rounded-full text-[12px] font-black uppercase tracking-widest bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">MADE BY AMTAKETHAT</div>
                                   <div className="w-10 h-0.5 border-t border-dashed border-gray-400" />
                                   <div className="px-6 py-3 border-[3px] border-black rounded-full text-[10px] font-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">MAY</div>
                                </div>
                             </div>
                          </div>
                      </div>
                   </div>
                </div>
              )}

              {/* Tab Content: COLORS */}
              {activeTab === "color" && (
                <div className="space-y-8 animate-in fade-in duration-300">
                   <div className="flex items-center justify-between mb-4">
                      <span className="text-[11px] font-black uppercase tracking-widest border-l-4 border-violet-600 pl-3">Apparel Colorway</span>
                      <span className="text-[10px] font-mono font-bold text-gray-400">{tshirtColor.toUpperCase()}</span>
                   </div>
                   <PaletteContainer current={tshirtColor} onSelect={setTshirtColor} />
                </div>
              )}

              {/* Tab Content: LAYERS */}
              {activeTab === "layers" && (
                <div className="space-y-4 animate-in fade-in duration-300">
                   <div className="flex items-center justify-between mb-4">
                      <span className="text-[11px] font-black uppercase tracking-widest border-l-4 border-violet-600 pl-3">Design Stack</span>
                      <span className="text-[10px] text-gray-400 font-bold">{elements.length} Elements</span>
                   </div>
                   {elements.length === 0 ? (
                      <div className="py-20 text-center opacity-20 grayscale">
                         <LayersIcon size={32} className="mx-auto" />
                         <p className="text-[10px] font-black uppercase tracking-widest mt-4">Empty stack</p>
                      </div>
                   ) : (
                      <div className="space-y-2">
                        {elements.slice().reverse().map((el) => (
                           <div key={el.id} className={`flex items-center gap-4 p-4 rounded-2xl bg-white border transition-all ${selectedId === el.id ? 'border-violet-600 shadow-md translate-x-1' : 'border-gray-100 hover:border-gray-200'}`}>
                              <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                                 {el.type === "image" ? <ImageIcon size={16} className="text-gray-400"/> : <TypeIcon size={16} className="text-gray-400"/>}
                              </div>
                              <div className="flex-1 min-w-0" onClick={() => setSelectedId(el.id)}>
                                 <div className="text-[10px] font-black uppercase truncate">{el.label || el.text || "Element"}</div>
                                 <div className="text-[8px] font-mono text-gray-400 uppercase">{el.type} / {el.side}</div>
                              </div>
                              <button onClick={() => setElements(prev => prev.filter(item => item.id !== el.id))} className="p-2 text-gray-300 hover:text-red-500 transition-colors" title="Delete Layer"><Trash2 size={16}/></button>
                           </div>
                        ))}
                      </div>
                   )}
                </div>
              )}

              {/* Tab Content: TYPE (Quick Add) */}
              {activeTab === "type" && (
                <div className="space-y-8 animate-in fade-in duration-300 text-center">
                   <div className="flex items-center justify-between mb-4 text-left">
                      <span className="text-[11px] font-black uppercase tracking-widest border-l-4 border-violet-600 pl-3">Typography Engine</span>
                   </div>
                   <button 
                     onClick={() => handleAddText("SAMPLE TEXT", "Space Grotesk")}
                     className="w-full py-6 border-2 border-dashed border-gray-200 rounded-[2rem] hover:border-violet-600 hover:bg-violet-50 transition-all group"
                   >
                     <Plus size={24} className="mx-auto text-gray-300 group-hover:text-violet-600 mb-2 transition-colors" />
                     <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-violet-600 transition-colors">Add Typography Artifact</span>
                   </button>
                </div>
              )}

           </div>
        </aside>

      </main>

      <style jsx global>{`
        .blueprint-grid {
          background-size: 32px 32px;
          background-image:
            linear-gradient(to right, rgba(0, 0, 0, 0.08) 1.5px, transparent 1.5px),
            linear-gradient(to bottom, rgba(0, 0, 0, 0.08) 1.5px, transparent 1.5px);
          mask-image: radial-gradient(circle, black 80%, transparent 100%);
        }
        
        .design-container {
          box-shadow: inset 0 0 40px rgba(0,0,0,0.02);
        }

        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        
        .design-element-layer {
          left: var(--target-x);
          top: var(--target-y);
          width: var(--target-w);
          height: var(--target-h);
          transform: rotate(var(--target-rot));
        }
        
        .design-text-element {
          font-size: var(--text-size);
          font-family: var(--text-font);
          font-weight: var(--text-weight);
          color: var(--text-color);
        }
        
        .palette-swatch {
          background-color: var(--swatch-bg);
        }
      `}</style>
    </div>
  );
}

function PaletteContainer({ current, onSelect }: { current: string, onSelect: (c: string) => void }) {
  const colors = ["#FFFFFF", "#F5F5F5", "#E0E0E0", "#BDBDBD", "#757575", "#212121", "#F44336", "#FF9800", "#4CAF50", "#2196F3"];
  return (
    <div className="grid grid-cols-5 gap-3">
      {colors.map((c) => <SwatchItem key={c} color={c} active={current === c} onClick={() => onSelect(c)} />)}
    </div>
  );
}

function SwatchItem({ color, active, onClick }: { color: string, active: boolean, onClick: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  useLayoutEffect(() => {
    ref.current?.style.setProperty("--swatch-bg", color);
  }, [color]);
  return (
    <button 
      ref={ref}
      onClick={onClick}
      className={`w-full aspect-square rounded-xl border border-gray-100 transition-all hover:scale-110 shadow-sm palette-swatch ${active ? 'ring-2 ring-violet-600 ring-offset-2 scale-110' : ''}`}
      title={`Select Color ${color}`}
      aria-label={`Select Color ${color}`}
    />
  );
}

function TshirtSwatch({ color }: { color: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    ref.current?.style.setProperty("--swatch-bg", color);
  }, [color]);
  return (
    <div 
      ref={ref}
      className="w-full h-full border border-gray-300 rounded-sm palette-swatch"
      title={`Current Palette: ${color}`}
    />
  );
}
