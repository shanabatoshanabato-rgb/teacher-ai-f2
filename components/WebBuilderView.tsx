
import React, { useState } from 'react';
import { 
  Layout, 
  Loader2, 
  Rocket, 
  Download, 
  Code, 
  Eye, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  Wrench,
  Sparkles,
  FileCode,
  Archive
} from 'lucide-react';
import { puterBuildWeb, puterRepairWeb } from '../services/puterCore';

declare const JSZip: any;

const WebBuilderView: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [fixPrompt, setFixPrompt] = useState('');
  const [projectData, setProjectData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'reviewing' | 'generating' | 'finalizing' | 'analyzing'>('idle');
  const [view, setView] = useState<'preview' | 'code'>('preview');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const isAr = document.documentElement.lang === 'ar';

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setProjectData(null);
    try {
      const res = await puterBuildWeb(prompt, (p: any) => setPhase(p));
      if (res && res.files) {
        setProjectData(res);
        setSelectedFile(Object.keys(res.files)[0]);
        setView('preview');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setPhase('idle');
    }
  };

  const handleRepair = async () => {
    if (!fixPrompt.trim() || !projectData) return;
    setLoading(true);
    try {
      const res = await puterRepairWeb(prompt, projectData, fixPrompt, (p: any) => setPhase(p));
      if (res && res.files) {
        setProjectData(res);
        setFixPrompt('');
        setView('preview');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setPhase('idle');
    }
  };

  const downloadZip = async () => {
    if (!projectData || !projectData.files) return;
    const zip = new JSZip();
    Object.entries(projectData.files).forEach(([name, content]) => {
      zip.file(name, content as string);
    });
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `TeacherAI_Project_${Date.now()}.zip`;
    link.click();
  };

  return (
    <div className="max-w-[1800px] mx-auto py-10 px-4 space-y-10 animate-in fade-in duration-700">
      <div className={`flex flex-col md:flex-row items-center justify-between gap-8 border-b border-white/5 pb-12 ${isAr ? 'md:flex-row-reverse' : ''}`}>
        <div className={`flex items-center gap-6 ${isAr ? 'flex-row-reverse text-right' : ''}`}>
          <div className="w-24 h-24 bg-indigo-600/10 rounded-[3rem] flex items-center justify-center border border-indigo-500/30 shadow-2xl relative">
             <div className="absolute inset-0 bg-indigo-500 blur-3xl opacity-20 animate-pulse"></div>
             <Layout className="w-12 h-12 text-indigo-400 relative" />
          </div>
          <div>
            <h1 className="text-4xl md:text-7xl font-black text-white tracking-tighter uppercase leading-none">
                {isAr ? 'معماري الويب' : 'Web Architect.'}
            </h1>
            <p className="text-indigo-500 font-black uppercase tracking-[0.4em] text-[10px] mt-2">
                {isAr ? 'نظام البناء الذكي المتطور' : 'ADVANCED SMART BUILD SYSTEM'}
            </p>
          </div>
        </div>

        {projectData && (
          <div className="flex items-center gap-3">
             <button onClick={downloadZip} className="flex items-center gap-3 bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-600/20 active:scale-95">
                <Archive className="w-5 h-5" />
                {isAr ? 'تحميل المشروع (ZIP)' : 'DOWNLOAD PROJECT (ZIP)'}
             </button>
             <button onClick={() => setProjectData(null)} className="p-4 bg-white/5 hover:bg-white/10 text-slate-400 rounded-2xl border border-white/5 transition-all">
                <RefreshCw className="w-6 h-6" />
             </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 min-h-[750px]">
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-[#111827]/40 border border-white/5 rounded-[3rem] p-8 backdrop-blur-xl shadow-2xl space-y-8 h-full flex flex-col">
            <div className="flex-1 space-y-8">
               <div className={`flex items-center gap-3 ${isAr ? 'flex-row-reverse' : ''}`}>
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-xs font-black uppercase tracking-[0.3em] text-indigo-400">{isAr ? 'وصف المشروع' : 'PROJECT DESCRIPTION'}</h3>
               </div>
               
               <textarea
                 value={prompt}
                 onChange={(e) => setPrompt(e.target.value)}
                 disabled={loading || !!projectData}
                 placeholder={isAr ? "اشرح فكرة الموقع الذي ترغب في بنائه بالتفصيل..." : "Describe the website you want to build in detail..."}
                 className={`w-full bg-black/40 border border-white/10 rounded-[2.5rem] p-8 text-xl text-white placeholder:text-slate-800 min-h-[300px] resize-none focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all ${isAr ? 'text-right' : 'text-left'}`}
                 dir={isAr ? 'rtl' : 'ltr'}
               />

               {!projectData && (
                 <button 
                   onClick={handleGenerate} 
                   disabled={loading || !prompt.trim()} 
                   className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-20 text-white font-black py-8 rounded-[2rem] flex flex-col items-center justify-center gap-2 transition-all shadow-2xl active:scale-95"
                 >
                    {loading ? (
                      <Loader2 className="w-10 h-10 animate-spin" />
                    ) : (
                      <>
                        <Rocket className="w-8 h-8" />
                        <span className="text-2xl uppercase tracking-tighter">{isAr ? 'بدء البناء الذكي' : 'LAUNCH ARCHITECT'}</span>
                      </>
                    )}
                 </button>
               )}

               {projectData && (
                 <div className="space-y-6 animate-in slide-in-from-left-4">
                    <div className="h-px bg-white/5 w-full"></div>
                    <div className={`flex items-center gap-3 ${isAr ? 'flex-row-reverse' : ''}`}>
                        <Wrench className="w-5 h-5 text-amber-500" />
                        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-amber-500">{isAr ? 'إصلاح وتطوير' : 'REPAIR & DEVELOP'}</h3>
                    </div>
                    <textarea
                      value={fixPrompt}
                      onChange={(e) => setFixPrompt(e.target.value)}
                      placeholder={isAr ? "ما الذي ترغب في إصلاحه أو إضافته؟" : "What would you like to fix or add?"}
                      className={`w-full bg-black/40 border border-amber-500/10 rounded-[2rem] p-6 text-lg text-white placeholder:text-slate-800 min-h-[150px] resize-none focus:outline-none focus:border-amber-500/40 transition-all ${isAr ? 'text-right' : 'text-left'}`}
                      dir={isAr ? 'rtl' : 'ltr'}
                    />
                    <button 
                      onClick={handleRepair} 
                      disabled={loading || !fixPrompt.trim()} 
                      className="w-full bg-amber-600/20 hover:bg-amber-600/30 text-amber-500 border border-amber-500/30 font-black py-5 rounded-2xl flex items-center justify-center gap-3 transition-all"
                    >
                       {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wrench className="w-5 h-5" />}
                       <span className="text-xs uppercase tracking-widest">{isAr ? 'إصلاح الكود' : 'FIX & UPDATE CODE'}</span>
                    </button>
                 </div>
               )}
            </div>

            {loading && (
              <div className="p-6 bg-indigo-600/5 border border-indigo-500/10 rounded-2xl flex items-center gap-4">
                 <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                 <div className="flex-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">
                        {phase === 'reviewing' && (isAr ? 'جاري مراجعة التعليمات...' : 'REVIEWING INSTRUCTIONS')}
                        {phase === 'generating' && (isAr ? 'جاري كتابة الأكواد...' : 'GENERATING CODEBASE')}
                        {phase === 'finalizing' && (isAr ? 'مراجعة نهائية للمنطق...' : 'FINAL LOGIC CHECK')}
                        {phase === 'analyzing' && (isAr ? 'جاري تحليل الأخطاء...' : 'ANALYZING ISSUES')}
                    </p>
                 </div>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <div className="bg-[#050505] border border-white/10 rounded-[4rem] overflow-hidden shadow-2xl h-full flex flex-col relative">
            <div className="bg-[#111827]/80 p-6 border-b border-white/5 flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <button onClick={() => setView('preview')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'preview' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white/5 text-slate-500 hover:text-white'}`}>
                    {isAr ? 'المعاينة الحية' : 'LIVE PREVIEW'}
                  </button>
                  <button onClick={() => setView('code')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'code' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white/5 text-slate-500 hover:text-white'}`}>
                    {isAr ? 'عرض الملفات' : 'CODE FILES'}
                  </button>
               </div>
               
               {view === 'code' && projectData && (
                 <div className="flex gap-2 overflow-x-auto max-w-[400px] no-scrollbar">
                    {Object.keys(projectData.files).map(f => (
                      <button 
                        key={f} 
                        onClick={() => setSelectedFile(f)}
                        className={`px-4 py-1.5 rounded-lg text-[9px] font-bold border transition-all whitespace-nowrap ${selectedFile === f ? 'bg-white/10 border-white/20 text-white' : 'border-transparent text-slate-600 hover:text-slate-400'}`}
                      >
                         {f}
                      </button>
                    ))}
                 </div>
               )}
            </div>

            <div className="flex-1 bg-white relative">
               {!projectData ? (
                 <div className="absolute inset-0 bg-[#0c0c0e] flex flex-col items-center justify-center text-center p-12 space-y-8">
                    <div className="relative">
                       <div className="w-32 h-32 border-2 border-indigo-500/10 rounded-full animate-ping"></div>
                       <FileCode className="absolute inset-0 m-auto w-16 h-16 text-indigo-500/20" />
                    </div>
                    <div className="space-y-2">
                       <h3 className="text-3xl font-black text-white/40 uppercase tracking-tighter">{isAr ? 'بانتظار تعليماتك' : 'AWAITING YOUR INPUT'}</h3>
                       <p className="text-[10px] text-slate-600 font-bold uppercase tracking-[0.4em]">{isAr ? 'معماري التعليم في وضع الاستعداد' : 'AI ARCHITECT IN STANDBY MODE'}</p>
                    </div>
                 </div>
               ) : view === 'preview' ? (
                 <iframe 
                   title="Viewport" 
                   className="w-full h-full border-none" 
                   srcDoc={projectData.preview_html} 
                 />
               ) : (
                 <div className="w-full h-full bg-[#0d0d0f] p-10 overflow-auto font-mono text-sm leading-relaxed">
                    <pre className="text-indigo-300">
                       {selectedFile ? projectData.files[selectedFile] : 'Select a file to view code'}
                    </pre>
                 </div>
               )}
            </div>

            <div className="bg-[#111827] px-8 py-4 border-t border-white/5 flex items-center justify-between">
               <div className="flex items-center gap-6 opacity-40">
                  <div className="flex items-center gap-2">
                     <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                     <span className="text-[8px] font-black uppercase text-white tracking-widest">W3C Compliant</span>
                  </div>
                  <div className="flex items-center gap-2">
                     <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                     <span className="text-[8px] font-black uppercase text-white tracking-widest">TS + React Supported</span>
                  </div>
               </div>
               <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                  <span className="text-[8px] font-black uppercase text-indigo-400 tracking-widest">{isAr ? 'جاهز للتصدير' : 'READY FOR EXPORT'}</span>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebBuilderView;
