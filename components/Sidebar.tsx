
import React, { useState } from 'react';
import { ViewMode, Language, Languages, UserRole } from '../types';
import { TRANSLATIONS } from '../src/translations';
import { Map, Trophy, Shield, Check, Flame, Settings, Brain, Globe, Plus, Search, Key, ChevronDown, Languages as LangIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

interface SidebarProps {
  currentView: ViewMode;
  onNavigate: (view: ViewMode) => void;
  homeLanguage: Language;
  onHomeLanguageChange: (lang: Language) => void;
  activeLanguage: Language;
  onActiveLanguageChange: (lang: Language) => void;
  isTranslating: boolean;
  streak: number;
  userRole: UserRole;
  userName: string;
  onOpenNotepad: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const LANGUAGE_FLAGS: Record<string, string> = {
  'English': '🇺🇸',
  'Spanish': '🇪🇸',
  'Chinese': '🇨🇳',
  'Arabic': '🇸🇦',
  'Vietnamese': '🇻🇳',
  'French': '🇫🇷',
  'Hindi': '🇮🇳',
  'Bengali': '🇧🇩',
  'Portuguese': '🇵🇹',
  'Russian': '🇷🇺',
  'Japanese': '🇯🇵',
  'Punjabi': '🇮🇳',
  'German': '🇩🇪',
  'Korean': '🇰🇷',
  'Italian': '🇮🇹',
  'Turkish': '🇹🇷',
  'Thai': '🇹🇭',
  'Greek': '🇬🇷',
  'Dutch': '🇳🇱',
  'Swedish': '🇸🇪',
  'Polish': '🇵🇱',
  'Ukrainian': '🇺🇦',
  'Romanian': '🇷🇴',
  'Hungarian': '🇭🇺',
  'Czech': '🇨🇿',
  'Malay': '🇲🇾',
  'Filipino': '🇵🇭',
  'Persian': '🇮🇷',
  'Urdu': '🇵🇰',
  'Tamil': '🇮🇳',
  'Telugu': '🇮🇳',
  'Marathi': '🇮🇳',
  'Gujarati': '🇮🇳',
  'Kannada': '🇮🇳',
  'Malayalam': '🇮🇳',
  'Haitian Creole': '🇭🇹',
  'Quechua': '🇵🇪',
  'Amharic': '🇪🇹',
  'Somali': '🇸🇴',
  'Hebrew': '🇮🇱',
};

const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  onNavigate, 
  homeLanguage, 
  onHomeLanguageChange, 
  activeLanguage,
  onActiveLanguageChange,
  isTranslating,
  streak,
  userRole,
  userName,
  onOpenNotepad,
  isOpen,
  onClose
}) => {
  const t = TRANSLATIONS[activeLanguage] || TRANSLATIONS[Languages.English];
  const [isChangingHomeLanguage, setIsChangingHomeLanguage] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const isTestTeacher = userRole === UserRole.Teacher && userName === 'Test Teacher';
  const showTrophyRoom = userRole === UserRole.Student || isTestTeacher;

  const navItems = [
    { view: ViewMode.Missions, icon: Map, label: t.adventureMap },
    ...(showTrophyRoom ? [{ view: ViewMode.Progress, icon: Trophy, label: t.trophyRoom }] : []),
    ...(userRole === UserRole.Teacher ? [{ view: ViewMode.TeacherDashboard, icon: Shield, label: t.teacherPortal }] : []),
  ];

  const allLanguages = Object.entries(Languages).map(([key, value]) => ({
    code: value,
    label: value,
    flag: LANGUAGE_FLAGS[value] || '🌐'
  })).sort((a, b) => a.label.localeCompare(b.label));

  const filteredLanguages = allLanguages.filter(l => 
    l.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectHomeLanguage = (lang: Language) => {
    onHomeLanguageChange(lang);
    onActiveLanguageChange(lang);
    setIsChangingHomeLanguage(false);
    setSearchQuery('');
  };

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-72 bg-slate-900 flex flex-col border-r border-slate-800 transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div 
          className="p-6 sm:p-8 flex items-center justify-between group"
        >
          <div 
            className="flex items-center space-x-4 cursor-pointer"
            onClick={() => onNavigate(ViewMode.Missions)}
          >
            <motion.div 
              whileHover={{ rotate: 12, scale: 1.1 }}
              className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-teal-400 to-teal-600 rounded-xl sm:rounded-2xl flex items-center justify-center text-white shadow-xl shadow-teal-500/20 rotate-3 group-hover:shadow-teal-500/40 transition-all"
            >
              <Brain size={20} className="sm:w-6 sm:h-6" />
            </motion.div>
            <span className="text-white font-black text-xl sm:text-2xl tracking-tighter group-hover:text-teal-400 transition-colors">BrainBridge</span>
          </div>
          
          <button 
            onClick={onClose}
            className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <ChevronDown size={20} className="rotate-90" />
          </button>
        </div>

      <nav className="flex-1 px-4 py-8 space-y-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.view || (currentView === ViewMode.ActiveMission && item.view === ViewMode.Missions);
          return (
            <motion.button
              key={item.view}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onNavigate(item.view)}
              className={`w-full flex items-center space-x-4 px-5 py-4 rounded-2xl text-sm font-black transition-all duration-300 ${
                isActive
                  ? 'bg-teal-600 text-white shadow-xl shadow-teal-900/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </motion.button>
          );
        })}

        <div className="pt-4 border-t border-slate-800/50">
          <motion.button
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
            onClick={onOpenNotepad}
            className="w-full flex items-center space-x-4 px-5 py-4 rounded-2xl text-sm font-black text-teal-400 hover:text-teal-300 hover:bg-teal-500/10 transition-all duration-300 border border-teal-500/20 shadow-lg shadow-teal-900/20"
          >
            <LangIcon size={20} />
            <span>Bridge Notepad</span>
          </motion.button>
        </div>
      </nav>

      <div className="px-6 py-8 border-t border-slate-800/50">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Language Mode</p>
        </div>

        <div className="flex flex-col space-y-2">
          {/* English Button */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => onActiveLanguageChange(Languages.English)}
            className={`flex items-center space-x-3 px-4 py-3 rounded-2xl text-sm font-black transition-all ${
              activeLanguage === Languages.English
                ? 'bg-teal-600 text-white shadow-lg shadow-teal-900/50'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <span className="text-lg">🇺🇸</span>
            <span>English</span>
            {activeLanguage === Languages.English && <Check size={16} className="ml-auto" />}
          </motion.button>

          {/* Home Language Button */}
          <div className="relative">
            <div className="flex items-center space-x-1">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => onActiveLanguageChange(homeLanguage)}
                className={`flex-1 flex items-center space-x-3 px-4 py-3 rounded-2xl text-sm font-black transition-all ${
                  activeLanguage === homeLanguage && activeLanguage !== Languages.English
                    ? 'bg-teal-600 text-white shadow-lg shadow-teal-900/50'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <span className="text-lg">{LANGUAGE_FLAGS[homeLanguage] || '🌐'}</span>
                <span className="truncate">{homeLanguage}</span>
                {activeLanguage === homeLanguage && activeLanguage !== Languages.English && <Check size={16} className="ml-auto" />}
              </motion.button>
              
              <button 
                onClick={() => setIsChangingHomeLanguage(!isChangingHomeLanguage)}
                className="p-3 rounded-2xl bg-slate-800 text-slate-400 hover:text-teal-400 transition-colors"
                title="Change Home Language"
              >
                <Settings size={18} />
              </button>
            </div>

            <AnimatePresence>
              {isChangingHomeLanguage && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-full left-0 w-full mb-2 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col"
                >
                  <div className="p-3 border-b border-slate-700">
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input 
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search languages..."
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500"
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="p-2 max-h-64 overflow-y-auto custom-scrollbar">
                    {filteredLanguages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => handleSelectHomeLanguage(lang.code)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                          homeLanguage === lang.code 
                            ? 'bg-teal-500/10 text-teal-400' 
                            : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                        }`}
                      >
                        <span className="flex items-center space-x-3">
                          <span>{lang.flag}</span>
                          <span>{lang.label}</span>
                        </span>
                        {homeLanguage === lang.code && <Check size={12} />}
                      </button>
                    ))}
                    {filteredLanguages.length === 0 && (
                      <div className="p-4 text-center text-xs text-slate-500">No languages found</div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="p-6 border-t border-slate-800">
        <div className="bg-slate-800/30 rounded-2xl p-4 border border-slate-700/30">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t.dailyStreak}</span>
            <span className="text-amber-500 font-black text-xs flex items-center">
              {streak} {t.days} <Flame size={12} className="ml-1" />
            </span>
          </div>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5, 6, 7].map((d) => (
              <div 
                key={d} 
                className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${d <= streak ? 'bg-amber-500' : 'bg-slate-700'}`}
              ></div>
            ))}
          </div>
        </div>
      </div>
    </aside>
    </>
  );
};

export default Sidebar;
