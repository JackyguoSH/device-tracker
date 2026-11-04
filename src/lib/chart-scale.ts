export function chartScale(values: number[], range?: [number, number], linear = false) {
  const valid = values.filter(Number.isFinite);
  const sorted = [...valid].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)] ?? 1;
  const low = Math.min(...valid, 0), high = Math.max(...valid, 1);
  const compressed = !range && !linear && median > 0 && high / median > 12;
  const unit = Math.max(.01, Math.abs(median));
  const transform = (v: number) => compressed ? Math.sign(v) * Math.log1p(Math.abs(v) / unit) : v;
  const inverse = (v: number) => compressed ? Math.sign(v) * Math.expm1(Math.abs(v)) * unit : v;
  const dataMin = sorted[0] ?? 0, dataMax = sorted.at(-1) ?? 1;
  const padding = Math.max((dataMax - dataMin) * .1, dataMax === dataMin ? Math.abs(dataMax) * .05 : 0, .01);
  const min = range?.[0] ?? (compressed ? low : dataMin >= 0 ? Math.max(0, dataMin - padding) : dataMin - padding);
  const max = Math.max(range?.[1] ?? (compressed ? high * 1.08 : dataMax + padding), min + .01);
  const lo = transform(min), hi = transform(max);
  return { compressed, min, max, fraction: (v: number) => (transform(v) - lo) / (hi - lo), ticks: Array.from({length: 5}, (_, i) => inverse(lo + (hi - lo) * i / 4)) };
}

export function nearestPoint<T extends {date: number}>(points: T[], date: number): T | undefined {
  if (!points.length) return undefined;
  let lo = 0, hi = points.length;
  while (lo < hi) { const mid = (lo + hi) >>> 1; if (points[mid].date <= date) lo = mid + 1; else hi = mid; }
  if (!lo) return points[0];
  if (lo === points.length) return points[lo - 1];
  return date - points[lo - 1].date <= points[lo].date - date ? points[lo - 1] : points[lo];
}
