export const LAUNCHER_VERSION = "1.0.0";
const PREFERENCES_KEY = "tyam.launcher.preferences.v1";
const LAST_LAUNCH_KEY = "tyam.launcher.lastLaunch";

export interface LauncherPreferences {
  windowMode: "window" | "fullscreen";
  showSplash: boolean;
  autoLaunch: boolean;
  reducedMotion: boolean;
}

export const DEFAULT_LAUNCHER_PREFERENCES: LauncherPreferences = {
  windowMode: "window",
  showSplash: true,
  autoLaunch: false,
  reducedMotion: false,
};

export function readLauncherPreferences(): LauncherPreferences {
  try {
    const saved = JSON.parse(localStorage.getItem(PREFERENCES_KEY) ?? "{}");
    return {
      windowMode: saved?.windowMode === "fullscreen" ? "fullscreen" : "window",
      showSplash: typeof saved?.showSplash === "boolean" ? saved.showSplash : true,
      autoLaunch: saved?.autoLaunch === true,
      reducedMotion: saved?.reducedMotion === true,
    };
  } catch {
    return { ...DEFAULT_LAUNCHER_PREFERENCES };
  }
}

export function saveLauncherPreferences(preferences: LauncherPreferences): boolean {
  try {
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
    return true;
  } catch {
    return false;
  }
}

export function readLastLaunch(): string | null {
  try {
    const value = localStorage.getItem(LAST_LAUNCH_KEY);
    return value && Number.isFinite(Date.parse(value)) ? value : null;
  } catch {
    return null;
  }
}

export function recordLaunch(): string {
  const value = new Date().toISOString();
  try {
    localStorage.setItem(LAST_LAUNCH_KEY, value);
  } catch {
    // The launcher remains usable when browser storage is unavailable.
  }
  return value;
}

export function formatLaunchDate(date: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export interface LauncherStory {
  id: "profile" | "servers" | "voice";
  category: string;
  title: string;
  summary: string;
  description: string;
  details: string[];
}

export const LAUNCHER_STORIES: LauncherStory[] = [
  {
    id: "profile",
    category: "ТВОЙ СТИЛЬ",
    title: "Профиль с характером",
    summary: "Украшения, эффекты и живые аватары.",
    description: "Пусть профиль расскажет о тебе ещё до первого сообщения.",
    details: [
      "Загрузи своё фото и баннер в настройках профиля.",
      "Примерь украшения, рамки и анимации в магазине TYAM.",
      "Выбери два цвета для градиентного никнейма на серверах с бустами.",
    ],
  },
  {
    id: "servers",
    category: "ТВОЁ СООБЩЕСТВО",
    title: "Сервер по твоим правилам",
    summary: "Каналы и роли для своей компании.",
    description: "От уютного чата для друзей до пространства для целого сообщества.",
    details: [
      "Создай сервер по шаблону и добавь категории правой кнопкой мыши.",
      "Настрой права доступа, роли и оформление каналов.",
      "Следи за новыми уровнями во вкладке «Бусты», не засоряя чат.",
    ],
  },
  {
    id: "voice",
    category: "ТВОЙ ГОЛОС",
    title: "Ближе, чем кажется",
    summary: "Голосовые комнаты, камера и экран.",
    description: "Собери всё нужное для общения в одном пространстве.",
    details: [
      "Создай голосовой канал и открой панель звонка.",
      "Проверь микрофон и камеру до подключения.",
      "Управляй локальной камерой и демонстрацией экрана. Связь между устройствами требует серверной части.",
    ],
  },
];