import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import DownloadModal from '../components/DownloadModal';
import { 
  Shield, 
  RotateCcw, 
  Download, 
  Brush, 
  Eraser, 
  Undo,
  ZoomIn,
  ZoomOut,
  Maximize,
  Square
} from 'lucide-react';

const AppPage: React.FC = () => {
  const location = useLocation();
  const uploadedImageUrl = location.state?.imageUrl; 

  // --- STATE & REFS UNTUK CANVAS ---
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const blurredCanvasRef = useRef<HTMLCanvasElement | null>(null); 
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPos, setLastPos] = useState<{x: number, y: number} | null>(null); 
  
  // Ref khusus untuk mode Rectangle (Box Area)
  const startPosRef = useRef<{x: number, y: number} | null>(null);
  const currentPosRef = useRef<{x: number, y: number} | null>(null);
  const savedImageDataRef = useRef<ImageData | null>(null); 

  // --- STATE INTERAKTIVITAS & HISTORY ---
  const [history, setHistory] = useState<string[]>([]);
  const [blurIntensity, setBlurIntensity] = useState(24); 
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [highPrecision, setHighPrecision] = useState(false);
  const [activeTool, setActiveTool] = useState<'Blur' | 'Erase' | 'Rect'>('Blur'); 
  const [zoomScale, setZoomScale] = useState(1); 
  
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  // ==========================================
  // LOGIKA CANVAS (MESIN BLUR & DRAWING)
  // ==========================================

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
      
      // Simpan riwayat pertama (gambar original)
      setHistory([canvas.toDataURL()]);

      // Buat versi blur kamera secara rahasia
      const offscreenCanvas = document.createElement('canvas');
      offscreenCanvas.width = img.width;
      offscreenCanvas.height = img.height;
      const offCtx = offscreenCanvas.getContext('2d');
      if (offCtx) {
        offCtx.filter = 'blur(20px)'; 
        offCtx.drawImage(img, 0, 0);
        blurredCanvasRef.current = offscreenCanvas;
      }
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
    const coords = getCoordinates(event);
    setIsDrawing(true);
    setLastPos(coords);

    // Persiapan memori untuk Rectangle
    startPosRef.current = coords;
    currentPosRef.current = coords;
    if (canvasRef.current) {
      savedImageDataRef.current = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  const draw = (event: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !lastPos) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    const { x, y } = getCoordinates(event);
    currentPosRef.current = { x, y };

    if (activeTool === 'Rect') {
      // Preview Garis Putus-putus untuk Box Area
      if (savedImageDataRef.current && startPosRef.current) {
        ctx.putImageData(savedImageDataRef.current, 0, 0); 
        ctx.beginPath();
        ctx.strokeStyle = '#0D52E9';
        ctx.setLineDash([8, 8]); 
        ctx.lineWidth = 3;
        ctx.rect(
          startPosRef.current.x, 
          startPosRef.current.y, 
          x - startPosRef.current.x, 
          y - startPosRef.current.y
        );
        ctx.stroke();
        ctx.setLineDash([]); 
      }
    } else {
      // Mode Kuas (Brush/Eraser)
      const radius = blurIntensity;
      const dist = Math.hypot(x - lastPos.x, y - lastPos.y);
      const steps = Math.max(1, Math.ceil(dist / (radius / 2)));

      ctx.save();
      ctx.beginPath();
      for (let i = 0; i <= steps; i++) {
        const cx = lastPos.x + (x - lastPos.x) * (i / steps);
        const cy = lastPos.y + (y - lastPos.y) * (i / steps);
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      }
      ctx.clip(); 

      const source = activeTool === 'Blur' ? blurredCanvasRef.current : imageRef.current;
      if (source) {
        ctx.drawImage(source, 0, 0);
      }
      ctx.restore();

      setLastPos({ x, y }); 
    }
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    
    // Terapkan efek saat kotak dilepas
    if (activeTool === 'Rect' && canvas && ctx && savedImageDataRef.current && startPosRef.current && currentPosRef.current) {
      ctx.putImageData(savedImageDataRef.current, 0, 0); 
      
      ctx.save();
      ctx.beginPath();
      ctx.rect(
        startPosRef.current.x, 
        startPosRef.current.y, 
        currentPosRef.current.x - startPosRef.current.x, 
        currentPosRef.current.y - startPosRef.current.y
      );
      ctx.clip(); 
      
      if (blurredCanvasRef.current) {
        ctx.drawImage(blurredCanvasRef.current, 0, 0);
      }
      ctx.restore();
    }

    // Simpan ke history untuk Undo
    if (canvas) {
      const snapshot = canvas.toDataURL();
      setHistory(prev => [...prev, snapshot]);
    }

    setIsDrawing(false);
    setLastPos(null);
    startPosRef.current = null;
  };

  const handleUndo = () => {
    if (history.length <= 1) return; 

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    const newHistory = [...history];
    newHistory.pop(); 
    const lastState = newHistory[newHistory.length - 1];

    const img = new Image();
    img.src = lastState;
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height); 
      ctx.drawImage(img, 0, 0); 
      setHistory(newHistory); 
    };
  };

  // ==========================================
  // LOGIKA DOWNLOAD
  // ==========================================

  const triggerDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = "Blurify_Protected_Image.png";
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
          setTimeout(() => { setIsDownloading(false); }, 1000); 
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans flex flex-col h-screen overflow-hidden relative">
      
      <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-6 flex-shrink-0 z-10">
        <div className="flex items-center gap-2">
          <Shield className="text-[#0D52E9] w-6 h-6" />
          <span className="font-bold text-xl tracking-tight text-[#0D52E9]">Blurify AI</span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        
        <main className="flex-1 flex flex-col bg-white overflow-hidden border-r border-gray-200">
          <div className="h-16 flex items-center justify-between px-6 bg-white border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-gray-800 max-w-xs truncate">
                {uploadedImageUrl ? uploadedImageUrl.split('/').pop() : 'image_processing.png'}
              </h3>
              <span className="bg-[#E4ECFA] text-[#0D52E9] text-[10px] font-bold px-2.5 py-1 rounded-full tracking-wide">
                MANUAL MODE
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => {
                  loadImageToCanvas();
                }}
                className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Clear All
              </button>

              <button 
                onClick={handleUndo}
                disabled={history.length <= 1}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                  history.length <= 1 
                  ? 'text-gray-300 border-gray-200 cursor-not-allowed' 
                  : 'text-gray-600 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Undo className="w-3.5 h-3.5" /> Undo
              </button>

              <button 
                onClick={handleDownloadClick}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#0D52E9] rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Download className="w-4 h-4" /> Download Image
              </button>
            </div>
          </div>

          <div 
            className="flex-1 relative overflow-hidden flex items-center justify-center p-4 sm:p-8"
            style={{
              backgroundImage: `repeating-linear-gradient(45deg, #f0f0f0 25%, transparent 25%, transparent 75%, #f0f0f0 75%, #f0f0f0), repeating-linear-gradient(45deg, #f0f0f0 25%, #ffffff 25%, #ffffff 75%, #f0f0f0 75%, #f0f0f0)`,
              backgroundPosition: `0 0, 10px 10px`,
              backgroundSize: `20px 20px`
            }}
          >
            <div className="relative w-full h-full flex items-center justify-center overflow-auto touch-none">
              <div 
                className="relative flex items-center justify-center transition-transform duration-200 ease-out"
                style={{ transform: `scale(${zoomScale})`, transformOrigin: 'center' }}
              >
                <canvas 
                  ref={canvasRef}
                  className="max-w-full max-h-[80vh] object-contain shadow-2xl border border-gray-200 bg-white cursor-crosshair rounded-xl block"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />

                {!uploadedImageUrl && (
                   <div className="absolute inset-0 flex items-center justify-center bg-gray-100/80 backdrop-blur-sm text-gray-500 text-sm font-medium z-10 rounded-xl">
                      No image uploaded. Please go back and upload an image.
                   </div>
                )}
              </div>
            </div>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-gray-900/90 backdrop-blur text-white px-3 py-1.5 rounded-full shadow-2xl z-20">
              <button onClick={() => setZoomScale(prev => Math.max(0.5, prev - 0.2))} className="p-1 hover:bg-gray-700 rounded-full transition-colors">
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold px-2 min-w-[3rem] text-center">{Math.round(zoomScale * 100)}%</span>
              <button onClick={() => setZoomScale(prev => Math.min(3, prev + 0.2))} className="p-1 hover:bg-gray-700 rounded-full transition-colors">
                <ZoomIn className="w-4 h-4" />
              </button>
              <div className="w-px h-4 bg-gray-600 mx-1"></div>
              <button onClick={() => setZoomScale(1)} className="p-1 hover:bg-gray-700 rounded-full transition-colors" title="Reset Zoom">
                <Maximize className="w-4 h-4" />
              </button>
            </div>
          </div>
        </main>

        <aside className="w-80 bg-white flex flex-col flex-shrink-0 border-l border-gray-100">
          <div className="p-6 flex-1 overflow-y-auto">
            
            <div className="mb-8">
              <span className="text-[14px] font-bold text-gray-900 mb-4 block">
                Manual Tools
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button 
                  onClick={() => setActiveTool('Blur')}
                  className={`flex flex-col items-center justify-center py-4 rounded-xl border-2 transition-colors ${activeTool === 'Blur' ? 'border-[#0D52E9] bg-[#F8FAFF] text-[#0D52E9]' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                >
                  <Brush className="w-5 h-5 mb-1.5" />
                  <span className="text-[11px] font-bold">Brush</span>
                </button>
                <button 
                  onClick={() => setActiveTool('Rect')}
                  className={`flex flex-col items-center justify-center py-4 rounded-xl border-2 transition-colors ${activeTool === 'Rect' ? 'border-[#0D52E9] bg-[#F8FAFF] text-[#0D52E9]' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                >
                  <Square className="w-5 h-5 mb-1.5" />
                  <span className="text-[11px] font-bold">Box Area</span>
                </button>
                <button 
                  onClick={() => setActiveTool('Erase')}
                  className={`flex flex-col items-center justify-center py-4 rounded-xl border-2 transition-colors ${activeTool === 'Erase' ? 'border-red-500 bg-red-50 text-red-500' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                >
                  <Eraser className="w-5 h-5 mb-1.5" />
                  <span className="text-[11px] font-bold">Eraser</span>
                </button>
              </div>
            </div>

            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-bold text-gray-900">Brush Size</span>
                <span className="text-sm font-bold text-[#0D52E9]">{blurIntensity}px</span>
              </div>
              <input 
                type="range" 
                min="5" 
                max="80" 
                value={blurIntensity}
                onChange={(e) => setBlurIntensity(Number(e.target.value))}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#0D52E9]"
              />
            </div>

            <div className="space-y-6 mb-8">
              <div className="flex items-center justify-between opacity-50 cursor-not-allowed">
                <span className="text-sm font-medium text-gray-700">Show Annotations</span>
                <button disabled className="w-11 h-6 rounded-full flex items-center px-1 bg-gray-300">
                  <div className="w-4 h-4 bg-white rounded-full"></div>
                </button>
              </div>
              
              <div className="flex items-center justify-between opacity-50 cursor-not-allowed">
                <span className="text-sm font-medium text-gray-700">High-Precision Mode</span>
                <button disabled className="w-11 h-6 rounded-full flex items-center px-1 bg-gray-300">
                  <div className="w-4 h-4 bg-white rounded-full"></div>
                </button>
              </div>
              <p className="text-[10px] text-gray-400 mt-2">AI features are disabled in Manual Mode.</p>
            </div>

          </div>

          <div className="p-6 pt-0 mt-auto bg-white">
            <p className="text-xs text-center text-gray-500 leading-relaxed px-2">
              All processing happens locally on your device for maximum privacy.
            </p>
          </div>
        </aside>

      </div>

      <footer className="h-12 bg-[#F8F9FA] border-t border-gray-200 flex items-center justify-between px-6 flex-shrink-0 text-[13px] text-gray-600 font-medium">
        <span>© 2026 Blurify AI. Secure Image Processing.</span>
      </footer>

      {isDownloading && <DownloadModal progress={downloadProgress} />}
    </div>
  );
};

export default AppPage;