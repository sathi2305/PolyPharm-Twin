/**
 * Multilingual Voice Assistant Service
 * Speech-to-Text (STT) & Text-to-Speech (TTS) Pipeline
 * Supports all 18 specified languages with voice detection and fallback
 */

export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking';

class VoiceService {
  private recognition: any = null;
  private isListening: boolean = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private currentAudio: HTMLAudioElement | null = null;
  private cachedVoices: SpeechSynthesisVoice[] = [];
  private currentSpeakId: number = 0;
  private fetchAbortController: AbortController | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
      }

      if ('speechSynthesis' in window) {
        this.loadVoices();
        window.speechSynthesis.onvoiceschanged = () => {
          this.loadVoices();
        };
      }
    }
  }

  private loadVoices(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.cachedVoices = window.speechSynthesis.getVoices();
    }
  }

  public isSpeechSupported(): boolean {
    return Boolean(typeof window !== 'undefined' && ('speechSynthesis' in window || typeof Audio !== 'undefined'));
  }

  public isRecognitionSupported(): boolean {
    return Boolean(this.recognition);
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    if (this.cachedVoices.length === 0 && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.cachedVoices = window.speechSynthesis.getVoices();
    }
    return this.cachedVoices;
  }

  public startListening(
    langCode: string,
    onResult: (transcript: string, isFinal: boolean) => void,
    onError: (err: string) => void,
    onEnd: () => void
  ) {
    if (!this.recognition) {
      onError('Speech recognition is not supported in this browser.');
      return;
    }

    try {
      this.stopListening();
      this.recognition.lang = langCode || 'en-US';
      this.isListening = true;

      this.recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        if (final) {
          onResult(final.trim(), true);
        } else if (interim) {
          onResult(interim.trim(), false);
        }
      };

      this.recognition.onerror = (event: any) => {
        this.isListening = false;
        onError(event.error || 'Speech recognition error');
      };

      this.recognition.onend = () => {
        this.isListening = false;
        onEnd();
      };

      this.recognition.start();
    } catch (e: any) {
      this.isListening = false;
      onError(e.message || 'Failed to start microphone');
    }
  }

  public stopListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (err) {
        console.warn('Error stopping recognition:', err);
      }
      this.isListening = false;
    }
  }

  public async speak(
    text: string,
    langCode: string = 'en-US',
    onStart?: () => void,
    onEnd?: () => void
  ) {
    // Stop any existing audio or speech synthesis immediately
    this.stopSpeaking();

    // Unique token for this speech invocation to discard outdated async callbacks
    const speakId = ++this.currentSpeakId;
    this.fetchAbortController = new AbortController();
    const abortSignal = this.fetchAbortController.signal;

    // Clean text of markdown, latex, URLs and special symbols for fluid speech
    const cleanText = text
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\$\$(.*?)\$\$/g, '$1')
      .replace(/\$(.*?)\$/g, '$1')
      .replace(/[#*_~>]/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/\n\s*\n/g, '. ')
      .replace(/\n/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 380);

    if (!cleanText) {
      onEnd?.();
      return;
    }

    // Step 1: Call server neural TTS (Gemini flash lite TTS) which naturally speaks in any language
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleanText, language: langCode }),
        signal: abortSignal,
      });

      // If speech was cancelled or replaced while fetching, do not play
      if (this.currentSpeakId !== speakId || abortSignal.aborted) {
        return;
      }

      if (res.ok) {
        const data = await res.json();
        if (this.currentSpeakId !== speakId || abortSignal.aborted) {
          return;
        }

        if (data.audio) {
          // Double check no other audio or speech is running
          if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
          }

          const audioUrl = `data:${data.mimeType || 'audio/wav'};base64,${data.audio}`;
          const audio = new Audio(audioUrl);
          this.currentAudio = audio;

          audio.onplay = () => {
            if (this.currentSpeakId === speakId) {
              onStart?.();
            }
          };

          audio.onended = () => {
            if (this.currentSpeakId === speakId) {
              this.currentAudio = null;
              onEnd?.();
            }
          };

          audio.onerror = (e) => {
            console.warn('[PolyPharm Voice] Audio playback failed, falling back to Web Speech API:', e);
            if (this.currentSpeakId === speakId) {
              this.currentAudio = null;
              this.speakWithSpeechSynthesis(cleanText, langCode, onStart, onEnd, speakId);
            }
          };

          await audio.play();
          return;
        }
      }
    } catch (err: any) {
      if (err?.name === 'AbortError' || this.currentSpeakId !== speakId) {
        return;
      }
      console.warn('[PolyPharm Voice] Neural TTS request failed, falling back to Web Speech API:', err);
    }

    // Step 2: Fallback to browser Web Speech API only if this is still the active speak request
    if (this.currentSpeakId === speakId) {
      this.speakWithSpeechSynthesis(cleanText, langCode, onStart, onEnd, speakId);
    }
  }

  private speakWithSpeechSynthesis(
    cleanText: string,
    langCode: string,
    onStart?: () => void,
    onEnd?: () => void,
    speakId?: number
  ) {
    if (speakId !== undefined && this.currentSpeakId !== speakId) {
      return;
    }

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      onEnd?.();
      return;
    }

    try {
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = langCode;
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      const voices = this.getAvailableVoices();
      const normalizedLang = langCode.toLowerCase().replace('_', '-');
      const baseLang = normalizedLang.split('-')[0];

      const matchedVoice =
        voices.find((v) => v.lang.toLowerCase().replace('_', '-') === normalizedLang) ||
        voices.find((v) => v.lang.toLowerCase().replace('_', '-').startsWith(baseLang + '-')) ||
        voices.find((v) => v.lang.toLowerCase().startsWith(baseLang));

      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }

      utterance.onstart = () => {
        if (speakId === undefined || this.currentSpeakId === speakId) {
          onStart?.();
        }
      };

      utterance.onend = () => {
        if (speakId === undefined || this.currentSpeakId === speakId) {
          this.currentUtterance = null;
          onEnd?.();
        }
      };

      utterance.onerror = (e) => {
        console.warn('Speech synthesis error:', e);
        if (speakId === undefined || this.currentSpeakId === speakId) {
          this.currentUtterance = null;
          onEnd?.();
        }
      };

      this.currentUtterance = utterance;
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Speech playback failure:', err);
      onEnd?.();
    }
  }

  public stopSpeaking() {
    this.currentSpeakId++;

    if (this.fetchAbortController) {
      try {
        this.fetchAbortController.abort();
      } catch (e) {}
      this.fetchAbortController = null;
    }

    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch (e) {}
      this.currentAudio = null;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
      this.currentUtterance = null;
    }
  }

  public isSpeaking(): boolean {
    const isAudioPlaying = Boolean(this.currentAudio && !this.currentAudio.paused);
    const isSynthesisSpeaking = Boolean(
      typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.speaking
    );
    return isAudioPlaying || isSynthesisSpeaking;
  }
}

export const voiceAssistant = new VoiceService();
