
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles } from 'lucide-react';
import { getAlexMessage } from '../services/geminiService';
import { Language, Languages } from '../types';

interface AlexGuideProps {
  scenario: 'greeting' | 'streak' | 'tip' | 'frustration';
  context?: string;
  language: Language;
  onClose?: () => void;
  autoHide?: number;
  initialMessage?: string;
}

const AlexGuide: React.FC<AlexGuideProps> = ({ 
  scenario, 
  context, 
  language, 
  onClose,
  autoHide = 8000,
  initialMessage
}) => {
  const [message, setMessage] = useState<string>(initialMessage || '');
  const [isVisible, setIsVisible] = useState(!!initialMessage);
  const [isLoading, setIsLoading] = useState(!initialMessage);

  useEffect(() => {
    if (initialMessage) {
      setMessage(initialMessage);
      setIsVisible(true);
      setIsLoading(false);
      return;
    }

    const fetchMessage = async () => {
      setIsLoading(true);
      try {
        const msg = await getAlexMessage(scenario, context, language);
        setMessage(msg);
        setIsVisible(true);
      } catch (error) {
        console.error("Alex failed to speak:", error);
        setMessage("You're doing great! Keep going! 🌟");
        setIsVisible(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessage();
  }, [scenario, context, language, initialMessage]);

  useEffect(() => {
    if (isVisible && autoHide > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, autoHide);
      return () => clearTimeout(timer);
    }
  }, [isVisible, autoHide]);

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) {
      setTimeout(onClose, 500);
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.8, x: 50, y: 50 }}
          animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, x: 50, y: 50 }}
          className="fixed bottom-8 right-8 z-[60] flex items-end space-x-4 max-w-sm"
        >
          <div className="flex-1">
            <div className="bg-white rounded-[2rem] p-6 shadow-2xl border-2 border-teal-100 relative mb-4">
              {/* Speech Bubble Tail */}
              <div className="absolute -bottom-2 right-8 w-6 h-6 bg-white border-r-2 border-b-2 border-teal-100 rotate-45"></div>
              
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-black text-teal-600 uppercase tracking-widest flex items-center">
                    <Sparkles size={12} className="mr-1" /> Alex's Tip
                  </span>
                </div>
                <button 
                  onClick={handleClose}
                  className="text-slate-300 hover:text-slate-500 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {isLoading ? (
                <div className="flex space-x-1 py-2">
                  <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              ) : (
                <p className="text-slate-700 font-bold leading-relaxed">
                  {message}
                </p>
              )}
            </div>
          </div>

          <motion.div 
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="w-20 h-20 rounded-3xl bg-teal-500 border-4 border-white shadow-xl overflow-hidden flex-shrink-0"
          >
            <img 
              src="https://api.dicebear.com/7.x/bottts/svg?seed=Alex&mouth=smile01" 
              alt="Alex" 
              className="w-full h-full object-cover"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AlexGuide;
