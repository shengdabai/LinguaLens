import { GoogleGenAI, Type, Modality } from '@google/genai';
import {
  SnapAnalysis,
  TranslationResult,
  PracticeMaterial,
  FeedbackResult,
  WordAnalysis,
  GrammarAnalysis,
  VoiceName,
  ProficiencyLevel,
  Topic,
} from '../types';
import { MODEL_TTS } from '../config/constants';
import { SettingsStore } from '../store/settingsStore';
import { generateText } from './aiProvider';

/** Gemini client for features that are always Gemini-only (TTS, Live, audio eval). */
function getGeminiAI(): GoogleGenAI {
  const apiKey = SettingsStore.getGeminiKey();
  if (!apiKey) throw new Error('NO_API_KEY');
  return new GoogleGenAI({ apiKey });
}

// Helper: Blob to base64
export const blobToBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

// ===== SNAP =====
export async function analyzeImage(
  imageBase64: string,
  mimeType = 'image/jpeg',
): Promise<SnapAnalysis> {
  const prompt = `Analyze the main object in this image. Output JSON with these exact fields:
- chinese: Simplified Chinese characters for the object
- pinyin: Standard Pinyin with tone marks
- english: English translation
- sentence: A simple, natural example sentence in Chinese using this word
- sentencePinyin: Pinyin for the sentence
- sentenceEnglish: English translation of the sentence
- hskLevel: HSK level (1-6) indicating difficulty
- funFact: An interesting cultural fact about this object in Chinese culture (in English)
- commonMistake: A common pronunciation or usage mistake learners make (in English)
- radicals: Array of Chinese radicals/components that make up the main character(s)
- usageNote: Brief usage note (optional)
- culturalNote: Cultural context note (optional)

Respond with valid JSON only.`;

  const text = await generateText(prompt, {
    jsonMode: true,
    imageBase64,
    imageMimeType: mimeType,
    geminiSchema: {
      type: Type.OBJECT,
      properties: {
        chinese: { type: Type.STRING },
        pinyin: { type: Type.STRING },
        english: { type: Type.STRING },
        sentence: { type: Type.STRING },
        sentencePinyin: { type: Type.STRING },
        sentenceEnglish: { type: Type.STRING },
        hskLevel: { type: Type.NUMBER },
        funFact: { type: Type.STRING },
        commonMistake: { type: Type.STRING },
        radicals: { type: Type.ARRAY, items: { type: Type.STRING } },
        usageNote: { type: Type.STRING },
        culturalNote: { type: Type.STRING },
      },
      required: ['chinese', 'pinyin', 'english', 'sentence', 'sentencePinyin', 'sentenceEnglish', 'hskLevel', 'funFact', 'commonMistake', 'radicals'],
    },
  });

  try {
    return JSON.parse(text) as SnapAnalysis;
  } catch {
    throw new Error('Failed to parse image analysis response');
  }
}

// ===== TRANSLATION (multi-language) =====
export async function translateText(inputText: string): Promise<TranslationResult> {
  const systemPrompt = `You are a professional Chinese translation expert.

Task: Detect the language of the user's input, then provide two translations into Mandarin Chinese (Simplified).

Provide these fields in JSON:
1. detectedLanguage: The detected language name in English (e.g., "French", "Japanese", "Spanish")
2. chineseDirect: A direct, literal character-by-character translation that preserves the original structure. Learners use this to understand how each word maps to Chinese.
3. chineseNatural: A natural, idiomatic Chinese translation that a native speaker would actually say or write.
4. chinese: Same as chineseNatural (for audio playback)
5. pinyin: Full Pinyin with tone marks for chineseNatural
6. breakdown: Word-by-word breakdown of chineseDirect — array of {chinese, pinyin, literal} objects
7. usageNote: Brief note on register/formality (formal vs. informal, written vs. spoken)
8. culturalNote: Cultural context note if applicable`;

  const text = await generateText('', {
    systemPrompt,
    userInput: inputText,
    userInputLabel: 'Input text',
    jsonMode: true,
    geminiSchema: {
      type: Type.OBJECT,
      properties: {
        detectedLanguage: { type: Type.STRING },
        chineseDirect: { type: Type.STRING },
        chineseNatural: { type: Type.STRING },
        chinese: { type: Type.STRING },
        pinyin: { type: Type.STRING },
        usageNote: { type: Type.STRING },
        culturalNote: { type: Type.STRING },
        breakdown: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              chinese: { type: Type.STRING },
              pinyin: { type: Type.STRING },
              literal: { type: Type.STRING },
            },
            required: ['chinese', 'pinyin', 'literal'],
          },
        },
      },
      required: ['detectedLanguage', 'chineseDirect', 'chineseNatural', 'chinese', 'pinyin', 'breakdown'],
    },
  });

  let data: Record<string, unknown>;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('Failed to parse translation response');
  }
  return { original: inputText, ...data } as TranslationResult;
}

// ===== TTS (always Gemini) =====
export async function generateSpeech(
  text: string,
  voice: VoiceName | string = VoiceName.Zephyr,
): Promise<string | null> {
  const ai = getGeminiAI();
  try {
    const response = await ai.models.generateContent({
      model: MODEL_TTS,
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } },
        },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data ?? null;
  } catch (error) {
    console.error('TTS Error:', error);
    return null;
  }
}

// ===== OMNI READER: AI Smart Clean =====
export async function cleanTextContent(rawText: string): Promise<string> {
  try {
    const result = await generateText('', {
      systemPrompt: `You are an assistant for a text-to-speech app. Clean the user's supplied text by removing URLs, navigation menu items, and irrelevant code blocks. Keep the core content fluent and readable. Do not change the meaning. Return only the cleaned text with no extra commentary.`,
      userInput: rawText.substring(0, 5000),
      userInputLabel: 'Text to clean',
    });
    return result || rawText;
  } catch (e) {
    console.warn('Failed to clean text, using raw:', e);
    return rawText;
  }
}

// ===== FLUENCY COACH =====
export async function generatePracticeMaterial(
  level: ProficiencyLevel,
  topic: Topic,
): Promise<PracticeMaterial> {
  const prompt = `Generate a Chinese practice sentence or short paragraph for a student.
Level: ${level}
Topic: ${topic}

The output must include the Chinese text, full Pinyin, English translation, and key vocabulary breakdown.
Make the content natural and useful for conversation.

Respond with JSON in this format: {"chinese": "...", "pinyin": "...", "translation": "...", "vocabulary": [{"word": "...", "pinyin": "...", "meaning": "..."}]}`;

  const text = await generateText(prompt, {
    jsonMode: true,
    temperature: 0.7,
    geminiSchema: {
      type: Type.OBJECT,
      properties: {
        chinese: { type: Type.STRING },
        pinyin: { type: Type.STRING },
        translation: { type: Type.STRING },
        vocabulary: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              word: { type: Type.STRING },
              pinyin: { type: Type.STRING },
              meaning: { type: Type.STRING },
            },
          },
        },
      },
      required: ['chinese', 'pinyin', 'translation', 'vocabulary'],
    },
  });

  try {
    return JSON.parse(text) as PracticeMaterial;
  } catch {
    throw new Error('Failed to parse practice material response');
  }
}

// Pronunciation evaluation is always Gemini (audio input)
export async function evaluatePronunciation(
  originalText: string,
  audioBlob: Blob,
): Promise<FeedbackResult> {
  const ai = getGeminiAI();
  const base64Audio = await blobToBase64(audioBlob);

  const prompt = `You are an expert Chinese language tutor.
The student was asked to read: "${originalText}".

Listen to the audio and evaluate pronunciation, tones, and fluency.

Return JSON with:
1. score: integer 0–100
2. feedback: 1-2 sentence summary
3. pronunciationTips: list of specific improvements
4. toneAnalysis: specific comments on tone accuracy`;

  const response = await ai.models.generateContent({
    model: SettingsStore.getModelForProvider('gemini'),
    contents: {
      parts: [
        { text: prompt },
        { inlineData: { mimeType: audioBlob.type || 'audio/webm', data: base64Audio } },
      ],
    },
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.INTEGER },
          feedback: { type: Type.STRING },
          pronunciationTips: { type: Type.ARRAY, items: { type: Type.STRING } },
          toneAnalysis: { type: Type.STRING },
        },
        required: ['score', 'feedback', 'pronunciationTips', 'toneAnalysis'],
      },
      temperature: 0.5,
    },
  });

  const text = response.text;
  if (!text) throw new Error('No evaluation returned');
  try {
    return JSON.parse(text) as FeedbackResult;
  } catch {
    throw new Error('Failed to parse pronunciation evaluation response');
  }
}

// ===== IMMERSIVE READER =====
export async function analyzeWordInContext(
  word: string,
  sentence: string,
): Promise<WordAnalysis> {
  const systemPrompt = `Analyze a Chinese word inside the user-provided sentence.

Provide: definition (with pinyin), part of speech, 2-3 example sentences, collocation, and HSK level.

Respond with JSON: {"word": "...", "pinyin": "...", "definition": "...", "partOfSpeech": "...", "examples": ["..."], "collocation": "...", "hskLevel": 1}`;

  try {
    const text = await generateText('', {
      systemPrompt,
      userInput: JSON.stringify({ word, sentence }),
      userInputLabel: 'Word analysis request',
      jsonMode: true,
      geminiSchema: {
        type: Type.OBJECT,
        properties: {
          word: { type: Type.STRING },
          pinyin: { type: Type.STRING },
          definition: { type: Type.STRING },
          partOfSpeech: { type: Type.STRING },
          examples: { type: Type.ARRAY, items: { type: Type.STRING } },
          collocation: { type: Type.STRING },
          hskLevel: { type: Type.NUMBER },
        },
        required: ['word', 'definition', 'partOfSpeech', 'examples'],
      },
    });
    return JSON.parse(text) as WordAnalysis;
  } catch (error) {
    if (error instanceof Error && error.message === 'NO_API_KEY') throw error;
    console.error('Word analysis error:', error);
    return { word, definition: 'Analysis unavailable.', partOfSpeech: 'n/a', examples: [] };
  }
}

export async function analyzeSentenceGrammar(sentence: string): Promise<GrammarAnalysis> {
  const systemPrompt = `Analyze the grammar of the user-provided Chinese sentence.

Provide: overall structure description, detailed explanation, and the grammar pattern used.

Respond with JSON: {"sentence": "...", "structure": "...", "explanation": "...", "pattern": "..."}`;

  try {
    const text = await generateText('', {
      systemPrompt,
      userInput: sentence,
      userInputLabel: 'Sentence to analyze',
      jsonMode: true,
      geminiSchema: {
        type: Type.OBJECT,
        properties: {
          sentence: { type: Type.STRING },
          structure: { type: Type.STRING },
          explanation: { type: Type.STRING },
          pattern: { type: Type.STRING },
        },
        required: ['sentence', 'structure', 'explanation', 'pattern'],
      },
    });
    return JSON.parse(text) as GrammarAnalysis;
  } catch (error) {
    if (error instanceof Error && error.message === 'NO_API_KEY') throw error;
    console.error('Grammar analysis error:', error);
    return { sentence, structure: 'Analysis unavailable', explanation: 'Please check your API key.', pattern: '' };
  }
}

// ===== SHADOWING =====
export async function generateShadowingText(topic: string): Promise<string> {
  const systemPrompt = `Generate a short, engaging Chinese paragraph (about 80-120 characters) for shadowing practice.

The text should:
- Be rhythmic and suitable for reading aloud
- Be at HSK 3-4 level
- Include a thought-group breakdown at the end using "/" to show natural pause points

Format:
[Chinese text]

Pinyin: [full pinyin]

Translation: [English]

Thought groups: [breakdown with /]`;

  try {
    return await generateText('', {
      systemPrompt,
      userInput: topic,
      userInputLabel: 'Topic',
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'NO_API_KEY') throw error;
    console.error('Shadowing text error:', error);
    return 'Error generating text.';
  }
}

// ===== SCRIPT DRAFTING =====
export async function refineScript(draft: string, context: string): Promise<string> {
  const systemPrompt = `The user wants to say something in Chinese.

Task:
1. Rewrite the user's rough draft into natural, idiomatic Mandarin Chinese suitable for the provided context.
2. Provide the full Pinyin.
3. Provide an English back-translation.
4. Explain 2-3 key grammar points or vocabulary choices.

Format the output in Markdown.`;

  try {
    return await generateText('', {
      systemPrompt,
      userInput: JSON.stringify({ context, draft }),
      userInputLabel: 'Script drafting request',
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'NO_API_KEY') throw error;
    console.error('Script refine error:', error);
    return 'Error refining script.';
  }
}
