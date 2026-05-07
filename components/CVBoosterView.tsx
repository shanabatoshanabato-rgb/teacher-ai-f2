
import React, { useState, useCallback, useMemo } from 'react';
import { 
  FileCheck, Upload, Loader2, CheckCircle2, Download, Copy, RefreshCw, AlertCircle, Briefcase, ChevronRight, FileText
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { runPuterAgent, extractPdfText } from '../services/puterCore';

const CVBoosterView: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState('');
  const [boostedCV, setBoostedCV] = useState('');
  const [phase, setPhase] = useState<'upload' | 'processing' | 'result'>('upload');
  const [error, setError] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [atsScore, setAtsScore] = useState<number | null>(null);
  const [atsAnalysis, setAtsAnalysis] = useState('');
  const [cvLang, setCvLang] = useState<'ar' | 'en'>('en');
  const [currentStep, setCurrentStep] = useState(0);
  const [isCopied, setIsCopied] = useState(false);

  const isAr = document.documentElement.lang === 'ar';
  
  const tx = (ar: string, en: string) => (isAr ? ar : en);

  const steps = [
    { ar: "جاري قراءة السيرة الذاتية...", en: "Reading your CV..." },
    { ar: "جاري تحليل الكلمات المفتاحية...", en: "Analyzing keywords..." },
    { ar: "جاري إعادة الكتابة لنظام ATS...", en: "Rewriting for ATS..." },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError(tx('يرجى رفع ملف PDF فقط.', 'Please upload a PDF file only.'));
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError(tx('حجم الملف يجب أن يكون أقل من 10 ميجابايت.', 'File size must be less than 10MB.'));
      return;
    }

    setError('');
    setSelectedFile(file);
  };

  const boostCV = async () => {
    if (!selectedFile || !jobTitle) return;

    setPhase('processing');
    setCurrentStep(0);

    try {
      // Step 1: Extract Text
      const text = await extractPdfText(selectedFile);
      setExtractedText(text);

      // Fix language detection
      const lang = /[\u0600-\u06FF]/.test(text) ? 'ar' : 'en';
      setCvLang(lang);
      setCurrentStep(1);

      // Step 2 & 3: Rewrite with AI
      const systemPrompt = `You are a professional ATS (Applicant Tracking System) optimization expert with deep knowledge of how ATS software parses and ranks CVs.

LANGUAGE RULE: Detect the language of the CV and respond entirely in that language. Arabic CV = Arabic output. English CV = English output.

YOUR TASK: Rewrite the CV to maximize ATS score for the target position.

REWRITING RULES:
1. Never invent experience, skills, or qualifications — only rewrite and reframe what exists
2. If a job description is provided, extract its exact keywords and inject them naturally throughout the CV
3. If no job description is provided, use industry-standard keywords for the target job title
4. Rewrite the professional summary: make it 3-4 sentences, keyword-rich, impactful, tailored to the role
5. Restructure every bullet point using the CAR format: Context → Action → Result (add estimated results if none exist, e.g. "improved efficiency by approximately 20%")
6. Add a "Core Competencies" section with 8-12 relevant keywords as a comma-separated list
7. Ensure section headers use standard ATS-readable names: "Professional Summary", "Work Experience", "Education", "Skills", "Certifications"
8. Remove: photos, graphics, tables, columns, special characters, emojis
9. Output format: clean markdown, ## for sections, **bold** for company names and job titles, - for bullets

KEYWORD ANALYSIS SECTION:
After the rewritten CV, add a section titled "---ATS_ANALYSIS---" containing:
- Keywords injected (list them)
- Match score if job description was provided
- 3 recommendations to further improve the CV

At the very last line write: ATS_SCORE: [number 60-100]`;

      const userPrompt = `CV Content:
${text}

Target Job Title: ${jobTitle}

${jobDescription ? `Job Description / Posting:\n${jobDescription}\n\nMatch the CV keywords as closely as possible to this job description.` : ''}

Rewrite this CV to be fully ATS-optimized.`;

      const res = await runPuterAgent(userPrompt, undefined, undefined, lang, false, systemPrompt);
      
      const analysisMatch = res.text.match(/---ATS_ANALYSIS---([\s\S]*?)(?=ATS_SCORE:|$)/);
      const analysisText = analysisMatch ? analysisMatch[1].trim() : null;
      const scoreMatch = res.text.match(/ATS_SCORE:\s*(\d+)/);
      const score = scoreMatch ? parseInt(scoreMatch[1]) : null;
      const cleanCV = res.text.replace(/---ATS_ANALYSIS---[\s\S]*/, '').trim();

      setCurrentStep(3);
      setAtsScore(score);
      setAtsAnalysis(analysisText || '');
      setBoostedCV(cleanCV);
      setTimeout(() => setPhase('result'), 500);

    } catch (err) {
      console.error(err);
      setError(tx('حدث خطأ أثناء معالجة السيرة الذاتية.', 'An error occurred while processing your CV.'));
      setPhase('upload');
    }
  };

  const convertMarkdownToHTML = (md: string): string => {
    return md
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Strip links, keep text
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/^[*-] (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^(?!<(h|u|l|p)).+$/gm, '<p>$&</p>')
      .trim();
  };

  const downloadAsPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="${cvLang === 'ar' ? 'rtl' : 'ltr'}">
      <head>
        <meta charset="UTF-8">
        <title>CV</title>
        <style>
          @page { 
            margin: 1.5cm; 
            size: A4;
          }
          body { 
            font-family: ${cvLang === 'ar' ? "'Arial', 'Tahoma'" : "'Arial', sans-serif"};
            max-width: 800px; margin: 0 auto; padding: 40px;
            color: #1a1a1a; line-height: 1.6; font-size: 11pt;
            direction: ${cvLang === 'ar' ? 'rtl' : 'ltr'};
            text-align: ${cvLang === 'ar' ? 'right' : 'left'};
          }
          h1 { font-size: 20pt; border-bottom: 2px solid #059669; padding-bottom: 8px; margin-bottom: 20px; }
          h2 { font-size: 13pt; color: #059669; border-bottom: 1px solid #d1d5db; padding-bottom: 4px; margin-top: 24px; margin-bottom: 10px; text-transform: uppercase; }
          ul { padding-inline-start: 25px; margin-bottom: 15px; }
          li { margin-bottom: 6px; }
          p { margin-bottom: 12px; }
          strong { font-weight: 700; color: #000; }
          @media print {
            body { margin: 0; padding: 0; }
            * { -webkit-print-color-adjust: exact; }
            a[href]:after { content: none !important; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>${convertMarkdownToHTML(boostedCV)}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 500);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(boostedCV);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const reset = () => {
    setSelectedFile(null);
    setExtractedText('');
    setBoostedCV('');
    setPhase('upload');
    setError('');
    setJobTitle('');
    setJobDescription('');
    setAtsScore(null);
    setAtsAnalysis('');
    setCvLang('en');
    setCurrentStep(0);
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-6 animate-in fade-in duration-1000">
      
      {/* Header */}
      <div className="text-center mb-16 space-y-4">
        <div className="inline-flex p-4 bg-emerald-600/10 rounded-3xl border border-emerald-500/20 mb-4 animate-in zoom-in duration-500">
          <FileCheck className="w-12 h-12 text-emerald-400" />
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight uppercase leading-tight">
          {tx('محسّن السيرة الذاتية', 'CV BOOSTER')}
        </h1>
        <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-xs">
          {tx('حوّل سيرتك الذاتية لتتخطى أنظمة ATS', 'OPTIMIZE YOUR CV FOR ATS SYSTEMS')}
        </p>
      </div>

      {/* Main Content */}
      <div className="bg-[#111827]/60 border border-white/10 rounded-[2.5rem] p-8 md:p-12 shadow-2xl backdrop-blur-xl relative overflow-hidden animate-in slide-in-from-bottom-4 duration-700">
        
        {phase === 'upload' && (
          <div className="space-y-10">
            {/* Job Title & Description Input */}
            <div className="space-y-8">
              <div className="space-y-4 text-center md:text-start">
                <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2 justify-center md:justify-start">
                  <Briefcase className="w-3 h-3" />
                  {tx('ما هي الوظيفة المستهدفة؟', 'TARGET JOB TITLE')}
                </label>
                <input 
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder={tx('مثال: مهندس برمجيات، محاسب', 'e.g. Software Engineer, Accountant')}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-emerald-500/50 transition-all font-medium"
                />
              </div>

              <div className="space-y-4 text-center md:text-start">
                <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2 justify-center md:justify-start">
                  <FileText className="w-3 h-3" />
                  {tx('وصف الوظيفة (اختياري ولكن ينصح به)', 'JOB DESCRIPTION (OPTIONAL BUT RECOMMENDED)')}
                </label>
                <textarea
                  value={jobDescription}
                  onChange={e => setJobDescription(e.target.value)}
                  placeholder={tx('انسخ إعلان الوظيفة هنا لمطابقة ATS أكثر دقة...', 'Paste the job posting here for more accurate ATS matching...')}
                  rows={5}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-emerald-500/50 transition-all font-medium resize-none"
                />
              </div>
            </div>

            {/* Upload Area */}
            <div className="space-y-4">
              <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2 justify-center md:justify-start">
                <Upload className="w-3 h-3" />
                {tx('رفع السيرة الذاتية (PDF)', 'UPLOAD CV (PDF)')}
              </label>
              <label className={`
                flex flex-col items-center justify-center border-2 border-dashed rounded-[2rem] p-12 transition-all cursor-pointer group
                ${selectedFile ? 'border-emerald-500 bg-emerald-600/5' : 'border-white/10 hover:border-emerald-500/50 hover:bg-white/5'}
              `}>
                <input type="file" accept=".pdf" onChange={handleFileChange} className="hidden" />
                <div className={`p-6 rounded-full mb-6 transition-all ${selectedFile ? 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'bg-white/5 text-slate-400 group-hover:text-emerald-400'}`}>
                  {selectedFile ? <CheckCircle2 className="w-10 h-10" /> : <Upload className="w-10 h-10" />}
                </div>
                <div className="text-center">
                  <p className="text-white font-black text-lg uppercase mb-1">
                    {selectedFile ? selectedFile.name : tx('اختر ملف PDF أو أسقطه هنا', 'CHOOSE PDF OR DRAG & DROP')}
                  </p>
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
                    {tx('الحد الأقصى: 10 ميجابايت', 'MAX SIZE: 10MB')}
                  </p>
                </div>
              </label>
            </div>

            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 animate-in fade-in zoom-in duration-300">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p className="text-sm font-bold">{error}</p>
              </div>
            )}

            <button 
              onClick={boostCV}
              disabled={!selectedFile || !jobTitle}
              className={`
                w-full py-6 rounded-3xl font-black text-sm uppercase tracking-[0.3em] transition-all active:scale-95 flex items-center justify-center gap-3
                ${(!selectedFile || !jobTitle) 
                  ? 'bg-white/5 text-slate-600 cursor-not-allowed' 
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_10px_40px_rgba(5,150,105,0.3)] hover:shadow-[0_15px_50px_rgba(5,150,105,0.4)]'}
              `}
            >
              <RefreshCw className={`w-5 h-5 ${(!selectedFile || !jobTitle) ? '' : 'animate-spin-slow'}`} />
              {tx('حسّن سيرتي الذاتية الآن', 'BOOST MY CV NOW')}
            </button>
          </div>
        )}

        {phase === 'processing' && (
          <div className="py-12 space-y-12">
            <div className="flex flex-col items-center mb-8">
              <div className="relative">
                <Loader2 className="w-20 h-20 text-emerald-500 animate-spin" />
                <FileCheck className="w-8 h-8 text-emerald-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
              </div>
            </div>
            
            <div className="space-y-6 max-w-sm mx-auto">
              {steps.map((step, i) => (
                <div 
                  key={i}
                  className={`
                    flex items-center gap-4 transition-all duration-500
                    ${i <= currentStep ? 'opacity-100 translate-x-0' : 'opacity-20 -translate-x-4'}
                    ${i === 0 ? 'delay-100' : i === 1 ? 'delay-300' : 'delay-500'}
                  `}
                >
                  <div className={`p-2 rounded-full ${i < currentStep ? 'bg-emerald-500/20 text-emerald-400' : i === currentStep ? 'bg-white/5 text-white animate-pulse' : 'bg-white/5 text-slate-700'}`}>
                    {i < currentStep ? <CheckCircle2 className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                  </div>
                  <span className={`text-sm font-black uppercase tracking-widest ${i === currentStep ? 'text-white' : 'text-slate-500'}`}>
                    {tx(step.ar, step.en)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {phase === 'result' && (
          <div className="space-y-12 animate-in fade-in zoom-in duration-500">
            
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 border-b border-white/10 pb-8">
              <div className="flex items-center gap-6">
                {atsScore !== null && (
                  <div className={`
                    w-24 h-24 rounded-full flex flex-col items-center justify-center border-4
                    ${atsScore >= 80 ? 'border-emerald-500 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.5)]' : 'border-amber-500 text-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.5)]'}
                    animate-in zoom-in duration-700
                  `}>
                    <span className="text-3xl font-black">{atsScore}</span>
                    <span className="text-[8px] font-black uppercase">Score</span>
                  </div>
                )}
                <div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-1">
                    {tx('تم تحسين السيرة بنجاح!', 'CV BOOSTED SUCCESSFULLY!')}
                  </h3>
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                    {tx('نتيجة ATS المقدرة بناءً على الوظيفة المستهدفة', 'ESTIMATED ATS SCORE BASED ON TARGET JOB')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button 
                  onClick={downloadAsPDF}
                  className="p-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl transition-all active:scale-95 shadow-lg group flex items-center gap-3"
                >
                  <Download className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
                  <span className="text-[10px] font-black uppercase tracking-widest">{tx('تحميل PDF', 'DOWNLOAD PDF')}</span>
                </button>
                <button 
                  onClick={copyToClipboard}
                  className="p-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-2xl transition-all active:scale-95 group flex items-center gap-3"
                >
                  {isCopied ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5 group-hover:scale-110 transition-transform" />}
                  <span className="text-[10px] font-black uppercase tracking-widest">{isCopied ? tx('تم النسخ', 'COPIED') : tx('نسخ النص', 'COPY TEXT')}</span>
                </button>
              </div>
            </div>

            <div className={`bg-[#0a0a0c] p-8 md:p-12 rounded-[2rem] border border-white/5 shadow-inner overflow-hidden max-h-[600px] overflow-y-auto ${cvLang === 'ar' ? 'text-right font-arabic' : 'text-left'}`} dir={cvLang === 'ar' ? 'rtl' : 'ltr'}>
              <div className="prose prose-invert prose-emerald max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{boostedCV}</ReactMarkdown>
              </div>
            </div>

            {atsAnalysis && (
              <div className="bg-emerald-600/5 border border-emerald-500/20 rounded-[2rem] p-8 space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                  {cvLang === 'ar' ? 'تقرير ATS التفصيلي' : 'ATS DETAILED REPORT'}
                </h4>
                <div className="prose prose-invert prose-emerald max-w-none text-sm">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{atsAnalysis}</ReactMarkdown>
                </div>
              </div>
            )}

            <button 
              onClick={reset}
              className="w-full py-5 border border-dashed border-white/20 hover:border-emerald-500/50 hover:bg-white/5 text-slate-500 hover:text-emerald-400 rounded-3xl transition-all group flex items-center justify-center gap-3"
            >
              <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-700" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">{tx('تحسين سيرة أخرى', 'BOOST ANOTHER CV')}</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default CVBoosterView;
