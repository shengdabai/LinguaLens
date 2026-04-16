import React, { useState, useRef, useCallback, useEffect } from 'react';
import { VoiceName, ReaderMode } from '../../types';
import { generateSpeech, cleanTextContent } from '../../services/geminiService';
import { decodeBase64, decodeAudioData, getSharedPlaybackAudioContext } from '../../utils/audio';
import { Play, Pause, ChevronLeft, Sparkles, BookOpen, Loader2 } from 'lucide-react';
import { ApiGate } from '../../components/ApiGate';

interface OmniReaderProps {
  onRead?: () => void;
  onNeedApiKey?: () => void;
}

export const OmniReader: React.FC<OmniReaderProps> = ({ onRead, onNeedApiKey }) => {
  const [mode, setMode] = useState<ReaderMode>(ReaderMode.INPUT);
  const [inputText, setInputText] = useState('');
  const [currentVoice, setCurrentVoice] = useState<VoiceName>(VoiceName.Zephyr);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [noApiKey, setNoApiKey] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const startTimeRef = useRef<number>(0);
  const pauseTimeRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);

  const getAudioContext = () => getSharedPlaybackAudioContext(24000);

  const handleStop = useCallback(() => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
        sourceNodeRef.current.disconnect();
      } catch {
        // ignore
      }
      sourceNodeRef.current = null;
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    return () => {
      handleStop();
      audioBufferRef.current = null;
      pauseTimeRef.current = 0;
    };
  }, [handleStop]);

  const handlePlay = async () => {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') await ctx.resume();
    if (!audioBufferRef.current) return;

    const source = ctx.createBufferSource();
    source.buffer = audioBufferRef.current;
    source.connect(ctx.destination);
    sourceNodeRef.current = source;

    source.onended = () => {
      source.disconnect();
      const elapsed = ctx.currentTime - startTimeRef.current;
      if (elapsed >= (audioBufferRef.current?.duration || 0)) {
        setIsPlaying(false);
        setPlaybackTime(0);
        pauseTimeRef.current = 0;
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
      }
    };

    const offset = pauseTimeRef.current % (audioBufferRef.current.duration || 1);
    startTimeRef.current = ctx.currentTime - offset;
    source.start(0, offset);
    setIsPlaying(true);

    const updateProgress = () => {
      const elapsed = ctx.currentTime - startTimeRef.current;
      setPlaybackTime(Math.min(elapsed, audioBufferRef.current?.duration || 0));
      if (elapsed < (audioBufferRef.current?.duration || 0)) {
        rafRef.current = requestAnimationFrame(updateProgress);
      }
    };
    rafRef.current = requestAnimationFrame(updateProgress);
  };

  const handlePause = () => {
    const ctx = getAudioContext();
    handleStop();
    pauseTimeRef.current = ctx.currentTime - startTimeRef.current;
  };

  const handleGenerateAndPlay = async () => {
    if (!inputText.trim()) return;
    setIsLoading(true);
    setMode(ReaderMode.PLAYER);
    handleStop();
    pauseTimeRef.current = 0;
    setPlaybackTime(0);
    setDuration(0);

    try {
      const base64Audio = await generateSpeech(inputText, currentVoice);
      if (base64Audio) {
        const ctx = getAudioContext();
        const rawBytes = decodeBase64(base64Audio);
        const buffer = await decodeAudioData(rawBytes, ctx, 24000, 1);
        audioBufferRef.current = buffer;
        setDuration(buffer.duration);
        setIsLoading(false);
        if (onRead) onRead();
        handlePlay();
      }
    } catch (err) {
      if (err instanceof Error && err.message === 'NO_API_KEY') {
        setNoApiKey(true);
      } else {
        console.error('Playback failed', err);
      }
      setIsLoading(false);
      setMode(ReaderMode.INPUT);
    }
  };

  const handleSmartClean = async () => {
    if (!inputText.trim()) return;
    setIsCleaning(true);
    try {
      const cleaned = await cleanTextContent(inputText);
      setInputText(cleaned);
    } catch (err) {
      if (err instanceof Error && err.message === 'NO_API_KEY') {
        setNoApiKey(true);
      } else {
        console.error(err);
      }
    } finally {
      setIsCleaning(false);
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec < 10 ? '0' : ''}${sec}`;
  };

  const voiceDescriptions: Record<VoiceName, string> = {
    [VoiceName.Zephyr]: 'Bright',
    [VoiceName.Kore]: 'Firm',
    [VoiceName.Fenrir]: 'Excitable',
    [VoiceName.Puck]: 'Upbeat',
  };

  if (noApiKey) {
    return <ApiGate onGoToSettings={onNeedApiKey ?? (() => {})} featureName="OmniReader" />;
  }

  if (mode === ReaderMode.INPUT) {
    return (
      <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Source Content</label>
          <div className="bg-white dark:bg-surface-dark-card rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-4">
            <textarea
              className="w-full h-48 resize-none outline-none text-base leading-relaxed text-slate-800 dark:text-slate-100 placeholder-slate-300 dark:placeholder-slate-500 bg-transparent"
              placeholder="Paste any Chinese article, text, or passage here to listen..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            {inputText.length > 50 && (
              <div className="flex justify-end mt-2 border-t border-slate-100 dark:border-slate-700 pt-2">
                <button
                  onClick={handleSmartClean}
                  disabled={isCleaning}
                  className="text-xs flex items-center gap-1 text-purple-600 dark:text-purple-300 font-medium px-3 py-1 bg-purple-50 dark:bg-purple-900/30 rounded-full hover:bg-purple-100 dark:hover:bg-purple-800/40 transition-colors disabled:opacity-50"
                >
                  {isCleaning ? (
                    <Loader2 size={10} className="animate-spin" />
                  ) : (
                    <Sparkles size={10} />
                  )}
                  {isCleaning ? 'Cleaning...' : 'AI Smart Clean'}
                </button>
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Voice</label>
          <div className="grid grid-cols-2 gap-2">
            {Object.values(VoiceName).map((voice) => (
              <button
                key={voice}
                onClick={() => setCurrentVoice(voice)}
                className={`p-3 rounded-xl border font-medium transition-all text-sm ${
                  currentVoice === voice
                    ? 'bg-brand-50 dark:bg-brand-900/30 border-brand-400 dark:border-brand-500 text-brand-700 dark:text-brand-300 shadow-sm'
                    : 'bg-white dark:bg-surface-dark-card border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span className="font-bold">{voice}</span>
                <span className="text-xs text-slate-400 dark:text-slate-500 ml-1">· {voiceDescriptions[voice]}</span>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleGenerateAndPlay}
          disabled={!inputText.trim() || isLoading}
          className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 text-white font-medium py-3 rounded-xl transition-all active:scale-95 disabled:opacity-50"
        >
          <Play size={16} fill="currentColor" />
          Start Listening
        </button>
      </div>
    );
  }

  // Player mode
  return (
    <div className="flex flex-col h-[calc(100dvh-120px)] md:h-[calc(100dvh-100px)] bg-white dark:bg-surface-dark relative">
      <div className="px-6 pt-6 flex items-center justify-between">
        <button
          onClick={() => {
            handleStop();
            setMode(ReaderMode.INPUT);
          }}
          className="flex items-center gap-1 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ChevronLeft size={20} />
          <span className="font-medium text-sm">Back</span>
        </button>
        <span className="text-xs font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase">Now Playing</span>
        <div className="w-16" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div
          className={`w-56 h-56 rounded-3xl shadow-2xl bg-gradient-to-br from-brand-400 to-brand-800 flex items-center justify-center mb-8 transform transition-transform duration-700 ${
            isPlaying ? 'scale-100' : 'scale-95 opacity-90'
          }`}
        >
          <BookOpen size={64} className="text-white/60" />
        </div>
        <div className="w-full max-w-sm space-y-1 text-center">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Current Selection</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm line-clamp-2 h-10 font-chinese">
            {inputText.substring(0, 80)}...
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-surface-dark-card pb-12 pt-4 px-8 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.05)] dark:shadow-none">
        <div className="mb-6">
          <div className="relative h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full bg-slate-800 dark:bg-slate-200 rounded-full transition-all duration-100"
              style={{ width: `${duration > 0 ? (playbackTime / duration) * 100 : 0}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5 text-xs font-mono text-slate-400 dark:text-slate-500">
            <span>{formatTime(playbackTime)}</span>
            <span>{isLoading ? '--:--' : formatTime(duration)}</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-12">
          <button
            onClick={isPlaying ? handlePause : handlePlay}
            disabled={isLoading}
            className="w-20 h-20 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-full flex items-center justify-center shadow-xl shadow-slate-400/30 dark:shadow-none hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 size={28} className="animate-spin" />
            ) : isPlaying ? (
              <Pause size={28} fill="currentColor" />
            ) : (
              <Play size={28} fill="currentColor" />
            )}
          </button>
        </div>

        <div className="mt-6 flex justify-center">
          <span className="text-xs font-medium text-slate-400 dark:text-slate-500 opacity-50">
            Gemini TTS · {currentVoice}
          </span>
        </div>
      </div>
    </div>
  );
};
