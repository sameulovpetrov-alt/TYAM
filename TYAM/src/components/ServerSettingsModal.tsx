import { useRef, useState } from "react";
import {
  ImagePlus,
  Bell,
  Check,
  Copy,
  Gauge,
  Link2,
  LogOut,
  Palette,
  Pencil,
  Plus,
  ScrollText,
  ShieldCheck,
  SlidersHorizontal,
  Smile,
  Trash2,
  UserX,
  Users,
  X,
} from "lucide-react";
import type { AuditEntry, Server, ServerEmoji, ServerInvite, ServerRole } from "../data";
import { DEFAULT_SERVER_ROLES, USERS } from "../data";
import { readImageFile } from "../utils/image";
import { cn } from "../utils/cn";
import { Modal } from "./Modal";
import { GradientName, RoleChip, mixHex } from "./ui";
import { useSettings } from "../store";
import { RolePermissionsEditor } from "./PermissionEditors";
import { useAvatarEditor } from "./AvatarEditor";

type Section = "overview" | "members" | "roles" | "emoji" | "moderation" | "invites" | "audit" | "safety";

const AUDIT_ICON: Record<AuditEntry["kind"], React.ReactNode> = {
  channel: <SlidersHorizontal className="h-4 w-4 text-max-300" />,
  member: <UserX className="h-4 w-4 text-dnd" />,
  settings: <ShieldCheck className="h-4 w-4 text-online" />,
  invite: <Link2 className="h-4 w-4 text-cyan-300" />,
  role: <Users className="h-4 w-4 text-fuchsia-300" />,
};

const ICONS = ['🚀', '💬', '🎧', '🎮', '🎨', '📚', '☕', '🔥', '⚡', '🌊', '🛰', '💎'];
const BANNERS = [
  "from-max-500 via-indigo-500 to-violet-500",
  "from-emerald-500 via-teal-500 to-cyan-500",
  "from-amber-500 via-orange-500 to-rose-500",
  "from-fuchsia-500 via-violet-500 to-indigo-500",
  "from-sky-500 via-blue-500 to-indigo-600",
];
const ROLE_COLORS = [
  "#2e7cf6", "#5ea0ff", "#22d3ee", "#34d399", "#23c58b", "#a3e635",
  "#facc15", "#f5b544", "#ffa76b", "#f0566a", "#f43f5e", "#f472b6",
  "#c084fc", "#8a5cf6", "#a78bfa", "#93a3c8", "#ffffff", "#0f172a",
];
/** Готовые пары для переливающегося градиента */
const ROLE_PAIRS: [string, string][] = [
  ["#5ea0ff", "#c084fc"],
  ["#22d3ee", "#a3e635"],
  ["#facc15", "#f0566a"],
  ["#f472b6", "#ffa76b"],
  ["#34d399", "#22d3ee"],
  ["#a78bfa", "#f43f5e"],
];
const SLOW_OPTIONS = [
  { value: 0, label: "Выключен" },
  { value: 5, label: "5 секунд" },
  { value: 10, label: "10 секунд" },
  { value: 30, label: "30 секунд" },
  { value: 60, label: "1 минута" },
  { value: 120, label: "2 минуты" },
];


function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={onChange}
      className={cn("flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition", on ? "max-gradient justify-end" : "justify-start bg-ink-600")}
    >
      <span className="h-5 w-5 rounded-full bg-white shadow" />
    </button>
  );
}

export default function ServerSettingsModal({
  server,
  auditLog = [],
  onClose,
  onSave,
  onLeave,
}: {
  server: Server;
  auditLog?: AuditEntry[];
  onClose: () => void;
  onSave: (server: Server) => void;
  onLeave: (id: string) => void;
}) {
  const { toast } = useSettings();
  const openAvatarEditor = useAvatarEditor();
  const bannerInput = useRef<HTMLInputElement>(null);
  const [section, setSection] = useState<Section>("overview");
  const [draft, setDraft] = useState<Server>(() => ({
    ...structuredClone(server),
    roles: server.roles ?? structuredClone(DEFAULT_SERVER_ROLES),
    emojis: server.emojis ?? [],
    invites: server.invites ?? [],
    slowMode: server.slowMode ?? 0,
    explicitFilter: server.explicitFilter ?? "members",
    require2fa: server.require2fa ?? false,
  }));
  const [name, setName] = useState(server.name);
  const [description, setDescription] = useState(server.description ?? "");
  const [emojiName, setEmojiName] = useState("");
  const [emojiChar, setEmojiChar] = useState("");
  const [activeRole, setActiveRole] = useState<string>(draft.roles?.[0]?.id ?? "");

  const roles = draft.roles ?? [];
  const currentRole = roles.find((r) => r.id === activeRole) ?? roles[0];

  const patchRole = (id: string, patch: Partial<ServerRole>) =>
    setDraft((s) => ({ ...s, roles: (s.roles ?? []).map((r) => (r.id === id ? { ...r, ...patch } : r)) }));

  const save = () => {
    const updated: Server = {
      ...draft,
      name: name.trim() || server.name,
      description: description.trim(),
      short: draft.icon || (name.trim() || server.name).slice(0, 2).toUpperCase(),
    };
    onSave(updated);
    toast("Настройки сервера сохранены", "success");
    onClose();
  };

  const editIcon = () => openAvatarEditor({
    kind: "server",
    name: name.trim() || server.name,
    image: draft.iconUrl,
    source: draft.iconSource,
    crop: draft.iconCrop,
    onSave: ({ url, source, crop }) => {
      setDraft((current) => ({ ...current, iconUrl: url, iconSource: source, iconCrop: crop, icon: undefined }));
      toast("Аватар готов. Сохраните настройки сервера, чтобы применить изменения.", "success");
    },
  });

  const uploadBanner = async (file: File | undefined) => {
    if (!file) return;
    try {
      const url = await readImageFile(file, 960);
      setDraft((s) => ({ ...s, bannerUrl: url }));
      toast("Баннер сервера обновлён", "success");
    } catch (err) {
      toast(err instanceof Error && err.message === "too-big" ? "Файл больше 8 МБ — выберите поменьше" : "Не удалось загрузить изображение", "info");
    }
  };

  const addEmoji = () => {
    const em = emojiChar.trim();
    const nm = emojiName.trim().toLowerCase().replace(/\s+/g, "_");
    if (!em || !nm) return;
    const item: ServerEmoji = { id: `e-${Date.now()}`, name: nm, emoji: em };
    setDraft((s) => ({ ...s, emojis: [...(s.emojis ?? []), item] }));
    setEmojiChar("");
    setEmojiName("");
  };

  const addInvite = () => {
    const code = Math.random().toString(36).slice(2, 8);
    const invite: ServerInvite = { code: `${code}-${Math.random().toString(36).slice(2, 6)}`, uses: 0, created: "только что" };
    setDraft((s) => ({ ...s, invites: [invite, ...(s.invites ?? [])] }));
    toast("Приглашение создано", "success");
  };

  const navigation: { id: Section; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "Обзор", icon: <SlidersHorizontal className="h-4 w-4" /> },
    { id: "members", label: `Участники · ${draft.members.length + 1}`, icon: <Users className="h-4 w-4" /> },
    { id: "roles", label: `Роли · ${roles.length}`, icon: <ShieldCheck className="h-4 w-4" /> },
    { id: "emoji", label: `Эмодзи · ${(draft.emojis ?? []).length}`, icon: <Smile className="h-4 w-4" /> },
    { id: "moderation", label: "Модерация", icon: <Gauge className="h-4 w-4" /> },
    { id: "invites", label: "Приглашения", icon: <Link2 className="h-4 w-4" /> },
    { id: "audit", label: `Журнал аудита · ${auditLog.length}`, icon: <ScrollText className="h-4 w-4" /> },
    { id: "safety", label: "Безопасность", icon: <Bell className="h-4 w-4" /> },
  ];

  return (
    <Modal onClose={onClose} wide className="max-w-4xl">
      <div className="flex max-h-[90vh] min-h-[560px]">
        <aside className="flex w-56 shrink-0 flex-col overflow-y-auto bg-ink-850 p-3">
          <div className="px-2 pb-1 text-[10px] font-bold tracking-wider text-fog-500 uppercase">Настройки сервера</div>
          <div className="truncate px-2 pb-4 text-sm font-bold text-white">{server.name}</div>
          {navigation.map((item) => (
            <button
              key={item.id}
              onClick={() => setSection(item.id)}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition",
                section === item.id ? "bg-ink-600 font-semibold text-white" : "text-fog-400 hover:bg-ink-700 hover:text-fog-100"
              )}
            >
              {item.icon} {item.label}
            </button>
          ))}
          <div className="mt-auto border-t border-ink-700 pt-3">
            <button
              onClick={() => onLeave(server.id)}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-semibold text-dnd transition hover:bg-dnd/10"
            >
              <LogOut className="h-4 w-4" /> Покинуть сервер
            </button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col bg-ink-800">
          <header className="flex items-center justify-between border-b border-ink-950/50 px-6 py-4">
            <h2 className="font-display text-lg font-bold text-white">{navigation.find((n) => n.id === section)?.label}</h2>
            <button onClick={onClose} title="Закрыть" className="rounded-full bg-ink-700 p-1.5 text-fog-400 transition hover:rotate-90 hover:text-white"><X className="h-4 w-4" /></button>
          </header>

          <main className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            {section === "overview" && (
              <div className="mx-auto max-w-xl space-y-5">
                <div className={cn("relative flex h-32 items-end overflow-hidden rounded-xl bg-gradient-to-br p-4", !draft.bannerUrl && draft.banner)}>
                  {draft.bannerUrl && <img src={draft.bannerUrl} alt="Баннер сервера" className="absolute inset-0 h-full w-full object-cover" />}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_10%,rgba(255,255,255,0.3),transparent_60%)]" />
                  <div className="absolute top-2 right-2 flex gap-1.5">
                    <button
                      onClick={() => bannerInput.current?.click()}
                      title="Загрузить свой баннер сервера"
                      className="flex items-center gap-1.5 rounded-lg bg-black/40 px-2.5 py-1.5 text-[11px] font-bold text-white backdrop-blur transition hover:bg-black/60 active:scale-95"
                    >
                      <ImagePlus className="h-3.5 w-3.5" /> Свой баннер
                    </button>
                    {draft.bannerUrl && (
                      <button
                        onClick={() => setDraft((s) => ({ ...s, bannerUrl: undefined }))}
                        title="Убрать баннер"
                        className="rounded-lg bg-black/40 p-1.5 text-white backdrop-blur transition hover:bg-dnd active:scale-95"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="relative flex items-center gap-3">
                    <button type="button" onClick={editIcon} aria-label="Редактировать аватар сервера" title="Редактировать аватар сервера" className="group/icon relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-black/20 text-2xl text-white backdrop-blur">
                      {draft.iconUrl ? <img src={draft.iconUrl} alt="Иконка" className="h-full w-full object-cover" /> : (draft.icon ?? draft.short)}
                      <span className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition group-hover/icon:opacity-100 group-focus-visible/icon:opacity-100"><Pencil className="h-5 w-5 text-white" /></span>
                    </button>
                    <div className="font-display text-lg font-bold text-white drop-shadow">{name || server.name}</div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold tracking-wider text-fog-400 uppercase">Название сервера</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} maxLength={32} className="mt-2 w-full rounded-lg bg-ink-950 px-3.5 py-2.5 text-sm text-fog-100 outline-none ring-max-500/0 transition focus:ring-2 focus:ring-max-500/60" />
                </div>
                <div>
                  <label className="text-xs font-bold tracking-wider text-fog-400 uppercase">Описание</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={120} rows={2} placeholder="О чём ваш сервер?" className="mt-2 w-full resize-none rounded-lg bg-ink-950 px-3.5 py-2.5 text-sm text-fog-100 placeholder-fog-500 outline-none ring-max-500/0 transition focus:ring-2 focus:ring-max-500/60" />
                </div>
                <div>
                  <label className="text-xs font-bold tracking-wider text-fog-400 uppercase">Иконка сервера</label>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <button
                      onClick={editIcon}
                      title={draft.iconUrl ? "Изменить аватар сервера" : "Загрузить фото сервера"}
                      className={cn(
                        "flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold transition",
                        draft.iconUrl ? "max-gradient text-white" : "bg-ink-950 text-fog-300 hover:bg-ink-700"
                      )}
                    >
                      {draft.iconUrl ? <Pencil className="h-4 w-4" /> : <ImagePlus className="h-4 w-4" />} {draft.iconUrl ? "Изменить аватар" : "Своё фото"}
                    </button>
                    {draft.iconUrl && (
                      <button
                        onClick={() => setDraft((s) => ({ ...s, iconUrl: undefined, iconSource: undefined, iconCrop: undefined }))}
                        title="Убрать фото иконки"
                        className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-950 text-fog-400 transition hover:bg-dnd hover:text-white"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                    {ICONS.map((icon) => (
                      <button key={icon} onClick={() => setDraft((s) => ({ ...s, icon, iconUrl: undefined, iconSource: undefined, iconCrop: undefined, short: icon }))} className={cn("flex h-9 w-9 items-center justify-center rounded-lg text-lg transition", draft.icon === icon && !draft.iconUrl ? "max-gradient scale-105" : "bg-ink-950 hover:bg-ink-700")}>{icon}</button>
                    ))}
                    <button onClick={() => setDraft((s) => ({ ...s, icon: undefined, iconUrl: undefined, iconSource: undefined, iconCrop: undefined }))} title="Использовать буквы" className={cn("flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold transition", !draft.icon && !draft.iconUrl ? "max-gradient text-white" : "bg-ink-950 text-fog-400 hover:bg-ink-700")}>Aa</button>
                  </div>
                </div>
                <input ref={bannerInput} type="file" accept="image/*" className="hidden" onChange={(e) => { void uploadBanner(e.target.files?.[0]); e.target.value = ""; }} />
                <div>
                  <label className="text-xs font-bold tracking-wider text-fog-400 uppercase">Баннер</label>
                  <div className="mt-2 flex gap-2">
                    {BANNERS.map((banner) => (
                      <button key={banner} onClick={() => setDraft((s) => ({ ...s, banner }))} className={cn("h-10 flex-1 rounded-lg bg-gradient-to-br transition hover:scale-105", banner, draft.banner === banner && "ring-2 ring-white ring-offset-2 ring-offset-ink-800")} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {section === "members" && (
              <div className="mx-auto max-w-xl">
                <p className="mb-4 text-sm text-fog-400">Участники сервера. Удаление из списка меняет состав сервера в этой демо-версии.</p>
                <div className="mb-2 flex items-center gap-3 rounded-xl bg-ink-850 p-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-online/15 text-sm font-bold text-online">ВЫ</span>
                  <div className="flex-1"><div className="text-sm font-bold text-white">Вы</div><div className="text-xs text-fog-500">Владелец сервера</div></div>
                  <span className="rounded-full bg-max-500/15 px-2 py-1 text-[10px] font-bold text-max-300">Владелец</span>
                </div>
                <div className="space-y-1">
                  {draft.members.map((id) => {
                    const user = USERS[id];
                    if (!user) return null;
                    return (
                      <div key={id} className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-ink-750">
                        <div className={cn("flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold text-white", user.avatar)}>{user.initials}</div>
                        <div className="min-w-0 flex-1"><div className="text-sm font-semibold text-fog-100">{user.name}</div><div className="text-xs text-fog-500">@{user.tag}</div></div>
                        {user.role && <span className="rounded-full bg-ink-700 px-2 py-1 text-[10px] font-bold text-fog-300">{user.role}</span>}
                        <button onClick={() => setDraft((s) => ({ ...s, members: s.members.filter((m) => m !== id) }))} className="rounded-lg px-2 py-1.5 text-xs font-semibold text-fog-500 transition hover:bg-dnd/15 hover:text-dnd">Удалить</button>
                      </div>
                    );
                  })}
                  {draft.members.length === 0 && <p className="py-8 text-center text-sm text-fog-500">В сервере пока нет других участников</p>}
                </div>
                {(draft.banned ?? []).length > 0 && (
                  <div className="mt-5">
                    <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-dnd uppercase">
                      <UserX className="h-3.5 w-3.5" /> Забаненные — {(draft.banned ?? []).length}
                    </div>
                    {(draft.banned ?? []).map((id) => {
                      const user = USERS[id];
                      if (!user) return null;
                      return (
                        <div key={id} className="flex items-center gap-3 rounded-xl bg-dnd/5 px-3 py-2.5">
                          <div className={cn("flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br text-[10px] font-bold text-white opacity-60", user.avatar)}>{user.initials}</div>
                          <div className="min-w-0 flex-1 text-sm font-semibold text-fog-300">{user.name}</div>
                          <button
                            onClick={() => setDraft((s) => ({ ...s, banned: (s.banned ?? []).filter((b) => b !== id) }))}
                            className="rounded-lg bg-ink-700 px-2.5 py-1.5 text-xs font-bold text-fog-200 transition hover:bg-online hover:text-white"
                          >
                            Разбанить
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {section === "audit" && (
              <div className="mx-auto max-w-xl">
                <p className="mb-4 text-sm text-fog-400">Все действия администрации сервера: каналы, участники, настройки и приглашения.</p>
                {auditLog.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-ink-600 py-12 text-center">
                    <ScrollText className="h-8 w-8 text-fog-500" />
                    <p className="text-sm text-fog-500">Журнал пуст — действия появятся здесь автоматически</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {auditLog.map((entry) => (
                      <div key={entry.id} className="flex items-center gap-3 rounded-xl bg-ink-850 px-3.5 py-2.5 transition hover:bg-ink-750">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink-900">{AUDIT_ICON[entry.kind]}</span>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm text-fog-100">{entry.action}</div>
                          <div className="text-[11px] text-fog-500">Вы · {entry.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {section === "roles" && (
              <div className="mx-auto flex max-w-2xl gap-4">
                <div className="w-44 shrink-0">
                  <button
                    onClick={() => {
                      const pair = ROLE_PAIRS[roles.length % ROLE_PAIRS.length];
                      const role: ServerRole = {
                        id: `r-${Date.now()}`,
                        name: "Новая роль",
                        color: pair[0],
                        c2: pair[1],
                        animated: true,
                        permissions: [],
                      };
                      setDraft((s) => ({ ...s, roles: [...(s.roles ?? []), role] }));
                      setActiveRole(role.id);
                    }}
                    className="max-gradient mb-2 flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold text-white transition hover:brightness-110"
                  >
                    <Plus className="h-3.5 w-3.5" /> Создать роль
                  </button>
                  <div className="space-y-1">
                    {roles.map((role) => (
                      <button
                        key={role.id}
                        onClick={() => setActiveRole(role.id)}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition",
                          currentRole?.id === role.id ? "bg-ink-600 font-semibold text-white" : "text-fog-400 hover:bg-ink-750"
                        )}
                      >
                        <span
                          className={cn("h-3 w-3 shrink-0 rounded-full", role.animated && "role-swatch-flow")}
                          style={{ backgroundImage: `linear-gradient(120deg, ${role.color}, ${role.c2 ?? mixHex(role.color, "#ffffff", 0.45)})` }}
                        />
                        <span className="truncate">{role.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
                {currentRole && (
                  <div className="min-w-0 flex-1 space-y-4 rounded-xl bg-ink-850 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <input
                        value={currentRole.name}
                        onChange={(e) => patchRole(currentRole.id, { name: e.target.value })}
                        maxLength={24}
                        className="min-w-0 flex-1 rounded-lg bg-ink-950 px-3 py-2 text-sm font-bold text-fog-100 outline-none ring-max-500/0 transition focus:ring-2 focus:ring-max-500/60"
                      />
                      <button
                        onClick={() => {
                          setDraft((s) => ({ ...s, roles: (s.roles ?? []).filter((r) => r.id !== currentRole.id) }));
                          setActiveRole(roles.find((r) => r.id !== currentRole.id)?.id ?? "");
                        }}
                        title="Удалить роль"
                        className="rounded-lg bg-ink-900 p-2 text-fog-500 transition hover:bg-dnd/15 hover:text-dnd"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    {/* градиент никнейма роли */}
                    <div className="rounded-xl bg-ink-900 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-fog-500 uppercase">
                            <Palette className="h-3.5 w-3.5 text-max-300" /> Цвет никнейма роли
                          </div>
                          <p className="mt-0.5 text-[11px] text-fog-500">Два цвета дают градиент в чате и списке участников</p>
                        </div>
                        <Toggle
                          on={currentRole.animated ?? false}
                          onChange={() => patchRole(currentRole.id, { animated: !currentRole.animated })}
                        />
                      </div>
                      <div className="mt-1 text-right text-[10px] font-bold text-fog-500">
                        {currentRole.animated ? "переливается" : "статичный"}
                      </div>

                      <div className="mt-2 grid gap-3 sm:grid-cols-2">
                        {([
                          { key: "color" as const, label: "Первый цвет" },
                          { key: "c2" as const, label: "Второй цвет" },
                        ]).map((slot) => {
                          const value = slot.key === "color" ? currentRole.color : (currentRole.c2 ?? mixHex(currentRole.color, "#ffffff", 0.45));
                          return (
                            <div key={slot.key}>
                              <div className="mb-1.5 text-[10px] font-bold tracking-wider text-fog-500 uppercase">{slot.label}</div>
                              <div className="flex flex-wrap gap-1.5">
                                {ROLE_COLORS.map((color) => (
                                  <button
                                    key={color}
                                    title={color}
                                    onClick={() => patchRole(currentRole.id, { [slot.key]: color } as Partial<ServerRole>)}
                                    style={{ backgroundColor: color }}
                                    className={cn(
                                      "h-6 w-6 rounded-md transition hover:scale-115",
                                      value.toLowerCase() === color.toLowerCase() && "ring-2 ring-white ring-offset-2 ring-offset-ink-900"
                                    )}
                                  />
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-3">
                        <div className="mb-1.5 text-[10px] font-bold tracking-wider text-fog-500 uppercase">Готовые пары</div>
                        <div className="flex flex-wrap gap-1.5">
                          {ROLE_PAIRS.map(([a, b], i) => (
                            <button
                              key={i}
                              title={`${a} → ${b}`}
                              onClick={() => patchRole(currentRole.id, { color: a, c2: b, animated: true })}
                              className="h-6 flex-1 rounded-md transition hover:scale-[1.04]"
                              style={{ backgroundImage: `linear-gradient(100deg, ${a}, ${mixHex(a, b, 0.5)}, ${b})` }}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="mt-3 flex items-center gap-2 rounded-lg bg-ink-950 px-3 py-2.5">
                        <span className="text-[10px] font-bold tracking-wider text-fog-500 uppercase">Так выглядит</span>
                        <GradientName
                          name={currentRole.name || "Никнейм"}
                          c1={currentRole.color}
                          c2={currentRole.c2 ?? mixHex(currentRole.color, "#ffffff", 0.45)}
                          animated={currentRole.animated}
                          className="text-[15px]"
                        />
                        <RoleChip
                          role={{
                            name: currentRole.name || "Роль",
                            c1: currentRole.color,
                            c2: currentRole.c2 ?? currentRole.color,
                          }}
                          className="ml-auto"
                        />
                      </div>
                    </div>
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <div className="text-[10px] font-bold tracking-wider text-fog-500 uppercase">Права роли</div>
                        <span className="rounded-full bg-ink-900 px-2 py-1 text-[10px] font-bold text-fog-400">{currentRole.permissions.length} включено</span>
                      </div>
                      <RolePermissionsEditor value={currentRole.permissions} onChange={(permissions) => patchRole(currentRole.id, { permissions })} />
                    </div>
                    <p className="text-xs leading-relaxed text-fog-500">
                      Роли назначаются участникам из профиля: кликните по человеку в списке участников → «Выбрать роль». Цвет роли
                      красит никнейм на всём сервере, а переливающийся градиент доступен с 2 уровня буста.
                    </p>
                  </div>
                )}
              </div>
            )}

            {section === "emoji" && (
              <div className="mx-auto max-w-xl">
                <p className="mb-4 text-sm text-fog-400">
                  Собственные эмодзи сервера доступны всем участникам. Бусты уровня 1 и 2 добавляют по 50 слотов.
                </p>
                <div className="mb-4 flex items-end gap-2 rounded-xl bg-ink-850 p-3">
                  <div className="w-20">
                    <label className="text-[10px] font-bold tracking-wider text-fog-500 uppercase">Символ</label>
                    <input
                      value={emojiChar}
                      onChange={(e) => setEmojiChar(e.target.value)}
                      maxLength={8}
                      placeholder="🎉"
                      className="mt-1 w-full rounded-lg bg-ink-950 px-2 py-2 text-center text-xl outline-none"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] font-bold tracking-wider text-fog-500 uppercase">Название (без пробелов)</label>
                    <input
                      value={emojiName}
                      onChange={(e) => setEmojiName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addEmoji()}
                      maxLength={24}
                      placeholder="max_party"
                      className="mt-1 w-full rounded-lg bg-ink-950 px-3 py-2.5 text-sm text-fog-100 placeholder-fog-500 outline-none"
                    />
                  </div>
                  <button
                    onClick={addEmoji}
                    disabled={!emojiChar.trim() || !emojiName.trim()}
                    className={cn("flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-bold text-white transition", emojiChar.trim() && emojiName.trim() ? "max-gradient hover:brightness-110" : "cursor-not-allowed bg-ink-600 text-fog-500")}
                  >
                    <Plus className="h-4 w-4" /> Добавить
                  </button>
                </div>
                {(draft.emojis ?? []).length === 0 ? (
                  <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-ink-600 py-10 text-center">
                    <Smile className="h-8 w-8 text-fog-500" />
                    <p className="text-sm text-fog-500">Эмодзи пока нет — добавьте первый!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {(draft.emojis ?? []).map((em) => (
                      <div key={em.id} className="group flex items-center gap-3 rounded-xl bg-ink-850 p-3 transition hover:bg-ink-750">
                        <span className="text-2xl transition group-hover:scale-125">{em.emoji}</span>
                        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-fog-200">:{em.name}:</span>
                        <button
                          onClick={() => setDraft((s) => ({ ...s, emojis: (s.emojis ?? []).filter((x) => x.id !== em.id) }))}
                          title="Удалить эмодзи"
                          className="rounded-lg p-1.5 text-fog-500 opacity-0 transition group-hover:opacity-100 hover:bg-dnd/15 hover:text-dnd"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {section === "moderation" && (
              <div className="mx-auto max-w-xl space-y-4">
                <div className="rounded-xl bg-ink-850 p-4">
                  <div className="flex items-start gap-3">
                    <Gauge className="mt-0.5 h-5 w-5 text-max-300" />
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-white">Медленный режим</h3>
                      <p className="mt-1 text-xs leading-relaxed text-fog-500">Ограничивает частоту сообщений участников в текстовых каналах.</p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {SLOW_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => setDraft((s) => ({ ...s, slowMode: option.value }))}
                            className={cn(
                              "rounded-lg px-3 py-1.5 text-xs font-bold transition",
                              (draft.slowMode ?? 0) === option.value ? "max-gradient text-white" : "bg-ink-950 text-fog-400 hover:text-fog-100"
                            )}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl bg-ink-850 p-4">
                  <h3 className="text-sm font-bold text-white">Фильтр нежелательного контента</h3>
                  <p className="mt-1 text-xs text-fog-500">Автоматически скрывать сообщения с медиавложениями от выбранных групп.</p>
                  <div className="mt-3 space-y-1.5">
                    {([
                      { id: "off", label: "Не фильтровать", desc: "Контент проверяют только модераторы" },
                      { id: "members", label: "Участники без роли", desc: "Рекомендуется для большинства серверов" },
                      { id: "all", label: "Все участники", desc: "Максимальная строгость" },
                    ] as const).map((option) => (
                      <button
                        key={option.id}
                        onClick={() => setDraft((s) => ({ ...s, explicitFilter: option.id }))}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-lg border-2 px-3 py-2.5 text-left transition",
                          (draft.explicitFilter ?? "members") === option.id ? "border-max-500 bg-ink-750" : "border-transparent bg-ink-900 hover:border-ink-500"
                        )}
                      >
                        <span className={cn("flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2", (draft.explicitFilter ?? "members") === option.id ? "border-max-400" : "border-fog-500")}>
                          {(draft.explicitFilter ?? "members") === option.id && <span className="h-2 w-2 rounded-full bg-max-400" />}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-fog-100">{option.label}</span>
                          <span className="block text-xs text-fog-500">{option.desc}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-ink-850 p-4">
                  <div>
                    <h3 className="text-sm font-bold text-white">2FA для модераторов</h3>
                    <p className="mt-0.5 text-xs text-fog-500">Модераторские действия требуют двухфакторной аутентификации</p>
                  </div>
                  <Toggle on={draft.require2fa ?? false} onChange={() => setDraft((s) => ({ ...s, require2fa: !s.require2fa }))} />
                </div>
              </div>
            )}

            {section === "invites" && (
              <div className="mx-auto max-w-xl">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm text-fog-400">Активные ссылки-приглашения на сервер.</p>
                  <button onClick={addInvite} className="max-gradient flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold text-white transition hover:brightness-110">
                    <Plus className="h-3.5 w-3.5" /> Создать приглашение
                  </button>
                </div>
                <div className="space-y-2">
                  {(draft.invites ?? []).map((invite) => (
                    <div key={invite.code} className="flex items-center gap-3 rounded-xl bg-ink-850 p-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-max-500/15 text-max-300"><Link2 className="h-4 w-4" /></span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-mono text-sm font-semibold text-fog-100">max.ru/join/{invite.code}</div>
                        <div className="text-xs text-fog-500">{invite.uses} использований · создано {invite.created}</div>
                      </div>
                      <button
                        onClick={() => { navigator.clipboard?.writeText(`https://max.ru/join/${invite.code}`); toast("Ссылка скопирована", "success"); }}
                        title="Копировать ссылку"
                        className="rounded-lg bg-ink-900 p-2 text-fog-400 transition hover:bg-max-500 hover:text-white"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDraft((s) => ({ ...s, invites: (s.invites ?? []).filter((i) => i.code !== invite.code) }))}
                        title="Отозвать приглашение"
                        className="rounded-lg bg-ink-900 p-2 text-fog-400 transition hover:bg-dnd/15 hover:text-dnd"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  {(draft.invites ?? []).length === 0 && (
                    <p className="rounded-xl border border-dashed border-ink-600 py-10 text-center text-sm text-fog-500">Активных приглашений нет</p>
                  )}
                </div>
              </div>
            )}

            {section === "safety" && (
              <div className="mx-auto max-w-xl space-y-4">
                <div className="rounded-xl bg-ink-850 p-4">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 h-5 w-5 text-max-300" />
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-white">Уровень проверки участников</h3>
                      <p className="mt-1 text-xs leading-relaxed text-fog-500">Определяет, сколько информации нужно подтвердить перед отправкой сообщений.</p>
                      <select value={draft.verification ?? "none"} onChange={(e) => setDraft((s) => ({ ...s, verification: e.target.value as Server["verification"] }))} className="mt-3 w-full rounded-lg bg-ink-950 px-3 py-2.5 text-sm text-fog-100 outline-none">
                        <option value="none">Нет ограничений</option>
                        <option value="low">Низкий · подтверждённая почта</option>
                        <option value="medium">Средний · аккаунт старше 5 минут</option>
                        <option value="high">Высокий · участник сервера 10 минут</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl bg-ink-850 p-4">
                  <div className="flex items-start gap-3">
                    <Bell className="mt-0.5 h-5 w-5 text-max-300" />
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-white">Уведомления по умолчанию</h3>
                      <p className="mt-1 text-xs leading-relaxed text-fog-500">Какие события будут уведомлять участников нового сервера.</p>
                      <select value={draft.notifications ?? "all"} onChange={(e) => setDraft((s) => ({ ...s, notifications: e.target.value as Server["notifications"] }))} className="mt-3 w-full rounded-lg bg-ink-950 px-3 py-2.5 text-sm text-fog-100 outline-none">
                        <option value="all">Все сообщения</option>
                        <option value="mentions">Только @упоминания</option>
                        <option value="nothing">Не уведомлять</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-online/20 bg-online/5 p-3 text-xs text-fog-400">
                  <Check className="h-4 w-4 shrink-0 text-online" /> Изменения применятся после нажатия «Сохранить».
                </div>
              </div>
            )}
          </main>

          <footer className="flex items-center justify-between border-t border-ink-950/50 px-6 py-3.5">
            <span className="text-xs text-fog-500">Изменения ещё не сохранены</span>
            <div className="flex gap-2">
              <button onClick={onClose} className="rounded-lg px-3.5 py-2 text-sm font-semibold text-fog-400 transition hover:bg-ink-700 hover:text-white">Отмена</button>
              <button onClick={save} className="max-gradient rounded-lg px-4 py-2 text-sm font-bold text-white transition hover:brightness-110"><span className="flex items-center gap-1.5"><Check className="h-4 w-4" /> Сохранить</span></button>
            </div>
          </footer>
        </div>
      </div>
    </Modal>
  );
}
