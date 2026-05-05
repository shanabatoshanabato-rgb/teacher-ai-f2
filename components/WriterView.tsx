
import React, { useState } from 'react';
import { 
  Check, FileText, Languages, Sparkles, Copy, Trash2, Loader2, PenTool, ChevronRight, BookOpen, AlignLeft, Quote
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { puterTextLogic } from '../services/puterCore';

type WriterMode = 'grammar' | 'rewrite' | 'essay' | 'arabic';

const WriterView: React.FC = () => {
  const isAr = document.documentElement.lang === 'ar';
  const [responseLang, setResponseLang] = useState<'ar' | 'en'>('ar');
  const [inputs, setInputs] = useState<Record<WriterMode, string>>({ grammar: '', rewrite: '', essay: '', arabic: '' });
  const [results, setResults] = useState<Record<WriterMode, string | null>>({ grammar: null, rewrite: null, essay: null, arabic: null });
  const [loading, setLoading] = useState<Record<WriterMode, boolean>>({ grammar: false, rewrite: false, essay: false, arabic: false });
  const [mode, setMode] = useState<WriterMode>('grammar');

  const modes = [
    { id: 'grammar', label: isAr ? 'مصحح القواعد (EN Only)' : 'Grammar Fixer (EN Only)', icon: Check, desc: 'Locked to English' },
    { id: 'rewrite', label: isAr ? 'إعادة صياغة' : 'Rewrite', icon: Sparkles, desc: 'Improve flow' },
    { id: 'essay', label: isAr ? 'كتابة مقال' : 'Essay Generator', icon: FileText, desc: 'Generate texts' },
    { id: 'arabic', label: isAr ? 'إعراب لغوي' : 'Arabic Parsing', icon: Languages, desc: 'Arabic only' },
  ];

  const handleAction = async () => {
    const currentInput = inputs[mode];
    if (!currentInput.trim()) return;

    setLoading(prev => ({ ...prev, [mode]: true }));
    setResults(prev => ({ ...prev, [mode]: null }));

    try {
      const lang = mode === 'arabic' ? 'ar' : responseLang;
      const res = await puterTextLogic(mode, currentInput, lang);
      setResults(prev => ({ ...prev, [mode]: res }));
    } catch (e) {
      setResults(prev => ({ ...prev, [mode]: isAr ? "خطأ في المعالجة الذكية." : "Error in smart processing." }));
    } finally {
      setLoading(prev => ({ ...prev, [mode]: false }));
    }
  };

  const clearCurrent = () => {
    setInputs(prev => ({ ...prev, [mode]: '' }));
    setResults(prev => ({ ...prev, [mode]: null }));
  };

  const isCurrentArabic = mode === 'arabic' || (results[mode] && /[\u0600-\u06FF]/.test(results[mode]!));

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 space-y-12 animate-in fade-in duration-700">
      <div className="text-center space-y-6">
        <h1 className="text-4xl md:text-8xl font-black text-white tracking-tighter uppercase leading-none">
          {isAr ? 'استوديو الكتابة' : 'Writer Studio.'}
        </h1>
        <p className="text-indigo-500 font-bold uppercase tracking-[0.4em] text-[10px]">
          {isAr ? 'مركز معالجة النصوص الذكي المتطور' : 'ADVANCED SMART TEXT PROCESSING'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#111827]/40 border border-white/5 p-8 rounded-[2.5rem] space-y-4 shadow-xl backdrop-blur-md">
             <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">{isAr ? 'لغة الرد المطلوبة' : 'RESPONSE LANGUAGE'}</h3>
             <div className="grid grid-cols-2 gap-3">
                <button 
                  disabled={mode === 'grammar' || mode === 'arabic'}
                  onClick={() => setResponseLang('ar')}
                  className={`py-3 rounded-xl border transition-all text-[10px] font-bold uppercase disabled:opacity-20 ${responseLang === 'ar' || mode === 'arabic' ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-black/40 border-white/5 text-slate-500'}`}
                >
                  العربية
                </button>
                <button 
                  disabled={mode === 'arabic'}
                  onClick={() => setResponseLang('en')}
                  className={`py-3 rounded-xl border transition-all text-[10px] font-bold uppercase disabled:opacity-20 ${(responseLang === 'en' || mode === 'grammar') && mode !== 'arabic' ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-black/40 border-white/5 text-slate-500'}`}
                >
                  English
                </button>
             </div>
             {mode === 'grammar' && <p className="text-[8px] text-amber-500 font-bold uppercase tracking-widest">{isAr ? 'المصحح يعمل بالإنجليزية فقط لضمان الدقة' : 'Grammar checker locks to English'}</p>}
             {mode === 'arabic' && <p className="text-[8px] text-emerald-500 font-bold uppercase tracking-widest">{isAr ? 'الإعراب يعمل بالعربية الفصحى حصراً' : 'Parsing locks to pure Arabic'}</p>}
          </div>

          <div className="bg-[#111827]/40 border border-white/5 p-8 rounded-[2.5rem] shadow-2xl backdrop-blur-xl">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-6">{isAr ? 'اختر أداة الكتابة' : 'SELECT WRITING TOOL'}</h3>
            <div className="space-y-3">
              {modes.map((m) => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    onClick={() => {
                      setMode(m.id as WriterMode);
                      if (m.id === 'grammar') setResponseLang('en');
                      if (m.id === 'arabic') setResponseLang('ar');
                    }}
                    className={`w-full p-4 rounded-2xl border transition-all flex items-center gap-4 ${mode === m.id ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg' : 'bg-black/40 border-white/5 text-slate-500 hover:border-white/10 hover:bg-white/5'}`}
                  >
                    <Icon className="w-5 h-5" />
                    <div className={`flex-1 ${isAr ? 'text-right' : 'text-left'}`}>
                      <p className="text-[11px] font-black uppercase tracking-tight">{m.label}</p>
                    </div>
                    <ChevronRight className={`w-4 h-4 transition-transform ${isAr ? 'rotate-180' : ''} ${mode === m.id ? 'opacity-100' : 'opacity-0'}`} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-8">
          <div className="bg-[#111827]/60 border border-white/10 rounded-[3rem] p-8 md:p-12 shadow-2xl backdrop-blur-2xl">
            {!results[mode] ? (
              <div className="space-y-8">
                <textarea
                  value={inputs[mode]}
                  onChange={(e) => setInputs(prev => ({ ...prev, [mode]: e.target.value }))}
                  placeholder={mode === 'arabic' ? (isAr ? "أدخل الجملة المراد إعرابها بدقة..." : "Enter sentence for Arabic parsing...") : (isAr ? "أدخل النص هنا للمعالجة..." : "Enter text here...")}
                  className={`input-glow w-full bg-black/40 border border-white/10 rounded-[2rem] p-8 text-xl text-white min-h-[400px] resize-none focus:outline-none focus:border-indigo-500 transition-all ${isAr || mode === 'arabic' ? 'text-right font-arabic' : 'text-left'}`}
                  dir={isAr || mode === 'arabic' ? 'rtl' : 'ltr'}
                />
                <button 
                  onClick={handleAction} 
                  disabled={loading[mode] || !inputs[mode].trim()} 
                  className="btn-glow shimmer-sweep w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-20 text-white font-black py-8 rounded-[2rem] flex flex-col items-center justify-center transition-all shadow-2xl active:scale-95 group"
                >
                  {loading[mode] ? (
                    <Loader2 className="w-8 h-8 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-8 h-8 group-hover:rotate-12 transition-transform" />
                      <span className="text-2xl mt-2 uppercase tracking-tighter">
                        {mode === 'arabic' ? (isAr ? 'بدء الإعراب التعليمي' : 'START PARSING') : (isAr ? 'بدء المعالجة الذكية' : 'START SMART PROCESS')}
                      </span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-10 pop-in">
                <div className={`flex items-center justify-between border-b border-white/5 pb-8 ${isAr ? 'flex-row-reverse' : ''}`}>
                   <div className={`flex items-center gap-4 ${isAr ? 'flex-row-reverse' : ''}`}>
                      <div className="p-3 bg-indigo-600/20 rounded-2xl">
                        <PenTool className="w-6 h-6 text-indigo-400" />
                      </div>
                      <h2 className="text-3xl font-black text-white uppercase tracking-tighter">{isAr ? 'نتائج التحليل' : 'RESULT ANALYSIS'}</h2>
                   </div>
                   <div className="flex gap-3">
                      <button onClick={() => { navigator.clipboard.writeText(results[mode]!); }} className="p-4 bg-white/5 rounded-2xl border border-white/5 text-slate-400 hover:text-white transition-all shadow-md active:scale-90">
                        <Copy className="w-5 h-5" />
                      </button>
                      <button onClick={clearCurrent} className="p-4 bg-red-500/10 rounded-2xl border border-red-500/20 text-red-500 hover:bg-red-500/20 transition-all shadow-md active:scale-90">
                        <Trash2 className="w-5 h-5" />
                      </button>
                   </div>
                </div>
                <div 
                  className={`writer-output text-slate-100 text-xl md:text-3xl leading-[1.8] prose prose-invert max-w-none prose-strong:text-indigo-400 ${isCurrentArabic ? 'text-right font-arabic' : 'text-left'}`}
                  dir={isCurrentArabic ? 'rtl' : 'ltr'}
                >
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{results[mode] || ''}</ReactMarkdown>
                </div>
                <div className="pt-8 border-t border-white/5">
                   <button onClick={() => setResults(prev => ({ ...prev, [mode]: null }))} className="text-indigo-400 font-black uppercase text-xs tracking-[0.3em] flex items-center gap-2 hover:text-indigo-300 transition-colors">
                      <ChevronRight className={`w-4 h-4 ${isAr ? 'rotate-180' : ''}`} />
                      {isAr ? 'العودة للمدخلات' : 'BACK TO INPUT'}
                   </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WriterView;
