"use client";
// app/components/GrowkasLogo.tsx — Logo Vektor Resmi Growkas (Line Art G & K Cash Ribbon)

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
      {/* LOGO MARK VECTOR SVG — KONSEP 3: LINE ART G & K CASH RIBBON */}
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
            <stop offset="100%" stopColor="#B84A0C" />
          </linearGradient>
          <linearGradient id="growkasGlow" x1="24" y1="0" x2="24" y2="48" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.30" />
          </linearGradient>
        </defs>

        {/* Squircle Background Badge */}
        <rect x="2" y="2" width="44" height="44" rx="12" fill="url(#growkasGrad)" />
        <rect x="2" y="2" width="44" height="44" rx="12" fill="url(#growkasGlow)" />
        <rect x="2" y="2" width="44" height="44" rx="12" stroke="#FF9D5C" strokeWidth="1.5" strokeOpacity="0.4" />

        {/* Outer Line Ribbon 'G' */}
        <path
          d="M 31 15.5 C 28 12.5 23.5 11.5 19 13 C 13.5 14.8 9.5 20 9.5 25.8 C 9.5 32.5 14.5 37 21 37 C 27.5 37 32 33 33 27.5 H 23"
          stroke="#FFFFFF"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Inner Monogram Ribbon 'K' + Upward Arrow (Growth) */}
        {/* Stem of K */}
        <path
          d="M 21 19.5 V 30.5"
          stroke="#FFFFFF"
          strokeWidth="2.8"
          strokeLinecap="round"
        />

        {/* Upper Leg & Growth Arrow Head of K */}
        <path
          d="M 21 24.5 L 32.5 13.5 M 32.5 13.5 H 25.5 M 32.5 13.5 V 20.5"
          stroke="#FFFFFF"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Lower Leg of K */}
        <path
          d="M 21.5 24.5 L 30.5 31.5"
          stroke="#FFFFFF"
          strokeWidth="2.8"
          strokeLinecap="round"
        />

        {/* Cash Receipt Line Accents (Bottom Dotted Fold) */}
        <line
          x1="12"
          y1="40.5"
          x2="36"
          y2="40.5"
          stroke="#FFD8BE"
          strokeWidth="1.5"
          strokeDasharray="2.5 2"
          strokeOpacity="0.75"
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
              letterSpacing: "0.12em",
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

