
import React from 'react';
import { motion } from 'motion/react';
import { UserProfile, Language, Languages, UserRole } from '../types';
import { TRANSLATIONS } from '../src/translations';
import { 
  User, 
  GraduationCap, 
  School, 
  Trophy, 
  Flame, 
  Star, 
  Shield, 
  ChevronLeft,
  Mail,
  Calendar,
  Hash
} from 'lucide-react';

interface AccountViewProps {
  profile: UserProfile;
  language: Language;
  onBack: () => void;
}

const AccountView: React.FC<AccountViewProps> = ({ profile, language, onBack }) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS[Languages.English];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-8 sm:py-12">
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={onBack}
        className="flex items-center space-x-2 text-slate-400 hover:text-teal-600 transition-colors mb-6 sm:mb-8 group"
      >
        <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:bg-teal-50 transition-colors">
          <ChevronLeft size={18} />
        </div>
        <span className="font-black text-xs sm:text-sm uppercase tracking-widest">Back to Adventure</span>
      </motion.button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:col-span-1 space-y-6"
        >
          <div className="bg-white rounded-3xl sm:rounded-[2.5rem] border-2 border-slate-100 p-6 sm:p-8 shadow-sm text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-teal-400 to-teal-600 opacity-10"></div>
            
            <div className="relative mb-6">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-[2rem] sm:rounded-[2.5rem] bg-white border-4 border-white shadow-xl mx-auto overflow-hidden">
                <img 
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.avatarSeed}`} 
                  alt="Profile Avatar" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 bg-teal-500 text-white p-1.5 sm:p-2 rounded-xl sm:rounded-2xl shadow-lg border-4 border-white">
                {profile.role === UserRole.Teacher ? <School size={16} className="sm:size-5" /> : <GraduationCap size={16} className="sm:size-5" />}
              </div>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-1">{profile.name}</h2>
            <p className="text-slate-500 font-bold text-xs sm:text-sm uppercase tracking-widest mb-6">
              {profile.role === UserRole.Teacher ? t.teacherPortal : (profile.grade || t.explorer)}
            </p>

            <div className="flex items-center justify-center space-x-4">
              <div className="text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Level</p>
                <p className="text-lg sm:text-xl font-black text-teal-600">{Math.floor(profile.xp / 500) + 1}</p>
              </div>
              <div className="w-px h-8 bg-slate-100"></div>
              <div className="text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Rank</p>
                <p className="text-lg sm:text-xl font-black text-amber-500">Gold</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-8 text-white shadow-xl shadow-slate-200">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Quick Stats</h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/10 flex items-center justify-center text-amber-500">
                    <Flame size={18} className="sm:size-5" />
                  </div>
                  <span className="font-bold text-xs sm:text-sm">{t.dailyStreak}</span>
                </div>
                <span className="font-black text-base sm:text-lg">{profile.streak} {t.days}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/10 flex items-center justify-center text-teal-400">
                    <Star size={18} className="sm:size-5" />
                  </div>
                  <span className="font-bold text-xs sm:text-sm">Total XP</span>
                </div>
                <span className="font-black text-base sm:text-lg">{profile.xp}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/10 flex items-center justify-center text-indigo-400">
                    <Trophy size={18} className="sm:size-5" />
                  </div>
                  <span className="font-bold text-xs sm:text-sm">Missions</span>
                </div>
                <span className="font-black text-base sm:text-lg">12</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Details Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="md:col-span-2 space-y-8"
        >
          <div className="bg-white rounded-3xl sm:rounded-[2.5rem] border-2 border-slate-100 p-6 sm:p-10 shadow-sm">
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-6 sm:mb-8 tracking-tight">Profile Details</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                  <User size={12} className="mr-2" /> Full Name
                </label>
                <p className="text-base sm:text-lg font-bold text-slate-800 bg-slate-50 px-4 sm:px-5 py-2 sm:py-3 rounded-xl sm:rounded-2xl border border-slate-100">
                  {profile.name}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                  <Mail size={12} className="mr-2" /> Email Address
                </label>
                <p className="text-base sm:text-lg font-bold text-slate-800 bg-slate-50 px-4 sm:px-5 py-2 sm:py-3 rounded-xl sm:rounded-2xl border border-slate-100 break-all">
                  {profile.name.toLowerCase().replace(' ', '.')}@school.edu
                </p>
              </div>

              {profile.role === UserRole.Student && (
                <>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                      <GraduationCap size={12} className="mr-2" /> Grade Level
                    </label>
                    <p className="text-base sm:text-lg font-bold text-slate-800 bg-slate-50 px-4 sm:px-5 py-2 sm:py-3 rounded-xl sm:rounded-2xl border border-slate-100">
                      {profile.grade || 'Not Assigned'}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                      <Hash size={12} className="mr-2" /> Class Code
                    </label>
                    <p className="text-base sm:text-lg font-bold text-slate-800 bg-slate-50 px-4 sm:px-5 py-2 sm:py-3 rounded-xl sm:rounded-2xl border border-slate-100">
                      {profile.classCode || 'NO-CODE-YET'}
                    </p>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                  <Calendar size={12} className="mr-2" /> Joined Date
                </label>
                <p className="text-base sm:text-lg font-bold text-slate-800 bg-slate-50 px-4 sm:px-5 py-2 sm:py-3 rounded-xl sm:rounded-2xl border border-slate-100">
                  March 2024
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                  <Shield size={12} className="mr-2" /> Account Type
                </label>
                <p className="text-base sm:text-lg font-bold text-slate-800 bg-slate-50 px-4 sm:px-5 py-2 sm:py-3 rounded-xl sm:rounded-2xl border border-slate-100 capitalize">
                  {profile.role} Account
                </p>
              </div>
            </div>

            <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-slate-50 flex justify-end">
              <button className="w-full sm:w-auto px-8 py-3 sm:py-4 bg-teal-600 text-white rounded-xl sm:rounded-2xl font-black text-sm shadow-lg shadow-teal-600/20 hover:bg-teal-700 transition-all active:scale-95">
                Edit Profile
              </button>
            </div>
          </div>

          <div className="bg-amber-50 rounded-3xl sm:rounded-[2.5rem] border-2 border-amber-100 p-6 sm:p-8 flex items-center space-x-4 sm:space-x-6">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-amber-500 rounded-xl sm:rounded-2xl flex items-center justify-center text-white shadow-lg shadow-amber-500/20 flex-shrink-0">
              <Star size={24} className="sm:size-8" />
            </div>
            <div>
              <h4 className="text-lg sm:text-xl font-black text-amber-800">Premium Explorer</h4>
              <p className="text-amber-700/70 font-medium text-sm sm:text-base">Your account is managed by your school district. Enjoy all premium features!</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AccountView;
