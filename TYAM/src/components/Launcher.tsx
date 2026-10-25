import { useEffect, useRef, useState } from "react";
import {
  ArrowDownToLine, ArrowLeft, ArrowRight, ArrowUpRight, Check, CheckCheck,
  Camera, ChevronRight, CircleHelp, ExternalLink, Hash, Headphones,
  House, Info, LoaderCircle, Maximize2, Minimize2, Monitor,
  Play, RefreshCw, Settings2, ShieldCheck, X,
} from "lucide-react";
import type { ReactNode } from "react";
import {
  DEFAULT_LAUNCHER_PREFERENCES, LAUNCHER_STORIES, LAUNCHER_VERSION, formatLaunchDate,
} from "../launcher";
import type { LauncherPreferences, LauncherStory } from "../launcher";
import { useSettings } from "../store";
import { useProfileAvatarEditor } from "../hooks/useProfileAvatarEditor";
import TyamLogo from "./TyamLogo";
import "./launcher.css";

type Section = "home" | "updates" | "settings";
type Dialog = "help" | "account" | "update" | LauncherStory["id"] | null;
type VersionState = "idle" | "checking" | "current" | "available" | "error";

interface LauncherProps {
  preferences: LauncherPreferences;
  onPreferencesChange: (preferences: LauncherPreferences) => void;
  onLaunch: () => void;
  hasLaunched: boolean;
  lastLaunch: string | null;
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return <button type="button" role="switch" aria-label={label} aria-checked={checked} className={`launcher-switch ${checked ? "is-on" : ""}`} onClick={onChange}><span>{checked && <Check size={11} />}</span></button>;
}

function StoryArtwork({ type }: { type: LauncherStory["id"] }) {
  return (
    <span className={`launcher-story-art art-${type}`} aria-hidden="true">
      {type === "profile" && <span className="art-profile-ring"><span><TyamLogo size={31} /></span></span>}
      {type === "servers" && <span className="art-server-lines"><span><Hash size={12} /><i /></span><span><Hash size={12} /><i /></span><span><Headphones size={12} /><i /></span></span>}
      {type === "voice" && <span className="art-voice-bars">{[12, 25, 38, 20, 32, 45, 27, 15].map((height, index) => <i key={index} style={{ height, animationDelay: `${index * 0.15}s` }} />)}</span>}
    </span>
  );
}

function LauncherDialog({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
      }
      if (event.key !== "Tab") return;
      const nodes = ref.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input, a[href], [tabindex="0"]');
      if (!nodes?.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", handleKey, true);
    return () => { document.removeEventListener("keydown", handleKey, true); previous?.focus(); };
  }, [onClose]);
  return (
    <div className="launcher-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div ref={ref} tabIndex={-1} className="launcher-dialog" role="dialog" aria-modal="true" aria-label={title}>
        <header><h2>{title}</h2><button className="launcher-icon-button" onClick={onClose} aria-label="Закрыть окно"><X size={20} /></button></header>
        <div className="launcher-dialog-content">{children}</div>
      </div>
    </div>
  );
}

export default function Launcher({ preferences, onPreferencesChange, onLaunch, hasLaunched, lastLaunch }: LauncherProps) {
  const { settings, update } = useSettings();
  const editAvatar = useProfileAvatarEditor();
  const [section, setSection] = useState<Section>("home");
  const [dialog, setDialog] = useState<Dialog>(null);
  const [versionState, setVersionState] = useState<VersionState>("idle");
  const [latestVersion, setLatestVersion] = useState(LAUNCHER_VERSION);
  const [checkedAt, setCheckedAt] = useState<string | null>(null);
  const [online, setOnline] = useState(() => typeof navigator === "undefined" || navigator.onLine);
  const [fullscreen, setFullscreen] = useState(false);
  const [notice, setNotice] = useState("");
  const [profileName, setProfileName] = useState(settings.displayName);
  const requestRef = useRef<AbortController | null>(null);
  const closeDialog = useRef(() => setDialog(null)).current;

  useEffect(() => {
    const syncNetwork = () => setOnline(navigator.onLine);
    const syncFullscreen = () => setFullscreen(Boolean(document.fullscreenElement));
    syncFullscreen();
    window.addEventListener("online", syncNetwork);
    window.addEventListener("offline", syncNetwork);
    document.addEventListener("fullscreenchange", syncFullscreen);
    return () => {
      window.removeEventListener("online", syncNetwork);
      window.removeEventListener("offline", syncNetwork);
      document.removeEventListener("fullscreenchange", syncFullscreen);
      requestRef.current?.abort();
      requestRef.current = null;
    };
  }, []);

  useEffect(() => {
    const handleLaunchKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter" && !dialog) {
        event.preventDefault();
        onLaunch();
      }
    };
    window.addEventListener("keydown", handleLaunchKey);
    return () => window.removeEventListener("keydown", handleLaunchKey);
  }, [onLaunch, dialog]);

  const checkVersion = async () => {
    if (versionState === "checking") return;
    const controller = new AbortController();
    requestRef.current?.abort();
    requestRef.current = controller;
    setVersionState("checking");
    const timeout = window.setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}tyam-release.json`, { cache: "no-store", signal: controller.signal });
      if (!response.ok) throw new Error("Version unavailable");
      const release: unknown = await response.json();
      if (!release || typeof release !== "object" || !("version" in release) || typeof release.version !== "string" || !/^\d+\.\d+\.\d+$/.test(release.version)) throw new Error("Invalid release");
      setLatestVersion(release.version);
      const latest = release.version.split(".").map(Number);
      const current = LAUNCHER_VERSION.split(".").map(Number);
      const difference = latest.findIndex((value, index) => value !== current[index]);
      const newer = difference >= 0 && latest[difference] > current[difference];
      setVersionState(newer ? "available" : "current");
      setCheckedAt(new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }));
    } catch {
      if (requestRef.current === controller) setVersionState("error");
    } finally {
      window.clearTimeout(timeout);
    }
  };

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (document.fullscreenEnabled) await document.documentElement.requestFullscreen();
      else setNotice("Полноэкранный режим недоступен в этом браузере. Можно развернуть окно вручную.");
    } catch {
      setNotice("Браузер не разрешил полноэкранный режим. Лаунчер продолжает работать в обычном окне.");
    }
  };

  const downloadDiagnostics = () => {
    const content = JSON.stringify({ application: "TYAM Launcher", version: LAUNCHER_VERSION, language: navigator.language, online: navigator.onLine, screen: `${window.innerWidth}x${window.innerHeight}`, preferences, timestamp: new Date().toISOString() }, null, 2);
    const url = URL.createObjectURL(new Blob([content], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "tyam-diagnostics.json";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice("Диагностика сохранена в файл. Паролей и сообщений в нём нет.");
  };

  const changePreference = <K extends keyof LauncherPreferences>(key: K, value: LauncherPreferences[K]) => {
    onPreferencesChange({ ...preferences, [key]: value });
  };

  const nav = [
    { id: "home" as const, name: "Главная", icon: House },
    { id: "updates" as const, name: "Обновления", icon: RefreshCw },
    { id: "settings" as const, name: "Настройки", icon: Settings2 },
  ];
  const selectedStory = LAUNCHER_STORIES.find((story) => story.id === dialog);
  const statusText = versionState === "checking" ? "Проверяем версию" : versionState === "available" ? "Доступно обновление" : versionState === "error" ? "Не удалось проверить версию" : hasLaunched ? "Твоё пространство ждёт" : "Всё готово к запуску";

  return (
    <div className={`tyam-launcher ${preferences.reducedMotion ? "launcher-reduced-motion" : ""}`}>
      <div className="launcher-window">
        <div className="launcher-titlebar">
          <div className="launcher-titlebar-brand"><TyamLogo size={20} /><span>TYAM <span>LAUNCHER</span></span></div>
          <span className="launcher-titlebar-note">Точка входа в твою вселенную</span>
          <div className="launcher-window-actions"><span>WEB</span><button className="launcher-icon-button" onClick={toggleFullscreen} aria-label={fullscreen ? "Выйти из полноэкранного режима" : "Развернуть лаунчер"} title={fullscreen ? "Выйти из полноэкранного режима" : "На весь экран"}>{fullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}</button></div>
        </div>

        <div className="launcher-layout">
          <aside className="launcher-sidebar">
            <button className="launcher-brand" onClick={() => setSection("home")} aria-label="TYAM: главная лаунчера"><TyamLogo size={44} /><span>TYAM<small>LAUNCHER</small></span></button>
            <div className="launcher-navigation-label">ТВОЁ ПРОСТРАНСТВО</div>
            <nav className="launcher-nav" aria-label="Навигация лаунчера">
              {nav.map(({ id, name, icon: Icon }) => <button key={id} className={section === id ? "is-active" : ""} aria-label={name} aria-current={section === id ? "page" : undefined} onClick={() => setSection(id)}><Icon size={19} strokeWidth={1.7} /><span>{name}</span>{id === "updates" && <i className="launcher-nav-dot" />}</button>)}
            </nav>
            <div className="launcher-sidebar-divider" />
            <div className="launcher-navigation-label">ПРИЛОЖЕНИЕ</div>
            <button className="launcher-app-shortcut" aria-label="Открыть приложение TYAM" onClick={onLaunch}><span className="launcher-app-icon"><TyamLogo size={32} /></span><span><b>TYAM</b><small>Общение без границ</small></span><ArrowUpRight size={15} /></button>
            <div className="launcher-sidebar-bottom">
              <button className="launcher-help-link" onClick={() => setDialog("help")}><CircleHelp size={18} strokeWidth={1.6} /> Центр помощи <ArrowUpRight size={14} /></button>
              <button className="launcher-profile" aria-label="Открыть профиль" onClick={() => { setProfileName(settings.displayName); setDialog("account"); }}>
                <span className="launcher-profile-avatar">{settings.avatarUrl ? <img src={settings.avatarUrl} alt="Ваш аватар" /> : <span>{settings.displayName.slice(0, 2).toUpperCase()}</span>}<i /></span>
                <span><b>{settings.displayName}</b><small>Локальный профиль</small></span>
                <Settings2 size={16} />
              </button>
            </div>
          </aside>

          <main className="launcher-main">
            <header className="launcher-page-header"><div><span>Лаунчер</span><ChevronRight size={13} /><b>{nav.find((item) => item.id === section)?.name}</b></div><button className="launcher-header-help" aria-label="Нужна помощь?" onClick={() => setDialog("help")}><CircleHelp size={16} /><span>Нужна помощь?</span></button></header>

            <div className="launcher-page-scroll" key={section}>
              {section === "home" && <>
                <section className="launcher-hero">
                  <img className="launcher-hero-image" src={`${import.meta.env.BASE_URL}images/tyam-orbit.jpg`} alt="Синяя планета с сияющим орбитальным кольцом над космическим пейзажем" fetchPriority="high" />
                  <div className="launcher-hero-shade" />
                  <div className="launcher-hero-copy">
                    <span className="launcher-eyebrow"><span /> МЕСТО ДЛЯ СВОИХ</span>
                    <h1>TYAM<span>.</span></h1>
                    <h2>Общение на твоей орбите.</h2>
                    <p>Твои люди, разговоры и целые миры.<br />Всё в одном пространстве.</p>
                    <button className="launcher-hero-link" onClick={() => setSection("updates")}>Открой новый TYAM <ArrowRight size={17} /></button>
                  </div>
                </section>

                <section className="launcher-news" aria-labelledby="launcher-news-heading">
                  <div className="launcher-section-heading"><h2 id="launcher-news-heading">На этой орбите</h2><button onClick={() => setSection("updates")}>Все обновления <ArrowUpRight size={14} /></button></div>
                  <div className="launcher-stories">
                    {LAUNCHER_STORIES.map((story) => <button key={story.id} className="launcher-story" onClick={() => setDialog(story.id)}><StoryArtwork type={story.id} /><span className="launcher-story-copy"><small>{story.category}</small><strong>{story.title}</strong><span>{story.summary}</span></span><ArrowUpRight className="launcher-story-arrow" size={16} /></button>)}
                  </div>
                </section>
              </>}

              {section === "updates" && <section className="launcher-inner-page">
                <div className="launcher-section-eyebrow"><RefreshCw size={15} /> ЖУРНАЛ ИЗМЕНЕНИЙ</div>
                <h1>Новая орбита TYAM</h1>
                <p className="launcher-page-description">Маленькие улучшения. Больше пространства для общения.</p>
                <div className="launcher-release-heading"><span className="launcher-release-version">{LAUNCHER_VERSION}</span><span>Stable</span><span className="launcher-release-current"><Check size={13} /> Текущая версия</span></div>
                <article className="launcher-release"><div className="launcher-release-mark"><TyamLogo size={36} /></div><div><h2>Всё начинается с одного клика</h2><p>Новый лаунчер объединяет запуск TYAM, выбор режима окна и настройки. Возвращайся в него из приложения, не теряя текущую сессию.</p><ul><li>Быстрый запуск и переход через Ctrl + Enter.</li><li>Сохраняемые настройки и полноэкранный режим.</li><li>Проверка версии по манифесту текущей сборки.</li></ul></div></article>
                {LAUNCHER_STORIES.map((story) => <article className="launcher-release" key={story.id}><StoryArtwork type={story.id} /><div><span className="launcher-release-category">{story.category}</span><h2>{story.title}</h2><p>{story.description}</p><button className="launcher-inline-button" onClick={() => setDialog(story.id)}>Подробнее <ArrowRight size={14} /></button></div></article>)}
                <p className="launcher-honest-note"><Info size={15} /> Это веб-версия TYAM. Проверка сверяет версию с манифестом этого сайта, а не устанавливает программу на компьютер.</p>
              </section>}

              {section === "settings" && <section className="launcher-inner-page launcher-settings">
                <div className="launcher-section-eyebrow"><Settings2 size={15} /> НАСТРОЙ ПОД СЕБЯ</div>
                <h1>Твой способ запуска</h1>
                <p className="launcher-page-description">Изменения сохраняются автоматически в этом браузере.</p>
                <div className="launcher-settings-group"><h2>Режим окна</h2><div className="launcher-window-options" role="radiogroup" aria-label="Режим окна при запуске">
                  <button role="radio" aria-checked={preferences.windowMode === "window"} className={preferences.windowMode === "window" ? "is-selected" : ""} onClick={() => changePreference("windowMode", "window")}><Monitor size={25} /><span><b>Обычное окно</b><small>В текущей вкладке браузера</small></span><i>{preferences.windowMode === "window" && <Check size={12} />}</i></button>
                  <button role="radio" aria-checked={preferences.windowMode === "fullscreen"} className={preferences.windowMode === "fullscreen" ? "is-selected" : ""} onClick={() => changePreference("windowMode", "fullscreen")}><Maximize2 size={25} /><span><b>Полный экран</b><small>Ничего лишнего вокруг</small></span><i>{preferences.windowMode === "fullscreen" && <Check size={12} />}</i></button>
                </div></div>
                <div className="launcher-settings-group"><h2>Запуск и интерфейс</h2>
                  <div className="launcher-setting-row"><div><h3>Загрузочный экран</h3><p>Фирменная заставка TYAM перед входом.</p></div><Toggle label="Показывать загрузочный экран" checked={preferences.showSplash} onChange={() => changePreference("showSplash", !preferences.showSplash)} /></div>
                  <div className="launcher-setting-row"><div><h3>Сразу открывать приложение</h3><p>Пропускать лаунчер при следующем открытии страницы.</p></div><Toggle label="Сразу открывать приложение" checked={preferences.autoLaunch} onChange={() => changePreference("autoLaunch", !preferences.autoLaunch)} /></div>
                  <div className="launcher-setting-row"><div><h3>Меньше движения</h3><p>Отключить декоративные анимации лаунчера и заставки.</p></div><Toggle label="Меньше движения" checked={preferences.reducedMotion} onChange={() => changePreference("reducedMotion", !preferences.reducedMotion)} /></div>
                </div>
                <div className="launcher-settings-group"><h2>Об этом лаунчере</h2><div className="launcher-about-row"><span>Версия</span><b>{LAUNCHER_VERSION} / Stable</b></div><div className="launcher-about-row"><span>Платформа</span><b>Web</b></div><div className="launcher-about-row"><span>Последний запуск</span><b>{lastLaunch ? formatLaunchDate(lastLaunch) : "Ещё не запускали"}</b></div></div>
                <div className="launcher-settings-actions"><button className="launcher-secondary-button" onClick={() => { onPreferencesChange({ ...DEFAULT_LAUNCHER_PREFERENCES }); setNotice("Настройки лаунчера сброшены. Профиль и чаты не затронуты."); }}><RotateIcon /> Сбросить настройки</button><button className="launcher-inline-button" onClick={downloadDiagnostics}><ArrowDownToLine size={15} /> Диагностика</button></div>
              </section>}
            </div>

            <div className="launcher-launchbar">
              <div className="launcher-installation"><span className="launcher-install-icon"><TyamLogo size={37} /></span><div><h3>TYAM <span>STABLE</span></h3><p><i className={versionState === "error" ? "is-warning" : ""} />{statusText}</p><small>Версия {LAUNCHER_VERSION} <span>·</span> Web-приложение</small></div></div>
              <div className="launcher-launch-actions"><button className="launcher-launch-settings" onClick={() => setSection("settings")} aria-label="Параметры запуска" title="Параметры запуска"><Settings2 size={20} /></button><button className="launcher-play-button" onClick={onLaunch}><Play size={19} fill="currentColor" /><span>{hasLaunched ? "Вернуться в TYAM" : "Запустить TYAM"}</span><ArrowUpRight size={18} /></button></div>
              <div className="launcher-launchbar-bottom"><button className="launcher-version-check" disabled={versionState === "checking"} onClick={versionState === "available" ? () => setDialog("update") : checkVersion}>{versionState === "checking" ? <LoaderCircle size={12} className="launcher-spin" /> : versionState === "current" ? <CheckCheck size={13} /> : <RefreshCw size={12} />}{versionState === "checking" ? "Проверка..." : versionState === "current" ? `Актуальная версия · ${checkedAt}` : versionState === "available" ? `Обновить до ${latestVersion}` : versionState === "error" ? "Повторить проверку" : "Проверить обновления"}</button><span className="launcher-shortcut-hint">Быстрый запуск <kbd>Ctrl</kbd><span>+</span><kbd>Enter</kbd></span></div>
            </div>
          </main>
        </div>

        <footer className="launcher-statusbar"><span className={online ? "launcher-network-online" : "launcher-network-offline"}><i />{online ? "Сеть доступна" : "Нет подключения"}</span><span><ShieldCheck size={12} /> Твоё пространство. Твои правила.</span><span>TYAM Launcher <b>{LAUNCHER_VERSION}</b></span></footer>
      </div>

      {notice && <div className="launcher-notice" role="status"><Info size={17} /><span>{notice}</span><button onClick={() => setNotice("")} aria-label="Закрыть уведомление"><X size={16} /></button></div>}

      {dialog && <LauncherDialog title={dialog === "help" ? "На связи с TYAM" : dialog === "account" ? "Твой профиль" : dialog === "update" ? "Обновление TYAM" : selectedStory?.title ?? "TYAM"} onClose={closeDialog}>
        {dialog === "help" && <>
          <div className="launcher-dialog-intro"><TyamLogo size={48} /><p>Всё, что нужно для первого запуска.<br /><span>Без лишних шагов.</span></p></div>
          <details open><summary>Как запустить TYAM?</summary><p>Нажми «Запустить TYAM» или Ctrl + Enter. После заставки откроется приложение с чатами, профилем и сервером, который ты можешь создать сам.</p></details>
          <details><summary>Как вернуться в лаунчер?</summary><p>Нажми кнопку с ракетой внизу левой панели TYAM. Текущие серверы и сообщения останутся в этой вкладке. Активный локальный захват голоса и видео будет остановлен.</p></details>
          <details><summary>Это приложение для Windows?</summary><p>Сейчас лаунчер работает в браузере. Установщика .exe и фонового автообновления нет. Полный экран доступен, если браузер его разрешает.</p></details>
          <details><summary>Что сохраняется?</summary><p>Настройки запуска сохраняются на этом устройстве. Содержимое текущей сессии TYAM сохраняется при возврате в лаунчер, но сбрасывается после перезагрузки страницы.</p></details>
          <button className="launcher-secondary-button" onClick={downloadDiagnostics}><ArrowDownToLine size={15} /> Скачать диагностику</button>
        </>}
        {dialog === "account" && <form className="launcher-profile-form" onSubmit={(event) => { event.preventDefault(); if (!profileName.trim()) return; update({ displayName: profileName.trim() }); closeDialog(); setNotice("Имя профиля обновлено в TYAM."); }}>
          <div className="launcher-dialog-intro"><button type="button" className="launcher-profile-avatar is-large launcher-avatar-edit" onClick={editAvatar} aria-label="Редактировать аватар" title="Редактировать аватар">{settings.avatarUrl ? <img src={settings.avatarUrl} alt="Ваш аватар" /> : settings.displayName.slice(0, 2).toUpperCase()}<span className="launcher-avatar-edit-overlay"><Camera size={22} /></span></button><p>{settings.displayName}<span>@{settings.username}</span></p></div>
          <label htmlFor="launcher-display-name">Отображаемое имя</label><input id="launcher-display-name" value={profileName} onChange={(event) => setProfileName(event.target.value)} maxLength={24} required />
          <p className="launcher-form-note">Нажмите на аватар, чтобы обрезать или заменить фото. Баннер и оформление доступны в настройках профиля внутри TYAM.</p>
          <button className="launcher-play-button" disabled={!profileName.trim()}><Check size={16} /> Сохранить</button>
        </form>}
        {dialog === "update" && <><div className="launcher-dialog-intro"><RefreshCw size={32} /><p>Доступна версия {latestVersion}<span>Обнови страницу, чтобы загрузить новую сборку.</span></p></div><p className="launcher-form-note">Текущие чаты и серверы хранятся в этой вкладке. При перезагрузке они будут сброшены. Настройки лаунчера сохранятся.</p><div className="launcher-dialog-actions"><button className="launcher-secondary-button" onClick={closeDialog}>Позже</button><button className="launcher-play-button" onClick={() => window.location.reload()}><RefreshCw size={16} /> Обновить страницу</button></div></>}
        {selectedStory && <><StoryArtwork type={selectedStory.id} /><p className="launcher-story-description">{selectedStory.description}</p><ul className="launcher-story-details">{selectedStory.details.map((text) => <li key={text}><Check size={15} /><span>{text}</span></li>)}</ul><button className="launcher-play-button" onClick={onLaunch}><Play size={16} fill="currentColor" /> Открыть TYAM <ExternalLink size={15} /></button></>}
      </LauncherDialog>}
    </div>
  );
}

function RotateIcon() { return <ArrowLeft size={15} />; }