
import React, { useState, useRef } from 'react';
import { 
  Calculator, Atom, Beaker, Dna, Languages, BookOpen, 
  Sparkles, Loader2, RefreshCw, Camera, X, FileText, ShieldCheck, AlertTriangle, Globe, ArrowUpRight, Link as LinkIcon
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { puterSolve } from '../services/puterCore';

interface SolveResult {
  text: string;
  links: { title: string; url: string }[];
}

const HomeworkView: React.FC = () => {
  const isAr = document.documentElement.lang === 'ar';
  const [subject, setSubject] = useState('math');
  const [questionText, setQuestionText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [result, setResult] = useState<SolveResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<'idle' | 'ocr' | 'thinking' | 'solving'>('idle');
  const [responseLang, setResponseLang] = useState<'ar' | 'en'>('ar');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const subjects = isAr ? [
    { id: 'math', label: 'رياضيات', icon: Calculator },
    { id: 'physics', label: 'فيزياء', icon: Atom },
    { id: 'chemistry', label: 'كيمياء', icon: Beaker },
    { id: 'science', label: 'علوم', icon: Dna },
    { id: 'arabic', label: 'لغة عربية', icon: Languages },
    { id: 'english', label: 'لغة إنجليزية', icon: BookOpen },
  ] : [
    { id: 'math', label: 'Math', icon: Calculator },
    { id: 'physics', label: 'Physics', icon: Atom },
    { id: 'chemistry', label: 'Chemistry', icon: Beaker },
    { id: 'science', label: 'Science', icon: Dna },
    { id: 'arabic', label: 'Arabic', icon: Languages },
    { id: 'english', label: 'English', icon: BookOpen },
  ];

  const handleSolve = async () => {
    if (!selectedImage && !questionText.trim()) return;
    setLoading(true);
    setResult(null);
    setError(null);
    setPhase('ocr');
    
    try {
      const res = await puterSolve(
        questionText, 
        subject, 
        selectedImage || undefined,
        (p: 'idle' | 'ocr' | 'thinking' | 'solving') => setPhase(p),
        responseLang
      );
      
      if (res && res.text) {
        setResult(res as SolveResult);
      } else {
        throw new Error("Empty response");
      }
    } catch (e: any) {
      console.error("Solve Error:", e);
      setError(isAr ? "عذراً، فشل المحرك في معالجة طلبك أو استخراج النص." : "The engine failed to process your request or extract text.");
    } finally {
      setLoading(false);
      setPhase('idle');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { 
        setError(isAr ? "حجم الصورة كبير جداً، يرجى اختيار صورة أصغر." : "Image size too large, please select a smaller one.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setSelectedImage(reader.result as string);
      reader.onerror = () => setError(isAr ? "خطأ في قراءة الملف." : "Error reading file.");
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 space-y-12 animate-in fade-in duration-700">
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-8xl font-black text-white tracking-tighter uppercase leading-none">
          {isAr ? 'مساعد الواجبات' : 'Homework AI.'}
        </h1>
        <p className="text-indigo-500 text-[10px] md:text-xs font-black uppercase tracking-[0.4em]">
          {isAr ? 'استخراج النصوص من الصور وحل المسائل عبر النظام الذكي المتطور' : 'EXTRACT TEXT & SOLVE PROBLEMS VIA SMART AI CORE'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-[#111827]/40 border border-white/5 p-8 rounded-[2.5rem] space-y-6 backdrop-blur-xl">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">{isAr ? 'لغة الرد المطلوبة' : 'RESPONSE LANGUAGE'}</h3>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setResponseLang('ar')}
                className={`py-4 rounded-2xl border transition-all font-black text-[10px] uppercase ${responseLang === 'ar' ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg' : 'bg-black/40 border-white/5 text-slate-500 hover:text-white'}`}
              >
                العربية
              </button>
              <button 
                onClick={() => setResponseLang('en')}
                className={`py-4 rounded-2xl border transition-all font-black text-[10px] uppercase ${responseLang === 'en' ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg' : 'bg-black/40 border-white/5 text-slate-500 hover:text-white'}`}
              >
                English
              </button>
            </div>
          </div>

          <div className="bg-[#111827]/40 border border-white/5 p-8 rounded-[2.5rem] space-y-6 backdrop-blur-xl">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">{isAr ? 'اختر المادة' : 'SELECT SUBJECT'}</h3>
            <div className="grid grid-cols-2 gap-3">
              {subjects.map((s) => (
                <button key={s.id} onClick={() => setSubject(s.id)} className={`flex flex-col items-center gap-3 p-5 rounded-2xl border transition-all ${subject === s.id ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg' : 'bg-black/40 border-white/5 text-slate-500 hover:border-white/10'}`}>
                  <s.icon className="w-5 h-5" />
                  <span className="text-[10px] font-black uppercase tracking-tighter">{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-[#111827]/40 border border-white/5 p-8 rounded-[2.5rem] space-y-6 backdrop-blur-xl">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">{isAr ? 'المرفقات الصورية' : 'IMAGE ATTACHMENTS'}</h3>
            {selectedImage ? (
              <div className="relative group">
                <img src={selectedImage} className="w-full h-auto rounded-2xl border-2 border-indigo-500 shadow-xl" alt="Homework" />
                <button onClick={() => setSelectedImage(null)} className="absolute -top-3 -right-3 bg-red-500 text-white p-2 rounded-full shadow-lg hover:scale-110 transition-transform">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button onClick={() => fileInputRef.current?.click()} className="w-full py-10 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center gap-4 hover:bg-white/5 transition-all group drop-zone-active">
                <Camera className="w-8 h-8 text-slate-600 group-hover:text-indigo-400 icon-bob" />
                <span className="text-[10px] font-black text-slate-500 uppercase">{isAr ? 'ارفع صورة السؤال (OCR)' : 'UPLOAD QUESTION (OCR)'}</span>
              </button>
            )}
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
          </div>
        </div>

        <div className="lg:col-span-8 space-y-8">
          {error && (
            <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-4 text-red-500 animate-in slide-in-from-top-2">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <p className="text-sm font-bold uppercase tracking-widest">{error}</p>
            </div>
          )}

          {!result ? (
            <div className="bg-[#111827]/60 border border-white/10 rounded-[3rem] p-8 md:p-12 shadow-2xl relative min-h-[500px] flex flex-col gap-8 backdrop-blur-2xl">
              <div className="space-y-4">
                <h3 className={`text-xl font-black text-white uppercase flex items-center gap-3 ${isAr ? 'flex-row-reverse' : ''}`}>
                   <FileText className="w-6 h-6 text-indigo-400" />
                   {isAr ? 'وصف أو كتابة السؤال' : 'DESCRIBE OR TYPE PROBLEM'}
                </h3>
                <textarea
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder={isAr ? "اكتب تفاصيل إضافية لمساعدة الذكاء الاصطناعي في الحل..." : "Add more details to help the AI solve..."}
                  className={`w-full bg-black/40 border border-white/10 rounded-[2rem] p-8 text-xl text-white placeholder:text-slate-800 min-h-[250px] resize-none focus:outline-none focus:border-indigo-500 transition-all ${isAr ? 'text-right font-arabic' : 'text-left'}`}
                  dir={isAr ? 'rtl' : 'ltr'}
                />
              </div>

              {loading && (
                <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl rounded-[3rem] flex flex-col items-center justify-center z-30 gap-8 animate-in fade-in">
                   <div className="relative">
                      <div className="w-24 h-24 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full neon-spin"></div>
                      <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full"></div>
                   </div>
                   <div className="text-center space-y-2">
                     <p className="text-indigo-400 font-black uppercase tracking-[0.4em] text-xs">
                       {phase === 'ocr' ? (isAr ? 'جاري استخراج النص من الصورة...' : 'EXTRACTING TEXT FROM IMAGE') : 
                        phase === 'thinking' ? (isAr ? 'جاري تحليل المسألة منطقياً...' : 'ANALYZING MATH LOGIC') : 
                        (isAr ? 'جاري صياغة الحل النهائي...' : 'GENERATING FINAL SOLUTION')}
                     </p>
                     <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">{isAr ? 'عبر النظام الذكي المتطور' : 'POWERED BY SMART AI CORE'}</p>
                   </div>
                </div>
              )}
              
              <button 
                onClick={handleSolve} 
                disabled={loading || (!selectedImage && !questionText.trim())} 
                className="btn-glow w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-20 text-white font-black py-8 rounded-[2rem] flex flex-col items-center justify-center gap-4 transition-all shadow-2xl active:scale-95 group shimmer-sweep"
              >
                <Sparkles className="w-8 h-8 group-hover:rotate-12 transition-transform" />
                <span className="text-2xl uppercase tracking-tighter">{isAr ? 'بدء التحليل والحل' : 'START ANALYSIS & SOLVE'}</span>
              </button>
            </div>
          ) : (
            <div className="animate-in slide-in-from-bottom-8 duration-700 space-y-8">
              <div className="step-reveal bg-[#111827]/60 border border-white/10 rounded-[3rem] p-10 md:p-14 shadow-2xl relative overflow-hidden backdrop-blur-2xl">
                <div className="flex items-center justify-between border-b border-white/5 pb-8 mb-10">
                  <div className={`flex items-center gap-4 ${isAr ? 'flex-row-reverse' : ''}`}>
                    <div className="p-3 bg-indigo-600/20 rounded-2xl">
                      <Sparkles className="w-6 h-6 text-indigo-400" />
                    </div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter">{isAr ? 'الشرح التعليمي المفصل' : 'EDUCATIONAL BREAKDOWN'}</h2>
                  </div>
                  <button onClick={() => {setResult(null); setError(null);}} className="text-slate-500 hover:text-white bg-white/5 px-6 py-3 rounded-2xl border border-white/5 transition-all active:scale-95 text-xs font-bold uppercase tracking-widest">
                     {isAr ? 'مسألة جديدة' : 'NEW PROBLEM'}
                  </button>
                </div>

                <div 
                  className={`text-slate-100 text-xl md:text-2xl leading-[1.8] prose prose-invert max-w-none prose-strong:text-indigo-400 prose-headings:text-white ${responseLang === 'ar' ? 'text-right font-arabic' : 'text-left'}`} 
                  dir={responseLang === 'ar' ? 'rtl' : 'ltr'}
                >
                  <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                    {result.text}
                  </ReactMarkdown>
                </div>

                <div className="mt-12 p-8 bg-indigo-600/5 border border-indigo-500/10 rounded-[2rem] flex items-center justify-center gap-4 opacity-70">
                   <ShieldCheck className="w-6 h-6 text-indigo-400" />
                   <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">{isAr ? 'تم التحقق من الدقة المنطقية عبر النظام' : 'LOGIC VERIFIED BY INTERNAL CORE'}</span>
                </div>
              </div>

              {result.links && result.links.length > 0 && (
                <div className="bg-[#111827]/40 border border-white/5 rounded-[2.5rem] p-8 space-y-6 backdrop-blur-xl step-reveal delay-300">
                  <div className={`flex items-center gap-3 text-indigo-500/60 ${isAr ? 'flex-row-reverse text-right' : ''}`}>
                    <LinkIcon className="w-5 h-5" />
                    <h3 className="text-xs font-black uppercase tracking-widest">{isAr ? 'مصادر ومراجع إضافية' : 'REFERENCE SOURCES'}</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {result.links.map((link, i) => (
                      <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="p-5 bg-black/40 border border-white/5 rounded-2xl hover:bg-indigo-600/10 transition-all group flex items-center justify-between gap-4">
                         <h4 className={`text-white font-bold text-xs truncate group-hover:text-indigo-400 ${isAr ? 'text-right' : 'text-left'} flex-1`}>{link.title}</h4>
                         <ArrowUpRight className="w-4 h-4 text-slate-700 group-hover:text-indigo-400" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomeworkView;
