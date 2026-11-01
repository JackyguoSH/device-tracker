'use client';

import { FormEvent, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  Archive,
  ChevronLeft,
  ChevronRight,
  Download,
  Minus,
  Moon,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Sun,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { CostHistory } from '@/components/cost-history';
import { DevicePortal } from '@/components/device-portal';
import useEmblaCarousel from 'embla-carousel-react';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';

type DeviceStatus = '持有' | '归档';
type DeviceCategory = '电脑' | '手机' | '平板' | '影音' | '穿戴' | '其他';
type Device = {
  id: string;
  name: string;
  status: DeviceStatus;
  category: DeviceCategory;
  purchasePrice: number;
  purchaseDate: string;
  channel: string;
  warrantyEnd: string;
  notes: string;
  tags: string;
  additional: number;
  additionalDetail: string;
  archivedPrice: number;
  archivedDate: string;
  archivedWay: string;
  archivedThought: string;
  photo?: string;
};

const iphoneAirDevice: Device = {
  id: 'iphone-air-2025',
  name: 'iPhone Air',
  status: '归档',
  category: '手机',
  purchasePrice: 3795,
  purchaseDate: '2025-12-19',
  channel: '',
  warrantyEnd: '',
  notes: '2026年1月23日售出',
  tags: '深空黑色',
  additional: 0,
  additionalDetail: '',
  archivedPrice: 3690,
  archivedDate: '2026-01-23',
  archivedWay: '已出售',
  archivedThought: '',
};

const initialDevices: Device[] = [
  iphoneAirDevice,
  {
    id: 'apple-tv-4k',
    name: 'Apple TV 4K',
    status: '持有',
    category: '影音',
    purchasePrice: 1250,
    purchaseDate: '2022-11-13',
    channel: '',
    warrantyEnd: '',
    notes: '',
    tags: '',
    additional: 0,
    additionalDetail: '',
    archivedPrice: 0,
    archivedDate: '',
    archivedWay: '',
    archivedThought: '',
  },
  {
    id: 'airpods-pro-2',
    name: 'AirPods Pro 2',
    status: '持有',
    category: '穿戴',
    purchasePrice: 0,
    purchaseDate: '2024-01-30',
    channel: '',
    warrantyEnd: '',
    notes: '',
    tags: '',
    additional: 348,
    additionalDetail: 'AppleCare+: ¥348.00 (2026-04-06)',
    archivedPrice: 0,
    archivedDate: '',
    archivedWay: '',
    archivedThought: '',
  },
  {
    id: 'homepod-mini-2024',
    name: 'HomePod mini_R',
    status: '持有',
    category: '影音',
    purchasePrice: 0,
    purchaseDate: '2024-02-02',
    channel: '',
    warrantyEnd: '',
    notes: '价格待补充',
    tags: '',
    additional: 0,
    additionalDetail: '',
    archivedPrice: 0,
    archivedDate: '',
    archivedWay: '',
    archivedThought: '',
  },
  {
    id: 'apple-watch-s7',
    name: 'Apple Watch S7',
    status: '持有',
    category: '穿戴',
    purchasePrice: 3999,
    purchaseDate: '2022-03-07',
    channel: '',
    warrantyEnd: '',
    notes: '',
    tags: '',
    additional: 648,
    additionalDetail: 'AppleCare+: ¥648.00 (2022-03-07)',
    archivedPrice: 0,
    archivedDate: '',
    archivedWay: '',
    archivedThought: '',
  },
  {
    id: 'ipad-pro-2020',
    name: 'iPad Pro 2020',
    status: '持有',
    category: '平板',
    purchasePrice: 6888,
    purchaseDate: '2020-04-07',
    channel: '',
    warrantyEnd: '',
    notes: '',
    tags: '',
    additional: 5585,
    additionalDetail:
      'Apple Pencil: ¥911.00 (2020-04-07); 智能双面夹: ¥549.00 (2022-07-03); AppleCare+: ¥548.00 (2022-05-31); AppleCare（2年）: ¥999.00 (2020-04-07); Magic Keyboard: ¥2399.00 (2020-05-14); Apple Pencil 笔尖: ¥179.00 (2023-04-06)',
    archivedPrice: 0,
    archivedDate: '',
    archivedWay: '',
    archivedThought: '',
  },
  {
    id: 'airpods-pro',
    name: 'AirPods Pro',
    status: '归档',
    category: '穿戴',
    purchasePrice: 1999,
    purchaseDate: '2020-01-31',
    channel: '',
    warrantyEnd: '',
    notes: '',
    tags: '',
    additional: 0,
    additionalDetail: '',
    archivedPrice: 590,
    archivedDate: '2025-02-08',
    archivedWay: '已出售',
    archivedThought: '',
  },
  {
    id: 'homepod-mini-2020',
    name: 'HomePod mini_L',
    status: '持有',
    category: '影音',
    purchasePrice: 749,
    purchaseDate: '2020-12-11',
    channel: '',
    warrantyEnd: '',
    notes: '',
    tags: '',
    additional: 0,
    additionalDetail: '',
    archivedPrice: 0,
    archivedDate: '',
    archivedWay: '',
    archivedThought: '',
  },
  {
    id: 'macbook-air',
    name: 'MacBook Air',
    status: '持有',
    category: '电脑',
    purchasePrice: 9113,
    purchaseDate: '2021-06-26',
    channel: '',
    warrantyEnd: '',
    notes: '',
    tags: '',
    additional: 1555,
    additionalDetail:
      'AppleCare+: ¥1061.00 (2021-06-26); Magic Mouse 2: ¥494.00 (2021-06-26)',
    archivedPrice: 0,
    archivedDate: '',
    archivedWay: '',
    archivedThought: '',
  },
  {
    id: 'iphone-14-pro',
    name: 'iPhone 14 Pro',
    status: '持有',
    category: '手机',
    purchasePrice: 8899,
    purchaseDate: '2022-09-16',
    channel: '',
    warrantyEnd: '',
    notes: '',
    tags: '',
    additional: 4240,
    additionalDetail:
      'AppleCare+: ¥848.00（2022–2025，每年续保）; AppleCare+: ¥848.00 (2026-09-17)',
    archivedPrice: 0,
    archivedDate: '',
    archivedWay: '',
    archivedThought: '',
  },
];

function localDate() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
}

const emptyDevice: Device = {
  id: '',
  name: '',
  status: '持有',
  category: '其他',
  purchasePrice: 0,
  purchaseDate: localDate(),
  channel: '',
  warrantyEnd: '',
  notes: '',
  tags: '',
  additional: 0,
  additionalDetail: '',
  archivedPrice: 0,
  archivedDate: '',
  archivedWay: '',
  archivedThought: '',
};
const money = new Intl.NumberFormat('zh-CN', {
  style: 'currency',
  currency: 'CNY',
  maximumFractionDigits: 0,
});
const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});
const decimal = new Intl.NumberFormat('zh-CN', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
function getCategory(name: string): DeviceCategory {
  const lower = name.toLowerCase();
  if (lower.includes('mac')) return '电脑';
  if (lower.includes('iphone')) return '手机';
  if (lower.includes('ipad')) return '平板';
  if (lower.includes('watch') || lower.includes('airpods')) return '穿戴';
  if (lower.includes('homepod') || lower.includes('tv')) return '影音';
  return '其他';
}
function getProductImage(device: Device) {
  if (device.photo) return device.photo;
  const name = device.name.toLowerCase();
  if (name.includes('apple tv'))
    return '/products/apple-tv-4k-2022-alpha-v3.png';
  if (name.includes('airpods pro 2'))
    return '/products/airpods-pro-2-usbc-alpha-v3.png';
  if (name.includes('airpods pro'))
    return '/products/airpods-pro-1-alpha-v3.png';
  if (name.includes('homepod mini'))
    return '/products/homepod-mini-white-alpha-v3.png';
  if (name.includes('watch')) return '/products/apple-watch-s7-alpha-v3.png';
  if (name.includes('ipad pro')) return '/products/ipad-pro-2020-alpha-v3.png';
  if (name.includes('macbook air'))
    return '/products/macbook-air-m1-silver-alpha-v3.png';
  if (name.includes('iphone air'))
    return '/products/iphone-air-space-black-alpha-v2.png';
  if (name.includes('iphone 14 pro'))
    return '/products/iphone-14-pro-silver-alpha-v3.png';
  return '';
}

async function compressPhoto(file: File) {
  const image = await createImageBitmap(file);
  const scale = Math.min(1, 1200 / Math.max(image.width, image.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(image.width * scale);
  canvas.height = Math.round(image.height * scale);
  const context = canvas.getContext('2d');
  if (!context) throw new Error('无法处理图片');
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  image.close();
  return canvas.toDataURL('image/jpeg', 0.86);
}
function ageInDays(date: string, referenceDate: string) {
  if (!date || !referenceDate) return 0;
  return Math.max(
    0,
    Math.floor(
      (new Date(`${referenceDate}T00:00:00`).getTime() -
        new Date(`${date}T00:00:00`).getTime()) /
        86400000,
    ),
  );
}
function ageLabel(date: string, referenceDate: string) {
  if (!date) return '日期待补充';
  if (!referenceDate) return '—';
  const days = ageInDays(date, referenceDate);
  const years = Math.floor(days / 365);
  const months = Math.floor((days % 365) / 30);
  if (years) return `${years} 年 ${months} 个月`;
  if (months) return `${months} 个月`;
  return `${days} 天`;
}
function deviceNetCost(device: Device) {
  return (
    device.purchasePrice +
    device.additional -
    (device.status === '归档' ? device.archivedPrice : 0)
  );
}
function deviceDailyCost(device: Device, referenceDate: string) {
  if (!referenceDate || !device.purchaseDate) return 0;
  const endDate =
    device.status === '归档' && device.archivedDate
      ? device.archivedDate
      : referenceDate;
  return (
    deviceNetCost(device) / Math.max(1, ageInDays(device.purchaseDate, endDate))
  );
}
function csvEscape(value: string | number) {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}
function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (char === '"' && quoted && text[i + 1] === '"') {
      cell += '"';
      i += 1;
    } else if (char === '"') quoted = !quoted;
    else if (char === ',' && !quoted) {
      row.push(cell);
      cell = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[i + 1] === '\n') i += 1;
      row.push(cell);
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = '';
    } else cell += char;
  }
  row.push(cell);
  if (row.some(Boolean)) rows.push(row);
  return rows;
}
function fromCsv(text: string): Device[] {
  const rows = parseCsv(text.replace(/^\uFEFF/, ''));
  const headers = rows[0] || [];
  const value = (row: string[], key: string) => row[headers.indexOf(key)] || '';
  return rows.slice(1).map((row, index) => {
    const name = value(row, '名称') || `未命名设备 ${index + 1}`;
    return {
      id: `${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}-${index}`,
      name,
      status: value(row, '状态') === '归档' ? '归档' : '持有',
      category: getCategory(name),
      purchasePrice: Number(value(row, '持有价格')) || 0,
      purchaseDate: value(row, '持有日期'),
      channel: value(row, '购买渠道'),
      warrantyEnd: value(row, '保修截止'),
      notes: value(row, '备注'),
      tags: value(row, '标签'),
      additional: Number(value(row, '追加投入总额')) || 0,
      additionalDetail: value(row, '追加投入明细'),
      archivedPrice: Number(value(row, '归档价格')) || 0,
      archivedDate: value(row, '归档日期'),
      archivedWay: value(row, '归档方式'),
      archivedThought: value(row, '归档感想'),
    };
  });
}

function chartRnd(i: number, k: number) {
  return Math.abs(((i * 73856093) ^ (k * 19349663)) % 1000) / 1000;
}

function TickRowsChart({
  data,
}: {
  data: { category: DeviceCategory; value: number; share: number }[];
}) {
  const [replay, setReplay] = useState(0);
  const maxValue = Math.max(1, ...data.map((item) => item.value));
  const unit = 500;
  const x0 = 112;
  const chartWidth = 322;
  const px = chartWidth / (maxValue / unit);
  return (
    <button
      className="tick-chart-button"
      onClick={() => setReplay((current) => current + 1)}
      aria-label="重播投入分布图动画"
      title="点击重播"
    >
      <svg
        key={replay}
        className="tick-chart"
        viewBox="0 0 520 250"
        role="img"
        aria-label="各品类当前投入的横向刻度比较"
      >
        {data.map((item, rowIndex) => {
          const y = 34 + rowIndex * 43;
          const fullTicks = Math.floor(item.value / unit);
          const remainder = (item.value % unit) / unit;
          return (
            <g key={item.category}>
              <text className="tick-label" x="96" y={y + 4} textAnchor="end">
                {item.category}
              </text>
              <line
                className="tick-guide"
                x1={x0}
                y1={y + 10}
                x2={x0 + chartWidth}
                y2={y + 10}
              />
              {Array.from({ length: fullTicks }, (_, tickIndex) => {
                const x = x0 + tickIndex * px + px / 2;
                const height = 10 + chartRnd(tickIndex + 1, rowIndex + 2) * 7;
                return (
                  <g key={tickIndex}>
                    <line
                      className="chart-tick"
                      x1={x}
                      y1={y + 10}
                      x2={x}
                      y2={y + 10 - height}
                      style={{
                        animationDelay: `${rowIndex * 70 + tickIndex * 12}ms`,
                      }}
                    />
                    {tickIndex % 5 === 4 && (
                      <circle
                        className="chart-fifth"
                        cx={x}
                        cy={y + 15}
                        r="1.2"
                      />
                    )}
                  </g>
                );
              })}
              {remainder > 0.02 && (
                <line
                  className="chart-tick partial"
                  x1={x0 + (fullTicks + remainder) * px}
                  y1={y + 10}
                  x2={x0 + (fullTicks + remainder) * px}
                  y2={y + 10 - 16 * remainder}
                  style={{
                    animationDelay: `${rowIndex * 70 + fullTicks * 12}ms`,
                  }}
                />
              )}
              <text className="tick-value" x="500" y={y + 4} textAnchor="end">
                {money.format(item.value)}
              </text>
            </g>
          );
        })}
        <text className="tick-source" x="260" y="242" textAnchor="middle">
          ONE TICK = ¥500 · PARTIAL TICK = REMAINDER
        </text>
      </svg>
    </button>
  );
}

export default function HomePage() {
  const [devices, setDevices] = useState(initialDevices);
  const [hydrated, setHydrated] = useState(false);
  const [filter, setFilter] = useState<'全部' | DeviceStatus>('持有');
  const [query, setQuery] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [draft, setDraft] = useState<Device>(emptyDevice);
  const [isDark, setIsDark] = useState(false);
  const [today, setToday] = useState('');
  const [viewMode, setViewMode] = useState<'home' | 'overview' | 'details'>('home');
  const [sectionTarget, setSectionTarget] = useState<string | null>(null);
  const [costPeriod, setCostPeriod] = useState<'day' | 'year'>('day');
  const [timelineZoom, setTimelineZoom] = useState(1);
  const [chartStatus, setChartStatus] = useState<'全部' | DeviceStatus>('全部');
  const [timelineSort, setTimelineSort] = useState('status');
  const [timelineWidth, setTimelineWidth] = useState(0);
  const [timelineTooltip, setTimelineTooltip] = useState<{ text: string; left: number; top: number } | null>(null);
  const timelineViewport = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const preservePortalScroll = useRef(false);
  const [carouselRef, carouselApi] = useEmblaCarousel({ align: 'start', containScroll: 'trimSnaps', skipSnaps: false });
  const devicesRef = useRef(devices);

  useLayoutEffect(() => {
    if (timelineZoom === 1 && timelineViewport.current) {
      timelineViewport.current.scrollLeft = 0;
    }
    setTimelineTooltip(null);
  }, [timelineZoom, viewMode, sectionTarget, chartStatus, timelineSort]);

  useEffect(() => {
    const hide = () => setTimelineTooltip(null);
    window.addEventListener('scroll', hide, true);
    window.addEventListener('resize', hide);
    return () => {
      window.removeEventListener('scroll', hide, true);
      window.removeEventListener('resize', hide);
    };
  }, []);

  const showTimelineTooltip = (element: HTMLElement, text: string) => {
    const rect = element.getBoundingClientRect();
    setTimelineTooltip({
      text,
      left: Math.max(12, Math.min(rect.left, window.innerWidth - 332)),
      top: Math.max(80, rect.top - 10),
    });
  };

  useEffect(() => {
    const element = timelineViewport.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setTimelineWidth(entry.contentRect.width));
    observer.observe(element);
    return () => observer.disconnect();
  }, [viewMode, sectionTarget]);

  useEffect(() => {
    const saved = localStorage.getItem('wuji-devices-v1');
    const savedTheme = localStorage.getItem('wuji-theme');
    if (saved) {
      try {
        const savedDevices = JSON.parse(saved) as Device[];
        const mergedDevices = savedDevices.some(
          (device) => device.id === iphoneAirDevice.id,
        )
          ? savedDevices
          : [iphoneAirDevice, ...savedDevices];
        setDevices(
          mergedDevices.map((device) => {
            if (device.name.trim() === 'HomePod mini') {
              if (device.id === 'homepod-mini-2020') return { ...device, name: 'HomePod mini_L' };
              if (device.id === 'homepod-mini-2024') return { ...device, name: 'HomePod mini_R' };
            }
            if (device.id === iphoneAirDevice.id && !device.tags) {
              return { ...device, tags: '深空黑色' };
            }
            if (
              device.id === 'iphone-14-pro' &&
              !device.additionalDetail.includes('2026-09-17')
            ) {
              return {
                ...device,
                additional:
                  device.additional === 3392
                    ? 4240
                    : device.additional === 4240
                      ? 4240
                      : device.additional + 848,
                additionalDetail: `${device.additionalDetail}${device.additionalDetail ? '; ' : ''}AppleCare+: ¥848.00 (2026-09-17)`,
              };
            }
            return device;
          }),
        );
      } catch {
        /* bundled data remains */
      }
    }
    if (savedTheme === 'dark') {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
    setToday(localDate());
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (hydrated)
      localStorage.setItem('wuji-devices-v1', JSON.stringify(devices));
  }, [devices, hydrated]);
  useEffect(() => {
    devicesRef.current = devices;
  }, [devices]);
  useEffect(() => {
    type Tool = {
      name: string;
      title: string;
      description: string;
      inputSchema: object;
      annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
      execute: (input: unknown) => unknown;
    };
    const context = (
      document as Document & {
        modelContext?: {
          registerTool: (
            tool: Tool,
            options?: { signal?: AbortSignal },
          ) => void | Promise<void>;
        };
      }
    ).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const report = (error: unknown) =>
      console.warn('WebMCP tool registration failed', error);
    void Promise.resolve(
      context.registerTool(
        {
          name: 'list_devices',
          title: '查看设备',
          description: '查看当前保存的物品，可按持有或归档状态筛选。',
          inputSchema: {
            type: 'object',
            properties: {
              status: { type: 'string', enum: ['全部', '持有', '归档'] },
            },
            additionalProperties: false,
          },
          annotations: { readOnlyHint: true, untrustedContentHint: false },
          execute(input) {
            const status = (input as { status?: string })?.status || '全部';
            return {
              devices: devicesRef.current
                .filter(
                  (device) => status === '全部' || device.status === status,
                )
                .map((device) => ({
                  id: device.id,
                  name: device.name,
                  status: device.status,
                  category: device.category,
                  totalValue: device.purchasePrice + device.additional,
                  purchaseDate: device.purchaseDate,
                })),
            };
          },
        },
        { signal: lifecycle.signal },
      ),
    ).catch(report);
    void Promise.resolve(
      context.registerTool(
        {
          name: 'add_device',
          title: '添加物品',
          description: '添加一件电子产品，并立即保存到本地物品列表。',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', minLength: 1 },
              category: {
                type: 'string',
                enum: ['电脑', '手机', '平板', '影音', '穿戴', '其他'],
              },
              purchasePrice: { type: 'number', minimum: 0 },
              purchaseDate: { type: 'string' },
              notes: { type: 'string' },
            },
            required: ['name'],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false, untrustedContentHint: false },
          execute(input) {
            const value = input as {
              name?: string;
              category?: DeviceCategory;
              purchasePrice?: number;
              purchaseDate?: string;
              notes?: string;
            };
            if (!value?.name?.trim()) throw new Error('设备名称不能为空');
            const device: Device = {
              ...emptyDevice,
              id: crypto.randomUUID(),
              name: value.name.trim(),
              category: value.category || getCategory(value.name),
              purchasePrice: value.purchasePrice || 0,
              purchaseDate: value.purchaseDate || localDate(),
              notes: value.notes || '',
            };
            setDevices((current) => [device, ...current]);
            return {
              id: device.id,
              name: device.name,
              status: device.status,
              saved: true,
            };
          },
        },
        { signal: lifecycle.signal },
      ),
    ).catch(report);
    return () => lifecycle.abort();
  }, []);

  const active = devices.filter((device) => device.status === '持有');
  const archived = devices.filter((device) => device.status === '归档');
  const datedDevices = devices.filter((device) => device.purchaseDate);
  const timelineStartYear = Math.min(
    ...datedDevices.map((device) => Number(device.purchaseDate.slice(0, 4))),
    Number(today.slice(0, 4)) || new Date().getFullYear(),
  );
  const timelineEndYear = Number(today.slice(0, 4)) || timelineStartYear;
  const timelineStart = new Date(
    `${timelineStartYear}-01-01T00:00:00`,
  ).getTime();
  const timelineToday = today || `${timelineEndYear}-12-31`;
  const timelineEnd = new Date(`${timelineToday}T00:00:00`).getTime();
  const timelinePosition = (date: string) =>
    Math.max(
      0,
      Math.min(
        100,
        ((new Date(`${date}T00:00:00`).getTime() - timelineStart) /
          Math.max(1, timelineEnd - timelineStart)) *
          100,
      ),
    );
  const timelineYears = Array.from(
    { length: timelineEndYear - timelineStartYear + 1 },
    (_, index) => timelineStartYear + index,
  );
  const axisWidth = timelineWidth * timelineZoom;
  const pixelsPerYear = axisWidth * (365.2425 * 86400000) / Math.max(1, timelineEnd - timelineStart);
  const yearStep = [1, 2, 5, 10, 20, 50, 100].find(step => pixelsPerYear * step >= 64) || 100;
  const intermediateYears = timelineYears.filter(year => {
    const pixel = timelinePosition(`${year}-01-01`) / 100 * axisWidth;
    return year > timelineStartYear && year % yearStep === 0 && pixel >= 64 && axisWidth - pixel >= 48;
  });
  // On a compact overview, the two endpoints communicate the range clearly.
  // Only add intermediate ticks when there is room for a regular sequence.
  const endpointsOnly = (timelineZoom === 1 && timelineWidth < 280) || intermediateYears.length < 2;
  const visibleTimelineYears = endpointsOnly ? [timelineStartYear] : [timelineStartYear, ...intermediateYears];
  const timelineEndDate = (device: Device) => {
    if (device.name.trim().toLowerCase() === 'airpods pro') {
      const successor = devices
        .filter(
          (candidate) =>
            candidate.name.trim().toLowerCase() === 'airpods pro 2' &&
            candidate.purchaseDate > device.purchaseDate,
        )
        .sort((a, b) => a.purchaseDate.localeCompare(b.purchaseDate))[0];
      if (successor) return successor.purchaseDate;
    }
    if (device.status === '归档' && device.archivedDate) {
      return device.archivedDate;
    }
    return today;
  };
  const matchesChartStatus = (device: Device) => chartStatus === '全部' || device.status === chartStatus;
  const timelineDevices = datedDevices.filter(matchesChartStatus).sort((a, b) => {
    const dateOrder = a.purchaseDate.localeCompare(b.purchaseDate);
    if (timelineSort === 'newest') return -dateOrder;
    if (timelineSort === 'oldest') return dateOrder;
    if (timelineSort === 'name') return a.name.localeCompare(b.name, 'zh-CN');
    if (timelineSort === 'longest' || timelineSort === 'shortest') {
      const durationOrder = ageInDays(b.purchaseDate, timelineEndDate(b) || today) - ageInDays(a.purchaseDate, timelineEndDate(a) || today);
      return (timelineSort === 'longest' ? durationOrder : -durationOrder) || dateOrder;
    }
    return Number(a.status === '归档') - Number(b.status === '归档') || dateOrder;
  });
  const chartStatusControl = (label: string) => (
    <div className="period-switch device-status-switch" role="group" aria-label={label}>
      {(['全部', '持有', '归档'] as const).map(status => (
        <button key={status} className={chartStatus === status ? 'selected' : ''} aria-pressed={chartStatus === status} onClick={() => setChartStatus(status)}>
          {status === '持有' ? '使用中' : status === '归档' ? '已归档' : '全部'}
          <span>{status === '全部' ? devices.length : status === '持有' ? active.length : archived.length}</span>
        </button>
      ))}
    </div>
  );
  const averageDailyCost = (device: Device) => {
    const endDate = timelineEndDate(device) || today;
    return (
      deviceNetCost(device) /
      Math.max(1, ageInDays(device.purchaseDate, endDate))
    );
  };
  const costRanking = devices.filter(matchesChartStatus)
    .map((device) => ({
      device,
      dailyCost: averageDailyCost(device),
      displayCost:
        averageDailyCost(device) * (costPeriod === 'year' ? 365 : 1),
    }))
    .sort((a, b) => b.displayCost - a.displayCost);
  const maxRankCost = Math.max(
    1,
    ...costRanking.map((item) => item.displayCost),
  );
  const activeDailyCost = active.reduce(
    (sum, device) => sum + averageDailyCost(device),
    0,
  );
  const visibleDevices = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return devices
      .filter((device) => filter === '全部' || device.status === filter)
      .filter(
        (device) =>
          !needle ||
          [
            device.name,
            device.category,
            device.notes,
            device.channel,
            device.tags,
          ]
            .join(' ')
            .toLowerCase()
            .includes(needle),
      )
      .sort((a, b) => b.purchaseDate.localeCompare(a.purchaseDate));
  }, [devices, filter, query]);
  function openNew() {
    setDraft({ ...emptyDevice, id: crypto.randomUUID() });
    setEditorOpen(true);
  }
  function openEdit(device: Device) {
    setDraft({ ...device });
    setEditorOpen(true);
  }
  function saveDevice(event: FormEvent) {
    event.preventDefault();
    if (!draft.name.trim()) return;
    setDevices((current) => {
      const exists = current.some((device) => device.id === draft.id);
      return exists
        ? current.map((device) =>
            device.id === draft.id
              ? { ...draft, name: draft.name.trim() }
              : device,
          )
        : [{ ...draft, name: draft.name.trim() }, ...current];
    });
    setEditorOpen(false);
  }
  function toggleArchive(device: Device) {
    setDevices((current) =>
      current.map((item) =>
        item.id === device.id
          ? {
              ...item,
              status: item.status === '持有' ? '归档' : '持有',
              archivedDate: item.status === '持有' ? localDate() : '',
              archivedWay:
                item.status === '持有' && !item.archivedWay
                  ? '已归档'
                  : item.archivedWay,
            }
          : item,
      ),
    );
  }
  function toggleTheme() {
    setIsDark((current) => {
      const next = !current;
      document.documentElement.classList.toggle('dark', next);
      localStorage.setItem('wuji-theme', next ? 'dark' : 'light');
      return next;
    });
  }
  function exportCsv() {
    const header = [
      '名称',
      '状态',
      '备注',
      '标签',
      '收藏价格',
      '收藏日期',
      '持有价格',
      '持有日期',
      '购买渠道',
      '保修截止',
      '归档价格',
      '归档日期',
      '归档方式',
      '归档感想',
      '追加投入总额',
      '追加投入明细',
      '总价值',
      '创建时间',
    ];
    const rows = devices.map((device) => [
      device.name,
      device.status,
      device.notes,
      device.tags,
      '',
      '',
      device.purchasePrice,
      device.purchaseDate,
      device.channel,
      device.warrantyEnd,
      device.archivedPrice || '',
      device.archivedDate,
      device.archivedWay,
      device.archivedThought,
      device.additional,
      device.additionalDetail,
      device.purchasePrice + device.additional,
      localDate(),
    ]);
    const csv =
      '\uFEFF' +
      [header, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n');
    const url = URL.createObjectURL(
      new Blob([csv], { type: 'text/csv;charset=utf-8' }),
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = `我的物品_${localDate()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }
  async function importCsv(file?: File) {
    if (!file) return;
    const imported = fromCsv(await file.text());
    if (imported.length) {
      setDevices((current) => {
        const incomingKeys = new Set(
          imported.map((device) => `${device.name}::${device.purchaseDate}`),
        );
        return [
          ...imported,
          ...current.filter(
            (device) =>
              !incomingKeys.has(`${device.name}::${device.purchaseDate}`),
          ),
        ];
      });
    }
    if (fileInput.current) fileInput.current.value = '';
  }

  async function updatePhoto(file?: File) {
    if (!file) return;
    const photo = await compressPhoto(file);
    setDraft((current) => ({ ...current, photo }));
  }

  function changeView(next: 'home' | 'overview' | 'details', section: string | null = null, preserveScroll = false) {
    preservePortalScroll.current = preserveScroll;
    const target = next === 'overview' ? section || 'timeline' : null;
    const hash = next === 'home' ? '' : `#${next === 'details' ? 'details' : target}`;
    if (window.location.hash !== hash) window.history.pushState(null, '', `${window.location.pathname}${window.location.search}${hash}`);
    setSectionTarget(target);
    setViewMode(next);
    if (next === viewMode && !preserveScroll) {
      if (target) (document.getElementById(`fold-${target}`) || document.getElementById(target))?.scrollIntoView({ block: 'start', behavior: 'instant' });
      else window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }

  useEffect(() => {
    const restoreView = () => {
      preservePortalScroll.current = false;
      const destination = window.location.hash.slice(1);
      if (['timeline', 'costs', 'devices'].includes(destination)) {
        setViewMode('overview');
        setSectionTarget(destination);
      } else {
        setViewMode(destination === 'details' ? 'details' : 'home');
        setSectionTarget(null);
      }
    };
    restoreView();
    window.addEventListener('popstate', restoreView);
    window.addEventListener('hashchange', restoreView);
    return () => {
      window.removeEventListener('popstate', restoreView);
      window.removeEventListener('hashchange', restoreView);
    };
  }, []);

  useEffect(() => {
    if (preservePortalScroll.current) {
      preservePortalScroll.current = false;
      return;
    }
    const frame = requestAnimationFrame(() => {
      const target = sectionTarget && (document.getElementById(`fold-${sectionTarget}`) || document.getElementById(sectionTarget));
      if (target) target.scrollIntoView({ block: 'start', behavior: 'instant' });
      else window.scrollTo({ top: 0, behavior: 'instant' });
    });
    return () => cancelAnimationFrame(frame);
  }, [viewMode, sectionTarget]);

  useEffect(() => {
    carouselApi?.reInit();
    carouselApi?.scrollTo(0, true);
  }, [filter, query, viewMode, sectionTarget, carouselApi]);

  function scrollProducts(direction: -1 | 1) {
    if (direction > 0) carouselApi?.scrollNext();
    else carouselApi?.scrollPrev();
  }

  const renderWorkspaceSection = (section: 'timeline' | 'costs' | 'devices') => (
              <div className="dashboard-view portal-panel">
                {section === 'timeline' && (
            <section
              className="lifecycle-section"
              id="timeline"
              aria-labelledby="lifecycle-title"
            >
              <header className="lifecycle-header">
                <div>
                  <h1 id="lifecycle-title">使用时间轴</h1>
                </div>
                <div className="timeline-zoom" aria-label="时间轴缩放">
                  <div>
                    <button
                      aria-label="缩小时间轴"
                      disabled={timelineZoom <= 1}
                      onClick={() => setTimelineZoom((value) => Math.max(1, value - 0.5))}
                    >
                      <Minus />
                    </button>
                    <strong>{timelineZoom.toFixed(1)}×</strong>
                    <button
                      aria-label="放大时间轴"
                      disabled={timelineZoom >= 3}
                      onClick={() => setTimelineZoom((value) => Math.min(3, value + 0.5))}
                    >
                      <Plus />
                    </button>
                  </div>
                </div>
              </header>
              <div className="device-view-controls">
                {chartStatusControl('时间轴设备状态')}
                <NativeSelect className="timeline-sort" value={timelineSort} aria-label="时间轴排序" onChange={event => setTimelineSort(event.target.value)}>
                  <NativeSelectOption value="status">按状态分组</NativeSelectOption>
                  <NativeSelectOption value="oldest">购入时间：从早到晚</NativeSelectOption>
                  <NativeSelectOption value="newest">购入时间：从晚到早</NativeSelectOption>
                  <NativeSelectOption value="longest">使用时长：从长到短</NativeSelectOption>
                  <NativeSelectOption value="shortest">使用时长：从短到长</NativeSelectOption>
                  <NativeSelectOption value="name">按名称</NativeSelectOption>
                </NativeSelect>
              </div>
              {timelineDevices.length === 0 && <div className="device-view-empty">暂无{chartStatus === '归档' ? '已归档' : chartStatus === '持有' ? '使用中' : ''}设备</div>}
              <div className="lifecycle-layout" hidden={timelineDevices.length === 0}>
                <div className="lifecycle-label-column">
                  <span className="lifecycle-column-head">设备</span>
                  {timelineDevices.map((device) => (
                    <button key={device.id} title={device.name} onClick={() => openEdit(device)}>
                      {device.name}
                    </button>
                  ))}
                </div>
                <div
                  ref={timelineViewport}
                  className={`lifecycle-middle-scroll ${timelineZoom > 1 ? 'is-scrollable' : ''}`}
                  tabIndex={timelineZoom > 1 ? 0 : -1}
                  role="region"
                  aria-label="时间轴日期范围"
                  onScroll={event => {
                    if (timelineZoom === 1 && event.currentTarget.scrollLeft !== 0) {
                      event.currentTarget.scrollLeft = 0;
                    }
                  }}
                >
                  <div
                    className="lifecycle-middle"
                    style={{
                      width: `${timelineZoom * 100}%`,
                      minWidth: '100%',
                    }}
                  >
                    <div className="lifecycle-year-axis" aria-hidden="true">
                      {visibleTimelineYears.map((year, index) => (
                        <i
                          className={index === 0 ? 'is-first' : ''}
                          key={year}
                          style={{ left: `${timelinePosition(`${year}-01-01`)}%` }}
                        >
                          {year}
                        </i>
                      ))}
                      <i className="is-today">今天</i>
                    </div>
                    {timelineDevices.map((device) => {
                    const endDate = timelineEndDate(device);
                    const start = timelinePosition(device.purchaseDate);
                    const end = timelinePosition(endDate || device.purchaseDate);
                    const startLabel = dateFormatter.format(
                      new Date(`${device.purchaseDate}T00:00:00`),
                    );
                    const endLabel = dateFormatter.format(
                      new Date(`${endDate || device.purchaseDate}T00:00:00`),
                    );
                    const endDisplayLabel = device.status === '持有' ? '至今' : endLabel;
                    const durationDays = ageInDays(
                      device.purchaseDate,
                      endDate || device.purchaseDate,
                    );
                    const tooltipText = `${startLabel} — ${endDisplayLabel} · ${durationDays} 天`;
                    return (
                      <div className="lifecycle-track-row" key={device.id}>
                        <div className="lifecycle-track">
                          <span
                            className={device.status === '归档' ? 'archived' : ''}
                            tabIndex={0}
                            role="button"
                            aria-label={`${device.name}：${startLabel} — ${endDisplayLabel}，共${durationDays}天`}
                            onPointerEnter={event => {
                              if (event.pointerType === 'mouse') showTimelineTooltip(event.currentTarget, tooltipText);
                            }}
                            onPointerLeave={() => setTimelineTooltip(null)}
                            onFocus={event => showTimelineTooltip(event.currentTarget, tooltipText)}
                            onBlur={() => setTimelineTooltip(null)}
                            onClick={event => showTimelineTooltip(event.currentTarget, tooltipText)}
                            onKeyDown={event => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                showTimelineTooltip(event.currentTarget, tooltipText);
                              }
                            }}
                            style={{
                              left: `${start}%`,
                              width: `${Math.max(0.8, end - start)}%`,
                            }}
                          />
                          <i style={{ left: `${start}%` }} />
                        </div>
                      </div>
                    );
                  })}
                  </div>
                </div>
                <div className="lifecycle-duration-column">
                  <span className="lifecycle-column-head">使用时长</span>
                  {timelineDevices.map((device) => (
                    <strong key={device.id}>
                      {ageLabel(
                        device.purchaseDate,
                        timelineEndDate(device) || today,
                      )}
                    </strong>
                  ))}
                </div>
              </div>
              {timelineTooltip && <div className="timeline-date-tooltip" role="tooltip" style={{ left: timelineTooltip.left, top: timelineTooltip.top }}>{timelineTooltip.text}</div>}
            </section>

                )}
                {section === 'costs' && <>
            <CostHistory devices={devices.map(device => ({ ...device, usageEnd: timelineEndDate(device) || today }))} today={today} />

            <section className="cost-ranking-section" aria-labelledby="cost-ranking-title">
              <header className="ranking-header">
                <div>
                  <h2 id="cost-ranking-title">平均使用成本</h2>
                </div>
                <div className="ranking-summary">
                  <div className="portfolio-daily-cost">
                    <span>当前持有合计</span>
                    <strong>
                      ¥{decimal.format(activeDailyCost)}
                      <small>/天</small>
                    </strong>
                  </div>
                  <div className="period-switch" role="tablist" aria-label="成本周期">
                    <button
                      role="tab"
                      aria-selected={costPeriod === 'day'}
                      className={costPeriod === 'day' ? 'selected' : ''}
                      onClick={() => setCostPeriod('day')}
                    >
                      每天
                    </button>
                    <button
                      role="tab"
                      aria-selected={costPeriod === 'year'}
                      className={costPeriod === 'year' ? 'selected' : ''}
                      onClick={() => setCostPeriod('year')}
                    >
                      每年
                    </button>
                  </div>
                </div>
              </header>
              <div className="device-view-controls">{chartStatusControl('成本排名设备状态')}</div>
              {costRanking.length === 0 && <div className="device-view-empty">暂无{chartStatus === '归档' ? '已归档' : chartStatus === '持有' ? '使用中' : ''}设备</div>}
              <div className="ranking-list">
                {costRanking.map((item, index) => (
                  <button
                    className="ranking-row"
                    key={item.device.id}
                    onClick={() => openEdit(item.device)}
                  >
                    <span className="ranking-index">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="ranking-name">
                      <strong>{item.device.name}</strong>
                      <small>{item.device.status}</small>
                    </span>
                    <span className="ranking-track" aria-hidden="true">
                      <i style={{ width: `${(item.displayCost / maxRankCost) * 100}%` }} />
                    </span>
                    <strong className="ranking-value">
                      {costPeriod === 'day'
                        ? `¥${decimal.format(item.displayCost)}`
                        : money.format(item.displayCost)}
                      <small>/{costPeriod === 'day' ? '天' : '年'}</small>
                    </strong>
                  </button>
                ))}
              </div>
            </section>

                </>}
                {section === 'devices' && (
            <section className="devices-section" id="devices" aria-labelledby="devices-title">
              <div className="section-heading carousel-heading">
                <div>
                  <h2 id="devices-title">我的设备</h2>
                </div>
                <div className="carousel-actions">
                  <button className="details-link" onClick={() => changeView('details')}>
                    查看全部详情
                    <ChevronRight />
                  </button>

                </div>
              </div>
              <div className="controls-row overview-controls">
                <div className="period-switch device-status-switch" role="tablist" aria-label="物品状态">
                  {(['全部', '持有', '归档'] as const).map((item) => (
                    <button
                      key={item}
                      role="tab"
                      aria-selected={filter === item}
                      className={filter === item ? 'selected' : ''}
                      onClick={() => setFilter(item)}
                    >
                      {item === '持有' ? '使用中' : item === '归档' ? '已归档' : '全部'}
                      <span>
                        {item === '全部'
                          ? devices.length
                          : item === '持有'
                            ? active.length
                            : archived.length}
                      </span>
                    </button>
                  ))}
                </div>
                <label className="search-field">
                  <Search />
                  <span className="sr-only">搜索物品</span>
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="搜索"
                  />
                </label>
              </div>

              <div className="product-carousel" ref={carouselRef}>
                <div className="product-carousel-track">
                {visibleDevices.length ? (
                  visibleDevices.map((device) => {
                    const total = device.purchasePrice + device.additional;
                    const productImage = getProductImage(device);
                    const endDate = timelineEndDate(device);
                    return (
                      <article
                        className={`product-card ${device.status === '归档' ? 'is-archived' : ''}`}
                        key={device.id}
                      >
                        <button
                          className="product-card-main"
                          onClick={() => openEdit(device)}
                          aria-label={`查看并编辑 ${device.name}`}
                        >
                          <span className="product-stage">
                            {productImage ? (
                              <span
                                className={`product-image-frame ${device.photo ? 'is-user-image' : 'is-catalog-image'} ${!device.photo && device.name.trim().toLowerCase() === 'iphone air' ? 'is-iphone-air' : ''}`}
                              >
                                <img
                                  className={device.photo ? 'user-photo' : 'catalog-photo'}
                                  src={productImage}
                                  alt={device.name}
                                  loading="lazy"
                                  decoding="async"
                                />
                              </span>
                            ) : (
                              <span>暂无图片</span>
                            )}
                            {device.status === '归档' && <i>已归档</i>}
                          </span>
                          <span className="product-copy">
                            <strong>{device.name}</strong>
                            <small>
                              {device.purchaseDate
                                ? `${dateFormatter.format(new Date(`${device.purchaseDate}T00:00:00`))}购入`
                                : '购入日期待补充'}
                            </small>
                          </span>
                          <span className="product-metrics">
                            <span>
                              <small>已使用</small>
                              <strong>{ageLabel(device.purchaseDate, endDate)}</strong>
                            </span>
                            <span>
                              <small>总投入</small>
                              <strong>{total > 0 ? money.format(total) : '待补充'}</strong>
                            </span>
                            <span>
                              <small>净成本/天</small>
                              <strong>{total > 0 ? `¥${decimal.format(averageDailyCost(device))}` : '—'}</strong>
                            </span>
                          </span>
                        </button>
                        <div className="product-actions">
                          <button onClick={() => openEdit(device)}>
                            <Pencil />编辑
                          </button>
                          <button onClick={() => toggleArchive(device)}>
                            {device.status === '持有' ? <Archive /> : <RotateCcw />}
                            {device.status === '持有' ? '归档' : '恢复'}
                          </button>
                        </div>
                      </article>
                    );
                  })
                ) : (
                  <div className="empty-state">
                    <Search />
                    <h3>没有找到物品</h3>
                    <Button onClick={openNew}><Plus />添加物品</Button>
                  </div>
                )}
              </div>
              </div>
              {visibleDevices.length > 1 && <div className="devices-footer">
                  <div className="carousel-buttons" aria-label="滚动设备列表">
                    <button aria-label="向左滚动" onClick={() => scrollProducts(-1)}>
                      <ChevronLeft />
                    </button>
                    <button aria-label="向右滚动" onClick={() => scrollProducts(1)}>
                      <ChevronRight />
                    </button>
                  </div>
              </div>}
            </section>
                )}
              </div>
  );

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="site-navigation">
        <div className="navigation-inner">
          <button className="navigation-title" onClick={() => changeView('home')} aria-label="返回首页">我的物品</button>
          <div className="navigation-actions">
            <input
              ref={fileInput}
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              onChange={(event) => importCsv(event.target.files?.[0])}
            />
            <button
              className="navigation-button"
              aria-label="导入物品"
              onClick={() => fileInput.current?.click()}
            >
              <Upload />
              <span>导入</span>
            </button>
            <button className="navigation-button" aria-label="导出物品" onClick={exportCsv}>
              <Download />
              <span>导出</span>
            </button>
            <button
              className="navigation-button icon-only"
              aria-label={isDark ? '切换浅色模式' : '切换深色模式'}
              onClick={toggleTheme}
            >
              {isDark ? <Sun /> : <Moon />}
            </button>
            <Button className="add-button" aria-label="添加物品" onClick={openNew}>
              <Plus />
              <span>添加物品</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="content-wrap">
        {viewMode === 'home' ? (
          <DevicePortal
            devices={devices.map(device => ({ ...device, image: getProductImage(device), usageEnd: timelineEndDate(device) || today }))}
            today={today}
            onNavigate={section => changeView('overview', section)}
            onDetails={() => { setFilter('全部'); setQuery(''); changeView('details'); }}
            onEdit={id => { const device = devices.find(item => item.id === id); if (device) openEdit(device); }}
            renderSection={renderWorkspaceSection}
          />
        ) : viewMode === 'overview' ? (
          <div className="analysis-workbench">
            <nav className="workbench-navigation" aria-label="数据分析">
              <button className="back-link" onClick={() => changeView('home')}><ChevronLeft />返回首页</button>
              <div className="period-switch" role="group" aria-label="切换分析模块">
                {([['timeline', '时间轴'], ['costs', '成本'], ['devices', '设备']] as const).map(([id, label]) => <button key={id} className={(sectionTarget || 'timeline') === id ? 'selected' : ''} aria-pressed={(sectionTarget || 'timeline') === id} onClick={() => changeView('overview', id)}>{label}</button>)}
              </div>
            </nav>
            <h1>{sectionTarget === 'costs' ? '成本分析' : sectionTarget === 'devices' ? '我的设备' : '使用时间轴'}</h1>
            {renderWorkspaceSection((sectionTarget || 'timeline') as 'timeline' | 'costs' | 'devices')}
          </div>
        ) : (
          <div className="details-view">
            <header className="details-header">
              <button className="back-link" onClick={() => changeView('overview', 'devices')}>
                <ChevronLeft />返回设备
              </button>
              <div>
                <div>
                  <h1>全部物品</h1>
                  <p>更高效地核对购入、投入与平均使用成本</p>
                </div>
                <span>共 {devices.length} 件</span>
              </div>
            </header>
            <div className="controls-row details-controls">
              <div className="segmented" role="tablist" aria-label="物品状态">
                {(['持有', '全部', '归档'] as const).map((item) => (
                  <button
                    key={item}
                    role="tab"
                    aria-selected={filter === item}
                    className={filter === item ? 'selected' : ''}
                    onClick={() => setFilter(item)}
                  >
                    {item}
                    <span>
                      {item === '全部'
                        ? devices.length
                        : item === '持有'
                          ? active.length
                          : archived.length}
                    </span>
                  </button>
                ))}
              </div>
              <label className="search-field">
                <Search />
                <span className="sr-only">搜索物品</span>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="搜索"
                />
              </label>
            </div>
            <div className="device-table-wrap">
              <table className="device-table">
                <thead>
                  <tr>
                    <th>物品</th>
                    <th>状态</th>
                    <th>购入与使用</th>
                    <th className="numeric">总投入</th>
                    <th className="numeric">追加投入</th>
                    <th className="numeric">售出/回收</th>
                    <th className="numeric">净成本/天</th>
                    <th className="numeric">净成本/年</th>
                    <th className="numeric">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleDevices.map((device) => {
                    const image = getProductImage(device);
                    const endDate = timelineEndDate(device);
                    const dailyCost = averageDailyCost(device);
                    return (
                      <tr key={device.id} className={device.status === '归档' ? 'is-archived' : ''}>
                        <td>
                          <button className="product-cell" onClick={() => openEdit(device)}>
                            <span className="product-thumb">
                              {image ? (
                                <img
                                  className={device.photo ? 'user-photo' : 'catalog-photo'}
                                  src={image}
                                  alt=""
                                />
                              ) : '无图'}
                            </span>
                            <span><strong>{device.name}</strong><small>{device.category}</small></span>
                          </button>
                        </td>
                        <td><span className={`table-status ${device.status === '持有' ? 'active' : ''}`}>{device.status}</span></td>
                        <td className="date-cell">
                          <strong>{device.purchaseDate ? dateFormatter.format(new Date(`${device.purchaseDate}T00:00:00`)) : '—'}</strong>
                          <small>
                            {device.status === '归档' && endDate
                              ? `至 ${dateFormatter.format(new Date(`${endDate}T00:00:00`))} · ${ageInDays(device.purchaseDate, endDate)} 天`
                              : ageLabel(device.purchaseDate, endDate)}
                          </small>
                        </td>
                        <td className="numeric strong-value">{money.format(device.purchasePrice + device.additional)}</td>
                        <td className="numeric muted-value">{device.additional ? money.format(device.additional) : '—'}</td>
                        <td className="numeric muted-value">{device.archivedPrice ? money.format(device.archivedPrice) : '—'}</td>
                        <td className="numeric">¥{decimal.format(dailyCost)}</td>
                        <td className="numeric">{money.format(dailyCost * 365)}</td>
                        <td className="row-actions">
                          <button onClick={() => openEdit(device)}><Pencil />编辑</button>
                          <button onClick={() => toggleArchive(device)}>
                            {device.status === '持有' ? <Archive /> : <RotateCcw />}
                            {device.status === '持有' ? '归档' : '恢复'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {!visibleDevices.length && (
                <div className="empty-state"><Search /><h3>没有找到物品</h3><p>换个关键词再试试。</p></div>
              )}
            </div>
          </div>
        )}

        <footer>数据保存在当前浏览器</footer>
      </div>
      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="device-dialog sm:max-w-[620px]">
          <form onSubmit={saveDevice}>
            <DialogHeader>
              <DialogTitle>
                {devices.some((device) => device.id === draft.id)
                  ? '编辑物品'
                  : '添加物品'}
              </DialogTitle>
              <DialogDescription>
                记录购入信息、追加投入和当前状态。
              </DialogDescription>
            </DialogHeader>
            <div className="form-grid">
              <label className="field field-wide photo-field">
                <span>物品图片</span>
                <div className="photo-picker">
                  {getProductImage(draft) ? (
                    <img src={getProductImage(draft)} alt="物品图片预览" />
                  ) : (
                    <span>暂无图片</span>
                  )}
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(event) => updatePhoto(event.target.files?.[0])}
                  />
                </div>
              </label>
              <label className="field field-wide">
                <span>物品名称</span>
                <Input
                  autoFocus
                  value={draft.name}
                  onChange={(event) =>
                    setDraft({ ...draft, name: event.target.value })
                  }
                  placeholder="例如：MacBook Pro"
                  required
                />
              </label>
              <label className="field">
                <span>分类</span>
                <select
                  value={draft.category}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      category: event.target.value as DeviceCategory,
                    })
                  }
                >
                  {['电脑', '手机', '平板', '影音', '穿戴', '其他'].map(
                    (category) => (
                      <option key={category}>{category}</option>
                    ),
                  )}
                </select>
              </label>
              <label className="field">
                <span>状态</span>
                <select
                  value={draft.status}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      status: event.target.value as DeviceStatus,
                    })
                  }
                >
                  <option>持有</option>
                  <option>归档</option>
                </select>
              </label>
              <label className="field">
                <span>购入价格</span>
                <div className="money-input">
                  <span>¥</span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={draft.purchasePrice}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        purchasePrice: Number(event.target.value),
                      })
                    }
                  />
                </div>
              </label>
              <label className="field">
                <span>购入日期</span>
                <Input
                  type="date"
                  value={draft.purchaseDate}
                  onChange={(event) =>
                    setDraft({ ...draft, purchaseDate: event.target.value })
                  }
                />
              </label>
              <label className="field">
                <span>追加投入</span>
                <div className="money-input">
                  <span>¥</span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={draft.additional}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        additional: Number(event.target.value),
                      })
                    }
                  />
                </div>
              </label>
              <label className="field">
                <span>保修截止</span>
                <Input
                  type="date"
                  value={draft.warrantyEnd}
                  onChange={(event) =>
                    setDraft({ ...draft, warrantyEnd: event.target.value })
                  }
                />
              </label>
              <label className="field field-wide">
                <span>购买渠道</span>
                <Input
                  value={draft.channel}
                  onChange={(event) =>
                    setDraft({ ...draft, channel: event.target.value })
                  }
                  placeholder="Apple Store、京东或朋友转让"
                />
              </label>
              <label className="field field-wide">
                <span>追加投入明细</span>
                <Input
                  value={draft.additionalDetail}
                  onChange={(event) =>
                    setDraft({ ...draft, additionalDetail: event.target.value })
                  }
                  placeholder="配件、维修、AppleCare…"
                />
              </label>
              <label className="field field-wide">
                <span>备注</span>
                <textarea
                  value={draft.notes}
                  onChange={(event) =>
                    setDraft({ ...draft, notes: event.target.value })
                  }
                  placeholder="使用体验、序列号位置、下一步计划…"
                />
              </label>
            </div>
            <DialogFooter className="dialog-footer">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditorOpen(false)}
              >
                取消
              </Button>
              <Button type="submit">保存记录</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
