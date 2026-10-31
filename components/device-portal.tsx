'use client';

import type { ReactNode } from 'react';
import { Minus, Plus } from 'lucide-react';
import type { HistoryDevice } from '@/lib/cost-history';

type PortalDevice = Pick<HistoryDevice, 'status'>;
type PortalDestination = 'timeline' | 'costs' | 'devices';
const sections: { id: PortalDestination; label: string }[] = [
  { id: 'timeline', label: '使用时间轴' },
  { id: 'costs', label: '每日平均成本' },
  { id: 'devices', label: '我的设备' },
];

export function DevicePortal({ devices, activeSection, onNavigate, renderSection }: {
  devices: PortalDevice[];
  activeSection: string | null;
  onNavigate: (destination: PortalDestination) => void;
  renderSection: (destination: PortalDestination) => ReactNode;
}) {
  const active = devices.filter(device => device.status === '持有');

  return (
    <div className="portal-view">
      <section className="portal-introduction" aria-labelledby="portal-title">
        <figure className="portal-cover">
          <img src="/editorial/daily-objects-v1.webp" width={1536} height={1024} fetchPriority="high" decoding="async" alt="自然光下的银色电脑、手机与充电线静物横幅" />
        </figure>
        <div className="portal-masthead">
          <h1 id="portal-title">我的物品</h1>
          <p><span>{active.length} 件使用中</span><span>{devices.length - active.length} 件已归档</span></p>
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
