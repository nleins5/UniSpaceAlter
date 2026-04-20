"use client";
import React, { useState, useRef, useCallback, useEffect, useLayoutEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Zap, Plus, Undo2, Redo2, Image as ImageIcon, Palette as PaletteIcon, Layers as LayersIcon, Trash2 } from "lucide-react";

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

// ─── Component: TShirtMockup (Image-Based Mechanical Flat) ───────────────
function TShirtSVG({ color, side = "front" }: { color: string; side?: "front" | "back" }) {
  const isFront = side === "front";
  const isWhite = color === "#FFFFFF" || color === "#ffffff" || color === "#F2F0E9";
  return (
    <div className="w-full h-full relative">
      {/* Color underlay — shows through white areas of the PNG via multiply blend */}
      {!isWhite && (
        <div className="absolute inset-[8%] rounded-sm" style={{ backgroundColor: color, opacity: 0.35 }} />
      )}
      <Image 
        src={isFront ? "/mockups/user_tshirt_front.png" : "/mockups/user_tshirt_back.png"} 
        alt={`Shirt ${side}`} 
        fill
        priority
        className="relative z-10"
        style={{ objectFit: "contain", mixBlendMode: isWhite ? 'normal' : 'multiply' }}
      />
    </div>
  );
}

// ─── Component: DesignCanvas ──────────────────────────────────────────
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
  slot = "shirt",
}: DesignCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDropTarget, setIsDropTarget] = useState(false);

  const sideElements = elements.filter((el) => el.side === side && (el.slot === slot || !el.slot));
  const pushHistoryRef = useRef(onPushHistory);
  useEffect(() => { pushHistoryRef.current = onPushHistory; });

  const handleElementMouseDown = useCallback(
    (e: React.MouseEvent | React.TouchEvent, el: DesignElement) => {
      e.stopPropagation();
      onSelectElement(el.id);
      if (el.locked) return;
      const rect = canvasRef.current!.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
      setDragOffset({
        x: (clientX - rect.left) / (rect.width / 400) - el.x,
        y: (clientY - rect.top) / (rect.height / 480) - el.y,
      });
    },
    [onSelectElement]
  );

  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent | React.TouchEvent, el: DesignElement) => {
      if (el.locked) return;
      onSelectElement(el.id);
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
      const startX = clientX;
      const startY = clientY;
      const startWidth = el.width;
      const startHeight = el.height;
      const startElX = el.x;
      const startElY = el.y;
      const rect = canvasRef.current!.getBoundingClientRect();
      const scale = rect.width / 400;
      
      const handleMouseMove = (moveE: MouseEvent) => {
        const dx = (moveE.clientX - startX) / scale;
        const dy = (moveE.clientY - startY) / scale;
        const newWidth = Math.max(20, startWidth + dx);
        const newHeight = Math.max(20, startHeight + dy);
        onResizeElement(el.id, newWidth, newHeight, startElX, startElY);
      };
      
      const handleMouseUp = () => {
        pushHistoryRef.current();
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
      
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [onSelectElement, onResizeElement]
  );

  useEffect(() => {
    if (!isDragging || !selectedId) return;
    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current) return;
      const el = elements.find(item => item.id === selectedId);
      if (!el || el.locked) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const widthScale = rect.width / 400;
      const heightScale = rect.height / 480;
      const x = (e.clientX - rect.left) / widthScale - dragOffset.x;
      const y = (e.clientY - rect.top) / heightScale - dragOffset.y;
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
  }, [isDragging, selectedId, dragOffset, onMoveElement, elements]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDropTarget(false);
      const data = e.dataTransfer.getData("application/json");
      if (!data) return;
      try {
        const image: AIImage = JSON.parse(data);
        const rect = canvasRef.current!.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 400 - 50;
        const y = ((e.clientY - rect.top) / rect.height) * 480 - 50;
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
      
      {sideElements.map((el) => <DesignElementItem key={el.id} el={el} selectedId={selectedId} isDragging={isDragging} onMouseDown={handleElementMouseDown} onResizeMouseDown={handleResizeMouseDown} />)}
    </div>
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
  onResizeMouseDown: (e: React.MouseEvent | React.TouchEvent, el: DesignElement) => void
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
    <div ref={ref} className="absolute design-element-layer">
      <div
        className={`w-full h-full relative cursor-move ${selectedId === el.id ? "ring-2 ring-violet-500" : ""}`}
        onMouseDown={(e) => onMouseDown(e, el)}
      >
        {el.type === "image" && el.url && (
          <Image src={el.url} alt={el.label} width={400} height={400} unoptimized className="w-full h-full object-contain pointer-events-none" />
        )}
        {el.type === "text" && <div ref={textRef} className="whitespace-nowrap design-text-element">{el.text}</div>}
        
        {selectedId === el.id && !isDragging && (
          <div 
            className="absolute -right-2 -bottom-2 w-4 h-4 bg-violet-600 rounded-full border-2 border-white cursor-nwse-resize shadow-lg z-50"
            onMouseDown={(e) => { e.stopPropagation(); onResizeMouseDown(e, el); }}
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
      content: "Initial suggested artifacts.",
      images: [
         { id: 'h1', url: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=500&q=80', label: 'HUSTLE_V1' },
         { id: 'h2', url: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=500&q=80', label: 'FLAME_GFX' },
         { id: 'h3', url: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=500&q=80', label: 'GEO_PATT' },
         { id: 'h4', url: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=500&q=80', label: 'NEON_SIG' }
      ]
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [historyStack, setHistoryStack] = useState<DesignElement[][]>([]);
  const [redoStack, setRedoStack] = useState<DesignElement[][]>([]);

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
      const aiMsg: ChatMessage = { id: `msg-${Date.now()}-ai`, role: "ai", content: `Protocol Engaged.`, images: data.images };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) { console.error(err); } finally { setIsLoading(false); }
  }, []);

  const handleDropImage = useCallback((image: AIImage, x: number, y: number) => {
    setElements(prev => {
      pushHistory(prev);
      return [...prev, {
        id: `el-${Date.now()}`, type: "image", label: image.label, url: image.url, 
        x, y, width: 160, height: 160, rotation: 0, side, locked: false
      }];
    });
  }, [side, pushHistory]);

  const handleAddText = useCallback((text: string, font: string) => {
    setElements(prev => {
      pushHistory(prev);
      return [...prev, {
        id: `el-${Date.now()}`, type: "text", label: "Type Artifact", text,
        fontSize: 32, fontFamily: font, fontWeight: "900", textColor: "#000000",
        x: 120, y: 150, width: 200, height: 60, rotation: 0, side, locked: false
      }];
    });
  }, [side, pushHistory]);

  const handleMoveElement = useCallback((id: string, x: number, y: number) => {
    setElements(prev => prev.map(el => el.id === id ? { ...el, x, y } : el));
  }, []);

  const handleResizeElement = useCallback((id: string, width: number, height: number, x?: number, y?: number) => {
    setElements(prev => prev.map(el => (el.id === id ? { ...el, width, height, ...(x !== undefined ? { x } : {}), ...(y !== undefined ? { y } : {}) } : el)));
  }, []);

  return (
    <div className="flex flex-col h-screen bg-[#f3f4f6] overflow-hidden font-sans">

      {/* NAV */}
      <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-6 shrink-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/" className="font-black text-lg tracking-tight">Uni<span className="text-violet-600">Space</span></Link>
          <div className="h-6 w-px bg-gray-200 mx-2" />
          <div className="flex items-center gap-1">
            <button onClick={handleUndo} className="p-1.5 hover:bg-gray-100 rounded-lg" title="Undo"><Undo2 size={16} /></button>
            <button onClick={handleRedo} className="p-1.5 hover:bg-gray-100 rounded-lg" title="Redo"><Redo2 size={16} /></button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setSide(side === "front" ? "back" : "front")} className="px-4 py-1.5 bg-black text-white text-[10px] font-black uppercase rounded-full tracking-widest hover:scale-105 transition-all">Switch to {side === "front" ? "Back" : "Front"}</button>
          <button className="px-4 py-1.5 border-2 border-black text-black text-[10px] font-black uppercase rounded-full tracking-widest hover:bg-black hover:text-white transition-all">Export Pack</button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">

        {/* ── LEFT: BLUEPRINT PANEL (fixed 660px, fills full height) ── */}
        <section className="w-[820px] shrink-0 h-full flex flex-col bg-white border-r border-gray-300 shadow-xl overflow-hidden">

          {/* HEADER ROW 1 */}
          <div className="grid grid-cols-[150px_1fr_120px_90px] border-b border-black shrink-0 h-[60px]">
            <div className="border-r border-black p-2 flex flex-col justify-center items-center relative bg-white">
              <span className="text-[5px] font-black text-gray-400 absolute top-1.5 left-2 uppercase tracking-widest">Brand Logo</span>
              <div className="w-16 h-7 bg-black rounded-full flex items-center justify-center text-white text-[7px] font-black uppercase tracking-tighter">STREET FACE</div>
              <span className="text-[4px] font-black uppercase tracking-[0.3em] mt-0.5 text-gray-500">clothing.co</span>
            </div>
            <div className="border-r border-black p-2 flex flex-col justify-center">
              <span className="text-[5px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Project Name:</span>
              <span className="text-[11px] font-black leading-none">FIRE HUSTLE 1995</span>
              <span className="text-[8px] text-gray-500 mt-0.5">Short pants</span>
            </div>
            <div className="border-r border-black p-2 flex flex-col justify-center">
              <span className="text-[5px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Fabric:</span>
              <span className="text-[9px] font-black leading-tight">HEAVY COTTON<br/>20S</span>
            </div>
            <div className="p-2 flex flex-col justify-center">
              <span className="text-[5px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Category:</span>
              <span className="text-[9px] font-black">TOP</span>
            </div>
          </div>

          {/* HEADER ROW 2 */}
          <div className="grid grid-cols-[150px_1fr_120px_90px] border-b border-black shrink-0 h-[30px]">
            <div className="border-r border-black px-2 flex flex-col justify-center">
              <span className="text-[5px] font-black text-gray-400 uppercase">Color:</span>
              <span className="text-[8px] font-black">WHITE, GREEN</span>
            </div>
            <div className="border-r border-black px-2 flex flex-col justify-center">
              <span className="text-[5px] font-black text-gray-400 uppercase">Date:</span>
              <span className="text-[8px] font-black">JULY 2024</span>
            </div>
            <div className="border-r border-black px-2 flex flex-col justify-center">
              <span className="text-[5px] font-black text-gray-400 uppercase">Size Range:</span>
              <span className="text-[8px] font-black">L - XXL</span>
            </div>
            <div className="px-2 flex items-center justify-center">
              <span className="text-[5px] text-gray-300 font-mono">CONFIDENTIAL</span>
            </div>
          </div>

          {/* BLUEPRINT BODY — fills remaining height */}
          <div className="flex-1 relative overflow-hidden">
            <div className="absolute inset-0 blueprint-lattice pointer-events-none opacity-50" />

            <div className="relative h-full flex p-3 overflow-hidden">

              {/* FAR LEFT: Color Swatches */}
              <div className="w-[55px] shrink-0 flex flex-col gap-3 pt-1 pr-2">
                <span className="text-[5px] font-black uppercase text-black tracking-wider leading-tight block">COLOR<br/>SWATCHES</span>
                <button onClick={() => setTshirtColor('#D4DF72')} className="text-left" title="Apply green">
                  <div className="w-5 h-5 bg-[#D4DF72] border border-black mb-0.5" />
                  <span className="text-[5px] font-black uppercase leading-tight block">CMYK: 21 0 85 7</span>
                </button>
                <button onClick={() => setTshirtColor('#FFFFFF')} className="text-left" title="Apply white">
                  <div className="w-5 h-5 bg-white border border-black mb-0.5" />
                  <span className="text-[5px] font-black uppercase leading-tight block">CMYK: 0 0 0 0</span>
                </button>
              </div>

              {/* MAIN: 2 shirt rows — each takes half height */}
              <div className="flex-1 flex flex-col gap-1 overflow-hidden h-full min-h-0">

                {/* ROW 1: BACK VIEW */}
                <div className="h-[50%] flex gap-3 items-start overflow-hidden">
                  <div className="flex flex-col items-center h-full min-h-0 flex-1 min-w-0">
                    <span className="text-[7px] font-black uppercase text-black tracking-widest mb-1 shrink-0">BACK VIEW</span>
                    <div className="flex-1 w-full min-h-0 relative">
                      <DesignCanvas
                        elements={elements} selectedId={selectedId} onSelectElement={setSelectedId}
                        onMoveElement={handleMoveElement} onResizeElement={handleResizeElement}
                        onPushHistory={() => pushHistory(elements)} onDropImage={handleDropImage}
                        side="back" tshirtColor={tshirtColor}
                      />
                    </div>
                  </div>
                  {/* Back extract thumbnail */}
                  <div className="flex flex-col items-center shrink-0 pt-4">
                    <span className="text-[5px] font-black uppercase text-gray-400 mb-1 tracking-widest">BACK VIEW</span>
                    <div className="w-[100px] h-[100px] border border-gray-300 relative bg-[#1A1A1A]">
                      <Image src="/mockups/user_tshirt_back.png" alt="Back extract" fill className="object-contain" />
                    </div>
                  </div>
                </div>

                {/* ROW 2: FRONT VIEW */}
                <div className="h-[50%] flex gap-3 items-end overflow-hidden">
                  {/* Side view */}
                  <div className="flex flex-col items-center shrink-0 self-end">
                    <span className="text-[5px] font-black uppercase text-gray-400 mb-1 tracking-widest">SIDE VIEW</span>
                    <div className="w-[55px] h-[90px] border border-gray-300 relative bg-[#1A1A1A]">
                      <Image src="/mockups/user_tshirt_front.png" alt="Side view" fill className="object-contain" />
                    </div>
                  </div>
                  {/* Front shirt */}
                  <div className="flex flex-col items-center h-full min-h-0 flex-1 min-w-0">
                    <span className="text-[7px] font-black uppercase text-black tracking-widest mb-1 shrink-0">FRONT VIEW</span>
                    <div className="flex-1 w-full min-h-0 relative">
                      <DesignCanvas
                        elements={elements} selectedId={selectedId} onSelectElement={setSelectedId}
                        onMoveElement={handleMoveElement} onResizeElement={handleResizeElement}
                        onPushHistory={() => pushHistory(elements)} onDropImage={handleDropImage}
                        side="front" tshirtColor={tshirtColor}
                      />
                    </div>
                  </div>
                  {/* Front extract thumbnail */}
                  <div className="flex flex-col items-center shrink-0 self-end">
                    <span className="text-[5px] font-black uppercase text-gray-400 mb-1 tracking-widest">FRONT VIEW</span>
                    <div className="w-[80px] h-[80px] border border-gray-300 relative bg-[#1A1A1A]">
                      <Image src="/mockups/user_tshirt_front.png" alt="Front extract" fill className="object-contain" />
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* ── RIGHT: AI PANEL (fills remaining width) ── */}
        <aside className="flex-1 h-full flex flex-col bg-[#F0EFF4] overflow-hidden">

          {/* Tab bar */}
          <div className="flex bg-white/60 border-b border-gray-200 px-2 pt-1 shrink-0 gap-1">
            {([
              { id: "ai", icon: Zap, label: "AI" },
              { id: "assets", icon: ImageIcon, label: "Guide" },
              { id: "color", icon: PaletteIcon, label: "Palette" },
              { id: "layers", icon: LayersIcon, label: "Layers" }
            ] as const).map((t) => (
              <button
                key={t.id} onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-2 text-[10px] font-black uppercase tracking-wide rounded-t-lg transition-all ${activeTab === t.id ? 'bg-white text-violet-600 border border-b-0 border-gray-200' : 'text-gray-400 hover:text-black'}`}
              >
                <t.icon size={12} />{t.label}
              </button>
            ))}
          </div>

          {/* Content area */}
          <div className="flex-1 overflow-y-auto scrollbar-hide p-4">

            {activeTab === "ai" && (
              <div className="flex flex-col gap-4 h-full">
                {/* Header */}
                <div className="p-4 bg-black rounded-2xl text-white relative overflow-hidden">
                  <span className="text-[8px] font-black uppercase tracking-[0.4em] text-violet-400">Gen-V4 Protocol</span>
                  <p className="text-[9px] text-gray-500 mt-1">Precision industrial asset generation engaged.</p>
                  <Zap className="absolute -right-3 -bottom-3 w-16 h-16 text-white/5" />
                </div>

                {/* AI Image grid */}
                <div className="grid grid-cols-2 gap-3">
                  {messages.filter(m => m.role === "ai").flatMap(m => m.images || []).map((img) => (
                    <button key={img.id}
                      onClick={() => handleDropImage(img, 120, 150)}
                      className="group relative aspect-square bg-white rounded-2xl overflow-hidden hover:scale-105 transition-all shadow-sm border border-white/50"
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData("application/json", JSON.stringify(img))}
                      title={`Add ${img.label}`}
                    >
                      <Image src={img.url} alt={img.label} width={200} height={200} unoptimized className="w-full h-full object-cover grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all" />
                      <div className="absolute inset-0 bg-violet-600/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Plus size={20} className="text-white shadow-lg" />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-black/60 text-[6px] font-mono text-white uppercase tracking-wider text-center">{img.label}</div>
                    </button>
                  ))}
                </div>

                {isLoading && (
                  <div className="flex items-center gap-2 p-3 bg-white rounded-xl">
                    <div className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" />
                    <span className="text-[9px] font-black uppercase text-gray-400">Generating...</span>
                  </div>
                )}

                {/* Chat input */}
                <div className="relative mt-auto">
                  <input
                    value={chatInput} onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && chatInput.trim() && (handleSendMessage(chatInput.trim()), setChatInput(""))}
                    placeholder="Describe your design idea..."
                    className="w-full bg-white border-2 border-transparent focus:border-violet-500 rounded-2xl px-4 py-3 text-[11px] shadow-sm outline-none transition-all pr-12"
                  />
                  <button
                    onClick={() => chatInput.trim() && (handleSendMessage(chatInput.trim()), setChatInput(""))}
                    disabled={isLoading}
                    title="Generate AI design"
                    aria-label="Generate AI design"
                    className="absolute right-2 top-2 w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
                  >
                    <Zap size={14} />
                  </button>
                </div>
              </div>
            )}

            {activeTab === "assets" && (
              <div className="bg-white rounded-3xl border border-gray-200 p-5 shadow-sm flex flex-col gap-6 animate-in fade-in duration-300">
                <div className="flex items-center justify-between gap-2">
                  <div className="w-8 h-5 border border-black rounded-full flex items-center justify-center text-[7px] font-black">000</div>
                  <div className="flex-1 h-px border-t border-dashed border-black/20" />
                  <div className="px-3 py-1 border border-black rounded-full text-[8px] font-black uppercase">FONT PAIRING GUIDE</div>
                  <div className="flex-1 h-px border-t border-dashed border-black/20" />
                  <div className="w-8 h-5 border border-black rounded-full flex items-center justify-center text-[7px] font-black">000</div>
                </div>
                <p className="text-[7px] font-black uppercase text-center tracking-widest text-gray-400">AND REMEMBER THAT EVEN WITH THE BEST INSTRUCTIONS<br/>YOU ALWAYS HAVE TO LEARN ON THE GO</p>
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => handleAddText("Font", "Cormorant Garamond")} className="text-left group"><div className="text-[42px] font-serif italic leading-none group-hover:text-violet-600 transition-colors">Font</div><div className="text-[7px] font-black uppercase tracking-wide border-t border-black pt-1">PAIRING + GUIDE</div></button>
                  <button onClick={() => handleAddText("Get Ready", "Impact")} className="text-right group flex flex-col items-end"><div className="text-[28px] font-black -rotate-2 leading-none group-hover:text-violet-600 transition-colors">Get<br/>Ready</div></button>
                  <button onClick={() => handleAddText("BROKEN HEART", "Space Grotesk")} className="group text-left"><div className="text-[22px] font-black tracking-tight leading-none group-hover:text-violet-600 transition-colors">BROKEN<br/>HEART</div></button>
                  <button onClick={() => handleAddText("MILK & HONEY", "Space Grotesk")} className="group text-right"><div className="text-[22px] font-black tracking-tight leading-none text-right group-hover:text-violet-600 transition-colors">MILK<br/>&HONEY</div></button>
                  <button onClick={() => handleAddText("Learn", "Cormorant Garamond")} className="group text-left"><div className="text-[38px] font-serif italic leading-none group-hover:text-violet-600 transition-colors">Learn</div></button>
                  <button onClick={() => handleAddText("Weird", "Cormorant Garamond")} className="group text-right"><div className="text-[38px] font-serif italic leading-none group-hover:text-violet-600 transition-colors text-right">Weird</div></button>
                </div>
              </div>
            )}

            {activeTab === "color" && (
              <div className="space-y-3 animate-in fade-in duration-300">
                <span className="text-[8px] font-black uppercase tracking-widest text-gray-500 block">Click a color to apply to shirt</span>
                <div className="flex items-center gap-2 p-2 bg-violet-50 rounded-xl border border-violet-200">
                  <div className="w-6 h-6 rounded-md border-2 border-violet-400 shrink-0" ref={(el) => { if (el) el.style.setProperty('background-color', tshirtColor); }} />
                  <span className="text-[8px] font-black uppercase">Active: {tshirtColor}</span>
                </div>
                {[
                  { name: "White", hex: "#FFFFFF" }, { name: "Cream", hex: "#F2F0E9" },
                  { name: "Lime Green", hex: "#D4DF72" }, { name: "Moss Green", hex: "#2E4036" },
                  { name: "Clay", hex: "#CC5833" }, { name: "Charcoal", hex: "#1A1A1A" },
                  { name: "Plasma", hex: "#7B61FF" }, { name: "Signal Red", hex: "#E63B2E" },
                  { name: "Sky Blue", hex: "#87CEEB" }, { name: "Blush Pink", hex: "#FFB6C1" },
                ].map(c => (
                  <button key={c.hex} onClick={() => setTshirtColor(c.hex)} title={`Apply ${c.name}`}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                      tshirtColor === c.hex ? 'bg-violet-50 border-violet-400 ring-2 ring-violet-200' : 'bg-white border-gray-100 hover:border-violet-300'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg border border-gray-200 shrink-0" ref={(el) => { if (el) el.style.setProperty('background-color', c.hex); }} />
                    <div className="text-left">
                      <div className="text-[9px] font-black uppercase">{c.name}</div>
                      <div className="text-[7px] font-mono text-gray-400">{c.hex}</div>
                    </div>
                    {tshirtColor === c.hex && <div className="ml-auto w-2 h-2 bg-violet-500 rounded-full" />}
                  </button>
                ))}
              </div>
            )}

            {activeTab === "layers" && (
              <div className="space-y-3 animate-in fade-in duration-300">
                {elements.length === 0 ? (
                  <div className="py-20 text-center opacity-20"><LayersIcon size={32} className="mx-auto" /><p className="text-[8px] font-black uppercase mt-4">No layers yet</p></div>
                ) : (
                  elements.slice().reverse().map((el) => (
                    <div key={el.id} onClick={() => setSelectedId(el.id)} className={`flex items-center gap-3 p-3 rounded-xl bg-white border cursor-pointer transition-all ${selectedId === el.id ? 'border-violet-500 ring-4 ring-violet-50' : 'border-gray-100 hover:border-gray-200'}`}>
                      <div className="flex-1 min-w-0">
                        <div className="text-[9px] font-black uppercase truncate">{el.label || el.text}</div>
                        <div className="text-[7px] font-mono text-gray-400">{el.type} / {el.side}</div>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); setElements(prev => prev.filter(item => item.id !== el.id)); }} title="Delete layer" aria-label="Delete layer" className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={13}/></button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </aside>
      </main>

      <style jsx global>{`
        .blueprint-lattice {
          background-image: 
            linear-gradient(rgba(0,0,0,0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.08) 1px, transparent 1px);
          background-size: 20px 20px;
          background-color: transparent;
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .design-element-layer {
          left: var(--target-x); top: var(--target-y); width: var(--target-w); height: var(--target-h); transform: rotate(var(--target-rot));
        }
        .design-text-element { font-size: var(--text-size); font-family: var(--text-font); font-weight: var(--text-weight); color: var(--text-color); }
      `}</style>
    </div>
  );
}

