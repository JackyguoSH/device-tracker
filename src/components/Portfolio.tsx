import { useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import {
  categories,
  costLabel,
  dateLabel,
  daysHeld,
  historyFor,
  iso,
  money,
  pointAt,
  stamp,
  DAY,
  type Device,
  type History,
} from "../lib/model";
import { summarize } from "../lib/score";
import { LineChart, type PlotPoint } from "./LineChart";
import { Segmented } from "./Shared";

export function Portfolio({
  devices,
  histories,
  today,
}: {
  devices: Device[];
  histories: Map<string, History | null>;
  today: string;
}) {
  const [period, setPeriod] = useState("365");
  const summary = summarize(devices, histories, today);
  const series = useMemo(() => {
    const active = summarize(devices, histories, today).active;
    const result: PlotPoint[] = [];
    const now = stamp(today),
      start = now - Number(period) * DAY;
    for (let date = start; date <= now; date += DAY) {
      let value = 0;
      const events: string[] = [];
      active.forEach((d) => {
        const h = histories.get(d.id);
        if (!h || h.start > date) return;
        const p = pointAt(h, date);
        value +=
          p?.daily ?? historyFor(d, devices, d.purchaseDate)?.current ?? 0;
        if (date === h.start) events.push(`${d.name} 购入`);
        if (p?.date === date && p.event) events.push(`${d.name} ${p.event}`);
      });
      result.push({ date, value, event: events.join("；") });
    }
    return result;
  }, [devices, histories, today, period]);
  const difference = (series.at(-1)?.value ?? 0) - (series[0]?.value ?? 0);
  const min = Math.floor(Math.min(...series.map((p) => p.value)) / 5) * 5;
  const max = Math.max(
    min + 5,
    Math.ceil(Math.max(...series.map((p) => p.value)) / 5) * 5,
  );
  const longest = [...summary.active].sort(
    (a, b) => daysHeld(b, devices, today) - daysHeld(a, devices, today),
  )[0];
  const changes = series.filter((p) => p.event);
  return (
    <section className="portfolio">
      <div className="portfolio-stats">
        <div>
          <span>年均摊销</span>
          <strong>{money(summary.daily * 365)}</strong>
          <small>日均 × 365，非年度实际支出</small>
        </div>
        <div>
          <span>最久的陪伴</span>
          <strong>
            {summary.longest.toLocaleString()}
            <small> 天</small>
          </strong>
          <small>{longest?.name || "从第一件设备开始"}</small>
        </div>
        <div>
          <span>近 {period} 天日均变化</span>
          <strong>
            {difference <= 0 ? (
              <ArrowDownRight size={22} />
            ) : (
              <ArrowUpRight size={22} />
            )}
            {costLabel(Math.abs(difference))}
          </strong>
          <small>{difference <= 0 ? "减少" : "增加"} · 当前在用组合</small>
        </div>
      </div>
      <div className="portfolio-trend">
        <div className="section-top">
          <div>
            <h2>当前组合 · 日均成本趋势</h2>
          </div>
          <Segmented
            label="统计时间范围"
            value={period}
            onChange={setPeriod}
            options={[
              { value: "30", label: "近 30 天" },
              { value: "365", label: "近一年" },
            ]}
          />
        </div>
        <LineChart
          points={series}
          today={stamp(today)}
          valueRange={[min, max]}
          label={`当前 ${summary.active.length} 件在用设备的日均成本趋势，期初 ${costLabel(series[0]?.value ?? 0)}，统计日 ${costLabel(summary.daily)}。纵轴 ${money(min)} 至 ${money(max)}`}
        />
        <div className="chart-caption">
          <span>
            期初 <strong>{costLabel(series[0]?.value ?? 0)}/天</strong>
          </span>
          <span>
            统计日 <strong>{costLabel(summary.daily)}/天</strong>
          </span>
        </div>
        {changes.length > 0 && (
          <details className="archive-details">
            <summary>区间内 {changes.length} 天有投入变化</summary>
            {changes.map((p) => (
              <p key={p.date}>
                {dateLabel(iso(p.date))} · {p.event}
              </p>
            ))}
          </details>
        )}
      </div>
      <div className="category-summary">
        <div className="section-top">
          <h2>投入的去向</h2>
        </div>
        <div className="category-table">
          <table>
            <thead>
              <tr>
                <th>分类</th>
                <th>在用</th>
                <th>累计投入</th>
                <th>日均成本</th>
                <th>投入占比</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => {
                const items = summary.active.filter((d) => d.category === c);
                if (!items.length) return null;
                const total = items.reduce(
                  (s, d) =>
                    s + (histories.get(d.id)?.points.at(-1)?.total ?? 0),
                  0,
                );
                const daily = items.reduce(
                  (s, d) => s + (histories.get(d.id)?.current ?? 0),
                  0,
                );
                return (
                  <tr key={c}>
                    <th>{c}</th>
                    <td>{items.length} 件</td>
                    <td>{money(total)}</td>
                    <td>
                      {costLabel(daily)}
                      <small>/天</small>
                    </td>
                    <td>
                      <span className="category-bar">
                        <i
                          style={{
                            width: `${summary.total ? (total / summary.total) * 100 : 0}%`,
                          }}
                        />
                      </span>
                      <span>
                        {summary.total
                          ? ((total / summary.total) * 100).toFixed(1)
                          : "0.0"}
                        %
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
