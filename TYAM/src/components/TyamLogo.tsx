import { useId } from "react";

export default function TyamLogo({ className = "", size = 40 }: { className?: string; size?: number }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-planet`} x1="13" y1="14" x2="50" y2="55" gradientUnits="userSpaceOnUse">
          <stop stopColor="#E1FBFF" />
          <stop offset="0.36" stopColor="#3ED9FF" />
          <stop offset="0.7" stopColor="#6B64FF" />
          <stop offset="1" stopColor="#BD48FF" />
        </linearGradient>
        <linearGradient id={`${id}-orbit`} x1="8" y1="48" x2="57" y2="17" gradientUnits="userSpaceOnUse">
          <stop stopColor="#BDC4FF" />
          <stop offset="0.55" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#A9F1FF" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="20" stroke={`url(#${id}-planet)`} strokeWidth="6.5" />
      <path d="M16.1 34.2C7.4 42.7 3.7 49.6 6.2 52.1c3.5 3.6 17.8-3.2 31.9-15.2S60.8 13.3 57.3 9.8c-2.2-2.3-8.9-.5-16.8 3.9" stroke={`url(#${id}-orbit)`} strokeWidth="4.2" strokeLinecap="round" />
    </svg>
  );
}