
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import MissionList from './components/MissionList';
import MissionView from './components/MissionView';
import TeacherDashboard from './components/TeacherDashboard';
import ProgressView from './components/ProgressView';
import StudentDemo from './components/StudentDemo';
import AccountView from './components/AccountView';
import DailyCheckIn from './components/DailyCheckIn';
import BridgeNotepad from './components/BridgeNotepad';
import AlexGuide from './components/AlexGuide';
import Onboarding from './components/Onboarding';
import { ViewMode, Mission, Language, Languages, UserProfile, UserRole } from './types';
import { Star, Wand2, Loader2, LogOut, User as UserIcon, ChevronDown, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { translateUIStrings } from './services/geminiService';
import { TRANSLATIONS } from './src/translations';
import { FirebaseProvider, useFirebase } from './src/components/FirebaseProvider';
import ErrorBoundary from './src/components/ErrorBoundary';
import { auth, signInWithPopup, googleProvider, db, setDoc, doc, Timestamp } from './firebase';

const AppContent: React.FC = () => {
  const { user, profile: firebaseProfile, loading, isAuthReady } = useFirebase();
  const [currentView, setCurrentView] = useState<ViewMode>(ViewMode.Onboarding);
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [homeLanguage, setHomeLanguage] = useState<Language>(Languages.Spanish);
  const [activeLanguage, setActiveLanguage] = useState<Language>(Languages.English);
  const [isTranslating, setIsTranslating] = useState(false);
  const [streak, setStreak] = useState(2); // Start at 2 so check-in fills the 3rd
  const [showCheckIn, setShowCheckIn] = useState(true);
  const [showStreakCelebration, setShowStreakCelebration] = useState(false);
  const [xp, setXp] = useState(1240);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotepadOpen, setIsNotepadOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [translationTimer, setTranslationTimer] = useState<number | null>(null);

  // Sync state with firebase profile
  useEffect(() => {
    if (firebaseProfile) {
      setXp(firebaseProfile.xp);
      setStreak(firebaseProfile.streak);
      setHomeLanguage(firebaseProfile.homeLanguage || Languages.Spanish);
      if (currentView === ViewMode.Onboarding) {
        setCurrentView(firebaseProfile.role === UserRole.Teacher ? ViewMode.TeacherDashboard : ViewMode.Missions);
      }
    }
  }, [firebaseProfile]);

  const t = TRANSLATIONS[activeLanguage] || TRANSLATIONS[Languages.English];

  // Effect for the translation mode indicator and automatic reset
  useEffect(() => {
    let interval: NodeJS.Timeout;
    let resetTimeout: NodeJS.Timeout;
    
    if (activeLanguage !== Languages.English && !isTranslating) {
      setTranslationTimer(5);
      
      // Countdown interval for the UI
      interval = setInterval(() => {
        setTranslationTimer((prev) => {
          if (prev === null || prev <= 1) {
            return null;
          }
          return prev - 1;
        });
      }, 1000);

      // Actual reset timeout
      resetTimeout = setTimeout(() => {
        setActiveLanguage(Languages.English);
        setTranslationTimer(null);
      }, 5000);
    } else {
      setTranslationTimer(null);
    }

    return () => {
      if (interval) clearInterval(interval);
      if (resetTimeout) clearTimeout(resetTimeout);
    };
  }, [activeLanguage, isTranslating]);

  // Effect to handle dynamic translations when homeLanguage changes
  useEffect(() => {
    const handleDynamicTranslation = async () => {
      if (homeLanguage === Languages.English) return;

      // If we don't have translations for this language yet, fetch them
      if (!TRANSLATIONS[homeLanguage]) {
        setIsTranslating(true);
        try {
          const translated = await translateUIStrings(homeLanguage, TRANSLATIONS[Languages.English]);
          TRANSLATIONS[homeLanguage] = translated;
        } catch (error) {
          console.error("Failed to fetch dynamic translations:", error);
        } finally {
          setIsTranslating(false);
        }
      }
    };

    handleDynamicTranslation();
  }, [homeLanguage]);

  const handleSelectMission = (mission: Mission) => {
    setSelectedMission(mission);
    setCurrentView(ViewMode.ActiveMission);
  };

  const handleOnboardingComplete = async (profile: Omit<UserProfile, 'uid'>) => {
    if (!user) {
      try {
        const result = await signInWithPopup(auth, googleProvider);
        const newUser = result.user;
        const profileWithUid = { ...profile, uid: newUser.uid, createdAt: Timestamp.now().toDate().toISOString() };
        await setDoc(doc(db, 'users', newUser.uid), profileWithUid);
      } catch (error) {
        console.error("Login failed:", error);
      }
    } else {
      const profileWithUid = { ...profile, uid: user.uid, createdAt: Timestamp.now().toDate().toISOString() };
      await setDoc(doc(db, 'users', user.uid), profileWithUid);
    }
  };

  const handleSignOut = async () => {
    await auth.signOut();
    setCurrentView(ViewMode.Onboarding);
    setIsProfileOpen(false);
  };

  const renderContent = () => {
    if (loading && isAuthReady) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="animate-spin text-teal-500" size={48} />
        </div>
      );
    }

    if (!firebaseProfile) {
      return <Onboarding onComplete={handleOnboardingComplete} />;
    }

    switch (currentView) {
      case ViewMode.Landing:
      case ViewMode.Missions:
        return <MissionList onSelectMission={handleSelectMission} language={activeLanguage} />;
      case ViewMode.ActiveMission:
        return selectedMission ? (
          <MissionView 
            mission={selectedMission} 
            onBack={() => setCurrentView(ViewMode.Missions)} 
            language={activeLanguage}
          />
        ) : (
          <MissionList onSelectMission={handleSelectMission} language={activeLanguage} />
        );
      case ViewMode.TeacherDashboard:
        return <TeacherDashboard />;
      case ViewMode.Progress:
        return <ProgressView />;
      case ViewMode.StudentDemo:
        return <StudentDemo />;
      case ViewMode.Account:
        return (
          <AccountView 
            profile={firebaseProfile!} 
            language={activeLanguage} 
            onBack={() => setCurrentView(firebaseProfile?.role === UserRole.Teacher ? ViewMode.TeacherDashboard : ViewMode.Missions)} 
          />
        );
      default:
        return <MissionList onSelectMission={handleSelectMission} language={activeLanguage} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans relative">
      {!firebaseProfile ? (
        <div className="flex-1 overflow-hidden">
          <Onboarding onComplete={handleOnboardingComplete} />
        </div>
      ) : (
        <>
          {showStreakCelebration && (
            <AlexGuide 
              scenario="streak" 
              context={`Streak reached: ${streak} days!`}
              language={activeLanguage} 
              onClose={() => setShowStreakCelebration(false)} 
            />
          )}
          {showCheckIn && (
            <DailyCheckIn 
              language={activeLanguage} 
              onClaim={() => {
                setStreak(3);
                setXp(prev => prev + 50);
                setTimeout(() => {
                  setShowCheckIn(false);
                  setShowStreakCelebration(true);
                }, 500);
              }} 
            />
          )}
            <Sidebar 
              currentView={currentView} 
              onNavigate={(view) => {
                setCurrentView(view);
                if (view !== ViewMode.ActiveMission) setSelectedMission(null);
                setIsSidebarOpen(false); // Close sidebar on navigation (mobile)
              }} 
              homeLanguage={homeLanguage}
              onHomeLanguageChange={setHomeLanguage}
              activeLanguage={activeLanguage}
              onActiveLanguageChange={setActiveLanguage}
              isTranslating={isTranslating}
              streak={streak}
              userRole={firebaseProfile.role}
              userName={firebaseProfile.name}
              onOpenNotepad={() => {
                setIsNotepadOpen(true);
                setIsSidebarOpen(false);
              }}
              isOpen={isSidebarOpen}
              onClose={() => setIsSidebarOpen(false)}
            />
          <main className="flex-1 flex flex-col overflow-hidden w-full">
            <header className="h-16 sm:h-20 border-b border-slate-200 bg-white flex items-center justify-between px-4 sm:px-8 flex-shrink-0 shadow-sm z-20">
              <div className="flex-1 min-w-0 flex items-center space-x-2 sm:space-x-4">
                <button 
                  onClick={() => setIsSidebarOpen(true)}
                  className="lg:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-50 rounded-xl transition-colors"
                >
                  <Menu size={24} />
                </button>
                <h1 className="text-lg sm:text-2xl font-black text-slate-800 tracking-tight truncate">
                  {currentView === ViewMode.Missions && (
                    firebaseProfile.role === UserRole.Teacher 
                      ? (t.adventureMap || "Adventure Map")
                      : (t.studentPortal || "Student Portal")
                  )}
                  {currentView === ViewMode.ActiveMission && `${t.mission || "Mission"}: ${selectedMission?.title}`}
                  {currentView === ViewMode.TeacherDashboard && (t.teacherPortal || "Teacher Portal")}
                  {currentView === ViewMode.Progress && (firebaseProfile.role === UserRole.Student || firebaseProfile.name === 'Test Teacher') && (t.trophyRoom || "My Trophy Room")}
                  {currentView === ViewMode.StudentDemo && "Demo Mission"}
                </h1>
              </div>
              <div className="flex items-center space-x-2 sm:space-x-6 flex-shrink-0 ml-2 sm:ml-4">
                 {isTranslating && (
                   <div className="hidden sm:flex items-center space-x-2 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-200 whitespace-nowrap">
                     <Loader2 size={16} className="animate-spin text-teal-500" />
                     <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Translating...</span>
                   </div>
                 )}
                 {translationTimer !== null && (
                   <div className="hidden sm:flex items-center space-x-2 bg-teal-50 px-4 py-2 rounded-2xl border border-teal-200 whitespace-nowrap">
                     <span className="text-[10px] font-black text-teal-600 uppercase tracking-widest">
                       {activeLanguage} Mode: {translationTimer}s
                     </span>
                   </div>
                 )}
                 {activeLanguage !== Languages.English && (
                   <button 
                     onClick={() => setActiveLanguage(Languages.English)}
                     className="w-10 h-10 rounded-full bg-slate-800 text-white flex items-center justify-center hover:bg-slate-700 transition-all shadow-lg shadow-slate-900/20 group border-2 border-slate-700"
                     title="Back to English"
                   >
                     <span className="text-xs font-black tracking-tighter group-hover:scale-110 transition-transform">EN</span>
                   </button>
                 )}
                 <div className="flex items-center bg-amber-50 px-2 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl border-2 border-amber-100 shadow-sm">
                   <span className="text-amber-700 text-sm sm:text-lg font-black">{xp.toLocaleString()}</span>
                   <Star size={16} className="text-amber-500 ml-1 sm:ml-2 fill-amber-500 animate-pulse sm:w-5 sm:h-5" />
                 </div>
                 <div className="relative">
                   <div 
                     className="flex items-center space-x-2 sm:space-x-3 group cursor-pointer"
                     onClick={() => setIsProfileOpen(!isProfileOpen)}
                   >
                      <div className="text-right hidden sm:block">
                        <p className="text-sm font-black text-slate-800 leading-none">{firebaseProfile.name}</p>
                        <p className="text-[10px] font-bold text-teal-600 uppercase tracking-widest">
                          {firebaseProfile.role === UserRole.Teacher ? 'Teacher' : firebaseProfile.grade || 'Student'}
                        </p>
                      </div>
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-teal-100 border-2 border-white shadow-md overflow-hidden group-hover:border-teal-400 transition-all relative">
                         <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${firebaseProfile.avatarSeed}`} alt="User Profile" />
                         <div className="absolute bottom-0 right-0 bg-white rounded-tl-lg p-0.5 border-t border-l border-slate-100">
                           <ChevronDown size={8} className={`text-slate-400 transition-transform sm:w-2.5 sm:h-2.5 ${isProfileOpen ? 'rotate-180' : ''}`} />
                         </div>
                      </div>
                   </div>
 
                   <AnimatePresence>
                     {isProfileOpen && (
                       <motion.div
                         initial={{ opacity: 0, y: 10, scale: 0.95 }}
                         animate={{ opacity: 1, y: 0, scale: 1 }}
                         exit={{ opacity: 0, y: 10, scale: 0.95 }}
                         className="absolute right-0 mt-3 w-56 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-50"
                       >
                         <div className="p-4 border-b border-slate-50 bg-slate-50/50">
                           <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Account</p>
                           <p className="text-sm font-black text-slate-800 truncate">{firebaseProfile.name}</p>
                         </div>
                          <div className="p-2">
                            <button 
                              onClick={() => {
                                setCurrentView(ViewMode.Account);
                                setIsProfileOpen(false);
                              }}
                              className="w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                            >
                              <UserIcon size={18} />
                              <span>{t.viewAccount}</span>
                            </button>
                            <button 
                              onClick={handleSignOut}
                              className="w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-sm font-bold text-rose-500 hover:bg-rose-50 transition-colors"
                            >
                              <LogOut size={18} />
                              <span>{t.signOut}</span>
                            </button>
                          </div>
                       </motion.div>
                     )}
                   </AnimatePresence>
                 </div>
              </div>
            </header>
            <section className="flex-1 overflow-y-auto bg-slate-50 custom-scrollbar">
              {renderContent()}
            </section>
            <BridgeNotepad 
              isOpen={isNotepadOpen} 
              onClose={() => setIsNotepadOpen(false)} 
              homeLanguage={homeLanguage}
              activeLanguage={activeLanguage}
              onActiveLanguageChange={setActiveLanguage}
            />
          </main>
        </>
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <FirebaseProvider>
        <AppContent />
      </FirebaseProvider>
    </ErrorBoundary>
  );
};

export default App;
