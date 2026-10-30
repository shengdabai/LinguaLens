import { describe, it, expect } from 'vitest';
import { formatChinese, extractHanzi, normalizePinyin } from '../lib/chinese';

describe('formatChinese', () => {
  it('returns input unchanged when no formatting needed', () => {
    expect(formatChinese('你好')).toBe('你好');
  });

  it('handles empty string', () => {
    expect(formatChinese('')).toBe('');
  });

  it('preserves punctuation', () => {
    expect(formatChinese('你好，世界！')).toBe('你好，世界！');
  });
});

describe('extractHanzi', () => {
  it('extracts only Chinese characters', () => {
    expect(extractHanzi('你好hello世界')).toBe('你好世界');
  });

  it('returns empty string for non-Chinese input', () => {
    expect(extractHanzi('hello world')).toBe('');
  });

  it('handles mixed content with numbers', () => {
    expect(extractHanzi('今天温度25度')).toBe('今天温度度');
  });

  it('preserves Chinese punctuation', () => {
    expect(extractHanzi('你好，世界。')).toBe('你好，世界。');
  });
});

describe('normalizePinyin', () => {
  it('converts to lowercase', () => {
    expect(normalizePinyin('NIHAO')).toBe('nihao');
  });

  it('removes tone marks', () => {
    expect(normalizePinyin('nǐ hǎo')).toBe('ni hao');
  });

  it('trims whitespace', () => {
    expect(normalizePinyin('  ni hao  ')).toBe('ni hao');
  });

  it('handles empty string', () => {
    expect(normalizePinyin('')).toBe('');
  });
});
