'use client';

import { ChevronRight, Plus } from 'lucide-react';
import { buildCostHistory, type HistoryDevice } from '@/lib/cost-history';

type PortalDevice = HistoryDevice & { image: string; category: string };
type PortalDestination = 'timeline' | 'costs' | 'devices';

export function DevicePortal({ devices, today, onNavigate, onEdit, onAdd }: {
  devices: PortalDevice[];
  today: string;
  onNavigate: (destination: PortalDestination) => void;
  onEdit: (id: string) => void;
  onAdd: () => void;
}) {
  const active = devices.filter(device => device.status === '持有');
  const pictured = active.filter(device => device.image);
  const hero = [
    { slot: 'computer', device: pictured.find(device => device.category === '电脑') },
    { slot: 'tablet', device: pictured.find(device => device.category === '平板') },
    { slot: 'phone', device: pictured.find(device => device.category === '手机') },
    { slot: 'audio', device: pictured.find(device => /airpods/i.test(device.name)) || pictured.find(device => device.category === '影音') },
  ].filter(item => item.device);
  if (!hero.length && pictured.length) hero.push({ slot: 'phone', device: pictured[0] });
  const costDevice = active.find(device => device.id === 'iphone-14-pro') || active.find(device => device.purchasePrice > 0);
  const history = costDevice ? buildCostHistory(costDevice, today) : null;
  const costPoints = history && !history.empty ? history.points.filter(point => point.date >= history.end - 365 * 86400000) : [];
  const low = Math.min(...costPoints.map(point => point.daily));
  const high = Math.max(...costPoints.map(point => point.daily));
  const costPath = costPoints.map((point, index) => {
    const x = 4 + index / Math.max(1, costPoints.length - 1) * 232;
    const y = high === low ? 40 : 72 - (point.daily - low) / (high - low) * 64;
    return `${index ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const timelineDevices = active.filter(device => device.purchaseDate).sort((a, b) => a.purchaseDate.localeCompare(b.purchaseDate)).slice(0, 3);
  const timelineStart = Math.min(...timelineDevices.map(device => Date.parse(device.purchaseDate)));
  const timelineEnd = Date.parse(today);

  return (
    <div className="portal-view">
      <section className="portal-hero" aria-labelledby="portal-title">
        <div className="portal-intro">
          <h1 id="portal-title">我的物品</h1>
          <p>{active.length} 件使用中</p>
        </div>
        <div className="portal-collection" data-count={hero.length}>
          {hero.map(({ slot, device }) => device && (
            <button className={`portal-product portal-product-${slot}`} key={device.id} onClick={() => onEdit(device.id)} aria-label={`查看并编辑 ${device.name}`} title={device.name}>
              <img src={device.image} alt={device.name} />
            </button>
          ))}
          {!hero.length && <button className="portal-add" onClick={onAdd}><Plus />添加物品</button>}
        </div>
      </section>

      <nav className="portal-entries" aria-label="查看物品">
        <button className="portal-entry" onClick={() => onNavigate('timeline')} aria-label="使用时间轴">
          <span className="portal-entry-heading"><span>使用时间轴</span><ChevronRight /></span>
          <span className="portal-preview portal-timeline-preview" aria-hidden="true">
            <svg viewBox="0 0 240 80" preserveAspectRatio="none">
              {Number.isFinite(timelineEnd) && timelineDevices.map((device, index) => {
                const left = 4 + (Date.parse(device.purchaseDate) - timelineStart) / Math.max(1, timelineEnd - timelineStart) * 232;
                return <line key={device.id} x1={left} x2={236} y1={16 + index * 24} y2={16 + index * 24} stroke="currentColor" strokeWidth={5} strokeLinecap="round" opacity={1 - index * 0.3} />;
              })}
            </svg>
          </span>
        </button>
        <button className="portal-entry" onClick={() => onNavigate('costs')} aria-label="每日成本">
          <span className="portal-entry-heading"><span>每日成本</span><ChevronRight /></span>
          <span className="portal-preview portal-cost-preview" aria-hidden="true">
            <svg viewBox="0 0 240 80" preserveAspectRatio="none"><path d="M0 79H240" className="portal-preview-baseline" />{costPoints.length > 0 && <path d={costPath} className="portal-preview-curve" />}</svg>
          </span>
        </button>
        <button className="portal-entry" onClick={() => onNavigate('devices')} aria-label="我的设备">
          <span className="portal-entry-heading"><span>我的设备</span><ChevronRight /></span>
          <span className="portal-preview portal-devices-preview" aria-hidden="true">
            {hero.slice(0, 3).map(({ device }) => device && <img key={device.id} src={device.image} alt="" />)}
          </span>
        </button>
      </nav>
    </div>
  );
}
