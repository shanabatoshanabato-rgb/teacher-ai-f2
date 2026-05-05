
import React, { useState } from 'react';
import { 
  MessageSquare, BookOpen, PenTool, Layout, FileText, Settings as SettingsIcon, Sparkles, Mic, Menu, X, Globe, Library, GraduationCap, Brain, ShieldCheck, Languages
} from 'lucide-react';
import { AppTab } from '../types';

interface NavbarProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
}

const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isAr = document.documentElement.lang === 'ar';

  const navItems = [
    { id: 'chat', label: isAr ? 'المحادثة' : 'Chat', icon: MessageSquare },
    { id: 'voice', label: isAr ? 'الوضع الصوتي' : 'Voice Mode', icon: Mic },
    { id: 'translator', label: isAr ? 'المترجم الحي' : 'Live Translator', icon: Languages },
    { id: 'teacher-uae', label: isAr ? 'منهاج الإمارات' : 'UAE Teacher', icon: ShieldCheck },
    { id: 'homework', label: isAr ? 'مساعد الواجبات' : 'Homework AI', icon: BookOpen },
    { id: 'islamic-hub', label: isAr ? 'المكتبة الإسلامية' : 'Islamic Hub', icon: Library },
    { id: 'writer', label: isAr ? 'استوديو الكتابة' : 'Writer Studio', icon: PenTool },
    { id: 'files', label: isAr ? 'مصنع الملفات' : 'Doc Factory', icon: FileText },
    { id: 'settings', label: isAr ? 'الإعدادات' : 'Settings', icon: SettingsIcon },
  ];

  const handleTabClick = (tab: AppTab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 glass px-4 sm:px-6 py-2 sm:py-3">
        <div className="max-w-[1920px] mx-auto flex items-center justify-between">
          <div 
            className="flex items-center gap-2 cursor-pointer group shrink-0"
            onClick={() => handleTabClick('home')}
          >
            <div className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl transition-colors ${activeTab === 'home' ? 'bg-white text-black' : 'bg-indigo-600 text-white'}`}>
              <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="text-base sm:text-xl font-bold text-white tracking-tighter uppercase">TEACHER AI</span>
          </div>

          <div className="hidden xl:flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/5">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id as AppTab)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all ${activeTab === item.id ? 'bg-white/10 text-white border border-white/10 shadow-sm' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
              >
                <item.icon className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">{item.label}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="xl:hidden p-2 text-slate-300 hover:text-white transition-colors">
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Sidebar Menu */}
      <div className={`xl:hidden fixed inset-0 z-[60] transition-all duration-300 ${isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={() => setIsMobileMenuOpen(false)}></div>
        <div className={`absolute ${isAr ? 'left-0' : 'right-0'} top-0 bottom-0 w-[80%] max-w-xs bg-[#0a0a0c] border-x border-white/10 p-6 pt-24 flex flex-col gap-2 transition-transform duration-500 overflow-y-auto ${isMobileMenuOpen ? 'translate-x-0' : (isAr ? '-translate-x-full' : 'translate-x-full')}`}>
          <div className="mb-6 px-4">
             <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em]">Master Navigation</span>
          </div>
          {navItems.map((item) => (
            <button 
              key={item.id} 
              onClick={() => handleTabClick(item.id as AppTab)} 
              className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${activeTab === item.id ? 'bg-indigo-600/20 text-white border border-indigo-500/30 shadow-lg' : 'text-slate-500 hover:bg-white/5'}`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[11px] font-black uppercase tracking-widest">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

export default Navbar;
