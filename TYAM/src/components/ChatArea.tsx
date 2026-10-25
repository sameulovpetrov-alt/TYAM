import { useEffect, useMemo, useRef, useState } from "react";
import {
  AtSign,
  Bell,
  Check,
  CirclePlus,
  Gem,
  Gift,
  Hash,
  HelpCircle,
  Inbox,
  Laugh,
  Pencil,
  Phone,
  Pin,
  Reply,
  Search,
  Send,
  SmilePlus,
  Sticker,
  Users,
  Video,
  X,
} from "lucide-react";
import type { Channel, Message, RoleContext, User } from "../data";
import { EMOJI_GROUPS, ME, USERS } from "../data";
import { useSettings } from "../store";
import { cn } from "../utils/cn";
import { Avatar, Divider, MessageText, NickName, PremiumTag, RoleChip, Tooltip, nickColorsOf } from "./ui";
import EmojiPicker from "./EmojiPicker";
import { emojiName } from "../emojiNames";

interface Props {
  channel: Channel | null;
  dmUser: User | null;
  meUser: User;
  messages: Message[];
  mentionUsers: User[];
  pendingMention: { name: string; id: number } | null;
  onSend: (text: string, replyTo?: { name: string; text: string }) => void;
  onEdit: (messageId: string, text: string) => void;
  onReact: (messageId: string, emoji: string) => void;
  onPin: (messageId: string) => void;
  membersVisible: boolean;
  onToggleMembers: () => void;
  onOpenPopover: (user: User, e: React.MouseEvent) => void;
  onUserMenu: (userId: string, e: React.MouseEvent) => void;
  /** живые аватары — привилегия 3 уровня буста */
  liveAvatars?: boolean;
  /** роли сервера: цвета никнеймов и назначение ролей */
  roles?: RoleContext | null;
}

export default function ChatArea(p: Props) {
  const { settings, recentEmojis, pushEmoji } = useSettings();
  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState<{ name: string; text: string } | null>(null);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [pickerFor, setPickerFor] = useState<string | null>(null);
  const [inputPicker, setInputPicker] = useState(false);
  const [pinsOpen, setPinsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = useState(0);
  const [emojiQuery, setEmojiQuery] = useState<string | null>(null);
  const [emojiIndex, setEmojiIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const title = p.dmUser ? p.dmUser.name : (p.channel?.name ?? "");
  const visible = search.trim()
    ? p.messages.filter((m) => m.text.toLowerCase().includes(search.toLowerCase()))
    : p.messages;
  const pinned = p.messages.filter((m) => m.pinned);

  const mentionOptions = useMemo(() => {
    if (mentionQuery === null) return [];
    const q = mentionQuery.toLowerCase();
    const specials = p.dmUser
      ? []
      : [
          { name: "everyone", label: "@everyone", hint: "Уведомить всех участников" },
          { name: "here", label: "@here", hint: "Уведомить тех, кто в сети" },
        ].filter((s) => s.name.startsWith(q));
    const users = p.mentionUsers
      .filter((u) => u.name.toLowerCase().startsWith(q) || u.tag.toLowerCase().startsWith(q))
      .slice(0, 6)
      .map((u) => ({ name: u.name, label: `@${u.name}`, hint: `@${u.tag}`, user: u as User | undefined }));
    return [...users, ...specials.map((s) => ({ ...s, user: undefined as User | undefined }))].slice(0, 8);
  }, [mentionQuery, p.mentionUsers, p.dmUser]);

  /** :shortcode-подсказки как в Discord */
  const emojiSuggestions = useMemo(() => {
    if (!emojiQuery) return [];
    const q = emojiQuery.toLowerCase();
    const out: { emoji: string; name: string }[] = [];
    const seen = new Set<string>();
    for (const g of EMOJI_GROUPS) {
      for (const em of g.emojis) {
        if (seen.has(em)) continue;
        const name = emojiName(em, g.name).toLowerCase();
        const tokens = name.split(/[\s,·/]+/).filter(Boolean);
        if (tokens.some((t) => t.startsWith(q))) {
          seen.add(em);
          out.push({ emoji: em, name: emojiName(em, g.name) });
        }
        if (out.length >= 6) return out;
      }
    }
    return out;
  }, [emojiQuery]);

  const insertEmojiShortcode = (emoji: string) => {
    setDraft((d) => d.replace(/(^|\s):([^\s:]{0,20})$/, (_m, space) => `${space}${emoji} `));
    setEmojiQuery(null);
    setEmojiIndex(0);
    pushEmoji(emoji);
    inputRef.current?.focus();
  };

  const quickReactions = useMemo(() => {
    const defaults = ["\u{1F44D}", "\u{1F525}", "\u{1F602}", "\u{1F499}"];
    const fromRecent = recentEmojis.slice(0, 4);
    return fromRecent.length ? fromRecent : defaults;
  }, [recentEmojis]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el && !search) el.scrollTop = el.scrollHeight;
  }, [p.messages.length, p.channel?.id, p.dmUser?.id, search]);

  useEffect(() => {
    setReplyTo(null);
    setSearch("");
    setSearchOpen(false);
    setDraft("");
    setEditingId(null);
    setMentionQuery(null);
    setEmojiQuery(null);
  }, [p.channel?.id, p.dmUser?.id]);

  useEffect(() => {
    const mention = p.pendingMention;
    if (!mention) return;
    setDraft((d) => `${d}${d && !d.endsWith(" ") ? " " : ""}@${mention.name} `);
    inputRef.current?.focus();
  }, [p.pendingMention]);

  const updateDraft = (value: string) => {
    setDraft(value);
    const mention = /(^|\s)@([^\s@]*)$/.exec(value);
    setMentionQuery(mention ? mention[2] : null);
    setMentionIndex(0);
    const shortcode = /(^|\s):([^\s:]{1,20})$/.exec(value);
    setEmojiQuery(shortcode ? shortcode[2] : null);
    setEmojiIndex(0);
  };

  const applyMention = (name: string) => {
    setDraft((d) => d.replace(/(^|\s)@([^\s@]*)$/, (_m, space) => `${space}@${name} `));
    setMentionQuery(null);
    inputRef.current?.focus();
  };

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    p.onSend(text, replyTo ?? undefined);
    setDraft("");
    setReplyTo(null);
    setMentionQuery(null);
    setEmojiQuery(null);
    inputRef.current?.focus();
  };

  const startEdit = (msg: Message) => {
    setEditingId(msg.id);
    setEditText(msg.text);
  };

  const saveEdit = () => {
    if (!editingId) return;
    const text = editText.trim();
    if (text) p.onEdit(editingId, text);
    setEditingId(null);
  };

  const showPremium = (user: User, userId: string) =>
    userId === "me" ? settings.premium && settings.premiumTag : Boolean(user.premium);

  return (
    <section className={cn("flex min-w-0 flex-1 flex-col bg-ink-800", settings.density === "compact" && "compact")}>
      {/* header */}
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-ink-950/60 px-4 shadow-sm">
        {p.dmUser ? (
          <>
            <Avatar user={p.dmUser} size={24} showStatus={false} />
            <span className="text-[15px] font-bold text-white">{p.dmUser.name}</span>
            {p.dmUser.premium && <PremiumTag compact />}
            <span className={cn("ml-1 h-2.5 w-2.5 rounded-full", p.dmUser.status === "online" ? "bg-online" : "bg-fog-500")} />
          </>
        ) : (
          <>
            <Hash className="h-6 w-6 shrink-0 text-fog-500" />
            <span className="text-[15px] font-bold text-white">{title}</span>
            {p.channel?.topic && (
              <>
                <div className="mx-2 hidden h-6 w-px bg-ink-600 md:block" />
                <span className="hidden truncate text-sm text-fog-400 md:block">{p.channel.topic}</span>
              </>
            )}
          </>
        )}
        <div className="ml-auto flex shrink-0 items-center gap-0.5 text-fog-300">
          {p.dmUser && (
            <>
              <Tooltip label="Начать звонок" side="top">
                <button className="rounded-md p-1.5 transition hover:bg-ink-700 hover:text-white"><Phone className="h-5 w-5" /></button>
              </Tooltip>
              <Tooltip label="Видеозвонок" side="top">
                <button className="rounded-md p-1.5 transition hover:bg-ink-700 hover:text-white"><Video className="h-5 w-5" /></button>
              </Tooltip>
            </>
          )}
          {!p.dmUser && (
            <>
              <Tooltip label="Уведомления" side="top">
                <button className="rounded-md p-1.5 transition hover:bg-ink-700 hover:text-white"><Bell className="h-5 w-5" /></button>
              </Tooltip>
              <div className="relative">
                <Tooltip label="Закреплённые сообщения" side="top">
                  <button
                    onClick={() => setPinsOpen((v) => !v)}
                    className={cn("rounded-md p-1.5 transition hover:bg-ink-700 hover:text-white", pinsOpen && "bg-ink-700 text-white")}
                  >
                    <Pin className="h-5 w-5" />
                  </button>
                </Tooltip>
                {pinsOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setPinsOpen(false)} />
                    <div className="pop absolute top-full right-0 z-50 mt-2 w-80 rounded-xl border border-ink-600/50 bg-ink-850 shadow-2xl shadow-black/60">
                      <div className="border-b border-ink-950/60 px-4 py-3 text-sm font-bold text-white">Закреплённые сообщения</div>
                      <div className="max-h-72 overflow-y-auto p-2">
                        {pinned.length === 0 && <div className="p-4 text-center text-sm text-fog-500">Пока ничего не закреплено</div>}
                        {pinned.map((m) => (
                          <div key={m.id} className="mb-1 rounded-lg bg-ink-800 p-3">
                            <div className="flex items-center gap-2">
                              <Avatar user={m.userId === "me" ? p.meUser : (USERS[m.userId] ?? ME)} size={20} showStatus={false} />
                              <span className="text-xs font-bold text-white">{(m.userId === "me" ? p.meUser : (USERS[m.userId] ?? ME)).name}</span>
                              <span className="text-[10px] text-fog-500">{m.time}</span>
                            </div>
                            <p className="mt-1 line-clamp-3 text-sm whitespace-pre-line text-fog-300">{m.text}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
              <Tooltip label={p.membersVisible ? "Скрыть участников" : "Показать участников"} side="top">
                <button
                  onClick={p.onToggleMembers}
                  className={cn("rounded-md p-1.5 transition hover:bg-ink-700 hover:text-white", p.membersVisible && "bg-ink-700 text-white")}
                >
                  <Users className="h-5 w-5" />
                </button>
              </Tooltip>
            </>
          )}
          <div className={cn("relative ml-1 flex items-center rounded-md bg-ink-950 transition-all", searchOpen ? "w-52" : "w-36")}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setSearchOpen(true)}
              placeholder="Поиск"
              className="w-full bg-transparent py-1 pr-7 pl-2 text-sm text-fog-100 placeholder-fog-500 outline-none"
            />
            {search ? (
              <X
                className="absolute right-1.5 h-4 w-4 cursor-pointer text-fog-500 hover:text-white"
                onClick={() => { setSearch(""); setSearchOpen(false); }}
              />
            ) : (
              <Search className="absolute right-1.5 h-4 w-4 text-fog-500" />
            )}
          </div>
          <Tooltip label="Входящие" side="top">
            <button className="rounded-md p-1.5 transition hover:bg-ink-700 hover:text-white"><Inbox className="h-5 w-5" /></button>
          </Tooltip>
          <Tooltip label="Справка" side="top">
            <button className="rounded-md p-1.5 transition hover:bg-ink-700 hover:text-white"><HelpCircle className="h-5 w-5" /></button>
          </Tooltip>
        </div>
      </header>

      {/* messages */}
      <div ref={scrollRef} className="chat-ambient flex-1 overflow-x-hidden overflow-y-auto">
        {!search && (
          <div className="px-4 pt-8 pb-2">
            {p.dmUser ? (
              <>
                <Avatar user={p.dmUser} size={80} showStatus={false} />
                <h2 className="font-display mt-4 flex items-center gap-2 text-2xl font-bold text-white">
                  {p.dmUser.name} {p.dmUser.premium && <PremiumTag />}
                </h2>
                <p className="mt-1 text-sm text-fog-400">
                  Это начало истории ваших личных сообщений с <span className="font-semibold text-fog-100">@{p.dmUser.tag}</span>
                </p>
              </>
            ) : (
              <>
                <div className="max-gradient flex h-16 w-16 items-center justify-center rounded-full shadow-lg shadow-max-600/30">
                  <Hash className="h-9 w-9 text-white" />
                </div>
                <h2 className="font-display mt-4 text-2xl font-bold text-white">Добро пожаловать в #{title}!</h2>
                <p className="mt-1 text-sm text-fog-400">
                  Это начало канала #{title}. {p.channel?.topic} Наберите <span className="rounded bg-max-500/20 px-1 font-semibold text-max-300">@</span>, чтобы упомянуть участника.
                </p>
              </>
            )}
            <Divider label={visible[0]?.day ?? "Сегодня"} />
          </div>
        )}
        {search && (
          <div className="px-4 pt-4 text-sm text-fog-500">
            {visible.length > 0 ? `Результаты поиска: ${visible.length}` : `Ничего не найдено по запросу «${search}»`}
          </div>
        )}

        {visible.map((msg, i) => {
          const user = msg.userId === "me" ? p.meUser : (USERS[msg.userId] ?? ME);
          const prev = visible[i - 1];
          const grouped = !search && !msg.system && !prev?.system && !msg.replyTo && !msg.day && prev?.userId === msg.userId;
          const isMine = msg.userId === "me";
          const editing = editingId === msg.id;
          const nick = nickColorsOf(user, p.roles, settings.nick);
          const assignedRoles = p.roles?.byUser[user.id] ?? [];
          const nameNode = (
            <NickName
              name={user.name}
              colors={nick.colors}
              animated={nick.animated}
              gradient={p.roles?.gradient}
              className={isMine && !nick.colors ? "max-text" : undefined}
            />
          );
          const roleChips = assignedRoles.length
            ? assignedRoles.map((r) => <RoleChip key={r.id} role={r} />)
            : user.role
              ? [<span key="legacy" className="max-gradient rounded-full px-2 py-px text-[10px] font-bold text-white">{user.role}</span>]
              : null;

          if (msg.system) {
            return (
              <div key={msg.id} className="msg-in mx-4 my-3 flex items-center gap-3 rounded-xl border border-boost-2/30 bg-ink-850/70 px-4 py-2.5">
                <span className="boost-gradient flex h-7 w-7 shrink-0 items-center justify-center rounded-full">
                  <Gem className="h-4 w-4 text-white" />
                </span>
                <p className="text-sm font-medium text-fog-200">{msg.text}</p>
                <span className="ml-auto shrink-0 text-xs text-fog-500">{msg.time.split(", ")[1]}</span>
              </div>
            );
          }

          const contentJsx = editing ? (
            <div className="mt-1">
              <textarea
                autoFocus
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); saveEdit(); }
                  if (e.key === "Escape") setEditingId(null);
                }}
                rows={Math.min(5, editText.split("\n").length + 1)}
                className="w-full resize-none rounded-lg bg-ink-700/80 px-3 py-2 text-[15px] text-fog-100 outline-none ring-2 ring-max-500/50"
              />
              <div className="mt-1 text-[11px] text-fog-500">
                escape —{" "}
                <button onClick={() => setEditingId(null)} className="text-max-300 hover:underline">отмена</button>
                {" · "}enter —{" "}
                <button onClick={saveEdit} className="text-max-300 hover:underline">сохранить</button>
              </div>
            </div>
          ) : (
            <MessageText
              text={msg.text}
              className={cn("msg-text whitespace-pre-line text-fog-100/90", settings.density === "compact" ? "leading-snug" : "leading-relaxed")}
            />
          );

          const reactionsJsx =
            msg.reactions.length > 0 ? (
              <div className="mt-1 flex flex-wrap items-center gap-1 leading-none">
                {msg.reactions.map((r) => (
                  <button
                    key={r.emoji}
                    title={emojiName(r.emoji)}
                    onClick={() => {
                      pushEmoji(r.emoji);
                      p.onReact(msg.id, r.emoji);
                    }}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg border px-2 py-0.5 text-sm transition active:scale-90",
                      r.me
                        ? "border-max-500/60 bg-max-500/20 text-max-300"
                        : "border-transparent bg-ink-700/70 text-fog-300 hover:border-ink-500"
                    )}
                  >
                    <span className="text-[15px] leading-none">{r.emoji}</span>
                    <span className="text-xs leading-none font-bold">{r.count}</span>
                  </button>
                ))}
                <button
                  onClick={() => setPickerFor(pickerFor === msg.id ? null : msg.id)}
                  className="flex items-center rounded-lg bg-ink-700/70 px-2 py-0.5 text-fog-500 opacity-0 transition group-hover:opacity-100 hover:text-max-300"
                >
                  <SmilePlus className="h-4 w-4" />
                </button>
              </div>
            ) : null;

          const pinnedJsx = msg.pinned ? (
            <div className="mt-0.5 flex items-center gap-1 text-[11px] text-fog-500">
              <Pin className="h-3 w-3" /> Закреплено
            </div>
          ) : null;

          const toolbarJsx = !editing && (
            <div
              className={cn(
                "absolute -top-3 right-4 z-10 items-center rounded-lg border border-ink-600/50 bg-ink-850 shadow-lg",
                pickerFor === msg.id ? "flex" : "hidden group-hover:flex"
              )}
            >
              <div className="flex items-center gap-0.5 border-r border-ink-600/60 pr-0.5">
                {quickReactions.map((em) => (
                  <button
                    key={em}
                    title={emojiName(em)}
                    onClick={() => { pushEmoji(em); p.onReact(msg.id, em); }}
                    className="emoji-quick rounded-md px-1 py-1 text-[15px] leading-none transition hover:scale-125 hover:bg-ink-600 active:scale-90"
                  >
                    {em}
                  </button>
                ))}
              </div>
              <div className="relative">
                <button
                  onClick={() => setPickerFor(pickerFor === msg.id ? null : msg.id)}
                  title="Выбрать эмодзи"
                  className="p-1.5 text-fog-400 transition hover:bg-ink-700 hover:text-white"
                >
                  <SmilePlus className="h-[18px] w-[18px]" />
                </button>
                {pickerFor === msg.id && (
                  <EmojiPicker side="bottom" header={p.dmUser ? "ЛС" : title} onPick={(em) => p.onReact(msg.id, em)} onClose={() => setPickerFor(null)} />
                )}
              </div>
              <button
                onClick={() => {
                  setReplyTo({ name: user.name, text: msg.text.slice(0, 80) });
                  inputRef.current?.focus();
                }}
                title="Ответить"
                className="p-1.5 text-fog-400 transition hover:bg-ink-700 hover:text-white"
              >
                <Reply className="h-[18px] w-[18px]" />
              </button>
              {isMine && (
                <button
                  onClick={() => startEdit(msg)}
                  title="Редактировать сообщение"
                  className="p-1.5 text-fog-400 transition hover:bg-ink-700 hover:text-max-300"
                >
                  <Pencil className="h-[18px] w-[18px]" />
                </button>
              )}
              <button
                onClick={() => p.onPin(msg.id)}
                title={msg.pinned ? "Открепить" : "Закрепить"}
                className={cn("p-1.5 transition hover:bg-ink-700 hover:text-white", msg.pinned ? "text-max-300" : "text-fog-400")}
              >
                <Pin className="h-[18px] w-[18px]" />
              </button>
            </div>
          );

          return (
            <div key={msg.id} className="msg-in">
              {msg.day && i > 0 && <Divider label={msg.day} />}
              {msg.replyTo && (
                <div className="mt-3 flex items-center gap-2 px-4 pl-14 text-[13px] text-fog-400">
                  <Reply className="h-3.5 w-3.5 -scale-x-100 text-fog-500" />
                  <span className="font-semibold text-max-300">@{msg.replyTo.name}</span>
                  <span className="truncate">{msg.replyTo.text}</span>
                </div>
              )}
              {settings.density === "compact" ? (
                <div className="group relative flex items-start gap-2 px-4 py-[3px] transition-colors hover:bg-ink-750/60">
                  <span className="w-11 shrink-0 pt-[3px] text-right text-[11px] tabular-nums text-fog-500">
                    {msg.time.split(", ")[1]}
                  </span>
                  <button
                    onClick={(e) => p.onOpenPopover(user, e)}
                    onContextMenu={(e) => { e.preventDefault(); p.onUserMenu(user.id, e); }}
                    className={cn(
                      "flex shrink-0 items-center gap-1 text-[13px] font-bold transition hover:underline",
                      user.roleColor ?? "text-fog-100",
                      isMine && "max-text"
                    )}
                  >
                    {nameNode}
                    {showPremium(user, msg.userId) && <PremiumTag compact />}
                  </button>
                  {settings.density === "compact" && roleChips && (
                    <span className="flex shrink-0 items-center gap-1 pt-[3px]">{roleChips}</span>
                  )}
                  <div className="min-w-0 flex-1">
                    {contentJsx}
                    {!editing && msg.edited && <span className="ml-1 text-[10px] text-fog-500">(изменено)</span>}
                    {reactionsJsx}
                    {pinnedJsx}
                  </div>
                  {toolbarJsx}
                </div>
              ) : (
                <div className={cn("group relative flex gap-4 px-4 py-0.5 transition-colors hover:bg-ink-750/60", grouped ? "mt-0" : "mt-3")}>
                  {grouped ? (
                    <div className="w-10 shrink-0 pt-1 text-right text-[10px] text-fog-500 opacity-0 group-hover:opacity-100">
                      {msg.time.split(", ")[1]}
                    </div>
                  ) : (
                    <button
                      onClick={(e) => p.onOpenPopover(user, e)}
                      onContextMenu={(e) => { e.preventDefault(); p.onUserMenu(user.id, e); }}
                      className="shrink-0 pt-[3px] transition hover:opacity-80"
                      title={`${user.name} · левая кнопка — профиль, правая — меню`}
                    >
                      <Avatar user={user} size={40} showStatus={false} animated={p.liveAvatars} />
                    </button>
                  )}
                  <div className="min-w-0 flex-1 pb-0.5">
                    {!grouped && (
                      <div className="flex flex-wrap items-baseline gap-2">
                        <button
                          onClick={(e) => p.onOpenPopover(user, e)}
                          onContextMenu={(e) => { e.preventDefault(); p.onUserMenu(user.id, e); }}
                          className={cn("text-[15px] font-bold transition hover:underline", user.roleColor ?? "text-white", isMine && "max-text")}
                        >
                          {nameNode}
                        </button>
                        {showPremium(user, msg.userId) && <PremiumTag />}
                        {roleChips}
                        <span className="text-xs text-fog-500">{msg.time}</span>
                        {msg.edited && <span className="text-[10px] text-fog-500">(изменено)</span>}
                      </div>
                    )}
                    {contentJsx}
                    {reactionsJsx}
                    {pinnedJsx}
                  </div>
                  {toolbarJsx}
                </div>
              )}
            </div>
          );
        })}
        <div className="h-6" />
      </div>

      {/* input */}
      <div className="relative shrink-0 px-4 pb-5">
        {/* :shortcode autocomplete */}
        {emojiQuery && emojiSuggestions.length > 0 && (
          <div className="pop absolute bottom-full left-4 z-30 mb-2 w-72 overflow-hidden rounded-xl border border-ink-600/50 bg-ink-850 shadow-2xl shadow-black/60">
            <div className="border-b border-ink-950/60 px-3 py-2 text-[10px] font-bold tracking-wider text-fog-500 uppercase">
              Эмодзи · :{emojiQuery}
            </div>
            <div className="p-1.5">
              {emojiSuggestions.map((s, i) => (
                <button
                  key={s.emoji}
                  onMouseEnter={() => setEmojiIndex(i)}
                  onClick={() => insertEmojiShortcode(s.emoji)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition",
                    i === emojiIndex ? "bg-ink-600/80" : "hover:bg-ink-700/60"
                  )}
                >
                  <span className="emoji-inline text-xl">{s.emoji}</span>
                  <span className="truncate text-xs text-fog-300">{s.name}</span>
                  <span className="ml-auto shrink-0 font-mono text-[10px] text-fog-500">:{emojiQuery}</span>
                </button>
              ))}
            </div>
            <div className="border-t border-ink-950/60 px-3 py-1.5 text-[10px] text-fog-500">
              ↑↓ — выбрать · Enter или Tab — вставить
            </div>
          </div>
        )}

        {/* mention autocomplete */}
        {mentionQuery !== null && mentionOptions.length > 0 && (
          <div className="pop absolute bottom-full left-4 z-30 mb-2 w-80 overflow-hidden rounded-xl border border-ink-600/50 bg-ink-850 shadow-2xl shadow-black/60">
            <div className="border-b border-ink-950/60 px-3 py-2 text-[10px] font-bold tracking-wider text-fog-500 uppercase">
              Участники {mentionQuery && `· @${mentionQuery}`}
            </div>
            <div className="max-h-64 overflow-y-auto p-1.5">
              {mentionOptions.map((option, i) => (
                <button
                  key={option.label}
                  onMouseEnter={() => setMentionIndex(i)}
                  onClick={() => applyMention(option.name)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition",
                    i === mentionIndex ? "bg-ink-600/80" : "hover:bg-ink-700/60"
                  )}
                >
                  {option.user ? (
                    <Avatar user={option.user} size={26} showStatus={false} />
                  ) : (
                    <span className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-idle/20">
                      <AtSign className="h-3.5 w-3.5 text-idle" />
                    </span>
                  )}
                  <span className="text-sm font-bold text-fog-100">{option.label}</span>
                  {option.user && showPremium(option.user, option.user.id) && <PremiumTag compact />}
                  <span className="ml-auto truncate text-xs text-fog-500">{option.hint}</span>
                </button>
              ))}
            </div>
            <div className="border-t border-ink-950/60 px-3 py-1.5 text-[10px] text-fog-500">
              ↑↓ — выбрать · Enter или Tab — вставить · Esc — закрыть
            </div>
          </div>
        )}

        {replyTo && (
          <div className="flex items-center justify-between rounded-t-xl bg-ink-900 px-4 py-1.5 text-[13px] text-fog-400">
            <span>
              Ответ <span className="font-semibold text-max-300">@{replyTo.name}</span>
            </span>
            <X className="h-4 w-4 cursor-pointer rounded-full bg-ink-600 p-0.5 hover:text-white" onClick={() => setReplyTo(null)} />
          </div>
        )}
        <div className={cn("flex items-center gap-3 bg-ink-700/80 px-4", replyTo ? "rounded-b-xl" : "rounded-xl")}>
          <button title="Прикрепить файл" className="shrink-0 text-fog-400 transition hover:scale-110 hover:text-max-300">
            <CirclePlus className="h-6 w-6" />
          </button>
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => updateDraft(e.target.value)}
            onKeyDown={(e) => {
              if (emojiQuery && emojiSuggestions.length > 0) {
                if (e.key === "ArrowDown") { e.preventDefault(); setEmojiIndex((i) => (i + 1) % emojiSuggestions.length); return; }
                if (e.key === "ArrowUp") { e.preventDefault(); setEmojiIndex((i) => (i - 1 + emojiSuggestions.length) % emojiSuggestions.length); return; }
                if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); insertEmojiShortcode(emojiSuggestions[emojiIndex].emoji); return; }
                if (e.key === "Escape") { setEmojiQuery(null); return; }
              }
              if (mentionQuery !== null && mentionOptions.length > 0) {
                if (e.key === "ArrowDown") { e.preventDefault(); setMentionIndex((i) => (i + 1) % mentionOptions.length); return; }
                if (e.key === "ArrowUp") { e.preventDefault(); setMentionIndex((i) => (i - 1 + mentionOptions.length) % mentionOptions.length); return; }
                if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); applyMention(mentionOptions[mentionIndex].name); return; }
                if (e.key === "Escape") { setMentionQuery(null); return; }
              }
              if (e.key === "Enter") send();
            }}
            placeholder={p.dmUser ? `Написать @${p.dmUser.name}` : `Написать в #${title} · @ — упомянуть`}
            className="min-w-0 flex-1 bg-transparent py-3 text-[15px] text-fog-100 placeholder-fog-500 outline-none"
          />
          <div className="flex shrink-0 items-center gap-2.5 text-fog-400">
            <button
              title="Упомянуть участника"
              onClick={() => { updateDraft(`${draft}${draft && !draft.endsWith(" ") ? " " : ""}@`); inputRef.current?.focus(); }}
              className="hidden transition hover:scale-110 hover:text-max-300 sm:block"
            >
              <AtSign className="h-5 w-5" />
            </button>
            <button title="Подарок" className="hidden transition hover:scale-110 hover:text-max-300 sm:block"><Gift className="h-5 w-5" /></button>
            <button title="Стикер" className="hidden transition hover:scale-110 hover:text-max-300 sm:block"><Sticker className="h-5 w-5" /></button>
            <div className="relative">
              <button
                title="Эмодзи"
                onClick={() => setInputPicker((v) => !v)}
                className="transition hover:scale-110 hover:text-idle"
              >
                <Laugh className="h-5 w-5" />
              </button>
              {inputPicker && <EmojiPicker header={p.dmUser ? "ЛС" : title} onPick={(em) => setDraft((d) => d + em)} onClose={() => setInputPicker(false)} />}
            </div>
            {draft.trim() ? (
              <button
                onClick={send}
                title="Отправить"
                className="max-gradient pop rounded-lg p-1.5 text-white shadow-md shadow-max-600/40 transition hover:brightness-110 active:scale-90"
              >
                <Send className="h-4 w-4" />
              </button>
            ) : (
              <Check className="h-5 w-5 opacity-0" />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
