
import React, { useState } from 'react';
import { getAcademicFeedback } from '../services/geminiService';
import { AIParsedFeedback } from '../types';
import { 
  Sparkles, 
  Send, 
  CheckCircle2, 
  Lightbulb, 
  Keyboard, 
  Rocket,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const StudentDemo: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<AIParsedFeedback | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFeedbackRequest = async () => {
    if (!inputText.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await getAcademicFeedback(
        inputText,
        "A 5th grade prompt about why recycling is important for the ocean."
      );
      setFeedback(result);
    } catch (err: any) {
      setError(err.message || "Failed to get feedback. Please check your API key.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-8 py-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <span className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-[10px] font-black uppercase tracking-widest">
              Demo Mission
            </span>
            <span className="text-slate-400 text-xs font-bold">• Science</span>
          </div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">The Ocean's Secret</h2>
          <p className="text-slate-500 font-medium mt-2">Topic: Why is recycling important for our oceans?</p>
        </div>
        <div className="flex items-center bg-white border-2 border-slate-100 px-6 py-3 rounded-2xl shadow-sm">
           <div className="text-right mr-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Difficulty</p>
              <p className="text-sm font-black text-slate-800">Level 1: Claiming</p>
           </div>
           <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
              <Rocket size={20} />
           </div>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-12 gap-10">
        {/* Writing Area */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-[2.5rem] border-2 border-slate-100 shadow-sm p-8 flex flex-col min-h-[500px]">
            <div className="flex items-center justify-between mb-6">
               <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Your Mission Log</span>
               <div className="flex items-center space-x-4">
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center">
                    <Keyboard size={14} className="mr-2" /> {inputText.split(/\s+/).filter(x => x).length} Words
                  </span>
               </div>
            </div>
            
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="I think recycling is good because it stops trash from going in the water..."
              className="flex-1 w-full p-0 border-0 focus:ring-0 text-xl serif-text resize-none placeholder:text-slate-200 leading-relaxed"
            ></textarea>
            
            <div className="pt-8 border-t border-slate-50">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleFeedbackRequest}
                disabled={isLoading || !inputText.trim()}
                className={`w-full py-5 rounded-2xl font-black text-xl transition-all flex items-center justify-center space-x-3 ${
                  isLoading || !inputText.trim() 
                    ? 'bg-slate-100 text-slate-300 cursor-not-allowed' 
                    : 'bg-slate-900 text-white hover:bg-teal-600 shadow-2xl shadow-slate-200'
                }`}
              >
                {isLoading ? (
                  <><Loader2 size={24} className="animate-spin" /><span>Consulting AI Tutor...</span></>
                ) : (
                  <><Send size={24} /><span>Analyze My Writing</span></>
                )}
              </motion.button>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-rose-500 text-sm mt-4 font-bold bg-rose-50 p-4 rounded-xl border border-rose-100 flex items-center"
                >
                  <Sparkles size={16} className="mr-3" />
                  {error}
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Feedback Area */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-[2.5rem] border-2 border-slate-100 shadow-sm p-8 h-full flex flex-col">
            <AnimatePresence mode="wait">
              {!feedback && !isLoading ? (
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col items-center justify-center text-center py-12"
                >
                  <div className="w-24 h-24 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mb-8">
                    <Sparkles size={48} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-800 mb-3">AI Tutor Ready</h3>
                  <p className="text-slate-500 font-medium leading-relaxed px-8">
                    Type your answer and click the button to see how our AI tutor helps you bridge the gap to academic English!
                  </p>
                </motion.div>
              ) : isLoading ? (
                <motion.div 
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-8 animate-pulse py-8"
                >
                  <div className="h-10 w-1/2 bg-slate-100 rounded-full"></div>
                  <div className="space-y-4">
                    <div className="h-24 w-full bg-slate-50 rounded-3xl"></div>
                    <div className="h-24 w-full bg-slate-50 rounded-3xl"></div>
                    <div className="h-24 w-full bg-slate-50 rounded-3xl"></div>
                  </div>
                </motion.div>
              ) : feedback && (
                <motion.div 
                  key="feedback"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-8"
                >
                  <div className="flex items-center justify-between border-b border-slate-50 pb-6">
                    <div>
                      <h3 className="text-xl font-black text-slate-900">Mission Report</h3>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Academic Mastery</p>
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

                  <div className="mt-8 pt-6 border-t border-slate-50">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Next Big Step</p>
                    <div className="p-6 bg-slate-900 text-white rounded-3xl shadow-xl shadow-slate-200 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <ArrowRight size={48} />
                      </div>
                      <p className="text-lg serif-text italic leading-relaxed relative z-10">
                        "{feedback.suggestion}"
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDemo;
