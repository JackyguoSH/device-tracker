'use client';

import { useMemo, useState } from 'react';
import { CartesianGrid, Line, LineChart, ReferenceDot, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartContainer } from '@/components/ui/chart';

const DAY = 86400000;
const timestamp = (date: string) => new Date(`${date}T00:00:00Z`).getTime();
const shortDate = (value: number) => new Date(value).toISOString().slice(0, 10).replaceAll('-', '/');
const currency = (value: number) => `¥${value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function CostHistory({ device, today }: {
  device: { name: string; purchaseDate: string; purchasePrice: number; additional: number; additionalDetail: string };
  today: string;
}) {
  const [period, setPeriod] = useState<'recent' | 'all'>('recent');
  const history = useMemo(() => {
    if (!today || !device.purchaseDate) return null;
    const start = timestamp(device.purchaseDate);
    const end = timestamp(today);
    if (!Number.isFinite(start) || end <= start) return null;
    // The record gives annual 2022–2025 totals, but only the 2026 renewal has an exact date.
    const hasRenewal = device.additionalDetail.includes('2026-09-17');
    const renewal = hasRenewal ? 848 : 0;
    const historical = Math.max(0, device.additional - renewal);
    const annual = historical / 4;
    const expenses = [2022, 2023, 2024, 2025].map((year, index) => ({
      date: index === 0 ? start : timestamp(`${year}-09-17`), amount: annual,
    }));
    if (hasRenewal) expenses.push({ date: timestamp('2026-09-17'), amount: 848 });
    const totalAt = (date: number) => device.purchasePrice + expenses.filter(e => e.date <= date).reduce((sum, e) => sum + e.amount, 0);
    const points = [];
    for (let date = start + DAY; date <= end; date += DAY) {
      const days = Math.round((date - start) / DAY);
      const total = totalAt(date);
      const added = expenses.filter(e => e.date === date).reduce((sum, e) => sum + e.amount, 0);
      if (added) points.push({ date, days, total: total - added, daily: (total - added) / days, added: 0 });
      points.push({ date, days, total, daily: total / days, added });
    }
    return { points, end, current: totalAt(end) / ((end - start) / DAY), days: Math.round((end - start) / DAY) };
  }, [device, today]);
  if (!history) return null;
  const cutoff = new Date(history.end);
  cutoff.setUTCFullYear(cutoff.getUTCFullYear() - 2);
  const points = history.points.filter(p => period === 'all' || p.date >= cutoff.getTime());
  const values = points.map(p => p.daily);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range: [number, number] = period === 'all'
    ? [Math.max(0.01, min * 0.8), Math.max(1, max * 1.1)]
    : [Math.max(0, min - Math.max(0.5, (max - min) * 0.12)), max + Math.max(0.5, (max - min) * 0.12)];
  return (
    <section className="cost-history-section" aria-labelledby="cost-history-title">
      <header className="cost-history-header">
        <div>
          <h2 id="cost-history-title">每日平均成本</h2>
          <span className="cost-history-device">{device.name}</span>
        </div>
        <div className="period-switch" role="group" aria-label="曲线时间范围">
          <button className={period === 'recent' ? 'selected' : ''} aria-pressed={period === 'recent'} onClick={() => setPeriod('recent')}>近两年</button>
          <button className={period === 'all' ? 'selected' : ''} aria-pressed={period === 'all'} onClick={() => setPeriod('all')}>全部</button>
        </div>
      </header>
      <div className="cost-history-current"><strong>{currency(history.current)}</strong><span>/天</span></div>
      <ChartContainer className="cost-history-chart" config={{ daily: { label: '平均每日成本', color: 'var(--primary)' } }}>
        <LineChart accessibilityLayer data={points} margin={{ top: 15, right: 12, bottom: 8, left: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="date" type="number" domain={['dataMin', 'dataMax']} tickCount={4} minTickGap={38} tickLine={false} axisLine={false} tickMargin={12} tickFormatter={value => shortDate(Number(value)).slice(0, 7)} />
          <YAxis width={49} scale={period === 'all' ? 'log' : 'linear'} domain={range} allowDataOverflow tickCount={5} tickLine={false} axisLine={false} tickMargin={8} tickFormatter={value => Number(value) >= 1000 ? `${Number(value) / 1000}k` : Number(value).toFixed(Number(value) < 10 ? 1 : 0)} />
          <Tooltip cursor={{ stroke: 'var(--muted-foreground)', strokeWidth: 1 }} content={({ active, payload }) => {
            const point = payload?.[payload.length - 1]?.payload;
            if (!active || !point) return null;
            return <div className="cost-history-tooltip"><span>{shortDate(point.date)}</span><strong>{currency(point.daily)}/天</strong><span>累计 ¥{point.total.toLocaleString('zh-CN')} · {point.days} 天</span>{point.added > 0 && <span>AppleCare+ ¥{point.added}</span>}</div>;
          }} />
          <Line dataKey="daily" type="linear" stroke="var(--primary)" strokeWidth={2} dot={false} isAnimationActive={false} activeDot={{ r: 4, stroke: 'var(--card)' }} />
          {points.filter(p => p.added > 0).map(p => <ReferenceDot key={p.date} x={p.date} y={p.daily} r={3} fill="var(--primary)" stroke="var(--card)" />)}
        </LineChart>
      </ChartContainer>
      <div className="cost-history-caption"><span>元/天{period === 'all' ? ' · 对数刻度' : ''}</span><span>2022–2025 续保日期按周年估算</span></div>
    </section>
  );
}
