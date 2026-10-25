import { useEffect, useMemo, useState } from "react";
import {
  Bot,
  Check,
  Hash,
  Lock,
  Plus,
  RotateCcw,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  Volume2,
  Webhook,
  X,
} from "lucide-react";
import type { Channel, ChannelPermissionOverride, Server } from "../data";
import { DEFAULT_SERVER_ROLES, USERS } from "../data";
import { cn } from "../utils/cn";
import { ChannelPermissionEditor } from "./PermissionEditors";
import { Avatar } from "./ui";

type Section = "overview" | "permissions" | "integrations";
type Target = { type: "role" | "member"; id: string };

const SLOW_OPTIONS = [
  { value: 0, label: "Выключен" },
  { value: 5, label: "5 секунд" },
  { value: 10, label: "10 секунд" },
  { value: 30, label: "30 секунд" },
  { value: 60, label: "1 минута" },
  { value: 120, label: "2 минуты" },
  { value: 300, label: "5 минут" },
  { value: 900, label: "15 минут" },
];

const HIDE_OPTIONS: { value: NonNullable<Channel["hideAfter"]>; label: string; desc: string }[] = [
  { value: "never", label: "Никогда", desc: "Канал всегда виден в списке" },
  { value: "1d", label: "1 день", desc: "Скрывать после суток без активности" },
  { value: "3d", label: "3 дня", desc: "Скрывать после трёх дней без активности" },
  { value: "1w", label: "1 неделя", desc: "Скрывать после недели без активности" },
];

function Toggle({ on, onChange, disabled = false }: { on: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={onChange}
      className={cn(
        "flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition",
        disabled ? "cursor-not-allowed bg-ink-600 opacity-50" : on ? "max-gradient justify-end" : "justify-start bg-ink-600"
      )}
    >
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white shadow">{on && <Check className="h-3 w-3 text-max-600" />}</span>
    </button>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-[10px] font-bold tracking-wider text-fog-500 uppercase">{children}</div>;
}

function SettingRow({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-5 border-t border-ink-700/60 py-4 first:border-t-0 first:pt-0">
      <div className="min-w-0">
        <div className="text-[13px] font-semibold text-fog-100">{title}</div>
        <p className="mt-0.5 text-[11px] leading-snug text-fog-500">{desc}</p>
      </div>
      {children}
    </div>
  );
}

export default function ChannelSettingsView({
  server,
  channel,
  memberRoleIds,
  onSave,
  onDelete,
  onClose,
}: {
  server: Server;
  channel: Channel;
  memberRoleIds: Record<string, string[]>;
  onSave: (channel: Channel) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const [section, setSection] = useState<Section>("overview");
  const [draft, setDraft] = useState<Channel>(() => structuredClone(channel));
  const [target, setTarget] = useState<Target>({ type: "role", id: "everyone" });
  const [addOpen, setAddOpen] = useState(false);
  const [topic, setTopic] = useState(channel.topic ?? "");

  const category = server.categories.find((cat) => cat.channels.some((ch) => ch.id === channel.id));
  const roles = server.roles ?? DEFAULT_SERVER_ROLES;
  const members = server.members.map((id) => USERS[id]).filter(Boolean);
  const overrides = draft.overrides ?? [];
  const targetKey = `${target.type}:${target.id}`;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const targetLabel = useMemo(() => {
    if (target.type === "role") {
      if (target.id === "everyone") return "@everyone";
      return roles.find((role) => role.id === target.id)?.name ?? "Роль";
    }
    return members.find((member) => member.id === target.id)?.name ?? "Участник";
  }, [target, roles, members]);

  const inheritedPermissions = useMemo(() => {
    if (target.type === "role") {
      if (target.id === "everyone") return roles.find((role) => role.name === "Участник")?.permissions ?? [];
      return roles.find((role) => role.id === target.id)?.permissions ?? [];
    }
    const ids = memberRoleIds[target.id] ?? [];
    return roles.filter((role) => ids.includes(role.id)).flatMap((role) => role.permissions);
  }, [target, roles, memberRoleIds]);

  const override = useMemo<ChannelPermissionOverride>(() => {
    return (
      overrides.find((entry) => entry.subjectType === target.type && entry.subjectId === target.id) ?? {
        id: `ov-${targetKey}`,
        subjectType: target.type,
        subjectId: target.id,
        allow: [],
        deny: [],
      }
    );
  }, [overrides, target, targetKey]);

  const setOverride = (next: ChannelPermissionOverride) => {
    setDraft((current) => {
      const existing = current.overrides ?? [];
      const hasRules = next.allow.length > 0 || next.deny.length > 0;
      const filtered = existing.filter((entry) => !(entry.subjectType === next.subjectType && entry.subjectId === next.subjectId));
      return { ...current, overrides: hasRules ? [...filtered, next] : filtered };
    });
  };

  const addTarget = (next: Target) => {
    setTarget(next);
    setAddOpen(false);
    setDraft((current) => {
      const exists = (current.overrides ?? []).some((entry) => entry.subjectType === next.type && entry.subjectId === next.id);
      if (exists) return current;
      return {
        ...current,
        overrides: [
          ...(current.overrides ?? []),
          { id: `ov-${next.type}-${next.id}`, subjectType: next.type, subjectId: next.id, allow: [], deny: [] },
        ],
      };
    });
  };

  const removeTarget = (entry: ChannelPermissionOverride) => {
    setDraft((current) => ({
      ...current,
      overrides: (current.overrides ?? []).filter((override) => override.id !== entry.id),
    }));
    if (target.type === entry.subjectType && target.id === entry.subjectId) setTarget({ type: "role", id: "everyone" });
  };

  const save = () => {
    const name = draft.name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^\p{L}\p{N}_-]/gu, "");
    if (!name) return;
    onSave({ ...draft, name, topic: draft.type === "text" ? topic.trim() : undefined });
    onClose();
  };

  const nav: { id: Section; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "Обзор", icon: <SlidersHorizontal className="h-4 w-4" /> },
    { id: "permissions", label: "Права доступа", icon: <ShieldCheck className="h-4 w-4" /> },
    { id: "integrations", label: "Интеграции", icon: <Bot className="h-4 w-4" /> },
  ];

  const selectedOverrides = [
    { id: "everyone", subjectType: "role" as const, subjectId: "everyone", allow: [], deny: [] },
    ...overrides,
  ];

  return (
    <div className="fixed inset-0 z-[60] flex bg-ink-800 fade-in">
      <aside className="flex w-72 shrink-0 flex-col bg-ink-950">
        <div className="border-b border-ink-700/50 px-5 py-6">
          <div className="flex items-center gap-2 text-[11px] font-bold tracking-wider text-fog-500 uppercase">
            {channel.type === "text" ? <Hash className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
            {server.name}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-sm font-bold text-fog-100">
            {channel.type === "text" ? <Hash className="h-4 w-4 text-fog-500" /> : <Volume2 className="h-4 w-4 text-fog-500" />}
            {channel.name}
            {category && <span className="text-fog-500">· {category.name}</span>}
          </div>
        </div>
        <nav className="flex-1 px-3 py-4">
          {nav.map((item) => (
            <button
              key={item.id}
              onClick={() => setSection(item.id)}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition",
                section === item.id ? "bg-ink-600 font-semibold text-white" : "text-fog-400 hover:bg-ink-800 hover:text-fog-100"
              )}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </nav>
        <div className="border-t border-ink-700/50 p-3">
          <button onClick={onDelete} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-dnd transition hover:bg-dnd/10">
            <Trash2 className="h-4 w-4" /> Удалить канал
          </button>
        </div>
      </aside>

      <main className="relative min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-8 py-8 pb-28">
          <div className="mb-7 flex items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl font-bold text-white">
                {section === "overview" ? "Обзор" : section === "permissions" ? "Права канала" : "Интеграции"}
              </h1>
              <p className="mt-1 text-sm text-fog-500">
                {section === "overview"
                  ? "Название, тема, медленный режим и видимость канала"
                  : section === "permissions"
                    ? "Настройте доступ ролей и отдельных участников к этому каналу"
                    : "Приложения и вебхуки для автоматизации этого канала"}
              </p>
            </div>
            <button onClick={onClose} title="Закрыть настройки (Esc)" className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-ink-600 text-fog-400 transition hover:rotate-90 hover:border-fog-400 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>

          {section === "overview" && (
            <div className="space-y-5">
              <section className="rounded-xl bg-ink-850 p-5">
                <FieldLabel>Название канала</FieldLabel>
                <div className="mt-2 flex items-center gap-2 rounded-lg bg-ink-950 px-3">
                  {draft.type === "text" ? <Hash className="h-4 w-4 text-fog-500" /> : <Volume2 className="h-4 w-4 text-fog-500" />}
                  <input value={draft.name} onChange={(e) => setDraft((channel) => ({ ...channel, name: e.target.value }))} maxLength={50} className="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-fog-100 outline-none" />
                </div>
                {draft.type === "text" && (
                  <>
                    <FieldLabel>Тема канала</FieldLabel>
                    <textarea value={topic} onChange={(e) => setTopic(e.target.value)} rows={4} maxLength={1024} placeholder="Расскажите участникам, как пользоваться этим каналом" className="mt-2 w-full resize-none rounded-lg bg-ink-950 px-3.5 py-3 text-sm text-fog-100 placeholder-fog-500 outline-none ring-max-500/0 transition focus:ring-2 focus:ring-max-500/60" />
                    <div className="mt-1 text-right text-[11px] tabular-nums text-fog-500">{topic.length}/1024</div>
                  </>
                )}
              </section>

              <section className="rounded-xl bg-ink-850 p-5">
                {draft.type === "text" && (
                  <SettingRow title="Медленный режим" desc="Участники без права обхода смогут писать не чаще указанного интервала.">
                    <select value={draft.slowMode ?? 0} onChange={(e) => setDraft((channel) => ({ ...channel, slowMode: Number(e.target.value) }))} className="w-40 rounded-lg bg-ink-950 px-3 py-2 text-xs text-fog-100 outline-none">
                      {SLOW_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </SettingRow>
                )}
                <SettingRow title="Видимость содержимого" desc="Отметьте канал как содержащий спойлеры: участники увидят предупреждение перед чтением.">
                  <Toggle on={draft.spoilerContent ?? false} onChange={() => setDraft((channel) => ({ ...channel, spoilerContent: !channel.spoilerContent }))} />
                </SettingRow>
                <SettingRow title="Скрывать после неактивности" desc="Новые ветки и каналы перестанут отображаться в списке после периода без активности.">
                  <select value={draft.hideAfter ?? "never"} onChange={(e) => setDraft((channel) => ({ ...channel, hideAfter: e.target.value as Channel["hideAfter"] }))} className="w-40 rounded-lg bg-ink-950 px-3 py-2 text-xs text-fog-100 outline-none">
                    {HIDE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </SettingRow>
                {draft.type === "voice" && (
                  <SettingRow title="Статус голосового канала" desc="Участники с правом смогут менять описание активного созвона.">
                    <span className="rounded-full bg-online/15 px-2.5 py-1 text-xs font-bold text-online">Доступно</span>
                  </SettingRow>
                )}
              </section>
            </div>
          )}

          {section === "permissions" && (
            <div className="space-y-5">
              <section className="overflow-hidden rounded-xl bg-ink-850">
                <div className="flex items-start justify-between gap-4 p-5">
                  <div className="flex items-start gap-3">
                    <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", draft.private ? "bg-max-500/20 text-max-300" : "bg-ink-700 text-fog-300")}><Lock className="h-4 w-4" /></span>
                    <div><div className="text-sm font-bold text-white">Приватный канал</div><p className="mt-0.5 text-[11px] leading-snug text-fog-500">Если включено, доступ получают только роли и участники, добавленные ниже.</p></div>
                  </div>
                  <Toggle on={draft.private ?? false} onChange={() => setDraft((value) => ({ ...value, private: !value.private }))} />
                </div>
                <div className="border-t border-ink-700/60 px-5 py-3">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[11px] text-fog-500">{draft.synced ? `Права синхронизированы с категорией «${category?.name ?? "без категории"}»` : "Права настроены отдельно для этого канала"}</span>
                    <button onClick={() => setDraft((value) => ({ ...value, synced: !value.synced, overrides: value.synced ? value.overrides : [] }))} className="flex shrink-0 items-center gap-1 rounded-lg bg-ink-700 px-2.5 py-1.5 text-[11px] font-bold text-fog-200 transition hover:bg-ink-600"><RotateCcw className="h-3.5 w-3.5" /> {draft.synced ? "Сделать независимым" : "Синхронизировать"}</button>
                  </div>
                </div>
              </section>

              {draft.synced ? (
                <section className="rounded-xl border border-max-500/25 bg-max-500/5 p-5">
                  <div className="flex items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-max-500/15 text-max-300"><RotateCcw className="h-4 w-4" /></span><div><h2 className="text-sm font-bold text-white">Права синхронизированы с категорией</h2><p className="mt-1 text-[11px] leading-relaxed text-fog-400">Сделайте канал независимым, чтобы добавить роли, участников и отдельные переопределения доступа.</p><button onClick={() => setDraft((value) => ({ ...value, synced: false }))} className="max-gradient mt-3 rounded-lg px-3 py-2 text-xs font-bold text-white transition hover:brightness-110">Сделать независимым</button></div></div>
                </section>
              ) : (
                <>
                  <section className="rounded-xl bg-ink-850 p-5">
                    <div className="flex items-center justify-between gap-3"><div><div className="text-sm font-bold text-white">Кто может получать доступ к этому каналу?</div><p className="mt-0.5 text-[11px] text-fog-500">Добавьте роль или отдельного участника, затем настройте его права.</p></div><button onClick={() => setAddOpen((value) => !value)} className="max-gradient flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-bold text-white transition hover:brightness-110"><Plus className="h-3.5 w-3.5" /> Добавить</button></div>
                    {addOpen && (
                      <div className="mt-3 grid gap-3 rounded-xl border border-ink-600/50 bg-ink-900 p-3 sm:grid-cols-2">
                        <div><FieldLabel>Роли</FieldLabel><div className="mt-1.5 space-y-1">{roles.map((role) => <button key={role.id} onClick={() => addTarget({ type: "role", id: role.id })} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition hover:bg-ink-700"><span className="h-3 w-3 rounded-full" style={{ backgroundImage: `linear-gradient(120deg, ${role.color}, ${role.c2 ?? role.color})` }} /><span className="truncate text-xs font-semibold text-fog-100">{role.name}</span></button>)}</div></div>
                        <div><FieldLabel>Участники</FieldLabel><div className="mt-1.5 space-y-1">{members.map((member) => <button key={member.id} onClick={() => addTarget({ type: "member", id: member.id })} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition hover:bg-ink-700"><Avatar user={member} size={20} showStatus={false} /><span className="truncate text-xs font-semibold text-fog-100">{member.name}</span></button>)}{members.length === 0 && <p className="px-2 py-2 text-xs text-fog-500">На сервере пока нет приглашённых участников</p>}</div></div>
                      </div>
                    )}
                    <div className="mt-4 space-y-1.5 border-t border-ink-700 pt-3">
                      {selectedOverrides.map((entry) => {
                        const isActive = entry.subjectType === target.type && entry.subjectId === target.id;
                        const role = entry.subjectType === "role" ? roles.find((item) => item.id === entry.subjectId) : null;
                        const member = entry.subjectType === "member" ? members.find((item) => item.id === entry.subjectId) : null;
                        const label = entry.subjectId === "everyone" ? "@everyone" : role?.name ?? member?.name ?? "Участник";
                        return <div key={`${entry.subjectType}-${entry.subjectId}`} className={cn("flex items-center gap-3 rounded-lg px-2.5 py-2 transition", isActive ? "bg-ink-700" : "hover:bg-ink-800")}><button onClick={() => setTarget({ type: entry.subjectType, id: entry.subjectId })} className="flex min-w-0 flex-1 items-center gap-2 text-left">{entry.subjectType === "member" && member ? <Avatar user={member} size={24} showStatus={false} /> : <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink-600 text-[10px] font-extrabold text-fog-200">{entry.subjectId === "everyone" ? "@" : "R"}</span>}<span className="min-w-0"><span className="block truncate text-xs font-bold text-fog-100">{label}</span><span className="block text-[10px] text-fog-500">{entry.subjectType === "role" ? "Роль" : "Участник"}</span></span></button>{entry.subjectId !== "everyone" && <button onClick={() => removeTarget(entry)} title="Убрать переопределение" className="rounded-md p-1 text-fog-500 transition hover:bg-dnd/15 hover:text-dnd"><X className="h-3.5 w-3.5" /></button>}</div>;
                      })}
                    </div>
                  </section>
                  <section>
                    <div className="mb-2 flex items-center justify-between"><div><h2 className="text-sm font-bold text-white">Расширенные права · {targetLabel}</h2><p className="mt-0.5 text-[11px] text-fog-500">Выберите запрет, наследование или явное разрешение для каждого действия.</p></div><span className="rounded-full bg-ink-850 px-2.5 py-1 text-[10px] font-bold text-fog-400">{draft.type === "text" ? "Текстовый" : "Голосовой"}</span></div>
                    <ChannelPermissionEditor type={draft.type} override={override} inheritedPermissions={inheritedPermissions} onChange={setOverride} />
                  </section>
                </>
              )}
            </div>
          )}

          {section === "integrations" && (
            <div className="space-y-5">
              <section className="rounded-xl bg-ink-850 p-5">
                <SettingRow title="Команды приложений" desc="Разрешить приложениям использовать слэш-команды и контекстное меню в этом канале.">
                  <Toggle on={draft.appsEnabled ?? true} onChange={() => setDraft((channel) => ({ ...channel, appsEnabled: !(channel.appsEnabled ?? true) }))} />
                </SettingRow>
                <SettingRow title="Вебхуки" desc="Разрешить интеграциям отправлять сообщения в этот канал от своего имени.">
                  <Toggle on={draft.webhooksEnabled ?? false} onChange={() => setDraft((channel) => ({ ...channel, webhooksEnabled: !(channel.webhooksEnabled ?? false) }))} />
                </SettingRow>
              </section>
              <section className="rounded-xl border border-dashed border-ink-600 bg-ink-850 p-5">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ink-900 text-max-300"><Webhook className="h-4 w-4" /></span>
                  <div>
                    <h2 className="text-sm font-bold text-white">Интеграции появятся здесь</h2>
                    <p className="mt-1 text-[11px] leading-relaxed text-fog-500">Подключите приложение или вебхук в настройках сервера. Права этого канала ограничат его доступ автоматически.</p>
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>

        <footer className="fixed right-0 bottom-0 left-72 z-10 flex items-center justify-between border-t border-ink-700/60 bg-ink-850/95 px-8 py-4 backdrop-blur">
          <span className="text-xs text-fog-500">Изменения применятся после сохранения</span>
          <div className="flex gap-2">
            <button onClick={onClose} className="rounded-lg px-3.5 py-2 text-sm font-semibold text-fog-400 transition hover:bg-ink-700 hover:text-white">Отмена</button>
            <button onClick={save} disabled={!draft.name.trim()} className={cn("flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-bold text-white transition", draft.name.trim() ? "max-gradient hover:brightness-110 active:scale-[0.98]" : "cursor-not-allowed bg-ink-600 text-fog-500")}>
              <Check className="h-4 w-4" /> Сохранить изменения
            </button>
          </div>
        </footer>
      </main>
    </div>
  );
}