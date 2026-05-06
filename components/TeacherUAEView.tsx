
import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, MicOff, Loader2, BookOpen, X, Layers, Zap, ShieldCheck, Search,
  GraduationCap, Globe, CheckCircle2, HelpCircle, Square, FileUp, FileText, AlertTriangle
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { runPuterAgent, puterVoice, stopPuterVoice, extractPdfText } from '../services/puterCore';

// ── Types ─────────────────────────────────────────────────────────
type SessionPhase =
  | 'config' | 'loading' | 'active' | 'reading'
  | 'quiz_prompt'
  | 'mini_quiz'  | 'mini_result'
  | 'full_quiz'  | 'full_result';

interface QuizQuestion {
  question: string;
  options: string[];   // ["A) ...", "B) ...", "C) ...", "D) ..."]
  answer: string;      // "A" | "B" | "C" | "D"
}

// ─────────────────────────────────────────────────────────────────
const TeacherUAEView: React.FC = () => {
  const isAr = document.documentElement.lang === 'ar';

  // ── Lesson config ──────────────────────────────────────────────
  const [grade,        setGrade]        = useState('');
  const [subject,      setSubject]      = useState('');
  const [chapter,      setChapter]      = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractedText,setExtractedText]= useState<string>('');

  // ── Session state ──────────────────────────────────────────────
  const [isProcessing,  setIsProcessing]  = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [isListening,   setIsListening]   = useState(false);
  const [isAiSpeaking,  setIsAiSpeaking]  = useState(false);
  const [transcript,    setTranscript]    = useState('');
  const [aiResponse,    setAiResponse]    = useState('');
  const [history,       setHistory]       = useState<{ role: string; content: string }[]>([]);
  const [phase,         setPhase]         = useState<SessionPhase>('config');
  const [sessionLang,   setSessionLang]   = useState<'ar' | 'en'>(isAr ? 'ar' : 'en');
  const [errorStatus,   setErrorStatus]   = useState<string | null>(null);
  const [interactionState, setInteractionState] = useState<'explaining' | 'waiting_for_feedback' | 'quiz_mode'>('explaining');
  const [lessonDone, setLessonDone] = useState(false); // true after initial explanation finishes

  // ── Quiz state ─────────────────────────────────────────────────
  const [quizQuestions,  setQuizQuestions]  = useState<QuizQuestion[]>([]);
  const [currentQIndex,  setCurrentQIndex]  = useState(0);
  const [studentAnswers, setStudentAnswers] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [quizLoading,    setQuizLoading]    = useState(false);
  const [quizError,      setQuizError]      = useState('');
  const [quizType,       setQuizType]       = useState<'mini' | 'full'>('mini');

  // ── Refs ───────────────────────────────────────────────────────
  const recognitionRef       = useRef<any>(null);
  const fileInputRef         = useRef<HTMLInputElement>(null);
  const isProcessingRef      = useRef(false);
  const MAX_FILE_SIZE_MB     = 100;

  // ── Helpers ────────────────────────────────────────────────────
  const grades       = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
  const subjectsList = sessionLang === 'ar'
    ? ['اللغة العربية', 'التربية الإسلامية', 'العلوم', 'الرياضيات', 'الفيزياء', 'الكيمياء', 'الأحياء', 'الدراسات الاجتماعية', 'علوم الحاسوب']
    : ['Arabic', 'Islamic Education', 'Science', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Social Studies', 'Computer Science'];

  const tx = (ar: string, en: string) => sessionLang === 'ar' ? ar : en;

  // ── SpeechRecognition setup (unchanged) ───────────────────────
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      if (recognitionRef.current) { try { recognitionRef.current.abort(); } catch (_) {} }
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous     = false;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
        }
        if (finalTranscript) {
          setTranscript(finalTranscript);
          if (latestProcessInteraction.current) latestProcessInteraction.current(finalTranscript);
        }
      };
      recognitionRef.current.onstart  = () => { setIsListening(true); setErrorStatus(null); setTranscript(''); handleStopVoice(); };
      recognitionRef.current.onend    = () => setIsListening(false);
      recognitionRef.current.onerror  = (e: any) => {
        setIsListening(false);
        if (e.error === 'network') setErrorStatus(tx('فشل الاتصال: تأكد من الإنترنت', 'Connection Failed: Check Internet'));
      };
    }
    return () => { if (recognitionRef.current) { try { recognitionRef.current.abort(); } catch (_) {} } };
  }, [sessionLang]);

  const latestProcessInteraction = useRef<((text: string) => Promise<void>) | null>(null);
  useEffect(() => { latestProcessInteraction.current = processInteraction; });

  const handleStopVoice = () => { stopPuterVoice(); setIsAiSpeaking(false); };

  // ── File handling (unchanged) ──────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setErrorStatus(tx('حجم الملف كبير جداً!', 'File too large!')); setSelectedFile(null);
    } else if (file.type !== 'application/pdf') {
      setErrorStatus(tx('يرجى اختيار ملف PDF فقط.', 'Please select a PDF file only.')); setSelectedFile(null);
    } else {
      setErrorStatus(null); setSelectedFile(file); setExtractedText('');
    }
  };

  // ── Lesson fetch (unchanged, + quiz_prompt trigger) ───────────
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
        query, undefined, undefined, sessionLang, !selectedFile,
        sessionLang === 'ar' ? (selectedFile ? arabicSystemWithFile : arabicSystemDefault) : undefined,
        selectedFile || undefined, [], textFromBook || undefined
      );
      setAiResponse(res.text);
      setHistory([{ role: 'user', content: query }, { role: 'assistant', content: res.text }]);
      setInteractionState('waiting_for_feedback');
      setPhase('active');
      setSessionActive(true);
      setIsAiSpeaking(true);
      await puterVoice(res.text);
      setIsAiSpeaking(false);
      setLessonDone(true); // ← user must manually start quiz when ready
    } catch {
      setErrorStatus(tx('عذراً، فشل جلب البيانات من الكتاب.', 'Failed to fetch data from the book.'));
      setPhase('config');
    } finally {
      setIsProcessing(false);
    }
  };

  // ── Voice interaction (unchanged) ─────────────────────────────
  const processInteraction = async (userSpeech: string) => {
    if (!userSpeech.trim()) return;
    setIsProcessing(true);
    const systemInstruction = `
      ROLE: Smart UAE Academic Master. 
      CONTEXT: Textbook content provided.
      RULE: NEVER apologize for not seeing files. The content IS provided in text format.
      CORE BEHAVIOR RULES:
      1. IF USER SAYS "I UNDERSTOOD" (فهمت, واضح, تمام): Generate 1 MCQ strictly from the provided text.
      2. IF USER SAYS "I DID NOT UNDERSTAND" (مفهمتش, ما فهمت): Re-explain using simpler analogies from UAE environment.
    `;
    try {
      const res = await runPuterAgent(
        userSpeech, undefined, undefined, sessionLang, !selectedFile,
        systemInstruction, selectedFile || undefined, history, extractedText || undefined
      );
      setAiResponse(res.text);
      setHistory([...history, { role: 'user', content: userSpeech }, { role: 'assistant', content: res.text }]);
      setIsAiSpeaking(true);
      await puterVoice(res.text);
      setIsAiSpeaking(false);
      if (res.text.includes('؟') || res.text.includes('أ)')) setInteractionState('quiz_mode');
    } catch (e) {
      console.error(e);
      setErrorStatus(tx('فشل الرد. حاول مجدداً.', 'Response failed. Try again.'));
    } finally { setIsProcessing(false); }
  };

  const toggleMic = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setErrorStatus(null); handleStopVoice();
      if (recognitionRef.current) {
        recognitionRef.current.lang = sessionLang === 'ar' ? 'ar-SA' : 'en-US';
        try { recognitionRef.current.start(); } catch { recognitionRef.current.stop(); }
      }
    }
  };

  // ── Generate quiz ──────────────────────────────────────────────
  const generateQuiz = async (type: 'mini' | 'full') => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    setQuizLoading(true); setQuizError(''); setQuizType(type);
    const count = type === 'mini' ? 5 : 12;
    const lessonContent = `${aiResponse}\n\n${extractedText}`.trim();
    const prompt = `Generate exactly ${count} multiple choice questions based on this lesson content.
Return ONLY a valid JSON array with no markdown, no explanation, no code blocks.
Format: [{"question":"...","options":["A) ...","B) ...","C) ...","D) ..."],"answer":"A"}]
Lesson content: ${lessonContent}`;
    try {
      const res = await runPuterAgent(
        prompt, undefined, undefined, sessionLang, false,
        'You are a quiz generator. Return ONLY a valid JSON array. No markdown. No explanation. No backticks.',
        undefined, [], undefined
      );
      const clean = res.text.replace(/```json|```/g, '').trim();
      const parsed: QuizQuestion[] = JSON.parse(clean);
      setQuizQuestions(parsed);
      setCurrentQIndex(0); setStudentAnswers([]); setSelectedOption(null);
      setPhase(type === 'mini' ? 'mini_quiz' : 'full_quiz');
    } catch {
      setQuizError(tx('فشل توليد الأسئلة. اضغط "إعادة المحاولة".', 'Failed to generate questions. Please retry.'));
    } finally {
      setQuizLoading(false); isProcessingRef.current = false;
    }
  };

  // ── Answer handler ─────────────────────────────────────────────
  const handleAnswer = (letter: string) => {
    if (selectedOption) return;
    setSelectedOption(letter);
    const newAnswers = [...studentAnswers, letter];
    setStudentAnswers(newAnswers);
    if (currentQIndex + 1 === quizQuestions.length) {
      setTimeout(() => evaluateQuiz(newAnswers), 1400);
    }
  };

  const handleNextQuestion = () => { setSelectedOption(null); setCurrentQIndex(p => p + 1); };

  // ── Evaluate ───────────────────────────────────────────────────
  const evaluateQuiz = async (answers: string[]) => {
    const score = answers.filter((a, i) => a === quizQuestions[i]?.answer).length;
    const wrongQs = quizQuestions
      .filter((q, i) => answers[i] !== q.answer)
      .map(q => q.question).join('\n');

    if (quizType === 'mini') {
      if (score >= 4) {
        setPhase('mini_result');
      } else {
        setQuizLoading(true);
        try {
          const res = await runPuterAgent(
            tx(`الطالب أخطأ في هذه الأسئلة:\n${wrongQs}\nاشرح له الإجابات الصحيحة بأسلوب بسيط.`,
               `The student got these wrong:\n${wrongQs}\nExplain the correct answers simply.`),
            undefined, undefined, sessionLang, false, undefined, undefined, history, extractedText
          );
          setAiResponse(res.text);
          setHistory(prev => [...prev, { role: 'assistant', content: res.text }]);
          setPhase('active');
          setIsAiSpeaking(true);
          await puterVoice(res.text);
          setIsAiSpeaking(false);
          setLessonDone(true);
        } finally { setQuizLoading(false); }
      }
    } else {
      if (score >= 7) {
        setPhase('full_result');
      } else {
        setQuizLoading(true);
        try {
          const res = await runPuterAgent(
            tx(`الطالب لم يتقن هذه النقاط:\n${wrongQs}\nأعد شرحها بالتفصيل.`,
               `Student struggled with:\n${wrongQs}\nRe-explain in detail.`),
            undefined, undefined, sessionLang, false, undefined, undefined, history, extractedText
          );
          setAiResponse(res.text);
          setHistory(prev => [...prev, { role: 'assistant', content: res.text }]);
          setPhase('active');
          setIsAiSpeaking(true);
          await puterVoice(res.text);
          setIsAiSpeaking(false);
          setLessonDone(true);
        } finally { setQuizLoading(false); }
      }
    }
  };

  // ── Reset everything ───────────────────────────────────────────
  const fullReset = () => {
    handleStopVoice();
    setLessonDone(false);
    setPhase('config'); setSessionActive(false);
    setHistory([]); setAiResponse(''); setTranscript('');
    setQuizQuestions([]); setStudentAnswers([]); setSelectedOption(null);
    setQuizError(''); setCurrentQIndex(0);
  };

  // ════════════════════════════════════════════════════════════════
  // JSX
  // ════════════════════════════════════════════════════════════════
  return (
    <div className="max-w-6xl mx-auto py-12 px-6 space-y-12 animate-in fade-in duration-1000">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="text-center space-y-6">
        <div className="inline-flex items-center justify-center p-6 bg-emerald-600/10 rounded-[2.5rem] border border-emerald-500/20 shadow-2xl relative group">
          <ShieldCheck className="w-16 h-16 text-emerald-400 relative z-10 icon-bob" />
        </div>
        <div>
          <h1 className="text-5xl md:text-8xl font-black text-white tracking-tighter uppercase leading-tight">Teacher AI UAE.</h1>
          <p className="text-emerald-500 font-bold uppercase tracking-[0.4em] text-[10px] mt-2">
            {selectedFile
              ? tx('نظام القراءة والتحليل المعمق للكتاب', 'DEEP BOOK ANALYSIS SYSTEM')
              : tx('البحث الشامل ومنهاج الإمارات الذكي', 'SMART WEB SEARCH & UAE CURRICULUM')}
          </p>
        </div>
      </div>

      {/* ── Config screen ──────────────────────────────────────── */}
      {!sessionActive ? (
        <div className="bg-[#111827]/60 border border-white/10 rounded-[3.5rem] p-10 md:p-16 shadow-2xl space-y-12 backdrop-blur-3xl relative overflow-hidden">

          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            {/* Language toggle */}
            <div className="flex flex-col items-center gap-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-emerald-500 flex items-center gap-2">
                <Globe className="w-3 h-3" />{tx('لغة الجلسة', 'SESSION LANGUAGE')}
              </label>
              <div className="bg-white/5 p-1 rounded-2xl border border-white/10 flex gap-1">
                <button onClick={() => setSessionLang('ar')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${sessionLang === 'ar' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>العربية</button>
                <button onClick={() => setSessionLang('en')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${sessionLang === 'en' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>English</button>
              </div>
            </div>

            {/* PDF upload */}
            <div className="flex flex-col items-center gap-4 w-full md:w-auto">
              <label className="text-[10px] font-black uppercase tracking-widest text-emerald-500 flex items-center gap-2">
                <FileUp className="w-3 h-3" />{tx('تحميل الكتاب (للقراءة الآلية)', 'UPLOAD BOOK (AUTO-READ)')}
              </label>
              <button
                onClick={() => fileInputRef.current?.click()}
                className={`w-full md:w-80 p-4 rounded-2xl border flex items-center justify-center gap-3 transition-all ${selectedFile ? 'bg-emerald-600/20 border-emerald-500 text-white' : 'bg-black/40 border-white/10 text-slate-500 hover:bg-white/5'}`}
              >
                {selectedFile ? <FileText className="w-5 h-5 text-emerald-400" /> : <FileUp className="w-5 h-5" />}
                <span className="text-[11px] font-black uppercase tracking-widest truncate max-w-[150px]">
                  {selectedFile ? selectedFile.name : tx('اختر ملف PDF', 'Select PDF')}
                </span>
              </button>
              <input type="file" ref={fileInputRef} className="hidden" accept=".pdf" onChange={handleFileChange} />
            </div>
          </div>

          {errorStatus && (
            <div className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-red-600/10 border border-red-500/20 text-red-400 text-sm font-bold">
              <AlertTriangle className="w-4 h-4 shrink-0" />{errorStatus}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Grade */}
            <div className="space-y-6">
              <label className="text-[10px] font-black uppercase tracking-widest text-emerald-500 flex items-center gap-2">
                <Layers className="w-3 h-3" />{tx('الصف', 'GRADE')}
              </label>
              <div className="grid grid-cols-4 gap-2">
                {grades.map(g => (
                  <button key={g} onClick={() => setGrade(g)} className={`p-4 rounded-2xl border transition-all font-black text-sm ${grade === g ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg' : 'bg-black/40 border-white/5 text-slate-500 hover:text-white'}`}>{g}</button>
                ))}
              </div>
            </div>
            {/* Subject */}
            <div className="space-y-6">
              <label className="text-[10px] font-black uppercase tracking-widest text-emerald-500 flex items-center gap-2">
                <BookOpen className="w-3 h-3" />{tx('المادة', 'SUBJECT')}
              </label>
              <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                {subjectsList.map(s => (
                  <button key={s} onClick={() => setSubject(s)} className={`p-4 rounded-2xl border text-right transition-all font-bold text-sm ${subject === s ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg' : 'bg-black/40 border-white/5 text-slate-400 hover:text-white'}`}>{s}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Chapter */}
          <div className="space-y-6">
            <label className="text-[10px] font-black uppercase tracking-widest text-emerald-500 flex items-center gap-2">
              <Search className="w-3 h-3" />{tx('اسم الدرس من الكتاب', 'LESSON FROM BOOK')}
            </label>
            <input
              type="text" value={chapter} onChange={e => setChapter(e.target.value)}
              placeholder={tx('مثال: مسبار الأمل أو الطاقة المتجددة', 'e.g. Hope Probe or Renewables')}
              className={`input-glow w-full bg-black/40 border border-white/10 rounded-[2rem] p-8 text-2xl text-white outline-none focus:border-emerald-500 transition-all ${sessionLang === 'ar' ? 'text-right' : 'text-left'}`}
              dir={sessionLang === 'ar' ? 'rtl' : 'ltr'}
            />
          </div>

          <button onClick={handleFetchLesson} disabled={!grade || !subject || !chapter || isProcessing}
            className="btn-emerald-glow shimmer-sweep w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-20 text-white font-black py-10 rounded-[3rem] text-3xl uppercase shadow-2xl flex items-center justify-center gap-4 transition-transform active:scale-95">
            {isProcessing ? <Loader2 className="w-10 h-10 animate-spin" /> : <Zap className="w-10 h-10 fill-current" />}
            {tx(selectedFile ? 'قراءة وتحليل الكتاب فوراً' : 'بدء التعلم الشامل', selectedFile ? 'READ & ANALYZE BOOK NOW' : 'START COMPREHENSIVE STUDY')}
          </button>
        </div>

      ) : (
        /* ── Active session ──────────────────────────────────── */
        <div className="bg-[#050505] border border-white/10 rounded-[4rem] p-12 shadow-2xl min-h-[850px] flex flex-col relative overflow-hidden backdrop-blur-xl">
          <div className="absolute top-10 left-10 flex items-center gap-4">
            <div className="w-4 h-4 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
            <span className="text-[11px] font-black text-emerald-500 uppercase tracking-widest">
              {selectedFile ? tx('المعلم يقرأ الكتاب الآن', 'AI READING BOOK') : tx('شرح ذكي', 'SMART TEACHING')}
            </span>
          </div>
          <button onClick={fullReset}
            className="absolute top-10 right-10 p-5 bg-white/5 rounded-[1.5rem] text-slate-500 hover:text-white transition-all">
            <X className="w-6 h-6" />
          </button>

          <div className="flex-1 flex flex-col items-center justify-between w-full pt-20 pb-8">
            <div className="flex flex-col items-center gap-8">
              <div className={`w-56 h-56 md:w-72 md:h-72 rounded-full border-4 flex items-center justify-center transition-all duration-700 ${isListening ? 'border-red-500 bg-red-500/5 scale-110 shadow-lg' : isProcessing ? 'border-emerald-500 bg-emerald-500/5 animate-pulse' : 'border-white/10 bg-white/5 shadow-inner'}`}>
                {interactionState === 'quiz_mode'
                  ? <GraduationCap className="w-24 h-24 md:w-32 md:h-32 text-indigo-400" />
                  : <ShieldCheck className={`w-24 h-24 md:w-32 md:h-32 transition-colors ${isListening ? 'text-red-500' : 'text-emerald-400'}`} />}
              </div>
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter text-center">
                {phase === 'reading'  ? tx('جاري تحويل صفحات الكتاب لنص...', 'CONVERTING BOOK TO TEXT...') :
                 isProcessing         ? tx('جاري تحليل النص المستخرج...', 'ANALYZING EXTRACTED TEXT...') :
                 isListening          ? tx('أسمعك يا بطل...', 'LISTENING...') :
                                        tx(`درس: ${chapter}`, `Topic: ${chapter}`)}
              </h2>
            </div>

            <div className="w-full max-w-4xl space-y-8">
              <div className="bg-white/5 p-8 rounded-[3rem] border border-white/10 min-h-[120px] flex items-center justify-center shadow-inner">
                <p className={`text-slate-400 text-2xl font-medium italic text-center ${sessionLang === 'ar' ? 'text-right w-full' : ''}`} dir={sessionLang === 'ar' ? 'rtl' : 'ltr'}>
                  {transcript || tx('تحدث الآن، أنا أعتمد على نص الكتاب تماماً...', "Speak now, I'm relying on the textbook content...")}
                </p>
              </div>

              {aiResponse && !isListening && (
                <div className="bg-emerald-600/10 border border-emerald-500/20 p-12 rounded-[3.5rem] space-y-8 pop-in shadow-2xl relative overflow-hidden">
                  {isAiSpeaking && (
                    <button onClick={handleStopVoice} className="absolute top-6 left-6 z-10 p-3 bg-red-600 hover:bg-red-500 text-white rounded-xl flex items-center gap-2">
                      <Square size={12} fill="white" />
                      <span className="text-[10px] font-black uppercase tracking-widest">{tx('إيقاف', 'STOP')}</span>
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
              <button onClick={toggleMic} disabled={isProcessing}
                className={`btn-emerald-glow w-36 h-36 rounded-full flex items-center justify-center transition-all shadow-2xl active:scale-90 z-50 ${isListening ? 'bg-red-500 shadow-red-500/40' : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/40'}`}>
                {isListening ? <MicOff className="w-16 h-16 text-white" /> : <Mic className="w-16 h-16 text-white" />}
              </button>
              <span className="text-sm font-black text-slate-500 uppercase tracking-[0.5em]">
                {isListening ? tx('أسمعك...', 'LISTENING...') : tx('انقر للتحدث', 'TAP TO TALK')}
              </span>
              {/* Start Assessment — only appears after lesson voice ends, on USER click */}
              {lessonDone && !isAiSpeaking && !isListening && !isProcessing && (
                <button
                  onClick={() => setPhase('quiz_prompt')}
                  className="flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest text-white transition-all active:scale-95"
                  style={{ background: 'linear-gradient(135deg,#059669,#10b981)', boxShadow: '0 0 30px rgba(16,185,129,0.35)' }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}>
                  <GraduationCap className="w-5 h-5" />
                  {tx('ابدأ التقييم عندما تكون جاهزاً', 'Start Assessment When Ready')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          FULLSCREEN ASSESSMENT OVERLAY
      ════════════════════════════════════════════════════════ */}
      {['quiz_prompt','mini_quiz','mini_result','full_quiz','full_result'].includes(phase) && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-6 md:p-12 overflow-y-auto"
          style={{
            background: '#030303',
            backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(16,185,129,0.10) 0%, transparent 60%)',
          }}>

          {/* ── QUIZ PROMPT ──────────────────────────────────── */}
          {phase === 'quiz_prompt' && (
            <div className="flex flex-col items-center gap-10 text-center max-w-2xl w-full">
              <GraduationCap className="w-24 h-24 text-emerald-400 drop-shadow-[0_0_30px_rgba(16,185,129,0.5)]" />
              <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter">
                {tx(`انتهى شرح: ${chapter}`, `Lesson Done: ${chapter}`)}
              </h2>
              <p className="text-slate-400 text-xl font-medium">
                {tx('هل تريد اختباراً قصيراً لقياس فهمك؟', 'Would you like a quick quiz to test your understanding?')}
              </p>
              {quizLoading ? (
                <Loader2 className="w-12 h-12 text-emerald-400 animate-spin" />
              ) : (
                <div className="flex flex-col sm:flex-row gap-4 w-full">
                  <button onClick={() => generateQuiz('mini')}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black py-6 rounded-3xl text-xl uppercase tracking-widest transition-all active:scale-95 shadow-2xl shadow-emerald-900/40">
                    {tx('✅ نعم، قيّمني', '✅ Yes, Test Me')}
                  </button>
                  <button onClick={() => setPhase('active')}
                    className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 font-black py-6 rounded-3xl text-xl uppercase tracking-widest transition-all">
                    {tx('❌ لا، كمّل', '❌ No, Continue')}
                  </button>
                </div>
              )}
              {quizError && (
                <div className="flex flex-col items-center gap-3">
                  <p className="text-red-400 font-bold">{quizError}</p>
                  <button onClick={() => generateQuiz('mini')} className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-slate-300 font-bold text-sm uppercase tracking-widest hover:bg-white/10 transition-all">
                    {tx('إعادة المحاولة', 'Retry')}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── QUIZ (mini or full) ───────────────────────────── */}
          {(phase === 'mini_quiz' || phase === 'full_quiz') && quizQuestions.length > 0 && (
            <div className="flex flex-col items-center gap-8 w-full max-w-3xl">
              {/* Progress bar */}
              <div className="w-full flex flex-col gap-2">
                <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                  <div className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${((currentQIndex + 1) / quizQuestions.length) * 100}%` }} />
                </div>
                <p className="text-[11px] font-black uppercase tracking-widest text-emerald-500 text-center">
                  {tx(`سؤال ${currentQIndex + 1} من ${quizQuestions.length}`, `Question ${currentQIndex + 1} of ${quizQuestions.length}`)}
                  <span className="ms-3 text-slate-600">
                    {phase === 'mini_quiz' ? tx('الاختبار القصير', 'Mini Quiz') : tx('الاختبار الكبير', 'Full Exam')}
                  </span>
                </p>
              </div>

              {/* Question card */}
              <div className="w-full bg-white/5 border border-white/10 backdrop-blur-xl rounded-[3rem] p-10 space-y-8">
                <p className={`text-white text-2xl md:text-3xl font-bold leading-relaxed ${sessionLang === 'ar' ? 'text-right' : 'text-left'}`}
                  dir={sessionLang === 'ar' ? 'rtl' : 'ltr'}>
                  {quizQuestions[currentQIndex].question}
                </p>

                <div className="grid grid-cols-1 gap-3">
                  {quizQuestions[currentQIndex].options.map((opt, i) => {
                    const letter = ['A','B','C','D'][i];
                    const isCorrect  = letter === quizQuestions[currentQIndex].answer;
                    const isSelected = selectedOption === letter;
                    let style = 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 cursor-pointer';
                    if (selectedOption) {
                      if (isCorrect)       style = 'bg-emerald-600/30 border-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]';
                      else if (isSelected) style = 'bg-red-600/30 border-red-500 text-white';
                      else                 style = 'bg-white/3 border-white/5 text-slate-600 cursor-default';
                    }
                    return (
                      <button key={i} onClick={() => handleAnswer(letter)} disabled={!!selectedOption}
                        className={`w-full p-5 rounded-2xl border font-bold text-lg transition-all ${style} ${sessionLang === 'ar' ? 'text-right' : 'text-left'}`}
                        dir={sessionLang === 'ar' ? 'rtl' : 'ltr'}>
                        {opt}
                      </button>
                    );
                  })}
                </div>

                {/* Next / Evaluating */}
                {selectedOption && currentQIndex + 1 < quizQuestions.length && (
                  <button onClick={handleNextQuestion}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-5 rounded-2xl uppercase tracking-widest transition-all active:scale-95">
                    {tx('التالي ←', 'Next →')}
                  </button>
                )}
                {selectedOption && currentQIndex + 1 === quizQuestions.length && (
                  <div className="flex items-center justify-center gap-3 text-emerald-400 font-black uppercase tracking-widest py-3">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {tx('جاري تقييم إجاباتك...', 'Evaluating your answers...')}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── MINI RESULT (passed → go to full) ────────────── */}
          {phase === 'mini_result' && (() => {
            const score = studentAnswers.filter((a, i) => a === quizQuestions[i]?.answer).length;
            return (
              <div className="flex flex-col items-center gap-10 text-center max-w-2xl w-full">
                <CheckCircle2 className="w-24 h-24 text-emerald-400 drop-shadow-[0_0_30px_rgba(16,185,129,0.5)]" />
                <div className="text-8xl font-black text-white"
                  style={{ textShadow: '0 0 60px rgba(16,185,129,0.4)' }}>
                  {score}<span className="text-emerald-400">/{quizQuestions.length}</span>
                </div>
                <p className="text-emerald-400 text-2xl font-black uppercase tracking-widest">
                  {tx('ممتاز! جاهز للاختبار الكبير؟', 'Great Job! Ready for the full exam?')}
                </p>
                {quizLoading ? <Loader2 className="w-12 h-12 text-emerald-400 animate-spin" /> : (
                  <button onClick={() => generateQuiz('full')}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-6 rounded-3xl text-xl uppercase tracking-widest transition-all active:scale-95 shadow-2xl">
                    {tx('🎯 ابدأ الاختبار الكبير (١٢ سؤال)', '🎯 Start Full Exam (12 Questions)')}
                  </button>
                )}
                {quizError && (
                  <div className="flex flex-col items-center gap-3">
                    <p className="text-red-400 font-bold">{quizError}</p>
                    <button onClick={() => generateQuiz('full')} className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-slate-300 font-bold text-sm uppercase tracking-widest hover:bg-white/10 transition-all">
                      {tx('إعادة المحاولة', 'Retry')}
                    </button>
                  </div>
                )}
              </div>
            );
          })()}

          {/* ── FULL RESULT (final score & stars) ────────────── */}
          {phase === 'full_result' && (() => {
            const score = studentAnswers.filter((a, i) => a === quizQuestions[i]?.answer).length;
            const stars = Math.round((score / quizQuestions.length) * 5);
            const pct   = Math.round((score / quizQuestions.length) * 100);
            return (
              <div className="flex flex-col items-center gap-10 text-center max-w-2xl w-full">
                <div className="text-9xl font-black text-white"
                  style={{ textShadow: '0 0 80px rgba(16,185,129,0.5)' }}>
                  {score}<span className="text-emerald-400 text-6xl">/{quizQuestions.length}</span>
                </div>
                <div className="text-5xl tracking-widest">
                  {'⭐'.repeat(stars)}{'🌑'.repeat(5 - stars)}
                </div>
                <div className="w-full bg-white/5 rounded-full h-3 overflow-hidden">
                  <div className="h-3 rounded-full transition-all duration-1000"
                    style={{ width: `${pct}%`, background: pct >= 60 ? 'linear-gradient(90deg,#10b981,#34d399)' : 'linear-gradient(90deg,#f59e0b,#fbbf24)' }} />
                </div>
                <p className="text-2xl font-black text-white uppercase tracking-widest">
                  {tx('أحسنت يا بطل الإمارات! 🎉', 'Well Done, Champion! 🎉')}
                </p>
                <button onClick={fullReset}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-6 rounded-3xl text-xl uppercase tracking-widest transition-all active:scale-95 shadow-2xl">
                  {tx('🏠 العودة للرئيسية', '🏠 Back to Home')}
                </button>
              </div>
            );
          })()}

        </div>
      )}
    </div>
  );
};

export default TeacherUAEView;
