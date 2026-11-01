'use client';

import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { ArrowDown, ArrowUpRight, ArrowRight } from 'lucide-react';
import { CostHistory } from '@/components/cost-history';
import type { HistoryDevice } from '@/lib/cost-history';

type PortalDevice = HistoryDevice & { image: string; category: string };
type Destination = 'timeline' | 'costs' | 'devices';
const dateLabel = (value: string) => value.replaceAll('-', '.');
// Sizes use the visible silhouette, allowing for each photo's transparent padding
// and front/back composite. They convey relative physical size, not millimetres.
const positions = [
  { id: 'iphone-14-pro', mx: 0, my: 0, x: 0, y: 0, w: 160, h: 220, angle: -8, label: false },
  { id: 'macbook-air', mx: -100, my: -330, x: -430, y: -35, w: 460, h: 350, angle: 12, label: false },
  { id: 'ipad-pro-2020', mx: 100, my: 320, x: 430, y: 10, w: 360, h: 390, angle: -12, label: false },
  { id: 'airpods-pro-2', mx: 235, my: -70, x: -380, y: 280, w: 94, h: 104, angle: 10, label: true },
  { id: 'apple-watch-s7', mx: -230, my: 590, x: -70, y: -270, w: 102, h: 132, angle: -16, label: false },
  { id: 'homepod-mini-2020', mx: -230, my: -60, x: -320, y: -320, w: 138, h: 132, angle: 0, label: true },
  { id: 'homepod-mini-2024', mx: 200, my: 650, x: 500, y: 340, w: 138, h: 132, angle: 0, label: true },
  { id: 'apple-tv-4k', mx: 210, my: -350, x: 410, y: -290, w: 172, h: 172, angle: 10, label: false },
  { id: 'iphone-air-2025', mx: -180, my: 220, x: 170, y: 330, w: 142, h: 180, angle: 7, label: true },
  { id: 'airpods-pro', mx: -40, my: 700, x: 120, y: -315, w: 92, h: 104, angle: -6, label: true },
];

export function DevicePortal({ devices, today, onNavigate, onDetails, renderSection }: {
  devices: PortalDevice[];
  today: string;
  onNavigate: (destination: Destination) => void;
  onDetails: () => void;
  renderSection: (destination: Destination) => ReactNode;
}) {
  const track = useRef<HTMLElement>(null);
  const plane = useRef<HTMLDivElement>(null);
  const editorial = useRef<HTMLDivElement>(null);
  const notes = useRef<HTMLDivElement>(null);
  const active = devices.filter(d => d.status === '持有');
  const stageDevices = positions.map((position, i) => ({ ...position, device: devices.find(d => d.id === position.id) || (i === 0 ? devices.find(d => d.image) : undefined) })).filter((item, index, all) => item.device?.image && all.findIndex(other => other.device?.id === item.device?.id) === index);

  useEffect(() => {
    const element = track.current;
    const scene = plane.current;
    if (!element || !scene) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    let end = 1;
    let top = 0;
    let close = 1;
    let wide = .6;
    let previous = -1;
    let labelsVisible = false;
    const clamp = (n: number) => Math.max(0, Math.min(1, n));
    const smooth = (n: number) => { const t = clamp(n); return t * t * (3 - 2 * t); };
    const draw = () => {
      frame = 0;
      const progress = motion.matches ? 0 : clamp((window.scrollY - top) / end);
      if (progress === previous) return;
      previous = progress;
      const camera = smooth(progress);
      const scale = close * Math.pow(wide / close, camera);
      // Only compositor properties change while scrolling. No inherited CSS
      // variables, font sizes, filters or clipping geometry are updated here.
      scene.style.transform = `translateZ(0) scale(${scale}) rotate(-6deg)`;
      if (editorial.current) editorial.current.style.opacity = String(smooth((progress - .4) / .35));
      if (notes.current) notes.current.style.opacity = String(1 - smooth(progress / .18));
      const showLabels = progress > .6;
      if (showLabels !== labelsVisible) {
        labelsVisible = showLabels;
        scene.classList.toggle('is-wide', showLabels);
      }
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(draw); };
    const measure = () => {
      close = Math.min(2.15, window.innerWidth / 245, window.innerHeight / 400) * (205 / 160);
      wide = Math.min(window.innerWidth / 1500, (window.innerHeight - 104) / 1000) * .9;
      const portrait = window.innerWidth <= 609 || window.innerHeight > window.innerWidth;
      if (portrait) wide = Math.min(.47, (window.innerWidth - 56) / 880, window.innerHeight / 1250);
      if (motion.matches) close = Math.min(close, window.innerHeight * .6 / 220);
      // Caption sizes depend on the viewport, never on the current scroll scale.
      scene.style.setProperty('--label-size', `${Math.max(13, 9 / wide)}px`);
      scene.style.setProperty('--label-small-size', `${Math.max(10, 7 / wide)}px`);
      end = Math.max(1, element.offsetHeight - window.innerHeight);
      top = element.getBoundingClientRect().top + window.scrollY;
      previous = -1;
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
        <h1 className="sr-only">物历 · kept</h1>
        <div className="journey-scene" aria-hidden="true">
          <div className="journey-set">
            <div className="journey-plane" ref={plane}>
              <svg className="journey-illustration" viewBox="0 0 1200 800" fill="none" aria-hidden="true">
                <g className="journey-clock">
                  <circle cx="600" cy="400" r="248" strokeDasharray="1180 380" transform="rotate(-92 600 400)" />
                  <circle cx="600" cy="400" r="265" strokeDasharray="1 13" />
                  {Array.from({ length: 12 }, (_, i) => <path key={i} d="M600 161V175" transform={`rotate(${i * 30} 600 400)`} />)}
                  <path className="journey-clock-accent" d="M434 216A248 248 0 0 1 648 157" />
                  <path d="M600 400L600 251M600 400L704 460" className="journey-clock-hands" />
                </g>
                <g className="journey-cable">
                  <path d="M40 440C100 412 154 435 166 490C181 557 103 591 93 548C81 498 184 521 245 548C309 576 310 697 426 729C533 758 655 702 762 721C876 741 985 725 1060 676" />
                  <path d="M1060 676l28-17 7 11-28 17zM1086 663l14-9 4 6-14 9M1089 667l14-9" />
                </g>
              </svg>
            {stageDevices.map(({ device, x, y, w, h, angle, label, mx, my }, i) => <div key={device!.id} className={`journey-object journey-object-${i}`} data-device-id={device!.id} title={device!.name} style={{ '--object-x': `${x}px`, '--object-y': `${y}px`, '--object-mobile-x': `${mx}px`, '--object-mobile-y': `${my}px`, '--object-w': `${w}px`, '--object-h': `${h}px`, '--object-angle': `${angle}deg` } as CSSProperties}><img src={device!.image} alt="" fetchPriority={i === 0 ? 'high' : 'auto'} decoding="async" />{label && <span className="journey-object-label">{device!.name.replace('HomePod mini_', 'HomePod mini · ')}{device!.status === '归档' && <small>已归档</small>}</span>}</div>)}
            </div>
          </div>
          <div className="journey-editorial" ref={editorial} aria-hidden="true">
            <div className="journey-editorial-title">物历<span className="kept-wordmark"> · kept</span></div>
          </div>
          <div className="journey-intro-notes" ref={notes}>
          <div className="journey-first-caption"><span>{stageDevices[0]?.device?.name}</span><span>{stageDevices[0]?.device ? `${dateLabel(stageDevices[0].device.purchaseDate)} — ${stageDevices[0].device.status === '持有' ? '至今' : dateLabel(stageDevices[0].device.usageEnd)}` : ''}</span></div>
          <div className="journey-scroll-cue"><ArrowDown /><span>向下，走过时间</span></div>
          </div>
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
          <div className="journey-bottom"><span>物历 · kept</span><button className="journey-link" onClick={onDetails}>管理所有设备<ArrowUpRight /></button></div>
        </div>
      </section>
    </div>
  );
}
