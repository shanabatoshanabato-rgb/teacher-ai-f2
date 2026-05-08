
/**
 * ============================================================================
 * 🧠 TEACHER AI - MASTER CORE (ARABIC ENFORCED)
 * ============================================================================
 * Powered exclusively by an Advanced Master AI Engine.
 */

declare const puter: any;
declare const pdfjsLib: any;

export interface PuterResponse {
  text: string;
  links: { title: string; url: string; snippet?: string }[];
}

let currentAudioElement: HTMLAudioElement | null = null;

/**
 * استخراج النصوص من ملف PDF يدوياً لضمان قراءته من قبل المعلم
 */
export async function extractPdfText(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";
    
    // استخراج أول 100 صفحة (تمت زيادة الحد)
    const maxPages = Math.min(pdf.numPages, 100);
    
    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const strings = content.items.map((item: any) => item.str);
      fullText += `[صفحة ${i}]: ` + strings.join(" ") + "\n\n";
    }
    
    return fullText.trim();
  } catch (error) {
    console.error("PDF Extraction Error:", error);
    return "فشل استخراج النص من الكتاب.";
  }
}

export async function puterOCR(imageSource: string): Promise<string> {
    try {
        const extractedText = await puter.ai.img2txt(imageSource);
        return extractedText || "";
    } catch (error) {
        console.error("OCR Core Error:", error);
        return "";
    }
}

export async function runPuterAgent(
  prompt: string, 
  image?: string, 
  onPhase?: (p: string) => void,
  responseLang: 'ar' | 'en' = 'ar',
  enableWeb: boolean = true,
  customSystem?: string,
  file?: File,
  history?: { role: string, content: string }[],
  extractedFileText?: string // نص الكتاب المستخرج
): Promise<PuterResponse> {
    try {
        if (onPhase) onPhase('thinking');

        // تعليمات صارمة جداً لمنع الـ AI من الاعتذار
        const arabicSystem = `أنت 'المعلم الإماراتي الذكي' (Master Core).
قاعدة صارمة: لا تقل أبداً "لا يمكنني رؤية الكتاب" أو "لا أستطيع الوصول للملفات".
الحقيقة هي: لقد قمنا باستخراج نص الكتاب لك بالكامل وهو موجود بالأسفل في قسم [محتوى الكتاب].
مهمتك:
1. استخدم [محتوى الكتاب] المرفق كمرجع أساسي ووحيد.
2. اشرح بأسلوب تفاعلي وبالعربية الفصحى فقط.
3. إذا سألك المستخدم عن شيء في الكتاب، أجب بناءً على النص المرفق فوراً.`;

        const englishSystem = `You are 'Teacher AI Master'. NEVER say you cannot see the book. The text is provided below in [BOOK CONTENT] section. Use it as your primary knowledge.`;

        let systemInstruction = customSystem || (responseLang === 'ar' ? arabicSystem : englishSystem);

        // إذا كان هناك نص مستخرج، نقوم بدمجه بشكل بارز جداً
        if (extractedFileText) {
            const bookContext = `
--- بداية محتوى الكتاب المدرسي (المصدر الوحيد) ---
${extractedFileText.slice(0, 25000)}
--- نهاية محتوى الكتاب المدرسي ---

تنبيه للمحرك: النص أعلاه هو الكتاب الفعلي المرفق من قبل الطالب. اقرأه جيداً ولا تعتذر عن عدم رؤيته.`;
            systemInstruction += bookContext;
        }

        // دمج التاريخ
        let contextPrompt = prompt;
        if (history && history.length > 0) {
            const historyText = history.slice(-6).map(m => `${m.role === 'user' ? 'الطالب' : 'المعلم'}: ${m.content}`).join('\n');
            contextPrompt = `السياق السابق:\n${historyText}\n\nالسؤال الجديد: ${prompt}`;
        }

        const chatOptions: any = {
            model: 'gpt-4o',
            system_prompt: systemInstruction,
            images: image ? [image] : [],
            tools: enableWeb && !extractedFileText ? [{ type: "web_search" }] : [] 
        };

        const response = await puter.ai.chat(contextPrompt, chatOptions);

        const textResponse = response?.message?.content || response?.toString() || "";
        const links = extractLinksFromText(textResponse);
        
        return { 
          text: textResponse, 
          links: links 
        };
    } catch (error: any) {
        console.error("AI Core Error:", error);
        return { 
          text: responseLang === 'ar' 
            ? "⚠️ عذراً، واجه المحرك صعوبة في معالجة صفحات الكتاب." 
            : "⚠️ Error processing book pages via Master Core.", 
          links: [] 
        };
    }
}

function extractLinksFromText(text: string): { title: string; url: string }[] {
    const links: { title: string; url: string }[] = [];
    const markdownLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
    const plainUrlRegex = /(https?:\/\/[^\s\]\)]+)/g;
    
    let match;
    const seenUrls = new Set<string>();

    while ((match = markdownLinkRegex.exec(text)) !== null) {
        const url = match[2].replace(/[.,)]+$/, "");
        if (!seenUrls.has(url)) {
            links.push({ title: match[1], url: url });
            seenUrls.add(url);
        }
    }

    const plainMatches = text.match(plainUrlRegex);
    if (plainMatches) {
        plainMatches.forEach(url => {
            const cleanUrl = url.replace(/[.,)]+$/, "");
            if (!seenUrls.has(cleanUrl)) {
                if (!cleanUrl.includes('js.puter.com') && !cleanUrl.includes('base64')) {
                    links.push({
                        title: cleanUrl.split('/')[2] || "مرجع خارجي",
                        url: cleanUrl
                    });
                    seenUrls.add(cleanUrl);
                }
            }
        });
    }
    return links;
}

export function stopPuterVoice() {
    if (currentAudioElement) {
        currentAudioElement.pause();
        currentAudioElement.currentTime = 0;
        currentAudioElement = null;
    }
    if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
    }
}

export async function puterVoice(text: string, lang: 'ar' | 'en' = 'ar', voiceName: string = 'alloy') {
    try {
        stopPuterVoice();

        const cleanText = text.replace(/[*_#`]/g, '').replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1').trim();
        if (!cleanText) return;

        const audio = await puter.ai.txt2speech(cleanText, {
            provider: 'openai',
            model: 'gpt-4o-mini-tts',
            voice: voiceName,
            response_format: 'mp3',
            instructions: lang === 'ar' 
                ? 'تحدث بلغة عربية فصحى، واضحة، وهادئة بأسلوب تعليمي.' 
                : 'Speak in a clear, professional, and educational English voice.',
        });

        currentAudioElement = audio;
        audio.play();
        
        audio.onended = () => {
            if (currentAudioElement === audio) currentAudioElement = null;
        };
    } catch (error) {
        console.error("TTS Core Error:", error);
        const isArabic = /[\u0600-\u06FF]/.test(text);
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = isArabic ? 'ar-SA' : 'en-US';
        window.speechSynthesis.speak(utterance);
    }
}

export async function puterTextLogic(mode: string, input: string, responseLang: 'ar' | 'en' = 'ar'): Promise<string> {
    const systems: Record<string, string> = {
        arabic: "أنت خبير النحو والإعراب الشامل. حلل الجملة بدقة تعليمية بالعربية الفصحى.",
        grammar: "You are an English grammar expert. Correct and explain clearly.",
        rewrite: "أعد صياغة النص بأسلوب تعليمي راقٍ.",
        essay: "اكتب مقالاً أكاديمياً رزيناً ومنظماً."
    };
    const res = await runPuterAgent(input, undefined, undefined, responseLang, false, systems[mode]);
    return res.text;
}

export async function puterWebDiscovery(query: string): Promise<PuterResponse> {
    const systemPrompt = "أنت باحث ذكي. استخدم أداة البحث بشكل إلزامي للوصول للمعلومات الحية ثم لخصها بوضوح.";
    return runPuterAgent(query, undefined, undefined, 'ar', true, systemPrompt);
}

export async function puterVisualGen(prompt: string, style: string): Promise<string | null> {
    try {
        const image = await puter.ai.txt2img(`Masterpiece, ${style}, ${prompt}`);
        return image.src;
    } catch (e) {
        return null;
    }
}

async function fetchWikipediaIslamic(query: string): Promise<{links: any[], context: string}> {
    try {
        const url = `https://ar.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&utf8=&format=json&origin=*`;
        const res = await fetch(url);
        const data = await res.json();
        
        if (!data?.query?.search || data.query.search.length === 0) {
            return { links: [], context: "" };
        }

        const links: any[] = [];
        const snippetsText: string[] = [];

        data.query.search.slice(0, 3).forEach((item: any) => {
            const articleUrl = `https://ar.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/ /g, '_'))}`;
            const cleanSnippet = item.snippet.replace(/<\/?[^>]+(>|$)/g, ""); // Strip HTML tags
            links.push({
                title: item.title,
                url: articleUrl,
                snippet: cleanSnippet
            });
            snippetsText.push(`[${item.title}]: ${cleanSnippet}`);
        });

        return { links, context: snippetsText.join('\n\n') };
    } catch (e) {
        console.error("Wiki Fetch Error:", e);
        return { links: [], context: "" };
    }
}

export const puterIslamicBrain = async (q: string, lang: 'ar' | 'en' = 'ar'): Promise<PuterResponse> => {
    try {
        // 1. Fetch exact real data from Wikipedia
        const wikiData = await fetchWikipediaIslamic(q);
        
        let systemInstruction = '';
        let contextPrompt = q;

        if (wikiData.links.length > 0) {
            systemInstruction = lang === 'ar'
                ? `أنت باحث إسلامي متخصص وموثوق.
تم تزويدك بالمعلومات التالية والمستخرجة من ويكيبيديا الموسوعة الحرة حول سؤال المستخدم.
مهمتك: صياغة إجابة شرعية أو علمية دقيقة بناءً على هذا السياق الموثق.
لا تقم بوضع الروابط في النص، النظام سيقوم بإظهارها للمستخدم تلقائياً.`
                : `You are an expert Islamic researcher. You are provided with real Wikipedia context below. Base your answer completely on this exact information. Do not generate links in the text, the system will handle them.`;
            
            contextPrompt = `السؤال: ${q}\n\nالسياق المرجعي للدقة العلمية:\n${wikiData.context}\n\nأجب بناءً على ما سبق بدقة متناهية.`;
        } else {
            // Fallback if Wiki has no results
            systemInstruction = lang === 'ar'
                ? `أنت باحث إسلامي متخصص وموثوق. أجب بأسلوب علمي ودقيق وموثق.
قاعدة إلزامية وصارمة جداً: في نهاية إجابتك، يجب عليك أن تضع وتقترح مصدرين حقيقيين تماماً للإجابة (مثل موقع إسلام ويب أو ابن باز أو الإسلام سؤال وجواب) كروابط حقيقية قابلة للنقر باستخدام هذا التنسيق حصراً:
[اسم المصدر](https://www.islamweb.net/)
لا تكتب أي روابط بدون هذا التنسيق.`
                : `You are an expert Islamic researcher. Provide a highly accurate and factual answer.
STRICT RULE: At the end of your response, provide 2 real source URLs using exact Markdown format:
[Source Title](https://www.islamweb.net/)`;
        }

        const chatOptions: any = {
            model: 'gpt-4o',
            system_prompt: systemInstruction,
        };

        const response = await puter.ai.chat(contextPrompt, chatOptions);
        const textResponse = response?.message?.content || response?.toString() || '';

        let finalLinks = wikiData.links;
        // If Wikipedia was empty, extract the links that the AI generated from its strict prompt
        if (finalLinks.length === 0) {
            finalLinks = extractLinksFromText(textResponse);
        }

        // 🌟 DYNAMIC GOOGLE SEARCH FALLBACK 🌟
        // The user specifically wanted a general Google search for extra reliability
        // We ALWAYS inject a Google Search and an Islamweb custom search for their exact query to guarantee links are 100% useful and present.
        const encodedQuery = encodeURIComponent(q);
        finalLinks.push({
            title: lang === 'ar' ? 'البحث عن الفتوى السابقة في جوجل' : 'Search for this fatwa on Google',
            url: `https://www.google.com/search?q=${encodedQuery}`,
            snippet: lang === 'ar' ? 'تصفح فتاوى وآراء العلماء عبر محرك بحث جوجل.' : 'Browse fatwas and scholarly opinions via Google.'
        });
        
        // Add direct Islamweb search
        finalLinks.push({
            title: lang === 'ar' ? 'البحث المباشر في إسلام ويب' : 'Search directly on Islamweb',
            url: `https://www.islamweb.net/ar/search?q=${encodedQuery}`,
            snippet: lang === 'ar' ? 'ابحث عن إجابة معتمدة مباشرة من موقع إسلام ويب.' : 'Find certified answers directly from Islamweb.'
        });

        // Return the clean response + the links
        return { 
            text: textResponse, 
            links: finalLinks 
        };

    } catch (error) {
        console.error('Islamic Brain Error:', error);
        return { text: "حدث خطأ في البحث. يرجى المحاولة مرة أخرى.", links: [] };
    }
};

export const puterSolve = async (q: string, s: string, img?: string, onPhase?: (p: any) => void, lang: 'ar' | 'en' = 'ar') => {
    let contextInput = q;
    if (img) {
        if (onPhase) onPhase('ocr');
        const extracted = await puterOCR(img);
        contextInput = `[نص المسألة المستخرج من الصورة: "${extracted}"] \n\n [تعليمات الطالب: "${q}"]`;
    }
    const mathSystem = `أنت المعلم الشامل في الرياضيات والعلوم. استخدم لغة عربية فصحى وتنسيق LaTeX الاحترافي للمسائل.`;
    const generalSystem = `You are a professional academic tutor. Solve the following problem step-by-step using Proper LaTeX.`;
    const systemInstruction = lang === 'ar' ? mathSystem : generalSystem;
    return runPuterAgent(`قم بحل مسألة ${s} التالية بالتفصيل: ${contextInput}`, img, onPhase, lang, true, systemInstruction);
};

export async function puterBuildWeb(prompt: string, onPhase?: (p: any) => void) {
    if (onPhase) onPhase('generating');
    try {
        const response = await puter.ai.chat(`Build a website for: ${prompt}. Return JSON: {"preview_html": "...", "files": [{"filename": "index.html", "code": "..."}]}`, { model: 'gpt-4o' });
        const content = response?.message?.content || response?.toString() || "";
        const jsonStr = content.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(jsonStr);
        const fileMap: Record<string, string> = {};
        parsed.files.forEach((f: any) => { fileMap[f.filename] = f.code; });
        return { preview_html: parsed.preview_html, files: fileMap };
    } catch (e) {
        return { preview_html: "<h1>Error</h1>", files: { "index.html": "Error" } };
    }
}

export async function puterRepairWeb(originalPrompt: string, currentProject: any, fixPrompt: string, onPhase?: (p: any) => void) {
    return puterBuildWeb(`Update website. Context: ${originalPrompt}. Files: ${JSON.stringify(currentProject.files)}. Fix: ${fixPrompt}`, onPhase);
}

export const puterInternalCall = async (p: string, s?: string) => runPuterAgent(p, undefined, undefined, 'ar', true, s);
