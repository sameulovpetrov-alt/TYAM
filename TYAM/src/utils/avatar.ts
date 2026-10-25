export interface AvatarCrop {
  zoom: number;
  rotation: number;
  x: number;
  y: number;
}

export interface AvatarEditResult {
  url: string;
  source: string;
  crop: AvatarCrop;
}

export const DEFAULT_AVATAR_CROP: AvatarCrop = { zoom: 1, rotation: 0, x: 0, y: 0 };
export const AVATAR_ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function normalizeAvatarCrop(crop?: Partial<AvatarCrop> | null): AvatarCrop {
  const finite = (value: number | undefined, fallback: number) => typeof value === "number" && Number.isFinite(value) ? value : fallback;
  return {
    zoom: clamp(finite(crop?.zoom, 1), 1, 4),
    rotation: ((Math.round(finite(crop?.rotation, 0) / 90) * 90) % 360 + 360) % 360,
    x: clamp(finite(crop?.x, 0), -1, 1),
    y: clamp(finite(crop?.y, 0), -1, 1),
  };
}

export function avatarGeometry(width: number, height: number, side: number, value: AvatarCrop) {
  const crop = normalizeAvatarCrop(value);
  const rotated = crop.rotation === 90 || crop.rotation === 270;
  const boundsWidth = rotated ? height : width;
  const boundsHeight = rotated ? width : height;
  const scale = (side / Math.min(boundsWidth, boundsHeight)) * crop.zoom;
  const maxX = Math.max(0, (boundsWidth * scale - side) / 2);
  const maxY = Math.max(0, (boundsHeight * scale - side) / 2);
  return { scale, maxX, maxY, offsetX: crop.x * maxX, offsetY: crop.y * maxY };
}

export function panAvatar(width: number, height: number, side: number, crop: AvatarCrop, dx: number, dy: number): AvatarCrop {
  const { maxX, maxY } = avatarGeometry(width, height, side, crop);
  return normalizeAvatarCrop({
    ...crop,
    x: maxX ? crop.x + dx / maxX : 0,
    y: maxY ? crop.y + dy / maxY : 0,
  });
}

export function readAvatarSource(file: File): Promise<string> {
  if (file.size > 8 * 1024 * 1024) return Promise.reject(new Error("too-big"));
  const supported = /^(image\/(png|jpeg|webp|gif))$/i.test(file.type) || (!file.type && /\.(png|jpe?g|webp|gif)$/i.test(file.name));
  if (!supported) return Promise.reject(new Error("not-image"));
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read-fail"));
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("read-fail"));
    reader.readAsDataURL(file);
  });
}

export function loadAvatarImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const timeout = window.setTimeout(() => reject(new Error("decode-fail")), 15000);
    image.crossOrigin = "anonymous";
    image.onload = () => {
      window.clearTimeout(timeout);
      if (!image.naturalWidth || !image.naturalHeight) { reject(new Error("decode-fail")); return; }
      if (image.naturalWidth * image.naturalHeight > 40_000_000 || Math.max(image.naturalWidth, image.naturalHeight) > 16384) {
        reject(new Error("dimensions"));
        return;
      }
      resolve(image);
    };
    image.onerror = () => { window.clearTimeout(timeout); reject(new Error("decode-fail")); };
    image.src = source;
  });
}

// Normalized offsets keep the crop identical in the editor, thumbnails, and export.
export function paintAvatar(canvas: HTMLCanvasElement, image: HTMLImageElement, value: AvatarCrop, side = 512): void {
  canvas.width = side;
  canvas.height = side;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("canvas-unavailable");
  const crop = normalizeAvatarCrop(value);
  const { scale, offsetX, offsetY } = avatarGeometry(image.naturalWidth, image.naturalHeight, side, crop);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.clearRect(0, 0, side, side);
  context.save();
  context.translate(side / 2 + offsetX, side / 2 + offsetY);
  context.rotate(crop.rotation * Math.PI / 180);
  const width = image.naturalWidth * scale;
  const height = image.naturalHeight * scale;
  context.drawImage(image, -width / 2, -height / 2, width, height);
  context.restore();
}

export function exportAvatar(image: HTMLImageElement, crop: AvatarCrop): string {
  const canvas = document.createElement("canvas");
  paintAvatar(canvas, image, crop);
  return canvas.toDataURL("image/png");
}

export function avatarError(error: unknown): string {
  const code = error instanceof Error ? error.message : "";
  if (code === "too-big") return "Файл больше 8 МБ. Выберите фото меньшего размера.";
  if (code === "not-image") return "Выберите изображение JPG, PNG, WebP или GIF.";
  if (code === "dimensions") return "Изображение слишком большое. Уменьшите его до 40 мегапикселей.";
  if (code === "canvas-unavailable") return "Браузер не поддерживает обработку фото. Попробуйте другой браузер.";
  return "Не удалось прочитать изображение. Попробуйте другое фото.";
}