"use client";
// app/components/GrowkasLogo.tsx — Logo Vektor Resmi Growkas (Logo 1: Circular 'g' + Upward Arrow)

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
      {/* LOGO MARK VECTOR SVG — LOGO 1: CIRCULAR 'g' + UPWARD ARROW */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        <defs>
          <linearGradient id="logo1OrangeGrad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#F07A2B" />
            <stop offset="100%" stopColor="#C44F0D" />
          </linearGradient>
          <linearGradient id="logo1Glow" x1="24" y1="0" x2="24" y2="48" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.25" />
          </linearGradient>
        </defs>

        {/* Circular Badge Background */}
        <rect x="2" y="2" width="44" height="44" rx="14" fill="url(#logo1OrangeGrad)" />
        <rect x="2" y="2" width="44" height="44" rx="14" fill="url(#logo1Glow)" />
        <rect x="2" y="2" width="44" height="44" rx="14" stroke="#FFA366" strokeWidth="1.5" strokeOpacity="0.4" />

        {/* Circular 'g' Body (Loop & Tail) */}
        <path
          d="M 30 19 C 27.5 15.5 22.8 14.5 18.5 16 C 13 18 9.5 23.5 10 29 C 10.5 35 C 16 39 23 38 27.5 34 C 31 31 32 26 31.5 22.5 H 20"
          stroke="#FFFFFF"
          strokeWidth="3.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Inner 'g' Bar / Eye accent */}
        <circle cx="21" cy="24" r="3" fill="#FFFFFF" fillOpacity="0.9" />

        {/* Upward Growth Arrow (↗) launching from top-right of 'g' */}
        <path
          d="M 25 21 L 36.5 9.5 M 36.5 9.5 H 28.5 M 36.5 9.5 V 17.5"
          stroke="#FFFFFF"
          strokeWidth="3.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* TYPOGRAPHY BRAND NAME */}
      {showText && (
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: size > 30 ? "1.15rem" : "0.95rem",
              fontWeight: "900",
              letterSpacing: "0.05em",
              color: textColor,
              lineHeight: 1.1,
              fontFamily: "system-ui, -apple-system, sans-serif",
            }}
          >
            Grow<span style={{ color: "#D4651C" }}>kas</span>
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
            Kasir Multi-Cabang
          </div>
        </div>
      )}
    </div>
  );
}


