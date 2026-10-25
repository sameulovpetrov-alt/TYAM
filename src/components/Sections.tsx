import { useState } from "react";
import {
  ArrowUpRight,
  Bell,
  Check,
  ChevronDown,
  Download,
  Globe,
  Hash,
  Mic,
  MonitorDown,
  MonitorPlay,
  Palette,
  Play,
  ShieldCheck,
  Sparkles,
  Users,
  Volume2,
  Zap,
} from "lucide-react";
import { cn } from "../utils/cn";
import { PlanetMark } from "./LauncherMockup";

/* ================= ПОЧЕМУ TYAM ================= */
const whyCards = [
  {
    icon: Play,
    badge: "1080p · 60fps",
    title: "Крутое качество",
    desc: "Трансляции в 1080p 60fps и голос в HD. Без артефактов, лагов и «роботов» в канале.",
    accent: "from-violet-500 to-fuchsia-500",
    glow: "rgba(168,85,247,0.35)",
  },
  {
    icon: Volume2,
    badge: "< 30 мс",
    title: "Стабильно работает",
    desc: "Собственный голосовой движок и серверы рядом с тобой. Пинг низкий в любой момент.",
    accent: "from-indigo-500 to-blue-500",
    glow: "rgba(99,102,241,0.35)",
  },
  {
    icon: Globe,
    badge: "0 ₽ · Без VPN",
    title: "Бесплатно и без VPN",
    desc: "Работает в России напрямую, без танцев с бубном. Скачивай — и сразу на орбиту.",
    accent: "from-cyan-400 to-teal-400",
    glow: "rgba(34,211,238,0.3)",
  },
];

export function WhyTyam() {
  return (
    <section id="why" className="relative mx-auto max-w-5xl px-4 pt-20 sm:px-6">
      <h2 className="reveal text-center font-display text-2xl font-black tracking-tight sm:text-4xl">
        ПОЧЕМУ <span className="text-tyam-gradient-static">TYAM?</span>
      </h2>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {whyCards.map((c, i) => (
          <div
            key={c.title}
            className={cn(
              "reveal group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0b0b11] p-5 transition duration-300 hover:-translate-y-1 hover:border-white/20",
              i === 1 && "reveal-delay-1",
              i === 2 && "reveal-delay-2"
            )}
          >
            <div
              className="pointer-events-none absolute -top-16 left-1/2 h-40 w-56 -translate-x-1/2 rounded-full opacity-0 blur-3xl transition duration-500 group-hover:opacity-100"
              style={{ background: c.glow }}
            />
            <div className="relative flex h-32 items-center justify-center overflow-hidden rounded-xl border border-white/[0.06] bg-gradient-to-b from-white/[0.05] to-transparent">
              <div className={cn("absolute inset-0 opacity-[0.12] bg-gradient-to-br", c.accent)} />
              <div className={cn("flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br shadow-lg", c.accent)}>
                <c.icon className="h-7 w-7 text-white" />
              </div>
              <span className="absolute right-2 top-2 rounded-md border border-white/15 bg-black/50 px-2 py-1 text-[10px] font-bold text-white/90 backdrop-blur">
                {c.badge}
              </span>
            </div>
            <h3 className="relative mt-4 text-sm font-extrabold leading-snug">{c.title}</h3>
            <p className="relative mt-1.5 text-xs leading-relaxed text-white/50">{c.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ================= MARQUEE ================= */
const marqueeItems = [
  "Голосовые комнаты",
  "Стримы 1080p60",
  "Без VPN",
  "Серверы и роли",
  "Живые аватары",
  "Игровой оверлей",
  "Шумоподавление",
  "100% бесплатно",
];

export function Marquee() {
  const row = [...marqueeItems, ...marqueeItems];
  return (
    <div className="relative mt-16 overflow-hidden border-y border-white/[0.06] bg-white/[0.015] py-4">
      <div className="animate-marquee flex w-max items-center gap-8 pr-8">
        {row.map((item, i) => (
          <span key={i} className="flex items-center gap-8 text-xs font-bold tracking-[0.2em] text-white/40">
            {item.toUpperCase()}
            <PlanetMark size={16} />
          </span>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#050508] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#050508] to-transparent" />
    </div>
  );
}

/* ================= FEATURES ================= */
const features = [
  { icon: Mic, title: "Голос без задержек", desc: "Движок с задержкой ниже 30 мс. Слышно каждый вздох тиммейта." },
  { icon: MonitorPlay, title: "Трансляции экрана", desc: "Шарь экран и стримь катку в 1080p 60fps одним кликом." },
  { icon: Users, title: "Серверы для своих", desc: "Каналы, роли и права. От лампового чата до киберспорт-клуба." },
  { icon: Palette, title: "Профиль с характером", desc: "Баннеры, эффекты, живые аватары и кастомные статусы." },
  { icon: ShieldCheck, title: "Приватность", desc: "Сквозное шифрование личек и никакого сбора лишнего." },
  { icon: Zap, title: "Игровой оверлей", desc: "Кто говорит, прямо в игре. Ctrl + Shift + T — и всё видно." },
];

export function Features() {
  return (
    <section id="features" className="mx-auto max-w-5xl px-4 pt-20 sm:px-6">
      <div className="reveal flex items-center gap-2 text-[11px] font-bold tracking-[0.3em] text-violet-300/80">
        <Sparkles className="h-4 w-4" /> ВОЗМОЖНОСТИ
      </div>
      <h2 className="reveal mt-3 font-display text-2xl font-black tracking-tight sm:text-4xl">
        Всё для общения — <span className="text-tyam-gradient-static">на одной орбите</span>
      </h2>
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f, i) => (
          <div
            key={f.title}
            className={cn(
              "reveal group rounded-2xl border border-white/[0.07] bg-[#0b0b11] p-5 transition hover:border-violet-400/30 hover:bg-[#0e0e16]",
              i % 3 === 1 && "reveal-delay-1",
              i % 3 === 2 && "reveal-delay-2"
            )}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-400/25 bg-gradient-to-br from-violet-600/30 to-indigo-600/10 transition group-hover:from-violet-500/50">
              <f.icon className="h-5 w-5 text-violet-300" />
            </div>
            <h3 className="mt-3 text-sm font-extrabold">{f.title}</h3>
            <p className="mt-1 text-xs leading-relaxed text-white/50">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* stats */}
      <div className="reveal mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["60 FPS", "стримы без просадок"],
          ["< 30 мс", "задержка голоса"],
          ["200", "человек в комнате"],
          ["0 ₽", "навсегда бесплатно"],
        ].map(([n, l]) => (
          <div key={l} className="rounded-2xl border border-white/[0.07] bg-gradient-to-b from-violet-500/[0.08] to-transparent p-4 text-center">
            <div className="font-display text-xl font-black text-tyam-gradient-static sm:text-2xl">{n}</div>
            <div className="mt-1 text-[11px] text-white/45">{l}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ================= ROADMAP ================= */
const roadmap = [
  { q: "Q4 2026", status: "Готово", done: true, title: "Стабильный релиз 1.0", desc: "Голос, стримы, серверы, оверлей и лаунчер для Windows." },
  { q: "Q1 2027", status: "В работе", done: false, title: "Мобильные приложения", desc: "iOS и Android с полным голосом и пушами без задержек." },
  { q: "Q2 2027", status: "Скоро", done: false, title: "Клипы и сообщество", desc: "Запись моментов из стримов, лента серверов и боты." },
  { q: "Q3 2027", status: "Скоро", done: false, title: "TYAM Nitro-орбита", desc: "Кастомные эмодзи, анимированные баннеры и 4K-стримы." },
];

export function Roadmap() {
  return (
    <section id="roadmap" className="mx-auto max-w-5xl px-4 pt-20 sm:px-6">
      <div className="reveal flex items-center gap-2 text-[11px] font-bold tracking-[0.3em] text-violet-300/80">
        <Hash className="h-4 w-4" /> ДОРОЖНАЯ КАРТА
      </div>
      <h2 className="reveal mt-3 font-display text-2xl font-black tracking-tight sm:text-4xl">
        Куда летит <span className="text-tyam-gradient-static">TYAM</span>
      </h2>
      <div className="relative mt-8 space-y-3">
        <div className="absolute bottom-4 left-[19px] top-4 w-px bg-gradient-to-b from-violet-400/60 via-indigo-400/20 to-transparent" />
        {roadmap.map((r, i) => (
          <div
            key={r.q}
            className={cn(
              "reveal relative flex gap-4 rounded-2xl border border-white/[0.07] bg-[#0b0b11] p-4 transition hover:border-violet-400/25 sm:items-center sm:p-5",
              i === 1 && "reveal-delay-1",
              i === 2 && "reveal-delay-2"
            )}
          >
            <span
              className={cn(
                "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border",
                r.done
                  ? "border-violet-400/50 bg-gradient-to-br from-violet-500 to-indigo-600"
                  : "border-white/15 bg-[#14141c]"
              )}
            >
              {r.done ? <Check className="h-4 w-4" /> : <Bell className="h-4 w-4 text-white/40" />}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-black tracking-widest text-violet-300">{r.q}</span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-bold",
                    r.done
                      ? "bg-emerald-400/10 text-emerald-300"
                      : r.status === "В работе"
                        ? "bg-violet-500/15 text-violet-200"
                        : "bg-white/[0.06] text-white/50"
                  )}
                >
                  {r.status}
                </span>
              </div>
              <h3 className="mt-1 text-sm font-extrabold">{r.title}</h3>
              <p className="mt-0.5 text-xs text-white/50">{r.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ================= FAQ ================= */
const faq = [
  { q: "TYAM правда бесплатный?", a: "Да, полностью. Голос, стримы, серверы и оверлей — бесплатно и без VPN. Позже появится добровольная подписка с косметикой, но база навсегда останется бесплатной." },
  { q: "Нужен ли VPN для работы в России?", a: "Нет. TYAM работает напрямую: у нас свои серверы и маршрутизация, поэтому всё летает без VPN, прокси и танцев с бубном." },
  { q: "Сколько человек помещается в голосовой?", a: "До 200 человек в одной комнате с адаптивным качеством. Для стримов катки или лекции — то, что надо." },
  { q: "Есть ли оверлей для игр?", a: "Да! Нажми Ctrl + Shift + T в любой игре — увидишь, кто говорит, сможешь замутить микрофон и переключать каналы, не сворачиваясь." },
  { q: "На каких платформах работает TYAM?", a: "Сейчас — Windows и Web-версия прямо в браузере. В начале 2027 выходят macOS, Linux, iOS и Android." },
  { q: "Чем TYAM отличается от Discord?", a: "Стабильной работой без VPN, пингом ниже 30 мс на локальных серверах, стримами 1080p60 бесплатно и интерфейсом полностью на русском." },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="mx-auto max-w-3xl px-4 pt-20 sm:px-6">
      <h2 className="reveal text-center font-display text-2xl font-black tracking-tight sm:text-4xl">
        Частые <span className="text-tyam-gradient-static">вопросы</span>
      </h2>
      <div className="mt-8 space-y-2.5">
        {faq.map((f, i) => {
          const isOpen = open === i;
          return (
            <div
              key={f.q}
              className={cn(
                "reveal overflow-hidden rounded-2xl border transition",
                isOpen ? "border-violet-400/30 bg-[#0e0e17]" : "border-white/[0.07] bg-[#0b0b11] hover:border-white/15"
              )}
            >
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center gap-3 p-4 text-left"
              >
                <span className="flex-1 text-sm font-bold">{f.q}</span>
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition",
                    isOpen ? "rotate-180 border-violet-400/40 bg-violet-500/15" : "border-white/10"
                  )}
                >
                  <ChevronDown className="h-4 w-4" />
                </span>
              </button>
              <div
                className={cn(
                  "grid transition-all duration-300",
                  isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                )}
              >
                <div className="overflow-hidden">
                  <p className="px-4 pb-4 text-xs leading-relaxed text-white/55">{f.a}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ================= DOWNLOAD ================= */
export function DownloadSection() {
  const [toast, setToast] = useState<string | null>(null);
  const dl = (os: string) => {
    setToast(`TYAM для ${os} — загрузка началась`);
    setTimeout(() => setToast(null), 2600);
  };
  return (
    <section id="download" className="mx-auto max-w-5xl px-4 pt-20 sm:px-6">
      <div className="reveal relative overflow-hidden rounded-3xl border border-violet-400/20 bg-gradient-to-b from-violet-600/[0.14] via-[#0c0c14] to-[#0c0c14] p-8 text-center sm:p-12">
        <div className="dot-grid absolute inset-0 opacity-40" />
        <div className="absolute -top-24 left-1/2 h-64 w-[36rem] max-w-full -translate-x-1/2 rounded-full bg-violet-600/25 blur-[100px]" />
        <div className="relative">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-400/30 bg-gradient-to-br from-violet-600/40 to-indigo-600/20 shadow-[0_0_60px_-10px_rgba(139,92,246,0.7)]">
            <PlanetMark size={40} />
          </div>
          <h2 className="mx-auto mt-5 max-w-xl font-display text-2xl font-black leading-tight tracking-tight sm:text-4xl">
            Забери TYAM <span className="text-tyam-gradient">на свою орбиту</span>
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-white/55">
            Бесплатно, без VPN и за пару минут. Твои друзья уже в голосовом — догоняй.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-2.5 sm:flex-row">
            <button
              onClick={() => dl("Windows")}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 px-6 py-3.5 text-sm font-extrabold shadow-[0_12px_40px_-8px_rgba(139,92,246,0.7)] transition hover:brightness-110 sm:w-auto"
            >
              <MonitorDown className="h-4 w-4" /> Скачать для Windows
            </button>
            <button
              onClick={() => dl("Web")}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-6 py-3.5 text-sm font-bold transition hover:border-violet-400/40 hover:bg-white/[0.07] sm:w-auto"
            >
              <Globe className="h-4 w-4" /> Открыть Web-версию
            </button>
          </div>
          <div className="mt-4 flex items-center justify-center gap-4 text-[11px] text-white/40">
            <button onClick={() => dl("macOS")} className="transition hover:text-white">macOS</button>
            <span className="h-1 w-1 rounded-full bg-white/20" />
            <button onClick={() => dl("Linux")} className="transition hover:text-white">Linux</button>
            <span className="h-1 w-1 rounded-full bg-white/20" />
            <span>Android и iOS — скоро</span>
          </div>
          {toast && (
            <div className="absolute left-1/2 top-0 flex -translate-x-1/2 -translate-y-2 items-center gap-2 whitespace-nowrap rounded-full border border-emerald-400/30 bg-[#0a1410]/95 px-4 py-2 text-xs font-bold text-emerald-300 shadow-xl backdrop-blur">
              <Download className="h-3.5 w-3.5" /> {toast}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* ================= FOOTER ================= */
export function Footer() {
  return (
    <footer className="mt-20 border-t border-white/[0.06] bg-[#07070b]">
      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-12 sm:grid-cols-[1.4fr_1fr_1fr_1fr] sm:px-6">
        <div>
          <div className="flex items-center gap-2">
            <PlanetMark size={28} />
            <div>
              <div className="font-display text-base font-extrabold tracking-wide">TYAM</div>
              <div className="text-[8px] tracking-[0.35em] text-white/40">LAUNCHER</div>
            </div>
          </div>
          <p className="mt-3 max-w-xs text-xs leading-relaxed text-white/45">
            Платформа для общения в реальном времени. Твои люди, разговоры и целые миры — на одной орбите.
          </p>
        </div>
        <div>
          <div className="text-[11px] font-bold tracking-widest text-white/40">ПРОДУКТ</div>
          <ul className="mt-3 space-y-2 text-xs text-white/60">
            <li><a href="#download" className="transition hover:text-white">Скачать</a></li>
            <li><a href="#features" className="transition hover:text-white">Возможности</a></li>
            <li><a href="#roadmap" className="transition hover:text-white">Дорожная карта</a></li>
            <li><a href="#faq" className="transition hover:text-white">Вопросы</a></li>
          </ul>
        </div>
        <div>
          <div className="text-[11px] font-bold tracking-widest text-white/40">СООБЩЕСТВО</div>
          <ul className="mt-3 space-y-2 text-xs text-white/60">
            <li><a href="#" className="flex items-center gap-1 transition hover:text-white">Сервер TYAM <ArrowUpRight className="h-3 w-3" /></a></li>
            <li><a href="#" className="flex items-center gap-1 transition hover:text-white">Telegram <ArrowUpRight className="h-3 w-3" /></a></li>
            <li><a href="#" className="flex items-center gap-1 transition hover:text-white">Центр помощи <ArrowUpRight className="h-3 w-3" /></a></li>
          </ul>
        </div>
        <div>
          <div className="text-[11px] font-bold tracking-widest text-white/40">СТАТУС</div>
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] px-3 py-2.5 text-xs font-bold text-emerald-300">
            <span className="relative flex h-2 w-2">
              <span className="absolute h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            Все системы в норме
          </div>
        </div>
      </div>
      <div className="border-t border-white/[0.06]">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-2 px-4 py-5 text-[11px] text-white/35 sm:flex-row sm:px-6">
          <span>© 2026 TYAM. Твоё пространство. Твои правила.</span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-400" /> TYAM Launcher 1.0.0 · Stable
          </span>
        </div>
      </div>
    </footer>
  );
}
