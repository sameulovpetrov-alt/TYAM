import { useState } from "react";
import { ArrowLeft, Check, Gem, Gamepad2, GraduationCap, Heart, ImagePlus, Rocket, Trash2, Users, X } from "lucide-react";
import type { Category, Server } from "../data";
import type { AvatarEditResult } from "../utils/avatar";
import { cn } from "../utils/cn";
import { Modal } from "./Modal";
import { useSettings } from "../store";
import { useAvatarEditor } from "./AvatarEditor";

const ICON_CHOICES = ["🚀", "💬", "🎧", "🎮", "🎨", "📚", "☕", "🔥", "⚡", "🌊", "🛰️", "💎"];

interface Template {
  id: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
  banner: string;
  categories: (name: string, emoji?: string) => Category[];
}

const TEMPLATES: Template[] = [
  {
    id: "friends",
    title: "Для меня и друзей",
    desc: "Уютное место для своей компании",
    icon: <Heart className="h-6 w-6" />,
    banner: "from-max-500 via-indigo-500 to-violet-500",
    categories: (name) => [
      {
        id: "f-main",
        name: "Общение",
        channels: [
          { id: "f-general", name: "общий", type: "text", topic: `Главный канал сервера «${name}» 💬` },
          { id: "f-memes", name: "мемы", type: "text", topic: "Скидываем лучшее" },
          { id: "f-media", name: "медиа", type: "text", topic: "Фото, видео, музыка" },
        ],
      },
      {
        id: "f-voice",
        name: "Голосовые каналы",
        channels: [
          { id: "f-lounge", name: "Лаунж", type: "voice" },
          { id: "f-games", name: "Игровая", type: "voice" },
        ],
      },
    ],
  },
  {
    id: "gaming",
    title: "Игровой клуб",
    desc: "Катки, клипы и поиск тиммейтов",
    icon: <Gamepad2 className="h-6 w-6" />,
    banner: "from-emerald-500 via-teal-500 to-cyan-500",
    categories: () => [
      {
        id: "g-main",
        name: "Клуб",
        channels: [
          { id: "g-chat", name: "игровой-чат", type: "text", topic: "Ищем тиммейтов 🎮" },
          { id: "g-clips", name: "клипы", type: "text", topic: "Лучшие моменты" },
          { id: "g-lfg", name: "поиск-пати", type: "text", topic: "Пишите, кого не хватает" },
        ],
      },
      {
        id: "g-voice",
        name: "Катки",
        channels: [
          { id: "g-p1", name: "Пати #1", type: "voice" },
          { id: "g-p2", name: "Пати #2", type: "voice" },
          { id: "g-p3", name: "Пати #3", type: "voice" },
        ],
      },
    ],
  },
  {
    id: "study",
    title: "Учебная группа",
    desc: "Конспекты, дедлайны и созвоны",
    icon: <GraduationCap className="h-6 w-6" />,
    banner: "from-amber-500 via-orange-500 to-rose-500",
    categories: () => [
      {
        id: "s-main",
        name: "Учёба",
        channels: [
          { id: "s-ann", name: "объявления", type: "text", topic: "Только важное 📌" },
          { id: "s-chat", name: "обсуждение", type: "text", topic: "Вопросы по материалу" },
          { id: "s-notes", name: "конспекты", type: "text", topic: "Делимся записями" },
        ],
      },
      {
        id: "s-voice",
        name: "Занятия",
        channels: [
          { id: "s-room1", name: "Аудитория 1", type: "voice" },
          { id: "s-room2", name: "Аудитория 2", type: "voice" },
        ],
      },
    ],
  },
  {
    id: "community",
    title: "Сообщество TYAM",
    desc: "Большое сообщество по интересам",
    icon: <Users className="h-6 w-6" />,
    banner: "from-fuchsia-500 via-violet-500 to-indigo-500",
    categories: () => [
      {
        id: "c-info",
        name: "Информация",
        channels: [
          { id: "c-welcome", name: "приветствие", type: "text", topic: "Представьтесь! 👋" },
          { id: "c-rules", name: "правила", type: "text", topic: "Читайте обязательно" },
        ],
      },
      {
        id: "c-talk",
        name: "Общение",
        channels: [
          { id: "c-general", name: "общий", type: "text", topic: "Главный канал 💬" },
          { id: "c-offtop", name: "оффтоп", type: "text", topic: "Болтаем обо всём" },
        ],
      },
      {
        id: "c-voice",
        name: "Голосовые каналы",
        channels: [{ id: "c-stage", name: "Сцена", type: "voice" }],
      },
    ],
  },
];

export default function CreateServerModal({ onClose, onCreate }: { onClose: () => void; onCreate: (s: Server) => void }) {
  const { toast } = useSettings();
  const openAvatarEditor = useAvatarEditor();
  const [step, setStep] = useState<0 | 1>(0);
  const [tpl, setTpl] = useState<Template>(TEMPLATES[0]);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState<string | null>(null);
  const [iconAsset, setIconAsset] = useState<AvatarEditResult | null>(null);
  const iconUrl = iconAsset?.url;
  const [creating, setCreating] = useState(false);

  const editIcon = () => openAvatarEditor({
    kind: "server",
    name: name.trim() || "Ваш сервер",
    image: iconAsset?.url,
    source: iconAsset?.source,
    crop: iconAsset?.crop,
    saveHint: "Аватар появится после создания сервера.",
    onSave: (result) => {
      setIconAsset(result);
      setIcon(null);
      toast("Аватар сервера готов", "success");
    },
  });

  const trimmed = name.trim();
  const canCreate = trimmed.length > 0;

  const submit = () => {
    if (!canCreate || creating) return;
    setCreating(true);
    const id = `custom-${Date.now()}`;
    const prefix = id.slice(-5);
    // участников нет: вы приглашаете друзей сами
    const members: string[] = [];
    const server: Server = {
      id,
      name: trimmed,
      short: icon ?? trimmed.slice(0, 2).toUpperCase(),
      icon: icon ?? undefined,
      iconUrl: iconUrl ?? undefined,
      iconSource: iconAsset?.source,
      iconCrop: iconAsset?.crop,
      color: "bg-ink-700",
      banner: tpl.banner,
      members,
      categories: tpl.categories(trimmed).map((c) => ({
        ...c,
        channels: c.channels.map((ch) => ({ ...ch, id: `${ch.id}-${prefix}` })),
      })),
    };
    window.setTimeout(() => {
      onCreate(server);
      toast(`Сервер «${trimmed}» создан. Добро пожаловать! 🎉`, "success");
      onClose();
    }, 550);
  };

  return (
    <Modal onClose={onClose}>
      <button onClick={onClose} title="Закрыть" className="absolute top-4 right-4 z-10 rounded-full bg-ink-900/70 p-1.5 text-fog-400 transition hover:rotate-90 hover:text-white">
        <X className="h-4 w-4" />
      </button>

      {step === 0 ? (
        <div className="p-7">
          <div className="max-gradient mb-5 flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg shadow-max-600/30">
            <Rocket className="h-6 w-6" />
          </div>
          <h2 className="font-display text-xl font-bold text-white">Создайте свой сервер</h2>
          <p className="mt-2 text-[15px] text-fog-400">
            Сервер — это место, где вы общаетесь с друзьями. Выберите шаблон, задайте название и пригласите компанию.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3">
            {TEMPLATES.map((t) => {
              const active = tpl.id === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTpl(t)}
                  className={cn(
                    "group relative overflow-hidden rounded-xl border-2 p-4 text-left transition-all duration-200",
                    active ? "border-max-500 bg-ink-750 shadow-lg shadow-max-600/20" : "border-ink-600/50 bg-ink-850 hover:border-ink-500 hover:bg-ink-750"
                  )}
                >
                  <span className={cn("mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br text-white", t.banner)}>{t.icon}</span>
                  <span className="block text-[15px] font-bold text-white">{t.title}</span>
                  <span className="mt-0.5 block text-xs leading-snug text-fog-500">{t.desc}</span>
                  {active && <Check className="absolute top-3 right-3 h-4 w-4 text-max-400" />}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setStep(1)}
            className="max-gradient mt-6 w-full rounded-xl py-3 font-semibold text-white shadow-lg shadow-max-600/30 transition hover:brightness-110 active:scale-[0.99]"
          >
            Продолжить
          </button>
        </div>
      ) : (
        <div className="p-7">
          <div className="flex items-center gap-4">
            <button type="button" onClick={editIcon} aria-label="Редактировать аватар сервера" className={cn("group/icon relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br text-2xl text-white shadow-lg", !iconUrl && tpl.banner)}>
              {iconUrl ? <img src={iconUrl} alt="Иконка сервера" className="h-full w-full object-cover" /> : (icon || trimmed.slice(0, 2).toUpperCase() || "TY")}
              <span className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition group-hover/icon:opacity-100 group-focus-visible/icon:opacity-100"><ImagePlus className="h-5 w-5 text-white" /></span>
            </button>
            <div className="min-w-0">
              <h2 className="font-display text-xl font-bold text-white">Настройте сервер</h2>
              <p className="text-sm text-fog-400">Шаблон: {tpl.title}</p>
            </div>
          </div>

          <label className="mt-6 block text-xs font-bold tracking-wider text-fog-400 uppercase">Название сервера</label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Например: Вечерний кинозал"
            maxLength={32}
            className="mt-2 w-full rounded-xl bg-ink-950 px-4 py-3 text-[15px] text-fog-100 placeholder-fog-500 outline-none ring-max-500/0 transition focus:ring-2 focus:ring-max-500/70"
          />
          <div className="mt-1 flex justify-between text-xs text-fog-500">
            <span>Название можно изменить в любой момент</span>
            <span>{trimmed.length}/32</span>
          </div>

          <label className="mt-5 block text-xs font-bold tracking-wider text-fog-400 uppercase">Иконка (необязательно)</label>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button
              onClick={editIcon}
              className={cn(
                "flex h-10 items-center gap-1.5 rounded-xl px-3 text-xs font-bold transition",
                iconUrl ? "boost-gradient text-white" : "bg-ink-900 text-fog-300 hover:scale-105 hover:bg-ink-700"
              )}
            >
              <ImagePlus className="h-4 w-4" /> {iconUrl ? "Изменить аватар" : "Своё фото"}
            </button>
            {iconUrl && (
              <button
                onClick={() => setIconAsset(null)}
                title="Убрать фото"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink-900 text-fog-400 transition hover:bg-dnd hover:text-white"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
            {ICON_CHOICES.map((e) => (
              <button
                key={e}
                onClick={() => { setIcon(icon === e ? null : e); if (icon !== e) setIconAsset(null); }}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl text-lg transition",
                  icon === e && !iconUrl ? "max-gradient scale-110 shadow-md shadow-max-600/40" : "bg-ink-900 hover:scale-105 hover:bg-ink-700"
                )}
              >
                {e}
              </button>
            ))}
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => setStep(0)}
              className="flex items-center gap-2 rounded-xl bg-ink-700 px-4 py-3 font-semibold text-fog-300 transition hover:bg-ink-600"
            >
              <ArrowLeft className="h-4 w-4" /> Назад
            </button>
            <button
              onClick={submit}
              disabled={!canCreate || creating}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-xl py-3 font-semibold text-white transition",
                canCreate ? "max-gradient shadow-lg shadow-max-600/30 hover:brightness-110 active:scale-[0.99]" : "cursor-not-allowed bg-ink-600 text-fog-500"
              )}
            >
              {creating ? (
                <>
                  <span className="ring-spin h-4 w-4 rounded-full border-2 border-white/30 border-t-white" /> Создаём…
                </>
              ) : (
                <>
                  <Gem className="h-4 w-4" /> Создать сервер
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}