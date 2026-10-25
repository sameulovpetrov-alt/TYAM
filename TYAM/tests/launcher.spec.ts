import { test, expect } from "@playwright/test";

test.use({ viewport: { width: 1440, height: 900 } });
const url = "/";

test("launcher home, local release check and feature details", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(url);
  await expect(page).toHaveTitle(/TYAM Launcher/);
  await expect(page.getByRole("heading", { name: "TYAM." })).toBeVisible();
  await expect(page.locator(".launcher-hero-image")).toHaveJSProperty("complete", true);
  expect(await page.locator(".launcher-hero-image").evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
  await page.screenshot({ path: "test-results/launcher-desktop.png" });
  await page.getByRole("button", { name: "Проверить обновления", exact: true }).click();
  await expect(page.getByRole("button", { name: /Актуальная версия/ })).toBeVisible();
  await page.getByRole("button", { name: /ТВОЙ СТИЛЬ/ }).click();
  await expect(page.getByRole("dialog", { name: "Профиль с характером" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Обновления", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Новая орбита TYAM" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("launch, create a server, return and resume without losing messages", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(url);
  await page.getByRole("button", { name: "Запустить TYAM", exact: true }).click();
  await expect(page.getByRole("status", { name: "Загрузка TYAM" })).toBeVisible();
  await expect(page.getByRole("status", { name: "Загрузка TYAM" })).toHaveCount(0, { timeout: 6000 });
  await page.getByRole("button", { name: "Создать сервер", exact: true }).click();
  await page.getByRole("button", { name: "Продолжить", exact: true }).click();
  await page.getByPlaceholder("Например: Вечерний кинозал").fill("Орбита теста");
  await page.getByRole("dialog").getByRole("button", { name: "Создать сервер", exact: true }).click();
  const composer = page.getByPlaceholder(/Написать в #/);
  await composer.fill("Сессия сохранена при возврате в лаунчер");
  await composer.press("Enter");
  await expect(page.getByText("Сессия сохранена при возврате в лаунчер", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Вернуться в лаунчер TYAM", exact: true }).click();
  await expect(page.getByRole("heading", { name: "TYAM." })).toBeVisible();
  await page.getByRole("button", { name: "Вернуться в TYAM", exact: true }).click();
  await expect(page.getByText("Сессия сохранена при возврате в лаунчер", { exact: true })).toBeVisible();
  await expect(page.locator("nav").getByRole("button", { name: "Орбита теста", exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test("preferences persist and automatic launch can be enabled", async ({ page }) => {
  await page.goto(url);
  await page.getByRole("button", { name: "Настройки", exact: true }).click();
  await page.getByRole("switch", { name: "Показывать загрузочный экран" }).click();
  await page.getByRole("switch", { name: "Меньше движения" }).click();
  await page.reload();
  await page.getByRole("button", { name: "Настройки", exact: true }).click();
  await expect(page.getByRole("switch", { name: "Показывать загрузочный экран" })).toHaveAttribute("aria-checked", "false");
  await expect(page.getByRole("switch", { name: "Меньше движения" })).toHaveAttribute("aria-checked", "true");
  await page.getByRole("switch", { name: "Сразу открывать приложение" }).click();
  await page.reload();
  await expect(page.getByRole("button", { name: "Вернуться в лаунчер TYAM", exact: true })).toBeVisible();
  await expect(page.getByRole("status", { name: "Загрузка TYAM" })).toHaveCount(0);
  await page.getByRole("button", { name: "Вернуться в лаунчер TYAM", exact: true }).click();
  await expect(page.getByRole("heading", { name: "TYAM." })).toBeVisible();
});

test("release check has retry and update confirmation", async ({ page }) => {
  await page.route("**/tyam-release.json", (route) => route.fulfill({ status: 503, body: "unavailable" }));
  await page.goto(url);
  await page.getByRole("button", { name: "Проверить обновления", exact: true }).click();
  await expect(page.getByRole("button", { name: "Повторить проверку" })).toBeVisible();
  await page.unroute("**/tyam-release.json");
  await page.route("**/tyam-release.json", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ version: "1.1.0" }) }));
  await page.getByRole("button", { name: "Повторить проверку" }).click();
  await page.getByRole("button", { name: "Обновить до 1.1.0" }).click();
  await expect(page.getByRole("dialog", { name: "Обновление TYAM" })).toBeVisible();
  await expect(page.getByText(/При перезагрузке они будут сброшены/)).toBeVisible();
  await page.getByRole("button", { name: "Позже", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("mobile launcher, help and profile are accessible", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(url);
  await expect(page.getByRole("button", { name: "Запустить TYAM", exact: true })).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  await page.screenshot({ path: "test-results/launcher-mobile.png" });
  await page.getByRole("button", { name: "Нужна помощь?", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "На связи с TYAM" })).toBeVisible();
  await page.getByText("Это приложение для Windows?", { exact: true }).click();
  await expect(page.getByText(/Установщика .exe/)).toBeVisible();
  await page.getByRole("button", { name: "Закрыть окно", exact: true }).click();
  await page.getByRole("button", { name: "Открыть профиль", exact: true }).click();
  await page.getByLabel("Отображаемое имя").fill("Пилот TYAM");
  await page.getByRole("button", { name: "Сохранить", exact: true }).click();
  await page.getByRole("button", { name: "Настройки", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Твой способ запуска" })).toBeVisible();
});

test("keyboard launch and fullscreen fallback", async ({ page }) => {
  await page.goto(url);
  await page.getByRole("button", { name: "Настройки", exact: true }).click();
  await page.getByRole("switch", { name: "Показывать загрузочный экран" }).click();
  await page.getByRole("radio", { name: /Полный экран/ }).click();
  await page.evaluate(() => {
    Object.defineProperty(document, "fullscreenEnabled", { configurable: true, get: () => false });
  });
  await page.keyboard.press("Control+Enter");
  await expect(page.getByRole("button", { name: "Вернуться в лаунчер TYAM", exact: true })).toBeVisible();
  await expect(page.getByText("Полный экран недоступен. TYAM открыт в обычном окне.", { exact: true })).toBeVisible();
});

test("diagnostics download and native fullscreen toggle", async ({ page }) => {
  await page.goto(url);
  await page.getByRole("button", { name: "Настройки", exact: true }).click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Диагностика", exact: true }).click();
  expect((await downloadPromise).suggestedFilename()).toBe("tyam-diagnostics.json");
  await page.getByRole("button", { name: "Развернуть лаунчер", exact: true }).click();
  await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement))).toBe(true);
  await page.getByRole("button", { name: "Выйти из полноэкранного режима", exact: true }).click();
  await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement))).toBe(false);
});