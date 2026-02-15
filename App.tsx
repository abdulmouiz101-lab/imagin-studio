import React, { useState, useEffect, useRef } from 'react';
import { 
  Wand2, 
  Image as ImageIcon, 
  Download, 
  ChevronRight, 
  Loader2, 
  RefreshCw, 
  Edit3, 
  Sparkles, 
  Key, 
  History, 
  Settings2, 
  Zap, 
  Share2, 
  XCircle, 
  Maximize2, 
  Paperclip, 
  X, 
  Plus, 
  Layers, 
  ArrowRight, 
  Command, 
  Trash2, 
  Menu, 
  ChevronDown, 
  Palette, 
  Terminal, 
  Check, 
  Facebook, 
  Chrome, 
  Camera, 
  Aperture, 
  Cpu, 
  Lock, 
  Search, 
  CreditCard, 
  Calendar, 
  User, 
  Upload, 
  Camera as CameraIcon, 
  Pencil, 
  RotateCcw, 
  Globe, 
  Dna, 
  Clapperboard, 
  Mountain, 
  Box, 
  Video, 
  Eye, 
  Scan, 
  Film, 
  Gem, 
  ShieldCheck, 
  LogOut, 
  Clock, 
  BrainCircuit, 
  Activity, 
  Coins, 
  Twitter, 
  Linkedin, 
  Copy, 
  CheckCircle2, 
  Smartphone, 
  Tv, 
  Monitor, 
  Instagram as InstaIcon, 
  Undo, 
  Redo, 
  Eraser, 
  Sun, 
  Moon,
  ScanEye,
  Brush,
  Files,
  Mic,
  Square,
  StopCircle,
  FileCode
} from 'lucide-react';
import { AppStep, HistoryItem, AspectRatio, ImageResolution } from './types';
import { generateEnhancedPrompt, generateImage, analyzeImage, transcribeAudio, vectorizeImage } from './services/geminiService';

// --- Types ---
type PlanType = 'free' | 'standard' | 'pro';
type Theme = 'dark' | 'light';

// --- Visual Styles ---
const STYLE_PRESETS = [
  { id: 'Cinematic', name: 'Cinematic', icon: <Clapperboard size={18} />, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  { id: 'Anime', name: 'Anime', icon: <Zap size={18} />, color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/20' },
  { id: 'Photorealistic', name: 'Realism', icon: <Camera size={18} />, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  { id: 'Cyberpunk', name: 'Cyberpunk', icon: <Terminal size={18} />, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
  { id: '3D Render', name: '3D Render', icon: <Box size={18} />, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  { id: 'Oil Painting', name: 'Oil Paint', icon: <Palette size={18} />, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
  { id: 'Polaroid', name: 'Polaroid', icon: <ImageIcon size={18} />, color: 'text-zinc-400', bg: 'bg-zinc-500/10', border: 'border-zinc-500/20' },
];

const ANGLE_PRESETS = [
  { id: 'Wide Angle', name: 'Wide Angle', icon: <Mountain size={14} /> },
  { id: 'Close Up', name: 'Close Up', icon: <Scan size={14} /> },
  { id: 'GoPro', name: 'GoPro', icon: <Video size={14} /> },
  { id: 'Drone View', name: 'Drone', icon: <Globe size={14} /> },
  { id: 'Low Angle', name: 'Low Angle', icon: <ArrowRight size={14} className="rotate-90" /> },
  { id: 'Eye-Level', name: 'Eye Level', icon: <Eye size={14} /> },
];

const ASPECT_RATIO_CONFIG = [
  { id: '1:1' as AspectRatio, label: 'Square' },
  { id: '16:9' as AspectRatio, label: 'Cinema' },
  { id: '21:9' as AspectRatio, label: 'Wide' },
  { id: '4:3' as AspectRatio, label: 'Monitor' },
  { id: '3:2' as AspectRatio, label: 'Photo' },
  { id: '2:3' as AspectRatio, label: 'Classic' },
  { id: '3:4' as AspectRatio, label: 'Portrait' },
  { id: '9:16' as AspectRatio, label: 'Story' },
];

const CAMERA_ANGLES = ["Default", "Eye-Level", "Low Angle", "High Angle", "Bird's Eye", "Dutch Angle"];
const LENS_TYPES = ["Default", "Wide (24mm)", "Standard (50mm)", "Portrait (85mm)", "Macro", "Fisheye"];

// --- Helper Functions ---

const removeWhiteBackground = (imageSrc: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
         resolve(imageSrc);
         return;
      }
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      const featherRange = 80;
      const colorTolerance = 15;
      
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
        const saturation = Math.max(r, g, b) - Math.min(r, g, b);
        const distFromWhite = Math.sqrt(Math.pow(255 - r, 2) + Math.pow(255 - g, 2) + Math.pow(255 - b, 2));

        if (distFromWhite < 10 && saturation < 5) {
             data[i + 3] = 0;
        } else if (luminance > (255 - featherRange) && saturation < colorTolerance) {
             const t = (luminance - (255 - featherRange)) / featherRange;
             const alpha = 255 * (1 - Math.pow(t, 2));
             data[i + 3] = Math.floor(alpha);
        }
      }
      
      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve(imageSrc);
    img.src = imageSrc;
  });
};

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// --- Custom Components ---

const ConicBeam = ({ isDark = true }: { isDark?: boolean }) => {
  return (
    <div className="absolute inset-[1px] rounded-[inherit] z-[-1] overflow-hidden pointer-events-none">
       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[200%] animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_0_340deg,#A855F7_360deg)] opacity-60 mix-blend-plus-lighter blur-md" />
       {/* Inner Mask to create the border effect */}
       <div className={`absolute inset-[1px] rounded-[inherit] ${isDark ? 'bg-black/90' : 'bg-white/90'}`} />
    </div>
  );
};

const TypewriterText = ({ text, delay = 0, className, onComplete }: { text: string; delay?: number; className?: string; onComplete?: () => void }) => {
  const [displayText, setDisplayText] = useState('');
  const [started, setStarted] = useState(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const timer = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayText(text.slice(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
        if (onCompleteRef.current) onCompleteRef.current();
      }
    }, 120);
    return () => clearInterval(interval);
  }, [started, text]);

  return <span className={className}>{displayText}</span>;
};

const HeroTypewriter = ({ isDark }: { isDark: boolean }) => {
  const [line1Done, setLine1Done] = useState(false);
  
  return (
    <h1 className="text-5xl md:text-8xl font-sans font-black tracking-tighter mb-8 leading-[0.9] text-glow italic flex flex-col items-center">
      <div className={`flex items-center ${isDark ? 'text-white' : 'text-zinc-900'}`}>
        <TypewriterText text="IMAGINE" onComplete={() => setLine1Done(true)} />
        {!line1Done && <span className="w-2 md:w-3 h-10 md:h-20 bg-purple-500 ml-2 animate-pulse inline-block align-middle"></span>}
      </div>
      <div className="text-gradient flex items-center min-h-[1em]">
        {line1Done && (
          <>
            <TypewriterText text="WITHOUT LIMITS." />
            <span className="w-2 md:w-3 h-10 md:h-20 bg-purple-500 ml-2 animate-pulse inline-block align-middle"></span>
          </>
        )}
      </div>
    </h1>
  );
};

const SilverProgressBar = ({ isDark }: { isDark: boolean }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((oldProgress) => {
        if (oldProgress >= 90) return 90;
        const diff = Math.random() * 8;
        return Math.min(oldProgress + diff, 90);
      });
    }, 200);

    return () => {
      clearInterval(timer);
    };
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 h-[3px] z-[9999] bg-transparent overflow-hidden">
       <div 
         className={`h-full shadow-[0_0_15px_rgba(255,255,255,0.8)] transition-all duration-300 ease-out ${
            isDark 
              ? 'bg-gradient-to-r from-zinc-500 via-white to-zinc-500' 
              : 'bg-gradient-to-r from-zinc-400 via-black to-zinc-400'
         }`}
         style={{ width: `${progress}%` }}
       ></div>
    </div>
  );
};

const Logo = ({ large = false, isDark = true }: { large?: boolean, isDark?: boolean }) => (
  <div className="flex flex-col select-none group cursor-pointer">
    {large && (
      <span className={`text-[10px] md:text-xs font-bold tracking-[0.3em] uppercase mb-2 ml-1 opacity-70 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
        Powered by Addot
      </span>
    )}
    <div className="relative flex items-baseline gap-1">
      <span className={`font-display font-black tracking-tighter transition-all duration-300 ${large ? 'text-6xl md:text-8xl' : 'text-xl'} ${isDark ? 'text-white' : 'text-zinc-900'}`}>
        imagix
      </span>
      <span className={`font-display font-bold tracking-[0.2em] transition-colors ${large ? 'text-xl md:text-3xl' : 'text-[0.6rem]'} ${isDark ? 'text-white/40 group-hover:text-white/80' : 'text-zinc-400 group-hover:text-zinc-900'}`}>
        STUDIO
      </span>
    </div>
  </div>
);

const StarField = ({ isDark }: { isDark: boolean }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let animationFrameId: number;
    let stars: { x: number; y: number; size: number; speed: number; opacity: number }[] = [];
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initStars();
    };
    const initStars = () => {
      stars = [];
      const numStars = Math.floor((canvas.width * canvas.height) / 8000); 
      for (let i = 0; i < numStars; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 1.5,
          speed: Math.random() * 0.15 + 0.05,
          opacity: Math.random()
        });
      }
    };
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = isDark ? '#FFFFFF' : '#000000';
      stars.forEach(star => {
        ctx.globalAlpha = isDark ? star.opacity : star.opacity * 0.3;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
        star.y -= star.speed;
        if (star.y < 0) {
          star.y = canvas.height;
          star.x = Math.random() * canvas.width;
        }
      });
      animationFrameId = requestAnimationFrame(draw);
    };
    window.addEventListener('resize', resize);
    resize();
    draw();
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isDark]);
  return <canvas ref={canvasRef} className="fixed inset-0 z-[-1] opacity-60 pointer-events-none" />;
};

const DrawingCanvas: React.FC<{ 
  backgroundImage: string, 
  onSave: (mask: string) => void, 
  onMagicEdit: (mask: string, prompt: string) => void,
  onCancel: () => void 
}> = ({ backgroundImage, onSave, onMagicEdit, onCancel }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showPromptInput, setShowPromptInput] = useState(false);
  const [editPrompt, setEditPrompt] = useState('');
  const [brushSize] = useState(40);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = 1024;
    canvas.height = 1024;
  }, []);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => { 
    setIsDrawing(true); 
    draw(e); 
  };
  
  const stopDrawing = () => { 
    if (isDrawing) {
      setIsDrawing(false); 
      if (canvasRef.current) canvasRef.current.getContext('2d')?.beginPath();
      setShowPromptInput(true);
    }
  };
  
  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    let clientX, clientY;
    if ('touches' in e) { 
      clientX = e.touches[0].clientX; 
      clientY = e.touches[0].clientY; 
    } else { 
      clientX = e.clientX; 
      clientY = e.clientY; 
    }
    
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(255, 255, 255, 1.0)';
    ctx.shadowBlur = 15;
    ctx.shadowColor = 'rgba(192, 192, 255, 0.8)';
    
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handleMagicSubmit = () => {
    if (!editPrompt.trim()) return;
    const mask = canvasRef.current?.toDataURL('image/png') || '';
    onMagicEdit(mask, editPrompt);
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/95 p-4 animate-fade-in overflow-hidden">
      <div className="absolute inset-0" onClick={onCancel}></div>
      
      <div className="relative glass-panel rounded-3xl p-6 flex flex-col gap-6 max-w-5xl w-full border border-white/20 shadow-2xl backdrop-blur-3xl animate-slide-up h-[85vh]">
        <div className="flex items-center justify-between z-20">
           <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
                <Wand2 size={20} />
              </div>
              <div>
                <h3 className="font-display font-bold text-xl text-white">Magix Edit</h3>
                <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Highlight area to transform</p>
              </div>
           </div>
           <button onClick={onCancel} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/40 hover:text-white" title="Close"><X size={24} /></button>
        </div>

        <div className="flex-1 relative bg-[#050505] rounded-3xl overflow-hidden border border-white/10 shadow-inner group flex justify-center items-center" ref={containerRef}>
            <img src={backgroundImage} className="absolute inset-0 w-full h-full object-contain opacity-50 pointer-events-none grayscale-[30%]" />
            <canvas 
              ref={canvasRef} 
              onMouseDown={startDrawing} 
              onMouseMove={draw} 
              onMouseUp={stopDrawing} 
              onMouseLeave={stopDrawing} 
              onTouchStart={startDrawing} 
              onTouchMove={draw} 
              onTouchEnd={stopDrawing} 
              className={`absolute inset-0 w-full h-full object-contain z-10 ${isDrawing ? 'cursor-none' : 'cursor-crosshair'}`} 
            />
            
            {!showPromptInput && (
               <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-2 animate-slide-up">
                  <button onClick={() => canvasRef.current?.getContext('2d')?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)} className="px-4 py-2 rounded-lg bg-black/60 backdrop-blur border border-white/10 hover:bg-white/10 text-white font-bold text-[10px] uppercase tracking-widest transition-all">
                    Clear
                  </button>
                  <button onClick={() => setShowPromptInput(true)} className="px-6 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold text-[10px] uppercase tracking-widest shadow-lg hover:scale-105 transition-all flex items-center gap-2">
                    <Sparkles size={14} /> Magic Edit
                  </button>
                  <button onClick={() => onSave(canvasRef.current?.toDataURL('image/png') || '')} className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-zinc-400 text-[10px] font-bold uppercase tracking-widest transition-all">
                    Use as Ref
                  </button>
               </div>
            )}

            {showPromptInput && (
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-black/80 backdrop-blur-xl border-t border-white/10 z-40 animate-slide-up rounded-b-3xl">
                 <div className="max-w-3xl mx-auto flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                       <label className="text-xs font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                          <Wand2 size={12} /> Transform Highlighted Area
                       </label>
                       <button onClick={() => setShowPromptInput(false)} className="text-zinc-500 hover:text-white" title="Cancel"><X size={14}/></button>
                    </div>
                    <div className="relative">
                       <input 
                         type="text" 
                         value={editPrompt} 
                         onChange={(e) => setEditPrompt(e.target.value)} 
                         placeholder="What should appear in the highlighted area? (e.g., 'A golden crown', 'Red sunglasses')"
                         className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-4 pr-32 text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500/50 transition-all font-sans"
                         autoFocus
                         onKeyDown={(e) => e.key === 'Enter' && handleMagicSubmit()}
                       />
                       <button onClick={handleMagicSubmit} className="absolute right-2 top-2 bottom-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-4 font-bold text-xs uppercase tracking-widest transition-all">
                          Generate
                       </button>
                    </div>
                 </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

const ShareSheet: React.FC<{ imageUrl: string, prompt: string, onClose: () => void }> = ({ imageUrl, prompt, onClose }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const platforms = [
    { name: 'Twitter', icon: <Twitter size={20} />, color: 'bg-[#1DA1F2]/10 text-[#1DA1F2]', url: `https://twitter.com/intent/tweet?text=${encodeURIComponent('Created with Imagix Studio: ' + prompt)}` },
    { name: 'Facebook', icon: <Facebook size={20} />, color: 'bg-[#1877F2]/10 text-[#1877F2]', url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}` },
    { name: 'LinkedIn', icon: <Linkedin size={20} />, color: 'bg-[#0A66C2]/10 text-[#0A66C2]', url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}` },
  ];

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="absolute inset-0" onClick={onClose}></div>
      <div className="relative glass-panel rounded-[2rem] p-8 max-w-sm w-full border border-white/20 shadow-3xl animate-slide-up">
        <div className="flex justify-between items-center mb-8">
           <div className="flex items-center gap-3">
              <Share2 size={20} className="text-white/60" />
              <h3 className="font-display font-bold text-xl text-white">Share Vision</h3>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/40 hover:text-white" title="Close"><X size={20} /></button>
        </div>

        <div className="aspect-square rounded-2xl overflow-hidden border border-white/10 mb-8 bg-black/40">
           <img src={imageUrl} className="w-full h-full object-cover" alt="To Share" />
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
           {platforms.map(p => (
              <a key={p.name} href={p.url} target="_blank" rel="noopener noreferrer" className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition-all border border-white/5 hover:border-white/20 hover:scale-105 active:scale-95 ${p.color}`} title={`Share on ${p.name}`}>
                 {p.icon}
                 <span className="text-[10px] font-bold uppercase tracking-widest">{p.name}</span>
              </a>
           ))}
        </div>

        <div className="space-y-4">
           <button onClick={handleCopy} className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group" title="Copy Prompt">
              <div className="flex items-center gap-3">
                 <Copy size={16} className="text-zinc-500 group-hover:text-white" />
                 <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 group-hover:text-white">Copy Prompt</span>
              </div>
              {copied ? <CheckCircle2 size={16} className="text-emerald-500" /> : <ChevronRight size={14} className="text-zinc-700" />}
           </button>
           <button onClick={() => {
              const link = document.createElement('a');
              link.href = imageUrl;
              link.download = `imagix-share.png`;
              link.click();
           }} className="w-full btn-primary py-4 text-[10px] font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2" title="Save Image">
              <Download size={16} /> Save to Device
           </button>
        </div>
      </div>
    </div>
  );
};

// Shape component for visual aspect ratio representation
const RatioShape = ({ ratio }: { ratio: string }) => {
  const common = "border-[2px] border-current rounded-sm bg-current/10 group-hover:bg-current/30 transition-colors";
  
  switch(ratio) {
    case '1:1': 
      return <div className={`w-5 h-5 ${common}`} />;
    case '2:3':
      return <div className={`w-4 h-6 ${common}`} />;
    case '3:2':
      return <div className={`w-6 h-4 ${common}`} />;
    case '4:3':
      return <div className={`w-6 h-4.5 ${common}`} />;
    case '3:4': 
      return <div className={`w-4.5 h-6 ${common}`} />;
    case '16:9': 
      return <div className={`w-7 h-4 ${common}`} />;
    case '9:16': 
      return <div className={`w-4 h-7 ${common}`} />;
    case '21:9':
      return <div className={`w-8 h-3.5 ${common}`} />;
    default: 
      return <div className={`w-5 h-5 ${common}`} />;
  }
};

const LoginScreen = ({ onConnect, isDark }: { onConnect: () => void, isDark: boolean }) => (
  <div className={`min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden ${isDark ? 'bg-black text-white' : 'bg-zinc-50 text-zinc-900'}`}>
     <StarField isDark={isDark} />
     <div className="z-10 flex flex-col items-center gap-8 animate-slide-up max-w-md w-full text-center">
        <div className="mb-4"><Logo large isDark={isDark} /></div>
        <div className={`glass-panel p-8 rounded-3xl w-full backdrop-blur-xl border flex flex-col gap-6 shadow-2xl ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/60 border-black/5'}`}>
           <div className="space-y-2">
              <h2 className="text-2xl font-bold font-display">Welcome Back</h2>
              <p className={`text-xs uppercase tracking-widest font-bold ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>Sign in to your workspace</p>
           </div>
           
           <button onClick={() => onConnect()} className="w-full btn-primary py-4 rounded-xl flex items-center justify-center gap-3 group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative flex items-center gap-2">
                <span className="font-bold text-sm uppercase tracking-widest">Connect with Google</span>
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </div>
           </button>
           
           <p className="text-[10px] text-zinc-500 leading-relaxed">
              By connecting, you agree to our Terms of Service and Privacy Policy. 
              We use Google Authentication for secure access.
           </p>
        </div>
     </div>
  </div>
);

const App: React.FC = () => {
  // --- State ---
  const [apiKeyReady, setApiKeyReady] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<AppStep>(AppStep.INPUT_IDEA);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [isDrawingMode, setIsDrawingMode] = useState<boolean>(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [isRemovingBg, setIsRemovingBg] = useState<boolean>(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState<boolean>(false);
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('imagix_theme') as Theme) || 'dark');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  
  // Analysis State
  const [analysisImage, setAnalysisImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const analysisInputRef = useRef<HTMLInputElement>(null);
  
  // Vectorizer State
  const [analysisMode, setAnalysisMode] = useState<'describe' | 'vectorize'>('describe');
  const [vectorizeResult, setVectorizeResult] = useState<string | null>(null);

  // Audio Transcription State
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [transcriptionResult, setTranscriptionResult] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  // Background Remover State
  const [bgRemoverImage, setBgRemoverImage] = useState<string | null>(null);
  const [bgRemoverResult, setBgRemoverResult] = useState<string | null>(null);
  const bgRemoverInputRef = useRef<HTMLInputElement>(null);

  // User Profile State
  const [userEmail, setUserEmail] = useState<string>(() => localStorage.getItem('imagix_email') || '');
  const [userName, setUserName] = useState<string>(() => localStorage.getItem('imagix_username') || '');
  const [userAvatar, setUserAvatar] = useState<string>(() => localStorage.getItem('imagix_avatar') || '');
  const [plan, setPlan] = useState<PlanType>(() => (localStorage.getItem('imagix_plan') as PlanType) || 'free');
  const [usageCount, setUsageCount] = useState<number>(() => parseInt(localStorage.getItem('imagix_usage_count') || '0'));
  const [purchaseDate, setPurchaseDate] = useState<number>(() => parseInt(localStorage.getItem('imagix_purchase_date') || Date.now().toString()));

  const [userIdea, setUserIdea] = useState<string>('');
  const [promptRefImages, setPromptRefImages] = useState<string[]>([]);
  const [genRefImages, setGenRefImages] = useState<string[]>([]);
  const [enhancedPrompt, setEnhancedPrompt] = useState<string>('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("1:1");
  const [resolution, setResolution] = useState<ImageResolution>("1K");
  const [imageCount, setImageCount] = useState<number>(1);
  const [style, setStyle] = useState<string | null>("Photorealistic"); 
  const [selectedAngle, setSelectedAngle] = useState<string>("Default");
  const [selectedLens, setSelectedLens] = useState<string>("Default");
  const [isAiMode, setIsAiMode] = useState<boolean>(false);
  const [useSearch, setUseSearch] = useState<boolean>(false);
  const [isEnhancing, setIsEnhancing] = useState<boolean>(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState<boolean>(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Prompt Undo/Redo State
  const [promptHistory, setPromptHistory] = useState<string[]>([]);
  const [currentPromptIndex, setCurrentPromptIndex] = useState(-1);
  const promptTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const genInputRef = useRef<HTMLInputElement>(null);

  const isDark = theme === 'dark';

  useEffect(() => {
    localStorage.setItem('imagix_theme', theme);
    if (theme === 'light') {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    const checkKey = async () => {
      const anyWindow = window as any;
      if (anyWindow.aistudio?.hasSelectedApiKey) {
        setApiKeyReady(await anyWindow.aistudio.hasSelectedApiKey());
      } else if (process.env.API_KEY) {
        setApiKeyReady(true);
      }
    };
    checkKey();
  }, []);

  useEffect(() => {
    localStorage.setItem('imagix_usage_count', usageCount.toString());
    localStorage.setItem('imagix_username', userName);
    localStorage.setItem('imagix_email', userEmail);
    localStorage.setItem('imagix_avatar', userAvatar);
    localStorage.setItem('imagix_plan', plan);
    localStorage.setItem('imagix_purchase_date', purchaseDate.toString());
  }, [usageCount, userName, userEmail, userAvatar, plan, purchaseDate]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (currentStep === AppStep.INPUT_IDEA && !isEnhancing && !isGeneratingImage) {
          handleEnhancePrompt();
        } else if (currentStep === AppStep.REFINE_PROMPT && !isGeneratingImage) {
          handleGenerateImage();
        } else if (currentStep === AppStep.IMAGE_ANALYSIS && !isAnalyzing) {
            handleAnalyzeImage();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStep, isEnhancing, isGeneratingImage, userIdea, style, selectedAngle, enhancedPrompt, isAnalyzing, analysisImage]);

  // Drag and Drop Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
       const reader = new FileReader();
       reader.onload = (e) => {
           setBgRemoverImage(e.target?.result as string);
           setBgRemoverResult(null); // Clear previous result
       };
       reader.readAsDataURL(file);
    }
  };

  // Paste Handler
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
            const blob = items[i].getAsFile();
            if (blob) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    setBgRemoverImage(e.target?.result as string);
                    setBgRemoverResult(null);
                };
                reader.readAsDataURL(blob);
            }
        }
    }
  };

  const handleConnect = async (mockEmail: string = "user@example.com") => {
    if (typeof mockEmail !== 'string') mockEmail = "user@example.com";
    const firstName = mockEmail.split('@')[0].split('.')[0].split('_')[0];
    const capitalizedName = firstName.charAt(0).toUpperCase() + firstName.slice(1);
    const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${mockEmail}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
    setUserEmail(mockEmail);
    setUserName(capitalizedName);
    setUserAvatar(avatarUrl);
    const anyWindow = window as any;
    if (anyWindow.aistudio?.openSelectKey) {
      await anyWindow.aistudio.openSelectKey();
    }
    setApiKeyReady(true);
  };

  const handleLogout = () => {
    setUserEmail('');
    setUserName('');
    setUserAvatar('');
    localStorage.removeItem('imagix_email');
    localStorage.removeItem('imagix_username');
    localStorage.removeItem('imagix_avatar');
    setApiKeyReady(false);
  };

  const calculateDaysLeft = () => {
    if (plan === 'free') return null;
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    const elapsed = Date.now() - purchaseDate;
    const remaining = Math.max(0, Math.ceil((thirtyDays - elapsed) / (1000 * 60 * 60 * 24)));
    return remaining;
  };

  const handleToggleAiMode = () => {
    const newAiMode = !isAiMode;
    setIsAiMode(newAiMode);
    if (newAiMode) { setStyle(null); setSelectedAngle("Default"); setSelectedLens("Default"); }
  };

  const updatePromptHistory = (newText: string) => {
    setPromptHistory(prev => {
      if (prev.length > 0 && prev[currentPromptIndex] === newText) return prev;
      const newHistory = [...prev.slice(0, currentPromptIndex + 1), newText];
      return newHistory;
    });
    setPromptHistory(prev => {
        const sliced = prev.slice(0, currentPromptIndex + 1);
        if (sliced.length > 0 && sliced[sliced.length - 1] === newText) return prev;
        return [...sliced, newText];
    });
    setCurrentPromptIndex(prev => prev + 1);
  };
  
  const commitToPromptHistory = (text: string) => {
      setPromptHistory(prev => {
          const sliced = prev.slice(0, currentPromptIndex + 1);
          return [...sliced, text];
      });
      setCurrentPromptIndex(prev => prev + 1);
  };

  const handlePromptTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newVal = e.target.value;
      setEnhancedPrompt(newVal);
      if (promptTimeoutRef.current) clearTimeout(promptTimeoutRef.current);
      promptTimeoutRef.current = setTimeout(() => {
          commitToPromptHistory(newVal);
      }, 800);
  };

  const undoPrompt = () => {
      if (currentPromptIndex > 0) {
          const newIndex = currentPromptIndex - 1;
          setEnhancedPrompt(promptHistory[newIndex]);
          setCurrentPromptIndex(newIndex);
      }
  };

  const redoPrompt = () => {
      if (currentPromptIndex < promptHistory.length - 1) {
          const newIndex = currentPromptIndex + 1;
          setEnhancedPrompt(promptHistory[newIndex]);
          setCurrentPromptIndex(newIndex);
      }
  };

  const handleEnhancePrompt = async (presetIdea?: string) => {
    if (isEnhancing) return;
    const ideaToUse = presetIdea || userIdea;
    
    // Safety check for empty input
    if (!ideaToUse.trim() && promptRefImages.length === 0 && !isAiMode) { 
        setError("Please describe your vision or add a reference image."); 
        return; 
    }

    setError(null);
    setIsEnhancing(true);
    try {
      const cameraString = (selectedAngle !== 'Default' || selectedLens !== 'Default') ? `${selectedAngle}, ${selectedLens}` : null;
      // Default to "Photorealistic" if style is null to prevent errors, though UI defaults it.
      const refined = await generateEnhancedPrompt(ideaToUse, promptRefImages, style || "Photorealistic", cameraString, isAiMode);
      setEnhancedPrompt(refined);
      setPromptHistory([refined]);
      setCurrentPromptIndex(0);
      setGenRefImages(promptRefImages);
      setCurrentStep(AppStep.REFINE_PROMPT);
    } catch (err: any) { 
        console.error("Enhance prompt error:", err);
        setError(err.message || "Failed to generate prompt. Please try again."); 
    } finally { 
        setIsEnhancing(false); 
    }
  };

  const handleGenerateImage = async (isVariation = false) => {
    if (isGeneratingImage || isRemovingBg) return;
    
    const count = isVariation ? 1 : imageCount;
    if (plan === 'free' && usageCount + count > 10) { 
        setError(`Free limit reached. You can only generate ${Math.max(0, 10 - usageCount)} more images.`); 
        return; 
    }

    setError(null);
    setIsGeneratingImage(true);
    
    try {
        const cameraString = (selectedAngle !== 'Default' || selectedLens !== 'Default') ? `${selectedAngle}, ${selectedLens}` : null;
        const defaultStyle = isAiMode ? "High-End Photorealistic Studio" : "Cinematic";
        const effectiveStyle = style || defaultStyle;
        let effectiveResolution = resolution;
        if (plan === 'free') effectiveResolution = '1K';
        if (plan === 'standard' && resolution === '4K') effectiveResolution = '2K';
        
        // Use Flash (Nano Banana) model for Free/Standard plan, Pro model only for Pro plan if needed
        // Since user asked for Nano Banana Pro, we map standard generation to Flash Image.
        const tier = plan === 'pro' ? 'pro' : 'flash';
        
        for (let i = 0; i < count; i++) {
            const imageUrl = await generateImage(
              enhancedPrompt + (isVariation ? " Give me a creative variation of this scene." : ""), 
              { aspectRatio, resolution: effectiveResolution, useGoogleSearch: useSearch }, 
              genRefImages, 
              effectiveStyle, 
              cameraString,
              null,
              tier
            );
            
            setUsageCount(prev => prev + 1);
            setGeneratedImage(imageUrl);
            const newItem: HistoryItem = { id: Date.now().toString() + i, url: imageUrl, prompt: enhancedPrompt, timestamp: Date.now() };
            setHistory(prev => [newItem, ...prev]);
        }
        
        setCurrentStep(AppStep.VIEW_RESULT);
    } catch (err: any) {
        if (err.message.includes("403") || err.message.includes("not found")) { setApiKeyReady(false); handleConnect(); }
        else { setError(err.message); }
    } finally { setIsGeneratingImage(false); }
  };

  const handleAnalyzeImage = async () => {
      if (isAnalyzing) return;
      if (!analysisImage) { setError("Please upload an image to analyze."); return; }
      
      setError(null);
      setIsAnalyzing(true);
      
      // Determine mode
      if (analysisMode === 'vectorize') {
         setVectorizeResult(null);
         try {
            const svgCode = await vectorizeImage(analysisImage);
            setVectorizeResult(svgCode);
         } catch (err: any) {
            setError(err.message || "Vectorization failed.");
         }
      } else {
         setAnalysisResult(null);
         try {
             const result = await analyzeImage(analysisImage, "Transcribe all text visible in this image exactly as it appears. Output only the text content. If there is no text, say 'No text detected'.");
             setAnalysisResult(result);
         } catch (err: any) {
              setError(err.message || "Analysis failed.");
         }
      }
      setIsAnalyzing(false);
  };

  const handleStartRecording = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        const audioChunks: Blob[] = [];

        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };

        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' }); // or 'audio/webm' depending on browser default
            setIsTranscribing(true);
            try {
                const base64Audio = await blobToBase64(audioBlob);
                const result = await transcribeAudio(base64Audio);
                setTranscriptionResult(result);
            } catch (err: any) {
                setError(err.message || "Transcription failed");
            } finally {
                setIsTranscribing(false);
            }
            
            // Cleanup stream
            stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
        setTranscriptionResult(null);
        setError(null);
    } catch (err) {
        setError("Could not access microphone. Please allow permissions.");
    }
  };

  const handleStopRecording = () => {
      if (mediaRecorderRef.current && isRecording) {
          mediaRecorderRef.current.stop();
          setIsRecording(false);
      }
  };

  const handleStandaloneBgRemoval = async () => {
      if (!bgRemoverImage || isRemovingBg) return;
      if (plan === 'free' && usageCount >= 10) { setError("Free limit reached. Upgrade to use background remover."); return; }
      
      setError(null);
      setIsRemovingBg(true);
      setBgRemoverResult(null);

      try {
          // Use Flash model for Free plan, Pro model for others
          const tier = plan === 'free' ? 'flash' : 'pro';

          // UPDATED PROMPT for better hair detail and edge separation
          const imageUrl = await generateImage(
              "Task: Create a professional cutout sticker of the main subject. " +
              "Background: Pure #FFFFFF White (RGB 255,255,255). " +
              "Style: Commercial Product Photography. " +
              "Critical Details: " +
              "1. Preserve every hair strand, whisker, and fine detail. " +
              "2. No cast shadows or drop shadows on the background. " +
              "3. High contrast separation between subject and background. " +
              "4. Do not crop the subject; keep it fully visible.",
              { aspectRatio: "1:1", resolution: "1K", useGoogleSearch: false }, 
              [bgRemoverImage],
              "Studio",
              null,
              null,
              tier
          );
          
          const transparentImageUrl = await removeWhiteBackground(imageUrl);
          setBgRemoverResult(transparentImageUrl);
          setUsageCount(prev => prev + 1);
      } catch (err: any) {
          setError(err.message || "Background removal failed");
      } finally {
          setIsRemovingBg(false);
      }
  };

  const handleMagicEdit = async (mask: string, editPrompt: string) => {
     if (isGeneratingImage) return;
     if (plan === 'free' && usageCount >= 10) { setError("Free limit reached. Upgrade to edit."); return; }
     if (!generatedImage) return;

     setError(null);
     setIsGeneratingImage(true);
     setIsDrawingMode(false); 

     try {
         const tier = plan === 'free' ? 'flash' : 'pro';
         const imageUrl = await generateImage(
            editPrompt,
            { aspectRatio, resolution, useGoogleSearch: false },
            [generatedImage],
            style || "Photorealistic",
            null,
            mask,
            tier
         );
         setUsageCount(prev => prev + 1);
         setGeneratedImage(imageUrl);
         const newItem: HistoryItem = { id: Date.now().toString(), url: imageUrl, prompt: `Edit: ${editPrompt}`, timestamp: Date.now() };
         setHistory(prev => [newItem, ...prev]);
         setCurrentStep(AppStep.VIEW_RESULT);
     } catch (err: any) {
         setError(err.message || "Magic Edit failed");
         setIsDrawingMode(true);
     } finally {
         setIsGeneratingImage(false);
     }
  };

  const handleRemoveBackground = async () => {
    if (isGeneratingImage || isRemovingBg || !generatedImage) return;
    if (plan === 'free' && usageCount >= 10) { setError("Free limit reached. Upgrade to use tools."); return; }
    
    setError(null);
    setIsRemovingBg(true);

    try {
        const tier = plan === 'free' ? 'flash' : 'pro';
        const imageUrl = await generateImage(
             "Task: Create a professional cutout sticker of the main subject. " +
              "Background: Pure #FFFFFF White (RGB 255,255,255). " +
              "Style: Commercial Product Photography. " +
              "Critical Details: " +
              "1. Preserve every hair strand, whisker, and fine detail. " +
              "2. No cast shadows or drop shadows on the background. " +
              "3. High contrast separation between subject and background. " +
              "4. Do not crop the subject; keep it fully visible.",
            { aspectRatio, resolution, useGoogleSearch: false },
            [generatedImage],
            "Studio",
            null,
            null,
            tier
        );
        
        // Post-process the image to make white pixels transparent
        const transparentImageUrl = await removeWhiteBackground(imageUrl);

        setUsageCount(prev => prev + 1);
        setGeneratedImage(transparentImageUrl);
        const newItem: HistoryItem = { 
            id: Date.now().toString(), 
            url: transparentImageUrl, 
            prompt: "Background Removal: " + enhancedPrompt, 
            timestamp: Date.now() 
        };
        setHistory(prev => [newItem, ...prev]);
    } catch (err: any) {
        setError(err.message || "Background removal failed");
    } finally {
        setIsRemovingBg(false);
    }
  };

  const handleDownload = (format: 'png' | 'jpeg' | 'webp', source?: string) => {
    const targetImage = source || generatedImage;
    if (!targetImage) return;
    
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      if (format === 'jpeg') {
         // ctx.fillStyle = '#FFFFFF';
         // ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      
      ctx.drawImage(img, 0, 0);
      
      const link = document.createElement('a');
      link.href = canvas.toDataURL(`image/${format}`, 0.92);
      link.download = `imagix-${Date.now()}.${format === 'jpeg' ? 'jpg' : format}`;
      link.click();
      setShowDownloadMenu(false);
    };
    img.src = targetImage;
  };
  
  const getCurrentHistoryIndex = () => {
      if (!generatedImage) return -1;
      return history.findIndex(item => item.url === generatedImage);
  };
  
  const handleUndoGeneration = () => {
      const currentIndex = getCurrentHistoryIndex();
      if (currentIndex !== -1 && currentIndex < history.length - 1) {
          const prevItem = history[currentIndex + 1];
          setGeneratedImage(prevItem.url);
          setEnhancedPrompt(prevItem.prompt);
      }
  };

  const handleRedoGeneration = () => {
      const currentIndex = getCurrentHistoryIndex();
      if (currentIndex > 0) {
          const nextItem = history[currentIndex - 1];
          setGeneratedImage(nextItem.url);
          setEnhancedPrompt(nextItem.prompt);
      }
  };

  const handleDeleteHistoryItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const handleDownloadHistoryItem = (e: React.MouseEvent, url: string, id: string) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = url;
    link.download = `imagix-${id}.png`;
    link.click();
  };
  
  const currentHistoryIdx = getCurrentHistoryIndex();
  const canUndoGen = currentHistoryIdx !== -1 && currentHistoryIdx < history.length - 1;
  const canRedoGen = currentHistoryIdx > 0;

  const handleShare = async () => {
    if (!generatedImage) return;

    if (navigator.share) {
      try {
        const res = await fetch(generatedImage);
        const blob = await res.blob();
        const file = new File([blob], 'imagix-vision.png', { type: 'image/png' });
        await navigator.share({
          files: [file],
          title: 'Imagix Studio Creation',
          text: `Visualized using Imagix Studio: ${enhancedPrompt.slice(0, 100)}...`,
        });
      } catch (err) {
        setIsShareModalOpen(true);
      }
    } else {
      setIsShareModalOpen(true);
    }
  };

  const handleReset = () => {
    setCurrentStep(AppStep.INPUT_IDEA);
    setGeneratedImage(null);
    setEnhancedPrompt('');
    setPromptRefImages([]);
    setGenRefImages([]);
    setUseSearch(false);
    setStyle("Photorealistic");
    setSelectedAngle("Default");
    setSelectedLens("Default");
    setIsShareModalOpen(false);
    setBgRemoverImage(null);
    setBgRemoverResult(null);
    setImageCount(1);
    setAnalysisImage(null);
    setAnalysisResult(null);
    setVectorizeResult(null);
  };

  const handleUpdatePlan = (newPlan: PlanType) => {
    setPlan(newPlan);
    setPurchaseDate(Date.now());
    setCurrentStep(AppStep.INPUT_IDEA);
  };
  
  const handleDownloadSvg = () => {
      if (!vectorizeResult) return;
      const blob = new Blob([vectorizeResult], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `vector-${Date.now()}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  if (!apiKeyReady || !userName) return <LoginScreen onConnect={handleConnect} isDark={isDark} />;

  const daysLeft = calculateDaysLeft();

  return (
    <div className={`min-h-screen relative font-sans flex flex-col selection:bg-purple-500 selection:text-white ${isDark ? 'text-brand-text' : 'text-zinc-800'}`}>
      <StarField isDark={isDark} />
      
      {isGeneratingImage && <SilverProgressBar isDark={isDark} />}
      
      {error && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] bg-red-500/90 text-white px-6 py-3 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-4 animate-slide-up border border-red-400/30">
          <XCircle size={20} />
          <span className="text-sm font-bold">{error}</span>
          <button onClick={() => setError(null)} className="hover:bg-white/20 p-1 rounded-full transition-colors"><X size={16} /></button>
        </div>
      )}

      {isDrawingMode && generatedImage && (
         <DrawingCanvas 
            backgroundImage={generatedImage} 
            onSave={(mask) => { setGenRefImages(prev => [mask, ...prev].slice(0, 5)); setIsDrawingMode(false); setCurrentStep(AppStep.REFINE_PROMPT); }} 
            onMagicEdit={handleMagicEdit}
            onCancel={() => setIsDrawingMode(false)} 
         />
      )}

      {isShareModalOpen && generatedImage && (
        <ShareSheet imageUrl={generatedImage} prompt={enhancedPrompt} onClose={() => setIsShareModalOpen(false)} />
      )}

      <div className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 pt-6">
        <nav className={`glass-panel rounded-full px-6 py-3 flex items-center gap-8 shadow-2xl max-w-4xl w-full justify-between backdrop-blur-3xl animate-fade-in relative transition-colors ${!isDark ? 'bg-white/60 border-black/5 shadow-[0_4px_20px_rgba(0,0,0,0.05)]' : ''}`}>
           <div className="flex items-center gap-2 pl-2 cursor-pointer" onClick={handleReset} title="Reset to Home"><Logo isDark={isDark} /></div>
           <div className={`hidden md:flex items-center gap-6 text-[10px] font-bold tracking-widest uppercase ${isDark ? 'text-brand-textDim' : 'text-zinc-400'}`}>
              <button onClick={() => setCurrentStep(AppStep.INPUT_IDEA)} className={`transition-colors hover:text-current ${currentStep === AppStep.INPUT_IDEA ? (isDark ? 'text-white' : 'text-zinc-900') : ''}`}>Writing</button>
              <button onClick={() => { if (generatedImage) setCurrentStep(AppStep.VIEW_RESULT); else setCurrentStep(AppStep.REFINE_PROMPT); }} className={`transition-colors hover:text-current ${currentStep === AppStep.VIEW_RESULT || currentStep === AppStep.REFINE_PROMPT ? (isDark ? 'text-white' : 'text-zinc-900') : ''}`}>Creation</button>
              <button onClick={() => setCurrentStep(AppStep.BG_REMOVER)} className={`transition-colors hover:text-current ${currentStep === AppStep.BG_REMOVER ? (isDark ? 'text-white' : 'text-zinc-900') : ''}`}>BG Remover</button>
              <button onClick={() => setCurrentStep(AppStep.IMAGE_ANALYSIS)} className={`transition-colors hover:text-current ${currentStep === AppStep.IMAGE_ANALYSIS ? (isDark ? 'text-white' : 'text-zinc-900') : ''}`}>Studio Tools</button>
              <button onClick={() => setCurrentStep(AppStep.BILLING)} className={`transition-colors hover:text-current ${currentStep === AppStep.BILLING ? (isDark ? 'text-white' : 'text-zinc-900') : ''}`}>Billing</button>
           </div>
           <div className="flex items-center gap-4">
              <button onClick={() => setShowSettings(!showSettings)} className={`flex items-center gap-3 pl-1 pr-4 py-1 rounded-full transition-all group overflow-hidden ${isDark ? 'bg-white/5 border border-white/10 hover:bg-white/10' : 'bg-white border border-black/5 hover:bg-zinc-50'}`} title="Account Settings">
                 <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10">
                    <img src={userAvatar} className="w-full h-full object-cover" alt="Profile" />
                 </div>
                 <div className="flex flex-col items-start leading-none">
                    <span className={`text-[10px] font-bold mb-1 ${isDark ? 'text-white' : 'text-zinc-900'}`}>{userName}</span>
                    <span className={`text-[8px] font-bold uppercase tracking-wider ${plan === 'pro' ? 'text-purple-400' : plan === 'standard' ? 'text-blue-400' : 'text-emerald-400'}`}>{plan}</span>
                 </div>
                 <ChevronDown size={12} className={`transition-transform ${isDark ? 'text-white/30 group-hover:text-white' : 'text-zinc-400 group-hover:text-zinc-600'} ${showSettings ? 'rotate-180' : ''}`} />
              </button>
           </div>

           {showSettings && (
             <div className={`absolute top-[calc(100%+12px)] right-6 w-80 glass-panel rounded-3xl p-6 shadow-3xl animate-slide-up z-[200] ${isDark ? 'border-white/20' : 'bg-white/80 border-black/5 shadow-2xl'}`}>
                <div className="flex flex-col items-center mb-6">
                   <div className="w-20 h-20 rounded-full border-2 border-white/20 p-1 mb-3">
                      <img src={userAvatar} className="w-full h-full rounded-full object-cover" alt="Profile" />
                   </div>
                   <h3 className={`font-display font-bold text-lg leading-tight ${isDark ? 'text-white' : 'text-zinc-900'}`}>{userName}</h3>
                   <p className="text-zinc-500 text-xs font-mono">{userEmail}</p>
                </div>
                
                <div className="space-y-2 mb-6">
                   <div className={`flex items-center justify-between p-3 rounded-2xl ${isDark ? 'bg-white/5 border border-white/5' : 'bg-white border border-black/5'}`}>
                      <div className="flex items-center gap-3">
                         <div className="p-2 rounded-lg bg-yellow-500/20 text-yellow-500">
                            <Coins size={14} />
                         </div>
                         <div className="flex flex-col w-full">
                            <div className="flex justify-between items-center mb-1">
                               <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Credits</span>
                               {plan !== 'free' && daysLeft !== null && (
                                   <span className="text-[9px] font-bold text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                      {daysLeft} Days Left
                                   </span>
                               )}
                            </div>
                            <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                               {plan === 'free' ? `${Math.max(0, 10 - usageCount)} / 10 Lifetime` : 'Unlimited'}
                            </span>
                         </div>
                      </div>
                   </div>

                   <div className={`flex items-center justify-between p-3 rounded-2xl ${isDark ? 'bg-white/5 border border-white/5' : 'bg-white border border-black/5'}`}>
                      <div className="flex items-center gap-3">
                         <div className={`p-2 rounded-lg ${plan === 'pro' ? 'bg-purple-500/20 text-purple-400' : plan === 'standard' ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-500'}`}>
                            <ShieldCheck size={14} />
                         </div>
                         <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Plan & Status</span>
                            <div className="flex items-center gap-2">
                               <span className={`text-xs font-bold capitalize ${isDark ? 'text-white' : 'text-zinc-900'}`}>{plan}</span>
                            </div>
                         </div>
                      </div>
                   </div>

                   {/* Theme Toggle */}
                   <button onClick={toggleTheme} className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all ${isDark ? 'bg-white/5 border border-white/5 hover:bg-white/10' : 'bg-white border border-black/5 hover:bg-zinc-50'}`} title="Switch Theme">
                      <div className="flex items-center gap-3">
                         <div className={`p-2 rounded-lg ${isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-orange-100 text-orange-500'}`}>
                            {isDark ? <Moon size={14} /> : <Sun size={14} />}
                         </div>
                         <div className="flex flex-col items-start">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Theme Mode</span>
                            <span className={`text-xs font-bold capitalize ${isDark ? 'text-white' : 'text-zinc-900'}`}>{isDark ? 'Black & Silver' : 'Light Studio'}</span>
                         </div>
                      </div>
                      <div className={`w-8 h-4 rounded-full relative transition-colors ${isDark ? 'bg-zinc-700' : 'bg-zinc-300'}`}>
                          <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-all ${isDark ? 'left-0.5' : 'left-[calc(100%-14px)]'}`}></div>
                      </div>
                   </button>
                </div>

                <div className="flex flex-col gap-2">
                   <button onClick={() => { setCurrentStep(AppStep.BILLING); setShowSettings(false); }} className={`w-full py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:brightness-110 transition-all ${isDark ? 'bg-white text-black' : 'bg-black text-white'}`}>Upgrade Workspace</button>
                   <button onClick={handleLogout} className="w-full py-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-500/20 transition-all"><LogOut size={12} /> Sign Out</button>
                </div>
             </div>
           )}
        </nav>
      </div>

      <main className="flex-1 w-full pt-32 pb-12 px-4 md:px-8 max-w-7xl mx-auto flex flex-col items-center">
        {currentStep === AppStep.INPUT_IDEA && (
          <div className="w-full flex flex-col items-center text-center animate-slide-up max-w-4xl">
             <div className={`mb-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full backdrop-blur-md ${isDark ? 'border border-white/10 bg-white/5' : 'border border-black/5 bg-white/60'}`}>
                <Sparkles size={12} className={isDark ? "text-white" : "text-black"} />
                <span className={`text-xs font-bold tracking-widest uppercase ${isDark ? 'text-white/80' : 'text-zinc-600'}`}>Powered by Addot</span>
             </div>
             
             <HeroTypewriter isDark={isDark} />
             
             <div className="w-full overflow-x-auto custom-scrollbar pb-6 mb-4 px-2">
                <div className="flex gap-3 min-w-max px-2">
                   {STYLE_PRESETS.map(s => (
                      <button key={s.id} disabled={isAiMode} onClick={() => setStyle(s.id === style ? null : s.id)} className={`flex flex-col items-center gap-2 px-5 py-4 rounded-2xl border transition-all duration-300 min-w-[100px] group ${isAiMode ? 'opacity-30 cursor-not-allowed grayscale' : ''} ${style === s.id && !isAiMode ? `${s.bg} ${s.border} ring-1 ring-white/20` : (isDark ? 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20' : 'bg-white border-black/5 hover:bg-zinc-50 hover:border-black/10')}`}>
                         <div className={`${style === s.id && !isAiMode ? s.color : (isDark ? 'text-zinc-500 group-hover:text-zinc-300' : 'text-zinc-400 group-hover:text-zinc-600')} transition-colors`}>{s.icon}</div>
                         <span className={`text-[10px] font-bold uppercase tracking-widest ${style === s.id && !isAiMode ? (isDark ? 'text-white' : 'text-black') : 'text-zinc-500'}`}>{s.name}</span>
                      </button>
                   ))}
                </div>
                {isAiMode && <div className="text-center mt-2 text-[10px] text-zinc-500 animate-pulse">Styles managed by addot</div>}
             </div>
             <div className="w-full relative group mt-4">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 via-white/10 to-blue-500/20 rounded-3xl opacity-0 group-hover:opacity-100 blur-xl transition duration-700"></div>
                <div className={`relative glass-panel rounded-3xl p-4 flex flex-col gap-4 backdrop-blur-3xl shadow-2xl ${isDark ? 'border-white/20' : 'border-black/5 bg-white/50'}`}>
                   <ConicBeam isDark={isDark} />
                   <div className={`relative rounded-2xl border overflow-hidden transition-colors ${isDark ? 'bg-black/40 border-white/5' : 'bg-white border-black/5'}`}>
                      <textarea value={userIdea} onChange={(e) => setUserIdea(e.target.value)} placeholder="Describe your visual concept in any language (e.g. 'A futuristic city on Mars')" className={`w-full h-32 bg-transparent p-6 text-xl placeholder:text-zinc-500 focus:outline-none resize-none font-sans leading-relaxed ${isDark ? 'text-white' : 'text-zinc-900'}`} />
                      <div className="absolute bottom-4 left-6 flex items-center gap-4">
                         <button onClick={() => fileInputRef.current?.click()} className={`flex items-center gap-2 text-[10px] font-bold hover:text-current transition-colors uppercase tracking-widest ${isDark ? 'text-zinc-500 hover:text-white' : 'text-zinc-400 hover:text-black'}`} title="Upload reference images"><Paperclip size={14} /> Attach Reference</button>
                         <input type="file" ref={fileInputRef} onChange={(e) => { const files = Array.from(e.target.files || []); files.forEach((f: File) => { const r = new FileReader(); r.onload = () => setPromptRefImages(prev => [...prev, r.result as string].slice(0, 5)); r.readAsDataURL(f); }); }} multiple hidden accept="image/*" />
                         <div className="flex gap-1">{promptRefImages.map((img, i) => (<div key={i} className={`w-6 h-6 rounded border overflow-hidden relative group/img ${isDark ? 'border-white/20' : 'border-black/10'}`}><img src={img} className="w-full h-full object-cover" /><button onClick={() => setPromptRefImages(p => p.filter((_, idx) => idx !== i))} className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 flex items-center justify-center" title="Remove image"><X size={8}/></button></div>))}</div>
                      </div>
                      <div className="absolute bottom-4 right-6 pointer-events-none opacity-20">
                         <span className={`text-[8px] font-bold uppercase tracking-widest ${isDark ? 'text-white' : 'text-black'}`}>Press Ctrl+Enter to write</span>
                      </div>
                   </div>
                   <div className="flex flex-wrap gap-2 px-2 py-1">
                      {ANGLE_PRESETS.map((a) => (<button key={a.id} disabled={isAiMode} onClick={() => setSelectedAngle(selectedAngle === a.id ? "Default" : a.id)} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest border transition-all ${isAiMode ? 'opacity-30 cursor-not-allowed' : ''} ${selectedAngle === a.id && !isAiMode ? (isDark ? 'bg-white text-black border-white' : 'bg-black text-white border-black') : (isDark ? 'bg-white/5 border-white/5 text-zinc-500 hover:text-white hover:bg-white/10' : 'bg-white border-black/5 text-zinc-400 hover:text-black hover:bg-zinc-50')}`}>{a.icon}{a.name}</button>))}
                   </div>
                   <div className={`flex items-center justify-between px-2 pt-2 border-t ${isDark ? 'border-white/5' : 'border-black/5'}`}>
                      <div className="flex gap-4"><button onClick={handleToggleAiMode} className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${isAiMode ? (isDark ? 'bg-white text-black border-white' : 'bg-black text-white border-black') : (isDark ? 'bg-white/5 text-white/40 border-white/10' : 'bg-white text-zinc-400 border-black/5')}`}><Sparkles size={14} /><span className="text-[10px] font-bold uppercase tracking-widest">Imagix AI</span></button></div>
                      <button onClick={() => handleEnhancePrompt()} disabled={isEnhancing} className="btn-primary py-4 px-10 flex items-center gap-3 text-sm">{isEnhancing ? <Loader2 className="animate-spin" size={18} /> : <>Generate Prompt <ArrowRight size={18} /></>}</button>
                   </div>
                </div>
             </div>
          </div>
        )}

        {(currentStep === AppStep.REFINE_PROMPT || currentStep === AppStep.VIEW_RESULT) && (
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 animate-slide-up h-[calc(100vh-200px)] min-h-[600px]">
             <div className={`lg:col-span-3 glass-panel rounded-3xl p-6 flex flex-col gap-6 backdrop-blur-xl ${isDark ? 'border-white/10' : 'border-black/5'}`}>
                <div className={`flex items-center justify-between pb-4 border-b ${isDark ? 'border-white/5' : 'border-black/5'}`}><span className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-white' : 'text-zinc-900'}`}>Library</span><History size={14} className={isDark ? "text-white/30" : "text-zinc-400"} /></div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                   <div className="grid grid-cols-2 gap-3">
                     {history.map(item => (
                        <div key={item.id} onClick={() => { setGeneratedImage(item.url); setEnhancedPrompt(item.prompt); setCurrentStep(AppStep.VIEW_RESULT); }} className={`group relative cursor-pointer aspect-square rounded-xl overflow-hidden border transition-all ${isDark ? 'border-white/10 hover:border-white/30' : 'border-black/5 hover:border-black/20'}`}>
                           <img src={item.url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="History" />
                           <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-2 backdrop-blur-sm">
                              <div className="flex gap-2">
                                <button onClick={(e) => handleDownloadHistoryItem(e, item.url, item.id)} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors" title="Download">
                                   <Download size={12} />
                                 </button>
                                <button onClick={(e) => handleDeleteHistoryItem(e, item.id)} className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-400 transition-colors" title="Delete">
                                   <Trash2 size={12} />
                                </button>
                              </div>
                              <span className="text-[8px] text-white/60 px-2 text-center truncate w-full">{item.prompt}</span>
                           </div>
                        </div>
                     ))}
                   </div>
                   {history.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center text-zinc-500 gap-2 opacity-40">
                         <ImageIcon size={24} />
                         <span className="text-[10px] font-bold uppercase tracking-widest">Empty</span>
                      </div>
                   )}
                </div>

                <button onClick={handleReset} className={`w-full py-4 rounded-2xl border text-[10px] font-bold uppercase tracking-widest transition-all ${isDark ? 'bg-white/5 border-white/10 hover:bg-white/10 text-white' : 'bg-white border-black/5 hover:bg-zinc-50 text-zinc-900'}`}>New Concept</button>
             </div>
             <div className="lg:col-span-9 flex flex-col h-full">
                {currentStep === AppStep.REFINE_PROMPT && (
                  <div className={`glass-panel rounded-3xl p-8 flex flex-col h-full backdrop-blur-2xl relative overflow-hidden ${isDark ? 'border-white/20' : 'border-black/5 bg-white/60'}`}>
                     <ConicBeam isDark={isDark} />
                     <div className="flex items-center justify-between mb-8 relative z-10">
                        <div><h2 className={`text-3xl font-display font-bold ${isDark ? 'text-white' : 'text-zinc-900'}`}>Art Direction</h2><p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em]">Refine parameters for final synthesis</p></div>
                        <div className="flex gap-3"><button onClick={() => setUseSearch(!useSearch)} className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${useSearch ? 'bg-blue-500/20 border-blue-500 text-blue-400' : (isDark ? 'bg-white/5 border-white/10 text-white/30' : 'bg-white border-black/10 text-zinc-400')}`} title="Enable Google Search Grounding (Pro Mode)"><Globe size={14} /><span className="text-[10px] font-bold uppercase tracking-widest">Web Research</span></button></div>
                     </div>
                     <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-12 overflow-y-auto custom-scrollbar pr-2 relative z-10">
                        <div className="flex flex-col gap-6">
                           <div className="flex-1 flex flex-col gap-3">
                              <div className="flex items-center justify-between">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Enhanced Synthesis</label>
                                <div className="flex items-center gap-2">
                                    <button onClick={undoPrompt} disabled={currentPromptIndex <= 0} className={`p-1.5 rounded-lg border transition-all ${currentPromptIndex > 0 ? (isDark ? 'text-zinc-400 hover:text-white bg-white/5 border-white/5 hover:bg-white/10' : 'text-zinc-500 hover:text-black bg-white border-black/5 hover:bg-zinc-50') : 'text-zinc-700 bg-transparent border-transparent cursor-not-allowed'}`} title="Undo Typing"><Undo size={14}/></button>
                                    <button onClick={redoPrompt} disabled={currentPromptIndex >= promptHistory.length - 1} className={`p-1.5 rounded-lg border transition-all ${currentPromptIndex < promptHistory.length - 1 ? (isDark ? 'text-zinc-400 hover:text-white bg-white/5 border-white/5 hover:bg-white/10' : 'text-zinc-500 hover:text-black bg-white border-black/5 hover:bg-zinc-50') : 'text-zinc-700 bg-transparent border-transparent cursor-not-allowed'}`} title="Redo Typing"><Redo size={14}/></button>
                                </div>
                              </div>
                              <div className="relative flex-1">
                                <textarea value={enhancedPrompt} onChange={handlePromptTextChange} className={`w-full h-full border rounded-2xl p-6 text-sm font-mono leading-relaxed focus:outline-none transition-all shadow-inner min-h-[160px] ${isDark ? 'bg-black/40 border-white/10 text-white focus:border-white/40' : 'bg-white border-black/10 text-zinc-900 focus:border-black/20'}`} />
                                <div className="absolute bottom-4 right-4 pointer-events-none opacity-20">
                                   <span className={`text-[7px] font-bold uppercase tracking-widest ${isDark ? 'text-white' : 'text-black'}`}>Ctrl+Enter to create</span>
                                </div>
                              </div>
                           </div>
                           <div className="grid grid-cols-1 gap-8">
                              <div>
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4 block">Aspect Format</label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                  {ASPECT_RATIO_CONFIG.map(r => (
                                    <button 
                                      key={r.id} 
                                      onClick={() => setAspectRatio(r.id)} 
                                      className={`relative flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border transition-all duration-300 group ${aspectRatio === r.id ? (isDark ? 'bg-white border-white shadow-xl scale-[1.02]' : 'bg-black border-black shadow-xl scale-[1.02]') : (isDark ? 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20' : 'bg-white border-black/5 hover:bg-zinc-50 hover:border-black/10')}`}
                                    >
                                      <div className={`p-2 rounded-xl transition-colors ${aspectRatio === r.id ? (isDark ? 'bg-black text-white' : 'bg-white text-black') : (isDark ? 'bg-white/5 text-zinc-400 group-hover:text-white' : 'bg-black/5 text-zinc-400 group-hover:text-black')}`}>
                                        <RatioShape ratio={r.id} />
                                      </div>
                                      <div className="flex flex-col items-center gap-1">
                                        <span className={`text-xs font-black uppercase tracking-widest ${aspectRatio === r.id ? (isDark ? 'text-black' : 'text-white') : (isDark ? 'text-zinc-300 group-hover:text-white' : 'text-zinc-500 group-hover:text-black')}`}>{r.label}</span>
                                        <span className={`text-[10px] font-mono font-medium ${aspectRatio === r.id ? (isDark ? 'text-black/60' : 'text-white/60') : 'text-zinc-600'}`}>{r.id}</span>
                                      </div>
                                      {aspectRatio === r.id && <div className="absolute top-3 right-3"><CheckCircle2 size={16} className={isDark ? "text-black" : "text-white"} /></div>}
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <div className="flex gap-6">
                                <div className="flex-1">
                                   <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4 block">Output Scale</label>
                                   <div className="flex gap-2">
                                      {(["1K", "2K", "4K"] as ImageResolution[]).map(res => { 
                                         const isLocked = (res === '2K' && plan === 'free') || (res === '4K' && (plan === 'free' || plan === 'standard')); 
                                         const upgradePath = res === '4K' ? 'Pro' : 'Standard';
                                         return (
                                            <div key={res} className="flex-1 relative group/btn">
                                               <button 
                                                 disabled={isLocked} 
                                                 onClick={() => setResolution(res)} 
                                                 className={`w-full py-2 rounded-lg text-[10px] font-bold border transition-all relative overflow-hidden ${isLocked ? (isDark ? 'bg-black/40 border-white/5 text-zinc-500' : 'bg-zinc-100 border-black/5 text-zinc-400') + ' cursor-not-allowed grayscale' : ''} ${!isLocked && resolution === res ? (isDark ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.2)]' : 'bg-black text-white border-black shadow-xl') : ''} ${!isLocked && resolution !== res ? (isDark ? 'bg-white/5 border-white/10 text-zinc-500 hover:text-white hover:bg-white/10' : 'bg-white border-black/5 text-zinc-500 hover:text-black hover:bg-zinc-50') : ''}`}
                                               >
                                                  {res}
                                                  {isLocked && <Lock size={8} className="absolute top-1 right-1 text-zinc-400" />}
                                               </button>
                                               {isLocked && (
                                                 <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-3 py-1.5 bg-zinc-900 border border-white/10 rounded-lg opacity-0 group-hover/btn:opacity-100 pointer-events-none transition-all translate-y-2 group-hover/btn:translate-y-0 z-50 shadow-2xl">
                                                    <span className="text-[8px] font-bold text-white uppercase tracking-widest">Requires {upgradePath} Plan</span>
                                                 </div>
                                               )}
                                            </div>
                                         ); 
                                      })}
                                   </div>
                                </div>
                                <div className="flex-1">
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4 block">Batch Count</label>
                                    <div className="flex gap-2">
                                      {[1, 2, 3, 4].map((num) => (
                                        <button
                                          key={num}
                                          onClick={() => setImageCount(num)}
                                          className={`flex-1 py-2 rounded-lg text-[10px] font-bold border transition-all ${
                                            imageCount === num
                                              ? (isDark ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.2)]' : 'bg-black text-white border-black shadow-xl')
                                              : (isDark ? 'bg-white/5 border-white/10 text-zinc-500 hover:text-white hover:bg-white/10' : 'bg-white border-black/5 text-zinc-500 hover:text-black hover:bg-zinc-50')
                                          }`}
                                        >
                                          {num}
                                        </button>
                                      ))}
                                    </div>
                                </div>
                              </div>
                           </div>
                        </div>
                        <div className="flex flex-col gap-8">
                           <div className={`grid grid-cols-2 gap-6 p-5 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-black/5'}`}>
                              <div><label className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3"><CameraIcon size={12} /> Camera Angle</label><div className="relative"><select value={selectedAngle} disabled={isAiMode} onChange={(e) => setSelectedAngle(e.target.value)} className={`w-full appearance-none border rounded-xl px-4 py-3 text-xs font-bold focus:outline-none transition-colors ${isDark ? 'bg-black/40 border-white/10 text-white focus:border-white/30 hover:bg-black/60' : 'bg-zinc-50 border-black/10 text-zinc-900 focus:border-black/20 hover:bg-zinc-100'} ${isAiMode ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}>{CAMERA_ANGLES.map(angle => (<option key={angle} value={angle}>{angle}</option>))}</select><ChevronDown size={14} className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${isDark ? 'text-white/30' : 'text-black/30'}`} /></div></div>
                              <div><label className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3"><Aperture size={12} /> Lens Type</label><div className="relative"><select value={selectedLens} disabled={isAiMode} onChange={(e) => setSelectedLens(e.target.value)} className={`w-full appearance-none border rounded-xl px-4 py-3 text-xs font-bold focus:outline-none transition-colors ${isDark ? 'bg-black/40 border-white/10 text-white focus:border-white/30 hover:bg-black/60' : 'bg-zinc-50 border-black/10 text-zinc-900 focus:border-black/20 hover:bg-zinc-100'} ${isAiMode ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}>{LENS_TYPES.map(lens => (<option key={lens} value={lens}>{lens}</option>))}</select><ChevronDown size={14} className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${isDark ? 'text-white/30' : 'text-black/30'}`} /></div></div>
                           </div>
                           {isAiMode && <div className="text-[10px] text-center text-zinc-500">Camera settings auto-optimized by addot</div>}
                           <div><label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4 block">Structural Reference ({genRefImages.length}/5)</label><div className="grid grid-cols-3 gap-3">{genRefImages.map((img, i) => (<div key={i} className={`aspect-square rounded-2xl border overflow-hidden relative group ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-black/10'}`}><img src={img} className="w-full h-full object-cover" />
                           <button onClick={(e) => { e.stopPropagation(); setGenRefImages(p => p.filter((_, idx) => idx !== i)); }} className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all" title="Remove"><X size={12} className="text-white" /></button>
                           </div>))}
                           <button onClick={() => genInputRef.current?.click()} className={`aspect-square rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all ${isDark ? 'bg-white/5 border-white/10 hover:bg-white/10 text-zinc-500 hover:text-white' : 'bg-white border-black/5 hover:bg-zinc-50 text-zinc-400 hover:text-black'}`}><Plus size={18} /><span className="text-[8px] font-bold uppercase tracking-widest">Add</span></button>
                           <input type="file" ref={genInputRef} onChange={(e) => { const files = Array.from(e.target.files || []); files.forEach((f: File) => { const r = new FileReader(); r.onload = () => setGenRefImages(prev => [...prev, r.result as string].slice(0, 5)); r.readAsDataURL(f); }); }} multiple hidden accept="image/*" />
                           </div></div></div></div>
                           <div className="pt-6 border-t border-white/5 flex items-center justify-between mt-auto">
                              <div className="flex flex-col"><span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Estimated Cost</span><span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-zinc-900'}`}>{plan === 'free' ? '1 Credit' : 'Included in Plan'}</span></div>
                              <button onClick={() => handleGenerateImage()} disabled={isGeneratingImage} className="btn-primary py-4 px-12 flex items-center gap-3 shadow-xl hover:shadow-2xl hover:scale-105 transition-all">{isGeneratingImage ? <Loader2 className="animate-spin" size={20} /> : <><Wand2 size={20} /> Generate Vision</>}</button>
                           </div>
                        </div>
                )}

                {currentStep === AppStep.VIEW_RESULT && generatedImage && (
                  <div className={`glass-panel rounded-3xl p-4 flex flex-col h-full backdrop-blur-2xl animate-fade-in relative overflow-hidden group ${isDark ? 'border-white/20' : 'border-black/5 bg-white/60'}`}>
                      <ConicBeam isDark={isDark} />
                      <div className="absolute inset-0 z-0"><img src={generatedImage} className="w-full h-full object-cover blur-3xl opacity-20" /></div>
                      <div className="relative z-10 flex-1 flex items-center justify-center p-8">
                        <div className="relative max-h-full max-w-full shadow-2xl rounded-xl overflow-hidden group/image">
                            <img src={generatedImage} className="max-h-[70vh] object-contain" />
                             <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover/image:opacity-100 transition-opacity">
                                <button onClick={() => setIsDrawingMode(true)} className="p-2 bg-black/50 backdrop-blur text-white rounded-lg hover:bg-black/70" title="Magic Edit"><Sparkles size={16}/></button>
                                <button onClick={handleRemoveBackground} className="p-2 bg-black/50 backdrop-blur text-white rounded-lg hover:bg-black/70" title="Remove Background"><Eraser size={16}/></button>
                                <button onClick={() => setShowDownloadMenu(true)} className="p-2 bg-black/50 backdrop-blur text-white rounded-lg hover:bg-black/70" title="Download"><Download size={16}/></button>
                             </div>
                        </div>
                      </div>
                      <div className="relative z-10 p-4 bg-black/20 backdrop-blur-md rounded-2xl flex items-center justify-between border border-white/10">
                         <div className="flex gap-2">
                            <button onClick={handleUndoGeneration} disabled={!canUndoGen} className={`p-3 rounded-xl transition-all ${!canUndoGen ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/10'}`}><Undo size={18} className="text-white"/></button>
                            <button onClick={handleRedoGeneration} disabled={!canRedoGen} className={`p-3 rounded-xl transition-all ${!canRedoGen ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/10'}`}><Redo size={18} className="text-white"/></button>
                         </div>
                         <div className="flex gap-4">
                            <button onClick={handleShare} className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2"><Share2 size={16} /> Share</button>
                            <button onClick={() => handleGenerateImage(true)} className="px-6 py-3 rounded-xl bg-white text-black font-bold text-xs uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-2"><RefreshCw size={16} /> Variations</button>
                         </div>
                      </div>
                  </div>
                )}
             </div></div>
        )}
        {currentStep === AppStep.BG_REMOVER && (
            <div className={`glass-panel rounded-3xl p-8 max-w-2xl w-full flex flex-col items-center text-center gap-6 animate-slide-up relative overflow-hidden ${isDark ? 'border-white/20' : 'border-black/5 bg-white/60'}`} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
               <ConicBeam isDark={isDark} />
               <div className="p-4 rounded-full bg-blue-500/20 text-blue-400 mb-2 relative z-10"><Eraser size={32} /></div>
               <h2 className={`text-3xl font-display font-bold relative z-10 ${isDark ? 'text-white' : 'text-zinc-900'}`}>Background Remover</h2>
               <p className="text-zinc-500 max-w-md relative z-10">Remove backgrounds from any image instantly using AI. Drag & drop an image or upload below.</p>
               
               <div className={`w-full aspect-video rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-4 transition-all relative overflow-hidden group z-10 ${isDragging ? 'border-blue-500 bg-blue-500/10' : (isDark ? 'border-white/10 bg-black/20 hover:border-white/20' : 'border-black/10 bg-zinc-50 hover:bg-zinc-100')}`}>
                  {bgRemoverResult ? (
                     <div className="relative w-full h-full p-4"><img src={bgRemoverResult} className="w-full h-full object-contain" /></div>
                  ) : bgRemoverImage ? (
                     <div className="relative w-full h-full p-4"><img src={bgRemoverImage} className="w-full h-full object-contain" /></div>
                  ) : (
                     <>
                        <Upload size={32} className="text-zinc-500" />
                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Drop Image Here</span>
                     </>
                  )}
                  <input type="file" ref={bgRemoverInputRef} onChange={(e) => { const file = e.target.files?.[0]; if(file) { const r = new FileReader(); r.onload = (e) => { setBgRemoverImage(e.target?.result as string); setBgRemoverResult(null); }; r.readAsDataURL(file); } }} hidden accept="image/*" />
                  <button onClick={() => bgRemoverInputRef.current?.click()} className="absolute inset-0 z-10"></button>
               </div>
               
               <button onClick={handleStandaloneBgRemoval} disabled={!bgRemoverImage || isRemovingBg} className="btn-primary py-3 px-8 w-full flex items-center justify-center gap-2 relative z-10">{isRemovingBg ? <Loader2 className="animate-spin" size={18} /> : 'Remove Background'}</button>
            </div>
        )}
        {currentStep === AppStep.IMAGE_ANALYSIS && (
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full animate-slide-up">
                <div className={`glass-panel rounded-3xl p-6 flex flex-col gap-4 relative overflow-hidden ${isDark ? 'border-white/20' : 'border-black/5 bg-white/60'}`}>
                    <ConicBeam isDark={isDark} />
                    <div className="flex justify-between items-center relative z-10">
                       <h3 className={`font-display font-bold text-xl ${isDark ? 'text-white' : 'text-zinc-900'}`}>Image Source</h3>
                       <div className="flex bg-black/20 rounded-lg p-1 border border-white/5">
                           <button onClick={() => setAnalysisMode('describe')} className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${analysisMode === 'describe' ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}>Analyze</button>
                           <button onClick={() => setAnalysisMode('vectorize')} className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-1 ${analysisMode === 'vectorize' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-zinc-500 hover:text-white'}`}><FileCode size={10} /> Vectorize</button>
                       </div>
                    </div>
                    
                    <div className={`aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center relative overflow-hidden z-10 transition-colors ${isDark ? 'border-white/10 bg-black/20 hover:bg-black/30' : 'border-black/10 bg-zinc-50 hover:bg-zinc-100'}`}>
                        {analysisImage ? <img src={analysisImage} className="w-full h-full object-contain" /> : <div className="text-center text-zinc-500"><ScanEye size={32} className="mx-auto mb-2" /><span className="text-xs font-bold uppercase">Upload Image</span></div>}
                        <input type="file" ref={analysisInputRef} onChange={(e) => { const file = e.target.files?.[0]; if(file) { const r = new FileReader(); r.onload = (e) => setAnalysisImage(e.target?.result as string); r.readAsDataURL(file); } }} hidden accept="image/*" />
                        <button onClick={() => analysisInputRef.current?.click()} className="absolute inset-0"></button>
                    </div>
                    
                    <button 
                        onClick={handleAnalyzeImage} 
                        disabled={!analysisImage || isAnalyzing} 
                        className={`btn-primary py-3 w-full flex items-center justify-center gap-2 relative z-10 ${analysisMode === 'vectorize' ? 'border-indigo-500/50 text-indigo-500' : ''}`}
                    >
                        {isAnalyzing ? <Loader2 className="animate-spin" /> : analysisMode === 'vectorize' ? 'Convert to SVG' : 'Analyze Image'}
                    </button>
                </div>
                
                <div className={`glass-panel rounded-3xl p-6 flex flex-col gap-4 relative overflow-hidden ${isDark ? 'border-white/20' : 'border-black/5 bg-white/60'}`}>
                   <ConicBeam isDark={isDark} />
                   <div className="flex items-center justify-between relative z-10">
                      <h3 className={`font-display font-bold text-xl ${isDark ? 'text-white' : 'text-zinc-900'}`}>Result</h3>
                      {analysisMode === 'vectorize' && vectorizeResult && (
                          <button onClick={handleDownloadSvg} className="px-3 py-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all">
                              <Download size={12} /> Download .SVG
                          </button>
                      )}
                   </div>
                   
                   <div className={`flex-1 rounded-2xl p-6 overflow-hidden z-10 relative group ${isDark ? 'bg-black/40 text-zinc-300' : 'bg-zinc-100 text-zinc-700'}`}>
                      {analysisMode === 'vectorize' ? (
                          vectorizeResult ? (
                            <div className="w-full h-full flex items-center justify-center">
                                {/* Dangerously Set Inner HTML is used here to render the SVG string returned by the API */}
                                <div className="w-full h-full [&>svg]:w-full [&>svg]:h-full" dangerouslySetInnerHTML={{ __html: vectorizeResult }} />
                            </div>
                          ) : (
                            <div className="h-full flex flex-col items-center justify-center text-zinc-500 gap-2 opacity-40">
                               <FileCode size={24} />
                               <span className="text-[10px] font-bold uppercase tracking-widest">No Vector Data</span>
                            </div>
                          )
                      ) : (
                          analysisResult ? (
                              <p className="leading-relaxed whitespace-pre-wrap">{analysisResult}</p>
                          ) : (
                              <div className="h-full flex flex-col items-center justify-center text-zinc-500 gap-2 opacity-40">
                                 <ScanEye size={24} />
                                 <span className="text-[10px] font-bold uppercase tracking-widest">No analysis data</span>
                              </div>
                          )
                      )}
                   </div>
                </div>
             </div>
        )}
        {currentStep === AppStep.BILLING && (
           <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-up">
              {(['free', 'standard', 'pro'] as PlanType[]).map((p) => (
                 <div key={p} className={`glass-panel rounded-3xl p-6 flex flex-col relative overflow-hidden transition-all ${plan === p ? 'border-indigo-500 ring-1 ring-indigo-500' : (isDark ? 'border-white/10 hover:border-white/20' : 'border-black/5 hover:border-black/10 bg-white/60')}`}>
                    {plan === p && <ConicBeam isDark={isDark} />}
                    <h3 className={`text-xl font-bold capitalize mb-2 relative z-10 ${isDark ? 'text-white' : 'text-zinc-900'}`}>{p}</h3>
                    <div className="text-3xl font-black mb-6 relative z-10">{p === 'free' ? '$0' : p === 'standard' ? '$19' : '$49'}<span className="text-sm font-normal text-zinc-500">/mo</span></div>
                    <ul className="space-y-3 mb-8 flex-1 relative z-10">
                       <li className="flex items-center gap-2 text-sm text-zinc-500"><Check size={14} className="text-emerald-500" /> {p === 'free' ? '10 Images / mo' : p === 'standard' ? 'Unlimited Standard' : 'Unlimited Pro'}</li>
                       <li className="flex items-center gap-2 text-sm text-zinc-500"><Check size={14} className="text-emerald-500" /> {p === 'free' ? '1K Resolution' : p === 'standard' ? 'Up to 2K' : 'Up to 4K'}</li>
                    </ul>
                    <button onClick={() => handleUpdatePlan(p)} disabled={plan === p} className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all relative z-10 ${plan === p ? 'bg-indigo-500/20 text-indigo-400' : 'btn-primary'}`}>{plan === p ? 'Current Plan' : 'Upgrade'}</button>
                 </div>
              ))}
           </div>
        )}
      </main>
    </div>
  );
};

export default App;