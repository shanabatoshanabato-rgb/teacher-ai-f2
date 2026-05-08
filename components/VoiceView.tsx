
import React, { useState, useEffect, useRef } from 'react';
import {
  Mic, MicOff, Loader2, Radio, ShieldCheck, User, UserCircle,
  WifiOff, Square, Brain, Search, MessageSquare
} from 'lucide-react';
import { runPuterAgent, puterVoice, stopPuterVoice, puterWebDiscovery } from '../services/puterCore';

interface MemoryEntry {
  role: 'user' | 'assistant';
  content: string;
}

const VoiceView: React.FC = () => {
  const [isListening, setIsListening]     = useState(false);
  const [isProcessing, setIsProcessing]   = useState(false);
  const [isAiSpeaking, setIsAiSpeaking]   = useState(false);
  const [phase, setPhase]                 = useState<'idle' | 'listening' | 'thinking' | 'synthesizing'>('idle');
  const [selectedVoice, setSelectedVoice] = useState<string>('nova');
  const [transcript, setTranscript]       = useState('');
  const [lastAiText, setLastAiText]       = useState('');
  const [errorStatus, setErrorStatus]     = useState<string | null>(null);
  const [sessionLang, setSessionLang]     = useState<'ar' | 'en'>(
    document.documentElement.lang === 'ar' ? 'ar' : 'en'
  );
  const [memory, setMemory] = useState<MemoryEntry[]>([]);

  const recognitionRef = useRef<any>(null);
  const memoryRef      = useRef<MemoryEntry[]>([]);
  const isCurrentAr    = sessionLang === 'ar';

  // Keep memoryRef in sync
  useEffect(() => { memoryRef.current = memory; }, [memory]);

  const voices = [
    { id: 'nova', labelAr: 'سارة', labelEn: 'Sara', gender: 'female' },
    { id: 'onyx', labelAr: 'آدم', labelEn: 'Adam', gender: 'male' },
  ];

  // ── Speech Recognition — fixed typo + cleanup ──
  useEffect(() => {
    // ✅ FIXED: webkitSpeechRecognition (was webkitRecognition)
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;

    // ✅ FIXED: cleanup old instance before creating new (prevents race condition)
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (_) {}
    }

    const rec = new SR();
    rec.continuous      = false;
    rec.interimResults  = true;
    rec.lang            = sessionLang === 'ar' ? 'ar-SA' : 'en-US';

    rec.onresult = (event: any) => {
      const text = Array.from(event.results)
        .map((r: any) => r[0].transcript)
        .join('');
      setTranscript(text);
      if (event.results[event.results.length - 1].isFinal) {
        handleVoiceFlow(text);
      }
    };

    rec.onstart = () => {
      setIsListening(true);
      setPhase('listening');
      setTranscript('');
      setErrorStatus(null);
      stopPuterVoice();
      setIsAiSpeaking(false);
    };

    rec.onend = () => {
      setIsListening(false);
      setPhase(p => p === 'listening' ? 'idle' : p);
    };

    rec.onerror = (e: any) => {
      setIsListening(false);
      setPhase('idle');
      if (e.error === 'network')
        setErrorStatus(isCurrentAr ? 'خطأ في الشبكة' : 'Network Error');
      else if (e.error === 'not-allowed')
        setErrorStatus(isCurrentAr ? 'يرجى السماح باستخدام الميكروفون' : 'Microphone permission denied');
    };

    recognitionRef.current = rec;
    return () => { try { rec.abort(); } catch (_) {} };
  }, [sessionLang]);

  // ── Detect web-search intent ──
  const isSearchIntent = (text: string): boolean => {
    const keywords = ['ابحث', 'ابحث عن', 'بحث عن', 'search', 'search for', 'find', 'look up'];
    return keywords.some(k => text.toLowerCase().includes(k));
  };

  // ── Main voice handler ──
  const handleVoiceFlow = async (text: string) => {
    if (!text.trim()) return;
    setIsProcessing(true);
    setPhase('thinking');

    const updatedMemory: MemoryEntry[] = [
      ...memoryRef.current,
      { role: 'user', content: text }
    ];
    setMemory(updatedMemory);

    try {
      let responseText = '';

      if (isSearchIntent(text)) {
        // Web Search path — using puter web discovery
        const query = text
          .replace(/ابحث عن|ابحث|بحث عن|search for|search|find|look up/gi, '')
          .trim() || text;
        const res = await puterWebDiscovery(query);
        responseText = res.text;
      } else {
        // Memory-aware chat path
        const history = updatedMemory.slice(-10).map(m => ({
          role: m.role as string,
          content: m.content
        }));

        const systemPrompt = isCurrentAr
          ? `أنت معلم ذكي متقدم بالصوت. تتذكر كل ما قاله الطالب في هذه الجلسة وتستخدم ذاكرتك.
قواعد:
- إجاباتك قصيرة وواضحة ومناسبة للصوت (جملتان أو ثلاث فقط).
- استخدم معلومات الجلسة السابقة عند الإجابة.
- إذا طُلب منك البحث، قل "سأبحث عن ذلك الآن".`
          : `You are an advanced voice AI teacher with session memory.
Rules:
- Keep replies short and voice-friendly (2-3 sentences max).
- Reference previous conversation when relevant.
- If asked to search, say "Let me search for that now".`;

        const res = await runPuterAgent(
          text,
          undefined,
          undefined,
          sessionLang,
          false,
          systemPrompt,
          undefined,
          history
        );
        responseText = res.text;
      }

      setMemory(prev => [...prev, { role: 'assistant', content: responseText }]);
      setLastAiText(responseText);
      setPhase('synthesizing');
      setIsAiSpeaking(true);
      await puterVoice(responseText, sessionLang, selectedVoice);

    } catch (e) {
      console.error('Voice Flow Error:', e);
      setErrorStatus(isCurrentAr ? 'فشل المعالجة، حاول مرة أخرى' : 'Processing failed, please try again');
    } finally {
      setIsProcessing(false);
      setIsAiSpeaking(false);
      setPhase('idle');
    }
  };

  const handleStopVoice = () => {
    stopPuterVoice();
    setIsAiSpeaking(false);
    setPhase('idle');
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setErrorStatus(null);
      handleStopVoice();
      try { recognitionRef.current?.start(); }
      catch (e) { console.error('STT Start Error:', e); }
    }
  };

  const clearMemory = () => {
    setMemory([]);
    setLastAiText('');
    setTranscript('');
  };

  return (
    <div className="w-full h-[calc(100vh-140px)] flex flex-col items-center justify-center relative overflow-hidden bg-[#050505] p-6">

      {/* Animated background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className={`rounded-full blur-[120px] transition-all duration-1000 ${
          isListening   ? 'w-[700px] h-[700px] bg-red-600/15 scale-110' :
          isProcessing  ? 'w-[600px] h-[600px] bg-violet-600/15 animate-pulse' :
          isAiSpeaking  ? 'w-[650px] h-[650px] bg-indigo-600/15 animate-pulse' :
                          'w-[500px] h-[500px] bg-indigo-600/8'
        }`} />
      </div>

      {/* Orbit rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
        <div className="w-[400px] h-[400px] border border-indigo-500/30 rounded-full"
          style={{ animation: 'slowRotate 12s linear infinite' }} />
        <div className="absolute w-[520px] h-[520px] border border-violet-500/20 rounded-full"
          style={{ animation: 'slowRotate 20s linear infinite reverse' }} />
        <div className="absolute w-[640px] h-[640px] border border-blue-500/10 rounded-full"
          style={{ animation: 'slowRotate 30s linear infinite' }} />
      </div>

      <div className="z-20 text-center space-y-5 max-w-2xl w-full flex flex-col items-center">

        {/* Error */}
        {errorStatus && (
          <div className="bg-red-500/10 border border-red-500/20 px-6 py-3 rounded-2xl flex items-center gap-3"
            style={{ animation: 'cardEntrance 0.3s ease' }}>
            <WifiOff className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span className="text-red-400 text-[10px] font-black uppercase tracking-widest">{errorStatus}</span>
          </div>
        )}

        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center justify-center gap-3">
            <Brain className="w-4 h-4 text-indigo-400 animate-pulse" />
            <span className="text-indigo-400 font-black tracking-[0.4em] uppercase text-[10px]">
              AI Voice · Memory · Web Search
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase">
            {isCurrentAr ? 'الوضع الصوتي' : 'Voice Mode'}
          </h1>
        </div>

        {/* Lang + Memory controls */}
        <div className="flex items-center gap-3">
          <div className="bg-white/5 p-1 rounded-2xl border border-white/10 flex gap-1">
            <button onClick={() => setSessionLang('ar')}
              className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${sessionLang === 'ar' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
              العربية
            </button>
            <button onClick={() => setSessionLang('en')}
              className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${sessionLang === 'en' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
              English
            </button>
          </div>
          {memory.length > 0 && (
            <button onClick={clearMemory}
              className="px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border border-white/10 text-slate-600 hover:text-red-400 hover:border-red-500/30 transition-all">
              {isCurrentAr ? 'مسح الذاكرة' : 'Clear'}
            </button>
          )}
        </div>

        {/* Mic button */}
        <div className="relative flex items-center justify-center py-4">
          <button
            onClick={toggleListening}
            disabled={isProcessing}
            className={`group relative w-44 h-44 md:w-56 md:h-56 rounded-full flex items-center justify-center transition-all duration-700 shadow-2xl z-30 ${
              isListening  ? 'bg-red-600' :
              isProcessing ? 'bg-violet-700 animate-pulse' :
                             'bg-[#111827] border-4 border-white/5 hover:border-indigo-500/40 hover:scale-105'
            }`}
            style={{
              boxShadow: isListening  ? '0 0 60px rgba(239,68,68,0.4), 0 0 120px rgba(239,68,68,0.15)' :
                         isAiSpeaking ? '0 0 60px rgba(99,102,241,0.4), 0 0 120px rgba(99,102,241,0.15)' :
                         undefined
            }}
          >
            {isProcessing ? <Loader2 className="w-14 h-14 text-white animate-spin" /> :
             isListening  ? <MicOff  className="w-14 h-14 text-white animate-pulse" /> :
                            <Mic     className="w-14 h-14 text-white group-hover:scale-110 transition-transform" />}

            {(isListening || isProcessing || isAiSpeaking) && (
              <>
                <div className="absolute inset-0 rounded-full border-2 border-white/20 animate-ping" />
                <div className="absolute -inset-6 rounded-full border border-white/10 animate-ping" style={{ animationDelay: '0.3s' }} />
                <div className="absolute -inset-12 rounded-full border border-white/5 animate-ping" style={{ animationDelay: '0.6s' }} />
              </>
            )}
          </button>

          {isAiSpeaking && (
            <button onClick={handleStopVoice}
              className="absolute -right-20 bottom-10 p-4 bg-red-600/20 hover:bg-red-600/40 border border-red-500/40 text-red-500 rounded-full transition-all flex flex-col items-center gap-1"
              style={{ animation: 'cardEntrance 0.3s ease' }}>
              <Square className="w-6 h-6 fill-red-500" />
              <span className="text-[8px] font-black uppercase">{isCurrentAr ? 'إيقاف' : 'STOP'}</span>
            </button>
          )}
        </div>

        {/* Transcript + AI reply */}
        <div className="w-full space-y-3 px-2">
          {transcript && (
            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl"
              style={{ animation: 'cardEntrance 0.3s ease' }}>
              <div className="flex items-center gap-2 mb-2 opacity-40">
                <User className="w-3 h-3" />
                <span className="text-[8px] font-black uppercase tracking-widest">{isCurrentAr ? 'صوتك' : 'YOU'}</span>
              </div>
              <p className={`text-slate-200 text-base font-medium ${isCurrentAr ? 'text-right' : 'text-left'}`}
                dir={isCurrentAr ? 'rtl' : 'ltr'}>
                {transcript}
              </p>
            </div>
          )}

          {lastAiText && !isListening && (
            <div className="bg-indigo-600/8 border border-indigo-500/20 p-4 rounded-2xl"
              style={{ animation: 'cardEntrance 0.4s ease' }}>
              <div className="flex items-center gap-2 mb-2 opacity-60">
                <Brain className="w-3 h-3 text-indigo-400" />
                <span className="text-[8px] font-black uppercase tracking-widest text-indigo-400">
                  {isCurrentAr ? 'المعلم الذكي' : 'AI TEACHER'}
                </span>
                {isAiSpeaking && (
                  <span className="text-[8px] text-indigo-300 animate-pulse">
                    ● {isCurrentAr ? 'يتحدث' : 'SPEAKING'}
                  </span>
                )}
              </div>
              <p className={`text-slate-200 text-base font-medium leading-relaxed ${isCurrentAr ? 'text-right' : 'text-left'}`}
                dir={isCurrentAr ? 'rtl' : 'ltr'}>
                {lastAiText}
              </p>
            </div>
          )}

          {/* Voice bars */}
          {(isProcessing || phase === 'synthesizing') && (
            <div className="flex justify-center items-end gap-1 h-10">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="w-1.5 bg-indigo-500 rounded-full"
                  style={{ animation: `voice-bar ${0.4 + i * 0.1}s infinite ease-in-out` }} />
              ))}
            </div>
          )}

          {/* Phase label */}
          <div className="flex items-center justify-center gap-2">
            {isListening  && <Radio  className="w-4 h-4 text-red-500 animate-pulse" />}
            {isProcessing && <Search className="w-4 h-4 text-indigo-400 animate-spin" />}
            <p className={`text-lg font-black uppercase tracking-tighter ${isListening ? 'text-red-500' : 'text-white'}`}>
              {phase === 'listening'    ? (isCurrentAr ? 'جاري الاستماع...' : 'LISTENING...')
               : phase === 'thinking'  ? (isCurrentAr ? 'جاري التفكير...'  : 'THINKING...')
               : phase === 'synthesizing' ? (isCurrentAr ? 'جاري التحدث...' : 'SPEAKING...')
               : (isCurrentAr ? 'اضغط للتحدث' : 'TAP TO SPEAK')}
            </p>
          </div>

          {/* Memory counter */}
          {memory.length > 0 && (
            <div className="flex items-center justify-center gap-2 opacity-25">
              <MessageSquare className="w-3 h-3 text-slate-500" />
              <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">
                {isCurrentAr ? `الذاكرة: ${memory.length} رسالة` : `Memory: ${memory.length} msgs`}
              </span>
            </div>
          )}
        </div>

        {/* Voice selector */}
        <div className="flex gap-3">
          {voices.map((v) => (
            <button key={v.id} onClick={() => setSelectedVoice(v.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest border transition-all ${
                selectedVoice === v.id
                  ? 'bg-indigo-600 border-indigo-400 text-white shadow-xl scale-105'
                  : 'bg-black/40 border-white/10 text-slate-500 hover:text-white hover:border-white/20'
              }`}>
              {v.gender === 'female' ? <User className="w-4 h-4" /> : <UserCircle className="w-4 h-4" />}
              {isCurrentAr ? v.labelAr : v.labelEn}
            </button>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes voice-bar {
          0%, 100% { height: 4px; }
          50% { height: 36px; }
        }
      `}</style>
    </div>
  );
};

export default VoiceView;
