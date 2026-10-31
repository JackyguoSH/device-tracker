'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { CartesianGrid, Line, LineChart, ReferenceDot, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartContainer } from '@/components/ui/chart';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { buildCostHistory, type HistoryDevice } from '@/lib/cost-history';

const shortDate = (value: number) => new Date(value).toISOString().slice(0, 10).replaceAll('-', '/');
const currency = (value: number) => `¥${value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function CostHistory({ devices, today }: {
  devices: HistoryDevice[];
  today: string;
}) {
  const [deviceId, setDeviceId] = useState('iphone-14-pro');
  const [view, setView] = useState<{ id: string; start: number; end: number } | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const currentRange = useRef({ start: 0, end: 0 });
  const [gesturing, setGesturing] = useState(false);
  const device = devices.find(item => item.id === deviceId) || devices[0];
  const history = useMemo(() => device ? buildCostHistory(device, today) : null, [device, today]);
  const first = history?.points[0]?.date ?? 0;
  // A single-day record still needs a nonzero axis span.
  const last = Math.max(first + 86400000, history?.end ?? first);
  const cutoff = new Date(last);
  cutoff.setUTCFullYear(cutoff.getUTCFullYear() - 2);
  const start = view?.id === device?.id ? view.start : Math.max(first, cutoff.getTime());
  const end = view?.id === device?.id ? view.end : last;
  currentRange.current = { start, end };
  const points = history?.points ?? [];
  const visible = points.filter(p => p.date >= start && p.date <= end);
  // Include neighboring samples so the line stays continuous at both edges.
  const before = points.findLast(p => p.date < start);
  const after = points.find(p => p.date > end);
  const chartPoints = [...(before ? [before] : []), ...visible, ...(after ? [after] : [])];
  const period = start <= first && end >= last ? 'all' : start === Math.max(first, cutoff.getTime()) && end === last ? 'recent' : 'custom';

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || !device) return;
    const fullSpan = last - first;
    const minimumSpan = Math.min(fullSpan, 7 * 86400000);
    let gesture: { x: number; y: number; distance: number; start: number; end: number; mode: 'pending' | 'pan' | 'pinch' } | null = null;
    const position = (touches: TouchList) => {
      const rect = chart.getBoundingClientRect();
      const x = touches.length > 1 ? (touches[0].clientX + touches[1].clientX) / 2 : touches[0].clientX;
      return { x: (x - rect.left - 49) / Math.max(1, rect.width - 61), y: touches[0].clientY,
        distance: touches.length > 1 ? Math.max(1, Math.hypot(touches[1].clientX - touches[0].clientX, touches[1].clientY - touches[0].clientY)) : 0 };
    };
    const commit = (nextStart: number, span: number) => {
      span = Math.max(minimumSpan, Math.min(fullSpan, span));
      nextStart = Math.max(first, Math.min(last - span, nextStart));
      currentRange.current = { start: nextStart, end: nextStart + span };
      setView({ id: device.id, ...currentRange.current });
    };
    const begin = (event: TouchEvent) => {
      const p = position(event.touches);
      gesture = { ...p, ...currentRange.current, mode: event.touches.length > 1 ? 'pinch' : 'pending' };
      if (event.touches.length > 1) {
        event.preventDefault();
        setGesturing(true);
      }
    };
    const move = (event: TouchEvent) => {
      if (!gesture) return;
      const p = position(event.touches);
      const span = gesture.end - gesture.start;
      if (event.touches.length > 1) {
        event.preventDefault();
        if (gesture.mode !== 'pinch') { begin(event); return; }
        setGesturing(true);
        const nextSpan = Math.max(minimumSpan, Math.min(fullSpan, span * gesture.distance / p.distance));
        // Keep the original date underneath the moving midpoint of the fingers.
        commit(gesture.start + gesture.x * span - p.x * nextSpan, nextSpan);
      } else if (gesture.mode !== 'pinch' && span < fullSpan) {
        const dx = (p.x - gesture.x) * Math.max(1, chart.clientWidth - 61);
        if (gesture.mode === 'pending') {
          if (Math.abs(p.y - gesture.y) > Math.abs(dx)) { gesture = null; return; }
          if (Math.abs(dx) < 6) return;
          gesture.mode = 'pan';
        }
        event.preventDefault();
        setGesturing(true);
        commit(gesture.start - (p.x - gesture.x) * span, span);
      }
    };
    const finish = (event: TouchEvent) => {
      if (event.touches.length) begin(event);
      else { gesture = null; setGesturing(false); }
    };
    chart.addEventListener('touchstart', begin, { passive: false });
    chart.addEventListener('touchmove', move, { passive: false });
    chart.addEventListener('touchend', finish);
    chart.addEventListener('touchcancel', finish);
    return () => {
      chart.removeEventListener('touchstart', begin);
      chart.removeEventListener('touchmove', move);
      chart.removeEventListener('touchend', finish);
      chart.removeEventListener('touchcancel', finish);
    };
    // The listeners keep their current range during a gesture, without rebinding on every move.
  }, [device?.id, first, last, history?.empty]);

  // Presets and touch gestures share one continuous date range.
  const setPeriod = (period: 'recent' | 'all') => {
    setView({ id: device!.id, start: period === 'all' ? first : Math.max(first, cutoff.getTime()), end: last });
  };
  if (!device) return null;
  const values = chartPoints.map(p => p.daily);
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 1;
  const logarithmic = (end - start > 2 * 365 * 86400000) && min > 0 && max > min;
  const range: [number, number] = logarithmic
    ? [Math.max(0.01, min * 0.8), Math.max(1, max * 1.1)]
    : [min >= 0 ? Math.max(0, min - Math.max(0.5, (max - min) * 0.12)) : min - Math.max(0.5, (max - min) * 0.12), max + Math.max(0.5, (max - min) * 0.12)];
  return (
    <section className="cost-history-section" aria-labelledby="cost-history-title">
      <header className="cost-history-header">
        <div>
          <h2 id="cost-history-title">每日平均成本</h2>
        </div>
        <div className="period-switch" role="group" aria-label="曲线时间范围">
          <button className={period === 'recent' ? 'selected' : ''} aria-pressed={period === 'recent'} onClick={() => setPeriod('recent')}>近两年</button>
          <button className={period === 'all' ? 'selected' : ''} aria-pressed={period === 'all'} onClick={() => setPeriod('all')}>全部</button>
        </div>
      </header>
      <NativeSelect className="cost-history-picker" value={device.id} aria-label="查看设备成本曲线" onChange={event => setDeviceId(event.target.value)}>
        {devices.map(item => <NativeSelectOption value={item.id} key={item.id}>{item.name}{devices.some(other => other.id !== item.id && other.name === item.name) ? ` · ${item.purchaseDate}` : ''}{item.status === '归档' ? ' · 归档' : ''}</NativeSelectOption>)}
      </NativeSelect>
      {history && !history.empty ? <>
      <div className="cost-history-current"><strong>{currency(history.current)}</strong><span>/天{history.missingPrice ? '（已知支出）' : ''}</span></div>
      <div ref={chartRef} className="cost-history-interaction" role="group" aria-label="成本曲线，可双指缩放，放大后左右拖动">
      <ChartContainer className="cost-history-chart" config={{ daily: { label: '平均每日成本', color: 'var(--primary)' } }}>
        <LineChart accessibilityLayer data={chartPoints} margin={{ top: 15, right: 12, bottom: 8, left: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="date" type="number" domain={[start, end]} allowDataOverflow tickCount={4} minTickGap={38} interval="preserveStartEnd" tickLine={false} axisLine={false} tickMargin={12} tickFormatter={value => end - start < 120 * 86400000 ? shortDate(Number(value)).slice(5) : shortDate(Number(value)).slice(0, 7)} />
          <YAxis width={49} scale={logarithmic ? 'log' : 'linear'} domain={range} allowDataOverflow tickCount={5} tickLine={false} axisLine={false} tickMargin={8} tickFormatter={value => Math.abs(Number(value)) >= 1000 ? `${Number((Number(value) / 1000).toFixed(1))}k` : Number(value).toFixed(Math.abs(Number(value)) < 10 ? 1 : 0)} />
          <Tooltip active={gesturing ? false : undefined} cursor={{ stroke: 'var(--muted-foreground)', strokeWidth: 1 }} content={({ active, payload }) => {
            const point = payload?.[payload.length - 1]?.payload;
            if (!active || !point) return null;
            return <div className="cost-history-tooltip"><span>{shortDate(point.date)}</span><strong>{currency(point.daily)}/天</strong><span>净投入 ¥{point.total.toLocaleString('zh-CN')} · 使用 {point.days} 天</span>{point.event && <span>{point.event}</span>}</div>;
          }} />
          <Line dataKey="daily" type="linear" stroke="var(--primary)" strokeWidth={2} dot={false} isAnimationActive={false} activeDot={{ r: 4, stroke: 'var(--card)' }} />
          {visible.filter(p => p.change !== 0).map(p => <ReferenceDot key={p.date} x={p.date} y={p.daily} r={3} fill="var(--primary)" stroke="var(--card)" />)}
        </LineChart>
      </ChartContainer>
      </div>
      <div className="cost-history-caption"><span>元/天{logarithmic ? ' · 对数刻度' : ''}</span>{history.note && <span>{history.note}</span>}</div>
      </> : <div className="cost-history-empty">{history?.empty ? '补充购入价格后显示曲线' : '补充有效购入日期后显示曲线'}</div>}
    </section>
  );
}
