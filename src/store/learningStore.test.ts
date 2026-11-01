/**
 * "Today" (daily XP bucket, last active date, SRS due dates) must be the user's
 * local calendar day, not the UTC day.
 * Fixed clock: 2026-10-23T17:30:00Z = 2026-10-24 01:30 in Asia/Shanghai.
 * The suite pins process.env.TZ itself, so it gives the same result on any machine.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { LearningStore } from './learningStore';
import { localDateKey } from '../utils/date';
import { STORAGE_KEY } from '../config/constants';
import type { VocabCard } from '../types';

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

function card(overrides: Partial<VocabCard> = {}): VocabCard {
  return {
    id: 'c1',
    chinese: '杯子',
    pinyin: 'bēizi',
    english: 'cup',
    exampleSentence: '',
    hskLevel: 1,
    interval: 1,
    easeFactor: 2.5,
    nextReviewDate: '2026-10-24',
    reviewCount: 0,
    isFavorite: false,
    sourceModule: 'snap',
    ...overrides,
  };
}

describe('LearningStore uses the local calendar day (clock 2026-10-24 01:30 local)', () => {
  it('test precondition: the process runs in Asia/Shanghai', () => {
    expect(new Date().getDate()).toBe(24);
    expect(new Date().getHours()).toBe(1);
  });

  it('a new profile starts with the local date as lastActiveDate', () => {
    expect(LearningStore.loadProfile().lastActiveDate).toBe('2026-10-24');
  });

  it('an older saved profile without lastActiveDate gets the local date', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ xp: 10, level: 1, streak: 3, quests: [], vocab: [] }));
    expect(LearningStore.loadProfile().lastActiveDate).toBe('2026-10-24');
  });

  it('addXP buckets XP under the local date', () => {
    const profile = LearningStore.addXP(LearningStore.loadProfile(), 50);
    expect(profile.dailyXp).toEqual({ '2026-10-24': 50 });
  });

  it('addVocabCard makes the new card due on the local date', () => {
    const profile = LearningStore.addVocabCard(LearningStore.loadProfile(), {
      chinese: '杯子', pinyin: 'bēizi', english: 'cup', exampleSentence: '', hskLevel: 1, sourceModule: 'snap',
    });
    expect(profile.vocab[0].nextReviewDate).toBe('2026-10-24');
  });

  it('a card due on the local date is in today\'s review list; one due tomorrow is not', () => {
    const base = LearningStore.loadProfile();
    const profile = {
      ...base,
      vocab: [card({ id: 'due', nextReviewDate: '2026-10-24' }), card({ id: 'later', nextReviewDate: '2026-10-25' })],
    };
    expect(LearningStore.getTodayReviewCards(profile).map((c) => c.id)).toEqual(['due']);
  });

  it('grading "again" schedules the card for the local tomorrow, so it is not due again right away', () => {
    const base = LearningStore.loadProfile();
    const profile = LearningStore.updateCard({ ...base, vocab: [card()] }, 'c1', 'again');
    expect(profile.vocab[0].interval).toBe(1);
    expect(profile.vocab[0].nextReviewDate).toBe('2026-10-25');
    expect(LearningStore.getTodayReviewCards(profile)).toHaveLength(0);
  });

  it('grading "good" adds the interval in local calendar days', () => {
    const base = LearningStore.loadProfile();
    const profile = LearningStore.updateCard({ ...base, vocab: [card()] }, 'c1', 'good');
    expect(profile.vocab[0].interval).toBe(3);
    expect(profile.vocab[0].nextReviewDate).toBe('2026-10-27');
  });
});

describe('localDateKey', () => {
  it('formats local year/month/day with zero padding', () => {
    expect(localDateKey(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
    expect(localDateKey(new Date(2026, 11, 31, 0, 1))).toBe('2026-12-31');
  });
});
