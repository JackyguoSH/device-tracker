'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { ArrowDown, ArrowUpRight, ChevronRight } from 'lucide-react';
import { CostHistory } from '@/components/cost-history';
import type { HistoryDevice } from '@/lib/cost-history';

type PortalDevice = HistoryDevice & { image: string; category: string };
type PortalDestination = 'timeline' | 'costs' | 'devices';
const dateLabel = (value: string) => value.replaceAll('-', '.');

export function DevicePortal({ devices, today, onNavigate, onDetails, onEdit, renderSection }: {
  devices: PortalDevice[];
  today: string;
  onNavigate: (destination: PortalDestination) => void;
  onDetails: () => void;
  onEdit: (id: string) => void;
  renderSection: (destination: PortalDestination) => ReactNode;
}) {
  const root = useRef<HTMLDivElement>(null);
  const hero = useRef<HTMLElement>(null);
  const active = devices.filter(device => device.status === '持有');
  const pictured = active.filter(device => device.image);
  const featured = pictured.find(device => device.id === 'iphone-14-pro') || pictured[0];
  const earliest = [...devices].filter(device => device.purchaseDate).sort((a, b) => a.purchaseDate.localeCompare(b.purchaseDate))[0];
  const longest = [...pictured].filter(device => device.purchaseDate).sort((a, b) => a.purchaseDate.localeCompare(b.purchaseDate))[0];
  const firstYear = earliest?.purchaseDate.slice(0, 4);
  const currentYear = today.slice(0, 4);

  useEffect(() => {
    const element = root.current;
    if (!element || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    element.querySelectorAll('[data-reveal]').forEach(target => observer.observe(target));
    element.classList.add('has-scroll-effects');
    let frame = 0;
    const update = () => {
      frame = 0;
      const scene = hero.current;
      if (!scene) return;
      const rect = scene.getBoundingClientRect();
      const pin = scene.firstElementChild as HTMLElement | null;
      const offset = pin ? Number.parseFloat(getComputedStyle(pin).top) || 0 : 0;
      const progress = Math.max(0, Math.min(1, (offset - rect.top) / Math.max(1, rect.height - (pin?.offsetHeight || window.innerHeight))));
      scene.style.setProperty('--hero-progress', progress.toFixed(3));
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    update();
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      element.classList.remove('has-scroll-effects');
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, []);

  const explore = () => {
    const section = document.getElementById('story-timeline');
    if (!section) return;
    const top = section.getBoundingClientRect().top + window.scrollY - 70;
    section.focus({ preventScroll: true });
    window.scrollTo({ top, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  };

  return (
    <div className="story-page" ref={root}>
      <section className="story-hero" ref={hero} aria-labelledby="story-title">
        <div className="story-hero-pin">
          <div className="story-hero-copy">
            <p className="story-eyebrow">{firstYear && currentYear ? `${firstYear} — ${currentYear}` : '我的物品'}</p>
            <h1 id="story-title"><span>我的</span><span>物品</span></h1>
            <div className="story-hero-foot">
              <p>{active.length} 件使用中<span> / </span>{devices.length - active.length} 件已归档</p>
              <button className="story-text-link" onClick={onDetails}>查看全部物品<ArrowUpRight /></button>
            </div>
          </div>
          {featured && <div className="story-hero-object">
            <button onClick={() => onEdit(featured.id)} aria-label={`查看并编辑 ${featured.name}`}>
              <img src={featured.image} alt={featured.name} fetchPriority="high" decoding="async" />
            </button>
            <div className="story-object-caption"><strong>{featured.name}</strong><span>{dateLabel(featured.purchaseDate)} — 至今</span></div>
          </div>}
          <button className="story-scroll-cue" onClick={explore} aria-label="向下探索使用历程"><ArrowDown /><span>向下探索</span></button>
        </div>
      </section>

      <section className="story-time" id="story-timeline" tabIndex={-1} aria-labelledby="story-time-title">
        <div className="story-time-intro" data-reveal>
          <p className="story-eyebrow">使用时间轴</p>
          <h2 id="story-time-title">{firstYear ? <>从 {firstYear}，<br />到今天。</> : <>从购入，<br />到今天。</>}</h2>
          {longest && <button className="story-time-object" onClick={() => onEdit(longest.id)} aria-label={`查看并编辑 ${longest.name}`}>
            <img src={longest.image} alt={longest.name} loading="lazy" />
            <span><strong>{longest.name}</strong><small>{dateLabel(longest.purchaseDate)} 购入</small></span>
          </button>}
        </div>
        <div className="story-time-chart" data-reveal>{renderSection('timeline')}</div>
      </section>

      <section className="story-cost" id="story-costs" aria-labelledby="story-cost-title">
        <div className="story-cost-inner">
          <header className="story-cost-intro" data-reveal>
            <p className="story-eyebrow">每日平均成本</p>
            <h2 id="story-cost-title">每一天，<br />花费多少。</h2>
          </header>
          <div className="story-cost-canvas" data-reveal><CostHistory devices={devices} today={today} appearance="story" /></div>
          <button className="story-text-link story-cost-link" onClick={() => onNavigate('costs')}>查看成本排名<ChevronRight /></button>
        </div>
      </section>

      <section className="story-collection" id="story-devices" aria-labelledby="story-collection-title">
        <header className="story-collection-header" data-reveal>
          <div><p className="story-eyebrow">设备与记录</p><h2 id="story-collection-title">我的设备。</h2></div>
          <button className="story-text-link" onClick={onDetails}>全部明细<ArrowUpRight /></button>
        </header>
        <div className="story-collection-content" data-reveal>{renderSection('devices')}</div>
      </section>
    </div>
  );
}
