export type PermissionScope = "server" | "members" | "text" | "voice" | "apps" | "events" | "advanced";
export type PermissionId = string;

export interface PermissionDefinition {
  id: PermissionId;
  label: string;
  description: string;
}

export interface PermissionGroup {
  id: PermissionScope;
  label: string;
  description: string;
  permissions: PermissionDefinition[];
}

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    id: "server",
    label: "Основные права сервера",
    description: "Управление структурой и настройками сервера",
    permissions: [
      { id: "server.view_channels", label: "Просматривать каналы", description: "Видеть каналы сервера, кроме приватных по умолчанию." },
      { id: "server.manage_channels", label: "Управлять каналами", description: "Создавать, переименовывать, редактировать и удалять каналы." },
      { id: "server.manage_roles", label: "Управлять ролями", description: "Создавать, редактировать и удалять роли ниже своей высшей роли." },
      { id: "server.create_expressions", label: "Создавать выражения", description: "Добавлять пользовательские эмодзи, стикеры и звуки сервера." },
      { id: "server.manage_expressions", label: "Управлять выражениями", description: "Редактировать и удалять пользовательские эмодзи, стикеры и звуки." },
      { id: "server.view_audit_log", label: "Просматривать журнал аудита", description: "Видеть историю изменений и действий администрации." },
      { id: "server.manage_webhooks", label: "Управлять вебхуками", description: "Создавать, редактировать и удалять вебхуки сервера." },
      { id: "server.manage_server", label: "Управлять сервером", description: "Менять название, регион, приглашения, виджеты и правила сервера." },
    ],
  },
  {
    id: "members",
    label: "Права участников",
    description: "Приглашения, профили и модерация участников",
    permissions: [
      { id: "member.create_invites", label: "Создание приглашений", description: "Создавать ссылки и приглашать на сервер новых участников." },
      { id: "member.change_nickname", label: "Изменять никнейм", description: "Менять собственный никнейм только на этом сервере." },
      { id: "member.manage_nicknames", label: "Управлять никнеймами", description: "Менять никнеймы других участников с более низкой ролью." },
      { id: "member.kick", label: "Выгонять участников", description: "Исключать участников с сервера; вернуться можно по приглашению." },
      { id: "member.ban", label: "Банить участников", description: "Навсегда удалять участников и при необходимости историю сообщений." },
      { id: "member.timeout", label: "Ограничивать общение", description: "Временно запрещать участникам отправлять сообщения и говорить." },
    ],
  },
  {
    id: "text",
    label: "Права текстового канала",
    description: "Сообщения, публикации, файлы и ветки",
    permissions: [
      { id: "text.send_messages", label: "Отправка сообщений и создание публикаций", description: "Писать в текстовых каналах и создавать публикации." },
      { id: "text.send_threads", label: "Отправлять сообщения в ветках", description: "Писать в существующих ветках и публикациях форума." },
      { id: "text.create_public_threads", label: "Создать публичные ветки", description: "Создавать ветки, которые видят все участники канала." },
      { id: "text.create_private_threads", label: "Создание приватных веток", description: "Создавать ветки с доступом только по приглашению." },
      { id: "text.embed_links", label: "Встраивать ссылки", description: "Показывать предпросмотр ссылок в сообщениях." },
      { id: "text.attach_files", label: "Прикреплять файлы", description: "Загружать изображения, файлы и медиаконтент." },
      { id: "text.add_reactions", label: "Добавлять реакции", description: "Добавлять новые реакции к сообщениям." },
      { id: "text.use_external_emojis", label: "Использовать внешние эмодзи", description: "Использовать эмодзи с других серверов." },
      { id: "text.use_external_stickers", label: "Использовать внешние стикеры", description: "Использовать стикеры с других серверов." },
      { id: "text.mention_everyone", label: "Упоминание @everyone, @here и всех ролей", description: "Отправлять массовые уведомления участникам канала." },
      { id: "text.manage_messages", label: "Управлять сообщениями", description: "Удалять и редактировать сообщения других участников." },
      { id: "text.pin_messages", label: "Закреплять сообщения", description: "Закреплять и откреплять сообщения канала." },
      { id: "text.bypass_slowmode", label: "Обход медленного режима", description: "Отправлять сообщения без ограничения частоты." },
      { id: "text.manage_threads", label: "Управление ветками и публикациями", description: "Переименовывать, удалять и закреплять ветки и публикации." },
      { id: "text.read_history", label: "Читать историю сообщений", description: "Видеть сообщения, опубликованные до присоединения к каналу." },
      { id: "text.text_to_speech", label: "Отправка сообщений text-to-speech", description: "Отправлять сообщения, которые озвучиваются вслух." },
      { id: "text.voice_messages", label: "Отправлять голосовые сообщения", description: "Отправлять голосовые сообщения в текстовый канал." },
      { id: "text.create_polls", label: "Создание опросов", description: "Создавать опросы и голосования." },
    ],
  },
  {
    id: "voice",
    label: "Права голосового канала",
    description: "Подключение, речь, видео и управление участниками",
    permissions: [
      { id: "voice.connect", label: "Подключаться", description: "Подключаться к голосовым каналам и слушать других участников." },
      { id: "voice.speak", label: "Говорить", description: "Общаться в голосовых каналах с включённым микрофоном." },
      { id: "voice.video", label: "Видео", description: "Делиться видео, показывать экран или стримить игры." },
      { id: "voice.soundboard", label: "Использовать звуковую панель", description: "Отправлять звуки со звуковой панели сервера." },
      { id: "voice.external_sounds", label: "Использовать внешние звуки", description: "Использовать звуки с других серверов." },
      { id: "voice.voice_activity", label: "Использовать активацию по голосу", description: "Говорить без режима рации и использовать шумоподавление." },
      { id: "voice.priority_speaker", label: "Приоритетный режим", description: "Понижать громкость других участников во время речи." },
      { id: "voice.mute_members", label: "Отключать участникам микрофон", description: "Отключать микрофон других участников канала." },
      { id: "voice.deafen_members", label: "Отключать участникам звук", description: "Отключать звук других участников в голосовых каналах." },
      { id: "voice.move_members", label: "Перемещать участников", description: "Перемещать участников между голосовыми каналами." },
      { id: "voice.set_status", label: "Задать статус голосового канала", description: "Создавать и редактировать статус голосового канала." },
    ],
  },
  {
    id: "apps",
    label: "Права приложений",
    description: "Команды, активности и внешние приложения",
    permissions: [
      { id: "apps.commands", label: "Использовать команды приложений", description: "Использовать слэш-команды и контекстное меню приложений." },
      { id: "apps.activities", label: "Использовать активности", description: "Запускать совместные активности в голосовых каналах." },
      { id: "apps.external", label: "Использовать внешние приложения", description: "Разрешать приложениям отправлять привязанные сообщения." },
    ],
  },
  {
    id: "events",
    label: "Права доступа к событиям",
    description: "Календарь и события сообщества",
    permissions: [
      { id: "events.create", label: "Создавать события", description: "Создавать события сервера." },
      { id: "events.manage", label: "Управление событиями", description: "Редактировать и отменять события." },
    ],
  },
  {
    id: "advanced",
    label: "Расширенные права",
    description: "Права с полным доступом — используйте с осторожностью",
    permissions: [
      { id: "advanced.administrator", label: "Администратор", description: "Получает все права и обходит ограничения каналов, кроме иерархии ролей." },
    ],
  },
];

export const ALL_PERMISSION_IDS = PERMISSION_GROUPS.flatMap((group) => group.permissions.map((permission) => permission.id));

export function permissionById(id: PermissionId): PermissionDefinition | undefined {
  return PERMISSION_GROUPS.flatMap((group) => group.permissions).find((permission) => permission.id === id);
}

export function permissionsForChannelType(type: "text" | "voice"): PermissionGroup[] {
  const shared = PERMISSION_GROUPS.filter((group) => group.id === "server" || group.id === "members" || group.id === "advanced");
  const channel = PERMISSION_GROUPS.filter((group) => group.id === (type === "text" ? "text" : "voice"));
  const apps = PERMISSION_GROUPS.filter((group) => group.id === "apps" || group.id === "events");
  return [...shared, ...channel, ...apps];
}