'use client';

import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { ArrowDown, ArrowUpRight, ArrowRight } from 'lucide-react';
import { CostHistory } from '@/components/cost-history';
import type { HistoryDevice } from '@/lib/cost-history';

type PortalDevice = HistoryDevice & { image: string; category: string };
type Destination = 'timeline' | 'costs' | 'devices';
const dateLabel = (value: string) => value.replaceAll('-', '.');
const positions = [
  { id: 'iphone-14-pro', x: 0, y: 0, w: 205, h: 330, angle: -8 },
  { id: 'macbook-air', x: -410, y: -150, w: 450, h: 310, angle: 12 },
  { id: 'ipad-pro-2020', x: 370, y: -120, w: 290, h: 340, angle: -12 },
  { id: 'airpods-pro-2', x: 290, y: 245, w: 180, h: 180, angle: 10 },
  { id: 'apple-watch-s7', x: -220, y: 240, w: 170, h: 220, angle: -16 },
  { id: 'homepod-mini-2020', x: -160, y: -325, w: 160, h: 180, angle: 0 },
  { id: 'apple-tv-4k', x: 210, y: -340, w: 190, h: 150, angle: 10 },
];

export function DevicePortal({ devices, today, onNavigate, onDetails, renderSection }: {
  devices: PortalDevice[];
  today: string;
  onNavigate: (destination: Destination) => void;
  onDetails: () => void;
  renderSection: (destination: Destination) => ReactNode;
}) {
  const track = useRef<HTMLElement>(null);
  const active = devices.filter(d => d.status === '持有');
  const stageDevices = positions.map((position, i) => ({ ...position, device: devices.find(d => d.id === position.id) || (i === 0 ? devices.find(d => d.image) : undefined) })).filter((item, index, all) => item.device?.image && all.findIndex(other => other.device?.id === item.device?.id) === index);

  useEffect(() => {
    const element = track.current;
    if (!element) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    let end = 1;
    let top = 0;
    let close = 1;
    let wide = .6;
    let inset = 32;
    const clamp = (n: number) => Math.max(0, Math.min(1, n));
    const smooth = (n: number) => { const t = clamp(n); return t * t * (3 - 2 * t); };
    const draw = () => {
      frame = 0;
      const progress = motion.matches ? 0 : clamp((window.scrollY - top) / end);
      const camera = smooth(progress / .78);
      // Every object stays fixed on one plane. The camera changes scale only.
      element.style.setProperty('--camera-scale', String(close * Math.pow(wide / close, camera)));
      element.style.setProperty('--surface-light', String(smooth((progress - .12) / .48)));
      element.style.setProperty('--frame-inset', `${inset * smooth((progress - .35) / .35)}px`);
      element.style.setProperty('--frame-radius', `${28 * smooth((progress - .35) / .35)}px`);
      element.style.setProperty('--scene-light', String(smooth((progress - .84) / .16)));
      element.style.setProperty('--cue-opacity', String(1 - smooth(progress / .13)));
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(draw); };
    const measure = () => {
      close = Math.min(2.15, window.innerWidth / 245, window.innerHeight / 400);
      wide = Math.min(window.innerWidth / 1260, window.innerHeight / 860) * .86;
      if (window.innerWidth <= 609 || window.innerHeight > window.innerWidth) wide = Math.max(.5, wide);
      if (motion.matches) close = Math.min(close, window.innerHeight * .6 / 330);
      inset = window.innerWidth <= 609 ? 16 : 40;
      end = Math.max(1, element.offsetHeight - window.innerHeight);
      top = element.getBoundingClientRect().top + window.scrollY;
      schedule();
    };
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', schedule, { passive: true });
    motion.addEventListener('change', measure);
    measure();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', schedule);
      motion.removeEventListener('change', measure);
    };
  }, []);

  return (
    <div className="journey-page">
      <section className="journey-track" ref={track} aria-label="物品与时间">
        <h1 className="sr-only">我的物品</h1>
        <div className="journey-scene" aria-hidden="true">
          <div className="journey-set">
            <div className="journey-surface" />
            <div className="journey-plane">
            {stageDevices.map(({ device, x, y, w, h, angle }, i) => <div key={device!.id} className={`journey-object journey-object-${i}`} style={{ '--object-x': `${x}px`, '--object-y': `${y}px`, '--object-w': `${w}px`, '--object-h': `${h}px`, '--object-angle': `${angle}deg` } as CSSProperties}><img src={device!.image} alt="" fetchPriority={i === 0 ? 'high' : 'auto'} decoding="async" /></div>)}
            </div>
          </div>
          <div className="journey-daylight" />
          <div className="journey-first-caption"><span>{stageDevices[0]?.device?.name}</span><span>{stageDevices[0]?.device ? `${dateLabel(stageDevices[0].device.purchaseDate)} — ${stageDevices[0].device.status === '持有' ? '至今' : dateLabel(stageDevices[0].device.usageEnd)}` : ''}</span></div>
          <div className="journey-scroll-cue"><ArrowDown /><span>向下，走过时间</span></div>
        </div>
        <nav className="journey-shortcuts" aria-label="首页导航"><a href="#journey-records">使用历程</a><a href="#journey-cost">每日成本</a><button onClick={onDetails}>全部记录<ArrowUpRight /></button></nav>

      </section>

      <section className="journey-records" id="journey-records" aria-labelledby="journey-records-title">
        <div className="journey-bridge" aria-hidden="true" />
        <div className="journey-records-inner">
          <header className="journey-records-heading"><h2 id="journey-records-title">用过的时间。<br /><span>都有迹可循。</span></h2><div><p><strong>{active.length}</strong> 件使用中<span> / {devices.length - active.length} 件已归档</span></p><button className="journey-link" onClick={onDetails}>全部记录<ArrowUpRight /></button></div></header>
          <div className="journey-timeline">{renderSection('timeline')}</div>
          <section className="journey-cost" id="journey-cost" aria-labelledby="journey-cost-title">
            <div className="journey-cost-heading"><p>每日平均成本</p><h2 id="journey-cost-title">时间越长，<br />每天越少。</h2><button className="journey-link" onClick={() => onNavigate('costs')}>查看成本排名<ArrowRight /></button></div>
            <div className="journey-cost-chart"><CostHistory devices={devices} today={today} /></div>
          </section>
          <div className="journey-bottom"><span>我的物品</span><button className="journey-link" onClick={onDetails}>管理所有设备<ArrowUpRight /></button></div>
        </div>
      </section>
    </div>
  );
}
