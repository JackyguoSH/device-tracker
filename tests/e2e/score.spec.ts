import { expect, test } from "@playwright/test";
import { initialDevices } from "../../src/data/devices";

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-20T10:00:00+08:00"));
});

test("summary shows all curves, links labels, and keeps the range across modes", async ({ page }) => {
  await page.goto("/#stats");
  await expect(page).toHaveURL(/#overview$/);
  const navigation = page.getByRole("navigation", { name: "主导航" });
  await expect(navigation.getByRole("link")).toHaveText(["摘要", "设备"]);
  await expect(page.locator(".stats-values")).toContainText("¥1,743.99");
  await expect(page.locator(".analytics-grid > section").first()).toContainText("成本排行");
  await expect(page.locator(".series-list [data-series]:visible")).toHaveCount(13);
  const series = page.locator('[data-series="macbook-pro-proledxdr-14"]');
  await expect(series).toContainText("MacBook Pro（PROLED XDR）");
  await expect(series).toContainText("¥1,691.58");
  await series.hover();
  await expect(series).toHaveAttribute("data-highlighted", "");
  await series.click();
  await expect(series).toHaveAttribute("aria-pressed", "true");
  const chart = page.locator(".comparison-canvas");
  await chart.scrollIntoViewIfNeeded();
  const plot = (await chart.boundingBox())!;
  const rail = (await page.locator(".series-list").boundingBox())!;
  await page.mouse.move(plot.x + plot.width - rail.width - 28, plot.y + 75);
  await expect(page.locator(".chart-context output")).toHaveText(/^2026\./);
  await expect(page.locator(".series-list")).toBeVisible();
  await expect(page.locator(".compact-crossings")).toBeHidden();
  expect((await page.locator(".series-list").boundingBox())!.x).toBe(rail.x);
  await page.getByRole("button", { name: "近 30 天", exact: true }).click();
  await page.getByRole("button", { name: "在用组合", exact: true }).click();
  await expect(page.getByRole("button", { name: "近 30 天", exact: true })).toHaveAttribute("aria-pressed", "true");
  const marker = page.getByRole("button", { name: /2026.11.09 购入 MacBook Pro/ });
  await marker.click();
  await expect(page.locator(".chart-context output")).toContainText("¥20,299.00");
  await expect(page.getByRole("group", { name: "纵轴显示" })).toHaveCount(0);
});

test("mobile chart uses the available width and retains device names", async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/");
  const chart = page.locator(".comparison-canvas");
  await expect(chart).toBeVisible();
  expect((await chart.boundingBox())!.width).toBeGreaterThan(300);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(393);
  await expect(page.locator(".series-list")).toBeHidden();
  await expect(page.getByLabel("高亮一台设备")).toHaveCount(0);
  await expect(page.locator(".axis-unit")).toBeHidden();
  await expect(page.locator(".compact-date")).toHaveText("");
  const initialHeight = (await page.locator(".stats-top").boundingBox())!.height;
  await chart.focus();
  await chart.press("End");
  await expect(page.locator(".compact-date")).toHaveText("2026.11.20");
  await expect(page.locator('.crossing-row[data-crossing="dji-pocket-3"]')).toContainText("Osmo Pocket 3");
  expect((await page.locator(".stats-top").boundingBox())!.height).toBe(initialHeight);
  await page.getByRole("navigation", { name: "主导航" }).getByRole("link", { name: "设备" }).click();
  await expect(page.getByRole("group", { name: "品牌" })).toBeHidden();
  await page.locator(".filter-toggle").click();
  const filterMenu = page.getByRole("form", { name: "设备筛选和排序" });
  await expect(filterMenu.getByRole("group")).toHaveCount(4);
  await filterMenu.getByRole("radio", { name: "DJI", exact: true }).check();
  await filterMenu.getByRole("button", { name: "完成" }).click();
  await expect(filterMenu).toBeHidden();
  await expect(page.locator("#results .device-name")).toHaveText(["Osmo Pocket 3", "DJI Mini 5 Pro"]);
  await expect(page.locator("#results .device-meta").first()).toHaveText("DJI · 持有");
  await page.getByLabel("搜索设备").fill("无人机");
  await expect(page.locator("#results .device-name")).toHaveText(["DJI Mini 5 Pro"]);
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
