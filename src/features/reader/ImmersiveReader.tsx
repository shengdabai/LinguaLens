import React, { useState } from 'react';
import { analyzeWordInContext, analyzeSentenceGrammar } from '../../services/geminiService';
import { WordAnalysis, GrammarAnalysis } from '../../types';
import { Volume2, BookOpen, Loader2, Layers, X } from 'lucide-react';
import { playBrowserTTS } from '../../utils/audio';
import { ApiGate } from '../../components/ApiGate';

const SAMPLE_TEXT = `今天天气很好。我去公园散步，看到很多花和树。春天真美丽！我喜欢在阳光下读书，享受大自然的美好。

中文学习需要坚持不懈。每天练习听说读写，慢慢就会进步。语言是沟通的桥梁，掌握中文可以了解更多中国文化。`;

interface ImmersiveReaderProps {
  onNeedApiKey?: () => void;
}

export const ImmersiveReader: React.FC<ImmersiveReaderProps> = ({ onNeedApiKey }) => {
  const [text, setText] = useState(SAMPLE_TEXT);
  const [wordAnalysis, setWordAnalysis] = useState<WordAnalysis | null>(null);
  const [grammarAnalysis, setGrammarAnalysis] = useState<GrammarAnalysis | null>(null);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [selectedSentence, setSelectedSentence] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [noApiKey, setNoApiKey] = useState(false);

  if (noApiKey) {
    return <ApiGate onGoToSettings={onNeedApiKey ?? (() => {})} featureName="Immersive Reader" />;
  }

  const handleWordClick = async (word: string, sentence: string) => {
    const cleanWord = word.trim();
    if (!cleanWord || cleanWord.length === 0) return;
    setSelectedWord(cleanWord);
    setSelectedSentence(sentence);
    setWordAnalysis(null);
    setGrammarAnalysis(null);
    setLoading(true);
    setShowPanel(true);

    try {
      const result = await analyzeWordInContext(cleanWord, sentence);
      setWordAnalysis(result);
    } catch (e) {
      if (e instanceof Error && e.message === 'NO_API_KEY') {
        setNoApiKey(true);
      } else {
        console.error(e);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGrammarAnalysis = async () => {
    if (!selectedSentence) return;
    setLoading(true);
    try {
      const result = await analyzeSentenceGrammar(selectedSentence);
      setGrammarAnalysis(result);
    } catch (e) {
      if (e instanceof Error && e.message === 'NO_API_KEY') {
        setNoApiKey(true);
      } else {
        console.error(e);
      }
    } finally {
      setLoading(false);
    }
  };

  const renderInteractiveText = () => {
    const sentences = text.match(/[^。！？\n]+[。！？\n]*/g) || [text];
    return sentences.map((sentence, sIdx) => {
      const tokens = sentence.match(/[\u4e00-\u9fff\u3400-\u4dbf]{2,4}|[\u4e00-\u9fff\u3400-\u4dbf]|[^\u4e00-\u9fff\u3400-\u4dbf]/g) || [];
      return (
        <span key={sIdx}>
          {tokens.map((token, tIdx) => {
            const isChinese = /[\u4e00-\u9fff\u3400-\u4dbf]/.test(token);
            if (!isChinese) {
              return <span key={tIdx}>{token}</span>;
            }
            return (
              <button
                key={tIdx}
                type="button"
                onClick={() => handleWordClick(token, sentence)}
                className={`cursor-pointer hover:bg-brand-100 hover:text-brand-800 rounded px-0.5 transition-colors inline-block font-chinese text-xl leading-loose border-none bg-transparent ${
                  selectedWord === token ? 'bg-brand-200 text-brand-900' : 'text-slate-800 dark:text-slate-200'
                }`}
              >
                {token}
              </button>
            );
          })}
        </span>
      );
    });
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Reading area */}
        <div className="flex-1 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen size={16} className="text-slate-500" />
              <span className="text-sm font-bold text-slate-600">Immersive Reader</span>
            </div>
            <button
              onClick={() => playBrowserTTS(text, 'zh-CN')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors text-xs font-medium"
            >
              <Volume2 size={12} /> Read Aloud
            </button>
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full h-28 resize-none bg-white dark:bg-[#252525] border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-300 leading-relaxed font-chinese"
            placeholder="Paste Chinese text here..."
          />

          <div className="bg-white dark:bg-[#1E1E1E] border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm min-h-[200px]">
            <p className="text-xs font-semibold text-slate-500 mb-3">
              Tap any word to analyze
            </p>
            <div className="text-xl leading-loose text-slate-800 font-chinese" role="region" aria-label="Interactive reading area">{renderInteractiveText()}</div>
          </div>
        </div>

        {/* Analysis panel */}
        {showPanel && (
          <div className="w-full lg:w-72 bg-white dark:bg-[#1E1E1E] border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm p-4 space-y-4 h-fit">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-500">Analysis</p>
              <button
                onClick={() => setShowPanel(false)}
                className="p-1 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            {selectedWord && (
              <div>
                <div className="text-4xl font-chinese font-bold text-brand-900 mb-1">{selectedWord}</div>
              </div>
            )}

            {loading && (
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <Loader2 size={14} className="animate-spin" />
                Analyzing...
              </div>
            )}

            {wordAnalysis && !loading && (
              <div className="space-y-3">
                <div>
                  <p className="text-brand-600 font-medium text-sm">{wordAnalysis.pinyin}</p>
                  <p className="text-slate-700 dark:text-slate-300 text-sm font-bold">{wordAnalysis.definition}</p>
                </div>
                {wordAnalysis.examples && wordAnalysis.examples.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 mb-1">Examples</p>
                    <ul className="space-y-1">
                      {wordAnalysis.examples.slice(0, 2).map((ex, i) => (
                        <li key={i} className="text-xs text-slate-600 font-chinese">
                          {ex}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {wordAnalysis.hskLevel && (
                  <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-brand-100 text-brand-700 font-bold">
                    HSK {wordAnalysis.hskLevel}
                  </span>
                )}
              </div>
            )}

            {selectedSentence && !loading && (
              <button
                onClick={handleGrammarAnalysis}
                disabled={loading}
                className="w-full flex items-center justify-center gap-1.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
              >
                <Layers size={12} /> Analyze Sentence Grammar
              </button>
            )}

            {grammarAnalysis && (
              <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
                <p className="text-xs font-semibold text-amber-600 mb-1">Grammar</p>
                <p className="text-xs font-bold text-slate-800 mb-1 font-chinese">{grammarAnalysis.structure}</p>
                <p className="text-xs text-slate-600">{grammarAnalysis.explanation}</p>
                {grammarAnalysis.pattern && (
                  <p className="text-xs text-amber-700 mt-1 font-medium">Pattern: {grammarAnalysis.pattern}</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
