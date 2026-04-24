"use client";
import React, { useState, useRef, useCallback, useEffect, useLayoutEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Zap, Plus, Undo2, Redo2, Image as ImageIcon, Palette as PaletteIcon, Layers as LayersIcon, Trash2, Sparkles, RefreshCw, Type, Upload } from "lucide-react";
import { SaveToCollectionModal } from "../../components/SaveToCollectionModal";
import { Logo } from "../../components/Logo";

// ─── Fixed Snap Slots ─────────────────────────────────────────
// All coords are in virtual canvas units (400 wide × 480 tall)
// Slot layout per garment:
//  - T-SHIRT: front-center (large), back-center (large)
//  - RAGLAN:  front-center (small chest-logo), back-center (large)
//  - POLO:    chest-logo only (front, no front-center), back-left + back-right
function getSnapSlots(garmentType: "T-SHIRT" | "RAGLAN" | "POLO") {
  if (garmentType === "POLO") {
    return [
      {
        id: "front-center" as const,
        label: "Chest Logo",
        desc: "Logo góc ngực phải — pocket logo (Polo)",
        side: "front" as const,
        x: 230, y: 75, width: 60, height: 60,
        icon: "🔲",
      },
      {
        id: "back-center" as const,
        label: "Back Center",
        desc: "In full mặt sau — giữa lưng (Polo)",
        side: "back" as const,
        x: 115, y: 78, width: 170, height: 170,
        icon: "🔳",
      },
    ] as const;
  }

  if (garmentType === "RAGLAN") {
    return [
      {
        id: "front-center" as const,
        label: "Chest Logo",
        desc: "Logo ngực trái — pocket logo (Raglan)",
        side: "front" as const,
        x: 223, y: 85, width: 70, height: 70,
        icon: "⬛",
      },
      {
        id: "back-center" as const,
        label: "Back Center",
        desc: "In full mặt sau — giữa lưng",
        side: "back" as const,
        x: 115, y: 78, width: 170, height: 170,
        icon: "🔳",
      },
    ] as const;
  }

  // T-SHIRT
  return [
    {
      id: "front-center" as const,
      label: "Front Center",
      desc: "Vùng in lớn mặt trước — giữa ngực",
      side: "front" as const,
      x: 115, y: 85, width: 170, height: 170,
      icon: "⬛",
    },
    {
      id: "chest-logo" as const,
      label: "Chest Logo",
      desc: "Logo nhỏ góc ngực trái — pocket logo",
      side: "front" as const,
      x: 220, y: 80, width: 70, height: 70,
      icon: "🔲",
    },
    {
      id: "back-center" as const,
      label: "Back Center",
      desc: "Vùng in lớn mặt sau — giữa lưng trên",
      side: "back" as const,
      x: 115, y: 78, width: 170, height: 170,
      icon: "🔳",
    },
  ] as const;
}

// Static ref used only for TypeScript union type derivation
type SnapSlotId = ReturnType<typeof getSnapSlots>[number]["id"];

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
  slot?: SnapSlotId | "shirt" | "neck-label" | "hang-tag" | "logo-detail" | "packaging" | "front-artwork" | "back-artwork";
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

// ─── Annotation types ─────────────────────────────────────────────────────
interface AnnotationLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

interface AnnotationLabel {
  x: number;
  y: number;
  text: string;
}

interface AnnotationGroup {
  lines: AnnotationLine[];
  labels: AnnotationLabel[];
}

interface GarmentAnnotations {
  front: AnnotationGroup[];
  back: AnnotationGroup[];
}

// ─── Annotations per garment type (coordinates in 990×1100 viewBox) ────────
const ANNOTATIONS_BY_TYPE: Record<string, GarmentAnnotations> = {
  T_SHIRT: {
    front: [
      {
        lines: [{ x1: 550, y1: 60, x2: 680, y2: 35 }],
        labels: [
          { x: 690, y: 28, text: "NECK RIB:" },
          { x: 690, y: 48, text: "1X1 COTTON/SPANDEX" }
        ]
      },
      {
        lines: [{ x1: 600, y1: 1070, x2: 720, y2: 1080 }],
        labels: [
          { x: 640, y: 1095, text: "DOUBLE NEEDLE HEM" }
        ]
      }
    ],
    back: [
      {
        lines: [{ x1: 350, y1: 1080, x2: 450, y2: 1050 }],
        labels: [
          { x: 250, y: 1095, text: "BOTTOM HEM:" },
          { x: 300, y: 1115, text: "DOUBLE STITCH" }
        ]
      }
    ]
  },
  RAGLAN: {
    front: [
      {
        lines: [{ x1: 550, y1: 60, x2: 680, y2: 35 }],
        labels: [
          { x: 690, y: 28, text: "NECK RIB:" },
          { x: 690, y: 48, text: "1X1 COTTON/SPANDEX" }
        ]
      },
      {
        lines: [{ x1: 530, y1: 450, x2: 700, y2: 420 }],
        labels: [
          { x: 710, y: 415, text: "FULL-LENGTH" },
          { x: 710, y: 435, text: "BUTTON PLACKET" }
        ]
      },
      {
        lines: [{ x1: 850, y1: 350, x2: 920, y2: 380 }],
        labels: [
          { x: 880, y: 405, text: "SET-IN" },
          { x: 880, y: 425, text: "SLEEVES" }
        ]
      },
      {
        lines: [{ x1: 600, y1: 1070, x2: 720, y2: 1080 }],
        labels: [
          { x: 640, y: 1095, text: "DOUBLE NEEDLE HEM" }
        ]
      }
    ],
    back: [
      {
        lines: [{ x1: 80, y1: 400, x2: 180, y2: 300 }],
        labels: [
          { x: 10, y: 420, text: "RAGLAN SLEEVE" },
          { x: 10, y: 440, text: "CONSTRUCTION" }
        ]
      },
      {
        lines: [{ x1: 300, y1: 90, x2: 380, y2: 55 }],
        labels: [
          { x: 200, y: 75, text: "SUBLIMATED PIPING" }
        ]
      },
      {
        lines: [{ x1: 900, y1: 260, x2: 960, y2: 290 }],
        labels: [
          { x: 860, y: 240, text: "SLEEVE LENGTH:" },
          { x: 890, y: 260, text: "24CM" }
        ]
      },
      {
        lines: [{ x1: 100, y1: 680, x2: 300, y2: 650 }],
        labels: [
          { x: 10, y: 710, text: "EMBROIDERED" },
          { x: 10, y: 730, text: "PATCH AREA" }
        ]
      },
      {
        lines: [{ x1: 100, y1: 830, x2: 200, y2: 800 }],
        labels: [
          { x: 10, y: 850, text: "MESH VENTILATION" },
          { x: 10, y: 870, text: "PANEL" }
        ]
      },
      {
        lines: [{ x1: 350, y1: 1080, x2: 450, y2: 1050 }],
        labels: [
          { x: 250, y: 1095, text: "BOTTOM HEM:" },
          { x: 300, y: 1115, text: "DOUBLE STITCH" }
        ]
      }
    ]
  },
  POLO: {
    front: [
      {
        lines: [{ x1: 550, y1: 60, x2: 680, y2: 35 }],
        labels: [
          { x: 690, y: 28, text: "COLLAR:" },
          { x: 690, y: 48, text: "2-BUTTON PLACKET" }
        ]
      },
      {
        lines: [{ x1: 530, y1: 200, x2: 700, y2: 170 }],
        labels: [
          { x: 710, y: 190, text: "BUTTON PLACKET" }
        ]
      },
      {
        lines: [{ x1: 600, y1: 1070, x2: 720, y2: 1080 }],
        labels: [
          { x: 640, y: 1095, text: "DOUBLE NEEDLE HEM" }
        ]
      }
    ],
    back: [
      {
        lines: [{ x1: 350, y1: 1080, x2: 450, y2: 1050 }],
        labels: [
          { x: 250, y: 1095, text: "BOTTOM HEM:" },
          { x: 300, y: 1115, text: "DOUBLE STITCH" }
        ]
      }
    ]
  }
};

// Normalize garment type key to match ANNOTATIONS_BY_TYPE keys
function getGarmentTypeKey(type: string): string {
  switch (type) {
    case 'T-SHIRT': return 'T_SHIRT';
    case 'RAGLAN': return 'RAGLAN';
    case 'POLO': return 'POLO';
    default: return 'RAGLAN';
  }
}

// ─── Mockup image map per garment type ───────────────────────────────────
const MOCKUP_MAP: Record<string, { front: string; back: string; maskFront: string; maskBack: string }> = {
  'T-SHIRT': { front: '/mockups/v_tshirt_front.png',  back: '/mockups/v_tshirt_back.png',  maskFront: '/mockups/tshirt_front_mask.png',  maskBack: '/mockups/tshirt_back_mask.png' },
  'RAGLAN':  { front: '/mockups/v_raglan_front.png',  back: '/mockups/v_raglan_back.png',  maskFront: '/mockups/raglan_front_mask.png',  maskBack: '/mockups/raglan_back_mask.png' },
  'POLO':    { front: '/mockups/v_polo_front.png',    back: '/mockups/v_polo_back.png',    maskFront: '/mockups/raglan_front_mask.png',  maskBack: '/mockups/raglan_back_mask.png' },
};

// ─── Component: TShirtMockup — Canvas composite (color fill + linework) ───────
// Step 1: Draw transparent PNG → gets shirt shape on canvas
// Step 2: source-atop → fill color ONLY inside opaque pixels (= shirt silhouette)
// Step 3: multiply → draw PNG again so black lines show on top of color
function TShirtSVG({ color, side = "front", garmentType = "RAGLAN" }: { color: string; side?: "front" | "back"; garmentType?: string }) {
  const isFront = side === "front";
  const mockup = MOCKUP_MAP[garmentType] || MOCKUP_MAP['RAGLAN'];
  const imgSrc = isFront ? mockup.front : mockup.back;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    let loaded = false;

    const render = () => {
      if (!loaded) return;
      const dpr = window.devicePixelRatio || 1;
      const W = container.clientWidth || 400;
      const H = container.clientHeight || 480;
      if (W < 10 || H < 10) return; // container not sized yet

      canvas.width = W * dpr;
      canvas.height = H * dpr;

      const ctx = canvas.getContext('2d')!;
      ctx.scale(dpr, dpr);

      // object-contain math — top-aligned
      const imgR = img.width / img.height;
      const boxR = W / H;
      let dw = W, dh = H, dx = 0; const dy = 0;
      if (imgR > boxR) { dh = W / imgR; }
      else { dw = H * imgR; dx = (W - dw) / 2; }

      ctx.clearRect(0, 0, W, H);

      ctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(img, dx, dy, dw, dh);

      if (color !== '#FFFFFF' && color !== '#ffffff') {
        ctx.globalCompositeOperation = 'source-atop';
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, W, H);

        ctx.globalCompositeOperation = 'multiply';
        ctx.drawImage(img, dx, dy, dw, dh);
      }
    };

    img.onload = () => { loaded = true; render(); };
    img.src = imgSrc;

    // Re-render when container resizes (e.g. on initial layout)
    const ro = new ResizeObserver(() => render());
    ro.observe(container);
    return () => ro.disconnect();
  }, [imgSrc, color]);

  return (
    <div ref={containerRef} className="w-full h-full">
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
}

// ─── Component: MiniPreview (droppable thumbnail, shows components only) ─────
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  garmentType?: string;
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
  garmentType = "RAGLAN",
}: DesignCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDropTarget, setIsDropTarget] = useState(false);

  // Show: elements matching this canvas's slot prop, elements with no slot,
  // AND elements placed via snap slots (front-center, chest-logo, back-center)
  // — those are keyed by side only, not by the "shirt" slot prop.
  const SNAP_SLOT_IDS = new Set(["front-center", "chest-logo", "back-center", "back-left", "back-right"]);
  const sideElements = elements.filter((el) =>
    el.side === side &&
    (el.slot === slot || !el.slot || SNAP_SLOT_IDS.has(el.slot ?? ""))
  );
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
        <TShirtSVG color={tshirtColor} side={side} garmentType={garmentType} />
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

// ─── AIImageCard — proxies Pollinations URLs to avoid CORS/hotlink issues ──────
function AIImageCard({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = React.useState(false);
  const [error, setError] = React.useState(false);
  const [attempt, setAttempt] = React.useState(0);
  const MAX_RETRIES = 5;

  // Build proxy URL — always route through our API to avoid CORS
  const buildProxySrc = React.useCallback((seed?: number) => {
    try {
      const pollinationsUrl = new URL(src);
      if (seed !== undefined) {
        pollinationsUrl.searchParams.set('seed', String(seed));
      }
      return `/api/proxy-image?url=${encodeURIComponent(pollinationsUrl.toString())}`;
    } catch {
      return `/api/proxy-image?url=${encodeURIComponent(src)}`;
    }
  }, [src]);

  const [proxySrc, setProxySrc] = React.useState(() => buildProxySrc());

  const retry = React.useCallback(() => {
    setError(false);
    setLoaded(false);
    setProxySrc(buildProxySrc(Math.floor(Math.random() * 99999)));
  }, [buildProxySrc]);

  const handleError = React.useCallback(() => {
    if (attempt < MAX_RETRIES) {
      setAttempt(a => a + 1);
      setTimeout(retry, 3000);
    } else {
      setError(true);
    }
  }, [attempt, retry]);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {!loaded && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none">
          <div className="w-7 h-7 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-[9px] text-violet-400 font-bold uppercase tracking-wider">
            {attempt > 0 ? `Retry ${attempt}/${MAX_RETRIES}...` : 'Generating...'}
          </span>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <span className="text-xl">⚠️</span>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setAttempt(0); retry(); }}
            className="text-[9px] text-violet-400 hover:text-violet-200 font-black uppercase tracking-wider border border-violet-500/40 rounded-lg px-2 py-1 hover:bg-violet-500/20 transition-all"
          >
            ↺ Retry
          </button>
        </div>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={proxySrc}
        src={proxySrc}
        alt={alt}
        className="w-full h-full object-contain p-2 transition-opacity duration-500"
        style={{ opacity: loaded ? 1 : 0 }}
        onLoad={() => setLoaded(true)}
        onError={handleError}
      />
    </div>
  );
}

// ─── Main Design Page ──────────────────────────────────────────
export default function DesignPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"ai" | "gallery" | "assets" | "type" | "color" | "layers" | null>("ai");
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
  const [suggestedDesigns, setSuggestedDesigns] = useState<AIImage[]>([]);
  const [uploadedImages, setUploadedImages] = useState<AIImage[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const suggestionsLoaded = useRef(false);
  // Login gate: redirect to /login instead of modal
  const genCountRef = useRef(0);
  const [genCount, setGenCount] = useState(0); // reactive display copy

  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);

  // Restore gen count and login state from sessionStorage (client-only)
  useEffect(() => {
    const saved = sessionStorage.getItem('ai_gen_count');
    if (saved) { const n = parseInt(saved, 10); genCountRef.current = n; setGenCount(n); }
    try {
      const u = sessionStorage.getItem('user');
      if (u && JSON.parse(u)?.token) setIsUserLoggedIn(true);
    } catch { /* ignore */ }
  }, []);

  const checkGenLimit = (): boolean => {
    // Allow unlimited AI generation for all users (guests included)
    genCountRef.current += 1;
    const next = genCountRef.current;
    setGenCount(next);
    sessionStorage.setItem('ai_gen_count', String(next));
    return true;
  };
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [fontPreviewText, setFontPreviewText] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [savePreviewUrl, setSavePreviewUrl] = useState("");
  const [projectName, setProjectName] = useState('VARSITY PRO JERSEY REV 1');
  const [orderInfo, setOrderInfo] = useState({
    name: '', phone: '', address: '', className: '', note: '',
    sizes: { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0 }
  });
  const frontCanvasRef = useRef<HTMLDivElement>(null);
  const backCanvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Admin mode ONLY via URL param ?admin=1 (set by admin sidebar link)
    // Never from sessionStorage — prevents homepage /design from showing admin UI
    const adminParam = new URLSearchParams(window.location.search).get("admin");
    if (adminParam === "1") setIsAdmin(true);
    setMounted(true);
  }, []);

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
    if (!checkGenLimit()) return;
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
      if (data.images && data.images.length > 0) {
        // Add to suggestedDesigns so they appear in the AI tab grid immediately
        setSuggestedDesigns(prev => [...data.images, ...prev]);
      }
      const aiMsg: ChatMessage = { id: `msg-${Date.now()}-ai`, role: "ai", content: `Protocol Engaged.`, images: data.images };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) { console.error(err); } finally { setIsLoading(false); }
  // checkGenLimit reads genCountRef.current directly — ref is always fresh, no stale closure
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Auto-load AI design suggestions on mount ──────────────────
  const SUGGESTION_PROMPTS = [
    "logo lớp A5 áo lớp ngầu 2026 varsity streetwear",
    "mascot rồng dragon ngầu class jersey",
    "galaxy cosmic y2k aesthetic neon"
  ];

  const loadSuggestions = useCallback(async () => {
    if (suggestionsLoading) return;
    setSuggestionsLoading(true);
    try {
      const allImages: AIImage[] = [];
      // Sequential with stagger — avoid Pollinations rate-limit
      for (let i = 0; i < SUGGESTION_PROMPTS.length; i++) {
        if (i > 0) await new Promise(r => setTimeout(r, 1500)); // 1.5s between requests
        try {
          const res = await fetch("/api/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: SUGGESTION_PROMPTS[i] }),
          });
          const data = await res.json();
          if (data.images) {
            allImages.push(...data.images);
            // Show images progressively as each one arrives
            setSuggestedDesigns(prev => {
              const existingIds = new Set(prev.map(p => p.id));
              const newImgs = data.images.filter((img: AIImage) => !existingIds.has(img.id));
              return [...prev, ...newImgs];
            });
          }
        } catch { /* skip failed suggestion */ }
      }
    } catch (err) { console.error("Suggestion load error:", err); }
    finally { setSuggestionsLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suggestionsLoading]);

  useEffect(() => {
    if (!suggestionsLoaded.current) {
      suggestionsLoaded.current = true;
      loadSuggestions();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Slot picker state ─────────────────────────────────────
  const [slotPicker, setSlotPicker] = useState<{ image: AIImage } | null>(null);

  // Open the slot picker instead of placing freely
  const handleDropImage = useCallback((image: AIImage) => {
    setSlotPicker({ image });
  }, []);

  // ── Client-side white background removal via Canvas API ───
  const removeWhiteBg = useCallback((src: string): Promise<string> => {
    return new Promise((resolve) => {
      // SVG data URIs: already vector, no bg removal needed
      if (src.startsWith("data:image/svg")) {
        resolve(src);
        return;
      }

      // External URLs: fetch through proxy to avoid CORS canvas taint
      const loadSrc = src.startsWith("http") ? `/api/proxy-image?url=${encodeURIComponent(src)}` : src;

      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth || 512;
          canvas.height = img.naturalHeight || 512;
          const ctx = canvas.getContext("2d")!;
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          // Remove near-white pixels (R,G,B all ≥ 230)
          const threshold = 228;
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i], g = data[i + 1], b = data[i + 2];
            if (r >= threshold && g >= threshold && b >= threshold) {
              data[i + 3] = 0;
            }
          }
          ctx.putImageData(imageData, 0, 0);
          resolve(canvas.toDataURL("image/png"));
        } catch {
          // Canvas tainted (CORS) — fall back to original
          resolve(src);
        }
      };
      img.onerror = () => resolve(src);
      img.src = loadSrc;
    });
  }, []);


  // Called once user picks a slot — removes white bg first, then places
  // Uses garment-aware slot positions (polo/raglan → chest logo, t-shirt → full front)
  const handlePlaceInSlot = useCallback(async (slotId: SnapSlotId) => {
    if (!slotPicker) return;
    const slots = getSnapSlots(garmentType);
    const slot = slots.find(s => s.id === slotId)!;
    // Strip white background client-side before placing
    const cleanUrl = await removeWhiteBg(slotPicker.image.url);
    setElements(prev => {
      pushHistory(prev);
      // Replace any existing element in this exact slot
      const filtered = prev.filter(el => el.slot !== slotId);
      return [...filtered, {
        id: `el-${Date.now()}`,
        type: "image" as const,
        label: slotPicker.image.label,
        url: cleanUrl,
        x: slot.x, y: slot.y,
        width: slot.width, height: slot.height,
        rotation: 0,
        side: slot.side,
        slot: slotId,
        locked: true,
      }];
    });
    setSlotPicker(null);
  }, [slotPicker, garmentType, pushHistory, removeWhiteBg]);

  // Drop image to a specific side (used by MiniPreview thumbnails)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
        const mockup = MOCKUP_MAP[garmentType] || MOCKUP_MAP['RAGLAN'];
        const shirtSrc = sideName === 'front' ? mockup.front : mockup.back;
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
  }, [elements, tshirtColor, garmentType]);

  // Generate a quick front-side preview PNG for "Save to Collection"
  const handleSaveToCollection = useCallback(async () => {
    setIsExporting(true);
    try {
      const loadImg = (src: string): Promise<HTMLImageElement> => new Promise((resolve, reject) => {
        const img = new window.Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });
      const EXPORT_W = 400, EXPORT_H = 480;
      const c = document.createElement('canvas');
      c.width = EXPORT_W; c.height = EXPORT_H;
      const ctx = c.getContext('2d')!;
      const mockup = MOCKUP_MAP[garmentType];
      if (mockup) {
        try {
          const bg = await loadImg(mockup.front);
          const ratio = bg.naturalWidth / bg.naturalHeight;
          const drawH = ratio > (EXPORT_W / EXPORT_H) ? EXPORT_H : EXPORT_W / ratio;
          const drawW = ratio > (EXPORT_W / EXPORT_H) ? EXPORT_H * ratio : EXPORT_W;
          const dx = (EXPORT_W - drawW) / 2, dy = (EXPORT_H - drawH) / 2;
          ctx.fillStyle = tshirtColor;
          ctx.fillRect(0, 0, EXPORT_W, EXPORT_H);
          ctx.drawImage(bg, dx, dy, drawW, drawH);
        } catch { ctx.fillStyle = tshirtColor; ctx.fillRect(0, 0, EXPORT_W, EXPORT_H); }
      } else { ctx.fillStyle = tshirtColor; ctx.fillRect(0, 0, EXPORT_W, EXPORT_H); }
      // Draw front elements
      const frontElements = elements.filter(el => !el.side || el.side === 'front');
      for (const el of frontElements) {
        if (el.type === 'text') {
          ctx.save();
          ctx.font = `${(el.fontWeight || '').toString().toLowerCase() === 'italic' ? 'italic ' : ''}${el.fontWeight || 700} ${(el.fontSize ?? 16) * (EXPORT_W / 400)}px ${el.fontFamily || 'sans-serif'}`;
          ctx.fillStyle = el.textColor || '#000000';
          ctx.textAlign = 'center';
          ctx.fillText(el.text || '', el.x * (EXPORT_W / 400), el.y * (EXPORT_H / 480));
          ctx.restore();
        } else if (el.type === 'image' && el.url) {
          try {
            const img = await loadImg(el.url);
            const ew = el.width * (EXPORT_W / 400);
            const eh = el.height * (EXPORT_H / 480);
            ctx.drawImage(img, el.x * (EXPORT_W / 400) - ew / 2, el.y * (EXPORT_H / 480) - eh / 2, ew, eh);
          } catch { /* skip */ }
        }
      }
      const dataUrl = c.toDataURL('image/png');
      setSavePreviewUrl(dataUrl);
      // Store data in sessionStorage and open in new tab
      sessionStorage.setItem('unispace_save_draft', JSON.stringify({
        previewUrl: dataUrl,
        garmentType,
        color: tshirtColor,
        ts: Date.now(),
      }));
      window.open('/admin/save-collection', '_blank');
    } catch (err) {
      console.error('Save preview failed:', err);
      alert('Không thể tạo preview');
    } finally {
      setIsExporting(false);
    }
  }, [elements, tshirtColor, garmentType]);

  // Open a new tab showing front+back previews with download buttons (admin only)
  const handleOpenPreviewTab = useCallback(async () => {
    setIsExporting(true);
    try {
      const loadImg = (src: string): Promise<HTMLImageElement> => new Promise((resolve, reject) => {
        const img = new window.Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });
      const EXPORT_W = 800, EXPORT_H = 960;
      const renderSideForPreview = async (side: 'front' | 'back') => {
        const c = document.createElement('canvas');
        c.width = EXPORT_W; c.height = EXPORT_H;
        const ctx = c.getContext('2d')!;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, EXPORT_W, EXPORT_H);
        const mockup = MOCKUP_MAP[garmentType] || MOCKUP_MAP['RAGLAN'];
        const shirtSrc = side === 'front' ? mockup.front : mockup.back;
        try {
          const shirtImg = await loadImg(shirtSrc);
          const imgRatio = shirtImg.width / shirtImg.height;
          const canvasRatio = EXPORT_W / EXPORT_H;
          let drawW = EXPORT_W, drawH = EXPORT_H, drawX = 0, drawY = 0;
          if (imgRatio > canvasRatio) { drawH = EXPORT_W / imgRatio; drawY = (EXPORT_H - drawH) / 2; }
          else { drawW = EXPORT_H * imgRatio; drawX = (EXPORT_W - drawW) / 2; }
          ctx.drawImage(shirtImg, drawX, drawY, drawW, drawH);
          if (tshirtColor !== '#FFFFFF' && tshirtColor !== '#ffffff') {
            const tmp = document.createElement('canvas');
            tmp.width = EXPORT_W; tmp.height = EXPORT_H;
            const tCtx = tmp.getContext('2d')!;
            tCtx.fillStyle = tshirtColor;
            tCtx.fillRect(drawX, drawY, drawW, drawH);
            tCtx.globalCompositeOperation = 'destination-in';
            tCtx.drawImage(shirtImg, drawX, drawY, drawW, drawH);
            ctx.globalCompositeOperation = 'multiply';
            ctx.drawImage(tmp, 0, 0);
            ctx.globalCompositeOperation = 'source-over';
          }
        } catch { /* no mockup */ }
        const scaleX = EXPORT_W / 400;
        const scaleY = EXPORT_H / 480;
        const sideElements = elements.filter(el => el.side === side);
        for (const el of sideElements) {
          const x = el.x * scaleX; const y = el.y * scaleY;
          const boxW = el.width * scaleX; const boxH = el.height * scaleY;
          if (el.type === 'image' && el.url) {
            try {
              const elImg = await loadImg(el.url);
              const ir = elImg.naturalWidth / elImg.naturalHeight; const br = boxW / boxH;
              let iw = boxW, ih = boxH, ix = x, iy = y;
              if (ir > br) { ih = boxW / ir; iy = y + (boxH - ih) / 2; }
              else { iw = boxH * ir; ix = x + (boxW - iw) / 2; }
              ctx.drawImage(elImg, ix, iy, iw, ih);
            } catch { /* skip */ }
          } else if (el.type === 'text' && el.text) {
            ctx.save();
            const fontSize = (el.fontSize || 32) * scaleX;
            const fontStr = `${el.fontWeight || '900'} ${fontSize}px ${el.fontFamily || 'sans-serif'}`;
            try { await document.fonts.load(fontStr); } catch { /* skip */ }
            ctx.font = fontStr;
            ctx.fillStyle = el.textColor || '#000000';
            ctx.textBaseline = 'top';
            const words = el.text.split(' ');
            let line = ''; const lh = fontSize * 1.2; let dy = y;
            for (const w of words) {
              const test = line ? `${line} ${w}` : w;
              if (ctx.measureText(test).width > boxW && line) { ctx.fillText(line, x, dy); line = w; dy += lh; }
              else { line = test; }
            }
            if (line) ctx.fillText(line, x, dy);
            ctx.restore();
          }
        }
        return c.toDataURL('image/png');
      };
      const [frontData, backData] = await Promise.all([
        renderSideForPreview('front'),
        renderSideForPreview('back'),
      ]);
      sessionStorage.setItem('design_preview_front', frontData);
      sessionStorage.setItem('design_preview_back', backData);
      sessionStorage.setItem('design_config', JSON.stringify({ garmentType, tshirtColor, projectName }));
      window.open('/design/preview', '_blank');
    } catch (err) {
      console.error('Preview tab failed:', err);
      alert('Không thể mở preview');
    } finally {
      setIsExporting(false);
    }
  }, [elements, tshirtColor, garmentType, projectName]);

  const handleProceedToOrder = useCallback(async () => {
    setIsExporting(true);
    try {
      const loadImg = (src: string): Promise<HTMLImageElement> => new Promise((resolve, reject) => {
        const img = new window.Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });

      const EXPORT_W = 800, EXPORT_H = 960;
      
      const renderSide = async (side: 'front' | 'back') => {
        const c = document.createElement('canvas');
        c.width = EXPORT_W; c.height = EXPORT_H;
        const ctx = c.getContext('2d')!;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, EXPORT_W, EXPORT_H);

        const mockup = MOCKUP_MAP[garmentType] || MOCKUP_MAP['RAGLAN'];
        const shirtSrc = side === 'front' ? mockup.front : mockup.back;
        
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
          ctx.drawImage(shirtImg, drawX, drawY, drawW, drawH);

          if (tshirtColor !== '#FFFFFF' && tshirtColor !== '#ffffff') {
            const tmp = document.createElement('canvas');
            tmp.width = EXPORT_W; tmp.height = EXPORT_H;
            const tCtx = tmp.getContext('2d')!;
            tCtx.fillStyle = tshirtColor;
            tCtx.fillRect(drawX, drawY, drawW, drawH);
            tCtx.globalCompositeOperation = 'destination-in';
            tCtx.drawImage(shirtImg, drawX, drawY, drawW, drawH);
            ctx.globalCompositeOperation = 'multiply';
            ctx.drawImage(tmp, 0, 0);
            ctx.globalCompositeOperation = 'source-over';
          }
        } catch {}

        // Elements use virtual 400×480 coordinate space — scale directly to export size
        const scaleX = EXPORT_W / 400;
        const scaleY = EXPORT_H / 480;
        const sideElements = elements.filter(el => el.side === side);
        for (const el of sideElements) {
          const x = el.x * scaleX;
          const y = el.y * scaleY;
          const boxW = el.width * scaleX;
          const boxH = el.height * scaleY;

          if (el.type === 'image' && el.url) {
            try {
              const elImg = await loadImg(el.url);
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
            } catch {}
          } else if (el.type === 'text' && el.text) {
            ctx.save();
            const fontSize = (el.fontSize || 32) * scaleX;
            const fontStr = `${el.fontWeight || '900'} ${fontSize}px ${el.fontFamily || 'sans-serif'}`;
            try { await document.fonts.load(fontStr); } catch {}
            ctx.font = fontStr;
            ctx.fillStyle = el.textColor || '#000000';
            ctx.textBaseline = 'top';
            const words = el.text.split(' ');
            let line = '';
            const lh = fontSize * 1.2;
            let dy = y;
            for (const w of words) {
              const test = line ? `${line} ${w}` : w;
              if (ctx.measureText(test).width > boxW && line) {
                ctx.fillText(line, x, dy);
                line = w;
                dy += lh;
              } else { line = test; }
            }
            if (line) ctx.fillText(line, x, dy);
            ctx.restore();
          }
        }
        return c.toDataURL('image/png');
      };

      const front = await renderSide('front');
      const back = await renderSide('back');

      // Save to sessionStorage for order page
      sessionStorage.setItem('design_preview_front', front);
      sessionStorage.setItem('design_preview_back', back);
      sessionStorage.setItem('design_config', JSON.stringify({
        garmentType,
        tshirtColor,
        projectName
      }));

      if (isAdmin) {
        router.push('/admin/publish');
      } else {
        router.push('/order');
      }
    } catch (err) {
      console.error('Proceed to order failed:', err);
      if (isAdmin) router.push('/admin/publish');
      else router.push('/order');
    } finally {
      setIsExporting(false);
    }
  }, [elements, tshirtColor, garmentType, projectName, router, isAdmin, isUserLoggedIn]);

  const handleMoveElement = useCallback((id: string, x: number, y: number) => {
    // Images placed in snap slots are locked — no movement
    setElements(prev => prev.map(el => (el.id === id && !el.locked) ? { ...el, x, y } : el));
  }, []);

  const handleResizeElement = useCallback((id: string, width: number, height: number, x?: number, y?: number) => {
    setElements(prev => prev.map(el => (el.id === id ? { ...el, width, height, ...(x !== undefined ? { x } : {}), ...(y !== undefined ? { y } : {}) } : el)));
  }, []);

  return (
    <div className="flex flex-col h-[100dvh] bg-white overflow-hidden font-sans text-black">

      {/* ── SLOT PICKER MODAL ─────────────────────────────── */}
      {slotPicker && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center slot-picker-overlay" onClick={() => setSlotPicker(null)}>
          <div className="rounded-2xl p-6 w-[340px] flex flex-col gap-4 slot-picker-panel" onClick={e => e.stopPropagation()}>
            {/* Preview */}
            <div className="flex items-center gap-3 pb-3 slot-picker-preview-row">
              <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 slot-picker-preview-thumb">
                <Image src={slotPicker.image.url} alt={slotPicker.image.label} width={56} height={56} unoptimized className="w-full h-full object-contain p-1" />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-white">{slotPicker.image.label}</p>
                <p className="text-[10px] text-purple-400 mt-0.5">Chọn vị trí đặt thiết kế</p>
              </div>
            </div>

            {/* Slot options */}
            <div className="flex flex-col gap-2">
              {getSnapSlots(garmentType).map(slot => (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => handlePlaceInSlot(slot.id)}
                  className="slot-picker-btn flex items-center gap-3 p-3 rounded-xl text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <div className="slot-picker-icon w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-lg">
                    {slot.id === 'front-center' && (
                      <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="3" y="3" width="16" height="16" rx="2" fill="#7C3AED" opacity="0.5"/><rect x="6" y="6" width="10" height="10" rx="1" fill="#a78bfa"/></svg>
                    )}
                    {slot.id === 'chest-logo' && (
                      <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="3" y="3" width="16" height="16" rx="2" fill="#7C3AED" opacity="0.2"/><rect x="4" y="4" width="8" height="8" rx="1" fill="#a78bfa"/></svg>
                    )}
                    {slot.id === 'back-center' && (
                      <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="3" y="3" width="16" height="16" rx="2" fill="#7C3AED" opacity="0.3" strokeDasharray="3 2" stroke="#a78bfa" strokeWidth="1"/><rect x="6" y="6" width="10" height="10" rx="1" fill="#7C3AED" opacity="0.7"/></svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-black text-white uppercase tracking-wider">{slot.label}</p>
                    <p className="text-[10px] text-purple-400 mt-0.5">{slot.desc}</p>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
                </button>
              ))}
            </div>

            <button type="button" onClick={() => setSlotPicker(null)} className="text-center text-[10px] text-gray-500 hover:text-gray-300 font-bold uppercase tracking-widest transition-colors mt-1">HỦY</button>
          </div>
        </div>
      )}

      {/* NAV — white bar, black border per spec */}
      <header className="h-12 bg-[#7C3AED] border-b border-[#5b21b6] flex items-center justify-between px-4 shrink-0 z-50">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center" aria-label="UniSpace - Trang chủ">
            <Logo scale={0.45} />
          </Link>
          <div className="h-5 w-px bg-white/30 hidden sm:block" />
          <div className="flex items-center gap-0.5">
            <button type="button" onClick={handleUndo} className="p-1.5 hover:bg-white/10 text-white/50 hover:text-white transition-colors" title="Undo"><Undo2 size={14} /></button>
            <button type="button" onClick={handleRedo} className="p-1.5 hover:bg-white/10 text-white/50 hover:text-white transition-colors" title="Redo"><Redo2 size={14} /></button>
          </div>
        </div>
        {/* Centered project title */}
        <div className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center gap-2">
          <span className="text-[10px] font-black text-white/90 uppercase tracking-[0.15em]">{projectName || 'UNTITLED'}</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Admin: Preview & Save buttons — only render after client mount to avoid hydration mismatch */}
          {mounted && isAdmin && (
            <>
              <button type="button" onClick={handleOpenPreviewTab} disabled={isExporting}
                className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-black uppercase tracking-widest bg-[#111] text-white border border-white/20 hover:bg-white/10 transition-colors disabled:opacity-40">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                PREVIEW
              </button>
              <button type="button" onClick={handleSaveToCollection} disabled={isExporting}
                className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-black uppercase tracking-widest bg-[#7C3AED] text-white hover:bg-[#7C3AED]/80 transition-colors disabled:opacity-40">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                SAVE
              </button>
            </>
          )}
          <button type="button" onClick={handleProceedToOrder} disabled={isExporting}
            className="design-header-btn-export">
            <span className="design-header-btn-slide" />
            <span className="design-header-btn-content">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              {isExporting ? '...' : (mounted && isAdmin ? 'REVIEW_&_PUBLISH' : 'ORDER NOW')}
            </span>
          </button>
          <Link href="/"
            className="design-header-btn-back">
            <svg className="design-back-arrow" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/></svg>
            BACK
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">

        {/* ── BLUEPRINT PANEL: full-width on mobile, fixed 820px on desktop ── */}
        <section className="w-full md:w-[820px] shrink-0 flex flex-col bg-white border-b md:border-b-0 md:border-r border-black overflow-hidden h-[calc(100dvh-48px)] max-h-[calc(100dvh-48px)]">

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
              { }
              <div className="w-3 h-3 rounded border border-black/20 shrink-0" ref={(el) => { if (el) el.style.backgroundColor = tshirtColor; }} />
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

            {/* Mobile: Front/Back toggle — pill floating top-center */}
            <div className="md:hidden absolute top-3 left-1/2 -translate-x-1/2 z-20 flex rounded-lg overflow-hidden border border-black/30 bg-white shadow-md">
              <button type="button" onClick={() => setSide('front')}
                className={`px-4 py-2 text-[11px] font-black uppercase tracking-wider transition-colors ${side === 'front' ? 'bg-black text-white' : 'bg-white text-black/50'}`}>FRONT</button>
              <button type="button" onClick={() => setSide('back')}
                className={`px-4 py-2 text-[11px] font-black uppercase tracking-wider transition-colors ${side === 'back' ? 'bg-black text-white' : 'bg-white text-black/50'}`}>BACK</button>
            </div>

            {/* Garment Style badge */}
            <div className="absolute top-3 left-[70px] z-20 hidden md:flex items-center gap-2">
              <span className="text-[8px] font-black uppercase tracking-wider text-gray-500">Garment Style</span>
              <div className="px-3 py-1 bg-white border border-black rounded text-[9px] font-black uppercase flex items-center gap-1.5 shadow-sm">
                RAGLAN <span className="text-[7px] text-gray-400">▼</span>
              </div>
            </div>

            {/* Annotations moved inside each canvas container below for correct positioning */}

            { }
            <div className="relative h-full flex p-3" onDragOver={(e) => e.preventDefault()} ref={(el) => { if (el) { el.style.transform = `scale(${zoom}) translate(${panX / zoom}px, ${panY / zoom}px)`; el.style.transformOrigin = 'center center'; el.style.transition = 'transform 0.05s ease-out'; } }}>

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
                  { hex: '#a78bfa', cmyk: '65 66 0 0' },
                  { hex: '#E63B2E', cmyk: '0 84 88 0' },
                  { hex: '#87CEEB', cmyk: '42 11 0 0' },
                  { hex: '#FFB6C1', cmyk: '0 29 24 0' },
                ].map(c => (
                  <button key={c.hex} type="button" onClick={() => setTshirtColor(c.hex)} title={c.hex} className="text-left group">
                    { }
                          <div className={`w-5 h-5 border mb-0.5 transition-all ${tshirtColor === c.hex ? 'border-black ring-1 ring-offset-1 ring-black scale-110' : 'border-gray-300'}`}
                      ref={(el) => { if (el) el.style.backgroundColor = c.hex; }} />
                    <span className="text-[4px] font-black uppercase leading-tight block text-gray-400 group-hover:text-gray-700 transition-colors">{c.cmyk}</span>
                  </button>
                ))}
              </div>

              {/* MAIN: desktop = 2 rows (back + front), mobile = active side only */}
              <div className="flex-1 flex flex-row gap-0 overflow-hidden h-full min-h-0">

                {/* ── BACK VIEW — shown always on desktop, mobile only when side=back ── */}
                <div className={`overflow-hidden ${side === 'back' ? 'flex-1' : 'md:flex-1 hidden md:flex'} h-full`}>
                  <div className="flex flex-col items-center h-full min-h-0 w-full">
                    <span className="text-[7px] font-black uppercase text-gray-500 tracking-widest mb-0 shrink-0">BACK VIEW</span>
                    <div ref={backCanvasRef} className="flex-1 w-full min-h-0 relative">
                      <DesignCanvas
                        elements={elements} selectedId={selectedId} onSelectElement={setSelectedId}
                        onMoveElement={handleMoveElement} onResizeElement={handleResizeElement}
                        onPushHistory={() => pushHistory(elements)} onDropImage={handleDropImage} onDropText={handleDropTextBack}
                        side="back" tshirtColor={tshirtColor} garmentType={garmentType}
                      />
                      {/* Back view annotations — mapped to 990×1100 canvas coords */}
                      <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 hidden md:block" viewBox="0 0 990 1100" preserveAspectRatio="xMidYMin meet" xmlns="http://www.w3.org/2000/svg">
                        {ANNOTATIONS_BY_TYPE[getGarmentTypeKey(garmentType)].back.map((group, gi) => (
                          <React.Fragment key={`back-${gi}`}>
                            {group.lines.map((line, li) => (
                              <line key={`line-${li}`} x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} stroke="black" strokeWidth="1" strokeDasharray="6 3" />
                            ))}
                            {group.labels.map((label, li) => (
                              <text key={`label-${li}`} x={label.x} y={label.y} fontSize="16" fontFamily="monospace" fontWeight="900" fill="black">{label.text}</text>
                            ))}
                          </React.Fragment>
                        ))}
                      </svg>
                    </div>
                  </div>
                </div>

                {/* ── FRONT VIEW — shown always on desktop, mobile only when side=front ── */}
                <div className={`overflow-hidden ${side === 'front' ? 'flex-1' : 'md:flex-1 hidden md:flex'} h-full`}>
                  <div className="flex flex-col items-center h-full min-h-0 w-full">
                    <span className="text-[7px] font-black uppercase text-gray-500 tracking-widest mb-0 shrink-0">FRONT VIEW</span>
                    <div ref={frontCanvasRef} className="flex-1 w-full min-h-0 relative">
                      <DesignCanvas
                        elements={elements} selectedId={selectedId} onSelectElement={setSelectedId}
                        onMoveElement={handleMoveElement} onResizeElement={handleResizeElement}
                        onPushHistory={() => pushHistory(elements)} onDropImage={handleDropImage} onDropText={handleDropTextFront}
                        side="front" tshirtColor={tshirtColor} garmentType={garmentType}
                      />
                      {/* Front view annotations — mapped to 990×1100 canvas coords */}
                      <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 hidden md:block" viewBox="0 0 990 1100" preserveAspectRatio="xMidYMin meet" xmlns="http://www.w3.org/2000/svg">
                        {ANNOTATIONS_BY_TYPE[getGarmentTypeKey(garmentType)].front.map((group, gi) => (
                          <React.Fragment key={`front-${gi}`}>
                            {group.lines.map((line, li) => (
                              <line key={`line-${li}`} x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} stroke="black" strokeWidth="1" strokeDasharray="6 3" />
                            ))}
                            {group.labels.map((label, li) => (
                              <text key={`label-${li}`} x={label.x} y={label.y} fontSize="16" fontFamily="monospace" fontWeight="900" fill="black">{label.text}</text>
                            ))}
                          </React.Fragment>
                        ))}
                      </svg>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Zoom controls — brutalist square corners per spec §6 */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center z-30 border border-black/40 bg-black/90">
              {selectedId && (
                <button type="button" onClick={handleDeleteSelected} className="w-8 h-8 bg-red-600 hover:bg-red-500 text-white flex items-center justify-center transition-all border-r border-black/40" title="Delete selected (Del)">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
              )}
              <button type="button" onClick={() => setZoom(z => Math.max(0.3, z - 0.1))} className="w-8 h-8 text-white/60 hover:text-white hover:bg-white/10 flex items-center justify-center transition-all text-sm font-black border-r border-black/40">−</button>
              <span className="text-[9px] font-mono text-[#7C3AED] font-black px-3 min-w-[44px] text-center">{Math.round(zoom * 100)}%</span>
              <button type="button" onClick={() => setZoom(z => Math.min(3, z + 0.1))} className="w-8 h-8 text-white/60 hover:text-white hover:bg-white/10 flex items-center justify-center transition-all text-sm font-black border-l border-r border-black/40">+</button>
              <button type="button" onClick={() => { setZoom(1); setPanX(0); setPanY(0); }} className="w-8 h-8 text-white/60 hover:text-white hover:bg-white/10 flex items-center justify-center transition-all" title="Reset zoom & pan">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>
              </button>
            </div>

          </div>
        </section>

        {/* ── VERTICAL ICON TOOLBAR — Glacier glass strip ── */}
        <div className="hidden md:flex flex-col items-center py-6 gap-5 shrink-0 w-[64px] gl-panel-deep border-r border-white/5 shadow-2xl relative z-50">
          {(['ai', 'gallery', 'assets', 'layers', 'color'] as const).map((id) => {
            const tabData = {
              ai: { icon: Zap, title: 'AI Generate' },
              gallery: { icon: ImageIcon, title: 'Gallery' },
              assets: { icon: Type, title: 'Text Tool' },
              layers: { icon: LayersIcon, title: 'Layers' },
              color: { icon: PaletteIcon, title: 'Palette' },
            }[id];
            
            const Icon = tabData.icon;
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(prev => prev === id ? null : id)}
                className={`group relative w-11 h-11 flex items-center justify-center transition-all duration-300 rounded-2xl ${
                  isActive ? 'text-white' : 'text-gray-500 hover:text-violet-300'
                }`}
                title={tabData.title}
              >
                {/* Active Background Glow */}
                {isActive && (
                  <>
                    <div className="absolute inset-0 bg-violet-600 rounded-2xl shadow-[0_0_20px_rgba(139,92,246,0.5)] animate-in fade-in zoom-in duration-300" />
                    <div className="absolute -inset-1 bg-violet-600/20 blur-md rounded-2xl animate-pulse" />
                  </>
                )}
                
                {/* Hover Background */}
                {!isActive && (
                  <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 rounded-2xl transition-all duration-300 scale-90 group-hover:scale-100" />
                )}

                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} className="relative z-10 transition-transform duration-300 group-hover:scale-110" />
                
                {/* Active Side Indicator */}
                {isActive && (
                  <div className="absolute -left-[3px] top-1/2 -translate-y-1/2 w-[6px] h-8 bg-violet-400 rounded-r-full shadow-[2px_0_10px_rgba(139,92,246,0.8)]" />
                )}
              </button>
            );
          })}
          
          <div className="flex-1" />
          
          <button type="button" className="w-11 h-11 flex items-center justify-center text-gray-600 hover:text-violet-300 transition-all rounded-2xl hover:bg-white/5" title="Settings">
            <LayersIcon size={20} />
          </button>
        </div>

        {/* ── RIGHT: GLACIER PANEL ── */}
        <aside className={`
          fixed md:static inset-x-0 bottom-0 md:inset-auto
          flex-1 md:h-full flex flex-col overflow-hidden
          transition-transform duration-300 z-40 md:z-auto
          ${activeTab !== null ? 'translate-y-0' : 'translate-y-full md:translate-y-0'}
          md:translate-y-0 h-[72vh] md:h-full gl-panel-deep
        `}>
          {/* Mobile drag handle + close */}
          <div className="flex items-center justify-between px-4 pt-3 pb-1 md:hidden shrink-0">
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto absolute left-1/2 -translate-x-1/2" />
            <div />
            <button type="button" onClick={() => setActiveTab(null)} aria-label="Đóng bảng công cụ" className="ml-auto p-1.5 rounded-full hover:bg-white/10 text-gray-400">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>

          {/* Mobile: horizontal tab switcher */}
          <div className="flex md:hidden items-center gap-1.5 px-3 pb-2 overflow-x-auto scrollbar-hide shrink-0">
            {(['ai', 'gallery', 'assets', 'layers', 'color'] as const).map((id) => {
              const info: Record<string, { label: string; path: string }> = {
                ai:      { label: 'AI',      path: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z' },
                gallery: { label: 'Gallery', path: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' },
                assets:  { label: 'Text',    path: 'M4 6h16M4 12h16M4 18h7' },
                layers:  { label: 'Layers',  path: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5' },
                color:   { label: 'Colors',  path: 'M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16z' },
              };
              const t = info[id];
              return (
                <button key={id} type="button" onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold uppercase whitespace-nowrap shrink-0 transition-all ${
                    activeTab === id ? 'bg-violet-600 text-white shadow-lg' : 'text-gray-500 bg-white/5'
                  }`}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d={t.path}/></svg>
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Garment type tabs — Glacier style */}
          <div className="flex px-2 pt-2.5 shrink-0 gap-1.5 gl-panel-deep gl-border-dim">
            {(['T-SHIRT', 'RAGLAN', 'POLO'] as const).map(type => (
              <button key={type}
                type="button"
                onClick={() => setGarmentType(type)}
                className={`flex-1 py-3 text-center text-[13px] font-bold uppercase tracking-wider transition-all relative overflow-hidden rounded-t-xl font-[family-name:var(--font-space-grotesk)] ${
                  type === garmentType
                    ? 'text-white gl-tab-active shadow-[0_-4px_12px_rgba(139,92,246,0.2)]'
                    : 'text-gray-500 hover:text-violet-300'
                }`}>
                <span className="relative z-10">{type}</span>
              </button>
            ))}
          </div>



          {/* Content area — glass surface */}
          <div className="flex-1 overflow-y-auto scrollbar-hide p-3 gl-surface-mid">

            {activeTab === "ai" && (
              <div className="flex flex-col gap-4 h-full">

                {/* AI Design Suggestions — auto-generated on mount */}
                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400">AI SUGGESTIONS</span>
                  <button
                    type="button"
                    onClick={loadSuggestions}
                    disabled={suggestionsLoading}
                    className="text-[9px] font-bold uppercase tracking-wider text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1"
                  >
                    <RefreshCw size={10} className={suggestionsLoading ? 'animate-spin' : ''} />
                    {suggestionsLoading ? 'GENERATING...' : 'REFRESH'}
                  </button>
                </div>

                {suggestionsLoading && suggestedDesigns.length === 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="aspect-square rounded-xl gl-panel animate-pulse flex items-center justify-center">
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-violet-500/20 animate-pulse" />
                          <span className="text-[9px] font-bold text-gray-600 uppercase tracking-wider">Generating...</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : suggestedDesigns.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {suggestedDesigns.map((img) => (
                      <button key={img.id}
                        type="button"
                        onClick={() => handleDropImage(img)}
                        className="group relative overflow-hidden hover:scale-[1.02] active:scale-[0.98] transition-all flex flex-col rounded-xl gl-panel gl-border-bright"
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData("application/json", JSON.stringify(img))}
                        title={`Add ${img.label} to canvas`}
                      >
                        <div className="w-full py-1 px-2 text-[9px] font-black uppercase tracking-[0.12em] text-center text-[#0a0e1a] gl-accent-badge flex items-center justify-center gap-1">
                          <Sparkles size={8} />
                          AI GENERATED
                        </div>
                        <div className="relative aspect-square w-full overflow-hidden bg-white/5 flex items-center justify-center">
                          {img.url.startsWith('data:') ? (
                            <Image src={img.url} alt={img.label} width={200} height={200} unoptimized className="w-full h-full object-contain p-2" />
                          ) : (
                            // External Pollinations URL — plain img with spinner overlay
                            <AIImageCard src={img.url} alt={img.label} />
                          )}
                        </div>
                        <div className="px-2 py-1.5 flex items-center justify-between gl-border-top">
                          <span className="text-[10px] font-bold text-violet-300 tracking-wide truncate">{img.label}</span>
                          <div className="w-5 h-5 rounded-md flex items-center justify-center gl-icon-bg shrink-0">
                            <Plus size={10} className="text-violet-400" />
                          </div>
                        </div>
                        {/* Hover overlay */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center ai-hover-overlay">
                          <div className="flex flex-col items-center gap-1.5">
                            <Plus size={22} className="text-white drop-shadow-lg" />
                            <span className="text-[10px] font-black uppercase text-white tracking-widest">APPLY</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="py-10 text-center">
                    <Sparkles size={28} className="mx-auto mb-2 text-violet-400/30" />
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">No suggestions yet</p>
                    <button type="button" onClick={loadSuggestions} className="mt-2 text-[10px] text-violet-400 hover:text-violet-300 font-bold uppercase tracking-wider">
                      Generate Now
                    </button>
                  </div>
                )}

                {isLoading && (
                  <div className="flex items-center gap-2 p-3 rounded-lg gl-icon-bg-dim gl-border">
                    <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" />
                    <span className="text-[11px] font-black uppercase text-gray-400">Generating...</span>
                  </div>
                )}

                {/* Gen limit indicator — shown only when near limit (100 free gens) */}
                {mounted && !isUserLoggedIn && genCount >= 90 && (
                  <div className="flex items-center justify-between px-3 py-1.5 rounded-lg adm-mono text-[10px] bg-amber-500/10 border border-amber-500/30">
                    <span className="text-amber-400">Còn {100 - genCount} lượt miễn phí</span>
                    <button type="button" onClick={() => router.push('/login')} className="text-[10px] font-black text-amber-400 hover:text-amber-300 uppercase tracking-wider transition-colors">Đăng nhập →</button>
                  </div>
                )}

                {/* Chat input */}
                <div className="relative mt-auto pt-4 group">
                  {/* Glowing border wrapper */}
                  <div className="relative p-[2px] rounded-[24px] bg-gradient-to-r from-violet-600/40 via-fuchsia-500/40 to-violet-600/40 group-focus-within:from-violet-500 group-focus-within:via-fuchsia-400 group-focus-within:to-violet-500 transition-all duration-500">
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-fuchsia-600 blur-xl opacity-20 group-focus-within:opacity-50 transition-opacity rounded-[24px] pointer-events-none" />
                    
                    <div className="relative flex items-center bg-[#070410] rounded-[22px] overflow-hidden shadow-2xl">
                      <input
                        value={chatInput} onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && chatInput.trim() && (handleSendMessage(chatInput.trim()), setChatInput(""))}
                        placeholder="Mô tả ý tưởng..."
                        className="flex-1 px-6 py-5 text-[16px] outline-none transition-all text-white placeholder:text-violet-300/30 bg-transparent font-[family-name:var(--font-space-grotesk)]"
                      />
                      <div className="pr-2 py-2">
                        <button
                          type="button"
                          onClick={() => chatInput.trim() && (handleSendMessage(chatInput.trim()), setChatInput(""))}
                          disabled={isLoading}
                          title="Generate AI design"
                          className="w-12 h-12 flex items-center justify-center bg-white text-[#4c1d95] rounded-[16px] hover:shadow-[0_0_25px_rgba(255,255,255,0.8)] hover:scale-105 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Zap size={24} className={isLoading ? "animate-pulse" : "fill-[#4c1d95]"} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "gallery" && (
              <div className="flex flex-col gap-4 animate-in fade-in duration-300 h-full flex flex-col">
                <div className="flex justify-between items-center px-1 shrink-0">
                  <span className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400">YOUR GALLERY</span>
                </div>

                <div className="flex-1 overflow-y-auto pr-1 scrollbar-hide flex flex-col gap-4">
                  {(() => {
                    const aiImages = messages.filter(m => m.role === "ai").flatMap(m => m.images || []);
                    const allImages = [...uploadedImages, ...aiImages];
                    
                    return (
                      <>
                        {allImages.length === 0 ? (
                          <div className="py-10 text-center text-gray-600 gl-panel rounded-xl border-dashed border-2 border-white/5">
                            <ImageIcon size={32} className="mx-auto mb-3 text-violet-400/20" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Empty Gallery</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-3">
                            {allImages.map((img) => (
                              <button key={img.id}
                                type="button"
                                onClick={() => handleDropImage(img)}
                                className="group relative overflow-hidden hover:scale-[1.02] transition-all flex flex-col rounded-xl gl-panel gl-border-bright"
                                draggable
                                onDragStart={(e) => e.dataTransfer.setData("application/json", JSON.stringify(img))}
                                title={`Add ${img.label}`}
                              >
                                <div className="relative aspect-[4/3] w-full rounded-t-xl overflow-hidden">
                                  <Image src={img.url} alt={img.label} width={200} height={150} unoptimized className="w-full h-full object-cover" />
                                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gl-icon-bg">
                                    <Plus size={20} className="text-white drop-shadow-lg" />
                                  </div>
                                </div>
                                <div className="px-3 py-2 flex items-center justify-between">
                                  <span className="text-[10px] font-semibold text-violet-300 tracking-wide truncate">{img.label}</span>
                                  <Sparkles size={10} className="text-violet-400/40 shrink-0" />
                                </div>
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Big Upload Area */}
                        <label className="group relative cursor-pointer mt-2">
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const newImage = {
                                id: `upload-${Date.now()}`,
                                url: URL.createObjectURL(file),
                                label: file.name
                              };
                              setUploadedImages(prev => [newImage, ...prev]);
                            }
                            e.target.value = '';
                          }} />
                          <div className="flex flex-col items-center justify-center gap-3 py-8 px-4 rounded-2xl border-2 border-dashed border-violet-500/20 bg-violet-500/5 hover:bg-violet-500/10 hover:border-violet-500/40 transition-all">
                            <div className="w-12 h-12 rounded-full bg-violet-600/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Upload size={24} className="text-violet-400" />
                            </div>
                            <div className="text-center">
                              <p className="text-[11px] font-black uppercase tracking-widest text-violet-300">Tải ảnh của bạn</p>
                              <p className="text-[9px] text-gray-500 font-medium mt-1">PNG, JPG, SVG (Max 5MB)</p>
                            </div>
                          </div>
                        </label>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            {activeTab === "assets" && (
              <div className="p-4 flex flex-col gap-5 animate-in fade-in duration-300 rounded-xl gl-panel">
                <div className="flex items-center justify-between gap-2">
                  <div className="w-8 h-5 flex items-center justify-center text-[9px] font-black text-gray-500 gl-border-bright">000</div>
                  <div className="flex-1 h-px gl-dashed-sep" />
                  <div className="px-3 py-1 text-[10px] font-black uppercase text-violet-400 tracking-[0.12em] gl-border-bright">FONT PAIRING GUIDE</div>
                  <div className="flex-1 h-px gl-dashed-sep" />
                  <div className="w-8 h-5 flex items-center justify-center text-[9px] font-black text-gray-500 gl-border-bright">000</div>
                </div>

                {/* Editable text input */}
                <div className="flex flex-col gap-2 group">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-violet-400/80">TYPE YOUR TEXT</span>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
                      <span className="text-[9px] font-bold text-violet-500/60 uppercase">Live Preview</span>
                    </div>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity rounded-2xl pointer-events-none" />
                    <input
                      type="text"
                      value={fontPreviewText}
                      onChange={(e) => setFontPreviewText(e.target.value)}
                      placeholder="Nhập nội dung chữ..."
                      className="relative w-full px-6 py-5 text-[20px] font-black focus:outline-none text-white placeholder:text-white/10 rounded-2xl bg-black/40 border border-white/5 focus:border-violet-500/50 focus:bg-black/60 shadow-2xl transition-all font-[family-name:var(--font-space-grotesk)] tracking-tight"
                    />
                  </div>
                </div>

                <p className="text-[10px] font-black uppercase text-center tracking-widest text-gray-500/50">DRAG ANY STYLE ONTO THE SHIRT</p>

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
                      className="group cursor-grab active:cursor-grabbing px-4 py-3 transition-all flex flex-col gap-1 rounded-lg gl-surface"
                    >
                              <div
                        className="leading-tight text-white group-hover:text-violet-300 transition-colors truncate"
                        ref={(el) => { if (el) { el.style.fontFamily = item.font; el.style.fontSize = String(item.size); el.style.fontWeight = String(item.weight); el.style.fontStyle = item.style; } }}
                      >
                        {item.text}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{item.desc}</span>
                        <span className="text-[10px] font-mono text-gray-500/50">{item.font}</span>
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
                      className="px-3 py-1.5 text-[10px] font-black uppercase cursor-grab active:cursor-grabbing transition-all text-violet-400 rounded gl-border-bright"
                    >
                      {font}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "color" && (
              <div className="space-y-3 animate-in fade-in duration-300">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block">Click a color to apply to shirt</span>
                <div className="flex items-center gap-2 p-2 rounded-lg gl-active-glow">
                  <div className="w-6 h-6 shrink-0 rounded adm-active-swatch" ref={(el) => { if (el) el.style.setProperty('background-color', tshirtColor); }} />
                  <span className="text-[11px] font-black uppercase text-violet-300 tracking-[0.12em]">Active: {tshirtColor}</span>
                </div>
                {[
                  { name: "White", hex: "#FFFFFF" }, { name: "Cream", hex: "#F2F0E9" },
                  { name: "Lime Green", hex: "#D4DF72" }, { name: "Moss Green", hex: "#2E4036" },
                  { name: "Clay", hex: "#CC5833" }, { name: "Charcoal", hex: "#1A1A1A" },
                  { name: "Plasma", hex: "#a78bfa" }, { name: "Signal Red", hex: "#E63B2E" },
                  { name: "Sky Blue", hex: "#87CEEB" }, { name: "Blush Pink", hex: "#FFB6C1" },
                ].map(c => (
                  <button key={c.hex} type="button" onClick={() => setTshirtColor(c.hex)} title={`Apply ${c.name}`}
                    className={`w-full flex items-center gap-3 p-2.5 transition-all rounded-lg ${
                      tshirtColor === c.hex ? 'ring-2 ring-violet-400/40 gl-active' : 'hover:ring-1 hover:ring-violet-400/20 gl-surface-mid'
                    }`}
                  >
                    <div className="w-8 h-8 shrink-0 rounded adm-color-swatch" ref={(el) => { if (el) el.style.setProperty('background-color', c.hex); }} />
                    <div className="text-left">
                      <div className="text-[12px] font-bold text-white tracking-wide">{c.name}</div>
                      <div className="text-[10px] font-mono text-gray-500">{c.hex}</div>
                    </div>
                    {tshirtColor === c.hex && <div className="ml-auto w-2 h-2 bg-violet-400 rounded-full" />}
                  </button>
                ))}
              </div>
            )}

            {activeTab === "layers" && (
              <div className="space-y-2 animate-in fade-in duration-300">
                {elements.length === 0 ? (
                  <div className="py-20 text-center text-gray-600"><LayersIcon size={32} className="mx-auto" /><p className="text-[11px] font-black uppercase mt-4 tracking-widest">No layers yet</p></div>
                ) : (
                  elements.slice().reverse().map((el) => (
                    <div key={el.id} onClick={() => setSelectedId(el.id)}
                      className={`flex items-center gap-3 p-3 cursor-pointer transition-all rounded-lg ${
                        selectedId === el.id ? 'ring-2 ring-violet-400/40 gl-active' : 'hover:ring-1 hover:ring-violet-400/20 gl-surface-mid'
                      }`}>
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] font-bold text-white truncate">{el.label || el.text}</div>
                        <div className="text-[10px] font-mono text-gray-500">{el.type} / {el.side}</div>
                      </div>
                      <button type="button" onClick={(e) => { e.stopPropagation(); setElements(prev => prev.filter(item => item.id !== el.id)); }} title="Delete layer" aria-label="Delete layer" className="p-1.5 text-gray-500 hover:text-red-400 transition-colors"><Trash2 size={13}/></button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>


        </aside>

        {/* Mobile: backdrop to dismiss panel */}
        {activeTab !== null && (
          <div className="fixed inset-0 bg-[#0c081c]/60 backdrop-blur-sm z-30 md:hidden" onClick={() => setActiveTab(null)} />
        )}

        {/* Mobile: floating tool button (opens AI panel) */}
        {activeTab === null && (
          <button
            type="button"
            onClick={() => setActiveTab('ai')}
            className="fixed bottom-5 right-5 z-50 md:hidden w-12 h-12 bg-[#7C3AED] text-white rounded-full shadow-2xl shadow-[#7C3AED]/25 flex items-center justify-center active:scale-95 transition-transform"
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
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-[#0c081c]/85 backdrop-blur-xl">
          <div className="bg-[#140c28] rounded-3xl w-full max-w-lg mx-4 shadow-2xl overflow-hidden border border-white/10">
            {/* Header */}
            <div className="bg-[#0c081c] text-white px-6 py-4 flex items-center justify-between border-b border-white/5">
              <div>
                <h2 className="text-sm font-black uppercase tracking-widest">Thông Tin Đơn Hàng</h2>
                <p className="text-[10px] text-gray-500 font-mono mt-0.5">Điền thông tin trước khi gửi thiết kế cho admin</p>
              </div>
              <button type="button" onClick={() => setShowOrderModal(false)} className="text-gray-500 hover:text-white text-lg leading-none">✕</button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Personal info */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Họ tên *</label>
                  <input type="text" value={orderInfo.name} onChange={e => setOrderInfo(p => ({...p, name: e.target.value}))}
                    className="w-full border border-white/10 rounded-xl px-3 py-2 text-sm font-medium outline-none focus:border-violet-500/50 transition-colors bg-[#0c081c]/60 text-white" placeholder="Nguyễn Văn A" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Số điện thoại *</label>
                  <input type="tel" value={orderInfo.phone} onChange={e => setOrderInfo(p => ({...p, phone: e.target.value}))}
                    className="w-full border border-white/10 rounded-xl px-3 py-2 text-sm font-medium outline-none focus:border-violet-500/50 transition-colors bg-[#0c081c]/60 text-white" placeholder="0901 234 567" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Địa chỉ giao hàng *</label>
                <input type="text" value={orderInfo.address} onChange={e => setOrderInfo(p => ({...p, address: e.target.value}))}
                  className="w-full border border-white/10 rounded-xl px-3 py-2 text-sm font-medium outline-none focus:border-violet-500/50 transition-colors bg-[#0c081c]/60 text-white" placeholder="123 Đường ABC, Quận 1, TP.HCM" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">Lớp / Trường</label>
                <input type="text" value={orderInfo.className} onChange={e => setOrderInfo(p => ({...p, className: e.target.value}))}
                  className="w-full border border-white/10 rounded-xl px-3 py-2 text-sm font-medium outline-none focus:border-violet-500/50 transition-colors bg-[#0c081c]/60 text-white" placeholder="12A1 - THPT Nguyễn Trãi" />
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
                        className="w-full border border-white/10 rounded-xl px-1 py-2 text-sm font-black text-center outline-none focus:border-violet-500/50 transition-colors bg-[#0c081c]/60 text-white"
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
                  rows={2} className="w-full border border-white/10 rounded-xl px-3 py-2 text-sm font-medium outline-none focus:border-violet-500/50 transition-colors resize-none bg-[#0c081c]/60 text-white"
                  placeholder="Yêu cầu thêm, màu sắc đặc biệt..." />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 pb-6 flex gap-3">
              <button type="button" onClick={() => setShowOrderModal(false)}
                className="flex-1 py-2.5 border border-white/10 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:border-white/30 transition-colors text-gray-400">
                Hủy
              </button>
              <button
                type="button"
                onClick={() => handleExportPack(orderInfo)}
                disabled={!orderInfo.name || !orderInfo.phone || !orderInfo.address || isExporting}
                className="flex-1 py-2.5 bg-[#7C3AED] text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-[#6d28d9] transition-colors disabled:opacity-40">
                {isExporting ? 'Đang xử lý...' : '📦 Gửi Đơn Hàng'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Login gate: redirects to /login page directly (no modal) */}

      {/* Save to Collection Modal — admin only */}
      {showSaveModal && savePreviewUrl && (
        <SaveToCollectionModal
          previewUrl={savePreviewUrl}
          garmentType={garmentType}
          color={tshirtColor}
          onClose={() => setShowSaveModal(false)}
        />
      )}
    </div>
  );
}

