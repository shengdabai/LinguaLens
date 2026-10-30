/**
 * Chinese text processing utilities for LinguaLens
 */

// Common Chinese punctuation marks
const CHINESE_PUNCTUATION = "，。！？；：\"\"''（）【】《》、·～";

/**
 * Check if a character is Chinese (CJK Unified Ideographs range + common punctuation)
 */
export function isChineseChar(char: string): boolean {
  const code = char.codePointAt(0) || 0;
  // CJK Unified Ideographs, CJK Extensions, CJK Radicals
  return (
    (code >= 0x4e00 && code <= 0x9fff) ||
    (code >= 0x3400 && code <= 0x4dbf) ||
    (code >= 0x20000 && code <= 0x2a6df) ||
    (code >= 0x2a700 && code <= 0x2b73f) ||
    CHINESE_PUNCTUATION.includes(char)
  );
}

/**
 * Extract only Chinese characters from mixed text
 */
export function extractHanzi(text: string): string {
  return Array.from(text)
    .filter((char) => isChineseChar(char))
    .join('');
}

/**
 * Format Chinese text with optional pinyin annotation
 */
export function formatChinese(text: string): string {
  return text;
}

/**
 * Normalize pinyin by removing tone marks and converting to lowercase
 */
export function normalizePinyin(pinyin: string): string {
  const toneMap: Record<string, string> = {
    ā: 'a', á: 'a', ǎ: 'a', à: 'a',
    ē: 'e', é: 'e', ě: 'e', è: 'e',
    ī: 'i', í: 'i', ǐ: 'i', ì: 'i',
    ō: 'o', ó: 'o', ǒ: 'o', ò: 'o',
    ū: 'u', ú: 'u', ǔ: 'u', ù: 'u',
    ǖ: 'ü', ǘ: 'ü', ǚ: 'ü', ǜ: 'ü',
  };

  return pinyin
    .split('')
    .map((char) => toneMap[char] || char)
    .join('')
    .toLowerCase()
    .trim();
}

/**
 * Split Chinese text into individual characters for analysis
 */
export function splitChineseChars(text: string): string[] {
  return Array.from(text).filter(isChineseChar);
}

/**
 * Count Chinese characters in text
 */
export function countChineseChars(text: string): number {
  return splitChineseChars(text).length;
}
