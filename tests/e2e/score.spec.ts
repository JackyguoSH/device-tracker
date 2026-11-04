import { test, expect } from "@playwright/test";
import { toCsv } from "../../src/lib/csv";
import { initialDevices } from "../../src/data/devices";
const row = (id: string) => `[data-device="${id}"]`;

test("exact snapshot, transparent missing prices and real archive endpoints", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.locator(".main-number")).toHaveText("¥23.64/天");
  await expect(page.locator(".hero-investment>strong")).toHaveText(
    "¥43,274.00",
  );
  await expect(page.locator(".score-row")).toHaveCount(10);
  await expect(page.locator(".score-row.archived")).toHaveCount(2);
  await expect(
    page.locator(`${row("airpods-pro-2")} .device-label`),
  ).toContainText("价格待补充");
  await expect(
    page.locator(`${row("airpods-pro-2")} .device-cost`),
  ).toContainText("¥0.35");
  await expect(
    page.locator(`${row("homepod-mini-2024")} .device-cost`),
  ).toHaveText("—待补充");
  const archivedWidth = await page
    .locator(`${row("iphone-air-2025")} .track-bar`)
    .evaluate((el) => parseFloat((el as HTMLElement).style.width));
  expect(archivedWidth).toBeLessThan(2);
  await expect(
    page.locator(`${row("iphone-air-2025")} .event-tick.recovery`),
  ).toHaveAttribute("aria-label", /2026.01.23.*3,690/);
  expect(errors).toEqual([]);
});

test("event expands in place, reveals its date and detail, then collapses", async ({
  page,
}) => {
  await page.goto("/");
  const target = page.locator(row("ipad-pro-2020"));
  const following = page.locator(row("airpods-pro"));
  const before = (await following.boundingBox())!.y;
  await target.getByRole("button", { name: /2023.04.06.*追加投入/ }).click();
  await expect(target.locator(".detail-accordion")).toHaveClass(/expanded/);
  await expect(
    target.getByRole("region", { name: "选中事件明细" }),
  ).toContainText("Apple Pencil 笔尖 +¥179");
  await expect(target.locator(".time-explorer label")).toContainText(
    "2023.04.06",
  );
  await expect(
    target.getByRole("button", { name: "完整持有期", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  expect((await following.boundingBox())!.y).toBeGreaterThan(before + 300);
  await target.locator(".device-label").click();
  await expect(target.locator(".device-label")).toHaveAttribute(
    "aria-expanded",
    "false",
  );
  await expect
    .poll(
      async () =>
        (await target.locator(".detail-accordion").boundingBox())!.height,
    )
    .toBeLessThan(1);
  await page.locator(`${row("iphone-14-pro")} .device-label`).click();
  await expect(page.locator(`${row("iphone-14-pro")} .notice`)).toContainText(
    "2022–2025 续保日期按周年估算",
  );
});

test("ranking changes to sorted bars and annual costs; timeline restores sort and spans", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("时间线排序").selectOption("oldest");
  await expect(page.locator(".score-row").first()).toHaveAttribute(
    "data-device",
    "airpods-pro",
  );
  await page.getByRole("button", { name: "排行", exact: true }).click();
  await expect(page.locator(".score-row").first()).toHaveAttribute(
    "data-device",
    "iphone-14-pro",
  );
  await expect(page.locator(".score-row").last()).toHaveAttribute(
    "data-device",
    "homepod-mini-2024",
  );
  await page.getByRole("button", { name: "年均", exact: true }).click();
  await expect(page.locator(`${row("iphone-14-pro")} .device-cost`)).toHaveText(
    "¥3,178.09/年",
  );
  await page.getByRole("button", { name: "时间线", exact: true }).click();
  await expect(page.locator(".score-row").first()).toHaveAttribute(
    "data-device",
    "airpods-pro",
  );
  await expect(page.locator(`${row("iphone-14-pro")} .device-cost`)).toHaveText(
    "¥8.71/天",
  );
  await expect(page.locator(".event-tick.recovery")).toHaveCount(2);
});

test("create, edit, persist, delete and undo without losing original data", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "新增设备", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("设备名称 *", { exact: true }).fill("测试相机");
  await dialog.getByLabel("购入金额").fill("900");
  await dialog.getByLabel("购入日期", { exact: true }).fill("2026-10-04");
  await dialog.getByRole("button", { name: "保存记录" }).click();
  await expect(page.locator(".score-row")).toHaveCount(11);
  let target = page
    .locator(".score-row")
    .filter({ has: page.locator(".device-name", { hasText: "测试相机" }) });
  await expect(target.locator(".device-cost")).toHaveText("¥30.00/天");
  await target.getByRole("button", { name: "编辑档案", exact: true }).click();
  await dialog
    .getByLabel("设备名称 *", { exact: true })
    .fill("测试相机 · 改名");
  await dialog.getByRole("button", { name: "保存记录" }).click();
  await page.reload();
  target = page.locator(".score-row").filter({
    has: page.locator(".device-name", { hasText: "测试相机 · 改名" }),
  });
  await target.locator(".device-label").click();
  await expect(target.locator(".device-cost")).toHaveText("¥30.00/天");
  await target
    .getByRole("button", { name: "删除 测试相机 · 改名", exact: true })
    .click();
  await dialog.getByRole("button", { name: "删除记录", exact: true }).click();
  await expect(page.locator(".score-row")).toHaveCount(10);
  await page.getByRole("button", { name: "撤销", exact: true }).click();
  await expect(page.locator(".score-row")).toHaveCount(11);
});

test("CSV exports full data, previews merge/replace and rejects malformed files atomically", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "打开菜单", exact: true }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "导出 CSV", exact: true }).click();
  expect((await download).suggestedFilename()).toContain("2026-11-03.csv");
  const input = page.getByLabel("导入 CSV 文件");
  await input.setInputFiles({
    name: "bad.csv",
    mimeType: "text/csv",
    buffer: Buffer.from("名称,持有价格\n错误,NaN"),
  });
  await expect(page.getByRole("status")).toContainText("金额");
  await expect(page.locator(".score-row")).toHaveCount(10);
  const changed = {
    ...initialDevices[1],
    name: "CSV 修改设备",
    notes: '保留逗号, 引号 " 和\n换行',
  };
  await input.setInputFiles({
    name: "merge.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(toCsv([changed])),
  });
  await expect(page.getByRole("dialog")).toContainText("已校验 1 件设备");
  await page.getByRole("button", { name: "确认导入", exact: true }).click();
  await expect(page.locator(`${row(changed.id)} .device-name`)).toHaveText(
    changed.name,
  );
  await expect(page.locator(".score-row")).toHaveCount(10);
  await input.setInputFiles({
    name: "replace.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(toCsv([changed])),
  });
  await page.getByRole("button", { name: "替换全部", exact: true }).click();
  await page.getByRole("button", { name: "确认导入", exact: true }).click();
  await expect(page.locator(".score-row")).toHaveCount(1);
  await page.getByRole("button", { name: "撤销", exact: true }).click();
  await expect(page.locator(".score-row")).toHaveCount(10);
});

test("filters, portfolio statistics, future projection and target all work", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "筛选设备" }).click();
  await page.getByLabel("设备状态", { exact: true }).selectOption("归档");
  await expect(page.locator(".score-row")).toHaveCount(2);
  await expect(page.locator(".main-number")).toHaveText("¥23.64/天");
  await page.getByRole("button", { name: "清除筛选", exact: true }).click();
  const target = page.locator(row("apple-tv-4k"));
  await target.locator(".device-label").click();
  await target.getByLabel("预测未来一年").check();
  await expect(target.locator(".forecast-line")).not.toHaveAttribute("d", "");
  await target.getByRole("button", { name: "设置日均目标" }).click();
  await page.getByRole("dialog").getByLabel("个人日均目标").fill("0.5");
  await page.getByRole("button", { name: "保存记录", exact: true }).click();
  await expect(target.locator(".target-note")).toContainText("1,049 天");
  await page.getByRole("button", { name: "统计", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "当前组合 · 日均成本趋势" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "近 30 天", exact: true }).click();
  await expect(page.locator(".portfolio-stats")).toContainText(
    "近 30 天日均变化",
  );
  await expect(page.locator(".category-table tbody tr")).toHaveCount(5);
});

test("portrait tracks fit the screen below readable device headings and details", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const target = page.locator(row("ipad-pro-2020"));
  for (const width of [320, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    const label = (await target.locator(".device-label").boundingBox())!;
    const track = (await target.locator(".track-cell").boundingBox())!;
    expect(track.y).toBeGreaterThanOrEqual(label.y + label.height - 1);
    expect(track.width).toBeGreaterThan(width - 60);
    expect(await page.locator("body").evaluate((e) => e.scrollWidth)).toBe(width);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await target.locator(".device-label").click();
  await expect(target.locator(".device-detail")).toBeVisible();
  const detailBox = (await target.locator(".device-detail").boundingBox())!;
  expect(detailBox.x).toBeGreaterThanOrEqual(16);
  expect(detailBox.x + detailBox.width).toBeLessThanOrEqual(375);
  expect(await page.locator("body").evaluate((e) => e.scrollWidth)).toBe(390);
  await page.getByRole("button", { name: "打开菜单" }).click();
  await page
    .getByRole("navigation", { name: "手机导航" })
    .getByRole("button", { name: "统计", exact: true })
    .click();
  await expect(page.locator(".portfolio")).toBeVisible();
});

test("light theme persists and reduced motion disables track animations", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("button", { name: "打开菜单" }).click();
  await page.getByRole("button", { name: "切换明亮主题" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.keyboard.press("Escape");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  expect(
    await page
      .locator(".bar-reveal")
      .first()
      .evaluate((e) => getComputedStyle(e).animationName),
  ).toBe("none");
  await page.getByRole("button", { name: "打开菜单" }).click();
  await page.getByLabel("统计截止日").fill("2026-01-23");
  await page.keyboard.press("Escape");
  await expect(page.locator(".snapshot-label")).toHaveText("2026.01.23 截止");
});

test("a same-day expense and recovery each expose their own clickable record", async ({
  page,
}) => {
  const device = {
    ...initialDevices[0],
    name: "同日事件设备",
    purchasePrice: 1000,
    purchaseDate: "2026-01-01",
    additional: 200,
    additionalDetail: "维修: ¥200 (2026-01-11)",
    archivedPrice: 200,
    archivedDate: "2026-01-11",
  };
  await page.addInitScript(
    (d) => localStorage.setItem("wuji-score-devices-v1", JSON.stringify([d])),
    device,
  );
  await page.goto("/");
  await page.locator(".event-tick.expense").click();
  await expect(
    page.getByRole("region", { name: "选中事件明细" }),
  ).toContainText("维修 +¥200");
  await page.locator(".event-tick.recovery").click();
  await expect(
    page.getByRole("region", { name: "选中事件明细" }),
  ).toContainText("归档回收 −¥200.00");
  await expect(page.locator(".device-cost")).toHaveText("¥100.00/天");
});
