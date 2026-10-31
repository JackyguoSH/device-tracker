'use client';

import { useMemo, useState } from 'react';
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
  const [period, setPeriod] = useState<'recent' | 'all'>('recent');
  const device = devices.find(item => item.id === deviceId) || devices[0];
  const history = useMemo(() => device ? buildCostHistory(device, today) : null, [device, today]);
  if (!device) return null;
  const cutoff = new Date(history?.end || 0);
  cutoff.setUTCFullYear(cutoff.getUTCFullYear() - 2);
  const points = history?.points.filter(p => period === 'all' || p.date >= cutoff.getTime()) || [];
  const values = points.map(p => p.daily);
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 1;
  const logarithmic = period === 'all' && min > 0 && max > min;
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
      <ChartContainer className="cost-history-chart" config={{ daily: { label: '平均每日成本', color: 'var(--primary)' } }}>
        <LineChart accessibilityLayer data={points} margin={{ top: 15, right: 12, bottom: 8, left: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="date" type="number" domain={['dataMin', 'dataMax']} tickCount={4} minTickGap={38} interval="preserveStartEnd" tickLine={false} axisLine={false} tickMargin={12} tickFormatter={value => history.end - history.start < 120 * 86400000 ? shortDate(Number(value)).slice(5) : shortDate(Number(value)).slice(0, 7)} />
          <YAxis width={49} scale={logarithmic ? 'log' : 'linear'} domain={range} allowDataOverflow tickCount={5} tickLine={false} axisLine={false} tickMargin={8} tickFormatter={value => Math.abs(Number(value)) >= 1000 ? `${Number((Number(value) / 1000).toFixed(1))}k` : Number(value).toFixed(Math.abs(Number(value)) < 10 ? 1 : 0)} />
          <Tooltip cursor={{ stroke: 'var(--muted-foreground)', strokeWidth: 1 }} content={({ active, payload }) => {
            const point = payload?.[payload.length - 1]?.payload;
            if (!active || !point) return null;
            return <div className="cost-history-tooltip"><span>{shortDate(point.date)}</span><strong>{currency(point.daily)}/天</strong><span>净投入 ¥{point.total.toLocaleString('zh-CN')} · 使用 {point.days} 天</span>{point.event && <span>{point.event}</span>}</div>;
          }} />
          <Line dataKey="daily" type="linear" stroke="var(--primary)" strokeWidth={2} dot={false} isAnimationActive={false} activeDot={{ r: 4, stroke: 'var(--card)' }} />
          {points.filter(p => p.change !== 0).map(p => <ReferenceDot key={p.date} x={p.date} y={p.daily} r={3} fill="var(--primary)" stroke="var(--card)" />)}
        </LineChart>
      </ChartContainer>
      <div className="cost-history-caption"><span>元/天{logarithmic ? ' · 对数刻度' : ''}</span>{history.note && <span>{history.note}</span>}</div>
      </> : <div className="cost-history-empty">{history?.empty ? '补充购入价格后显示曲线' : '补充有效购入日期后显示曲线'}</div>}
    </section>
  );
}
