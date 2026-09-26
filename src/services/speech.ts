// Ultra-audible speech service combining Gemini Studio TTS with high-gain Web Speech synthesis

export class SpeechService {
  private static synth: SpeechSynthesis | null = typeof window !== 'undefined' ? window.speechSynthesis : null;
  private static audioCtx: AudioContext | null = null;
  private static gainNode: GainNode | null = null;
  private static currentAudioSource: AudioBufferSourceNode | null = null;
  public static isLoudBoostEnabled: boolean = true; // Extra audible for streets and noisy transit

  // Initializes Web Audio Context for audio decoding and volume boosting
  private static getAudioContext(): { ctx: AudioContext; gain: GainNode } {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
      this.gainNode = this.audioCtx.createGain();
      // 1.5x gain boost for high audibility
      this.gainNode.gain.value = this.isLoudBoostEnabled ? 1.5 : 1.0;
      this.gainNode.connect(this.audioCtx.destination);
    } else if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return { ctx: this.audioCtx, gain: this.gainNode! };
  }

  // Toggles loud volume booster
  public static setLoudBoost(enabled: boolean): void {
    this.isLoudBoostEnabled = enabled;
    if (this.gainNode) {
      this.gainNode.gain.value = enabled ? 1.5 : 1.0;
    }
  }

  // Play PCM 24kHz audio from Gemini TTS
  public static async playPcmAudio(base64Data: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const { ctx, gain } = this.getAudioContext();

        // Stop any current audio
        this.stop();

        const binaryString = atob(base64Data);
        const len = binaryString.length;
        const bytes = new Int16Array(len / 2);

        for (let i = 0; i < len; i += 2) {
          bytes[i / 2] = (binaryString.charCodeAt(i + 1) << 8) | binaryString.charCodeAt(i);
        }

        const float32 = new Float32Array(bytes.length);
        for (let i = 0; i < bytes.length; i++) {
          float32[i] = bytes[i] / 32768.0;
        }

        const audioBuffer = ctx.createBuffer(1, float32.length, 24000);
        audioBuffer.copyToChannel(float32, 0);

        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(gain);

        source.onended = () => {
          this.currentAudioSource = null;
          resolve();
        };

        this.currentAudioSource = source;
        source.start();
      } catch (err) {
        console.warn('PCM Audio playback error, falling back:', err);
        reject(err);
      }
    });
  }

  // High-fidelity speech with automatic loud audibility
  public static async speak(text: string, lang = 'en-US', slow = false, preferredVoice = 'Kore'): Promise<void> {
    // 1. First attempt: Gemini Studio TTS for natural, articulate human voice
    try {
      const response = await fetch('/api/companion/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice: preferredVoice }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data?.audio) {
          await this.playPcmAudio(data.audio);
          return;
        }
      }
    } catch (e) {
      // Fall through to browser speech synthesis
    }

    // 2. Browser Web Speech fallback with natural voice prioritization & maximum volume
    return new Promise((resolve) => {
      if (!this.synth) {
        resolve();
        return;
      }

      this.synth.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.volume = 1.0; // Max volume for clear audibility
      utterance.rate = slow ? 0.8 : 0.95; // Slightly slower than 1.0 for better clarity
      utterance.pitch = 1.05;

      const voices = this.synth.getVoices();

      // Find the most natural/loud voice
      const bestVoice =
        voices.find((v) => v.lang.toLowerCase() === lang.toLowerCase() && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Neural') || v.name.includes('Premium') || v.name.includes('Siri'))) ||
        voices.find((v) => v.lang.toLowerCase() === lang.toLowerCase()) ||
        voices.find((v) => v.lang.toLowerCase().startsWith(lang.slice(0, 2).toLowerCase()));

      if (bestVoice) {
        utterance.voice = bestVoice;
      }

      utterance.onend = () => resolve();
      utterance.onerror = (e) => {
        console.warn('Speech synthesis ended with error:', e);
        resolve();
      };

      this.synth.speak(utterance);
    });
  }

  // Stops any playing speech or audio
  public static stop(): void {
    if (this.currentAudioSource) {
      try {
        this.currentAudioSource.stop();
      } catch (e) {
        // ignore
      }
      this.currentAudioSource = null;
    }
    if (this.synth) {
      this.synth.cancel();
    }
  }

  // Starts Speech Recognition for voice conversation
  public static startListening(
    lang = 'en-US',
    onResult: (transcript: string) => void,
    onError: (error: string) => void,
    onEnd: () => void
  ): { stop: () => void } | null {
    if (typeof window === 'undefined') return null;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      onError('Microphone speech recognition is not supported in this browser. Please type or use Chrome/Safari/Edge.');
      return null;
    }

    try {
      const recognizer = new SpeechRecognition();
      recognizer.lang = lang;
      recognizer.interimResults = false;
      recognizer.maxAlternatives = 1;
      recognizer.continuous = false;

      recognizer.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript || '';
        if (transcript) {
          onResult(transcript);
        }
      };

      recognizer.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        onError(event.error === 'not-allowed' ? 'Microphone permission denied.' : `Speech error: ${event.error}`);
      };

      recognizer.onend = () => {
        onEnd();
      };

      recognizer.start();

      return {
        stop: () => {
          try {
            recognizer.stop();
          } catch (e) {
            // ignore
          }
        },
      };
    } catch (err: any) {
      onError(err?.message || 'Failed to start microphone');
      return null;
    }
  }
}
