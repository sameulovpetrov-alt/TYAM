import { useMemo, useState } from "react";
import { Check, MessageCircle, Search, UserPlus, UserRoundPlus, UserRoundX, Users, X } from "lucide-react";
import type { FriendRequest, User } from "../data";
import { USERS } from "../data";
import { cn } from "../utils/cn";
import { Avatar, STATUS_LABEL } from "./ui";
import { Modal } from "./Modal";

type Tab = "online" | "all" | "pending";

interface Props {
  friendIds: string[];
  requests: FriendRequest[];
  onSendRequest: (id: string) => void;
  onAcceptRequest: (id: string) => void;
  onDeclineRequest: (id: string) => void;
  onRemoveFriend: (id: string) => void;
  onMessage: (id: string) => void;
  onOpenPopover: (user: User, e: React.MouseEvent) => void;
  onCreateServer: () => void;
}

export default function FriendsView(p: Props) {
  const [tab, setTab] = useState<Tab>("online");
  const [query, setQuery] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [addQuery, setAddQuery] = useState("");

  const friends = useMemo(() => p.friendIds.map((id) => USERS[id]).filter(Boolean), [p.friendIds]);
  const visibleFriends = friends
    .filter((u) => (tab === "online" ? u.status !== "offline" : true))
    .filter((u) => `${u.name} ${u.tag}`.toLowerCase().includes(query.toLowerCase()));
  const incoming = p.requests.filter((r) => r.direction === "incoming");
  const outgoing = p.requests.filter((r) => r.direction === "outgoing");
  const outgoingIds = new Set(outgoing.map((r) => r.userId));
  const incomingIds = new Set(incoming.map((r) => r.userId));
  const alreadyFriend = new Set(p.friendIds);
  const matches = Object.values(USERS)
    .filter((u) => u.id !== "me" && !alreadyFriend.has(u.id))
    .filter((u) => `${u.name} ${u.tag}`.toLowerCase().includes(addQuery.replace(/^@/, "").toLowerCase()))
    .slice(0, 6);

  const tabs: { id: Tab; label: string }[] = [
    { id: "online", label: "В сети" },
    { id: "all", label: "Все" },
    { id: "pending", label: `Ожидание${p.requests.length ? ` · ${p.requests.length}` : ""}` },
  ];

  const FriendRow = ({ user }: { user: User }) => (
    <div className="group flex items-center gap-3 rounded-lg border-t border-ink-600/30 px-2 py-3 transition hover:bg-ink-750">
      <button onClick={(e) => p.onOpenPopover(user, e)} className="shrink-0 transition hover:scale-105">
        <Avatar user={user} size={36} ring="ring-ink-800" />
      </button>
      <button onClick={(e) => p.onOpenPopover(user, e)} className="min-w-0 flex-1 text-left">
        <div className="flex items-baseline gap-2">
          <span className="text-[15px] font-bold text-white">{user.name}</span>
          <span className="hidden text-xs text-fog-500 group-hover:inline">@{user.tag}</span>
        </div>
        <div className="truncate text-[13px] text-fog-500">{user.activity ?? user.custom ?? STATUS_LABEL[user.status]}</div>
      </button>
      <button
        onClick={() => p.onMessage(user.id)}
        title="Написать сообщение"
        className="rounded-full bg-ink-900 p-2 text-fog-300 transition hover:bg-max-500 hover:text-white"
      >
        <MessageCircle className="h-5 w-5" />
      </button>
      <button
        onClick={() => p.onRemoveFriend(user.id)}
        title="Удалить из друзей"
        className="rounded-full bg-ink-900 p-2 text-fog-400 transition hover:bg-dnd hover:text-white"
      >
        <UserRoundX className="h-5 w-5" />
      </button>
    </div>
  );

  return (
    <section className="flex min-w-0 flex-1 flex-col bg-ink-800">
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-ink-950/60 px-4 shadow-sm">
        <Users className="h-5 w-5 text-fog-500" />
        <span className="text-[15px] font-bold text-white">Друзья</span>
        <div className="h-6 w-px bg-ink-600" />
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-md px-2.5 py-1 text-sm font-medium transition",
              tab === t.id ? "bg-ink-600 text-white" : "text-fog-400 hover:bg-ink-700 hover:text-fog-100"
            )}
          >
            {t.label}
          </button>
        ))}
        <button
          onClick={() => { setAddOpen(true); setAddQuery(""); }}
          className="max-gradient ml-1 flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm font-semibold text-white shadow-md shadow-max-600/20 transition hover:brightness-110"
        >
          <UserRoundPlus className="h-4 w-4" /> Добавить в друзья
        </button>
      </header>

      <div className="flex min-h-0 flex-1">
        <div className="min-w-0 flex-1 overflow-y-auto px-6 pt-4">
          {tab !== "pending" && friends.length > 0 && (
            <div className="flex items-center rounded-lg bg-ink-950 px-3">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Поиск среди друзей"
                className="flex-1 bg-transparent py-2 text-sm text-fog-100 placeholder-fog-500 outline-none"
              />
              <Search className="h-4 w-4 text-fog-500" />
            </div>
          )}

          {tab === "pending" ? (
            <div className="space-y-7">
              <section>
                <h3 className="mb-2 text-[11px] font-bold tracking-wider text-fog-500 uppercase">Входящие — {incoming.length}</h3>
                {incoming.length === 0 ? (
                  <p className="border-t border-ink-600/30 py-4 text-sm text-fog-500">Новых заявок нет</p>
                ) : (
                  incoming.map((r) => {
                    const user = USERS[r.userId];
                    if (!user) return null;
                    return (
                      <div key={r.userId} className="flex items-center gap-3 border-t border-ink-600/30 px-2 py-3">
                        <button onClick={(e) => p.onOpenPopover(user, e)}><Avatar user={user} size={36} ring="ring-ink-800" /></button>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-white">{user.name}</div>
                          <div className="text-xs text-fog-500">@{user.tag} хочет добавить вас в друзья</div>
                        </div>
                        <button onClick={() => p.onAcceptRequest(user.id)} title="Принять заявку" className="rounded-full bg-online p-2 text-white transition hover:brightness-110"><Check className="h-5 w-5" /></button>
                        <button onClick={() => p.onDeclineRequest(user.id)} title="Отклонить заявку" className="rounded-full bg-ink-900 p-2 text-fog-400 transition hover:bg-dnd hover:text-white"><X className="h-5 w-5" /></button>
                      </div>
                    );
                  })
                )}
              </section>
              <section>
                <h3 className="mb-2 text-[11px] font-bold tracking-wider text-fog-500 uppercase">Исходящие — {outgoing.length}</h3>
                {outgoing.length === 0 ? (
                  <p className="border-t border-ink-600/30 py-4 text-sm text-fog-500">Вы ещё никому не отправили заявку</p>
                ) : (
                  outgoing.map((r) => {
                    const user = USERS[r.userId];
                    if (!user) return null;
                    return (
                      <div key={r.userId} className="flex items-center gap-3 border-t border-ink-600/30 px-2 py-3">
                        <Avatar user={user} size={36} ring="ring-ink-800" />
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-white">{user.name}</div>
                          <div className="text-xs text-fog-500">Заявка отправлена · @{user.tag}</div>
                        </div>
                        <button onClick={() => p.onDeclineRequest(user.id)} title="Отменить заявку" className="rounded-full bg-ink-900 p-2 text-fog-400 transition hover:bg-dnd hover:text-white"><X className="h-5 w-5" /></button>
                      </div>
                    );
                  })
                )}
              </section>
            </div>
          ) : (
            <>
              {friends.length > 0 && <div className="mt-5 pb-2 text-[11px] font-bold tracking-wider text-fog-500 uppercase">
                {tab === "online" ? `В сети — ${visibleFriends.length}` : `Все друзья — ${visibleFriends.length}`}
              </div>}
              {visibleFriends.length === 0 ? (
                <div className="pt-10">
                  {friends.length === 0 ? (
                    <div className="mx-auto max-w-lg overflow-hidden rounded-2xl border border-ink-600/50 bg-ink-850">
                      <div className="max-gradient relative px-6 py-5">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_10%,rgba(255,255,255,0.28),transparent_60%)]" />
                        <h2 className="font-display relative text-xl font-extrabold text-white">Ваш TYAM пока пустой</h2>
                        <p className="relative mt-1 text-sm text-white/85">Ни серверов, ни друзей — всё создаёте вы сами, без ботов и заготовок.</p>
                      </div>
                      <ol className="divide-y divide-ink-700/60">
                        {[
                          { t: "Найдите человека", d: "Поиск по каталогу TYAM: имя или тег, например @sonya.design", action: { label: "Добавить в друзья", fn: () => setAddOpen(true) } },
                          { t: "Создайте свой сервер", d: "Шаблон, название, иконка — и каналы появятся автоматически", action: { label: "Создать сервер", fn: p.onCreateServer } },
                          { t: "Пригласите друзей", d: "Кнопка «Пригласить друзей» в шапке сервера", action: null },
                        ].map((step, i) => (
                          <li key={step.t} className="flex items-center gap-3 px-5 py-3.5">
                            <span className="max-gradient flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-extrabold text-white">{i + 1}</span>
                            <span className="min-w-0 flex-1">
                              <span className="block text-sm font-bold text-fog-100">{step.t}</span>
                              <span className="block text-xs leading-snug text-fog-500">{step.d}</span>
                            </span>
                            {step.action && (
                              <button
                                onClick={step.action.fn}
                                className="shrink-0 rounded-lg bg-ink-700 px-3 py-1.5 text-xs font-bold text-fog-100 transition hover:max-gradient hover:text-white active:scale-95"
                              >
                                {step.action.label}
                              </button>
                            )}
                          </li>
                        ))}
                      </ol>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3 pt-6 text-center">
                      <Users className="h-10 w-10 text-fog-500" />
                      <p className="max-w-xs text-sm text-fog-500">Никого не нашли. Попробуйте другой запрос.</p>
                    </div>
                  )}
                </div>
              ) : visibleFriends.map((user) => <FriendRow key={user.id} user={user} />)}
            </>
          )}
        </div>

        <aside className="hidden w-80 shrink-0 border-l border-ink-950/50 p-5 xl:block">
          <h3 className="font-display text-lg font-bold text-white">Активно сейчас</h3>
          <div className="mt-4 space-y-3">
            {friends.filter((u) => u.activity && u.status !== "offline").map((u) => (
              <button key={u.id} onClick={() => p.onMessage(u.id)} className="flex w-full items-start gap-3 rounded-xl bg-ink-850 p-3 text-left transition hover:bg-ink-750">
                <Avatar user={u} size={36} ring="ring-ink-850" />
                <div className="min-w-0">
                  <div className="text-sm font-bold text-white">{u.name}</div>
                  <div className="mt-0.5 text-[13px] leading-snug text-fog-400">{u.activity}</div>
                </div>
              </button>
            ))}
            {friends.filter((u) => u.activity && u.status !== "offline").length === 0 && <p className="text-xs leading-relaxed text-fog-500">Здесь появится активность ваших друзей — игры, музыка и стримы.</p>}
          </div>
        </aside>
      </div>

      {addOpen && (
        <Modal onClose={() => setAddOpen(false)}>
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="max-gradient mb-3 flex h-11 w-11 items-center justify-center rounded-xl text-white"><UserPlus className="h-5 w-5" /></div>
                <h2 className="font-display text-xl font-bold text-white">Добавить друга</h2>
                <p className="mt-1 text-sm text-fog-400">Найдите участника по имени или тегу TYAM</p>
              </div>
              <button onClick={() => setAddOpen(false)} title="Закрыть" className="rounded-full bg-ink-700 p-1.5 text-fog-400 transition hover:rotate-90 hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <div className="mt-5 flex items-center rounded-lg bg-ink-950 px-3 ring-max-500/0 transition focus-within:ring-2 focus-within:ring-max-500/60">
              <input
                autoFocus
                value={addQuery}
                onChange={(e) => setAddQuery(e.target.value)}
                placeholder="Имя пользователя или @тег"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && matches.length === 1 && !outgoingIds.has(matches[0].id)) p.onSendRequest(matches[0].id);
                }}
                className="min-w-0 flex-1 bg-transparent py-3 text-sm text-fog-100 placeholder-fog-500 outline-none"
              />
              <Search className="h-4 w-4 text-fog-500" />
            </div>
            <div className="mt-3 max-h-72 space-y-1 overflow-y-auto">
              {matches.map((user) => {
                const sent = outgoingIds.has(user.id);
                const hasIncoming = incomingIds.has(user.id);
                return (
                  <div key={user.id} className="flex items-center gap-3 rounded-xl p-2.5 transition hover:bg-ink-750">
                    <button onClick={(e) => p.onOpenPopover(user, e)}><Avatar user={user} size={38} ring="ring-ink-800" /></button>
                    <button onClick={(e) => p.onOpenPopover(user, e)} className="min-w-0 flex-1 text-left">
                      <div className="truncate text-sm font-bold text-fog-100">{user.name}</div>
                      <div className="truncate text-xs text-fog-500">@{user.tag}</div>
                    </button>
                    <button
                      disabled={sent}
                      onClick={() => hasIncoming ? p.onAcceptRequest(user.id) : p.onSendRequest(user.id)}
                      className={cn("flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition", sent ? "cursor-default bg-ink-700 text-fog-500" : hasIncoming ? "bg-online text-white hover:brightness-110" : "max-gradient text-white hover:brightness-110")}
                    >
                      {sent ? <><Check className="h-3.5 w-3.5" /> Отправлено</> : hasIncoming ? <><Check className="h-3.5 w-3.5" /> Принять</> : <><UserPlus className="h-3.5 w-3.5" /> Добавить</>}
                    </button>
                  </div>
                );
              })}
              {matches.length === 0 && <p className="px-2 py-5 text-center text-sm text-fog-500">Не нашли новых участников по этому запросу</p>}
            </div>
            <p className="mt-4 border-t border-ink-700 pt-3 text-xs leading-relaxed text-fog-500">
              Можно ввести отображаемое имя или уникальный тег, например <span className="text-fog-300">@alina.dev</span>.
            </p>
          </div>
        </Modal>
      )}
    </section>
  );
}