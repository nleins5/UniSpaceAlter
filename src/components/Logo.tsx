import React from "react";

export function Logo({ className = "", scale = 1 }: { className?: string; scale?: number }) {
  // We use CSS custom properties to scale the logo effortlessly
  const s = scale;

  return (
    <div
      className={`inline-flex flex-col items-center justify-center select-none ${className}`}
      style={{
        width: `${80 * s}px`,
        height: `${80 * s}px`,
        backgroundColor: "white",
        borderRadius: `${18 * s}px`,
        padding: `${4 * s}px`,
        boxShadow: "0 4px 10px rgba(176, 38, 255, 0.2)",
      }}
    >
      <div
        className="flex flex-col justify-center items-center w-full"
        style={{
          flex: 1,
          backgroundColor: "#b026ff", // Vibrant purple matching the brand
          borderTopLeftRadius: `${14 * s}px`,
          borderTopRightRadius: `${14 * s}px`,
          borderBottomLeftRadius: `${4 * s}px`,
          borderBottomRightRadius: `${4 * s}px`,
        }}
      >
        <span
          style={{
            color: "white",
            fontWeight: 900, // Black
            fontSize: `${22 * s}px`,
            lineHeight: 1,
            letterSpacing: "-0.05em",
            marginTop: `${2 * s}px`,
          }}
        >
          UNI
        </span>
        <span
          style={{
            color: "white",
            fontWeight: 900,
            fontSize: `${18 * s}px`,
            lineHeight: 1,
            letterSpacing: "-0.02em",
          }}
        >
          SPACE
        </span>
      </div>
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: `${20 * s}px`,
        }}
      >
        <span
          style={{
            color: "#b026ff",
            fontWeight: 800,
            fontSize: `${8 * s}px`,
            letterSpacing: "0.02em",
          }}
        >
          TRẠM IN ÁO
        </span>
      </div>
    </div>
  );
}
