import { chromium } from "playwright";
import assert from "node:assert/strict";
const url = process.env.SCORE_URL || "http://127.0.0.1:4176";
const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox"],
});
const page = await browser.newPage({
  viewport: { width: 1440, height: 960 },
  deviceScaleFactor: 1,
});
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto(url);
await page.waitForTimeout(1000);
await page.screenshot({ path: "artifacts/desktop-dark.png", fullPage: true });
console.log({
  errors,
  hero: await page.locator(".main-number").innerText(),
  total: await page.locator(".hero-investment>strong").innerText(),
  rows: await page.locator(".score-row").count(),
  height: await page.locator("body").evaluate((e) => e.scrollHeight),
});
await page.locator('[data-device="ipad-pro-2020"] .event-tick').last().click();
await page.waitForTimeout(500);
await page.screenshot({ path: "artifacts/desktop-detail.png", fullPage: true });
await page.locator('[data-device="ipad-pro-2020"] .device-label').click();
await page.getByRole("button", { name: "排行", exact: true }).click();
await page.waitForTimeout(600);
await page.screenshot({
  path: "artifacts/desktop-ranking.png",
  fullPage: true,
});
await page.getByRole("button", { name: "时间线", exact: true }).click();
await page.getByRole("button", { name: "打开菜单", exact: true }).click();
await page.getByRole("button", { name: "切换明亮主题" }).click();
await page.keyboard.press("Escape");
await page.waitForTimeout(400);
await page.screenshot({ path: "artifacts/desktop-light.png", fullPage: true });
await page.getByRole("button", { name: "统计", exact: true }).click();
await page.screenshot({
  path: "artifacts/desktop-statistics.png",
  fullPage: true,
});
const mobile = await browser.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 1,
  isMobile: true,
  hasTouch: true,
});
await mobile.goto(url);
await mobile.waitForTimeout(1000);
await mobile.screenshot({ path: "artifacts/mobile-dark.png", fullPage: true });
await mobile.locator('[data-device="ipad-pro-2020"] .device-label').click();
await mobile.waitForTimeout(500);
await mobile.screenshot({
  path: "artifacts/mobile-detail.png",
  fullPage: true,
});
console.log({
  mobileWidth: await mobile.locator("body").evaluate((e) => e.scrollWidth),
  viewport: 390,
});
for (const width of [320, 375, 768]) {
  await mobile.setViewportSize({ width, height: 844 });
  await mobile.waitForTimeout(80);
  assert.equal(await mobile.locator("body").evaluate(e => e.scrollWidth), width, `No document overflow at ${width}px`);
  console.log({
    width,
    bodyWidth: await mobile.locator("body").evaluate((e) => e.scrollWidth),
  });
}
await browser.close();
