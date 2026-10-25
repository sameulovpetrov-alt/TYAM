import { useState } from "react";
import { Check, ChevronDown, Palette, ShieldCheck, X } from "lucide-react";
import type { ResolvedRole } from "../data";
import { cn } from "../utils/cn";
import { GradientName, RoleChip, mixHex } from "./ui";

export default function RolePicker({
  roles,
  assigned,
  onToggle,
  onClear,
  canManage = true,
}: {
  roles: ResolvedRole[];
  assigned: string[];
  onToggle: (roleId: string) => void;
  onClear: () => void;
  canManage?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const chosen = roles.filter((r) => assigned.includes(r.id));

  if (!roles.length) {
    return (
      <div className="rounded-xl bg-ink-850 p-3 text-xs text-fog-500">
        На этом сервере ещё нет ролей — создайте их в настройках сервера.
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-ink-850 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-fog-500 uppercase">
          <ShieldCheck className="h-3.5 w-3.5" /> Роли — {chosen.length}
        </span>
        {canManage && (
          <button
            onClick={() => setOpen((v) => !v)}
            className={cn(
              "flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold transition",
              open ? "max-gradient text-white" : "bg-ink-700 text-fog-200 hover:bg-ink-600"
            )}
          >
            <Palette className="h-3 w-3" /> Выбрать роль
            <ChevronDown className={cn("h-3 w-3 transition-transform", open && "rotate-180")} />
          </button>
        )}
      </div>

      {chosen.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {chosen.map((role) => (
            <RoleChip key={role.id} role={role} />
          ))}
          {canManage && (
            <button onClick={onClear} className="rounded-full px-2 py-0.5 text-[10px] font-bold text-fog-500 transition hover:bg-dnd/15 hover:text-dnd">
              снять все
            </button>
          )}
        </div>
      ) : (
        <p className="mt-1.5 text-xs text-fog-500">Роли не назначены — участник в группе «Участники».</p>
      )}

      {open && canManage && (
        <div className="mt-2.5 space-y-1 border-t border-ink-700 pt-2.5">
          {roles.map((role) => {
            const on = assigned.includes(role.id);
            return (
              <button
                key={role.id}
                onClick={() => onToggle(role.id)}
                className={cn(
                  "group flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition",
                  on ? "bg-ink-700" : "hover:bg-ink-750"
                )}
              >
                <span
                  className={cn(
                    "flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded border-2 transition",
                    on ? "border-transparent text-white" : "border-ink-500 text-transparent group-hover:border-fog-400"
                  )}
                  style={on ? { backgroundImage: `linear-gradient(120deg, ${role.c1}, ${role.c2})` } : undefined}
                >
                  <Check className="h-3 w-3" />
                </span>
                <span className="min-w-0 flex-1">
                  <GradientName
                    name={role.name}
                    c1={role.c1}
                    c2={role.c2}
                    animated={role.animated}
                    className="block truncate text-[13px]"
                  />
                  <span className="mt-0.5 block truncate text-[10px] text-fog-500">
                    {role.animated ? "переливающийся градиент · " : "градиент · "}
                    {role.c1.toUpperCase()} → {role.c2.toUpperCase()}
                  </span>
                </span>
                <span
                  className="h-6 w-10 shrink-0 rounded-md"
                  style={{
                    backgroundImage: `linear-gradient(100deg, ${role.c1}, ${mixHex(role.c1, role.c2, 0.5)}, ${role.c2})`,
                    boxShadow: `0 0 10px ${mixHex(role.c2, "#000000", 0.25)}55`,
                  }}
                />
              </button>
            );
          })}
          <div className="flex items-center justify-between pt-1 text-[10px] text-fog-500">
            <span>Можно выбрать несколько ролей сразу</span>
            <button onClick={() => setOpen(false)} className="flex items-center gap-1 font-bold text-fog-300 transition hover:text-white">
              <X className="h-3 w-3" /> готово
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
