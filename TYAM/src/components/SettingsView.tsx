import { useState, type ReactNode } from "react";
import {
  Check,
  Crown,
  Gem,
  Globe,
  KeyRound,
  Languages,
  Mail,
  Mic,
  Palette,
  ShieldCheck,
  Smartphone,
  Sparkles,
  User as UserIcon,
  X,
  Zap,
} from "lucide-react";
import type { Status, User } from "../data";
import { ME } from "../data";
import { ACCENTS, THEMES, useSettings } from "../store";
import { cn } from "../utils/cn";
import { Avatar, GradientName, NICK_PAIRS, STATUS_COLOR, STATUS_LABEL } from "./ui";

const NICK_COLORS = [
  "#5ea0ff", "#4d94ff", "#22d3ee", "#34d399", "#a3e635", "#facc15",
  "#ffa76b", "#ff7a59", "#f43f5e", "#f472b6", "#c084fc", "#a78bfa",
];
import VoiceVideoSettings from "./VoiceVideoSettings";
import AvatarBannerSettings from "./AvatarBannerSettings";
import { BANNER_GRADIENTS } from "../shop";

export type Tab = "account" | "profile" | "privacy" | "appearance" | "voice" | "language" | "premium";

const NAV: { group: string; items: { id: Tab; label: string; icon: ReactNode }[] }[] = [
  {
    group: "Настройки пользователя",
    items: [
      { id: "account", label: "Моя учётная запись", icon: <UserIcon className="h-4 w-4" /> },
      { id: "profile", label: "Профиль", icon: <Sparkles className="h-4 w-4" /> },
      { id: "privacy", label: "Конфиденциальность", icon: <ShieldCheck className="h-4 w-4" /> },
    ],
  },
  {
    group: "Настройки приложения",
    items: [
      { id: "appearance", label: "Внешний вид", icon: <Palette className="h-4 w-4" /> },
      { id: "voice", label: "Голос и видео", icon: <Mic className="h-4 w-4" /> },
      { id: "language", label: "Язык и регион", icon: <Languages className="h-4 w-4" /> },
    ],
  },
  {
    group: "Подписка",
    items: [{ id: "premium", label: "TYAM Premium", icon: <Crown className="h-4 w-4" /> }],
  },
];

const TITLES: Record<Tab, string> = {
  account: "Моя учётная запись",
  profile: "Профиль",
  privacy: "Конфиденциальность и безопасность",
  appearance: "Внешний вид",
  voice: "Голос и видео",
  language: "Язык и регион",
  premium: "TYAM Premium",
};

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      role="switch"
      aria-checked={on}
      className={cn("flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors", on ? "max-gradient justify-end" : "justify-start bg-ink-600")}
    >
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white shadow transition">
        {on ? <Check className="h-3 w-3 text-max-600" /> : <X className="h-3 w-3 text-ink-600" />}
      </span>
    </button>
  );
}

function Row({ title, desc, children }: { title: string; desc?: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-6 border-t border-ink-600/40 py-4 first:border-t-0">
      <div className="min-w-0">
        <div className="text-[15px] font-semibold text-fog-100">{title}</div>
        {desc && <div className="mt-0.5 text-[13px] leading-snug text-fog-500">{desc}</div>}
      </div>
      {children}
    </div>
  );
}

function Slider({ value, onChange, min = 0, max = 100, step = 1, suffix = "" }: { value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; suffix?: string }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="w-56">
      <div className="relative h-6">
        <div className="absolute top-1/2 h-1.5 w-full -translate-y-1/2 rounded-full bg-ink-600" />
        <div className="max-gradient absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full" style={{ width: `${pct}%` }} />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
        <div className="max-gradient absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-md" style={{ left: `${pct}%` }} />
      </div>
      <div className="text-center text-xs font-bold text-fog-400">
        {value}
        {suffix}
      </div>
    </div>
  );
}

function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("rounded-xl bg-ink-850 p-5", className)}>{children}</div>;
}

export default function SettingsView({ initialTab, onClose, onOpenShop }: { initialTab?: Tab; onClose: () => void; onOpenShop?: () => void }) {
  const { settings, update, updateNested, toast } = useSettings();
  const [tab, setTab] = useState<Tab>(initialTab ?? "account");
  const [name, setName] = useState(settings.displayName);
  const [about, setAbout] = useState(settings.aboutMe);

  const statuses: Status[] = ["online", "idle", "dnd", "offline"];
  const languages = ["Русский", "English", "Deutsch", "Español", "Français", "中文"];
  const me: User = {
    ...ME,
    name: settings.displayName,
    tag: settings.username,
    initials: (settings.displayName.trim().slice(0, 2) || "ВЫ").toUpperCase(),
    status: settings.status,
    custom: settings.aboutMe,
    avatarUrl: settings.avatarUrl ?? undefined,
    decoration: settings.equipped.decoration ?? undefined,
    bannerGradient: BANNER_GRADIENTS[settings.bannerIndex],
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-ink-800 fade-in">
      <div className="flex min-h-0 flex-1">
        {/* nav */}
        <nav className="flex w-60 shrink-0 flex-col bg-ink-850">
          <div className="flex-1 overflow-y-auto px-2 py-6">
            <div className="px-2 pb-2 font-display text-sm font-bold text-white">Настройки</div>
            {NAV.map((g) => (
              <div key={g.group} className="mb-5">
                <div className="px-2 pb-1 text-[11px] font-bold tracking-wider text-fog-500 uppercase">{g.group}</div>
                {g.items.map((it) => (
                  <button
                    key={it.id}
                    onClick={() => setTab(it.id)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-[15px] transition",
                      tab === it.id ? "bg-ink-600 font-semibold text-white" : "text-fog-400 hover:bg-ink-700/70 hover:text-fog-100"
                    )}
                  >
                    {it.icon}
                    {it.label}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </nav>

        {/* content */}
        <main className="relative min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-2xl px-8 py-8 pb-24">
            <div className="mb-6 flex items-center justify-between">
              <h1 className="font-display text-2xl font-bold text-white">{TITLES[tab]}</h1>
              <button
                onClick={onClose}
                title="Закрыть настройки (Esc)"
                className="flex items-center gap-2 rounded-full border-2 border-ink-600 px-3 py-1 text-xs font-bold text-fog-400 transition hover:rotate-90 hover:border-fog-400 hover:text-fog-100"
              >
                <X className="h-4 w-4" />
                <span className="-rotate-90">ESC</span>
              </button>
            </div>

            {tab === "account" && (
              <div className="space-y-4">
                <Card className="flex items-center gap-4">
                  <div className="max-gradient rounded-full p-[3px]">
                    <div className="rounded-full bg-ink-850 p-[3px]">
                      <Avatar user={me} size={68} ring="ring-ink-850" />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-lg font-bold text-white">{settings.displayName}</div>
                    <div className="text-sm text-fog-500">@{settings.username}</div>
                  </div>
                  <button
                    onClick={() => setTab("profile")}
                    className="max-gradient rounded-lg px-4 py-2 text-sm font-bold text-white transition hover:brightness-110"
                  >
                    Изменить профиль
                  </button>
                </Card>

                <Card>
                  {[
                    { icon: <Mail className="h-4 w-4" />, label: "Эл. почта", value: "m•••••@max.ru" },
                    { icon: <Smartphone className="h-4 w-4" />, label: "Телефон", value: "+7 ••• ••• 42 07" },
                    { icon: <KeyRound className="h-4 w-4" />, label: "Пароль", value: "••••••••" },
                  ].map((r) => (
                    <Row key={r.label} title={r.label}>
                      <span className="flex items-center gap-3 text-sm text-fog-400">
                        <span className="text-fog-500">{r.icon}</span>
                        {r.value}
                        <button onClick={() => toast(`${r.label}: изменение недоступно в демо`, "info")} className="rounded-md bg-ink-700 px-2.5 py-1 text-xs font-semibold text-fog-200 transition hover:bg-ink-600">
                          Изменить
                        </button>
                      </span>
                    </Row>
                  ))}
                </Card>

                <Card>
                  <Row title="TYAM Premium" desc="Бусты серверов, HD-стримы и анимированный аватар">
                    <span className={cn("flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold", settings.premium ? "max-gradient text-white" : "bg-ink-700 text-fog-400")}>
                      <Crown className="h-3.5 w-3.5" /> {settings.premium ? "Активна" : "Не оформлена"}
                    </span>
                  </Row>
                  <Row title="Доступно бустов" desc="Каждый буст прокачивает привилегии сервера">
                    <span className="flex items-center gap-1.5 text-sm font-bold text-boost-1">
                      <Gem className="h-4 w-4" /> {settings.boostCredits}
                    </span>
                  </Row>
                </Card>

                <button
                  onClick={() => toast("Выход из аккаунта недоступен в демо-версии", "info")}
                  className="w-full rounded-xl border border-dnd/40 py-3 text-sm font-bold text-dnd transition hover:bg-dnd/10"
                >
                  Выйти из аккаунта TYAM
                </button>
              </div>
            )}

            {tab === "profile" && (
              <div className="space-y-4">
                <AvatarBannerSettings me={me} onOpenShop={() => onOpenShop?.()} />
                <Card>
                  <label className="text-xs font-bold tracking-wider text-fog-500 uppercase">Отображаемое имя</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={24}
                    className="mt-2 w-full rounded-lg bg-ink-950 px-3.5 py-2.5 text-[15px] text-fog-100 outline-none ring-max-500/0 transition focus:ring-2 focus:ring-max-500/70"
                  />
                  <label className="mt-4 block text-xs font-bold tracking-wider text-fog-500 uppercase">О себе</label>
                  <textarea
                    value={about}
                    onChange={(e) => setAbout(e.target.value)}
                    rows={3}
                    maxLength={190}
                    className="mt-2 w-full resize-none rounded-lg bg-ink-950 px-3.5 py-2.5 text-[15px] text-fog-100 outline-none ring-max-500/0 transition focus:ring-2 focus:ring-max-500/70"
                  />
                  <div className="mt-1 flex justify-between text-xs text-fog-500">
                    <span>Расскажите, чем занимаетесь в TYAM</span>
                    <span>{about.length}/190</span>
                  </div>
                  <button
                    onClick={() => {
                      update({ displayName: name.trim() || "Вы", aboutMe: about });
                      toast("Профиль обновлён ✨", "success");
                    }}
                    className="max-gradient mt-4 rounded-lg px-5 py-2 text-sm font-bold text-white transition hover:brightness-110 active:scale-95"
                  >
                    Сохранить изменения
                  </button>
                </Card>

                <Card>
                  <div className="mb-3 text-xs font-bold tracking-wider text-fog-500 uppercase">Статус</div>
                  <div className="grid grid-cols-2 gap-2">
                    {statuses.map((s) => (
                      <button
                        key={s}
                        onClick={() => update({ status: s })}
                        className={cn(
                          "flex items-center gap-3 rounded-xl border-2 px-3.5 py-2.5 text-left transition",
                          settings.status === s ? "border-max-500 bg-ink-750" : "border-transparent bg-ink-900 hover:border-ink-500"
                        )}
                      >
                        <span className={cn("h-3 w-3 rounded-full", STATUS_COLOR[s])} />
                        <span className="text-sm font-semibold text-fog-100">{STATUS_LABEL[s]}</span>
                        {settings.status === s && <Check className="ml-auto h-4 w-4 text-max-400" />}
                      </button>
                    ))}
                  </div>
                </Card>

                <Card>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-fog-500 uppercase">
                        <Palette className="h-3.5 w-3.5 text-max-300" /> Градиентный никнейм
                      </div>
                      <p className="mt-1 text-[11px] leading-snug text-fog-500">
                        Привилегия 2 уровня буста: имя окрашивается в два цвета на всех серверах, где уровень достигнут
                      </p>
                    </div>
                    <Toggle on={settings.nick.enabled} onChange={() => updateNested("nick", { enabled: !settings.nick.enabled })} />
                  </div>

                  <div className="mt-4 rounded-xl bg-ink-900 p-4 text-center">
                    <div className="text-[10px] font-bold tracking-wider text-fog-500 uppercase">Предпросмотр</div>
                    <GradientName
                      name={settings.displayName || "Ваш никнейм"}
                      c1={settings.nick.c1}
                      c2={settings.nick.c2}
                      className="font-display mt-1 text-2xl"
                    />
                    <div className="mt-2 flex items-center justify-center gap-2 text-[11px] text-fog-500">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: settings.nick.c1 }} />
                      →
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: settings.nick.c2 }} />
                      {settings.nick.c1.toUpperCase()} · {settings.nick.c2.toUpperCase()}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {(["c1", "c2"] as const).map((slot) => (
                      <div key={slot}>
                        <div className="mb-1.5 text-[10px] font-bold tracking-wider text-fog-500 uppercase">
                          {slot === "c1" ? "Первый цвет" : "Второй цвет"}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {NICK_COLORS.map((color) => (
                            <button
                              key={color}
                              onClick={() => updateNested("nick", { [slot]: color })}
                              style={{ backgroundColor: color }}
                              title={color}
                              className={cn(
                                "h-7 w-7 rounded-lg transition hover:scale-110",
                                settings.nick[slot] === color && "ring-2 ring-white ring-offset-2 ring-offset-ink-850"
                              )}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {NICK_PAIRS.map(([a, b], i) => (
                      <button
                        key={i}
                        onClick={() => updateNested("nick", { c1: a, c2: b, enabled: true })}
                        title={`${a} → ${b}`}
                        className="h-7 flex-1 rounded-lg transition hover:scale-[1.03]"
                        style={{ backgroundImage: `linear-gradient(96deg, ${a}, ${b})` }}
                      />
                    ))}
                  </div>
                  <p className="mt-2 text-[11px] text-fog-500">Готовые пары — нажмите, чтобы применить обе сразу.</p>
                </Card>

                <Card>
                  <div className="mb-3 text-xs font-bold tracking-wider text-fog-500 uppercase">Цвет баннера профиля</div>
                  <div className="flex flex-wrap gap-2">
                    {ACCENTS.map((a) => (
                      <button
                        key={a.id}
                        onClick={() => update({ accent: a.id })}
                        style={{ backgroundImage: `linear-gradient(120deg, ${a.a1}, ${a.a3})` }}
                        className={cn(
                          "h-14 w-24 rounded-xl transition hover:scale-105",
                          settings.accent === a.id && "ring-2 ring-white ring-offset-2 ring-offset-ink-850"
                        )}
                      />
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-fog-500">Аватар и баннер подстраиваются под выбранный акцент</p>
                </Card>
              </div>
            )}

            {tab === "privacy" && (
              <Card>
                <Row title="Личные сообщения от участников серверов" desc="Разрешить писать вам участникам общих серверов">
                  <Toggle on={settings.privacy.dmFromEveryone} onChange={() => updateNested("privacy", { dmFromEveryone: !settings.privacy.dmFromEveryone })} />
                </Row>
                <Row title="Заявки в друзья" desc="Кто может отправлять вам заявки">
                  <Toggle on={settings.privacy.friendRequests} onChange={() => updateNested("privacy", { friendRequests: !settings.privacy.friendRequests })} />
                </Row>
                <Row title="Показывать активность" desc="Друзья видят, во что вы играете и что слушаете">
                  <Toggle on={settings.privacy.showActivity} onChange={() => updateNested("privacy", { showActivity: !settings.privacy.showActivity })} />
                </Row>
                <Row title="Аналитика использования" desc="Помогать улучшать TYAM анонимной статистикой">
                  <Toggle on={settings.privacy.analytics} onChange={() => updateNested("privacy", { analytics: !settings.privacy.analytics })} />
                </Row>
              </Card>
            )}

            {tab === "appearance" && (
              <div className="space-y-4">
                <Card>
                  <div className="mb-3 text-xs font-bold tracking-wider text-fog-500 uppercase">Тема</div>
                  <div className="grid grid-cols-2 gap-3">
                    {THEMES.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => update({ theme: t.id })}
                        className={cn(
                          "overflow-hidden rounded-xl border-2 text-left transition",
                          settings.theme === t.id ? "border-max-500 shadow-lg shadow-max-600/20" : "border-ink-600/60 hover:border-ink-500"
                        )}
                      >
                        <span className="block h-14 w-full" style={{ backgroundImage: t.swatch }} />
                        <span className="flex items-center gap-2 px-3 py-2">
                          <span className="text-sm font-bold text-fog-100">{t.name}</span>
                          {settings.theme === t.id && <Check className="ml-auto h-4 w-4 text-max-400" />}
                        </span>
                        <span className="block px-3 pb-2.5 text-xs text-fog-500">{t.desc}</span>
                      </button>
                    ))}
                  </div>
                </Card>

                <Card>
                  <div className="mb-3 text-xs font-bold tracking-wider text-fog-500 uppercase">Акцент</div>
                  <div className="flex flex-wrap gap-2">
                    {ACCENTS.map((a) => (
                      <button
                        key={a.id}
                        onClick={() => update({ accent: a.id })}
                        className={cn(
                          "flex items-center gap-2 rounded-xl border-2 px-3.5 py-2 transition",
                          settings.accent === a.id ? "border-white/80 bg-ink-750" : "border-transparent bg-ink-900 hover:border-ink-500"
                        )}
                      >
                        <span className="h-5 w-5 rounded-full" style={{ backgroundImage: `linear-gradient(135deg, ${a.a1}, ${a.a3})` }} />
                        <span className="text-sm font-semibold text-fog-100">{a.name}</span>
                      </button>
                    ))}
                  </div>
                </Card>

                <Card>
                  <Row title="Плотность сообщений" desc="Компактная экономит место, уютная — как в классике">
                    <div className="flex rounded-lg bg-ink-900 p-1">
                      {(["cozy", "compact"] as const).map((d) => (
                        <button
                          key={d}
                          onClick={() => update({ density: d })}
                          className={cn(
                            "rounded-md px-3.5 py-1.5 text-sm font-semibold transition",
                            settings.density === d ? "max-gradient text-white shadow" : "text-fog-400 hover:text-fog-100"
                          )}
                        >
                          {d === "cozy" ? "Уютная" : "Компактная"}
                        </button>
                      ))}
                    </div>
                  </Row>
                  <Row title="Размер текста сообщений" desc="От 13 до 19 px">
                    <Slider value={settings.msgSize} min={13} max={19} suffix=" px" onChange={(v) => update({ msgSize: v })} />
                  </Row>
                  <Row title="Анимации интерфейса" desc="Плавные переходы, появление сообщений, искры бустов">
                    <Toggle on={settings.animations} onChange={() => update({ animations: !settings.animations })} />
                  </Row>
                </Card>
              </div>
            )}

            {tab === "voice" && (
              <VoiceVideoSettings />
            )}

            {tab === "language" && (
              <Card>
                <Row title="Язык интерфейса" desc="Язык меню, подсказок и системных сообщений">
                  <span className="flex items-center gap-2 text-sm text-fog-400">
                    <Globe className="h-4 w-4" /> {settings.language}
                  </span>
                </Row>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {languages.map((l) => (
                    <button
                      key={l}
                      onClick={() => {
                        update({ language: l });
                        toast(`Язык интерфейса: ${l}`, "success");
                      }}
                      className={cn(
                        "flex items-center gap-2 rounded-xl border-2 px-3.5 py-2.5 text-sm font-semibold transition",
                        settings.language === l ? "border-max-500 bg-ink-750 text-white" : "border-transparent bg-ink-900 text-fog-300 hover:border-ink-500"
                      )}
                    >
                      {l}
                      {settings.language === l && <Check className="ml-auto h-4 w-4 text-max-400" />}
                    </button>
                  ))}
                </div>
                <div className="mt-5 rounded-xl bg-ink-900 p-4 text-sm text-fog-400">
                  Формат дат и времени: <span className="font-semibold text-fog-100">ДД.ММ.ГГГГ, 24 часа</span> · Часовой пояс:{" "}
                  <span className="font-semibold text-fog-100">Москва (UTC+3)</span>
                </div>
              </Card>
            )}

            {tab === "premium" && (
              <div className="space-y-4">
                <div className="max-gradient relative overflow-hidden rounded-2xl p-7 text-white">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_0%,rgba(255,255,255,0.3),transparent_60%)]" />
                  <div className="relative">
                    <Crown className="h-9 w-9 drop-shadow" />
                    <h2 className="font-display mt-3 text-2xl font-extrabold">TYAM Premium</h2>
                    <p className="mt-1.5 max-w-md text-sm text-white/85">
                      Тег Premium рядом с именем, стримы 1080p 60 FPS, файлы до 100 МБ и анимированный аватар. Бусты теперь покупаются отдельно.
                    </p>
                    <button
                      onClick={() => {
                        const next = !settings.premium;
                        update({ premium: next });
                        toast(next ? "TYAM Premium активирован! Тег Premium включён 👑" : "Подписка отменена", next ? "success" : "info");
                      }}
                      className={cn(
                        "mt-5 rounded-xl px-6 py-3 text-sm font-bold transition active:scale-95",
                        settings.premium ? "bg-white/95 text-max-600 hover:bg-white" : "bg-white text-ink-900 hover:brightness-95"
                      )}
                    >
                      {settings.premium ? "Отменить подписку" : "Оформить за 299 ₽ / мес"}
                    </button>
                  </div>
                </div>

                <Card>
                  <Row title="Тег TYAM Premium" desc="Корона и бейдж Premium рядом с вашим именем в чатах и списках">
                    <Toggle
                      on={settings.premium && settings.premiumTag}
                      onChange={() => {
                        if (!settings.premium) { toast("Тег доступен только с активной подпиской", "info"); return; }
                        update({ premiumTag: !settings.premiumTag });
                      }}
                    />
                  </Row>
                  <Row title="Бусты для серверов" desc="Покупаются отдельно в меню бустов сервера — Premium не обязателен">
                    <span className="flex items-center gap-1.5 text-sm font-bold text-boost-1">
                      <Gem className="h-4 w-4" /> {settings.boostCredits} доступно
                    </span>
                  </Row>
                  <Row title="Качество стримов" desc="Разрешение и частота кадров трансляций">
                    <span className="text-sm font-semibold text-fog-100">{settings.premium ? "1080p · 60 FPS" : "720p · 30 FPS"}</span>
                  </Row>
                  <Row title="Размер файла" desc="Максимальный вес загружаемого вложения">
                    <span className="text-sm font-semibold text-fog-100">{settings.premium ? "100 МБ" : "25 МБ"}</span>
                  </Row>
                  <Row title="Анимированный аватар" desc="Живой аватар в профиле и списке участников">
                    <Toggle on={settings.premium} onChange={() => toast("Доступно только с TYAM Premium", "info")} />
                  </Row>
                </Card>

                <div className="flex items-center gap-3 rounded-xl bg-ink-850 p-4 text-sm text-fog-400">
                  <Zap className="h-5 w-5 text-idle" />
                  Подписка продлевается автоматически. Отменить можно в любой момент — привилегии сохранятся до конца периода.
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}