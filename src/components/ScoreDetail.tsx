import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Info,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  costLabel,
  dateLabel,
  daysHeld,
  historyFor,
  isCurrent,
  iso,
  money,
  pointAt,
  stamp,
  DAY,
  type Device,
  type History,
} from "../lib/model";
import type { ScoreEvent } from "../lib/score";
import { LineChart } from "./LineChart";
import { CostHelp, Photo, Segmented } from "./Shared";

export function ScoreDetail({
  device: d,
  devices,
  history: h,
  today,
  events,
  selectedEvent,
  onSelectEvent,
  onEdit,
  onDelete,
}: {
  device: Device;
  devices: Device[];
  history: History | null;
  today: string;
  events: ScoreEvent[];
  selectedEvent: string | null;
  onSelectEvent: (key: string) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [range, setRange] = useState("year");
  const [forecastOn, setForecastOn] = useState(false);
  const active = isCurrent(d, devices, today),
    days = daysHeld(d, devices, today);
  const end = h?.end ?? stamp(today),
    total = h?.points.at(-1)?.total ?? 0;
  const first = h
    ? range === "year"
      ? Math.max(h.start, end - 364 * DAY)
      : h.start
    : end;
  const points = useMemo(
    () =>
      h?.points
        .filter((p) => p.date >= first)
        .map((p) => ({ date: p.date, value: p.daily, event: p.event })) ?? [],
    [h, first],
  );
  const forecast = useMemo(
    () =>
      active && forecastOn && h
        ? Array.from({ length: 366 }, (_, i) => ({
            date: stamp(today) + i * DAY,
            value: total / (days + i),
          }))
        : [],
    [active, forecastOn, h, today, total, days],
  );
  const selected = events.find((e) => e.key === selectedEvent) ?? events.at(-1);
  useEffect(() => {
    const event = events.find((e) => e.key === selectedEvent);
    if (!event) return;
    if (event.date < end - 364 * DAY) setRange("all");

  }, [selectedEvent, events, end]);
  const recovery = useMemo(
    () =>
      d.status === "归档"
        ? (historyFor({ ...d, archivedPrice: 0 }, devices, today)?.points.at(-1)
            ?.total ?? total) - total
        : 0,
    [d, devices, today, total],
  );
  const targetDays = d.targetDaily
    ? Math.max(0, Math.ceil(total / d.targetDaily) - days)
    : undefined;
  const old = h ? pointAt(h, stamp(today) - 365 * DAY) : null;
  const difference =
    old && h && old.daily > 0
      ? ((old.daily - h.current) / old.daily) * 100
      : undefined;
  return (
    <section className="device-detail glass" aria-label={`${d.name} 成本详情`}>
      <div className="detail-heading">
        <div className="detail-identity">
          <Photo device={d} large />
          <div>
            <p className="detail-status">{active ? "正在使用" : d.status === "归档" ? "已归档" : "已停用"}</p>
            <p className="detail-date">{dateLabel(d.purchaseDate)} — {active ? "至今" : dateLabel(iso(end))}</p>
          </div>
        </div>
        <div className="detail-actions">
          <button onClick={onEdit}>
            <Pencil size={14} />
            编辑档案
          </button>
          <button
            className="icon-button danger"
            aria-label={`删除 ${d.name}`}
            onClick={onDelete}
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
      <dl className="detail-facts">
        <div>
          <dt>购入金额</dt>
          <dd>
            {money(d.purchasePrice)}
          </dd>
        </div>
        <div>
          <dt>追加投入</dt>
          <dd>{money(d.additional)}</dd>
        </div>
        <div>
          <dt>{d.status === "归档" ? "已发生回收" : "累计投入"}</dt>
          <dd>{d.status === "归档" ? money(recovery) : money(total)}</dd>
        </div>
        <div>
          <dt>持有天数</dt>
          <dd>
            {days.toLocaleString()}
            <small> 天</small>
          </dd>
        </div>
        <div>
          <dt>日均 / 年均摊销 <CostHelp /></dt>
          <dd>
            {h && !h.empty ? (
              <>
                {costLabel(h.current)}
                <small> / {costLabel(h.current * 365)}</small>
              </>
            ) : (
              "待补充"
            )}
          </dd>
        </div>
      </dl>
      {h?.note && (
        <p className="notice">
          <Info size={15} />
          <span>{h.note}</span>
        </p>
      )}
      <div className="detail-body">
        <div className="detail-chart">
          <div className="section-top">
            <h3>
              日均成本曲线 <CostHelp /> <small>¥ / 天</small>
            </h3>
            <Segmented
              label={`${d.name} 曲线范围`}
              value={range}
              onChange={(value) => {
                setRange(value);
              }}
              options={[
                { value: "year", label: "近一年" },
                { value: "all", label: "完整持有期" },
              ]}
            />
          </div>
          {h && !h.empty ? (
            <>
              <LineChart
                points={points}
                forecast={forecast}
                today={stamp(today)}
                target={d.targetDaily}
                selectedDate={selectedEvent ? events.find((e) => e.key === selectedEvent)?.date : undefined}
                label={`${d.name} 日均成本曲线，当前 ${costLabel(h.current)}。${h.note}`}
              />
              <div className="chart-caption">
                <span>
                  <i className="line-key" />
                  已发生支出
                </span>
                {active && (
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={forecastOn}
                      onChange={(e) => {
                        setForecastOn(e.target.checked);
                      }}
                    />
                    预测未来一年
                  </label>
                )}
                {forecastOn && active && (
                  <span>
                    <i className="line-key dashed" />
                    一年后 {costLabel(total / (days + 365))}/天
                  </span>
                )}
              </div>
              {difference !== undefined && (
                <p className="caption comparison">
                  {difference >= 0 ? (
                    <ArrowDownRight size={14} />
                  ) : (
                    <ArrowUpRight size={14} />
                  )}
                  较一年前{difference >= 0 ? "降低" : "增加"}{" "}
                  {Math.abs(difference).toFixed(1)}%
                </p>
              )}
            </>
          ) : (
            <div className="chart-empty-state">
              <span className="empty-curve" aria-hidden="true">
                ﹏
              </span>
              <h3>
                {h?.empty
                  ? "价格待补充"
                  : d.purchaseDate > today
                    ? "尚未到购入日"
                    : "购入日期待补充"}
              </h3>
              <p>
                {h?.empty
                  ? "已有持有记录，补充价格后即可看见成本曲线。"
                  : "在统计范围内有有效购入日期时，才计算成本。"}
              </p>
              <button onClick={onEdit}>
                补充档案 <ArrowUpRight size={14} />
              </button>
            </div>
          )}

        </div>
        <aside className="detail-events" aria-label={`${d.name} 支出记录`}>
          <div className="section-top">
            <h3>支出记录</h3>
            <span className="caption">{events.length} 条记录</span>
          </div>
          <div className="event-buttons">
            {events.map((e) => (
              <button
                className={`event-record ${e.kind} ${selected?.key === e.key ? "selected" : ""}`}
                key={e.key}
                aria-pressed={selected?.key === e.key}
                onClick={() => onSelectEvent(e.key)}
              >
                <i />
                <span>
                  <strong>{e.title}</strong>
                  <time>{dateLabel(iso(e.date))}</time>
                </span>
                <b>
                  {`${e.amount < 0 ? "−" : "+"}${money(Math.abs(e.amount))}`}
                </b>
              </button>
            ))}
          </div>
          {selected && (
            <div
              className="event-explanation"
              role="region"
              aria-label="选中事件明细"
            >
              <div>
                <span>{dateLabel(iso(selected.date))}</span>
                <b>{selected.title}</b>
              </div>
              <p>{selected.detail}</p>
              {selected.kind !== "purchase" && d.additionalDetail && (
                <details>
                  <summary>原始追加明细</summary>
                  <p className="raw-detail">{d.additionalDetail}</p>
                </details>
              )}
              {selected.kind === "recovery" && (
                <p>
                  回收抵扣累计投入；停用后的天数不计入分母。
                  {d.archivedWay && `归档方式：${d.archivedWay}。`}
                </p>
              )}
            </div>
          )}
          <div className="target-note">
            <span className="eyebrow">个人目标</span>
            {d.targetDaily ? (
              <>
                <strong>
                  {money(d.targetDaily)}
                  <small>/天</small>
                </strong>
                <p>
                  {!h || h.empty
                    ? "补充价格和日期后计算。"
                    : !active
                      ? "持有已结束，天数不再累计。"
                      : !targetDays
                        ? "已达到设定的目标。"
                        : `固定已知净投入下，还需约 ${targetDays.toLocaleString()} 天。`}
                </p>
              </>
            ) : (
              null
            )}
            <button className="text-button" onClick={onEdit}>
              {d.targetDaily ? "修改目标" : "设置日均目标"}
              <ArrowUpRight size={13} />
            </button>
          </div>
        </aside>
      </div>
      <details className="archive-details">
        <summary>
          完整档案
        </summary>
        <dl>
          {[
            ["分类", d.category],
            ["购买渠道", d.channel],
            ["标签 / 规格", d.tags],
            ["保修截止", d.warrantyEnd],
            ["备注", d.notes],
            ["追加投入原文", d.additionalDetail],
            ["停用日期", d.usageEnd],
            ["归档日期", d.archivedDate],
            ["归档金额", money(d.archivedPrice)],
            ["归档方式", d.archivedWay],
            ["归档感想", d.archivedThought],
            ["照片链接", d.photo],
          ].map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value || "未记录"}</dd>
            </div>
          ))}
        </dl>
      </details>
    </section>
  );
}
