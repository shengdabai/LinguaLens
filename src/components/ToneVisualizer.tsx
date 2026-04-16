import React, { useEffect, useRef } from 'react';

interface ToneVisualizerProps {
  stream: MediaStream | null;
  height?: number;
  width?: number;
  isActive?: boolean;
}

export const ToneVisualizer: React.FC<ToneVisualizerProps> = React.memo(({
  stream,
  height = 100,
  width = 300,
  isActive = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Scale canvas for retina/HiDPI displays
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.scale(dpr, dpr);
    }
  }, [width, height]);

  useEffect(() => {
    if (!stream || !isActive) return;

    const setupAudio = async () => {
      try {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
          // Resume AudioContext on user gesture (required by Safari/iOS)
          if (audioContextRef.current.state === 'suspended') {
            await audioContextRef.current.resume();
          }
        }
        const audioCtx = audioContextRef.current;
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 2048;
        analyserRef.current = analyser;

        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);
        sourceRef.current = source;

        const bufferLength = analyser.frequencyBinCount;
        dataArrayRef.current = new Uint8Array(bufferLength) as Uint8Array<ArrayBuffer>;

        draw();
      } catch (err) {
        console.error('Error setting up audio visualizer:', err);
      }
    };

    setupAudio();

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (sourceRef.current) sourceRef.current.disconnect();
    };
  }, [stream, isActive]);

  const draw = () => {
    if (!canvasRef.current || !analyserRef.current || !dataArrayRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Use logical size (CSS pixels), not physical canvas size
    const w = canvas.clientWidth || canvas.width;
    const h = canvas.clientHeight || canvas.height;
    const analyser = analyserRef.current;
    const dataArray = dataArrayRef.current;

    animationFrameRef.current = requestAnimationFrame(draw);
    analyser.getByteTimeDomainData(dataArray);

    ctx.fillStyle = 'rgb(20, 20, 30)';
    ctx.fillRect(0, 0, w, h);

    ctx.lineWidth = 2;
    ctx.strokeStyle = '#60A5FA';
    ctx.beginPath();

    const sliceWidth = (w * 1.0) / dataArray.length;
    let x = 0;

    for (let i = 0; i < dataArray.length; i++) {
      const v = dataArray[i] / 128.0;
      const y = (v * h) / 2;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
      x += sliceWidth;
    }

    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
  };

  return (
    <div className="rounded-xl overflow-hidden shadow-inner border border-slate-700 bg-slate-900">
      <canvas ref={canvasRef} width={width} height={height} className="block w-full h-full" />
    </div>
  );
});
