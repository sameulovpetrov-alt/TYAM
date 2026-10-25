/** Читает изображение, уменьшает до maxSize и возвращает dataURL (jpeg/png). */
export function readImageFile(file: File, maxSize: number): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("not-image"));
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      reject(new Error("too-big"));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read-fail"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("decode-fail"));
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(String(reader.result));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.88));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
