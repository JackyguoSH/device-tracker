import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  ChevronDown,
  Headphones,
  Laptop,
  Monitor,
  Smartphone,
  Tablet,
  Watch,
  Box,
} from "lucide-react";
import {
  costLabel,
  dateLabel,
  daysHeld,
  stamp,
  type Device,
  type History,
} from "../lib/model";
import { scoreEvents, type ScoreEvent } from "../lib/score";
import { ScoreDetail } from "./ScoreDetail";

type Props = {
  devices: Device[];
  histories: Map<string, History | null>;
  today: string;
  mode: "timeline" | "ranking";
  period: "day" | "year";
  sort: string;
  query: string;
  status: string;
  category: string;
  expanded: string | null;
  onExpand: (id: string | null) => void;
  onEdit: (d: Device) => void;
  onDelete: (d: Device) => void;
};
export function Score(props: Props) {
  const {
    devices,
    histories,
    today,
    mode,
    period,
    sort,
    query,
    status,
    category,
    expanded,
    onExpand,
  } = props;
  const viewport = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(1000);
  const positions = useRef(new Map<string, number>());
  useEffect(() => {
    const observer = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    if (viewport.current) observer.observe(viewport.current);
    return () => observer.disconnect();
  }, []);
  const visible = useMemo(
    () =>
      devices
        .filter(
          (d) =>
            (status === "全部" || d.status === status) &&
            (category === "全部" || d.category === category) &&
            [d.name, d.tags, d.notes, d.channel, d.additionalDetail, d.category]
              .join(" ")
              .toLowerCase()
              .includes(query.trim().toLowerCase()),
        )
        .sort((a, b) => {
          if (mode === "ranking" || sort === "daily") {
            const ah = histories.get(a.id),
              bh = histories.get(b.id);
            const av = !ah || ah.empty ? -Infinity : ah.current,
              bv = !bh || bh.empty ? -Infinity : bh.current;
            return av === bv ? 0 : bv - av;
          }
          if (sort === "oldest")
            return a.purchaseDate.localeCompare(b.purchaseDate);
          if (sort === "newest")
            return b.purchaseDate.localeCompare(a.purchaseDate);
          if (sort === "longest")
            return daysHeld(b, devices, today) - daysHeld(a, devices, today);
          if (sort === "shortest")
            return daysHeld(a, devices, today) - daysHeld(b, devices, today);
          if (sort === "name") return a.name.localeCompare(b.name, "zh-CN");
          if (sort === "status") return a.status.localeCompare(b.status);
          return 0;
        }),
    [devices, status, category, query, sort, mode, histories, today],
  );
  const order = visible.map((d) => d.id).join("|");
  useLayoutEffect(() => {
    const next = new Map<string, number>();
    viewport.current
      ?.querySelectorAll<HTMLElement>(".score-row")
      .forEach((el) => {
        const y = el.offsetTop;
        next.set(el.id, y);
        const before = positions.current.get(el.id);
        if (
          before !== undefined &&
          before !== y &&
          !matchMedia("(prefers-reduced-motion: reduce)").matches
        )
          el.animate(
            [
              { transform: `translateY(${before - y}px)` },
              { transform: "translateY(0)" },
            ],
            { duration: 360, easing: "cubic-bezier(.2,.8,.2,1)" },
          );
      });
    positions.current = next;
  }, [order]);
  const earliest = Math.min(
    stamp("2020-01-01"),
    ...devices.filter((d) => d.purchaseDate).map((d) => stamp(d.purchaseDate)),
    stamp(today),
  );
  const startYear = new Date(earliest).getUTCFullYear();
  const start = stamp(`${startYear}-01-01`),
    end = Math.max(stamp(today), start + 86400000);
  const endYear = new Date(end).getUTCFullYear();
  const yearStep = Math.max(1, Math.ceil((endYear - startYear + 1) / 9));
  const years = Array.from(
    { length: endYear - startYear + 1 },
    (_, i) => startYear + i,
  ).filter((_, i) => i % yearStep === 0);
  const position = (date: number) =>
    Math.max(0, Math.min(100, ((date - start) / (end - start)) * 100));
  const max = Math.max(
    1,
    ...visible.map((d) => Math.abs(histories.get(d.id)?.current ?? 0)),
  );
  const yearGuides = years.map((year) => ({
    year,
    left: position(stamp(`${year}-01-01`)),
  }));
  return (
    <>
      <div
        className={`score-scroll ${mode}`}
        ref={viewport}
        style={{ "--score-width": `${width}px` } as CSSProperties}
        tabIndex={0}
        role="region"
        aria-label={
          mode === "timeline"
            ? "设备持有时间轴，可横向滚动"
            : "设备成本排行，可横向滚动"
        }
      >
        <div className="score-grid">
          <div className="axis-row">
            <div className="axis-name">
              设备 <span>/ {visible.length.toString().padStart(2, "0")}</span>
            </div>
            <div className="axis-track">
              {mode === "timeline" ? (
                <>
                  {yearGuides.map(({ year, left }) => (
                    <span key={year} className={year % (yearStep * 2) !== startYear % (yearStep * 2) || left > 86 ? "axis-year-secondary" : undefined} style={{ left: `${left}%` }}>
                      {year}
                    </span>
                  ))}
                  <span className="axis-now" style={{ right: 0 }}>
                    {dateLabel(today).slice(5)}
                  </span>
                </>
              ) : (
                <>
                  <span style={{ left: 0 }}>¥0</span>
                  <span className="rank-scale" style={{ left: "50%" }}>
                    {costLabel((max * (period === "year" ? 365 : 1)) / 2)}
                  </span>
                  <span className="axis-now" style={{ right: 0 }}>
                    {costLabel(max * (period === "year" ? 365 : 1))}
                  </span>
                </>
              )}
            </div>
            <div className="axis-cost">
              {mode === "ranking" && period === "year"
                ? "年均成本"
                : "日均成本"}{" "}
              <span>↓</span>
            </div>
          </div>
          {visible.map((d, index) => (
            <ScoreRow
              key={d.id}
              {...props}
              device={d}
              index={index}
              history={histories.get(d.id) ?? null}
              guides={yearGuides}
              position={position}
              max={max}
              open={expanded === d.id}
              onToggle={() => onExpand(expanded === d.id ? null : d.id)}
            />
          ))}
        </div>
      </div>
      {!visible.length && (
        <div className="empty-state">
          <Box size={28} strokeWidth={1} />
          <h3>
            {devices.length ? "没有匹配的设备" : "从第一件设备，开始记录"}
          </h3>
          <p>
            {devices.length
              ? "调整筛选条件，重新看看你的设备。"
              : "点击右上角「新增设备」，写下这段陪伴。"}
          </p>
        </div>
      )}
    </>
  );
}
function ScoreRow({
  device: d,
  index,
  history: h,
  guides,
  position,
  max,
  open,
  onToggle,
  ...props
}: Props & {
  device: Device;
  index: number;
  history: History | null;
  guides: { year: number; left: number }[];
  position: (date: number) => number;
  max: number;
  open: boolean;
  onToggle: () => void;
}) {
  const { devices, today, mode, period, onExpand, onEdit, onDelete } = props;
  const [visited, setVisited] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  useEffect(() => {
    if (open) setVisited(true);
  }, [open]);
  const events = useMemo(
    () => scoreEvents(d, devices, today, h),
    [d, devices, today, h],
  );
  const markers = events.filter((e) => e.kind !== "purchase");
  const archived = d.status === "归档";
  const Icon = {
    手机: Smartphone,
    电脑: Laptop,
    平板: Tablet,
    穿戴: d.category === "穿戴" && /watch/i.test(d.name) ? Watch : Headphones,
    影音: Monitor,
    其他: Box,
  }[d.category];
  const left =
    mode === "timeline" ? position(h?.start ?? stamp(d.purchaseDate)) : 0;
  const right =
    mode === "timeline"
      ? position(h?.usageEnd ?? stamp(d.purchaseDate))
      : (Math.abs(h?.current ?? 0) / max) * 100;
  const value =
    h && !h.empty
      ? costLabel(
          h.current * (mode === "ranking" && period === "year" ? 365 : 1),
        )
      : "—";
  const days = daysHeld(d, devices, today);
  function chooseEvent(e: ScoreEvent) {
    setSelectedEvent(e.key);
    onExpand(d.id);
  }
  return (
    <article
      className={`score-row ${archived ? "archived" : ""} ${open ? "is-open" : ""} ${h?.missingPrice ? "missing-price" : ""}`}
      id={`row-${d.id}`}
      data-device={d.id}
      style={{ "--row-delay": `${index * 30}ms` } as CSSProperties}
    >
      <div className="row-main">
        <button
          className="device-label"
          aria-expanded={open}
          aria-controls={`detail-${d.id}`}
          onClick={onToggle}
        >
          <span className="row-index">
            {String(index + 1).padStart(2, "0")}
          </span>
          <Icon className="device-icon" size={19} strokeWidth={1.35} />
          <span className="device-text">
            <span className="device-name">{d.name}</span>
            <span className="device-meta">
              {d.category}
              <span className="meta-dot">·</span>
              {days ? `${days.toLocaleString()} 天` : d.purchaseDate > today ? "计划购入" : "日期待补充"}
              {archived && <span className="archive-badge">已归档</span>}
            </span>
          </span>
          <ChevronDown className="row-chevron" size={13} />
        </button>
        <div className="track-cell">
          <div className="track-guides" aria-hidden="true">
            {mode === "timeline"
              ? guides.map((g) => (
                  <i key={g.year} style={{ left: `${g.left}%` }} />
                ))
              : [0, 50, 100].map((left) => (
                  <i key={left} style={{ left: `${left}%` }} />
                ))}
            <i className="cutoff-guide" style={{ right: 0 }} />
          </div>
          <button
            className="track-hit"
            onClick={onToggle}
            aria-expanded={open}
            aria-controls={`detail-${d.id}`}
            aria-label={`${d.name}，${dateLabel(d.purchaseDate)} 至 ${h ? dateLabel(new Date(h.usageEnd).toISOString().slice(0, 10)) : "日期待补充"}，展开成本曲线`}
          />
          {h && (
            <div
              className="track-bar"
              style={{
                left: `${left}%`,
                width: `${Math.max(mode === "timeline" ? 0.15 : 0, right - left)}%`,
              }}
              aria-hidden="true"
            >
              <div className="bar-reveal">
                <span className="bar-line" />
                <span className="bar-start" />
                {!archived && mode === "timeline" && (
                  <span className="bar-end" />
                )}
              </div>
            </div>
          )}
          {mode === "timeline" &&
            markers.map((e) => (
              <button
                key={e.key}
                className={`event-tick ${e.kind} ${open && selectedEvent === e.key ? "selected" : ""}`}
                style={{
                  left: `${position(e.date)}%`,
                  ...(markers.some(
                    (other) => other.date === e.date && other.key !== e.key,
                  )
                    ? {
                        top:
                          e.kind === "recovery"
                            ? "calc(50% + 11px)"
                            : "calc(50% - 11px)",
                        height: "22px",
                      }
                    : {}),
                }}
                aria-label={`${d.name} · ${dateLabel(new Date(e.date).toISOString().slice(0, 10))} · ${e.title} ${costLabel(Math.abs(e.amount))}`}
                title={`${e.title} · ${costLabel(Math.abs(e.amount))} · 点击查看`}
                onClick={() => chooseEvent(e)}
              >
                <i />
              </button>
            ))}
          {!h && (
            <span className="track-empty">
              {d.purchaseDate > today ? "统计日之后购入" : "购入日期待补充"}
            </span>
          )}
          {mode === "timeline" &&
            archived &&
            h &&
            !markers.some((e) => e.kind === "recovery") && (
              <span
                className="archive-end"
                style={{ left: `${right}%` }}
                aria-label="持有结束"
              />
            )}
        </div>
        <button
          className="device-cost"
          onClick={onToggle}
          aria-label={`${d.name} ${value}，展开详情`}
        >
          <span>{value}</span>
          <small>
            {h?.empty
              ? "待补充"
              : h?.missingPrice
                ? "仅已知支出"
                : mode === "ranking" && period === "year"
                  ? "/年"
                  : "/天"}
          </small>
        </button>
      </div>
      <div
        className={`detail-accordion ${open ? "expanded" : ""}`}
        id={`detail-${d.id}`}
        aria-hidden={!open}
        inert={!open}
      >
        <div className="detail-clip">
          {(open || visited) && (
            <ScoreDetail
              device={d}
              devices={devices}
              history={h}
              today={today}
              events={events}
              selectedEvent={selectedEvent}
              onSelectEvent={setSelectedEvent}
              onEdit={() => onEdit(d)}
              onDelete={() => onDelete(d)}
            />
          )}
        </div>
      </div>
    </article>
  );
}
