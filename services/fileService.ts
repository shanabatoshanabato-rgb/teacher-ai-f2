
import { puterInternalCall } from './puterCore';
import * as docx from 'docx';

interface SlideData {
  title: string;
  detailedContent: string;
  keyPoints: string[];
  footerNote: string;
  imageDescription: string;
}

/**
 * توليد عرض تقديمي احترافي مليء بالمعلومات والتصميم
 */
export async function generatePPT(topic: string, numSlides: number, includeWebData: boolean) {
  const isArabic = /[\u0600-\u06FF]/.test(topic);

  // برومبت محسن يطلب محتوى تعليمي غزير وتفصيلي
  const structurePrompt = `
    Task: Design a Comprehensive Educational PowerPoint Presentation about: "${topic}".
    Number of Slides: ${numSlides}.
    
    Requirements for EACH slide:
    1. A clear, punchy Title.
    2. A "Detailed Content" paragraph (at least 80-100 words of expert explanation).
    3. A list of 4-5 "Key Points" or "Detailed Bulletins" that expand on the concept.
    4. A "Footer Note" providing extra context or a thought-provoking question.
    
    Language: ${isArabic ? 'Academic Arabic' : 'Professional English'}.
    
    Return ONLY a JSON array of objects: 
    [{"title": "...", "detailedContent": "...", "keyPoints": ["...", "..."], "footerNote": "...", "imageDescription": "..."}]
  `;

  try {
    const rawStructure = await puterInternalCall(structurePrompt, 'You are a Senior Educational Content Architect and Designer.');
    const jsonStr = rawStructure.text.replace(/```json|```/g, '').trim();
    const slidesMatch = jsonStr.match(/\[.*\]/s);
    
    if (!slidesMatch) throw new Error("Invalid structure received.");
    let slidesData: SlideData[] = JSON.parse(slidesMatch[0]);

    // @ts-ignore
    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_16x9';

    slidesData.forEach((data, index) => {
      const slide = pptx.addSlide();
      
      // --- تصميم الخلفية (Background & Accent) ---
      // إضافة شريط جانبي/علوي للتصميم
      slide.addShape(pptx.ShapeType.rect, { 
        x: 0, y: 0, w: '100%', h: 0.6, 
        fill: { color: '4F46E5' } 
      });
      
      // إضافة تذييل الصفحة
      slide.addShape(pptx.ShapeType.rect, { 
        x: 0, y: 5.2, w: '100%', h: 0.4, 
        fill: { color: 'F1F5F9' } 
      });

      // --- العنوان (Title) ---
      slide.addText(data.title, { 
        x: 0.4, y: 0.1, w: '90%', h: 0.4,
        fontSize: 22, bold: true, color: 'FFFFFF',
        fontFace: isArabic ? 'IBM Plex Sans Arabic' : 'Inter',
        align: isArabic ? 'right' : 'left'
      });

      // --- المحتوى التفصيلي (Main Content Box) ---
      slide.addText(data.detailedContent, { 
        x: isArabic ? 5.2 : 0.4, y: 0.8, w: 4.4, h: 4.2,
        fontSize: 13, color: '1E293B',
        fontFace: isArabic ? 'IBM Plex Sans Arabic' : 'Inter',
        align: isArabic ? 'right' : 'left',
        valign: 'top',
        lineSpacing: 24
      });

      // --- النقاط الأساسية (Key Points List) ---
      slide.addText(data.keyPoints.join('\n\n'), { 
        x: isArabic ? 0.4 : 5.0, y: 0.8, w: 4.4, h: 4.2,
        fontSize: 11, color: '475569',
        bullet: { type: 'bullet', code: '2022' },
        align: isArabic ? 'right' : 'left',
        fontFace: isArabic ? 'IBM Plex Sans Arabic' : 'Inter',
        valign: 'top',
        lineSpacing: 20
      });

      // --- ملاحظة التذييل (Footer Note) ---
      slide.addText(`Teacher AI Sovereign Intelligence | ${data.footerNote}`, { 
        x: 0.4, y: 5.25, w: '90%', h: 0.3,
        fontSize: 9, color: '64748B', italic: true,
        align: isArabic ? 'right' : 'left',
        fontFace: isArabic ? 'IBM Plex Sans Arabic' : 'Inter'
      });

      // رقم الشريحة
      slide.addText(`${index + 1}`, { x: 9.3, y: 5.25, fontSize: 10, color: '4F46E5', bold: true });
    });

    pptx.writeFile({ fileName: `TeacherAI_HighValue_Edu_${Date.now()}.pptx` });
  } catch (e) {
    console.error("PPT Generation Error:", e);
    alert("حدث خطأ في توليد المحتوى التعليمي المكثف. يرجى المحاولة مرة أخرى.");
  }
}

/**
 * توليد ملف DOCX مفصل
 */
export async function generateDOC(topic: string, wordCount: number, includeWebData: boolean) {
  const isArabic = /[\u0600-\u06FF]/.test(topic);
  
  const prompt = `
    Task: Create a master-level educational document about: "${topic}".
    The document must be structured with deep analysis and rich vocabulary.
    Target words: ${wordCount}.
    
    Structure Required:
    - Executive Summary
    - Historical and Scientific Background
    - Deep Dive / Core Analysis
    - Case Studies or Practical Applications
    - Future Perspectives
    - Summary Checklist.
    
    Language: ${isArabic ? 'Professional Academic Arabic' : 'Formal English'}.
  `;
  
  try {
    const contentResponse = await puterInternalCall(prompt, 'You are a Sovereign Document Architect and Academic Researcher.');
    const content = contentResponse.text;

    const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, TextDirection } = docx;
    
    const docChildren: any[] = [];
    
    // Title
    docChildren.push(new Paragraph({
      text: topic, 
      heading: HeadingLevel.HEADING_1, 
      alignment: isArabic ? AlignmentType.RIGHT : AlignmentType.LEFT,
      bidirectional: isArabic,
      spacing: { after: 400 }
    }));

    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;
      
      const isHeading = trimmed.startsWith('#') || (trimmed.length < 100 && (trimmed.endsWith(':') || trimmed.toUpperCase() === trimmed && trimmed.length > 3));

      docChildren.push(new Paragraph({
        heading: isHeading ? HeadingLevel.HEADING_2 : undefined,
        alignment: isArabic ? AlignmentType.RIGHT : AlignmentType.LEFT,
        bidirectional: isArabic,
        children: [
          new TextRun({ 
            text: trimmed.replace(/^#+\s*/, ''), 
            size: isHeading ? 28 : 24, 
            bold: isHeading,
            font: isArabic ? 'IBM Plex Sans Arabic' : 'Inter',
            rightToLeft: isArabic,
          })
        ],
        spacing: { after: 200 }
      }));
    });

    // Fix: Using correct TextDirection enum member. RIGHT_TO_LEFT_LEFT_TO_RIGHT does not exist.
    // Horizontal text flow is standard; RTL logic is handled via bidirectional property on Paragraph/TextRun.
    const doc = new Document({ 
      sections: [{ 
        properties: {
          page: {
            textDirection: TextDirection.LEFT_TO_RIGHT_TOP_TO_BOTTOM,
          }
        },
        children: docChildren 
      }] 
    });

    const blob = await Packer.toBlob(doc);
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `TeacherAI_HighValue_Archive_${Date.now()}.docx`;
    link.click();
  } catch (e) {
    console.error("DOC Generation Error:", e);
    alert("خطأ في بناء المستند.");
  }
}
