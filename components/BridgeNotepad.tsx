import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Languages as LangIcon, Volume2, Mic, Trash2, Copy, Loader2, Check, Sparkles, AlertCircle, Keyboard, Plus, Lightbulb } from 'lucide-react';
import { Language, Languages } from '../types';
import { TRANSLATIONS } from '../src/translations';
import { robustTranslateText, generateSpeech, getSmartSuggestions, transcribeAudio, getSpeakingFeedback } from '../services/geminiService';
import { SpeakingFeedback } from '../types';
import { LiveTranscriptionService } from '../services/liveService';

interface BridgeNotepadProps {
  isOpen: boolean;
  onClose: () => void;
  homeLanguage: Language;
  activeLanguage: Language;
  onActiveLanguageChange: (lang: Language) => void;
}

const BridgeNotepad: React.FC<BridgeNotepadProps> = ({ isOpen, onClose, homeLanguage, activeLanguage, onActiveLanguageChange }) => {
  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [suggestions, setSuggestions] = useState<{ english: string; native: string }[]>([]);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isRecordingFallback, setIsRecordingFallback] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [speakingFeedback, setSpeakingFeedback] = useState<SpeakingFeedback | null>(null);
  const [isSpeakingFeedbackLoading, setIsSpeakingFeedbackLoading] = useState(false);
  const [isGettingSuggestions, setIsGettingSuggestions] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [showFallbackOption, setShowFallbackOption] = useState(false);
  const [useSmartRecord, setUseSmartRecord] = useState(true);
  const [inputMode, setInputMode] = useState<'home' | 'english'>('home');
  const [liveCaption, setLiveCaption] = useState('');
  const t = TRANSLATIONS[activeLanguage] || TRANSLATIONS[Languages.English];
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const suggestionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const liveServiceRef = useRef<LiveTranscriptionService | null>(null);

  useEffect(() => {
    // Initialize Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      console.log("Speech Recognition initialized");
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onstart = () => {
        console.log("Speech recognition started");
        setIsListening(true);
        setMicError(null);
      };

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        console.log("Speech recognition result:", transcript);
        setInputText(prev => prev + (prev ? ' ' : '') + transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
        
        if (event.error === 'not-allowed') {
          setMicError("Microphone access denied. Please check your browser settings.");
        } else if (event.error === 'network') {
          setMicError("Network error. Switching to Smart Record...");
          setUseSmartRecord(true);
          setShowFallbackOption(true);
          // Automatically try fallback if it was a network error during a session
          setTimeout(() => {
            if (!isListening && !isRecordingFallback) {
              startFallbackRecording();
            }
          }, 1500);
        } else if (event.error === 'no-speech') {
          console.warn("No speech detected.");
        } else {
          setMicError(`Recognition error: ${event.error}`);
        }
      };

      recognitionRef.current.onend = () => {
        console.log("Speech recognition ended");
        setIsListening(false);
      };
    } else {
      console.warn("Speech Recognition API not found in this browser");
    }
  }, []);

  const toggleListening = () => {
    if (isListening || isRecordingFallback) {
      if (isListening) {
        recognitionRef.current?.stop();
      } else {
        stopFallbackRecording();
      }
      return;
    }
    
    // Always prefer Smart Record now
    startFallbackRecording();
  };

  const startFallbackRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          
          if (inputMode === 'english') {
            setIsSpeakingFeedbackLoading(true);
            setSpeakingFeedback(null);
            try {
              const feedback = await getSpeakingFeedback(base64Audio, "Bridge Notepad Conversation", homeLanguage);
              setSpeakingFeedback(feedback);
              if (feedback.original_transcript) {
                setInputText(feedback.original_transcript);
              }
            } catch (error) {
              console.error("Speaking feedback failed:", error);
              setMicError("Smart Record failed. Please try typing.");
            } finally {
              setIsSpeakingFeedbackLoading(false);
              setIsRecordingFallback(false);
              setLiveCaption('');
            }
          } else {
            setIsTranscribing(true);
            try {
              const transcript = await transcribeAudio(base64Audio, homeLanguage);
              if (transcript) {
                setInputText(prev => prev + (prev ? ' ' : '') + transcript);
              }
            } catch (error) {
              console.error("Fallback transcription failed:", error);
              setMicError("Smart Record failed. Please try typing.");
              setUseSmartRecord(false);
            } finally {
              setIsTranscribing(false);
              setIsRecordingFallback(false);
              setLiveCaption('');
            }
          }
        };
        
        stream.getTracks().forEach(track => track.stop());
      };

      // Start Live Transcription
      if (!liveServiceRef.current) {
        liveServiceRef.current = new LiveTranscriptionService();
      }
      
      setLiveCaption('');
      await liveServiceRef.current.start({
        onTranscription: (text) => {
          setLiveCaption(text);
        },
        onError: (err) => {
          console.error("Live transcription error:", err);
        }
      });

      mediaRecorder.start();
      setIsRecordingFallback(true);
      setMicError(null);
      setShowFallbackOption(false);
    } catch (err) {
      console.error("Failed to start fallback recording:", err);
      setMicError("Could not access microphone.");
    }
  };

  const stopFallbackRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (liveServiceRef.current) {
      liveServiceRef.current.stop();
    }
  };

  useEffect(() => {
    if (inputText.trim().length > 1) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      
      timeoutRef.current = setTimeout(async () => {
        setIsTranslating(true);
        try {
          const targetLang = inputMode === 'home' ? Languages.English : homeLanguage;
          const result = await robustTranslateText(inputText, targetLang);
          setTranslatedText(result);
          
          // If we translated to English, get suggestions
          if (targetLang === Languages.English) {
            fetchSuggestions(result);
          } else {
            // If we translated FROM English, get suggestions for the input English
            fetchSuggestions(inputText);
          }
        } catch (error) {
          console.error("Translation failed:", error);
        } finally {
          setIsTranslating(false);
        }
      }, 600);
    } else {
      setTranslatedText('');
      setSuggestions([]);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [inputText, inputMode, homeLanguage]);

  const fetchSuggestions = async (englishText: string) => {
    if (!englishText || englishText.length < 3) return;
    
    if (suggestionTimeoutRef.current) clearTimeout(suggestionTimeoutRef.current);
    
    suggestionTimeoutRef.current = setTimeout(async () => {
      setIsGettingSuggestions(true);
      try {
        const results = await getSmartSuggestions(englishText, homeLanguage);
        setSuggestions(results);
      } catch (error) {
        console.error("Failed to get suggestions:", error);
      } finally {
        setIsGettingSuggestions(false);
      }
    }, 1000);
  };

  const handlePlayAudio = async () => {
    if (!translatedText && !inputText) return;
    
    // Determine which text is currently displayed based on activeLanguage
    const isShowingHome = activeLanguage !== Languages.English;
    let textToSpeak = '';
    
    if (isShowingHome) {
      textToSpeak = inputMode === 'home' ? inputText : translatedText;
    } else {
      textToSpeak = inputMode === 'home' ? translatedText : inputText;
    }
    
    if (!textToSpeak) return;

    setIsSpeaking(true);
    try {
      const base64Audio = await generateSpeech(textToSpeak);
      
      // Decode base64 to PCM
      const binaryString = window.atob(base64Audio);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const pcmData = new Int16Array(bytes.buffer);
      
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const buffer = audioCtx.createBuffer(1, pcmData.length, 24000);
      const channelData = buffer.getChannelData(0);
      
      for (let i = 0; i < pcmData.length; i++) {
        channelData[i] = pcmData[i] / 32768;
      }
      
      const source = audioCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(audioCtx.destination);
      source.onended = () => setIsSpeaking(false);
      source.start();
    } catch (error) {
      console.error("TTS failed:", error);
      setIsSpeaking(false);
      
      // Fallback to browser TTS
      try {
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.error("SpeechSynthesis fallback failed:", e);
      }
    }
  };

  const handleCopy = () => {
    // Determine which text is currently displayed based on activeLanguage
    const isShowingHome = activeLanguage !== Languages.English;
    let textToCopy = '';
    
    if (isShowingHome) {
      textToCopy = inputMode === 'home' ? inputText : translatedText;
    } else {
      textToCopy = inputMode === 'home' ? translatedText : inputText;
    }
    
    if (!textToCopy) return;
    
    navigator.clipboard.writeText(textToCopy);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleClear = () => {
    setInputText('');
    setTranslatedText('');
    setSuggestions([]);
    setMicError(null);
    setSpeakingFeedback(null);
  };

  const toggleMode = () => {
    setInputMode(prev => prev === 'home' ? 'english' : 'home');
    setInputText('');
    setTranslatedText('');
    setSuggestions([]);
    setMicError(null);
  };

  const handleSuggestionClick = (suggestion: { english: string; native: string }) => {
    setInputMode('english');
    setInputText(suggestion.english);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60]"
          />

          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className="fixed left-0 top-0 bottom-0 w-full max-w-md bg-white shadow-[0_0_50px_rgba(0,0,0,0.1)] z-[70] flex flex-col border-r border-slate-100"
          >
            {/* Header */}
            <div className="px-8 py-6 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-slate-50">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-teal-500 flex items-center justify-center shadow-lg shadow-teal-100 rotate-3 group-hover:rotate-0 transition-transform duration-300">
                    <LangIcon className="text-white" size={22} />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full border-2 border-white flex items-center justify-center">
                    <Sparkles size={8} className="text-white" />
                  </div>
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 tracking-tight leading-none">Bridge Notepad</h2>
                  <p className="text-[10px] font-bold text-teal-500 uppercase tracking-[0.2em] mt-1.5 opacity-80">Instant Connection</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2.5 hover:bg-slate-50 rounded-2xl text-slate-400 hover:text-slate-600 transition-all duration-200 active:scale-90"
              >
                <X size={22} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8 custom-scrollbar">
              {/* Mic Error Alert */}
              <AnimatePresence>
                {micError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-rose-50/80 backdrop-blur-sm border border-rose-100 rounded-3xl p-5 flex items-start space-x-4 shadow-sm"
                  >
                    <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="text-rose-500" size={16} />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-rose-800 leading-snug">{micError}</p>
                      <div className="mt-3 flex items-center space-x-4">
                        <button 
                          onClick={() => setMicError(null)}
                          className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:text-rose-700 transition-colors"
                        >
                          Dismiss
                        </button>
                        {showFallbackOption && (
                          <button 
                            onClick={startFallbackRecording}
                            className="text-[10px] font-black text-teal-600 uppercase tracking-widest hover:text-teal-700 flex items-center space-x-1.5 transition-colors"
                          >
                            <Sparkles size={10} />
                            <span>Try Smart Record</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Mode Toggle - Sleeker Segmented Control */}
              <div className="relative p-1.5 bg-slate-100/80 rounded-[2rem] flex items-center">
                <div 
                  className={`absolute top-1.5 bottom-1.5 w-[calc(50%-0.375rem)] bg-white rounded-[1.75rem] shadow-sm transition-all duration-300 ease-out ${
                    inputMode === 'home' ? 'left-1.5' : 'left-[calc(50%+0.1875rem)]'
                  }`}
                />
                <button
                  onClick={() => inputMode !== 'home' && toggleMode()}
                  className={`relative z-10 flex-1 py-2.5 px-4 text-[11px] font-bold uppercase tracking-widest transition-colors duration-300 ${
                    inputMode === 'home' ? 'text-teal-600' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {homeLanguage}
                </button>
                <button
                  onClick={() => inputMode !== 'english' && toggleMode()}
                  className={`relative z-10 flex-1 py-2.5 px-4 text-[11px] font-bold uppercase tracking-widest transition-colors duration-300 ${
                    inputMode === 'english' ? 'text-teal-600' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  English
                </button>
              </div>

              {/* Input Area */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center space-x-2">
                    <div className="w-1 h-3 bg-teal-500 rounded-full" />
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {inputMode === 'home' ? homeLanguage : 'English'}
                    </label>
                  </div>
                  {(isListening || isRecordingFallback || isTranscribing || isSpeakingFeedbackLoading) && (
                    <div className="flex items-center space-x-2 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                      <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${(isTranscribing || isSpeakingFeedbackLoading) ? 'bg-teal-500' : 'bg-rose-500'}`} />
                      <span className={`text-[9px] font-black uppercase tracking-widest ${(isTranscribing || isSpeakingFeedbackLoading) ? 'text-teal-500' : 'text-rose-500'}`}>
                        {(isTranscribing || isSpeakingFeedbackLoading) ? 'Thinking' : 'Listening'}
                      </span>
                    </div>
                  )}
                </div>
                <div className="relative group">
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={isListening || isRecordingFallback ? "Listening to you..." : (isTranscribing || isSpeakingFeedbackLoading) ? "Thinking..." : "Type or speak your thought..."}
                    className={`w-full h-40 p-6 bg-slate-50/50 border-2 rounded-[2.5rem] focus:bg-white outline-none transition-all duration-300 text-slate-800 font-medium resize-none shadow-sm ${
                      isListening || isRecordingFallback 
                        ? 'border-rose-200 bg-rose-50/30 ring-4 ring-rose-50' 
                        : (isTranscribing || isSpeakingFeedbackLoading) 
                          ? 'border-teal-200 bg-teal-50/30 ring-4 ring-teal-50' 
                          : 'border-slate-100 focus:border-teal-400 focus:shadow-lg focus:shadow-teal-50'
                    }`}
                  />
                  <AnimatePresence>
                    {isRecordingFallback && liveCaption && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="absolute bottom-6 left-6 right-6 p-4 bg-white/90 backdrop-blur-xl border border-teal-100 rounded-2xl shadow-2xl z-10"
                      >
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
                          <span className="text-[9px] font-black text-teal-600 uppercase tracking-widest">Live Captions</span>
                        </div>
                        <p className="text-sm font-bold text-slate-900 italic leading-tight">"{liveCaption}"</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {inputText && (
                    <button 
                      onClick={handleClear}
                      className="absolute top-5 right-5 p-2.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all duration-200"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>

              {/* Speaking Feedback - Sleeker Card */}
              <AnimatePresence>
                {speakingFeedback && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-gradient-to-br from-teal-50 to-white border border-teal-100 rounded-[2rem] p-6 space-y-4 shadow-sm relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-teal-100/30 rounded-full -mr-12 -mt-12 blur-2xl" />
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-7 h-7 rounded-lg bg-teal-500 flex items-center justify-center shadow-sm">
                          <Sparkles size={14} className="text-white" />
                        </div>
                        <span className="text-[10px] font-black text-teal-600 uppercase tracking-widest">Speaking Coach</span>
                      </div>
                      <button 
                        onClick={() => setSpeakingFeedback(null)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <p className="text-base font-extrabold text-teal-900 leading-tight">"{speakingFeedback.praise}"</p>
                      
                      {speakingFeedback.original_transcript && (
                        <div className="bg-white/60 rounded-2xl p-4 border border-teal-50">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">What I heard</p>
                            <button 
                              onClick={() => setInputText(speakingFeedback.original_transcript)}
                              className="text-[9px] font-black text-teal-600 uppercase tracking-widest hover:text-teal-800 transition-colors"
                            >
                              Reset
                            </button>
                          </div>
                          <p className="text-xs font-medium text-slate-600 italic leading-relaxed">"{speakingFeedback.original_transcript}"</p>
                        </div>
                      )}

                      <div className="flex items-start space-x-4">
                        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                          <Lightbulb size={16} className="text-amber-500" />
                        </div>
                        <div className="flex-1 space-y-3">
                          <p className="text-xs font-bold text-slate-700 leading-relaxed">{speakingFeedback.explanation}</p>
                          {speakingFeedback.native_explanation && (
                            <p className="text-[10px] font-bold text-teal-600 italic">{speakingFeedback.native_explanation}</p>
                          )}
                          <button 
                            onClick={() => setInputText(speakingFeedback.improved_version)}
                            className="w-full py-3 px-4 bg-teal-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-teal-600 transition-all shadow-md shadow-teal-100 active:scale-[0.98]"
                          >
                            Use Improvement
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Translation Area - Modern Minimalist */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center space-x-2">
                    <div className="w-1 h-3 bg-teal-500 rounded-full" />
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {activeLanguage === Languages.English 
                        ? (inputMode === 'home' ? 'English Translation' : 'English Original')
                        : `${homeLanguage} Translation`
                      }
                    </label>
                  </div>
                  <div className="flex items-center space-x-3">
                    {isTranslating && (
                      <div className="flex items-center space-x-2">
                        <Loader2 size={12} className="animate-spin text-teal-500" />
                        <span className="text-[10px] font-bold text-teal-500 uppercase tracking-widest">Translating</span>
                      </div>
                    )}
                    <button 
                      onClick={() => onActiveLanguageChange(homeLanguage)}
                      className={`p-2 rounded-xl transition-all duration-300 active:scale-90 flex items-center space-x-1.5 ${
                        activeLanguage !== Languages.English 
                          ? 'bg-teal-500 text-white shadow-lg shadow-teal-100' 
                          : 'bg-slate-100 text-slate-400 hover:text-teal-600 hover:bg-white hover:shadow-md'
                      }`}
                      title={`Show ${homeLanguage} for 5s`}
                    >
                      <LangIcon size={14} />
                      <span className="text-[9px] font-black uppercase tracking-widest">
                        {activeLanguage !== Languages.English ? 'Showing' : 'Translate'}
                      </span>
                    </button>
                  </div>
                </div>
                
                <div className="min-h-[140px] p-8 bg-white border border-slate-100 rounded-[2.5rem] relative shadow-sm group hover:shadow-md transition-all duration-300 overflow-hidden">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-teal-500" />
                  
                  {inputText ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                          <span className="text-[10px] font-black text-teal-600 uppercase tracking-widest">
                            {activeLanguage === Languages.English ? 'Meaning' : 'Traducción'}
                          </span>
                        </div>
                        {activeLanguage !== Languages.English && (
                          <div className="flex items-center space-x-1 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">
                            <div className="w-1 h-1 rounded-full bg-teal-500 animate-pulse" />
                            <span className="text-[8px] font-black text-teal-600 uppercase tracking-widest">Temporary</span>
                          </div>
                        )}
                      </div>
                      <p className="text-slate-900 font-extrabold text-lg leading-relaxed">
                        {activeLanguage === Languages.English 
                          ? (inputMode === 'home' ? translatedText : inputText)
                          : (inputMode === 'home' ? inputText : translatedText)
                        }
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full space-y-4 opacity-30 py-4">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                        <LangIcon size={24} className="text-slate-400" />
                      </div>
                      <p className="text-slate-400 italic text-[10px] font-bold uppercase tracking-widest">
                        {isTranslating ? 'Thinking...' : 'Waiting for your thought'}
                      </p>
                    </div>
                  )}
                  
                  {translatedText && (
                    <div className="absolute bottom-5 right-5 flex items-center space-x-3">
                      <button 
                        onClick={handleCopy}
                        className={`p-3 rounded-2xl transition-all duration-200 active:scale-90 ${isCopied ? 'bg-green-500 text-white shadow-lg shadow-green-100' : 'bg-slate-50 text-slate-400 hover:text-teal-600 hover:bg-white hover:shadow-md'}`}
                      >
                        {isCopied ? <Check size={18} /> : <Copy size={18} />}
                      </button>
                      <button 
                        onClick={handlePlayAudio}
                        disabled={isSpeaking}
                        className={`p-3 rounded-2xl transition-all duration-200 active:scale-90 ${isSpeaking ? 'bg-teal-500 text-white animate-pulse shadow-lg shadow-teal-100' : 'bg-slate-50 text-slate-400 hover:text-teal-600 hover:bg-white hover:shadow-md'}`}
                      >
                        <Volume2 size={18} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Smart Suggestions - Compact Grid */}
              <div className="space-y-4 pb-4">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center">
                      <Sparkles size={12} className="text-amber-500" />
                    </div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Smart Suggestions</label>
                  </div>
                  {isGettingSuggestions && <Loader2 size={12} className="animate-spin text-amber-500" />}
                </div>
                
                <div className="grid grid-cols-1 gap-3">
                  <AnimatePresence mode="popLayout">
                    {suggestions.length > 0 ? (
                      suggestions.map((suggestion, idx) => (
                        <motion.button
                          key={suggestion.english}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ delay: idx * 0.05 }}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="text-left p-5 bg-white border border-slate-100 rounded-[1.75rem] hover:border-teal-400 hover:shadow-lg hover:shadow-teal-50/50 transition-all duration-300 group flex items-center justify-between"
                        >
                          <div className="flex flex-col space-y-1">
                            <span className="text-sm font-extrabold text-slate-800 group-hover:text-teal-600 transition-colors">{suggestion.english}</span>
                            <span className="text-[10px] font-bold text-slate-400 italic group-hover:text-slate-500">{suggestion.native}</span>
                          </div>
                          <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-teal-500 group-hover:text-white transition-all duration-300 shadow-sm">
                            <Plus size={18} />
                          </div>
                        </motion.button>
                      ))
                    ) : (
                      !isGettingSuggestions && (
                        <div className="p-8 border-2 border-dashed border-slate-100 rounded-[2rem] text-center bg-slate-50/30">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type more for smart suggestions</p>
                        </div>
                      )
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Footer - Integrated & Sleek */}
            <div className="px-8 py-8 bg-white border-t border-slate-50">
              <div className="mb-6 flex flex-col items-center text-center space-y-2">
                <div className="flex items-center space-x-2">
                  <Sparkles size={12} className="text-teal-500 animate-pulse" />
                  <p className="text-[10px] font-black text-teal-600 uppercase tracking-[0.15em]">
                    Speak your thought first
                  </p>
                  <Sparkles size={12} className="text-teal-500 animate-pulse" />
                </div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest opacity-60">
                  The fastest way to master a language
                </p>
              </div>
              
              <div className="flex items-center">
                <button 
                  onClick={toggleListening}
                  disabled={isTranscribing || isSpeakingFeedbackLoading}
                  className={`w-full py-5 rounded-[1.75rem] flex items-center justify-center space-x-3 font-black uppercase tracking-widest text-[11px] transition-all duration-300 shadow-xl active:scale-95 ${
                    isListening || isRecordingFallback
                      ? 'bg-rose-500 text-white animate-pulse ring-8 ring-rose-50 shadow-rose-200' 
                      : (isTranscribing || isSpeakingFeedbackLoading)
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'bg-teal-500 text-white hover:bg-teal-600 shadow-teal-100 hover:shadow-teal-200'
                  }`}
                >
                  {isListening || isRecordingFallback ? (
                    <>
                      <div className="flex items-center space-x-1.5">
                        <div className="w-1.5 h-4 bg-white rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                        <div className="w-1.5 h-6 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <div className="w-1.5 h-4 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      </div>
                      <span>Stop Recording</span>
                    </>
                  ) : (isTranscribing || isSpeakingFeedbackLoading) ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Mic size={18} className="group-hover:scale-110 transition-transform" />
                      <span>{t.smartRecord}</span>
                    </>
                  )}
                </button>
              </div>
              
              <div className="mt-6 flex items-center justify-center space-x-2.5 text-[9px] font-bold text-slate-300 uppercase tracking-widest">
                <Keyboard size={12} />
                <span>Typing is always an option</span>
              </div>
            </div>
          </motion.div>

        </>
      )}
    </AnimatePresence>
  );
};

export default BridgeNotepad;
