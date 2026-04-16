import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, Loader2, Volume2, Mic, BookmarkPlus, Upload } from 'lucide-react';
import { SnapAnalysis, VocabCard } from '../../types';
import { analyzeImage } from '../../services/geminiService';
import { ToneVisualizer } from '../../components/ToneVisualizer';
import { Button } from '../../components/ui/Button';
import { playBrowserTTS } from '../../utils/audio';

interface SnapModeProps {
  onSnapComplete?: (detectedObject: string) => void;
  onAddVocab?: (card: Omit<VocabCard, 'id' | 'interval' | 'easeFactor' | 'nextReviewDate' | 'reviewCount' | 'isFavorite'>) => void;
  onNeedApiKey?: () => void;
}

export const SnapMode: React.FC<SnapModeProps> = ({ onSnapComplete, onAddVocab, onNeedApiKey }) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SnapAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPracticing, setIsPracticing] = useState(false);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [vocabAdded, setVocabAdded] = useState(false);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const ms = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      setStream(ms);
      if (videoRef.current) {
        videoRef.current.srcObject = ms;
      }
    } catch {
      setError('Unable to access camera. You can upload an image instead.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setImagePreview(dataUrl);
        processImage(dataUrl);
      }
    }
  };

  const validateImageMagicBytes = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const buf = reader.result as ArrayBuffer;
        const bytes = new Uint8Array(buf);
        // JPEG: FF D8 FF
        if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return resolve(true);
        // PNG: 89 50 4E 47
        if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return resolve(true);
        // GIF: 47 49 46 38
        if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) return resolve(true);
        // WebP: bytes 8-11 are 57 45 42 50
        if (bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return resolve(true);
        resolve(false);
      };
      reader.readAsArrayBuffer(file.slice(0, 12));
    });
  };

  const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so the same file can be re-selected after an error
    e.target.value = '';

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setError('Unsupported file type. Please upload a JPEG, PNG, GIF, or WebP image.');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError('File is too large. Maximum size is 10MB.');
      return;
    }

    const validMagic = await validateImageMagicBytes(file);
    if (!validMagic) {
      setError('File content does not match a supported image format.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      setImagePreview(dataUrl);
      processImage(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const processImage = async (base64DataUrl: string) => {
    setLoading(true);
    setResult(null);
    setError(null);
    setVocabAdded(false);
    stopCamera();
    try {
      const base64Data = base64DataUrl.split(',')[1];
      const mimeType = base64DataUrl.split(';')[0].split(':')[1] || 'image/jpeg';
      const data = await analyzeImage(base64Data, mimeType);
      setResult(data);
      if (data.english && onSnapComplete) {
        onSnapComplete(data.english);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg === 'NO_API_KEY') {
        setError('API key required. Please configure your key in Settings.');
        if (onNeedApiKey) onNeedApiKey();
      } else {
        setError('Analysis failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setImagePreview(null);
    setResult(null);
    setError(null);
    setVocabAdded(false);
    stopPractice();
    startCamera();
  };

  const startPractice = async () => {
    try {
      const ms = await navigator.mediaDevices.getUserMedia({ audio: true });
      setAudioStream(ms);
      setIsPracticing(true);
    } catch {
      console.error('Mic access denied');
    }
  };

  const stopPractice = () => {
    if (audioStream) {
      audioStream.getTracks().forEach((t) => t.stop());
      setAudioStream(null);
    }
    setIsPracticing(false);
  };

  const handleAddVocab = () => {
    if (!result || !onAddVocab) return;
    onAddVocab({
      chinese: result.chinese,
      pinyin: result.pinyin,
      english: result.english,
      exampleSentence: result.sentence,
      hskLevel: result.hskLevel || 1,
      sourceModule: 'snap',
    });
    setVocabAdded(true);
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-120px)] md:h-[calc(100dvh-64px)] relative">
      {/* Camera / Image View */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-slate-900 rounded-2xl mx-4 my-2 shadow-inner border border-slate-800 min-h-[200px]">
        {!imagePreview && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            onLoadedMetadata={() => videoRef.current?.play()}
          />
        )}

        {imagePreview && (
          <div className="relative w-full h-full">
            <img src={imagePreview} className="w-full h-full object-contain bg-black" alt="Captured" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent pointer-events-none" />
          </div>
        )}

        {!imagePreview && !error && (
          <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4 z-20">
            <button
              onClick={captureImage}
              className="w-18 h-18 rounded-full border-4 border-white/40 bg-white/25 flex items-center justify-center hover:bg-white/35 transition-all active:scale-95 shadow-xl"
            >
              <div className="w-14 h-14 bg-white rounded-full shadow-inner" />
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute right-6 bottom-2 p-3 bg-white/25 rounded-full border border-white/40 text-white hover:bg-white/35 transition-all"
              title="Upload image"
            >
              <Upload size={20} />
            </button>
          </div>
        )}

        {error && !imagePreview && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
            <Camera size={48} className="text-slate-600 mb-4" />
            <p className="text-slate-400 mb-4 text-sm">{error}</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-white text-slate-900 rounded-xl font-medium text-sm flex items-center gap-2 hover:bg-slate-100 transition-colors"
            >
              <Upload size={16} /> Upload Image
            </button>
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileUpload}
        />
      </div>

      {/* Result Panel */}
      {(loading || result || (error && imagePreview)) && (
        <div className="absolute inset-x-0 bottom-16 md:bottom-0 z-30 p-4 pointer-events-none">
          <div className="pointer-events-auto max-w-2xl mx-auto bg-white dark:bg-[#1E1E1E] rounded-2xl shadow-2xl p-5 border border-slate-100 dark:border-slate-800">
            {loading && (
              <div className="flex flex-col items-center justify-center py-4 space-y-3">
                <Loader2 className="animate-spin text-brand-600" size={32} />
                <p className="text-slate-600 font-medium">Analyzing image...</p>
              </div>
            )}

            {error && imagePreview && !loading && (
              <div className="text-center py-4">
                <p className="text-red-500 mb-4">{error}</p>
                <button onClick={reset} className="px-6 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors">
                  Try Again
                </button>
              </div>
            )}

            {result && !loading && (
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-brand-600 tracking-wide">Detected Object</span>
                      {result.hskLevel && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wide ${
                          result.hskLevel <= 2 ? 'bg-green-100 text-green-700' :
                          result.hskLevel <= 4 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'}`}>
                          HSK {result.hskLevel}
                        </span>
                      )}
                    </div>
                    <div className="flex items-baseline gap-3">
                      <h3 className="text-3xl font-bold text-slate-900 dark:text-slate-100 font-chinese">{result.chinese}</h3>
                      <span className="text-lg text-slate-500">{result.pinyin}</span>
                    </div>
                    <p className="text-slate-600 mt-0.5">{result.english}</p>
                    {result.radicals && result.radicals.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-2">
                        <span className="text-xs text-slate-400 uppercase font-bold">Radicals:</span>
                        {result.radicals.map((r, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-sm font-chinese">{r}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button onClick={reset} aria-label="Close result" className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-900 transition-colors">
                    <X size={20} />
                  </button>
                </div>

                <div className="bg-slate-50 dark:bg-[#252525] border border-slate-100 dark:border-slate-800 rounded-xl p-3">
                  <h4 className="text-xs font-semibold text-slate-500 mb-2">Example Sentence</h4>
                  <p className="text-base font-chinese text-slate-800 dark:text-slate-200 mb-1">{result.sentence}</p>
                  <p className="text-sm text-brand-600 font-medium mb-0.5">{result.sentencePinyin}</p>
                  <p className="text-sm text-slate-500 italic">{result.sentenceEnglish}</p>
                </div>

                {result.funFact && (
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                    <div className="flex items-start gap-2">
                      <span className="text-lg">💡</span>
                      <div>
                        <h5 className="text-xs font-semibold text-amber-700 mb-1">Fun Fact</h5>
                        <p className="text-sm text-amber-900">{result.funFact}</p>
                      </div>
                    </div>
                  </div>
                )}

                {result.commonMistake && (
                  <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                    <div className="flex items-start gap-2">
                      <span className="text-lg">⚠️</span>
                      <div>
                        <h5 className="text-xs font-semibold text-red-700 mb-1">Common Mistake</h5>
                        <p className="text-sm text-red-900">{result.commonMistake}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => playBrowserTTS(result.chinese)} className="flex-1" aria-label="Listen to pronunciation">
                    <Volume2 size={14} className="mr-1" /> Listen
                  </Button>
                  <Button
                    variant={isPracticing ? 'danger' : 'outline'}
                    size="sm"
                    onClick={isPracticing ? stopPractice : startPractice}
                    className="flex-1"
                    aria-label={isPracticing ? 'Stop practice recording' : 'Start practice recording'}
                  >
                    <Mic size={14} className="mr-1" />
                    {isPracticing ? 'Stop' : 'Practice'}
                  </Button>
                  {onAddVocab && (
                    <Button
                      variant={vocabAdded ? 'ghost' : 'secondary'}
                      size="sm"
                      onClick={handleAddVocab}
                      disabled={vocabAdded}
                      className="flex-1"
                    >
                      <BookmarkPlus size={14} className="mr-1" />
                      {vocabAdded ? 'Saved!' : 'Add to SRS'}
                    </Button>
                  )}
                </div>

                {isPracticing && (
                  <div className="bg-slate-900 rounded-lg p-2">
                    <p className="text-xs text-slate-400 font-medium mb-1 px-1">Tone Visualizer</p>
                    <ToneVisualizer stream={audioStream} height={40} width={250} />
                  </div>
                )}

                <button
                  onClick={reset}
                  className="w-full py-2.5 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-2 text-sm"
                >
                  <Camera size={16} />
                  Capture New Item
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
