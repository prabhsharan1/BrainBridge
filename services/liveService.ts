
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { getAI } from "./geminiService";

export interface LiveTranscriptionCallbacks {
  onTranscription: (text: string, isFinal: boolean) => void;
  onError: (error: any) => void;
}

export class LiveTranscriptionService {
  private ai: GoogleGenAI;
  private session: any;
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private stream: MediaStream | null = null;
  private accumulatedText: string = "";

  constructor() {
    this.ai = getAI();
  }

  async start(callbacks: LiveTranscriptionCallbacks) {
    try {
      this.accumulatedText = "";
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioContext = new AudioContext({ sampleRate: 16000 });
      this.source = this.audioContext.createMediaStreamSource(this.stream);
      
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

      // Refresh AI instance in case key was rotated elsewhere
      this.ai = getAI();

      const sessionPromise = this.ai.live.connect({
        model: "gemini-2.5-flash-native-audio-preview-09-2025",
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            console.log("Live API Connection Open");
          },
          onmessage: async (message: LiveServerMessage) => {
            // Check for user input transcription
            const transcription = (message.serverContent as any)?.inputTranscription?.text || 
                            (message.serverContent as any)?.inputAudioTranscription?.text;
            if (transcription) {
              // The API usually sends the transcription of the current segment.
              // If it's a new segment, we append. If it's an update to the current one, we replace.
              // However, the Live API segments can be small. 
              // To be safe and provide a "live" feel, we'll try to detect if it's a continuation.
              
              if (transcription.length > this.accumulatedText.length && transcription.startsWith(this.accumulatedText)) {
                this.accumulatedText = transcription;
              } else if (!this.accumulatedText.endsWith(transcription)) {
                // If it's completely different or shorter, it might be a new segment
                // We'll append with a space if it's not a prefix
                if (this.accumulatedText && !transcription.startsWith(this.accumulatedText.split(' ').pop() || '')) {
                   this.accumulatedText += " " + transcription;
                } else {
                   this.accumulatedText = transcription;
                }
              }
              
              callbacks.onTranscription(this.accumulatedText, true);
            }
          },
          onerror: (error) => {
            console.error("Live API Error:", error);
            callbacks.onError(error);
          }
        }
      });

      this.session = await sessionPromise;

      this.processor.onaudioprocess = (e) => {
        if (!this.session) return;
        const inputData = e.inputBuffer.getChannelData(0);
        const pcmData = this.floatTo16BitPCM(inputData);
        const base64Data = this.arrayBufferToBase64(pcmData);
        
        this.session.sendRealtimeInput({
          media: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
        });
      };

      this.source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);

    } catch (error) {
      console.error("Failed to start live transcription:", error);
      callbacks.onError(error);
    }
  }

  stop() {
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.session) {
      this.session.close();
      this.session = null;
    }
  }

  private floatTo16BitPCM(input: Float32Array): ArrayBuffer {
    const buffer = new ArrayBuffer(input.length * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
    return buffer;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
}
