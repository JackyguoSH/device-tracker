import {
  daysHeld,
  historyFor,
  isCurrent,
  money,
  stamp,
  type Device,
  type History,
} from "./model";

export const SNAPSHOT = "2026-11-03";
export type ScoreEvent = {
  key: string;
  date: number;
  amount: number;
  title: string;
  detail: string;
  kind: "purchase" | "expense" | "recovery";
};

// Presentation adapter only: amounts and allocation dates come from the original
// history engine. Purchase-day extras are absent from its daily sampled points,
// so ask the same engine for that day's closing balance.
export function scoreEvents(
  d: Device,
  devices: Device[],
  today: string,
  h: History | null,
): ScoreEvent[] {
  if (!h) return [];
  const events: ScoreEvent[] = [
    {
      key: "purchase",
      date: h.start,
      amount: d.purchasePrice,
      title: "购入",
      detail: d.channel || "购买渠道未记录",
      kind: "purchase",
    },
  ];
  const opening = historyFor(
    { ...d, archivedPrice: 0 },
    devices,
    d.purchaseDate,
  );
  const extra =
    (opening?.points.at(-1)?.total ?? d.purchasePrice) - d.purchasePrice;
  if (extra)
    events.push({
      key: "opening",
      date: h.start,
      amount: extra,
      title: "购入日追加投入",
      detail: "包含购入日明细或暂记购入日的投入。" + (h.note || ""),
      kind: "expense",
    });
  // Query the unchanged engine without recovery so an expense and a recovery
  // on the same day remain individually inspectable, even when they net to 0.
  const expenses =
    d.status === "归档" && d.archivedPrice
      ? (historyFor({ ...d, archivedPrice: 0 }, devices, today) ?? h)
      : h;
  for (const p of expenses.points) {
    if (!p.event || p.date <= h.start) continue;
    events.push({
      key: `event-${p.date}`,
      date: p.date,
      amount: p.change,
      title: "追加投入",
      detail: p.event,
      kind: "expense",
    });
  }
  const recovery = d.archivedDate ? stamp(d.archivedDate) : h.usageEnd;
  const recovered =
    (expenses.points.at(-1)?.total ?? 0) - (h.points.at(-1)?.total ?? 0);
  if (recovered) {
    events.push({
      key: "recovery",
      date: Math.max(h.start, recovery),
      amount: -recovered,
      title: "归档回收",
      detail: `归档回收 −${money(recovered)}。${d.archivedWay || "回收计入净支出，使用天数不增加"}`,
      kind: "recovery",
    });
  }
  return events.sort((a, b) => a.date - b.date);
}

export function summarize(
  devices: Device[],
  histories: Map<string, History | null>,
  today: string,
) {
  const active = devices.filter((d) => isCurrent(d, devices, today));
  return {
    active,
    archived: devices.filter((d) => d.status === "归档").length,
    daily: active.reduce(
      (sum, d) => sum + (histories.get(d.id)?.current ?? 0),
      0,
    ),
    total: active.reduce(
      (sum, d) => sum + (histories.get(d.id)?.points.at(-1)?.total ?? 0),
      0,
    ),
    incomplete: 0,
    longest: Math.max(0, ...active.map((d) => daysHeld(d, devices, today))),
  };
}
