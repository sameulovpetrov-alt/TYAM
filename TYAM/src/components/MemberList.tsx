import { useState } from "react";
import { Gem, Shield, Users } from "lucide-react";
import type { RoleContext, Server, User } from "../data";
import { USERS } from "../data";
import { useSettings } from "../store";
import type { BoostInfo } from "../store";
import { cn } from "../utils/cn";
import { Avatar, NickName, PremiumTag, RoleChip, nickColorsOf } from "./ui";
import BoostPanel from "./BoostPanel";

type Tab = "members" | "boosts";

export default function MemberList({
  server,
  meUser,
  boosters,
  boostInfo,
  boostCredits,
  roles,
  onMessage,
  onOpenBoost,
  onQuickBuyBoost,
  onOpenPopover,
  onUserMenu,
  live = false,
}: {
  server: Server;
  meUser: User;
  boosters: string[];
  boostInfo: BoostInfo;
  boostCredits: number;
  roles?: RoleContext | null;
  onMessage: (userId: string) => void;
  onOpenBoost: () => void;
  onQuickBuyBoost: (count: number, price: number) => void;
  onOpenPopover: (user: User, e: React.MouseEvent) => void;
  onUserMenu: (userId: string, e: React.MouseEvent) => void;
  /** живые аватары — привилегия 3 уровня буста сервера */
  live?: boolean;
}) {
  const { settings } = useSettings();
  const [tab, setTab] = useState<Tab>("members");
  const members: User[] = [meUser, ...server.members.map((id) => USERS[id]).filter(Boolean)];
  const online = members.filter((u) => u.status !== "offline");
  const offline = members.filter((u) => u.status === "offline");

  // группы: сначала назначенные роли сервера (в их порядке), затем остальные
  const groupOf = (u: User) => {
    const assigned = roles?.byUser[u.id] ?? [];
    if (assigned.length) return assigned[0].name;
    return u.role ?? "Участники";
  };
  const order = [...(roles?.roles.map((r) => r.name) ?? []), "Админ", "Модератор", "Менеджер", "Дизайнер", "Разработчик", "Участники"];
  const groups = new Map<string, User[]>();
  for (const u of online) {
    const key = groupOf(u);
    groups.set(key, [...(groups.get(key) ?? []), u]);
  }
  const sorted = [...groups.entries()].sort((a, b) => {
    const ia = order.indexOf(a[0]);
    const ib = order.indexOf(b[0]);
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
  });

  const Row = ({ u }: { u: User }) => {
    const isBooster = boosters.includes(u.id);
    const nick = nickColorsOf(u, roles, settings.nick);
    const assigned = roles?.byUser[u.id] ?? [];
    return (
      <button
        onClick={(e) => onOpenPopover(u, e)}
        onContextMenu={(e) => {
          e.preventDefault();
          onUserMenu(u.id, e);
        }}
        title={`${u.name} · левая кнопка — профиль, правая — меню`}
        className={cn(
          "group flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left transition hover:bg-ink-700/60",
          u.status === "offline" && "opacity-40 hover:opacity-80"
        )}
      >
        <span className={cn("shrink-0 rounded-full", isBooster && "boost-gradient p-[2px]")}>
          <Avatar user={u} size={isBooster ? 28 : 32} ring="ring-ink-850" animated={live} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1 truncate text-[15px] font-medium">
            <NickName name={u.name} colors={nick.colors} animated={nick.animated} gradient={roles?.gradient} />
            {u.premium && <PremiumTag compact />}
            {u.role === "Админ" && <Shield className="h-3.5 w-3.5 shrink-0 text-max-300" />}
            {isBooster && <Gem className="h-3.5 w-3.5 shrink-0 text-boost-1" />}
          </div>
          {assigned.length > 1 ? (
            <div className="mt-0.5 flex flex-wrap gap-1">
              {assigned.slice(1).map((r) => (
                <RoleChip key={r.id} role={r} />
              ))}
            </div>
          ) : (u.activity || u.custom) && u.status !== "offline" ? (
            <div className="truncate text-xs text-fog-500">{u.activity ?? u.custom}</div>
          ) : null}
        </div>
        <span
          title="Написать сообщение"
          onClick={(e) => {
            e.stopPropagation();
            onMessage(u.id);
          }}
          className="ml-auto flex shrink-0 rounded-full bg-ink-900 p-1.5 text-fog-400 opacity-0 transition hover:max-gradient hover:text-white group-hover:opacity-100"
        >
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current">
            <path d="M12 2C6.48 2 2 5.94 2 10.8c0 2.78 1.46 5.25 3.75 6.86-.13 1.1-.55 2.4-1.5 3.34 0 0 2.36-.17 4.34-1.53 1.06.34 2.21.53 3.41.53 5.52 0 10-3.94 10-8.8S17.52 2 12 2z" />
          </svg>
        </span>
      </button>
    );
  };

  return (
    <aside className="hidden w-60 shrink-0 flex-col overflow-hidden bg-ink-850 lg:flex">
      <div className="flex shrink-0 border-b border-ink-950/50 bg-ink-850 p-2">
        <button
          onClick={() => setTab("members")}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition",
            tab === "members" ? "bg-ink-600 text-white" : "text-fog-500 hover:bg-ink-700 hover:text-fog-100"
          )}
        >
          <Users className="h-3.5 w-3.5" /> Участники
        </button>
        <button
          onClick={() => setTab("boosts")}
          className={cn(
            "relative flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition",
            tab === "boosts" ? "bg-boost-2/20 text-boost-1" : "text-fog-500 hover:bg-ink-700 hover:text-fog-100"
          )}
        >
          <Gem className="h-3.5 w-3.5" /> Бусты
          {(boostInfo.events ?? []).some((event) => Date.now() - event.at < 45000) && tab !== "boosts" && (
            <span className="absolute top-1 right-4 h-1.5 w-1.5 rounded-full bg-online" />
          )}
        </button>
      </div>

      {tab === "boosts" ? (
        <div className="min-h-0 flex-1 overflow-y-auto pt-3">
          <BoostPanel
            server={server}
            info={boostInfo}
            credits={boostCredits}
            meName={meUser.name}
            onOpenBoost={onOpenBoost}
            onQuickBuy={onQuickBuyBoost}
          />
        </div>
      ) : (
      <div className="min-h-0 flex-1 overflow-y-auto px-2 pt-5">
      {sorted.map(([role, users]) => (
        <div key={role} className="mb-5">
          <div className="px-2 pb-1 text-[11px] font-bold tracking-wider text-fog-500 uppercase">
            {role} — {users.length}
          </div>
          {users.map((u) => (
            <Row key={u.id} u={u} />
          ))}
        </div>
      ))}
      {offline.length > 0 && (
        <div className="mb-5">
          <div className="px-2 pb-1 text-[11px] font-bold tracking-wider text-fog-500 uppercase">Не в сети — {offline.length}</div>
          {offline.map((u) => (
            <Row key={u.id} u={u} />
          ))}
        </div>
      )}
      </div>
      )}
    </aside>
  );
}
