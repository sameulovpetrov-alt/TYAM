import { useMemo, useState } from "react";
import { Check, Crown, Gem, Handshake, Layers, Package, ShoppingBag, Sparkles, Store, Wand2, X, Clapperboard } from "lucide-react";
import { BANNER_GRADIENTS, COLLABS, RARITY_COLOR, SHOP_BUNDLES, SHOP_ITEMS, findShopItem } from "../shop";
import type { BundleItem, ShopItem } from "../shop";
import { useSettings } from "../store";
import { cn } from "../utils/cn";
import { AnimatedAvatar, Avatar, ProfileEffect } from "./ui";
import type { User } from "../data";

type Tab = "featured" | "avatar" | "decoration" | "effect" | "frame" | "bundles" | "collabs";

const PREVIEW_USER: User = {
  id: "preview",
  name: "TYAM",
  tag: "tyam",
  initials: "M",
  avatar: "from-max-500 to-violet-max",
  status: "online",
};

function ItemPreview({ item, big = false }: { item: ShopItem; big?: boolean }) {
  if (item.type === "avatar") {
    const size = big ? 92 : 66;
    return (
      <div className="relative flex h-full flex-col items-center justify-center gap-2">
        <div className="relative">
          <AnimatedAvatar animation={item.css} size={size} showStatus={false} />
          <span className="animav-shine absolute inset-0 rounded-full" aria-hidden />
        </div>
        <span className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-extrabold tracking-wider text-white uppercase" style={{ backgroundColor: item.tint ? `${item.tint}33` : "#1b2846", color: item.tint ?? "#eef3ff" }}>
          анимировано
        </span>
      </div>
    );
  }
  if (item.type === "decoration") {
    return (
      <div className="flex h-full items-center justify-center">
        <Avatar user={PREVIEW_USER} size={big ? 84 : 64} showStatus={false} decoration={item.css} />
      </div>
    );
  }
  if (item.type === "effect") {
    return (
      <div className="relative mx-4 h-full max-h-24 overflow-hidden rounded-xl bg-gradient-to-br from-max-600 via-indigo-600 to-violet-max">
        <ProfileEffect effect={item.css} />
        <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
          <Avatar user={PREVIEW_USER} size={22} showStatus={false} />
          <span className="text-[10px] font-bold text-white/90">Ваш профиль</span>
        </div>
      </div>
    );
  }
  return (
    <div className="flex h-full items-center justify-center px-5">
      <div className={cn("w-full rounded-xl bg-ink-800 p-2.5", item.css)}>
        <div className="flex items-center gap-2">
          <Avatar user={PREVIEW_USER} size={26} showStatus={false} />
          <div className="min-w-0">
            <div className="h-2 w-16 rounded bg-fog-500/50" />
            <div className="mt-1 h-1.5 w-10 rounded bg-fog-500/30" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ShopView() {
  const { settings, update, toast } = useSettings();
  const [tab, setTab] = useState<Tab>("featured");
  const [collab, setCollab] = useState<string | null>(null);
  const [preview, setPreview] = useState<ShopItem | null>(null);

  const owned = new Set(settings.owned);
  const price = (item: { price: number; premiumPrice: number }) => (settings.premium ? item.premiumPrice : item.price);

  const buyItem = (item: ShopItem) => {
    if (owned.has(item.id)) return;
    update({ owned: [...settings.owned, item.id] });
    toast(`«${item.name}» куплено за ${price(item)} ₽. Наденьте его!`, "boost");
  };

  const buyBundle = (bundle: BundleItem) => {
    const missing = bundle.items.filter((id) => !owned.has(id));
    if (missing.length === 0) return;
    update({ owned: [...settings.owned, ...missing] });
    toast(`${bundle.name} куплен — ${missing.length} предмет(а) в инвентаре!`, "boost");
  };

  const toggleEquip = (item: ShopItem) => {
    const slot = item.type;
    const isOn = settings.equipped[slot] === item.css;
    update({ equipped: { ...settings.equipped, [slot]: isOn ? null : item.css } });
    toast(isOn ? `«${item.name}» снято` : `«${item.name}» надето ✨`, isOn ? "info" : "success");
  };

  const items = useMemo(() => {
    let list = SHOP_ITEMS;
    if (tab === "avatar" || tab === "decoration" || tab === "effect" || tab === "frame") list = list.filter((i) => i.type === tab);
    if (tab === "featured") list = list.filter((i) => i.rarity === "легендарный" || i.type === "avatar");
    if (tab === "collabs") list = list.filter((i) => (collab ? i.collab === collab : Boolean(i.collab)));
    return list;
  }, [tab, collab]);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "featured", label: "Рекомендуем", icon: <Sparkles className="h-4 w-4" /> },
    { id: "avatar", label: "Анимированные аватары", icon: <Clapperboard className="h-4 w-4" /> },
    { id: "decoration", label: "Украшения", icon: <Wand2 className="h-4 w-4" /> },
    { id: "effect", label: "Эффекты профиля", icon: <Gem className="h-4 w-4" /> },
    { id: "frame", label: "Рамки профиля", icon: <Layers className="h-4 w-4" /> },
    { id: "bundles", label: "Наборы", icon: <Package className="h-4 w-4" /> },
    { id: "collabs", label: "Коллаборации", icon: <Handshake className="h-4 w-4" /> },
  ];

  const equippedCount = Object.values(settings.equipped).filter(Boolean).length;

  const PriceButton = ({ item }: { item: ShopItem }) => {
    const isOwned = owned.has(item.id);
    const isEquipped = settings.equipped[item.type] === item.css;
    if (isOwned) {
      return (
        <button
          onClick={() => toggleEquip(item)}
          className={cn(
            "flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition active:scale-95",
            isEquipped ? "bg-online/20 text-online hover:bg-online/30" : "max-gradient text-white hover:brightness-110"
          )}
        >
          {isEquipped ? <><Check className="h-3.5 w-3.5" /> Надето · снять</> : <>Надеть</>}
        </button>
      );
    }
    return (
      <button
        onClick={() => buyItem(item)}
        className="boost-gradient flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold text-white transition hover:brightness-110 active:scale-95"
      >
        <ShoppingBag className="h-3.5 w-3.5" />
        {price(item)} ₽
        {settings.premium && <span className="text-[10px] line-through opacity-70">{item.price}</span>}
      </button>
    );
  };

  return (
    <section className="chat-ambient flex min-w-0 flex-1 flex-col bg-ink-800">
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-ink-950/60 px-4 shadow-sm">
        <Store className="h-5 w-5 text-boost-1" />
        <span className="font-display text-[15px] font-bold text-white">Магазин TYAM</span>
        <span className="ml-2 hidden rounded-full bg-boost-2/15 px-2.5 py-0.5 text-[11px] font-bold text-boost-1 sm:block">
          Инвентарь: {settings.owned.length} · надето: {equippedCount}
        </span>
        {settings.premium && (
          <span className="max-gradient ml-auto flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold text-white">
            <Crown className="h-3 w-3" /> Скидки Premium активны
          </span>
        )}
      </header>

      <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-ink-950/40 px-4 py-2 [scrollbar-width:none]">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setCollab(null); }}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition",
              tab === t.id ? "boost-gradient text-white shadow-md shadow-boost-2/30" : "text-fog-400 hover:bg-ink-700 hover:text-fog-100"
            )}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        {/* коллаб-витрина */}
        {(tab === "featured" || tab === "collabs") && (
          <div className={cn("mb-6 grid gap-3", tab === "collabs" ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 lg:grid-cols-3")}>
            {COLLABS.map((c) => (
              <button
                key={c.id}
                onClick={() => { setTab("collabs"); setCollab(collab === c.id ? null : c.id); }}
                className={cn(
                  "group relative overflow-hidden rounded-2xl bg-gradient-to-br p-5 text-left transition hover:scale-[1.02]",
                  c.gradient,
                  tab === "collabs" && collab === c.id && "ring-2 ring-white ring-offset-2 ring-offset-ink-800"
                )}
              >
                <div className="absolute inset-0 bg-black/25 transition group-hover:bg-black/10" />
                <div className="relative">
                  <div className="flex items-center gap-1.5 text-[10px] font-extrabold tracking-widest text-white/80 uppercase">
                    <Handshake className="h-3.5 w-3.5" /> TYAM × {c.id}
                  </div>
                  <div className="font-display mt-2 text-lg font-extrabold text-white drop-shadow">{c.tagline}</div>
                  <div className="mt-1 text-xs font-semibold text-white/80">
                    {SHOP_ITEMS.filter((i) => i.collab === c.id).length} предмета · нажмите, чтобы смотреть
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {tab === "avatar" && (
          <div className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-max-500 via-indigo-500 to-violet-500 p-6 text-white">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgba(255,255,255,0.3),transparent_60%)]" />
            <div className="relative flex flex-wrap items-center gap-5">
              <div className="relative">
                <AnimatedAvatar animation="animav-prism" size={78} showStatus={false} />
                <span className="animav-shine absolute inset-0 rounded-full" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-[10px] font-extrabold tracking-widest uppercase">
                  <Clapperboard className="h-3.5 w-3.5" /> Анимированные аватары
                </div>
                <h2 className="font-display mt-1.5 text-xl font-extrabold">Ваш аватар оживает</h2>
                <p className="mt-1 max-w-md text-sm text-white/85">
                  Живые слои поверх вашего фото или инициалов: работают в чатах, списках участников и профиле. Достаточно надеть — и всё обновится мгновенно.
                </p>
              </div>
            </div>
          </div>
        )}

        {tab === "collabs" && collab && (
          <div className="mb-3 flex items-center gap-2 text-sm text-fog-400">
            Коллекция <span className="font-bold text-white">{collab}</span>
            <button onClick={() => setCollab(null)} className="flex items-center gap-1 rounded-full bg-ink-700 px-2 py-0.5 text-xs hover:text-white">
              <X className="h-3 w-3" /> все коллаборации
            </button>
          </div>
        )}

        {/* наборы */}
        {tab === "bundles" ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {SHOP_BUNDLES.map((bundle) => {
              const bundleItems = bundle.items.map(findShopItem).filter((i): i is ShopItem => Boolean(i));
              const allOwned = bundle.items.every((id) => owned.has(id));
              return (
                <div key={bundle.id} className="group overflow-hidden rounded-2xl border border-ink-600/50 bg-ink-850 transition hover:border-boost-2/50 hover:shadow-xl hover:shadow-boost-2/10">
                  <div className="flex h-28 items-center justify-center gap-3 bg-gradient-to-br from-ink-900 to-ink-750">
                    {bundleItems.map((item) => (
                      <div key={item.id} className="h-20 w-20 transition group-hover:scale-110">
                        <ItemPreview item={item} />
                      </div>
                    ))}
                  </div>
                  <div className="p-4">
                    {bundle.collab && <div className="text-[10px] font-extrabold tracking-widest text-boost-1 uppercase">TYAM × {bundle.collab}</div>}
                    <h3 className="font-display mt-1 text-[15px] font-bold text-white">{bundle.name}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-fog-500">{bundle.desc}</p>
                    <button
                      onClick={() => buyBundle(bundle)}
                      disabled={allOwned}
                      className={cn(
                        "mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-bold transition active:scale-95",
                        allOwned ? "cursor-default bg-online/15 text-online" : "boost-gradient text-white hover:brightness-110"
                      )}
                    >
                      {allOwned ? <><Check className="h-4 w-4" /> В инвентаре</> : <><Package className="h-4 w-4" /> Купить набор · {price(bundle)} ₽</>}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="group flex flex-col overflow-hidden rounded-2xl border border-ink-600/50 bg-ink-850 transition hover:-translate-y-1 hover:border-boost-2/50 hover:shadow-xl hover:shadow-boost-2/10"
              >
                <button onClick={() => setPreview(item)} title="Предпросмотр" className="relative h-28 bg-gradient-to-br from-ink-900 to-ink-750 pt-3 pb-1">
                  <ItemPreview item={item} />
                  {item.collab && (
                    <span className="absolute top-2 left-2 rounded-full bg-black/40 px-2 py-0.5 text-[9px] font-extrabold tracking-wider text-white uppercase backdrop-blur">
                      × {item.collab}
                    </span>
                  )}
                  {settings.equipped[item.type] === item.css && (
                    <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-online text-white"><Check className="h-3 w-3" /></span>
                  )}
                </button>
                <div className="flex flex-1 flex-col p-3">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="truncate text-sm font-bold text-white">{item.name}</h3>
                    <span className={cn("shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold", RARITY_COLOR[item.rarity])}>{item.rarity}</span>
                  </div>
                  <p className="mt-0.5 line-clamp-2 flex-1 text-[11px] leading-snug text-fog-500">{item.desc}</p>
                  <div className="mt-2.5">
                    <PriceButton item={item} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* предпросмотр */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4" onClick={() => setPreview(null)}>
          <div className="modal-in w-full max-w-sm overflow-hidden rounded-2xl bg-ink-800 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className={cn("relative h-32 bg-gradient-to-br", BANNER_GRADIENTS[2])}>
              {(preview.type === "effect" || preview.type === "frame") && <ProfileEffect effect={preview.type === "effect" ? preview.css : settings.equipped.effect} />}
              <button onClick={() => setPreview(null)} title="Закрыть" className="absolute top-3 right-3 rounded-full bg-black/30 p-1.5 text-white transition hover:rotate-90"><X className="h-4 w-4" /></button>
            </div>
            <div className={cn("relative mx-5 -mt-10 rounded-2xl bg-ink-800 p-4", preview.type === "frame" && preview.css)}>
              {preview.type === "avatar" ? (
                <div className="relative inline-flex -mt-1">
                  <AnimatedAvatar animation={preview.css} size={72} showStatus={false} />
                  <span className="animav-shine absolute inset-0 rounded-full" aria-hidden />
                </div>
              ) : (
              <Avatar user={PREVIEW_USER} size={64} ring="ring-ink-800" decoration={preview.type === "decoration" ? preview.css : settings.equipped.decoration} />
              )}
              <h3 className="font-display mt-2 text-lg font-bold text-white">{preview.name}</h3>
              <p className="mt-1 text-sm text-fog-400">{preview.desc}</p>
              {preview.collab && <div className="mt-2 text-[10px] font-extrabold tracking-widest text-boost-1 uppercase">Коллаборация TYAM × {preview.collab}</div>}
              <div className="mt-4">
                <PriceButton item={preview} />
              </div>
            </div>
            <div className="h-5" />
          </div>
        </div>
      )}
    </section>
  );
}
