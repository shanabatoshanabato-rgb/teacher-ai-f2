
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { runPuterAgent } from '../services/puterCore';
import { Languages, Mic, MicOff, Volume2, Copy, RefreshCw, ChevronDown, Check, RotateCcw } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────
type TranslatorState = 'idle' | 'listening' | 'translating' | 'done';

interface LangOption {
  code: string;
  label: string;
  labelAr: string;
  flag: string;
  region: string;
}

// ── 25 Languages ──────────────────────────────────────────────────
const LANGUAGES: LangOption[] = [
  { code: 'en-US', label: 'English (US)',       labelAr: 'الإنجليزية (أمريكا)',   flag: '🇺🇸', region: 'Americas' },
  { code: 'en-GB', label: 'English (UK)',        labelAr: 'الإنجليزية (بريطانيا)', flag: '🇬🇧', region: 'Europe' },
  { code: 'ar-SA', label: 'Arabic',              labelAr: 'العربية',               flag: '🇸🇦', region: 'Middle East' },
  { code: 'fr-FR', label: 'French',              labelAr: 'الفرنسية',              flag: '🇫🇷', region: 'Europe' },
  { code: 'es-ES', label: 'Spanish',             labelAr: 'الإسبانية',             flag: '🇪🇸', region: 'Europe' },
  { code: 'pt-BR', label: 'Portuguese (Brazil)', labelAr: 'البرتغالية (البرازيل)', flag: '🇧🇷', region: 'Americas' },
  { code: 'de-DE', label: 'German',              labelAr: 'الألمانية',             flag: '🇩🇪', region: 'Europe' },
  { code: 'it-IT', label: 'Italian',             labelAr: 'الإيطالية',             flag: '🇮🇹', region: 'Europe' },
  { code: 'nl-NL', label: 'Dutch',               labelAr: 'الهولندية',             flag: '🇳🇱', region: 'Europe' },
  { code: 'ru-RU', label: 'Russian',             labelAr: 'الروسية',               flag: '🇷🇺', region: 'Europe' },
  { code: 'tr-TR', label: 'Turkish',             labelAr: 'التركية',               flag: '🇹🇷', region: 'Middle East' },
  { code: 'fa-IR', label: 'Persian (Farsi)',      labelAr: 'الفارسية',              flag: '🇮🇷', region: 'Middle East' },
  { code: 'ur-PK', label: 'Urdu',                labelAr: 'الأردية',               flag: '🇵🇰', region: 'Asia' },
  { code: 'hi-IN', label: 'Hindi',               labelAr: 'الهندية',               flag: '🇮🇳', region: 'Asia' },
  { code: 'bn-BD', label: 'Bengali',             labelAr: 'البنغالية',             flag: '🇧🇩', region: 'Asia' },
  { code: 'id-ID', label: 'Indonesian',          labelAr: 'الإندونيسية',           flag: '🇮🇩', region: 'Asia' },
  { code: 'ms-MY', label: 'Malay',               labelAr: 'الملايوية',             flag: '🇲🇾', region: 'Asia' },
  { code: 'th-TH', label: 'Thai',                labelAr: 'التايلاندية',           flag: '🇹🇭', region: 'Asia' },
  { code: 'vi-VN', label: 'Vietnamese',          labelAr: 'الفيتنامية',            flag: '🇻🇳', region: 'Asia' },
  { code: 'zh-CN', label: 'Chinese (Simplified)',labelAr: 'الصينية (مبسطة)',       flag: '🇨🇳', region: 'Asia' },
  { code: 'zh-TW', label: 'Chinese (Traditional)',labelAr:'الصينية (تقليدية)',     flag: '🇹🇼', region: 'Asia' },
  { code: 'ja-JP', label: 'Japanese',            labelAr: 'اليابانية',             flag: '🇯🇵', region: 'Asia' },
  { code: 'ko-KR', label: 'Korean',              labelAr: 'الكورية',               flag: '🇰🇷', region: 'Asia' },
  { code: 'sv-SE', label: 'Swedish',             labelAr: 'السويدية',              flag: '🇸🇪', region: 'Europe' },
  { code: 'pl-PL', label: 'Polish',              labelAr: 'البولندية',             flag: '🇵🇱', region: 'Europe' },
];

// ── TTS: waits for voices & picks the clearest available ─────────
function speakText(text: string, langCode: string) {
  const synth = window.speechSynthesis;
  synth.cancel();

  const pickVoice = (voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null => {
    const lang2 = langCode.split('-')[0];
    // Prefer premium/neural voices (Google/Microsoft) for clarity
    const premiumMatch = voices.find(v =>
      v.lang === langCode && (v.name.includes('Google') || v.name.includes('Microsoft') || v.name.includes('neural'))
    );
    if (premiumMatch) return premiumMatch;
    // Exact code match
    const exactMatch = voices.find(v => v.lang === langCode);
    if (exactMatch) return exactMatch;
    // Prefix match
    return voices.find(v => v.lang.startsWith(lang2)) ?? null;
  };

  const doSpeak = (voices: SpeechSynthesisVoice[]) => {
    const utt = new SpeechSynthesisUtterance(text);
    const voice = pickVoice(voices);
    if (voice) utt.voice = voice;
    utt.lang   = langCode;
    utt.rate   = 0.85;   // slightly slower → clearer
    utt.pitch  = 1.05;
    utt.volume = 1.0;
    synth.speak(utt);
  };

  const voices = synth.getVoices();
  if (voices.length > 0) {
    doSpeak(voices);
  } else {
    synth.onvoiceschanged = () => {
      synth.onvoiceschanged = null;
      doSpeak(synth.getVoices());
    };
    setTimeout(() => {
      const v = synth.getVoices();
      if (v.length > 0) doSpeak(v);
    }, 1200);
  }
}

// ── Ambient orb ───────────────────────────────────────────────────
const Orb: React.FC<{ size: number; color: string; x: string; y: string; delay: number }> = ({ size, color, x, y, delay }) => (
  <div className="absolute rounded-full pointer-events-none blur-[90px] animate-pulse"
    style={{ width: size, height: size, background: color, left: x, top: y, transform: 'translate(-50%,-50%)', animationDelay: `${delay}s`, animationDuration: `${4 + delay}s` }} />
);

// ── Waveform bars (shown while listening) ────────────────────────
const Waveform: React.FC<{ active: boolean }> = ({ active }) => (
  <div className="flex items-center gap-[3px] h-8">
    {[0.6, 1, 0.75, 1, 0.5, 0.85, 0.6, 1, 0.7].map((h, i) => (
      <div
        key={i}
        className="rounded-full transition-all"
        style={{
          width: 3,
          height: active ? `${h * 32}px` : '4px',
          background: active ? `rgba(6,182,212,${0.5 + h * 0.5})` : 'rgba(255,255,255,0.1)',
          animation: active ? `pulse ${0.6 + i * 0.1}s ease-in-out infinite alternate` : 'none',
          animationDelay: `${i * 0.07}s`,
          transition: 'height 0.3s ease, background 0.3s ease',
        }}
      />
    ))}
  </div>
);

// ── Mic Button ────────────────────────────────────────────────────
const MicButton: React.FC<{ state: TranslatorState; onPress: () => void; onStop: () => void }> = ({ state, onPress, onStop }) => {
  const isListening   = state === 'listening';
  const isTranslating = state === 'translating';
  const disabled      = isTranslating;

  return (
    <div className="relative flex flex-col items-center gap-5">
      {/* Outer pulse rings */}
      {isListening && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {[1, 1.5, 2].map((scale, i) => (
            <div key={i} className="absolute rounded-full border border-cyan-400/30 animate-ping"
              style={{ width: 80 * scale, height: 80 * scale, animationDuration: `${1.4 + i * 0.5}s`, animationDelay: `${i * 0.25}s` }} />
          ))}
        </div>
      )}

      {/* Button */}
      <button
        onClick={isListening ? onStop : onPress}
        disabled={disabled}
        className="relative z-10 flex items-center justify-center rounded-full focus:outline-none active:scale-95 transition-transform duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          width: 88, height: 88,
          background: isListening
            ? 'linear-gradient(135deg,#06b6d4,#0284c7)'
            : 'linear-gradient(135deg,#1e293b,#0f172a)',
          boxShadow: isListening
            ? '0 0 60px rgba(6,182,212,0.7), 0 0 20px rgba(6,182,212,0.4), inset 0 1px 0 rgba(255,255,255,0.15)'
            : '0 0 30px rgba(6,182,212,0.12), inset 0 1px 0 rgba(255,255,255,0.05)',
          border: isListening ? '2px solid rgba(6,182,212,0.9)' : '2px solid rgba(255,255,255,0.08)',
          transition: 'all 0.35s cubic-bezier(0.23,1,0.32,1)',
        }}
      >
        {isTranslating
          ? <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
          : isListening
          ? <MicOff className="w-8 h-8 text-white" />
          : <Mic className="w-8 h-8 text-cyan-400" />
        }
      </button>

      <Waveform active={isListening} />
    </div>
  );
};

// ── Language Dropdown ─────────────────────────────────────────────
const LangDropdown: React.FC<{
  value: LangOption;
  onChange: (l: LangOption) => void;
  isAr: boolean;
}> = ({ value, onChange, isAr }) => {
  const [open, setOpen]     = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const filtered = LANGUAGES.filter(l => {
    const q = search.toLowerCase();
    return (l.label.toLowerCase().includes(q) || l.labelAr.includes(q) || l.code.toLowerCase().includes(q));
  });

  // Group by region
  const regions = [...new Set(filtered.map(l => l.region))];

  return (
    <div className="relative w-full max-w-sm" ref={ref}>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 text-center">
        {isAr ? 'اختر لغة الترجمة' : 'Target Language'}
      </p>

      {/* Trigger */}
      <button
        onClick={() => { setOpen(p => !p); setSearch(''); }}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 rounded-2xl border border-white/10 hover:border-cyan-500/40 transition-all"
        style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(14px)' }}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{value.flag}</span>
          <div className="text-left">
            <p className="text-white font-bold text-sm leading-tight">{isAr ? value.labelAr : value.label}</p>
            <p className="text-slate-600 text-[10px] font-mono">{value.code}</p>
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Panel */}
      {open && (
        <div className="absolute mt-2 w-full rounded-2xl border border-white/10 overflow-hidden z-50 flex flex-col"
          style={{ background: 'rgba(8,8,12,0.98)', backdropFilter: 'blur(24px)', boxShadow: '0 24px 80px rgba(0,0,0,0.7)', maxHeight: 340 }}>

          {/* Search */}
          <div className="p-3 border-b border-white/5">
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={isAr ? 'ابحث...' : 'Search language...'}
              className="w-full bg-white/5 text-white placeholder-slate-500 text-xs px-4 py-2.5 rounded-xl border border-white/8 focus:outline-none focus:border-cyan-500/40 transition-colors"
            />
          </div>

          {/* List */}
          <div className="overflow-y-auto">
            {regions.map(region => (
              <div key={region}>
                <p className="px-4 pt-3 pb-1 text-[9px] font-black uppercase tracking-widest text-slate-600">{region}</p>
                {filtered.filter(l => l.region === region).map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => { onChange(lang); setOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-cyan-500/10 transition-colors"
                  >
                    <span className="text-xl">{lang.flag}</span>
                    <div className="text-left flex-1">
                      <p className={`font-bold text-xs leading-tight ${value.code === lang.code ? 'text-cyan-300' : 'text-slate-200'}`}>
                        {isAr ? lang.labelAr : lang.label}
                      </p>
                      <p className="text-slate-600 text-[10px] font-mono">{lang.code}</p>
                    </div>
                    {value.code === lang.code && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                  </button>
                ))}
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="text-center text-slate-600 text-xs py-6">{isAr ? 'لا توجد نتائج' : 'No results'}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Main View ─────────────────────────────────────────────────────
const TranslatorView: React.FC = () => {
  const isAr = document.documentElement.lang === 'ar';

  const [state, setState]           = useState<TranslatorState>('idle');
  const [sourceText, setSourceText] = useState('');
  const [translated, setTranslated] = useState('');
  const [targetLang, setTargetLang] = useState<LangOption>(LANGUAGES[0]);
  const [error, setError]           = useState('');
  const [copied, setCopied]         = useState(false);

  const recognitionRef = useRef<any>(null);

  const ui = {
    title:       isAr ? 'المترجم الحي'                               : 'Live Translator',
    subtitle:    isAr ? 'تحدث وسنترجم كلامك فوراً إلى أي لغة'       : "Speak — we'll translate it instantly",
    tapToSpeak:  isAr ? 'اضغط للتحدث'                                : 'Tap to speak',
    listening:   isAr ? 'جارٍ الاستماع...'                           : 'Listening...',
    translating: isAr ? 'جارٍ الترجمة...'                            : 'Translating...',
    yourSpeech:  isAr ? 'ما قلته'                                   : 'You said',
    result:      isAr ? 'الترجمة'                                   : 'Translation',
    again:       isAr ? 'ترجمة جديدة'                               : 'Translate again',
    reset:       isAr ? 'إعادة تعيين'                               : 'Reset',
    speak:       isAr ? 'استمع'                                     : 'Play',
    copy:        isAr ? 'نسخ'                                       : 'Copy',
    copied:      isAr ? 'تم!'                                       : 'Copied!',
    noSpeech:    isAr ? 'المتصفح لا يدعم التعرف على الصوت.'          : 'Speech recognition not supported.',
    failedTrans: isAr ? 'فشلت الترجمة، حاول مرة أخرى.'             : 'Translation failed. Please try again.',
  };

  const stateLabel =
    state === 'listening'   ? ui.listening   :
    state === 'translating' ? ui.translating : ui.tapToSpeak;

  // ── Start ──────────────────────────────────────────────────────
  const startListening = useCallback(() => {
    setError(''); setSourceText(''); setTranslated('');
    setState('listening');

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { setError(ui.noSpeech); setState('idle'); return; }

    const rec = new SpeechRecognition();
    rec.continuous = false; rec.interimResults = false; rec.maxAlternatives = 1;
    recognitionRef.current = rec;

    rec.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSourceText(transcript);
      setState('translating');
      try {
        const langName = isAr ? targetLang.labelAr : targetLang.label;
        const prompt = `Translate the following text to ${langName}. Return ONLY the translated text, nothing else, no quotes.\n\n${transcript}`;
        const res = await runPuterAgent(prompt, undefined, undefined, 'en', false);
        const result = res.text.replace(/^["'`]|["'`]$/g, '').trim();
        setTranslated(result);
        setState('done');
        speakText(result, targetLang.code);
      } catch {
        setError(ui.failedTrans);
        setState('idle');
      }
    };

    rec.onerror = (e: any) => { setError(`${isAr ? 'خطأ' : 'Error'}: ${e.error}`); setState('idle'); };
    rec.onend   = () => { if (state === 'listening') setState('idle'); };
    rec.start();
  }, [targetLang, isAr]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setState('idle');
  }, []);

  const reset = () => {
    recognitionRef.current?.stop();
    window.speechSynthesis.cancel();
    setState('idle'); setSourceText(''); setTranslated(''); setError('');
  };

  const copyResult = async () => {
    if (!translated) return;
    await navigator.clipboard.writeText(translated);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center pt-4 pb-28 px-4 overflow-hidden">
      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <Orb size={600} color="rgba(6,182,212,0.09)"  x="10%" y="15%" delay={0} />
        <Orb size={400} color="rgba(99,102,241,0.07)" x="85%" y="10%" delay={2} />
        <Orb size={350} color="rgba(6,182,212,0.06)"  x="65%" y="80%" delay={4} />
      </div>

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="relative z-10 text-center mb-8 flex flex-col items-center gap-3">
        <div className="flex items-center gap-2.5 px-6 py-2.5 rounded-full border"
          style={{ background: 'rgba(6,182,212,0.08)', borderColor: 'rgba(6,182,212,0.25)', boxShadow: '0 0 30px rgba(6,182,212,0.12)' }}>
          <Languages className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-black tracking-widest text-cyan-300 uppercase">{ui.title}</span>
        </div>
        <p className="text-slate-400 text-sm max-w-xs leading-relaxed">{ui.subtitle}</p>
      </div>

      {/* ── Two-column layout on large screens ──────────────────── */}
      <div className="relative z-10 w-full max-w-4xl flex flex-col lg:flex-row gap-6 items-start justify-center">

        {/* LEFT: controls */}
        <div className="flex flex-col items-center gap-7 w-full lg:w-64 shrink-0">
          <LangDropdown value={targetLang} onChange={(l) => { setTargetLang(l); reset(); }} isAr={isAr} />

          {/* Mic */}
          <MicButton state={state} onPress={startListening} onStop={stopListening} />

          {/* Status badge */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-500"
            style={{
              background: state === 'listening'   ? 'rgba(6,182,212,0.12)' :
                          state === 'translating' ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.04)',
              borderColor: state === 'listening'  ? 'rgba(6,182,212,0.4)' :
                           state === 'translating'? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.06)',
            }}>
            {state === 'translating' && <RefreshCw className="w-3 h-3 text-indigo-400 animate-spin" />}
            <span className={`text-[11px] font-black uppercase tracking-widest ${
              state === 'listening'   ? 'text-cyan-300' :
              state === 'translating' ? 'text-indigo-300' : 'text-slate-500' }`}>
              {stateLabel}
            </span>
          </div>

          {error && (
            <p className="text-red-400 text-xs text-center font-medium px-4 py-3 rounded-xl border border-red-500/20 bg-red-500/8 max-w-xs">
              {error}
            </p>
          )}
        </div>

        {/* RIGHT: result panels */}
        <div className="flex-1 w-full flex flex-col gap-5 min-h-[260px]">

          {/* Placeholder */}
          {!sourceText && !translated && (
            <div className="flex-1 flex flex-col items-center justify-center rounded-[2rem] border border-white/5 p-10 text-center"
              style={{ background: 'rgba(255,255,255,0.02)', minHeight: 260 }}>
              <Languages className="w-12 h-12 text-slate-700 mb-4" />
              <p className="text-slate-600 text-sm font-medium">
                {isAr ? 'نتيجة الترجمة ستظهر هنا' : 'Your translation will appear here'}
              </p>
            </div>
          )}

          {/* Source */}
          {sourceText && (
            <div className="rounded-[1.75rem] border border-white/8 p-6 transition-all"
              style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(12px)' }}>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">{ui.yourSpeech}</p>
              <p className="text-white text-base font-medium leading-relaxed">{sourceText}</p>
            </div>
          )}

          {/* Translation */}
          {translated && (
            <div className="rounded-[1.75rem] border p-6 transition-all"
              style={{
                background: 'rgba(6,182,212,0.05)',
                borderColor: 'rgba(6,182,212,0.22)',
                boxShadow: '0 0 50px rgba(6,182,212,0.08)',
                backdropFilter: 'blur(14px)',
              }}>
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{targetLang.flag}</span>
                  <p className="text-[10px] font-black uppercase tracking-widest text-cyan-500">{ui.result}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => speakText(translated, targetLang.code)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-cyan-400 border border-cyan-500/25 hover:border-cyan-500/60 hover:bg-cyan-500/10 transition-all">
                    <Volume2 className="w-3.5 h-3.5" />
                    {ui.speak}
                  </button>
                  <button onClick={copyResult}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all"
                    style={{ color: copied ? '#34d399' : '#94a3b8', borderColor: copied ? 'rgba(52,211,153,0.3)' : 'rgba(255,255,255,0.08)' }}>
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? ui.copied : ui.copy}
                  </button>
                </div>
              </div>

              <p className="text-white text-xl font-semibold leading-relaxed">{translated}</p>
            </div>
          )}

          {/* Actions */}
          {state === 'done' && (
            <div className="flex gap-3">
              <button onClick={startListening}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest text-white transition-all"
                style={{ background: 'linear-gradient(135deg,#06b6d4,#0284c7)', boxShadow: '0 0 30px rgba(6,182,212,0.35)' }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}>
                <Mic className="w-4 h-4" />
                {ui.again}
              </button>
              <button onClick={reset}
                className="px-5 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400 border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all flex items-center gap-2">
                <RotateCcw className="w-3.5 h-3.5" />
                {ui.reset}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TranslatorView;
