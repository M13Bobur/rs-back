import { describe, expect, it } from 'vitest';
import { monthBounds, parseDayBounds } from './report-date.util.js';

describe('report-date.util', () => {
  it('parseDayBounds covers full local day', () => {
    const { start, end } = parseDayBounds('2026-09-17');
    expect(start.getHours()).toBe(0);
    expect(end.getHours()).toBe(23);
    expect(end.getDate()).toBe(17);
  });

  it('monthBounds for September 2026', () => {
    const { start, end } = monthBounds(2026, 9);
    expect(start.getMonth()).toBe(8);
    expect(start.getDate()).toBe(1);
    expect(end.getMonth()).toBe(8);
    expect(end.getDate()).toBe(30);
  });
});
