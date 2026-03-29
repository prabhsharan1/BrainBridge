
import React, { useState, useRef } from 'react';
import { Upload, FileText, Sparkles, CheckCircle2, AlertTriangle, X, Loader2, Languages } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { extractCurriculum } from '../services/geminiService';
import { ExtractedCurriculum, Language } from '../types';

interface CurriculumUploadProps {
  onClose: () => void;
  language: Language;
}

const CurriculumUpload: React.FC<CurriculumUploadProps> = ({ onClose, language }) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ExtractedCurriculum | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
      setResult(null);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!preview) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const base64Data = preview.split(',')[1];
      const mimeType = file?.type || 'image/jpeg';
      const extracted = await extractCurriculum(base64Data, mimeType, language);
      setResult(extracted);
    } catch (err: any) {
      setError(err.message || 'Failed to extract curriculum. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-500 flex items-center justify-center text-white shadow-lg shadow-teal-500/20">
              <FileText size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900">Curriculum Extraction Engine</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">AI-Powered Mission Builder</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {!result ? (
            <div className="grid md:grid-cols-2 gap-8 h-full">
              {/* Upload Area */}
              <div className="flex flex-col space-y-6">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex-1 min-h-[300px] border-4 border-dashed rounded-[2rem] flex flex-col items-center justify-center p-8 transition-all cursor-pointer ${
                    preview ? 'border-teal-500 bg-teal-50/30' : 'border-slate-100 hover:border-teal-200 hover:bg-slate-50'
                  }`}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept="image/*,application/pdf" 
                    className="hidden" 
                  />
                  
                  {preview ? (
                    <div className="relative w-full h-full">
                      <img src={preview} alt="Preview" className="w-full h-full object-contain rounded-xl" />
                      <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                        <p className="text-white font-black text-sm">Change Image</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="w-20 h-20 rounded-3xl bg-slate-50 flex items-center justify-center text-slate-300 mb-6">
                        <Upload size={40} />
                      </div>
                      <p className="text-lg font-black text-slate-800 mb-2 text-center">Upload Worksheet</p>
                      <p className="text-sm font-medium text-slate-400 text-center">Drop an image or PDF of your teaching materials here</p>
                    </>
                  )}
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleUpload}
                  disabled={!preview || isLoading}
                  className={`w-full py-4 rounded-2xl font-black text-lg flex items-center justify-center space-x-3 transition-all ${
                    !preview || isLoading 
                      ? 'bg-slate-100 text-slate-300 cursor-not-allowed' 
                      : 'bg-slate-900 text-white hover:bg-teal-600 shadow-xl shadow-slate-200'
                  }`}
                >
                  {isLoading ? (
                    <><Loader2 size={24} className="animate-spin" /><span>Extracting...</span></>
                  ) : (
                    <><Sparkles size={24} /><span>Analyze Document</span></>
                  )}
                </motion.button>

                {error && (
                  <div className="p-4 bg-rose-50 border-2 border-rose-100 rounded-2xl text-rose-600 text-sm font-bold flex items-center">
                    <AlertTriangle size={18} className="mr-3 flex-shrink-0" />
                    {error}
                  </div>
                )}
              </div>

              {/* Instructions Panel */}
              <div className="bg-slate-50 rounded-[2rem] p-8">
                <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6">How it works</h4>
                <div className="space-y-6">
                  <InstructionStep 
                    number="01" 
                    title="Upload Material" 
                    desc="Upload a photo of a textbook page, worksheet, or handwritten notes." 
                  />
                  <InstructionStep 
                    number="02" 
                    title="AI Analysis" 
                    desc="Our engine extracts core concepts and simplifies complex teacher instructions." 
                  />
                  <InstructionStep 
                    number="03" 
                    title="Bilingual Bridge" 
                    desc="Key vocabulary is automatically translated into the student's home language." 
                  />
                  <InstructionStep 
                    number="04" 
                    title="Mission Ready" 
                    desc="The extracted data is formatted into a new Learning Mission for your students." 
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between">
                <div>
                   <span className="px-4 py-1.5 bg-teal-100 text-teal-700 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 inline-block">
                     {result.subject_area}
                   </span>
                   <h2 className="text-3xl font-black text-slate-900 tracking-tight">{result.mission_title}</h2>
                </div>
                <div className="text-right">
                   <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Confidence Score</div>
                   <div className={`text-2xl font-black ${result.confidence_score > 80 ? 'text-emerald-500' : 'text-amber-500'}`}>
                     {result.confidence_score}%
                   </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Vocabulary */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center">
                    <Languages size={14} className="mr-2" /> Extracted Vocabulary
                  </h4>
                  <div className="space-y-3">
                    {result.extracted_vocabulary.map((vocab, i) => (
                      <div key={i} className="p-4 bg-white border-2 border-slate-100 rounded-2xl hover:border-teal-100 transition-colors">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-black text-slate-800">{vocab.english_word}</span>
                          <span className="text-xs font-black text-teal-600">{vocab.native_translation}</span>
                        </div>
                        <p className="text-xs font-medium text-slate-500 leading-relaxed">{vocab.simple_definition}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Decoded Instructions */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center">
                    <CheckCircle2 size={14} className="mr-2" /> Decoded Instructions
                  </h4>
                  <div className="space-y-3">
                    {result.decoded_instructions.map((step, i) => (
                      <div key={i} className="flex items-start space-x-4 p-4 bg-slate-50 rounded-2xl border-2 border-transparent">
                        <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center text-xs font-black flex-shrink-0">
                          {i + 1}
                        </div>
                        <p className="text-sm font-bold text-slate-700 leading-relaxed mt-1">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-slate-100 flex justify-end space-x-4">
                <button 
                  onClick={() => setResult(null)}
                  className="px-6 py-3 bg-white border-2 border-slate-100 rounded-2xl text-sm font-black text-slate-500 hover:bg-slate-50 transition-all"
                >
                  Try Another
                </button>
                <button 
                  onClick={onClose}
                  className="px-8 py-3 bg-slate-900 text-white rounded-2xl text-sm font-black shadow-xl shadow-slate-200 hover:bg-teal-600 transition-all"
                >
                  Create Mission
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

const InstructionStep = ({ number, title, desc }: { number: string, title: string, desc: string }) => (
  <div className="flex space-x-4">
    <div className="text-2xl font-black text-teal-200 leading-none">{number}</div>
    <div>
      <h5 className="font-black text-slate-800 text-sm mb-1">{title}</h5>
      <p className="text-xs font-medium text-slate-500 leading-relaxed">{desc}</p>
    </div>
  </div>
);

export default CurriculumUpload;
