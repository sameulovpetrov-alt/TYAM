import { ALL_PERMISSION_IDS } from "./permissions";
import type { AvatarCrop } from "./utils/avatar";

export type Status = "online" | "idle" | "dnd" | "offline";

export interface User {
  id: string;
  name: string;
  tag: string;
  initials: string;
  avatar: string; // tailwind gradient classes
  status: Status;
  role?: string;
  roleColor?: string;
  activity?: string;
  custom?: string;
  premium?: boolean;
  avatarUrl?: string;
  bannerUrl?: string;
  bannerGradient?: string;
  decoration?: string;
  effect?: string;
  frame?: string;
  /** анимированный аватар из магазина */
  avatarAnimation?: string;
}

export interface AuditEntry {
  id: string;
  action: string;
  time: string;
  kind: "channel" | "member" | "settings" | "invite" | "role";
}

export interface ServerRole {
  id: string;
  name: string;
  color: string;
  /** второй цвет градиента никнейма */
  c2?: string;
  /** переливающийся (анимированный) градиент */
  animated?: boolean;
  permissions: string[];
}

/** Роль, resolved для конкретного сервера и участника */
export interface ResolvedRole {
  id: string;
  name: string;
  c1: string;
  c2: string;
  animated: boolean;
}

/** Всё, что нужно компонентам для ролей текущего сервера */
export interface RoleContext {
  roles: ResolvedRole[];
  byUser: Record<string, ResolvedRole[]>;
  /** градиент включён (2+ уровень буста сервера) */
  gradient: boolean;
  canManage: boolean;
  toggle: (userId: string, roleId: string) => void;
  clear: (userId: string) => void;
}

export const DEFAULT_SERVER_ROLES: ServerRole[] = [
  { id: "r-admin", name: "Админ", color: "#5ea0ff", c2: "#c084fc", animated: true, permissions: ALL_PERMISSION_IDS },
  {
    id: "r-mod",
    name: "Модератор",
    color: "#34d399",
    c2: "#22d3ee",
    animated: true,
    permissions: [
      "server.view_channels",
      "server.view_audit_log",
      "member.create_invites",
      "member.manage_nicknames",
      "member.kick",
      "member.timeout",
      "text.send_messages",
      "text.send_threads",
      "text.embed_links",
      "text.attach_files",
      "text.add_reactions",
      "text.manage_messages",
      "text.pin_messages",
      "text.manage_threads",
      "text.read_history",
      "voice.connect",
      "voice.speak",
      "voice.video",
      "voice.mute_members",
      "voice.deafen_members",
      "voice.move_members",
    ],
  },
  { id: "r-designer", name: "Дизайнер", color: "#f472b6", c2: "#ffa76b", animated: false, permissions: ["server.view_channels", "member.create_invites", "text.send_messages", "text.embed_links", "text.attach_files", "text.add_reactions", "text.read_history", "voice.connect", "voice.speak"] },
  { id: "r-dev", name: "Разработчик", color: "#a78bfa", c2: "#22d3ee", animated: false, permissions: ["server.view_channels", "member.create_invites", "text.send_messages", "text.embed_links", "text.attach_files", "text.add_reactions", "text.read_history", "voice.connect", "voice.speak", "voice.video", "apps.commands"] },
  { id: "r-member", name: "Участник", color: "#93a3c8", permissions: ["server.view_channels", "member.create_invites", "member.change_nickname", "text.send_messages", "text.embed_links", "text.attach_files", "text.add_reactions", "text.read_history", "voice.connect", "voice.speak", "voice.video", "apps.commands"] },
];

export interface ServerEmoji {
  id: string;
  name: string;
  emoji: string;
}

export interface ServerInvite {
  code: string;
  uses: number;
  created: string;
}

export type PermissionOverrideValue = "allow" | "deny";

export interface ChannelPermissionOverride {
  id: string;
  subjectType: "role" | "member";
  subjectId: string;
  allow: string[];
  deny: string[];
}

export interface Channel {
  id: string;
  name: string;
  type: "text" | "voice";
  topic?: string;
  private?: boolean;
  /** Текстовый slowmode в секундах */
  slowMode?: number;
  /** Показывать ли содержимое как спойлер до клика */
  spoilerContent?: boolean;
  /** Через сколько скрывать неактивный канал в списке */
  hideAfter?: "never" | "1d" | "3d" | "1w";
  /** Синхронизация прав с категорией (пока без прав категории — флаг нужен для UI) */
  synced?: boolean;
  /** Переопределения прав для ролей и участников */
  overrides?: ChannelPermissionOverride[];
  /** Разрешить вебхуки в этом канале */
  webhooksEnabled?: boolean;
  /** Разрешить команды и активности приложений */
  appsEnabled?: boolean;
  unread?: boolean;
  mentions?: number;
}

export interface Category {
  id: string;
  name: string;
  channels: Channel[];
}

export interface Server {
  id: string;
  name: string;
  short: string;
  icon?: string;
  iconUrl?: string;
  iconSource?: string;
  iconCrop?: AvatarCrop;
  bannerUrl?: string;
  description?: string;
  color: string;
  banner: string;
  members: string[];
  categories: Category[];
  verification?: "none" | "low" | "medium" | "high";
  notifications?: "all" | "mentions" | "nothing";
  roles?: ServerRole[];
  emojis?: ServerEmoji[];
  invites?: ServerInvite[];
  slowMode?: number;
  explicitFilter?: "off" | "members" | "all";
  require2fa?: boolean;
  banned?: string[];
  /** градиентные никнеймы (нужен 2 уровень буста) */
  gradientNicks?: boolean;
  unread?: boolean;
  mentions?: number;
}

export interface FriendRequest {
  userId: string;
  direction: "incoming" | "outgoing";
}

export interface Reaction {
  emoji: string;
  count: number;
  me: boolean;
}

export interface Message {
  id: string;
  userId: string;
  text: string;
  time: string;
  day?: string;
  reactions: Reaction[];
  replyTo?: { name: string; text: string };
  edited?: boolean;
  pinned?: boolean;
  system?: boolean;
}

export const ME: User = {
  id: "me",
  name: "Вы",
  tag: "you_tyam",
  initials: "ВЫ",
  avatar: "from-max-500 to-violet-max",
  status: "online",
  custom: "на волне TYAM",
};

/** Каталог людей TYAM: из него вы сами добавляете друзей и приглашаете их на свои серверы. */
export const USERS: Record<string, User> = {
  me: ME,
  alina: {
    id: "alina",
    name: "Алина",
    tag: "alina.dev",
    initials: "АЛ",
    avatar: "from-pink-500 to-rose-400",
    status: "online",
    role: "Админ",
    roleColor: "text-max-300",
    activity: "VS Code — tyam-app",
    custom: "деплою мечты ✨",
    premium: true,
  },
  mark: {
    id: "mark",
    name: "Марк",
    tag: "mark_ttv",
    initials: "МК",
    avatar: "from-amber-500 to-orange-500",
    status: "online",
    role: "Модератор",
    roleColor: "text-emerald-400",
    activity: "Играет в Cyberpunk 2077",
  },
  sonya: {
    id: "sonya",
    name: "Соня",
    tag: "sonya.design",
    initials: "СН",
    avatar: "from-violet-500 to-fuchsia-500",
    status: "idle",
    role: "Дизайнер",
    roleColor: "text-fuchsia-400",
    custom: "рисую интерфейсы 🎨",
  },
  timur: {
    id: "timur",
    name: "Тимур",
    tag: "timur_go",
    initials: "ТМ",
    avatar: "from-cyan-500 to-sky-500",
    status: "dnd",
    role: "Разработчик",
    roleColor: "text-cyan-300",
    activity: "Слушает Spotify",
    custom: "не беспокоить — компилирую",
  },
  kira: {
    id: "kira",
    name: "Кира",
    tag: "kira.stream",
    initials: "КР",
    avatar: "from-emerald-500 to-teal-400",
    status: "online",
    activity: "Стримит на TYAM Live",
    premium: true,
  },
  dan: {
    id: "dan",
    name: "Даня",
    tag: "danya_pro",
    initials: "ДН",
    avatar: "from-blue-500 to-indigo-500",
    status: "online",
  },
  lexa: {
    id: "lexa",
    name: "Лёха",
    tag: "lexa_bass",
    initials: "ЛХ",
    avatar: "from-red-500 to-rose-500",
    status: "offline",
  },
  nika: {
    id: "nika",
    name: "Ника",
    tag: "nika.art",
    initials: "НК",
    avatar: "from-lime-500 to-emerald-500",
    status: "idle",
  },
  oleg: {
    id: "oleg",
    name: "Олег",
    tag: "oleg_ops",
    initials: "ОЛ",
    avatar: "from-slate-500 to-slate-400",
    status: "offline",
  },
  vera: {
    id: "vera",
    name: "Вера",
    tag: "vera.pm",
    initials: "ВР",
    avatar: "from-orange-500 to-amber-400",
    status: "online",
    role: "Менеджер",
    roleColor: "text-amber-300",
  },
};

/** Серверов по умолчанию нет — создайте свой через «+» в левом меню. */
export const SERVERS: Server[] = [];

/** История сообщений пуста: каналы и ЛС начинаются с чистого листа. */
export const INITIAL_MESSAGES: Record<string, Message[]> = {};

/** В голосовых каналах никого, пока вы не подключитесь сами. */
export const VOICE_OCCUPANTS: Record<string, string[]> = {};

export interface EmojiGroup {
  id: string;
  name: string;
  icon: string;
  emojis: string[];
}

export const EMOJI_GROUPS: EmojiGroup[] = [
  {
    id: 'popular',
    name: 'Часто используемые',
    icon: '⭐',
    emojis: ['👍', '🔥', '😂', '💙', '🎉', '👀', '💜', '🚀', '😍', '🤔', '👏', '💯', '❤', '✨', '😎', '🙏', '👋', '🤝', '✌', '🥳'],
  },
  {
    id: 'smileys',
    name: 'Смайлы и эмоции',
    icon: '😄',
    emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😊', '😇', '🙂', '😉', '😌', '🥰', '😜', '🤪', '😝', '🤗', '🤭', '🤫', '😏', '😒', '🙄', '😬', '😮', '🥲', '😢', '😭', '😤', '😠', '🤯', '😳', '🥺', '😱', '🤠', '🥳', '🤓', '🧐', '😴', '🤤', '😷', '🤒', '🤐', '🤡', '👻', '💀', '😵', '🤕', '🤑', '🤨', '😯', '😶', '🫠', '🫡', '🙃', '🥸', '😋', '😙', '😚'],
  },
  {
    id: 'gestures',
    name: 'Жесты и люди',
    icon: '👋',
    emojis: ['👋', '🤚', '✋', '🖖', '👌', '🤌', '✌', '🤞', '🫰', '🤟', '🤘', '👈', '👉', '👆', '👇', '☝', '✊', '👊', '🤛', '🤜', '🙌', '👐', '🤲', '🤝', '💪', '🦾', '🫶', '🙏', '🤦', '🤷', '🙅', '🙆', '💁', '🙋', '🧏', '💃', '🕺', '🤩', '😹', '👶', '👦', '👧', '🧑', '👨', '👩', '👱', '🧓', '🤴', '👾', '🤶'],
  },
  {
    id: 'hearts',
    name: 'Сердца и символы',
    icon: '💙',
    emojis: ['❤', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '💌', '💫', '⭐', '🌟', '⚡', '☄', '💥', '🔥', '🌈', '☀', '🌙', '❄', '💧', '🎵', '🎶', '➕', '✔', '❌', '❓', '❗', '💤', '💯', '♻', '🏷', '🏹', '🏁', '⚠', '🔞'],
  },
  {
    id: 'animals',
    name: 'Животные и природа',
    icon: '🐱',
    emojis: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐨', '🐯', '🐮', '🦁', '🐷', '🐸', '🐵', '🙈', '🙉', '🙊', '🐔', '🐧', '🐦', '🦆', '🦅', '🦉', '🦄', '🐝', '🐛', '🦋', '🐌', '🐢', '🐍', '🦕', '🦖', '🐙', '🐬', '🐳', '🦈', '🦡', '🐴', '🦌', '🌵', '🌲', '🌸', '🌺', '🌻', '🌹', '🍀', '🍁', '🍄', '🌊', '🌴', '⛰', '🌋'],
  },
  {
    id: 'weather',
    name: 'Погода и космос',
    icon: '🌤',
    emojis: ['🌍', '🌎', '🌏', '🌑', '🌒', '🌓', '🌔', '🌕', '🌛', '🌞', '⭐', '🌟', '🌌', '🌤', '⛅', '⛈', '🌥', '🌦', '🌧', '🌨', '🌩', '🌪', '☁', '⛄', '☃', '🔥', '💧', '☄', '🛰', '🚀', '🛸'],
  },
  {
    id: 'food',
    name: 'Еда и напитки',
    icon: '🍕',
    emojis: ['🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍒', '🍑', '🥭', '🍍', '🥥', '🥑', '🍅', '🌽', '🥕', '🍞', '🥐', '🥨', '🧀', '🍗', '🍔', '🍟', '🍕', '🌭', '🥪', '🌮', '🍣', '🍜', '🍝', '🍦', '🍩', '🍪', '🎂', '🍰', '🍫', '🍿', '☕', '🍵', '🧃', '🥤', '🧋', '🍺', '🍻', '🥂', '🍾', '🍷'],
  },
  {
    id: 'activity',
    name: 'Игры и спорт',
    icon: '🎮',
    emojis: ['⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🎱', '🏓', '🎯', '🎮', '🕹', '🎲', '♟', '🧩', '🎳', '🏉', '🏏', '🏑', '🏒', '⛸', '🎿', '🛹', '⛷', '🏇', '🏆', '🥇', '🥈', '🥉', '🏅', '🤺', '🏃', '🏊', '🤼', '🤸', '🤽', '🤾', '🏋', '🚴', '🏄', '🧘'],
  },
  {
    id: 'objects',
    name: 'Объекты и техника',
    icon: '💻',
    emojis: ['💻', '⌨', '🖥', '📱', '💾', '💡', '🔦', '📚', '✏', '📌', '📎', '🔒', '🔑', '🛠', '⚙', '🧲', '🧭', '📡', '📦', '🎁', '🎈', '🎊', '🎉', '🎬', '🎤', '🎧', '🎸', '🎹', '🥁', '🎨', '🎭', '📸', '📽', '💽', '🔋', '🔌', '🧪', '🧯', '🪛'],
  },
  {
    id: 'transport',
    name: 'Транспорт и места',
    icon: '🚗',
    emojis: ['🚗', '🚕', '🚑', '🚓', '🚌', '🚂', '🚙', '🏎', '🚲', '🛴', '🏍', '🛵', '✈', '🚀', '🛸', '⛵', '🚤', '🛳', '⚓', '⛱', '🏖', '🏟', '🏠', '🏢', '🏰', '🗼', '🗽', '🏙', '🌆', '🌇', '🌃', '🏘', '⛪', '🗾', '🎪', '🎠', '🎡', '🎢', '🕰', '🛝'],
  },
  {
    id: 'party',
    name: 'Вечеринка TYAM',
    icon: '🎉',
    emojis: ['🎉', '🎈', '🎆', '🎇', '🧨', '🎀', '🎁', '🎊', '🪝', '🎪', '🎭', '🎩', '🥂', '🍻', '🍾', '🍷', '🍟', '🍔', '🏆', '🥇', '✨', '💫', '🌈', '🎌', '🏁', '🎮', '🔥', '💯', '🤝', '🙌'],
  },
  {
    id: 'flags',
    name: 'Флаги и значки',
    icon: '🚩',
    emojis: ['🚩', '🏁', '🏳', '🏴', '🎌', '🔭', '📃', '📍', '🔰', '🏷', '⚠', '🚫', '🔞', '⬆', '⬇', '➡', '🔼', '🔽', '✅', '❎', '❗', '❓', '🆒', '🆕', '🆗', '🈁', '🈷', '©', '®', '™'],
  },
];

export const EMOJIS = EMOJI_GROUPS.flatMap((g) => g.emojis);

export function nowTime(): string {
  const d = new Date();
  return `Сегодня, ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}