
import React from 'react';
import { CHARACTERS, COLORS } from '../constants';
import { Subject } from '../types';
import { Rocket, UserPlus, Award, Plus, FlaskConical, Calculator, BookOpen, Globe2 } from 'lucide-react';
import { motion } from 'motion/react';

const ProgressView: React.FC = () => {
  const subjectMastery = [
    { name: Subject.Science, level: 3, xp: 85, color: COLORS.science, icon: FlaskConical },
    { name: Subject.Math, level: 2, xp: 40, color: COLORS.math, icon: Calculator },
    { name: Subject.Reading, level: 1, xp: 15, color: COLORS.reading, icon: BookOpen },
    { name: Subject.SocialStudies, level: 4, xp: 95, color: COLORS.social, icon: Globe2 },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-6xl mx-auto animate-in fade-in duration-700">
      <div className="grid lg:grid-cols-3 gap-8 mb-10">
        <div className="lg:col-span-2 bg-white rounded-3xl sm:rounded-[2.5rem] border-2 border-slate-100 p-6 sm:p-10 shadow-sm">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-8 sm:mb-10 tracking-tight">Subject Mastery</h2>
          
          <div className="space-y-6 sm:space-y-10">
            {subjectMastery.map((subject) => {
              const Icon = subject.icon;
              return (
                <div key={subject.name}>
                  <div className="flex justify-between items-end mb-4">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: subject.color }}>
                        <Icon size={20} className="sm:size-6" />
                      </div>
                      <div>
                         <span className="font-black text-slate-800 text-base sm:text-lg">{subject.name}</span>
                         <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Mastery Level</p>
                      </div>
                    </div>
                    <div className="text-right">
                       <span className="text-xl sm:text-3xl font-black text-slate-900 leading-none">Level {subject.level}</span>
                       <p className="text-[10px] sm:text-xs font-bold text-slate-400 mt-1">{subject.xp}% to next level</p>
                    </div>
                  </div>
                  <div className="w-full bg-slate-50 h-4 rounded-full overflow-hidden border-2 border-slate-50 p-1">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${subject.xp}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="h-full rounded-full shadow-sm"
                      style={{ backgroundColor: subject.color }}
                    ></motion.div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col space-y-8">
           <div className="bg-slate-900 rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-8 text-white shadow-2xl shadow-slate-300 flex-1 flex flex-col items-center justify-center text-center relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                 <div className="absolute top-10 left-10 w-20 h-20 border-4 border-white rounded-full"></div>
                 <div className="absolute bottom-20 right-10 w-32 h-32 border-8 border-teal-500 rounded-full"></div>
              </div>
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 4 }}
              >
                <Rocket size={40} className="sm:size-12 text-teal-400 mb-6" />
              </motion.div>
              <h3 className="text-xl sm:text-2xl font-black mb-3">Next Big Step</h3>
              <p className="text-slate-400 font-medium mb-8 px-4 leading-relaxed text-sm sm:text-base">Reach Level 3 in Reading to unlock your first "Story Explorer" badge!</p>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full bg-teal-500 text-white py-3 sm:py-4 rounded-2xl font-black hover:bg-teal-400 transition-all shadow-xl shadow-teal-900/20 text-sm sm:text-base"
              >
                View Adventure Map
              </motion.button>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <div className="bg-white rounded-3xl sm:rounded-[2.5rem] border-2 border-slate-100 p-6 sm:p-8">
            <h3 className="text-lg sm:text-xl font-black text-slate-800 mb-6 sm:mb-8 flex items-center">
              <UserPlus size={20} className="text-teal-500 mr-3" /> Unlocked Guides
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
               {CHARACTERS.map((char) => (
                 <motion.div 
                  key={char.id} 
                  whileHover={{ scale: 1.05 }}
                  className="group cursor-pointer"
                 >
                    <div className="aspect-square rounded-2xl sm:rounded-3xl bg-slate-50 border-2 border-slate-100 p-2 group-hover:border-teal-400 transition-all">
                       <img src={char.avatar} alt={char.name} className="w-full h-full object-cover rounded-xl sm:rounded-2xl" />
                    </div>
                    <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 text-center group-hover:text-teal-600">{char.name.split(' ')[0]}</p>
                 </motion.div>
               ))}
               <div className="aspect-square rounded-2xl sm:rounded-3xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-300">
                  <Plus size={20} />
               </div>
            </div>
         </div>

         <div className="bg-white rounded-3xl sm:rounded-[2.5rem] border-2 border-slate-100 p-6 sm:p-8">
            <h3 className="text-lg sm:text-xl font-black text-slate-800 mb-6 sm:mb-8 flex items-center">
              <Award size={20} className="text-amber-500 mr-3" /> Recent Badges
            </h3>
            <div className="space-y-4">
               <div className="flex items-center p-3 sm:p-4 bg-slate-50 rounded-2xl sm:rounded-3xl border-2 border-slate-50 hover:border-amber-100 transition-all cursor-pointer group">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white rounded-xl sm:rounded-2xl flex items-center justify-center text-2xl sm:text-3xl shadow-sm mr-4 sm:mr-5 group-hover:rotate-12 transition-transform">
                    🔥
                  </div>
                  <div>
                    <p className="text-sm sm:text-base font-black text-slate-800">3 Day Streak</p>
                    <p className="text-[10px] sm:text-xs font-bold text-slate-400">You're on fire, Alex!</p>
                  </div>
               </div>
               <div className="flex items-center p-3 sm:p-4 bg-slate-50 rounded-2xl sm:rounded-3xl border-2 border-slate-50 hover:border-teal-100 transition-all cursor-pointer group">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white rounded-xl sm:rounded-2xl flex items-center justify-center text-2xl sm:text-3xl shadow-sm mr-4 sm:mr-5 group-hover:rotate-12 transition-transform">
                    🧪
                  </div>
                  <div>
                    <p className="text-sm sm:text-base font-black text-slate-800">Science Whiz</p>
                    <p className="text-[10px] sm:text-xs font-bold text-slate-400">Mastered the Water Cycle mission.</p>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default ProgressView;
