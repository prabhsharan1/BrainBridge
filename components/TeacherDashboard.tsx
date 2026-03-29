
import React, { useState } from 'react';
import { Users, BarChart3, PenTool, AlertTriangle, ChevronRight, Download, Plus, FileText } from 'lucide-react';
import { motion } from 'motion/react';
import CurriculumUpload from './CurriculumUpload';
import { Language, Languages } from '../types';

const TeacherDashboard: React.FC = () => {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  
  const students = [
    { name: 'Lina M.', status: 'Completed', score: 4, mission: 'The Water Cycle', language: 'Spanish' },
    { name: 'David K.', status: 'In Progress', score: 2, mission: 'Fraction Fair', language: 'Arabic' },
    { name: 'Sarah J.', status: 'Review Needed', score: 1, mission: 'Character Detective', language: 'Chinese' },
    { name: 'Oscar W.', status: 'Completed', score: 3, mission: 'The Water Cycle', language: 'Spanish' },
    { name: 'Yumi T.', status: 'Stuck', score: 2, mission: 'Fraction Fair', language: 'Vietnamese' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 sm:mb-12 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6"
      >
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Classroom Insights</h2>
          <p className="text-slate-500 font-medium mt-1 text-sm sm:text-base">Grade 4 - Language Transition Support Group</p>
        </div>
        <div className="flex flex-wrap gap-3 sm:gap-4">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsUploadOpen(true)}
            className="flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-3 bg-white border-2 border-slate-100 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-black shadow-sm hover:bg-slate-50 transition-all flex items-center justify-center"
          >
            <FileText size={16} className="mr-2" /> Extract Curriculum
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-3 bg-slate-900 text-white rounded-xl sm:rounded-2xl text-xs sm:text-sm font-black shadow-xl shadow-slate-200 hover:bg-teal-600 transition-all flex items-center justify-center"
          >
            <Plus size={16} className="mr-2" /> Assign Mission
          </motion.button>
        </div>
      </motion.div>

      {isUploadOpen && (
        <CurriculumUpload 
          onClose={() => setIsUploadOpen(false)} 
          language={Languages.Spanish} // Default to Spanish for demo
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8 mb-8 sm:mb-12">
        <StatCard title="Active Explorers" value="24" icon={Users} />
        <StatCard title="Avg. Mastery" value="LVL 2.4" icon={BarChart3} color="text-teal-600" />
        <StatCard title="Missions Today" value="18" icon={PenTool} />
        <StatCard title="Language Alerts" value="4" icon={AlertTriangle} color="text-rose-500" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-3xl sm:rounded-[2.5rem] border-2 border-slate-100 shadow-sm overflow-hidden"
      >
        <div className="px-6 sm:px-8 py-4 sm:py-6 border-b border-slate-50 bg-slate-50/50 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
          <h3 className="font-black text-slate-800 text-sm sm:text-base">Student Progress Tracker</h3>
          <div className="text-[8px] sm:text-[10px] text-slate-400 font-black uppercase tracking-widest">Live Syncing • 2 mins ago</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead>
              <tr className="text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-50">
                <th className="px-6 sm:px-8 py-4 sm:py-5">Student</th>
                <th className="px-6 sm:px-8 py-4 sm:py-5">Home Language</th>
                <th className="px-6 sm:px-8 py-4 sm:py-5">Current Mission</th>
                <th className="px-6 sm:px-8 py-4 sm:py-5">Status</th>
                <th className="px-6 sm:px-8 py-4 sm:py-5">Mastery</th>
                <th className="px-6 sm:px-8 py-4 sm:py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {students.map((s, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 sm:px-8 py-4 sm:py-5">
                    <div className="flex items-center">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-slate-100 mr-3 sm:mr-4 overflow-hidden border-2 border-white shadow-sm flex-shrink-0">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${s.name}`} alt="" />
                      </div>
                      <span className="font-black text-slate-800 text-sm sm:text-base">{s.name}</span>
                    </div>
                  </td>
                  <td className="px-6 sm:px-8 py-4 sm:py-5">
                    <span className="text-[10px] sm:text-xs font-bold text-slate-500 bg-slate-100 px-2 sm:px-3 py-1 rounded-lg">
                      {s.language}
                    </span>
                  </td>
                  <td className="px-6 sm:px-8 py-4 sm:py-5 text-xs sm:text-sm font-medium text-slate-600">{s.mission}</td>
                  <td className="px-6 sm:px-8 py-4 sm:py-5">
                    <span className={`px-2 sm:px-3 py-1 rounded-full text-[8px] sm:text-[10px] font-black uppercase tracking-widest ${
                      s.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                      s.status === 'Stuck' ? 'bg-rose-100 text-rose-700' :
                      s.status === 'Review Needed' ? 'bg-amber-100 text-amber-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-6 sm:px-8 py-4 sm:py-5">
                    <div className="flex gap-1 sm:gap-1.5">
                      {[1, 2, 3, 4].map(l => (
                        <div key={l} className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${l <= s.score ? 'bg-teal-500 shadow-sm' : 'bg-slate-100'}`}></div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 sm:px-8 py-4 sm:py-5 text-right">
                    <button className="w-8 h-8 rounded-lg text-slate-300 hover:text-teal-600 hover:bg-teal-50 transition-all">
                      <ChevronRight size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color = "text-slate-800" }: { title: string, value: string, icon: any, color?: string }) => (
  <motion.div 
    whileHover={{ y: -4 }}
    className="bg-white p-6 sm:p-8 rounded-3xl sm:rounded-[2rem] border-2 border-slate-100 shadow-sm hover:border-teal-100 transition-all group"
  >
    <div className="flex items-center justify-between mb-4">
      <span className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</span>
      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:text-teal-500 transition-colors">
        <Icon size={18} className="sm:size-5" />
      </div>
    </div>
    <div className={`text-2xl sm:text-3xl font-black ${color}`}>{value}</div>
  </motion.div>
);

export default TeacherDashboard;
