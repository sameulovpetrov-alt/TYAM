import { useMemo, useState } from "react";
import { Check, Minus, RotateCcw, Search, ShieldAlert, X } from "lucide-react";
import { ALL_PERMISSION_IDS, PERMISSION_GROUPS, permissionsForChannelType } from "../permissions";
import type { PermissionDefinition, PermissionGroup } from "../permissions";
import type { ChannelPermissionOverride } from "../data";
import { cn } from "../utils/cn";

function MiniToggle({ value, onToggle, disabled = false }: { value: boolean; onToggle: () => void; disabled?: boolean }) {
  return (
    <button
      role="switch"
      aria-checked={value}
      disabled={disabled}
      onClick={onToggle}
      className={cn(
        "flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition",
        disabled ? "cursor-not-allowed bg-ink-700 opacity-45" : value ? "max-gradient justify-end" : "justify-start bg-ink-600"
      )}
    >
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white shadow">
        {value && <Check className="h-3 w-3 text-max-600" />}
      </span>
    </button>
  );
}

function GroupTitle({ group, count }: { group: PermissionGroup; count?: string }) {
  return (
    <div className="sticky top-0 z-10 border-y border-ink-700/70 bg-ink-850/95 px-4 py-3 backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-extrabold tracking-[0.12em] text-fog-300 uppercase">{group.label}</div>
          <p className="mt-0.5 text-[11px] text-fog-500">{group.description}</p>
        </div>
        {count && <span className="rounded-full bg-ink-700 px-2 py-1 text-[10px] font-bold text-fog-400">{count}</span>}
      </div>
    </div>
  );
}

function PermissionInfo({ permission }: { permission: PermissionDefinition }) {
  return (
    <div className="min-w-0">
      <div className="text-[13px] font-semibold text-fog-100">{permission.label}</div>
      <p className="mt-0.5 text-[11px] leading-snug text-fog-500">{permission.description}</p>
    </div>
  );
}

/** Полный редактор серверных прав для роли */
export function RolePermissionsEditor({ value, onChange }: { value: string[]; onChange: (next: string[]) => void }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const groups = useMemo(
    () =>
      PERMISSION_GROUPS.map((group) => ({
        ...group,
        permissions: group.permissions.filter((permission) => {
          const haystack = `${permission.label} ${permission.description} ${group.label}`.toLowerCase();
          return !q || haystack.includes(q);
        }),
      })).filter((group) => group.permissions.length > 0),
    [q]
  );
  const has = (id: string) => value.includes(id);
  const isAdmin = has("advanced.administrator");

  const setPermission = (id: string, enabled: boolean) => {
    if (id === "advanced.administrator") {
      onChange(enabled ? [...new Set([...value, ...ALL_PERMISSION_IDS])] : value.filter((permission) => permission !== id));
      return;
    }
    onChange(enabled ? [...new Set([...value, id])] : value.filter((permission) => permission !== id));
  };

  return (
    <div className="overflow-hidden rounded-xl bg-ink-850">
      <div className="border-b border-ink-700 p-3">
        <div className="flex items-center gap-2 rounded-lg bg-ink-950 px-2.5">
          <Search className="h-3.5 w-3.5 text-fog-500" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Поиск прав" className="min-w-0 flex-1 bg-transparent py-2 text-xs text-fog-100 placeholder-fog-500 outline-none" />
          {query && <button onClick={() => setQuery("")} className="rounded p-0.5 text-fog-500 hover:text-white"><X className="h-3.5 w-3.5" /></button>}
        </div>
        <div className="mt-2 flex gap-2">
          <button onClick={() => onChange(ALL_PERMISSION_IDS)} className="flex items-center gap-1 rounded-md bg-ink-700 px-2 py-1 text-[10px] font-bold text-fog-200 transition hover:bg-ink-600"><Check className="h-3 w-3" /> Разрешить все</button>
          <button onClick={() => onChange([])} className="flex items-center gap-1 rounded-md bg-ink-700 px-2 py-1 text-[10px] font-bold text-fog-400 transition hover:bg-ink-600 hover:text-white"><RotateCcw className="h-3 w-3" /> Сбросить</button>
          <span className="ml-auto pt-1 text-[10px] tabular-nums text-fog-500">{value.length}/{ALL_PERMISSION_IDS.length}</span>
        </div>
      </div>

      {isAdmin && (
        <div className="mx-3 mt-3 flex items-start gap-2 rounded-lg border border-dnd/30 bg-dnd/10 p-2.5 text-[11px] leading-snug text-fog-300">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-dnd" />
          Администратор обходит все ограничения каналов. Отключите право, если хотите настраивать доступ точечно.
        </div>
      )}

      <div className="max-h-[52vh] overflow-y-auto">
        {groups.map((group) => (
          <section key={group.id}>
            <GroupTitle group={group} count={`${group.permissions.filter((permission) => has(permission.id)).length}/${group.permissions.length}`} />
            <div className="px-4">
              {group.permissions.map((permission) => {
                const enabled = has(permission.id);
                return (
                  <div key={permission.id} className="flex items-center gap-4 border-b border-ink-700/60 py-3.5 last:border-b-0">
                    <PermissionInfo permission={permission} />
                    <MiniToggle value={enabled || (isAdmin && permission.id !== "advanced.administrator")} disabled={isAdmin && permission.id !== "advanced.administrator"} onToggle={() => setPermission(permission.id, !enabled)} />
                  </div>
                );
              })}
            </div>
          </section>
        ))}
        {groups.length === 0 && <p className="p-8 text-center text-sm text-fog-500">Нет прав по этому запросу</p>}
      </div>
    </div>
  );
}

type OverrideState = "allow" | "deny" | "neutral";

function PermissionTriState({ value, inherited, onChange }: { value: OverrideState; inherited: boolean; onChange: (state: OverrideState) => void }) {
  const options: { id: OverrideState; title: string; icon: React.ReactNode; className: string }[] = [
    { id: "deny", title: "Запретить", icon: <X className="h-3.5 w-3.5" />, className: "text-dnd" },
    { id: "neutral", title: inherited ? "Наследуется: разрешено" : "Наследуется: не задано", icon: <Minus className="h-3.5 w-3.5" />, className: "text-fog-400" },
    { id: "allow", title: "Разрешить", icon: <Check className="h-3.5 w-3.5" />, className: "text-online" },
  ];
  return (
    <div className="flex shrink-0 rounded-lg bg-ink-950 p-0.5">
      {options.map((option) => (
        <button
          key={option.id}
          onClick={() => onChange(option.id)}
          title={option.title}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-md transition",
            option.id === value
              ? option.id === "allow"
                ? "bg-online/20 text-online"
                : option.id === "deny"
                  ? "bg-dnd/20 text-dnd"
                  : "bg-ink-600 text-fog-100"
              : cn("hover:bg-ink-700", option.className)
          )}
        >
          {option.icon}
        </button>
      ))}
    </div>
  );
}

/** Переопределения доступа для конкретной роли/участника в канале */
export function ChannelPermissionEditor({
  type,
  override,
  inheritedPermissions,
  onChange,
}: {
  type: "text" | "voice";
  override: ChannelPermissionOverride;
  inheritedPermissions: string[];
  onChange: (override: ChannelPermissionOverride) => void;
}) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const groups = useMemo(
    () =>
      permissionsForChannelType(type)
        .map((group) => ({
          ...group,
          permissions: group.permissions.filter((permission) => {
            const haystack = `${permission.label} ${permission.description} ${group.label}`.toLowerCase();
            return !q || haystack.includes(q);
          }),
        }))
        .filter((group) => group.permissions.length > 0),
    [q, type]
  );

  const state = (permissionId: string): OverrideState => {
    if (override.allow.includes(permissionId)) return "allow";
    if (override.deny.includes(permissionId)) return "deny";
    return "neutral";
  };
  const inherited = (permissionId: string) => inheritedPermissions.includes("advanced.administrator") || inheritedPermissions.includes(permissionId);
  const change = (permissionId: string, next: OverrideState) => {
    const allow = override.allow.filter((id) => id !== permissionId);
    const deny = override.deny.filter((id) => id !== permissionId);
    if (next === "allow") allow.push(permissionId);
    if (next === "deny") deny.push(permissionId);
    onChange({ ...override, allow, deny });
  };

  return (
    <div className="overflow-hidden rounded-xl bg-ink-850">
      <div className="border-b border-ink-700 p-3">
        <div className="flex items-center gap-2 rounded-lg bg-ink-950 px-2.5">
          <Search className="h-3.5 w-3.5 text-fog-500" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Поиск права канала" className="min-w-0 flex-1 bg-transparent py-2 text-xs text-fog-100 placeholder-fog-500 outline-none" />
          {query && <button onClick={() => setQuery("")} className="text-fog-500 hover:text-white"><X className="h-3.5 w-3.5" /></button>}
        </div>
        <div className="mt-2 flex items-center gap-2 text-[10px] text-fog-500">
          <span className="flex items-center gap-1 text-dnd"><X className="h-3 w-3" /> запретить</span>
          <span className="flex items-center gap-1"><Minus className="h-3 w-3" /> наследовать</span>
          <span className="flex items-center gap-1 text-online"><Check className="h-3 w-3" /> разрешить</span>
          <button onClick={() => onChange({ ...override, allow: [], deny: [] })} className="ml-auto flex items-center gap-1 font-bold text-fog-400 hover:text-white"><RotateCcw className="h-3 w-3" /> Сбросить</button>
        </div>
      </div>

      <div className="max-h-[52vh] overflow-y-auto">
        {groups.map((group) => (
          <section key={group.id}>
            <GroupTitle group={group} />
            <div className="px-4">
              {group.permissions.map((permission) => (
                <div key={permission.id} className="flex items-center gap-4 border-b border-ink-700/60 py-3.5 last:border-b-0">
                  <PermissionInfo permission={permission} />
                  <PermissionTriState value={state(permission.id)} inherited={inherited(permission.id)} onChange={(next) => change(permission.id, next)} />
                </div>
              ))}
            </div>
          </section>
        ))}
        {groups.length === 0 && <p className="p-8 text-center text-sm text-fog-500">Нет прав по этому запросу</p>}
      </div>
    </div>
  );
}