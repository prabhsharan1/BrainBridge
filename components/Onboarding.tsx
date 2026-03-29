
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserRole, UserProfile } from '../types';
import { 
  User, 
  GraduationCap, 
  School, 
  ArrowRight, 
  ChevronLeft, 
  Sparkles,
  CheckCircle2,
  Brain,
  TestTube
} from 'lucide-react';

interface OnboardingProps {
  onComplete: (profile: Omit<UserProfile, 'uid'>) => Promise<void>;
}

const AVATAR_SEEDS = [
  'Explorer', 'Adventurer', 'Scholar', 'Artist', 'Scientist', 
  'Astronaut', 'Wizard', 'Knight', 'Pioneer', 'Dreamer'
];

const GRADES = ['1st Grade', '2nd Grade', '3rd Grade', '4th Grade', '5th Grade', '6th Grade', '7th Grade', '8th Grade'];

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<UserRole | null>(null);
  const [name, setName] = useState('');
  const [grade, setGrade] = useState('');
  const [classCode, setClassCode] = useState('');
  const [avatarSeed, setAvatarSeed] = useState(AVATAR_SEEDS[0]);

  const handleNext = () => {
    if (step === 1 && role) setStep(2);
    else if (step === 2 && name) {
      if (role === UserRole.Teacher) {
        finish();
      } else {
        setStep(3);
      }
    }
    else if (step === 3 && grade) setStep(4);
    else if (step === 4 && (classCode || role === UserRole.Teacher)) setStep(5);
  };

  const finish = async () => {
    await onComplete({
      name,
      role: role || UserRole.Student,
      grade: role === UserRole.Student ? grade : undefined,
      classCode: role === UserRole.Student ? classCode : undefined,
      avatarSeed,
      xp: 0,
      streak: 0
    });
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-teal-400 to-teal-600 rounded-2xl shadow-lg mb-4 rotate-3">
            <Brain className="text-white" size={32} />
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">BrainBridge</h1>
          <p className="text-slate-500 font-medium mt-2">Your AI-powered learning adventure begins!</p>
        </div>

        <div className="bg-white rounded-[32px] shadow-xl border border-slate-200 p-8 relative overflow-hidden">
          {/* Progress Bar */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-100">
            <motion.div 
              className="h-full bg-teal-500"
              initial={{ width: '0%' }}
              animate={{ width: `${(step / 5) * 100}%` }}
            />
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-6"
              >
                <div className="text-center">
                  <h2 className="text-2xl font-black text-slate-800">Who are you?</h2>
                  <p className="text-slate-500 text-sm">Choose your role to get started</p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <button
                    onClick={() => setRole(UserRole.Student)}
                    className={`p-6 rounded-2xl border-2 transition-all text-left flex items-center space-x-4 ${
                      role === UserRole.Student 
                        ? 'border-teal-500 bg-teal-50 ring-4 ring-teal-500/10' 
                        : 'border-slate-100 hover:border-teal-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${role === UserRole.Student ? 'bg-teal-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      <GraduationCap size={24} />
                    </div>
                    <div>
                      <h3 className="font-black text-slate-800">I'm a Student</h3>
                      <p className="text-xs text-slate-500">I want to learn and complete missions!</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setRole(UserRole.Teacher)}
                    className={`p-6 rounded-2xl border-2 transition-all text-left flex items-center space-x-4 ${
                      role === UserRole.Teacher 
                        ? 'border-indigo-500 bg-indigo-50 ring-4 ring-indigo-500/10' 
                        : 'border-slate-100 hover:border-indigo-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${role === UserRole.Teacher ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      <School size={24} />
                    </div>
                    <div>
                      <h3 className="font-black text-slate-800">I'm a Teacher</h3>
                      <p className="text-xs text-slate-500">I want to manage my class and missions.</p>
                    </div>
                  </button>
                </div>

                <button
                  disabled={!role}
                  onClick={handleNext}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors"
                >
                  <span>Continue</span>
                  <ArrowRight size={20} />
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-6"
              >
                <button onClick={() => setStep(1)} className="text-slate-400 hover:text-slate-600 flex items-center space-x-1 text-sm font-bold">
                  <ChevronLeft size={16} />
                  <span>Back</span>
                </button>

                <div className="text-center">
                  <h2 className="text-2xl font-black text-slate-800">What's your name?</h2>
                  <p className="text-slate-500 text-sm">How should we call you in BrainBridge?</p>
                </div>

                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none font-bold text-slate-800 transition-all"
                    autoFocus
                  />
                </div>

                <button
                  disabled={!name}
                  onClick={handleNext}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors"
                >
                  <span>{role === UserRole.Teacher ? 'Complete Setup' : 'Continue'}</span>
                  <ArrowRight size={20} />
                </button>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-6"
              >
                <button onClick={() => setStep(2)} className="text-slate-400 hover:text-slate-600 flex items-center space-x-1 text-sm font-bold">
                  <ChevronLeft size={16} />
                  <span>Back</span>
                </button>

                <div className="text-center">
                  <h2 className="text-2xl font-black text-slate-800">Choose your grade</h2>
                  <p className="text-slate-500 text-sm">We'll tailor the missions for you!</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {GRADES.map((g) => (
                    <button
                      key={g}
                      onClick={() => setGrade(g)}
                      className={`py-3 px-4 rounded-xl border-2 font-bold transition-all ${
                        grade === g 
                          ? 'border-teal-500 bg-teal-50 text-teal-700' 
                          : 'border-slate-100 text-slate-600 hover:border-slate-200'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>

                <button
                  disabled={!grade}
                  onClick={handleNext}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors"
                >
                  <span>Continue</span>
                  <ArrowRight size={20} />
                </button>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-6"
              >
                <button onClick={() => setStep(3)} className="text-slate-400 hover:text-slate-600 flex items-center space-x-1 text-sm font-bold">
                  <ChevronLeft size={16} />
                  <span>Back</span>
                </button>

                <div className="text-center">
                  <h2 className="text-2xl font-black text-slate-800">Class Code</h2>
                  <p className="text-slate-500 text-sm">Enter the code from your teacher (optional)</p>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={classCode}
                    onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                    placeholder="E.g. ABC-123"
                    className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none font-black text-center text-2xl tracking-widest text-slate-800 transition-all"
                  />
                </div>

                <button
                  onClick={handleNext}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black flex items-center justify-center space-x-2 hover:bg-slate-800 transition-colors"
                >
                  <span>{classCode ? 'Join Class' : 'Skip for now'}</span>
                  <ArrowRight size={20} />
                </button>
              </motion.div>
            )}

            {step === 5 && (
              <motion.div
                key="step5"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-6"
              >
                <div className="text-center">
                  <h2 className="text-2xl font-black text-slate-800">Pick your Hero!</h2>
                  <p className="text-slate-500 text-sm">This will be your avatar in BrainBridge</p>
                </div>

                <div className="flex flex-col items-center">
                  <div className="w-32 h-32 rounded-3xl bg-teal-100 border-4 border-white shadow-xl overflow-hidden mb-6">
                    <img 
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`} 
                      alt="Avatar Preview" 
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="grid grid-cols-5 gap-2 w-full">
                    {AVATAR_SEEDS.map((seed) => (
                      <button
                        key={seed}
                        onClick={() => setAvatarSeed(seed)}
                        className={`w-full aspect-square rounded-xl border-2 overflow-hidden transition-all ${
                          avatarSeed === seed ? 'border-teal-500 ring-2 ring-teal-500/20' : 'border-slate-100'
                        }`}
                      >
                        <img 
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`} 
                          alt={seed} 
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={finish}
                  className="w-full py-4 bg-teal-600 text-white rounded-2xl font-black flex items-center justify-center space-x-2 hover:bg-teal-700 transition-colors shadow-lg shadow-teal-600/20"
                >
                  <Sparkles size={20} />
                  <span>Start Adventure!</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-8 flex flex-col items-center space-y-4">
          <div className="flex items-center justify-center space-x-2 text-slate-400">
            <CheckCircle2 size={16} />
            <span className="text-xs font-bold uppercase tracking-widest">Safe & Secure for Kids</span>
          </div>
          
          <button 
            onClick={async () => {
              await onComplete({
                name: 'Test Teacher',
                role: UserRole.Teacher,
                avatarSeed: 'Scholar',
                xp: 0,
                streak: 0
              });
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-rose-500/10 text-rose-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all border border-rose-500/20"
          >
            <TestTube size={12} />
            <span>Bypass to Teacher Portal (Testing)</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
