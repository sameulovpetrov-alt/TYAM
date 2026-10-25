/* Каталог магазина TYAM: украшения аватара, эффекты профиля, рамки, наборы, коллаборации */

export type ShopItemType = "decoration" | "effect" | "frame" | "avatar";

export interface ShopItem {
  id: string;
  type: ShopItemType;
  name: string;
  desc: string;
  price: number;
  premiumPrice: number;
  collab?: string;
  rarity: "обычный" | "редкий" | "эпический" | "легендарный";
  /** css-класс превью/оверлея (определён в index.css) */
  css: string;
  /** для наборов: что входит */
  bundle?: string[];
  /** только для анимированных аватаров: основной цвет подсветки */
  tint?: string;
}

export interface BundleItem {
  id: string;
  name: string;
  desc: string;
  price: number;
  premiumPrice: number;
  collab?: string;
  items: string[];
}

export const RARITY_COLOR: Record<ShopItem["rarity"], string> = {
  "обычный": "text-fog-400 bg-ink-700",
  "редкий": "text-max-300 bg-max-500/15",
  "эпический": "text-fuchsia-300 bg-fuchsia-500/15",
  "легендарный": "text-idle bg-idle/15",
};

export const SHOP_ITEMS: ShopItem[] = [
  // ── украшения аватара ──
  { id: "deco-neon", type: "decoration", name: "Неоновое кольцо", desc: "Вращающееся неоновое сияние вокруг аватара", price: 249, premiumPrice: 199, rarity: "редкий", css: "deco-neon" },
  { id: "deco-flame", type: "decoration", name: "Пламя", desc: "Аватар объяло огненное кольцо", price: 299, premiumPrice: 249, rarity: "эпический", css: "deco-flame" },
  { id: "deco-gold", type: "decoration", name: "Золотой лавр", desc: "Золотое кольцо с пробеганием блика", price: 399, premiumPrice: 329, rarity: "легендарный", css: "deco-gold" },
  { id: "deco-galaxy", type: "decoration", name: "Галактика", desc: "Космический вихрь из звёздной пыли", price: 349, premiumPrice: 279, collab: "Космофлот", rarity: "эпический", css: "deco-galaxy" },
  { id: "deco-cyber", type: "decoration", name: "Кибер-контур", desc: "Цифровой пунктирный сканер Найт-Сити", price: 329, premiumPrice: 269, collab: "Киберпанк 2077", rarity: "эпический", css: "deco-cyber" },
  { id: "deco-sakura", type: "decoration", name: "Сакура", desc: "Кольцо из лепестков цветущей вишни", price: 299, premiumPrice: 249, collab: "Сакура-фест", rarity: "редкий", css: "deco-sakura" },

  // ── анимированные аватары ──
  { id: "av-tide", type: "avatar", name: "Океанский прилив", desc: "Морская волна мягко поднимается по аватару", price: 399, premiumPrice: 329, rarity: "редкий", css: "animav-tide", tint: "#22d3ee" },
  { id: "av-aurora", type: "avatar", name: "Аврора", desc: "Северное сияние кружит над профилем", price: 449, premiumPrice: 379, collab: "Космофлот", rarity: "эпический", css: "animav-aurora", tint: "#34d399" },
  { id: "av-plasma", type: "avatar", name: "Плазменная сфера", desc: "Пульсирующие кольца энергии расходятся от центра", price: 499, premiumPrice: 419, rarity: "эпический", css: "animav-plasma", tint: "#ff73fa" },
  { id: "av-magma", type: "avatar", name: "Магма", desc: "Раскалённые потоки поднимаются из глубины", price: 449, premiumPrice: 379, rarity: "эпический", css: "animav-magma", tint: "#ffa836" },
  { id: "av-matrix", type: "avatar", name: "Матрица", desc: "Потоки кода стекают по аватару", price: 549, premiumPrice: 459, collab: "Киберпанк 2077", rarity: "легендарный", css: "animav-matrix", tint: "#4ade80" },
  { id: "av-sakura-spin", type: "avatar", name: "Сакура-вихрь", desc: "Лепестки вишни вращаются вокруг аватара", price: 449, premiumPrice: 379, collab: "Сакура-фест", rarity: "редкий", css: "animav-sakura-spin", tint: "#f9a8d4" },
  { id: "av-gold-dust", type: "avatar", name: "Золотая пыль", desc: "Мерцающие искры поднимаются над профилем", price: 549, premiumPrice: 459, rarity: "легендарный", css: "animav-gold-dust", tint: "#ffd700" },
  { id: "av-prism", type: "avatar", name: "Призма", desc: "Радужный конус света вращается по кругу", price: 649, premiumPrice: 549, rarity: "легендарный", css: "animav-prism", tint: "#8a5cf6" },

  // ── эффекты профиля ──
  { id: "fx-stardust", type: "effect", name: "Звёздная пыль", desc: "Мерцающие звёзды поднимаются по баннеру", price: 299, premiumPrice: 249, collab: "Космофлот", rarity: "редкий", css: "fx-stardust" },
  { id: "fx-snow", type: "effect", name: "Снегопад", desc: "Тихий снег над вашим профилем", price: 249, premiumPrice: 199, rarity: "обычный", css: "fx-snow" },
  { id: "fx-neon", type: "effect", name: "Неоновая волна", desc: "Пульсирующая волна фирменного градиента", price: 349, premiumPrice: 279, rarity: "эпический", css: "fx-neon" },
  { id: "fx-sakura", type: "effect", name: "Лепестки сакуры", desc: "Падающие лепестки над баннером", price: 299, premiumPrice: 249, collab: "Сакура-фест", rarity: "редкий", css: "fx-sakura" },
  { id: "fx-matrix", type: "effect", name: "Цифровой дождь", desc: "Каскады кода в стиле Найт-Сити", price: 399, premiumPrice: 329, collab: "Киберпанк 2077", rarity: "легендарный", css: "fx-matrix" },

  // ── рамки профиля ──
  { id: "frame-gradient", type: "frame", name: "Градиент TYAM", desc: "Живая градиентная рамка карточки профиля", price: 199, premiumPrice: 149, rarity: "обычный", css: "frame-gradient" },
  { id: "frame-gold", type: "frame", name: "Золотая оправа", desc: "Двойная золотая рамка с сиянием", price: 349, premiumPrice: 279, rarity: "эпический", css: "frame-gold" },
  { id: "frame-cyber", type: "frame", name: "Кибер-углы", desc: "Угловые скобки HUD из 2077 года", price: 299, premiumPrice: 249, collab: "Киберпанк 2077", rarity: "редкий", css: "frame-cyber" },
  { id: "frame-royal", type: "frame", name: "Королевская", desc: "Фиолетовая оправа с мягким свечением", price: 249, premiumPrice: 199, collab: "Сакура-фест", rarity: "редкий", css: "frame-royal" },
];

export const SHOP_BUNDLES: BundleItem[] = [
  {
    id: "bundle-avatar",
    name: "Набор «Живой профиль»",
    desc: "Призма + Неоновая волна + Градиент TYAM — максимально живой аватар",
    price: 999,
    premiumPrice: 829,
    items: ["av-prism", "fx-neon", "frame-gradient"],
  },
  {
    id: "bundle-cosmos",
    name: "Набор «Космофлот»",
    desc: "Галактика + Звёздная пыль + Градиент TYAM — полный космический образ",
    price: 699,
    premiumPrice: 549,
    collab: "Космофлот",
    items: ["deco-galaxy", "fx-stardust", "frame-gradient"],
  },
  {
    id: "bundle-cyber",
    name: "Набор «Найт-Сити»",
    desc: "Кибер-контур + Цифровой дождь + Кибер-углы",
    price: 799,
    premiumPrice: 649,
    collab: "Киберпанк 2077",
    items: ["deco-cyber", "fx-matrix", "frame-cyber"],
  },
  {
    id: "bundle-sakura",
    name: "Набор «Сакура-фест»",
    desc: "Сакура + Лепестки сакуры + Королевская рамка",
    price: 649,
    premiumPrice: 519,
    collab: "Сакура-фест",
    items: ["deco-sakura", "fx-sakura", "frame-royal"],
  },
];

export const COLLABS = [
  { id: "Киберпанк 2077", tagline: "Проснись, самурай — город ждёт", gradient: "from-yellow-400 via-cyan-400 to-fuchsia-500" },
  { id: "Сакура-фест", tagline: "Весна в каждом профиле", gradient: "from-pink-400 via-rose-300 to-fuchsia-400" },
  { id: "Космофлот", tagline: "Ваш профиль — на орбите", gradient: "from-indigo-500 via-blue-400 to-cyan-300" },
];

export function findShopItem(id: string): ShopItem | undefined {
  return SHOP_ITEMS.find((i) => i.id === id);
}

export const BANNER_GRADIENTS = [
  "from-max-500 to-violet-max",
  "from-pink-500 to-rose-400",
  "from-emerald-500 to-cyan-500",
  "from-amber-500 to-orange-600",
  "from-fuchsia-600 to-indigo-600",
  "from-slate-600 to-slate-900",
];
