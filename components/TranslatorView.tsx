
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { runPuterAgent } from '../services/puterCore';
import {
  Languages, Mic, MicOff, Volume2, Copy, RefreshCw,
  ChevronDown, Check, RotateCcw, Keyboard, ArrowRight
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────
type TranslatorState = 'idle' | 'listening' | 'translating' | 'done';
type InputMode = 'voice' | 'text';

interface LangOption {
  code: string;
  label: string;
  labelAr: string;
  flag: string;
  region: string;
}

// ── 25 Languages ──────────────────────────────────────────────────
const LANGUAGES: LangOption[] = [
  { code: 'en-US', label: 'English (US)',          labelAr: 'الإنجليزية (أمريكا)',   flag: '🇺🇸', region: 'Americas' },
  { code: 'en-GB', label: 'English (UK)',           labelAr: 'الإنجليزية (بريطانيا)', flag: '🇬🇧', region: 'Europe' },
  { code: 'ar-SA', label: 'Arabic',                 labelAr: 'العربية',               flag: '🇸🇦', region: 'Middle East' },
  { code: 'fr-FR', label: 'French',                 labelAr: 'الفرنسية',              flag: '🇫🇷', region: 'Europe' },
  { code: 'es-ES', label: 'Spanish',                labelAr: 'الإسبانية',             flag: '🇪🇸', region: 'Europe' },
  { code: 'pt-BR', label: 'Portuguese (Brazil)',    labelAr: 'البرتغالية (البرازيل)', flag: '🇧🇷', region: 'Americas' },
  { code: 'de-DE', label: 'German',                 labelAr: 'الألمانية',             flag: '🇩🇪', region: 'Europe' },
  { code: 'it-IT', label: 'Italian',                labelAr: 'الإيطالية',             flag: '🇮🇹', region: 'Europe' },
  { code: 'nl-NL', label: 'Dutch',                  labelAr: 'الهولندية',             flag: '🇳🇱', region: 'Europe' },
  { code: 'ru-RU', label: 'Russian',                labelAr: 'الروسية',               flag: '🇷🇺', region: 'Europe' },
  { code: 'tr-TR', label: 'Turkish',                labelAr: 'التركية',               flag: '🇹🇷', region: 'Middle East' },
  { code: 'fa-IR', label: 'Persian (Farsi)',         labelAr: 'الفارسية',              flag: '🇮🇷', region: 'Middle East' },
  { code: 'ur-PK', label: 'Urdu',                   labelAr: 'الأردية',               flag: '🇵🇰', region: 'Asia' },
  { code: 'hi-IN', label: 'Hindi',                  labelAr: 'الهندية',               flag: '🇮🇳', region: 'Asia' },
  { code: 'bn-BD', label: 'Bengali',                labelAr: 'البنغالية',             flag: '🇧🇩', region: 'Asia' },
  { code: 'id-ID', label: 'Indonesian',             labelAr: 'الإندونيسية',           flag: '🇮🇩', region: 'Asia' },
  { code: 'ms-MY', label: 'Malay',                  labelAr: 'الملايوية',             flag: '🇲🇾', region: 'Asia' },
  { code: 'th-TH', label: 'Thai',                   labelAr: 'التايلاندية',           flag: '🇹🇭', region: 'Asia' },
  { code: 'vi-VN', label: 'Vietnamese',             labelAr: 'الفيتنامية',            flag: '🇻🇳', region: 'Asia' },
  { code: 'zh-CN', label: 'Chinese (Simplified)',   labelAr: 'الصينية (مبسطة)',       flag: '🇨🇳', region: 'Asia' },
  { code: 'zh-TW', label: 'Chinese (Traditional)', labelAr: 'الصينية (تقليدية)',     flag: '🇹🇼', region: 'Asia' },
  { code: 'ja-JP', label: 'Japanese',               labelAr: 'اليابانية',             flag: '🇯🇵', region: 'Asia' },
  { code: 'ko-KR', label: 'Korean',                 labelAr: 'الكورية',               flag: '🇰🇷', region: 'Asia' },
  { code: 'sv-SE', label: 'Swedish',                labelAr: 'السويدية',              flag: '🇸🇪', region: 'Europe' },
  { code: 'pl-PL', label: 'Polish',                 labelAr: 'البولندية',             flag: '🇵🇱', region: 'Europe' },
];

// ── TTS ───────────────────────────────────────────────────────────
function speakText(text: string, langCode: string) {
  const synth = window.speechSynthesis;
  synth.cancel();

  const pickVoice = (voices: SpeechSynthesisVoice[]) => {
    const lang2 = langCode.split('-')[0];
    return (
      voices.find(v => v.lang === langCode && (v.name.includes('Google') || v.name.includes('Microsoft') || v.name.includes('neural'))) ??
      voices.find(v => v.lang === langCode) ??
      voices.find(v => v.lang.startsWith(lang2)) ??
      null
    );
  };

  const doSpeak = (voices: SpeechSynthesisVoice[]) => {
    const utt    = new SpeechSynthesisUtterance(text);
    const voice  = pickVoice(voices);
    if (voice) utt.voice = voice;
    utt.lang = langCode; utt.rate = 0.85; utt.pitch = 1.05; utt.volume = 1.0;
    synth.speak(utt);
  };

  const voices = synth.getVoices();
  if (voices.length > 0) { doSpeak(voices); return; }
  synth.onvoiceschanged = () => { synth.onvoiceschanged = null; doSpeak(synth.getVoices()); };
  setTimeout(() => { const v = synth.getVoices(); if (v.length > 0) doSpeak(v); }, 1200);
}

// ── Ambient orb ───────────────────────────────────────────────────
const Orb: React.FC<{ size: number; color: string; x: string; y: string; delay: number }> = ({ size, color, x, y, delay }) => (
  <div className="absolute rounded-full pointer-events-none blur-[90px] animate-pulse"
    style={{ width: size, height: size, background: color, left: x, top: y, transform: 'translate(-50%,-50%)', animationDelay: `${delay}s`, animationDuration: `${4 + delay}s` }} />
);

// ── Waveform ──────────────────────────────────────────────────────
const Waveform: React.FC<{ active: boolean }> = ({ active }) => (
  <div className="flex items-center gap-[3px] h-7">
    {[0.6, 1, 0.75, 1, 0.5, 0.85, 0.6, 1, 0.7].map((h, i) => (
      <div key={i} className="rounded-full transition-all duration-300"
        style={{
          width: 3, height: active ? `${h * 28}px` : '3px',
          background: active ? `rgba(6,182,212,${0.5 + h * 0.5})` : 'rgba(255,255,255,0.1)',
          transition: `height ${0.2 + i * 0.03}s ease-in-out`,
        }}
      />
    ))}
  </div>
);

// ── Searchable Language Dropdown ──────────────────────────────────
const LangPicker: React.FC<{
  value: LangOption; onChange: (l: LangOption) => void; isAr: boolean; label: string;
}> = ({ value, onChange, isAr, label }) => {
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
    return l.label.toLowerCase().includes(q) || l.labelAr.includes(q) || l.code.toLowerCase().includes(q);
  });
  const regions = [...new Set(filtered.map(l => l.region))];

  return (
    <div className="relative flex-1" ref={ref}>
      <p className="text-[9px] font-black uppercase tracking-widest text-slate-600 mb-1.5">{label}</p>
      <button
        onClick={() => { setOpen(p => !p); setSearch(''); }}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl border border-white/8 hover:border-cyan-500/30 transition-all text-left"
        style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(12px)' }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg shrink-0">{value.flag}</span>
          <div className="min-w-0">
            <p className="text-white font-bold text-xs leading-tight truncate">{isAr ? value.labelAr : value.label}</p>
            <p className="text-slate-600 text-[9px] font-mono">{value.code}</p>
          </div>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-500 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute mt-1.5 w-full rounded-2xl border border-white/10 overflow-hidden z-50 flex flex-col"
          style={{ background: 'rgba(8,8,12,0.98)', backdropFilter: 'blur(24px)', boxShadow: '0 20px 60px rgba(0,0,0,0.8)', maxHeight: 300, minWidth: 220 }}>
          <div className="p-2.5 border-b border-white/5">
            <input autoFocus value={search} onChange={e => setSearch(e.target.value)}
              placeholder={isAr ? 'بحث...' : 'Search...'}
              className="w-full bg-white/5 text-white placeholder-slate-600 text-xs px-3 py-2 rounded-lg border border-white/8 focus:outline-none focus:border-cyan-500/40 transition-colors" />
          </div>
          <div className="overflow-y-auto">
            {regions.map(region => (
              <div key={region}>
                <p className="px-3 pt-2.5 pb-1 text-[8px] font-black uppercase tracking-widest text-slate-700">{region}</p>
                {filtered.filter(l => l.region === region).map(lang => (
                  <button key={lang.code} onClick={() => { onChange(lang); setOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-cyan-500/10 transition-colors">
                    <span className="text-base shrink-0">{lang.flag}</span>
                    <div className="text-left flex-1 min-w-0">
                      <p className={`font-bold text-xs leading-tight truncate ${value.code === lang.code ? 'text-cyan-300' : 'text-slate-200'}`}>
                        {isAr ? lang.labelAr : lang.label}
                      </p>
                      <p className="text-slate-700 text-[9px] font-mono">{lang.code}</p>
                    </div>
                    {value.code === lang.code && <Check className="w-3 h-3 text-cyan-400 shrink-0" />}
                  </button>
                ))}
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="text-center text-slate-600 text-xs py-5">{isAr ? 'لا نتائج' : 'No results'}</p>
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
  const [inputMode, setInputMode]   = useState<InputMode>('voice');
  const [sourceLang, setSourceLang] = useState<LangOption>(LANGUAGES.find(l => l.code === (isAr ? 'ar-SA' : 'en-US')) ?? LANGUAGES[0]);
  const [targetLang, setTargetLang] = useState<LangOption>(LANGUAGES.find(l => l.code === (isAr ? 'en-US' : 'ar-SA')) ?? LANGUAGES[2]);
  const [sourceText, setSourceText] = useState('');
  const [manualText, setManualText] = useState('');
  const [translated, setTranslated] = useState('');
  const [error, setError]           = useState('');
  const [copied, setCopied]         = useState(false);

  const recognitionRef = useRef<any>(null);

  const ui = {
    title:       isAr ? 'المترجم الحي'                        : 'Live Translator',
    subtitle:    isAr ? 'صوتاً أو نصاً — نترجم فوراً'          : 'Voice or text — translated instantly',
    sourceLang:  isAr ? 'لغتك (تتكلم بها)'                   : 'Your language (speaking)',
    targetLang:  isAr ? 'ترجم إلى'                            : 'Translate to',
    tapToSpeak:  isAr ? 'اضغط للتحدث'                         : 'Tap to speak',
    listening:   isAr ? 'جارٍ الاستماع...'                    : 'Listening...',
    translating: isAr ? 'جارٍ الترجمة...'                     : 'Translating...',
    yourSpeech:  isAr ? 'ما قلته'                             : 'You said',
    result:      isAr ? 'الترجمة'                             : 'Translation',
    again:       isAr ? 'ترجمة جديدة'                         : 'Translate again',
    reset:       isAr ? 'إعادة'                               : 'Reset',
    speak:       isAr ? 'استمع'                               : 'Play',
    copy:        isAr ? 'نسخ'                                 : 'Copy',
    copied:      isAr ? 'تم!'                                 : 'Copied!',
    voiceTab:    isAr ? 'صوتي'                                : 'Voice',
    textTab:     isAr ? 'كتابة'                               : 'Text',
    placeholder: isAr ? 'اكتب النص هنا للترجمة...'            : 'Type text here to translate...',
    translateBtn:isAr ? 'ترجم'                                : 'Translate',
    noSpeech:    isAr ? 'المتصفح لا يدعم التعرف على الصوت.'   : 'Speech recognition not supported.',
    failedTrans: isAr ? 'فشلت الترجمة، حاول مرة أخرى.'       : 'Translation failed. Please try again.',
    placeholder2:isAr ? 'النتيجة ستظهر هنا'                  : 'Result will appear here',
    swap:        isAr ? 'تبديل'                               : 'Swap',
  };

  const stateLabel =
    state === 'listening'   ? ui.listening   :
    state === 'translating' ? ui.translating : ui.tapToSpeak;

  // ── Core translate logic ───────────────────────────────────────
  const translate = useCallback(async (text: string) => {
    if (!text.trim()) return;
    setSourceText(text);
    setState('translating');
    setError('');
    try {
      const tLang = isAr ? targetLang.labelAr : targetLang.label;
      const prompt = `Translate the following text to ${tLang}. Return ONLY the translated text, no explanations, no quotes.\n\n${text}`;
      const res    = await runPuterAgent(prompt, undefined, undefined, 'en', false);
      const result = res.text.replace(/^["'`]|["'`]$/g, '').trim();
      setTranslated(result);
      setState('done');
      speakText(result, targetLang.code);
    } catch {
      setError(ui.failedTrans);
      setState('idle');
    }
  }, [targetLang, isAr]);

  // ── Voice ──────────────────────────────────────────────────────
  const startListening = useCallback(() => {
    setError(''); setSourceText(''); setTranslated('');
    setState('listening');
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setError(ui.noSpeech); setState('idle'); return; }

    const rec          = new SR();
    rec.continuous     = false;
    rec.interimResults = false;
    rec.maxAlternatives= 1;
    rec.lang           = sourceLang.code; // ← uses selected source language
    recognitionRef.current = rec;

    rec.onresult = (event: any) => {
      translate(event.results[0][0].transcript);
    };
    rec.onerror = (e: any) => { setError(`${isAr ? 'خطأ' : 'Error'}: ${e.error}`); setState('idle'); };
    rec.onend   = () => { if (state === 'listening') setState('idle'); };
    rec.start();
  }, [sourceLang, translate, isAr]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop(); setState('idle');
  }, []);

  const reset = () => {
    recognitionRef.current?.stop();
    window.speechSynthesis.cancel();
    setState('idle'); setSourceText(''); setTranslated(''); setError(''); setManualText('');
  };

  const swapLangs = () => {
    const tmp = sourceLang;
    setSourceLang(targetLang);
    setTargetLang(tmp);
    reset();
  };

  const copyResult = async () => {
    if (!translated) return;
    await navigator.clipboard.writeText(translated);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center pt-4 pb-28 px-4 overflow-hidden">

      {/* Ambient orbs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <Orb size={600} color="rgba(6,182,212,0.09)"  x="10%" y="15%" delay={0} />
        <Orb size={400} color="rgba(99,102,241,0.07)" x="85%" y="10%" delay={2} />
        <Orb size={350} color="rgba(6,182,212,0.06)"  x="65%" y="80%" delay={4} />
      </div>

      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="relative z-10 text-center mb-6 flex flex-col items-center gap-2">
        <div className="flex items-center gap-2.5 px-6 py-2.5 rounded-full border"
          style={{ background: 'rgba(6,182,212,0.08)', borderColor: 'rgba(6,182,212,0.25)', boxShadow: '0 0 30px rgba(6,182,212,0.12)' }}>
          <Languages className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-black tracking-widest text-cyan-300 uppercase">{ui.title}</span>
        </div>
        <p className="text-slate-500 text-xs">{ui.subtitle}</p>
      </div>

      <div className="relative z-10 w-full max-w-3xl flex flex-col gap-5">

        {/* ── Language Pair Row ─────────────────────────────────── */}
        <div className="flex items-end gap-3">
          <LangPicker value={sourceLang} onChange={(l) => { setSourceLang(l); reset(); }} isAr={isAr} label={ui.sourceLang} />

          {/* Swap button */}
          <button onClick={swapLangs}
            className="shrink-0 mb-0.5 flex flex-col items-center gap-1 px-3 py-3 rounded-xl border border-white/8 hover:border-cyan-500/30 hover:bg-white/5 transition-all text-slate-500 hover:text-cyan-400"
            title={ui.swap}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
            </svg>
            <span className="text-[8px] font-black uppercase tracking-wider">{ui.swap}</span>
          </button>

          <LangPicker value={targetLang} onChange={(l) => { setTargetLang(l); reset(); }} isAr={isAr} label={ui.targetLang} />
        </div>

        {/* ── Mode Tabs ─────────────────────────────────────────── */}
        <div className="flex gap-2 p-1 rounded-xl border border-white/8 w-fit"
          style={{ background: 'rgba(255,255,255,0.03)' }}>
          {(['voice', 'text'] as InputMode[]).map(mode => (
            <button key={mode}
              onClick={() => { setInputMode(mode); reset(); }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all"
              style={{
                background: inputMode === mode ? 'rgba(6,182,212,0.15)' : 'transparent',
                color:      inputMode === mode ? '#22d3ee' : '#64748b',
                border:     inputMode === mode ? '1px solid rgba(6,182,212,0.35)' : '1px solid transparent',
              }}>
              {mode === 'voice' ? <Mic className="w-3.5 h-3.5" /> : <Keyboard className="w-3.5 h-3.5" />}
              {mode === 'voice' ? ui.voiceTab : ui.textTab}
            </button>
          ))}
        </div>

        {/* ── Input Area ────────────────────────────────────────── */}
        <div className="flex flex-col lg:flex-row gap-5">

          {/* LEFT: voice or text input */}
          <div className="flex-1 flex flex-col items-center gap-5">
            {inputMode === 'voice' ? (
              /* Voice controls */
              <div className="w-full flex flex-col items-center gap-5 rounded-[1.75rem] border border-white/8 p-8"
                style={{ background: 'rgba(255,255,255,0.02)' }}>

                {/* Mic button */}
                <div className="relative flex flex-col items-center gap-4">
                  {state === 'listening' && (
                    <div className="absolute flex items-center justify-center pointer-events-none" style={{ inset: '-30px' }}>
                      {[1, 1.5, 2].map((s, i) => (
                        <div key={i} className="absolute rounded-full border border-cyan-400/25 animate-ping"
                          style={{ width: 80 * s, height: 80 * s, animationDuration: `${1.4 + i * 0.5}s`, animationDelay: `${i * 0.25}s` }} />
                      ))}
                    </div>
                  )}
                  <button
                    onClick={state === 'listening' ? stopListening : startListening}
                    disabled={state === 'translating'}
                    className="relative z-10 flex items-center justify-center rounded-full focus:outline-none active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      width: 80, height: 80,
                      background: state === 'listening' ? 'linear-gradient(135deg,#06b6d4,#0284c7)' : 'linear-gradient(135deg,#1e293b,#0f172a)',
                      boxShadow:  state === 'listening' ? '0 0 60px rgba(6,182,212,0.7),0 0 20px rgba(6,182,212,0.4)' : '0 0 20px rgba(6,182,212,0.1)',
                      border:     state === 'listening' ? '2px solid rgba(6,182,212,0.9)' : '2px solid rgba(255,255,255,0.08)',
                      transition: 'all 0.35s cubic-bezier(0.23,1,0.32,1)',
                    }}>
                    {state === 'translating'
                      ? <RefreshCw className="w-7 h-7 text-indigo-400 animate-spin" />
                      : state === 'listening'
                      ? <MicOff className="w-7 h-7 text-white" />
                      : <Mic className="w-7 h-7 text-cyan-400" />}
                  </button>
                  <Waveform active={state === 'listening'} />
                </div>

                {/* Status badge */}
                <div className="flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-500"
                  style={{
                    background:   state === 'listening' ? 'rgba(6,182,212,0.12)' : state === 'translating' ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.04)',
                    borderColor:  state === 'listening' ? 'rgba(6,182,212,0.4)'  : state === 'translating' ? 'rgba(99,102,241,0.4)'  : 'rgba(255,255,255,0.06)',
                  }}>
                  {state === 'translating' && <RefreshCw className="w-3 h-3 text-indigo-400 animate-spin" />}
                  <span className={`text-[10px] font-black uppercase tracking-widest ${
                    state === 'listening' ? 'text-cyan-300' : state === 'translating' ? 'text-indigo-300' : 'text-slate-500'}`}>
                    {stateLabel}
                  </span>
                </div>

                {/* Source lang reminder */}
                <p className="text-[10px] text-slate-600 font-medium">
                  {isAr ? `يتعرف على:` : 'Recognizing:'} <span className="text-cyan-700 font-black">{sourceLang.flag} {isAr ? sourceLang.labelAr : sourceLang.label}</span>
                </p>
              </div>
            ) : (
              /* Text input */
              <div className="w-full flex flex-col gap-3 rounded-[1.75rem] border border-white/8 p-5"
                style={{ background: 'rgba(255,255,255,0.02)' }}>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">
                  {isAr ? `اكتب بـ: ${sourceLang.flag} ${sourceLang.labelAr}` : `Type in: ${sourceLang.flag} ${sourceLang.label}`}
                </p>
                <textarea
                  value={manualText}
                  onChange={e => setManualText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); translate(manualText); } }}
                  placeholder={ui.placeholder}
                  dir={sourceLang.code.startsWith('ar') || sourceLang.code.startsWith('ur') || sourceLang.code.startsWith('fa') || sourceLang.code.startsWith('he') ? 'rtl' : 'ltr'}
                  rows={5}
                  className="w-full bg-transparent text-white placeholder-slate-600 text-sm leading-relaxed resize-none focus:outline-none font-medium"
                />
                <button
                  onClick={() => translate(manualText)}
                  disabled={!manualText.trim() || state === 'translating'}
                  className="self-end flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ background: 'linear-gradient(135deg,#06b6d4,#0284c7)', boxShadow: '0 0 20px rgba(6,182,212,0.3)' }}
                  onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  {state === 'translating' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
                  {state === 'translating' ? ui.translating : ui.translateBtn}
                </button>
                <p className="text-[9px] text-slate-700 text-right">{isAr ? 'Ctrl+Enter للترجمة' : 'Ctrl+Enter to translate'}</p>
              </div>
            )}

            {error && (
              <p className="w-full text-red-400 text-xs text-center font-medium px-4 py-3 rounded-xl border border-red-500/20 bg-red-500/8">
                {error}
              </p>
            )}
          </div>

          {/* RIGHT: result */}
          <div className="flex-1 flex flex-col gap-4">

            {/* Source text */}
            {sourceText && (
              <div className="rounded-[1.5rem] border border-white/8 p-5"
                style={{ background: 'rgba(255,255,255,0.03)' }}>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-600 mb-2">{ui.yourSpeech}</p>
                <p className="text-slate-300 text-sm font-medium leading-relaxed">{sourceText}</p>
              </div>
            )}

            {/* Translation result */}
            {translated ? (
              <div className="flex-1 rounded-[1.5rem] border p-5"
                style={{ background: 'rgba(6,182,212,0.05)', borderColor: 'rgba(6,182,212,0.22)', boxShadow: '0 0 40px rgba(6,182,212,0.07)' }}>
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span>{targetLang.flag}</span>
                    <p className="text-[9px] font-black uppercase tracking-widest text-cyan-600">{ui.result}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => speakText(translated, targetLang.code)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest text-cyan-400 border border-cyan-500/20 hover:border-cyan-500/50 hover:bg-cyan-500/10 transition-all">
                      <Volume2 className="w-3 h-3" />{ui.speak}
                    </button>
                    <button onClick={copyResult}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all"
                      style={{ color: copied ? '#34d399' : '#94a3b8', borderColor: copied ? 'rgba(52,211,153,0.3)' : 'rgba(255,255,255,0.08)' }}>
                      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copied ? ui.copied : ui.copy}
                    </button>
                  </div>
                </div>
                <p className="text-white text-xl font-semibold leading-relaxed"
                  dir={targetLang.code.startsWith('ar') || targetLang.code.startsWith('ur') || targetLang.code.startsWith('fa') ? 'rtl' : 'ltr'}>
                  {translated}
                </p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center rounded-[1.5rem] border border-white/5 p-8 text-center"
                style={{ background: 'rgba(255,255,255,0.01)', minHeight: 180 }}>
                <Languages className="w-10 h-10 text-slate-800 mb-3" />
                <p className="text-slate-700 text-xs font-medium">{ui.placeholder2}</p>
              </div>
            )}

            {/* Action buttons */}
            {state === 'done' && (
              <div className="flex gap-3">
                <button onClick={inputMode === 'voice' ? startListening : () => translate(manualText)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-xs uppercase tracking-widest text-white transition-all"
                  style={{ background: 'linear-gradient(135deg,#06b6d4,#0284c7)', boxShadow: '0 0 25px rgba(6,182,212,0.3)' }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-1px)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}>
                  {inputMode === 'voice' ? <Mic className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                  {ui.again}
                </button>
                <button onClick={reset}
                  className="px-4 py-3 rounded-xl font-black text-xs uppercase tracking-widest text-slate-500 border border-white/8 hover:border-white/18 hover:bg-white/5 transition-all flex items-center gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5" />{ui.reset}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TranslatorView;
