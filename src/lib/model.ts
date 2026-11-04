import type { Device as OriginalDevice } from "../data/devices";
import { buildCostHistory, HISTORY_DAY } from "./cost-history";
export type Device = OriginalDevice & {
  usageEnd?: string;
  targetDaily?: number;
};
export const categories = [
  "电脑",
  "手机",
  "平板",
  "影音",
  "穿戴",
  "其他",
] as const;
export const DAY = HISTORY_DAY;
export const stamp = (date: string) => Date.parse(`${date}T00:00:00Z`);
export const iso = (time: number) => new Date(time).toISOString().slice(0, 10);
export function localDate() {
  const date = new Date();
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
}
export const money = (value: number) =>
  new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
export const costLabel = (value: number) =>
  value > 0 && value < 0.01 ? "< ¥0.01" : money(value);
export const dateLabel = (value: string) =>
  value ? value.replaceAll("-", ".") : "日期待补充";
export function usageEnd(device: Device, _devices: Device[], today: string) {
  if (device.usageEnd) return device.usageEnd;
  return device.status === "归档" && device.archivedDate
    ? device.archivedDate
    : today;
}
export function historyFor(device: Device, devices: Device[], today: string) {
  const history = buildCostHistory(
    { ...device, usageEnd: usageEnd(device, devices, today) },
    today,
  );
  if (!history) return null;
  const note = holdingNote(device, devices, today);
  return { ...history, note: [note, history.note].filter(Boolean).join(" · ") };
}
// All views use the same cutoff as the original cost engine.
export function holdingNote(device: Device, devices: Device[], today: string) {
  const end = usageEnd(device, devices, today);
  if (device.status === "归档" && !device.archivedDate) {
    return end >= today
      ? "归档日期未记录，暂计至今日"
      : `归档日期未记录，暂计至停用日 ${dateLabel(end)}`;
  }
  return "";
}
export type History = NonNullable<ReturnType<typeof historyFor>>;
export function daysHeld(device: Device, devices: Device[], today: string) {
  if (!device.purchaseDate || device.purchaseDate > today) return 0;
  return Math.max(
    1,
    Math.round(
      (Math.min(stamp(usageEnd(device, devices, today)), stamp(today)) -
        stamp(device.purchaseDate)) /
        DAY,
    ),
  );
}
export function isCurrent(device: Device, devices: Device[], today: string) {
  return (
    device.status === "持有" &&
    !!device.purchaseDate &&
    device.purchaseDate <= today &&
    usageEnd(device, devices, today) >= today
  );
}
export function productImage(device: Device) {
  if (
    device.photo &&
    /^(https?:\/\/|data:image\/(png|jpeg|webp|gif);base64,)/.test(device.photo)
  )
    return device.photo;
  const name = device.name.toLowerCase();
  const files: [string, string][] = [
    ["apple tv", "apple-tv-4k-2022-alpha-v3.png"],
    ["airpods pro 2", "airpods-pro-2-usbc-transparent.png"],
    ["airpods pro", "airpods-pro-1-alpha-v3.png"],
    ["homepod mini", "homepod-mini-white-alpha-v3.png"],
    ["watch", "apple-watch-s7-alpha-v3.png"],
    ["ipad pro", "ipad-pro-2020-alpha-v3.png"],
    ["macbook air", "macbook-air-m1-silver-alpha-v3.png"],
    ["iphone air", "iphone-air-space-black-alpha-v2.png"],
    ["iphone 14 pro", "iphone-14-pro-silver-alpha-v3.png"],
  ];
  const file = files.find(([key]) => name.includes(key));
  return file ? `${import.meta.env.BASE_URL}products/${file[1]}` : "";
}
export function emptyDevice(): Device {
  return {
    id: crypto.randomUUID(),
    name: "",
    status: "持有",
    category: "其他",
    purchasePrice: 0,
    purchaseDate: localDate(),
    channel: "",
    warrantyEnd: "",
    notes: "",
    tags: "",
    additional: 0,
    additionalDetail: "",
    archivedPrice: 0,
    archivedDate: "",
    archivedWay: "",
    archivedThought: "",
  };
}
export function validateDevice(d: Device): string | null {
  if (
    typeof d.id !== "string" ||
    !d.id ||
    typeof d.name !== "string" ||
    !d.name.trim()
  )
    return "请填写设备名称与有效 ID";
  if (!["持有", "归档"].includes(d.status) || !categories.includes(d.category))
    return "状态或分类无效";
  for (const key of [
    "channel",
    "notes",
    "tags",
    "additionalDetail",
    "archivedWay",
    "archivedThought",
  ] as const)
    if (typeof d[key] !== "string") return `${key} 必须是文本`;
  for (const key of ["purchasePrice", "additional", "archivedPrice"] as const)
    if (typeof d[key] !== "number" || !Number.isFinite(d[key]) || d[key] < 0)
      return "金额必须是大于或等于 0 的数字";
  for (const key of [
    "purchaseDate",
    "archivedDate",
    "warrantyEnd",
    "usageEnd",
  ] as const) {
    const value = d[key];
    if (key !== "usageEnd" && typeof value !== "string") return "日期格式无效";
    if (
      value &&
      (!/^\d{4}-\d{2}-\d{2}$/.test(value) ||
        !Number.isFinite(stamp(value)) ||
        iso(stamp(value)) !== value ||
        value < "1900-01-01" ||
        value > "2200-12-31")
    )
      return "请输入 1900–2200 年间的有效日期";
  }
  if (
    d.purchaseDate &&
    ((d.archivedDate && d.archivedDate < d.purchaseDate) ||
      (d.usageEnd && d.usageEnd < d.purchaseDate))
  )
    return "停用 / 回收日期不能早于购入日期";
  if (
    d.targetDaily !== undefined &&
    (!Number.isFinite(d.targetDaily) || d.targetDaily <= 0)
  )
    return "个人目标必须大于 0";
  if (
    d.photo &&
    !/^(https?:\/\/|data:image\/(png|jpeg|webp|gif);base64,)/.test(d.photo)
  )
    return "照片请填写 http(s) 图片链接";
  return null;
}
export function pointAt(history: History, time: number) {
  let low = 0,
    high = history.points.length - 1,
    found = -1;
  while (low <= high) {
    const mid = (low + high) >> 1;
    if (history.points[mid].date <= time) {
      found = mid;
      low = mid + 1;
    } else high = mid - 1;
  }
  return found < 0 ? null : history.points[found];
}
