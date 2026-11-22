/**
 * Browser microphone → 16 kHz mono 16-bit WAV, the format the scorer expects.
 *
 * Records with MediaRecorder (webm/opus in Chrome, mp4/aac in Safari), then
 * decodes and resamples with Web Audio, so the server never needs ffmpeg.
 * The mic stream stays open between words so the browser only asks for
 * permission once per session; call dispose() when done.
 */

const TARGET_RATE = 16_000;

export class MicPermissionError extends Error {}

export class WavRecorder {
  private stream: MediaStream | null = null;
  private recorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  // Live input level for UI feedback (not recorded, not sent anywhere).
  private meterCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private meterBuf: Float32Array<ArrayBuffer> | null = null;

  /** Ask for the mic (once). Throws MicPermissionError if denied/unavailable. */
  async open(): Promise<void> {
    if (this.stream) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new MicPermissionError("This browser can't record audio.");
    }
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
    } catch {
      throw new MicPermissionError("Microphone access was blocked.");
    }
    this.meterCtx = new AudioContext();
    this.analyser = this.meterCtx.createAnalyser();
    this.analyser.fftSize = 1024;
    this.meterBuf = new Float32Array(this.analyser.fftSize);
    this.meterCtx.createMediaStreamSource(this.stream).connect(this.analyser);
  }

  /** Current mic loudness, 0 (silent) to 1 (loud). Cheap enough to call every frame. */
  level(): number {
    if (!this.analyser || !this.meterBuf) return 0;
    this.analyser.getFloatTimeDomainData(this.meterBuf);
    let sum = 0;
    for (const v of this.meterBuf) sum += v * v;
    const rms = Math.sqrt(sum / this.meterBuf.length);
    // sqrt curve: quiet speech still visibly moves the ring, shouting maxes it out.
    return Math.min(1, Math.sqrt(rms) * 2.5);
  }

  get isRecording(): boolean {
    return this.recorder?.state === "recording";
  }

  async start(): Promise<void> {
    await this.open();
    this.chunks = [];
    this.recorder = new MediaRecorder(this.stream!);
    this.recorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.chunks.push(e.data);
    };
    this.recorder.start();
  }

  /** Stop and return the clip as a 16 kHz mono WAV Blob. */
  async stop(): Promise<Blob> {
    const recorder = this.recorder;
    if (!recorder || recorder.state !== "recording") throw new Error("Not recording");
    const stopped = new Promise<void>((resolve) => (recorder.onstop = () => resolve()));
    recorder.stop();
    await stopped;
    const blob = new Blob(this.chunks, { type: recorder.mimeType });
    return toWav16k(await blob.arrayBuffer());
  }

  dispose(): void {
    if (this.recorder?.state === "recording") this.recorder.stop();
    this.stream?.getTracks().forEach((t) => t.stop());
    void this.meterCtx?.close();
    this.stream = null;
    this.recorder = null;
    this.meterCtx = null;
    this.analyser = null;
  }
}

async function toWav16k(encoded: ArrayBuffer): Promise<Blob> {
  const ctx = new AudioContext();
  try {
    const decoded = await ctx.decodeAudioData(encoded);
    const length = Math.max(1, Math.ceil(decoded.duration * TARGET_RATE));
    const offline = new OfflineAudioContext(1, length, TARGET_RATE);
    const source = offline.createBufferSource();
    source.buffer = decoded; // multi-channel input is down-mixed to the 1-channel destination
    source.connect(offline.destination);
    source.start();
    const rendered = await offline.startRendering();
    return encodeWav(rendered.getChannelData(0), TARGET_RATE);
  } finally {
    void ctx.close();
  }
}

function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const writeStr = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
  };
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeStr(36, "data");
  view.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return new Blob([buffer], { type: "audio/wav" });
}
