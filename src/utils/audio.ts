export function base64ToFloat32Array(base64: string): Float32Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const int16 = new Int16Array(bytes.buffer);
  const float32 = new Float32Array(int16.length);
  for (let i = 0; i < int16.length; i++) {
    float32[i] = int16[i] / 32768.0;
  }
  return float32;
}

export function float32ToPCM16(float32: Float32Array): Uint8Array {
  const int16 = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return new Uint8Array(int16.buffer);
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

let sharedPlaybackAudioContext: AudioContext | null = null;

export function getSharedPlaybackAudioContext(sampleRate = 24000): AudioContext {
  if (sharedPlaybackAudioContext && sharedPlaybackAudioContext.state !== 'closed') {
    return sharedPlaybackAudioContext;
  }
  sharedPlaybackAudioContext = new (window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)({
    sampleRate,
  });
  return sharedPlaybackAudioContext;
}

export async function closeSharedPlaybackAudioContext(): Promise<void> {
  if (!sharedPlaybackAudioContext || sharedPlaybackAudioContext.state === 'closed') {
    sharedPlaybackAudioContext = null;
    return;
  }
  await sharedPlaybackAudioContext.close();
  sharedPlaybackAudioContext = null;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate = 24000,
  numChannels = 1,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export async function playPCMAudio(base64Audio: string): Promise<void> {
  try {
    const audioContext = getSharedPlaybackAudioContext(24000);
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }
    const bytes = decodeBase64(base64Audio);
    const audioBuffer = await decodeAudioData(bytes, audioContext);
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.onended = () => {
      source.disconnect();
    };
    source.start();
  } catch (error) {
    console.error('Failed to play audio:', error);
  }
}

/**
 * Sets up AudioWorklet-based microphone capture, returning a cleanup function.
 * Falls back to ScriptProcessorNode if AudioWorklet is unavailable.
 */
export async function setupMicCapture(
  stream: MediaStream,
  onPCM16: (base64: string) => void,
): Promise<() => void> {
  const inputCtx = new (window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)({
    sampleRate: 16000,
  });
  const source = inputCtx.createMediaStreamSource(stream);

  try {
    await inputCtx.audioWorklet.addModule('/pcm-processor.js');
    const workletNode = new AudioWorkletNode(inputCtx, 'pcm-processor');
    workletNode.port.onmessage = (e: MessageEvent) => {
      const pcm16 = new Uint8Array(e.data.pcm16 as ArrayBuffer);
      onPCM16(arrayBufferToBase64(pcm16.buffer as ArrayBuffer));
    };
    source.connect(workletNode);
    workletNode.connect(inputCtx.destination);
    return () => {
      workletNode.disconnect();
      source.disconnect();
      inputCtx.close();
    };
  } catch {
    // Fallback to ScriptProcessorNode
    const processor = inputCtx.createScriptProcessor(4096, 1, 1);
    processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      const pcm16 = float32ToPCM16(inputData);
      onPCM16(arrayBufferToBase64(pcm16.buffer as ArrayBuffer));
    };
    source.connect(processor);
    processor.connect(inputCtx.destination);
    return () => {
      processor.disconnect();
      source.disconnect();
      inputCtx.close();
    };
  }
}

export function playBrowserTTS(text: string, lang = 'zh-CN'): void {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    window.speechSynthesis.speak(utterance);
  }
}
