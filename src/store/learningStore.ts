import { UserProfile, Quest, VocabCard } from '../types';
import { STORAGE_KEY } from '../config/constants';

const XP_PER_LEVEL = 500;

function getDefaultQuests(): Quest[] {
  return [
    {
      id: '1',
      title: 'Daily Snap',
      description: 'Snap a photo of any object to learn its Chinese name',
      type: 'snap',
      xpReward: 50,
      progress: 0,
      totalRequired: 1,
      completed: false,
    },
    {
      id: '2',
      title: 'Word Hunter',
      description: 'Find a "杯子" (cup) using Snap & Learn',
      type: 'snap',
      targetCriteria: 'cup',
      xpReward: 100,
      progress: 0,
      totalRequired: 1,
      completed: false,
    },
    {
      id: '3',
      title: 'Live Chat',
      description: 'Start a Live Tutor session and practice speaking',
      type: 'live',
      xpReward: 150,
      progress: 0,
      totalRequired: 1,
      completed: false,
    },
    {
      id: '4',
      title: 'Red Hunter',
      description: 'Find something "红色" (red) using Snap',
      type: 'snap',
      targetCriteria: 'red',
      xpReward: 75,
      progress: 0,
      totalRequired: 1,
      completed: false,
    },
    {
      id: '5',
      title: 'Translator',
      description: 'Translate 3 English phrases into Chinese',
      type: 'translation',
      xpReward: 80,
      progress: 0,
      totalRequired: 3,
      completed: false,
    },
    {
      id: '6',
      title: 'Roleplay Master',
      description: 'Complete a roleplay scenario session',
      type: 'roleplay',
      xpReward: 120,
      progress: 0,
      totalRequired: 1,
      completed: false,
    },
    {
      id: '7',
      title: 'Snap Master',
      description: 'Snap 5 different objects to learn their Chinese names',
      type: 'snap',
      xpReward: 200,
      progress: 0,
      totalRequired: 5,
      completed: false,
    },
    {
      id: '8',
      title: 'SRS Review',
      description: 'Review 5 vocabulary cards in SRS',
      type: 'review',
      xpReward: 100,
      progress: 0,
      totalRequired: 5,
      completed: false,
    },
    {
      id: '9',
      title: 'Pronunciation Pro',
      description: 'Complete a Fluency Coach pronunciation evaluation',
      type: 'fluency',
      xpReward: 80,
      progress: 0,
      totalRequired: 1,
      completed: false,
    },
  ];
}

function getDefaultProfile(): UserProfile {
  return {
    xp: 0,
    level: 1,
    streak: 1,
    lastActiveDate: new Date().toISOString().split('T')[0],
    quests: getDefaultQuests(),
    achievements: [],
    vocab: [],
    dailyXp: {},
  };
}

export class LearningStore {
  static loadProfile(): UserProfile {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const profile = JSON.parse(stored) as UserProfile;
        // Ensure new fields exist for older saved profiles
        if (!profile.vocab) profile.vocab = [];
        if (!profile.achievements) profile.achievements = [];
        if (!profile.lastActiveDate) profile.lastActiveDate = new Date().toISOString().split('T')[0];
        if (!profile.dailyXp) profile.dailyXp = {};
        return profile;
      }
    } catch (e) {
      console.error('Failed to load profile', e);
    }
    return getDefaultProfile();
  }

  static saveProfile(profile: UserProfile): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch (e) {
      console.error('Failed to save profile', e);
    }
  }

  static resetProfile(): UserProfile {
    const fresh = getDefaultProfile();
    LearningStore.saveProfile(fresh);
    return fresh;
  }

  static addXP(profile: UserProfile, amount: number): UserProfile {
    const newXp = profile.xp + amount;
    const newLevel = Math.floor(newXp / XP_PER_LEVEL) + 1;
    const newAchievements = [...profile.achievements];

    if (newLevel > profile.level && !newAchievements.includes(`level_${newLevel}`)) {
      newAchievements.push(`level_${newLevel}`);
    }

    const today = new Date().toISOString().split('T')[0];
    const dailyXp = { ...profile.dailyXp };
    dailyXp[today] = (dailyXp[today] || 0) + amount;

    return {
      ...profile,
      xp: newXp,
      level: newLevel,
      achievements: newAchievements,
      dailyXp,
    };
  }

  static addVocabCard(profile: UserProfile, card: Omit<VocabCard, 'id' | 'interval' | 'easeFactor' | 'nextReviewDate' | 'reviewCount' | 'isFavorite'>): UserProfile {
    const existing = profile.vocab.find(v => v.chinese === card.chinese);
    if (existing) return profile;

    const newCard: VocabCard = {
      ...card,
      id: `vocab_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      interval: 1,
      easeFactor: 2.5,
      nextReviewDate: new Date().toISOString().split('T')[0],
      reviewCount: 0,
      isFavorite: false,
    };

    return {
      ...profile,
      vocab: [...profile.vocab, newCard],
    };
  }

  static updateCard(profile: UserProfile, id: string, grade: 'again' | 'hard' | 'good' | 'easy'): UserProfile {
    const updatedVocab = profile.vocab.map(card => {
      if (card.id !== id) return card;

      let { interval, easeFactor } = card;

      // SM-2 algorithm approximation
      switch (grade) {
        case 'again':
          interval = 1;
          easeFactor = Math.max(1.3, easeFactor - 0.2);
          break;
        case 'hard':
          interval = Math.max(1, Math.ceil(interval * 1.2));
          easeFactor = Math.max(1.3, easeFactor - 0.15);
          break;
        case 'good':
          interval = Math.ceil(interval * easeFactor);
          break;
        case 'easy':
          interval = Math.ceil(interval * easeFactor * 1.3);
          easeFactor = easeFactor + 0.1;
          break;
      }

      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + interval);

      return {
        ...card,
        interval,
        easeFactor,
        nextReviewDate: nextDate.toISOString().split('T')[0],
        reviewCount: card.reviewCount + 1,
      };
    });

    return { ...profile, vocab: updatedVocab };
  }

  static getTodayReviewCards(profile: UserProfile): VocabCard[] {
    const today = new Date().toISOString().split('T')[0];
    return profile.vocab.filter(card => card.nextReviewDate <= today);
  }
}
