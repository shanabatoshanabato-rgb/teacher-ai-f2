
import React, { useState } from 'react';
import { 
  Search, Library, Globe, Link as LinkIcon, Loader2, Sparkles, ShieldCheck, ArrowUpRight, History
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { puterIslamicBrain } from '../services/puterCore';

interface IslamicResult {
  text: string;
  links: { title: string; url: string; snippet?: string }[];
}

const IslamicHubView: React.FC = () => {
  const isAr = document.documentElement.lang === 'ar';
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<IslamicResult | null>(null);
  const [responseLang, setResponseLang] = useState<'ar' | 'en'>('ar');

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      // استدعاء الوظيفة التي تستخدم puter.ai.search إجبارياً
      const res = await puterIslamicBrain(query, responseLang);
      setResult(res as IslamicResult);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 py-10 px-4 animate-in fade-in duration-700">
      <div className="text-center space-y-6">
        <div className="relative inline-block">
          <div className="absolute inset-0 bg-emerald-500 blur-[80px] opacity-20"></div>
          <div className="relative p-6 bg-[#064e3b]/20 rounded-[2.5rem] border border-emerald-500/30 shadow-2xl">
            <Library className="w-16 h-16 text-emerald-400 icon-bob" />
          </div>
        </div>
        <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter uppercase">
          {isAr ? 'المكتبة الإسلامية' : 'Islamic Hub.'}
        </h1>
      </div>

      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex justify-center gap-4">
           <button 
             onClick={() => setResponseLang('ar')}
             className={`px-8 py-3 rounded-2xl border transition-all font-black text-xs uppercase ${responseLang === 'ar' ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg' : 'bg-black/40 border-white/5 text-slate-500 hover:text-white'}`}
           >
             العربية
           </button>
           <button 
             onClick={() => setResponseLang('en')}
             className={`px-8 py-3 rounded-2xl border transition-all font-black text-xs uppercase ${responseLang === 'en' ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg' : 'bg-black/40 border-white/5 text-slate-500 hover:text-white'}`}
           >
             English
           </button>
        </div>

        <div className={`relative flex items-center bg-[#111827]/80 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-3 shadow-2xl hover:border-emerald-500/40 transition-all ${isAr ? 'flex-row-reverse' : ''}`}>
          <div className={`${isAr ? 'pr-6' : 'pl-6'} text-emerald-500/40`}>
            <Search className="w-8 h-8" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder={isAr ? "اسأل عن أي موضوع إسلامي لفتح مراجع الويب..." : "Ask Islamic topics for web search..."}
            className={`flex-1 bg-transparent py-5 px-6 focus:outline-none text-xl md:text-2xl text-white placeholder:text-slate-800 ${isAr ? 'text-right font-arabic' : 'text-left'}`}
            dir={isAr ? 'rtl' : 'ltr'}
          />
          <button onClick={handleSearch} disabled={loading || !query.trim()} className="btn-emerald-glow bg-emerald-600 hover:bg-emerald-500 text-white p-5 rounded-[2rem] transition-all shadow-xl shadow-emerald-600/20 active:scale-95">
            {loading ? <Loader2 className="w-8 h-8 neon-spin" /> : <Sparkles className="w-8 h-8" />}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-8 animate-in fade-in">
          <div className="relative">
             <div className="w-24 h-24 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
             <Globe className="w-10 h-10 text-emerald-500 absolute inset-0 m-auto" />
          </div>
          <p className="text-emerald-500 font-black uppercase tracking-[0.4em] text-xs">{isAr ? 'جاري تفعيل ذكاء البحث وفلترة المراجع...' : 'ACTIVATING SEARCH INTELLIGENCE...'}</p>
        </div>
      ) : result ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 pop-in">
          <div className="lg:col-span-8">
            <div className="bg-[#111827]/60 border border-white/10 rounded-[3rem] p-10 md:p-14 shadow-2xl relative overflow-hidden backdrop-blur-xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/5 blur-[100px] -z-10"></div>
              <div 
                className={`prose prose-invert max-w-none text-slate-100 text-lg md:text-2xl leading-[1.8] prose-strong:text-emerald-400 ${responseLang === 'ar' ? 'text-right font-arabic' : 'text-left'}`}
                dir={responseLang === 'ar' ? 'rtl' : 'ltr'}
              >
                <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                  {result.text}
                </ReactMarkdown>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="bg-[#111827]/40 border border-white/5 rounded-[2.5rem] p-8 space-y-8 backdrop-blur-xl sticky top-24 shadow-2xl">
              <div className={`flex items-center gap-3 text-emerald-500/80 ${isAr ? 'flex-row-reverse text-right' : ''}`}>
                <div className="p-2 bg-emerald-600/20 rounded-xl">
                   <LinkIcon className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em]">{isAr ? 'المصادر والروابط المستخرجة' : 'EXTRACTED SOURCES & LINKS'}</h3>
              </div>
              <div className="flex flex-col gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {result.links && result.links.length > 0 ? (
                  result.links.map((link, i) => (
                    <a 
                      key={i} 
                      href={link.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="link-card group p-5 bg-black/40 border border-white/5 rounded-2xl hover:bg-emerald-600/10 hover:border-emerald-500/30 transition-all flex flex-col gap-3 shadow-lg"
                    >
                       <div className={`flex items-start justify-between gap-4 ${isAr ? 'flex-row-reverse' : ''}`}>
                          <h4 className={`text-white font-bold text-xs line-clamp-2 group-hover:text-emerald-400 transition-colors ${isAr ? 'text-right' : 'text-left'} flex-1`}>{link.title}</h4>
                          <ArrowUpRight className={`w-4 h-4 text-slate-700 group-hover:text-emerald-400 transition-colors flex-shrink-0 ${isAr ? 'rotate-180' : ''}`} />
                       </div>
                       {link.snippet && <p className={`text-[9px] text-slate-500 line-clamp-2 leading-relaxed italic ${isAr ? 'text-right' : ''}`}>{link.snippet}</p>}
                    </a>
                  ))
                ) : (
                  <div className="py-12 flex flex-col items-center gap-4 opacity-30">
                     <History className="w-10 h-10 text-slate-500" />
                     <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.2em] text-center">{isAr ? 'لا توجد روابط خارجية مكتشفة' : 'No External Links Found'}</p>
                  </div>
                )}
              </div>
              
              <div className="pt-6 border-t border-white/5 flex items-center justify-center gap-3 opacity-60">
                 <Globe className="w-4 h-4 text-emerald-500" />
                 <span className="text-[8px] font-black uppercase tracking-widest text-emerald-500">{isAr ? 'مصادر مستخرجة عبر البحث الذكي' : 'SOURCES VIA AI WEB SEARCH'}</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-10 opacity-30">
           {[{ title: 'Source Accuracy', icon: ShieldCheck }, { title: 'Web Discovery', icon: Globe }, { title: 'Research History', icon: History }].map((item, i) => (
             <div key={i} className="bg-black/40 border border-white/5 p-10 rounded-[3rem] text-center space-y-6 hover:bg-white/5 transition-all">
               <item.icon className="w-12 h-12 text-emerald-500/60 mx-auto" />
               <h3 className="text-white font-black uppercase tracking-widest text-sm">{item.title}</h3>
             </div>
           ))}
        </div>
      )}
    </div>
  );
};

export default IslamicHubView;
