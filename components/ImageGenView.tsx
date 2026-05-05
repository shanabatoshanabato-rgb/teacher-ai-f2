
import React, { useState } from 'react';
import { Image as ImageIcon, Download, RefreshCcw, Wand2, Palette, Cpu, AlertCircle } from 'lucide-react';
import { generateImage } from '../services/aiService';

const ImageGenView: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('photorealistic');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isAr = document.documentElement.lang === 'ar';

  const styles = isAr ? [
    { id: 'photorealistic', label: 'واقعي جداً' },
    { id: '3d-render', label: 'رسم ثلاثي الأبعاد' },
    { id: 'anime', label: 'أنمي ياباني' },
    { id: 'digital-oil-painting', label: 'لوحة زيتية' },
  ] : [
    { id: 'photorealistic', label: 'Ultra Realistic' },
    { id: '3d-render', label: '3D Render' },
    { id: 'anime', label: 'Modern Anime' },
    { id: 'digital-oil-painting', label: 'Oil Painting' },
  ];

  const handleGenerate = async () => {
    if (!prompt.trim() || loading) return;
    
    setLoading(true);
    setError(null);
    setImageUrl(null);

    try {
      // المحرك الآن يستخدم puter.http داخلياً وبصمت لتجنب الـ CORS
      const url = await generateImage(prompt, selectedStyle);
      if (url) {
        setImageUrl(url);
      } else {
        throw new Error("Generation Failed.");
      }
    } catch (err: any) {
      setError(isAr ? "حدث خطأ في محرك الصور. تأكد من المفتاح وجرب ثانية." : "Image Engine Error. Check key and retry.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 py-10 px-4 animate-in fade-in duration-700">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-4">
          <div className="p-4 bg-indigo-600/20 rounded-[2.5rem] border border-indigo-500/30">
            <Cpu className="w-10 h-10 text-indigo-400" />
          </div>
          <div className={`text-left ${isAr ? 'text-right' : ''}`}>
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase">Visual Studio</h1>
            <p className="text-slate-500 font-bold uppercase tracking-[0.4em] text-[10px]">PIXAZO MASTER CORE</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#111827]/60 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl space-y-8">
            <h3 className="text-xs font-black uppercase tracking-widest text-indigo-400">{isAr ? 'الأنماط' : 'STYLES'}</h3>
            <div className="grid grid-cols-1 gap-3">
              {styles.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedStyle(s.id)}
                  className={`p-5 rounded-2xl border transition-all text-left ${isAr ? 'text-right' : ''} ${selectedStyle === s.id ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-black/40 border-white/5 text-slate-500'}`}
                >
                  <span className="font-black text-[11px] uppercase">{s.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-8">
          <div className="bg-[#111827]/60 border border-white/10 rounded-[3rem] p-8 shadow-2xl relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={isAr ? "صف المشهد..." : "Describe the imagination..."}
              className="w-full bg-black/40 border border-white/10 rounded-[2rem] p-8 text-xl text-white placeholder:text-slate-800 min-h-[220px] resize-none focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
              className="w-full mt-8 bg-indigo-600 hover:bg-indigo-500 text-white font-black py-6 rounded-[2rem] transition-all shadow-2xl shadow-indigo-600/40"
            >
              {loading ? <RefreshCcw className="w-8 h-8 animate-spin mx-auto" /> : <Wand2 className="w-8 h-8 mx-auto" />}
            </button>
          </div>

          <div className="bg-black/60 border border-white/5 rounded-[3.5rem] overflow-hidden min-h-[500px] flex items-center justify-center relative shadow-2xl border-dashed">
            {loading ? (
              <div className="text-center space-y-6">
                <div className="w-24 h-24 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto" />
                <p className="text-indigo-400 font-black uppercase tracking-widest">{isAr ? 'جاري إنشاء الصورة' : 'SYNTHESIZING...'}</p>
              </div>
            ) : imageUrl ? (
              <div className="p-10 text-center">
                <img src={imageUrl} alt="Generated" className="rounded-3xl shadow-2xl border border-white/10 max-h-[600px] object-contain mx-auto" />
                <button onClick={() => window.open(imageUrl, '_blank')} className="mt-8 mx-auto flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-transform">
                   <Download className="w-5 h-5" /> Download
                </button>
              </div>
            ) : error ? (
              <div className="text-red-400 p-10 text-center space-y-4">
                <AlertCircle className="w-16 h-16 mx-auto opacity-50" />
                <p className="font-black uppercase tracking-widest">{error}</p>
              </div>
            ) : (
              <div className="text-center space-y-6 opacity-20">
                <Palette className="w-24 h-24 text-slate-400 mx-auto" />
                <p className="text-xs font-black uppercase tracking-[0.5em]">{isAr ? 'بانتظار البيانات' : 'AWAITING DATA'}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageGenView;
