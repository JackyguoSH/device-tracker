import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chartScale, nearestPoint } from '../src/lib/chart-scale';

test('large purchase-day peaks retain the full range and reveal later daily costs', () => {
  const scale = chartScale([8899, 4400, ...Array(100).fill(9), 12]);
  assert.equal(scale.compressed, true);
  assert.ok(scale.fraction(12) - scale.fraction(9) > .02);
  assert.ok(scale.fraction(8899) <= 1);
  assert.ok(scale.fraction(0) >= 0);
  assert.ok(scale.ticks.every((v, i, a) => !i || v > a[i - 1]));
});
test('small day-to-day variation uses a focused linear range', () => {
  const scale = chartScale([8, 8.5, 9]);
  assert.equal(scale.compressed, false);
  assert.ok(scale.fraction(9) - scale.fraction(8) > .7);
});
test('explicit portfolio limits and user linear selection remain linear', () => {
  const values = [1, 1, 1, 1000];
  assert.equal(chartScale(values, undefined, true).compressed, false);
  const scale = chartScale(values, [0, 1200]);
  assert.equal(scale.compressed, false);
  assert.equal(scale.fraction(600), .5);
});
test('constant, zero, negative and empty ranges remain finite', () => {
  for (const values of [[3, 3], [0], [-5, -2], []]) {
    const scale = chartScale(values);
    assert.ok(scale.ticks.every(Number.isFinite));
    assert.ok(Number.isFinite(scale.fraction(values[0] ?? 0)));
  }
});
test('hover picks nearest recorded date and final balance for same-day events', () => {
  const points = [{date: 10, value: 10}, {date: 20, value: 5}, {date: 20, value: 7}, {date: 30, value: 6}];
  assert.equal(nearestPoint(points, 0), points[0]);
  assert.equal(nearestPoint(points, 20), points[2]);
  assert.equal(nearestPoint(points, 24), points[2]);
  assert.equal(nearestPoint(points, 100), points[3]);
  assert.equal(nearestPoint([], 0), undefined);
});
