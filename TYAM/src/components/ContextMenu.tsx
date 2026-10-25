import { useEffect, type ReactNode } from "react";
import { cn } from "../utils/cn";

export interface MenuItem {
  label: string;
  icon?: ReactNode;
  danger?: boolean;
  disabled?: boolean;
  hint?: string;
  onClick: () => void;
}

export default function ContextMenu({
  x,
  y,
  title,
  items,
  onClose,
}: {
  x: number;
  y: number;
  title?: string;
  items: (MenuItem | "divider")[];
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const height = 24 + items.length * 36;
  const left = Math.max(8, Math.min(x, window.innerWidth - 236));
  const top = Math.max(8, Math.min(y, window.innerHeight - height - 8));

  return (
    <>
      <div className="fixed inset-0 z-[70]" onClick={onClose} onContextMenu={(e) => { e.preventDefault(); onClose(); }} />
      <div
        className="pop fixed z-[71] w-56 rounded-xl border border-ink-600/60 bg-ink-850 p-1.5 shadow-2xl shadow-black/60"
        style={{ left, top, transformOrigin: "top left" }}
        onContextMenu={(e) => e.preventDefault()}
        role="menu"
      >
        {title && (
          <div className="truncate px-2.5 pt-1.5 pb-2 text-[11px] font-bold tracking-wider text-fog-500 uppercase">{title}</div>
        )}
        {items.map((item, i) =>
          item === "divider" ? (
            <div key={`d${i}`} className="my-1 h-px bg-ink-700" />
          ) : (
            <button
              key={item.label}
              disabled={item.disabled}
              onClick={() => {
                if (item.disabled) return;
                item.onClick();
                onClose();
              }}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition",
                item.disabled
                  ? "cursor-default text-fog-500/60"
                  : item.danger
                    ? "font-semibold text-dnd hover:bg-dnd/15"
                    : "text-fog-200 hover:bg-ink-700 hover:text-white"
              )}
              role="menuitem"
            >
              <span className={cn("shrink-0", item.danger ? "text-dnd" : "text-fog-400")}>{item.icon}</span>
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
              {item.hint && <span className="shrink-0 text-[10px] text-fog-500">{item.hint}</span>}
            </button>
          )
        )}
      </div>
    </>
  );
}
