import { useEffect, useState } from "react";
import { Download, Globe, Menu, MonitorDown, X } from "lucide-react";
import LauncherMockup, { PlanetMark } from "./components/LauncherMockup";
import { DownloadSection, Faq, Features, Footer, Marquee, Roadmap, WhyTyam } from "./components/Sections";
import { cn } from "./utils/cn";

/* ---------- Scroll reveal ---------- */
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("visible")),
      { threshold: 0.12 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

/* ---------- Header ---------- */
function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const links = [
    ["Дорожная карта", "#roadmap"],
    ["Возможности", "#features"],
    ["Вопросы", "#faq"],
    ["Скачать", "#download"],
  ] as const;

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled ? "border-b border-white/[0.07] bg-[#050508]/85 backdrop-blur-xl" : "bg-transparent"
      )}
    >
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-4 sm:px-6">
        <a href="#top" className="flex items-center gap-2">
          <PlanetMark size={26} />
          <span className="font-display text-sm font-extrabold tracking-widest">TYAM</span>
        </a>
        <nav className="ml-6 hidden items-center gap-5 md:flex">
          {links.map(([label, href]) => (
            <a
              key={href}
              href={href}
              className="text-[11px] font-bold tracking-wide text-white/60 transition hover:text-white"
            >
              {label}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <a
            href="#download"
            className="hidden items-center gap-1.5 rounded-lg border border-white/12 px-3 py-1.5 text-[11px] font-bold text-white/70 transition hover:border-violet-400/40 hover:text-white sm:flex"
          >
            <Globe className="h-3.5 w-3.5" /> WEB
          </a>
          <a
            href="#download"
            className="hidden items-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-500 to-indigo-500 px-3.5 py-1.5 text-[11px] font-extrabold shadow-[0_6px_24px_-6px_rgba(139,92,246,0.7)] transition hover:brightness-110 sm:flex"
          >
            <Download className="h-3.5 w-3.5" /> Скачать
          </a>
          <button
            onClick={() => setOpen(!open)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 md:hidden"
            aria-label="Меню"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="border-t border-white/[0.07] bg-[#050508]/95 px-4 py-3 backdrop-blur-xl md:hidden">
          {links.map(([label, href]) => (
            <a
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-2 py-2.5 text-sm font-bold text-white/70 transition hover:bg-white/5 hover:text-white"
            >
              {label}
            </a>
          ))}
        </div>
      )}
    </header>
  );
}

/* ---------- Hero ---------- */
function Hero() {
  return (
    <section id="top" className="relative overflow-hidden pt-28 sm:pt-32">
      <div className="dot-grid-fade absolute inset-0" />
      <div className="absolute left-1/2 top-10 h-72 w-[42rem] max-w-[90vw] -translate-x-1/2 rounded-full bg-violet-700/20 blur-[120px]" />
      <div className="absolute left-[8%] top-64 h-40 w-40 rounded-full bg-cyan-500/10 blur-[80px]" />
      <div className="absolute right-[8%] top-64 h-40 w-40 rounded-full bg-fuchsia-500/10 blur-[80px]" />

      <div className="relative mx-auto max-w-5xl px-4 text-center sm:px-6">
        {/* badges */}
        <div className="reveal visible flex items-center justify-center gap-2">
          <span className="rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1 text-[10px] font-bold tracking-widest text-violet-200">
            STABLE 1.0.0
          </span>
          <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-[10px] font-bold tracking-widest text-emerald-200">
            БЕЗ VPN
          </span>
        </div>

        {/* Giant gradient TYAM */}
        <div className="relative mt-2 select-none">
          <svg
            className="animate-spin-slow pointer-events-none absolute left-1/2 top-1/2 -z-0 h-[130%] w-[112%] max-w-none -translate-x-1/2 -translate-y-1/2 opacity-30"
            viewBox="0 0 600 200"
            fill="none"
          >
            <defs>
              <linearGradient id="orbit-g" x1="0" y1="0" x2="600" y2="200">
                <stop offset="0" stopColor="#a78bfa" />
                <stop offset="0.5" stopColor="#6366f1" />
                <stop offset="1" stopColor="#22d3ee" />
              </linearGradient>
            </defs>
            <ellipse
              cx="300"
              cy="100"
              rx="285"
              ry="70"
              stroke="url(#orbit-g)"
              strokeWidth="1.5"
              strokeDasharray="10 8"
              style={{ animation: "orbit-dash 12s linear infinite" }}
            />
          </svg>

          <h1
            className="text-tyam-gradient relative z-10 font-display font-black leading-[0.95] tracking-tight"
            style={{ fontSize: "clamp(4.2rem, 17vw, 11.5rem)", filter: "drop-shadow(0 10px 60px rgba(139,92,246,0.35))" }}
          >
            TYAM
          </h1>

          {/* floating planet */}
          <div className="animate-float absolute -right-1 top-2 z-20 hidden sm:block lg:right-10">
            <PlanetMark size={54} />
          </div>
          <div className="animate-float absolute -left-1 bottom-4 z-20 hidden sm:block lg:left-10" style={{ animationDelay: "-3s" }}>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-300/30 bg-cyan-400/10 text-lg shadow-[0_0_30px_-5px_rgba(34,211,238,0.6)] backdrop-blur">
              ✦
            </div>
          </div>
        </div>

        {/* sub row like reference */}
        <div className="mx-auto mt-6 flex max-w-3xl flex-col items-center justify-between gap-4 sm:flex-row sm:text-left">
          <p className="max-w-md text-xs leading-relaxed text-white/60 sm:text-[13px]">
            Платформа для общения в реальном времени.
            <br />
            Трансляции и голосовые комнаты для игр, учёбы, работы и отдыха.
          </p>
          <a
            href="#download"
            className="group flex shrink-0 items-center gap-2 rounded-lg bg-gradient-to-r from-violet-500 via-indigo-500 to-violet-500 bg-[length:200%_auto] px-6 py-3 text-xs font-extrabold shadow-[0_10px_36px_-8px_rgba(139,92,246,0.8)] transition hover:bg-right"
          >
            <MonitorDown className="h-4 w-4 transition group-hover:translate-y-0.5" />
            Скачать бесплатно
          </a>
        </div>
      </div>
    </section>
  );
}

/* ---------- Preview panel with tab ---------- */
function PreviewPanel() {
  return (
    <section className="relative mx-auto mt-12 max-w-5xl px-4 sm:px-6">
      <div className="reveal relative">
        {/* glow */}
        <div className="absolute -inset-x-4 top-10 bottom-0 rounded-[2rem] bg-gradient-to-b from-violet-600/20 via-indigo-600/10 to-transparent blur-2xl" />

        {/* tab */}
        <div className="relative z-10 mx-auto h-5 w-44 sm:w-56">
          <div className="panel-tab h-full bg-[#16161e]" />
        </div>

        {/* panel */}
        <div className="relative z-0 -mt-px rounded-2xl border border-white/[0.08] bg-[#14141b] p-2.5 shadow-[0_50px_140px_-30px_rgba(0,0,0,0.9)] sm:rounded-3xl sm:p-4">
          <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-b from-white/[0.05] to-transparent" />
          <LauncherMockup />

          {/* floating chips */}
          <div className="animate-float absolute -left-2 top-1/3 hidden rounded-xl border border-white/10 bg-[#0b0b12]/90 px-3 py-2 text-[10px] font-bold shadow-xl backdrop-blur lg:block">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> 12 480 на орбите
            </span>
          </div>
          <div
            className="animate-float absolute -right-2 top-1/4 hidden rounded-xl border border-white/10 bg-[#0b0b12]/90 px-3 py-2 text-[10px] font-bold shadow-xl backdrop-blur lg:block"
            style={{ animationDelay: "-2.5s" }}
          >
            <span className="text-tyam-gradient-static font-display">1080p · 60fps</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- App ---------- */
export default function App() {
  useReveal();
  return (
    <div className="min-h-screen bg-[#050508] text-white antialiased">
      <Header />
      <main>
        <Hero />
        <PreviewPanel />
        <WhyTyam />
        <Marquee />
        <Features />
        <Roadmap />
        <Faq />
        <DownloadSection />
      </main>
      <Footer />
    </div>
  );
}
