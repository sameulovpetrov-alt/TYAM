import { useEffect, useState } from "react";

const TIPS = [
  "Создавайте серверы и зовите друзей",
  "Настраивайте роли с градиентными никами",
  "Украшайте профиль в магазине TYAM",
  "Анимированные аватары оживляют чат",
  "Бусты открывают привилегии сервера",
];

/** Загрузочный экран TYAM: логотип-планета, свечение и прогресс */
export default function SplashScreen({ onDone, reducedMotion = false }: { onDone: () => void; reducedMotion?: boolean }) {
  const [progress, setProgress] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const [tip] = useState(() => TIPS[Math.floor(Math.random() * TIPS.length)]);

  useEffect(() => {
    let raf = 0;
    let finishTimer = 0;
    const start = performance.now();
    const reduce = reducedMotion || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const duration = reduce ? 300 : 1400;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // плавное замедление к концу
      const eased = 1 - Math.pow(1 - t, 2.2);
      setProgress(Math.round(eased * 100));
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setLeaving(true);
        finishTimer = window.setTimeout(onDone, reduce ? 0 : 620);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(finishTimer);
    };
  }, [onDone, reducedMotion]);

  return (
    <div
      className={`splash-root ${leaving ? "splash-leaving" : ""} ${reducedMotion ? "splash-reduced" : ""}`}
      role="status"
      aria-label="Загрузка TYAM"
    >
      {/* фоновое звёздное свечение */}
      <div className="splash-stars" aria-hidden />
      <div className="splash-glow" aria-hidden />

      <div className="relative flex flex-col items-center">
        {/* логотип-планета */}
        <div className="splash-logo">
          <svg viewBox="0 0 220 220" className="h-full w-full" aria-hidden>
            <defs>
              <radialGradient id="tyam-planet" cx="38%" cy="32%" r="80%">
                <stop offset="0%" stopColor="#3b4bd8" />
                <stop offset="45%" stopColor="#5a2fd6" />
                <stop offset="100%" stopColor="#7c3aed" />
              </radialGradient>
              <linearGradient id="tyam-ring" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="40%" stopColor="#dbe4ff" />
                <stop offset="70%" stopColor="#67e8f9" />
                <stop offset="100%" stopColor="#c4b5fd" />
              </linearGradient>
              <filter id="tyam-blur" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="7" />
              </filter>
            </defs>

            {/* внешнее сияние планеты */}
            <circle cx="110" cy="110" r="62" fill="#4f46e5" opacity="0.55" filter="url(#tyam-blur)" />
            {/* тело планеты */}
            <circle cx="110" cy="110" r="52" fill="url(#tyam-planet)" />
            <circle cx="110" cy="110" r="52" fill="none" stroke="#8b5cf6" strokeOpacity="0.6" strokeWidth="1.5" />
            {/* блик */}
            <ellipse cx="90" cy="86" rx="20" ry="13" fill="#ffffff" opacity="0.18" />

            {/* кольцо-орбита */}
            <g className="splash-ring-group">
              <ellipse
                cx="110"
                cy="110"
                rx="92"
                ry="34"
                fill="none"
                stroke="url(#tyam-ring)"
                strokeWidth="9"
                strokeLinecap="round"
                transform="rotate(-28 110 110)"
              />
            </g>
          </svg>
        </div>

        {/* название */}
        <div className="splash-title font-display">TYAM</div>
        <div className="splash-sub">общение без границ</div>

        {/* прогресс */}
        <div className="splash-bar">
          <div className="splash-bar-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="splash-meta">
          <span>{tip}</span>
          <span className="tabular-nums">{progress}%</span>
        </div>
      </div>

      <div className="splash-footer">TYAM · загрузка рабочего пространства</div>
    </div>
  );
}
