import { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent, ReactNode } from "react";
import { createPortal } from "react-dom";
import { Check, Crop, ImagePlus, LoaderCircle, Move, RotateCcw, RotateCw, Upload, X, ZoomIn, ZoomOut } from "lucide-react";
import {
  AVATAR_ACCEPT, DEFAULT_AVATAR_CROP, avatarError, exportAvatar, loadAvatarImage,
  normalizeAvatarCrop, paintAvatar, panAvatar, readAvatarSource,
} from "../utils/avatar";
import type { AvatarCrop, AvatarEditResult } from "../utils/avatar";
import "./avatar-editor.css";

interface AvatarEditorRequest {
  kind: "profile" | "server";
  name: string;
  image?: string | null;
  source?: string | null;
  crop?: AvatarCrop | null;
  file?: File;
  saveHint?: string;
  onSave: (result: AvatarEditResult) => void;
}

const AvatarEditorContext = createContext<((request: AvatarEditorRequest) => void) | null>(null);

export function AvatarEditorProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<(AvatarEditorRequest & { id: number }) | null>(null);
  const id = useRef(0);
  const open = useCallback((options: AvatarEditorRequest) => setRequest({ ...options, id: ++id.current }), []);
  const close = useCallback(() => setRequest(null), []);
  return (
    <AvatarEditorContext.Provider value={open}>
      {children}
      {request && createPortal(<AvatarEditor key={request.id} request={request} onClose={close} />, document.body)}
    </AvatarEditorContext.Provider>
  );
}

export function useAvatarEditor() {
  const open = useContext(AvatarEditorContext);
  if (!open) throw new Error("AvatarEditorProvider is required");
  return open;
}

function AvatarEditor({ request, onClose }: { request: AvatarEditorRequest; onClose: () => void }) {
  const titleId = useId();
  const instructionsId = useId();
  const [source, setSource] = useState("");
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [crop, setCrop] = useState<AvatarCrop>(() => normalizeAvatarCrop(request.crop));
  const [loading, setLoading] = useState(Boolean(request.source || request.image || request.file));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [dropping, setDropping] = useState(false);
  const [filename, setFilename] = useState("Текущее фото");
  const dialogRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mainCanvas = useRef<HTMLCanvasElement>(null);
  const profileCanvas = useRef<HTMLCanvasElement>(null);
  const listCanvas = useRef<HTMLCanvasElement>(null);
  const loadToken = useRef(0);
  const saveLock = useRef(false);
  const mounted = useRef(true);
  const gesture = useRef<{ id: number; x: number; y: number; crop: AvatarCrop } | null>(null);
  const isServer = request.kind === "server";
  const title = isServer ? "Редактировать аватар сервера" : "Редактировать аватар";
  const ready = Boolean(image) && !loading && !saving;

  const selectFile = useCallback(async (file: File) => {
    const token = ++loadToken.current;
    setLoading(true);
    setError("");
    try {
      const nextSource = await readAvatarSource(file);
      const nextImage = await loadAvatarImage(nextSource);
      if (!mounted.current || token !== loadToken.current) return;
      setSource(nextSource);
      setImage(nextImage);
      setFilename(file.name);
      setCrop({ ...DEFAULT_AVATAR_CROP });
    } catch (reason) {
      if (mounted.current && token === loadToken.current) setError(avatarError(reason));
    } finally {
      if (mounted.current && token === loadToken.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    const existing = request.source || request.image;
    if (request.file) void selectFile(request.file);
    else if (existing) {
      const token = ++loadToken.current;
      void loadAvatarImage(existing).then((loaded) => {
        if (!mounted.current || token !== loadToken.current) return;
        setSource(existing);
        setImage(loaded);
        setCrop(normalizeAvatarCrop(request.source ? request.crop : null));
      }).catch((reason) => {
        if (mounted.current && token === loadToken.current) setError(avatarError(reason));
      }).finally(() => {
        if (mounted.current && token === loadToken.current) setLoading(false);
      });
    }
    return () => { mounted.current = false; loadToken.current++; };
  }, [request, selectFile]);

  useEffect(() => {
    if (!image) return;
    try {
      for (const canvas of [mainCanvas.current, profileCanvas.current, listCanvas.current]) {
        if (canvas) paintAvatar(canvas, image, crop);
      }
    } catch (reason) { setError(avatarError(reason)); }
  }, [image, crop]);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const appRoot = document.getElementById("root");
    const previousInert = appRoot?.inert ?? false;
    if (appRoot) appRoot.inert = true;
    dialogRef.current?.focus();
    const keyHandler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation();
        onClose();
      }
      if ((event.ctrlKey || event.metaKey) && (event.key === "," || event.key === "Enter")) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
      if (event.key !== "Tab") return;
      const focusables = dialogRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not([type="file"]):not(:disabled), [tabindex="0"]');
      if (!focusables?.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    // Capture Escape before the underlying profile/settings dialog receives it.
    window.addEventListener("keydown", keyHandler, true);
    return () => {
      window.removeEventListener("keydown", keyHandler, true);
      if (appRoot) appRoot.inert = previousInert;
      if (previous?.isConnected) previous.focus();
    };
  }, [onClose]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !ready) return;
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      setCrop((current) => normalizeAvatarCrop({ ...current, zoom: current.zoom - event.deltaY * 0.002 }));
    };
    stage.addEventListener("wheel", wheel, { passive: false });
    return () => stage.removeEventListener("wheel", wheel);
  }, [ready]);

  const changeZoom = (zoom: number) => setCrop((current) => normalizeAvatarCrop({ ...current, zoom }));
  const rotate = () => setCrop((current) => normalizeAvatarCrop({ ...current, rotation: current.rotation + 90, x: -current.y, y: current.x }));

  const startDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!ready || event.button !== 0 || gesture.current) return;
    event.preventDefault();
    event.currentTarget.focus();
    event.currentTarget.setPointerCapture(event.pointerId);
    gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY, crop: { ...crop } };
    setDragging(true);
  };
  const moveDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = gesture.current;
    if (!start || start.id !== event.pointerId || !image) return;
    const side = event.currentTarget.getBoundingClientRect().width;
    setCrop(panAvatar(image.naturalWidth, image.naturalHeight, side, start.crop, event.clientX - start.x, event.clientY - start.y));
  };
  const endDrag = () => { gesture.current = null; setDragging(false); };
  const moveWithKeys = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (!ready || !image) return;
    const step = event.shiftKey ? 20 : 6;
    const offsets: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    if (!offsets[event.key]) return;
    event.preventDefault();
    event.stopPropagation();
    const [dx, dy] = offsets[event.key];
    const side = event.currentTarget.getBoundingClientRect().width;
    setCrop((current) => panAvatar(image.naturalWidth, image.naturalHeight, side, current, dx, dy));
  };

  const save = async () => {
    if (!image || !source || !ready || saveLock.current) return;
    saveLock.current = true;
    setSaving(true);
    setError("");
    try {
      const result = exportAvatar(image, crop);
      request.onSave({ url: result, source, crop: { ...crop } });
      onClose();
    } catch {
      setError("Не удалось сохранить аватар. Загрузите фото с устройства и попробуйте ещё раз.");
      setSaving(false);
      saveLock.current = false;
    }
  };

  return (
    <div className="avatar-editor-backdrop" data-avatar-editor="true" onClick={(event) => { event.stopPropagation(); if (event.target === event.currentTarget && !saving) onClose(); }}>
      <div ref={dialogRef} className="avatar-editor-dialog" tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <header className="avatar-editor-header">
          <span className="avatar-editor-mark"><Crop size={21} /></span>
          <div><span className="avatar-editor-eyebrow">TYAM / ПЕРСОНАЛИЗАЦИЯ</span><h2 id={titleId}>{title}</h2></div>
          <button className="avatar-editor-icon" type="button" aria-label="Закрыть редактор аватара" onClick={onClose} disabled={saving}><X size={19} /></button>
        </header>

        <div className="avatar-editor-body">
          <section className="avatar-editor-workspace" aria-label="Кадрирование фото">
            <div className="avatar-editor-section-title"><span>ВЫБЕРИТЕ ОБЛАСТЬ ФОТО</span><span>1:1</span></div>
            <div ref={stageRef} tabIndex={ready ? 0 : -1} role="group" aria-label="Область обрезки аватара" aria-describedby={instructionsId}
              className={`avatar-crop-stage ${image ? "has-image" : ""} ${dragging ? "is-dragging" : ""} ${dropping ? "is-dropping" : ""}`}
              onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag} onLostPointerCapture={endDrag} onKeyDown={moveWithKeys}
              onDragOver={(event) => { event.preventDefault(); if (!saving) setDropping(true); }} onDragLeave={() => setDropping(false)}
              onDrop={(event) => { event.preventDefault(); setDropping(false); const file = event.dataTransfer.files[0]; if (file && !saving) void selectFile(file); }}
            >
              <canvas ref={mainCanvas} width={512} height={512} aria-label="Область выбранного изображения" className={image ? "" : "is-hidden"} />
              {image && <div className={`avatar-crop-mask ${isServer ? "is-server" : ""}`} aria-hidden="true"><span className="avatar-crop-grid" /></div>}
              {!image && !loading && <div className="avatar-editor-empty"><span><ImagePlus size={36} strokeWidth={1.3} /></span><strong>Начните со своего фото</strong><p>Перетащите изображение сюда<br />или выберите файл на устройстве</p><button type="button" className="avatar-editor-primary" onClick={() => inputRef.current?.click()}><Upload size={15} /> Выбрать фото</button></div>}
              {loading && <div className="avatar-editor-loading" role="status"><LoaderCircle className="avatar-editor-spin" size={26} />Открываем фото...</div>}
            </div>
            <p className="avatar-editor-hint" id={instructionsId}><Move size={14} /> Перемещайте фото мышью или стрелками</p>

            <div className="avatar-editor-zoom"><button type="button" className="avatar-editor-icon" aria-label="Уменьшить масштаб" onClick={() => changeZoom(crop.zoom - 0.1)} disabled={!ready || crop.zoom <= 1}><ZoomOut size={18} /></button><input aria-label="Масштаб аватара" type="range" min="1" max="4" step="0.01" value={crop.zoom} disabled={!ready} onChange={(event) => changeZoom(Number(event.target.value))} /><button type="button" className="avatar-editor-icon" aria-label="Увеличить масштаб" onClick={() => changeZoom(crop.zoom + 0.1)} disabled={!ready || crop.zoom >= 4}><ZoomIn size={18} /></button><output>{Math.round(crop.zoom * 100)}%</output></div>
            <div className="avatar-editor-tools"><button type="button" className="avatar-editor-secondary" onClick={rotate} disabled={!ready}><RotateCw size={15} /> Повернуть на 90°</button><button type="button" className="avatar-editor-text-button" onClick={() => setCrop({ ...DEFAULT_AVATAR_CROP })} disabled={!ready}><RotateCcw size={14} /> Сбросить</button></div>
          </section>

          <aside className="avatar-editor-preview">
            <div className="avatar-editor-section-title">ПРЕДПРОСМОТР</div>
            <div className="avatar-preview-profile"><div className="avatar-preview-cover" /><div className={`avatar-preview-large ${isServer ? "is-server" : ""}`}>{image ? <canvas ref={profileCanvas} width={512} height={512} aria-label="Аватар в профиле" /> : <ImagePlus size={28} strokeWidth={1.5} />}</div><strong>{request.name || (isServer ? "Ваш сервер" : "Вы")}</strong><span>{isServer ? "Иконка вашего сервера" : "Ваш профиль в TYAM"}</span></div>
            <div className="avatar-preview-small"><div className={`avatar-preview-mini ${isServer ? "is-server" : ""}`}>{image ? <canvas ref={listCanvas} width={512} height={512} aria-label="Аватар в списке" /> : <ImagePlus size={17} />}</div><span><b>{request.name || "TYAM"}</b><small>{isServer ? "В списке серверов" : "В чатах и списке участников"}</small></span></div>
            <div className="avatar-editor-file-info"><b>{image ? filename : "Ваше фото, ваш стиль"}</b><span>{image ? `${image.naturalWidth} × ${image.naturalHeight} пикселей` : "JPG, PNG, WebP или GIF до 8 МБ"}</span><span>Результат: PNG, 512 × 512</span></div>
            <button type="button" className="avatar-editor-secondary avatar-replace" onClick={() => inputRef.current?.click()} disabled={loading || saving}><ImagePlus size={16} />{image ? "Заменить фото" : "Загрузить фото"}</button>
            {source.startsWith("data:image/gif") && <p className="avatar-editor-format-note">При обрезке GIF сохраняется как статичное изображение. Украшения из магазина остаются анимированными.</p>}
          </aside>
        </div>

        {error && <p className="avatar-editor-error" role="alert">{error}</p>}
        <footer className="avatar-editor-footer"><p>{request.saveHint ?? (isServer ? "После применения сохраните настройки сервера." : "Исходник сохранится для повторного редактирования.")}</p><div><button type="button" className="avatar-editor-text-button" onClick={onClose} disabled={saving}>Отмена</button><button type="button" className="avatar-editor-primary" onClick={() => void save()} disabled={!ready}>{saving ? <LoaderCircle size={15} className="avatar-editor-spin" /> : <Check size={15} />}{saving ? "Сохраняем..." : "Применить"}</button></div></footer>
        <input ref={inputRef} className="avatar-editor-file-input" type="file" accept={AVATAR_ACCEPT} aria-label="Фото для аватара" onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; if (file) void selectFile(file); }} />
      </div>
    </div>
  );
}