import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Shield } from 'lucide-react';
import DownloadModal from '../components/DownloadModal';
import EditorSidebar from '../components/EditorSidebar';
import EditorTopbar from '../components/EditorTopbar';
import ZoomControls from '../components/EditorZoomControls';

const AppPage: React.FC = () => {
  const location = useLocation();
  const uploadedImageUrl = location.state?.imageUrl; 
  const aiData = location.state?.aiData;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const blurredCanvasRef = useRef<HTMLCanvasElement | null>(null); 
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPos, setLastPos] = useState<{x: number, y: number} | null>(null); 
  const startPosRef = useRef<{x: number, y: number} | null>(null);
  const currentPosRef = useRef<{x: number, y: number} | null>(null);
  const savedImageDataRef = useRef<ImageData | null>(null); 

  const [history, setHistory] = useState<string[]>([]);
  const [blurIntensity, setBlurIntensity] = useState(24); 
  const [activeTool, setActiveTool] = useState<'Blur' | 'Erase' | 'Rect'>('Blur'); 
  const [zoomScale, setZoomScale] = useState(1); 
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [canvasLayout, setCanvasLayout] = useState({ width: 0, height: 0 });
  
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

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

      //  Buat versi blur kamera secara rahasia
      const offscreenCanvas = document.createElement('canvas');
      offscreenCanvas.width = img.width;
      offscreenCanvas.height = img.height;
      const offCtx = offscreenCanvas.getContext('2d');
      
      if (offCtx) {
        offCtx.filter = 'blur(20px)'; // Ketebalan blur
        offCtx.drawImage(img, 0, 0);
        blurredCanvasRef.current = offscreenCanvas;

        if (aiData && aiData.detected_entities && aiData.detected_entities.length > 0) {
          ctx.save();
          ctx.beginPath();
          
          // Looping semua kotak merah hasil deteksi AI
          aiData.detected_entities.forEach((entity: any) => {
            const [x, y, w, h] = entity.bbox;
            // Gambar kotak virtual di koordinat PII (Nama/No HP)
            ctx.rect(x, y, w, h);
          });
          
          ctx.clip(); // Potong kanvas di area kotak-kotak AI
          ctx.drawImage(offscreenCanvas, 0, 0); //  efek blur ke area potongan!
          ctx.restore();
          
          console.log(`Berhasil nge-blur otomatis ${aiData.detected_entities.length} data sensitif! 🛡️`);
        }
      }
      
      // Simpan riwayat pertama setelah blur otomatis
      setHistory([canvas.toDataURL()]);
      setTimeout(() => {
        if (canvasRef.current) {
          setCanvasLayout({
            width: canvasRef.current.clientWidth,
            height: canvasRef.current.clientHeight
          });
        }
      }, 100);
    };
  }, [uploadedImageUrl]);

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        setCanvasLayout({ width: canvasRef.current.clientWidth, height: canvasRef.current.clientHeight });
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getCoordinates = (event: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;   
    const scaleY = canvas.height / rect.height;
    if ('clientX' in event) {
      return { x: (event.clientX - rect.left) * scaleX, y: (event.clientY - rect.top) * scaleY };
    } else {
      return { x: (event.touches[0].clientX - rect.left) * scaleX, y: (event.touches[0].clientY - rect.top) * scaleY };
    }
  };

  const startDrawing = (event: React.MouseEvent | React.TouchEvent) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const coords = getCoordinates(event);
    setIsDrawing(true);
    setLastPos(coords);

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
      if (savedImageDataRef.current && startPosRef.current) {
        ctx.putImageData(savedImageDataRef.current, 0, 0); 
        ctx.beginPath();
        ctx.strokeStyle = '#0D52E9';
        ctx.setLineDash([8, 8]); 
        ctx.lineWidth = 3;
        ctx.rect(startPosRef.current.x, startPosRef.current.y, x - startPosRef.current.x, y - startPosRef.current.y);
        ctx.stroke();
        ctx.setLineDash([]); 
      }
    } else {
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
      if (source) ctx.drawImage(source, 0, 0);
      ctx.restore();

      setLastPos({ x, y }); 
    }
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    
    if (activeTool === 'Rect' && canvas && ctx && savedImageDataRef.current && startPosRef.current && currentPosRef.current) {
      ctx.putImageData(savedImageDataRef.current, 0, 0); 
      ctx.save();
      ctx.beginPath();
      ctx.rect(startPosRef.current.x, startPosRef.current.y, currentPosRef.current.x - startPosRef.current.x, currentPosRef.current.y - startPosRef.current.y);
      ctx.clip(); 
      if (blurredCanvasRef.current) ctx.drawImage(blurredCanvasRef.current, 0, 0);
      ctx.restore();
    }

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

  const filenameDisplay = uploadedImageUrl ? uploadedImageUrl.split('/').pop() : 'image_processing.png';

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
          
          {/* KOMPONEN TOPBAR DIPANGGIL DI SINI */}
          <EditorTopbar 
            filename={filenameDisplay || 'image'}
            onClearAll={loadImageToCanvas}
            onUndo={handleUndo}
            canUndo={history.length > 1}
            onDownload={handleDownloadClick}
          />

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
                {/* === LAYERS KOTAK ANOTASI DIGITAL === */}
                {showAnnotations && canvasLayout.width > 0 && canvasRef.current && aiData?.detected_entities?.map((entity: any, index: number) => {
                  const origWidth = canvasRef.current?.width || 1;
                  const origHeight = canvasRef.current?.height || 1;
                  
                  // Menghitung rasio skala dimensi layout vs resolusi piksel asli
                  const scaleX = canvasLayout.width / origWidth;
                  const scaleY = canvasLayout.height / origHeight;
                  const [x, y, w, h] = entity.bbox;
                  
                  return (
                    <div
                      key={index}
                      className="absolute border-2 border-dashed border-[#0D52E9] bg-[#0D52E9]/5 pointer-events-none z-20 rounded-sm transition-all"
                      style={{
                        left: `${x * scaleX}px`, top: `${y * scaleY}px`,
                        width: `${w * scaleX}px`, height: `${h * scaleY}px`,
                      }}
                    >
                      <span className="absolute -top-5 left-0 bg-[#0D52E9] text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow-md whitespace-nowrap tracking-wide uppercase">
                        {entity.label}
                      </span>
                    </div>
                  );
                })}
                {!uploadedImageUrl && (
                   <div className="absolute inset-0 flex items-center justify-center bg-gray-100/80 backdrop-blur-sm text-gray-500 text-sm font-medium z-10 rounded-xl">
                      No image uploaded. Please go back and upload an image.
                   </div>
                )}
              </div>
            </div>

            {/* KOMPONEN ZOOM DIPANGGIL DI SINI */}
            <ZoomControls zoomScale={zoomScale} setZoomScale={setZoomScale} />
          </div>
        </main>

        {/* KOMPONEN SIDEBAR DIPANGGIL DI SINI */}
        <EditorSidebar 
          activeTool={activeTool} 
          setActiveTool={setActiveTool} 
          blurIntensity={blurIntensity} 
          setBlurIntensity={setBlurIntensity}
          showAnnotations={showAnnotations}      
          setShowAnnotations={setShowAnnotations} 
        />
      </div>

      <footer className="h-12 bg-[#F8F9FA] border-t border-gray-200 flex items-center justify-between px-6 flex-shrink-0 text-[13px] text-gray-600 font-medium">
        <span>© 2026 Blurify AI. Secure Image Processing.</span>
      </footer>

      {isDownloading && <DownloadModal progress={downloadProgress} />}
    </div>
  );
};

export default AppPage;