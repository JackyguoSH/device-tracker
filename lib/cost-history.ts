export type HistoryDevice = {
  id: string;
  name: string;
  purchaseDate: string;
  purchasePrice: number;
  additional: number;
  additionalDetail: string;
  status: '持有' | '归档';
  archivedPrice: number;
  archivedDate: string;
  usageEnd: string;
};

export const HISTORY_DAY = 86400000;
const dateValue = (value: string) => Date.parse(`${value}T00:00:00Z`);
type Expense = { date: number; amount: number; label: string };

export function buildCostHistory(device: HistoryDevice, today: string) {
  const start = dateValue(device.purchaseDate);
  const now = dateValue(today);
  if (!Number.isFinite(start) || !Number.isFinite(now) || start > now) return null;
  const usageEnd = Math.min(now, Math.max(start, dateValue(device.usageEnd) || now));
  const notes: string[] = [];
  const expenses: Expense[] = [];
  const annualIphone = device.name.toLowerCase().includes('iphone 14 pro') && /2022[–—-]2025/.test(device.additionalDetail);
  for (const item of device.additionalDetail.split(/[;；]/)) {
    const amount = item.match(/[¥￥]\s*([\d,]+(?:\.\d+)?)/);
    const date = item.match(/(\d{4})[-/年](\d{1,2})[-/月](\d{1,2})/);
    if (!amount || !date) continue;
    const when = dateValue(`${date[1]}-${date[2].padStart(2, '0')}-${date[3].padStart(2, '0')}`);
    if (!Number.isFinite(when)) continue;
    expenses.push({ date: Math.max(start, when), amount: Number(amount[1].replaceAll(',', '')), label: item.split(/[:：]/)[0].trim() || '追加投入' });
  }
  let listed = expenses.reduce((sum, item) => sum + item.amount, 0);
  const remainder = Math.max(0, device.additional - listed);
  if (annualIphone && remainder > 0) {
    [2022, 2023, 2024, 2025].forEach((year, i) => expenses.push({ date: i ? dateValue(`${year}-09-17`) : start, amount: remainder / 4, label: 'AppleCare+（日期估算）' }));
    notes.push('2022–2025 续保日期按周年估算');
  } else if (remainder > 0) {
    expenses.push({ date: start, amount: remainder, label: '追加投入（日期待补充）' });
    notes.push(`¥${remainder.toLocaleString('zh-CN')} 追加投入暂从购入日计入`);
  }
  if (listed > device.additional && listed > 0) {
    expenses.forEach(item => item.amount *= device.additional / listed);
    notes.push('明细与合计不符，按追加投入合计折算');
  }
  const missingPrice = device.purchasePrice === 0;
  if (missingPrice) notes.unshift('购入价待补充，仅计已记录支出');
  let recoveryDate = dateValue(device.archivedDate);
  if (device.status === '归档' && device.archivedPrice !== 0) {
    if (!Number.isFinite(recoveryDate)) {
      recoveryDate = usageEnd;
      notes.push('回收日期待补充，暂计入停用日');
    }
    if (recoveryDate <= now) expenses.push({ date: Math.max(start, recoveryDate), amount: -device.archivedPrice, label: '归档回收' });
  }
  // A sale after retirement changes net cost, without adding more usage days.
  const end = Math.min(now, Math.max(usageEnd, device.status === '归档' && Number.isFinite(recoveryDate) ? recoveryDate : usageEnd));
  if (end > usageEnd) notes.push(`${device.usageEnd.replaceAll('-', '/')} 停用，之后回收不增加使用天数`);
  const totalAt = (date: number) => device.purchasePrice + expenses.filter(e => e.date <= date).reduce((sum, e) => sum + e.amount, 0);
  const daysAt = (date: number) => Math.max(1, Math.round((Math.min(date, usageEnd) - start) / HISTORY_DAY));
  const first = Math.min(start + HISTORY_DAY, end);
  const points = [];
  for (let date = first; date <= end; date += HISTORY_DAY) {
    const days = daysAt(date);
    const total = totalAt(date);
    const events = expenses.filter(e => e.date === date);
    const change = events.reduce((sum, e) => sum + e.amount, 0);
    if (change) points.push({ date, days, total: total - change, daily: (total - change) / days, change: 0, event: '' });
    points.push({ date, days, total, daily: total / days, change, event: events.map(e => `${e.label} ${e.amount < 0 ? '−' : '+'}¥${Math.abs(e.amount).toLocaleString('zh-CN')}`).join('；') });
  }
  return { points, start, end, usageEnd, current: totalAt(end) / daysAt(end), missingPrice, empty: missingPrice && device.additional === 0, note: notes.join(' · ') };
}
