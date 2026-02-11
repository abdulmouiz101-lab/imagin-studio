
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
  Redo
} from 'lucide-react';
import { AppStep, HistoryItem, AspectRatio, ImageResolution } from './types';
import { generateEnhancedPrompt, generateImage } from './services/geminiService';

// --- Types ---
type PlanType = 'free' | 'standard' | 'pro';

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
  { id: '1:1' as AspectRatio, label: 'Post' },
  { id: '16:9' as AspectRatio, label: 'Thumbnail' },
  { id: '9:16' as AspectRatio, label: 'Reel' },
  { id: '3:4' as AspectRatio, label: 'Insta Post' },
];

const CAMERA_ANGLES = ["Default", "Eye-Level", "Low Angle", "High Angle", "Bird's Eye", "Dutch Angle"];
const LENS_TYPES = ["Default", "Wide (24mm)", "Standard (50mm)", "Portrait (85mm)", "Macro", "Fisheye"];

// --- Components ---

const SilverProgressBar = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Simulate progress that slows down as it reaches the end
    const timer = setInterval(() => {
      setProgress((oldProgress) => {
        if (oldProgress >= 90) return 90; // Stall at 90%
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
         className="h-full bg-gradient-to-r from-zinc-500 via-white to-zinc-500 shadow-[0_0_15px_rgba(255,255,255,0.8)] transition-all duration-300 ease-out" 
         style={{ width: `${progress}%` }}
       ></div>
    </div>
  );
};

const Logo = ({ large = false }: { large?: boolean }) => (
  <div className="flex flex-col select-none group cursor-pointer">
    {large && (
      <span className="text-[10px] md:text-xs font-bold tracking-[0.3em] text-zinc-500 uppercase mb-2 ml-1 opacity-70">
        Powered by Addot
      </span>
    )}
    <div className="relative flex items-baseline gap-1">
      <span className={`font-display font-black tracking-tighter text-white transition-all duration-300 ${large ? 'text-6xl md:text-8xl' : 'text-xl'}`}>
        imagix
      </span>
      <span className={`font-display font-bold tracking-[0.2em] text-white/40 group-hover:text-white/80 transition-colors ${large ? 'text-xl md:text-3xl' : 'text-[0.6rem]'}`}>
        STUDIO
      </span>
    </div>
  </div>
);

const StarField = () => {
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
      ctx.fillStyle = '#FFFFFF';
      stars.forEach(star => {
        ctx.globalAlpha = star.opacity;
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
  }, []);
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
  const [brushSize] = useState(40); // Fixed size for magic brush
  
  // Particle system for magic effect
  const particlesRef = useRef<{x: number, y: number, life: number, vx: number, vy: number}[]>([]);
  const requestRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = 1024;
    canvas.height = 1024;
    
    // Animation loop for particles
    const animate = () => {
      if (!ctx || !containerRef.current) return;
      // We don't clear rect here because we want to keep the drawing, 
      // particles are rendered on a separate layer in a real app, 
      // but for this mask canvas, we only want to render the WHITE strokes.
      // So we won't render particles ON the mask canvas. 
      // Instead, we just use this loop if we want animated brush strokes, 
      // but standard canvas stroking is better for mask generation.
    };
  }, []);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => { 
    setIsDrawing(true); 
    draw(e); 
  };
  
  const stopDrawing = () => { 
    setIsDrawing(false); 
    if (canvasRef.current) canvasRef.current.getContext('2d')?.beginPath(); 
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
    
    // Magic Silver Brush Style
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(255, 255, 255, 1.0)'; // Pure white for mask
    ctx.shadowBlur = 15;
    ctx.shadowColor = 'rgba(192, 192, 255, 0.8)'; // Silver/Blueish glow
    
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);

    // Add Sparkles (Visual only - we'd need a separate canvas layer for true UI particles so they don't bake into mask)
    // For now, the shadowBlur gives a nice glowing effect.
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
           <button onClick={onCancel} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/40 hover:text-white"><X size={24} /></button>
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
            {/* Custom Cursor Follower could go here */}
            
            {!showPromptInput && (
               <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-4 animate-slide-up">
                  <button onClick={() => canvasRef.current?.getContext('2d')?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)} className="px-6 py-3 rounded-xl bg-black/60 backdrop-blur border border-white/10 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-widest transition-all">
                    Clear
                  </button>
                  <button onClick={() => setShowPromptInput(true)} className="px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold text-xs uppercase tracking-widest shadow-lg hover:scale-105 transition-all flex items-center gap-2">
                    <Sparkles size={14} /> Magic Edit
                  </button>
                  {/* Keep the original functionality accessible if needed */}
                  <button onClick={() => onSave(canvasRef.current?.toDataURL('image/png') || '')} className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-zinc-400 text-[10px] font-bold uppercase tracking-widest transition-all">
                    Use as Ref
                  </button>
               </div>
            )}

            {showPromptInput && (
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-black/80 backdrop-blur-xl border-t border-white/10 z-40 animate-slide-up rounded-b-3xl">
                 <div className="max-w-3xl mx-auto flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                       <label className="text-xs font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                          <Wand2 size={12} /> Transform Highlighted Area
                       </label>
                       <button onClick={() => setShowPromptInput(false)} className="text-zinc-500 hover:text-white"><X size={14}/></button>
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
           <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/40 hover:text-white"><X size={20} /></button>
        </div>

        <div className="aspect-square rounded-2xl overflow-hidden border border-white/10 mb-8 bg-black/40">
           <img src={imageUrl} className="w-full h-full object-cover" alt="To Share" />
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
           {platforms.map(p => (
              <a key={p.name} href={p.url} target="_blank" rel="noopener noreferrer" className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition-all border border-white/5 hover:border-white/20 hover:scale-105 active:scale-95 ${p.color}`}>
                 {p.icon}
                 <span className="text-[10px] font-bold uppercase tracking-widest">{p.name}</span>
              </a>
           ))}
        </div>

        <div className="space-y-4">
           <button onClick={handleCopy} className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group">
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
           }} className="w-full btn-primary py-4 text-[10px] font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2">
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
    case '16:9': 
      return <div className={`w-7 h-4 ${common}`} />;
    case '9:16': 
      return <div className={`w-4 h-7 ${common}`} />;
    case '3:4': 
      return <div className={`w-5 h-[26px] ${common}`} />;
    default: 
      return <div className={`w-5 h-5 ${common}`} />;
  }
};

const App: React.FC = () => {
  // --- State ---
  const [apiKeyReady, setApiKeyReady] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<AppStep>(AppStep.INPUT_IDEA);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [isDrawingMode, setIsDrawingMode] = useState<boolean>(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  
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
  const [style, setStyle] = useState<string | null>(null); 
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
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStep, isEnhancing, isGeneratingImage, userIdea, style, selectedAngle, enhancedPrompt]);

  const handleConnect = async (mockEmail: string = "user@example.com") => {
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
      // Don't add duplicate adjacent entries
      if (prev.length > 0 && prev[currentPromptIndex] === newText) return prev;
      const newHistory = [...prev.slice(0, currentPromptIndex + 1), newText];
      return newHistory;
    });
    // We can't immediately set index here because React state updates are async
    // and we need the length of the new history.
    // Instead we do it functionally or effectively
    setPromptHistory(prev => {
        const sliced = prev.slice(0, currentPromptIndex + 1);
        if (sliced.length > 0 && sliced[sliced.length - 1] === newText) return prev;
        return [...sliced, newText];
    });
    setCurrentPromptIndex(prev => {
        // This is a bit tricky due to double setState. 
        // Let's simplify:
        return prev + 1; // Approximate, but safe enough for this logic
    });
  };
  
  // Revised History Setter to be atomic
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
    
    if (!isAiMode) {
      if (!style) {
        setError("Please select a Style to proceed.");
        return;
      }
      if (selectedAngle === "Default") {
        setError("Please select a Camera Angle to proceed.");
        return;
      }
    }

    if (!ideaToUse.trim() && promptRefImages.length === 0 && !isAiMode) { setError("Please describe your vision."); return; }
    setError(null);
    setIsEnhancing(true);
    try {
      const cameraString = (selectedAngle !== 'Default' || selectedLens !== 'Default') ? `${selectedAngle}, ${selectedLens}` : null;
      const refined = await generateEnhancedPrompt(ideaToUse, promptRefImages, style, cameraString, isAiMode);
      setEnhancedPrompt(refined);
      // Reset history for new generation flow
      setPromptHistory([refined]);
      setCurrentPromptIndex(0);
      
      setGenRefImages(promptRefImages);
      setCurrentStep(AppStep.REFINE_PROMPT);
    } catch (err: any) { setError(err.message || "Failed to refine prompt."); } finally { setIsEnhancing(false); }
  };

  const handleGenerateImage = async (isVariation = false) => {
    if (isGeneratingImage) return;
    if (plan === 'free' && usageCount >= 10 && !isVariation) { setError("Free limit reached (10 images). Please upgrade in Billing."); return; }
    setError(null);
    setIsGeneratingImage(true);
    try {
        const cameraString = (selectedAngle !== 'Default' || selectedLens !== 'Default') ? `${selectedAngle}, ${selectedLens}` : null;
        const defaultStyle = isAiMode ? "High-End Photorealistic Studio" : "Cinematic";
        const effectiveStyle = style || defaultStyle;
        let effectiveResolution = resolution;
        if (plan === 'free') effectiveResolution = '1K';
        if (plan === 'standard' && resolution === '4K') effectiveResolution = '2K';
        const imageUrl = await generateImage(enhancedPrompt + (isVariation ? " Give me a creative variation of this scene." : ""), { aspectRatio, resolution: effectiveResolution, useGoogleSearch: useSearch }, genRefImages, effectiveStyle, cameraString);
        setUsageCount(prev => prev + 1);
        setGeneratedImage(imageUrl);
        const newItem: HistoryItem = { id: Date.now().toString(), url: imageUrl, prompt: enhancedPrompt, timestamp: Date.now() };
        setHistory(prev => [newItem, ...prev]);
        setCurrentStep(AppStep.VIEW_RESULT);
    } catch (err: any) {
        if (err.message.includes("403") || err.message.includes("not found")) { setApiKeyReady(false); handleConnect(); }
        else { setError(err.message); }
    } finally { setIsGeneratingImage(false); }
  };

  const handleMagicEdit = async (mask: string, editPrompt: string) => {
     if (isGeneratingImage) return;
     if (plan === 'free' && usageCount >= 10) { setError("Free limit reached. Upgrade to edit."); return; }
     if (!generatedImage) return;

     setError(null);
     setIsGeneratingImage(true);
     // Close modal early or keep it open with loader? Better to show loader on main screen.
     setIsDrawingMode(false); 

     try {
         const imageUrl = await generateImage(
            editPrompt,
            { aspectRatio, resolution, useGoogleSearch: false },
            [generatedImage], // Pass original image as reference
            style || "Photorealistic",
            null,
            mask // Pass the mask
         );
         
         setUsageCount(prev => prev + 1);
         setGeneratedImage(imageUrl);
         // Add new image to history
         const newItem: HistoryItem = { id: Date.now().toString(), url: imageUrl, prompt: `Edit: ${editPrompt}`, timestamp: Date.now() };
         setHistory(prev => [newItem, ...prev]);
         setCurrentStep(AppStep.VIEW_RESULT);
     } catch (err: any) {
         setError(err.message || "Magic Edit failed");
         setIsDrawingMode(true); // Re-open if failed so they don't lose the mask
     } finally {
         setIsGeneratingImage(false);
     }
  };
  
  // Navigation for Generated Images History
  const getCurrentHistoryIndex = () => {
      if (!generatedImage) return -1;
      return history.findIndex(item => item.url === generatedImage);
  };
  
  const handleUndoGeneration = () => {
      const currentIndex = getCurrentHistoryIndex();
      if (currentIndex !== -1 && currentIndex < history.length - 1) {
          const prevItem = history[currentIndex + 1]; // History is newest first
          setGeneratedImage(prevItem.url);
          setEnhancedPrompt(prevItem.prompt);
      }
  };

  const handleRedoGeneration = () => {
      const currentIndex = getCurrentHistoryIndex();
      if (currentIndex > 0) {
          const nextItem = history[currentIndex - 1]; // History is newest first
          setGeneratedImage(nextItem.url);
          setEnhancedPrompt(nextItem.prompt);
      }
  };

  const handleDeleteHistoryItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setHistory(prev => prev.filter(item => item.id !== id));
    // If we're currently viewing the deleted item, just leave it as is to not disrupt the view,
    // or we could navigate back. For now, leaving the view is safer UX.
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
        // Convert base64 to File for native sharing
        const res = await fetch(generatedImage);
        const blob = await res.blob();
        const file = new File([blob], 'imagix-vision.png', { type: 'image/png' });
        
        await navigator.share({
          files: [file],
          title: 'Imagix Studio Creation',
          text: `Visualized using Imagix Studio: ${enhancedPrompt.slice(0, 100)}...`,
        });
      } catch (err) {
        console.error("Native share failed:", err);
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
    setStyle(null);
    setSelectedAngle("Default");
    setSelectedLens("Default");
    setIsShareModalOpen(false);
  };

  const handleUpdatePlan = (newPlan: PlanType) => {
    setPlan(newPlan);
    setPurchaseDate(Date.now());
    setCurrentStep(AppStep.INPUT_IDEA);
  };

  if (!apiKeyReady || !userName) return <LoginScreen onConnect={handleConnect} />;

  const daysLeft = calculateDaysLeft();

  return (
    <div className="min-h-screen relative font-sans text-brand-text flex flex-col selection:bg-white selection:text-black">
      <StarField />
      
      {isGeneratingImage && <SilverProgressBar />}

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
        <nav className="glass-panel rounded-full px-6 py-3 flex items-center gap-8 shadow-2xl max-w-4xl w-full justify-between backdrop-blur-3xl animate-fade-in relative">
           <div className="flex items-center gap-2 pl-2" onClick={handleReset}><Logo /></div>
           <div className="hidden md:flex items-center gap-6 text-[10px] font-bold tracking-widest text-brand-textDim uppercase">
              <button onClick={() => setCurrentStep(AppStep.INPUT_IDEA)} className={`transition-colors hover:text-white ${currentStep === AppStep.INPUT_IDEA ? 'text-white' : ''}`}>Writing</button>
              <button onClick={() => { if (generatedImage) setCurrentStep(AppStep.VIEW_RESULT); else setCurrentStep(AppStep.REFINE_PROMPT); }} className={`transition-colors hover:text-white ${currentStep === AppStep.VIEW_RESULT || currentStep === AppStep.REFINE_PROMPT ? 'text-white' : ''}`}>Creation</button>
              <button onClick={() => setCurrentStep(AppStep.BILLING)} className={`transition-colors hover:text-white ${currentStep === AppStep.BILLING ? 'text-white' : ''}`}>Billing</button>
           </div>
           <div className="flex items-center gap-4">
              <button onClick={() => setShowSettings(!showSettings)} className="flex items-center gap-3 pl-1 pr-4 py-1 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all group overflow-hidden">
                 <div className="w-8 h-8 rounded-full border border-white/20 overflow-hidden bg-zinc-800">
                    <img src={userAvatar} className="w-full h-full object-cover" alt="Profile" />
                 </div>
                 <div className="flex flex-col items-start leading-none">
                    <span className="text-[10px] font-bold text-white mb-1">{userName}</span>
                    <span className={`text-[8px] font-bold uppercase tracking-wider ${plan === 'pro' ? 'text-purple-400' : plan === 'standard' ? 'text-blue-400' : 'text-emerald-400'}`}>{plan}</span>
                 </div>
                 <ChevronDown size={12} className={`text-white/30 group-hover:text-white transition-transform ${showSettings ? 'rotate-180' : ''}`} />
              </button>
           </div>

           {showSettings && (
             <div className="absolute top-[calc(100%+12px)] right-6 w-80 glass-panel rounded-3xl p-6 shadow-3xl animate-slide-up border border-white/20 z-[200]">
                <div className="flex flex-col items-center mb-6">
                   <div className="w-20 h-20 rounded-full border-2 border-white/20 p-1 mb-3">
                      <img src={userAvatar} className="w-full h-full rounded-full object-cover" alt="Profile" />
                   </div>
                   <h3 className="font-display font-bold text-white text-lg leading-tight">{userName}</h3>
                   <p className="text-zinc-500 text-xs font-mono">{userEmail}</p>
                </div>
                
                <div className="space-y-2 mb-6">
                   <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
                      <div className="flex items-center gap-3">
                         <div className="p-2 rounded-lg bg-yellow-500/20 text-yellow-400">
                            <Coins size={14} />
                         </div>
                         <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Credits Remaining</span>
                            <span className="text-xs font-bold text-white">
                               {plan === 'free' ? `${Math.max(0, 10 - usageCount)} / 10 Remaining` : 'Unlimited Credits'}
                            </span>
                         </div>
                      </div>
                   </div>

                   <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
                      <div className="flex items-center gap-3">
                         <div className={`p-2 rounded-lg ${plan === 'pro' ? 'bg-purple-500/20 text-purple-400' : plan === 'standard' ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                            <ShieldCheck size={14} />
                         </div>
                         <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Plan & Status</span>
                            <div className="flex items-center gap-2">
                               <span className="text-xs font-bold text-white capitalize">{plan}</span>
                               {plan !== 'free' && daysLeft !== null && (
                                  <span className="text-[10px] font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-md">
                                     {daysLeft}d left
                                  </span>
                               )}
                            </div>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="flex flex-col gap-2">
                   <button onClick={() => { setCurrentStep(AppStep.BILLING); setShowSettings(false); }} className="w-full py-3 rounded-xl bg-white text-black font-bold text-[10px] uppercase tracking-widest hover:brightness-110 transition-all">Upgrade Workspace</button>
                   <button onClick={handleLogout} className="w-full py-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-500/20 transition-all"><LogOut size={12} /> Sign Out</button>
                </div>
             </div>
           )}
        </nav>
      </div>

      <main className="flex-1 w-full pt-32 pb-12 px-4 md:px-8 max-w-7xl mx-auto flex flex-col items-center">
        {currentStep === AppStep.INPUT_IDEA && (
          <div className="w-full flex flex-col items-center text-center animate-slide-up max-w-4xl">
             <div className="mb-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md">
                <Sparkles size={12} className="text-white" />
                <span className="text-xs font-bold tracking-widest text-white/80 uppercase">Powered by Addot</span>
             </div>
             <h1 className="text-5xl md:text-8xl font-sans font-black tracking-tighter mb-8 leading-[0.9] text-glow italic">
                <span className="inline-block animate-text-reveal">IMAGINE</span> <br/>
                <span className="text-gradient inline-block animate-text-reveal delay-200">WITHOUT LIMITS.</span>
             </h1>
             <div className="w-full overflow-x-auto custom-scrollbar pb-6 mb-4 px-2">
                <div className="flex gap-3 min-w-max px-2">
                   {STYLE_PRESETS.map(s => (
                      <button key={s.id} disabled={isAiMode} onClick={() => setStyle(s.id === style ? null : s.id)} className={`flex flex-col items-center gap-2 px-5 py-4 rounded-2xl border transition-all duration-300 min-w-[100px] group ${isAiMode ? 'opacity-30 cursor-not-allowed grayscale' : ''} ${style === s.id && !isAiMode ? `${s.bg} ${s.border} ring-1 ring-white/20` : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'}`}>
                         <div className={`${style === s.id && !isAiMode ? s.color : 'text-zinc-500 group-hover:text-zinc-300'} transition-colors`}>{s.icon}</div>
                         <span className={`text-[10px] font-bold uppercase tracking-widest ${style === s.id && !isAiMode ? 'text-white' : 'text-zinc-500'}`}>{s.name}</span>
                      </button>
                   ))}
                </div>
                {isAiMode && <div className="text-center mt-2 text-[10px] text-zinc-500 animate-pulse">Styles managed by addot</div>}
             </div>
             <div className="w-full relative group mt-4">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 via-white/10 to-blue-500/20 rounded-3xl opacity-0 group-hover:opacity-100 blur-xl transition duration-700"></div>
                <div className="relative glass-panel rounded-3xl p-4 flex flex-col gap-4 backdrop-blur-3xl shadow-2xl border-white/20">
                   <div className="relative bg-black/40 rounded-2xl border border-white/5 overflow-hidden">
                      <textarea value={userIdea} onChange={(e) => setUserIdea(e.target.value)} placeholder="Describe your visual concept in any language" className="w-full h-32 bg-transparent p-6 text-xl text-white placeholder:text-zinc-600 focus:outline-none resize-none font-sans leading-relaxed" />
                      <div className="absolute bottom-4 left-6 flex items-center gap-4">
                         <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 hover:text-white transition-colors uppercase tracking-widest"><Paperclip size={14} /> Attach Reference</button>
                         <input type="file" ref={fileInputRef} onChange={(e) => { const files = Array.from(e.target.files || []); files.forEach((f: File) => { const r = new FileReader(); r.onload = () => setPromptRefImages(prev => [...prev, r.result as string].slice(0, 5)); r.readAsDataURL(f); }); }} multiple hidden accept="image/*" />
                         <div className="flex gap-1">{promptRefImages.map((img, i) => (<div key={i} className="w-6 h-6 rounded border border-white/20 overflow-hidden relative group/img"><img src={img} className="w-full h-full object-cover" /><button onClick={() => setPromptRefImages(p => p.filter((_, idx) => idx !== i))} className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 flex items-center justify-center"><X size={8}/></button></div>))}</div>
                      </div>
                      <div className="absolute bottom-4 right-6 pointer-events-none opacity-20">
                         <span className="text-[8px] font-bold uppercase tracking-widest text-white">Press Ctrl+Enter to write</span>
                      </div>
                   </div>
                   <div className="flex flex-wrap gap-2 px-2 py-1">
                      {ANGLE_PRESETS.map((a) => (<button key={a.id} disabled={isAiMode} onClick={() => setSelectedAngle(selectedAngle === a.id ? "Default" : a.id)} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest border transition-all ${isAiMode ? 'opacity-30 cursor-not-allowed' : ''} ${selectedAngle === a.id && !isAiMode ? 'bg-white text-black border-white' : 'bg-white/5 border-white/5 text-zinc-500 hover:text-white hover:bg-white/10'}`}>{a.icon}{a.name}</button>))}
                   </div>
                   <div className="flex items-center justify-between px-2 pt-2 border-t border-white/5">
                      <div className="flex gap-4"><button onClick={handleToggleAiMode} className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${isAiMode ? 'bg-white text-black border-white' : 'bg-white/5 text-white/40 border-white/10'}`}><Cpu size={14} /><span className="text-[10px] font-bold uppercase tracking-widest">AI Studio</span></button></div>
                      <button onClick={() => handleEnhancePrompt()} disabled={isEnhancing} className="btn-primary py-4 px-10 flex items-center gap-3 text-sm">{isEnhancing ? <Loader2 className="animate-spin" size={18} /> : <>Write Prompt <ArrowRight size={18} /></>}</button>
                   </div>
                </div>
             </div>
          </div>
        )}

        {(currentStep === AppStep.REFINE_PROMPT || currentStep === AppStep.VIEW_RESULT) && (
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 animate-slide-up h-[calc(100vh-200px)] min-h-[600px]">
             <div className="lg:col-span-3 glass-panel rounded-3xl p-6 flex flex-col gap-6 backdrop-blur-xl border-white/10">
                <div className="flex items-center justify-between pb-4 border-b border-white/5"><span className="text-[10px] font-bold text-white uppercase tracking-widest">Library</span><History size={14} className="text-white/30" /></div>
                <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar">
                   {history.map(item => (
                      <div key={item.id} onClick={() => { setGeneratedImage(item.url); setEnhancedPrompt(item.prompt); setCurrentStep(AppStep.VIEW_RESULT); }} className="group relative cursor-pointer mb-4">
                         <div className="aspect-video rounded-xl overflow-hidden border border-white/10 group-hover:border-white/40 transition-all relative">
                            <img src={item.url} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                               <button onClick={(e) => handleDownloadHistoryItem(e, item.url, item.id)} className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-colors" title="Download">
                                  <Download size={14} />
                               </button>
                               <button onClick={(e) => handleDeleteHistoryItem(e, item.id)} className="p-2 rounded-full bg-red-500/20 hover:bg-red-500/40 text-red-400 backdrop-blur-md transition-colors" title="Delete">
                                  <Trash2 size={14} />
                               </button>
                            </div>
                         </div>
                         <p className="text-[10px] text-zinc-500 truncate group-hover:text-white transition-colors px-1">{item.prompt}</p>
                      </div>
                   ))}
                </div>
                <button onClick={handleReset} className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-[10px] font-bold uppercase tracking-widest text-white transition-all">New Concept</button>
             </div>
             <div className="lg:col-span-9 flex flex-col h-full">
                {currentStep === AppStep.REFINE_PROMPT && (
                  <div className="glass-panel rounded-3xl p-8 flex flex-col h-full backdrop-blur-2xl border-white/20 relative overflow-hidden">
                     <div className="flex items-center justify-between mb-8">
                        <div><h2 className="text-3xl font-display font-bold text-white">Art Direction</h2><p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em]">Refine parameters for final synthesis</p></div>
                        <div className="flex gap-3"><button onClick={() => setUseSearch(!useSearch)} className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${useSearch ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-white/5 border-white/10 text-white/30'}`} title="Enable Google Search Grounding (Pro Mode)"><Globe size={14} /><span className="text-[10px] font-bold uppercase tracking-widest">Web Research</span></button></div>
                     </div>
                     <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-12 overflow-y-auto custom-scrollbar pr-2">
                        <div className="flex flex-col gap-6">
                           <div className="flex-1 flex flex-col gap-3">
                              <div className="flex items-center justify-between">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Enhanced Synthesis</label>
                                <div className="flex items-center gap-2">
                                    <button onClick={undoPrompt} disabled={currentPromptIndex <= 0} className={`p-1.5 rounded-lg border border-white/5 transition-all ${currentPromptIndex > 0 ? 'text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10' : 'text-zinc-700 bg-transparent cursor-not-allowed'}`} title="Undo Typing"><Undo size={14}/></button>
                                    <button onClick={redoPrompt} disabled={currentPromptIndex >= promptHistory.length - 1} className={`p-1.5 rounded-lg border border-white/5 transition-all ${currentPromptIndex < promptHistory.length - 1 ? 'text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10' : 'text-zinc-700 bg-transparent cursor-not-allowed'}`} title="Redo Typing"><Redo size={14}/></button>
                                </div>
                              </div>
                              <div className="relative flex-1">
                                <textarea value={enhancedPrompt} onChange={handlePromptTextChange} className="w-full h-full bg-black/40 border border-white/10 rounded-2xl p-6 text-sm font-mono leading-relaxed focus:border-white/40 focus:outline-none transition-all shadow-inner min-h-[160px]" />
                                <div className="absolute bottom-4 right-4 pointer-events-none opacity-20">
                                   <span className="text-[7px] font-bold uppercase tracking-widest text-white">Ctrl+Enter to create</span>
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
                                      className={`relative flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border transition-all duration-300 group ${aspectRatio === r.id ? 'bg-white border-white shadow-xl scale-[1.02]' : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'}`}
                                    >
                                      <div className={`p-2 rounded-xl transition-colors ${aspectRatio === r.id ? 'bg-black text-white' : 'bg-white/5 text-zinc-400 group-hover:text-white'}`}>
                                        <RatioShape ratio={r.id} />
                                      </div>
                                      <div className="flex flex-col items-center gap-1">
                                        <span className={`text-xs font-black uppercase tracking-widest ${aspectRatio === r.id ? 'text-black' : 'text-zinc-300 group-hover:text-white'}`}>{r.label}</span>
                                        <span className={`text-[10px] font-mono font-medium ${aspectRatio === r.id ? 'text-black/60' : 'text-zinc-600'}`}>{r.id}</span>
                                      </div>
                                      {aspectRatio === r.id && <div className="absolute top-3 right-3"><CheckCircle2 size={16} className="text-black" /></div>}
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <div>
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
                                               className={`w-full py-2 rounded-lg text-[10px] font-bold border transition-all relative overflow-hidden ${isLocked ? 'bg-black/40 border-white/5 text-zinc-500 cursor-not-allowed grayscale' : ''} ${!isLocked && resolution === res ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.2)]' : ''} ${!isLocked && resolution !== res ? 'bg-white/5 border-white/10 text-zinc-500 hover:text-white hover:bg-white/10' : ''}`}
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
                           </div>
                        </div>
                        <div className="flex flex-col gap-8">
                           <div className="grid grid-cols-2 gap-6 p-5 rounded-2xl bg-white/5 border border-white/10">
                              <div><label className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3"><CameraIcon size={12} /> Camera Angle</label><div className="relative"><select value={selectedAngle} disabled={isAiMode} onChange={(e) => setSelectedAngle(e.target.value)} className={`w-full appearance-none bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white focus:outline-none focus:border-white/30 transition-colors ${isAiMode ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:bg-black/60'}`}>{CAMERA_ANGLES.map(angle => (<option key={angle} value={angle}>{angle}</option>))}</select><ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" /></div></div>
                              <div><label className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3"><Aperture size={12} /> Lens Type</label><div className="relative"><select value={selectedLens} disabled={isAiMode} onChange={(e) => setSelectedLens(e.target.value)} className={`w-full appearance-none bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white focus:outline-none focus:border-white/30 transition-colors ${isAiMode ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:bg-black/60'}`}>{LENS_TYPES.map(lens => (<option key={lens} value={lens}>{lens}</option>))}</select><ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" /></div></div>
                           </div>
                           {isAiMode && <div className="text-[10px] text-center text-zinc-500">Camera settings auto-optimized by addot</div>}
                           <div><label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4 block">Structural Reference ({genRefImages.length}/5)</label><div className="grid grid-cols-3 gap-3">{genRefImages.map((img, i) => (<div key={i} className="aspect-square rounded-2xl bg-white/5 border border-white/10 overflow-hidden relative group"><img src={img} className="w-full h-full object-cover" /><button onClick={() => setGenRefImages(p => p.filter((_, idx) => idx !== i))} className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><X size={16}/></button></div>))}<button onClick={() => genInputRef.current?.click()} className="aspect-square rounded-2xl border border-dashed border-white/10 flex flex-col items-center justify-center gap-2 text-white/20 hover:text-white/60 hover:bg-white/5 transition-all"><Plus size={20} /><span className="text-[8px] font-bold uppercase tracking-widest">Add Reference</span></button><input type="file" ref={genInputRef} multiple hidden accept="image/*" onChange={(e) => { const files = Array.from(e.target.files || []); files.forEach((f: File) => { const r = new FileReader(); r.onload = () => setGenRefImages(prev => [...prev, r.result as string].slice(0, 5)); r.readAsDataURL(f); }); }} /></div></div>
                           <div className="mt-auto space-y-4"><div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-4"><div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400"><Zap size={20} fill="currentColor" /></div><div><p className="text-[10px] font-bold text-white uppercase tracking-widest">Synthesis Mode</p><p className="text-[9px] text-zinc-500 uppercase tracking-widest">Estimated: 4-8 Seconds</p></div></div><button onClick={() => handleGenerateImage()} disabled={isGeneratingImage} className="w-full btn-primary py-6 text-sm flex items-center justify-center gap-3 shadow-2xl">{isGeneratingImage ? <Loader2 className="animate-spin" /> : <>Create <Sparkles size={18} /></>}</button></div>
                        </div>
                     </div>
                  </div>
                )}
                {currentStep === AppStep.VIEW_RESULT && generatedImage && (
                  <div className="glass-panel rounded-3xl p-1 h-full relative overflow-hidden flex flex-col border-white/20 animate-fade-in shadow-2xl">
                     <div className="flex-1 bg-[#020204] relative rounded-[2.2rem] overflow-hidden flex items-center justify-center">
                        <img src={generatedImage} className="max-w-full max-h-full object-contain" />
                        <div className="absolute top-8 left-8 flex gap-3">
                           <button onClick={handleUndoGeneration} disabled={!canUndoGen} className={`w-10 h-10 rounded-full bg-black/60 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white transition-all ${!canUndoGen ? 'opacity-30 cursor-not-allowed' : 'hover:bg-black'}`} title="Previous Generation"><Undo size={16} /></button>
                           <button onClick={handleRedoGeneration} disabled={!canRedoGen} className={`w-10 h-10 rounded-full bg-black/60 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white transition-all ${!canRedoGen ? 'opacity-30 cursor-not-allowed' : 'hover:bg-black'}`} title="Next Generation"><Redo size={16} /></button>
                        </div>
                        <div className="absolute top-8 right-8 flex gap-3">
                           <button onClick={() => window.open(generatedImage, '_blank')} className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white hover:bg-black transition-all"><Maximize2 size={20} /></button>
                        </div>
                        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 px-6 py-4 rounded-3xl bg-black/40 backdrop-blur-2xl border border-white/10 shadow-2xl animate-slide-up"><button onClick={() => { const link = document.createElement('a'); link.href = generatedImage; link.download = `imagix-${Date.now()}.png`; link.click(); }} className="btn-primary px-8 py-3 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2"><Download size={14} /> Download as PNG</button><div className="w-px h-6 bg-white/10 mx-2"></div><button onClick={handleShare} className="btn-secondary p-3 text-blue-400" title="Share Creation"><Share2 size={18} /></button><button onClick={() => setIsDrawingMode(true)} className="btn-secondary p-3" title="Structural Edit"><Pencil size={18} /></button><button onClick={() => setCurrentStep(AppStep.REFINE_PROMPT)} className="btn-secondary p-3" title="Back to Refinement"><Edit3 size={18} /></button></div>
                     </div>
                  </div>
                )}
             </div>
          </div>
        )}

        {currentStep === AppStep.BILLING && (
          <div className="w-full flex flex-col items-center justify-center py-12 px-4 animate-slide-up">
            <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">Choose Your Plan</h2>
            <p className="text-zinc-500 mb-12 text-center max-w-lg">Unlock professional capabilities, higher resolutions, and commercial rights.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl">
              <div className={`glass-panel p-8 rounded-3xl flex flex-col border transition-all ${plan === 'free' ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-white/10'}`}>
                <div className="mb-6"><span className="text-emerald-400 text-xs font-bold uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full">Starter</span></div>
                <div className="flex items-baseline gap-1 mb-6"><span className="text-4xl font-bold text-white">0/-pkr</span><span className="text-zinc-500">/ forever</span></div>
                <div className="space-y-4 mb-8 flex-1">
                  <div className="flex items-center gap-3 text-sm text-zinc-300"><Check size={16} className="text-emerald-500" /><span>1K Resolution limit</span></div>
                  <div className="flex items-center gap-3 text-sm text-zinc-300"><Check size={16} className="text-emerald-500" /><span>10 Images Lifetime Limit</span></div>
                  <div className="flex items-center gap-3 text-sm text-zinc-300"><Check size={16} className="text-emerald-500" /><span>Personal Usage Only</span></div>
                  <div className="flex items-center gap-3 text-sm text-zinc-500"><X size={16} /><span>No 2K/4K Support</span></div>
                </div>
                <button onClick={() => handleUpdatePlan('free')} disabled={plan === 'free'} className={`w-full py-4 rounded-xl font-bold uppercase text-xs tracking-widest transition-all ${plan === 'free' ? 'bg-white/10 text-white cursor-default' : 'bg-white text-black hover:bg-zinc-200'}`}>{plan === 'free' ? 'Current Plan' : 'Select Free'}</button>
                {plan === 'free' && <p className="text-center text-[10px] text-zinc-500 mt-4 uppercase tracking-widest">Usage: {usageCount} / 10</p>}
              </div>
              <div className={`glass-panel p-8 rounded-3xl flex flex-col border transition-all relative overflow-hidden ${plan === 'standard' ? 'border-blue-500/50 bg-blue-500/5' : 'border-white/10'}`}>
                <div className="mb-6"><span className="text-blue-400 text-xs font-bold uppercase tracking-widest bg-blue-500/10 px-3 py-1 rounded-full">Standard</span></div>
                <div className="flex items-baseline gap-1 mb-6"><span className="text-4xl font-bold text-white">499/-pkr</span><span className="text-zinc-500">/ month</span></div>
                <div className="space-y-4 mb-8 flex-1">
                  <div className="flex items-center gap-3 text-sm text-zinc-300"><Check size={16} className="text-blue-500" /><span>Up to 2K Resolution</span></div>
                  <div className="flex items-center gap-3 text-sm text-zinc-300"><Check size={16} className="text-blue-500" /><span>Unlimited Generations</span></div>
                   <div className="flex items-center gap-3 text-sm text-zinc-300"><Check size={16} className="text-blue-500" /><span>Nano Banana Access</span></div>
                  <div className="flex items-center gap-3 text-sm text-zinc-300"><X size={16} /><span>No 4K Support</span></div>
                </div>
                <button onClick={() => handleUpdatePlan('standard')} disabled={plan === 'standard'} className={`w-full py-4 rounded-xl font-bold uppercase text-xs tracking-widest transition-all ${plan === 'standard' ? 'bg-white/10 text-white cursor-default' : 'bg-white text-black hover:bg-zinc-200'}`}>{plan === 'standard' ? 'Current Plan' : 'Upgrade to Standard'}</button>
              </div>
              <div className={`glass-panel p-8 rounded-3xl flex flex-col border transition-all relative overflow-hidden ${plan === 'pro' ? 'border-purple-500/50 bg-purple-500/5' : 'border-white/10'}`}>
                {plan !== 'pro' && <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>}
                <div className="mb-6 flex justify-between items-center"><span className="text-purple-400 text-xs font-bold uppercase tracking-widest bg-purple-500/10 px-3 py-1 rounded-full">Pro Studio</span><Gem size={18} className="text-purple-400" /></div>
                <div className="flex flex-col gap-1 mb-6">
                   <div className="flex items-baseline gap-1"><span className="text-4xl font-bold text-white">799/-pkr</span><span className="text-zinc-500">/ month</span></div>
                   <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest animate-pulse">Limited Price Offer</span>
                </div>
                <div className="space-y-4 mb-8 flex-1">
                  <div className="flex items-center gap-3 text-sm text-zinc-300"><Check size={16} className="text-purple-500" /><span>Full 4K Ultra HD</span></div>
                  <div className="flex items-center gap-3 text-sm text-zinc-300"><Check size={16} className="text-purple-500" /><span>Unlimited Generations</span></div>
                  <div className="flex items-center gap-3 text-sm text-zinc-300"><Check size={16} className="text-purple-500" /><span>Commercial License</span></div>
                  <div className="flex items-center gap-3 text-sm text-zinc-300"><Check size={16} className="text-purple-500" /><span>Priority Generation</span></div>
                </div>
                <button onClick={() => handleUpdatePlan('pro')} disabled={plan === 'pro'} className={`w-full py-4 rounded-xl font-bold uppercase text-xs tracking-widest transition-all shadow-lg ${plan === 'pro' ? 'bg-white/10 text-white cursor-default' : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:brightness-110'}`}>{plan === 'pro' ? 'Current Plan' : 'Upgrade to Pro'}</button>
              </div>
            </div>
          </div>
        )}
      </main>

      {error && (
         <div className="fixed bottom-12 left-1/2 -translate-x-1/2 glass-panel border-red-500/30 text-red-200 px-8 py-4 rounded-full flex items-center gap-4 z-[200] animate-slide-up shadow-2xl">
            <XCircle size={18} className="text-red-500" />
            <span className="text-xs font-bold uppercase tracking-widest">{error}</span>
            <button onClick={() => setError(null)} className="p-1 hover:text-white transition-colors"><X size={16} /></button>
         </div>
      )}
    </div>
  );
};

const LoginScreen: React.FC<{ onConnect: (email: string) => void }> = ({ onConnect }) => {
  const [email, setEmail] = useState('');
  return (
    <div className="min-h-screen bg-[#020204] text-white flex items-center justify-center relative overflow-hidden">
       <StarField />
       <div className="relative z-10 flex flex-col items-center text-center max-w-lg w-full px-6 animate-slide-up">
          <Logo large />
          <p className="text-zinc-500 mt-8 mb-12 text-lg font-medium tracking-tight">High-performance creative synthesis engine.</p>
          <div className="w-full glass-panel rounded-3xl p-8 border-white/10 backdrop-blur-3xl shadow-2xl">
             <div className="mb-8 flex flex-col gap-2">
                <span className="text-[10px] font-bold text-white uppercase tracking-[0.3em]">Authentication</span>
                <p className="text-xs text-zinc-500">Enter your email to initialize your workspace.</p>
             </div>
             <div className="flex flex-col gap-4 mb-6">
                 <input 
                   type="email" 
                   value={email}
                   onChange={(e) => setEmail(e.target.value)}
                   placeholder="Enter email (e.g. alex.studio@gmail.com)" 
                   className="w-full py-4 px-6 bg-black/40 border border-white/10 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/30 transition-all font-sans text-sm"
                 />
                 <button 
                   onClick={() => onConnect(email || "creator@imagix.ai")} 
                   className="w-full py-4 bg-white text-black font-bold text-xs uppercase tracking-[0.1em] rounded-xl flex items-center justify-center gap-3 hover:scale-[1.02] transition-all shadow-xl active:scale-95 group"
                 >
                    <Chrome size={18} className="text-blue-600 group-hover:rotate-12 transition-transform" />
                    Sign in with Google
                 </button>
             </div>
             <div className="flex items-center gap-4 my-6 opacity-50">
                <div className="h-px bg-white/20 flex-1"></div><span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Or</span><div className="h-px bg-white/20 flex-1"></div>
             </div>
             <button onClick={() => onConnect("creator@imagix.ai")} className="w-full py-4 bg-white/5 text-zinc-400 font-bold text-xs uppercase tracking-[0.1em] rounded-xl flex items-center justify-center gap-3 hover:bg-white/10 hover:text-white transition-all border border-white/10"><Key size={18} />Continue as Guest</button>
             <div className="mt-8 pt-8 border-t border-white/5 flex flex-col gap-4">
                <div className="flex justify-between text-[10px] font-bold text-zinc-600 uppercase tracking-widest"><span>System Status</span><span className="text-emerald-500">Operational</span></div>
                <div className="flex justify-between text-[10px] font-bold text-zinc-600 uppercase tracking-widest"><span>Kernel Version</span><span>v4.8.2-pro</span></div>
             </div>
          </div>
          <p className="mt-12 text-[10px] text-zinc-700 uppercase tracking-[0.4em] font-bold">Encrypted • Private • Decentralized</p>
       </div>
    </div>
  );
};

export default App;
