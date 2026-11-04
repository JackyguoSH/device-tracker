import { useState, type FormEvent } from "react";
import {
  type Device,
  categories,
  emptyDevice,
  validateDevice,
} from "../lib/model";
import { Modal } from "./Shared";
export function DeviceEditor({
  device,
  isNew = !device,
  onClose,
  onSave,
}: {
  device?: Device;
  isNew?: boolean;
  onClose: () => void;
  onSave: (device: Device) => boolean;
}) {
  const [draft, setDraft] = useState<Device>(() =>
    device ? { ...device } : emptyDevice(),
  );
  const [error, setError] = useState("");
  function update(key: keyof Device, value: string | number | undefined) {
    setDraft((old) => ({ ...old, [key]: value }));
  }
  const field = (
    key: keyof Device,
    label: string,
    type = "text",
    wide = false,
  ) => (
    <label className={`field ${wide ? "full" : ""}`} key={key}>
      {label}
      <input
        type={type}
        value={draft[key] ?? ""}
        min={type === "number" ? 0 : undefined}
        step={type === "number" ? "any" : undefined}
        max={type === "date" ? "2200-12-31" : undefined}
        onChange={(e) =>
          update(
            key,
            type === "number"
              ? key === "targetDaily" && e.target.value === ""
                ? undefined
                : Number(e.target.value)
              : e.target.value,
          )
        }
        required={key === "name"}
        maxLength={type === "text" ? 2000 : undefined}
      />
    </label>
  );
  const textarea = (key: keyof Device, label: string) => (
    <label className="field full" key={key}>
      {label}
      <textarea
        rows={key === "additionalDetail" ? 4 : 2}
        value={draft[key] ?? ""}
        onChange={(e) => update(key, e.target.value)}
      />
    </label>
  );
  function submit(e: FormEvent) {
    e.preventDefault();
    const validation = validateDevice(draft);
    if (validation) {
      setError(validation);
      return;
    }
    if (!onSave(draft))
      setError(
        "保存失败：浏览器存储不可用或空间不足。修改仍在此处，请导出备份后重试。",
      );
  }
  return (
    <Modal
      title={isNew ? "新增设备" : "编辑设备档案"}
      onClose={onClose}
      wide
    >
      <form onSubmit={submit}>
        <p className="muted">记录真实的投入，其他信息可以慢慢补齐。</p>
        <div className="form-grid">
          {field("name", "设备名称 *", "text", true)}
          <label className="field">
            分类
            <select
              value={draft.category}
              onChange={(e) => update("category", e.target.value)}
            >
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="field">
            状态
            <select
              value={draft.status}
              onChange={(e) => update("status", e.target.value)}
            >
              <option>持有</option>
              <option>归档</option>
            </select>
          </label>
          {field("purchasePrice", "购入金额（¥，0 表示待补充）", "number")}
          {field("purchaseDate", "购入日期", "date")}
          {field("channel", "购买渠道")}
          {field("warrantyEnd", "保修截止", "date")}
          {field("tags", "标签 / 规格")}
          {field("targetDaily", "个人日均目标（¥ / 天）", "number")}
          {field("additional", "追加投入合计（¥）", "number")}
          {field("usageEnd", "停用日期（可选，停止累计天数）", "date")}
          {textarea("additionalDetail", "追加投入明细（保留原文）")}
          <p className="caption full">
            可按“项目: ¥金额
            (YYYY-MM-DD)”记录，以分号分隔。无日期的差额从购入日计入；明细超出合计时按比例折算。
          </p>
          {textarea("notes", "备注")}
          {field("photo", "照片链接（可选）", "url", true)}
          <h3 className="full form-section-title">归档与回收</h3>
          {field("archivedPrice", "回收金额（¥）", "number")}
          {field("archivedDate", "回收 / 归档日期", "date")}
          {field("archivedWay", "归档方式", "text", true)}
          {textarea("archivedThought", "归档感想")}
        </div>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <div className="dialog-actions">
          <button type="button" onClick={onClose}>
            取消
          </button>
          <button type="submit" className="primary">
            保存记录
          </button>
        </div>
      </form>
    </Modal>
  );
}
