
import React from 'react';
import { ViewMode } from '../types';

interface HeaderProps {
  currentView: ViewMode;
  onNavigate: (view: ViewMode) => void;
}

const Header: React.FC<HeaderProps> = ({ currentView, onNavigate }) => {
  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div 
            className="flex items-center cursor-pointer group"
            onClick={() => onNavigate(ViewMode.Landing)}
          >
            <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center text-white mr-3 group-hover:bg-teal-700 transition-all shadow-sm">
              <i className="fas fa-brain text-xl"></i>
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-800">BrainBridge</span>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <button 
              onClick={() => onNavigate(ViewMode.Landing)}
              className={`text-sm font-medium transition-colors ${currentView === ViewMode.Landing ? 'text-teal-600' : 'text-slate-600 hover:text-teal-600'}`}
            >
              Home
            </button>
            <button 
              onClick={() => onNavigate(ViewMode.StudentDemo)}
              className={`text-sm font-medium transition-colors ${currentView === ViewMode.StudentDemo ? 'text-teal-600' : 'text-slate-600 hover:text-teal-600'}`}
            >
              Demo Mission
            </button>
            <button 
              onClick={() => onNavigate(ViewMode.TeacherDashboard)}
              className={`text-sm font-medium transition-colors ${currentView === ViewMode.TeacherDashboard ? 'text-teal-600' : 'text-slate-600 hover:text-teal-600'}`}
            >
              Teacher View
            </button>
          </div>

          <div className="flex items-center">
            <button className="bg-teal-600 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-teal-700 transition-all shadow-md active:scale-95">
              Get Started
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Header;
