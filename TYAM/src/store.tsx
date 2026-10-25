import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Status } from "./data";
import type { AvatarCrop } from "./utils/avatar";

/* ─────────────────────────── акценты ─────────────────────────── */
export type AccentId = "max" | "emerald" | "amber" | "rose";

export interface Accent {
  id: AccentId;
  name: string;
  a1: string;
  a2: string;
  a3: string;
  c300: string;
  c400: string;
  c500: string;
  c600: string;
}

export const ACCENTS: Accent[] = [
  { id: "max", name: "TYAM", a1: "#2e7cf6", a2: "#5b6cf9", a3: "#8a5cf6", c300: "#7db4ff", c400: "#4d94ff", c500: "#2e7cf6", c600: "#1f66e0" },
  { id: "emerald", name: "Изумруд", a1: "#0fb98a", a2: "#12a3a3", a3: "#2bb3c9", c300: "#6fe3c2", c400: "#3ad0a8", c500: "#0fb98a", c600: "#0a9470" },
  { id: "amber", name: "Янтарь", a1: "#f5a524", a2: "#f4713a", a3: "#ef4d6b", c300: "#ffd08a", c400: "#ffb454", c500: "#f5a524", c600: "#d1841a" },
  { id: "rose", name: "Закат", a1: "#f04770", a2: "#e0509c", a3: "#b44cf0", c300: "#ffa8c4", c400: "#ff7ba6", c500: "#f04770", c600: "#cc3560" },
];

/* ─────────────────────────── темы ─────────────────────────── */
export type ThemeId = "night" | "deep" | "violet" | "light";

export interface Theme {
  id: ThemeId;
  name: string;
  desc: string;
  swatch: string;
  vars: Record<string, string>;
}

export const THEMES: Theme[] = [
  {
    id: "night",
    name: "TYAM Ночь",
    desc: "Фирменная синяя тема TYAM",
    swatch: "linear-gradient(135deg,#060a14,#111a30,#2e7cf6)",
    vars: {},
  },
  {
    id: "deep",
    name: "Глубокий космос",
    desc: "Максимальный контраст",
    swatch: "linear-gradient(135deg,#000206,#070c16,#1b2846)",
    vars: {
      "--color-ink-950": "#000206",
      "--color-ink-900": "#04070f",
      "--color-ink-850": "#070c16",
      "--color-ink-800": "#0a1120",
      "--color-ink-750": "#0e1729",
      "--color-ink-700": "#141f36",
      "--color-ink-600": "#1d2a48",
      "--color-ink-500": "#2c3d63",
    },
  },
  {
    id: "violet",
    name: "Полуночный фиолет",
    desc: "Фиолетовый оттенок поверхностей",
    swatch: "linear-gradient(135deg,#0a0616,#161032,#8a5cf6)",
    vars: {
      "--color-ink-950": "#07040f",
      "--color-ink-900": "#0d0820",
      "--color-ink-850": "#110b28",
      "--color-ink-800": "#150e31",
      "--color-ink-750": "#1b1340",
      "--color-ink-700": "#241a52",
      "--color-ink-600": "#31246b",
      "--color-ink-500": "#42318a",
      "--color-fog-500": "#7d74a6",
    },
  },
  {
    id: "light",
    name: "Дневной свет",
    desc: "Светлая тема TYAM",
    swatch: "linear-gradient(135deg,#ffffff,#eef1f8,#2e7cf6)",
    vars: {
      "--color-ink-950": "#dfe3ec",
      "--color-ink-900": "#eceef4",
      "--color-ink-850": "#f2f4f9",
      "--color-ink-800": "#ffffff",
      "--color-ink-750": "#f7f8fc",
      "--color-ink-700": "#e8ebf3",
      "--color-ink-600": "#d8dcea",
      "--color-ink-500": "#bfc6da",
      "--color-fog-100": "#141b2b",
      "--color-fog-300": "#38415a",
      "--color-fog-400": "#5a6584",
      "--color-fog-500": "#7c87a6",
    },
  },
];

/* ─────────────────────────── бусты ─────────────────────────── */
export const LEVEL_THRESHOLDS = [0, 2, 7, 14];

export function boostLevel(count: number) {
  if (count >= LEVEL_THRESHOLDS[3]) return 3;
  if (count >= LEVEL_THRESHOLDS[2]) return 2;
  if (count >= LEVEL_THRESHOLDS[1]) return 1;
  return 0;
}

export interface BoostRecord {
  userId: string;
  date: string;
}

export interface BoostEvent {
  id: string;
  kind: "boost" | "level" | "purchase";
  text: string;
  at: number;
  userId?: string;
  level?: number;
}

export interface BoostInfo {
  count: number;
  boosters: BoostRecord[];
  events?: BoostEvent[];
}

/** Человекочитаемое «сколько назад» для ленты бустов */
export function agoLabel(at: number, now = Date.now()): string {
  const diff = Math.max(0, now - at);
  const min = Math.floor(diff / 60000);
  if (min < 1) return "только что";
  if (min < 60) return `${min} мин назад`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `${hours} ч назад`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} дн назад`;
  const d = new Date(at);
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

/* ─────────────────────────── настройки ─────────────────────────── */
export interface Settings {
  theme: ThemeId;
  accent: AccentId;
  density: "cozy" | "compact";
  msgSize: number;
  animations: boolean;
  status: Status;
  displayName: string;
  username: string;
  aboutMe: string;
  voice: {
    device: string;
    outputDevice: string;
    cameraDevice: string;
    volume: number;
    sensitivity: number;
    noise: boolean;
    echo: boolean;
    autoGain: boolean;
    hardware: boolean;
    inputMode: "activity" | "push";
    attenuation: number;
    lowerOthers: boolean;
  };
  privacy: {
    dmFromEveryone: boolean;
    showActivity: boolean;
    friendRequests: boolean;
    analytics: boolean;
  };
  language: string;
  premium: boolean;
  premiumTag: boolean;
  boostCredits: number;
  avatarUrl: string | null;
  avatarSource: string | null;
  avatarCrop: AvatarCrop | null;
  bannerUrl: string | null;
  bannerIndex: number;
  owned: string[];
  equipped: { avatar: string | null; decoration: string | null; effect: string | null; frame: string | null };
  /** градиентный никнейм из двух цветов — привилегия 2 уровня буста сервера */
  nick: { enabled: boolean; c1: string; c2: string };
}

const DEFAULTS: Settings = {
  theme: "night",
  accent: "max",
  density: "cozy",
  msgSize: 15,
  animations: true,
  status: "online",
  displayName: "Вы",
  username: "you_tyam",
  aboutMe: "на волне TYAM 💙",
  voice: {
    device: "default",
    outputDevice: "default",
    cameraDevice: "default",
    volume: 80,
    sensitivity: -40,
    noise: true,
    echo: true,
    autoGain: true,
    hardware: false,
    inputMode: "activity",
    attenuation: 0,
    lowerOthers: false,
  },
  privacy: { dmFromEveryone: true, showActivity: true, friendRequests: true, analytics: false },
  language: "Русский",
  premium: true,
  premiumTag: true,
  boostCredits: 3,
  avatarUrl: null,
  avatarSource: null,
  avatarCrop: null,
  bannerUrl: null,
  bannerIndex: 0,
  owned: [],
  equipped: { avatar: null, decoration: null, effect: null, frame: null },
  nick: { enabled: true, c1: "#4d94ff", c2: "#c084fc" },
};

/* ─────────────────────────── недавние эмодзи ─────────────────────────── */
const RECENT_KEY = "max_recent_emojis";

export function loadRecent(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string").slice(0, 27) : [];
  } catch {
    return [];
  }
}

function saveRecent(list: string[]) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, 27)));
  } catch {
    /* storage может быть недоступен — недавние просто не сохраняются */
  }
}

interface Ctx {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
  updateNested: <K extends "voice" | "privacy" | "nick">(key: K, patch: Partial<Settings[K]>) => void;
  accent: Accent;
  theme: Theme;
  cssVars: React.CSSProperties;
  toasts: Toast[];
  toast: (text: string, kind?: "info" | "boost" | "success") => void;
  notes: Record<string, string>;
  setNote: (id: string, text: string) => void;
  recentEmojis: string[];
  pushEmoji: (emoji: string) => void;
}

export interface Toast {
  id: number;
  text: string;
  kind: "info" | "boost" | "success";
}

const SettingsCtx = createContext<Ctx | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const accent = ACCENTS.find((a) => a.id === settings.accent)!;
  const theme = THEMES.find((t) => t.id === settings.theme)!;

  const update = useCallback((patch: Partial<Settings>) => setSettings((s) => ({ ...s, ...patch })), []);
  const updateNested = useCallback(
    <K extends "voice" | "privacy" | "nick">(key: K, patch: Partial<Settings[K]>) =>
      setSettings((s) => ({ ...s, [key]: { ...s[key], ...patch } })),
    []
  );
  const setNote = useCallback((id: string, text: string) => setNotes((n) => ({ ...n, [id]: text })), []);

  const [recentEmojis, setRecentEmojis] = useState<string[]>(() => loadRecent());
  const pushEmoji = useCallback((emoji: string) => {
    setRecentEmojis((prev) => {
      const next = [emoji, ...prev.filter((e) => e !== emoji)].slice(0, 27);
      saveRecent(next);
      return next;
    });
  }, []);

  const toast = useCallback((text: string, kind: Toast["kind"] = "info") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, text, kind }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800);
  }, []);

  const cssVars = useMemo(
    () =>
      ({
        ...theme.vars,
        "--accent-1": accent.a1,
        "--accent-2": accent.a2,
        "--accent-3": accent.a3,
        "--color-max-300": accent.c300,
        "--color-max-400": accent.c400,
        "--color-max-500": accent.c500,
        "--color-max-600": accent.c600,
        "--color-violet-max": accent.a3,
        "--msg-fs": `${settings.msgSize}px`,
      }) as React.CSSProperties,
    [accent, theme, settings.msgSize]
  );

  useEffect(() => {
    const el = document.documentElement;
    Object.entries(cssVars as Record<string, string>).forEach(([k, v]) => el.style.setProperty(k, v));
    el.classList.toggle("no-anim", !settings.animations);
    el.dataset.theme = settings.theme;
    return () => {
      Object.keys(cssVars as Record<string, string>).forEach((k) => el.style.removeProperty(k));
    };
  }, [cssVars, settings.animations]);

  const value: Ctx = {
    settings,
    update,
    updateNested,
    accent,
    theme,
    cssVars,
    toasts,
    toast,
    notes,
    setNote,
    recentEmojis,
    pushEmoji,
  };
  return <SettingsCtx.Provider value={value}>{children}</SettingsCtx.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsCtx);
  if (!ctx) throw new Error("useSettings must be used inside SettingsProvider");
  return ctx;
}
