import type { ReactNode } from "react";
import { Camera, Crown } from "lucide-react";
import type { RoleContext, Status, User } from "../data";
import { findShopItem } from "../shop";
import { cn } from "../utils/cn";

/** Тег TYAM Premium рядом с именем */
export function PremiumTag({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <span title="TYAM Premium" className="max-gradient inline-flex h-4 w-4 shrink-0 items-center justify-center rounded">
        <Crown className="h-2.5 w-2.5 text-white" />
      </span>
    );
  }
  return (
    <span className="max-gradient inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-px text-[10px] font-bold text-white" title="Подписчик TYAM Premium">
      <Crown className="h-2.5 w-2.5" /> Premium
    </span>
  );
}

/* ─────────── градиентный никнейм (привилегия 2 уровня буста) ─────────── */
export const NICK_PAIRS: [string, string][] = [
  ["#5ea0ff", "#b98cff"],
  ["#ff7eb3", "#ffa76b"],
  ["#4ce0b3", "#57c9ff"],
  ["#ffd166", "#ff7a59"],
  ["#a78bfa", "#f472b6"],
  ["#67e8f9", "#a3e635"],
  ["#f97316", "#facc15"],
  ["#38bdf8", "#818cf8"],
  ["#f43f5e", "#f59e0b"],
  ["#34d399", "#a7f3d0"],
];

/** Детерминированные два цвета для никнейма участника */
export function nickColors(user: User): [string, string] {
  let h = 0;
  for (const ch of `${user.id}${user.tag}`) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return NICK_PAIRS[h % NICK_PAIRS.length];
}

/** Смешивает два hex-цвета: t=0 → a, t=1 → b */
export function mixHex(a: string, b: string, t: number): string {
  const parse = (h: string) => {
    const v = h.replace("#", "");
    const full = v.length === 3 ? v.split("").map((c) => c + c).join("") : v;
    return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) || 0);
  };
  const [r1, g1, b1] = parse(a);
  const [r2, g2, b2] = parse(b);
  const to = (x: number, y: number) => Math.round(x + (y - x) * t).toString(16).padStart(2, "0");
  return `#${to(r1, r2)}${to(g1, g2)}${to(b1, b2)}`;
}

/** Имя, окрашенное градиентом из двух цветов; animated — градиент переливается */
export function GradientName({
  name,
  c1,
  c2,
  className,
  animated = false,
}: {
  name: string;
  c1: string;
  c2: string;
  className?: string;
  animated?: boolean;
}) {
  return (
    <span
      className={cn("nick-gradient", animated && "nick-animated", className)}
      style={
        {
          "--n1": c1,
          "--n2": c2,
          "--n3": mixHex(c1, c2, 0.5),
        } as React.CSSProperties
      }
    >
      {name}
    </span>
  );
}

/** Чип роли с её собственным цветом */
export function RoleChip({ role, className }: { role: { name: string; c1: string; c2: string }; className?: string }) {
  return (
    <span
      className={cn("role-chip", className)}
      style={{ "--role-c": role.c1, "--role-c2": role.c2, "--role-fg": mixHex(role.c1, "#ffffff", 0.55) } as React.CSSProperties}
      title={`Роль: ${role.name}`}
    >
      <span className="role-chip-dot" />
      {role.name}
    </span>
  );
}

/**
 * Цвета никнейма участника: сначала назначенная роль, затем собственный градиент,
 * затем производная пара (если градиент на сервере включён).
 */
export function nickColorsOf(
  user: User,
  roles?: RoleContext | null,
  myNick?: { enabled: boolean; c1: string; c2: string } | null
): { colors: [string, string] | null; animated: boolean } {
  const assigned = roles?.byUser[user.id] ?? [];
  const primary = assigned[0];
  if (primary) return { colors: [primary.c1, primary.c2], animated: primary.animated };
  if (user.id === "me" && myNick?.enabled) return { colors: [myNick.c1, myNick.c2], animated: true };
  if (roles?.gradient) return { colors: nickColors(user), animated: false };
  return { colors: null, animated: false };
}

/**
 * Имя участника с учётом цветов ролей сервера:
 * gradient=true → переливающийся градиент из двух цветов роли,
 * иначе → сплошной цвет роли (или обычный, если цвета нет).
 */
export function NickName({
  name,
  colors,
  animated,
  gradient,
  className,
}: {
  name: string;
  colors?: [string, string] | null;
  animated?: boolean;
  gradient?: boolean;
  className?: string;
}) {
  if (!colors) return <span className={className}>{name}</span>;
  if (gradient) return <GradientName name={name} c1={colors[0]} c2={colors[1]} animated={animated} className={className} />;
  return (
    <span className={className} style={{ color: colors[0] }}>
      {name}
    </span>
  );
}

/* ─────────── эмодзи и @упоминания в тексте ─────────── */
const EMOJI_CHARS = "\\u{1F000}-\\u{1FAFF}\\u{2600}-\\u{27BF}\\u{2B00}-\\u{2BFF}\\u{2300}-\\u{23FF}\\u{2190}-\\u{21FF}\\u{2122}\\u{00A9}\\u{00AE}\\u{FE0F}\\u{200D}\\u{20E3}";
const EMOJI_RUN = new RegExp(`[${EMOJI_CHARS}]+`, "gu");
const EMOJI_ONE = new RegExp(`[${EMOJI_CHARS}]`, "u");
const TOKEN_SPLIT = new RegExp(`(@[A-Za-zА-Яa-яЁё0-9_.-]+)|([${EMOJI_CHARS}]+)`, "gu");

function graphemes(text: string): string[] {
  const Seg = (Intl as unknown as { Segmenter?: new (l?: string, o?: object) => { segment: (s: string) => Iterable<{ segment: string }> } }).Segmenter;
  if (Seg) {
    const seg = new Seg(undefined, { granularity: "grapheme" });
    return [...seg.segment(text)].map((g) => g.segment);
  }
  return [...text];
}

/** Только эмодзи (до 6 графем) → крупный «jumbo» вывод */
export function isEmojiOnly(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  const runs = trimmed.match(EMOJI_RUN) ?? [];
  if (runs.length === 0 || runs.length > 8) return false;
  // допускаем только «хвосты» клавишных комбинаций (1️⃣) вокруг эмодзи
  const stripped = trimmed.replace(EMOJI_RUN, "").replace(/[\s\d#*]/g, "");
  if (stripped.length > 0) return false;
  return graphemes(runs.join("")).length <= 8;
}

/** Подсветка @упоминаний и ровная расстановка эмодзи по базовой линии */
export function MessageText({ text, className }: { text: string; className?: string }) {
  const jumbo = isEmojiOnly(text);
  const parts = text.split(TOKEN_SPLIT);
  return (
    <p className={cn("break-words", jumbo && "jumbo-emoji", className)}>
      {parts.map((part, i) => {
        if (!part) return null;
        if (part.startsWith("@")) {
          const everyone = part === "@everyone" || part === "@here";
          return (
            <span
              key={i}
              className={cn(
                "cursor-pointer rounded px-1 font-semibold transition hover:underline",
                everyone ? "bg-idle/20 text-idle hover:bg-idle/30" : "bg-max-500/20 text-max-300 hover:bg-max-500/35"
              )}
            >
              {part}
            </span>
          );
        }
        if (EMOJI_ONE.test(part)) {
          return (
            <span key={i} className="emoji-inline" aria-hidden>
              {part}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </p>
  );
}

/** Анимированный аватар: CSS-слои из магазина поверх обычного аватара */
export function AnimatedAvatar({
  animation,
  size = 64,
  user,
  ring = "ring-ink-850",
  showStatus = false,
  className,
}: {
  animation?: string | null;
  size?: number;
  user?: User;
  ring?: string;
  showStatus?: boolean;
  className?: string;
}) {
  const fallback: User = {
    id: "preview",
    name: "TYAM",
    tag: "tyam",
    initials: "T",
    avatar: "from-max-500 to-violet-max",
    status: "online",
  };
  const item = animation ? findShopItem(animation) : undefined;
  const css = item?.css ?? animation ?? "";
  return (
    <span className={cn("animav-wrap animav-live", className)} style={{ width: size, height: size }}>
      <span className={cn("animav-img block")} style={{ width: size, height: size }}>
        <Avatar user={user ?? fallback} size={size} showStatus={showStatus} ring={ring} />
      </span>
      {css && <span className={cn("animav-layer", css)} aria-hidden />}
    </span>
  );
}

export const STATUS_COLOR: Record<Status, string> = {
  online: "bg-online",
  idle: "bg-idle",
  dnd: "bg-dnd",
  offline: "bg-fog-500",
};

export const STATUS_LABEL: Record<Status, string> = {
  online: "В сети",
  idle: "Не активен",
  dnd: "Не беспокоить",
  offline: "Не в сети",
};

export function Avatar({
  user,
  size = 40,
  showStatus = true,
  ring = "ring-ink-800",
  decoration,
  animated = false,
}: {
  user: User;
  size?: number;
  showStatus?: boolean;
  ring?: string;
  decoration?: string | null;
  /** живая рамка — привилегия 3 уровня буста сервера */
  animated?: boolean;
}) {
  const deco = decoration === undefined ? user.decoration : decoration;
  const live = animated;
  const ownAnimation = user.avatarAnimation;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      {live && <span className="avatar-live" aria-hidden />}
      <div
        className={cn(
          "flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-gradient-to-br font-bold text-white select-none",
          !user.avatarUrl && user.avatar,
          live && "avatar-live-img",
          ownAnimation && "animav-img"
        )}
        style={{ fontSize: size * 0.34 }}
      >
        {user.avatarUrl ? (
          <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" draggable={false} />
        ) : (
          user.initials
        )}
      </div>
      {ownAnimation && <span className={cn("animav-layer", ownAnimation)} aria-hidden />}
      {deco && <span className={cn("deco-ring", deco)} aria-hidden />}
      {live && size >= 32 && <span className="live-badge">LIVE</span>}
      {showStatus && (
        <span
          className={cn("absolute right-0 bottom-0 z-[1] rounded-full ring-[3px]", STATUS_COLOR[user.status], ring)}
          style={{ width: size * 0.34, height: size * 0.34 }}
          title={STATUS_LABEL[user.status]}
        />
      )}
    </div>
  );
}

/** Аватар с кнопкой загрузки внутри рамки (как в Discord: наведение → камера по центру) */
export function EditableAvatar({
  user,
  size,
  onEdit,
  ring = "ring-ink-800",
  title = "Редактировать аватар",
}: {
  user: User;
  size: number;
  onEdit: () => void;
  ring?: string;
  title?: string;
}) {
  return (
    <button type="button" className="group/av relative z-[1] shrink-0 cursor-pointer rounded-full outline-offset-4 focus-visible:outline-2 focus-visible:outline-max-300" style={{ width: size, height: size }} onClick={onEdit} title={title} aria-label={title}>
      <Avatar user={user} size={size} ring={ring} />
      <span
        className="pointer-events-none absolute inset-0 z-[2] flex items-center justify-center rounded-full bg-black/65 opacity-0 backdrop-blur-[1px] transition duration-150 group-hover/av:opacity-100 group-focus-visible/av:opacity-100"
        aria-hidden
      >
        <span className="flex items-center justify-center rounded-full bg-white/15 ring-1 ring-white/40 transition duration-200 group-hover/av:scale-110" style={{ width: size * 0.44, height: size * 0.44 }}>
          <Camera style={{ width: size * 0.24, height: size * 0.24 }} className="text-white" />
        </span>
      </span>
    </button>
  );
}

/** Анимированный эффект поверх баннера профиля */
export function ProfileEffect({ effect }: { effect?: string | null }) {
  if (!effect) return null;
  if (effect === "fx-neon") return <div className="fx-layer fx-neon" aria-hidden />;
  if (effect === "fx-matrix") {
    return (
      <div className="fx-layer fx-matrix" aria-hidden>
        {Array.from({ length: 12 }).map((_, i) => (
          <span
            key={i}
            className="fx-column"
            style={{ left: `${(i * 8.3 + 3) % 100}%`, animationDelay: `${(i * 0.37) % 1.9}s`, animationDuration: `${1.5 + (i % 4) * 0.3}s` }}
          />
        ))}
      </div>
    );
  }
  const cls = effect === "fx-snow" ? "fx-snow" : effect === "fx-sakura" ? "fx-sakura" : "fx-stardust";
  return (
    <div className={cn("fx-layer", cls)} aria-hidden>
      {Array.from({ length: 16 }).map((_, i) => {
        const s = effect === "fx-sakura" ? 6 + (i % 3) * 3 : 2 + (i % 3) * 2;
        return (
          <span
            key={i}
            className="fx-particle"
            style={{
              left: `${(i * 6.7 + 4) % 100}%`,
              width: s,
              height: effect === "fx-sakura" ? s * 0.8 : s,
              animationDelay: `${(i * 0.53) % 3.5}s`,
              animationDuration: `${3 + (i % 5) * 0.5}s`,
            }}
          />
        );
      })}
    </div>
  );
}

export function Tooltip({ label, children, side = "right" }: { label: string; children: ReactNode; side?: "right" | "top" }) {
  return (
    <div className="group/tt relative flex justify-center">
      {children}
      <div
        className={cn(
          "pointer-events-none absolute z-50 rounded-lg bg-ink-950 px-3 py-1.5 text-sm font-semibold whitespace-nowrap text-fog-100 opacity-0 shadow-xl shadow-black/50 transition-all duration-150 group-hover/tt:opacity-100",
          side === "right"
            ? "top-1/2 left-full ml-3 -translate-y-1/2 translate-x-1 group-hover/tt:translate-x-0"
            : "bottom-full left-1/2 mb-2 -translate-x-1/2 translate-y-1 group-hover/tt:translate-y-0"
        )}
      >
        {label}
        {side === "right" && (
          <span className="absolute top-1/2 right-full -translate-y-1/2 border-4 border-transparent border-r-ink-950" />
        )}
      </div>
    </div>
  );
}

export function Divider({ label }: { label: string }) {
  return (
    <div className="my-4 flex items-center gap-3 px-4">
      <div className="h-px flex-1 bg-ink-600/60" />
      <span className="text-xs font-semibold text-fog-500">{label}</span>
      <div className="h-px flex-1 bg-ink-600/60" />
    </div>
  );
}
