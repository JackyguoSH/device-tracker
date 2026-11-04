import { useEffect, useRef, useState } from "react";
import { chartScale, nearestPoint } from "../lib/chart-scale";
import { dateLabel, iso, money } from "../lib/model";
export type PlotPoint = { date: number; value: number; event?: string };
export function LineChart({
  points,
  forecast = [],
  today,
  target,
  selectedDate,
  label,
  compact = false,
  valueRange,
}: {
  points: PlotPoint[];
  forecast?: PlotPoint[];
  today?: number;
  target?: number;
  selectedDate?: number;
  label: string;
  compact?: boolean;
  valueRange?: [number, number];
}) {
  const [linear, setLinear] = useState(false);
  const [hover, setHover] = useState<PlotPoint | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(700);
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) =>
      setWidth(Math.max(240, entry.contentRect.width)),
    );
    observer.observe(ref.current!);
    return () => observer.disconnect();
  }, []);
  const height = compact ? 210 : width < 600 ? 220 : 300;
  const left = width < 500 ? 64 : 80,
    right = 20,
    top = 24,
    bottom = 36;
  const all = [...points, ...forecast].sort((a, b) => a.date - b.date);
  const minDate = all[0]?.date || 0,
    maxDate = all[all.length - 1]?.date || minDate + 1;
  const values = all.map((p) => p.value);
  if (target !== undefined) values.push(target);
  const scale = chartScale(values, valueRange, linear);
  const x = (date: number) =>
    left +
    ((date - minDate) / Math.max(1, maxDate - minDate)) *
      (width - left - right);
  const y = (value: number) =>
    top + (1 - scale.fraction(value)) * (height - top - bottom);
  const path = (data: PlotPoint[]) =>
    data
      .map(
        (p, i) =>
          `${i ? "L" : "M"}${x(p.date).toFixed(2)},${y(p.value).toFixed(2)}`,
      )
      .join(" ");
  const last = points[points.length - 1];
  const events = points.filter((p) => p.event);
  const uniqueEvents = events.filter(
    (p, i) => events.findIndex((a) => a.date === p.date) === i,
  );
  return (
    <div className="line-chart" ref={ref}>
      {!valueRange && all.length > 0 && (
        <div className="chart-scale-control">
          <button type="button" aria-label="切换纵轴线性刻度" title="压缩刻度会展开低成本区间，所有金额保留原值；点击切换线性刻度" aria-pressed={linear} onClick={() => setLinear(!linear)}>
            {linear ? "线性刻度" : scale.compressed ? "压缩刻度" : "自适应刻度"}
          </button>
        </div>
      )}
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        tabIndex={all.length ? 0 : undefined}
        style={{ touchAction: "pan-y" }}
        onPointerMove={(e) => {
          const box = e.currentTarget.getBoundingClientRect();
          const px = (e.clientX - box.left) * width / box.width;
          if (px < left || px > width - right) { setHover(null); return; }
          const date = minDate + (px - left) / (width - left - right) * (maxDate - minDate);
          setHover(nearestPoint(all, date) ?? null);
        }}
        onPointerLeave={() => setHover(null)}
        onPointerDown={(e) => {
          const box = e.currentTarget.getBoundingClientRect();
          const px = Math.max(left, Math.min(width - right, (e.clientX - box.left) * width / box.width));
          setHover(nearestPoint(all, minDate + (px - left) / (width - left - right) * (maxDate - minDate)) ?? null);
        }}
        onBlur={() => setHover(null)}
        onKeyDown={(e) => {
          if (e.key === "Escape") { setHover(null); return; }
          if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
          e.preventDefault();
          const index = hover ? all.indexOf(hover) : all.length - 1;
          const next = e.key === "Home" ? 0 : e.key === "End" ? all.length - 1 : Math.max(0, Math.min(all.length - 1, index + (e.key === "ArrowLeft" ? -1 : 1)));
          setHover(all[next] ?? null);
        }}
        role="img"
        aria-label={label}
      >
        <title>{label}</title>
        {scale.ticks.map((value, i) => {
          return (
            <g key={i}>
              <line
                className="grid-line"
                x1={left}
                x2={width - right}
                y1={y(value)}
                y2={y(value)}
              />
              <text x={left - 12} y={y(value) + 4} textAnchor="end">
                {Math.abs(value) >= 1000
                  ? `¥${Math.round(value).toLocaleString()}`
                  : `¥${value.toFixed(Math.abs(value) < 1 ? 2 : Math.abs(value) < 100 ? 1 : 0)}`}
              </text>
            </g>
          );
        })}
        {target !== undefined && (
          <line
            className="target-line"
            x1={left}
            x2={width - right}
            y1={y(target)}
            y2={y(target)}
          />
        )}
        {today !== undefined && today >= minDate && today <= maxDate && (
          <line
            className="today-line"
            x1={x(today)}
            x2={x(today)}
            y1={top}
            y2={height - bottom}
          />
        )}
        <path className="history-line" d={path(points)} />
        <path className="forecast-line" d={path(forecast)} />
        {uniqueEvents.map((p, i) => (
          <circle
            className="event-point"
            key={i}
            cx={x(p.date)}
            cy={y(p.value)}
            r={3}
          >
            <title>
              {dateLabel(iso(p.date))} · {p.event}
            </title>
          </circle>
        ))}
        {last && (
          <circle
            className="current-point"
            cx={x(last.date)}
            cy={y(last.value)}
            r={3}
          />
        )}
        {forecast.length > 1 && (
          <circle
            className="future-point"
            cx={x(forecast[forecast.length - 1].date)}
            cy={y(forecast[forecast.length - 1].value)}
            r={4}
          />
        )}
        {hover && (
          <g className="chart-hover-marker" pointerEvents="none">
            <line className="cursor-line" x1={x(hover.date)} x2={x(hover.date)} y1={top} y2={height - bottom} />
            <circle className="future-point" cx={x(hover.date)} cy={y(hover.value)} r={5} />
          </g>
        )}
        {!hover && selectedDate !== undefined &&
          (() => {
            const point = all.filter((p) => p.date <= selectedDate).at(-1);
            return point ? (
              <g>
                <line
                  className="cursor-line"
                  x1={x(point.date)}
                  x2={x(point.date)}
                  y1={top}
                  y2={height - bottom}
                />
                <circle
                  className="future-point"
                  cx={x(point.date)}
                  cy={y(point.value)}
                  r={5}
                />
              </g>
            ) : null;
          })()}
        {all.length > 0 && (
          <>
            <text x={left} y={height - 8}>
              {dateLabel(iso(minDate))}
            </text>
            <text x={width - right} y={height - 8} textAnchor="end">
              {dateLabel(iso(maxDate))}
            </text>
            {width > 560 && maxDate - minDate > 86400000 * 60 && (
              <text
                x={x((minDate + maxDate) / 2)}
                y={height - 8}
                textAnchor="middle"
              >
                {dateLabel(iso((minDate + maxDate) / 2))}
              </text>
            )}
          </>
        )}
      </svg>
      {hover && (
        <div className="chart-tooltip" role="status" style={{ left: `${Math.max(0, Math.min(width - 180, x(hover.date) - 84)) / width * 100}%` }}>
          <time>{dateLabel(iso(hover.date))}</time>
          <strong>{money(hover.value)}<small> / 天</small></strong>
          {hover.event && <span>{hover.event}</span>}
          {forecast.includes(hover) && <span>预测</span>}
        </div>
      )}
      {!all.length && (
        <p className="chart-empty">补充日期与金额后，这里会记录成本的变化。</p>
      )}
      {all.length > 0 && minDate === maxDate && (
        <p className="caption">仅有一天记录，当前 {money(all[0].value)}/天。</p>
      )}
    </div>
  );
}
