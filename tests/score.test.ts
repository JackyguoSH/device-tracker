import { test } from "node:test";
import assert from "node:assert/strict";
import { initialDevices } from "../src/data/devices";
import { historyFor, daysHeld, stamp } from "../src/lib/model";
import { scoreEvents, summarize, SNAPSHOT } from "../src/lib/score";

test("2026-11-03 snapshot matches every supplied daily value, days, and totals", () => {
  const days = [35, 1451, 1008, 1005, 1702, 2401, 1835, 2153, 1956, 1509];
  const daily = [
    "3.00",
    "0.86",
    "0.35",
    "0.00",
    "2.73",
    "5.19",
    "0.77",
    "0.35",
    "5.45",
    "8.71",
  ];
  const histories = new Map(
    initialDevices.map((d) => [d.id, historyFor(d, initialDevices, SNAPSHOT)]),
  );
  initialDevices.forEach((d, i) => {
    assert.equal(daysHeld(d, initialDevices, SNAPSHOT), days[i]);
    assert.equal(histories.get(d.id)!.current.toFixed(2), daily[i]);
  });
  const s = summarize(initialDevices, histories, SNAPSHOT);
  assert.equal(s.total, 43274);
  assert.equal(s.daily.toFixed(2), "23.64");
  assert.equal(s.active.length, 8);
  assert.equal(s.archived, 2);
  assert.equal(s.incomplete, 2);
});
test("track events retain opening additions, estimated renewals, dates and recoveries from the engine", () => {
  for (const d of initialDevices) {
    const h = historyFor(d, initialDevices, SNAPSHOT)!;
    const events = scoreEvents(d, initialDevices, SNAPSHOT, h);
    assert.equal(
      events.reduce((sum, e) => sum + e.amount, 0),
      h.points.at(-1)!.total,
      d.name,
    );
    const renamed = { ...d, name: "任意设备", id: "arbitrary" };
    assert.deepEqual(
      scoreEvents(renamed, [], SNAPSHOT, historyFor(renamed, [], SNAPSHOT)),
      events,
    );
  }
  const ipad = initialDevices[5];
  const events = scoreEvents(
    ipad,
    initialDevices,
    SNAPSHOT,
    historyFor(ipad, initialDevices, SNAPSHOT),
  );
  assert.equal(events.find((e) => e.key === "opening")!.amount, 1910);
  assert.equal(
    events.find((e) => e.amount === 2399)!.date,
    stamp("2020-05-14"),
  );
  const air = initialDevices[0];
  const recovery = scoreEvents(
    air,
    [],
    SNAPSHOT,
    historyFor(air, [], SNAPSHOT),
  ).find((e) => e.kind === "recovery")!;
  assert.equal(recovery.amount, -3690);
  assert.equal(recovery.date, stamp("2026-01-23"));
});

test("same-day expense and recovery remain separate events even with zero net change", () => {
  const d = {
    ...initialDevices[0],
    name: "任意设备",
    purchasePrice: 1000,
    purchaseDate: "2026-01-01",
    additional: 200,
    additionalDetail: "维修: ¥200 (2026-01-11)",
    archivedPrice: 200,
    archivedDate: "2026-01-11",
  };
  const h = historyFor(d, [], SNAPSHOT)!;
  const events = scoreEvents(d, [], SNAPSHOT, h);
  assert.deepEqual(
    events
      .filter((e) => e.date === stamp("2026-01-11"))
      .map((e) => [e.kind, e.amount]),
    [
      ["expense", 200],
      ["recovery", -200],
    ],
  );
  assert.equal(
    events.reduce((sum, e) => sum + e.amount, 0),
    h.points.at(-1)!.total,
  );
});
