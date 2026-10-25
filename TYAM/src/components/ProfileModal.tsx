import { useRef, useState } from "react";
import { CalendarDays, Check, Gem, ImagePlus, MessageCircle, Send, Settings as SettingsIcon, Shield, Sparkles, Trash2, UserPlus, X } from "lucide-react";
import type { RoleContext, Server, User } from "../data";

import { useSettings } from "../store";
import { BANNER_GRADIENTS, findShopItem } from "../shop";
import { readImageFile } from "../utils/image";
import { cn } from "../utils/cn";
import { Avatar, EditableAvatar, NickName, ProfileEffect, STATUS_COLOR, STATUS_LABEL, nickColorsOf } from "./ui";
import RolePicker from "./RolePicker";
import { Modal } from "./Modal";
import { useProfileAvatarEditor } from "../hooks/useProfileAvatarEditor";

export default function ProfileModal({
  user,
  servers,
  isBooster,
  isFriend = false,
  requestStatus = null,
  onAddFriend,
  onAcceptFriend,
  onCancelFriend,
  onMessage,
  onClose,
  onEditProfile,
  roles = null,
}: {
  user: User;
  servers: Server[];
  isBooster?: boolean;
  isFriend?: boolean;
  requestStatus?: "incoming" | "outgoing" | null;
  onAddFriend?: (id: string) => void;
  onAcceptFriend?: (id: string) => void;
  onCancelFriend?: (id: string) => void;
  onRemoveFriend?: (id: string) => void;
  onMessage?: (id: string) => void;
  onClose: () => void;
  onEditProfile?: () => void;
  roles?: RoleContext | null;
}) {
  const { settings, update, notes, setNote, toast } = useSettings();
  const [note, setNoteLocal] = useState(notes[user.id] ?? "");
  const [text, setText] = useState("");
  const bannerInput = useRef<HTMLInputElement>(null);
  const editAvatar = useProfileAvatarEditor();

  const uploadBanner = async (file: File | undefined) => {
    if (!file) return;
    try {
      const url = await readImageFile(file, 960);
      update({ bannerUrl: url });
      toast("Баннер обновлён", "success");
    } catch (err) {
      toast(err instanceof Error && err.message === "too-big" ? "Файл больше 8 МБ — выберите поменьше" : "Не удалось загрузить изображение", "info");
    }
  };
  const isMe = user.id === "me";
  const display = isMe
    ? {
        ...user,
        name: settings.displayName,
        custom: settings.aboutMe,
        status: settings.status,
        avatarUrl: settings.avatarUrl ?? undefined,
        decoration: settings.equipped.decoration ?? undefined,
      }
    : user;
  const mutual = servers.filter((s) => s.members.includes(user.id));
  const bannerUrl = isMe ? settings.bannerUrl : user.bannerUrl;
  const bannerGradient = isMe ? BANNER_GRADIENTS[settings.bannerIndex] ?? display.avatar : user.bannerGradient ?? display.avatar;
  const effect = isMe ? settings.equipped.effect : user.effect;
  const frameCss = isMe ? settings.equipped.frame : user.frame;
  const frameItem = frameCss ? findShopItem(frameCss) : null;

  const saveNote = () => {
    setNote(user.id, note);
    toast("Заметка сохранена ✍️", "success");
  };

  return (
    <Modal onClose={onClose} className="max-w-md">
      <div className={cn("relative h-28 overflow-hidden bg-gradient-to-br", !bannerUrl && bannerGradient)}>
        {bannerUrl && <img src={bannerUrl} alt="Баннер профиля" className="h-full w-full object-cover" />}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_15%,rgba(255,255,255,0.3),transparent_60%)]" />
        <ProfileEffect effect={effect} />
        {isMe && (
          <div className="absolute bottom-2 right-3 flex gap-1.5">
            <button
              onClick={() => bannerInput.current?.click()}
              title="Загрузить свой баннер"
              className="flex items-center gap-1.5 rounded-lg bg-black/35 px-2.5 py-1.5 text-[11px] font-bold text-white backdrop-blur transition hover:bg-black/60 active:scale-95"
            >
              <ImagePlus className="h-3.5 w-3.5" /> Изменить баннер
            </button>
            {bannerUrl && (
              <button
                onClick={() => { update({ bannerUrl: null }); toast("Баннер удалён", "info"); }}
                title="Убрать баннер"
                className="rounded-lg bg-black/35 p-1.5 text-white backdrop-blur transition hover:bg-dnd active:scale-95"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}
        <button
          onClick={onClose}
          title="Закрыть"
          className="absolute top-3 right-3 rounded-full bg-black/25 p-1.5 text-white/85 backdrop-blur transition hover:rotate-90 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
        {isMe && (
          <span className="absolute top-3 left-3 rounded-full bg-black/25 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur">Мой профиль</span>
        )}
      </div>

      <div className={cn("bg-ink-800 px-5 pb-5", frameCss)}>
        {frameItem && (
          <div className="pt-2 text-right text-[9px] font-extrabold tracking-widest text-fog-500 uppercase">Рамка · {frameItem.name}</div>
        )}
        <div className="relative z-[1] -mt-12 flex items-end justify-between">
          <div className={cn("relative rounded-full p-[3px]", isBooster || (isMe && settings.premium) ? "boost-gradient" : "bg-ink-700")}>
            <div className="rounded-full bg-ink-800 p-[3px]">
              {isMe ? (
                <EditableAvatar
                  user={display}
                  size={78}
                  ring="ring-ink-800"
                  onEdit={editAvatar}
                />
              ) : (
                <Avatar user={display} size={78} showStatus ring="ring-ink-800" />
              )}
            </div>
          </div>
          <div className="flex gap-1.5 pb-1">
            {!isMe && (
              <button
                onClick={() => onMessage?.(user.id)}
                title="Написать сообщение"
                className="rounded-full bg-ink-700 p-2 text-fog-200 transition hover:bg-max-500 hover:text-white active:scale-90"
              >
                <MessageCircle className="h-4 w-4" />
              </button>
            )}
            {isMe ? (
              <button
                onClick={onEditProfile}
                title="Настройки профиля"
                className="rounded-full bg-ink-700 p-2 text-fog-200 transition hover:bg-max-500 hover:text-white active:scale-90"
              >
                <SettingsIcon className="h-4 w-4" />
              </button>
            ) : (
              requestStatus === "incoming" ? (
                <button title="Принять заявку в друзья" onClick={() => onAcceptFriend?.(user.id)} className="rounded-full bg-online p-2 text-white transition hover:brightness-110 active:scale-90">
                  <Check className="h-4 w-4" />
                </button>
              ) : requestStatus === "outgoing" ? (
                <button title="Отменить заявку" onClick={() => onCancelFriend?.(user.id)} className="rounded-full bg-ink-700 p-2 text-fog-300 transition hover:bg-dnd hover:text-white active:scale-90">
                  <X className="h-4 w-4" />
                </button>
              ) : (
                <button
                  title={isFriend ? "Вы уже друзья" : "Добавить в друзья"}
                  disabled={isFriend}
                  onClick={() => onAddFriend?.(user.id)}
                  className={cn("rounded-full p-2 transition active:scale-90", isFriend ? "cursor-default bg-online/20 text-online" : "bg-ink-700 text-fog-200 hover:bg-online hover:text-white")}
                >
                  {isFriend ? <Check className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                </button>
              )
            )}
          </div>
        </div>

        <div className="mt-3">
          <div className="flex flex-wrap items-center gap-2">
            {(() => {
              const nick = nickColorsOf(display, roles, settings.nick);
              return nick.colors ? (
                <NickName
                  name={display.name}
                  colors={nick.colors}
                  animated={nick.animated}
                  gradient={roles?.gradient}
                  className="font-display text-xl"
                />
              ) : (
                <h2 className="font-display text-xl font-bold text-white">{display.name}</h2>
              );
            })()}
            <span className={cn("flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold", "bg-ink-700 text-fog-300")}>
              <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_COLOR[display.status])} /> {STATUS_LABEL[display.status]}
            </span>
          </div>
          <div className="mt-0.5 text-sm text-fog-500">@{isMe ? settings.username : display.tag}</div>

          {((isMe && settings.premium && settings.premiumTag) || (!isMe && user.premium) || isBooster || display.role) && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {((isMe && settings.premium && settings.premiumTag) || (!isMe && user.premium)) && (
                <span className="max-gradient flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold text-white">
                  <Sparkles className="h-3 w-3" /> TYAM Premium
                </span>
              )}
              {isBooster && (
                <span className="boost-gradient flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold text-white">
                  <Gem className="h-3 w-3" /> Бустер
                </span>
              )}
              {display.role && (
                <span className="flex items-center gap-1 rounded-full bg-ink-700 px-2.5 py-1 text-[11px] font-bold text-fog-100">
                  {display.role === "Админ" ? <Shield className="h-3 w-3 text-max-300" /> : <Shield className="h-3 w-3 text-fog-400" />} {display.role}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="mt-4 space-y-2">
          {roles && (
            <RolePicker
              roles={roles.roles}
              assigned={(roles.byUser[user.id] ?? []).map((r) => r.id)}
              onToggle={(roleId) => roles.toggle(user.id, roleId)}
              onClear={() => roles.clear(user.id)}
              canManage={roles.canManage}
            />
          )}
          <div className="rounded-xl bg-ink-850 p-3.5">
            <div className="text-[10px] font-bold tracking-wider text-fog-500 uppercase">О себе</div>
            <p className="mt-1 text-sm leading-relaxed text-fog-200">
              {display.custom ?? display.activity ?? "Пользователь TYAM 💙"}
            </p>
            {display.activity && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-fog-500">
                <span className="h-1.5 w-1.5 rounded-full bg-online" /> {display.activity}
              </div>
            )}
            <div className="mt-2.5 flex items-center gap-1.5 border-t border-ink-700 pt-2.5 text-xs text-fog-500">
              <CalendarDays className="h-3.5 w-3.5" /> Участник TYAM с марта 2024
            </div>
          </div>

          <div className="rounded-xl bg-ink-850 p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold tracking-wider text-fog-500 uppercase">Заметка</span>
              {!isMe && (
                <button onClick={saveNote} className="text-[11px] font-bold text-max-300 transition hover:text-max-400">
                  Сохранить
                </button>
              )}
            </div>
            <textarea
              value={note}
              onChange={(e) => setNoteLocal(e.target.value)}
              readOnly={isMe}
              rows={2}
              placeholder={isMe ? "Заметки доступны только о других участниках" : "Локальная заметка об этом пользователе…"}
              className="mt-1.5 w-full resize-none bg-transparent text-sm text-fog-200 placeholder-fog-500 outline-none"
            />
          </div>

          <div className="rounded-xl bg-ink-850 p-3.5">
            <div className="text-[10px] font-bold tracking-wider text-fog-500 uppercase">Общие серверы — {mutual.length}</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {mutual.length === 0 && <span className="text-xs text-fog-500">Общих серверов пока нет</span>}
              {mutual.map((s) => (
                <span key={s.id} className="flex items-center gap-1.5 rounded-lg bg-ink-800 px-2 py-1 text-xs font-semibold text-fog-300">
                  <span className={cn("flex h-4 w-4 items-center justify-center rounded text-[8px] text-white", s.id === "hub" ? "max-gradient" : s.color)}>{s.id === "hub" ? "" : s.short}</span>
                  {s.name}
                </span>
              ))}
            </div>
          </div>
        </div>

        {!isMe && (
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-ink-700/70 px-3">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && text.trim()) {
                  onMessage?.(user.id);
                  setText("");
                }
              }}
              placeholder={`Написать @${display.name}`}
              className="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-fog-100 placeholder-fog-500 outline-none"
            />
            <button
              onClick={() => {
                if (!text.trim()) return;
                onMessage?.(user.id);
                setText("");
              }}
              className="max-gradient rounded-lg p-2 text-white transition hover:brightness-110 active:scale-90"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        )}

        {isMe && (
          <button
            onClick={onEditProfile}
            className="max-gradient mt-3 w-full rounded-xl py-2.5 text-sm font-bold text-white transition hover:brightness-110 active:scale-[0.99]"
          >
            Изменить профиль и настройки
          </button>
        )}
      </div>

      {isMe && (
        <input ref={bannerInput} type="file" accept="image/*" className="hidden" onChange={(e) => { void uploadBanner(e.target.files?.[0]); e.target.value = ""; }} />
      )}
    </Modal>
  );
}