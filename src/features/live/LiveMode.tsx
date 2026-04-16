import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Session } from '@google/genai';
import { SettingsStore } from '../../store/settingsStore';
import { Sparkles, ChevronRight, Mic, Video, Square } from 'lucide-react';
import { MODEL_LIVE } from '../../config/constants';
import { base64ToFloat32Array, setupMicCapture } from '../../utils/audio';
import { ToneVisualizer } from '../../components/ToneVisualizer';

interface LiveModeProps {
  onSessionStart?: () => void;
  onNeedApiKey?: () => void;
}

export const LiveMode: React.FC<LiveModeProps> = ({ onSessionStart, onNeedApiKey }) => {
  const [connected, setConnected] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [videoActive, setVideoActive] = useState(true);
  const [status, setStatus] = useState<string>('Ready to connect');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const micCleanupRef = useRef<(() => void) | null>(null);
  const intervalRef = useRef<number | null>(null);
  const micActiveRef = useRef<boolean>(false);
  const videoActiveRef = useRef<boolean>(true);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  const connectWithCallbacks = async () => {
    try {
      setStatus('Initializing hardware...');

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: { width: 640, height: 480 },
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

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
      setStatus('Connecting to Gemini Live...');

      const sessionPromise = ai.live.connect({
        model: MODEL_LIVE,
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } },
          },
          systemInstruction: {
            parts: [{ text: 'You are an expert Chinese language tutor. Your goal is to help the user learn Mandarin Chinese vocabulary and pronunciation based on what they show you or say. Always provide the Mandarin Chinese word and Pinyin when identifying objects. Keep your responses concise, encouraging, and educational. Speak in simple Chinese when appropriate, offering English explanations for new vocabulary. If the user is silent, ask them to show you something or prompt them with a Chinese phrase to repeat.' }],
          },
        },
        callbacks: {
          onopen: () => {
            setConnected(true);
            setMicActive(true);
            micActiveRef.current = true;
            setStatus('Session Active');
            if (onSessionStart) onSessionStart();

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

            startVideoStreaming(sessionPromise);
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
          },
          onerror: (err: unknown) => {
            console.error(err);
            setStatus('Error connecting');
            setConnected(false);
          },
        },
      });
    } catch (e) {
      console.error(e);
      setStatus('Failed to start');
    }
  };

  const startVideoStreaming = (sessionPromise: Promise<Session>) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = window.setInterval(() => {
      if (!videoActiveRef.current) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return;

      canvas.width = video.videoWidth * 0.5;
      canvas.height = video.videoHeight * 0.5;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL('image/jpeg', 0.6).split(',')[1];
        sessionPromise.then((session: Session) => {
          session.sendRealtimeInput({
            media: { mimeType: 'image/jpeg', data: base64 },
          });
        });
      }
    }, 1000);
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
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setConnected(false);
    setStatus('Ready to connect');
  };

  const toggleMic = () => {
    setMicActive((v) => {
      micActiveRef.current = !v;
      return !v;
    });
  };
  const toggleVideo = () => {
    setVideoActive((v) => {
      videoActiveRef.current = !v;
      return !v;
    });
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-120px)] md:h-[calc(100dvh-64px)] relative">
      <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-slate-900 rounded-2xl mx-4 my-2 shadow-2xl border border-slate-800">
        <video
          ref={videoRef}
          className={`w-full h-full object-cover transition-opacity duration-700 ${connected ? 'opacity-100' : 'opacity-40 blur-sm'}`}
          muted
          playsInline
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Status overlay */}
        <div className="absolute top-6 left-6 z-10 flex flex-col gap-2 pointer-events-none">
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider backdrop-blur-md shadow-sm transition-colors duration-500 ${
              connected
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : 'bg-slate-700/50 text-slate-300 border border-slate-600'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-red-500 animate-pulse' : 'bg-slate-400'}`} />
            {connected ? 'Live Session' : 'Offline'}
          </div>
          {connected && (
            <div className="flex flex-col gap-2 items-start">
              <div className="px-3 py-1 bg-black/40 backdrop-blur-md rounded-md text-sm text-slate-200 border border-white/10 max-w-xs">
                Listening & Watching...
              </div>
              <div className="bg-black/40 backdrop-blur-md rounded-lg p-1 border border-white/10 mt-1">
                <ToneVisualizer stream={streamRef.current} height={30} width={100} isActive={micActive} />
              </div>
            </div>
          )}
        </div>

        {/* Start screen */}
        {!connected && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-20 p-6 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-brand-500 to-brand-700 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-brand-500/20 ring-4 ring-white/10">
              <Sparkles className="text-white" size={36} />
            </div>
            <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">Real-time Tutor</h2>
            <p className="text-slate-300 max-w-md mb-8 leading-relaxed">
              Experience live Chinese learning. Show the camera objects to learn their names, or practice conversation in
              real-time.
            </p>
            <button
              onClick={connectWithCallbacks}
              className="group relative flex items-center gap-3 bg-white text-slate-900 px-8 py-3.5 rounded-full font-bold hover:bg-slate-50 transition-all active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.15)]"
            >
              Start Session
              <ChevronRight size={18} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
            </button>
            <p className="mt-6 text-xs text-slate-500 font-mono tracking-wide">{status}</p>
            {status.startsWith('No API key') && onNeedApiKey && (
              <button
                onClick={onNeedApiKey}
                className="mt-3 text-sm text-brand-400 hover:text-brand-300 underline transition-colors"
              >
                Go to Settings →
              </button>
            )}
          </div>
        )}
      </div>

      {/* Controls */}
      {connected && (
        <div className="absolute bottom-8 md:bottom-4 left-1/2 -translate-x-1/2 z-30">
          <div className="flex items-center gap-6 px-10 py-5 bg-black/60 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl">
            <button
              onClick={toggleMic}
              aria-label={micActive ? 'Mute microphone' : 'Unmute microphone'}
              className={`p-4 rounded-full transition-all duration-200 ${
                micActive
                  ? 'bg-white text-slate-900 hover:bg-slate-200'
                  : 'bg-red-500/20 text-red-400 hover:bg-red-500/30 ring-1 ring-red-500/30'
              }`}
            >
              <Mic size={24} />
            </button>

            <div className="w-px h-8 bg-white/10" aria-hidden="true" />

            <button
              onClick={toggleVideo}
              aria-label={videoActive ? 'Disable camera' : 'Enable camera'}
              className={`p-4 rounded-full transition-all duration-200 ${
                videoActive
                  ? 'bg-slate-700/50 text-white hover:bg-slate-600/50'
                  : 'bg-red-500/20 text-red-400 hover:bg-red-500/30 ring-1 ring-red-500/30'
              }`}
            >
              <Video size={24} />
            </button>

            <div className="w-px h-8 bg-white/10" aria-hidden="true" />

            <button
              onClick={disconnect}
              aria-label="End session"
              className="p-4 rounded-full bg-red-600 text-white hover:bg-red-500 transition-all shadow-lg shadow-red-600/30 active:scale-95"
            >
              <Square size={24} fill="currentColor" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
