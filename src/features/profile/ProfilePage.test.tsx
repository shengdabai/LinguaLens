/**
 * The Learning Curve reads profile.dailyXp by date key. LearningStore.addXP writes
 * those keys as local dates, so the chart must read them as local dates too.
 * Fixed clock: 2026-10-23T17:30:00Z = 2026-10-24 01:30 in Asia/Shanghai.
 */
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { ProfilePage } from './ProfilePage';
import { LearningStore } from '../../store/learningStore';

const originalTZ = process.env.TZ;
beforeAll(() => {
  process.env.TZ = 'Asia/Shanghai';
});
afterAll(() => {
  if (originalTZ === undefined) delete process.env.TZ;
  else process.env.TZ = originalTZ;
});

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-10-23T17:30:00Z'));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('ProfilePage learning curve', () => {
  it('shows XP earned today (local date) as the full-height last bar', () => {
    const profile = LearningStore.addXP(LearningStore.loadProfile(), 50);
    expect(profile.dailyXp).toEqual({ '2026-10-24': 50 });

    const html = renderToStaticMarkup(<ProfilePage profile={profile} />);
    const bars = [...html.matchAll(/class="absolute bottom-0 left-0 right-0[^"]*" style="height:([0-9.]+)%"/g)].map((m) => Number(m[1]));
    expect(bars).toEqual([0, 0, 0, 0, 0, 0, 100]);
  });

  it('shows XP earned yesterday (local date) in the second to last bar', () => {
    const profile = { ...LearningStore.loadProfile(), dailyXp: { '2026-10-23': 80, '2026-10-24': 20 } };
    const html = renderToStaticMarkup(<ProfilePage profile={profile} />);
    const bars = [...html.matchAll(/class="absolute bottom-0 left-0 right-0[^"]*" style="height:([0-9.]+)%"/g)].map((m) => Number(m[1]));
    expect(bars).toEqual([0, 0, 0, 0, 0, 100, 25]);
  });
});
