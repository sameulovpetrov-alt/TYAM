import { useEffect, useState } from "react";
import { ArrowUpRight, Camera, ChevronDown, Gem, Palette, ShoppingCart, Sparkles, Zap } from "lucide-react";
import type { Server } from "../data";
import { USERS } from "../data";
import { LEVEL_THRESHOLDS, agoLabel, boostLevel } from "../store";
import type { BoostEvent, BoostInfo } from "../store";
import { cn } from "../utils/cn";

const NEXT_PERK: Record<number, { icon: React.ReactNode; title: string; desc: string }> = {
  0: { icon: <Sparkles className="h-4 w-4" />, title: "Анимированная иконка и баннер", desc: "Сервер оживёт в рейке и шапке" },
  1: { icon: <Palette className="h-4 w-4" />, title: "Градиентные никнеймы", desc: "Имена участников в два цвета" },
  2: { icon: <Camera className="h-4 w-4" />, title: "Живые аватары", desc: "Анимированная рамка LIVE у всех" },
  3: { icon: <Zap className="h-4 w-4" />, title: "Максимум достигнут", desc: "Открыты все привилегии сервера" },
};

const KIND_STYLE: Record<BoostEvent["kind"], { chip: string; icon: React.ReactNode }> = {
  boost: { chip: "boost-gradient", icon: <Gem className="h-3 w-3 text-white" /> },
  level: { chip: "bg-idle", icon: <Sparkles className="h-3 w-3 text-ink-900" /> },
  purchase: { chip: "bg-online", icon: <ShoppingCart className="h-3 w-3 text-white" /> },
};

export default function BoostPanel({
  server,
  info,
  credits,
  meName,
  onOpenBoost,
  onQuickBuy,
}: {
  server: Server;
  info: BoostInfo;
  credits: number;
  meName: string;
  onOpenBoost: () => void;
  onQuickBuy: (count: number, price: number) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 20000);
    return () => window.clearInterval(t);
  }, []);

  const level = boostLevel(info.count);
  const next = level < 3 ? LEVEL_THRESHOLDS[level + 1] : null;
  const prev = LEVEL_THRESHOLDS[level];
  const progress = next ? Math.min(100, ((info.count - prev) / (next - prev)) * 100) : 100;
  const events = [...(info.events ?? [])].sort((a, b) => b.at - a.at);
  const fresh = events.some((e) => now - e.at < 45000);
  const perk = NEXT_PERK[level];

  return (
    <section
      className={cn(
        "relative mx-2 mb-1 overflow-hidden rounded-xl border bg-ink-900 transition-colors duration-300",
        fresh ? "border-boost-1/60" : level > 0 ? "border-boost-2/30" : "border-ink-700"
      )}
    >
      {/* фоновая подсветка, усиливающаяся с уровнем */}
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            level > 0
              ? `radial-gradient(120px 70px at 88% 0%, rgba(255,115,250,${0.1 + level * 0.07}), transparent 70%), radial-gradient(140px 90px at 0% 100%, rgba(138,92,246,${0.08 + level * 0.06}), transparent 70%)`
              : "radial-gradient(120px 70px at 88% 0%, rgba(110,127,166,0.12), transparent 70%)",
        }}
      />

      <div className="relative p-2.5">
        {/* шапка */}
        <div className="flex items-start gap-2.5">
          <span
            className={cn(
              "relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
              level > 0 ? "boost-gradient shadow-lg shadow-boost-2/30" : "bg-ink-700"
            )}
          >
            <Gem className={cn("h-4.5 w-4.5", level > 0 ? "text-white" : "text-fog-400", fresh && "gem-float")} />
            {fresh && <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-online ring-2 ring-ink-900 voice-pulse" />}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-1.5">
              <span className="text-[10px] font-extrabold tracking-[0.14em] text-fog-500 uppercase">Бусты</span>
              {level > 0 && (
                <span className="boost-text rounded-full bg-boost-2/20 px-1.5 py-px text-[10px] font-extrabold tracking-wide text-boost-1 uppercase">
                  ур. {level}
                </span>
              )}
              {fresh && <span className="text-[10px] font-bold text-online">новое</span>}
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className={cn("font-display text-lg leading-none font-extrabold", level > 0 ? "text-white" : "text-fog-400")}>
                {info.count}
              </span>
              <span className="text-[11px] text-fog-500">
                {info.count === 1 ? "буст" : info.count < 5 ? "буста" : "бустов"} · {server.name}
              </span>
            </div>
          </div>

          <button
            onClick={() => setExpanded((v) => !v)}
            title={expanded ? "Свернуть" : "Развернуть"}
            className="shrink-0 rounded-md p-1 text-fog-500 transition hover:bg-ink-700 hover:text-white"
          >
            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", !expanded && "-rotate-90")} />
          </button>
        </div>

        {/* прогресс до следующего уровня */}
        <div className="mt-2.5">
          <div className="relative h-1.5 overflow-hidden rounded-full bg-ink-700">
            <div
              className={cn("bar-grow h-full rounded-full transition-[width] duration-700", level === 3 ? "boost-gradient" : "bg-boost-1")}
              style={{ width: `${Math.max(progress, info.count > 0 ? 8 : 2)}%` }}
            >
              {level < 3 && <span className="shimmer absolute inset-0 rounded-full" />}
            </div>
            {LEVEL_THRESHOLDS.slice(1).map((t) => (
              <span
                key={t}
                className={cn("absolute top-0 h-full w-px", info.count >= t ? "bg-boost-1/40" : "bg-ink-900/70")}
                style={{ left: `${(t / LEVEL_THRESHOLDS[3]) * 100}%` }}
              />
            ))}
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[10px]">
            <span className="text-fog-500">
              {next ? (
                <>
                  ещё <b className="font-bold text-fog-300">{next - info.count}</b> до уровня {level + 1}
                </>
              ) : (
                <b className="font-bold text-boost-1">все уровни открыты</b>
              )}
            </span>
            <span className="tabular-nums text-fog-500">2 · 7 · 14</span>
          </div>
        </div>

        {expanded && (
          <>
            {/* следующая привилегия */}
            <div className="mt-2.5 flex items-center gap-2 rounded-lg bg-ink-850/80 px-2.5 py-2">
              <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg", level === 3 ? "bg-boost-2/25 text-boost-1" : "bg-ink-700 text-fog-300")}>
                {perk.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[11px] font-bold text-fog-100">{perk.title}</span>
                <span className="block truncate text-[10px] text-fog-500">{perk.desc}</span>
              </span>
              <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-fog-500" />
            </div>

            {/* лента событий */}
            <div className="mt-2.5">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[10px] font-extrabold tracking-[0.14em] text-fog-500 uppercase">События</span>
                {events.length > 0 && <span className="text-[10px] tabular-nums text-fog-500">{events.length}</span>}
              </div>

              {events.length === 0 ? (
                <p className="rounded-lg border border-dashed border-ink-600 px-2.5 py-3 text-[11px] leading-snug text-fog-500">
                  Пока пусто. Первый буст и сообщения о новых уровнях появятся здесь.
                </p>
              ) : (
                <ul className="max-h-44 space-y-1 overflow-y-auto pr-0.5">
                  {events.map((e, i) => {
                    const style = KIND_STYLE[e.kind];
                    const person = e.userId ? (e.userId === "me" ? meName : USERS[e.userId]?.name) : null;
                    const isNew = now - e.at < 45000;
                    return (
                      <li
                        key={e.id}
                        className={cn(
                          "msg-in flex items-start gap-2 rounded-lg px-2 py-1.5 transition-colors",
                          isNew ? "bg-boost-2/12" : "hover:bg-ink-850/70"
                        )}
                        style={{ animationDelay: `${Math.min(i, 5) * 40}ms` }}
                      >
                        <span className={cn("mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-md", style.chip)}>{style.icon}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[11px] leading-snug text-fog-200">
                            {person && <b className="font-bold text-white">{person} </b>}
                            {e.text}
                          </span>
                          <span className="mt-0.5 flex items-center gap-1 text-[10px] text-fog-500">
                            {isNew && <span className="h-1 w-1 rounded-full bg-online" />}
                            {agoLabel(e.at, now)}
                          </span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* действия */}
            <div className="mt-2.5 flex items-center gap-1.5">
              <button
                onClick={onOpenBoost}
                disabled={level === 3}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-[11px] font-extrabold tracking-wide transition active:scale-95",
                  level === 3
                    ? "cursor-default bg-ink-700 text-fog-500"
                    : "boost-gradient text-white shadow-md shadow-boost-2/30 hover:brightness-110"
                )}
              >
                <Gem className="h-3.5 w-3.5" />
                {level === 3 ? "Максимум" : "Забустить сервер"}
              </button>
              {credits > 0 ? (
                <span className="flex shrink-0 items-center gap-1 rounded-lg bg-ink-850 px-2 py-2 text-[11px] font-bold text-boost-1">
                  <Gem className="h-3 w-3" /> {credits}
                </span>
              ) : (
                <button
                  onClick={() => onQuickBuy(1, 99)}
                  className="flex shrink-0 items-center gap-1 rounded-lg border border-boost-2/50 px-2 py-2 text-[11px] font-bold text-boost-1 transition hover:bg-boost-2/15 active:scale-95"
                >
                  <ShoppingCart className="h-3 w-3" /> 99 ₽
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
