// Elegant hero illustration: stacked books + desk lamp + globe
// Pure SVG — crisp at any resolution, no external dependencies

export default function HeroIllustration({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 280 310"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        {/* Warm lamp glow */}
        <radialGradient id="hi-glow" cx="72%" cy="32%" r="52%">
          <stop offset="0%" stopColor="#fef9c3" stopOpacity="0.85" />
          <stop offset="60%" stopColor="#fef3c7" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#fef3c7" stopOpacity="0" />
        </radialGradient>
        {/* Lamp shade gradient */}
        <linearGradient id="hi-shade" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
        {/* Books */}
        <linearGradient id="hi-book-dk" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#431407" />
          <stop offset="100%" stopColor="#7c2d12" />
        </linearGradient>
        <linearGradient id="hi-book-md" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#92400e" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
        <linearGradient id="hi-book-lt" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="100%" stopColor="#fef9c3" />
        </linearGradient>
        <linearGradient id="hi-book-rust" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#9a3412" />
          <stop offset="100%" stopColor="#c2410c" />
        </linearGradient>
      </defs>

      {/* ── WARM GLOW (behind everything) ── */}
      <ellipse cx="200" cy="95" rx="95" ry="75" fill="url(#hi-glow)" />

      {/* ── DESK LAMP ── */}
      {/* base */}
      <rect x="168" y="282" width="50" height="9" rx="4.5" fill="#92400e" />
      {/* stem */}
      <rect x="190" y="222" width="6" height="62" rx="3" fill="#92400e" />
      {/* elbow joint */}
      <circle cx="193" cy="220" r="5" fill="#b45309" />
      {/* arm */}
      <path
        d="M193 218 C205 185 215 160 200 128"
        fill="none"
        stroke="#92400e"
        strokeWidth="5"
        strokeLinecap="round"
      />
      {/* shade body */}
      <path d="M178 128 Q200 103 222 128 L216 148 Q200 126 184 148 Z" fill="url(#hi-shade)" />
      {/* shade inner rim highlight */}
      <path
        d="M184 136 Q200 120 216 136"
        fill="none"
        stroke="#fef3c7"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.55"
      />
      {/* bulb */}
      <circle cx="200" cy="140" r="5" fill="#fef9c3" opacity="0.95" />

      {/* ── GLOBE ── */}
      {/* body fill */}
      <circle cx="60" cy="235" r="37" fill="#fff7ed" opacity="0.35" />
      {/* outline */}
      <circle cx="60" cy="235" r="37" fill="none" stroke="#c2410c" strokeWidth="1.8" />
      {/* vertical meridian */}
      <ellipse
        cx="60"
        cy="235"
        rx="18"
        ry="37"
        fill="none"
        stroke="#c2410c"
        strokeWidth="1.2"
        opacity="0.65"
      />
      {/* horizontal parallels */}
      <ellipse
        cx="60"
        cy="235"
        rx="37"
        ry="13"
        fill="none"
        stroke="#c2410c"
        strokeWidth="1.2"
        opacity="0.65"
      />
      <line x1="23" y1="235" x2="97" y2="235" stroke="#c2410c" strokeWidth="1" opacity="0.45" />
      {/* stand pole */}
      <line
        x1="60"
        y1="272"
        x2="60"
        y2="285"
        stroke="#92400e"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* stand base */}
      <rect x="44" y="284" width="32" height="7" rx="3.5" fill="#92400e" />

      {/* ── BOOK STACK ── */}
      {/* shadow beneath stack */}
      <ellipse cx="150" cy="298" rx="82" ry="7" fill="#451a03" opacity="0.1" />

      {/* Book 1 — bottom, dark */}
      <rect x="65" y="262" width="162" height="24" rx="4" fill="url(#hi-book-dk)" />
      {/* spine */}
      <rect x="65" y="262" width="15" height="24" rx="3" fill="#5c1a0a" />
      {/* gilt lines */}
      <line x1="66" y1="267" x2="227" y2="267" stroke="#d97706" strokeWidth="0.7" opacity="0.45" />
      <line x1="66" y1="282" x2="227" y2="282" stroke="#d97706" strokeWidth="0.7" opacity="0.45" />

      {/* Book 2 — middle, amber */}
      <rect x="78" y="242" width="144" height="22" rx="4" fill="url(#hi-book-md)" />
      {/* spine */}
      <rect x="78" y="242" width="13" height="22" rx="3" fill="#78350f" />
      {/* gilt lines */}
      <line x1="79" y1="247" x2="222" y2="247" stroke="#fbbf24" strokeWidth="0.7" opacity="0.5" />
      <line x1="79" y1="260" x2="222" y2="260" stroke="#fbbf24" strokeWidth="0.7" opacity="0.5" />

      {/* Book 3 — rust/terracotta */}
      <rect x="88" y="224" width="124" height="20" rx="4" fill="url(#hi-book-rust)" />
      {/* spine */}
      <rect x="88" y="224" width="11" height="20" rx="3" fill="#7c2d12" />

      {/* Book 4 — top, cream */}
      <rect x="96" y="208" width="106" height="18" rx="4" fill="url(#hi-book-lt)" />
      {/* spine */}
      <rect x="96" y="208" width="10" height="18" rx="3" fill="#fbbf24" />

      {/* ── BOOKMARK RIBBON ── */}
      <path
        d="M178 208 L178 196 L184.5 200.5 L191 196 L191 208"
        fill="#dc2626"
        opacity="0.72"
      />

      {/* ── SMALL SPRIG (bottom-right corner, subtle) ── */}
      <ellipse
        cx="248"
        cy="275"
        rx="9"
        ry="5"
        fill="#d97706"
        opacity="0.22"
        transform="rotate(-30 248 275)"
      />
      <ellipse
        cx="258"
        cy="268"
        rx="8"
        ry="4"
        fill="#d97706"
        opacity="0.18"
        transform="rotate(-50 258 268)"
      />
    </svg>
  );
}
