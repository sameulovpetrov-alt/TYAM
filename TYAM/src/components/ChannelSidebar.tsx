import { useState } from "react";
import {
  ChevronDown,
  Crown,
  Gamepad2,
  Gem,
  Headphones,
  HeadphoneOff,
  LockKeyhole,
  Mic,
  MicOff,
  PhoneOff,
  Plus,
  Settings,
  Signal,
  UserPlus,
  Users,
  Volume2,
  Hash,
} from "lucide-react";
import { Bell, Copy, FolderPlus, LogOut, MousePointerClick, Palette, Pencil, Search, Store, Trash2 } from "lucide-react";
import type { Category, Channel, Server, User } from "../data";
import { USERS } from "../data";
import { boostLevel, useSettings } from "../store";
import type { BoostInfo } from "../store";
import { cn } from "../utils/cn";
import { Avatar } from "./ui";
import ContextMenu from "./ContextMenu";

interface Props {
  server: Server | null;
  meUser: User;
  boostInfo: BoostInfo | null;
  activeChannel: string | null;
  onSelectChannel: (id: string) => void;
  joinedVoice: string | null;
  voiceOccupants: Record<string, string[]>;
  onJoinVoice: (id: string) => void;
  onLeaveVoice: () => void;
  muted: boolean;
  deafened: boolean;
  onToggleMute: () => void;
  onToggleDeafen: () => void;
  onOpenBoost: () => void;
  onOpenProfile: () => void;
  onOpenSettings: () => void;
  onOpenPremium: () => void;
  onOpenServerSettings: () => void;
  onCreateChannel: (categoryId: string) => void;
  onCreateCategory: () => void;
  onRenameCategory: (category: Category) => void;
  onDeleteCategory: (category: Category) => void;
  onEditChannel: (channel: Channel) => void;
  onDeleteChannel: (channel: Channel) => void;
  onLeaveServer: () => void;
  onUpdateServer: (server: Server) => void;
  homeTab: "friends" | "shop";
  onOpenShop: () => void;
  /** ваши друзья — их можно позвать на сервер */
  friends: User[];
  onInviteFriend: (userId: string) => void;
  dmIds: string[];
  activeDm: string | null;
  onSelectDm: (id: string | null) => void;
}

export default function ChannelSidebar(p: Props) {
  const { toast } = useSettings();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteQuery, setInviteQuery] = useState("");
  const [serverMenu, setServerMenu] = useState(false);
  const [channelMenu, setChannelMenu] = useState<{ channel: Channel; x: number; y: number } | null>(null);
  const [sideMenu, setSideMenu] = useState<{ x: number; y: number; category?: Category } | null>(null);

  const allChannels = p.server?.categories.flatMap((c) => c.channels) ?? [];
  const voiceChannel = p.joinedVoice ? allChannels.find((c) => c.id === p.joinedVoice) : null;
  const level = p.boostInfo ? boostLevel(p.boostInfo.count) : 0;
  const firstCategory = p.server?.categories[0];

  return (
    <aside className="relative flex w-64 shrink-0 flex-col bg-ink-850">
      {p.server ? (
        <>
          <div className={cn("relative h-24 shrink-0 overflow-hidden bg-gradient-to-br", !p.server.bannerUrl && p.server.banner)}>
            {p.server.bannerUrl && <img src={p.server.bannerUrl} alt="Баннер сервера" className="absolute inset-0 h-full w-full object-cover" draggable={false} />}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(255,255,255,0.18),transparent_55%)]" />
            {level > 0 && (
              <span className="absolute top-2.5 right-3 flex items-center gap-1 rounded-full bg-black/30 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur">
                <Gem className="h-3 w-3 text-boost-1" /> Уровень {level}
                {level >= 2 && (
                  <span className="ml-0.5 rounded-full px-1.5 py-px text-[8px] font-extrabold tracking-wider text-white uppercase nick-chip">
                    Ник
                  </span>
                )}
                {level === 3 && (
                  <span className="boost-gradient ml-0.5 rounded-full px-1.5 py-px text-[8px] font-extrabold tracking-wider uppercase">
                    💫 LIVE
                  </span>
                )}
              </span>
            )}
            <button
              onClick={() => setServerMenu((v) => !v)}
              title="Меню сервера"
              className="absolute right-0 bottom-0 left-0 flex h-12 w-full items-center justify-between bg-gradient-to-t from-black/50 to-transparent px-4 text-left transition hover:from-black/70"
            >
              <span className="font-display truncate text-[13px] font-bold text-white drop-shadow">{p.server.name}</span>
              <span className="flex shrink-0 items-center gap-1">
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => { e.stopPropagation(); p.onOpenBoost(); }}
                  title="Бусты сервера"
                  className="rounded-md p-1 text-white/80 transition hover:scale-110 hover:text-boost-1"
                >
                  <Gem className="h-4 w-4" />
                </span>
                <ChevronDown className={cn("h-4 w-4 text-white/80 transition-transform", serverMenu && "rotate-180")} />
              </span>
            </button>
          </div>

          {/* выпадающее меню сервера */}
          {serverMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setServerMenu(false)} />
              <div className="pop absolute top-[92px] right-2 left-2 z-50 rounded-xl border border-ink-600/60 bg-ink-950/95 p-1.5 shadow-2xl shadow-black/60 backdrop-blur">
                {[
                  { label: "Пригласить людей", icon: <UserPlus className="h-4 w-4 text-max-300" />, action: () => setInviteOpen(true), accent: true },
                  { label: "Бусты сервера", icon: <Gem className="h-4 w-4 text-boost-1" />, action: p.onOpenBoost },
                  { label: "Создать канал", icon: <Plus className="h-4 w-4" />, action: () => firstCategory && p.onCreateChannel(firstCategory.id) },
                  { label: "Создать категорию", icon: <FolderPlus className="h-4 w-4" />, action: p.onCreateCategory },
                  { label: "Настройки сервера", icon: <Settings className="h-4 w-4" />, action: p.onOpenServerSettings },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => { item.action(); setServerMenu(false); }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-sm transition hover:bg-ink-700",
                      item.accent ? "font-semibold text-max-300" : "text-fog-200"
                    )}
                  >
                    {item.label} {item.icon}
                  </button>
                ))}
                <div className="my-1 h-px bg-ink-700" />
                <div className="flex items-center gap-2 px-2.5 py-1.5">
                  <Bell className="h-4 w-4 shrink-0 text-fog-400" />
                  <select
                    value={p.server.notifications ?? "all"}
                    onChange={(e) => p.onUpdateServer({ ...p.server!, notifications: e.target.value as Server["notifications"] })}
                    className="w-full rounded-md bg-ink-800 px-2 py-1 text-xs text-fog-200 outline-none"
                    title="Настройки уведомлений"
                  >
                    <option value="all">Все сообщения</option>
                    <option value="mentions">Только @упоминания</option>
                    <option value="nothing">Не уведомлять</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 px-2.5 py-1.5">
                  <Palette className={cn("h-4 w-4 shrink-0", level >= 2 ? "text-max-300" : "text-fog-500/60")} />
                  <div className="min-w-0 flex-1">
                    <div className={cn("truncate text-xs font-semibold", level >= 2 ? "text-fog-200" : "text-fog-500/70")}>Градиентные никнеймы</div>
                    <div className="text-[10px] text-fog-500">{level >= 2 ? "2 уровень · доступно" : "Нужен 2 уровень буста"}</div>
                  </div>
                  <button
                    disabled={level < 2}
                    title={level >= 2 ? "Переключить градиентные никнеймы" : "Доступно с 2 уровня буста"}
                    onClick={() => p.onUpdateServer({ ...p.server!, gradientNicks: p.server!.gradientNicks === false })}
                    className={cn(
                      "flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition",
                      level < 2 ? "cursor-not-allowed bg-ink-800" : p.server.gradientNicks === false ? "justify-start bg-ink-600" : "justify-end max-gradient"
                    )}
                  >
                    <span className={cn("h-4 w-4 rounded-full bg-white shadow transition", level < 2 && "opacity-40")} />
                  </button>
                </div>
                <div className="my-1 h-px bg-ink-700" />
                <button
                  onClick={() => { p.onLeaveServer(); setServerMenu(false); }}
                  className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-sm font-semibold text-dnd transition hover:bg-dnd/15"
                >
                  Покинуть сервер <LogOut className="h-4 w-4" />
                </button>
              </div>
            </>
          )}
          <div className="mx-3 flex items-center gap-2 border-b border-ink-950/60 py-3">
            <button
              onClick={() => setInviteOpen(true)}
              className="max-gradient flex flex-1 items-center justify-center gap-2 rounded-lg py-1.5 text-[13px] font-semibold text-white shadow-md shadow-max-600/30 transition hover:brightness-110 active:scale-[0.98]"
            >
              <UserPlus className="h-4 w-4" /> Пригласить друзей
            </button>
          </div>
        </>
      ) : (
        <div className="shrink-0 border-b border-ink-950/60 p-2.5 shadow-sm">
          <button className="w-full rounded-md bg-ink-950 px-2.5 py-1.5 text-left text-[13px] text-fog-500 transition hover:bg-ink-900">
            Найти или начать беседу
          </button>
        </div>
      )}

      <div
        className="flex-1 overflow-x-hidden overflow-y-auto px-2 pt-3"
        onContextMenu={(e) => {
          if (!p.server) return;
          e.preventDefault();
          setChannelMenu(null);
          setSideMenu({ x: e.clientX, y: e.clientY });
        }}
      >
        {p.server ? (
          <>
          {p.server.categories.map((cat) => {
            const isCollapsed = collapsed[cat.id];
            return (
              <div key={cat.id} className="mb-4">
                <div
                  className="group flex w-full items-center gap-0.5 px-1 pb-1 text-[11px] font-bold tracking-wider text-fog-500 uppercase"
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setChannelMenu(null);
                    setSideMenu({ x: e.clientX, y: e.clientY, category: cat });
                  }}
                  title={`${cat.name} · правая кнопка — меню категории`}
                >
                  <button
                    onClick={() => setCollapsed((c) => ({ ...c, [cat.id]: !c[cat.id] }))}
                    className="flex min-w-0 flex-1 items-center gap-0.5 text-left transition hover:text-fog-300"
                  >
                    <ChevronDown className={cn("h-3 w-3 shrink-0 transition-transform", isCollapsed && "-rotate-90")} />
                    <span className="truncate">{cat.name}</span>
                  </button>
                  <button
                    onClick={() => p.onCreateChannel(cat.id)}
                    title={`Создать канал в категории «${cat.name}»`}
                    className="rounded p-0.5 opacity-0 transition hover:bg-ink-700 hover:text-fog-100 group-hover:opacity-100"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                {cat.channels.map((ch) => {
                  if (isCollapsed && ch.id !== p.activeChannel && !ch.unread && ch.id !== p.joinedVoice) return null;
                  const active = ch.id === p.activeChannel && ch.type === "text";
                  const occupants = p.voiceOccupants[ch.id] ?? [];
                  return (
                    <div key={ch.id}>
                      <button
                        onClick={() => (ch.type === "text" ? p.onSelectChannel(ch.id) : p.onJoinVoice(ch.id))}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setSideMenu(null);
                          setChannelMenu({ channel: ch, x: e.clientX, y: e.clientY });
                        }}
                        title={`${ch.name} · правая кнопка — меню канала`}
                        className={cn(
                          "group flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-[15px] transition-colors",
                          active
                            ? "bg-ink-600/70 font-semibold text-white"
                            : ch.unread
                              ? "font-semibold text-fog-100 hover:bg-ink-700/60"
                              : "text-fog-500 hover:bg-ink-700/60 hover:text-fog-300"
                        )}
                      >
                        {ch.private ? <LockKeyhole className="h-4 w-4 shrink-0 text-fog-500" /> : ch.type === "text" ? <Hash className="h-5 w-5 shrink-0 text-fog-500" /> : <Volume2 className="h-5 w-5 shrink-0 text-fog-500" />}
                        <span className="truncate">{ch.name}</span>
                        {ch.type === "voice" && occupants.length > 0 && <span className="ml-auto text-xs text-fog-500">{occupants.length}</span>}
                        {ch.mentions ? (
                          <span className="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-dnd px-1 text-[10px] font-bold text-white">{ch.mentions}</span>
                        ) : ch.unread && !active ? (
                          <span className="ml-auto h-2 w-2 rounded-full bg-white" />
                        ) : null}
                      </button>
                      {ch.type === "voice" &&
                        occupants.map((uid) => (
                          <div key={uid} className="ml-6 flex items-center gap-2 rounded-md px-2 py-1 text-sm text-fog-400 transition hover:bg-ink-700/40">
                            <Avatar user={uid === "me" ? p.meUser : USERS[uid]} size={22} showStatus={false} />
                            <span className={cn("truncate", uid === "me" && "font-semibold text-fog-100")}>{uid === "me" ? p.meUser.name : USERS[uid].name}</span>
                            {uid === "me" && p.muted && <MicOff className="ml-auto h-3.5 w-3.5 text-dnd" />}
                          </div>
                        ))}
                    </div>
                  );
                })}
              </div>
            );
          })}
            <p className="mt-1 mb-4 flex items-start gap-1.5 rounded-lg border border-dashed border-ink-700 px-2.5 py-2 text-[10px] leading-snug text-fog-500">
              <MousePointerClick className="mt-px h-3 w-3 shrink-0 text-fog-400" />
              Правая кнопка на категории или свободном месте — создать канал, категорию или удалить лишнее
            </p>
          </>
        ) : (
          <>
            <button
              onClick={() => p.onSelectDm(null)}
              className={cn(
                "mb-1 flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-[15px] font-medium transition",
                p.activeDm === null && p.homeTab === "friends" ? "bg-ink-600/70 text-white" : "text-fog-400 hover:bg-ink-700/60 hover:text-fog-100"
              )}
            >
              <Users className="h-5 w-5" /> Друзья
            </button>
            <button
              onClick={p.onOpenShop}
              className={cn(
                "mb-1 flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-[15px] font-medium transition",
                p.homeTab === "shop" && p.activeDm === null ? "bg-ink-600/70 text-white" : "text-fog-400 hover:bg-ink-700/60 hover:text-fog-100"
              )}
            >
              <Store className="h-5 w-5 text-boost-1" /> Магазин
              <span className="boost-gradient ml-auto rounded-full px-1.5 py-0.5 text-[9px] font-extrabold text-white uppercase">new</span>
            </button>
            <button
              onClick={p.onOpenPremium}
              className="mb-1 flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-[15px] font-medium text-fog-400 transition hover:bg-ink-700/60 hover:text-fog-100"
            >
              <Crown className="h-5 w-5 text-idle" /> TYAM Premium
            </button>
            <button className="mb-3 flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-[15px] font-medium text-fog-400 transition hover:bg-ink-700/60 hover:text-fog-100">
              <Gamepad2 className="h-5 w-5" /> Активность
            </button>
            <div className="flex items-center justify-between px-2.5 pb-1 text-[11px] font-bold tracking-wider text-fog-500 uppercase">
              Личные сообщения
              <Plus className="h-4 w-4 cursor-pointer transition hover:text-fog-100" />
            </div>
            {p.dmIds.length === 0 && (
              <p className="mx-2.5 mb-2 rounded-lg border border-dashed border-ink-600 px-2.5 py-3 text-[11px] leading-snug text-fog-500">
                Бесед пока нет. Добавьте человека во вкладке «Друзья» — переписка появится здесь.
              </p>
            )}
            {p.dmIds.map((id) => {
              const u = USERS[id];
              const active = p.activeDm === id;
              return (
                <button
                  key={id}
                  onClick={() => p.onSelectDm(id)}
                  className={cn("group flex w-full items-center gap-3 rounded-md px-2.5 py-1.5 transition", active ? "bg-ink-600/70" : "hover:bg-ink-700/60")}
                >
                  <Avatar user={u} size={32} ring="ring-ink-850" />
                  <div className="min-w-0 text-left">
                    <div className={cn("truncate text-[15px] font-medium", active ? "text-white" : "text-fog-300")}>{u.name}</div>
                    <div className="truncate text-xs text-fog-500">{u.activity ?? u.custom ?? "В сети"}</div>
                  </div>
                </button>
              );
            })}
          </>
        )}
      </div>

      {voiceChannel && (
        <div className="mx-2 mb-1 rounded-lg border border-online/20 bg-ink-900 p-2.5">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-sm font-bold text-online">
                <Signal className="voice-pulse h-4 w-4 rounded-full" /> Голос подключён
              </div>
              <div className="truncate text-xs text-fog-500">
                {voiceChannel.name} / {p.server?.name}
              </div>
            </div>
            <button onClick={p.onLeaveVoice} title="Отключиться" className="rounded-md p-1.5 text-fog-400 transition hover:bg-ink-700 hover:text-dnd">
              <PhoneOff className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      <div className="flex shrink-0 items-center gap-1 bg-ink-900 px-2 py-1.5">
        <button onClick={p.onOpenProfile} title="Открыть профиль" className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-1 py-1 transition hover:bg-ink-700/60">
          <Avatar user={p.meUser} size={34} ring="ring-ink-900" />
          <div className="min-w-0 text-left">
            <div className="flex items-center gap-1 truncate text-sm font-bold text-white">
              {p.meUser.name}
              {p.meUser.premium && <Crown className="h-3 w-3 shrink-0 text-idle" />}
            </div>
            <div className="truncate text-[11px] text-fog-500">{p.muted ? "Микрофон выключен" : p.meUser.custom}</div>
          </div>
        </button>
        <button
          onClick={p.onToggleMute}
          title={p.muted ? "Включить микрофон" : "Выключить микрофон"}
          className={cn("rounded-md p-1.5 transition hover:bg-ink-700", p.muted ? "text-dnd" : "text-fog-300")}
        >
          {p.muted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </button>
        <button
          onClick={p.onToggleDeafen}
          title={p.deafened ? "Включить звук" : "Выключить звук"}
          className={cn("rounded-md p-1.5 transition hover:bg-ink-700", p.deafened ? "text-dnd" : "text-fog-300")}
        >
          {p.deafened ? <HeadphoneOff className="h-5 w-5" /> : <Headphones className="h-5 w-5" />}
        </button>
        <button onClick={p.onOpenSettings} title="Настройки пользователя" className="rounded-md p-1.5 text-fog-300 transition hover:rotate-45 hover:bg-ink-700">
          <Settings className="h-5 w-5" />
        </button>
      </div>

      {sideMenu && p.server && (
        <ContextMenu
          x={sideMenu.x}
          y={sideMenu.y}
          title={sideMenu.category ? `Категория · ${sideMenu.category.name}` : p.server.name}
          items={
            sideMenu.category
              ? [
                  {
                    label: "Создать канал здесь",
                    icon: <Plus className="h-4 w-4" />,
                    onClick: () => p.onCreateChannel(sideMenu.category!.id),
                  },
                  { label: "Создать категорию", icon: <FolderPlus className="h-4 w-4" />, onClick: p.onCreateCategory },
                  "divider",
                  {
                    label: collapsed[sideMenu.category.id] ? "Развернуть категорию" : "Свернуть категорию",
                    icon: <ChevronDown className={cn("h-4 w-4 transition-transform", collapsed[sideMenu.category.id] && "-rotate-90")} />,
                    onClick: () => setCollapsed((c) => ({ ...c, [sideMenu.category!.id]: !c[sideMenu.category!.id] })),
                  },
                  { label: "Переименовать категорию", icon: <Pencil className="h-4 w-4" />, onClick: () => p.onRenameCategory(sideMenu.category!) },
                  {
                    label: `Удалить категорию${sideMenu.category.channels.length ? ` · ${sideMenu.category.channels.length} канал.` : ""}`,
                    icon: <Trash2 className="h-4 w-4" />,
                    danger: true,
                    onClick: () => p.onDeleteCategory(sideMenu.category!),
                  },
                ]
              : [
                  {
                    label: "Создать канал",
                    icon: <Plus className="h-4 w-4" />,
                    disabled: !firstCategory,
                    hint: firstCategory ? firstCategory.name : "нет категорий",
                    onClick: () => firstCategory && p.onCreateChannel(firstCategory.id),
                  },
                  { label: "Создать категорию", icon: <FolderPlus className="h-4 w-4" />, onClick: p.onCreateCategory },
                  "divider",
                  { label: "Пригласить друзей", icon: <UserPlus className="h-4 w-4" />, onClick: () => setInviteOpen(true) },
                  { label: "Настройки сервера", icon: <Settings className="h-4 w-4" />, onClick: p.onOpenServerSettings },
                  { label: "Бусты сервера", icon: <Gem className="h-4 w-4" />, onClick: p.onOpenBoost },
                ]
          }
          onClose={() => setSideMenu(null)}
        />
      )}

      {channelMenu && (
        <ContextMenu
          x={channelMenu.x}
          y={channelMenu.y}
          title={channelMenu.channel.type === "text" ? `#${channelMenu.channel.name}` : channelMenu.channel.name}
          items={[
            {
              label: channelMenu.channel.type === "text" ? "Открыть · прочитано" : "Подключиться",
              icon: channelMenu.channel.type === "text" ? <Hash className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />,
              onClick: () => (channelMenu.channel.type === "text" ? p.onSelectChannel(channelMenu.channel.id) : p.onJoinVoice(channelMenu.channel.id)),
            },
            {
              label: "Копировать ссылку",
              icon: <Copy className="h-4 w-4" />,
              onClick: () => {
                navigator.clipboard?.writeText(`https://max.ru/channels/${p.server?.id ?? ""}/${channelMenu.channel.id}`);
                toast("Ссылка на канал скопирована", "success");
              },
            },
            "divider",
            { label: "Настройки канала", icon: <Settings className="h-4 w-4" />, onClick: () => p.onEditChannel(channelMenu.channel) },
            { label: "Удалить канал", icon: <Trash2 className="h-4 w-4" />, danger: true, onClick: () => p.onDeleteChannel(channelMenu.channel) },
          ]}
          onClose={() => setChannelMenu(null)}
        />
      )}

      {inviteOpen && p.server && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-[2px]" onClick={() => setInviteOpen(false)}>
          <div className="modal-in w-full max-w-md rounded-2xl bg-ink-800 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className={cn("relative h-20 overflow-hidden rounded-t-2xl bg-gradient-to-br", p.server.banner)}>
              {p.server.bannerUrl && <img src={p.server.bannerUrl} alt="" className="h-full w-full object-cover" />}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-2.5 left-4 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-black/30 text-sm backdrop-blur">
                  {p.server.iconUrl ? <img src={p.server.iconUrl} alt="" className="h-full w-full object-cover" /> : (p.server.icon ?? p.server.short)}
                </span>
                <div>
                  <div className="font-display text-[13px] font-bold text-white">Пригласить на сервер</div>
                  <div className="text-[11px] text-white/75">{p.server.name}</div>
                </div>
              </div>
            </div>

            <div className="p-5 pt-4">
              <div className="flex items-center rounded-lg bg-ink-950 px-3">
                <Search className="h-3.5 w-3.5 shrink-0 text-fog-500" />
                <input
                  value={inviteQuery}
                  onChange={(e) => setInviteQuery(e.target.value)}
                  placeholder="Поиск среди друзей"
                  className="min-w-0 flex-1 bg-transparent py-2 px-2 text-sm text-fog-100 placeholder-fog-500 outline-none"
                />
              </div>

              <div className="mt-3 max-h-56 space-y-1 overflow-y-auto pr-1">
                {p.friends.length === 0 && (
                  <div className="rounded-xl border border-dashed border-ink-600 px-4 py-6 text-center">
                    <p className="text-sm font-semibold text-fog-200">Друзей пока нет</p>
                    <p className="mt-1 text-xs leading-relaxed text-fog-500">
                      Добавьте человека во вкладке «Друзья» — и он появится здесь, чтобы присоединиться к серверу.
                    </p>
                  </div>
                )}
                {p.friends
                  .filter((f) => f.name.toLowerCase().includes(inviteQuery.toLowerCase()) || f.tag.toLowerCase().includes(inviteQuery.toLowerCase()))
                  .map((friend) => {
                    const inside = p.server!.members.includes(friend.id);
                    const banned = (p.server!.banned ?? []).includes(friend.id);
                    return (
                      <div key={friend.id} className="flex items-center gap-3 rounded-xl px-2.5 py-2 transition hover:bg-ink-750">
                        <Avatar user={friend} size={34} ring="ring-ink-800" />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-bold text-fog-100">{friend.name}</div>
                          <div className="truncate text-[11px] text-fog-500">@{friend.tag}</div>
                        </div>
                        <button
                          disabled={inside || banned}
                          onClick={() => p.onInviteFriend(friend.id)}
                          className={cn(
                            "shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold transition",
                            inside
                              ? "cursor-default bg-online/15 text-online"
                              : banned
                                ? "cursor-default bg-ink-700 text-fog-500"
                                : "max-gradient text-white hover:brightness-110 active:scale-95"
                          )}
                        >
                          {inside ? "На сервере" : banned ? "В бан-листе" : "Пригласить"}
                        </button>
                      </div>
                    );
                  })}
                {p.friends.length > 0 &&
                  p.friends.filter((f) => f.name.toLowerCase().includes(inviteQuery.toLowerCase()) || f.tag.toLowerCase().includes(inviteQuery.toLowerCase())).length === 0 && (
                    <p className="py-5 text-center text-xs text-fog-500">Никого не нашли по запросу «{inviteQuery}»</p>
                  )}
              </div>

              <div className="mt-4 border-t border-ink-700 pt-3">
                <div className="text-[10px] font-bold tracking-wider text-fog-500 uppercase">Или отправьте ссылку</div>
                <div className="mt-2 flex items-center gap-2 rounded-lg bg-ink-950 p-2 pl-3">
                  <span className="flex-1 truncate text-xs text-fog-300">max.ru/join/{p.server.id.slice(-8)}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(`https://max.ru/join/${p.server!.id.slice(-8)}`);
                      toast("Ссылка-приглашение скопирована", "success");
                    }}
                    className="max-gradient rounded-md px-3 py-1.5 text-xs font-bold text-white transition hover:brightness-110 active:scale-95"
                  >
                    Копировать
                  </button>
                </div>
                <p className="mt-1.5 text-[11px] text-fog-500">Ссылка действует 7 дней · без ограничения использований</p>
              </div>

              <button onClick={() => setInviteOpen(false)} className="mt-4 w-full rounded-lg bg-ink-700 py-2 text-sm font-semibold text-fog-300 transition hover:bg-ink-600">
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}