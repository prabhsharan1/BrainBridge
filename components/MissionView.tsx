
import React, { useState, useEffect } from 'react';
import { getAcademicFeedback, getCharacterGuidance, translateText, getTutorResponse, getPronunciationFeedback, getAlexMessage, generateSpeech, transcribeAudio, getSpeakingFeedback } from '../services/geminiService';
import { LiveTranscriptionService } from '../services/liveService';
import { AIParsedFeedback, Mission, Language, Languages, TutorResponse, EmotionState, NextAction, PronunciationFeedback, SpeakingFeedback } from '../types';
import { TRANSLATIONS } from '../src/translations';
import { CHARACTERS, COLORS } from '../constants';
import { 
  ArrowLeft, 
  Languages as LanguagesIcon, 
  Keyboard, 
  Mic, 
  Image as ImageIcon, 
  Send, 
  Sparkles, 
  Star, 
  CheckCircle2, 
  Lightbulb, 
  Gift,
  ChevronLeft,
  AlertTriangle,
  Volume2,
  Loader2,
  CheckCircle,
  Play
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import AlexGuide from './AlexGuide';
import VocabularyWord from './VocabularyWord';

interface MissionViewProps {
  mission: Mission;
  onBack: () => void;
  language: Language;
}

const MissionView: React.FC<MissionViewProps> = ({ mission, onBack, language }) => {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<AIParsedFeedback | null>(null);
  const [tutorResponse, setTutorResponse] = useState<TutorResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [characterTip, setCharacterTip] = useState<string>('');
  const [translatedPrompt, setTranslatedPrompt] = useState<string>('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [showAlexTip, setShowAlexTip] = useState(true);
  const [alexScenario, setAlexScenario] = useState<'tip' | 'frustration'>('tip');
  
  // Echo Feature State
  const [practicingWord, setPracticingWord] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [masteredWords, setMasteredWords] = useState<Set<string>>(new Set());
  const [recordingFeedback, setRecordingFeedback] = useState<'success' | 'retry' | null>(null);
  
  // Sequential Pronunciation Mode State
  const [isPronunciationMode, setIsPronunciationMode] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [coachFeedback, setCoachFeedback] = useState<PronunciationFeedback | null>(null);
  const [isCoachLoading, setIsCoachLoading] = useState(false);
  const [liveCaption, setLiveCaption] = useState<string>('');
  const [imageError, setImageError] = useState(false);
  const [activeWord, setActiveWord] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isRecordingSmart, setIsRecordingSmart] = useState(false);
  const [speakingFeedback, setSpeakingFeedback] = useState<SpeakingFeedback | null>(null);
  const [isSpeakingFeedbackLoading, setIsSpeakingFeedbackLoading] = useState(false);

  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);
  const liveServiceRef = React.useRef<LiveTranscriptionService | null>(null);

  const character = CHARACTERS.find(c => c.id === mission.characterId) || CHARACTERS[0];
  const t = TRANSLATIONS[language] || TRANSLATIONS[Languages.English];

  useEffect(() => {
    const fetchInitialTip = async () => {
      try {
        const tip = await getAlexMessage('tip', `Mission: ${mission.title}. Subject: ${mission.subject}.`, language);
        setCharacterTip(tip);
      } catch (err) {
        console.error("Failed to fetch initial tip:", err);
      }
    };

    setTranslatedPrompt('');
    setShowAlexTip(true);
    setAlexScenario('tip');
    fetchInitialTip();
  }, [language, mission]);

  const handleTranslatePrompt = async () => {
    if (translatedPrompt) {
      setTranslatedPrompt('');
      return;
    }
    setIsTranslating(true);
    setError(null);
    try {
      const translated = await translateText(mission.content.prompt, language);
      setTranslatedPrompt(translated);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Translation failed. Please try again.");
    } finally {
      setIsTranslating(false);
    }
  };

  const handleFeedbackRequest = async () => {
    if (!inputText.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      // Get both academic feedback and tutor response for a rich experience
      const [academicResult, tutorResult] = await Promise.all([
        getAcademicFeedback(
          inputText,
          `Mission: ${mission.title}. Subject: ${mission.subject}. Vocabulary to use: ${mission.content.vocabulary.map(v => v.term).join(', ')}.`,
          language
        ),
        getTutorResponse(
          inputText,
          `Mission: ${mission.title}. Subject: ${mission.subject}. Vocabulary to use: ${mission.content.vocabulary.map(v => v.term).join(', ')}.`,
          language
        )
      ]);
      
      setFeedback(academicResult);
      setTutorResponse(tutorResult);

      if (academicResult.overallLevel <= 1) {
        setAlexScenario('frustration');
        setShowAlexTip(true);
      }
    } catch (err: any) {
      setError(err.message || "Failed to get feedback. Please check your API key.");
    } finally {
      setIsLoading(false);
    }
  };

  const speak = async (text: string) => {
    if (isSpeaking) return;
    setIsSpeaking(true);
    try {
      const base64Audio = await generateSpeech(text, 'Kore');
      
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
    } catch (err) {
      console.error("Gemini TTS failed, falling back to browser TTS:", err);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      utterance.pitch = 1.1;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      
      // Fallback if speechSynthesis doesn't trigger onend/onerror
      setTimeout(() => setIsSpeaking(false), 5000);
    }
  };

  const handleListen = (word: string) => {
    setPracticingWord(word);
    speak(word);
  };

  const startRecording = async (word: string) => {
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
          setIsCoachLoading(true);
          try {
            const feedback = await getPronunciationFeedback(base64Audio, word, language);
            setCoachFeedback(feedback);
            setRecordingFeedback(feedback.is_success ? 'success' : 'retry');
            if (feedback.is_success) {
              setMasteredWords(prev => new Set(prev).add(word));
            }
          } catch (err) {
            console.error(err);
            setError("Failed to analyze pronunciation.");
          } finally {
            setIsCoachLoading(false);
          }
        };
        
        // Stop all tracks to release microphone
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
      setIsRecording(true);
      setRecordingFeedback(null);
      setCoachFeedback(null);
    } catch (err) {
      console.error(err);
      setError("Could not access microphone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
    if (liveServiceRef.current) {
      liveServiceRef.current.stop();
    }
  };

  const handleRecord = (word: string) => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording(word);
    }
  };

  const startSmartRecord = async () => {
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
          setIsSpeakingFeedbackLoading(true);
          setSpeakingFeedback(null);
          try {
            const feedback = await getSpeakingFeedback(base64Audio, `Mission: ${mission.title}. Subject: ${mission.subject}. Prompt: ${mission.content.prompt}`, language);
            setSpeakingFeedback(feedback);
            if (feedback.original_transcript) {
              setInputText(feedback.original_transcript);
            }
          } catch (err) {
            console.error("Smart Record failed:", err);
            setError("Smart Record failed. Please try typing.");
          } finally {
            setIsSpeakingFeedbackLoading(false);
            setIsRecordingSmart(false);
            setLiveCaption('');
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
      setIsRecordingSmart(true);
      setError(null);
    } catch (err) {
      console.error("Failed to start smart recording:", err);
      setError("Could not access microphone.");
    }
  };

  const stopSmartRecord = () => {
    if (mediaRecorderRef.current && isRecordingSmart) {
      mediaRecorderRef.current.stop();
    }
    if (liveServiceRef.current) {
      liveServiceRef.current.stop();
    }
  };

  const startPronunciationPractice = () => {
    setIsPronunciationMode(true);
    setCurrentWordIndex(0);
    setPracticingWord(mission.content.vocabulary[0].term);
    setRecordingFeedback(null);
  };

  const nextPronunciationWord = () => {
    const nextIndex = currentWordIndex + 1;
    if (nextIndex < mission.content.vocabulary.length) {
      setCurrentWordIndex(nextIndex);
      setPracticingWord(mission.content.vocabulary[nextIndex].term);
      setRecordingFeedback(null);
    } else {
      setIsPronunciationMode(false);
      setPracticingWord(null);
    }
  };

  const renderPrompt = (text: string) => {
    if (!text) return null;
    
    // Create a regex to find any of the vocabulary words (case-insensitive)
    const vocabWords = mission.content.vocabulary.map(v => v.term);
    if (vocabWords.length === 0) return text;
    
    const regex = new RegExp(`\\b(${vocabWords.join('|')})\\b`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, i) => {
      const isVocab = vocabWords.some(v => v.toLowerCase() === part.toLowerCase());
      if (isVocab) {
        const uniqueId = `${part}-${i}`;
        return (
          <VocabularyWord 
            key={uniqueId} 
            word={part} 
            language={language} 
            isOpen={activeWord === uniqueId}
            onToggle={(open) => setActiveWord(open ? uniqueId : null)}
            disabled={isSpeaking}
            onSpeakStart={() => { setIsSpeaking(true); setPracticingWord(part); }}
            onSpeakEnd={() => setIsSpeaking(false)}
          />
        );
      }
      return part;
    });
  };

  return (
    <div className="flex flex-col p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto animate-in slide-in-from-bottom-8 duration-700">
      {showAlexTip && (
        <AlexGuide 
          scenario={alexScenario} 
          context={`Mission: ${mission.title}. Subject: ${mission.subject}.`}
          language={language} 
          onClose={() => setShowAlexTip(false)} 
          initialMessage={alexScenario === 'tip' ? characterTip : undefined}
        />
      )}
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <div className="flex-1 min-w-0 flex items-center space-x-3 sm:space-x-6">
          <motion.button 
            whileHover={{ x: -4 }}
            whileTap={{ scale: 0.95 }}
            onClick={onBack}
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl border-2 border-slate-200 flex-shrink-0 flex items-center justify-center text-slate-500 hover:bg-white hover:border-teal-500 hover:text-teal-600 transition-all shadow-sm group"
          >
            <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform sm:w-5 sm:h-5" />
          </motion.button>
          <div className="min-w-0">
            <div className="flex items-center space-x-2 sm:space-x-3 mb-1">
               <span className="px-2 py-0.5 rounded-full text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-white flex-shrink-0" style={{ backgroundColor: (COLORS as any)[mission.subject.toLowerCase()] || COLORS.primary }}>
                 {mission.subject}
               </span>
               <span className="text-slate-400 text-[10px] sm:text-xs font-bold truncate">• {mission.skill}</span>
            </div>
            <h2 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight truncate">{mission.title}</h2>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0 ml-2 sm:ml-4">
           {language !== Languages.English && (
             <motion.button 
               whileHover={{ scale: 1.02 }}
               whileTap={{ scale: 0.98 }}
               onClick={handleTranslatePrompt}
               disabled={isTranslating}
               className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black transition-all flex items-center space-x-1 sm:space-x-2 border-2 whitespace-nowrap ${
                 translatedPrompt 
                   ? 'bg-teal-50 border-teal-200 text-teal-700' 
                   : 'bg-white border-slate-200 text-slate-600 hover:border-teal-500 hover:text-teal-600'
               } ${isTranslating ? 'opacity-50 cursor-not-allowed' : ''}`}
             >
               {isTranslating ? (
                 <Loader2 size={14} className="animate-spin sm:w-[18px] sm:h-[18px]" />
               ) : (
                 <LanguagesIcon size={14} className="sm:w-[18px] sm:h-[18px]" />
               )}
               <span>{isTranslating ? t.analyzing : (translatedPrompt ? t.showEnglish : `${t.translateTo} ${language.toUpperCase()}`)}</span>
             </motion.button>
           )}
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Left Column: Mission Content & Editor */}
        <div className="lg:col-span-7 flex flex-col space-y-6 min-h-0">
          {/* Mission Prompt Card */}
          <div className="bg-white rounded-3xl sm:rounded-[2rem] border-2 border-slate-100 shadow-sm p-6 sm:p-8 relative overflow-visible">
             <div className="absolute inset-0 overflow-hidden rounded-3xl sm:rounded-[2rem] pointer-events-none">
                <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 opacity-5 -mr-6 -mt-6 sm:-mr-8 sm:-mt-8">
                   <Sparkles size={96} className="rotate-12 sm:w-32 sm:h-32" />
                </div>
             </div>
             <div className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-6 relative z-10">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-slate-50 border-2 border-slate-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
                   {mission.content.visualHint && !imageError ? (
                     <img 
                       src={mission.content.visualHint} 
                       alt="Visual Hint" 
                       className="w-full h-full object-cover" 
                       referrerPolicy="no-referrer"
                       onError={() => setImageError(true)}
                     />
                   ) : (
                     <ImageIcon className="text-slate-200 sm:w-8 sm:h-8" size={24} />
                   )}
                </div>
                <div className="w-full">
                   <div className="text-base sm:text-lg font-bold text-slate-800 leading-relaxed mb-4">
                     {renderPrompt(translatedPrompt || mission.content.prompt)}
                   </div>
                   
                    <div className="flex items-center justify-between mb-4">
                       <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.pronunciation}</span>
                       </div>
                       {!isPronunciationMode && mission.content.vocabulary.length > 0 && (
                         <button 
                           onClick={startPronunciationPractice}
                           className="text-[10px] font-black text-teal-600 uppercase tracking-widest hover:text-teal-700 flex items-center space-x-1 bg-teal-50 px-3 py-1 rounded-full border border-teal-100 transition-all"
                         >
                           <Play size={10} className="fill-current" />
                           <span>{t.startPractice}</span>
                         </button>
                       )}
                    </div>

                    {isPronunciationMode ? (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-slate-50 rounded-3xl p-6 border-2 border-teal-100 relative"
                      >
                        <button 
                          onClick={() => { setIsPronunciationMode(false); setPracticingWord(null); }}
                          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
                        >
                          <ArrowLeft size={16} />
                        </button>
                        
                        <div className="text-center space-y-6">
                          <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Word {currentWordIndex + 1} of {mission.content.vocabulary.length}</p>
                            <h3 className="text-4xl font-black text-slate-900 tracking-tight">{practicingWord}</h3>
                          </div>

                          <div className="flex flex-col items-center space-y-4">
                            <div className="flex items-center space-x-4">
                              <motion.button 
                                whileHover={!isSpeaking ? { scale: 1.1 } : {}}
                                whileTap={!isSpeaking ? { scale: 0.9 } : {}}
                                onClick={() => handleListen(practicingWord!)}
                                disabled={isSpeaking}
                                className={`w-16 h-16 rounded-2xl bg-white border-2 flex items-center justify-center transition-all shadow-sm ${
                                  isSpeaking 
                                    ? 'border-teal-200 text-teal-400 cursor-not-allowed' 
                                    : 'border-slate-200 text-slate-600 hover:border-teal-500 hover:text-teal-600'
                                }`}
                              >
                                {isSpeaking ? <Loader2 size={32} className="animate-spin" /> : <Volume2 size={32} />}
                              </motion.button>

                              <motion.button 
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleRecord(practicingWord!)}
                                className={`w-20 h-20 rounded-3xl flex items-center justify-center transition-all shadow-xl ${
                                  isRecording 
                                    ? 'bg-rose-500 text-white animate-pulse' 
                                    : recordingFeedback === 'success'
                                      ? 'bg-emerald-500 text-white'
                                      : 'bg-slate-900 text-white hover:bg-teal-600'
                                }`}
                              >
                                {isRecording ? <Mic size={32} /> : recordingFeedback === 'success' ? <CheckCircle size={32} /> : <Mic size={32} />}
                              </motion.button>
                            </div>

                            <AnimatePresence mode="wait">
                              {isCoachLoading ? (
                                <motion.div
                                  key="loading"
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  className="flex flex-col items-center space-y-2"
                                >
                                  <Loader2 size={24} className="animate-spin text-teal-500" />
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Analyzing your voice...</p>
                                  {liveCaption && (
                                    <div className="mt-4 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl max-w-xs opacity-50">
                                      <p className="text-slate-600 font-bold text-lg italic">"{liveCaption}"</p>
                                    </div>
                                  )}
                                </motion.div>
                              ) : coachFeedback ? (
                                <motion.div
                                  key="feedback"
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="flex flex-col items-center space-y-4 max-w-md mx-auto"
                                >
                                  <div className={`p-4 rounded-2xl border-2 text-center w-full ${coachFeedback.is_success ? 'bg-emerald-50 border-emerald-100 text-emerald-900' : 'bg-amber-50 border-amber-100 text-amber-900'}`}>
                                    <p className="font-black text-sm mb-1">{coachFeedback.praise}</p>
                                    
                                    {coachFeedback.syllable_breakdown && (
                                      <div className="my-3 py-2 bg-white/50 rounded-xl border border-slate-200">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Break it down:</p>
                                        <p className="text-xl font-black tracking-widest text-slate-900">{coachFeedback.syllable_breakdown}</p>
                                      </div>
                                    )}
                                    
                                    {coachFeedback.advice && (
                                      <p className="text-xs font-bold leading-relaxed mt-2 italic">
                                        Tip: {coachFeedback.advice}
                                      </p>
                                    )}
                                  </div>

                                  {coachFeedback.is_success ? (
                                    <motion.button
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      onClick={nextPronunciationWord}
                                      className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-sm flex items-center space-x-2 shadow-lg"
                                    >
                                      <span>{currentWordIndex + 1 === mission.content.vocabulary.length ? t.exitPractice : t.nextWord}</span>
                                      <ArrowLeft size={16} className="rotate-180" />
                                    </motion.button>
                                  ) : (
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Try again! Tap the mic 🔄</p>
                                  )}
                                </motion.div>
                              ) : isRecording ? (
                                <motion.div
                                  key="recording"
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  className="flex flex-col items-center space-y-2"
                                >
                                  <div className="flex items-center space-x-1">
                                    {[1, 2, 3].map(i => (
                                      <motion.div
                                        key={i}
                                        animate={{ height: [8, 16, 8] }}
                                        transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }}
                                        className="w-1 bg-rose-500 rounded-full"
                                      />
                                    ))}
                                  </div>
                                  <p className="text-rose-500 font-black uppercase tracking-widest text-sm">Listening... Tap to stop</p>
                                  {liveCaption && (
                                    <motion.div 
                                      initial={{ opacity: 0, y: 5 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      className="mt-4 px-4 py-2 bg-rose-50 border border-rose-100 rounded-xl max-w-xs"
                                    >
                                      <p className="text-rose-700 font-bold text-lg italic">"{liveCaption}"</p>
                                    </motion.div>
                                  )}
                                </motion.div>
                              ) : (
                                <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Tap the mic and say the word</p>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <div className="flex flex-wrap gap-3">
                         {mission.content.vocabulary.map(v => {
                           const word = v.term;
                           const isMastered = masteredWords.has(word);
                           
                           return (
                             <motion.div 
                               key={word}
                               layout
                               className={`relative flex items-center space-x-2 px-3 py-2 rounded-2xl text-xs font-black border-2 transition-all ${
                                 isMastered 
                                   ? 'bg-amber-50 border-amber-200 text-amber-700 shadow-lg shadow-amber-200/50' 
                                   : 'bg-slate-50 border-slate-100 text-slate-500 hover:border-teal-300 hover:bg-white'
                               }`}
                             >
                               {isMastered && (
                                 <motion.div 
                                   initial={{ scale: 0 }}
                                   animate={{ scale: 1 }}
                                   className="absolute -top-2 -right-2 bg-amber-400 text-white rounded-full p-0.5 shadow-md"
                                 >
                                   <Star size={10} fill="currentColor" />
                                 </motion.div>
                               )}
                               
                               <VocabularyWord 
                                 word={word} 
                                 language={language} 
                                 className="mr-1 hover:text-teal-600 transition-colors"
                                 isOpen={activeWord === `list-${word}`}
                                 onToggle={(open) => setActiveWord(open ? `list-${word}` : null)}
                                 disabled={isSpeaking}
                                 onSpeakStart={() => { setIsSpeaking(true); setPracticingWord(word); }}
                                 onSpeakEnd={() => setIsSpeaking(false)}
                               />
                               
                               <div className="flex items-center space-x-1 border-l border-slate-200 pl-2 ml-1">
                                 <button 
                                   onClick={() => handleListen(word)}
                                   disabled={isSpeaking}
                                   className={`p-1 rounded-lg transition-colors ${
                                     isSpeaking 
                                       ? 'text-teal-300 cursor-not-allowed' 
                                       : 'text-slate-400 hover:text-teal-600 hover:bg-teal-50'
                                   }`}
                                   title="Listen"
                                 >
                                   {isSpeaking && practicingWord === word ? (
                                     <Loader2 size={14} className="animate-spin" />
                                   ) : (
                                     <Volume2 size={14} />
                                   )}
                                 </button>
                               </div>
                             </motion.div>
                           );
                         })}
                      </div>
                    )}
                </div>
             </div>
          </div>

            {/* Editor Area */}
            <div className="flex flex-col bg-white rounded-3xl sm:rounded-[2rem] border-2 border-slate-100 shadow-sm p-6 sm:p-8 min-h-[300px] sm:min-h-[400px] relative overflow-hidden">
              {isSpeakingFeedbackLoading && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center">
                  <div className="w-20 h-20 bg-teal-500 rounded-full flex items-center justify-center mb-4 animate-pulse">
                    <Mic size={40} className="text-white" />
                  </div>
                  <h3 className="text-xl font-black text-slate-800 animate-bounce">{t.analyzing}</h3>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-2">Listening to your adventure...</p>
                </div>
              )}
              
              <div className="flex items-center justify-between mb-6">
                 <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{t.yourMissionLog}</span>
                 <div className="flex items-center space-x-4">
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center">
                      <Keyboard size={14} className="mr-2" /> {inputText.split(/\s+/).filter(x => x).length} {t.words}
                    </span>
                 </div>
              </div>
              
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Tap the mic to speak or type your response here..."
                className="flex-1 w-full p-0 border-0 focus:ring-0 text-lg sm:text-xl serif-text resize-none placeholder:text-slate-200 leading-relaxed min-h-[150px]"
              ></textarea>

              {isRecordingSmart && liveCaption && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute bottom-20 sm:bottom-24 left-4 right-4 sm:left-8 sm:right-8 p-3 sm:p-4 bg-white/90 backdrop-blur-md border-2 border-teal-500 rounded-xl sm:rounded-2xl shadow-xl z-10"
                >
                  <div className="flex items-center space-x-2 mb-1">
                    <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
                    <span className="text-[8px] sm:text-[10px] font-black text-teal-600 uppercase tracking-widest">Live Captions</span>
                  </div>
                  <p className="text-base sm:text-lg font-bold text-slate-800 italic leading-tight">"{liveCaption}"</p>
                </motion.div>
              )}
              
              <div className="pt-4 sm:pt-6 border-t border-slate-50 flex flex-col sm:flex-row items-center justify-between gap-6">
                 <div className="flex items-center space-x-4 w-full sm:w-auto">
                    <motion.button 
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={isRecordingSmart ? stopSmartRecord : startSmartRecord}
                      disabled={isSpeakingFeedbackLoading}
                      className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full transition-all flex items-center justify-center shadow-xl ${
                        isRecordingSmart 
                          ? 'bg-rose-500 text-white animate-pulse ring-4 ring-rose-100' 
                          : isSpeakingFeedbackLoading
                            ? 'bg-teal-100 text-teal-600 cursor-not-allowed'
                            : 'bg-teal-500 text-white hover:bg-teal-600 ring-4 ring-teal-50'
                      }`}
                      title={isRecordingSmart ? t.stop : t.smartRecord}
                    >
                       {isSpeakingFeedbackLoading ? <Loader2 size={20} className="animate-spin sm:w-6 sm:h-6" /> : <Mic size={20} className="sm:w-6 sm:h-6" />}
                    </motion.button>
                    <div>
                      <p className="text-xs font-black text-slate-800 leading-none">Speaking Practice</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Tap to tell your story</p>
                    </div>
                 </div>
                 <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleFeedbackRequest}
                  disabled={isLoading || !inputText.trim()}
                  className={`w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black text-base sm:text-lg transition-all flex items-center justify-center space-x-2 sm:space-x-3 ${
                    isLoading || !inputText.trim() 
                      ? 'bg-slate-100 text-slate-300 cursor-not-allowed' 
                      : 'bg-slate-900 text-white hover:bg-teal-600 shadow-xl shadow-slate-200 active:scale-95'
                  }`}
                >
                  {isLoading ? (
                    <><Sparkles size={18} className="animate-spin sm:w-5 sm:h-5" /><span>{t.analyzing}</span></>
                  ) : (
                    <><Send size={18} className="sm:w-5 sm:h-5" /><span>{t.submitMission}</span></>
                  )}
                 </motion.button>
              </div>
            </div>
        </div>

        {/* Right Column: Guide & Feedback */}
        <div className="lg:col-span-5 flex flex-col space-y-6">
          {/* Guide Card */}
          <div className={`bg-slate-900 rounded-[2rem] p-8 text-white shadow-2xl shadow-slate-300 relative overflow-visible group transition-all duration-500 ${
            tutorResponse?.emotion_state === EmotionState.Celebrate ? 'ring-4 ring-teal-400' : 
            tutorResponse?.emotion_state === EmotionState.Encourage ? 'ring-4 ring-amber-400' : ''
          }`}>
             <div className="absolute inset-0 overflow-hidden rounded-[2rem] pointer-events-none">
                <div className="absolute -bottom-4 -right-4 w-32 h-32 opacity-10 group-hover:scale-110 transition-transform">
                   <img src={character.avatar} alt="" className="w-full h-full" />
                </div>
             </div>
             <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-1">
                    <img src={character.avatar} alt={character.name} className="w-full h-full object-cover rounded-xl" />
                  </div>
                  <div>
                    <h4 className="font-black text-lg leading-none">{character.name}</h4>
                    <p className="text-[10px] font-black text-teal-400 uppercase tracking-widest mt-1">{character.subject} Guide</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={async () => {
                      setIsCoachLoading(true);
                      try {
                        const tip = await getCharacterGuidance(character.name, character.subject, mission.title, language);
                        setCharacterTip(tip);
                      } catch (err) {
                        console.error(err);
                      } finally {
                        setIsCoachLoading(false);
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-teal-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-teal-400 transition-all flex items-center space-x-2"
                  >
                    <Lightbulb size={14} />
                    <span>Get Hint</span>
                  </button>
                </div>
             </div>
             <div className="relative z-10">
                {isCoachLoading ? (
                  <div className="space-y-3">
                    <div className="h-4 w-24 bg-white/10 animate-pulse rounded-full"></div>
                    <div className="h-12 w-full bg-white/5 animate-pulse rounded-xl"></div>
                  </div>
                ) : isPronunciationMode ? (
                  <div className="space-y-3">
                    <p className="text-[10px] font-black text-teal-400 uppercase tracking-widest">Pronunciation Mode</p>
                    <p className="text-lg serif-text italic leading-relaxed text-slate-200">
                      "I'm listening! Tap the mic and try to say <span className="text-teal-300 font-black">{practicingWord}</span>. I'll help you get it perfect!"
                    </p>
                  </div>
                ) : tutorResponse ? (
                  <div className="space-y-4">
                    <p className="text-xl font-black text-teal-300 tracking-tight">
                      {tutorResponse.ui_text}
                    </p>
                    <div className="text-lg serif-text italic leading-relaxed text-slate-200">
                      "{renderPrompt(tutorResponse.dialogue_audio)}"
                    </div>
                    {tutorResponse.native_language_translation && (
                      <div className="pt-4 border-t border-white/10">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{t.bridge}</p>
                        <p className="text-sm font-bold text-teal-200">
                          {tutorResponse.native_language_translation}
                        </p>
                      </div>
                    )}
                  </div>
                ) : characterTip ? (
                  <div className="space-y-3">
                    <p className="text-[10px] font-black text-teal-400 uppercase tracking-widest">{t.bridge}</p>
                    <div className="text-lg serif-text italic leading-relaxed text-slate-200">
                      "{renderPrompt(characterTip)}"
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ready to help</p>
                    <p className="text-lg serif-text italic leading-relaxed text-slate-200 opacity-50">
                      "I'm here to help you with your writing and pronunciation. Click 'Get Hint' if you're stuck!"
                    </p>
                  </div>
                )}
             </div>
          </div>

          {/* Feedback Area */}
          <div className="flex-1 bg-white rounded-[2rem] border-2 border-slate-100 shadow-sm p-8 flex flex-col">
            {error && (
              <div className="mb-6 p-4 bg-rose-50 border-2 border-rose-100 rounded-2xl text-rose-600 text-sm font-bold flex items-center">
                <AlertTriangle size={18} className="mr-3 flex-shrink-0" />
                {error}
              </div>
            )}

            {speakingFeedback && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 p-6 bg-teal-50 rounded-3xl border-2 border-teal-100 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Sparkles size={48} className="text-teal-500" />
                </div>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center text-white">
                    <Volume2 size={16} />
                  </div>
                  <h4 className="text-sm font-black text-teal-800 uppercase tracking-widest">Speaking Coach</h4>
                </div>
                <p className="text-lg font-black text-teal-900 mb-2 leading-tight">"{speakingFeedback.praise}"</p>
                <div className="space-y-4">
                  {speakingFeedback.original_transcript && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">What I heard:</p>
                        <button 
                          onClick={() => setInputText(speakingFeedback.original_transcript)}
                          className="text-[10px] font-black text-teal-600 uppercase tracking-widest hover:underline"
                        >
                          Reset to this
                        </button>
                      </div>
                      <p className="text-sm font-medium text-slate-600 italic">"{speakingFeedback.original_transcript}"</p>
                    </div>
                  )}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest">Better way to say it:</p>
                      <div className="flex items-center space-x-3">
                        <button 
                          onClick={() => setInputText(speakingFeedback.improved_version)}
                          className="text-[10px] font-black text-teal-600 uppercase tracking-widest hover:underline"
                        >
                          Use this
                        </button>
                        <button 
                          onClick={async () => {
                          try {
                            const audio = await generateSpeech(speakingFeedback.improved_version);
                            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
                            const binaryString = window.atob(audio);
                            const len = binaryString.length;
                            const bytes = new Uint8Array(len);
                            for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
                            const pcmData = new Int16Array(bytes.buffer);
                            const buffer = audioCtx.createBuffer(1, pcmData.length, 24000);
                            const channelData = buffer.getChannelData(0);
                            for (let i = 0; i < pcmData.length; i++) channelData[i] = pcmData[i] / 32768;
                            const source = audioCtx.createBufferSource();
                            source.buffer = buffer;
                            source.connect(audioCtx.destination);
                            source.start();
                          } catch (err) {
                            console.error("Speech generation failed:", err);
                          }
                        }}
                        className="p-1.5 rounded-lg bg-teal-100 text-teal-600 hover:bg-teal-200 transition-colors"
                        title="Listen to improved version"
                      >
                        <Volume2 size={14} />
                      </button>
                    </div>
                  </div>
                  <p className="text-base font-bold text-slate-800 leading-relaxed italic bg-white/50 p-3 rounded-xl border border-teal-100">
                      {speakingFeedback.improved_version}
                    </p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="mt-1">
                      <Lightbulb size={14} className="text-amber-500" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-600 leading-relaxed">{speakingFeedback.explanation}</p>
                      {speakingFeedback.native_explanation && (
                        <p className="text-[10px] font-bold text-teal-600 mt-1 italic">{speakingFeedback.native_explanation}</p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {!feedback && !isLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                 <motion.div 
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 3 }}
                  className="w-24 h-24 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center text-5xl mb-8"
                 >
                   <Sparkles size={48} />
                 </motion.div>
                 <h3 className="text-2xl font-black text-slate-800 mb-3">{t.readyForReview}</h3>
                 <p className="text-slate-500 font-medium leading-relaxed px-8">{t.submitPrompt.replace('{name}', character.name)}</p>
              </div>
            ) : isLoading ? (
               <div className="space-y-8 animate-pulse">
                  <div className="h-10 w-1/2 bg-slate-100 rounded-full"></div>
                  <div className="space-y-4">
                    <div className="h-24 w-full bg-slate-50 rounded-3xl"></div>
                    <div className="h-24 w-full bg-slate-50 rounded-3xl"></div>
                  </div>
               </div>
            ) : feedback && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
                <div className="flex items-center justify-between border-b border-slate-50 pb-6">
                   <div>
                      <h3 className="text-xl font-black text-slate-900">{t.missionReport}</h3>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">{t.academicMastery}</p>
                   </div>
                   <div className="flex items-center bg-teal-50 px-5 py-2.5 rounded-2xl border-2 border-teal-100">
                      <div className="flex gap-2 mr-4">
                        {[1, 2, 3, 4].map(l => (
                          <div 
                            key={l} 
                            className={`w-3 h-8 rounded-md transition-all duration-500 ${l <= feedback.overallLevel ? 'bg-teal-500 shadow-lg shadow-teal-200' : 'bg-slate-200'}`}
                          ></div>
                        ))}
                      </div>
                      <span className="text-teal-700 font-black text-lg">LVL {feedback.overallLevel}</span>
                   </div>
                </div>

                <div className="space-y-4">
                  {feedback.comments.map((c, i) => (
                    <div 
                      key={i} 
                      className={`p-6 rounded-3xl border-2 flex items-start gap-5 transition-all hover:scale-[1.02] ${
                        c.type === 'strength' 
                          ? 'bg-emerald-50 border-emerald-100 text-emerald-900' 
                          : 'bg-amber-50 border-amber-100 text-amber-900 shadow-lg shadow-amber-500/5'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center text-xl ${
                         c.type === 'strength' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                      }`}>
                        {c.type === 'strength' ? <CheckCircle2 size={24} /> : <Lightbulb size={24} />}
                      </div>
                      <div>
                         <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-60">
                           {c.type === 'strength' ? 'Great Job!' : 'Try This'}
                         </p>
                         <p className="text-sm font-bold leading-relaxed">{c.text}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {feedback.translation && (
                  <div className="p-6 bg-slate-50 rounded-3xl border-2 border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{t.homeLanguageBridge}</p>
                    <p className="text-sm font-bold text-slate-700 leading-relaxed italic">
                      {feedback.translation}
                    </p>
                  </div>
                )}

                <div className="bg-teal-600 rounded-3xl p-6 text-white flex items-center justify-between shadow-xl shadow-teal-500/20">
                   <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl">
                         <Gift size={24} />
                      </div>
                      <div>
                         <p className="text-xs font-black text-teal-100 uppercase tracking-widest">{t.rewards}</p>
                         <p className="text-lg font-black">+{mission.xp} {t.xpEarned}</p>
                      </div>
                   </div>
                   <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-white text-teal-700 px-6 py-2.5 rounded-xl font-black text-sm hover:bg-teal-50 transition-colors"
                   >
                      {t.collect}
                   </motion.button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MissionView;
