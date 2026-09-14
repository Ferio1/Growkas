"use client";
// app/components/GrowkasLogo.tsx — Logo Vektor Resmi Growkas (Simpel, Profesional, Clean SVG)

interface GrowkasLogoProps {
  size?: number;
  showText?: boolean;
  textColor?: string;
  subtextColor?: string;
  className?: string;
}

export default function GrowkasLogo({
  size = 36,
  showText = true,
  textColor = "#F5F0E8",
  subtextColor = "#D4651C",
  className = "",
}: GrowkasLogoProps) {
  return (
    <div
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: size > 30 ? "12px" : "8px",
        userSelect: "none",
      }}
    >
      {/* LOGO MARK VECTOR SVG */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        <defs>
          <linearGradient id="growkasGrad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#E66E22" />
            <stop offset="100%" stopColor="#9E3A08" />
          </linearGradient>
          <linearGradient id="growkasGlow" x1="24" y1="0" x2="24" y2="48" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.35" />
          </linearGradient>
        </defs>

        {/* Squircle Background Badge */}
        <rect x="2" y="2" width="44" height="44" rx="12" fill="url(#growkasGrad)" />
        <rect x="2" y="2" width="44" height="44" rx="12" fill="url(#growkasGlow)" />
        <rect x="2" y="2" width="44" height="44" rx="12" stroke="#FF9D5C" strokeWidth="1.5" strokeOpacity="0.4" />

        {/* Rising Financial Bar 1 (Short left bar) */}
        <rect x="13" y="26" width="4" height="10" rx="2" fill="#FFFFFF" fillOpacity="0.85" />
        
        {/* Rising Financial Bar 2 (Middle bar) */}
        <rect x="20" y="20" width="4" height="16" rx="2" fill="#FFFFFF" fillOpacity="0.95" />

        {/* Growth Arrow & Top Right Peak (Upward Trend 'Grow') */}
        <path
          d="M27 18L35 10M35 10H28M35 10V17"
          stroke="#FFFFFF"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Curving 'G' Outer Sweeping Arc */}
        <path
          d="M32 26C31 31.5 26.5 35.5 20.5 35.5C13.5964 35.5 8 29.9036 8 23C8 16.0964 13.5964 10.5 20.5 10.5C24.5 10.5 28 12.4 30.2 15.3"
          stroke="#FFFFFF"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      </svg>

      {/* TYPOGRAPHY BRAND NAME */}
      {showText && (
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: size > 30 ? "1.15rem" : "0.95rem",
              fontWeight: "900",
              letterSpacing: "0.06em",
              color: textColor,
              lineHeight: 1.1,
              fontFamily: "system-ui, -apple-system, sans-serif",
            }}
          >
            GROW<span style={{ color: "#D4651C" }}>KAS</span>
          </div>
          <div
            style={{
              fontSize: size > 30 ? "0.68rem" : "0.6rem",
              fontWeight: "800",
              letterSpacing: "0.1em",
              color: subtextColor,
              textTransform: "uppercase",
              marginTop: "2px",
            }}
          >
            Sistem Kasir F&amp;B
          </div>
        </div>
      )}
    </div>
  );
}
