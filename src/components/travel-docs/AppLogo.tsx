export default function AppLogo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="My Travel Docs">
      <defs>
        <linearGradient id="mtd-bg" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0891b2"/>
          <stop offset="100%" stopColor="#1d4ed8"/>
        </linearGradient>
      </defs>
      {/* Background */}
      <rect width="40" height="40" rx="10" fill="url(#mtd-bg)"/>
      {/* Globe grid */}
      <circle cx="22" cy="22" r="14" fill="none" stroke="white" strokeWidth="0.8" opacity="0.12"/>
      <ellipse cx="22" cy="22" rx="7" ry="14" fill="none" stroke="white" strokeWidth="0.8" opacity="0.12"/>
      <line x1="8" y1="22" x2="36" y2="22" stroke="white" strokeWidth="0.8" opacity="0.12"/>
      {/* Document shadow */}
      <rect x="9" y="7" width="18" height="24" rx="4" fill="black" opacity="0.15" transform="tranzinc(0.5,1)"/>
      {/* Document */}
      <rect x="9" y="7" width="18" height="24" rx="4" fill="white"/>
      {/* Header bar */}
      <rect x="9" y="7" width="18" height="8" rx="4" fill="#1d4ed8" opacity="0.9"/>
      <rect x="9" y="12" width="18" height="3" fill="#1d4ed8" opacity="0.9"/>
      {/* Header icon (tiny globe) */}
      <circle cx="13" cy="10.5" r="2.5" fill="none" stroke="white" strokeWidth="0.9" opacity="0.6"/>
      <line x1="10.5" y1="10.5" x2="15.5" y2="10.5" stroke="white" strokeWidth="0.7" opacity="0.6"/>
      {/* Header text line */}
      <rect x="17" y="9.5" width="8" height="2" rx="1" fill="white" opacity="0.7"/>
      {/* Divider */}
      <line x1="11" y1="17.5" x2="25" y2="17.5" stroke="#e2e8f0" strokeWidth="0.8"/>
      {/* CHECKED row 1 */}
      <rect x="11" y="19" width="5" height="5" rx="1.5" fill="#2563eb"/>
      <path d="M12 21.5L13.5 23L16 20" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="17.5" y="20.5" width="8" height="2" rx="1" fill="#bfdbfe"/>
      {/* CHECKED row 2 */}
      <rect x="11" y="25.5" width="5" height="5" rx="1.5" fill="#0284c7"/>
      <path d="M12 28L13.5 29.5L16 26.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="17.5" y="27" width="7" height="2" rx="1" fill="#bae6fd"/>
      {/* Plane badge */}
      <circle cx="31" cy="31" r="7.5" fill="#f59e0b"/>
      <g transform="tranzinc(31,31) rotate(-30)">
        <path d="M0,-5.5 L1.5,0.5 L5.5,0 L1.5,2.2 L2,5.5 L0,4.2 L-2,5.5 L-1.5,2.2 L-5.5,0 L-1.5,0.5 Z" fill="white"/>
      </g>
    </svg>
  );
}
