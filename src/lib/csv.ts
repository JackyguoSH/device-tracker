import { categories, emptyDevice, validateDevice, type Device } from "./model";
const columns = [
  ["id", "ID"],
  ["name", "名称"],
  ["status", "状态"],
  ["category", "分类"],
  ["purchasePrice", "持有价格"],
  ["purchaseDate", "持有日期"],
  ["channel", "购买渠道"],
  ["warrantyEnd", "保修截止"],
  ["notes", "备注"],
  ["tags", "标签"],
  ["additional", "追加投入总额"],
  ["additionalDetail", "追加投入明细"],
  ["archivedPrice", "归档价格"],
  ["archivedDate", "归档日期"],
  ["archivedWay", "归档方式"],
  ["archivedThought", "归档感想"],
  ["usageEnd", "停用日期"],
  ["targetDaily", "个人日均目标"],
  ["photo", "照片"],
] as const;
const escape = (value: unknown) =>
  `"${String(value ?? "").replaceAll('"', '""')}"`;
export function toCsv(devices: Device[]) {
  return (
    "\uFEFF" +
    [
      columns.map(([, label]) => label).join(","),
      ...devices.map((d) => columns.map(([key]) => escape(d[key])).join(",")),
    ].join("\r\n")
  );
}
export function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [],
    cell = "",
    quoted = false;
  text = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"' && quoted && text[i + 1] === '"') {
      cell += '"';
      i++;
    } else if (c === '"') quoted = !quoted;
    else if (c === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((c === "\n" || c === "\r") && !quoted) {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  if (quoted) throw new Error("CSV 引号未闭合，请检查文件");
  row.push(cell);
  if (row.some(Boolean)) rows.push(row);
  return rows;
}
export function fromCsv(text: string): Device[] {
  const rows = parseCsv(text);
  const headers = rows.shift() || [];
  if (!headers.includes("名称") || !headers.includes("持有价格"))
    throw new Error("缺少“名称”或“持有价格”列，请使用导出的 CSV 模板");
  if (!rows.length) throw new Error("文件中没有设备记录");
  const ids = new Set<string>();
  return rows.map((row, index) => {
    if (row.length !== headers.length)
      throw new Error(`第 ${index + 2} 行列数不匹配`);
    const d = emptyDevice();
    d.purchaseDate = "";
    for (const [key, label] of columns) {
      const position = headers.indexOf(label);
      if (position < 0) continue;
      const value = row[position];
      if (key === "id" && !value) continue;
      if (key === "targetDaily") {
        if (value) d.targetDaily = Number(value);
        continue;
      }
      if (
        key === "additional" ||
        key === "archivedPrice" ||
        key === "purchasePrice"
      )
        d[key] = Number(value);
      else Object.assign(d, { [key]: value });
    }
    if (!headers.includes("分类")) {
      const name = d.name.toLowerCase();
      d.category = name.includes("mac")
        ? "电脑"
        : name.includes("iphone")
          ? "手机"
          : name.includes("ipad")
            ? "平板"
            : /airpods|watch/.test(name)
              ? "穿戴"
              : /homepod|tv/.test(name)
                ? "影音"
                : "其他";
    }
    if (!categories.includes(d.category))
      throw new Error(`第 ${index + 2} 行：分类无效`);
    const error = validateDevice(d);
    if (error) throw new Error(`第 ${index + 2} 行：${error}`);
    if (ids.has(d.id)) throw new Error(`第 ${index + 2} 行：ID 重复`);
    ids.add(d.id);
    return d;
  });
}
