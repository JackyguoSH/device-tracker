'use client';

import { useRef, useState, type ReactNode } from 'react';
import { ArrowUpRight, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { CostHistory } from '@/components/cost-history';
import { buildCostHistory, HISTORY_DAY, type HistoryDevice } from '@/lib/cost-history';

type PortalDevice = HistoryDevice & { image: string; category: string };
type Destination = 'timeline' | 'costs' | 'devices';
export type PortalScene = 'objects' | 'timeline' | 'costs';
const dateLabel = (value: string) => value.replaceAll('-', '.');
const money = (value: number) => `¥${value.toLocaleString('zh-CN', { maximumFractionDigits: 2 })}`;

export function DevicePortal({ devices, today, scene, onSceneChange, onNavigate, onDetails, onEdit, renderSection }: {
  devices: PortalDevice[];
  today: string;
  scene: PortalScene;
  onSceneChange: (scene: PortalScene) => void;
  onNavigate: (destination: Destination) => void;
  onDetails: () => void;
  onEdit: (id: string) => void;
  renderSection: (destination: Destination) => ReactNode;
}) {
  const [deviceId, setDeviceId] = useState('iphone-14-pro');
  const [status, setStatus] = useState<'全部' | '持有' | '归档'>('全部');
  const art = useRef<HTMLButtonElement>(null);
  const visible = devices.filter(device => status === '全部' || device.status === status);
  const device = visible.find(item => item.id === deviceId) || visible[0];
  const index = visible.findIndex(item => item.id === device?.id);
  const next = visible.length > 1 ? visible[(index + 1) % visible.length] : null;
  const history = device && today ? buildCostHistory(device, today) : null;
  const days = device && today ? Math.max(0, Math.round((Date.parse(`${device.usageEnd || today}T00:00:00Z`) - Date.parse(`${device.purchaseDate}T00:00:00Z`)) / HISTORY_DAY)) : null;
  const select = (id: string) => { setDeviceId(id); resetTilt(); };
  const resetTilt = () => { art.current?.style.setProperty('--tilt-x', '0deg'); art.current?.style.setProperty('--tilt-y', '0deg'); };
  const switchScene = (value: PortalScene) => { onSceneChange(value); window.scrollTo({ top: 0, behavior: 'instant' }); };

  return (
    <div className={`exhibit-page exhibit-${scene}`}>
      <nav className="exhibit-navigation" aria-label="探索我的物品">
        <div className="exhibit-tabs" role="tablist" aria-label="展示场景">
          {([['objects', '物品'], ['timeline', '使用历程'], ['costs', '每日成本']] as const).map(([id, label]) => <button key={id} id={`exhibit-tab-${id}`} role="tab" aria-selected={scene === id} aria-controls="exhibit-panel" onClick={() => switchScene(id)}>{label}</button>)}
        </div>
        <button className="exhibit-records" onClick={onDetails}>全部记录<ArrowUpRight /></button>
      </nav>
      <div id="exhibit-panel" role="tabpanel" aria-labelledby={`exhibit-tab-${scene}`}>
        {scene === 'objects' ? <section className="exhibit-stage" aria-label="设备展览">
          <div className="exhibit-wash" aria-hidden="true" />
          <aside className="exhibit-index" aria-label="选择设备">
            <div className="exhibit-status" role="group" aria-label="筛选设备状态">
              {(['全部', '持有', '归档'] as const).map(value => <button key={value} aria-pressed={status === value} onClick={() => setStatus(value)}>{value === '持有' ? '使用中' : value === '归档' ? '已归档' : '全部'}</button>)}
            </div>
            <div className="exhibit-device-list">{visible.map((item, i) => <button key={item.id} aria-pressed={device?.id === item.id} onClick={() => select(item.id)}><span className="exhibit-device-number">{String(i + 1).padStart(2, '0')}</span><span>{item.name}</span></button>)}</div>
          </aside>
          {device ? <>
            <div className="exhibit-art-space">
              <span className="exhibit-edition">{device.category} <span> / </span> {device.status === '持有' ? '使用中' : '已归档'}</span>
              <button ref={art} className={`exhibit-aperture ${device.id === 'iphone-air' ? 'exhibit-air' : ''}`} aria-label={`查看并编辑 ${device.name}`} onClick={() => onEdit(device.id)} onPointerMove={event => {
                if (event.pointerType !== 'mouse' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
                const rect = event.currentTarget.getBoundingClientRect();
                event.currentTarget.style.setProperty('--tilt-y', `${((event.clientX - rect.left) / rect.width - .5) * 10}deg`);
                event.currentTarget.style.setProperty('--tilt-x', `${((event.clientY - rect.top) / rect.height - .5) * -8}deg`);
              }} onPointerLeave={resetTilt}>
                <div className="exhibit-art" key={device.id}>{device.image ? <img src={device.image} alt={device.name} fetchPriority="high" /> : <span className="exhibit-no-image">{device.name}</span>}</div>
                <span className="exhibit-open"><ArrowUpRight /></span>
              </button>
              <span className="exhibit-date" key={`date-${device.id}`}>{dateLabel(device.purchaseDate)} — {device.status === '持有' ? '至今' : dateLabel(device.usageEnd || device.archivedDate)}</span>
            </div>
            <div className="exhibit-next">
              {next && <button onClick={() => select(next.id)} aria-label={`下一件：${next.name}`}><span className="exhibit-next-label">下一件<ArrowRight /></span><span className="exhibit-next-window">{next.image ? <img src={next.image} alt="" /> : next.name}</span><span className="exhibit-next-name">{next.name}</span></button>}
            </div>
            <div className="exhibit-title" key={`title-${device.id}`} aria-live="polite"><span>{String(index + 1).padStart(2, '0')} / {String(visible.length).padStart(2, '0')}</span><h1>{device.name}</h1><button onClick={() => switchScene('costs')}>查看这件物品的成本曲线<ArrowUpRight /></button></div>
            <dl className="exhibit-facts" key={`facts-${device.id}`}>
              <div><dt>{device.status === '持有' ? '已使用' : '共使用'}</dt><dd>{days === null || !Number.isFinite(days) ? '—' : <>{days.toLocaleString('zh-CN')}<small> 天</small></>}</dd></div>
              <div><dt>净投入</dt><dd>{device.purchasePrice === 0 && device.additional === 0 ? '待补充' : money(device.purchasePrice + device.additional - (device.status === '归档' ? device.archivedPrice : 0))}</dd></div>
              <div><dt>平均每天</dt><dd>{history && !history.empty ? money(history.current) : '—'}</dd></div>
            </dl>
            <div className="exhibit-mobile-controls"><button aria-label="上一件设备" disabled={visible.length < 2} onClick={() => select(visible[(index - 1 + visible.length) % visible.length].id)}><ChevronLeft /></button><span>{String(index + 1).padStart(2, '0')} <i>/ {String(visible.length).padStart(2, '0')}</i></span><button aria-label="下一件设备" disabled={!next} onClick={() => next && select(next.id)}><ChevronRight /></button></div>
          </> : <div className="exhibit-empty">暂无{status === '归档' ? '已归档' : '使用中'}物品<button onClick={() => setStatus('全部')}>查看全部</button></div>}
        </section> : scene === 'timeline' ? <section className="exhibit-data-scene exhibit-time-scene" key="timeline">
          <header className="exhibit-chapter"><div><p>使用时间轴</p><h1>时间，留下痕迹。</h1></div><span>{today ? `${devices.map(d => d.purchaseDate).filter(Boolean).sort()[0]?.slice(0,4) || ''} — ${today.slice(0,4)}` : ''}</span></header>
          <div className="exhibit-timeline">{renderSection('timeline')}</div>
          <button className="exhibit-scene-link" onClick={() => switchScene('costs')}>再看看，每一天的花费<ArrowRight /></button>
        </section> : <section className="exhibit-data-scene exhibit-cost-scene" key="costs">
          <header className="exhibit-chapter"><div><p>每日平均成本</p><h1>越用，越值得。</h1></div><button className="exhibit-scene-link" onClick={() => onNavigate('costs')}>成本排名<ArrowUpRight /></button></header>
          <div className="story-cost"><CostHistory devices={devices} today={today} appearance="story" initialDeviceId={device?.id} /></div>
        </section>}
      </div>
    </div>
  );
}
