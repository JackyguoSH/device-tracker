import { expect, test } from "@playwright/test";
import { initialDevices } from "../../src/data/devices";

test("summary shows all curves, links labels, and keeps the range across modes", async ({ page }) => {
  await page.goto("/#stats");
  await expect(page).toHaveURL(/#overview$/);
  const navigation = page.getByRole("navigation", { name: "主导航" });
  await expect(navigation.getByRole("link")).toHaveText(["摘要", "设备"]);
  await expect(page.locator(".stats-values")).toContainText("¥2,082.77");
  await expect(page.locator(".analytics-grid > section").first()).toContainText("成本排行");
  await expect(page.locator(".series-list [data-series]:visible")).toHaveCount(13);
  const series = page.locator('[data-series="macbook-pro-proledxdr-14"]');
  await expect(series).toContainText("14 英寸 MacBook Pro（PROLED XDR 显示屏）");
  await expect(series).toContainText("¥2,029.90");
  await series.hover();
  await expect(series).toHaveAttribute("data-highlighted", "");
  await series.click();
  await expect(series).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "近 30 天", exact: true }).click();
  await page.getByRole("button", { name: "在用组合", exact: true }).click();
  await expect(page.getByRole("button", { name: "近 30 天", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".axis-unit")).toContainText("较期初变化");
});

test("mobile chart uses the available width and retains device names", async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/");
  const chart = page.locator(".comparison-canvas");
  await expect(chart).toBeVisible();
  expect((await chart.boundingBox())!.width).toBeGreaterThan(300);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(393);
  await expect(page.locator(".series-list")).toBeHidden();
  await page.getByLabel("高亮一台设备").selectOption("dji-pocket-3");
  await expect(page.locator(".compact-readout")).toContainText("Osmo Pocket 3");
  await page.getByRole("navigation", { name: "主导航" }).getByRole("link", { name: "设备" }).click();
  await page.getByLabel("设备品牌").selectOption("dji");
  await expect(page.locator("#results .device-name")).toHaveText(["Osmo Pocket 3", "DJI Mini 5 Pro"]);
});

for (const legacyKey of ["wuji-score-devices-v1", "wuji-devices-v1"]) {
  test(`migrates ${legacyKey} without overwriting the original archive`, async ({ page }) => {
    const before = initialDevices.map((device) =>
      device.id === "macbook-air" ? { ...device, notes: "我的旧记录" } : device,
    );
    const original = JSON.stringify(before);
    await page.addInitScript(({ key, value }) => {
      if (localStorage.getItem(key) === null) localStorage.setItem(key, value);
      localStorage.setItem("kept-theme-v1", "light");
    }, { key: legacyKey, value: original });
    await page.goto("/#devices");
    await expect(page.locator("#result-text")).toHaveText("13 件设备");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await page.locator('#results [data-device="macbook-air"]').click();
    const detail = page.locator("#detail");
    await expect(detail).toContainText("MacBook Air（M1，2020 年）");
    await expect(detail).toContainText("我的旧记录");
    await expect(detail).toContainText("2,770.00");
    expect(await page.evaluate((key) => localStorage.getItem(key), legacyKey)).toBe(original);
    await page.reload();
    await expect(page.locator("#result-text")).toHaveText("13 件设备");
  });
}
