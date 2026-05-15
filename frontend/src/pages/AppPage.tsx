import React, { useState } from 'react';
import DownloadModal from '../components/DownloadModal';
import { 
  Shield, 
  RotateCcw, 
  Download, 
  Brush, 
  Square,
  Undo
} from 'lucide-react';

const AppPage: React.FC = () => {
  
  // State untuk interaktivitas dasar
  const [blurIntensity, setBlurIntensity] = useState(24);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [highPrecision, setHighPrecision] = useState(false);
  const [activeTool, setActiveTool] = useState<'Brush' | 'Rect'>('Brush');
  
  // State untuk Modal Download
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  // Fungsi simulasi loading download
  const triggerDownload = () => {
    // Simulasi membuat link download
    const link = document.createElement("a");
    link.href = "https://via.placeholder.com/1080.png"; // Ganti dengan URL image hasil proses nanti
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
          
          // LOGIKA SAT-SET:
          triggerDownload(); // 1. Langsung download filenya
          
          setTimeout(() => {
            setIsDownloading(false); // 2. Tutup popup otomatis setelah selesai
          }, 1000); // Beri jeda 1 detik agar user sempat lihat progress 100%
          
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans flex flex-col h-screen overflow-hidden relative">
      
      {/* Top Navigation */}
      <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-6 flex-shrink-0 z-10">
        <div className="flex items-center gap-2">
          <Shield className="text-[#0D52E9] w-6 h-6" />
          <span className="font-bold text-xl tracking-tight text-[#0D52E9]">Blurify AI</span>
        </div>
      </header>

      {/* Main Layout Area */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Center Workspace (Canvas) */}
        <main className="flex-1 flex flex-col bg-white overflow-hidden border-r border-gray-200">
          {/* Editor Header */}
          <div className="h-16 flex items-center justify-between px-6 bg-white border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-gray-800">image_processing_v2.png</h3>
              <span className="bg-[#E4ECFA] text-[#0D52E9] text-[10px] font-bold px-2.5 py-1 rounded-full tracking-wide">
                AI ANALYZED
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <RotateCcw className="w-4 h-4" /> Reset
              </button>
              <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Undo className="w-4 h-4" /> Undo
              </button>
              <button 
                onClick={handleDownloadClick}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#0D52E9] rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4" /> Download Image
              </button>
            </div>
          </div>

          {/* Canvas Area with Checkered Background */}
          <div 
            className="flex-1 relative overflow-auto flex items-center justify-center p-8"
            style={{
              backgroundImage: `
                repeating-linear-gradient(45deg, #f0f0f0 25%, transparent 25%, transparent 75%, #f0f0f0 75%, #f0f0f0),
                repeating-linear-gradient(45deg, #f0f0f0 25%, #ffffff 25%, #ffffff 75%, #f0f0f0 75%, #f0f0f0)
              `,
              backgroundPosition: `0 0, 10px 10px`,
              backgroundSize: `20px 20px`
            }}
          >
            {/* Mockup Document Container */}
            <div className="relative w-[500px] h-[500px] bg-[#E8EAEB] rounded-xl shadow-lg overflow-hidden border border-gray-200 shadow-gray-400/20">
              {/* Abstract Representation of the Document inside */}
              <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 p-8 flex flex-col justify-end transform perspective-[1000px] rotate-x-[15deg] scale-105 origin-bottom">
                 <div className="bg-white w-full h-[80%] rounded shadow-sm p-6 flex flex-col gap-3 opacity-90">
                    <div className="w-1/2 h-4 bg-gray-200"></div>
                    <div className="w-3/4 h-3 bg-gray-200"></div>
                    <div className="w-full h-3 bg-gray-200"></div>
                    <div className="w-5/6 h-3 bg-gray-200"></div>
                    <div className="mt-8 w-1/3 h-4 bg-gray-200"></div>
                    <div className="w-full h-12 bg-gray-200 mt-2"></div>
                 </div>
              </div>

              {/* Bounding Boxes (Annotations) */}
              {showAnnotations && (
                <>
                  <div className="absolute top-[20%] left-[15%] border-2 border-[#0D52E9] bg-[#0D52E9]/10 w-36 h-8 rounded-sm">
                    <span className="absolute -top-5 left-0 text-[9px] font-bold text-[#0D52E9] uppercase tracking-wider">
                      Name_Detected
                    </span>
                  </div>
                  <div className="absolute top-[32%] left-[15%] border-2 border-[#0D52E9] bg-[#0D52E9]/10 w-44 h-8 rounded-sm">
                    <span className="absolute -top-5 left-0 text-[9px] font-bold text-[#0D52E9] uppercase tracking-wider">
                      Phone_Detected
                    </span>
                  </div>
                  <div className="absolute bottom-[25%] right-[15%] border-2 border-[#0D52E9] bg-[#0D52E9]/10 w-52 h-10 rounded-sm">
                    <span className="absolute -top-5 left-0 text-[9px] font-bold text-[#0D52E9] uppercase tracking-wider">
                      Signature_Detected
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </main>

        {/* Right Sidebar (Tools) */}
        <aside className="w-80 bg-white flex flex-col flex-shrink-0 border-l border-gray-100">
          <div className="p-6 flex-1 overflow-y-auto">
            
            {/* Manual Tools */}
            <div className="mb-8">
              <span className="text-[14px] font-bold text-gray-900 mb-4 block">
                Manual Tools
              </span>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setActiveTool('Brush')}
                  className={`flex flex-col items-center justify-center py-5 rounded-xl border-2 transition-colors ${activeTool === 'Brush' ? 'border-[#0D52E9] bg-[#F8FAFF] text-[#0D52E9]' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                >
                  <Brush className="w-6 h-6 mb-2" />
                  <span className="text-sm font-bold">Brush Tool</span>
                </button>
                <button 
                  onClick={() => setActiveTool('Rect')}
                  className={`flex flex-col items-center justify-center py-5 rounded-xl border-2 transition-colors ${activeTool === 'Rect' ? 'border-[#0D52E9] bg-[#F8FAFF] text-[#0D52E9]' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                >
                  <Square className="w-6 h-6 mb-2" />
                  <span className="text-sm font-bold">Rect Area</span>
                </button>
              </div>
            </div>

            {/* Blur Intensity */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-bold text-gray-900">Blur Intensity</span>
                <span className="text-sm font-bold text-[#0D52E9]">{blurIntensity}px</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="50" 
                value={blurIntensity}
                onChange={(e) => setBlurIntensity(Number(e.target.value))}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#0D52E9]"
              />
            </div>

            {/* Toggles */}
            <div className="space-y-6 mb-8">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Show Annotations</span>
                <button 
                  onClick={() => setShowAnnotations(!showAnnotations)}
                  className={`w-11 h-6 rounded-full flex items-center px-1 transition-colors ${showAnnotations ? 'bg-[#0D52E9]' : 'bg-gray-300'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform ${showAnnotations ? 'translate-x-5' : 'translate-x-0'}`}></div>
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">High-Precision Mode</span>
                <button 
                  onClick={() => setHighPrecision(!highPrecision)}
                  className={`w-11 h-6 rounded-full flex items-center px-1 transition-colors ${highPrecision ? 'bg-[#0D52E9]' : 'bg-gray-300'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform ${highPrecision ? 'translate-x-5' : 'translate-x-0'}`}></div>
                </button>
              </div>
            </div>

          </div>
        </aside>

      </div>

      {/* Footer */}
      <footer className="h-12 bg-[#F8F9FA] border-t border-gray-200 flex items-center justify-between px-6 flex-shrink-0 text-[13px] text-gray-600 font-medium">
        <span>© 2026 Blurify AI. Secure Image Processing.</span>
      </footer>

      {/* Modal Download dipanggil di sini */}
      {isDownloading && <DownloadModal progress={downloadProgress} />}
    </div>
  );
};

export default AppPage;