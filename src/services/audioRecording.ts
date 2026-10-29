interface RecordingCallbacks {
  onStarted: () => void;
  onStopped: () => void;
  onComplete: (blob: Blob) => void;
  onError: (message: string) => void;
}

interface RecordingDevices {
  requestStream: () => Promise<MediaStream>;
  createRecorder: (stream: MediaStream) => MediaRecorder;
}

/** Owns one microphone stream, including access that resolves after disposal. */
export class AudioRecordingSession {
  private recorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private chunks: Blob[] = [];
  private starting = false;
  private disposed = false;

  constructor(
    private callbacks: RecordingCallbacks,
    private devices: RecordingDevices = {
      requestStream: () => navigator.mediaDevices.getUserMedia({ audio: true }),
      createRecorder: stream => new MediaRecorder(stream),
    },
  ) {}

  async start(): Promise<void> {
    if (this.disposed || this.starting || this.recorder) return;
    this.starting = true;
    try {
      const stream = await this.devices.requestStream();
      if (this.disposed) {
        stream.getTracks().forEach(track => track.stop());
        return;
      }
      this.stream = stream;
      const recorder = this.devices.createRecorder(stream);
      this.recorder = recorder;
      this.chunks = [];
      recorder.ondataavailable = event => {
        if (!this.disposed && this.recorder === recorder && event.data.size > 0) {
          this.chunks.push(event.data);
        }
      };
      recorder.onstop = () => {
        if (this.disposed || this.recorder !== recorder) return;
        const type = recorder.mimeType || this.chunks.find(chunk => chunk.type)?.type || '';
        const blob = new Blob(this.chunks, { type });
        this.release();
        this.callbacks.onStopped();
        if (blob.size) {
          this.callbacks.onComplete(blob);
        } else {
          this.callbacks.onError('No audio was recorded. Please try again.');
        }
      };
      recorder.onerror = () => this.fail('Recording failed. Please try again.');
      recorder.start();
      this.callbacks.onStarted();
    } catch {
      this.fail('Could not start recording. Check microphone access and try again.');
    } finally {
      this.starting = false;
    }
  }

  stop(): void {
    if (!this.recorder || this.recorder.state === 'inactive') return;
    try {
      this.recorder.stop();
    } catch {
      this.fail('Could not finish recording. Please try again.');
    }
  }

  dispose(): void {
    this.disposed = true;
    this.release();
  }

  private fail(message: string): void {
    this.release();
    if (!this.disposed) {
      this.callbacks.onStopped();
      this.callbacks.onError(message);
    }
  }

  private release(): void {
    const recorder = this.recorder;
    this.recorder = null;
    if (recorder) {
      recorder.ondataavailable = null;
      recorder.onstop = null;
      recorder.onerror = null;
      if (recorder.state !== 'inactive') {
        try { recorder.stop(); } catch { /* Always release the stream below. */ }
      }
    }
    this.stream?.getTracks().forEach(track => track.stop());
    this.stream = null;
    this.chunks = [];
  }
}
