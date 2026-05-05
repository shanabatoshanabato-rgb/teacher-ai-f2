
import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, MicOff, Loader2, BookOpen, Sparkles, Brain, X, Headphones, Info, Layers, Zap, ShieldCheck, Search, ChevronRight, PlayCircle, Languages, GraduationCap, WifiOff, Globe, CheckCircle2, HelpCircle, Square, FileUp, FileText, AlertTriangle
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { runPuterAgent, puterVoice, stopPuterVoice, extractPdfText } from '../services/puterCore';

type SessionPhase = 'config' | 'loading' | 'active' | 'quiz' | 'reading';

const TeacherUAEView: React.FC = () => {
  const isAr = document.documentElement.lang === 'ar';
  
  const [grade, setGrade] = useState('');
  const [subject, setSubject] = useState('');
  const [chapter, setChapter] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [history, setHistory] = useState<{ role: string, content: string }[]>([]);
  const [phase, setPhase] = useState<SessionPhase>('config');
  const [sessionLang, setSessionLang] = useState<'ar' | 'en'>(isAr ? 'ar' : 'en');
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  
  const [interactionState, setInteractionState] = useState<'explaining' | 'waiting_for_feedback' | 'quiz_mode'>('explaining');

  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE_MB = 100;

  const grades = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
  
  const subjectsList = sessionLang === 'ar' 
    ? ['اللغة العربية', 'التربية الإسلامية', 'العلوم', 'الرياضيات', 'الفيزياء', 'الكيمياء', 'الأحياء', 'الدراسات الاجتماعية', 'علوم الحاسوب']
    : ['Arabic', 'Islamic Education', 'Science', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Social Studies', 'Computer Science'];

  useEffect(() => {
    // ✅ FIX: correct API name is webkitSpeechRecognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      // ✅ FIX: cleanup old instance to prevent race condition
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (_) {}
      }
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
        }
        if (finalTranscript) {
          setTranscript(finalTranscript);
          if (latestProcessInteraction.current) {
            latestProcessInteraction.current(finalTranscript);
          }
        }
      };

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setErrorStatus(null);
        setTranscript('');
        handleStopVoice(); 
      };

      recognitionRef.current.onend = () => setIsListening(false);

      recognitionRef.current.onerror = (e: any) => {
        setIsListening(false);
        if (e.error === 'network') {
          setErrorStatus(sessionLang === 'ar' ? "فشل الاتصال: تأكد من الإنترنت" : "Connection Failed: Check Internet");
        }
      };
    }

    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (_) {}
      }
    };
  }, [sessionLang]);

  const latestProcessInteraction = useRef<((text: string) => Promise<void>) | null>(null);
  
  useEffect(() => {
    latestProcessInteraction.current = processInteraction;
  });

  const handleStopVoice = () => {
    stopPuterVoice();
    setIsAiSpeaking(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        setErrorStatus(sessionLang === 'ar' ? `حجم الملف كبير جداً!` : `File too large!`);
        setSelectedFile(null);
      } else if (file.type !== 'application/pdf') {
        setErrorStatus(sessionLang === 'ar' ? "يرجى اختيار ملف PDF فقط." : "Please select a PDF file only.");
        setSelectedFile(null);
      } else {
        setErrorStatus(null);
        setSelectedFile(file);
        setExtractedText(''); 
      }
    }
  };

  const handleFetchLesson = async () => {
    if (!grade || !subject || !chapter) return;
    setIsProcessing(true);
    
    let textFromBook = extractedText;
    
    if (selectedFile && !textFromBook) {
      setPhase('reading');
      textFromBook = await extractPdfText(selectedFile);
      setExtractedText(textFromBook);
    }
    
    setPhase('loading');
    
    const arabicSystemWithFile = `أنت 'المعلم الإماراتي الذكي'. لديك محتوى الكتاب المدرسي المدرج أدناه بشكل نصي.
قاعدة ذهبية: لا تقل للطالب أنك لا تستطيع رؤية الملف، لأن النص موجود أمامك الآن بالكامل.
اقرأ النص جيداً واستخدمه لشرح درس "${chapter}". 
اشرح بأسلوب تفاعلي، وابدأ دائماً بترحيب حماسي "يا بطل الإمارات".`;

    const arabicSystemDefault = `أنت 'المعلم الإماراتي الذكي'. تخصصك منهاج الإمارات والبحث الشامل عبر الويب.
قاعدة اللغة الصارمة: يجب أن يكون ردك بالعربية الفصحى فقط وبدون أي كلمة إنجليزية.
ابدأ بترحيب حماسي "يا بطل الإمارات" واشرح الدرس بأسلوب مشوق.`;

    const query = sessionLang === 'ar' 
      ? `يا معلم، اشرح لي الآن درس "${chapter}" مادة "${subject}" لصف "${grade}" من واقع الكتاب الذي قمت بقراءته لك.`
      : `Teacher, explain "${chapter}" in "${subject}", Grade "${grade}" using the textbook content you just read.`;

    try {
      const res = await runPuterAgent(
        query, 
        undefined, 
        undefined, 
        sessionLang, 
        !selectedFile, 
        sessionLang === 'ar' ? (selectedFile ? arabicSystemWithFile : arabicSystemDefault) : undefined,
        selectedFile || undefined,
        [],
        textFromBook || undefined
      );
      
      setAiResponse(res.text);
      setHistory([{ role: 'user', content: query }, { role: 'assistant', content: res.text }]);
      setInteractionState('waiting_for_feedback');
      setPhase('active');
      setSessionActive(true);
      
      setIsAiSpeaking(true);
      await puterVoice(res.text);
    } catch (e) {
      setErrorStatus(sessionLang === 'ar' ? "عذراً، فشل جلب البيانات من الكتاب." : "Failed to fetch data from the book.");
    } finally {
      setIsProcessing(false);
    }
  };

  const processInteraction = async (userSpeech: string) => {
    if (!userSpeech.trim()) return;
    setIsProcessing(true);
    
    const systemInstruction = `
      ROLE: Smart UAE Academic Master. 
      CONTEXT: Textbook content provided.
      RULE: NEVER apologize for not seeing files. The content IS provided in text format.
      
      CORE BEHAVIOR RULES:
      1. IF USER SAYS "I UNDERSTOOD" (فهمت, واضح, تمام):
         - Generate 1 Multiple Choice Question (MCQ) strictly from the provided text.
      
      2. IF USER SAYS "I DID NOT UNDERSTAND" (مفهمتش, ما فهمت):
         - Re-explain using simpler analogies from UAE environment.
    `;

    try {
      const res = await runPuterAgent(
        userSpeech, 
        undefined, 
        undefined, 
        sessionLang, 
        !selectedFile, 
        systemInstruction,
        selectedFile || undefined,
        history,
        extractedText || undefined
      );
      
      setAiResponse(res.text);
      setHistory([...history, { role: 'user', content: userSpeech }, { role: 'assistant', content: res.text }]);
      setIsAiSpeaking(true);
      await puterVoice(res.text);
      
      if (res.text.includes("؟") || res.text.includes("أ)")) setInteractionState('quiz_mode');
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleMic = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setErrorStatus(null);
      handleStopVoice();
      if (recognitionRef.current) {
        recognitionRef.current.lang = sessionLang === 'ar' ? 'ar-SA' : 'en-US';
        try { recognitionRef.current.start(); } catch (e) { recognitionRef.current.stop(); }
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-12 px-6 space-y-12 animate-in fade-in duration-1000">
      <div className="text-center space-y-6">
        <div className="inline-flex items-center justify-center p-6 bg-emerald-600/10 rounded-[2.5rem] border border-emerald-500/20 shadow-2xl relative group">
           <ShieldCheck className="w-16 h-16 text-emerald-400 relative z-10 icon-bob" />
        </div>
        <div>
          <h1 className="text-5xl md:text-8xl font-black text-white tracking-tighter uppercase leading-tight">Teacher AI UAE.</h1>
          <p className="text-emerald-500 font-bold uppercase tracking-[0.4em] text-[10px] mt-2">
            {selectedFile ? (sessionLang === 'ar' ? 'نظام القراءة والتحليل المعمق للكتاب' : 'DEEP BOOK ANALYSIS SYSTEM') : (sessionLang === 'ar' ? 'البحث الشامل ومنهاج الإمارات الذكي' : 'SMART WEB SEARCH & UAE CURRICULUM')}
          </p>
        </div>
      </div>

      {!sessionActive ? (
        <div className="bg-[#111827]/60 border border-white/10 rounded-[3.5rem] p-10 md:p-16 shadow-2xl space-y-12 backdrop-blur-3xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
             <div className="flex flex-col items-center gap-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-emerald-500 flex items-center gap-2">
                   <Globe className="w-3 h-3" />
                   {sessionLang === 'ar' ? 'لغة الجلسة' : 'SESSION LANGUAGE'}
                </label>
                <div className="bg-white/5 p-1 rounded-2xl border border-white/10 flex gap-1">
                   <button onClick={() => setSessionLang('ar')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${sessionLang === 'ar' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>العربية</button>
                   <button onClick={() => setSessionLang('en')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${sessionLang === 'en' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>English</button>
                </div>
             </div>

             <div className="flex flex-col items-center gap-4 w-full md:w-auto">
                <label className="text-[10px] font-black uppercase tracking-widest text-emerald-500 flex items-center gap-2">
                   <FileUp className="w-3 h-3" />
                   {sessionLang === 'ar' ? 'تحميل الكتاب (للقراءة الآلية)' : 'UPLOAD BOOK (AUTO-READ)'}
                </label>
                <button 
                  onClick={() => fileInputRef.current?.click()} 
                  className={`w-full md:w-80 p-4 rounded-2xl border flex items-center justify-center gap-3 transition-all ${selectedFile ? 'bg-emerald-600/20 border-emerald-500 text-white' : 'bg-black/40 border-white/10 text-slate-500 hover:bg-white/5 drop-zone-active'}`}
                >
                   {selectedFile ? <FileText className="w-5 h-5 text-emerald-400" /> : <FileUp className="w-5 h-5" />}
                   <span className="text-[11px] font-black uppercase tracking-widest truncate max-w-[150px]">
                      {selectedFile ? selectedFile.name : (sessionLang === 'ar' ? 'اختر ملف PDF' : 'Select PDF')}
                   </span>
                </button>
                <input type="file" ref={fileInputRef} className="hidden" accept=".pdf" onChange={handleFileChange} />
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <label className="text-[10px] font-black uppercase tracking-widest text-emerald-500 flex items-center gap-2">
                <Layers className="w-3 h-3" />
                {sessionLang === 'ar' ? 'الصف' : 'GRADE'}
              </label>
              <div className="grid grid-cols-4 gap-2">
                {grades.map(g => (
                  <button key={g} onClick={() => setGrade(g)} className={`p-4 rounded-2xl border transition-all font-black text-sm ${grade === g ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg' : 'bg-black/40 border-white/5 text-slate-500 hover:text-white'}`}>{g}</button>
                ))}
              </div>
            </div>
            <div className="space-y-6">
              <label className="text-[10px] font-black uppercase tracking-widest text-emerald-500 flex items-center gap-2">
                <BookOpen className="w-3 h-3" />
                {sessionLang === 'ar' ? 'المادة' : 'SUBJECT'}
              </label>
              <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                {subjectsList.map(s => (
                  <button key={s} onClick={() => setSubject(s)} className={`p-4 rounded-2xl border text-right transition-all font-bold text-sm ${subject === s ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg' : 'bg-black/40 border-white/5 text-slate-400 hover:text-white'}`}>{s}</button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <label className="text-[10px] font-black uppercase tracking-widest text-emerald-500 flex items-center gap-2">
              <Search className="w-3 h-3" />
              {sessionLang === 'ar' ? 'اسم الدرس من الكتاب' : 'LESSON FROM BOOK'}
            </label>
            <input type="text" value={chapter} onChange={(e) => setChapter(e.target.value)} placeholder={sessionLang === 'ar' ? "مثال: مسبار الأمل أو الطاقة المتجددة" : "e.g. Hope Probe or Renewables"} className={`input-glow w-full bg-black/40 border border-white/10 rounded-[2rem] p-8 text-2xl text-white outline-none focus:border-emerald-500 transition-all ${sessionLang === 'ar' ? 'text-right' : 'text-left'}`} dir={sessionLang === 'ar' ? 'rtl' : 'ltr'} />
          </div>

          <button onClick={handleFetchLesson} disabled={!grade || !subject || !chapter || isProcessing} className="btn-emerald-glow shimmer-sweep w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-20 text-white font-black py-10 rounded-[3rem] text-3xl uppercase shadow-2xl flex items-center justify-center gap-4 transition-transform active:scale-95">
            {isProcessing ? <Loader2 className="w-10 h-10 animate-spin" /> : <Zap className="w-10 h-10 fill-current" />}
            {sessionLang === 'ar' ? (selectedFile ? 'قراءة وتحليل الكتاب فوراً' : 'بدء التعلم الشامل') : (selectedFile ? 'READ & ANALYZE BOOK NOW' : 'START COMPREHENSIVE STUDY')}
          </button>
        </div>
      ) : (
        <div className="bg-[#050505] border border-white/10 rounded-[4rem] p-12 shadow-2xl min-h-[850px] flex flex-col relative overflow-hidden backdrop-blur-xl">
           <div className="absolute top-10 left-10 flex items-center gap-4">
              <div className="w-4 h-4 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.5)]"></div>
              <span className="text-[11px] font-black text-emerald-500 uppercase tracking-widest">
                {selectedFile ? (sessionLang === 'ar' ? 'المعلم يقرأ الكتاب الآن' : 'AI READING BOOK') : (sessionLang === 'ar' ? 'شرح ذكي' : 'SMART TEACHING')}
              </span>
           </div>
           
           <button onClick={() => { handleStopVoice(); setSessionActive(false); }} className="absolute top-10 right-10 p-5 bg-white/5 rounded-[1.5rem] text-slate-500 hover:text-white transition-all"><X className="w-6 h-6" /></button>

           <div className="flex-1 flex flex-col items-center justify-between w-full pt-20 pb-8">
              <div className="flex flex-col items-center gap-8">
                 <div className={`w-56 h-56 md:w-72 md:h-72 rounded-full border-4 flex items-center justify-center transition-all duration-700 ${isListening ? 'border-red-500 bg-red-500/5 scale-110 shadow-lg' : isProcessing ? 'border-emerald-500 bg-emerald-500/5 animate-pulse' : 'border-white/10 bg-white/5 shadow-inner'}`}>
                    {interactionState === 'quiz_mode' ? <GraduationCap className="w-24 h-24 md:w-32 md:h-32 text-indigo-400" /> : <ShieldCheck className="w-24 h-24 md:w-32 md:h-32 transition-colors ${isListening ? 'text-red-500' : 'text-emerald-400'}" />}
                 </div>
                 <h2 className="text-3xl font-black text-white uppercase tracking-tighter text-center">
                   {phase === 'reading' ? (sessionLang === 'ar' ? 'جاري تحويل صفحات الكتاب لنص...' : 'CONVERTING BOOK TO TEXT...') : 
                    isProcessing ? (sessionLang === 'ar' ? 'جاري تحليل النص المستخرج...' : 'ANALYZING EXTRACTED TEXT...') : 
                    isListening ? (sessionLang === 'ar' ? 'أسمعك يا بطل...' : 'LISTENING...') : 
                    (sessionLang === 'ar' ? `درس: ${chapter}` : `Topic: ${chapter}`)}
                 </h2>
              </div>

              <div className="w-full max-w-4xl space-y-8">
                 <div className="bg-white/5 p-8 rounded-[3rem] border border-white/10 min-h-[120px] flex items-center justify-center shadow-inner relative group">
                    <p className={`text-slate-400 text-2xl font-medium italic text-center ${sessionLang === 'ar' ? 'text-right w-full font-arabic' : ''}`} dir={sessionLang === 'ar' ? 'rtl' : 'ltr'}>
                       {transcript || (sessionLang === 'ar' ? "تحدث الآن، أنا أعتمد على نص الكتاب تماماً..." : "Speak now, I'm relying on the textbook content...")}
                    </p>
                 </div>

                 {aiResponse && !isListening && (
                   <div className="bg-emerald-600/10 border border-emerald-500/20 p-12 rounded-[3.5rem] space-y-8 pop-in shadow-2xl relative overflow-hidden">
                      {isAiSpeaking && (
                         <button onClick={handleStopVoice} className="absolute top-6 left-6 z-10 p-3 bg-red-600 hover:bg-red-500 text-white rounded-xl flex items-center gap-2">
                            <Square size={12} fill="white" />
                            <span className="text-[10px] font-black uppercase tracking-widest">{sessionLang === 'ar' ? 'إيقاف' : 'STOP'}</span>
                         </button>
                      )}
                      <div className="flex items-start gap-8">
                        <div className={`p-5 rounded-2xl shrink-0 ${interactionState === 'quiz_mode' ? 'bg-indigo-600/20' : 'bg-emerald-600/20'}`}>
                          {interactionState === 'quiz_mode' ? <HelpCircle className="w-10 h-10 text-indigo-400" /> : <ShieldCheck className="w-10 h-10 text-emerald-400" />}
                        </div>
                        <div className={`text-emerald-100 font-medium text-2xl md:text-3xl leading-relaxed prose prose-emerald prose-invert max-w-none ${sessionLang === 'ar' ? 'text-right w-full font-arabic' : 'text-left'}`} dir={sessionLang === 'ar' ? 'rtl' : 'ltr'}>
                           <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{aiResponse}</ReactMarkdown>
                        </div>
                      </div>
                   </div>
                 )}
              </div>

              <div className="w-full flex flex-col items-center gap-8 pt-12">
                <button onClick={toggleMic} disabled={isProcessing} className={`btn-emerald-glow w-36 h-36 rounded-full flex items-center justify-center transition-all shadow-2xl active:scale-90 z-50 ${isListening ? 'bg-red-500 shadow-red-500/40' : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/40'}`}>
                  {isListening ? <MicOff className="w-16 h-16 text-white" /> : <Mic className="w-16 h-16 text-white" />}
                </button>
                <span className="text-sm font-black text-slate-500 uppercase tracking-[0.5em]">{isListening ? (sessionLang === 'ar' ? 'أسمعك...' : 'LISTENING...') : (sessionLang === 'ar' ? 'انقر للتحدث' : 'TAP TO TALK')}</span>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default TeacherUAEView;
