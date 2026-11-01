'use client';

import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { ArrowDown, ArrowUpRight, ArrowRight } from 'lucide-react';
import { CostHistory } from '@/components/cost-history';
import { buildCostHistory, HISTORY_DAY, type HistoryDevice } from '@/lib/cost-history';

type PortalDevice = HistoryDevice & { image: string; category: string };
type Destination = 'timeline' | 'costs' | 'devices';
const dateLabel = (value: string) => value.replaceAll('-', '.');
const dayCount = (device: PortalDevice, today: string) => {
  const value = Math.round((Date.parse(`${device.usageEnd || today}T00:00:00Z`) - Date.parse(`${device.purchaseDate}T00:00:00Z`)) / HISTORY_DAY);
  return Number.isFinite(value) ? Math.max(0, value) : null;
};
const positions = [
  { id: 'iphone-14-pro', x: 0, y: 0, w: 205, h: 330, angle: -8 },
  { id: 'macbook-air', x: -410, y: -150, w: 450, h: 310, angle: 12 },
  { id: 'ipad-pro-2020', x: 370, y: -120, w: 290, h: 340, angle: -12 },
  { id: 'airpods-pro-2', x: 290, y: 245, w: 180, h: 180, angle: 10 },
  { id: 'apple-watch-s7', x: -220, y: 240, w: 170, h: 220, angle: -16 },
  { id: 'homepod-mini-2020', x: -160, y: -325, w: 160, h: 180, angle: 0 },
  { id: 'apple-tv-4k', x: 210, y: -340, w: 190, h: 150, angle: 10 },
];

export function DevicePortal({ devices, today, onNavigate, onDetails, onEdit, renderSection }: {
  devices: PortalDevice[];
  today: string;
  onNavigate: (destination: Destination) => void;
  onDetails: () => void;
  onEdit: (id: string) => void;
  renderSection: (destination: Destination) => ReactNode;
}) {
  const track = useRef<HTMLElement>(null);
  const lastBlock = useRef<HTMLElement>(null);
  const firstYear = devices.map(d => d.purchaseDate).filter(Boolean).sort()[0]?.slice(0, 4);
  const active = devices.filter(d => d.status === '持有');
  const featured = ['ipad-pro-2020', 'iphone-14-pro', 'macbook-air', 'homepod-mini-2020', 'iphone-air-2025'].map(id => devices.find(d => d.id === id)).filter((d): d is PortalDevice => !!d);
  const stageDevices = positions.map((position, i) => ({ ...position, device: devices.find(d => d.id === position.id) || (i === 0 ? devices.find(d => d.image) : undefined) })).filter((item, index, all) => item.device?.image && all.findIndex(other => other.device?.id === item.device?.id) === index);

  useEffect(() => {
    const element = track.current;
    const last = lastBlock.current;
    if (!element || !last) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    let progress = 0;
    let end = 1;
    let knee = .8;
    let top = 0;
    let close = 1;
    let wide = .6;
    let target = 0;
    const clamp = (n: number) => Math.max(0, Math.min(1, n));
    const draw = () => {
      frame = 0;
      progress += (target - progress) * .22;
      if (Math.abs(target - progress) < .0003) progress = target;
      const story = clamp(progress / knee);
      const camera = 1 - Math.pow(1 - clamp(story / .69), 3);
      element.style.setProperty('--camera-scale', String(close + (wide - close) * camera));
      element.style.setProperty('--phone-drift', `${360 * camera}px`);
      element.style.setProperty('--camera-turn', `${-6 * (1 - camera)}deg`);
      element.style.setProperty('--field-dim', String(.68 * clamp((story - .03) / .22)));
      element.style.setProperty('--scene-light', String(clamp((progress - knee) / (1 - knee))));
      element.style.setProperty('--cue-opacity', String(1 - clamp(progress * 10)));
      if (progress !== target) frame = requestAnimationFrame(draw);
    };
    const schedule = () => {
      if (motion.matches) return;
      target = clamp((window.scrollY - top) / end);
      if (!frame) frame = requestAnimationFrame(draw);
    };
    const measure = () => {
      const viewport = window.innerHeight;
      close = Math.min(2.15, window.innerWidth / 245, viewport / 400);
      wide = Math.min(window.innerWidth / 1260, viewport / 860) * .92;
      if (motion.matches) {
        element.style.setProperty('--camera-scale', String(wide));
        element.style.setProperty('--phone-drift', '0px');
        return;
      }
      const bottom = last.offsetTop + last.offsetHeight;
      end = bottom + .75 * viewport;
      knee = bottom / end;
      element.style.height = `${end + viewport}px`;
      top = element.getBoundingClientRect().top + window.scrollY;
      schedule();
    };
    const observer = new ResizeObserver(measure);
    observer.observe(last);
    window.addEventListener('resize', measure);
    motion.addEventListener('change', measure);
    window.addEventListener('scroll', schedule, { passive: true });
    measure();
    return () => {
      observer.disconnect(); cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', measure);
      motion.removeEventListener('change', measure);
    };
  }, [featured.length, stageDevices.length]);

  return (
    <div className="journey-page">
      <section className="journey-track" ref={track} aria-label="物品与时间">
        <div className="journey-scene" aria-hidden="true">
          <div className="journey-plane">
            {stageDevices.map(({ device, x, y, w, h, angle }, i) => <div key={device!.id} className={`journey-object journey-object-${i}`} style={{ '--object-x': `${x}px`, '--object-y': `${y}px`, '--object-w': `${w}px`, '--object-h': `${h}px`, '--object-angle': `${angle}deg` } as CSSProperties}><img src={device!.image} alt="" fetchPriority={i === 0 ? 'high' : 'auto'} decoding="async" /></div>)}
          </div>
          <div className="journey-shade" />
          <div className="journey-daylight" />
          <div className="journey-first-caption"><span>{stageDevices[0]?.device?.name}</span><span>{stageDevices[0]?.device ? `${dateLabel(stageDevices[0].device.purchaseDate)} — ${stageDevices[0].device.status === '持有' ? '至今' : dateLabel(stageDevices[0].device.usageEnd)}` : ''}</span></div>
          <div className="journey-scroll-cue"><ArrowDown /><span>向下，走过时间</span></div>
        </div>
        <nav className="journey-shortcuts" aria-label="首页导航"><a href="#journey-records">使用历程</a><a href="#journey-cost">每日成本</a><button onClick={onDetails}>全部记录<ArrowUpRight /></button></nav>
        <div className="journey-content">
          <header className="journey-intro"><p>{firstYear && today ? `${firstYear} — ${today.slice(0, 4)}` : '我的物品'}</p><h1><span>我的物品。</span><span>从购入，</span><span>到今天，</span><span>每一天。</span></h1></header>
          <div className="journey-moments">
            {featured.map((device, i) => {
              const history = today ? buildCostHistory(device, today) : null;
              const days = today ? dayCount(device, today) : null;
              const net = device.purchasePrice + device.additional - (device.status === '归档' ? device.archivedPrice : 0);
              return <article ref={i === featured.length - 1 ? lastBlock : undefined} className={`journey-moment journey-moment-${i}`} key={device.id}>
                <button onClick={() => onEdit(device.id)} aria-label={`查看并编辑 ${device.name}`}><img src={device.image} alt="" /><span className="journey-moment-name">{device.name}<ArrowUpRight /></span></button>
                <p className="journey-moment-value">{i === 1 && history && !history.empty ? <>{history.current.toFixed(2)}<small> 元 / 天</small></> : <>{days === null ? '—' : days.toLocaleString('zh-CN')}<small> 天</small></>}</p>
                <p className="journey-moment-date">{dateLabel(device.purchaseDate)} — {device.status === '持有' ? '至今' : dateLabel(device.usageEnd || device.archivedDate)}</p>
                {device.status === '归档' && device.purchasePrice > 0 && <p className="journey-moment-net">净花费 ¥{net.toLocaleString('zh-CN')}</p>}
              </article>;
            })}
            {!featured.length && <article className="journey-moment journey-moment-empty" ref={lastBlock}><p>物品的故事，从这里开始。</p><button onClick={onDetails}>查看记录<ArrowUpRight /></button></article>}
          </div>
        </div>
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
