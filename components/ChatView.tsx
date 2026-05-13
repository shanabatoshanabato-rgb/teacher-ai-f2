
import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, User, Bot, Loader2, Image as ImageIcon, X, 
  BrainCircuit, MessageSquare, Plus, Trash2, Edit3, 
  ChevronLeft, ChevronRight, Check, Search, Settings2, MoreHorizontal, LayoutPanelLeft
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { runPuterAgent } from '../services/puterCore';
import { ChatMessage, ChatSession } from '../types';

const ChatView: React.FC = () => {
  const isAr = document.documentElement.lang === 'ar';
  
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem('teacher_ai_chat_sessions');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeSessionId, setActiveSessionId] = useState<string | null>(() => {
    const saved = localStorage.getItem('teacher_ai_chat_sessions');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.length > 0 ? parsed[0].id : null;
    }
    return null;
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const [input, setInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem('teacher_ai_chat_sessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [sessions, activeSessionId, isProcessing]);

  const activeSession = sessions.find(s => s.id === activeSessionId) || null;
  const messages = activeSession ? activeSession.messages : [];

  const createNewChat = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: isAr ? 'محادثة جديدة' : 'New Chat',
      messages: [],
      timestamp: Date.now(),
    };
    setSessions([newSession, ...sessions]);
    setActiveSessionId(newSession.id);
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  };

  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = sessions.filter(s => s.id !== id);
    setSessions(updated);
    if (activeSessionId === id) {
      setActiveSessionId(updated.length > 0 ? updated[0].id : null);
    }
  };

  const handleSend = async () => {
    if (!input.trim() && !selectedImage) return;

    let currentSessionId = activeSessionId;
    if (!currentSessionId) {
      const newSession: ChatSession = {
        id: Date.now().toString(),
        title: input.slice(0, 30) || (isAr ? 'محادثة جديدة' : 'New Chat'),
        messages: [],
        timestamp: Date.now(),
      };
      setSessions([newSession, ...sessions]);
      setActiveSessionId(newSession.id);
      currentSessionId = newSession.id;
    }

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      image: selectedImage || undefined,
      timestamp: Date.now(),
    };

    // تجهيز التاريخ قبل إرسال الرسالة الجديدة لتضمينه في الطلب
    const currentHistory = messages.map(m => ({ role: m.role, content: m.content }));

    setSessions(prev => prev.map(s => 
      s.id === currentSessionId 
        ? { ...s, messages: [...s.messages, userMsg], title: s.messages.length === 0 ? input.slice(0, 30) : s.title }
        : s
    ));

    const currentInput = input;
    const currentImg = selectedImage;
    setInput('');
    setSelectedImage(null);
    setIsProcessing(true);

    try {
      // إرسال التاريخ مع الرسالة الجديدة لضمان الربط
      const response = await runPuterAgent(
        currentInput, 
        currentImg || undefined, 
        undefined, 
        'ar', 
        true, 
        undefined, 
        undefined, 
        currentHistory
      );
      
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.text,
        timestamp: Date.now(),
      };
      setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, assistantMsg] } : s));
    } catch (e) {
      const errorMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: isAr ? "⚠️ عذراً، فشل المحرك الشامل." : "⚠️ Master Core failed.",
        timestamp: Date.now(),
      };
      setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, errorMsg] } : s));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex h-full w-full bg-[#050507] overflow-hidden relative">
      
      {/* Mobile Overlay */}
      {isSidebarOpen && window.innerWidth < 1024 && (
        <div className="mobile-overlay" onClick={() => setIsSidebarOpen(false)}></div>
      )}

      {/* Sidebar */}
      <aside 
        className={`sidebar-transition fixed lg:relative z-40 flex flex-col bg-[#0a0a0c] border-x border-white/5 shadow-2xl h-full ${isSidebarOpen ? 'w-[85%] sm:w-80 translate-x-0' : 'w-0 -translate-x-full lg:translate-x-0 overflow-hidden opacity-0 lg:w-0'}`}
        dir={isAr ? 'rtl' : 'ltr'}
      >
        <div className="flex flex-col h-full w-full sm:w-80">
          <div className="p-4 sm:p-6 border-b border-white/5">
            <button 
              onClick={createNewChat}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 group"
            >
              <Plus size={18} />
              <span className="text-[10px] font-black uppercase tracking-widest">{isAr ? 'محادثة جديدة' : 'NEW CHAT'}</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
            {sessions.map((session) => (
              <div 
                key={session.id}
                onClick={() => {
                  setActiveSessionId(session.id);
                  if(window.innerWidth < 1024) setIsSidebarOpen(false);
                }}
                className={`group p-3 sm:p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${activeSessionId === session.id ? 'bg-indigo-600/10 border-indigo-500/30 text-white' : 'bg-transparent border-transparent text-slate-500 hover:bg-white/5'}`}
              >
                <div className="flex items-center gap-3 truncate">
                  <MessageSquare size={14} className={activeSessionId === session.id ? 'text-indigo-400' : 'text-slate-600'} />
                  <span className="text-[11px] font-bold truncate">{session.title}</span>
                </div>
                <button onClick={(e) => deleteSession(session.id, e)} className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-all"><Trash2 size={12} /></button>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Improved Handle Toggle */}
      <div 
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className={`sidebar-handle hidden lg:block ${isSidebarOpen ? (isAr ? '-mr-2' : '-ml-2') : (isAr ? 'right-0' : 'left-0')} flex items-center justify-center text-indigo-400`}
        style={{ top: '50%', transform: 'translateY(-50%)', [isAr ? 'right' : 'left']: isSidebarOpen ? '320px' : '0' }}
      >
        {isAr ? (isSidebarOpen ? <ChevronRight size={10} /> : <ChevronLeft size={10} />) : (isSidebarOpen ? <ChevronLeft size={10} /> : <ChevronRight size={10} />)}
      </div>

      {/* Main Chat Area */}
<div className="flex-1 flex flex-col h-full overflow-hidden relative min-h-0">
        
        {/* Mobile Sidebar Toggle Button */}
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className={`lg:hidden absolute top-4 ${isAr ? 'right-4' : 'left-4'} z-30 p-3 bg-[#111827] border border-white/10 rounded-xl text-indigo-400 shadow-xl ${isSidebarOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        >
          <LayoutPanelLeft size={20} />
        </button>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 sm:px-8 md:px-20 lg:px-32 xl:px-64 py-20 space-y-8 scrollbar-thin">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-xl mx-auto space-y-8 px-4">
              <div className="p-6 bg-indigo-600/10 rounded-[2.5rem] border border-indigo-500/20 shadow-2xl animate-bounce-slow">
                 <BrainCircuit className="w-12 h-12 text-indigo-400" />
              </div>
              <div className="space-y-3">
                <h2 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tighter">{isAr ? 'المعلم الشامل' : 'Master Tutor.'}</h2>
                <p className="text-slate-500 text-xs sm:text-base font-medium">{isAr ? 'اطرح أي سؤال تعليمي وسأجيبك بدقة المحرك الشامل.' : 'Ask any educational question and I will answer with Master logic.'}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                {[{t: "شرح الجاذبية", e: "Explain Gravity"}, {t: "قواعد النحو", e: "Arabic Grammar"}].map((item, i) => (
                  <button key={i} onClick={() => setInput(item.t)} className="p-4 bg-white/5 border border-white/5 rounded-2xl text-[10px] font-black uppercase text-slate-400 hover:text-white hover:border-indigo-500/30 transition-all">
                    {isAr ? item.t : item.e}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`msg-enter flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-3 sm:gap-5 max-w-[92%] sm:max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 border ${msg.role === 'user' ? 'bg-indigo-600 border-indigo-400' : 'bg-black border-white/10 text-indigo-400'}`}>
                    {msg.role === 'user' ? <User size={18} className="text-white" /> : <Bot size={22} />}
                  </div>
                  <div className={`flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    {msg.image && <img src={msg.image} className="max-w-[200px] sm:max-w-md rounded-2xl border border-white/5 shadow-xl" alt="Preview" />}
                    <div className={`px-5 py-4 sm:px-8 sm:py-6 rounded-2xl sm:rounded-[2.5rem] prose prose-invert max-w-none text-sm sm:text-lg leading-relaxed ${msg.role === 'user' ? 'bg-indigo-600/10 border border-indigo-500/20' : 'bg-[#0a0a0c] border border-white/5'}`}>
                      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{msg.content}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
          {isProcessing && (
            <div className="flex justify-start msg-enter">
              <div className="bg-[#0a0a0c] border border-white/5 px-6 py-4 rounded-2xl flex items-center gap-4">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-indigo-400 rounded-full typing-dot-1"></div>
                  <div className="w-2 h-2 bg-indigo-400 rounded-full typing-dot-2"></div>
                  <div className="w-2 h-2 bg-indigo-400 rounded-full typing-dot-3"></div>
                </div>
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{isAr ? 'تفكير شامل...' : 'MASTER THINKING...'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 sm:p-8 bg-black/40 backdrop-blur-2xl border-t border-white/5">
          <div className="max-w-5xl mx-auto relative flex flex-col gap-4">
            {selectedImage && (
              <div className="absolute bottom-[calc(100%+12px)] left-0">
                <div className="relative group">
                  <img src={selectedImage} className="w-20 h-20 sm:w-32 sm:h-32 object-cover rounded-xl border-2 border-indigo-500 shadow-2xl" alt="Preview" />
                  <button onClick={() => setSelectedImage(null)} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full"><X size={12} /></button>
                </div>
              </div>
            )}
            <div className="input-glow flex items-center bg-[#0a0a0c] border border-white/10 rounded-[2rem] sm:rounded-[3rem] p-2 sm:p-3 shadow-2xl focus-within:border-indigo-500/50 group transition-all">
              <button onClick={() => fileInputRef.current?.click()} className="p-3 sm:p-5 text-slate-500 hover:text-indigo-400 transition-colors"><ImageIcon size={20} className="icon-bob" /></button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  const r = new FileReader();
                  r.onloadend = () => setSelectedImage(r.result as string);
                  r.readAsDataURL(f);
                }
              }} />
              <input 
                type="text" 
                value={input} 
                onChange={(e) => setInput(e.target.value)} 
                onKeyDown={(e) => e.key === 'Enter' && handleSend()} 
                placeholder={isAr ? "اسأل المعلم الشامل..." : "Ask Master Tutor..."} 
                className={`flex-1 bg-transparent py-3 sm:py-5 px-3 sm:px-6 text-white outline-none placeholder:text-slate-800 text-base sm:text-xl ${isAr ? 'text-right' : 'text-left'}`} 
                dir={isAr ? 'rtl' : 'ltr'} 
              />
              <button 
                onClick={handleSend} 
                disabled={isProcessing || (!input.trim() && !selectedImage)} 
                className="bg-indigo-600 hover:bg-indigo-500 text-white p-3 sm:p-5 rounded-full sm:rounded-[2.5rem] disabled:opacity-20 transition-all shadow-xl active:scale-95"
              >
                <Send size={20} />
              </button>
            </div>
            <p className="text-center text-[8px] font-black text-slate-600 uppercase tracking-widest">Master Logic Engine 5.2</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatView;
