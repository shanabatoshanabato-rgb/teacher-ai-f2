
import React, { useState } from 'react';
import { 
  FileText, Presentation, Download, Loader2, Sparkles, FileBox, Globe, Settings2, Cpu
} from 'lucide-react';
import { generatePPT, generateDOC } from '../services/fileService';

const FilesView: React.FC = () => {
  const isAr = document.documentElement.lang === 'ar';
  const [topic, setTopic] = useState('');
  const [fileType, setFileType] = useState<'ppt' | 'doc'>('ppt');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [numSlides, setNumSlides] = useState(10);
  const [wordCount, setWordCount] = useState(1500);
  const [includeWebData, setIncludeWebData] = useState(false);
  const [contentLang, setContentLang] = useState<'ar' | 'en'>('ar');

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setIsGenerating(true);
    setError('');
    
    try {
      // تمرير اللغة المحددة لبرومبت التوليد
      const langSuffix = contentLang === 'ar' ? " (أجب باللغة العربية الفصحى)" : " (Answer in English)";
      const finalTopic = topic + langSuffix;

      if (fileType === 'ppt') {
        await generatePPT(finalTopic, numSlides, includeWebData);
      } else {
        await generateDOC(finalTopic, wordCount, includeWebData);
      }
    } catch (e: any) {
      setError(e.message || (isAr ? 'خطأ أثناء إنشاء الملف.' : 'Error generating file.'));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 py-6 md:py-12 px-4 animate-in fade-in duration-700">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-4">
          <FileBox className="text-indigo-400 w-10 h-10" />
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter">
            {isAr ? 'مصنع الملفات الذكي' : 'Smart Doc Factory'}
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#111827]/40 border border-white/5 p-8 rounded-[2.5rem] backdrop-blur-xl shadow-2xl space-y-8">
            {/* Content Language Choice */}
            <div className="space-y-4">
              <label className={`text-[10px] font-black uppercase tracking-widest text-slate-500 block ${isAr ? 'text-right' : ''}`}>{isAr ? 'لغة محتوى الملف' : 'CONTENT LANGUAGE'}</label>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setContentLang('ar')}
                  className={`py-3 rounded-xl border transition-all text-[10px] font-bold uppercase ${contentLang === 'ar' ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-black/40 border-white/5 text-slate-500'}`}
                >
                  العربية
                </button>
                <button 
                  onClick={() => setContentLang('en')}
                  className={`py-3 rounded-xl border transition-all text-[10px] font-bold uppercase ${contentLang === 'en' ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-black/40 border-white/5 text-slate-500'}`}
                >
                  English
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <label className={`text-[10px] font-black uppercase tracking-widest text-slate-500 block ${isAr ? 'text-right' : ''}`}>{isAr ? 'نوع الملف' : 'FILE TYPE'}</label>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setFileType('ppt')} className={`flex flex-col items-center gap-3 py-6 rounded-2xl border transition-all ${fileType === 'ppt' ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-black/40 border-white/5 text-slate-500'}`}>
                  <Presentation className="w-6 h-6" />
                  <span className="text-[10px] font-black uppercase tracking-widest">PPTX</span>
                </button>
                <button onClick={() => setFileType('doc')} className={`flex flex-col items-center gap-3 py-6 rounded-2xl border transition-all ${fileType === 'doc' ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-black/40 border-white/5 text-slate-500'}`}>
                  <FileText className="w-6 h-6" />
                  <span className="text-[10px] font-black uppercase tracking-widest">DOCX</span>
                </button>
              </div>
            </div>

            <button onClick={() => setIncludeWebData(!includeWebData)} className={`w-full p-5 rounded-2xl border transition-all flex items-center justify-between group ${includeWebData ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400' : 'bg-black/40 border-white/5 text-slate-600'}`}>
              <div className={`flex items-center gap-3 ${isAr ? 'flex-row-reverse' : ''}`}>
                <Globe className={`w-5 h-5 ${includeWebData ? 'loop-pulse icon-bob' : ''}`} />
                <span className="text-[10px] font-black uppercase tracking-widest">{isAr ? 'تضمين بيانات الويب' : 'Aux Web Data'}</span>
              </div>
            </button>

            {/* Slides / Words slider */}
            <div className="space-y-3">
              <label className={`text-[10px] font-black uppercase tracking-widest text-slate-500 block ${isAr ? 'text-right' : ''}`}>
                {fileType === 'ppt'
                  ? (isAr ? `عدد السلايدات: ${numSlides}` : `Slides: ${numSlides}`)
                  : (isAr ? `عدد الكلمات: ${wordCount}` : `Word Count: ${wordCount}`)}
              </label>
              {fileType === 'ppt' ? (
                <input
                  type="range" min={3} max={20} step={1}
                  value={numSlides}
                  onChange={(e) => setNumSlides(Number(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              ) : (
                <input
                  type="range" min={500} max={5000} step={250}
                  value={wordCount}
                  onChange={(e) => setWordCount(Number(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              )}
              <div className="flex justify-between text-[9px] text-slate-700 font-bold">
                <span>{fileType === 'ppt' ? '3' : '500'}</span>
                <span>{fileType === 'ppt' ? '20' : '5000'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <div className="bg-[#111827]/60 border border-white/10 rounded-[3rem] p-10 md:p-14 shadow-2xl relative overflow-hidden backdrop-blur-xl">
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={isAr ? "صف محتوى الملف هنا..." : "Describe file content here..."}
              className={`input-glow w-full bg-black/40 border border-white/10 rounded-[2rem] p-8 text-xl text-white placeholder:text-slate-800 min-h-[250px] resize-none focus:outline-none ${isAr ? 'text-right' : 'text-left'}`}
              dir={isAr ? 'rtl' : 'ltr'}
            />
            <button onClick={handleGenerate} disabled={isGenerating || !topic.trim()} className="btn-glow shimmer-sweep w-full mt-8 bg-indigo-600 hover:bg-indigo-500 text-white font-black py-8 rounded-[2rem] flex flex-col items-center justify-center transition-all shadow-2xl active:scale-[0.98]">
              {isGenerating ? <Loader2 className="w-10 h-10 cog-spin" /> : <Download className="w-8 h-8" />}
              <span className="text-2xl mt-2 uppercase tracking-tighter">{isAr ? 'بدء التوليد الذكي' : 'GENERATE FILE'}</span>
            </button>
          </div>
          {error && <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-[2rem] text-red-400 text-center font-bold">{error}</div>}
        </div>
      </div>
    </div>
  );
};

export default FilesView;
