import { expect, test } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";
import { avatarGeometry, normalizeAvatarCrop, panAvatar } from "../src/utils/avatar";

test.use({ viewport: { width: 1440, height: 900 } });

async function fixture(page: Page) {
  const base64 = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1000;
    canvas.height = 600;
    const context = canvas.getContext("2d")!;
    const gradient = context.createLinearGradient(0, 0, 1000, 600);
    gradient.addColorStop(0, "#2176ff");
    gradient.addColorStop(0.55, "#7358d5");
    gradient.addColorStop(1, "#ffaf7c");
    context.fillStyle = gradient;
    context.fillRect(0, 0, 1000, 600);
    context.fillStyle = "#f1f6ff";
    context.beginPath();
    context.arc(550, 240, 80, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#0b1735";
    context.fillRect(110, 350, 650, 140);
    context.fillStyle = "#e4cfff";
    context.font = "bold 68px sans-serif";
    context.fillText("TYAM", 330, 445);
    return canvas.toDataURL("image/png").split(",")[1];
  });
  return { name: "my-photo.png", mimeType: "image/png", buffer: Buffer.from(base64, "base64") };
}

function editor(page: Page, server = false) {
  return page.getByRole("dialog", { name: server ? "Редактировать аватар сервера" : "Редактировать аватар", exact: true });
}

async function upload(page: Page, dialog: Locator) {
  await dialog.getByLabel("Фото для аватара", { exact: true }).setInputFiles(await fixture(page));
  await expect(dialog.getByRole("button", { name: "Применить", exact: true })).toBeEnabled();
  await expect(dialog.getByText("1000 × 600 пикселей")).toBeVisible();
}

async function canvasData(dialog: Locator) {
  return dialog.locator(".avatar-crop-stage canvas").evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL("image/png"));
}

async function launchDirect(page: Page) {
  await page.addInitScript(() => localStorage.setItem("tyam.launcher.preferences.v1", JSON.stringify({ autoLaunch: true, showSplash: false })));
  await page.goto("/");
}

test("crop geometry covers the frame at every right-angle rotation", () => {
  for (const [width, height] of [[1000, 600], [500, 1400], [512, 512]]) {
    for (const rotation of [0, 90, 180, 270]) {
      const crop = normalizeAvatarCrop({ zoom: 2, x: 100, y: -100, rotation });
      const geometry = avatarGeometry(width, height, 512, crop);
      const rotated = rotation % 180 !== 0;
      const outputWidth = (rotated ? height : width) * geometry.scale;
      const outputHeight = (rotated ? width : height) * geometry.scale;
      expect(outputWidth).toBeGreaterThanOrEqual(512);
      expect(outputHeight).toBeGreaterThanOrEqual(512);
      expect(Math.abs(geometry.offsetX)).toBeLessThanOrEqual((outputWidth - 512) / 2);
      expect(Math.abs(geometry.offsetY)).toBeLessThanOrEqual((outputHeight - 512) / 2);
      const moved = panAvatar(width, height, 320, crop, -1_000_000, 1_000_000);
      expect(moved.x).toBe(-1);
      expect(moved.y).toBe(1);
    }
  }
});

test("personal avatar can be cropped, rotated, saved and edited from its original", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page.getByRole("button", { name: "Открыть профиль", exact: true }).click();
  const profile = page.getByRole("dialog", { name: "Твой профиль" });
  await profile.getByRole("button", { name: "Редактировать аватар", exact: true }).click();
  const cropper = editor(page);
  await upload(page, cropper);
  const initial = await canvasData(cropper);
  await cropper.getByRole("slider", { name: "Масштаб аватара" }).press("End");
  await expect(cropper.getByRole("slider", { name: "Масштаб аватара" })).toHaveValue("4");
  const stage = cropper.getByRole("group", { name: "Область обрезки аватара" });
  const box = (await stage.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 60, box.y + box.height / 2 - 40, { steps: 6 });
  await page.mouse.up();
  await cropper.getByRole("button", { name: "Повернуть на 90°" }).click();
  const cropped = await canvasData(cropper);
  expect(cropped).not.toBe(initial);
  await page.screenshot({ path: "test-results/avatar-editor-desktop.png" });
  await cropper.getByRole("button", { name: "Применить", exact: true }).click();
  await expect(cropper).toHaveCount(0);
  await expect(profile).toBeVisible();
  const avatar = profile.getByRole("img", { name: "Ваш аватар", exact: true });
  await expect(avatar).toHaveAttribute("src", cropped);
  await expect(avatar).toHaveJSProperty("naturalWidth", 512);

  await profile.getByRole("button", { name: "Редактировать аватар", exact: true }).click();
  await expect(cropper.getByText("1000 × 600 пикселей")).toBeVisible();
  await expect(cropper.getByRole("slider", { name: "Масштаб аватара" })).toHaveValue("4");
  expect(await canvasData(cropper)).toBe(cropped);
  await cropper.getByRole("button", { name: "Сбросить", exact: true }).click();
  expect(await canvasData(cropper)).toBe(initial);
  await page.keyboard.press("Escape");
  await expect(cropper).toHaveCount(0);
  await expect(profile).toBeVisible();
  await expect(avatar).toHaveAttribute("src", cropped);
  expect(errors).toEqual([]);
});

test("invalid uploads are rejected without changing the profile", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Открыть профиль", exact: true }).click();
  await page.getByRole("button", { name: "Редактировать аватар", exact: true }).click();
  const cropper = editor(page);
  await cropper.getByLabel("Фото для аватара").setInputFiles({ name: "not-an-image.txt", mimeType: "text/plain", buffer: Buffer.from("hello") });
  await expect(cropper.getByRole("alert")).toContainText("Выберите изображение");
  await expect(cropper.getByRole("button", { name: "Применить", exact: true })).toBeDisabled();
  await cropper.getByLabel("Фото для аватара").setInputFiles({ name: "too-large.png", mimeType: "image/png", buffer: Buffer.alloc(8 * 1024 * 1024 + 1) });
  await expect(cropper.getByRole("alert")).toContainText("больше 8 МБ");
  await cropper.getByLabel("Фото для аватара").setInputFiles({ name: "broken.png", mimeType: "image/png", buffer: Buffer.from("not png") });
  await expect(cropper.getByRole("alert")).toContainText("Не удалось прочитать");
  await upload(page, cropper);
  await expect(cropper.getByRole("alert")).toHaveCount(0);
  await cropper.getByRole("button", { name: "Отмена", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Твой профиль" }).getByRole("img", { name: "Ваш аватар" })).toHaveCount(0);
});

test("server creation and server settings use the same non-destructive editor", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await launchDirect(page);
  await page.getByRole("button", { name: "Создать сервер", exact: true }).click();
  await page.getByRole("button", { name: "Продолжить", exact: true }).click();
  await page.getByPlaceholder("Например: Вечерний кинозал").fill("Сервер с аватаром");
  await page.getByRole("button", { name: "Своё фото", exact: true }).click();
  const cropper = editor(page, true);
  await upload(page, cropper);
  await cropper.getByRole("slider", { name: "Масштаб аватара" }).press("End");
  await cropper.getByRole("button", { name: "Повернуть на 90°" }).click();
  const originalIcon = await canvasData(cropper);
  await cropper.getByRole("button", { name: "Применить", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Создать сервер", exact: true }).click();
  const server = page.locator("nav").getByRole("button", { name: "Сервер с аватаром", exact: true });
  await expect(server.locator("img")).toHaveAttribute("src", originalIcon);
  await server.click({ button: "right" });
  await page.getByRole("button", { name: "Настройки сервера", exact: true }).click();
  await page.getByRole("button", { name: "Редактировать аватар сервера", exact: true }).click();
  await expect(cropper.getByText("1000 × 600 пикселей")).toBeVisible();
  await expect(cropper.getByRole("slider", { name: "Масштаб аватара" })).toHaveValue("4");
  await cropper.getByRole("button", { name: "Сбросить", exact: true }).click();
  const nextIcon = await canvasData(cropper);
  expect(nextIcon).not.toBe(originalIcon);
  await cropper.getByRole("button", { name: "Применить", exact: true }).click();
  await expect(server.locator("img")).toHaveAttribute("src", originalIcon);
  await page.getByRole("dialog").getByRole("button", { name: "Отмена", exact: true }).click();
  await expect(server.locator("img")).toHaveAttribute("src", originalIcon);

  await server.click({ button: "right" });
  await page.getByRole("button", { name: "Настройки сервера", exact: true }).click();
  await page.getByRole("button", { name: "Редактировать аватар сервера", exact: true }).click();
  await expect(cropper.getByRole("slider", { name: "Масштаб аватара" })).toHaveValue("4");
  await cropper.getByRole("button", { name: "Сбросить", exact: true }).click();
  await cropper.getByRole("button", { name: "Применить", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Сохранить", exact: true }).click();
  await expect(server.locator("img")).toHaveAttribute("src", nextIcon);
  expect(errors).toEqual([]);
});

test("profile settings and full profile share the edited image", async ({ page }) => {
  await launchDirect(page);
  await page.getByRole("button", { name: "Настройки пользователя", exact: true }).click();
  await page.getByRole("button", { name: "Профиль", exact: true }).click();
  await page.getByRole("button", { name: "Загрузить аватар", exact: true }).click();
  const cropper = editor(page);
  await upload(page, cropper);
  await cropper.getByRole("button", { name: "Повернуть на 90°" }).click();
  const photo = await canvasData(cropper);
  await cropper.getByRole("button", { name: "Применить", exact: true }).click();
  await expect(page.getByRole("button", { name: "Изменить аватар", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByTitle("Открыть профиль", { exact: true }).click();
  const profile = page.getByRole("dialog");
  await expect(profile.getByRole("img", { name: "Вы", exact: true })).toHaveAttribute("src", photo);
  await profile.getByRole("button", { name: "Редактировать аватар", exact: true }).click();
  await expect(cropper.getByText("1000 × 600 пикселей")).toBeVisible();
  expect(await canvasData(cropper)).toBe(photo);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Изменить профиль и настройки" })).toBeVisible();
});

test("avatar editor fits a mobile screen and restores focus on cancel", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Открыть профиль", exact: true }).click();
  const trigger = page.getByRole("button", { name: "Редактировать аватар", exact: true });
  await trigger.click();
  const cropper = editor(page);
  await upload(page, cropper);
  await expect(cropper.getByRole("button", { name: "Применить", exact: true })).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  await page.screenshot({ path: "test-results/avatar-editor-mobile.png" });
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
});