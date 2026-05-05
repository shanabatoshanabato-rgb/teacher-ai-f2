
import React from 'react';
import { 
  Info, Globe, GraduationCap, Server, Lock, ShieldCheck, Star, Zap, Cpu, Search, BookOpen, PenTool, Library
} from 'lucide-react';

const SettingsView: React.FC = () => {
  const isAr = document.documentElement.lang === 'ar';
  
  const handleLang = (l: string) => {
    localStorage.setItem('teacher_ui_lang', l);
    window.location.reload();
  };

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 space-y-12 animate-in fade-in duration-700">
      <div className={`bg-[#111827]/40 border border-white/10 rounded-[2.5rem] p-8 md:p-12 backdrop-blur-xl flex flex-col md:flex-row justify-between items-center shadow-2xl gap-8 ${isAr ? 'md:flex-row-reverse' : ''}`}>
        <div className={`flex items-center gap-6 ${isAr ? 'flex-row-reverse text-right' : ''}`}>
          <div className="p-6 bg-indigo-600/20 rounded-3xl border border-indigo-500/30">
            <Cpu className="w-10 h-10 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase leading-none">
                {isAr ? 'الاحترافية التعليمية' : 'TECH EXCELLENCE'}
            </h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.4em] mt-3">
                {isAr ? 'إدارة الذكاء التعليمي المتطور' : 'ADVANCED INTELLIGENCE MANAGEMENT'}
            </p>
          </div>
        </div>
        
        <div className="flex gap-4">
            <button 
              onClick={() => handleLang('ar')} 
              className={`px-8 py-4 rounded-2xl border transition-all text-[11px] font-black uppercase tracking-widest ${isAr ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-white/5 border-white/5 text-slate-500 hover:text-white'}`}
            >
              العربية
            </button>
            <button 
              onClick={() => handleLang('en')} 
              className={`px-8 py-4 rounded-2xl border transition-all text-[11px] font-black uppercase tracking-widest ${!isAr ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-white/5 border-white/5 text-slate-500 hover:text-white'}`}
            >
              English
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-12">
        <div className="bg-[#050505] border border-white/5 rounded-[4rem] p-10 md:p-20 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-600/5 via-transparent to-emerald-600/5 -z-10"></div>
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/10 blur-[120px] rounded-full"></div>
          
          <div className={`flex flex-col gap-16 ${isAr ? 'text-right' : 'text-left'}`}>
             <div className={`flex flex-col gap-4 ${isAr ? 'items-end' : 'items-start'}`}>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-600/10 border border-indigo-500/20 mb-4">
                   <Star className="w-3 h-3 text-indigo-400 fill-indigo-400" />
                   <span className="text-[9px] font-black tracking-widest text-indigo-400 uppercase">{isAr ? 'الرؤية والأهداف' : 'VISION & MISSION'}</span>
                </div>
                <h3 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter leading-tight">
                   {isAr ? 'مستقبل التعليم، اليوم.' : 'The Future of Education, Today.'}
                </h3>
                <p className="max-w-3xl text-slate-400 text-lg md:text-xl font-medium leading-relaxed">
                   {isAr 
                    ? 'نحن هنا لإعادة تعريف التجربة التعليمية في دولة الإمارات العربية المتحدة. منصة Teacher AI UAE ليست مجرد أداة ذكاء اصطناعي، بل هي رفيق تعليمي متطور يلتزم بأعلى معايير الجودة الأكاديمية والخصوصية الرقمية.' 
                    : 'We are here to redefine the educational experience in the UAE. Teacher AI UAE is more than just an AI tool; it is an advanced educational companion committed to the highest standards of academic quality and digital privacy.'}
                </p>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="settings-card p-8 bg-white/5 border border-white/5 rounded-[3rem] space-y-6 hover:bg-white/[0.07] transition-all group">
                   <div className={`p-4 bg-emerald-600/10 rounded-2xl w-fit group-hover:scale-110 transition-transform ${isAr ? 'mr-auto ml-0 md:mr-0' : ''}`}>
                      <ShieldCheck className="w-8 h-8 text-emerald-400 icon-bob" />
                   </div>
                   <h4 className="text-white font-black text-xl uppercase tracking-tight">{isAr ? 'منهاج وزارة التربية' : 'MINISTRY CURRICULUM'}</h4>
                   <p className="text-slate-500 text-sm leading-relaxed font-medium">
                      {isAr ? 'تكامل تام مع المناهج الرسمية الإماراتية (سراج)، مع جلب البيانات اللحظية لضمان الدقة في كل إجابة وشرح.' : 'Full integration with UAE Ministry of Education (SERAJ) curriculum, fetching real-time data to ensure accuracy in every answer.'}
                   </p>
                </div>

                <div className="settings-card p-8 bg-white/5 border border-white/5 rounded-[3rem] space-y-6 hover:bg-white/[0.07] transition-all group">
                   <div className={`p-4 bg-indigo-600/10 rounded-2xl w-fit group-hover:scale-110 transition-transform ${isAr ? 'mr-auto ml-0 md:mr-0' : ''}`}>
                      <Server className="w-8 h-8 text-indigo-400 icon-bob" />
                   </div>
                   <h4 className="text-white font-black text-xl uppercase tracking-tight">{isAr ? 'ذكاء معلوماتي' : 'SMART INTELLIGENCE'}</h4>
                   <p className="text-slate-500 text-sm leading-relaxed font-medium">
                      {isAr ? 'نعتمد حصرياً على نواة ذكاء متطورة لضمان خصوصية بياناتك ومعالجتها بأمان تام بعيداً عن المنصات التجارية المفتوحة.' : 'Exclusively built on a smart AI core to ensure your data remains private and processed securely away from open commercial platforms.'}
                   </p>
                </div>

                 <div className="settings-card p-8 bg-white/5 border border-white/5 rounded-[3rem] space-y-6 hover:bg-white/[0.07] transition-all group">
                    <div className={`p-4 bg-red-600/10 rounded-2xl w-fit group-hover:scale-110 transition-transform ${isAr ? 'mr-auto ml-0 md:mr-0' : ''}`}>
                       <Lock className="w-8 h-8 text-red-400 icon-bob" />
                    </div>
                    <h4 className="text-white font-black text-xl uppercase tracking-tight">{isAr ? 'مبني على Puter AI' : 'POWERED BY PUTER AI'}</h4>
                    <p className="text-slate-500 text-sm leading-relaxed font-medium">
                       {isAr 
                        ? 'يعتمد Teacher AI على منصة Puter.js كبنية تحتية آمنة توفر GPT-4o والبحث والصوت. بياناتك تُعالج مباشرةً بدون تخزين على خوادمنا.' 
                        : 'Teacher AI is powered by Puter.js as a secure AI infrastructure that provides GPT-4o, web search, and voice. Your data is processed in real-time without storage on our servers.'}
                    </p>
                 </div>
             </div>

             <div className="pt-12 border-t border-white/5">
                <div className={`flex flex-col gap-10 ${isAr ? 'items-end' : 'items-start'}`}>
                   <h4 className="text-2xl font-black text-white uppercase tracking-tighter">{isAr ? 'أنظمتنا الأساسية' : 'OUR CORE SYSTEMS'}</h4>
                   <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                      {[
                        { id: 'chat', icon: Search, label: isAr ? 'البحث الذكي' : 'SMART SEARCH' },
                        { id: 'voice', icon: Zap, label: isAr ? 'الوضع الصوتي' : 'VOICE MODE' },
                        { id: 'homework', icon: BookOpen, label: isAr ? 'مساعد الواجبات' : 'HOMEWORK AI' },
                        { id: 'writer', icon: PenTool, label: isAr ? 'استوديو الكتابة' : 'WRITER STUDIO' },
                        { id: 'islamic', icon: Library, label: isAr ? 'المكتبة الإسلامية' : 'ISLAMIC HUB' },
                      ].map((item, index) => (
                        <div key={item.id} className={`stagger-${index + 1} flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/5 rounded-2xl`}>
                           <item.icon className="w-4 h-4 text-indigo-400 loop-pulse" />
                           <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.label}</span>
                        </div>
                      ))}
                   </div>
                </div>
             </div>

             <div className="pt-16 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className={`flex items-center gap-4 opacity-50 ${isAr ? 'flex-row-reverse' : ''}`}>
                   <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-white">{isAr ? 'نظام تعليمي معتمد' : 'CERTIFIED SYSTEM'}</span>
                   </div>
                   <div className="w-1 h-1 bg-white/20 rounded-full"></div>
                   <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-blue-400" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-white">{isAr ? 'بيانات لحظية' : 'REAL-TIME DATA'}</span>
                   </div>
                </div>
                <div className="text-[10px] font-black text-slate-700 uppercase tracking-[0.6em]">
                   TEACHER AI • VER 5.2 • 2025
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
