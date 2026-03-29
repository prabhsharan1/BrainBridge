
import React from 'react';
import { Mission, Language, Languages } from '../types';
import { MISSIONS, COLORS } from '../constants';
import { TRANSLATIONS } from '../src/translations';
import { Clock, Zap, ChevronRight, Lock } from 'lucide-react';
import { motion } from 'motion/react';
import AlexGuide from './AlexGuide';

interface MissionListProps {
  onSelectMission: (mission: Mission) => void;
  language: Language;
}

const MissionList: React.FC<MissionListProps> = ({ onSelectMission, language }) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS[Languages.English];
  const [showGreeting, setShowGreeting] = React.useState(true);

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto">
      {showGreeting && (
        <AlexGuide 
          scenario="greeting" 
          language={language} 
          onClose={() => setShowGreeting(false)} 
        />
      )}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 sm:mb-12 flex items-end justify-between"
      >
        <div>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 mb-2 sm:mb-3 tracking-tight">{t.welcome}</h2>
          <p className="text-slate-500 text-sm sm:text-lg font-medium">{t.chooseMission}</p>
        </div>
        <div className="hidden lg:block">
           <div className="flex -space-x-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-12 h-12 rounded-2xl border-4 border-white bg-slate-200 shadow-sm overflow-hidden">
                  <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=Guide${i}`} alt="Guide" />
                </div>
              ))}
              <div className="w-12 h-12 rounded-2xl border-4 border-white bg-teal-500 flex items-center justify-center text-white text-xs font-black shadow-lg">
                +12
              </div>
           </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {MISSIONS.map((mission, idx) => (
          <motion.div 
            key={mission.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            whileHover={{ y: -8 }}
            onClick={() => onSelectMission(mission)}
            className="group relative bg-white rounded-3xl sm:rounded-[2.5rem] border-2 border-slate-100 p-6 sm:p-8 flex flex-col h-full cursor-pointer hover:border-teal-500 hover:shadow-2xl transition-all duration-500"
          >
            {/* Subject Badge */}
            <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
               <span className={`px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-white shadow-lg`} style={{ backgroundColor: (COLORS as any)[mission.subject.toLowerCase()] || COLORS.primary }}>
                 {mission.subject}
               </span>
            </div>

            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-50 rounded-2xl sm:rounded-3xl flex items-center justify-center mb-6 sm:mb-8 group-hover:scale-110 transition-transform duration-500 overflow-hidden border-2 border-slate-50 group-hover:border-teal-100">
               <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${mission.characterId}`} alt="Character" className="w-full h-full object-cover" />
            </div>
            
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-3 sm:mb-4">
                <span className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                  <Clock size={10} className="mr-1 sm:mr-1.5 sm:w-3 sm:h-3" /> 15 MINS
                </span>
                <span className="text-[8px] sm:text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center">
                  <Zap size={10} className="mr-1 sm:mr-1.5 sm:w-3 sm:h-3" /> {mission.xp} XP
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-800 mb-3 sm:mb-4 leading-tight">{mission.title}</h3>
              <p className="text-slate-500 text-sm sm:text-base font-medium leading-relaxed mb-6 sm:mb-8">{mission.description}</p>
            </div>

            <div className="mt-auto pt-6 border-t border-slate-50 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center space-x-2">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.available}</span>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectMission(mission);
                }}
                className="bg-slate-900 text-white px-5 py-3 rounded-2xl font-black text-xs flex items-center group-hover:bg-teal-600 transition-colors shadow-lg shadow-slate-200 group-hover:shadow-teal-500/30 whitespace-nowrap"
              >
                {t.startMission} <ChevronRight size={14} className="ml-2" />
              </button>
            </div>
          </motion.div>
        ))}

        {/* Locked State placeholder */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          className="bg-slate-50/50 rounded-[2.5rem] border-2 border-dashed border-slate-200 p-8 flex flex-col h-full grayscale relative overflow-hidden"
        >
           <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="bg-white/90 backdrop-blur-sm p-4 rounded-3xl shadow-xl border border-slate-100 flex flex-col items-center">
                 <Lock size={24} className="text-slate-400 mb-2" />
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t.locked}</span>
              </div>
           </div>
           <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mb-8">
              <div className="w-10 h-10 bg-slate-200 rounded-full"></div>
           </div>
           <h3 className="text-2xl font-black text-slate-300 mb-4">The Mystery Lab</h3>
           <p className="text-slate-300 font-medium leading-relaxed mb-8">Complete 3 Science missions to unlock this secret area.</p>
        </motion.div>
      </div>
    </div>
  );
};

export default MissionList;
