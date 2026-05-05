
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { runPuterAgent } from '../services/puterCore';
import {
  Languages, Mic, MicOff, Volume2, Copy, RefreshCw,
  ChevronDown, Check, RotateCcw, Keyboard, ArrowRight,
  ArrowLeftRight, Search
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────
type TranslatorState = 'idle' | 'listening' | 'translating' | 'done';
type InputMode = 'voice' | 'text';

interface LangOption {
  code: string; label: string; labelAr: string; flag: string; region: string;
}

const LANGUAGES: LangOption[] = [
  { code: 'en-US', label: 'English (US)',           labelAr: 'الإنجليزية (أمريكا)',   flag: '🇺🇸', region: 'Americas' },
  { code: 'en-GB', label: 'English (UK)',            labelAr: 'الإنجليزية (بريطانيا)', flag: '🇬🇧', region: 'Europe' },
  { code: 'ar-SA', label: 'Arabic',                  labelAr: 'العربية',               flag: '🇸🇦', region: 'Middle East' },
  { code: 'fr-FR', label: 'French',                  labelAr: 'الفرنسية',              flag: '🇫🇷', region: 'Europe' },
  { code: 'es-ES', label: 'Spanish',                 labelAr: 'الإسبانية',             flag: '🇪🇸', region: 'Europe' },
  { code: 'pt-BR', label: 'Portuguese (BR)',         labelAr: 'البرتغالية (البرازيل)', flag: '🇧🇷', region: 'Americas' },
  { code: 'de-DE', label: 'German',                  labelAr: 'الألمانية',             flag: '🇩🇪', region: 'Europe' },
  { code: 'it-IT', label: 'Italian',                 labelAr: 'الإيطالية',             flag: '🇮🇹', region: 'Europe' },
  { code: 'nl-NL', label: 'Dutch',                   labelAr: 'الهولندية',             flag: '🇳🇱', region: 'Europe' },
  { code: 'ru-RU', label: 'Russian',                 labelAr: 'الروسية',               flag: '🇷🇺', region: 'Europe' },
  { code: 'tr-TR', label: 'Turkish',                 labelAr: 'التركية',               flag: '🇹🇷', region: 'Middle East' },
  { code: 'fa-IR', label: 'Persian',                 labelAr: 'الفارسية',              flag: '🇮🇷', region: 'Middle East' },
  { code: 'ur-PK', label: 'Urdu',                    labelAr: 'الأردية',               flag: '🇵🇰', region: 'Asia' },
  { code: 'hi-IN', label: 'Hindi',                   labelAr: 'الهندية',               flag: '🇮🇳', region: 'Asia' },
  { code: 'bn-BD', label: 'Bengali',                 labelAr: 'البنغالية',             flag: '🇧🇩', region: 'Asia' },
  { code: 'id-ID', label: 'Indonesian',              labelAr: 'الإندونيسية',           flag: '🇮🇩', region: 'Asia' },
  { code: 'ms-MY', label: 'Malay',                   labelAr: 'الملايوية',             flag: '🇲🇾', region: 'Asia' },
  { code: 'th-TH', label: 'Thai',                    labelAr: 'التايلاندية',           flag: '🇹🇭', region: 'Asia' },
  { code: 'vi-VN', label: 'Vietnamese',              labelAr: 'الفيتنامية',            flag: '🇻🇳', region: 'Asia' },
  { code: 'zh-CN', label: 'Chinese (Simplified)',    labelAr: 'الصينية (مبسطة)',       flag: '🇨🇳', region: 'Asia' },
  { code: 'zh-TW', label: 'Chinese (Traditional)', labelAr: 'الصينية (تقليدية)',     flag: '🇹🇼', region: 'Asia' },
  { code: 'ja-JP', label: 'Japanese',                labelAr: 'اليابانية',             flag: '🇯🇵', region: 'Asia' },
  { code: 'ko-KR', label: 'Korean',                  labelAr: 'الكورية',               flag: '🇰🇷', region: 'Asia' },
  { code: 'sv-SE', label: 'Swedish',                 labelAr: 'السويدية',              flag: '🇸🇪', region: 'Europe' },
  { code: 'pl-PL', label: 'Polish',                  labelAr: 'البولندية',             flag: '🇵🇱', region: 'Europe' },
];

const isRTL = (code: string) => ['ar-SA','ur-PK','fa-IR','he-IL'].some(c => code.startsWith(c.split('-')[0]));

// ── TTS ───────────────────────────────────────────────────────────
function speakText(text: string, langCode: string) {
  const synth = window.speechSynthesis;
  synth.cancel();
  const pick = (vs: SpeechSynthesisVoice[]) =>
    vs.find(v => v.lang === langCode && (v.name.includes('Google') || v.name.includes('Microsoft'))) ??
    vs.find(v => v.lang === langCode) ??
    vs.find(v => v.lang.startsWith(langCode.split('-')[0])) ?? null;
  const go = (vs: SpeechSynthesisVoice[]) => {
    const u = new SpeechSynthesisUtterance(text);
    const v = pick(vs); if (v) u.voice = v;
    u.lang = langCode; u.rate = 0.85; u.pitch = 1.05; u.volume = 1; synth.speak(u);
  };
  const vs = synth.getVoices();
  if (vs.length) { go(vs); return; }
  synth.onvoiceschanged = () => { synth.onvoiceschanged = null; go(synth.getVoices()); };
  setTimeout(() => { const v = synth.getVoices(); if (v.length) go(v); }, 1200);
}

// ── Language Modal ────────────────────────────────────────────────
const LangModal: React.FC<{
  value: LangOption; onSelect: (l: LangOption) => void; onClose: () => void; isAr: boolean;
}> = ({ value, onSelect, onClose, isAr }) => {
  const [q, setQ] = useState('');
  const filtered = LANGUAGES.filter(l =>
    !q || l.label.toLowerCase().includes(q.toLowerCase()) || l.labelAr.includes(q) || l.code.toLowerCase().includes(q.toLowerCase())
  );
  const regions = [...new Set(filtered.map(l => l.region))];

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
      <div
        className="relative w-full max-w-md rounded-[2rem] border border-white/10 flex flex-col overflow-hidden"
        style={{ background: 'rgba(8,8,14,0.98)', boxShadow: '0 40px 100px rgba(0,0,0,0.8)', maxHeight: '80vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="p-5 border-b border-white/8">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">
            {isAr ? 'اختر اللغة' : 'Select Language'}
          </p>
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/8 bg-white/4">
            <Search className="w-4 h-4 text-slate-500 shrink-0" />
            <input
              autoFocus value={q} onChange={e => setQ(e.target.value)}
              placeholder={isAr ? 'بحث...' : 'Search languages...'}
              className="flex-1 bg-transparent text-white placeholder-slate-600 text-sm focus:outline-none"
            />
          </div>
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1 pb-4">
          {regions.map(region => (
            <div key={region}>
              <p className="px-5 pt-4 pb-2 text-[9px] font-black uppercase tracking-[0.25em] text-slate-700">{region}</p>
              <div className="grid grid-cols-2 gap-1 px-3">
                {filtered.filter(l => l.region === region).map(lang => (
                  <button key={lang.code}
                    onClick={() => { onSelect(lang); onClose(); }}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-white/6 transition-all text-left"
                    style={{ background: value.code === lang.code ? 'rgba(6,182,212,0.12)' : undefined,
                             border: value.code === lang.code ? '1px solid rgba(6,182,212,0.3)' : '1px solid transparent' }}>
                    <span className="text-xl">{lang.flag}</span>
                    <div className="min-w-0">
                      <p className={`font-bold text-xs truncate ${value.code === lang.code ? 'text-cyan-300' : 'text-slate-200'}`}>
                        {isAr ? lang.labelAr : lang.label}
                      </p>
                      <p className="text-[9px] text-slate-700 font-mono">{lang.code}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Waveform Bars ─────────────────────────────────────────────────
const Waveform: React.FC<{ active: boolean }> = ({ active }) => (
  <div className="flex items-center justify-center gap-[4px]" style={{ height: 40 }}>
    {[0.4,0.7,1,0.6,0.9,0.5,1,0.7,0.4,0.8,0.6,1,0.5].map((h, i) => (
      <div key={i} className="rounded-full"
        style={{
          width: 3, background: active ? `rgba(6,182,212,${0.4 + h * 0.6})` : 'rgba(255,255,255,0.07)',
          height: active ? `${Math.round(h * 36)}px` : '3px',
          transition: `height ${0.15 + i * 0.02}s ease-in-out ${active ? i * 0.04 + 's' : '0s'}`,
        }}
      />
    ))}
  </div>
);

// ── Main Component ────────────────────────────────────────────────
const TranslatorView: React.FC = () => {
  const isAr = document.documentElement.lang === 'ar';

  const [state, setState]           = useState<TranslatorState>('idle');
  const [mode, setMode]             = useState<InputMode>('voice');
  const [srcLang, setSrcLang]       = useState<LangOption>(LANGUAGES.find(l => l.code === (isAr ? 'ar-SA' : 'en-US'))!);
  const [tgtLang, setTgtLang]       = useState<LangOption>(LANGUAGES.find(l => l.code === (isAr ? 'en-US' : 'ar-SA'))!);
  const [srcModal, setSrcModal]     = useState(false);
  const [tgtModal, setTgtModal]     = useState(false);
  const [sourceText, setSourceText] = useState('');
  const [manualText, setManualText] = useState('');
  const [translated, setTranslated] = useState('');
  const [error, setError]           = useState('');
  const [copied, setCopied]         = useState(false);
  const [liveText, setLiveText]     = useState(''); // interim transcript shown while listening
  const recognitionRef              = useRef<any>(null);
  const finalTranscriptRef          = useRef('');   // accumulates confirmed words
  const isManualStopRef             = useRef(false);

  const reset = useCallback(() => {
    isManualStopRef.current = true;
    recognitionRef.current?.stop();
    window.speechSynthesis.cancel();
    setState('idle'); setSourceText(''); setTranslated(''); setError('');
    setManualText(''); setLiveText(''); finalTranscriptRef.current = '';
  }, []);

  const translate = useCallback(async (text: string) => {
    if (!text.trim()) return;
    setSourceText(text); setState('translating'); setError('');
    try {
      const name = isAr ? tgtLang.labelAr : tgtLang.label;
      const res  = await runPuterAgent(
        `Translate the following text to ${name}. Return ONLY the translated text, nothing else.\n\n${text}`,
        undefined, undefined, 'en', false
      );
      const out = res.text.replace(/^["'`]|["'`]$/g,'').trim();
      setTranslated(out); setState('done'); speakText(out, tgtLang.code);
    } catch {
      setError(isAr ? 'فشلت الترجمة. حاول مرة أخرى.' : 'Translation failed. Please try again.');
      setState('idle');
    }
  }, [tgtLang, isAr]);

  const startListening = useCallback(() => {
    setError(''); setSourceText(''); setTranslated('');
    setLiveText(''); finalTranscriptRef.current = '';
    isManualStopRef.current = false;
    setState('listening');

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setError(isAr ? 'المتصفح لا يدعم الصوت.' : 'Speech recognition not supported.'); setState('idle'); return; }

    const rec          = new SR();
    rec.continuous     = true;
    rec.interimResults = true;
    rec.lang           = srcLang.code;
    recognitionRef.current = rec;

    rec.onresult = (e: any) => {
      let interimPart = '';
      let newFinalPart = '';
      
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const transcript = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          newFinalPart += transcript + ' ';
        } else {
          interimPart += transcript;
        }
      }
      
      if (newFinalPart) {
        finalTranscriptRef.current += newFinalPart;
      }
      
      const fullText = (finalTranscriptRef.current + interimPart).trim();
      setLiveText(fullText);
    };

    rec.onerror = (e: any) => {
      if (e.error === 'network') setError(isAr ? 'خطأ في الشبكة.' : 'Network error.');
      if (e.error === 'not-allowed') setError(isAr ? 'الميكروفون محجوب.' : 'Microphone blocked.');
    };

    rec.onend = () => {
      // If the browser stopped it but the user didn't click Stop, RESTART.
      if (!isManualStopRef.current) {
        try { rec.start(); } catch (err) { console.error("Auto-restart failed:", err); }
      } else {
        setState(s => s === 'listening' ? 'idle' : s);
      }
    };
    
    rec.start();
  }, [srcLang, isAr]);

  // Stop listening and translate everything accumulated
  const stopAndTranslate = useCallback(() => {
    isManualStopRef.current = true;
    recognitionRef.current?.stop();
    const text = finalTranscriptRef.current.trim() || liveText.trim();
    if (text) translate(text);
    else setState('idle');
  }, [translate, liveText]);

  const swap = () => { const t = srcLang; setSrcLang(tgtLang); setTgtLang(t); reset(); };
  const copy = async () => { await navigator.clipboard.writeText(translated); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  const isListening   = state === 'listening';
  const isTranslating = state === 'translating';
  const isDone        = state === 'done';

  const ui = {
    src:     isAr ? 'من' : 'From',
    tgt:     isAr ? 'إلى' : 'To',
    voice:   isAr ? 'صوتي' : 'Voice',
    text:    isAr ? 'كتابة' : 'Text',
    tap:     isAr ? 'اضغط واتكلم' : 'Tap & speak',
    listen:  isAr ? 'تكلم... اضغط إيقاف عند الانتهاء ↓' : 'Speaking... press Stop when done ↓',
    loading: isAr ? 'جارٍ الترجمة...' : 'Translating...',
    result:  isAr ? 'الترجمة' : 'Translation',
    said:    isAr ? 'قلت' : 'You said',
    play:    isAr ? 'استمع' : 'Play',
    copyBtn: isAr ? 'نسخ' : 'Copy',
    copied:  isAr ? '✓ تم' : '✓ Copied',
    again:   isAr ? 'مرة أخرى' : 'Again',
    clear:   isAr ? 'مسح' : 'Clear',
    ph:      isAr ? 'اكتب هنا...' : 'Type here...',
    go:      isAr ? 'ترجم' : 'Translate',
    hint:    isAr ? 'Ctrl+Enter' : 'Ctrl+Enter',
    empty:   isAr ? 'الترجمة ستظهر هنا' : 'Translation appears here',
    recog:   isAr ? `يتعرف على: ${srcLang.flag} ${srcLang.labelAr}` : `Recognizing: ${srcLang.flag} ${srcLang.label}`,
  };

  return (
    <div className="relative min-h-[calc(100vh-80px)] flex flex-col items-center justify-start px-4 sm:px-6 pt-6 pb-20 overflow-x-hidden">

      {/* ── Ambient glows ───────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute rounded-full blur-[120px] opacity-30 animate-pulse"
          style={{ width: 700, height: 700, background: 'radial-gradient(circle,rgba(6,182,212,0.15),transparent)', left: '-10%', top: '-5%', animationDuration: '6s' }} />
        <div className="absolute rounded-full blur-[100px] opacity-20 animate-pulse"
          style={{ width: 500, height: 500, background: 'radial-gradient(circle,rgba(99,102,241,0.18),transparent)', right: '-5%', bottom: '10%', animationDuration: '8s', animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 w-full max-w-5xl mx-auto flex flex-col gap-6">

        {/* ── Hero label ─────────────────────────────────────────── */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2.5 px-6 py-2.5 rounded-full border mb-2"
            style={{ background: 'rgba(6,182,212,0.08)', borderColor: 'rgba(6,182,212,0.25)', boxShadow: '0 0 40px rgba(6,182,212,0.15)' }}>
            <Languages className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-black tracking-[0.2em] text-cyan-300 uppercase">
              {isAr ? 'المترجم الحي' : 'Live Translator'}
            </span>
          </div>
          <p className="text-slate-600 text-xs font-medium">
            {isAr ? '٢٥ لغة — صوت أو نص — مدعوم بالذكاء الاصطناعي' : '25 languages · Voice or text · AI-powered'}
          </p>
        </div>

        {/* ── Language Bar ────────────────────────────────────────── */}
        <div className="flex items-stretch gap-2 sm:gap-3 rounded-2xl border border-white/8 p-2"
          style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)' }}>

          {/* Source language */}
          <button onClick={() => setSrcModal(true)}
            className="flex-1 flex items-center gap-3 px-4 sm:px-5 py-3.5 rounded-xl hover:bg-white/6 transition-all group text-left min-w-0">
            <span className="text-2xl sm:text-3xl shrink-0">{srcLang.flag}</span>
            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-600 mb-0.5">{ui.src}</p>
              <p className="text-white font-bold text-sm sm:text-base truncate leading-tight">{isAr ? srcLang.labelAr : srcLang.label}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-600 group-hover:text-slate-400 shrink-0 transition-colors" />
          </button>

          {/* Swap */}
          <button onClick={swap}
            className="shrink-0 flex flex-col items-center justify-center px-3 py-2 rounded-xl border border-white/8 hover:border-cyan-500/30 hover:bg-cyan-500/8 transition-all group"
            title="Swap languages">
            <ArrowLeftRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 transition-colors" />
          </button>

          {/* Target language */}
          <button onClick={() => setTgtModal(true)}
            className="flex-1 flex items-center gap-3 px-4 sm:px-5 py-3.5 rounded-xl hover:bg-white/6 transition-all group text-left min-w-0">
            <span className="text-2xl sm:text-3xl shrink-0">{tgtLang.flag}</span>
            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-600 mb-0.5">{ui.tgt}</p>
              <p className="text-white font-bold text-sm sm:text-base truncate leading-tight">{isAr ? tgtLang.labelAr : tgtLang.label}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-600 group-hover:text-slate-400 shrink-0 transition-colors" />
          </button>
        </div>

        {/* ── Mode Tabs ───────────────────────────────────────────── */}
        <div className="flex rounded-xl border border-white/8 p-1 w-fit mx-auto"
          style={{ background: 'rgba(255,255,255,0.03)' }}>
          {([['voice', ui.voice, Mic], ['text', ui.text, Keyboard]] as const).map(([m, label, Icon]) => (
            <button key={m} onClick={() => { setMode(m); reset(); }}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all"
              style={{
                background: mode === m ? 'rgba(6,182,212,0.15)' : 'transparent',
                color:      mode === m ? '#22d3ee' : '#475569',
                border:     mode === m ? '1px solid rgba(6,182,212,0.35)' : '1px solid transparent',
                boxShadow:  mode === m ? '0 0 20px rgba(6,182,212,0.15)' : 'none',
              }}>
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* ── Main panels ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* INPUT PANEL */}
          <div className="relative rounded-[1.75rem] border border-white/8 overflow-hidden flex flex-col"
            style={{ background: 'rgba(5,5,7,0.8)', backdropFilter: 'blur(20px)', minHeight: 320 }}>

            {/* Top bar of panel */}
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-white/5">
              <span className="text-base">{srcLang.flag}</span>
              <span className="text-xs font-black text-slate-400">{isAr ? srcLang.labelAr : srcLang.label}</span>
            </div>

            {mode === 'voice' ? (
              /* VOICE MODE */
              <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8">
                {/* Big Mic Button */}
                <div className="relative flex items-center justify-center">
                  {isListening && (
                    <div className="absolute rounded-full animate-ping"
                      style={{ width: 180, height: 180, background: 'radial-gradient(circle,rgba(6,182,212,0.15),transparent)', animationDuration: '1.5s' }} />
                  )}
                  {[100,130,160].map((s,i) => isListening && (
                    <div key={i} className="absolute rounded-full border border-cyan-400/20 animate-ping"
                      style={{ width: s, height: s, animationDuration: `${1.2+i*0.4}s`, animationDelay: `${i*0.2}s` }} />
                  ))}

                  <button
                    onClick={isListening ? stopAndTranslate : startListening}
                    disabled={isTranslating}
                    className="relative z-10 rounded-full flex items-center justify-center focus:outline-none transition-all duration-300 active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      width: 100, height: 100,
                      background: isListening
                        ? 'linear-gradient(135deg,#ef4444,#dc2626)'
                        : 'linear-gradient(135deg,#0f172a,#1e293b)',
                      boxShadow: isListening
                        ? '0 0 80px rgba(239,68,68,0.6), 0 0 40px rgba(239,68,68,0.3), inset 0 1px 0 rgba(255,255,255,0.2)'
                        : '0 0 40px rgba(6,182,212,0.1), 0 8px 30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
                      border: isListening ? '2px solid rgba(239,68,68,0.8)' : '2px solid rgba(255,255,255,0.08)',
                    }}>
                    {isTranslating
                      ? <RefreshCw className="w-9 h-9 text-indigo-400 animate-spin" />
                      : isListening
                      ? <MicOff className="w-9 h-9 text-white" />
                      : <Mic className="w-9 h-9 text-cyan-400" />
                    }
                  </button>
                </div>

                <Waveform active={isListening} />

                {/* Live transcript box — shown while listening */}
                {isListening && (
                  <div className="w-full rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4 min-h-[60px] max-h-[120px] overflow-y-auto"
                    dir={isRTL(srcLang.code) ? 'rtl' : 'ltr'}>
                    {liveText
                      ? <p className="text-cyan-100 text-sm leading-relaxed font-medium">{liveText}</p>
                      : <p className="text-slate-600 text-sm italic">{isAr ? 'تكلم الآن...' : 'Start speaking...'}</p>
                    }
                  </div>
                )}

                {/* Status text */}
                <div className="text-center">
                  <p className={`text-sm font-bold transition-all duration-300 ${isListening ? 'text-red-400' : isTranslating ? 'text-indigo-300' : 'text-slate-600'}`}>
                    {isTranslating ? ui.loading : isListening ? ui.listen : ui.tap}
                  </p>
                  {!isListening && !isTranslating && (
                    <p className="text-[11px] text-slate-700 mt-1">{ui.recog}</p>
                  )}
                </div>
              </div>
            ) : (
              /* TEXT MODE */
              <div className="flex-1 flex flex-col">
                <textarea
                  value={manualText}
                  onChange={e => setManualText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); translate(manualText); } }}
                  placeholder={ui.ph}
                  dir={isRTL(srcLang.code) ? 'rtl' : 'ltr'}
                  className="flex-1 w-full bg-transparent text-white placeholder-slate-700 text-base sm:text-lg font-medium leading-relaxed resize-none focus:outline-none p-5"
                  style={{ minHeight: 200 }}
                />
                <div className="flex items-center justify-between px-5 py-3 border-t border-white/5">
                  <p className="text-[10px] text-slate-700">{ui.hint}</p>
                  <div className="flex items-center gap-2">
                    {manualText && (
                      <button onClick={() => setManualText('')} className="text-[10px] font-bold text-slate-600 hover:text-slate-400 transition-colors uppercase tracking-widest">
                        {ui.clear}
                      </button>
                    )}
                    <button
                      onClick={() => translate(manualText)}
                      disabled={!manualText.trim() || isTranslating}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      style={{ background: 'linear-gradient(135deg,#06b6d4,#0891b2)', boxShadow: '0 0 25px rgba(6,182,212,0.3)' }}>
                      {isTranslating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
                      {isTranslating ? '...' : ui.go}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* OUTPUT PANEL */}
          <div className="relative rounded-[1.75rem] border overflow-hidden flex flex-col transition-all duration-500"
            style={{
              background:   translated ? 'rgba(6,182,212,0.04)' : 'rgba(5,5,7,0.6)',
              borderColor:  translated ? 'rgba(6,182,212,0.2)'  : 'rgba(255,255,255,0.06)',
              boxShadow:    translated ? '0 0 60px rgba(6,182,212,0.08)' : 'none',
              backdropFilter: 'blur(20px)',
              minHeight: 320,
            }}>

            {/* Top bar */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b"
              style={{ borderColor: translated ? 'rgba(6,182,212,0.12)' : 'rgba(255,255,255,0.05)' }}>
              <div className="flex items-center gap-2">
                <span className="text-base">{tgtLang.flag}</span>
                <span className={`text-xs font-black ${translated ? 'text-cyan-500' : 'text-slate-600'}`}>
                  {isAr ? tgtLang.labelAr : tgtLang.label}
                </span>
              </div>
              {translated && (
                <div className="flex items-center gap-2">
                  <button onClick={() => speakText(translated, tgtLang.code)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest text-cyan-400 border border-cyan-500/20 hover:border-cyan-500/50 hover:bg-cyan-500/10 transition-all">
                    <Volume2 className="w-3 h-3" />{ui.play}
                  </button>
                  <button onClick={copy}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all"
                    style={{ color: copied ? '#34d399' : '#64748b', borderColor: copied ? 'rgba(52,211,153,0.3)' : 'rgba(255,255,255,0.08)' }}>
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copied ? ui.copied : ui.copyBtn}
                  </button>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col p-5 gap-4">
              {translated ? (
                <>
                  {/* Source echo */}
                  {sourceText && (
                    <div className="px-4 py-3 rounded-xl border border-white/5 bg-white/2">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-700 mb-1">{ui.said}</p>
                      <p className="text-slate-500 text-sm leading-relaxed"
                        dir={isRTL(srcLang.code) ? 'rtl' : 'ltr'}>{sourceText}</p>
                    </div>
                  )}
                  {/* Translation */}
                  <p className="text-white text-2xl sm:text-3xl font-bold leading-relaxed flex-1"
                    dir={isRTL(tgtLang.code) ? 'rtl' : 'ltr'}
                    style={{ textShadow: '0 0 40px rgba(6,182,212,0.2)' }}>
                    {translated}
                  </p>
                </>
              ) : isTranslating ? (
                <div className="flex-1 flex items-center justify-center gap-3">
                  <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin" />
                  <span className="text-indigo-300 text-sm font-bold">{ui.loading}</span>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 opacity-30">
                  <Languages className="w-14 h-14 text-slate-700" />
                  <p className="text-slate-600 text-sm font-medium">{ui.empty}</p>
                </div>
              )}
            </div>

            {/* Action row */}
            {isDone && (
              <div className="px-5 pb-5 flex gap-3">
                <button
                  onClick={mode === 'voice' ? startListening : () => translate(manualText)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-xs uppercase tracking-widest text-white transition-all"
                  style={{ background: 'linear-gradient(135deg,#06b6d4,#0891b2)', boxShadow: '0 0 25px rgba(6,182,212,0.3)' }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-1px)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}>
                  {mode === 'voice' ? <Mic className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                  {ui.again}
                </button>
                <button onClick={reset}
                  className="px-4 py-3 rounded-xl font-black text-xs uppercase tracking-widest text-slate-500 border border-white/8 hover:border-white/15 hover:bg-white/4 transition-all flex items-center gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5" />{ui.clear}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="px-5 py-3.5 rounded-xl border border-red-500/20 bg-red-500/6 text-red-400 text-sm text-center font-medium">
            {error}
          </div>
        )}
      </div>

      {/* Modals */}
      {srcModal && <LangModal value={srcLang} onSelect={l => { setSrcLang(l); reset(); }} onClose={() => setSrcModal(false)} isAr={isAr} />}
      {tgtModal && <LangModal value={tgtLang} onSelect={l => { setTgtLang(l); reset(); }} onClose={() => setTgtModal(false)} isAr={isAr} />}
    </div>
  );
};

export default TranslatorView;
