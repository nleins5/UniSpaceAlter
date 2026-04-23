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
      // Only text elements are draggable; images stay fixed
      if (el.locked || el.type !== 'text') return;
      const rect = canvasRef.current!.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
      setDragOffset({
        x: (clientX - rect.left) / (rect.width / 400) - el.x,
        y: (clientY - rect.top) / (rect.height / 480) - el.y,
      });
      setIsDragging(true);

      const handleMouseUp = () => {
        setIsDragging(false);
        document.removeEventListener('mouseup', handleMouseUp);
      };
      document.addEventListener('mouseup', handleMouseUp);
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
    <div
      ref={ref}
      className={`absolute design-element-layer z-20 ${el.type === 'text' ? 'design-element-text cursor-move' : 'cursor-default'} ${selectedId === el.id ? 'ring-2 ring-violet-500' : ''}`}
      onMouseDown={(e) => onMouseDown(e, el)}
    >
      {el.type === "image" && el.url && (
        <div className="w-full h-full relative">
          <Image src={el.url} alt={el.label} width={400} height={400} unoptimized className="w-full h-full object-contain pointer-events-none" />
        </div>
      )}
      {el.type === "text" && <div ref={textRef} className="whitespace-nowrap design-text-element select-none pointer-events-none">{el.text}</div>}

      {selectedId === el.id && !isDragging && (
        <div
          className="absolute -right-2 -bottom-2 w-4 h-4 bg-violet-600 rounded-full border-2 border-white cursor-nwse-resize shadow-lg z-50"
          onMouseDown={(e) => { e.stopPropagation(); onResizeMouseDown(e, el); }}
        />
      )}
    </div>
  );
}

// ─── Main Design Page ──────────────────────────────────────────
export default function DesignPage() {
  const [activeTab, setActiveTab] = useState<"ai" | "assets" | "type" | "color" | "layers" | null>(null);
  const [side, setSide] = useState<"front" | "back" | "side">("front");
  const [garmentType, setGarmentType] = useState<'T-SHIRT' | 'RAGLAN' | 'POLO'>('RAGLAN');
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
  const [isExporting, setIsExporting] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [projectName, setProjectName] = useState('VARSITY PRO JERSEY REV 1');
  const [orderInfo, setOrderInfo] = useState({
    name: '', phone: '', address: '', className: '', note: '',
    sizes: { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0 }
  });
  const frontCanvasRef = useRef<HTMLDivElement>(null);
  const backCanvasRef = useRef<HTMLDivElement>(null);

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
        x: 200, y: 200, width: 200, height: 60, rotation: 0, side, locked: false
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

  // Export: render front+back as separate PNGs using Canvas API
  const handleExportPack = useCallback(async (order: typeof orderInfo) => {
    setIsExporting(true);
    setShowOrderModal(false);
    try {
      // Helper: load image from URL
      const loadImg = (src: string): Promise<HTMLImageElement> => new Promise((resolve, reject) => {
        const img = new window.Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });

      // Get actual rendered size of the design canvas to compute correct scale
      const frontRect = frontCanvasRef.current?.getBoundingClientRect()
        ?? { width: 400, height: 480 };
      const backRect = backCanvasRef.current?.getBoundingClientRect()
        ?? { width: 400, height: 480 };

      // Export canvas: same 5:6 aspect ratio as virtual coord space 400×480
      const EXPORT_W = 800, EXPORT_H = 960;

      const renderSideCanvas = async (sideName: 'front' | 'back'): Promise<HTMLCanvasElement> => {
        const c = document.createElement('canvas');
        c.width = EXPORT_W; c.height = EXPORT_H;
        const ctx = c.getContext('2d')!;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, EXPORT_W, EXPORT_H);

        // Draw shirt mockup with object-contain inside 800×960
        const shirtSrc = sideName === 'front' ? '/mockups/user_tshirt_front.png' : '/mockups/user_tshirt_back.png';
        try {
          const shirtImg = await loadImg(shirtSrc);
          const imgRatio = shirtImg.width / shirtImg.height;
          const canvasRatio = EXPORT_W / EXPORT_H;
          let drawW = EXPORT_W, drawH = EXPORT_H, drawX = 0, drawY = 0;
          if (imgRatio > canvasRatio) {
            drawH = EXPORT_W / imgRatio;
            drawY = (EXPORT_H - drawH) / 2;
          } else {
            drawW = EXPORT_H * imgRatio;
            drawX = (EXPORT_W - drawW) / 2;
          }
          // Layer 1: draw shirt PNG normally (preserves collar, outline details)
          ctx.globalCompositeOperation = 'source-over';
          ctx.drawImage(shirtImg, drawX, drawY, drawW, drawH);

          // Layer 2: color overlay with multiply blend — matches CSS mix-blend-mode: multiply
          if (tshirtColor !== '#FFFFFF' && tshirtColor !== '#ffffff') {
            ctx.globalCompositeOperation = 'multiply';
            ctx.fillStyle = tshirtColor;

            // Tint only the shirt silhouette using a temp offscreen canvas
            const tmpCanvas = document.createElement('canvas');
            tmpCanvas.width = EXPORT_W; tmpCanvas.height = EXPORT_H;
            const tmpCtx = tmpCanvas.getContext('2d')!;
            tmpCtx.fillStyle = tshirtColor;
            tmpCtx.fillRect(drawX, drawY, drawW, drawH);
            tmpCtx.globalCompositeOperation = 'destination-in';
            tmpCtx.drawImage(shirtImg, drawX, drawY, drawW, drawH);

            ctx.globalCompositeOperation = 'multiply';
            ctx.drawImage(tmpCanvas, 0, 0);
            ctx.globalCompositeOperation = 'source-over';
          }
        } catch { /* shirt image not found */ }

        // Draw design elements — scale from screen px to export px
        // el.x/y are in virtual 400×480 units which approximate screen px
        const rect = sideName === 'front' ? frontRect : backRect;
        const scaleX = EXPORT_W / rect.width;
        const scaleY = EXPORT_H / rect.height;

        const sideElements = elements.filter(el => el.side === sideName);
        for (const el of sideElements) {
          const x = el.x * scaleX;
          const y = el.y * scaleY;
          // Use uniform scale for element box to prevent stretching
          const boxW = el.width * scaleX;
          const boxH = el.height * scaleY;

          if (el.type === 'image' && el.url) {
            try {
              const elImg = await loadImg(el.url);
              // Draw with object-contain to match CSS rendering in design studio
              const imgRatio = elImg.naturalWidth / elImg.naturalHeight;
              const boxRatio = boxW / boxH;
              let imgDrawW = boxW, imgDrawH = boxH, imgDrawX = x, imgDrawY = y;
              if (imgRatio > boxRatio) {
                imgDrawH = boxW / imgRatio;
                imgDrawY = y + (boxH - imgDrawH) / 2;
              } else {
                imgDrawW = boxH * imgRatio;
                imgDrawX = x + (boxW - imgDrawW) / 2;
              }
              ctx.drawImage(elImg, imgDrawX, imgDrawY, imgDrawW, imgDrawH);
            } catch { /* skip broken images */ }
          } else if (el.type === 'text' && el.text) {
            ctx.save();
            const fontSize = (el.fontSize || 32) * scaleX;
            const fontFamily = el.fontFamily || 'sans-serif';
            const fontWeight = el.fontWeight || '900';
            const fontStr = `${fontWeight} ${fontSize}px ${fontFamily}`;
            // Ensure font is loaded in canvas context
            try { await document.fonts.load(fontStr); } catch {/* ignore */}
            ctx.font = fontStr;
            ctx.fillStyle = el.textColor || '#000000';
            ctx.textBaseline = 'top'; // Match CSS top-based positioning
            // Word-wrap text to fit within element width
            const words = el.text.split(' ');
            let line = '';
            const lineHeight = fontSize * 1.2;
            let drawY = y;
            for (const word of words) {
              const testLine = line ? `${line} ${word}` : word;
              const testW = ctx.measureText(testLine).width;
              if (testW > boxW && line) {
                ctx.fillText(line, x, drawY);
                line = word;
                drawY += lineHeight;
              } else {
                line = testLine;
              }
            }
            if (line) ctx.fillText(line, x, drawY);
            ctx.textBaseline = 'alphabetic';
            ctx.restore();
          }
        }

        // Label
        ctx.fillStyle = '#aaa';
        ctx.font = '700 18px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(sideName === 'front' ? 'FRONT' : 'BACK', EXPORT_W / 2, EXPORT_H - 16);
        ctx.textAlign = 'start';
        return c;
      };

      const frontCanvas = await renderSideCanvas('front');
      const backCanvas = await renderSideCanvas('back');

      // Composite 1600×960 for local download
      const composite = document.createElement('canvas');
      composite.width = 1600; composite.height = 960;
      const compCtx = composite.getContext('2d')!;
      compCtx.drawImage(frontCanvas, 0, 0);
      compCtx.drawImage(backCanvas, 800, 0);
      compCtx.strokeStyle = '#ddd'; compCtx.lineWidth = 2;
      compCtx.beginPath(); compCtx.moveTo(800, 0); compCtx.lineTo(800, 960); compCtx.stroke();

      // Download composite locally
      const link = document.createElement('a');
      link.download = `unispace-design-${Date.now()}.png`;
      link.href = composite.toDataURL('image/png');
      link.click();

      // Convert each side to blob and submit
      const toBlob = (cvs: HTMLCanvasElement): Promise<Blob> => new Promise(res => cvs.toBlob(b => res(b!), 'image/png'));
      const frontBlob = await toBlob(frontCanvas);
      const backBlob = await toBlob(backCanvas);

      const fd = new FormData();
      fd.append('frontDesign', frontBlob, 'front_design.png');
      fd.append('backDesign', backBlob, 'back_design.png');
      fd.append('elements', JSON.stringify(elements));
      fd.append('tshirtColor', tshirtColor);
      fd.append('orderInfo', JSON.stringify(order));
      await fetch('/api/submit-design', { method: 'POST', body: fd });
      alert('✅ Thiết kế và đơn hàng đã gửi cho admin!');
    } catch (err) {
      console.error('Export failed:', err);
      alert('Export thất bại, thử lại!');
    } finally {
      setIsExporting(false);
    }
  }, [elements, tshirtColor]);

  const handleMoveElement = useCallback((id: string, x: number, y: number) => {
    setElements(prev => prev.map(el => el.id === id ? { ...el, x, y } : el));
  }, []);

  const handleResizeElement = useCallback((id: string, width: number, height: number, x?: number, y?: number) => {
    setElements(prev => prev.map(el => (el.id === id ? { ...el, width, height, ...(x !== undefined ? { x } : {}), ...(y !== undefined ? { y } : {}) } : el)));
  }, []);

  return (
    <div className="flex flex-col h-[100dvh] bg-[#0a0e1a] overflow-hidden font-sans text-white">

      {/* NAV */}
      <header className="h-12 md:h-14 bg-[#0f1524]/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-3 md:px-6 shrink-0 z-50">
        <div className="flex items-center gap-2 md:gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#7dd3fc]/20 border border-[#7dd3fc]/30 rounded-lg flex items-center justify-center shrink-0">
              <span className="text-[#7dd3fc] text-[8px] font-black tracking-tighter leading-none">US</span>
            </div>
            <div className="leading-none hidden sm:block">
              <span className="font-black text-[13px] tracking-tight text-white">Uni<span className="text-[#7dd3fc]">Space</span></span>
              <span className="text-[7px] text-gray-500 font-medium block tracking-wide">Design Studio</span>
            </div>
          </Link>
          <div className="h-5 w-px bg-white/10 hidden sm:block" />
          <div className="flex items-center gap-0.5">
            <button onClick={handleUndo} className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors" title="Undo"><Undo2 size={14} /></button>
            <button onClick={handleRedo} className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors" title="Redo"><Redo2 size={14} /></button>
          </div>
        </div>
        {/* Centered project title */}
        <div className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center gap-2">
          <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Project:</span>
          <span className="text-[12px] font-black text-white uppercase tracking-wider">{projectName || 'UNTITLED'}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowOrderModal(true)} disabled={isExporting}
            className="px-5 py-1.5 bg-[#7dd3fc] text-[#0a0e1a] text-[10px] font-black uppercase rounded-lg tracking-wider hover:bg-[#7dd3fc]/80 transition-all disabled:opacity-50 shadow-lg shadow-[#7dd3fc]/20">
            {isExporting ? '...' : 'EXPORT'}
          </button>
          <Link href="/"
            className="px-5 py-1.5 bg-transparent text-white text-[10px] font-black uppercase rounded-lg tracking-wider hover:bg-white/10 transition-all border border-white/30">
            BACK
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">

        {/* ── BLUEPRINT PANEL: full-width on mobile, fixed 820px on desktop ── */}
        <section className="w-full md:w-[820px] shrink-0 flex flex-col bg-white border-b md:border-b-0 md:border-r border-white/5 md:shadow-xl overflow-hidden h-[calc(100dvh-48px)] max-h-[calc(100dvh-48px)]">

          {/* HEADER ROW 1 — hidden on mobile, shown on desktop */}
          <div className="hidden md:grid grid-cols-[150px_1fr_120px_90px] border-b border-black shrink-0 h-[60px]">
            <div className="border-r border-black p-2 flex flex-col justify-center items-center relative bg-white gap-0.5">
              <span className="text-[5px] font-black text-gray-400 absolute top-1.5 left-2 uppercase tracking-widest">Brand</span>
              <div className="flex items-center gap-1">
                <div className="w-5 h-5 bg-black rounded-md flex items-center justify-center shrink-0">
                  <span className="text-white text-[7px] font-black leading-none">U</span>
                </div>
                <div className="leading-none">
                  <span className="text-[9px] font-black tracking-tight leading-none block text-black">UNISPACE</span>
                  <span className="text-[4.5px] font-bold uppercase tracking-[0.15em] text-gray-500 block">DESIGN STUDIO</span>
                </div>
              </div>
            </div>
            <div className="border-r border-black p-2 flex flex-col justify-center">
              <span className="text-[5px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Project Name:</span>
              <input
                type="text"
                value={projectName}
                onChange={e => setProjectName(e.target.value)}
                placeholder="Tên đồng phục..."
                className="text-[11px] font-black leading-none bg-transparent border-none outline-none w-full placeholder:text-gray-300 uppercase text-black"
              />
            </div>
            <div className="border-r border-black p-2 flex flex-col justify-center">
              <span className="text-[5px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Fabric:</span>
              <span className="text-[9px] font-black leading-tight text-black">PERFORMANCE MESH /<br/>POLY-COTTON</span>
            </div>
            <div className="p-2 flex flex-col justify-center">
              <span className="text-[5px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Category:</span>
              <span className="text-[9px] font-black text-black">TOP</span>
              <span className="text-[5px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Style:</span>
              <span className="text-[9px] font-black text-black">RAGLAN</span>
            </div>
          </div>

          {/* HEADER ROW 2 — hidden on mobile */}
          <div className="hidden md:grid grid-cols-[150px_1fr_120px_90px] border-b border-black shrink-0 h-[30px]">
            <div className="border-r border-black px-2 flex items-center gap-1.5">
              <div className="w-3 h-3 rounded border border-black/20 shrink-0" style={{ backgroundColor: tshirtColor }} />
              <div className="flex flex-col justify-center">
                <span className="text-[5px] font-black text-gray-400 uppercase">Color:</span>
                <span className="text-[7px] font-black font-mono text-black">{tshirtColor.toUpperCase()}</span>
              </div>
            </div>
            <div className="border-r border-black px-2 flex flex-col justify-center">
              <span className="text-[5px] font-black text-gray-400 uppercase">Date:</span>
              <span className="text-[8px] font-black text-black">{new Date().toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' }).toUpperCase()}</span>
            </div>
            <div className="border-r border-black px-2 flex flex-col justify-center">
              <span className="text-[5px] font-black text-gray-400 uppercase">Size Range:</span>
              <span className="text-[8px] font-black text-black">L - XXL</span>
            </div>
            <div className="px-2 flex items-center justify-center">
              <span className="text-[20px] text-gray-200 font-mono tracking-[0.15em] font-bold">CONFIDENTIAL</span>
            </div>
          </div>

          {/* Ruler bar */}
          <div className="hidden md:flex h-[18px] border-b border-black shrink-0 bg-white items-end overflow-hidden px-[55px]">
            {Array.from({ length: 80 }).map((_, i) => (
              <div key={i} className="flex-1 flex justify-start items-end">
                <div className={`bg-black ${i % 10 === 0 ? 'w-[1px] h-[12px]' : i % 5 === 0 ? 'w-[1px] h-[8px]' : 'w-[0.5px] h-[4px]'}`} />
              </div>
            ))}
          </div>

          {/* BLUEPRINT BODY — fills remaining height */}
          <div ref={blueprintRef} className="flex-1 relative overflow-hidden">
            <div className="absolute inset-0 blueprint-lattice pointer-events-none opacity-50" />

            {/* Garment Style badge */}
            <div className="absolute top-3 left-[70px] z-20 hidden md:flex items-center gap-2">
              <span className="text-[8px] font-black uppercase tracking-wider text-gray-500">Garment Style</span>
              <div className="px-3 py-1 bg-white border border-black rounded text-[9px] font-black uppercase flex items-center gap-1.5 shadow-sm">
                RAGLAN <span className="text-[7px] text-gray-400">▼</span>
              </div>
            </div>

            {/* Technical annotation lines — engineering callouts */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 hidden md:block" xmlns="http://www.w3.org/2000/svg">
              {/* Left side annotations — BACK view area */}
              {/* RAGLAN SLEEVE CONSTRUCTION */}
              <line x1="70" y1="170" x2="140" y2="145" stroke="black" strokeWidth="0.5" strokeDasharray="4 2" />
              <text x="15" y="173" fontSize="7" fontFamily="monospace" fontWeight="900" fill="black">RAGLAN SLEEVE</text>
              <text x="15" y="183" fontSize="7" fontFamily="monospace" fontWeight="900" fill="black">CONSTRUCTION</text>

              {/* SUBLIMATED PIPING */}
              <line x1="170" y1="100" x2="210" y2="100" stroke="black" strokeWidth="0.5" strokeDasharray="4 2" />
              <line x1="210" y1="100" x2="210" y2="85" stroke="black" strokeWidth="0.5" strokeDasharray="4 2" />
              <text x="155" y="78" fontSize="7" fontFamily="monospace" fontWeight="900" fill="black">SUBLIMATED PIPING</text>

              {/* SLEEVE LENGTH */}
              <line x1="225" y1="180" x2="270" y2="170" stroke="black" strokeWidth="0.5" strokeDasharray="4 2" />
              <text x="225" y="195" fontSize="7" fontFamily="monospace" fontWeight="900" fill="black">SLEEVE LENGTH:</text>
              <text x="240" y="205" fontSize="7" fontFamily="monospace" fontWeight="900" fill="black">24CM</text>

              {/* EMBROIDERED PATCH AREA */}
              <line x1="155" y1="340" x2="235" y2="310" stroke="black" strokeWidth="0.5" strokeDasharray="4 2" />
              <text x="85" y="350" fontSize="7" fontFamily="monospace" fontWeight="900" fill="black">EMBROIDERED</text>
              <text x="85" y="360" fontSize="7" fontFamily="monospace" fontWeight="900" fill="black">PATCH AREA</text>

              {/* MESH VENTILATION PANEL */}
              <line x1="155" y1="395" x2="230" y2="375" stroke="black" strokeWidth="0.5" strokeDasharray="4 2" />
              <text x="90" y="398" fontSize="7" fontFamily="monospace" fontWeight="900" fill="black">MESH VENTILATION</text>
              <text x="110" y="408" fontSize="7" fontFamily="monospace" fontWeight="900" fill="black">PANEL</text>

              {/* BOTTOM HEM: DOUBLE STITCH */}
              <line x1="200" y1="440" x2="230" y2="430" stroke="black" strokeWidth="0.5" strokeDasharray="4 2" />
              <text x="120" y="450" fontSize="7" fontFamily="monospace" fontWeight="900" fill="black">BOTTOM HEM:</text>
              <text x="120" y="460" fontSize="7" fontFamily="monospace" fontWeight="900" fill="black">DOUBLE STITCH</text>

              {/* Right side annotations — FRONT view area */}
              {/* NECK RIB */}
              <line x1="540" y1="100" x2="600" y2="80" stroke="black" strokeWidth="0.5" strokeDasharray="4 2" />
              <text x="600" y="73" fontSize="7" fontFamily="monospace" fontWeight="900" fill="black">NECK RIB:</text>
              <text x="600" y="83" fontSize="7" fontFamily="monospace" fontWeight="900" fill="black">1X1 COTTON/SPANDEX</text>

              {/* SET-IN SLEEVES */}
              <line x1="620" y1="330" x2="660" y2="350" stroke="black" strokeWidth="0.5" strokeDasharray="4 2" />
              <text x="640" y="345" fontSize="7" fontFamily="monospace" fontWeight="900" fill="black">SET-IN</text>
              <text x="640" y="355" fontSize="7" fontFamily="monospace" fontWeight="900" fill="black">SLEEVES</text>

              {/* DOUBLE NEEDLE HEM */}
              <line x1="590" y1="440" x2="630" y2="445" stroke="black" strokeWidth="0.5" strokeDasharray="4 2" />
              <text x="620" y="455" fontSize="7" fontFamily="monospace" fontWeight="900" fill="black">DOUBLE</text>
              <text x="620" y="465" fontSize="7" fontFamily="monospace" fontWeight="900" fill="black">NEEDLE HEM</text>

              {/* Horizontal dashed construction line (waist/bottom) */}
              <line x1="110" y1="420" x2="680" y2="420" stroke="black" strokeWidth="0.5" strokeDasharray="6 3" opacity="0.3" />
            </svg>

            <div className="relative h-full flex p-3" onDragOver={(e) => e.preventDefault()} style={{ transform: `scale(${zoom}) translate(${panX / zoom}px, ${panY / zoom}px)`, transformOrigin: 'center center', transition: 'transform 0.05s ease-out' }}>

              {/* FAR LEFT: Color Swatches — hidden on mobile */}
              <div className="hidden md:flex w-[55px] shrink-0 flex-col gap-1.5 pt-1 pr-2">
                <span className="text-[5px] font-black uppercase text-gray-400 tracking-wider leading-tight block mb-1">COLOR<br/>SWATCHES</span>
                {[
                  { hex: '#FFFFFF', cmyk: '0 0 0 0' },
                  { hex: '#F2F0E9', cmyk: '3 2 8 0' },
                  { hex: '#D4DF72', cmyk: '21 0 85 7' },
                  { hex: '#2E4036', cmyk: '83 45 74 60' },
                  { hex: '#CC5833', cmyk: '9 72 100 1' },
                  { hex: '#1A1A1A', cmyk: '0 0 0 90' },
                  { hex: '#7dd3fc', cmyk: '65 66 0 0' },
                  { hex: '#E63B2E', cmyk: '0 84 88 0' },
                  { hex: '#87CEEB', cmyk: '42 11 0 0' },
                  { hex: '#FFB6C1', cmyk: '0 29 24 0' },
                ].map(c => (
                  <button key={c.hex} onClick={() => setTshirtColor(c.hex)} title={c.hex} className="text-left group">
                    <div className={`w-5 h-5 border mb-0.5 transition-all ${tshirtColor === c.hex ? 'border-black ring-1 ring-offset-1 ring-black scale-110' : 'border-gray-300'}`}
                      style={{ backgroundColor: c.hex }} />
                    <span className="text-[4px] font-black uppercase leading-tight block text-gray-400 group-hover:text-gray-700 transition-colors">{c.cmyk}</span>
                  </button>
                ))}
              </div>

              {/* MAIN: desktop = 2 rows (back + front), mobile = active side only */}
              <div className="flex-1 flex flex-col gap-1 overflow-hidden h-full min-h-0">

                {/* ── BACK VIEW — shown always on desktop, mobile only when side=back ── */}
                <div className={`flex gap-3 items-start overflow-hidden ${side === 'back' ? 'flex-1' : 'md:h-[50%] hidden md:flex'}`}>
                  <div className="flex flex-col items-center h-full min-h-0 flex-1 min-w-0">
                    <span className="text-[7px] font-black uppercase text-gray-500 tracking-widest mb-1 shrink-0">BACK VIEW</span>
                    <div ref={backCanvasRef} className="flex-1 w-full min-h-0 relative">
                      <DesignCanvas
                        elements={elements} selectedId={selectedId} onSelectElement={setSelectedId}
                        onMoveElement={handleMoveElement} onResizeElement={handleResizeElement}
                        onPushHistory={() => pushHistory(elements)} onDropImage={handleDropImage} onDropText={handleDropTextBack}
                        side="back" tshirtColor={tshirtColor}
                      />
                    </div>
                  </div>
                  {/* Back thumbnail — desktop only */}
                  <div className="hidden md:flex flex-col items-center shrink-0 self-start">
                    <span className="text-[5px] font-black uppercase text-gray-500 mb-1 tracking-widest">BACK VIEW</span>
                    <MiniPreview elements={elements} side="back" width={100} height={100} onDropImage={handleDropImageToSide} />
                  </div>
                </div>

                {/* ── FRONT VIEW — shown always on desktop, mobile only when side=front ── */}
                <div className={`flex gap-3 items-end overflow-hidden ${side === 'front' ? 'flex-1' : 'md:h-[50%] hidden md:flex'}`}>
                  {/* Logo upload — desktop only */}
                  <div className="hidden md:flex flex-col items-center shrink-0 self-end">
                    <span className="text-[5px] font-black uppercase text-gray-400 mb-1 tracking-widest">LOGO</span>
                    <label className="relative overflow-hidden border border-dashed border-gray-400 bg-gray-50 hover:border-black hover:bg-gray-100 transition-all cursor-pointer flex items-center justify-center w-[55px] h-[90px]">
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
                          setElements(prev => [...prev, { id: `logo-thumb-${Date.now()}`, type: 'image', label: 'LOGO', url: dataUrl, x: 0, y: 0, width: 55, height: 90, rotation: 0, side: 'side' as const, locked: false }]);
                        };
                        reader.readAsDataURL(file);
                      }} />
                    </label>
                  </div>
                  {/* Front shirt */}
                  <div className="flex flex-col items-center h-full min-h-0 flex-1 min-w-0">
                    <span className="text-[7px] font-black uppercase text-gray-500 tracking-widest mb-1 shrink-0">FRONT VIEW</span>
                    <div ref={frontCanvasRef} className="flex-1 w-full min-h-0 relative">
                      <DesignCanvas
                        elements={elements} selectedId={selectedId} onSelectElement={setSelectedId}
                        onMoveElement={handleMoveElement} onResizeElement={handleResizeElement}
                        onPushHistory={() => pushHistory(elements)} onDropImage={handleDropImage} onDropText={handleDropTextFront}
                        side="front" tshirtColor={tshirtColor}
                      />
                    </div>
                  </div>
                  {/* Front thumbnail — desktop only */}
                  <div className="hidden md:flex flex-col items-center shrink-0 self-end">
                    <span className="text-[5px] font-black uppercase text-gray-500 mb-1 tracking-widest">FRONT VIEW</span>
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
              <span className="text-[10px] font-mono text-white bg-black/80 px-2 py-1 rounded-lg shadow min-w-[40px] text-center">{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom(z => Math.min(3, z + 0.1))} className="w-8 h-8 bg-black/80 hover:bg-black text-white rounded-lg flex items-center justify-center shadow-lg text-sm font-bold transition-all">+</button>
              <button onClick={() => { setZoom(1); setPanX(0); setPanY(0); }} className="w-8 h-8 bg-black/80 hover:bg-black text-white rounded-lg flex items-center justify-center shadow-lg transition-all" title="Reset zoom & pan">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>
              </button>
            </div>

          </div>
        </section>

        {/* ── VERTICAL ICON TOOLBAR — narrow strip between blueprint and content panel ── */}
        <div className="hidden md:flex flex-col items-center py-4 px-1 bg-[#0a0e1a] border-r border-white/5 gap-3 shrink-0 w-[40px]">
          <button onClick={() => setActiveTab(prev => prev === 'layers' ? null : 'layers')}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${activeTab === 'layers' ? 'bg-[#7dd3fc]/20 text-[#7dd3fc]' : 'text-gray-500 hover:text-white hover:bg-white/10'}`} title="Layers">
            <LayersIcon size={16} />
          </button>
          <button onClick={() => setActiveTab(prev => prev === 'assets' ? null : 'assets')}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${activeTab === 'assets' ? 'bg-[#7dd3fc]/20 text-[#7dd3fc]' : 'text-gray-500 hover:text-white hover:bg-white/10'}`} title="Text">
            <span className="text-[14px] font-black">T</span>
          </button>
          <button className="w-8 h-8 rounded-lg flex items-center justify-center transition-all text-gray-500 hover:text-white hover:bg-white/10" title="Copy">
            <ImageIcon size={16} />
          </button>
          <button onClick={() => setActiveTab(prev => prev === 'color' ? null : 'color')}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${activeTab === 'color' ? 'bg-[#7dd3fc]/20 text-[#7dd3fc]' : 'text-gray-500 hover:text-white hover:bg-white/10'}`} title="Color">
            <PaletteIcon size={16} />
          </button>
          <button className="w-8 h-8 rounded-lg flex items-center justify-center transition-all text-gray-500 hover:text-white hover:bg-white/10" title="Upload">
            <Zap size={16} />
          </button>
          <div className="flex-1" />
          <div className="w-6 h-px bg-white/10" />
          <button onClick={() => setActiveTab(prev => prev === 'ai' ? null : 'ai')}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all text-[10px] font-black ${activeTab === 'ai' ? 'bg-[#7dd3fc]/20 text-[#7dd3fc]' : 'text-gray-500 hover:text-white hover:bg-white/10'}`} title="AI">
            AI
          </button>
        </div>

        {/* ── RIGHT: AI PANEL — sidebar on desktop, bottom sheet on mobile ── */}
        <aside className={`
          fixed md:static inset-x-0 bottom-0 md:inset-auto
          flex-1 md:h-full flex flex-col bg-[#0f1524]/80 backdrop-blur-xl overflow-hidden
          transition-transform duration-300 z-40 md:z-auto
          ${activeTab !== null ? 'translate-y-0' : 'translate-y-full md:translate-y-0'}
          md:translate-y-0 h-[72vh] md:h-full
          rounded-t-3xl md:rounded-none shadow-2xl md:shadow-none
          border-t md:border-t-0 md:border-l border-white/5
        `}>
          {/* Mobile drag handle + close */}
          <div className="flex items-center justify-between px-4 pt-3 pb-1 md:hidden shrink-0">
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto absolute left-1/2 -translate-x-1/2" />
            <div />
            <button onClick={() => setActiveTab(null)} aria-label="Đóng bảng công cụ" className="ml-auto p-1.5 rounded-full hover:bg-white/10 text-gray-400">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>

          {/* Garment type tabs — matching Stitch reference */}
          <div className="flex bg-[#0a0e1a] px-2 pt-2 shrink-0 gap-1">
            {(['T-SHIRT', 'RAGLAN', 'POLO'] as const).map(type => (
              <button key={type}
                onClick={() => setGarmentType(type)}
                className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-t-lg transition-all ${
                  type === garmentType ? 'bg-[#7dd3fc] text-[#0a0e1a]' : 'text-gray-500 hover:text-white'
                }`}>{type}</button>
            ))}
          </div>

          {/* Tab bar */}
          <div className="flex bg-[#0a0e1a]/60 border-b border-white/5 px-2 pt-1 shrink-0 gap-1">
            {([
              { id: "ai", icon: Zap, label: "AI" },
              { id: "assets", icon: ImageIcon, label: "Guide" },
              { id: "color", icon: PaletteIcon, label: "Palette" },
              { id: "layers", icon: LayersIcon, label: "Layers" }
            ] as const).map((t) => (
              <button
                key={t.id} onClick={() => setActiveTab(prev => prev === t.id ? null : t.id)}
                className={`flex items-center gap-1.5 px-3 py-2 text-[10px] font-black uppercase tracking-wide rounded-t-lg transition-all ${activeTab === t.id ? 'bg-[#0f1524] text-[#7dd3fc] border border-b-0 border-white/10' : 'text-gray-500 hover:text-white'}`}
              >
                <t.icon size={12} />{t.label}
              </button>
            ))}
          </div>

          {/* Content area */}
          <div className="flex-1 overflow-y-auto scrollbar-hide p-4">

            {activeTab === "ai" && (
              <div className="flex flex-col gap-4 h-full">

                {/* Template mockup grid — 2 columns, always visible */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { accent: '#7dd3fc', label: 'HOME',  bg: 'dark' },
                    { accent: '#7dd3fc', label: 'AWAY',  bg: 'light' },
                    { accent: '#c8a0f0', label: 'HOME',  bg: 'dark' },
                    { accent: '#c8a0f0', label: 'AWAY',  bg: 'light' },
                    { accent: '#7dd3fc', label: 'HOME',  bg: 'dark' },
                    { accent: '#7dd3fc', label: 'AWAY',  bg: 'light' },
                  ].map((card, idx) => (
                    <button key={idx}
                      className="group relative rounded-2xl overflow-hidden hover:scale-[1.03] transition-all border border-white/10 flex flex-col bg-[#0a0e1a]/70"
                      title={`Use ${card.label} template`}
                    >
                      {/* NEXT PLAYER header bar */}
                      <div className="w-full py-1 px-2 text-[8px] font-black uppercase tracking-widest text-center text-[#0a0e1a]"
                        style={{ background: card.accent }}>
                        NEXT PLAYER
                      </div>
                      {/* Mockup thumbnails — side-by-side shirts, matching active garment type */}
                      {(() => {
                        const frontImg = garmentType === 'POLO' ? '/mockups/v_polo_front.png'
                          : garmentType === 'RAGLAN' ? '/mockups/v_raglan_front.png'
                          : '/mockups/tshirt_front.png';
                        return (
                          <div className="relative w-full flex items-end justify-center gap-0.5 px-2 pt-2 pb-0 min-h-[72px]">
                            <div className="relative w-[38%] aspect-square">
                              <Image src={frontImg} alt="shirt" fill sizes="64px" unoptimized className="object-contain" style={{ filter: 'brightness(0)' }} />
                            </div>
                            <div className="relative w-[38%] aspect-square">
                              <Image src={frontImg} alt="shirt" fill sizes="64px" unoptimized className="object-contain opacity-70" />
                            </div>
                          </div>
                        );
                      })()}
                      {/* Variant label */}
                      <div className="px-2 py-1 flex items-center justify-center">
                        <span className="text-[8px] font-black uppercase tracking-wider" style={{ color: card.accent }}>{card.label}</span>
                      </div>
                      {/* Bottom info bar */}
                      <div className="px-2 pb-2 flex items-center justify-between border-t border-white/5 pt-1">
                        <span className="text-[6px] font-black uppercase text-gray-500 tracking-wider leading-tight">UNISPACE<br/>VARIOUS STYLES</span>
                        <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: `${card.accent}20` }}>
                          <svg width="8" height="8" viewBox="0 0 24 24" fill={card.accent}><polygon points="5 3 19 12 5 21 5 3"/></svg>
                        </div>
                      </div>
                      {/* Hover overlay */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        style={{ background: `${card.accent}15` }}>
                        <Plus size={20} className="text-white drop-shadow-lg" />
                      </div>
                    </button>
                  ))}

                  {/* AI-generated images appended after static templates */}
                  {messages.filter(m => m.role === "ai").flatMap(m => m.images || []).map((img) => (
                    <button key={img.id}
                      onClick={() => handleDropImage(img, 120, 150)}
                      className="group relative bg-[#0a0e1a]/60 rounded-2xl overflow-hidden hover:scale-[1.03] transition-all border border-[#7dd3fc]/20 flex flex-col"
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData("application/json", JSON.stringify(img))}
                      title={`Add ${img.label}`}
                    >
                      <div className="w-full bg-[#7dd3fc] py-1 px-2 text-[8px] font-black text-[#0a0e1a] uppercase tracking-widest text-center">
                        AI GENERATED
                      </div>
                      <div className="relative aspect-[4/3] w-full">
                        <Image src={img.url} alt={img.label} width={200} height={150} unoptimized className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-[#7dd3fc]/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Plus size={20} className="text-white shadow-lg" />
                        </div>
                      </div>
                      <div className="px-2 pb-2 pt-1 flex items-center justify-between">
                        <span className="text-[6px] font-black uppercase text-gray-500 tracking-wider">{img.label}</span>
                      </div>
                    </button>
                  ))}
                </div>

                {isLoading && (
                  <div className="flex items-center gap-2 p-3 bg-[#0a0e1a]/60 rounded-xl border border-white/5">
                    <div className="w-2 h-2 bg-[#7dd3fc] rounded-full animate-bounce" />
                    <span className="text-[9px] font-black uppercase text-gray-500">Generating...</span>
                  </div>
                )}

                {/* Chat input */}
                <div className="relative mt-auto">
                  <input
                    value={chatInput} onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && chatInput.trim() && (handleSendMessage(chatInput.trim()), setChatInput(""))}
                    placeholder="Describe your design idea..."
                    className="w-full bg-[#0a0e1a]/60 border border-white/10 focus:border-[#7dd3fc]/50 rounded-2xl px-4 py-3 text-[11px] shadow-sm outline-none transition-all pr-12 text-white placeholder:text-gray-600"
                  />
                  <button
                    onClick={() => chatInput.trim() && (handleSendMessage(chatInput.trim()), setChatInput(""))}
                    disabled={isLoading}
                    title="Generate AI design"
                    aria-label="Generate AI design"
                    className="absolute right-2 top-2 w-8 h-8 rounded-xl bg-[#7dd3fc] text-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
                  >
                    <Zap size={14} />
                  </button>
                </div>
              </div>
            )}

            {activeTab === "assets" && (
              <div className="bg-[#0a0e1a]/60 rounded-3xl border border-white/10 p-5 shadow-sm flex flex-col gap-6 animate-in fade-in duration-300">
                <div className="flex items-center justify-between gap-2">
                  <div className="w-8 h-5 border border-white/20 rounded-full flex items-center justify-center text-[7px] font-black text-gray-500">000</div>
                  <div className="flex-1 h-px border-t border-dashed border-white/10" />
                  <div className="px-3 py-1 border border-white/20 rounded-full text-[8px] font-black uppercase text-gray-300">FONT PAIRING GUIDE</div>
                  <div className="flex-1 h-px border-t border-dashed border-white/10" />
                  <div className="w-8 h-5 border border-white/20 rounded-full flex items-center justify-center text-[7px] font-black text-gray-500">000</div>
                </div>

                {/* Editable text input */}
                <div className="flex flex-col gap-1">
                  <span className="text-[7px] font-black uppercase tracking-widest text-gray-500">TYPE YOUR TEXT</span>
                  <input
                    type="text"
                    value={fontPreviewText}
                    onChange={(e) => setFontPreviewText(e.target.value)}
                    placeholder="Type here..."
                    className="w-full px-3 py-2 border border-white/10 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#7dd3fc]/30 focus:border-[#7dd3fc]/40 bg-[#0a0e1a]/60 text-white"
                  />
                </div>

                <p className="text-[7px] font-black uppercase text-center tracking-widest text-gray-600">DRAG ANY STYLE ONTO THE SHIRT</p>

                {/* Draggable font samples */}
                <div className="flex flex-col gap-3">
                  {[
                    { text: fontPreviewText || 'Semester', font: 'Cormorant Garamond', weight: 400, size: '46px', style: 'italic', desc: 'Elegant Serif' },
                    { text: fontPreviewText || 'CLASS 2025', font: 'Impact', weight: 900, size: '28px', style: 'normal', desc: 'Bold Impact' },
                    { text: fontPreviewText || 'BROKEN HEART', font: 'Space Grotesk', weight: 900, size: '22px', style: 'normal', desc: 'Modern Sans' },
                    { text: fontPreviewText || 'Get Weird', font: 'Sora', weight: 800, size: '28px', style: 'normal', desc: 'Rounded Tech' },
                    { text: fontPreviewText || 'MILK & HONEY', font: 'Bebas Neue', weight: 400, size: '32px', style: 'normal', desc: 'Condensed Display' },
                    { text: fontPreviewText || 'Authentic', font: 'Dancing Script', weight: 700, size: '38px', style: 'normal', desc: 'Script Hand' },
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
                      className="group cursor-grab active:cursor-grabbing bg-[#0a0e1a]/40 hover:bg-[#7dd3fc]/10 px-4 py-3 rounded-2xl transition-all border border-white/5 hover:border-[#7dd3fc]/30 flex flex-col gap-1"
                    >
                      <div
                        className="leading-tight text-white group-hover:text-[#7dd3fc] transition-colors truncate"
                        style={{ fontFamily: item.font, fontSize: item.size, fontWeight: item.weight, fontStyle: item.style }}
                      >
                        {item.text}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[7px] font-black uppercase tracking-widest text-gray-500">{item.desc}</span>
                        <span className="text-[7px] font-mono text-gray-600">{item.font}</span>
                      </div>
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
                      className="px-3 py-1.5 border border-white/10 rounded-full text-[8px] font-black uppercase cursor-grab active:cursor-grabbing hover:bg-[#7dd3fc]/10 hover:border-[#7dd3fc]/30 transition-all text-gray-300"
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
                <div className="flex items-center gap-2 p-2 bg-[#7dd3fc]/10 rounded-xl border border-[#7dd3fc]/20">
                  <div className="w-6 h-6 rounded-md border-2 border-[#7dd3fc]/40 shrink-0" ref={(el) => { if (el) el.style.setProperty('background-color', tshirtColor); }} />
                  <span className="text-[8px] font-black uppercase text-white">Active: {tshirtColor}</span>
                </div>
                {[
                  { name: "White", hex: "#FFFFFF" }, { name: "Cream", hex: "#F2F0E9" },
                  { name: "Lime Green", hex: "#D4DF72" }, { name: "Moss Green", hex: "#2E4036" },
                  { name: "Clay", hex: "#CC5833" }, { name: "Charcoal", hex: "#1A1A1A" },
                  { name: "Plasma", hex: "#7dd3fc" }, { name: "Signal Red", hex: "#E63B2E" },
                  { name: "Sky Blue", hex: "#87CEEB" }, { name: "Blush Pink", hex: "#FFB6C1" },
                ].map(c => (
                  <button key={c.hex} onClick={() => setTshirtColor(c.hex)} title={`Apply ${c.name}`}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                      tshirtColor === c.hex ? 'bg-[#7dd3fc]/10 border-[#7dd3fc]/30 ring-2 ring-[#7dd3fc]/20' : 'bg-[#0a0e1a]/40 border-white/5 hover:border-[#7dd3fc]/20'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg border border-white/10 shrink-0" ref={(el) => { if (el) el.style.setProperty('background-color', c.hex); }} />
                    <div className="text-left">
                      <div className="text-[9px] font-black uppercase text-white">{c.name}</div>
                      <div className="text-[7px] font-mono text-gray-500">{c.hex}</div>
                    </div>
                    {tshirtColor === c.hex && <div className="ml-auto w-2 h-2 bg-[#7dd3fc] rounded-full" />}
                  </button>
                ))}
              </div>
            )}

            {activeTab === "layers" && (
              <div className="space-y-3 animate-in fade-in duration-300">
                {elements.length === 0 ? (
                  <div className="py-20 text-center opacity-20 text-gray-500"><LayersIcon size={32} className="mx-auto" /><p className="text-[8px] font-black uppercase mt-4">No layers yet</p></div>
                ) : (
                  elements.slice().reverse().map((el) => (
                    <div key={el.id} onClick={() => setSelectedId(el.id)} className={`flex items-center gap-3 p-3 rounded-xl bg-[#0a0e1a]/40 border cursor-pointer transition-all ${selectedId === el.id ? 'border-[#7dd3fc]/50 ring-4 ring-[#7dd3fc]/10' : 'border-white/5 hover:border-white/10'}`}>
                      <div className="flex-1 min-w-0">
                        <div className="text-[9px] font-black uppercase truncate text-white">{el.label || el.text}</div>
                        <div className="text-[7px] font-mono text-gray-500">{el.type} / {el.side}</div>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); setElements(prev => prev.filter(item => item.id !== el.id)); }} title="Delete layer" aria-label="Delete layer" className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={13}/></button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* FRONT / BACK / SIDE — fixed bottom bar */}
          {(() => {
            const mockups: Record<string, Record<string, string>> = {
              'T-SHIRT': { front: '/mockups/tshirt_front.png', back: '/mockups/tshirt_back.png', side: '/mockups/tshirt_side.png' },
              'RAGLAN':  { front: '/mockups/v_raglan_front.png', back: '/mockups/v_raglan_back.png', side: '/mockups/raglan_side.png' },
              'POLO':    { front: '/mockups/v_polo_front.png', back: '/mockups/v_polo_back.png', side: '/mockups/polo_side.png' },
            };
            const imgs = mockups[garmentType] || mockups['RAGLAN'];
            return (
              <div className="shrink-0 border-t border-white/5 bg-[#0a0e1a]/60 px-3 py-2 flex items-center justify-center gap-4">
                {(['front', 'back', 'side'] as const).map((s) => (
                  <button key={s} onClick={() => setSide(s)}
                    className={`flex flex-col items-center gap-1 transition-all ${side === s ? 'opacity-100' : 'opacity-40 hover:opacity-70'}`}
                  >
                    <div className={`w-14 h-14 rounded-lg border overflow-hidden ${side === s ? 'border-[#7dd3fc] ring-2 ring-[#7dd3fc]/20' : 'border-white/10'} bg-white`}>
                      <Image src={imgs[s]} alt={s} width={56} height={56} unoptimized
                        className="w-full h-full object-contain" />
                    </div>
                    <span className={`text-[7px] font-black uppercase tracking-wider ${side === s ? 'text-[#7dd3fc]' : 'text-gray-500'}`}>{s.toUpperCase()}</span>
                  </button>
                ))}
              </div>
            );
          })()}
        </aside>

        {/* Mobile: backdrop to dismiss panel */}
        {activeTab !== null && (
          <div className="fixed inset-0 bg-[#0a0e1a]/60 backdrop-blur-sm z-30 md:hidden" onClick={() => setActiveTab(null)} />
        )}

        {/* Mobile: floating tool button (opens AI panel) */}
        {activeTab === null && (
          <button
            onClick={() => setActiveTab('ai')}
            className="fixed bottom-5 right-5 z-50 md:hidden w-12 h-12 bg-[#7dd3fc] text-white rounded-full shadow-2xl shadow-[#7dd3fc]/20 flex items-center justify-center active:scale-95 transition-transform"
            aria-label="Mở công cụ thiết kế"
          >
            <Zap size={20} />
          </button>
        )}
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

      {/* ── ORDER FORM MODAL ── */}
      {showOrderModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-[#0a0e1a]/80 backdrop-blur-xl">
          <div className="bg-[#0f1524] rounded-3xl w-full max-w-lg mx-4 shadow-2xl overflow-hidden border border-white/10">
            {/* Header */}
            <div className="bg-[#0a0e1a] text-white px-6 py-4 flex items-center justify-between border-b border-white/5">
              <div>
                <h2 className="text-sm font-black uppercase tracking-widest">Thông Tin Đơn Hàng</h2>
                <p className="text-[10px] text-gray-500 font-mono mt-0.5">Điền thông tin trước khi gửi thiết kế cho admin</p>
              </div>
              <button onClick={() => setShowOrderModal(false)} className="text-gray-500 hover:text-white text-lg leading-none">✕</button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Personal info */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Họ tên *</label>
                  <input type="text" value={orderInfo.name} onChange={e => setOrderInfo(p => ({...p, name: e.target.value}))}
                    className="w-full border border-white/10 rounded-xl px-3 py-2 text-sm font-medium outline-none focus:border-[#7dd3fc]/50 transition-colors bg-[#0a0e1a]/60 text-white" placeholder="Nguyễn Văn A" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Số điện thoại *</label>
                  <input type="tel" value={orderInfo.phone} onChange={e => setOrderInfo(p => ({...p, phone: e.target.value}))}
                    className="w-full border border-white/10 rounded-xl px-3 py-2 text-sm font-medium outline-none focus:border-[#7dd3fc]/50 transition-colors bg-[#0a0e1a]/60 text-white" placeholder="0901 234 567" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Địa chỉ giao hàng *</label>
                <input type="text" value={orderInfo.address} onChange={e => setOrderInfo(p => ({...p, address: e.target.value}))}
                  className="w-full border border-white/10 rounded-xl px-3 py-2 text-sm font-medium outline-none focus:border-[#7dd3fc]/50 transition-colors bg-[#0a0e1a]/60 text-white" placeholder="123 Đường ABC, Quận 1, TP.HCM" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Lớp / Trường</label>
                <input type="text" value={orderInfo.className} onChange={e => setOrderInfo(p => ({...p, className: e.target.value}))}
                  className="w-full border border-white/10 rounded-xl px-3 py-2 text-sm font-medium outline-none focus:border-[#7dd3fc]/50 transition-colors bg-[#0a0e1a]/60 text-white" placeholder="12A1 - THPT Nguyễn Trãi" />
              </div>

              {/* Size quantities */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-2">Số lượng theo size</label>
                <div className="grid grid-cols-6 gap-2">
                  {(['XS','S','M','L','XL','XXL'] as const).map(size => (
                    <div key={size} className="text-center">
                      <div className="text-[9px] font-black uppercase text-gray-500 mb-1">{size}</div>
                      <input
                        type="number" min="0" max="999" aria-label={`Số lượng size ${size}`}
                        value={orderInfo.sizes[size]}
                        onChange={e => setOrderInfo(p => ({...p, sizes: {...p.sizes, [size]: parseInt(e.target.value)||0}}))}
                        className="w-full border border-white/10 rounded-xl px-1 py-2 text-sm font-black text-center outline-none focus:border-[#7dd3fc]/50 transition-colors bg-[#0a0e1a]/60 text-white"
                      />
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-gray-500 font-mono mt-2">
                  Tổng: <span className="font-black text-white">{Object.values(orderInfo.sizes).reduce((a,b) => a+b, 0)} áo</span>
                </p>
              </div>

              {/* Note */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Ghi chú</label>
                <textarea value={orderInfo.note} onChange={e => setOrderInfo(p => ({...p, note: e.target.value}))}
                  rows={2} className="w-full border border-white/10 rounded-xl px-3 py-2 text-sm font-medium outline-none focus:border-[#7dd3fc]/50 transition-colors resize-none bg-[#0a0e1a]/60 text-white"
                  placeholder="Yêu cầu thêm, màu sắc đặc biệt..." />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setShowOrderModal(false)}
                className="flex-1 py-2.5 border border-white/10 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:border-white/30 transition-colors text-gray-400">
                Hủy
              </button>
              <button
                onClick={() => handleExportPack(orderInfo)}
                disabled={!orderInfo.name || !orderInfo.phone || !orderInfo.address || isExporting}
                className="flex-1 py-2.5 bg-[#7dd3fc] text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-[#7dd3fc]/80 transition-colors disabled:opacity-40">
                {isExporting ? 'Đang xử lý...' : '📦 Gửi Đơn Hàng'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

