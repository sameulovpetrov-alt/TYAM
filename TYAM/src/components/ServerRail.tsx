import { useState } from "react";
import { Compass, Gem, LogOut, Plus, Rocket, Settings, UserPlus, X } from "lucide-react";
import type { Server } from "../data";
import { cn } from "../utils/cn";
import { Tooltip } from "./ui";

export default function ServerRail({
  servers,
  boostLevels,
  activeServer,
  onSelect,
  onCreate,
  onSettings,
  onLeave,
  onInvite,
  onCreateChannel,
  onOpenLauncher,
}: {
  servers: Server[];
  boostLevels: Record<string, number>;
  activeServer: string;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onSettings: (id: string) => void;
  onLeave: (id: string) => void;
  onInvite: (id: string) => void;
  onCreateChannel: (id: string) => void;
  onOpenLauncher: () => void;
}) {
  const [menu, setMenu] = useState<{ id: string; x: number; y: number } | null>(null);

  const openMenu = (event: React.MouseEvent, id: string) => {
    event.preventDefault();
    event.stopPropagation();
    setMenu({
      id,
      x: Math.min(event.clientX, window.innerWidth - 220),
      y: Math.min(event.clientY, window.innerHeight - 240),
    });
  };

  return (
    <nav className="flex w-[76px] shrink-0 flex-col items-center gap-2 overflow-y-auto bg-ink-950 py-3 [scrollbar-width:none]">
      <span className="font-display mb-1 text-[9px] font-extrabold tracking-[0.18em] text-white/85">TYAM</span>
      <Tooltip label="Главная · друзья и ЛС">
        <button
          onClick={() => onSelect("home")}
          className="group relative flex h-12 w-12 items-center justify-center"
          aria-label="Главная"
        >
          <span
            className={cn(
              "absolute top-1/2 -left-[14px] w-1 -translate-y-1/2 rounded-r-full bg-current transition-all duration-200",
              activeServer === "home" ? "h-10 text-max-400" : "h-0 text-white group-hover:h-5"
            )}
          />
          <span
            className={cn(
              "flex h-12 w-12 items-center justify-center transition-all duration-200",
              activeServer === "home" ? "max-gradient rounded-2xl shadow-lg shadow-max-600/40" : "rounded-3xl bg-ink-800 group-hover:rounded-2xl group-hover:max-gradient"
            )}
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6 fill-white">
              <path d="M12 2C6.48 2 2 5.94 2 10.8c0 2.78 1.46 5.25 3.75 6.86-.13 1.1-.55 2.4-1.5 3.34 0 0 2.36-.17 4.34-1.53 1.06.34 2.21.53 3.41.53 5.52 0 10-3.94 10-8.8S17.52 2 12 2z" />
            </svg>
          </span>
        </button>
      </Tooltip>

      <div className="my-1 h-0.5 w-8 rounded-full bg-ink-700" />

      {servers.map((s) => {
        const active = activeServer === s.id;
        const lvl = boostLevels[s.id] ?? 0;
        return (
          <Tooltip key={s.id} label={s.name}>
            <button
              onClick={() => onSelect(s.id)}
              onContextMenu={(event) => openMenu(event, s.id)}
              className="group relative flex h-12 w-12 items-center justify-center"
              aria-label={s.name}
              title={`${s.name} · правая кнопка — меню`}
            >
              <span
                className={cn(
                  "absolute top-1/2 -left-[14px] w-1 -translate-y-1/2 rounded-r-full transition-all duration-200",
                  active ? "h-10 bg-max-400" : s.unread ? "h-2 bg-white" : "h-0 bg-white group-hover:h-5"
                )}
              />
              <span
                className={cn(
                  "flex h-12 w-12 items-center justify-center overflow-hidden text-xl transition-all duration-200",
                  lvl >= 3 && "live-ring",
                  s.color,
                  active ? "rounded-2xl" : "rounded-3xl group-hover:rounded-2xl",
                  s.id === "hub" && "font-display max-gradient text-[13px] font-bold tracking-tight text-white",
                  active && s.id === "hub" && "shadow-lg shadow-max-600/40",
                  !active && s.id === "hub" && "group-hover:shadow-lg group-hover:shadow-max-600/30"
                )}
              >
                {s.iconUrl ? (
                  <img src={s.iconUrl} alt={s.name} className="h-full w-full rounded-[inherit] object-cover" draggable={false} />
                ) : (
                  s.icon ?? s.short
                )}
              </span>
              {lvl > 0 && (
                <span className="boost-gradient absolute -bottom-1 -left-1 flex h-5 w-5 items-center justify-center rounded-full ring-2 ring-ink-950">
                  <Gem className="h-3 w-3 text-white" />
                </span>
              )}
              {s.mentions ? (
                <span className="absolute -right-1 -bottom-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-dnd px-1 text-[11px] font-bold text-white ring-4 ring-ink-950">
                  {s.mentions}
                </span>
              ) : null}
            </button>
          </Tooltip>
        );
      })}

      <div className="my-1 h-0.5 w-8 rounded-full bg-ink-700" />

      <Tooltip label="Добавить сервер">
        <button
          onClick={onCreate}
          className="flex h-12 w-12 items-center justify-center rounded-3xl bg-ink-800 text-online transition-all duration-200 hover:rotate-90 hover:rounded-2xl hover:bg-online hover:text-white"
        >
          <Plus className="h-6 w-6" />
        </button>
      </Tooltip>
      <Tooltip label="Обзор публичных серверов">
        <button className="flex h-12 w-12 items-center justify-center rounded-3xl bg-ink-800 text-online transition-all duration-200 hover:rounded-2xl hover:bg-online hover:text-white">
          <Compass className="h-6 w-6" />
        </button>
      </Tooltip>
      <div className="mt-auto pt-5">
        <Tooltip label="Вернуться в лаунчер TYAM">
          <button onClick={onOpenLauncher} aria-label="Вернуться в лаунчер TYAM" title="Вернуться в лаунчер TYAM" className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink-800 text-max-300 transition-all duration-200 hover:bg-ink-600 hover:text-white">
            <Rocket className="h-5 w-5" />
          </button>
        </Tooltip>
      </div>

      {menu && (
        <>
          <button className="fixed inset-0 z-40 cursor-default" aria-label="Закрыть меню сервера" onClick={() => setMenu(null)} />
          <div
            className="fade-in fixed z-50 w-52 rounded-xl border border-ink-600/60 bg-ink-850 p-1.5 shadow-2xl shadow-black/60"
            style={{ left: menu.x, top: menu.y }}
            onContextMenu={(e) => e.preventDefault()}
          >
            <div className="flex items-center justify-between px-2.5 py-2">
              <span className="truncate text-xs font-bold text-fog-500">{servers.find((s) => s.id === menu.id)?.name}</span>
              <button onClick={() => setMenu(null)} className="rounded p-0.5 text-fog-500 hover:text-white"><X className="h-3.5 w-3.5" /></button>
            </div>
            <div className="h-px bg-ink-700" />
            <button
              onClick={() => { onInvite(menu.id); setMenu(null); }}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-fog-200 transition hover:bg-ink-700 hover:text-white"
            >
              <UserPlus className="h-4 w-4" /> Пригласить друзей
            </button>
            <button
              onClick={() => { onCreateChannel(menu.id); setMenu(null); }}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-fog-200 transition hover:bg-ink-700 hover:text-white"
            >
              <Plus className="h-4 w-4" /> Создать канал
            </button>
            <button
              onClick={() => { onSettings(menu.id); setMenu(null); }}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-fog-200 transition hover:bg-ink-700 hover:text-white"
            >
              <Settings className="h-4 w-4" /> Настройки сервера
            </button>
            <div className="my-1 h-px bg-ink-700" />
            <button
              onClick={() => { onLeave(menu.id); setMenu(null); }}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-semibold text-dnd transition hover:bg-dnd/15"
            >
              <LogOut className="h-4 w-4" /> Покинуть сервер
            </button>
          </div>
        </>
      )}
    </nav>
  );
}