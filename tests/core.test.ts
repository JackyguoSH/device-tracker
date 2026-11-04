import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { initialDevices } from "../src/data/devices";
import { buildCostHistory, type HistoryDevice } from "../src/lib/cost-history";
import {
  daysHeld,
  historyFor,
  holdingNote,
  isCurrent,
  stamp,
  usageEnd,
  validateDevice,
  type Device,
} from "../src/lib/model";
import { fromCsv, toCsv } from "../src/lib/csv";
const today = "2026-11-03";
const base: HistoryDevice = {
  id: "test",
  name: "测试设备",
  purchasePrice: 1000,
  purchaseDate: "2026-01-01",
  additional: 0,
  additionalDetail: "",
  status: "持有",
  archivedPrice: 0,
  archivedDate: "",
  usageEnd: "2026-01-11",
};
test("ten devices match the original objects, including every detail character", () => {
  const original = JSON.parse(
    readFileSync(
      new URL("./fixtures/original-devices.json", import.meta.url),
      "utf8",
    ),
  );
  assert.equal(initialDevices.length, 10);
  assert.deepEqual(initialDevices, original);
});
test("costs and usage dates do not depend on device names, IDs, or other devices", () => {
  for (const device of initialDevices) {
    for (const archivedDate of [device.archivedDate, ""]) {
      const source = { ...device, archivedDate };
      const expected = historyFor(source, initialDevices, today);
      for (const name of ["普通设备", "iPhone 14 Pro", "AirPods Pro", "AirPods Pro 2", "HomePod", "MacBook", "iPad", "Watch"]) {
        const renamed = { ...source, id: "unrelated-id", name };
        assert.deepEqual(historyFor(renamed, [], today), expected, `${device.name} → ${name}`);
        assert.equal(daysHeld(renamed, [], today), daysHeld(source, initialDevices, today));
        assert.equal(usageEnd(renamed, [], today), usageEnd(source, initialDevices, today));
      }
    }
  }
});
test("purchase day is one; later days use original date difference, not inclusive count", () => {
  assert.equal(buildCostHistory(base, "2026-01-01")!.current, 1000);
  assert.equal(buildCostHistory(base, "2026-01-02")!.current, 1000);
  assert.equal(buildCostHistory(base, "2026-01-11")!.current, 100);
});
test("dated expenses create before and after event points on the true day", () => {
  const h = buildCostHistory(
    {
      ...base,
      additional: 200,
      additionalDetail: "维修: ¥200.00 (2026-01-06)",
    },
    "2026-01-11",
  )!;
  const event = h.points.filter((p) => p.date === stamp("2026-01-06"));
  assert.deepEqual(
    event.map((p) => p.daily),
    [200, 240],
  );
  assert.equal(event[1].change, 200);
  assert.equal(h.current, 120);
});
test("unallocated extras use purchase day and explain the estimate", () => {
  const h = buildCostHistory(
    {
      ...base,
      additional: 300,
      additionalDetail: "维修: ¥200.00 (2026-01-06)",
    },
    "2026-01-11",
  )!;
  assert.equal(h.points[0].total, 1100);
  assert.match(h.note, /追加投入暂从购入日/);
  assert.equal(h.current, 130);
});
test("excess detail amounts are proportionally scaled to the recorded total", () => {
  const h = buildCostHistory(
    {
      ...base,
      additional: 100,
      additionalDetail: "维修: ¥200 (2026-01-06); 配件: ¥200 (2026-01-07)",
    },
    "2026-01-11",
  )!;
  assert.deepEqual(
    h.points.filter((p) => p.change).map((p) => p.change),
    [50, 50],
  );
  assert.match(h.note, /折算/);
  assert.equal(h.current, 110);
});
test("iPhone renewals retain four anniversary estimates and the exact 2026 payment", () => {
  const d = initialDevices.find((d) => d.id === "iphone-14-pro")!;
  const h = historyFor(d, initialDevices, today)!;
  assert.equal(h.points.at(-1)!.total, 8899 + 4240);
  assert.match(h.note, /2022–2025/);
  assert.deepEqual(
    h.points.filter((p) => p.change).map((p) => [p.date, p.change]),
    ["2023-09-17", "2024-09-17", "2025-09-17", "2026-09-17"].map((date) => [
      stamp(date),
      848,
    ]),
  );
});
test("archived AirPods use the recorded archive date for days, curve and recovery", () => {
  const d = initialDevices.find((d) => d.id === "airpods-pro")!;
  const h = historyFor(d, initialDevices, today)!;
  assert.equal(usageEnd(d, initialDevices, today), "2025-02-08");
  assert.equal(daysHeld(d, initialDevices, today), 1835);
  assert.equal(h.current, (1999 - 590) / 1835);
  assert.equal(h.current.toFixed(2), "0.77");
  assert.equal(h.usageEnd, stamp("2025-02-08"));
  assert.equal(h.end, h.usageEnd);
  assert.equal(h.points.at(-1)!.days, 1835);
  assert.equal(h.points.at(-1)!.date, stamp("2025-02-08"));
  assert.equal(h.note, "");
  assert.deepEqual(h.points.filter((p) => p.date === h.end).map((p) => [p.total, p.change]), [[1999, 0], [1409, -590]]);
});
test("explicit usage end wins over archive date; later recovery changes only net cost", () => {
  const d = { ...initialDevices.find((d) => d.id === "airpods-pro")!, usageEnd: "2024-01-31" };
  const h = historyFor(d, initialDevices, today)!;
  assert.equal(usageEnd(d, initialDevices, today), d.usageEnd);
  assert.equal(daysHeld(d, initialDevices, today), 1461);
  assert.equal(h.usageEnd, stamp(d.usageEnd));
  assert.equal(h.end, stamp(d.archivedDate));
  assert.equal(h.current, 1409 / 1461);
  assert.equal(h.points.at(-1)!.days, 1461);
  assert.match(h.note, /之后回收不增加使用天数/);
});
test("usage dates use today for active devices and clamp future or pre-purchase cutoffs", () => {
  const d = { ...initialDevices[0], status: "持有" as const };
  assert.equal(usageEnd(d, [], today), today);
  assert.equal(historyFor(d, [], today)!.usageEnd, stamp(today));
  for (const usageEnd of ["2027-01-01", "2020-01-01"]) {
    const changed = { ...d, usageEnd };
    const h = historyFor(changed, [], today)!;
    assert.equal(h.usageEnd, stamp(usageEnd > today ? today : d.purchaseDate));
    assert.equal(h.points.at(-1)!.days, daysHeld(changed, [], today));
  }
});
test("archived days and history share the sale, retirement, or explicit today fallback", () => {
  const air = initialDevices.find((d) => d.id === "iphone-air-2025")!;
  assert.equal(daysHeld(air, initialDevices, today), 35);
  assert.equal(historyFor(air, initialDevices, today)!.points.at(-1)!.days, 35);
  const pods = { ...initialDevices.find((d) => d.id === "airpods-pro")!, archivedDate: "" };
  assert.equal(daysHeld(pods, initialDevices, today), 2468);
  assert.equal(historyFor(pods, initialDevices, today)!.points.at(-1)!.days, 2468);
  assert.equal(holdingNote(pods, initialDevices, today), "归档日期未记录，暂计至今日");
  const missing = { ...air, archivedDate: "" };
  assert.equal(daysHeld(missing, initialDevices, today), 319);
  const h = historyFor(missing, initialDevices, today)!;
  assert.equal(h.points.at(-1)!.days, 319);
  assert.equal(h.end, stamp(today));
  assert.equal(h.current, 105 / 319);
  assert.equal(holdingNote(missing, initialDevices, today), "归档日期未记录，暂计至今日");
  assert.match(h.note, /归档日期未记录，暂计至今日/);
  const stopped = { ...missing, usageEnd: "2026-01-23" };
  assert.equal(daysHeld(stopped, initialDevices, today), 35);
  assert.equal(historyFor(stopped, initialDevices, today)!.points.at(-1)!.days, 35);
  assert.equal(holdingNote(stopped, initialDevices, today), "归档日期未记录，暂计至停用日 2026.01.23");
  // Date completeness must remain visible even with no recorded recovery amount.
  assert.match(holdingNote({ ...missing, archivedPrice: 0 }, initialDevices, today), /暂计至今日/);
});
test("missing recovery dates fall back to usage end; future recoveries are not deducted", () => {
  const h = buildCostHistory(
    { ...base, status: "归档", archivedPrice: 100 },
    "2026-02-01",
  )!;
  assert.equal(h.current, 90);
  assert.match(h.note, /回收日期待补充/);
  assert.equal(
    buildCostHistory(
      {
        ...base,
        status: "归档",
        archivedPrice: 100,
        archivedDate: "2027-01-01",
      },
      "2026-02-01",
    )!.current,
    100,
  );
});
test("zero purchase price is valid zero spend; invalid purchase dates do not calculate", () => {
  const h = buildCostHistory({ ...base, purchasePrice: 0 }, "2026-01-11")!;
  assert.equal(h.empty, false);
  assert.equal(h.current, 0);
  assert.ok(h.points.every((p) => p.daily === 0));
  assert.equal(h.missingPrice, false);
  assert.doesNotMatch(h.note, /购入价待补充/);
  assert.equal(buildCostHistory({ ...base, purchaseDate: "" }, today), null);
  assert.equal(
    buildCostHistory({ ...base, purchaseDate: "2027-01-01" }, today),
    null,
  );
  const future = { ...initialDevices[1], purchaseDate: "2027-01-01" };
  assert.equal(isCurrent(future, [future], today), false);
});
test("current total is sum of current per-device costs; missing price extras are included", () => {
  const active = initialDevices.filter((d) =>
    isCurrent(d, initialDevices, today),
  );
  assert.equal(active.length, 8);
  const airpods = initialDevices.find((d) => d.id === "airpods-pro-2")!;
  const h = historyFor(airpods, initialDevices, today)!;
  assert.equal(h.points.at(-1)!.total, 348);
  assert.equal(h.missingPrice, false);
  const sum = active.reduce(
    (sum, d) => sum + historyFor(d, initialDevices, today)!.current,
    0,
  );
  const expected = [
    [1250, "2022-11-13"],
    [348, "2024-01-30"],
    [4647, "2022-03-07"],
    [12473, "2020-04-07"],
    [749, "2020-12-11"],
    [10668, "2021-06-26"],
    [13139, "2022-09-16"],
  ].reduce(
    (n, [price, date]) =>
      n +
      Number(price) /
        ((Date.parse(today) - Date.parse(String(date))) / 86400000),
    0,
  );
  assert.ok(Math.abs(sum - expected) < 1e-10);
});
test("CSV roundtrip retains original fields and punctuation, quotes, commas and newlines", () => {
  const fixture: Device = {
    ...initialDevices[0],
    notes: '第一行, "quoted"\r\n第二行',
    additionalDetail: "维修: ¥100.00 (2026-01-01);\n明细，逐字保留",
    usageEnd: "2026-01-20",
    targetDaily: 8,
  };
  const back = fromCsv(toCsv([fixture]))[0];
  for (const key of Object.keys(fixture) as (keyof Device)[])
    assert.equal(back[key], fixture[key], key);
  const all = fromCsv(toCsv(initialDevices));
  assert.equal(all.length, 10);
  all.forEach((d, i) => {
    for (const key of Object.keys(initialDevices[i]) as (keyof Device)[])
      assert.equal(d[key], (initialDevices[i] as Device)[key], `${i}/${key}`);
  });
});
test("old CSV without IDs/categories is accepted and infers categories", () => {
  const devices = fromCsv(
    '名称,状态,持有价格,持有日期,追加投入明细\r\niPhone Test,持有,100,2026-01-01,"AppleCare+: ¥100; 原文"',
  );
  assert.equal(devices[0].category, "手机");
  assert.equal(devices[0].additionalDetail, "AppleCare+: ¥100; 原文");
});
test("malformed imports fail atomically instead of converting invalid costs to zero", () => {
  assert.throws(() => fromCsv("名称,持有价格\n测试,not-a-number"), /金额/);
  assert.throws(() => fromCsv('名称,持有价格\n"测试,100'), /引号/);
  assert.throws(
    () => fromCsv("名称,持有价格,持有日期\n测试,100,2026-02-30"),
    /有效日期/,
  );
  assert.throws(
    () => fromCsv("ID,名称,持有价格\na,测试,1\na,测试2,2"),
    /ID 重复/,
  );
  assert.throws(() => fromCsv("hello,world\n1,2"), /缺少/);
});
test("archive before purchase and invalid personal targets are rejected", () => {
  assert.match(
    validateDevice({ ...initialDevices[0], archivedDate: "2020-01-01" })!,
    /不能早于/,
  );
  assert.match(
    validateDevice({ ...initialDevices[0], targetDaily: 0 })!,
    /目标/,
  );
});
