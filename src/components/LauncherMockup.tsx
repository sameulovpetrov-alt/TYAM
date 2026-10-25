import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  BadgeCheck,
  Bell,
  Check,
  ChevronRight,
  CircleHelp,
  Cpu,
  Download,
  Hash,
  Home,
  LifeBuoy,
  Maximize2,
  Mic,
  MonitorPlay,
  Play,
  RefreshCw,
  Settings,
  SlidersHorizontal,
  Sparkles,
  Volume2,
  Wifi,
  Zap,
} from "lucide-react";
import { cn } from "../utils/cn";

/* ---------- Planet logo ---------- */
export function PlanetMark({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <defs>
        <linearGradient id="tyam-g" x1="0" y1="0" x2="32" y2="32">
          <stop offset="0" stopColor="#e9d5ff" />
          <stop offset="0.45" stopColor="#a78bfa" />
          <stop offset="0.75" stopColor="#6366f1" />
          <stop offset="1" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
      <circle cx="15" cy="16" r="8" stroke="url(#tyam-g)" strokeWidth="2.6" />
      <circle cx="13" cy="14" r="2" fill="url(#tyam-g)" opacity="0.85" />
      <ellipse
        cx="16"
        cy="16"
        rx="14"
        ry="5"
        stroke="url(#tyam-g)"
        strokeWidth="1.7"
        transform="rotate(-24 16 16)"
      />
    </svg>
  );
}

type Tab = "home" | "updates" | "settings";

const changelog = [
  {
    v: "1.0.0",
    tag: "STABLE",
    date: "25 октября 2026",
    title: "Первый стабильный релиз",
    points: ["Голосовые комнаты до 200 человек", "Трансляции 1080p 60fps", "Оверлей для игр из коробки"],
  },
  {
    v: "0.9.4",
    tag: "BETA",
    date: "12 октября 2026",
    title: "Нойз-супрессия и роли",
    points: ["Шумоподавление Krisp-уровня", "Гибкие роли и права каналов", "Живые аватары профиля"],
  },
  {
    v: "0.9.0",
    tag: "BETA",
    date: "28 сентября 2026",
    title: "Новый движок голоса",
    points: ["Задержка ниже 30 мс", "Автопереподключение", "Индикаторы речи в оверлее"],
  },
];

const initialToggles = [
  { icon: Zap, name: "Автозапуск с системой", desc: "TYAM стартует вместе с Windows", on: true },
  { icon: Cpu, name: "Аппаратное ускорение", desc: "Декодирование видео на GPU", on: true },
  { icon: MonitorPlay, name: "Игровой оверлей", desc: "Ctrl + Shift + T в любой игре", on: true },
  { icon: Bell, name: "Уведомления", desc: "Упоминания и личные сообщения", on: false },
];

export default function LauncherMockup() {
  const [tab, setTab] = useState<Tab>("home");
  const [toggles, setToggles] = useState(initialToggles);
  const [progress, setProgress] = useState<number | null>(null);

  useEffect(() => {
    if (progress === null) return;
    if (progress >= 100) {
      const t = setTimeout(() => setProgress(null), 2600);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setProgress((p) => Math.min(100, (p ?? 0) + Math.random() * 16 + 6)), 160);
    return () => clearTimeout(t);
  }, [progress]);

  const flip = (i: number) =>
    setToggles((arr) => arr.map((t, k) => (k === i ? { ...t, on: !t.on } : t)));

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0a0a11] text-left shadow-[0_40px_120px_-20px_rgba(124,58,237,0.35)]">
      {/* Title bar */}
      <div className="flex h-9 items-center gap-3 border-b border-white/[0.06] bg-[#0d0d14] px-3">
        <div className="flex items-center gap-1.5">
          <PlanetMark size={16} />
          <span className="font-display text-[10px] font-800 tracking-widest text-white" style={{ fontWeight: 800 }}>
            TYAM
          </span>
          <span className="text-[8px] tracking-[0.25em] text-white/40">LAUNCHER</span>
        </div>
        <div className="hidden flex-1 text-center text-[10px] text-white/30 md:block">
          Точка входа в твою вселенную
        </div>
        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <span className="rounded border border-white/15 px-1.5 py-0.5 text-[8px] font-bold tracking-widest text-white/60">
            WEB
          </span>
          <Maximize2 className="h-3.5 w-3.5 text-white/40" />
        </div>
      </div>

      <div className="flex">
        {/* ------- Sidebar ------- */}
        <aside className="hidden w-44 shrink-0 flex-col border-r border-white/[0.06] bg-[#0b0b12] p-3 sm:flex">
          <div className="flex items-center gap-2 px-1 pb-4">
            <PlanetMark size={30} />
            <div>
              <div className="font-display text-sm font-extrabold leading-none tracking-wide">TYAM</div>
              <div className="mt-1 text-[7px] tracking-[0.35em] text-white/40">LAUNCHER</div>
            </div>
          </div>

          <div className="px-1 pb-1.5 text-[8px] font-bold tracking-[0.2em] text-white/35">
            ТВОЁ ПРОСТРАНСТВО
          </div>
          <nav className="space-y-1">
            <button
              onClick={() => setTab("home")}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[11px] font-medium transition",
                tab === "home"
                  ? "bg-violet-500/15 text-violet-200 shadow-[inset_0_0_0_1px_rgba(139,92,246,0.3)]"
                  : "text-white/55 hover:bg-white/5 hover:text-white"
              )}
            >
              <Home className="h-3.5 w-3.5" /> Главная
            </button>
            <button
              onClick={() => setTab("updates")}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[11px] font-medium transition",
                tab === "updates"
                  ? "bg-violet-500/15 text-violet-200 shadow-[inset_0_0_0_1px_rgba(139,92,246,0.3)]"
                  : "text-white/55 hover:bg-white/5 hover:text-white"
              )}
            >
              <RefreshCw className="h-3.5 w-3.5" /> Обновления
              <span className="ml-auto h-1.5 w-1.5 rounded-full bg-violet-400" />
            </button>
            <button
              onClick={() => setTab("settings")}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[11px] font-medium transition",
                tab === "settings"
                  ? "bg-violet-500/15 text-violet-200 shadow-[inset_0_0_0_1px_rgba(139,92,246,0.3)]"
                  : "text-white/55 hover:bg-white/5 hover:text-white"
              )}
            >
              <Settings className="h-3.5 w-3.5" /> Настройки
            </button>
          </nav>

          <div className="px-1 pb-1.5 pt-4 text-[8px] font-bold tracking-[0.2em] text-white/35">
            ПРИЛОЖЕНИЕ
          </div>
          <button
            onClick={() => setTab("home")}
            className="group flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.03] p-2 text-left transition hover:border-violet-400/40"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-700">
              <PlanetMark size={20} />
            </span>
            <span className="flex-1">
              <span className="block text-[11px] font-bold">TYAM</span>
              <span className="block text-[9px] text-white/40">Общение без границ</span>
            </span>
            <ArrowUpRight className="h-3.5 w-3.5 text-white/30 transition group-hover:text-violet-300" />
          </button>

          <div className="flex-1" />

          <button className="flex items-center gap-2 rounded-lg px-2 py-2 text-[11px] text-white/55 transition hover:bg-white/5 hover:text-white">
            <LifeBuoy className="h-3.5 w-3.5" /> Центр помощи
            <ArrowUpRight className="ml-auto h-3 w-3 text-white/30" />
          </button>
          <div className="mt-1 flex items-center gap-2 rounded-xl border-t border-white/[0.06] px-2 pt-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-[9px] font-black">
              ВЫ
            </span>
            <span className="flex-1">
              <span className="block text-[11px] font-bold">Вы</span>
              <span className="block text-[9px] text-white/40">Локальный профиль</span>
            </span>
            <Settings className="h-3.5 w-3.5 text-white/30" />
          </div>
        </aside>

        {/* ------- Main ------- */}
        <div className="min-w-0 flex-1 bg-[#0e0e16]">
          {/* breadcrumbs */}
          <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-2.5 text-[10px]">
            <span className="text-white/35">Лаунчер</span>
            <ChevronRight className="h-3 w-3 text-white/25" />
            <span className="font-semibold text-white/85">
              {tab === "home" ? "Главная" : tab === "updates" ? "Обновления" : "Настройки"}
            </span>
            <span className="ml-auto hidden items-center gap-1.5 text-white/45 sm:flex">
              <CircleHelp className="h-3.5 w-3.5" /> Нужна помощь?
            </span>
          </div>

          {tab === "home" && (
            <>
              {/* Hero banner */}
              <div className="relative overflow-hidden">
                <img
                  src="/images/planet.jpg"
                  alt="Планета TYAM"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#0e0e16] via-[#0e0e16]/72 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e16] via-transparent to-transparent" />
                <div className="relative px-5 py-6 sm:px-7 sm:py-8">
                  <div className="flex items-center gap-2 text-[8px] font-bold tracking-[0.3em] text-white/60">
                    <span className="h-px w-5 bg-white/50" /> МЕСТО ДЛЯ СВОИХ
                  </div>
                  <div className="mt-2 font-display text-4xl font-black tracking-tight sm:text-5xl">
                    TYAM<span className="text-violet-400">.</span>
                  </div>
                  <div className="mt-2 text-sm font-bold sm:text-base">Общение на твоей орбите.</div>
                  <p className="mt-1.5 max-w-[240px] text-[10px] leading-relaxed text-white/55 sm:text-[11px]">
                    Твои люди, разговоры и целые миры. Всё в одном пространстве.
                  </p>
                  <button
                    onClick={() => setProgress(0)}
                    className="group mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-white/85 transition hover:text-white"
                  >
                    Открой новый TYAM
                    <ChevronRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                  </button>
                </div>
              </div>

              {/* Orbit cards */}
              <div className="px-4 pt-3 sm:px-5">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-bold">На этой орбите</div>
                  <button
                    onClick={() => setTab("updates")}
                    className="flex items-center gap-1 text-[10px] text-white/45 transition hover:text-white"
                  >
                    Все обновления <ArrowUpRight className="h-3 w-3" />
                  </button>
                </div>
                <div className="mt-2 grid grid-cols-1 gap-2.5 min-[480px]:grid-cols-3">
                  <div className="flex gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5 transition hover:border-violet-400/30">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-violet-400/30 bg-gradient-to-br from-violet-600/40 to-fuchsia-600/20">
                      <Sparkles className="h-5 w-5 text-violet-300" />
                    </span>
                    <span>
                      <span className="block text-[7px] font-bold tracking-[0.18em] text-violet-300/80">ТВОЙ СТИЛЬ</span>
                      <span className="mt-0.5 block text-[10px] font-bold leading-tight">Профиль с характером</span>
                      <span className="mt-0.5 block text-[9px] leading-snug text-white/40">Украшения, эффекты и живые аватары.</span>
                    </span>
                  </div>
                  <div className="flex gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5 transition hover:border-indigo-400/30">
                    <span className="flex h-11 w-11 shrink-0 flex-col items-center justify-center gap-1 rounded-lg border border-indigo-400/30 bg-gradient-to-br from-indigo-600/40 to-blue-600/20">
                      <Hash className="h-3.5 w-3.5 text-indigo-300" />
                      <Volume2 className="h-3.5 w-3.5 text-indigo-300" />
                    </span>
                    <span>
                      <span className="block text-[7px] font-bold tracking-[0.18em] text-indigo-300/80">ТВОЁ СООБЩЕСТВО</span>
                      <span className="mt-0.5 block text-[10px] font-bold leading-tight">Сервер по твоим правилам</span>
                      <span className="mt-0.5 block text-[9px] leading-snug text-white/40">Каналы и роли для своей компании.</span>
                    </span>
                  </div>
                  <div className="flex gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5 transition hover:border-cyan-400/30">
                    <span className="flex h-11 w-11 shrink-0 items-end justify-center gap-[3px] rounded-lg border border-cyan-400/30 bg-gradient-to-br from-cyan-600/30 to-teal-600/20 pb-2.5 pt-2.5">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <span
                          key={i}
                          className="eq-bar w-[3px] rounded-full bg-cyan-300"
                          style={{ height: `${10 + (i % 3) * 6}px`, animationDelay: `${i * 0.14}s` }}
                        />
                      ))}
                    </span>
                    <span>
                      <span className="block text-[7px] font-bold tracking-[0.18em] text-cyan-300/80">ТВОЙ ГОЛОС</span>
                      <span className="mt-0.5 block text-[10px] font-bold leading-tight">Ближе, чем кажется</span>
                      <span className="mt-0.5 block text-[9px] leading-snug text-white/40">Голосовые комнаты, камера и экран.</span>
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}

          {tab === "updates" && (
            <div className="space-y-2.5 px-4 py-4 sm:px-5">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-3.5 w-3.5 text-violet-300" />
                <div className="text-[11px] font-bold">Журнал обновлений</div>
                <span className="ml-auto rounded-full bg-emerald-400/10 px-2 py-0.5 text-[9px] font-bold text-emerald-300">
                  У вас последняя версия
                </span>
              </div>
              {changelog.map((c) => (
                <div key={c.v} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black">v{c.v}</span>
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 text-[8px] font-bold tracking-widest",
                        c.tag === "STABLE"
                          ? "bg-violet-500/20 text-violet-200"
                          : "bg-cyan-500/15 text-cyan-200"
                      )}
                    >
                      {c.tag}
                    </span>
                    <span className="ml-auto text-[9px] text-white/35">{c.date}</span>
                  </div>
                  <div className="mt-1 text-[11px] font-bold">{c.title}</div>
                  <ul className="mt-1.5 space-y-1">
                    {c.points.map((p) => (
                      <li key={p} className="flex items-center gap-1.5 text-[10px] text-white/55">
                        <Check className="h-3 w-3 text-emerald-400" /> {p}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {tab === "settings" && (
            <div className="space-y-2 px-4 py-4 sm:px-5">
              <div className="flex items-center gap-2 pb-1">
                <SlidersHorizontal className="h-3.5 w-3.5 text-violet-300" />
                <div className="text-[11px] font-bold">Настройки лаунчера</div>
              </div>
              {toggles.map((t, i) => (
                <button
                  key={t.name}
                  onClick={() => flip(i)}
                  className="flex w-full items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5 text-left transition hover:border-violet-400/25"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/15">
                    <t.icon className="h-4 w-4 text-violet-300" />
                  </span>
                  <span className="flex-1">
                    <span className="block text-[10px] font-bold">{t.name}</span>
                    <span className="block text-[9px] text-white/40">{t.desc}</span>
                  </span>
                  <span
                    className={cn(
                      "relative h-5 w-9 shrink-0 rounded-full transition",
                      t.on ? "bg-gradient-to-r from-violet-500 to-indigo-500" : "bg-white/10"
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all",
                        t.on ? "left-[18px]" : "left-0.5"
                      )}
                    />
                  </span>
                </button>
              ))}
              <div className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5">
                <Mic className="h-4 w-4 text-violet-300" />
                <span className="text-[10px] font-bold">Микрофон</span>
                <span className="ml-auto flex items-center gap-1 text-[9px] text-white/40">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Default — работает
                </span>
              </div>
            </div>
          )}

          {/* Launch bar */}
          <div className="border-t border-white/[0.06] bg-[#0b0b12] px-4 py-3 sm:px-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700">
                  <PlanetMark size={26} />
                </span>
                <span>
                  <span className="flex items-center gap-1.5">
                    <span className="text-[12px] font-black tracking-wide">TYAM</span>
                    <span className="rounded border border-white/15 px-1 py-px text-[7px] font-bold tracking-widest text-white/50">
                      STABLE
                    </span>
                  </span>
                  <span className="mt-0.5 flex items-center gap-1 text-[10px] text-white/60">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    {progress === null ? "Всё готово к запуску" : progress >= 100 ? "TYAM запущен. Приятного общения!" : "Подключение к орбите…"}
                  </span>
                  <span className="text-[9px] text-white/35">Версия 1.0.0 · Web-приложение</span>
                </span>
              </div>
              <div className="flex items-center gap-2 sm:ml-auto">
                <button
                  onClick={() => setTab("settings")}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-white/60 transition hover:border-violet-400/40 hover:text-white"
                  aria-label="Настройки запуска"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                </button>
                <button
                  onClick={() => progress === null && setProgress(0)}
                  className="group relative flex h-10 flex-1 items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 px-5 text-[11px] font-black tracking-wide shadow-[0_8px_30px_-6px_rgba(139,92,246,0.6)] transition hover:brightness-110 sm:flex-none sm:px-6"
                >
                  {progress !== null && progress < 100 && (
                    <span
                      className="absolute inset-y-0 left-0 bg-white/20 transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  )}
                  {progress !== null && progress >= 100 ? (
                    <>
                      <BadgeCheck className="relative h-4 w-4" /> НА ОРБИТЕ
                    </>
                  ) : (
                    <>
                      <Play className="relative h-3.5 w-3.5 fill-current" />
                      <span className="relative">
                        {progress === null ? "Запустить TYAM" : `${Math.round(progress)}%`}
                      </span>
                    </>
                  )}
                  <ArrowUpRight className="relative h-3.5 w-3.5 opacity-70" />
                </button>
              </div>
            </div>
            <div className="mt-2.5 flex items-center justify-between text-[9px] text-white/35">
              <button
                onClick={() => setTab("updates")}
                className="flex items-center gap-1 transition hover:text-white"
              >
                <RefreshCw className="h-3 w-3" /> Проверить обновления
              </button>
              <span className="hidden items-center gap-1.5 sm:flex">
                Быстрый запуск
                <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-sans">Ctrl</kbd>+
                <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-sans">Enter</kbd>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Status footer */}
      <div className="flex items-center gap-2 border-t border-white/[0.06] bg-[#0d0d14] px-3 py-1.5 text-[9px] text-white/35">
        <span className="flex items-center gap-1 text-emerald-300/90">
          <Wifi className="h-3 w-3" /> Сеть доступна
        </span>
        <span className="mx-auto hidden sm:block">Твоё пространство. Твои правила.</span>
        <span className="ml-auto flex items-center gap-1 sm:ml-0">
          <Download className="h-3 w-3" /> TYAM Launcher 1.0.0
        </span>
      </div>
    </div>
  );
}
