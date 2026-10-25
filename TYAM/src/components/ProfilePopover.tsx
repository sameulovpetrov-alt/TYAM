import { useEffect, useState } from "react";
import { Check, Maximize2, MessageCircle, Send, UserPlus } from "lucide-react";
import type { RoleContext, Server, User } from "../data";
import { useSettings } from "../store";
import { useProfileAvatarEditor } from "../hooks/useProfileAvatarEditor";
import { cn } from "../utils/cn";
import { Avatar, EditableAvatar, NickName, PremiumTag, ProfileEffect, STATUS_COLOR, STATUS_LABEL, nickColorsOf } from "./ui";
import RolePicker from "./RolePicker";

export default function ProfilePopover({
  user,
  x,
  y,
  servers,
  isFriend,
  requestStatus,
  onMessage,
  onViewFull,
  onAddFriend,
  onAcceptFriend,
  onCancelFriend,
  onEditProfile,
  onClose,
  live = false,
  roles = null,
}: {
  user: User;
  x: number;
  y: number;
  servers: Server[];
  isFriend: boolean;
  /** живая рамка — 3 уровень буста сервера */
  live?: boolean;
  /** роли сервера: цвета и назначение */
  roles?: RoleContext | null;
  requestStatus: "incoming" | "outgoing" | null;
  onMessage: (id: string) => void;
  onViewFull: () => void;
  onAddFriend?: (id: string) => void;
  onAcceptFriend?: (id: string) => void;
  onCancelFriend?: (id: string) => void;
  onEditProfile?: () => void;
  onClose: () => void;
}) {
  const { settings } = useSettings();
  const editAvatar = useProfileAvatarEditor();
  const [text, setText] = useState("");
  const isMe = user.id === "me";

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const display = isMe
    ? {
        ...user,
        name: settings.displayName,
        custom: settings.aboutMe,
        status: settings.status,
        avatarUrl: settings.avatarUrl ?? undefined,
        decoration: settings.equipped.decoration ?? undefined,
        premium: settings.premium && settings.premiumTag,
      }
    : user;
  const bannerUrl = isMe ? settings.bannerUrl : user.bannerUrl;
  const bannerGradient = user.bannerGradient ?? user.avatar;
  const mutual = servers.filter((s) => s.members.includes(user.id));

  const width = 300;
  const estimatedHeight = 380;
  const vw = typeof window === "undefined" ? 1440 : window.innerWidth;
  const vh = typeof window === "undefined" ? 900 : window.innerHeight;
  const left = Math.max(8, Math.min(x, vw - width - 12));
  const top = Math.max(8, Math.min(y, vh - estimatedHeight - 12));

  const sendQuick = () => {
    if (!text.trim() || isMe) return;
    onMessage(user.id);
    setText("");
  };

  return (
    <>
      <div className="fixed inset-0 z-[65]" onClick={onClose} onContextMenu={(e) => { e.preventDefault(); onClose(); }} />
      <div
        className="pop fixed z-[66] w-[300px] overflow-hidden rounded-2xl bg-ink-800 shadow-2xl shadow-black/70"
        style={{ left, top, transformOrigin: "top left" }}
      >
        {/* баннер */}
        <div className={cn("relative h-16 overflow-hidden bg-gradient-to-r", bannerGradient)}>
          {bannerUrl && <img src={bannerUrl} alt="Баннер" className="h-full w-full object-cover" />}
          <ProfileEffect effect={isMe ? settings.equipped.effect : user.effect} />
          <button onClick={onViewFull} title="Открыть полный профиль" className="absolute top-2 right-2 rounded-full bg-black/30 p-1.5 text-white/85 backdrop-blur transition hover:scale-110 hover:text-white">
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="px-4 pb-4">
          <div className="relative z-[1] -mt-8 mb-2 block w-fit">
            <span className="block rounded-full bg-ink-800 p-[4px]">
              {isMe ? (
                <EditableAvatar
                  user={display}
                  size={60}
                  ring="ring-ink-800"
                  title="Редактировать аватар"
                  onEdit={editAvatar}
                />
              ) : (
                <Avatar user={display} size={60} ring="ring-ink-800" animated={live} />
              )}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {(() => {
              const nick = nickColorsOf(display, roles, settings.nick);
              return nick.colors ? (
                <NickName
                  name={display.name}
                  colors={nick.colors}
                  animated={nick.animated}
                  gradient={roles?.gradient}
                  className="font-display text-base"
                />
              ) : (
                <span className="font-display text-base font-bold text-white">{display.name}</span>
              );
            })()}
            {display.premium && <PremiumTag compact />}
            <span className="flex items-center gap-1 rounded-full bg-ink-700 px-2 py-0.5 text-[10px] font-bold text-fog-300">
              <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_COLOR[display.status])} /> {STATUS_LABEL[display.status]}
            </span>
          </div>
          <div className="mt-0.5 text-xs text-fog-500">@{isMe ? settings.username : display.tag}</div>

          {(display.custom || display.activity) && (
            <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-fog-300">{display.custom ?? display.activity}</p>
          )}
          {mutual.length > 0 && (
            <div className="mt-2 text-[10px] text-fog-500">
              Общие серверы: <span className="font-bold text-fog-300">{mutual.length}</span>
            </div>
          )}

          {roles && (
            <div className="mt-3">
              <RolePicker
                roles={roles.roles}
                assigned={(roles.byUser[user.id] ?? []).map((r) => r.id)}
                onToggle={(roleId) => roles.toggle(user.id, roleId)}
                onClear={() => roles.clear(user.id)}
                canManage={roles.canManage}
              />
            </div>
          )}

          {isMe ? (
            <button onClick={onEditProfile} className="max-gradient mt-3 w-full rounded-lg py-2 text-xs font-bold text-white transition hover:brightness-110">
              Изменить профиль
            </button>
          ) : (
            <>
              <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-ink-700/80 px-2.5">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendQuick()}
                  placeholder={`Написать @${display.name}`}
                  className="min-w-0 flex-1 bg-transparent py-2 text-xs text-fog-100 placeholder-fog-500 outline-none"
                  autoFocus
                />
                <button onClick={sendQuick} disabled={!text.trim()} className="text-max-300 transition hover:scale-110 disabled:opacity-40">
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="mt-2 flex gap-1.5">
                <button
                  onClick={() => onMessage(user.id)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-ink-700 py-2 text-xs font-bold text-fog-100 transition hover:bg-ink-600"
                >
                  <MessageCircle className="h-3.5 w-3.5" /> Сообщение
                </button>
                {requestStatus === "incoming" ? (
                  <button
                    onClick={() => onAcceptFriend?.(user.id)}
                    title="Принять заявку в друзья"
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-online py-2 text-xs font-bold text-white transition hover:brightness-110"
                  >
                    <Check className="h-3.5 w-3.5" /> Принять
                  </button>
                ) : requestStatus === "outgoing" ? (
                  <button
                    onClick={() => onCancelFriend?.(user.id)}
                    title="Отменить заявку"
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-ink-700 py-2 text-xs font-bold text-fog-300 transition hover:bg-dnd hover:text-white"
                  >
                    <Check className="h-3.5 w-3.5" /> Отменить заявку
                  </button>
                ) : isFriend ? (
                  <span className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-online/15 py-2 text-xs font-bold text-online">
                    <Check className="h-3.5 w-3.5" /> В друзьях
                  </span>
                ) : (
                  <button
                    onClick={() => onAddFriend?.(user.id)}
                    title="Добавить в друзья"
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-ink-700 py-2 text-xs font-bold text-fog-100 transition hover:bg-online hover:text-white"
                  >
                    <UserPlus className="h-3.5 w-3.5" /> В друзья
                  </button>
                )}
              </div>
            </>
          )}
        </div>

      </div>
    </>
  );
}
