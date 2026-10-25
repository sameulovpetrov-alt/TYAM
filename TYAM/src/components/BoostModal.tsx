import { useEffect, useState } from "react";
import {
  AudioLines,
  Check,
  Crown,
  FileUp,
  Gem,
  Image,
  Lock,
  Palette,
  Radio,
  ShoppingCart,
  Camera,
  Smile,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import type { Server } from "../data";
import { USERS } from "../data";
import type { BoostInfo } from "../store";
import { LEVEL_THRESHOLDS, agoLabel, boostLevel, useSettings } from "../store";
import { cn } from "../utils/cn";
import { Avatar } from "./ui";
import { Modal, Sparkles as SparkleBurst } from "./Modal";

const PERKS: { level: number; icon: React.ReactNode; name: string; desc: string }[] = [
  { level: 1, icon: <Star className="h-5 w-5" />, name: "Анимированная иконка", desc: "Иконка сервера оживает" },
  { level: 1, icon: <Image className="h-5 w-5" />, name: "Баннер сервера", desc: "Показывается в шапке каналов" },
  { level: 1, icon: <Smile className="h-5 w-5" />, name: "+50 эмодзи", desc: "Больше слотов для эмодзи" },
  { level: 1, icon: <AudioLines className="h-5 w-5" />, name: "Аудио 128 кбит/с", desc: "Чистый звук в голосовых" },
  { level: 2, icon: <Radio className="h-5 w-5" />, name: "Трансляции 1080p", desc: "Стримьте в высоком качестве" },
  { level: 2, icon: <FileUp className="h-5 w-5" />, name: "Файлы до 50 МБ", desc: "Больше места для вложений" },
  { level: 2, icon: <AudioLines className="h-5 w-5" />, name: "Аудио 256 кбит/с", desc: "Ещё чище, ещё громче" },
  { level: 2, icon: <Smile className="h-5 w-5" />, name: "+50 эмодзи", desc: "Второй пакет слотов" },
  { level: 2, icon: <Palette className="h-5 w-5" />, name: "Градиентный никнейм", desc: "Имя участника из двух цветов по всему серверу" },
  { level: 3, icon: <Crown className="h-5 w-5" />, name: "Ванити-ссылка", desc: "max.ru/join/ваш-сервер" },
  { level: 3, icon: <FileUp className="h-5 w-5" />, name: "Файлы до 100 МБ", desc: "Максимальный размер загрузки" },
  { level: 3, icon: <AudioLines className="h-5 w-5" />, name: "Аудио 384 кбит/с", desc: "Студийное качество звука" },
  { level: 3, icon: <Sparkles className="h-5 w-5" />, name: "Анимированный баннер", desc: "Эксклюзив уровня 3" },
  { level: 3, icon: <Camera className="h-5 w-5" />, name: "Живые аватары", desc: "Анимированная рамка LIVE у всех участников сервера" },
];

const BOOST_PACKS = [
  { count: 1, price: 99, label: "1 буст" },
  { count: 2, price: 179, label: "2 буста", best: true },
  { count: 5, price: 399, label: "5 бустов" },
];

export default function BoostModal({
  server,
  info,
  onBoost,
  onBuy,
  onClose,
}: {
  server: Server;
  info: BoostInfo;
  onBoost: () => void;
  onBuy: (count: number, price: number) => void;
  onClose: () => void;
}) {
  const [buyOpen, setBuyOpen] = useState(false);
  const { settings, toast } = useSettings();
  const level = boostLevel(info.count);
  const next = level < 3 ? LEVEL_THRESHOLDS[level + 1] : null;
  const prevThreshold = LEVEL_THRESHOLDS[level];
  const progress = next ? Math.min(100, ((info.count - prevThreshold) / (next - prevThreshold)) * 100) : 100;
  const [burst, setBurst] = useState(false);
  const [prevLevel, setPrevLevel] = useState(level);

  useEffect(() => {
    if (level > prevLevel) {
      setBurst(true);
      const t = window.setTimeout(() => setBurst(false), 1400);
      const perk =
        level === 1
          ? "анимированная иконка и баннер сервера"
          : level === 2
            ? "градиентные никнеймы участников из двух цветов"
            : "живые анимированные аватары участников";
      toast(`Уровень ${level} достигнут! Открыто: ${perk} 💎`, "boost");
      return () => window.clearTimeout(t);
    }
    setPrevLevel(level);
  }, [level, prevLevel, server.name, toast]);

  const boost = () => {
    if (settings.boostCredits <= 0) {
      setBuyOpen(true);
      return;
    }
    onBoost();
    setPrevLevel(boostLevel(info.count));
    setBurst(true);
    window.setTimeout(() => setBurst(false), 1200);
    toast(`Вы забустили «${server.name}»! Осталось бустов: ${settings.boostCredits - 1}`, "boost");
  };

  return (
    <Modal onClose={onClose} wide>
      <button onClick={onClose} title="Закрыть" className="absolute top-4 right-4 z-20 rounded-full bg-black/30 p-1.5 text-white/80 backdrop-blur transition hover:rotate-90 hover:text-white">
        <X className="h-4 w-4" />
      </button>

      <div className={cn("relative overflow-hidden bg-gradient-to-br p-8 text-white", server.banner)}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(255,255,255,0.25),transparent_55%)]" />
        <SparkleBurst show={burst} count={30} />
        <div className="relative flex items-center gap-5">
          <div className={cn("boost-gradient gem-float flex h-20 w-20 items-center justify-center rounded-3xl shadow-2xl shadow-black/30", level === 0 && "bg-ink-700 from-ink-600 to-ink-700")}>
            <Gem className="h-10 w-10 text-white drop-shadow" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="boost-text rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-extrabold tracking-wide uppercase">
                {level > 0 ? `Уровень ${level}` : "Бустов нет"}
              </span>
              <span className="rounded-full bg-black/25 px-2.5 py-1 text-[11px] font-semibold backdrop-blur">{server.name}</span>
            </div>
            <h2 className="font-display mt-2 text-2xl font-extrabold drop-shadow-sm">
              {level === 3 ? "Максимальный уровень!" : `До уровня ${level + 1} осталось ${next! - info.count} буст.`}
            </h2>
            <p className="mt-1 text-sm text-white/85">
              Бусты открывают привилегии для всех участников сервера
            </p>
          </div>
        </div>

        {/* progress */}
        <div className="relative mt-7">
          <div className="flex justify-between text-[11px] font-bold tracking-wider uppercase">
            {[1, 2, 3].map((l) => (
              <span key={l} className={cn("flex items-center gap-1.5", level >= l ? "text-white" : "text-white/50")}>
                <span className={cn("flex h-5 w-5 items-center justify-center rounded-full text-[10px]", level >= l ? "bg-white text-boost-2" : "bg-black/25")}>
                  {level >= l ? <Check className="h-3 w-3" /> : l}
                </span>
                {LEVEL_THRESHOLDS[l]}
              </span>
            ))}
          </div>
          <div className="mt-2 h-3 overflow-hidden rounded-full bg-black/30">
            <div className="relative h-full rounded-full bg-white/95 bar-grow" style={{ width: `${progress}%` }}>
              <div className="shimmer absolute inset-0 rounded-full" />
            </div>
          </div>
          <div className="mt-2 flex justify-between text-sm font-semibold">
            <span className="text-white/90">
              💎 {info.count} {info.count === 1 ? "буст" : info.count < 5 ? "буста" : "бустов"}
            </span>
            <span className="text-white/70">{next ? `${next - info.count} до уровня ${level + 1}` : "все привилегии открыты"}</span>
          </div>
        </div>
      </div>

      <div className="max-h-[46vh] overflow-y-auto bg-ink-800 px-8 py-6">
        {[1, 2, 3].map((l) => {
          const perks = PERKS.filter((p) => p.level === l);
          const unlocked = level >= l;
          return (
            <div key={l} className="mb-6 last:mb-0">
              <div className="mb-3 flex items-center gap-2">
                <span className={cn("flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-extrabold", unlocked ? "boost-gradient text-white" : "bg-ink-600 text-fog-500")}>
                  {l}
                </span>
                <h3 className={cn("font-display text-sm font-bold tracking-wide uppercase", unlocked ? "text-white" : "text-fog-500")}>Уровень {l}</h3>
                <span className="text-xs text-fog-500">· {LEVEL_THRESHOLDS[l]} буст.</span>
                {!unlocked && <Lock className="ml-auto h-4 w-4 text-fog-500" />}
                {unlocked && <span className="ml-auto rounded-full bg-boost-2/20 px-2 py-0.5 text-[11px] font-bold text-boost-1">Открыто</span>}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {perks.map((p) => (
                  <div
                    key={p.name + p.desc}
                    className={cn(
                      "flex items-start gap-3 rounded-xl border p-3 transition",
                      unlocked ? "border-boost-2/30 bg-ink-850 hover:border-boost-1/60" : "border-ink-700 bg-ink-900/60 opacity-55"
                    )}
                  >
                    <span className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", unlocked ? "boost-gradient text-white" : "bg-ink-700 text-fog-500")}>
                      {p.icon}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-bold text-fog-100">{p.name}</div>
                      <div className="text-xs leading-snug text-fog-500">{p.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {(info.events ?? []).length > 0 && (
          <div className="mt-2 border-t border-ink-700 pt-5">
            <h3 className="mb-3 flex items-center gap-2 text-xs font-bold tracking-wider text-fog-500 uppercase">
              Лента бустов
              <span className="rounded-full bg-boost-2/20 px-2 py-0.5 text-[10px] text-boost-1">{info.events!.length}</span>
            </h3>
            <ul className="max-h-40 space-y-1 overflow-y-auto pr-1">
              {[...(info.events ?? [])]
                .sort((a, b) => b.at - a.at)
                .map((ev) => (
                  <li key={ev.id} className="flex items-center gap-2.5 rounded-lg bg-ink-850 px-3 py-2">
                    <span
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-md",
                        ev.kind === "level" ? "bg-idle text-ink-900" : ev.kind === "purchase" ? "bg-online text-white" : "boost-gradient text-white"
                      )}
                    >
                      {ev.kind === "level" ? <Sparkles className="h-3.5 w-3.5" /> : ev.kind === "purchase" ? <ShoppingCart className="h-3.5 w-3.5" /> : <Gem className="h-3.5 w-3.5" />}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[13px] text-fog-200">
                      {ev.userId && <b className="font-bold text-white">{ev.userId === "me" ? "Вы " : `${USERS[ev.userId]?.name ?? ""} `}</b>}
                      {ev.text}
                    </span>
                    <span className="shrink-0 text-[11px] tabular-nums text-fog-500">{agoLabel(ev.at)}</span>
                  </li>
                ))}
            </ul>
          </div>
        )}

        {info.boosters.length > 0 && (
          <div className="mt-2 border-t border-ink-700 pt-5">
            <h3 className="mb-3 text-xs font-bold tracking-wider text-fog-500 uppercase">Бустеры сервера — {info.boosters.length}</h3>
            <div className="flex flex-wrap gap-2">
              {info.boosters.map((b) => {
                const u = USERS[b.userId];
                if (!u) return null;
                return (
                  <div key={b.userId} className="flex items-center gap-2 rounded-full bg-ink-850 py-1 pr-3 pl-1 transition hover:bg-ink-750">
                    <div className="boost-gradient rounded-full p-[2px]">
                      <Avatar user={u} size={26} showStatus={false} ring="ring-ink-850" />
                    </div>
                    <span className="text-sm font-semibold text-fog-100">{u.name}</span>
                    <Gem className="h-3.5 w-3.5 text-boost-1" />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* покупка бустов */}
      {(buyOpen || settings.boostCredits <= 0) && level < 3 && (
        <div className="border-t border-boost-2/25 bg-ink-900 px-8 py-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-bold text-fog-100">
            <ShoppingCart className="h-4 w-4 text-boost-1" /> Купить бусты
            <span className="text-xs font-normal text-fog-500">· без подписки Premium</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {BOOST_PACKS.map((pack) => (
              <button
                key={pack.count}
                onClick={() => { onBuy(pack.count, pack.price); setBuyOpen(false); }}
                className={cn(
                  "relative rounded-xl border-2 p-3 text-left transition hover:scale-[1.03] active:scale-95",
                  pack.best ? "border-boost-1/70 bg-boost-2/10" : "border-ink-600/60 bg-ink-850 hover:border-boost-2/50"
                )}
              >
                {pack.best && (
                  <span className="boost-gradient absolute -top-2.5 right-2 rounded-full px-2 py-0.5 text-[9px] font-extrabold tracking-wide text-white uppercase">Выгодно</span>
                )}
                <div className="flex items-center gap-1.5 text-sm font-bold text-fog-100">
                  <Gem className="h-4 w-4 text-boost-1" /> {pack.label}
                </div>
                <div className="mt-1 text-lg font-extrabold text-white">{pack.price} ₽</div>
                <div className="text-[10px] text-fog-500">{Math.round(pack.price / pack.count)} ₽ за буст</div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-4 border-t border-ink-950/60 bg-ink-850 px-8 py-5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-sm font-bold text-fog-100">
            <Gem className="h-4 w-4 text-boost-1" />
            Доступно бустов: {settings.boostCredits}
          </div>
          <p className="truncate text-xs text-fog-500">Бусты покупаются отдельно и не требуют подписки TYAM Premium</p>
        </div>
        {level < 3 && (
          <button
            onClick={() => setBuyOpen((v) => !v)}
            title="Купить бусты"
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-bold transition",
              buyOpen ? "border-boost-1 bg-boost-2/20 text-boost-1" : "border-boost-2/50 text-boost-1 hover:bg-boost-2/10"
            )}
          >
            <ShoppingCart className="h-4 w-4" /> Купить
          </button>
        )}
        <button
          onClick={boost}
          disabled={level === 3}
          className={cn(
            "flex shrink-0 items-center gap-2 rounded-xl px-6 py-3 font-bold text-white transition",
            level === 3
              ? "cursor-not-allowed bg-ink-600 text-fog-500"
              : "boost-gradient shadow-lg shadow-boost-2/40 hover:brightness-110 active:scale-95"
          )}
        >
          <Gem className="h-5 w-5" />
          {level === 3 ? "Максимум достигнут" : settings.boostCredits <= 0 ? "Купить и бустить" : "Бустить сервер"}
        </button>
      </div>
    </Modal>
  );
}