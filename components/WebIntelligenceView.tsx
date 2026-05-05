
import React, { useState } from 'react';
import { Search, Globe, Link as LinkIcon, Image as ImageIcon, Loader2, Sparkles, ArrowUpRight, BookOpen } from 'lucide-react';
import { askWebIntelligence } from '../services/aiService';

const WebIntelligenceView: React.FC = () => {
  const isAr = document.documentElement.lang === 'ar';
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ text: string, images: any[], links: any[] } | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setQuery(query);
    setLoading(true);
    setResult(null);
    setSearchError(null);
    try {
      const res = await askWebIntelligence(query);
      setResult({
        text: res.text,
        links: res.links,
        images: [] 
      });
    } catch (e) {
      console.error(e);
      setSearchError(isAr ? '⚠️ فشل البحث. تأكد من الاتصال بالإنترنت وحاول مرة أخرى.' : '⚠️ Search failed. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 py-10 px-4 animate-in fade-in duration-700">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <div className="p-3 bg-blue-600/20 rounded-2xl">
            <Globe className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase">{isAr ? 'ذكاء الويب / البحث العميق' : 'Web Intelligence.'}</h1>
        </div>
        <p className="text-slate-500 font-medium text-sm md:text-lg">{isAr ? 'استنتاجات واقعية مبنية على بحث لحظي واكتشاف الويب.' : 'Fact-based reasoning powered by real-time web discovery.'}</p>
      </div>

      <div className="relative max-w-3xl mx-auto group">
        <div className="absolute inset-0 bg-blue-600 blur-[40px] opacity-10 group-focus-within:opacity-20 transition-opacity"></div>
        <div className={`relative flex items-center bg-[#111827]/80 backdrop-blur-xl border border-white/10 rounded-[2rem] p-2 transition-all hover:border-white/20 ${isAr ? 'flex-row-reverse' : ''}`}>
          <div className={`${isAr ? 'pr-6' : 'pl-6'} text-slate-500`}>
            <Search className="w-6 h-6" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder={isAr ? "اسأل عن أي معلومة حديثة أو واقعية..." : "Ask about any up-to-date or factual info..."}
            className={`flex-1 bg-transparent py-4 px-4 focus:outline-none text-lg text-white placeholder:text-slate-700 ${isAr ? 'text-right' : 'text-left'}`}
            dir={isAr ? 'rtl' : 'ltr'}
          />
          <button
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            className="bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-3xl transition-all disabled:opacity-30 active:scale-95 shadow-xl shadow-blue-600/20"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {searchError && (
        <div className="max-w-3xl mx-auto p-5 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-4 animate-in slide-in-from-top-4">
          <span className="text-red-400 font-bold text-sm">{searchError}</span>
        </div>
      )}

      {result && (
        <div className="space-y-8 animate-in slide-in-from-bottom-6 duration-700">
          <div className="bg-[#111827]/60 border border-white/10 rounded-[2.5rem] p-8 md:p-12 backdrop-blur-xl shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[100px] -z-10"></div>
            
            <div className={`flex items-center gap-3 mb-8 text-blue-400 ${isAr ? 'flex-row-reverse' : ''}`}>
              <div className="p-2 bg-blue-600/20 rounded-lg">
                <BookOpen className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">{isAr ? 'التوليف الذكي' : 'Smart Synthesis'}</span>
            </div>

            <div 
              className={`prose prose-invert max-w-none text-slate-100 text-lg md:text-xl leading-relaxed whitespace-pre-wrap ${isAr ? 'text-right font-arabic' : 'text-left'}`}
              dir={isAr ? 'rtl' : 'ltr'}
            >
              {result.text}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {result.links.length > 0 && (
              <div className="lg:col-span-12 space-y-4">
                <div className={`flex items-center gap-3 px-4 ${isAr ? 'flex-row-reverse' : ''}`}>
                  <LinkIcon className="w-4 h-4 text-slate-500" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{isAr ? 'مصادر موثقة' : 'Verified Sources'}</span>
                </div>
                <div className="flex flex-col gap-3">
                  {result.links.map((link, i) => (
                    <a 
                      key={i} 
                      href={link.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex flex-col gap-2 p-5 bg-[#111827]/40 border border-white/5 rounded-3xl hover:bg-white/10 hover:border-white/20 transition-all group"
                    >
                      <div className={`flex items-start justify-between ${isAr ? 'flex-row-reverse' : ''}`}>
                        <h4 className={`text-white font-bold text-xs line-clamp-1 group-hover:text-blue-400 transition-colors ${isAr ? 'text-right' : ''}`}>{link.title}</h4>
                        <ArrowUpRight className={`w-3.5 h-3.5 text-slate-600 group-hover:text-blue-400 transition-colors flex-shrink-0 ${isAr ? 'rotate-180' : ''}`} />
                      </div>
                      <p className={`text-[9px] text-slate-500 line-clamp-2 leading-relaxed font-medium ${isAr ? 'text-right' : ''}`}>{link.snippet}</p>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-24 gap-8">
          <div className="relative">
            <div className="w-32 h-32 border-2 border-blue-500/10 rounded-full animate-ping"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                <div className="w-16 h-16 bg-blue-600/20 rounded-full animate-pulse blur-xl"></div>
                <Globe className="w-10 h-10 text-blue-500 absolute inset-0 m-auto animate-spin [animation-duration:3s]" />
              </div>
            </div>
          </div>
          <div className="text-center space-y-3">
            <h3 className="text-2xl font-black text-white tracking-tight">{isAr ? 'ذكاء المعلم الآلي' : 'Teacher AI Intelligence'}</h3>
            <div className="flex flex-col items-center gap-1">
              <span className="text-[9px] font-black text-blue-500 uppercase tracking-[0.4em] animate-pulse">{isAr ? 'تحليل الويب العميق' : 'Deep Web Analysis'}</span>
              <span className="text-[8px] text-slate-600 font-bold uppercase tracking-widest">{isAr ? 'تجميع الأنماط الواقعية' : 'Synthesizing factual patterns'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebIntelligenceView;
