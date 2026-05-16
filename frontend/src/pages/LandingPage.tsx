import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AiScanningOverlay from '../components/AiScanningOverlay';
import AlertModal from '../components/AlertModal';
import UploadArea from '../components/UploadArea'; // <-- IMPORT KOMPONEN BARU
import { validateFile } from '../utils/fileValidation';
import { Shield, UserCircle, Phone, Wand2, Contact, Lock, Sparkles } from 'lucide-react';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  
  // State
  const [alert, setAlert] = useState<{ isOpen: boolean; type: 'error' | 'warning'; title: string; message: string } | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);

  // FUNGSI INI AKAN DIKIRIM KE UPLOAD AREA
  const processUploadedFile = async (file: File) => {
    // 1. Cek Satpam
    const check = validateFile(file);
    if (!check.valid) {
      if (check.errorType === 'INVALID_TYPE') {
        setAlert({ isOpen: true, type: 'error', title: 'Upload Failed', message: 'The image could not be uploaded. Please use a PNG, JPG, or WebP file under 10MB.' });
      } else {
        setAlert({ isOpen: true, type: 'warning', title: 'File Too Large', message: 'Your image is too large to process. Please upload an image under 10MB.' });
      }
      return;
    }

    // 2. Lolos Pengecekan, Mulai Upload
    setIsScanning(true);
    setProgress(15); 

    const formData = new FormData();
    formData.append("file", file);

<<<<<<< HEAD
    try {
      const response = await fetch("http://127.0.0.1:8000/api/upload", {
        method: "POST",
        body: formData,
=======
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
>>>>>>> origin/feat/integrate-ocr
      });
      const data = await response.json();
      setProgress(100);

      setTimeout(() => {
        navigate('/app', { state: { imageUrl: data.image_url } });
      }, 500);

    } catch (error) {
      console.error("Gagal upload:", error);
      setAlert({ isOpen: true, type: 'error', title: 'Connection Error', message: 'Gagal koneksi ke server Backend! Pastikan FastAPI sudah nyala.' });
      setIsScanning(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-gray-900 font-sans flex flex-col">
      
      <nav className="flex items-center justify-between px-8 py-5 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Shield className="text-[#0D52E9] w-6 h-6" />
<<<<<<< HEAD
          <span className="font-bold text-xl tracking-tight">Blurify AI</span>
=======
          <span className="font-bold text-xl tracking-tight text-[#0D52E9]">Blurify AI</span>
>>>>>>> origin/feat/integrate-ocr
        </div>
      </nav>

      {isScanning ? (
        <div className="flex-grow flex flex-col items-center justify-center">
          <AiScanningOverlay progress={progress} />
        </div>
      ) : (
        <>
          <main className="flex-grow flex flex-col items-center">
            
            <section className="flex flex-col items-center text-center px-4 pt-16 pb-12 w-full max-w-4xl mx-auto">
              <h1 className="text-5xl font-bold tracking-tight text-gray-900 mb-6 leading-tight">
                Protect Personal Data in Your <br /> Screenshots
              </h1>
              <p className="text-lg text-gray-600 mb-10 max-w-2xl">
                AI-powered detection for profile photos, phone numbers, and names. Redact sensitive information securely before sharing or storing.
              </p>
              
              {/* === KOMPONEN UPLOAD DIPANGGIL DI SINI BOSSSSS === */}
              <UploadArea onFileSelect={processUploadedFile} />
              
            </section>

            {/* --- DEMO & FEATURES SECTION BAWAAN  --- */}
            
            <section className="w-full max-w-6xl px-4 py-8 mt-4">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Original Side */}
                  <div className="flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-sm font-semibold text-gray-600">Original</span>
                      <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-semibold">Exposed</span>
                    </div>
                    <div className="bg-[#8CB8C1] h-64 rounded-lg overflow-hidden flex items-center justify-center relative border border-gray-200">
                       <div className="w-1/2 h-full bg-white shadow-xl flex flex-col p-4 gap-3">
                          <div className="w-20 h-4 bg-gray-200 rounded"></div>
                          <div className="w-full h-12 bg-gray-100 rounded-lg"></div>
                          <div className="w-16 h-4 bg-blue-100 rounded ml-auto"></div>
                          <div className="w-full h-16 bg-gray-100 rounded-lg"></div>
                       </div>
                    </div>
                  </div>

                  {/* Protected Side */}
                  <div className="flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-sm font-semibold text-blue-600">Protected</span>
                      <span className="flex items-center gap-1 bg-[#105E3E] text-white px-3 py-1 rounded-full text-xs font-semibold">
                        <Lock className="w-3 h-3" /> Secured
                      </span>
                    </div>
                    <div className="bg-gray-800 h-64 rounded-lg overflow-hidden flex items-center justify-center relative border border-gray-700">
                        <div className="w-1/2 h-full bg-white shadow-xl flex flex-col p-4 gap-3 blur-[2px] opacity-80">
                          <div className="w-20 h-4 bg-gray-300 rounded"></div>
                          <div className="w-full h-12 bg-gray-300 rounded-lg"></div>
                          <div className="w-16 h-4 bg-blue-200 rounded ml-auto"></div>
                          <div className="w-full h-16 bg-gray-300 rounded-lg"></div>
                       </div>
                       <div className="absolute bg-white px-4 py-2 rounded-md shadow-lg flex items-center gap-2 font-semibold text-sm text-gray-800">
                          <Sparkles className="w-4 h-4 text-[#0D52E9]" />
                          AI Auto-Redacted
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="w-full max-w-6xl px-4 py-20 text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Intelligent Detection</h2>
              <p className="text-gray-600 mb-12 max-w-2xl mx-auto">
                Our models are trained specifically to identify and isolate PII (Personally Identifiable Information) in complex UI screenshots.
              </p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mb-4"><UserCircle className="w-5 h-5" /></div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Profile Photo Detection</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">Automatically locates and blurs faces and avatars across messaging apps, social feeds, and internal tools.</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 mb-4"><Phone className="w-5 h-5" /></div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Phone Number Detection</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">Identifies various international phone number formats inline within text blocks or designated fields.</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 mb-4"><Contact className="w-5 h-5" /></div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Name Detection</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">Context-aware NLP models highlight proper nouns that indicate user names or handles.</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600 mb-4"><Wand2 className="w-5 h-5" /></div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Manual Blur Control</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">Fine-tune the results with our intuitive brush tool for custom redactions or adjustments.</p>
                </div>
              </div>
            </section>
            
          </main>

          <footer className="bg-[#111827] text-gray-400 py-10 px-8">
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center">
              <div className="mb-4 md:mb-0 text-center md:text-left">
                <h4 className="text-white text-lg font-bold mb-1">Blurify AI</h4>
                <p className="text-sm">© 2026 Blurify AI. Secure by Design.</p>
              </div>
            </div>
          </footer>
        </>
      )}

<<<<<<< HEAD
      {/* --- WUJUD FISIK MODAL SATPAM --- */}
      {alert && (
        <AlertModal 
          isOpen={alert.isOpen}
          type={alert.type}
          title={alert.title}
          message={alert.message}
          onConfirm={() => setAlert(null)}
          confirmLabel={alert.type === 'error' ? "Try Again" : "Choose Another File"}
          onCancel={alert.type === 'warning' ? () => setAlert(null) : undefined}
        />
      )}
=======
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
>>>>>>> origin/feat/integrate-ocr
    </div>
  );
};

export default LandingPage;