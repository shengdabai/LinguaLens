import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Content } from '@google/genai';
import { SettingsStore } from '../../store/settingsStore';
import { Mic, Square, ArrowLeft, Loader2 } from 'lucide-react';
import { MODEL_LIVE } from '../../config/constants';
import { base64ToFloat32Array, setupMicCapture } from '../../utils/audio';
import { Scenario } from './scenarios';

interface RoleplaySessionProps {
  scenario: Scenario;
  onExit: () => void;
  onSessionComplete?: () => void;
  onNeedApiKey?: () => void;
}

export const RoleplaySession: React.FC<RoleplaySessionProps> = ({ scenario, onExit, onSessionComplete, onNeedApiKey }) => {
  const [connected, setConnected] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [status, setStatus] = useState<string>('Initializing...');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const micCleanupRef = useRef<(() => void) | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const hasCompletedRef = useRef(false);
  const micActiveRef = useRef<boolean>(false);
  const sessionStartRef = useRef<number>(Date.now());

  useEffect(() => {
    connect();
    return () => disconnect();
  }, []);

  // Extract key phrases from scenario for contextual coaching
  const scenarioTips = React.useMemo(() => {
    const match = scenario.systemInstruction.match(/Key phrases?[:\s]+(.+?)\.?\s*$/i);
    if (!match) return ["Try speaking in Chinese!", "Great effort! Keep going."];
    const phrases = match[1].split(/,\s*/);
    return phrases.map((p) => {
      const parts = p.match(/(.+?)\s*\((.+?)\)/);
      return parts ? `Try using '${parts[1].trim()}' (${parts[2].trim()})` : `Try saying: ${p.trim()}`;
    });
  }, [scenario]);

  // Contextual coach feedback based on scenario key phrases
  useEffect(() => {
    if (!connected) return;
    let tipIndex = 0;
    const interval = setInterval(() => {
      setFeedback(scenarioTips[tipIndex % scenarioTips.length]);
      tipIndex++;
      setTimeout(() => setFeedback(null), 5000);
    }, 12000);
    return () => clearInterval(interval);
  }, [connected, scenarioTips]);

  const connect = async () => {
    try {
      setStatus('Requesting microphone...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioCtx = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)({
        sampleRate: 24000,
      });
      audioContextRef.current = audioCtx;

      const apiKey = SettingsStore.getGeminiKey();
      if (!apiKey) {
        setStatus('No API key configured. Go to Settings to add your key.');
        return;
      }
      const ai = new GoogleGenAI({ apiKey });
      setStatus('Connecting to AI Persona...');

      const sessionPromise = ai.live.connect({
        model: MODEL_LIVE,
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } },
          },
          systemInstruction: { parts: [{ text: scenario.systemInstruction }] } as Content,
        },
        callbacks: {
          onopen: () => {
            setConnected(true);
            setMicActive(true);
            micActiveRef.current = true;
            setStatus('Roleplay Active');

            setupMicCapture(stream, (base64) => {
              if (!micActiveRef.current) return;
              sessionPromise.then((session) => {
                session.sendRealtimeInput({
                  media: { mimeType: 'audio/pcm;rate=16000', data: base64 },
                });
              });
            }).then((cleanup) => {
              micCleanupRef.current = cleanup;
            });
          },
          onmessage: async (msg: LiveServerMessage) => {
            const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData && audioContextRef.current) {
              const ctx = audioContextRef.current;
              const float32 = base64ToFloat32Array(audioData);
              const buffer = ctx.createBuffer(1, float32.length, 24000);
              buffer.getChannelData(0).set(float32);
              const source = ctx.createBufferSource();
              source.buffer = buffer;
              source.connect(ctx.destination);
              const currentTime = ctx.currentTime;
              if (nextStartTimeRef.current < currentTime) {
                nextStartTimeRef.current = currentTime;
              }
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
            }
          },
          onclose: () => {
            setConnected(false);
            setStatus('Disconnected');
            if (!hasCompletedRef.current && onSessionComplete) {
              hasCompletedRef.current = true;
              onSessionComplete();
            }
          },
          onerror: (err: unknown) => {
            console.error(err);
            setStatus('Connection Error');
          },
        },
      });
    } catch (e) {
      console.error(e);
      setStatus('Failed to start session');
    }
  };

  const disconnect = () => {
    if (micCleanupRef.current) {
      micCleanupRef.current();
      micCleanupRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setConnected(false);
  };

  const toggleMic = () => {
    setMicActive((v) => {
      micActiveRef.current = !v;
      return !v;
    });
  };

  const handleExit = () => {
    if (!hasCompletedRef.current && onSessionComplete) {
      hasCompletedRef.current = true;
      onSessionComplete();
    }
    disconnect();
    setShowSummary(true);
  };

  const getSessionDuration = () => {
    const seconds = Math.floor((Date.now() - sessionStartRef.current) / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (showSummary) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl text-4xl">
          {scenario.emoji}
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Session Complete!</h2>
        <p className="text-slate-500 text-sm mb-6">{scenario.title} — {scenario.difficulty} ({scenario.hskLevel})</p>
        <div className="grid grid-cols-2 gap-4 mb-6 w-full max-w-xs">
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <p className="text-2xl font-bold text-brand-600">{getSessionDuration()}</p>
            <p className="text-xs text-slate-400 mt-1">Duration</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <p className="text-2xl font-bold text-emerald-600">{scenarioTips.length}</p>
            <p className="text-xs text-slate-400 mt-1">Key Phrases</p>
          </div>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-4 w-full max-w-sm mb-6 text-left">
          <p className="text-xs font-semibold text-slate-500 mb-3">Key Phrases to Review</p>
          <div className="space-y-2">
            {scenarioTips.map((tip, i) => (
              <p key={i} className="text-sm text-slate-700">• {tip}</p>
            ))}
          </div>
        </div>
        <button
          onClick={onExit}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-8 rounded-xl transition-all active:scale-95 text-sm"
        >
          <ArrowLeft size={14} />
          Back to Scenarios
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-120px)] md:h-[calc(100dvh-64px)] relative bg-slate-900 rounded-2xl mx-4 my-2 overflow-hidden border border-slate-800">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4">
        <div className="max-w-md mx-auto bg-black/40 backdrop-blur-md rounded-xl p-4 border border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-600 rounded-full flex items-center justify-center text-xl shadow-lg">
              {scenario.emoji}
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">{scenario.title}</h3>
              <p className="text-slate-400 text-xs truncate max-w-[150px]">{scenario.description}</p>
            </div>
          </div>
          <button
            onClick={handleExit}
            className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
        </div>
      </div>

      {/* Main visual */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
        {feedback && (
          <div className="absolute top-24 left-1/2 -translate-x-1/2 bg-brand-600/90 backdrop-blur-md text-white px-6 py-3 rounded-full text-sm font-medium shadow-xl z-20 max-w-xs text-center">
            ✨ {feedback}
          </div>
        )}

        {!connected && status.startsWith('No API key') ? (
          <div className="flex flex-col items-center text-slate-400 gap-4">
            <p className="text-center">{status}</p>
            {onNeedApiKey && (
              <button
                onClick={onNeedApiKey}
                className="text-sm text-brand-400 hover:text-brand-300 underline transition-colors"
              >
                Go to Settings →
              </button>
            )}
          </div>
        ) : !connected ? (
          <div className="flex flex-col items-center text-slate-400">
            <Loader2 className="animate-spin mb-4" size={40} />
            <p>{status}</p>
          </div>
        ) : (
          <div className="relative flex flex-col items-center">
            <div className="w-48 h-48 rounded-full bg-gradient-to-b from-brand-500 to-brand-700 flex items-center justify-center shadow-[0_0_60px_rgba(184,68,46,0.4)] animate-pulse">
              <div className="w-40 h-40 rounded-full bg-slate-900 flex items-center justify-center">
                <div className="w-32 h-32 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden">
                  <span className="text-6xl">{scenario.emoji}</span>
                </div>
              </div>
            </div>
            <div className="mt-10 text-center space-y-2">
              <div className="px-4 py-2 bg-white/10 rounded-full inline-block backdrop-blur-sm border border-white/5">
                <p className="text-blue-200 text-sm font-medium">AI is listening...</p>
              </div>
              <p className="text-slate-500 text-xs max-w-xs mx-auto italic opacity-70">
                "{scenario.initialPrompt}"
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      {connected && (
        <div className="p-8 pb-10 flex justify-center items-center gap-8">
          <button
            onClick={toggleMic}
            aria-label={micActive ? 'Mute microphone' : 'Unmute microphone'}
            className={`p-6 rounded-full transition-all duration-200 active:scale-95 shadow-xl ${
              micActive
                ? 'bg-white text-slate-900 hover:bg-slate-200'
                : 'bg-red-500/20 text-red-500 ring-1 ring-red-500/30'
            }`}
          >
            <Mic size={32} />
          </button>

          <button
            onClick={handleExit}
            aria-label="End roleplay session"
            className="p-6 rounded-full bg-red-600 text-white hover:bg-red-500 transition-all shadow-lg shadow-red-600/30 active:scale-95"
          >
            <Square size={32} fill="currentColor" />
          </button>
        </div>
      )}
    </div>
  );
};
