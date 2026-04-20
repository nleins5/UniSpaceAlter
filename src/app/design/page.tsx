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
function TShirtSVG({ side = "front" }: { color: string; side?: "front" | "back" }) {
  const isFront = side === "front";

  return (
    <div className="w-full h-full relative flex items-center justify-center p-4">
      <Image 
        src={isFront ? "/mockups/user_tshirt_front.png" : "/mockups/user_tshirt_back.png"} 
        alt={`Shirt ${side}`} 
        width={500}
        height={500}
        priority
        className="w-full h-full object-contain"
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
  const [tshirtColor] = useState("#333333");
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
      
      {/* ─── NAV ─── */}
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
           <button onClick={() => setSide(side === "front" ? "back" : "front")} className="px-4 py-1.5 bg-black text-white text-[10px] font-black uppercase rounded-full tracking-widest hover:scale-105 transition-all" title="Toggle Surface">Switch to {side === "front" ? "Back" : "Front"}</button>
           <button className="px-4 py-1.5 border-2 border-black text-black text-[10px] font-black uppercase rounded-full tracking-widest hover:bg-black hover:text-white transition-all" title="Export Tech Pack">Export Pack</button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        
        {/* ─── WORKSPACE (LEFT) ─── */}
        <section className="flex-1 h-full p-6 overflow-y-auto scrollbar-hide bg-[#DADADA]/20 flex flex-col items-center">
           
           <div className="w-[850px] bg-white border border-gray-200 shadow-2xl relative mb-20">
              
              {/* IMAGE 2 ACCURATE HEADER */}
              <div className="border-b-[1.5px] border-black pb-[1px]">
                <div className="grid grid-cols-[1.2fr_1.5fr_1.2fr_1.2fr] border-b border-black h-24">
                  <div className="border-r border-black p-3 flex flex-col relative justify-center bg-white overflow-hidden">
                    <span className="text-[6px] font-black text-gray-400 absolute top-2 left-2 uppercase tracking-[0.2em]">Brand Logo</span>
                    <div className="flex flex-col items-center">
                       <div className="w-16 h-8 bg-black rounded-full flex items-center justify-center text-white text-[8px] font-black uppercase tracking-tighter">STREET FACE</div>
                       <span className="text-[5px] font-black uppercase tracking-[0.3em] mt-1">clothing.co</span>
                    </div>
                  </div>
                  <div className="border-r border-black p-2 flex flex-col relative group">
                    <span className="text-[6px] font-black text-gray-400 mb-1 uppercase tracking-widest">Project Name:</span>
                    <span className="text-[11px] font-black leading-none group-hover:text-violet-600">FIRE HUSTLE 1995<br/>Short pants</span>
                  </div>
                  <div className="border-r border-black p-2 flex flex-col relative">
                    <span className="text-[6px] font-black text-gray-400 mb-1 uppercase tracking-widest">Fabric:</span>
                    <span className="text-[10px] font-black leading-none">HEAVY COTTON<br/>20S</span>
                  </div>
                  <div className="p-2 flex flex-col relative border-r-0">
                    <span className="text-[6px] font-black text-gray-400 mb-1 uppercase tracking-widest">Category:</span>
                    <span className="text-[10px] font-black">TOP</span>
                  </div>
                </div>

                <div className="grid grid-cols-[1.2fr_1.5fr_1.2fr_1.2fr] h-14">
                  <div className="border-r border-black p-2 flex flex-col relative">
                    <span className="text-[6px] font-black text-gray-400 mb-0.5 uppercase tracking-widest">Color:</span>
                    <span className="text-[9px] font-black">WHITE, GREEN</span>
                  </div>
                  <div className="border-r border-black p-2 flex flex-col relative">
                    <span className="text-[6px] font-black text-gray-400 mb-0.5 uppercase tracking-widest">Date:</span>
                    <span className="text-[9px] font-black">JULY 2024</span>
                  </div>
                  <div className="border-r border-black p-2 flex flex-col relative">
                    <span className="text-[6px] font-black text-gray-400 mb-0.5 uppercase tracking-widest">Size Range:</span>
                    <span className="text-[9px] font-black">L - XXL</span>
                  </div>
                  <div className="bg-gray-50 flex items-center justify-center p-2 text-[6px] text-gray-300 font-mono">CONFIDENTIAL_DOC.X</div>
                </div>
              </div>

              {/* 1:1 TECHNICAL PAGE — MATCHES REFERENCE LAYOUT */}
              <div className="relative bg-[#FCFBFF] py-10 px-6 overflow-visible">
                 <div className="absolute inset-0 blueprint-lattice pointer-events-none opacity-40" />
                 
                 <div className="relative z-10 flex gap-4">
                    
                    {/* LEFT COLUMN: COLOR SWATCHES */}
                    <div className="flex flex-col gap-4 pt-6 shrink-0 w-[90px]">
                       <span className="text-[8px] font-black uppercase text-black tracking-widest leading-tight">COLOR<br/>SWATCHES</span>
                       <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                             <div className="w-6 h-6 bg-[#D4DF72] border border-black shrink-0" />
                          </div>
                          <span className="text-[7px] font-black uppercase">CMYK: 21 0 85 7</span>
                       </div>
                       <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                             <div className="w-6 h-6 bg-white border border-black shrink-0" />
                          </div>
                          <span className="text-[7px] font-black uppercase">CMYK: 0 0 0 0</span>
                       </div>
                    </div>

                    {/* CENTER COLUMN: MAIN ELEVATIONS */}
                    <div className="flex flex-col gap-10 flex-1">
                       
                       {/* BACK VIEW — TOP */}
                       <div className="flex gap-6 items-start">
                          <div className="flex flex-col items-center flex-1">
                             <span className="text-[9px] font-black uppercase text-black mb-3 tracking-widest">BACK VIEW</span>
                             <div className="w-full max-w-[420px] aspect-square relative">
                                <DesignCanvas
                                   elements={elements} selectedId={selectedId} onSelectElement={setSelectedId}
                                   onMoveElement={handleMoveElement} onResizeElement={handleResizeElement}
                                   onPushHistory={() => pushHistory(elements)} onDropImage={handleDropImage}
                                   side="back" tshirtColor={tshirtColor}
                                />
                             </div>
                          </div>
                          {/* BACK VIEW EXTRACT — small square */}
                          <div className="flex flex-col items-center shrink-0 pt-8">
                             <span className="text-[7px] font-black uppercase text-black mb-2 tracking-widest">BACK VIEW</span>
                             <div className="w-[160px] h-[160px] bg-white border border-black relative">
                                <Image src="/mockups/user_tshirt_back.png" alt="Back extract" fill style={{objectFit:'contain'}} />
                             </div>
                          </div>
                       </div>

                       {/* FRONT VIEW + SIDE VIEW — BOTTOM */}
                       <div className="flex gap-6 items-end">
                          {/* SIDE VIEW — small rectangle at left */}
                          <div className="flex flex-col items-center shrink-0 pb-4">
                             <span className="text-[7px] font-black uppercase text-black mb-2 tracking-widest">SIDE VIEW</span>
                             <div className="w-[90px] h-[160px] bg-white border border-black relative">
                                <Image src="/mockups/user_tshirt_front.png" alt="Side view" fill style={{objectFit:'contain'}} />
                             </div>
                          </div>

                          {/* FRONT VIEW — main large */}
                          <div className="flex flex-col items-center flex-1">
                             <span className="text-[9px] font-black uppercase text-black mb-3 tracking-widest">FRONT VIEW</span>
                             <div className="w-full max-w-[420px] aspect-square relative">
                                <DesignCanvas
                                   elements={elements} selectedId={selectedId} onSelectElement={setSelectedId}
                                   onMoveElement={handleMoveElement} onResizeElement={handleResizeElement}
                                   onPushHistory={() => pushHistory(elements)} onDropImage={handleDropImage}
                                   side="front" tshirtColor={tshirtColor}
                                />
                             </div>
                          </div>

                          {/* FRONT DETAIL — small square at right */}
                          <div className="flex flex-col items-center shrink-0 pb-4">
                             <span className="text-[7px] font-black uppercase text-black mb-2 tracking-widest">FRONT VIEW</span>
                             <div className="w-[130px] h-[130px] bg-white border border-black relative">
                                <Image src="/mockups/user_tshirt_front.png" alt="Front extract" fill style={{objectFit:'contain'}} />
                             </div>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </section>

        {/* ─── SIDEBAR (RIGHT) ─── */}
        <aside className="w-96 h-full bg-white border-l border-gray-100 flex flex-col shadow-xl z-40 overflow-hidden">
           <div className="flex bg-gray-50 p-1">
              {([
                { id: "ai", icon: Zap, label: "AI" },
                { id: "assets", icon: ImageIcon, label: "Guide" },
                { id: "color", icon: PaletteIcon, label: "Palette" },
                { id: "layers", icon: LayersIcon, label: "List" }
              ] as const).map((t) => (
                <button
                  key={t.id} onClick={() => setActiveTab(t.id)}
                  className={`flex-1 flex flex-col items-center py-2.5 rounded-lg transition-all ${activeTab === t.id ? 'bg-white text-violet-600 shadow-sm' : 'text-gray-400 hover:bg-gray-100 hover:text-black'}`}
                  title={t.label} aria-label={t.label}
                >
                  <t.icon size={16} />
                  <span className="text-[8px] font-black mt-1 uppercase tracking-tighter">{t.label}</span>
                </button>
              ))}
           </div>

           <div className="flex-1 overflow-y-auto scrollbar-hide p-4 bg-[#F8F9FA]">
              {activeTab === "ai" && (
                 <div className="space-y-6">
                    <div className="p-6 bg-black rounded-3xl text-white relative overflow-hidden group">
                       <span className="text-[8px] font-black uppercase tracking-[0.4em] text-violet-400">Gen-V4 Protocol</span>
                       <p className="text-[10px] text-gray-500 mt-2 font-medium">Precision industrial asset generation engaged.</p>
                       <Zap className="absolute -right-4 -bottom-4 w-24 h-24 text-white/5 group-hover:text-violet-600/20 transition-all duration-1000" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                       {messages.filter(m => m.role === "ai").flatMap(m => m.images || []).map((img) => (
                          <button key={img.id} onClick={() => handleDropImage(img, 120, 150)} className="group relative aspect-square bg-white border border-gray-100 rounded-2xl overflow-hidden hover:scale-105 transition-all shadow-sm" title={`Add ${img.label}`}>
                             <Image src={img.url} alt={img.label} width={200} height={200} unoptimized className="w-full h-full object-cover grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all" />
                             <div className="absolute inset-0 bg-violet-600/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><Plus size={20} className="text-white shadow-lg" /></div>
                          </button>
                       ))}
                    </div>

                    <div className="relative mt-8">
                       <input 
                          value={chatInput} onChange={(e) => setChatInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && chatInput.trim() && (handleSendMessage(chatInput.trim()), setChatInput(""))}
                          placeholder="Synthesize design..." 
                          className="w-full bg-white border-2 border-transparent focus:border-violet-600 rounded-2xl px-5 py-3 text-[11px] shadow-sm outline-none transition-all" />
                       <button onClick={() => chatInput.trim() && (handleSendMessage(chatInput.trim()), setChatInput(""))} disabled={isLoading} className="absolute right-2 top-2 w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg" title="Synthesize"><Zap size={14} /></button>
                    </div>
                 </div>
              )}

              {activeTab === "assets" && (
                 /* IMAGE 2 ACCURATE FONT PAIRING GUIDE SIDEBAR */
                 <div className="bg-[#f0f0f0] rounded-[2.5rem] border border-gray-200 p-6 shadow-inner flex flex-col h-[750px] animate-in fade-in zoom-in-95 duration-500 overflow-hidden">
                    <div className="flex items-center justify-between gap-3 mb-8">
                       <div className="w-10 h-6 border-[1.5px] border-black rounded-full flex items-center justify-center text-[8px] font-black bg-white">000</div>
                       <div className="flex-1 h-px border-t border-dashed border-black/20" />
                       <div className="px-5 py-1.5 border-[1.5px] border-black rounded-full text-[10px] font-black uppercase tracking-widest bg-white">FONT PAIRING GUIDE</div>
                       <div className="flex-1 h-px border-t border-dashed border-black/20" />
                       <div className="w-10 h-6 border-[1.5px] border-black rounded-full flex items-center justify-center text-[8px] font-black bg-white">000</div>
                    </div>

                    <p className="text-[7.5px] font-black uppercase text-center mb-10 tracking-[0.1em] text-gray-500 leading-relaxed px-6">
                       AND REMEMBER THAT EVEN WITH THE BEST INSTRUCTIONS<br/>YOU ALWAYS HAVE TO LEARN ON THE GO
                    </p>

                    <div className="flex-1 overflow-y-auto scrollbar-hide space-y-16 pb-12">
                       <div className="grid grid-cols-2 gap-8 items-end px-2">
                          <button onClick={() => handleAddText("Font", "Cormorant Garamond")} className="text-left group cursor-pointer" title="Add Font Design">
                             <div className="text-[52px] font-serif italic leading-[0.7] group-hover:text-violet-600 transition-colors">Font</div>
                             <div className="text-[9px] font-black uppercase tracking-[0.2em] mt-2 border-t border-black pt-1">PAIRING + GUIDE</div>
                          </button>
                          <button onClick={() => handleAddText("Get Ready", "Permanent Marker")} className="text-right group cursor-pointer flex flex-col items-end" title="Add Get Ready Design">
                             <span className="text-[7px] font-black uppercase tracking-tighter opacity-40 mb-1">ALL TICKETS AVAILABLE</span>
                             <div className="text-[38px] font-marker leading-none -rotate-2 group-hover:text-violet-600 transition-colors">Get Ready</div>
                          </button>
                       </div>

                       <div className="grid grid-cols-2 gap-8 items-center border-y border-dashed border-black/20 py-12 px-2">
                          <button onClick={() => handleAddText("BROKEN HEART", "Space Grotesk")} className="text-left group cursor-pointer flex flex-col" title="Add Broken Heart Design">
                             <div className="text-[28px] font-black tracking-tighter leading-none group-hover:text-violet-600 transition-colors">BROKEN</div>
                             <div className="flex items-center gap-1 my-1.5"><div className="h-px flex-1 bg-black"/><span className="text-[6px] font-black">W / S 2025</span><div className="h-px flex-1 bg-black"/></div>
                             <div className="text-[32px] font-black tracking-tighter leading-none group-hover:text-violet-600 transition-colors">HEART</div>
                          </button>
                          <button onClick={() => handleAddText("MILK & HONEY", "Space Grotesk")} className="text-right group cursor-pointer flex flex-col items-end" title="Add Milk & Honey Design">
                             <div className="text-[42px] font-black leading-[0.8] tracking-tighter group-hover:text-violet-600 transition-colors">MILK</div>
                             <div className="text-[38px] font-black leading-[0.8] tracking-tighter group-hover:text-violet-600 transition-colors">& HONEY</div>
                          </button>
                       </div>

                       <div className="grid grid-cols-2 gap-8 items-end px-2">
                          <button onClick={() => handleAddText("Learn", "Cormorant Garamond")} className="text-left group cursor-pointer flex flex-col" title="Add Learn Design">
                             <div className="text-[48px] font-serif italic leading-none group-hover:text-violet-600 transition-colors">Learn</div>
                             <div className="flex items-center gap-2 mt-[-8px]">
                                <span className="text-[12px] font-marker text-gray-400">free font</span>
                                <span className="text-[7px] font-black uppercase tracking-widest text-black">to Listen</span>
                             </div>
                          </button>
                          <button onClick={() => handleAddText("Weird", "Cormorant Garamond")} className="text-right group cursor-pointer flex flex-col items-end" title="Add Weird Design">
                             <div className="text-[52px] font-serif italic leading-none group-hover:text-violet-600 transition-colors">Weird</div>
                             <div className="text-[7px] font-black uppercase tracking-[0.1em] text-center mt-1">MAY 2025 PEOPLE RULE THE WORLD</div>
                          </button>
                       </div>

                       <div className="pt-10 border-t border-dashed border-black/20 flex flex-col items-center gap-6">
                           <div className="flex gap-8 items-center w-full px-2">
                              <div className="w-20 h-20 border-2 border-black bg-white flex items-center justify-center p-1.5 grayscale shrink-0">
                                 <div className="w-full h-full bg-black grid grid-cols-5 grid-rows-5 gap-0.5 p-0.5 opacity-80">
                                    {Array.from({length: 25}).map((_, i) => (<div key={i} className={`bg-white ${(i % 3 === 0 || i % 4 === 1) ? 'opacity-100' : 'opacity-0'}`} />))}
                                 </div>
                              </div>
                              <div className="flex-1 flex flex-col gap-3">
                                 <div className="px-6 py-2 border-[1.5px] border-black rounded-full text-[9px] font-black uppercase bg-white text-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">MADE BY AMTAKETHAT</div>
                                 <div className="w-full flex items-center justify-center gap-2">
                                    <div className="flex-1 h-px border-t border-dashed border-black/20" />
                                    <span className="text-[8px] font-black uppercase tracking-widest px-3 border border-black rounded-full bg-white">MAY</span>
                                    <div className="flex-1 h-px border-t border-dashed border-black/20" />
                                 </div>
                              </div>
                           </div>
                       </div>
                    </div>
                 </div>
              )}

              {activeTab === "layers" && (
                <div className="space-y-3 animate-in fade-in duration-300">
                   {elements.length === 0 ? (
                      <div className="py-20 text-center opacity-10"><LayersIcon size={32} className="mx-auto" /><p className="text-[8px] font-black uppercase mt-4">Empty stack</p></div>
                   ) : (
                      <div className="space-y-2">
                        {elements.slice().reverse().map((el) => (
                           <div key={el.id} className={`flex items-center gap-3 p-3 rounded-2xl bg-white border transition-all ${selectedId === el.id ? 'border-violet-600 ring-4 ring-violet-50' : 'border-gray-50 hover:border-gray-100'}`}>
                              <div className="flex-1 min-w-0" onClick={() => setSelectedId(el.id)}>
                                 <div className="text-[9px] font-black uppercase truncate">{el.label || el.text}</div>
                                 <div className="text-[7px] font-mono text-gray-400 uppercase">{el.type} / {el.side}</div>
                              </div>
                              <button onClick={() => setElements(prev => prev.filter(item => item.id !== el.id))} className="p-2 text-gray-300 hover:text-red-500 transition-colors" title="Delete Layer" aria-label="Delete Layer"><Trash2 size={14}/></button>
                           </div>
                        ))}
                      </div>
                   )}
                </div>
              )}
           </div>
        </aside>
      </main>

      <style jsx global>{`
        .blueprint-lattice {
          background-image: radial-gradient(#FBCFE8 1.5px, transparent 1.5px);
          background-size: 20px 20px;
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .design-element-layer {
          left: var(--target-x); top: var(--target-y); width: var(--target-w); height: var(--target-h); transform: rotate(var(--target-rot));
        }
        .design-text-element { font-size: var(--text-size); font-family: var(--text-font); font-weight: var(--text-weight); color: var(--text-color); }
        .palette-swatch { background-color: var(--swatch-bg); }
      `}</style>
    </div>
  );
}
