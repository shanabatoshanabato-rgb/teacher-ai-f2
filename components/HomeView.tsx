
import React, { useRef, useState, useEffect } from 'react';
import { 
  Star, PenTool, BookOpen, GraduationCap, ShieldCheck, 
  Library, Mic, FileText, ArrowRight, Languages, FileCheck, Gamepad2
} from 'lucide-react';
import { AppTab } from '../types';

interface HomeViewProps {
  setActiveTab: (tab: AppTab) => void;
}

// --- 3D Card Component ---
interface Card3DProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  glowColor?: string;
}

const Card3D: React.FC<Card3DProps> = ({ children, className = '', onClick, glowColor = '99,102,241' }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState({});
  const [glowStyle, setGlowStyle] = useState({});
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    const maxTilt = 18;
    const rotX = (-dy / (rect.height / 2)) * maxTilt;
    const rotY = (dx / (rect.width / 2)) * maxTilt;

    const glowX = ((e.clientX - rect.left) / rect.width) * 100;
    const glowY = ((e.clientY - rect.top) / rect.height) * 100;

    setStyle({
      transform: `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(1.04,1.04,1.04)`,
      transition: 'transform 0.1s ease-out',
      zIndex: 10,
    });
    setGlowStyle({
      background: `radial-gradient(circle at ${glowX}% ${glowY}%, rgba(${glowColor},0.2) 0%, transparent 65%)`,
    });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setStyle({
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)',
      transition: 'transform 0.5s cubic-bezier(0.23,1,0.32,1)',
    });
    setGlowStyle({});
  };

  const handleMouseEnter = () => setIsHovered(true);

  return (
    <div
      ref={cardRef}
      style={style}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
      onClick={onClick}
      className={`relative cursor-pointer ${className}`}
    >
      {/* Inner glow layer */}
      <div
        className="absolute inset-0 rounded-[2rem] pointer-events-none transition-opacity duration-300"
        style={{ ...glowStyle, opacity: isHovered ? 1 : 0 }}
      />
      {/* Shine line */}
      {isHovered && (
        <div className="absolute inset-0 rounded-[2rem] pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        </div>
      )}
      {children}
    </div>
  );
};

// --- Floating Orb ---
const FloatingOrb: React.FC<{ delay?: number; size?: number; color?: string; x?: string; y?: string }> = ({
  delay = 0, size = 300, color = 'indigo', x = '50%', y = '50%'
}) => {
  const colorMap: Record<string, string> = {
    indigo: 'rgba(99,102,241,0.12)',
    violet: 'rgba(139,92,246,0.1)',
    blue: 'rgba(59,130,246,0.1)',
    emerald: 'rgba(16,185,129,0.08)',
  };
  return (
    <div
      className="absolute rounded-full pointer-events-none blur-[80px] animate-pulse"
      style={{
        width: size,
        height: size,
        background: colorMap[color] || colorMap.indigo,
        left: x,
        top: y,
        transform: 'translate(-50%,-50%)',
        animationDelay: `${delay}s`,
        animationDuration: `${4 + delay}s`,
      }}
    />
  );
};

// --- Counter Animation ---
const AnimCounter: React.FC<{ to: number; suffix?: string; duration?: number }> = ({ to, suffix = '', duration = 2000 }) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !started.current) {
        started.current = true;
        const start = performance.now();
        const tick = (now: number) => {
          const p = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          setCount(Math.floor(eased * to));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [to, duration]);

  return <span ref={ref}>{count}{suffix}</span>;
};

const HomeView: React.FC<HomeViewProps> = ({ setActiveTab }) => {
  const isAr = document.documentElement.lang === 'ar';
  const [titleVisible, setTitleVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setTitleVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  const t = isAr ? {
    badge: 'المعلم الذكي - رفيقك التعليمي الأول',
    h1: 'المعلم الذكي.',
    h2: 'مستقبلك يبدأ هنا.',
    desc: 'منصة تعليمية متطورة تدعمك في رحلتك الدراسية بأحدث التقنيات لتجعل التعلم أسهل وأكثر متعة.',
    btnChat: 'ابدأ التعلم الآن',
    btnSettings: 'مركز التحكم',
    core: 'أنظمة المعلم الذكي',
    feat1: 'المحادثة',
    feat1d: 'نقاشات تعليمية تفاعلية.',
    feat2: 'منهاج الإمارات',
    feat2d: 'دراسة ذكية لمنهاج وزارة التربية.',
    feat3: 'استوديو الكتابة',
    feat3d: 'تصحيح، إعراب، وتطوير النصوص.',
    feat4: 'مساعد الواجبات',
    feat4d: 'حل وشرح المسائل بسهولة.',
    feat5: 'المكتبة الإسلامية',
    feat5d: 'علوم القرآن والفقه والحديث.',
    feat6: 'الوضع الصوتي',
    feat6d: 'تحدث وتفاعل مع المعلم بصوتك.',
    feat7: 'مصنع الملفات',
    feat7d: 'توليد ملفات PDF و PPT ذكية.',
    feat8: 'المترجم الحي',
    feat8d: 'ترجم كلامك فوراً بصوتك إلى أي لغة',
    feat9: 'محسّن السيرة',
    feat9d: 'حوّل سيرتك الذاتية لتتخطى أنظمة ATS لأي وظيفة',
    feat10: 'العاب المعلم',
    feat10d: 'العاب تعليمية تنافسية مع طلابك في الوقت الفعلي'
  } : {
    badge: 'TEACHER AI - YOUR SMART STUDY COMPANION',
    h1: 'TEACHER AI.',
    h2: 'Your Future Starts Here.',
    desc: 'An advanced educational platform designed to support your study journey with the latest technology.',
    btnChat: 'Start Learning',
    btnSettings: 'Master Control',
    core: 'SMART TEACHER SYSTEMS',
    feat1: 'Chat',
    feat1d: 'Interactive educational discussions.',
    feat2: 'UAE Teacher',
    feat2d: 'AI-powered study for UAE standards.',
    feat3: 'Writer Studio',
    feat3d: 'Correction, parsing, and rewriting.',
    feat4: 'Homework AI',
    feat4d: 'Solve and explain problems easily.',
    feat5: 'Islamic Hub',
    feat5d: 'Quran, Fiqh, and Hadith studies.',
    feat6: 'Voice Mode',
    feat6d: 'Talk and interact via voice.',
    feat7: 'Doc Factory',
    feat7d: 'Generate smart PDF & PPT files.',
    feat8: 'Live Translator',
    feat8d: 'Instantly translate your speech into any language.',
    feat9: 'CV Booster',
    feat9d: 'Transform your CV to pass ATS systems for any job',
    feat10: 'Teacher Games',
    feat10d: 'Competitive educational games with your students in real time'
  };

  const features = [
    { id: 'chat', title: t.feat1, desc: t.feat1d, icon: GraduationCap, color: 'text-blue-400', bg: 'bg-blue-400/10', glow: '59,130,246', border: 'hover:border-blue-500/40' },
    { id: 'teacher_games', title: t.feat10, desc: t.feat10d, icon: Gamepad2, color: 'text-indigo-400', bg: 'bg-indigo-400/10', glow: '99,102,241', border: 'hover:border-indigo-500/40' },
    { id: 'teacher-uae', title: t.feat2, desc: t.feat2d, icon: ShieldCheck, color: 'text-emerald-400', bg: 'bg-emerald-400/10', glow: '16,185,129', border: 'hover:border-emerald-500/40' },
    { id: 'writer', title: t.feat3, desc: t.feat3d, icon: PenTool, color: 'text-amber-400', bg: 'bg-amber-400/10', glow: '251,191,36', border: 'hover:border-amber-500/40' },
    { id: 'homework', title: t.feat4, desc: t.feat4d, icon: BookOpen, color: 'text-purple-400', bg: 'bg-purple-400/10', glow: '167,139,250', border: 'hover:border-purple-500/40' },
    { id: 'cv_booster', title: t.feat9, desc: t.feat9d, icon: FileCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/10', glow: '16,185,129', border: 'hover:border-emerald-500/40' },
    { id: 'islamic-hub', title: t.feat5, desc: t.feat5d, icon: Library, color: 'text-teal-400', bg: 'bg-teal-400/10', glow: '45,212,191', border: 'hover:border-teal-500/40' },
    { id: 'voice', title: t.feat6, desc: t.feat6d, icon: Mic, color: 'text-rose-400', bg: 'bg-rose-400/10', glow: '251,113,133', border: 'hover:border-rose-500/40' },
    { id: 'files', title: t.feat7, desc: t.feat7d, icon: FileText, color: 'text-sky-400', bg: 'bg-sky-400/10', glow: '56,189,248', border: 'hover:border-sky-500/40' },
    { id: 'translator', title: t.feat8, desc: t.feat8d, icon: Languages, color: 'text-cyan-400', bg: 'bg-cyan-400/10', glow: '34,211,238', border: 'hover:border-cyan-500/40' },
  ];



  return (
    <div className="relative flex flex-col items-center justify-center pt-2 sm:pt-6 pb-20 px-4 max-w-screen-xl mx-auto overflow-visible">

      {/* Floating ambient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <FloatingOrb color="indigo" size={500} x="15%" y="20%" delay={0} />
        <FloatingOrb color="violet" size={400} x="80%" y="15%" delay={1.5} />
        <FloatingOrb color="blue" size={350} x="60%" y="70%" delay={3} />
        <FloatingOrb color="emerald" size={300} x="20%" y="75%" delay={2} />
      </div>

      {/* Badge */}
      <div
        className="relative z-10 mb-8 flex items-center gap-2 px-5 py-2.5 rounded-full border"
        style={{
          background: 'rgba(99,102,241,0.08)',
          borderColor: 'rgba(99,102,241,0.25)',
          boxShadow: '0 0 30px rgba(99,102,241,0.15)',
          opacity: titleVisible ? 1 : 0,
          transform: titleVisible ? 'translateY(0)' : 'translateY(-20px)',
          transition: 'all 0.8s cubic-bezier(0.23,1,0.32,1)',
        }}
      >
        <Star className="w-3 h-3 text-indigo-400 fill-indigo-400 animate-spin" style={{ animationDuration: '4s' }} />
        <span className="text-[10px] font-black tracking-[0.2em] text-indigo-300 uppercase">{t.badge}</span>
      </div>

      {/* Main Heading */}
      <div className="relative z-10 text-center space-y-2 mb-10 w-full">
        <h1
          className={`text-5xl sm:text-7xl lg:text-8xl font-black text-white leading-[1.4] py-2 px-2 ${isAr ? 'tracking-normal' : 'tracking-tighter'}`}
          style={{
            opacity: titleVisible ? 1 : 0,
            transform: titleVisible ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.95)',
            transition: 'all 1s cubic-bezier(0.23,1,0.32,1) 0.1s',
            textShadow: '0 0 80px rgba(99,102,241,0.3)',
          }}
        >
          {t.h1}
        </h1>
        <h2
          className={`text-4xl sm:text-6xl lg:text-7xl font-black bg-gradient-to-r from-indigo-400 via-violet-400 to-blue-400 bg-clip-text text-transparent leading-[1.4] py-2 px-2 ${isAr ? 'tracking-normal' : 'tracking-tighter'}`}
          style={{
            opacity: titleVisible ? 1 : 0,
            transform: titleVisible ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.95)',
            transition: 'all 1s cubic-bezier(0.23,1,0.32,1) 0.25s',
          }}
        >
          {t.h2}
        </h2>
        <p
          className="max-w-xl mx-auto text-slate-400 text-sm sm:text-lg font-medium mt-4 leading-relaxed px-4"
          style={{
            opacity: titleVisible ? 1 : 0,
            transform: titleVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 1s cubic-bezier(0.23,1,0.32,1) 0.4s',
          }}
        >
          {t.desc}
        </p>
      </div>

      {/* CTA Buttons */}
      <div
        className="relative z-10 flex flex-col sm:flex-row gap-4 mb-16 w-full sm:w-auto px-6"
        style={{
          opacity: titleVisible ? 1 : 0,
          transform: titleVisible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 1s cubic-bezier(0.23,1,0.32,1) 0.55s',
        }}
      >
        <button
          onClick={() => setActiveTab('chat')}
          className="group relative px-10 py-5 text-white font-black rounded-2xl flex items-center justify-center gap-3 transition-all uppercase tracking-widest text-sm overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
            boxShadow: '0 0 40px rgba(99,102,241,0.4), 0 10px 40px rgba(99,102,241,0.2)',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 60px rgba(99,102,241,0.6), 0 10px 60px rgba(99,102,241,0.4)';
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px) scale(1.02)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 40px rgba(99,102,241,0.4), 0 10px 40px rgba(99,102,241,0.2)';
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0) scale(1)';
          }}
        >
          <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all duration-300" />
          {t.btnChat}
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className="px-10 py-5 text-white font-black rounded-2xl border border-white/10 hover:border-white/25 hover:bg-white/8 transition-all uppercase tracking-widest text-sm"
          style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; }}
        >
          {t.btnSettings}
        </button>
      </div>

      {/* Features */}
      <div className="relative z-10 w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <Card3D
                key={i}
                glowColor={f.glow}
                onClick={() => setActiveTab(f.id as AppTab)}
                className="w-full"
              >
                <div
                  className={`bg-[#0a0a0c] border border-white/5 ${f.border} p-6 sm:p-8 rounded-[2rem] text-center space-y-6 transition-all group`}
                  style={{
                    opacity: titleVisible ? 1 : 0,
                    transform: titleVisible ? 'translateY(0)' : 'translateY(40px)',
                    transition: `opacity 0.7s ease ${0.7 + i * 0.08}s, transform 0.7s cubic-bezier(0.23,1,0.32,1) ${0.7 + i * 0.08}s`,
                  }}
                >
                  <div className={`p-4 rounded-2xl ${f.bg} inline-block group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`w-6 h-6 sm:w-8 sm:h-8 ${f.color}`} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight leading-[1.4]">{f.title}</h3>
                    <p className="text-[10px] text-slate-500 leading-relaxed font-bold uppercase tracking-wider">{f.desc}</p>
                  </div>
                  {/* Bottom glow line */}
                  <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-indigo-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
                </div>
              </Card3D>
            );
          })}
        </div>
      </div>

      <div className="relative z-10 mt-20 opacity-20 text-center">
        <span className="text-[8px] font-black uppercase tracking-[1em] text-slate-500">Teacher AI Optimized Core v5.2</span>
      </div>
    </div>
  );
};

export default HomeView;
