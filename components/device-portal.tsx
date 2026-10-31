'use client';

import type { ReactNode } from 'react';
import { Minus, Plus } from 'lucide-react';
import type { HistoryDevice } from '@/lib/cost-history';

type PortalDevice = HistoryDevice & { image: string; category: string };
type PortalDestination = 'timeline' | 'costs' | 'devices';
const sections: { id: PortalDestination; label: string }[] = [
  { id: 'timeline', label: '使用时间轴' },
  { id: 'costs', label: '每日平均成本' },
  { id: 'devices', label: '我的设备' },
];

export function DevicePortal({ devices, activeSection, onNavigate, onEdit, onAdd, renderSection }: {
  devices: PortalDevice[];
  activeSection: string | null;
  onNavigate: (destination: PortalDestination) => void;
  onEdit: (id: string) => void;
  onAdd: () => void;
  renderSection: (destination: PortalDestination) => ReactNode;
}) {
  const active = devices.filter(device => device.status === '持有');
  const pictured = active.filter(device => device.image);
  const featured = ['电脑', '平板', '手机', '穿戴']
    .map(category => pictured.find(device => device.category === category))
    .filter((device): device is PortalDevice => Boolean(device));
  if (!featured.length) featured.push(...pictured.slice(0, 4));

  return (
    <div className="portal-view">
      <section className="portal-introduction" aria-labelledby="portal-title">
        <div className="portal-masthead">
          <h1 id="portal-title">我的物品</h1>
          <p><span>{active.length} 件使用中</span><span>{devices.length - active.length} 件已归档</span></p>
        </div>
        <div className="portal-shelf">
          {featured.map(device => (
            <button className="portal-shelf-item" key={device.id} onClick={() => onEdit(device.id)} aria-label={`查看并编辑 ${device.name}`}>
              <span className="portal-shelf-image"><img src={device.image} alt="" /></span>
              <span>{device.name}</span>
            </button>
          ))}
          {!featured.length && <button className="portal-shelf-add" onClick={onAdd}><Plus />添加物品</button>}
        </div>
      </section>

      <div className="portal-sections">
        {sections.map(section => {
          const open = activeSection === section.id;
          return (
            <section className={`portal-fold ${open ? 'is-open' : ''}`} id={`fold-${section.id}`} key={section.id}>
              <h2 className="portal-fold-heading">
                <button id={`fold-button-${section.id}`} aria-expanded={open} aria-controls={`fold-panel-${section.id}`} onClick={() => onNavigate(section.id)}>
                  <span>{section.label}</span>{open ? <Minus /> : <Plus />}
                </button>
              </h2>
              <div id={`fold-panel-${section.id}`} role="region" aria-labelledby={`fold-button-${section.id}`} hidden={!open}>
                {open && renderSection(section.id)}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
