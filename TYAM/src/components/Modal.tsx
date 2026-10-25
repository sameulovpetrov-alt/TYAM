import { useEffect, type ReactNode } from "react";
import { CheckCircle2, Gem, Info } from "lucide-react";
import { cn } from "../utils/cn";
import { useSettings } from "../store";

export function Modal({
  children,
  onClose,
  wide = false,
  className,
}: {
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
  className?: string;
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-[2px]" onClick={onClose}>
      <div
        className={cn(
          "modal-in relative max-h-[92vh] w-full overflow-hidden rounded-2xl bg-ink-800 shadow-2xl shadow-black/60",
          wide ? "max-w-3xl" : "max-w-lg",
          className
        )}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {children}
      </div>
    </div>
  );
}

export function Sparkles({ show, count = 26 }: { show: boolean; count?: number }) {
  if (!show) return null;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: count }).map((_, i) => {
        const angle = (i / count) * Math.PI * 2;
        const dist = 90 + Math.random() * 190;
        return (
          <span
            key={i}
            className="sparkle absolute top-1/2 left-1/2 text-lg"
            style={
              {
                "--tx": `${Math.cos(angle) * dist}px`,
                "--ty": `${Math.sin(angle) * dist}px`,
                "--rot": `${Math.random() * 540 - 270}deg`,
                animationDelay: `${Math.random() * 0.25}s`,
              } as React.CSSProperties
            }
          >
            {i % 3 === 0 ? "💎" : i % 3 === 1 ? "✨" : "🚀"}
          </span>
        );
      })}
    </div>
  );
}

export function Toasts() {
  const { toasts } = useSettings();
  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-[80] flex w-80 flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "toast-in pointer-events-auto flex items-start gap-3 rounded-xl border p-3 shadow-2xl shadow-black/50 backdrop-blur",
            t.kind === "boost"
              ? "border-boost-1/40 bg-ink-850/95"
              : t.kind === "success"
                ? "border-online/40 bg-ink-850/95"
                : "border-ink-600/60 bg-ink-850/95"
          )}
        >
          <span
            className={cn(
              "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
              t.kind === "boost" ? "boost-gradient text-white" : t.kind === "success" ? "bg-online text-white" : "max-gradient text-white"
            )}
          >
            {t.kind === "boost" ? <Gem className="h-4 w-4" /> : t.kind === "success" ? <CheckCircle2 className="h-4 w-4" /> : <Info className="h-4 w-4" />}
          </span>
          <p className="text-sm leading-snug font-medium text-fog-100">{t.text}</p>
        </div>
      ))}
    </div>
  );
}
