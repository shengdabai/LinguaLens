import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, RotateCcw, UploadCloud, Loader2 } from 'lucide-react';
import { AudioRecordingSession } from '../../services/audioRecording';

interface AudioRecorderProps {
  onRecordingComplete: (blob: Blob) => void;
  isEvaluating: boolean;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({ onRecordingComplete, isEvaluating }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [sizeError, setSizeError] = useState<string | null>(null);
  const sessionRef = useRef<AudioRecordingSession | null>(null);
  const startingRef = useRef(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    const session = new AudioRecordingSession({
      onStarted: () => {
        setIsRecording(true);
        setAudioUrl(null);
        setRecordingBlob(null);
        setHasRecorded(false);
      },
      onStopped: () => setIsRecording(false),
      onComplete: blob => {
        setAudioUrl(URL.createObjectURL(blob));
        setRecordingBlob(blob);
        setHasRecorded(true);
      },
      onError: setSizeError,
    });
    sessionRef.current = session;
    return () => {
      mountedRef.current = false;
      sessionRef.current = null;
      session.dispose();
    };
  }, []);

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const startRecording = async () => {
    if (startingRef.current || isRecording || isEvaluating) return;
    startingRef.current = true;
    setIsStarting(true);
    setSizeError(null);
    try {
      await sessionRef.current?.start();
    } finally {
      startingRef.current = false;
      if (mountedRef.current) setIsStarting(false);
    }
  };

  const stopRecording = () => {
    sessionRef.current?.stop();
  };

  const handleReset = () => {
    setAudioUrl(null);
    setRecordingBlob(null);
    setHasRecorded(false);
    setSizeError(null);
  };

  const handleSubmit = () => {
    if (!recordingBlob) return;
    if (recordingBlob.size < 1000) {
      setSizeError('Recording too short. Please speak clearly for at least 1 second.');
      return;
    }
    setSizeError(null);
    onRecordingComplete(recordingBlob);
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white dark:bg-[#1E1E1E] rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
      <div className="mb-4 text-center">
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
          {isStarting ? 'Starting...' : isRecording ? 'Listening...' : hasRecorded ? 'Ready to Submit' : 'Your Turn'}
        </h3>
        <p className="text-sm text-slate-500">
          {isRecording
            ? 'Speak the Chinese phrase clearly.'
            : hasRecorded
            ? 'Review your recording or submit for AI grading.'
            : 'Press the microphone to start recording.'}
        </p>
      </div>

      <div className="flex items-center gap-6">
        {!isRecording && !hasRecorded && (
          <button
            onClick={startRecording}
            disabled={isStarting || isEvaluating}
            aria-busy={isStarting}
            aria-label="Start recording"
            className="group relative flex h-20 w-20 items-center justify-center rounded-full bg-brand-600 text-white shadow-xl transition-all hover:scale-105 hover:shadow-brand-400/40"
          >
            <Mic className="h-8 w-8" />
          </button>
        )}

        {isRecording && (
          <button
            onClick={stopRecording}
            aria-label="Stop recording"
            className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-900 text-white shadow-xl transition-all hover:scale-105"
          >
            <Square className="h-8 w-8 fill-current" />
          </button>
        )}

        {hasRecorded && !isRecording && (
          <div className="flex gap-4">
            <button
              onClick={handleReset}
              disabled={isEvaluating}
              className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-slate-50 text-slate-500 transition-colors disabled:opacity-50"
            >
              <div className="h-12 w-12 flex items-center justify-center rounded-full border-2 border-slate-200">
                <RotateCcw className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium">Retry</span>
            </button>

            <button
              onClick={handleSubmit}
              disabled={isEvaluating}
              className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-green-50 text-green-600 transition-colors disabled:opacity-50"
            >
              <div className="h-12 w-12 flex items-center justify-center rounded-full bg-green-100 border-2 border-green-200">
                {isEvaluating ? <Loader2 className="h-5 w-5 animate-spin" /> : <UploadCloud className="h-6 w-6" />}
              </div>
              <span className="text-xs font-medium">Evaluate</span>
            </button>
          </div>
        )}
      </div>

      {sizeError && (
        <p role="alert" className="mt-3 text-xs text-red-500 text-center">{sizeError}</p>
      )}

      {audioUrl && (
        <div className="mt-6 w-full max-w-md">
          <audio src={audioUrl} controls className="w-full h-10 rounded-lg" aria-label="Your recording playback" />
        </div>
      )}
    </div>
  );
};
