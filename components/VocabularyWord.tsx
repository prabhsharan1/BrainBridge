
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2, Globe, Loader2, X } from 'lucide-react';
import { getVocabularyInfo, generateSpeech } from '../services/geminiService';
import { VocabularyWord as VocabType, Language, Languages } from '../types';

interface VocabularyWordProps {
  word: string;
  language: Language;
  className?: string;
  isOpen?: boolean;
  onToggle?: (isOpen: boolean) => void;
  disabled?: boolean;
  onSpeakStart?: () => void;
  onSpeakEnd?: () => void;
}

const VocabularyWord: React.FC<VocabularyWordProps> = ({ 
  word, 
  language, 
  className,
  isOpen = false,
  onToggle,
  disabled = false,
  onSpeakStart,
  onSpeakEnd
}) => {
  const [data, setData] = useState<VocabType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = React.useRef<AudioBufferSourceNode | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const result = await getVocabularyInfo(word, language);
      setData(result);
    } catch (error) {
      console.error("Failed to fetch vocabulary info:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
    if (!isOpen) {
      setShowTranslation(false);
      // Stop speaking if closed
      if (audioRef.current) {
        try {
          audioRef.current.stop();
        } catch (e) {}
        setIsSpeaking(false);
      }
    }
  }, [isOpen, language]);

  const handleToggle = () => {
    if (onToggle) {
      onToggle(!isOpen);
    }
  };

  const speak = async (text: string) => {
    if (isSpeaking || disabled) return;
    setIsSpeaking(true);
    onSpeakStart?.();
    try {
      const base64Audio = await generateSpeech(text, 'Kore');
      
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
      source.onended = () => {
        setIsSpeaking(false);
        onSpeakEnd?.();
        audioRef.current = null;
      };
      audioRef.current = source;
      source.start();
    } catch (err) {
      console.error("Gemini TTS failed, falling back to browser TTS:", err);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      utterance.pitch = 1.1;
      utterance.onend = () => {
        setIsSpeaking(false);
        onSpeakEnd?.();
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        onSpeakEnd?.();
      };
      window.speechSynthesis.speak(utterance);
      
      // Fallback timeout
      setTimeout(() => {
        if (isSpeaking) {
          setIsSpeaking(false);
          onSpeakEnd?.();
        }
      }, 5000);
    }
  };

  return (
    <span className="relative inline-block">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleToggle}
        className={className || `inline-block font-black border-b-2 border-dotted transition-colors cursor-pointer ${
          isOpen ? 'text-teal-600 border-teal-600' : 'text-slate-800 border-teal-400 hover:text-teal-600'
        }`}
      >
        {word}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-64 max-w-[80vw] bg-white rounded-2xl shadow-2xl border-2 border-teal-100 z-[100] p-4"
          >
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-4 space-y-2">
                <Loader2 size={24} className="animate-spin text-teal-500" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Learning word...</p>
              </div>
            ) : data ? (
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="pr-2">
                    <h4 className="text-lg font-black text-slate-900 leading-none break-words">
                      {showTranslation ? data.translation : data.term}
                    </h4>
                    <p className="text-[10px] font-bold text-teal-600 uppercase tracking-widest mt-1 break-all">{data.phonetic}</p>
                  </div>
                  <button 
                    onClick={() => onToggle?.(false)}
                    className="text-slate-300 hover:text-slate-500 transition-colors flex-shrink-0"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <p className="text-sm font-bold text-slate-700 leading-relaxed break-words">
                    {showTranslation ? data.definitionTranslation : data.definition}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => speak(data.term)}
                      disabled={isSpeaking || disabled}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                        (isSpeaking || disabled) ? 'bg-teal-100 text-teal-600 opacity-50 cursor-not-allowed' : 'bg-slate-100 text-slate-500 hover:bg-teal-50 hover:text-teal-600'
                      }`}
                    >
                      <Volume2 size={16} className={isSpeaking ? 'animate-pulse' : ''} />
                    </button>
                    {language !== Languages.English && (
                      <button
                        onClick={() => setShowTranslation(!showTranslation)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                          showTranslation ? 'bg-teal-100 text-teal-600' : 'bg-slate-100 text-slate-500 hover:bg-teal-50 hover:text-teal-600'
                        }`}
                      >
                        <Globe size={16} />
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                    {showTranslation ? language : 'English'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-2">
                <p className="text-xs text-rose-500 font-bold">Oops! Something went wrong.</p>
              </div>
            )}
            
            {/* Tooltip arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-r-2 border-b-2 border-teal-100 rotate-45 -mt-2"></div>
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
};

export default VocabularyWord;
