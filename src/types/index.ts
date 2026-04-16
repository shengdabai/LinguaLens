// ===== From 中文学习 =====
export interface SnapAnalysis {
  chinese: string;
  pinyin: string;
  english: string;
  sentence: string;
  sentencePinyin: string;
  sentenceEnglish: string;
  hskLevel?: number;
  funFact?: string;
  commonMistake?: string;
  radicals?: string[];
  usageNote?: string;
  culturalNote?: string;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  type: 'snap' | 'live' | 'roleplay' | 'review' | 'translation' | 'fluency';
  targetCriteria?: string;
  xpReward: number;
  progress: number;
  totalRequired: number;
  completed: boolean;
}

export interface UserProfile {
  xp: number;
  level: number;
  streak: number;
  lastActiveDate: string;
  quests: Quest[];
  achievements: string[];
  vocab: VocabCard[];
  dailyXp: Record<string, number>;
}

// ===== From lingobridge-chinese =====
export interface WordBreakdown {
  chinese: string;
  pinyin: string;
  literal: string;
  pos?: string;
}

export interface TranslationResult {
  original: string;
  detectedLanguage?: string;
  chinese: string;
  chineseDirect?: string;
  chineseNatural?: string;
  pinyin: string;
  breakdown: WordBreakdown[];
  usageNote?: string;
  culturalNote?: string;
}

export interface TranslationState {
  status: 'idle' | 'loading' | 'success' | 'error';
  data: TranslationResult | null;
  audioData: string | null;
  error: string | null;
}

// ===== From fluency-coach =====
export enum ProficiencyLevel {
  Beginner = 'Beginner (HSK 1-2)',
  Intermediate = 'Intermediate (HSK 3-4)',
  Advanced = 'Advanced (HSK 5-6)',
}

export enum Topic {
  DailyLife = 'Daily Life',
  Travel = 'Travel & Directions',
  Business = 'Business & Work',
  Food = 'Food & Dining',
  Culture = 'Culture & History',
  Shopping = 'Shopping',
}

export interface PracticeMaterial {
  chinese: string;
  pinyin: string;
  translation: string;
  vocabulary: Array<{ word: string; pinyin: string; meaning: string }>;
}

export interface FeedbackResult {
  score: number;
  feedback: string;
  pronunciationTips: string[];
  toneAnalysis: string;
}

// ===== From omnireader =====
export enum VoiceName {
  Zephyr = 'Zephyr',
  Kore = 'Kore',
  Fenrir = 'Fenrir',
  Puck = 'Puck',
}

export enum ReaderMode {
  INPUT = 'INPUT',
  PLAYER = 'PLAYER',
}

// ===== From e-use (english-user) =====
export interface WordAnalysis {
  word: string;
  pinyin?: string;
  definition: string;
  partOfSpeech: string;
  examples: string[];
  collocation?: string;
  hskLevel?: number;
}

export interface GrammarAnalysis {
  sentence: string;
  structure: string;
  explanation: string;
  pattern: string;
}

// ===== SRS Vocab =====
export interface VocabCard {
  id: string;
  chinese: string;
  pinyin: string;
  english: string;
  exampleSentence: string;
  hskLevel: number;
  interval: number;
  easeFactor: number;
  nextReviewDate: string;
  reviewCount: number;
  isFavorite: boolean;
  sourceModule: string;
}

// ===== AI Provider =====
export type AIProvider = 'gemini' | 'openai' | 'anthropic';

// ===== App Settings =====
export interface AppSettings {
  // Provider selection for static AI features
  provider: AIProvider;
  // Per-provider API keys
  apiKey: string;          // Gemini (required for Live Tutor, TTS, pronunciation)
  apiKeyOpenAI: string;
  apiKeyAnthropic: string;
  // Per-provider model selection
  modelGemini: string;
  modelOpenAI: string;
  modelAnthropic: string;
  // Legacy (kept for compatibility)
  modelStatic: string;
  subscriptionTier: 'free' | 'pro' | 'premium' | 'team';
}

// ===== Quest Judgment =====
export interface QuestJudgment {
  pass: boolean;
  reason: string;
  targetWord?: SnapAnalysis;
  reward?: { xp: number; badge?: string };
}

// ===== Roleplay Scenario =====
export interface Scenario {
  id: string;
  title: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  hskLevel: string;
  emoji: string;
  initialPrompt: string;
  systemInstruction: string;
}
