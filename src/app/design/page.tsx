"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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

// ─── SVG T-Shirt & Polo Mockups (Flat Illustration Style) ────
function TShirtSVG({ color, side = "front" }: { color: string; side?: "front" | "back" }) {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) || 255;
  const g = parseInt(hex.substring(2, 4), 16) || 255;
  const b = parseInt(hex.substring(4, 6), 16) || 255;
  const isLight = (r * 299 + g * 587 + b * 114) / 1000 > 160;
  const strokeColor = isLight ? "rgba(0,0,0,0.10)" : "rgba(255,255,255,0.08)";
  const shadowColor = isLight ? "rgba(0,0,0,0.04)" : "rgba(0,0,0,0.12)";
  const highlightColor = isLight ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.06)";

  if (side === "back") {
    return (
      <svg width="100%" height="100%" viewBox="0 0 400 480" fill="none" xmlns="http://www.w3.org/2000/svg" className="mockup-svg">
        <defs>
          <linearGradient id="tback-fabric" x1="0.2" y1="0" x2="0.8" y2="1">
            <stop offset="0%" stopColor={highlightColor} /><stop offset="50%" stopColor="transparent" /><stop offset="100%" stopColor={shadowColor} />
          </linearGradient>
          <filter id="tback-shadow"><feDropShadow dx="0" dy="4" stdDeviation="8" floodOpacity="0.10" /></filter>
        </defs>
        <g filter="url(#tback-shadow)">
          {/* Body + sleeves */}
          <path d="M200 30 L155 30 C150 30 145 32 142 35 L105 62 L52 100 C46 104 43 112 45 119 L62 152 C64 157 70 160 76 158 L112 132 L112 430 C112 438 118 444 126 444 L274 444 C282 444 288 438 288 430 L288 132 L324 158 C330 160 336 157 338 152 L355 119 C357 112 354 104 348 100 L295 62 L258 35 C255 32 250 30 245 30 L200 30Z" fill={color} stroke={strokeColor} strokeWidth="1.2" />
          <path d="M200 30 L155 30 C150 30 145 32 142 35 L105 62 L52 100 C46 104 43 112 45 119 L62 152 C64 157 70 160 76 158 L112 132 L112 430 C112 438 118 444 126 444 L274 444 C282 444 288 438 288 430 L288 132 L324 158 C330 160 336 157 338 152 L355 119 C357 112 354 104 348 100 L295 62 L258 35 C255 32 250 30 245 30 L200 30Z" fill="url(#tback-fabric)" />
          {/* Back neckline */}
          <path d="M170 30 C178 40 188 44 200 45 C212 44 222 40 230 30" fill={shadowColor} />
          <path d="M170 30 C178 40 188 44 200 45 C212 44 222 40 230 30" fill="none" stroke={strokeColor} strokeWidth="1.5" />
          {/* Shoulder seams */}
          <line x1="142" y1="35" x2="112" y2="132" stroke={shadowColor} strokeWidth="0.8" />
          <line x1="258" y1="35" x2="288" y2="132" stroke={shadowColor} strokeWidth="0.8" />
        </g>
      </svg>
    );
  }

  return (
    <svg width="100%" height="100%" viewBox="0 0 400 480" fill="none" xmlns="http://www.w3.org/2000/svg" className="mockup-svg">
      <defs>
        <linearGradient id="tfront-fabric" x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0%" stopColor={highlightColor} /><stop offset="50%" stopColor="transparent" /><stop offset="100%" stopColor={shadowColor} />
        </linearGradient>
        <filter id="tfront-shadow"><feDropShadow dx="0" dy="4" stdDeviation="8" floodOpacity="0.10" /></filter>
      </defs>
      <g filter="url(#tfront-shadow)">
        {/* Body + sleeves */}
        <path d="M200 22 L155 22 C150 22 145 24 142 27 L105 55 L52 93 C46 97 43 105 45 112 L62 145 C64 150 70 153 76 151 L112 125 L112 430 C112 438 118 444 126 444 L274 444 C282 444 288 438 288 430 L288 125 L324 151 C330 153 336 150 338 145 L355 112 C357 105 354 97 348 93 L295 55 L258 27 C255 24 250 22 245 22 L200 22Z" fill={color} stroke={strokeColor} strokeWidth="1.2" />
        <path d="M200 22 L155 22 C150 22 145 24 142 27 L105 55 L52 93 C46 97 43 105 45 112 L62 145 C64 150 70 153 76 151 L112 125 L112 430 C112 438 118 444 126 444 L274 444 C282 444 288 438 288 430 L288 125 L324 151 C330 153 336 150 338 145 L355 112 C357 105 354 97 348 93 L295 55 L258 27 C255 24 250 22 245 22 L200 22Z" fill="url(#tfront-fabric)" />
        {/* Collar / neckline */}
        <path d="M163 22 C170 48 184 58 200 62 C216 58 230 48 237 22" fill={shadowColor} />
        <path d="M163 22 C170 48 184 58 200 62 C216 58 230 48 237 22" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" />
        {/* Sleeve hems */}
        <line x1="52" y1="93" x2="76" y2="151" stroke={shadowColor} strokeWidth="0.8" />
        <line x1="348" y1="93" x2="324" y2="151" stroke={shadowColor} strokeWidth="0.8" />
      </g>
    </svg>
  );
}

// ── Form A1: same-color front collar + V-piping, dark back collar ──
function PoloA1ShirtSVG({ color, side = "front" }: { color: string; side?: "front" | "back" }) {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) || 255;
  const g = parseInt(hex.substring(2, 4), 16) || 255;
  const b = parseInt(hex.substring(4, 6), 16) || 255;
  const isLight = (r * 299 + g * 587 + b * 114) / 1000 > 160;
  const strokeColor = isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.06)";
  const shadowColor = isLight ? "rgba(0,0,0,0.05)" : "rgba(0,0,0,0.12)";
  const highlightColor = isLight ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.05)";
  const backCollarColor = isLight ? "#1a1a1a" : "#e8e8e8";
  const backCollarStroke = isLight ? "#111111" : "#d0d0d0";
  const backCollarTrim = isLight ? "#ffffff" : "rgba(255,255,255,0.4)";
  const pipingColor = isLight ? "#f0e8dc" : "rgba(255,255,255,0.35)";
  const buttonFill = isLight ? `rgba(${Math.max(0, r - 60)},${Math.max(0, g - 60)},${Math.max(0, b - 60)},0.7)` : "rgba(255,255,255,0.3)";
  const bodyPath = side === "back"
    ? "M200 38 L148 38 C142 38 137 40 134 44 L95 72 L40 115 C34 120 30 128 32 136 L50 168 C52 174 58 177 64 175 L105 145 L105 435 C105 443 111 449 119 449 L281 449 C289 449 295 443 295 435 L295 145 L336 175 C342 177 348 174 350 168 L368 136 C370 128 366 120 360 115 L305 72 L266 44 C263 40 258 38 252 38 L200 38Z"
    : "M200 42 L148 42 C142 42 137 44 134 48 L95 76 L40 118 C34 123 30 131 32 139 L50 170 C52 176 58 179 64 177 L105 148 L105 435 C105 443 111 449 119 449 L281 449 C289 449 295 443 295 435 L295 148 L336 177 C342 179 348 176 350 170 L368 139 C370 131 366 123 360 118 L305 76 L266 48 C263 44 258 42 252 42 L200 42Z";
  const gradId = `poloa1-${side}-fab`;
  const filtId = `poloa1-${side}-shd`;

  if (side === "back") {
    return (
      <svg width="100%" height="100%" viewBox="0 0 400 480" fill="none" xmlns="http://www.w3.org/2000/svg" className="mockup-svg">
        <defs>
          <linearGradient id={gradId} x1="0.3" y1="0" x2="0.7" y2="1"><stop offset="0%" stopColor={highlightColor} /><stop offset="100%" stopColor={shadowColor} /></linearGradient>
          <filter id={filtId}><feDropShadow dx="0" dy="4" stdDeviation="8" floodOpacity="0.10" /></filter>
        </defs>
        <g filter={`url(#${filtId})`}>
          <path d={bodyPath} fill={color} stroke={strokeColor} strokeWidth="1.2" />
          <path d={bodyPath} fill={`url(#${gradId})`} />
          <path d="M152 38 L152 12 Q156 4 176 1 Q190 -1 200 -1 Q210 -1 224 1 Q244 4 248 12 L248 38" fill={backCollarColor} stroke={backCollarStroke} strokeWidth="1.5" />
          <line x1="153" y1="36" x2="247" y2="36" stroke={backCollarTrim} strokeWidth="2" />
          <line x1="153" y1="33" x2="247" y2="33" stroke={backCollarTrim} strokeWidth="0.8" />
        </g>
      </svg>
    );
  }

  return (
    <svg width="100%" height="100%" viewBox="0 0 400 480" fill="none" xmlns="http://www.w3.org/2000/svg" className="mockup-svg">
      <defs>
        <linearGradient id={gradId} x1="0.3" y1="0" x2="0.7" y2="1"><stop offset="0%" stopColor={highlightColor} /><stop offset="100%" stopColor={shadowColor} /></linearGradient>
        <filter id={filtId}><feDropShadow dx="0" dy="4" stdDeviation="8" floodOpacity="0.10" /></filter>
      </defs>
      <g filter={`url(#${filtId})`}>
        <path d={bodyPath} fill={color} stroke={strokeColor} strokeWidth="1.2" />
        <path d={bodyPath} fill={`url(#${gradId})`} />
        {/* Same-color collar */}
        <path d="M160 42 Q160 30 172 25 Q186 20 200 20 Q214 20 228 25 Q240 30 240 42" fill={color} stroke={strokeColor} strokeWidth="1" />
        {/* V-neck piping */}
        <line x1="190" y1="42" x2="198" y2="130" stroke={pipingColor} strokeWidth="2.5" />
        <line x1="210" y1="42" x2="202" y2="130" stroke={pipingColor} strokeWidth="2.5" />
        {/* Buttons */}
        <circle cx="200" cy="60" r="4.5" fill={buttonFill} stroke={pipingColor} strokeWidth="0.8" />
        <circle cx="200" cy="82" r="4.5" fill={buttonFill} stroke={pipingColor} strokeWidth="0.8" />
        <circle cx="200" cy="104" r="4.5" fill={buttonFill} stroke={pipingColor} strokeWidth="0.8" />
      </g>
    </svg>
  );
}

// ── Form D5: dark front collar with fold-down flaps, dark back collar ──
function PoloShirtSVG({ color, side = "front" }: { color: string; side?: "front" | "back" }) {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) || 255;
  const g = parseInt(hex.substring(2, 4), 16) || 255;
  const b = parseInt(hex.substring(4, 6), 16) || 255;
  const isLight = (r * 299 + g * 587 + b * 114) / 1000 > 160;
  const strokeColor = isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.06)";
  const shadowColor = isLight ? "rgba(0,0,0,0.05)" : "rgba(0,0,0,0.12)";
  const highlightColor = isLight ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.05)";
  // Back collar is dark, front collar same as shirt
  const backCollarColor = isLight ? "#1a1a1a" : "#e8e8e8";
  const backCollarStroke = isLight ? "#111111" : "#d0d0d0";
  const backCollarTrim = isLight ? "#ffffff" : "rgba(255,255,255,0.4)";
  const buttonFill = isLight ? `rgba(${Math.max(0, r - 60)},${Math.max(0, g - 60)},${Math.max(0, b - 60)},0.7)` : "rgba(255,255,255,0.3)";

  // Oversized body path
  const bodyPath = side === "back"
    ? "M200 38 L148 38 C142 38 137 40 134 44 L95 72 L40 115 C34 120 30 128 32 136 L50 168 C52 174 58 177 64 175 L105 145 L105 435 C105 443 111 449 119 449 L281 449 C289 449 295 443 295 435 L295 145 L336 175 C342 177 348 174 350 168 L368 136 C370 128 366 120 360 115 L305 72 L266 44 C263 40 258 38 252 38 L200 38Z"
    : "M200 42 L148 42 C142 42 137 44 134 48 L95 76 L40 118 C34 123 30 131 32 139 L50 170 C52 176 58 179 64 177 L105 148 L105 435 C105 443 111 449 119 449 L281 449 C289 449 295 443 295 435 L295 148 L336 177 C342 179 348 176 350 170 L368 139 C370 131 366 123 360 118 L305 76 L266 48 C263 44 258 42 252 42 L200 42Z";

  const gradId = `polo-${side}-fab`;
  const filtId = `polo-${side}-shd`;

  if (side === "back") {
    return (
      <svg width="100%" height="100%" viewBox="0 0 400 480" fill="none" xmlns="http://www.w3.org/2000/svg" className="mockup-svg">
        <defs>
          <linearGradient id={gradId} x1="0.3" y1="0" x2="0.7" y2="1">
            <stop offset="0%" stopColor={highlightColor} /><stop offset="100%" stopColor={shadowColor} />
          </linearGradient>
          <filter id={filtId}><feDropShadow dx="0" dy="4" stdDeviation="8" floodOpacity="0.10" /></filter>
        </defs>
        <g filter={`url(#${filtId})`}>
          {/* Body */}
          <path d={bodyPath} fill={color} stroke={strokeColor} strokeWidth="1.2" />
          <path d={bodyPath} fill={`url(#${gradId})`} />
          {/* Dark collar band standing up */}
          <path d="M152 38 L152 12 Q156 4 176 1 Q190 -1 200 -1 Q210 -1 224 1 Q244 4 248 12 L248 38" fill={backCollarColor} stroke={backCollarStroke} strokeWidth="1.5" />
          {/* White trim line at bottom of collar */}
          <line x1="153" y1="36" x2="247" y2="36" stroke={backCollarTrim} strokeWidth="2" />
          <line x1="153" y1="33" x2="247" y2="33" stroke={backCollarTrim} strokeWidth="0.8" />
        </g>
      </svg>
    );
  }

  return (
    <svg width="100%" height="100%" viewBox="0 0 400 480" fill="none" xmlns="http://www.w3.org/2000/svg" className="mockup-svg">
      <defs>
        <linearGradient id={gradId} x1="0.3" y1="0" x2="0.7" y2="1">
          <stop offset="0%" stopColor={highlightColor} /><stop offset="100%" stopColor={shadowColor} />
        </linearGradient>
        <filter id={filtId}><feDropShadow dx="0" dy="4" stdDeviation="8" floodOpacity="0.10" /></filter>
      </defs>
      <g filter={`url(#${filtId})`}>
        {/* Body */}
        <path d={bodyPath} fill={color} stroke={strokeColor} strokeWidth="1.2" />
        <path d={bodyPath} fill={`url(#${gradId})`} />

        {/* Dark collar band (behind flaps) */}
        <rect x="155" y="8" width="90" height="34" rx="3" fill={backCollarColor} stroke={backCollarStroke} strokeWidth="1" />
        {/* Left collar flap folding down */}
        <path d="M155 42 L155 20 L130 55 Q136 72 152 74 Q166 70 180 60 L193 48 Z" fill={backCollarColor} stroke={backCollarStroke} strokeWidth="1.2" strokeLinejoin="round" />
        <path d="M155 22 L133 52" stroke={backCollarTrim} strokeWidth="2" opacity="0.7" />
        {/* Right collar flap folding down */}
        <path d="M245 42 L245 20 L270 55 Q264 72 248 74 Q234 70 220 60 L207 48 Z" fill={backCollarColor} stroke={backCollarStroke} strokeWidth="1.2" strokeLinejoin="round" />
        <path d="M245 22 L267 52" stroke={backCollarTrim} strokeWidth="2" opacity="0.7" />
        {/* Collar top stripes */}
        <line x1="156" y1="12" x2="244" y2="12" stroke={backCollarTrim} strokeWidth="2" opacity="0.6" />
        <line x1="156" y1="16" x2="244" y2="16" stroke={backCollarTrim} strokeWidth="1" opacity="0.3" />
        {/* V-opening showing shirt color */}
        <path d="M193 48 L200 120 L207 48" fill={color} stroke="none" />
        {/* Center placket */}
        <rect x="197" y="48" width="6" height="72" rx="1" fill={color} stroke={strokeColor} strokeWidth="0.5" />
        {/* Buttons */}
        <circle cx="200" cy="58" r="4" fill={buttonFill} />
        <circle cx="200" cy="78" r="4" fill={buttonFill} />
        <circle cx="200" cy="98" r="4" fill={buttonFill} />
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
  shirtType,
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
  shirtType: "tshirt" | "polo-a1" | "polo-d5";
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
    (e: React.MouseEvent | React.TouchEvent, el: DesignElement, corner: 'tl' | 'tr' | 'bl' | 'br' = 'br') => {
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
        onTouchEnd={(e) => {
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
        {shirtType === "polo-d5" ? <PoloShirtSVG color={tshirtColor} side={side} /> : shirtType === "polo-a1" ? <PoloA1ShirtSVG color={tshirtColor} side={side} /> : <TShirtSVG color={tshirtColor} side={side} />}

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
                <img src={el.url} alt={el.label} className="w-full h-full object-contain pointer-events-none canva-element-img-blend" draggable={false} />
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
  const [tshirtColor, setTshirtColor] = useState("#ffffff");
  const [shirtType, setShirtType] = useState<"tshirt" | "polo-a1" | "polo-d5">("tshirt");
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
    setElements(prev => prev.map(el =>
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
    sessionStorage.setItem("designData", JSON.stringify({ elements, tshirtColor, shirtType }));
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
    "Galaxy heart with stars",
    "Vintage class logo 2026",
    "Japanese dragon tattoo",
    "Wolf howling at moon",
    "Cherry blossom sakura",
    "Retro football badge",
    "Infinity symbol neon",
    "Cute cat astronaut",
  ];

  return (
    <div className="canva-layout">
      {/* ═══ TOP BAR ═══ */}
      <header className="canva-topbar">
        <div className="canva-topbar-left">
          <Link href="/" className="canva-logo" style={{ textDecoration: 'none' }}>
            <Logo scale={0.4} />
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
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /></svg>
          </button>
          <button
            className="canva-topbar-btn"
            title="Làm lại (Ctrl+Shift+Z)"
            aria-label="Làm lại"
            onClick={handleRedo}
            disabled={redoStack.length === 0}
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
                className="canva-topbar-btn" title="Nhân bản (Ctrl+D)" aria-label="Nhân bản"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
              </button>
              <button
                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onClick={handleDeleteSelected}
                onTouchEnd={(e) => { e.preventDefault(); handleDeleteSelected(); }}
                className="canva-topbar-btn canva-topbar-btn-danger" title="Xóa (Delete)" aria-label="Xóa"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
              </button>
              <div className="canva-topbar-divider" />
            </>
          )}
          <button onClick={handleComplete} className="canva-btn-complete" disabled={elements.length === 0}>
            <span className="canva-complete-full">Hoàn thành thiết kế</span>
            <span className="canva-complete-short">Đặt hàng</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
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
                    <h3>Magic Media AI</h3>
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
                          placeholder="Mô tả thiết kế lý tưởng của bạn..."
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          onKeyDown={(e) => {
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
                      className="ai-canva-generate-btn"
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
                        {messages.filter(m => m.role === "ai").slice().reverse().map(m => m.images && m.images.map((img) => (
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
                              <span>+ Thêm</span>
                            </div>
                          </div>
                        )))}
                      </div>
                    </div>
                  </div>
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
          </>
        )}

        {/* ═══ CENTER CANVAS ═══ */}
        <main className="canva-workspace" onTouchStart={(e) => {
          // Tap on workspace background (outside elements) → deselect on mobile
          if (e.target === e.currentTarget) setSelectedId(null);
        }}>
          {/* Canvas area with checkerboard bg */}
          <div
            className="canva-canvas-wrapper"
            onMouseDown={(e) => {
              // Click on checkered background (outside t-shirt canvas) → deselect
              if (e.target === e.currentTarget) setSelectedId(null);
            }}
            onTouchStart={(e) => {
              // Tap on checkered background → deselect on mobile
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
              shirtType={shirtType}
              zoom={zoom}
            />
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
                onChange={(e) => setZoom(Number(e.target.value))}
                aria-label="Điều chỉnh thu phóng"
              />
              <span className="canva-zoom-val">{zoom}%</span>
            </div>
            <div className="canva-side-indicator">
              <button onClick={() => setShirtType("tshirt")} className={shirtType === "tshirt" ? "active" : ""}>
                Áo thun
              </button>
              <button onClick={() => setShirtType("polo-a1")} className={shirtType === "polo-a1" ? "active" : ""}>
                Polo A1
              </button>
              <button onClick={() => setShirtType("polo-d5")} className={shirtType === "polo-d5" ? "active" : ""}>
                Polo D5
              </button>
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
        {/* Shirt type toggle */}
        <button
          className={`canva-mobile-tab canva-mobile-side-tab ${shirtType === "tshirt" ? "active" : ""}`}
          onClick={() => setShirtType("tshirt")}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3L4 7v2l3-1v11h10V8l3 1V7l-8-4z" /></svg>
          <span>Thun</span>
        </button>
        <button
          className={`canva-mobile-tab canva-mobile-side-tab ${shirtType === "polo-a1" ? "active" : ""}`}
          onClick={() => setShirtType("polo-a1")}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3L4 7v2l3-1v11h10V8l3 1V7l-8-4z" /><path d="M9 3l3 4 3-4" /></svg>
          <span>A1</span>
        </button>
        <button
          className={`canva-mobile-tab canva-mobile-side-tab ${shirtType === "polo-d5" ? "active" : ""}`}
          onClick={() => setShirtType("polo-d5")}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3L4 7v2l3-1v11h10V8l3 1V7l-8-4z" /><path d="M9 3l3 4 3-4" /></svg>
          <span>D5</span>
        </button>
        <div className="canva-mobile-tab-sep" />
        {([
          { id: "ai", label: "AI", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg> },
          { id: "upload", label: "Ảnh", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg> },
          { id: "text", label: "Chữ", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 7 4 4 20 4 20 7" /><line x1="9" y1="20" x2="15" y2="20" /><line x1="12" y1="4" x2="12" y2="20" /></svg> },
          { id: "elements", label: "Màu", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="13.5" cy="6.5" r="2.5" /><circle cx="17.5" cy="10.5" r="2.5" /><circle cx="8.5" cy="7.5" r="2.5" /><circle cx="6.5" cy="12.5" r="2.5" /><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" /></svg> },
          { id: "layers", label: "Layer", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></svg> },
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
