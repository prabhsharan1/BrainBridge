
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X, Flame, Leaf, Sun, Star } from 'lucide-react';
import { Language, Languages } from '../types';
import { TRANSLATIONS } from '../src/translations';

interface DailyCheckInProps {
  language: Language;
  onClaim: () => void;
}

const DailyCheckIn: React.FC<DailyCheckInProps> = ({ language, onClaim }) => {
  const [isClaimed, setIsClaimed] = useState(false);
  const [isHoveringHand, setIsHoveringHand] = useState(false);
  const [showImpact, setShowImpact] = useState(false);
  const [shake, setShake] = useState(false);
  const t = TRANSLATIONS[language] || TRANSLATIONS[Languages.English];

  const handleHighFive = () => {
    if (isClaimed) return;
    
    // Play high-five sound
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    audio.volume = 0.5;
    audio.play().catch(e => console.log("Audio play failed:", e));

    setShowImpact(true);
    setShake(true);
    setIsClaimed(true);
    
    // Reset shake after a short duration
    setTimeout(() => setShake(false), 500);
    
    // Finalize claim after animations
    setTimeout(() => {
      onClaim();
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 40 }}
        animate={{ 
          opacity: 1, 
          scale: 1, 
          y: 0,
          x: shake ? [0, -5, 5, -5, 5, 0] : 0
        }}
        transition={{ duration: shake ? 0.4 : 0.6 }}
        className="bg-[#fdfcf8] w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden relative border-4 border-[#e9e4d1] p-10"
      >
        {/* Close Button */}
        <div className="absolute top-6 right-6 z-20">
           <button 
            onClick={onClaim}
            className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 hover:text-stone-600 transition-colors border-2 border-stone-200"
           >
             <X size={20} />
           </button>
        </div>

        <div className="flex flex-col items-center text-center">
          <div className="relative w-48 h-48 mb-8">
            {/* Alex Character */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="w-full h-full relative"
            >
              <img 
                src="https://api.dicebear.com/7.x/bottts/svg?seed=Alex&mouth=smile01" 
                alt="Alex" 
                className="w-full h-full object-contain"
              />
              
              {/* High-Five Hand */}
              {!isClaimed && (
                <motion.div 
                  className="absolute -top-4 -left-4 cursor-pointer group"
                  onMouseEnter={() => setIsHoveringHand(true)}
                  onMouseLeave={() => setIsHoveringHand(false)}
                  onClick={handleHighFive}
                >
                  {/* Pulsing Ring */}
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute inset-0 bg-amber-400 rounded-full blur-xl"
                  />
                  
                  <motion.div 
                    animate={isHoveringHand ? { rotate: [0, -5, 5, 0] } : {}}
                    transition={{ repeat: Infinity, duration: 0.5 }}
                    className="relative bg-white p-5 rounded-3xl shadow-xl border-4 border-amber-100 flex items-center justify-center"
                  >
                    <span className="text-5xl">✋</span>
                  </motion.div>
                </motion.div>
              )}

              {/* Impact Particles */}
              <AnimatePresence>
                {showImpact && (
                  <div className="absolute top-0 left-0 pointer-events-none">
                    {[...Array(8)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
                        animate={{ 
                          x: (Math.random() - 0.5) * 150, 
                          y: (Math.random() - 0.5) * 150, 
                          opacity: 0,
                          scale: Math.random() * 1.2 + 0.5,
                        }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="absolute"
                      >
                        <Star className="text-amber-400 fill-amber-400" size={20} />
                      </motion.div>
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          <h2 className="text-3xl font-black text-stone-800 mb-3 tracking-tight">
            {isClaimed ? "High-Five! 🚀" : "Daily Check-in!"}
          </h2>
          <p className="text-stone-500 font-medium mb-8">
            {isClaimed 
              ? "Streak updated! Ready for today?" 
              : "Give Alex a high-five to claim your daily reward!"}
          </p>

          {isClaimed && (
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center space-x-2 text-emerald-600 font-black bg-emerald-50 px-6 py-3 rounded-2xl border-2 border-emerald-100"
            >
              <Sparkles size={20} className="animate-pulse" />
              <span>+50 XP Earned</span>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default DailyCheckIn;
