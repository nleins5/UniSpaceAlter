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
  side: "front" | "back" | "side";
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
  const imgSrc = isFront ? "/mockups/user_tshirt_front.png" : "/mockups/user_tshirt_back.png";
  const isWhite = color === "#FFFFFF" || color === "#ffffff" || color === "#F2F0E9";
  return (
    <div className="w-full h-full relative">
      {/* Color layer masked to shirt silhouette — never bleeds onto grid */}
      {!isWhite && (
        <div className="absolute inset-0" style={{
          backgroundColor: color,
          WebkitMaskImage: `url(${imgSrc})`,
          maskImage: `url(${imgSrc})`,
          WebkitMaskSize: 'contain',
          maskSize: 'contain' as string,
          WebkitMaskRepeat: 'no-repeat',
          maskRepeat: 'no-repeat' as string,
          WebkitMaskPosition: 'center',
          maskPosition: 'center' as string,
          opacity: 0.5
        }} />
      )}
      <Image 
        src={imgSrc}
        alt={`Shirt ${side}`} 
        fill
        priority
        className={`relative z-10 object-contain ${isWhite ? '' : 'mix-blend-multiply'}`}
      />
    </div>
  );
}

// ─── Component: MiniPreview (droppable thumbnail, shows components only) ─────
function MiniPreview({ elements, side, width, height, onDropImage }: {
  elements: DesignElement[];
  side: "front" | "back" | "side";
  width: number;
  height: number;
  onDropImage?: (image: AIImage, x: number, y: number, targetSide: "front" | "back" | "side") => void;
}) {
  const sideElements = elements.filter(el => el.side === side);
  const [isDropTarget, setIsDropTarget] = React.useState(false);

  const handleDrop = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDropTarget(false);
    if (!onDropImage) return;
    const data = e.dataTransfer.getData('application/json');
    if (!data) return;
    try {
      const image: AIImage = JSON.parse(data);
      // Front/Back → original positions; Side → independent
      const dropX = side === 'back' ? 245 : side === 'side' ? 220 : 220;
      const dropY = side === 'back' ? 70 : 100;
      onDropImage(image, dropX, dropY, side);
    } catch (err) { console.error(err); }
  }, [onDropImage, side]);

  return (
    <div 
      ref={(el) => { if (el) { el.style.setProperty('width', `${width}px`); el.style.setProperty('height', `${height}px`); }}}
      className={`relative overflow-hidden border transition-all cursor-pointer ${
        isDropTarget ? 'border-violet-400 ring-2 ring-violet-300 bg-violet-900/20' : 'border-gray-300 bg-[#1A1A1A]'
      }`}
      onDragOver={(e) => { e.preventDefault(); setIsDropTarget(true); }}
      onDragLeave={() => setIsDropTarget(false)}
      onDrop={handleDrop}
    >
      {/* Show dropped elements full-bleed */}
      {sideElements.length > 0 ? (
        sideElements.map((el) => (
          <div key={el.id} className="absolute inset-0">
            {el.type === 'image' && el.url && (
              <Image src={el.url} alt={el.label || ''} fill className="object-cover" unoptimized />
            )}
            {el.type === 'text' && (
              <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">{el.text}</div>
            )}
          </div>
        ))
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-600 text-[8px] uppercase tracking-widest">Drop</div>
      )}
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
  onDropText?: (text: string, font: string, weight: number, x: number, y: number) => void;
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
  onDropText,
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
      const rect = canvasRef.current!.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 400 - 50;
      const y = ((e.clientY - rect.top) / rect.height) * 480 - 50;

      // Check for any drag data
      const data = e.dataTransfer.getData("application/json");
      if (!data) return;
      try {
        const parsed = JSON.parse(data);
        if (parsed.dragType === 'font' && onDropText) {
          onDropText(parsed.text, parsed.font, parsed.weight, x, y);
        } else {
          // Image drop
          onDropImage(parsed, x, y);
        }
      } catch (err) { console.error(err); }
    },
    [onDropImage, onDropText]
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
      <div className="absolute inset-0 pointer-events-none">
        <TShirtSVG color={tshirtColor} side={side} />
      </div>
      
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
    <div ref={ref} className={`absolute design-element-layer z-20 ${el.type === 'text' ? 'design-element-text' : ''}`}>
      <div
        className={`w-full h-full relative cursor-move ${selectedId === el.id ? "ring-2 ring-violet-500" : ""}`}
        onMouseDown={(e) => onMouseDown(e, el)}
      >
        {el.type === "image" && el.url && (
          <Image src={el.url} alt={el.label} width={400} height={400} unoptimized className="w-full h-full object-contain pointer-events-none" />
        )}
        {el.type === "text" && <div ref={textRef} className="whitespace-nowrap design-text-element pointer-events-none select-none">{el.text}</div>}
        
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
         { id: 'h1', url: '/mockups/ai_streetart.png', label: 'STREET_2025' },
         { id: 'h2', url: '/mockups/ai_kawaii.png', label: 'KAWAII_CREW' },
         { id: 'h3', url: '/mockups/ai_squad.png', label: 'ANIME_SQUAD' },
         { id: 'h4', url: '/mockups/ai_cosmic.png', label: 'COSMIC_VIBE' }
      ]
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [historyStack, setHistoryStack] = useState<DesignElement[][]>([]);
  const [redoStack, setRedoStack] = useState<DesignElement[][]>([]);
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [fontPreviewText, setFontPreviewText] = useState("");

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

  // Delete selected element
  const handleDeleteSelected = useCallback(() => {
    if (!selectedId) return;
    pushHistory(elements);
    setElements(prev => prev.filter(el => el.id !== selectedId));
    setSelectedId(null);
  }, [selectedId, elements, pushHistory]);

  // Keyboard: Delete/Backspace to remove selected
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
        e.preventDefault();
        handleDeleteSelected();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleDeleteSelected]);

  // Trackpad: pinch-to-zoom + two-finger-scroll-to-pan (Canva style)
  const blueprintRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = blueprintRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        // Pinch zoom
        e.preventDefault();
        setZoom(z => Math.min(3, Math.max(0.3, z - e.deltaY * 0.005)));
      } else {
        // Two-finger scroll → pan
        e.preventDefault();
        setPanX(x => x - e.deltaX);
        setPanY(y => y - e.deltaY);
      }
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, []);

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

  // Drop image to a specific side (used by MiniPreview thumbnails)
  const handleDropImageToSide = useCallback((image: AIImage, x: number, y: number, targetSide: "front" | "back" | "side", size = 160) => {
    setElements(prev => {
      pushHistory(prev);
      return [...prev, {
        id: `el-${Date.now()}`, type: "image", label: image.label, url: image.url, 
        x, y, width: size, height: size, rotation: 0, side: targetSide, locked: false
      }];
    });
  }, [pushHistory]);

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

  // Drop text from font guide onto canvas at specific position
  const handleDropText = useCallback((text: string, font: string, weight: number, x: number, y: number) => {
    setElements(prev => {
      pushHistory(prev);
      return [...prev, {
        id: `el-${Date.now()}`, type: "text", label: "Type Artifact", text,
        fontSize: 32, fontFamily: font, fontWeight: String(weight), textColor: "#000000",
        x, y, width: 200, height: 60, rotation: 0, side, locked: false
      }];
    });
  }, [side, pushHistory]);

  // Side-specific text drop handlers for each canvas
  const handleDropTextFront = useCallback((text: string, font: string, weight: number, x: number, y: number) => {
    setElements(prev => {
      pushHistory(prev);
      return [...prev, {
        id: `el-${Date.now()}`, type: "text", label: "Type Artifact", text,
        fontSize: 32, fontFamily: font, fontWeight: String(weight), textColor: "#000000",
        x, y, width: 200, height: 60, rotation: 0, side: 'front' as const, locked: false
      }];
    });
  }, [pushHistory]);

  const handleDropTextBack = useCallback((text: string, font: string, weight: number, x: number, y: number) => {
    setElements(prev => {
      pushHistory(prev);
      return [...prev, {
        id: `el-${Date.now()}`, type: "text", label: "Type Artifact", text,
        fontSize: 32, fontFamily: font, fontWeight: String(weight), textColor: "#000000",
        x, y, width: 200, height: 60, rotation: 0, side: 'back' as const, locked: false
      }];
    });
  }, [pushHistory]);

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
          <div ref={blueprintRef} className="flex-1 relative overflow-hidden">
            <div className="absolute inset-0 blueprint-lattice pointer-events-none opacity-50" />

            <div className="relative h-full flex p-3" onDragOver={(e) => e.preventDefault()} style={{ transform: `scale(${zoom}) translate(${panX / zoom}px, ${panY / zoom}px)`, transformOrigin: 'center center', transition: 'transform 0.05s ease-out' }}>

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
                        onPushHistory={() => pushHistory(elements)} onDropImage={handleDropImage} onDropText={handleDropTextBack}
                        side="back" tshirtColor={tshirtColor}
                      />
                    </div>
                  </div>
                  {/* Back extract thumbnail — LIVE PREVIEW */}
                  <div className="flex flex-col items-center shrink-0 pt-4">
                    <span className="text-[5px] font-black uppercase text-gray-400 mb-1 tracking-widest">BACK VIEW</span>
                    <MiniPreview elements={elements} side="back" width={100} height={100} onDropImage={handleDropImageToSide} />
                  </div>
                </div>

                {/* ROW 2: FRONT VIEW */}
                <div className="h-[50%] flex gap-3 items-end overflow-hidden">
                  {/* Logo upload */}
                  <div className="flex flex-col items-center shrink-0 self-end">
                    <span className="text-[5px] font-black uppercase text-gray-400 mb-1 tracking-widest">LOGO</span>
                    <label className="relative overflow-hidden border border-dashed border-gray-400 bg-[#1A1A1A] hover:border-violet-400 hover:bg-violet-900/10 transition-all cursor-pointer flex items-center justify-center w-[55px] h-[90px]">
                      {elements.filter(el => el.side === 'side').length > 0 ? (
                        <Image src={elements.filter(el => el.side === 'side')[0].url || ''} alt="Logo" fill className="object-contain p-1" unoptimized />
                      ) : (
                        <div className="flex flex-col items-center gap-1">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                          <span className="text-[6px] text-gray-500 uppercase tracking-wider">Upload</span>
                        </div>
                      )}
                      <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          const dataUrl = ev.target?.result as string;
                          handleDropImageToSide({ id: `logo-${Date.now()}`, url: dataUrl, label: 'LOGO' }, 300, 70, 'front', 80);
                          // Also store in 'side' for thumbnail preview
                          setElements(prev => [...prev, { id: `logo-thumb-${Date.now()}`, type: 'image', label: 'LOGO', url: dataUrl, x: 0, y: 0, width: 55, height: 90, rotation: 0, side: 'side' as const, locked: false }]);
                        };
                        reader.readAsDataURL(file);
                      }} />
                    </label>
                  </div>
                  {/* Front shirt */}
                  <div className="flex flex-col items-center h-full min-h-0 flex-1 min-w-0">
                    <span className="text-[7px] font-black uppercase text-black tracking-widest mb-1 shrink-0">FRONT VIEW</span>
                    <div className="flex-1 w-full min-h-0 relative">
                      <DesignCanvas
                        elements={elements} selectedId={selectedId} onSelectElement={setSelectedId}
                        onMoveElement={handleMoveElement} onResizeElement={handleResizeElement}
                        onPushHistory={() => pushHistory(elements)} onDropImage={handleDropImage} onDropText={handleDropTextFront}
                        side="front" tshirtColor={tshirtColor}
                      />
                    </div>
                  </div>
                  {/* Front extract thumbnail — LIVE PREVIEW */}
                  <div className="flex flex-col items-center shrink-0 self-end">
                    <span className="text-[5px] font-black uppercase text-gray-400 mb-1 tracking-widest">FRONT VIEW</span>
                    <MiniPreview elements={elements} side="front" width={80} height={80} onDropImage={handleDropImageToSide} />
                  </div>
                </div>

              </div>
            </div>

            {/* Zoom controls + Delete — bottom right of blueprint */}
            <div className="absolute bottom-3 right-3 flex items-center gap-1 z-30">
              {selectedId && (
                <button onClick={handleDeleteSelected} className="w-8 h-8 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center justify-center shadow-lg transition-all" title="Delete selected (Del)">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
              )}
              <button onClick={() => setZoom(z => Math.max(0.3, z - 0.1))} className="w-8 h-8 bg-black/80 hover:bg-black text-white rounded-lg flex items-center justify-center shadow-lg text-sm font-bold transition-all">−</button>
              <span className="text-[10px] font-mono text-black bg-white/80 px-2 py-1 rounded-lg shadow min-w-[40px] text-center">{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom(z => Math.min(3, z + 0.1))} className="w-8 h-8 bg-black/80 hover:bg-black text-white rounded-lg flex items-center justify-center shadow-lg text-sm font-bold transition-all">+</button>
              <button onClick={() => { setZoom(1); setPanX(0); setPanY(0); }} className="w-8 h-8 bg-black/80 hover:bg-black text-white rounded-lg flex items-center justify-center shadow-lg transition-all" title="Reset zoom & pan">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>
              </button>
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

                {/* Editable text input */}
                <div className="flex flex-col gap-1">
                  <span className="text-[7px] font-black uppercase tracking-widest text-gray-400">TYPE YOUR TEXT</span>
                  <input
                    type="text"
                    value={fontPreviewText}
                    onChange={(e) => setFontPreviewText(e.target.value)}
                    placeholder="Type here..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400 bg-gray-50"
                  />
                </div>

                <p className="text-[7px] font-black uppercase text-center tracking-widest text-gray-400">DRAG ANY STYLE ONTO THE SHIRT</p>

                {/* Draggable font samples */}
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { text: fontPreviewText || "Font", font: "Cormorant Garamond", style: "text-[42px] font-serif italic leading-none", weight: 400 },
                    { text: fontPreviewText || "Get Ready", font: "Impact", style: "text-[28px] font-black -rotate-2 leading-none", weight: 900 },
                    { text: fontPreviewText || "BROKEN HEART", font: "Space Grotesk", style: "text-[22px] font-black tracking-tight leading-none", weight: 900 },
                    { text: fontPreviewText || "MILK &HONEY", font: "Space Grotesk", style: "text-[22px] font-black tracking-tight leading-none text-right", weight: 900 },
                    { text: fontPreviewText || "Learn", font: "Cormorant Garamond", style: "text-[38px] font-serif italic leading-none", weight: 400 },
                    { text: fontPreviewText || "Weird", font: "Cormorant Garamond", style: "text-[38px] font-serif italic leading-none text-right", weight: 400 },
                  ].map((item, i) => (
                    <div
                      key={i}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.effectAllowed = 'copy';
                        e.dataTransfer.setData('application/json', JSON.stringify({
                          dragType: 'font', text: item.text, font: item.font, weight: item.weight
                        }));
                      }}
                      onClick={() => handleAddText(item.text, item.font)}
                      className={`group cursor-grab active:cursor-grabbing hover:bg-violet-50 p-2 rounded-xl transition-all border border-transparent hover:border-violet-200 ${i % 2 === 0 ? 'text-left' : 'text-right'}`}
                    >
                      <div className={`${item.style} group-hover:text-violet-600 transition-colors`}>{item.text}</div>
                      {i === 0 && <div className="text-[7px] font-black uppercase tracking-wide border-t border-black pt-1">PAIRING + GUIDE</div>}
                    </div>
                  ))}
                </div>

                {/* Draggable font tags */}
                <div className="flex flex-wrap gap-2">
                  {["Cormorant Garamond", "Space Grotesk", "Impact", "Sora", "Fira Code", "Instrument Serif"].map(font => (
                    <div
                      key={font}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.effectAllowed = 'copy';
                        e.dataTransfer.setData('application/json', JSON.stringify({
                          dragType: 'font', text: fontPreviewText || font, font, weight: 700
                        }));
                      }}
                      onClick={() => handleAddText(fontPreviewText || font, font)}
                      className="px-3 py-1.5 border border-gray-200 rounded-full text-[8px] font-black uppercase cursor-grab active:cursor-grabbing hover:bg-violet-50 hover:border-violet-300 transition-all"
                      style={{ fontFamily: font }}
                    >
                      {font}
                    </div>
                  ))}
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
        .design-element-text { width: auto !important; height: auto !important; }
      `}</style>
    </div>
  );
}

