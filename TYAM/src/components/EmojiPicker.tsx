import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Clock, Search, X } from "lucide-react";
import { EMOJI_GROUPS } from "../data";
import { emojiName } from "../emojiNames";
import { useSettings } from "../store";
import { cn } from "../utils/cn";

const COLS = 9;
const ROWS = 6;
const PAGE = COLS * ROWS;
const POPULAR = ["👍", "🔥", "😂", "💙", "🎉", "👀", "💜", "🚀", "😍", "💯"];

interface PickResult {
  emoji: string;
  name: string;
  group: string;
}

function normalize(s: string) {
  return s.toLowerCase().replace(/ё/g, "е");
}

/** Транслитерация частых запросов: fire → огонь, heart → сердце */
const TRANSLIT: [RegExp, string][] = [
  [/^fai?er?$/, "огонь"],
  [/^lol+$/, "смех"],
  [/^love$/, "любовь"],
  [/^heart$/, "сердце"],
  [/^star$/, "звезда"],
  [/^party$/, "вечеринка"],
  [/^cool$/, "крутой"],
  [/^sad$/, "грусть"],
  [/^cry$/, "слёзы"],
  [/^pizza$/, "пицца"],
  [/^cat$/, "кошка"],
  [/^dog$/, "собака"],
];

function expandQuery(raw: string): string[] {
  const q = normalize(raw.trim());
  if (!q) return [];
  const mapped = TRANSLIT.find(([re]) => re.test(q))?.[1];
  return mapped ? [q, mapped] : [q];
}

export default function EmojiPicker({
  onPick,
  onClose,
  side = "top",
  header = "Эмодзи",
}: {
  onPick: (emoji: string) => void;
  onClose: () => void;
  side?: "top" | "bottom";
  header?: string;
}) {
  const { recentEmojis, pushEmoji } = useSettings();
  const [group, setGroup] = useState(EMOJI_GROUPS[0].id);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [cursor, setCursor] = useState(0);

  const groups = useMemo(() => {
    const list: { id: string; name: string; icon: string; emojis: string[] }[] = [];
    if (recentEmojis.length) list.push({ id: "recent", name: "Недавние", icon: "clock", emojis: recentEmojis });
    return [...list, ...EMOJI_GROUPS];
  }, [recentEmojis]);

  const searchResults = useMemo<PickResult[]>(() => {
    const terms = expandQuery(query);
    if (!terms.length) return [];
    const out: PickResult[] = [];
    const seen = new Set<string>();
    const wordHit = (haystack: string, q: string) =>
      haystack.split(/[\s,·/]+/).filter(Boolean).some((t) => t.startsWith(q) || (q.length >= 5 && t.includes(q)));
    for (const g of EMOJI_GROUPS) {
      const groupName = normalize(g.name);
      for (const em of g.emojis) {
        if (seen.has(em)) continue;
        const name = normalize(emojiName(em, g.name));
        if (terms.some((t) => em.includes(t) || wordHit(name, t) || wordHit(groupName, t))) {
          seen.add(em);
          out.push({ emoji: em, name: emojiName(em, g.name), group: g.name });
        }
      }
    }
    const q = terms[0] ?? "";
    const score = (r: PickResult) => {
      const startsWord = normalize(r.name).split(/[\s,·/]+/).some((t) => t.startsWith(q));
      const pop = POPULAR.indexOf(r.emoji);
      return (startsWord ? 0 : 100) + (pop === -1 ? 50 : pop);
    };
    return out.sort((a, b) => score(a) - score(b));
  }, [query]);

  const searching = query.trim().length > 0;
  const activeGroup = groups.find((g) => g.id === group) ?? groups[0];
  const cells = searching
    ? searchResults.map((r) => ({ emoji: r.emoji, title: `${r.name} · ${r.group}` }))
    : activeGroup.emojis.map((em) => ({ emoji: em, title: emojiName(em, activeGroup.name) }));

  const pages = Math.max(1, Math.ceil(cells.length / PAGE));
  const safePage = Math.min(page, pages - 1);
  const pageCells = cells.slice(safePage * PAGE, safePage * PAGE + PAGE);

  useEffect(() => {
    setCursor(0);
    setPage(0);
  }, [query, group]);

  const pick = (emoji: string) => {
    pushEmoji(emoji);
    onPick(emoji);
    onClose();
  };

  const move = (delta: number) => setCursor((c) => Math.max(0, Math.min(pageCells.length - 1, c + delta)));
  const flip = (delta: number) => {
    setPage((p) => {
      const next = Math.max(0, Math.min(pages - 1, p + delta));
      setCursor(0);
      return next;
    });
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!pageCells.length) return;
    switch (e.key) {
      case "ArrowRight": e.preventDefault(); move(1); break;
      case "ArrowLeft": e.preventDefault(); move(-1); break;
      case "ArrowDown": e.preventDefault(); move(COLS); break;
      case "ArrowUp": e.preventDefault(); move(-COLS); break;
      case "PageDown": e.preventDefault(); flip(1); break;
      case "PageUp": e.preventDefault(); flip(-1); break;
      case "Enter": e.preventDefault(); pick(pageCells[cursor].emoji); break;
      case "Escape": onClose(); break;
      default: break;
    }
  };

  const rows = Math.max(1, Math.ceil(pageCells.length / COLS));

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className={cn(
          "emoji-pop absolute right-0 z-50 flex w-[360px] flex-col overflow-hidden rounded-2xl border border-ink-600/60 bg-ink-850 shadow-2xl",
          side === "top" ? "bottom-full mb-2" : "top-full mt-2"
        )}
        onKeyDown={onKeyDown}
      >
        {/* поиск */}
        <div className="flex items-center gap-2 border-b border-ink-950/60 px-3 py-2.5">
          <Search className="h-4 w-4 shrink-0 text-fog-500" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown", "PageUp", "PageDown", "Enter"].includes(e.key)) onKeyDown(e);
              if (e.key === "Escape") onClose();
            }}
            placeholder={`Найти эмодзи · ${header}`}
            className="min-w-0 flex-1 bg-transparent text-[13px] text-fog-100 placeholder-fog-500 outline-none"
          />
          {query ? (
            <button onClick={() => setQuery("")} title="Сбросить" className="rounded-md p-1 text-fog-500 transition hover:bg-ink-700 hover:text-white">
              <X className="h-3.5 w-3.5" />
            </button>
          ) : (
            <span className="shrink-0 rounded-md bg-ink-700 px-1.5 py-0.5 text-[9px] font-extrabold tracking-wider text-fog-400 uppercase">
              {EMOJI_GROUPS.reduce((a, g) => a + g.emojis.length, 0)}
            </span>
          )}
        </div>

        {/* вкладки групп — в две строки, без скролла */}
        <div className="grid grid-cols-9 gap-0.5 border-b border-ink-950/40 px-2 py-1.5">
          {groups.map((g) => {
            const on = !searching && g.id === group;
            return (
              <button
                key={g.id}
                title={g.name}
                onClick={() => { setGroup(g.id); setQuery(""); }}
                className={cn(
                  "flex h-8 w-full items-center justify-center rounded-lg text-[16px] leading-none transition",
                  on ? "scale-110 bg-ink-600 shadow-inner" : "opacity-50 hover:bg-ink-700 hover:opacity-100"
                )}
              >
                {g.id === "recent" ? <Clock className="h-4 w-4 text-fog-300" /> : g.icon}
              </button>
            );
          })}
        </div>

        {/* заголовок + страницы */}
        <div className="flex items-center gap-1.5 px-3 pt-2">
          <span className="truncate text-[10px] font-bold tracking-wider text-fog-500 uppercase">
            {searching ? `Результаты · ${query.trim()}` : activeGroup.name}
          </span>
          <span className="ml-auto flex items-center gap-0.5">
            {pages > 1 && (
              <>
                <button
                  onClick={() => flip(-1)}
                  disabled={safePage === 0}
                  title="Предыдущая страница"
                  className="rounded-md p-0.5 text-fog-400 transition hover:bg-ink-700 hover:text-white disabled:opacity-25"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <span className="px-1 text-[10px] tabular-nums text-fog-500">
                  {safePage + 1}/{pages}
                </span>
                <button
                  onClick={() => flip(1)}
                  disabled={safePage >= pages - 1}
                  title="Следующая страница"
                  className="rounded-md p-0.5 text-fog-400 transition hover:bg-ink-700 hover:text-white disabled:opacity-25"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </>
            )}
            <span className="pl-1 text-[10px] tabular-nums text-fog-500">{cells.length}</span>
          </span>
        </div>

        {/* сетка: фиксированная высота, без скролла */}
        <div className="emoji-grid" style={{ gridTemplateRows: `repeat(${ROWS}, 36px)` }}>
          {pageCells.map((cell, i) => (
            <button
              key={`${cell.emoji}-${i}`}
              title={cell.title}
              onMouseEnter={() => setCursor(i)}
              onClick={() => pick(cell.emoji)}
              className={cn(
                "emoji-cell",
                i === cursor ? "scale-125 bg-ink-600 shadow-lg shadow-black/40" : "hover:bg-ink-700/70"
              )}
            >
              <span className="emoji-inline">{cell.emoji}</span>
            </button>
          ))}
          {pageCells.length === 0 && (
            <div className="col-span-9 row-span-6 flex flex-col items-center justify-center gap-1.5 text-center">
              <span className="text-2xl">🤷</span>
              <p className="text-xs text-fog-500">Ничего не найдено по «{query.trim()}»</p>
              <p className="text-[10px] text-fog-500/70">Попробуйте: огонь, смех, сердце, пицца, ракета</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-ink-950/60 px-3 py-1.5 text-[10px] text-fog-500">
          <span className="truncate">↑↓←→ выбрать · PgUp/PgDn листать · Enter вставить</span>
          <span className="flex shrink-0 items-center gap-1">
            {pages > 1 &&
              Array.from({ length: Math.min(pages, 6) }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setPage(i); setCursor(0); }}
                  title={`Страница ${i + 1}`}
                  className={cn("h-1 rounded-full transition-all", i === safePage ? "w-3.5 bg-max-400" : "w-1 bg-ink-600 hover:bg-ink-500")}
                />
              ))}
            <span className="pl-1 tabular-nums">{rows}×{COLS}</span>
          </span>
        </div>
      </div>
    </>
  );
}
