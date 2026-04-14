import React from "react";

export function Logo({ className = "", scale = 1 }: { className?: string; scale?: number }) {
  return (
    <div
      className={`unilogo ${className}`}
      data-scale={scale}
    >
      <div className="unilogo-box">
        <span className="unilogo-uni">UNI</span>
        <span className="unilogo-space">SPACE</span>
      </div>
      <span className="unilogo-tagline">TRẠM IN ÁO</span>
    </div>
  );
}
