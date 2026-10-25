import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ServerRail from "./components/ServerRail";
import ChannelSidebar from "./components/ChannelSidebar";
import ChatArea from "./components/ChatArea";
import MemberList from "./components/MemberList";
import FriendsView from "./components/FriendsView";
import CreateServerModal from "./components/CreateServerModal";
import CreateChannelModal from "./components/CreateChannelModal";
import ChannelSettingsView from "./components/ChannelSettingsView";
import ServerSettingsModal from "./components/ServerSettingsModal";
import LeaveServerModal from "./components/LeaveServerModal";
import BoostModal from "./components/BoostModal";
import ProfileModal from "./components/ProfileModal";
import ProfilePopover from "./components/ProfilePopover";
import SettingsView from "./components/SettingsView";
import type { Tab } from "./components/SettingsView";
import VoiceRoom from "./components/VoiceRoom";
import ShopView from "./components/ShopView";
import ContextMenu from "./components/ContextMenu";
import type { MenuItem } from "./components/ContextMenu";
import SplashScreen from "./components/SplashScreen";
import Launcher from "./components/Launcher";
import { AvatarEditorProvider } from "./components/AvatarEditor";
import { readLastLaunch, readLauncherPreferences, recordLaunch, saveLauncherPreferences } from "./launcher";
import type { LauncherPreferences } from "./launcher";
import { CreateCategoryModal, ConfirmModal, RenameCategoryModal } from "./components/ServerModals";
import { Toasts } from "./components/Modal";
import { AtSign, Ban, Check, Copy, MessageCircle, Settings as SettingsIcon, User as UserIcon, UserPlus, UserX } from "lucide-react";
import type { AuditEntry, Category, Channel, FriendRequest, Message, ResolvedRole, RoleContext, Server, User } from "./data";
import { DEFAULT_SERVER_ROLES, INITIAL_MESSAGES, ME, USERS, nowTime } from "./data";
import { BANNER_GRADIENTS } from "./shop";
import { mixHex } from "./components/ui";
import { SettingsProvider, boostLevel, useSettings } from "./store";
import type { BoostEvent, BoostInfo } from "./store";

let uid = 100;

function Shell({ active, onOpenLauncher }: { active: boolean; onOpenLauncher: () => void }) {
  const { settings, update, toast } = useSettings();

  /* ── состояние: всё создаёт пользователь, ничего не предзаполнено ── */
  const [servers, setServers] = useState<Server[]>([]);
  const [activeServer, setActiveServer] = useState("home");
  const [homeTab, setHomeTab] = useState<"friends" | "shop">("friends");
  const [channelBy, setChannelBy] = useState<Record<string, string>>({});
  const [messages, setMessages] = useState<Record<string, Message[]>>({ ...INITIAL_MESSAGES });
  const [dms, setDms] = useState<Record<string, Message[]>>({});
  const [boosts, setBoosts] = useState<Record<string, BoostInfo>>({});
  const [friendIds, setFriendIds] = useState<string[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [activeDm, setActiveDm] = useState<string | null>(null);
  const [readChannels, setReadChannels] = useState<Set<string>>(new Set());
  const [memberRoles, setMemberRoles] = useState<Record<string, Record<string, string[]>>>({});
  const [auditLogs, setAuditLogs] = useState<Record<string, AuditEntry[]>>({});

  const [joinedVoice, setJoinedVoice] = useState<string | null>(null);
  const [muted, setMuted] = useState(true);
  const [deafened, setDeafened] = useState(false);
  const [membersVisible, setMembersVisible] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [createChannelTarget, setCreateChannelTarget] = useState<{ serverId: string; categoryId: string } | null>(null);
  const [categoryModal, setCategoryModal] = useState(false);
  const [editChannel, setEditChannel] = useState<Channel | null>(null);
  const [renameCategory, setRenameCategory] = useState<Category | null>(null);
  const [serverSettingsId, setServerSettingsId] = useState<string | null>(null);
  const [leaveServerId, setLeaveServerId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ title: string; text: string; label: string; action: () => void } | null>(null);
  const [boostOpen, setBoostOpen] = useState(false);
  const [boostServerId, setBoostServerId] = useState<string | null>(null);
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [profilePopover, setProfilePopover] = useState<{ user: User; x: number; y: number; live?: boolean } | null>(null);
  const [settingsTab, setSettingsTab] = useState<Tab | null>(null);
  const [userMenu, setUserMenu] = useState<{ userId: string; x: number; y: number } | null>(null);
  const [pendingMention, setPendingMention] = useState<{ name: string; id: number } | null>(null);
  const micStream = useRef<MediaStream | null>(null);

  const server = activeServer === "home" ? (servers.find((s) => s.id === activeServer) ?? null) : (servers.find((s) => s.id === activeServer) ?? null);
  const channelId = server ? channelBy[server.id] ?? null : null;
  const channel = server?.categories.flatMap((c) => c.channels).find((c) => c.id === channelId) ?? null;
  const activeVoiceChannel = server?.categories.flatMap((c) => c.channels).find((c) => c.id === joinedVoice && c.type === "voice") ?? null;
  const dmUser = activeServer === "home" && activeDm ? USERS[activeDm] ?? null : null;
  const currentKey = dmUser ? `dm:${dmUser.id}` : (channelId ?? "");
  const currentMessages = dmUser ? (dms[dmUser.id] ?? []) : (messages[channelId ?? ""] ?? []);

  const meUser: User = useMemo(
    () => ({
      ...ME,
      name: settings.displayName,
      tag: settings.username,
      initials: (settings.displayName.trim().slice(0, 2) || "ВЫ").toUpperCase(),
      status: settings.status,
      custom: settings.aboutMe,
      premium: settings.premium && settings.premiumTag,
      avatarUrl: settings.avatarUrl ?? undefined,
      bannerUrl: settings.bannerUrl ?? undefined,
      bannerGradient: BANNER_GRADIENTS[settings.bannerIndex],
      decoration: settings.equipped.decoration ?? undefined,
      effect: settings.equipped.effect ?? undefined,
      frame: settings.equipped.frame ?? undefined,
      avatarAnimation: settings.equipped.avatar ?? undefined,
    }),
    [settings.displayName, settings.username, settings.status, settings.aboutMe, settings.premium, settings.premiumTag, settings.avatarUrl, settings.bannerUrl, settings.bannerIndex, settings.equipped]
  );

  const boostInfo = server ? (boosts[server.id] ?? { count: 0, boosters: [] }) : null;
  const liveAvatars = boostInfo ? boostLevel(boostInfo.count) >= 3 : false;
  const boostLevels = useMemo(() => {
    const map: Record<string, number> = {};
    for (const s of servers) map[s.id] = boostLevel(boosts[s.id]?.count ?? 0);
    return map;
  }, [servers, boosts]);

  const sidebarServer: Server | null = useMemo(() => {
    if (!server) return null;
    return {
      ...server,
      categories: server.categories.map((cat) => ({
        ...cat,
        channels: cat.channels.map((ch) => ({
          ...ch,
          unread: ch.unread && !readChannels.has(ch.id),
          mentions: readChannels.has(ch.id) ? undefined : ch.mentions,
        })),
      })),
    };
  }, [server, readChannels]);

  /** В голосовом канале только те, кто подключился сам */
  const voiceOccupants = useMemo(() => {
    const map: Record<string, string[]> = {};
    if (joinedVoice) map[joinedVoice] = ["me"];
    return map;
  }, [joinedVoice]);

  const voiceParticipants = useMemo(() => {
    if (!activeVoiceChannel) return [];
    return (voiceOccupants[activeVoiceChannel.id] ?? [])
      .map((id) => (id === "me" ? meUser : USERS[id]))
      .filter((u): u is User => Boolean(u));
  }, [activeVoiceChannel, voiceOccupants, meUser]);

  const mentionUsers: User[] = useMemo(() => {
    if (dmUser) return [dmUser];
    if (server) return server.members.map((id) => USERS[id]).filter(Boolean);
    return [];
  }, [server, dmUser]);

  /* ── роли ── */
  const logAudit = useCallback((serverId: string, action: string, kind: AuditEntry["kind"]) => {
    const d = new Date();
    const time = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    setAuditLogs((logs) => ({
      ...logs,
      [serverId]: [{ id: `a${Date.now()}${Math.random()}`, action, time, kind }, ...(logs[serverId] ?? [])].slice(0, 50),
    }));
  }, []);

  const assignedRoleIds = useCallback(
    (serverId: string, userId: string): string[] => memberRoles[serverId]?.[userId] ?? [],
    [memberRoles]
  );

  const toggleMemberRole = (serverId: string, userId: string, roleId: string) => {
    const target = servers.find((srv) => srv.id === serverId);
    const all = target?.roles ?? DEFAULT_SERVER_ROLES;
    const role = all.find((r) => r.id === roleId);
    if (!role) return;
    const current = assignedRoleIds(serverId, userId);
    const next = current.includes(roleId) ? current.filter((id) => id !== roleId) : [...current, roleId];
    setMemberRoles((m) => ({ ...m, [serverId]: { ...(m[serverId] ?? {}), [userId]: next } }));
    const who = userId === "me" ? "себе" : (USERS[userId]?.name ?? "участнику");
    toast(next.includes(roleId) ? `Роль «${role.name}» выдана: ${who}` : `Роль «${role.name}» снята: ${who}`, "success");
    logAudit(serverId, `Роль «${role.name}» ${next.includes(roleId) ? "выдана" : "снята"} — ${who}`, "role");
  };

  const clearMemberRoles = (serverId: string, userId: string) => {
    setMemberRoles((m) => ({ ...m, [serverId]: { ...(m[serverId] ?? {}), [userId]: [] } }));
    const who = userId === "me" ? "себя" : (USERS[userId]?.name ?? "участника");
    toast(`Все роли сняты: ${who}`, "info");
    logAudit(serverId, `Сняты все роли — ${who}`, "role");
  };

  const buildRoleContext = useCallback(
    (target: Server | null): RoleContext | null => {
      if (!target) return null;
      const roles: ResolvedRole[] = (target.roles ?? DEFAULT_SERVER_ROLES).map((r) => ({
        id: r.id,
        name: r.name,
        c1: r.color,
        c2: r.c2 ?? mixHex(r.color, "#ffffff", 0.45),
        animated: r.animated ?? false,
      }));
      const byUser: Record<string, ResolvedRole[]> = {};
      for (const id of ["me", ...target.members]) {
        const ids = assignedRoleIds(target.id, id);
        byUser[id] = roles.filter((r) => ids.includes(r.id));
      }
      const level = boostLevel(boosts[target.id]?.count ?? 0);
      return {
        roles,
        byUser,
        gradient: level >= 2 && target.gradientNicks !== false,
        canManage: true,
        toggle: (userId, roleId) => toggleMemberRole(target.id, userId, roleId),
        clear: (userId) => clearMemberRoles(target.id, userId),
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [assignedRoleIds, boosts, servers]
  );

  const roleContext = buildRoleContext(server);
  const popoverServer = profilePopover ? (server ?? servers.find((srv) => srv.members.includes(profilePopover.user.id)) ?? null) : null;
  const modalServer = profileUser ? (server ?? servers.find((srv) => srv.members.includes(profileUser.id)) ?? null) : null;

  const selectedSettingsServer = servers.find((s) => s.id === serverSettingsId) ?? null;
  const selectedLeaveServer = servers.find((s) => s.id === leaveServerId) ?? null;
  const selectedBoostServer = servers.find((s) => s.id === boostServerId) ?? server;
  const selectedBoostInfo = selectedBoostServer ? (boosts[selectedBoostServer.id] ?? { count: 0, boosters: [] }) : null;

  /* ── горячие клавиши ── */
  useEffect(() => {
    if (!active) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSettingsTab(null);
      if (e.key === "," && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setSettingsTab("account");
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [active]);

  useEffect(() => () => micStream.current?.getTracks().forEach((track) => track.stop()), []);

  /* ── сообщения ── */
  const selectChannel = (id: string) => {
    if (!server) return;
    setChannelBy((c) => ({ ...c, [server.id]: id }));
    setReadChannels((r) => new Set(r).add(id));
  };

  const appendMessage = useCallback((key: string, msg: Message) => {
    if (key.startsWith("dm:")) {
      const id = key.slice(3);
      setDms((d) => ({ ...d, [id]: [...(d[id] ?? []), msg] }));
    } else {
      setMessages((m) => ({ ...m, [key]: [...(m[key] ?? []), msg] }));
    }
  }, []);

  const handleSend = (text: string, replyTo?: { name: string; text: string }) => {
    if (!currentKey) return;
    appendMessage(currentKey, { id: `u${uid++}`, userId: "me", text, time: nowTime(), reactions: [], replyTo });
  };

  const patchCurrent = (fn: (list: Message[]) => Message[]) => {
    if (currentKey.startsWith("dm:")) {
      const id = currentKey.slice(3);
      setDms((d) => ({ ...d, [id]: fn(d[id] ?? []) }));
    } else {
      setMessages((m) => ({ ...m, [currentKey]: fn(m[currentKey] ?? []) }));
    }
  };

  const handleReact = (messageId: string, emoji: string) =>
    patchCurrent((list) =>
      list.map((m) => {
        if (m.id !== messageId) return m;
        const existing = m.reactions.find((r) => r.emoji === emoji);
        const reactions = existing
          ? m.reactions.map((r) => (r.emoji === emoji ? { ...r, count: r.count + (r.me ? -1 : 1), me: !r.me } : r)).filter((r) => r.count > 0)
          : [...m.reactions, { emoji, count: 1, me: true }];
        return { ...m, reactions };
      })
    );

  const handlePin = (messageId: string) =>
    patchCurrent((list) => list.map((m) => (m.id === messageId ? { ...m, pinned: !m.pinned } : m)));

  const handleEditMessage = (messageId: string, text: string) => {
    patchCurrent((list) => list.map((m) => (m.id === messageId && m.userId === "me" ? { ...m, text, edited: true } : m)));
    toast("Сообщение изменено", "success");
  };

  /* ── серверы ── */
  const updateServer = (updated: Server) => setServers((items) => items.map((s) => (s.id === updated.id ? updated : s)));

  const handleCreateServer = (created: Server) => {
    setServers((items) => [...items, created]);
    setBoosts((b) => ({ ...b, [created.id]: { count: 0, boosters: [] } }));
    const firstText = created.categories.flatMap((c) => c.channels).find((c) => c.type === "text");
    if (firstText) {
      setChannelBy((c) => ({ ...c, [created.id]: firstText.id }));
      setReadChannels((r) => new Set(r).add(firstText.id));
      setMessages((m) => ({
        ...m,
        [firstText.id]: [
          {
            id: `u${uid++}`,
            userId: "me",
            text: `Сервер «${created.name}» готов. Пригласите друзей и настройте роли — сервер полностью ваш.`,
            time: nowTime(),
            reactions: [],
            system: true,
          },
        ],
      }));
    }
    setActiveServer(created.id);
    logAudit(created.id, `Сервер «${created.name}» создан`, "settings");
  };

  const handleCreateChannel = (categoryId: string, created: Channel) => {
    if (!createChannelTarget) return;
    const target = servers.find((s) => s.id === createChannelTarget.serverId);
    if (!target) return;
    const updated: Server = {
      ...target,
      categories: target.categories.map((cat) => (cat.id === categoryId ? { ...cat, channels: [...cat.channels, created] } : cat)),
    };
    updateServer(updated);
    logAudit(updated.id, `Создан канал «${created.name}» (${created.type === "text" ? "текстовый" : "голосовой"})`, "channel");
    if (created.type === "text") {
      setChannelBy((c) => ({ ...c, [updated.id]: created.id }));
      setReadChannels((r) => new Set(r).add(created.id));
      setMessages((m) => ({ ...m, [created.id]: [] }));
      setActiveServer(updated.id);
    } else {
      setActiveServer(updated.id);
      setJoinedVoice(created.id);
    }
    setCreateChannelTarget(null);
  };

  const createCategory = (name: string) => {
    if (!server) return;
    updateServer({ ...server, categories: [...server.categories, { id: `cat-${Date.now().toString(36)}`, name, channels: [] }] });
    logAudit(server.id, `Создана категория «${name}»`, "channel");
    toast(`Категория «${name}» создана`, "success");
  };

  const saveChannelSettings = (updatedChannel: Channel) => {
    if (!server || !editChannel) return;
    updateServer({
      ...server,
      categories: server.categories.map((cat) => ({
        ...cat,
        channels: cat.channels.map((ch) => (ch.id === editChannel.id ? updatedChannel : ch)),
      })),
    });
    logAudit(server.id, `Настройки канала «${editChannel.name}» обновлены`, "channel");
    toast("Настройки канала сохранены", "success");
    setEditChannel(null);
  };

  const requestDeleteChannel = (target: Channel) => {
    if (!server) return;
    const srv = server;
    setConfirm({
      title: `Удалить ${target.type === "text" ? "#" : ""}${target.name}?`,
      text: "Канал и его сообщения будут удалены без возможности восстановления.",
      label: "Удалить канал",
      action: () => {
        const updated: Server = {
          ...srv,
          categories: srv.categories.map((cat) => ({ ...cat, channels: cat.channels.filter((ch) => ch.id !== target.id) })),
        };
        updateServer(updated);
        if (joinedVoice === target.id) {
          micStream.current?.getTracks().forEach((track) => track.stop());
          micStream.current = null;
          setJoinedVoice(null);
        }
        if (channelBy[srv.id] === target.id) {
          const fallback = updated.categories.flatMap((c) => c.channels).find((c) => c.type === "text");
          setChannelBy((c) => ({ ...c, [srv.id]: fallback?.id ?? "" }));
        }
        logAudit(srv.id, `Удалён канал «${target.name}»`, "channel");
        toast(`Канал «${target.name}» удалён`, "info");
      },
    });
  };

  const promptLeaveServer = (id: string) => {
    setServerSettingsId(null);
    setLeaveServerId(id);
  };

  const leaveServer = (id: string) => {
    const target = servers.find((s) => s.id === id);
    if (!target) return;
    if (target.categories.flatMap((c) => c.channels).some((ch) => ch.id === joinedVoice)) {
      micStream.current?.getTracks().forEach((track) => track.stop());
      micStream.current = null;
      setJoinedVoice(null);
    }
    setServers((items) => items.filter((s) => s.id !== id));
    setLeaveServerId(null);
    if (activeServer === id) {
      setActiveServer("home");
      setActiveDm(null);
      setHomeTab("friends");
    }
    toast(`Вы покинули сервер «${target.name}»`, "info");
  };

  const moderateMember = (userId: string, mode: "kick" | "ban") => {
    if (!server) return;
    const srv = server;
    const user = USERS[userId];
    if (!user) return;
    setConfirm({
      title: mode === "kick" ? `Кикнуть ${user.name}?` : `Забанить ${user.name}?`,
      text:
        mode === "kick"
          ? `${user.name} покинет сервер, но сможет вернуться по приглашению.`
          : `${user.name} будет удалён с сервера и не сможет вернуться, пока вы не снимете бан.`,
      label: mode === "kick" ? "Кикнуть" : "Забанить",
      action: () => {
        updateServer({
          ...srv,
          members: srv.members.filter((id) => id !== userId),
          ...(mode === "ban" ? { banned: [...(srv.banned ?? []), userId] } : {}),
        });
        logAudit(srv.id, `${mode === "kick" ? "Кикнут" : "Забанен"} участник ${user.name}`, "member");
        toast(mode === "kick" ? `${user.name} кикнут с сервера` : `${user.name} забанен`, "info");
      },
    });
  };

  /** Настоящее приглашение: добавляет вашего друга на сервер */
  const inviteFriend = (serverId: string, userId: string) => {
    const target = servers.find((s) => s.id === serverId);
    const user = USERS[userId];
    if (!target || !user || target.members.includes(userId)) return;
    if ((target.banned ?? []).includes(userId)) {
      toast(`${user.name} в бан-листе сервера — сначала снимите бан`, "info");
      return;
    }
    const updated: Server = { ...target, members: [...target.members, userId] };
    updateServer(updated);
    logAudit(serverId, `${user.name} приглашён на сервер`, "member");
    toast(`${user.name} теперь на сервере «${target.name}»`, "success");
    const firstText = updated.categories.flatMap((c) => c.channels).find((c) => c.type === "text");
    if (firstText) {
      appendMessage(firstText.id, {
        id: `u${uid++}`,
        userId: "me",
        text: `${user.name} присоединился к серверу по вашему приглашению`,
        time: nowTime(),
        reactions: [],
        system: true,
      });
    }
  };

  const pushBoostEvent = (serverId: string, event: Omit<BoostEvent, "id">) => {
    setBoosts((b) => {
      const current = b[serverId] ?? { count: 0, boosters: [] };
      return {
        ...b,
        [serverId]: { ...current, events: [{ ...event, id: `be${Date.now()}${Math.random()}` }, ...(current.events ?? [])].slice(0, 30) },
      };
    });
  };

  const renameCategorySave = (name: string) => {
    if (!server || !renameCategory) return;
    updateServer({
      ...server,
      categories: server.categories.map((cat) => (cat.id === renameCategory.id ? { ...cat, name } : cat)),
    });
    logAudit(server.id, `Категория «${renameCategory.name}» переименована в «${name}»`, "channel");
    toast(`Категория переименована в «${name}»`, "success");
    setRenameCategory(null);
  };

  const requestDeleteCategory = (category: Category) => {
    if (!server) return;
    const srv = server;
    setConfirm({
      title: `Удалить категорию «${category.name}»?`,
      text: category.channels.length
        ? `Вместе с ней исчезнут ${category.channels.length} канал(а) и их сообщения. Действие необратимо.`
        : "Категория пуста — удаление безопасно.",
      label: "Удалить категорию",
      action: () => {
        const removedIds = category.channels.map((c) => c.id);
        const updated: Server = { ...srv, categories: srv.categories.filter((cat) => cat.id !== category.id) };
        updateServer(updated);
        if (removedIds.includes(joinedVoice ?? "")) leaveVoice();
        if (removedIds.includes(channelBy[srv.id] ?? "")) {
          const fallback = updated.categories.flatMap((c) => c.channels).find((c) => c.type === "text");
          setChannelBy((c) => ({ ...c, [srv.id]: fallback?.id ?? "" }));
        }
        setMessages((m) => {
          const copy = { ...m };
          for (const id of removedIds) delete copy[id];
          return copy;
        });
        logAudit(srv.id, `Удалена категория «${category.name}»${removedIds.length ? ` с ${removedIds.length} каналами` : ""}`, "channel");
        toast(`Категория «${category.name}» удалена`, "info");
      },
    });
  };

  /* ── бусты ── */
  const handleBoost = () => {
    if (!selectedBoostServer || settings.boostCredits <= 0) return;
    const previous = boosts[selectedBoostServer.id] ?? { count: 0, boosters: [] };
    const next: BoostInfo = {
      count: previous.count + 1,
      boosters: previous.boosters.some((b) => b.userId === "me") ? previous.boosters : [...previous.boosters, { userId: "me", date: "сегодня" }],
    };
    setBoosts((b) => ({ ...b, [selectedBoostServer.id]: next }));
    update({ boostCredits: settings.boostCredits - 1 });

    const reached = boostLevel(next.count);
    const wasLevel = boostLevel(previous.count);
    pushBoostEvent(selectedBoostServer.id, {
      kind: "boost",
      text: `добавили буст серверу «${selectedBoostServer.name}» · всего ${next.count}`,
      at: Date.now(),
      userId: "me",
    });
    if (reached > wasLevel) {
      const perk =
        reached === 1 ? "анимированная иконка и баннер" : reached === 2 ? "градиентные никнеймы из двух цветов" : "живые анимированные аватары";
      pushBoostEvent(selectedBoostServer.id, {
        kind: "level",
        level: reached,
        text: `открыли уровень ${reached} — доступно: ${perk}`,
        at: Date.now() + 1,
        userId: "me",
      });
    }
    logAudit(selectedBoostServer.id, `Сервер забущен: ${previous.count} → ${next.count}`, "settings");
  };

  const buyBoosts = (count: number, price: number) => {
    update({ boostCredits: settings.boostCredits + count });
    toast(`Оплачено ${price} ₽ — куплено бустов: ${count}`, "boost");
    const target = selectedBoostServer;
    if (target) {
      pushBoostEvent(target.id, { kind: "purchase", text: `купили ${count} буст. за ${price} ₽`, at: Date.now(), userId: "me" });
      logAudit(target.id, `Куплено бустов: ${count} (${price} ₽)`, "settings");
    }
  };

  const openBoostForServer = (id: string) => {
    setActiveServer(id);
    setBoostServerId(id);
    setBoostOpen(true);
  };

  const openServerSettings = (id: string) => {
    setActiveServer(id);
    setServerSettingsId(id);
  };

  /* ── голос ── */
  const toggleMute = async () => {
    if (!muted) {
      micStream.current?.getTracks().forEach((track) => track.stop());
      micStream.current = null;
      setMuted(true);
      return;
    }
    if (!joinedVoice || !navigator.mediaDevices?.getUserMedia) {
      setMuted(false);
      return;
    }
    try {
      const audio: MediaTrackConstraints = {
        echoCancellation: settings.voice.echo,
        noiseSuppression: settings.voice.noise,
        autoGainControl: settings.voice.autoGain,
      };
      if (settings.voice.device !== "default") audio.deviceId = { exact: settings.voice.device };
      micStream.current = await navigator.mediaDevices.getUserMedia({ audio, video: false });
      setMuted(false);
      toast("Микрофон включён", "success");
    } catch {
      toast("Нет доступа к микрофону. Разрешите его в настройках браузера.", "info");
    }
  };

  const toggleDeafen = () => {
    if (!deafened) {
      setDeafened(true);
      micStream.current?.getTracks().forEach((track) => track.stop());
      micStream.current = null;
      setMuted(true);
    } else {
      setDeafened(false);
    }
  };

  const leaveVoice = () => {
    micStream.current?.getTracks().forEach((track) => track.stop());
    micStream.current = null;
    setJoinedVoice(null);
    setMuted(true);
    setDeafened(false);
  };

  /* ── друзья ── */
  const openDm = (userId: string) => {
    setActiveServer("home");
    setActiveDm(userId);
    setHomeTab("friends");
    setProfileUser(null);
    setProfilePopover(null);
  };

  const sendFriendRequest = (userId: string) => {
    if (friendIds.includes(userId) || friendRequests.some((r) => r.userId === userId && r.direction === "outgoing")) return;
    if (friendRequests.some((r) => r.userId === userId && r.direction === "incoming")) {
      setFriendRequests((items) => items.filter((r) => r.userId !== userId));
      setFriendIds((items) => (items.includes(userId) ? items : [...items, userId]));
      toast(`${USERS[userId]?.name ?? "Пользователь"} теперь ваш друг`, "success");
      return;
    }
    setFriendRequests((items) => [...items, { userId, direction: "outgoing" }]);
    toast(`Заявка отправлена: ${USERS[userId]?.name ?? "пользователь"}`, "success");
  };

  const acceptFriendRequest = (userId: string) => {
    setFriendRequests((items) => items.filter((r) => r.userId !== userId));
    setFriendIds((items) => (items.includes(userId) ? items : [...items, userId]));
    toast(`${USERS[userId]?.name ?? "Пользователь"} добавлен в друзья`, "success");
  };

  const declineFriendRequest = (userId: string) => {
    setFriendRequests((items) => items.filter((r) => r.userId !== userId));
    toast("Заявка удалена", "info");
  };

  const removeFriend = (userId: string) => {
    setFriendIds((items) => items.filter((id) => id !== userId));
    toast(`${USERS[userId]?.name ?? "Пользователь"} удалён из друзей`, "info");
  };

  /* ── меню пользователя ── */
  const openProfilePopover = (user: User, e: React.MouseEvent) => {
    setProfilePopover({ user, x: e.clientX, y: e.clientY, live: liveAvatars });
  };

  const mentionUser = (userId: string) => {
    const user = userId === "me" ? meUser : USERS[userId];
    if (!user) return;
    setPendingMention({ name: user.name, id: Date.now() });
  };

  const userMenuItems: (MenuItem | "divider")[] = useMemo(() => {
    if (!userMenu) return [];
    const userId = userMenu.userId;
    const user = userId === "me" ? meUser : USERS[userId];
    if (!user) return [];
    const isMe = userId === "me";
    const isFriend = friendIds.includes(userId);
    const request = friendRequests.find((r) => r.userId === userId);
    const items: (MenuItem | "divider")[] = [
      { label: "Профиль", icon: <UserIcon className="h-4 w-4" />, onClick: () => setProfileUser(user) },
    ];
    if (!isMe && server) items.push({ label: "Упомянуть", icon: <AtSign className="h-4 w-4" />, onClick: () => mentionUser(userId) });
    if (!isMe) {
      items.push({ label: "Написать сообщение", icon: <MessageCircle className="h-4 w-4" />, onClick: () => openDm(userId) });
      items.push("divider");
      if (isFriend) items.push({ label: "Уже в друзьях", icon: <Check className="h-4 w-4" />, disabled: true, onClick: () => undefined });
      else if (request?.direction === "incoming") items.push({ label: "Принять заявку", icon: <Check className="h-4 w-4" />, onClick: () => acceptFriendRequest(userId) });
      else if (request?.direction === "outgoing") items.push({ label: "Заявка отправлена", icon: <Check className="h-4 w-4" />, disabled: true, onClick: () => undefined });
      else items.push({ label: "Добавить в друзья", icon: <UserPlus className="h-4 w-4" />, onClick: () => sendFriendRequest(userId) });
    } else {
      items.push({ label: "Настройки профиля", icon: <SettingsIcon className="h-4 w-4" />, onClick: () => setSettingsTab("profile") });
    }
    if (!isMe && server && server.members.includes(userId)) {
      items.push("divider");
      items.push({ label: `Кикнуть ${user.name}`, icon: <UserX className="h-4 w-4" />, danger: true, onClick: () => moderateMember(userId, "kick") });
      items.push({ label: `Забанить ${user.name}`, icon: <Ban className="h-4 w-4" />, danger: true, onClick: () => moderateMember(userId, "ban") });
    }
    items.push("divider");
    items.push({
      label: "Копировать ID",
      icon: <Copy className="h-4 w-4" />,
      hint: userId,
      onClick: () => {
        navigator.clipboard?.writeText(userId);
        toast("ID скопирован", "success");
      },
    });
    return items;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userMenu, meUser, friendIds, friendRequests, server, servers]);

  const onInviteFromMenu = async (id: string) => {
    const link = `https://max.ru/join/${id.slice(-8)}`;
    try {
      await navigator.clipboard?.writeText(link);
      toast("Ссылка-приглашение скопирована", "success");
    } catch {
      toast(`Ссылка-приглашение: ${link}`, "info");
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-ink-950 font-sans antialiased">
      <ServerRail
        onOpenLauncher={() => {
          leaveVoice();
          setSettingsTab(null);
          setProfileUser(null);
          setProfilePopover(null);
          setUserMenu(null);
          onOpenLauncher();
        }}
        servers={servers}
        boostLevels={boostLevels}
        activeServer={activeServer}
        onSelect={setActiveServer}
        onCreate={() => setCreateOpen(true)}
        onSettings={openServerSettings}
        onLeave={promptLeaveServer}
        onInvite={(id) => void onInviteFromMenu(id)}
        onCreateChannel={(id) => {
          const target = servers.find((s) => s.id === id);
          if (!target) return;
          setActiveServer(id);
          setCreateChannelTarget({ serverId: id, categoryId: target.categories[0]?.id ?? "" });
        }}
      />

      <ChannelSidebar
        server={sidebarServer}
        meUser={meUser}
        boostInfo={boostInfo}
        activeChannel={activeVoiceChannel?.id ?? channelId}
        onSelectChannel={selectChannel}
        joinedVoice={joinedVoice}
        voiceOccupants={voiceOccupants}
        onJoinVoice={setJoinedVoice}
        onLeaveVoice={leaveVoice}
        muted={muted}
        deafened={deafened}
        onToggleMute={() => void toggleMute()}
        onToggleDeafen={toggleDeafen}
        onOpenBoost={() => server && openBoostForServer(server.id)}
        onOpenProfile={() => setProfileUser(meUser)}
        onOpenSettings={() => setSettingsTab("account")}
        onOpenPremium={() => setSettingsTab("premium")}
        onOpenServerSettings={() => server && openServerSettings(server.id)}
        onCreateChannel={(categoryId) => server && setCreateChannelTarget({ serverId: server.id, categoryId })}
        onCreateCategory={() => setCategoryModal(true)}
        onRenameCategory={setRenameCategory}
        onDeleteCategory={requestDeleteCategory}
        onEditChannel={setEditChannel}
        onDeleteChannel={requestDeleteChannel}
        onLeaveServer={() => server && promptLeaveServer(server.id)}
        onUpdateServer={(updated) => {
          updateServer(updated);
          toast("Настройки уведомлений обновлены", "success");
        }}
        homeTab={homeTab}
        onOpenShop={() => {
          setActiveServer("home");
          setActiveDm(null);
          setHomeTab("shop");
        }}
        friends={friendIds.map((id) => USERS[id]).filter(Boolean)}
        onInviteFriend={(userId) => server && inviteFriend(server.id, userId)}
        dmIds={friendIds}
        activeDm={activeDm}
        onSelectDm={(id) => {
          setActiveDm(id);
          setHomeTab("friends");
        }}
      />

      {activeServer === "home" && !dmUser && homeTab === "shop" ? (
        <ShopView />
      ) : activeServer === "home" && !dmUser ? (
        <FriendsView
          friendIds={friendIds}
          requests={friendRequests}
          onSendRequest={sendFriendRequest}
          onAcceptRequest={acceptFriendRequest}
          onDeclineRequest={declineFriendRequest}
          onRemoveFriend={removeFriend}
          onMessage={openDm}
          onOpenPopover={openProfilePopover}
          onCreateServer={() => setCreateOpen(true)}
        />
      ) : activeVoiceChannel && server ? (
        <VoiceRoom
          server={server}
          channel={activeVoiceChannel}
          participants={voiceParticipants}
          meUser={meUser}
          muted={muted}
          deafened={deafened}
          onToggleMute={() => void toggleMute()}
          onToggleDeafen={toggleDeafen}
          onLeave={leaveVoice}
          onOpenSettings={() => setSettingsTab("voice")}
          live={liveAvatars}
          roles={roleContext}
        />
      ) : (
        <>
          <ChatArea
            channel={channel}
            dmUser={dmUser}
            meUser={meUser}
            messages={currentMessages}
            mentionUsers={mentionUsers}
            pendingMention={pendingMention}
            onSend={handleSend}
            onEdit={handleEditMessage}
            onReact={handleReact}
            onPin={handlePin}
            membersVisible={membersVisible}
            onToggleMembers={() => setMembersVisible((v) => !v)}
            onOpenPopover={openProfilePopover}
            onUserMenu={(userId, e) => setUserMenu({ userId, x: e.clientX, y: e.clientY })}
            liveAvatars={liveAvatars}
            roles={roleContext}
          />
          {server && membersVisible && (
            <MemberList
              key={server.id}
              server={server}
              meUser={meUser}
              boosters={(boostInfo?.boosters ?? []).map((b) => b.userId)}
              boostInfo={boostInfo ?? { count: 0, boosters: [], events: [] }}
              boostCredits={settings.boostCredits}
              onOpenBoost={() => server && openBoostForServer(server.id)}
              onQuickBuyBoost={buyBoosts}
              onMessage={openDm}
              onOpenPopover={openProfilePopover}
              onUserMenu={(userId, e) => setUserMenu({ userId, x: e.clientX, y: e.clientY })}
              live={liveAvatars}
              roles={roleContext}
            />
          )}
        </>
      )}

      {createOpen && <CreateServerModal onClose={() => setCreateOpen(false)} onCreate={handleCreateServer} />}

      {createChannelTarget && servers.find((s) => s.id === createChannelTarget.serverId) && (
        <CreateChannelModal
          server={servers.find((s) => s.id === createChannelTarget.serverId)!}
          categoryId={createChannelTarget.categoryId}
          onClose={() => setCreateChannelTarget(null)}
          onCreate={handleCreateChannel}
        />
      )}

      {selectedSettingsServer && (
        <ServerSettingsModal
          key={selectedSettingsServer.id}
          server={selectedSettingsServer}
          auditLog={auditLogs[selectedSettingsServer.id] ?? []}
          onClose={() => setServerSettingsId(null)}
          onSave={(updated) => {
            updateServer(updated);
            logAudit(updated.id, "Настройки сервера обновлены", "settings");
          }}
          onLeave={promptLeaveServer}
        />
      )}

      {selectedLeaveServer && (
        <LeaveServerModal server={selectedLeaveServer} onCancel={() => setLeaveServerId(null)} onConfirm={() => leaveServer(selectedLeaveServer.id)} />
      )}

      {categoryModal && server && (
        <CreateCategoryModal serverName={server.name} onClose={() => setCategoryModal(false)} onCreate={createCategory} />
      )}

      {editChannel && server && (
        <ChannelSettingsView
          key={`${server.id}-${editChannel.id}`}
          server={server}
          channel={editChannel}
          memberRoleIds={memberRoles[server.id] ?? {}}
          onClose={() => setEditChannel(null)}
          onSave={saveChannelSettings}
          onDelete={() => {
            const target = editChannel;
            setEditChannel(null);
            requestDeleteChannel(target);
          }}
        />
      )}

      {renameCategory && server && (
        <RenameCategoryModal
          category={renameCategory}
          serverName={server.name}
          onClose={() => setRenameCategory(null)}
          onSave={renameCategorySave}
        />
      )}

      {confirm && (
        <ConfirmModal title={confirm.title} text={confirm.text} confirmLabel={confirm.label} onCancel={() => setConfirm(null)} onConfirm={confirm.action} />
      )}

      {boostOpen && selectedBoostServer && selectedBoostInfo && (
        <BoostModal
          key={selectedBoostServer.id}
          server={selectedBoostServer}
          info={selectedBoostInfo}
          onBoost={handleBoost}
          onBuy={buyBoosts}
          onClose={() => {
            setBoostOpen(false);
            setBoostServerId(null);
          }}
        />
      )}

      {profilePopover && (
        <ProfilePopover
          key={profilePopover.user.id}
          user={profilePopover.user}
          x={profilePopover.x}
          y={profilePopover.y}
          servers={servers}
          isFriend={friendIds.includes(profilePopover.user.id)}
          requestStatus={friendRequests.find((r) => r.userId === profilePopover.user.id)?.direction ?? null}
          live={profilePopover.live}
          roles={buildRoleContext(popoverServer)}
          onMessage={openDm}
          onViewFull={() => {
            setProfileUser(profilePopover.user);
            setProfilePopover(null);
          }}
          onAddFriend={sendFriendRequest}
          onAcceptFriend={acceptFriendRequest}
          onCancelFriend={declineFriendRequest}
          onEditProfile={() => {
            setProfilePopover(null);
            setSettingsTab("profile");
          }}
          onClose={() => setProfilePopover(null)}
        />
      )}

      {profileUser && (
        <ProfileModal
          user={profileUser}
          servers={servers}
          isBooster={servers.some((s) => (boosts[s.id]?.boosters ?? []).some((b) => b.userId === profileUser.id))}
          isFriend={friendIds.includes(profileUser.id)}
          requestStatus={friendRequests.find((r) => r.userId === profileUser.id)?.direction ?? null}
          roles={buildRoleContext(modalServer)}
          onAddFriend={sendFriendRequest}
          onAcceptFriend={acceptFriendRequest}
          onCancelFriend={declineFriendRequest}
          onMessage={openDm}
          onClose={() => setProfileUser(null)}
          onEditProfile={() => {
            setProfileUser(null);
            setSettingsTab("profile");
          }}
        />
      )}

      {userMenu && (
        <ContextMenu
          x={userMenu.x}
          y={userMenu.y}
          title={(userMenu.userId === "me" ? meUser : USERS[userMenu.userId])?.name}
          items={userMenuItems}
          onClose={() => setUserMenu(null)}
        />
      )}

      {settingsTab && (
        <SettingsView
          initialTab={settingsTab}
          onOpenShop={() => {
            setSettingsTab(null);
            setActiveServer("home");
            setActiveDm(null);
            setHomeTab("shop");
          }}
          onClose={() => {
            setSettingsTab(null);
            toast("Настройки сохранены", "success");
          }}
        />
      )}
    </div>
  );
}

function LauncherHost() {
  const { settings, toast } = useSettings();
  const [preferences, setPreferences] = useState<LauncherPreferences>(readLauncherPreferences);
  const [phase, setPhase] = useState<"launcher" | "launching" | "workspace">(() =>
    preferences.autoLaunch ? (preferences.showSplash ? "launching" : "workspace") : "launcher"
  );
  const [hasLaunched, setHasLaunched] = useState(preferences.autoLaunch);
  const [lastLaunch, setLastLaunch] = useState<string | null>(readLastLaunch);
  const autoLaunchRecorded = useRef(false);
  const finishLaunch = useCallback(() => setPhase("workspace"), []);
  const openLauncher = useCallback(() => setPhase("launcher"), []);

  useEffect(() => {
    document.title = phase === "launcher" ? "TYAM Launcher | Твоя орбита общения" : "TYAM | Общение без границ";
  }, [phase]);

  useEffect(() => {
    if (!autoLaunchRecorded.current && preferences.autoLaunch && phase !== "launcher") {
      autoLaunchRecorded.current = true;
      setLastLaunch(recordLaunch());
    }
  }, [preferences.autoLaunch, phase]);

  const changePreferences = useCallback((next: LauncherPreferences) => {
    setPreferences(next);
    if (!saveLauncherPreferences(next)) toast("Браузер не разрешил сохранить настройки. Они будут действовать до закрытия страницы.", "info");
  }, [toast]);

  const launch = useCallback(() => {
    if (phase !== "launcher") return;
    // Fullscreen must be requested directly from the user's click.
    if (preferences.windowMode === "window" && document.fullscreenElement) {
      void document.exitFullscreen().catch(() => undefined);
    } else if (preferences.windowMode === "fullscreen" && !document.fullscreenElement) {
      if (document.fullscreenEnabled) {
        void document.documentElement.requestFullscreen().catch(() => {
          toast("Полный экран недоступен. TYAM открыт в обычном окне.", "info");
        });
      } else toast("Полный экран недоступен. TYAM открыт в обычном окне.", "info");
    }
    setLastLaunch(recordLaunch());
    setHasLaunched(true);
    setPhase(preferences.showSplash && !hasLaunched ? "launching" : "workspace");
  }, [phase, preferences.windowMode, preferences.showSplash, hasLaunched, toast]);

  return (
    <>
      {phase === "launcher" && (
        <Launcher
          preferences={preferences}
          onPreferencesChange={changePreferences}
          onLaunch={launch}
          hasLaunched={hasLaunched}
          lastLaunch={lastLaunch}
        />
      )}
      {hasLaunched && (
        <div hidden={phase === "launcher"} inert={phase !== "workspace"} aria-hidden={phase !== "workspace"}>
          <Shell active={phase === "workspace"} onOpenLauncher={openLauncher} />
        </div>
      )}
      {phase === "launching" && <SplashScreen onDone={finishLaunch} reducedMotion={preferences.reducedMotion || !settings.animations} />}
      <Toasts />
    </>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <AvatarEditorProvider>
        <LauncherHost />
      </AvatarEditorProvider>
    </SettingsProvider>
  );
}
