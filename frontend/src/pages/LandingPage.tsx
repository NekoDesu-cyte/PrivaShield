import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import DownloadModal from '../components/DownloadModal';
import { 
  Shield, 
  UserCircle, 
  RotateCcw, 
  Download, 
  Brush, 
  Eraser 
} from 'lucide-react';

const AppPage: React.FC = () => {
  const location = useLocation();
  const uploadedImageUrl = location.state?.imageUrl; 

  // --- STATE & REFS UNTUK CANVAS ---
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color] = useState('#ffffff'); 
  
  // --- STATE INTERAKTIVITAS ---
  const [blurIntensity, setBlurIntensity] = useState(15); 
  const [activeTool, setActiveTool] = useState<'Blur' | 'Erase'>('Blur'); 
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  // =========================================================
  // LOGIKA CANVAS (MESIN EDIT GAMBAR)
  // =========================================================

  const loadImageToCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !uploadedImageUrl) return;

    const img = new Image();
    img.crossOrigin = "Anonymous"; 
    img.src = uploadedImageUrl;
    
    img.onload = () => {
      if (!canvas) return;
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      (imageRef as any).current = img;
    };
    
    img.onerror = () => {
      console.error("Gagal memuat gambar ke canvas. Cek koneksi backend.");
    };
  }, [uploadedImageUrl]);

  useEffect(() => {
    if (uploadedImageUrl) {
      loadImageToCanvas();
    }
  }, [uploadedImageUrl, loadImageToCanvas]);

  const getCoordinates = (event: React.MouseEvent | React.TouchEvent): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;   
    const scaleY = canvas.height / rect.height;

    if ('clientX' in event) {
      return {
        x: (event.clientX - rect.left) * scaleX,
        y: (event.clientY - rect.top) * scaleY
      };
    } else {
      return {
        x: (event.touches[0].clientX - rect.left) * scaleX,
        y: (event.touches[0].clientY - rect.top) * scaleY
      };
    }
  };

  const startDrawing = (event: React.MouseEvent | React.TouchEvent) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(event);
    setIsDrawing(true);

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (event: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    const { x, y } = getCoordinates(event);

    ctx.lineWidth = blurIntensity;
    ctx.lineCap = 'round';         
    ctx.lineJoin = 'round';

    if (activeTool === 'Blur') {
      ctx.globalCompositeOperation = 'source-over'; 
      ctx.strokeStyle = color;                      
      ctx.shadowColor = color;                      
      ctx.shadowBlur = blurIntensity * 1.5;         
    } else {
      ctx.globalCompositeOperation = 'destination-out'; 
      ctx.strokeStyle = 'rgba(0,0,0,1)';
      ctx.shadowBlur = 0; 
    }

    ctx.lineTo(x, y);
    ctx.stroke(); 
  };

  const stopDrawing = () => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.closePath();
    setIsDrawing(false);
  };

  const handleResetCanvas = () => {
    loadImageToCanvas();
  };

  // =========================================================
  // LOGIKA DOWNLOAD
  // =========================================================

  const triggerDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Ambil gambar langsung dari canvas beserta editan blurnya
    const dataUrl = canvas.toDataURL("image/png");
    
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = "BlurifyAI_Protected_Image.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadClick = () => {
    setIsDownloading(true);
    setDownloadProgress(0);

    const interval = setInterval(() => {
      setDownloadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          triggerDownload(); 
          
          setTimeout(() => {
            setIsDownloading(false); 
          }, 1500); 
          
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans flex flex-col h-screen overflow-hidden relative">
      
      {/* Top Navigation */}
      <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-6 flex-shrink-0 z-10 relative">
        <div className="flex items-center gap-2">
          <Shield className="text-[#0D52E9] w-6 h-6" />
          <span className="font-bold text-xl tracking-tight text-[#0D52E9]">Blurify AI</span>
        </div>
        <button className="text-gray-500 hover:text-gray-700">
          <UserCircle className="w-6 h-6" />
        </button>
      </header>

      {/* Main Layout Area */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Center Workspace (Meja Gambar) */}
        <main className="flex-1 flex flex-col bg-[#F3F4F6] overflow-hidden border-r border-gray-200">
          <div className="h-16 flex items-center justify-between px-6 bg-white border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-gray-800 text-sm truncate max-w-xs">
                {uploadedImageUrl ? uploadedImageUrl.split('/').pop() : 'editor.png'}
              </h3>
              <span className="bg-[#E4ECFA] text-[#0D52E9] text-[10px] font-bold px-2.5 py-1 rounded-full tracking-wide">MODE: MANUAL</span>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={handleResetCanvas}
                className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Clear All
              </button>
              <button 
                onClick={handleDownloadClick}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#0D52E9] rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Download className="w-4 h-4" /> Download Result
              </button>
            </div>
          </div>

          <div className="flex-1 relative overflow-auto flex items-center justify-center p-8 bg-slate-100/50">
            <div className="relative rounded-xl shadow-2xl border border-gray-200 overflow-hidden bg-white touch-none">
              
              <canvas 
                ref={canvasRef}
                className="max-w-full max-h-[75vh] object-contain cursor-crosshair"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />

              {!uploadedImageUrl && (
                 <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-500 text-sm font-medium">
                    Waiting for image upload...
                 </div>
              )}
            </div>
          </div>
        </main>

        {/* Right Sidebar (Tools) */}
        <aside className="w-80 bg-white flex flex-col flex-shrink-0 border-l border-gray-100 p-6 z-10 relative">
          <div className="flex-1 overflow-y-auto pr-2">
            
            <div className="mb-8">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-4 block">Manual Tools</span>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setActiveTool('Blur')}
                  className={`flex flex-col items-center py-5 rounded-xl border-2 transition-all ${activeTool === 'Blur' ? 'border-[#0D52E9] bg-blue-50/50 text-[#0D52E9]' : 'border-gray-100 text-gray-500 hover:bg-gray-50'}`}
                >
                  <Brush className="w-6 h-6 mb-2.5" />
                  <span className="text-sm font-bold">Blur Brush</span>
                </button>
                <button 
                  onClick={() => setActiveTool('Erase')}
                  className={`flex flex-col items-center py-5 rounded-xl border-2 transition-all ${activeTool === 'Erase' ? 'border-[#EF4444] bg-red-50 text-[#EF4444]' : 'border-gray-100 text-gray-500 hover:bg-gray-50'}`}
                >
                  <Eraser className="w-6 h-6 mb-2.5" />
                  <span className="text-sm font-bold">Eraser Tool</span>
                </button>
              </div>
            </div>

            <div className="mb-8">
              <div className="flex justify-between items-center mb-4 text-sm font-bold">
                <span>Brush Size</span>
                <span className="text-[#0D52E9]">{blurIntensity}px</span>
              </div>
              <input 
                type="range" min="5" max="80" value={blurIntensity}
                onChange={(e) => setBlurIntensity(Number(e.target.value))}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#0D52E9]"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-2">
                 <span>Small</span>
                 <span>Very Large</span>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-gray-600 text-xs leading-relaxed space-y-2">
                <p className="font-semibold text-gray-800">Tips:</p>
                <p>Gunakan <span className='font-mono'>Blur Brush</span> untuk menutupi informasi sensitif seperti wajah atau teks.</p>
                <p>Gunakan <span className='font-mono text-red-600'>Eraser Tool</span> jika goresan blur abang salah atau mengenai area yang salah.</p>
            </div>

          </div>

          <div className="pt-6 mt-auto bg-white border-t border-gray-100">
            <p className="text-xs text-center text-gray-400 leading-relaxed px-2">
              Blurify AI manual processing happens entirely in your browser. No image data is sent back to the server after this point.
            </p>
          </div>
        </aside>

      </div>

      <footer className="h-10 bg-[#F8F9FA] border-t border-gray-200 flex items-center justify-between px-6 text-[11px] text-gray-500 font-medium flex-shrink-0 z-10 relative">
        <span>© 2024 Blurify AI. Secure Image Processing.</span>
      </footer>

      {isDownloading && <DownloadModal progress={downloadProgress} />}
    </div>
  );
};

export default AppPage;