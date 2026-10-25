import { useRef } from "react";
import { Clapperboard, ImagePlus, Pencil, Trash2, Wand2 } from "lucide-react";
import { BANNER_GRADIENTS, SHOP_ITEMS, findShopItem } from "../shop";
import { useSettings } from "../store";
import { readImageFile } from "../utils/image";
import { cn } from "../utils/cn";
import { AnimatedAvatar, EditableAvatar, ProfileEffect } from "./ui";
import type { User } from "../data";
import { useProfileAvatarEditor } from "../hooks/useProfileAvatarEditor";

const AVATAR_ANIMATIONS = SHOP_ITEMS.filter((item) => item.type === "avatar");

export default function AvatarBannerSettings({ me, onOpenShop }: { me: User; onOpenShop: () => void }) {
  const { settings, update, toast } = useSettings();
  const editAvatar = useProfileAvatarEditor();
  const bannerInput = useRef<HTMLInputElement>(null);

  const uploadBanner = async (file: File | undefined) => {
    if (!file) return;
    try {
      const url = await readImageFile(file, 960);
      update({ bannerUrl: url });
      toast("Баннер обновлён", "success");
    } catch (err) {
      const msg = err instanceof Error && err.message === "too-big" ? "Файл больше 8 МБ — выберите поменьше" : "Не удалось загрузить изображение";
      toast(msg, "info");
    }
  };

  const equippedItems = (["decoration", "effect", "frame"] as const)
    .map((slot) => ({ slot, css: settings.equipped[slot] }))
    .filter((x) => x.css)
    .map((x) => ({ ...x, item: findShopItem(x.css!) ?? null }));

  const bannerPreview = settings.bannerUrl ? null : BANNER_GRADIENTS[settings.bannerIndex] ?? BANNER_GRADIENTS[0];
  const activeAnimation = settings.equipped.avatar;

  return (
    <div className="overflow-hidden rounded-xl bg-ink-850">
      {/* баннер-превью */}
      <div className={cn("relative h-32 bg-gradient-to-br", bannerPreview)}>
        {settings.bannerUrl && <img src={settings.bannerUrl} alt="Баннер" className="h-full w-full object-cover" />}
        <ProfileEffect effect={settings.equipped.effect} />
        <div className="absolute top-2 right-2 flex gap-1.5">
          <button
            onClick={() => bannerInput.current?.click()}
            className="flex items-center gap-1.5 rounded-lg bg-black/45 px-2.5 py-1.5 text-xs font-bold text-white backdrop-blur transition hover:bg-black/65"
          >
            <ImagePlus className="h-3.5 w-3.5" /> Загрузить баннер
          </button>
          {settings.bannerUrl && (
            <button
              onClick={() => { update({ bannerUrl: null }); toast("Баннер удалён", "info"); }}
              title="Убрать изображение баннера"
              className="rounded-lg bg-black/45 p-1.5 text-white backdrop-blur transition hover:bg-dnd"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-end gap-4 px-5 pb-5">
        <div className="relative z-[1] -mt-10">
          <div className={cn("rounded-full p-[3px]", settings.equipped.frame ? "" : "bg-ink-850")}>
            <EditableAvatar user={me} size={84} ring="ring-ink-850" onEdit={editAvatar} />
          </div>
        </div>
        <div className="flex flex-1 flex-wrap gap-2 pb-1">
          <button
            onClick={editAvatar}
            className="max-gradient rounded-lg px-3.5 py-2 text-xs font-bold text-white transition hover:brightness-110"
          >
            <span className="flex items-center gap-1.5">{settings.avatarUrl ? <Pencil className="h-3.5 w-3.5" /> : <ImagePlus className="h-3.5 w-3.5" />}{settings.avatarUrl ? "Изменить аватар" : "Загрузить аватар"}</span>
          </button>
          {settings.avatarUrl && (
            <button
              onClick={() => { update({ avatarUrl: null, avatarSource: null, avatarCrop: null }); toast("Аватар сброшен", "info"); }}
              className="rounded-lg bg-ink-700 px-3.5 py-2 text-xs font-bold text-fog-300 transition hover:bg-dnd/20 hover:text-dnd"
            >
              Убрать фото
            </button>
          )}
          <button
            onClick={onOpenShop}
            className="boost-gradient flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold text-white transition hover:brightness-110"
          >
            <Wand2 className="h-3.5 w-3.5" /> Украшения из магазина
          </button>
        </div>
      </div>

      <div className="px-5 pb-5">
        <div className="text-[10px] font-bold tracking-wider text-fog-500 uppercase">Градиент баннера (если нет фото)</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {BANNER_GRADIENTS.map((g, i) => (
            <button
              key={g}
              onClick={() => update({ bannerIndex: i, bannerUrl: null })}
              className={cn(
                "h-9 w-16 rounded-lg bg-gradient-to-br transition hover:scale-105",
                g,
                settings.bannerIndex === i && !settings.bannerUrl && "ring-2 ring-white ring-offset-2 ring-offset-ink-850"
              )}
            />
          ))}
        </div>

        <div className="mt-4 rounded-xl bg-ink-900 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[10px] font-bold tracking-wider text-fog-500 uppercase">
              <Clapperboard className="h-3.5 w-3.5 text-boost-1" /> Анимированный аватар
            </div>
            {activeAnimation ? (
              <button
                onClick={() => { update({ equipped: { ...settings.equipped, avatar: null } }); toast("Анимированный аватар снят", "info"); }}
                className="rounded-lg bg-ink-700 px-3 py-1.5 text-xs font-bold text-fog-200 transition hover:bg-dnd hover:text-white"
              >
                Снять
              </button>
            ) : (
              <span className="text-[11px] text-fog-500">не выбрано</span>
            )}
          </div>

          {activeAnimation && (
            <div className="mt-3 flex items-center gap-3 rounded-lg bg-ink-850 p-3">
              <AnimatedAvatar animation={activeAnimation} size={54} showStatus={false} />
              <div className="min-w-0">
                <div className="truncate text-sm font-bold text-fog-100">{findShopItem(activeAnimation)?.name}</div>
                <div className="truncate text-xs text-fog-500">{findShopItem(activeAnimation)?.desc}</div>
              </div>
            </div>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            {AVATAR_ANIMATIONS.map((item) => {
              const owned = settings.owned.includes(item.id);
              const active = activeAnimation === item.css;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (!owned) {
                      toast("Сначала купите анимацию в магазине", "info");
                      return;
                    }
                    update({ equipped: { ...settings.equipped, avatar: active ? null : item.css } });
                    toast(active ? "Анимация снята" : `Анимация «${item.name}» надета`, active ? "info" : "success");
                  }}
                  title={owned ? item.desc : item.name + " · купите в магазине"}
                  className={cn(
                    "relative rounded-xl p-1 transition",
                    active ? "bg-boost-2/20 ring-2 ring-boost-1" : owned ? "hover:bg-ink-700" : "opacity-45 hover:opacity-70"
                  )}
                >
                  <AnimatedAvatar animation={item.css} size={46} showStatus={false} />
                </button>
              );
            })}
          </div>
          <p className="mt-2.5 text-[11px] text-fog-500">
            Купленные анимации работают сразу во всех чатах и списках участников. Новые можно купить во вкладке «Анимированные аватары» магазина.
          </p>
        </div>

        {equippedItems.length > 0 && (
          <>
            <div className="mt-4 text-[10px] font-bold tracking-wider text-fog-500 uppercase">Надето из магазина</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {equippedItems.map(({ slot, item }) => (
                <span key={slot} className="flex items-center gap-1.5 rounded-full bg-ink-900 py-1 pr-1 pl-2.5 text-xs font-semibold text-fog-200">
                  {item?.name ?? slot}
                  <button
                    onClick={() => update({ equipped: { ...settings.equipped, [slot]: null } })}
                    title="Снять"
                    className="rounded-full bg-ink-700 p-0.5 text-fog-400 transition hover:bg-dnd hover:text-white"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </>
        )}
        <p className="mt-3 text-xs text-fog-500">Нажмите на аватар, чтобы обрезать, повернуть или заменить фото. Исходник сохраняется для повторного редактирования.</p>
      </div>

      <input ref={bannerInput} type="file" accept="image/*" className="hidden" onChange={(e) => { void uploadBanner(e.target.files?.[0]); e.target.value = ""; }} />
    </div>
  );
}
