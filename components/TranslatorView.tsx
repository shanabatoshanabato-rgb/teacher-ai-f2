
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { runPuterAgent } from '../services/puterCore';
import { Languages, Mic, MicOff, Volume2, Copy, RefreshCw, ChevronDown } from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────
type TranslatorState = 'idle' | 'listening' | 'translating' | 'done';

interface LangOption {
  code: string;
  label: string;
  labelAr: string;
  flag: string;
}

// ── Language list ────────────────────────────────────────────────
const LANGUAGES: LangOption[] = [
  { code: 'en-US', label: 'English',  labelAr: 'الإنجليزية', flag: '🇺🇸' },
  { code: 'ar-SA', label: 'Arabic',   labelAr: 'العربية',    flag: '🇸🇦' },
  { code: 'fr-FR', label: 'French',   labelAr: 'الفرنسية',   flag: '🇫🇷' },
  { code: 'es-ES', label: 'Spanish',  labelAr: 'الإسبانية',  flag: '🇪🇸' },
  { code: 'de-DE', label: 'German',   labelAr: 'الألمانية',  flag: '🇩🇪' },
  { code: 'it-IT', label: 'Italian',  labelAr: 'الإيطالية',  flag: '🇮🇹' },
  { code: 'ur-PK', label: 'Urdu',     labelAr: 'الأردية',    flag: '🇵🇰' },
  { code: 'hi-IN', label: 'Hindi',    labelAr: 'الهندية',    flag: '🇮🇳' },
];

// ── TTS helper – waits for voices to load asynchronously ─────────
function speakText(text: string, langCode: string) {
  const synth = window.speechSynthesis;
  synth.cancel();

  const doSpeak = (voices: SpeechSynthesisVoice[]) => {
    const utt = new SpeechSynthesisUtterance(text);
    const match = voices.find(v => v.lang === langCode)
      ?? voices.find(v => v.lang.startsWith(langCode.split('-')[0]))
      ?? null;
    if (match) utt.voice = match;
    utt.lang = langCode;
    utt.rate = 0.95;
    synth.speak(utt);
  };

  const voices = synth.getVoices();
  if (voices.length > 0) {
    doSpeak(voices);
  } else {
    // voices load async in some browsers
    synth.onvoiceschanged = () => {
      const v = synth.getVoices();
      if (v.length > 0) {
        synth.onvoiceschanged = null;
        doSpeak(v);
      }
    };
    // Retry fallback after 1 s in case onvoiceschanged never fires
    setTimeout(() => {
      const v = synth.getVoices();
      if (v.length > 0) doSpeak(v);
    }, 1000);
  }
}

// ── Floating animated orb ────────────────────────────────────────
const Orb: React.FC<{ size: number; color: string; x: string; y: string; delay: number }> = ({ size, color, x, y, delay }) => (
  <div
    className="absolute rounded-full pointer-events-none blur-[80px] animate-pulse"
    style={{ width: size, height: size, background: color, left: x, top: y, transform: 'translate(-50%,-50%)', animationDelay: `${delay}s`, animationDuration: `${4 + delay}s` }}
  />
);

// ── Pulsing mic ring animation ───────────────────────────────────
const MicRing: React.FC<{ active: boolean }> = ({ active }) => (
  <div className="relative flex items-center justify-center">
    {active && (
      <>
        <div className="absolute rounded-full border-2 border-cyan-400/40 animate-ping" style={{ width: 90, height: 90, animationDuration: '1.2s' }} />
        <div className="absolute rounded-full border border-cyan-300/20 animate-ping" style={{ width: 120, height: 120, animationDuration: '1.8s', animationDelay: '0.3s' }} />
        <div className="absolute rounded-full border border-cyan-200/10 animate-ping" style={{ width: 150, height: 150, animationDuration: '2.4s', animationDelay: '0.6s' }} />
      </>
    )}
    <div
      className="relative z-10 flex items-center justify-center rounded-full transition-all duration-300"
      style={{
        width: 72, height: 72,
        background: active
          ? 'linear-gradient(135deg, #06b6d4, #0891b2)'
          : 'linear-gradient(135deg, #1e293b, #0f172a)',
        boxShadow: active
          ? '0 0 50px rgba(6,182,212,0.6), 0 0 20px rgba(6,182,212,0.3)'
          : '0 0 20px rgba(6,182,212,0.1)',
        border: active ? '2px solid rgba(6,182,212,0.8)' : '2px solid rgba(255,255,255,0.08)',
      }}
    >
      {active
        ? <MicOff className="w-7 h-7 text-white" />
        : <Mic className="w-7 h-7 text-cyan-400" />}
    </div>
  </div>
);

// ── Main Component ───────────────────────────────────────────────
const TranslatorView: React.FC = () => {
  const isAr = document.documentElement.lang === 'ar';

  const [state, setState]           = useState<TranslatorState>('idle');
  const [sourceText, setSourceText] = useState('');
  const [translated, setTranslated] = useState('');
  const [targetLang, setTargetLang] = useState<LangOption>(LANGUAGES[0]);
  const [dropOpen, setDropOpen]     = useState(false);
  const [error, setError]           = useState('');
  const [copied, setCopied]         = useState(false);

  const recognitionRef = useRef<any>(null);
  const dropRef        = useRef<HTMLDivElement>(null);

  // close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDropOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Start speech recognition ─────────────────────────────────
  const startListening = useCallback(() => {
    setError('');
    setSourceText('');
    setTranslated('');
    setState('listening');

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError(isAr ? 'المتصفح لا يدعم التعرف على الصوت.' : 'Speech recognition not supported in this browser.');
      setState('idle');
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous      = false;
    rec.interimResults  = false;
    rec.maxAlternatives = 1;
    // auto-detect — don't lock to a language
    recognitionRef.current = rec;

    rec.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSourceText(transcript);
      setState('translating');

      try {
        const langName = isAr ? targetLang.labelAr : targetLang.label;
        const prompt = `Translate the following text to ${langName}. Return ONLY the translated text, nothing else.\n\n"${transcript}"`;
        const res = await runPuterAgent(prompt, undefined, undefined, 'en', false);
        const result = res.text.replace(/^["']|["']$/g, '').trim();
        setTranslated(result);
        setState('done');
        speakText(result, targetLang.code);
      } catch {
        setError(isAr ? 'فشلت الترجمة، حاول مرة أخرى.' : 'Translation failed. Please try again.');
        setState('idle');
      }
    };

    rec.onerror = (e: any) => {
      setError(isAr ? `خطأ في التعرف: ${e.error}` : `Recognition error: ${e.error}`);
      setState('idle');
    };

    rec.onend = () => {
      if (state === 'listening') setState('idle');
    };

    rec.start();
  }, [targetLang, isAr, state]);

  // ── Stop listening manually ──────────────────────────────────
  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    if (state === 'listening') setState('idle');
  }, [state]);

  // ── Copy result ──────────────────────────────────────────────
  const copyResult = async () => {
    if (!translated) return;
    await navigator.clipboard.writeText(translated);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Re-speak ─────────────────────────────────────────────────
  const reSpeakResult = () => {
    if (translated) speakText(translated, targetLang.code);
  };

  // ── Reset ────────────────────────────────────────────────────
  const reset = () => {
    recognitionRef.current?.stop();
    window.speechSynthesis.cancel();
    setState('idle');
    setSourceText('');
    setTranslated('');
    setError('');
  };

  // ── i18n labels ──────────────────────────────────────────────
  const ui = isAr ? {
    title:       'المترجم الحي',
    subtitle:    'تحدث وسنترجم كلامك فوراً',
    selectLang:  'اختر لغة الترجمة',
    tapToSpeak:  'اضغط للتحدث',
    listening:   'جارٍ الاستماع...',
    translating: 'جارٍ الترجمة...',
    yourSpeech:  'ما قلته',
    result:      'الترجمة',
    tapStop:     'اضغط لإيقاف',
    again:       'مرة أخرى',
    speak:       'استمع',
    copy:        'نسخ',
    copied:      'تم!',
    reset:       'إعادة',
  } : {
    title:       'Live Translator',
    subtitle:    "Speak and we'll translate instantly",
    selectLang:  'Select target language',
    tapToSpeak:  'Tap to speak',
    listening:   'Listening...',
    translating: 'Translating...',
    yourSpeech:  'You said',
    result:      'Translation',
    tapStop:     'Tap to stop',
    again:       'Try again',
    speak:       'Speak',
    copy:        'Copy',
    copied:      'Done!',
    reset:       'Reset',
  };

  const stateLabel =
    state === 'listening'   ? ui.listening   :
    state === 'translating' ? ui.translating :
    ui.tapToSpeak;

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-start pt-6 pb-24 px-4 overflow-hidden">

      {/* Ambient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <Orb size={500} color="rgba(6,182,212,0.10)"  x="15%" y="20%" delay={0} />
        <Orb size={380} color="rgba(99,102,241,0.08)" x="80%" y="15%" delay={1.5} />
        <Orb size={300} color="rgba(6,182,212,0.07)"  x="60%" y="75%" delay={3} />
      </div>

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col items-center gap-3 mb-10 text-center">
        <div
          className="flex items-center gap-3 px-6 py-3 rounded-2xl border"
          style={{ background: 'rgba(6,182,212,0.08)', borderColor: 'rgba(6,182,212,0.25)', boxShadow: '0 0 30px rgba(6,182,212,0.12)' }}
        >
          <Languages className="w-5 h-5 text-cyan-400" />
          <span className="text-sm font-black tracking-widest text-cyan-300 uppercase">{ui.title}</span>
        </div>
        <p className="text-slate-400 text-sm font-medium">{ui.subtitle}</p>
      </div>

      {/* ── Language Selector ───────────────────────────────────── */}
      <div className="relative z-10 w-full max-w-sm mb-10" ref={dropRef}>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 text-center">{ui.selectLang}</p>
        <button
          onClick={() => setDropOpen(p => !p)}
          className="w-full flex items-center justify-between gap-3 px-5 py-4 rounded-2xl border border-white/10 hover:border-cyan-500/40 transition-all"
          style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(12px)' }}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">{targetLang.flag}</span>
            <span className="text-white font-bold text-sm">
              {isAr ? targetLang.labelAr : targetLang.label}
            </span>
          </div>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${dropOpen ? 'rotate-180' : ''}`} />
        </button>

        {dropOpen && (
          <div
            className="absolute mt-2 w-full rounded-2xl border border-white/10 overflow-hidden z-50"
            style={{ background: 'rgba(10,10,14,0.97)', backdropFilter: 'blur(20px)', boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}
          >
            {LANGUAGES.map(lang => (
              <button
                key={lang.code}
                onClick={() => { setTargetLang(lang); setDropOpen(false); reset(); }}
                className={`w-full flex items-center gap-3 px-5 py-3.5 hover:bg-cyan-500/10 transition-colors text-left ${targetLang.code === lang.code ? 'bg-cyan-500/15 text-cyan-300' : 'text-slate-300'}`}
              >
                <span className="text-xl">{lang.flag}</span>
                <span className="font-bold text-sm">{isAr ? lang.labelAr : lang.label}</span>
                <span className="ml-auto text-[10px] text-slate-600 font-mono">{lang.code}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Mic Button ──────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col items-center gap-4 mb-10">
        <button
          onClick={state === 'listening' ? stopListening : (state === 'idle' || state === 'done') ? startListening : undefined}
          disabled={state === 'translating'}
          className="focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-transform active:scale-95"
        >
          <MicRing active={state === 'listening'} />
        </button>

        <div
          className="flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-500"
          style={{
            background: state === 'listening'   ? 'rgba(6,182,212,0.12)' :
                        state === 'translating' ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.04)',
            borderColor: state === 'listening'   ? 'rgba(6,182,212,0.4)' :
                         state === 'translating' ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.08)',
          }}
        >
          {state === 'translating' && (
            <RefreshCw className="w-3 h-3 text-indigo-400 animate-spin" />
          )}
          <span className={`text-[11px] font-black uppercase tracking-widest ${
            state === 'listening'   ? 'text-cyan-300' :
            state === 'translating' ? 'text-indigo-300' : 'text-slate-500'
          }`}>
            {stateLabel}
          </span>
        </div>
      </div>

      {/* ── Error banner ────────────────────────────────────────── */}
      {error && (
        <div className="relative z-10 w-full max-w-lg mb-6 px-5 py-4 rounded-2xl border border-red-500/30 bg-red-500/10 text-red-300 text-sm font-medium text-center">
          {error}
        </div>
      )}

      {/* ── Result cards ────────────────────────────────────────── */}
      {(sourceText || translated) && (
        <div className="relative z-10 w-full max-w-2xl flex flex-col gap-5">

          {/* Source text */}
          {sourceText && (
            <div
              className="rounded-[1.5rem] border border-white/8 p-6"
              style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(12px)' }}
            >
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">{ui.yourSpeech}</p>
              <p className="text-white text-base font-medium leading-relaxed">{sourceText}</p>
            </div>
          )}

          {/* Translated text */}
          {translated && (
            <div
              className="rounded-[1.5rem] border p-6 transition-all"
              style={{
                background: 'rgba(6,182,212,0.05)',
                borderColor: 'rgba(6,182,212,0.2)',
                boxShadow: '0 0 40px rgba(6,182,212,0.08)',
                backdropFilter: 'blur(12px)',
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-cyan-500">{ui.result}</p>
                <div className="flex items-center gap-2">
                  {/* Re-speak */}
                  <button
                    onClick={reSpeakResult}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-cyan-400 border border-cyan-500/20 hover:border-cyan-500/50 hover:bg-cyan-500/10 transition-all"
                  >
                    <Volume2 className="w-3 h-3" />
                    {ui.speak}
                  </button>
                  {/* Copy */}
                  <button
                    onClick={copyResult}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all"
                  >
                    <Copy className="w-3 h-3" />
                    {copied ? ui.copied : ui.copy}
                  </button>
                </div>
              </div>
              <p className="text-white text-lg font-semibold leading-relaxed">{translated}</p>

              {/* Target language chip */}
              <div className="mt-4 flex items-center gap-2">
                <span className="text-lg">{targetLang.flag}</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-cyan-600">
                  {isAr ? targetLang.labelAr : targetLang.label}
                </span>
              </div>
            </div>
          )}

          {/* Try again / reset */}
          {state === 'done' && (
            <div className="flex gap-3 justify-center">
              <button
                onClick={startListening}
                className="px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest text-white transition-all"
                style={{ background: 'linear-gradient(135deg,#06b6d4,#0891b2)', boxShadow: '0 0 30px rgba(6,182,212,0.35)' }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
              >
                {ui.again}
              </button>
              <button
                onClick={reset}
                className="px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400 border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all"
              >
                {ui.reset}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TranslatorView;
