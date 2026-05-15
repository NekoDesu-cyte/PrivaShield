import { useNavigate } from 'react-router-dom'; // Tambahkan ini untuk pindah halaman
import AiScanningOverlay from '../components/AiScanningOverlay'; // Sesuaikan path-nya
import React, { useState, useRef } from 'react';

import { 
  Shield, 
  UserCircle, 
  Image as ImageIcon, 
  Phone, 
  Wand2, 
  Contact,
  Lock,
  Sparkles,
  CloudUpload
} from 'lucide-react';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null); // Referensi untuk input file tersembunyi

  // State untuk mengontrol apakah overlay loading muncul
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);

  // Fungsi saat user milih gambar dari komputernya
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setProgress(15); // Mulai loading

    // 1. Siapkan data file untuk dikirim
    const formData = new FormData();
    formData.append("file", file);

    try {
      // 2. Kirim ke FastAPI
      const response = await fetch("http://127.0.0.1:8000/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      setProgress(100);

      // 3. Pindah ke AppPage sambil membawa URL gambar dari backend!
      setTimeout(() => {
        navigate('/app', { state: { imageUrl: data.image_url } });
      }, 500);

    } catch (error) {
      console.error("Gagal upload:", error);
      alert("Gagal koneksi ke server Backend!");
      setIsScanning(false);
    }
  };
  
 return (
    <div className="min-h-screen bg-[#F8F9FA] text-gray-900 font-sans flex flex-col">
      
      {/* Navigation (Tetap Tampil) */}
      <nav className="flex items-center justify-between px-8 py-5 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Shield className="text-[#0D52E9] w-6 h-6" />
          <span className="font-bold text-xl tracking-tight">PrivaShield</span>
        </div>

        <div className="flex items-center gap-4">
        </div>
      </nav>

      {/* KONDISIONAL RENDER: Jika isScanning TRUE, tampilkan Overlay. Jika FALSE, tampilkan konten utama */}
      {isScanning ? (
        <div className="flex-grow flex flex-col items-center justify-center">
          <AiScanningOverlay progress={progress} />
        </div>
      ) : (
        <>
          <main className="flex-grow flex flex-col items-center">
        
        {/* Hero Section */}
        <section className="flex flex-col items-center text-center px-4 pt-16 pb-12 w-full max-w-4xl mx-auto">
              
              <h1 className="text-5xl font-bold tracking-tight text-gray-900 mb-6 leading-tight">
                Protect Personal Data in Your <br /> Screenshots
              </h1>
              
              <p className="text-lg text-gray-600 mb-10 max-w-2xl">
                AI-powered detection for profile photos, phone numbers, and names. Redact sensitive information securely before sharing or storing.
              </p>
              
              {/* Drag & Drop Upload Area */}
              <div className="w-full max-w-lg bg-white border-2 border-dashed border-[#B4C4E4] rounded-2xl p-10 flex flex-col items-center justify-center gap-3 shadow-sm mt-2">
                <div className="bg-[#EBF1FF] p-4 rounded-full mb-2">
                  <CloudUpload className="w-8 h-8 text-[#0D52E9]" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Drag & drop your image here</h3>
                <p className="text-sm text-gray-500 mb-4">Supports JPG, PNG, WEBP (Max 10MB)</p>
                
                {/* 1. INPUT FILE TERSEMBUNYI (WAJIB ADA) */}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleFileSelect} 
                />
                
                {/* 2. TOMBOL BIRU YANG MENG-KLIK INPUT FILE */}
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center gap-2 bg-[#0D52E9] hover:bg-blue-700 text-white px-6 py-2.5 rounded-md text-sm font-semibold transition-colors"
                >
                  <ImageIcon className="w-4 h-4" />
                  Select Image
                </button>
              </div>
            </section>

        {/* Demo Showcase Area */}
        <section className="w-full max-w-6xl px-4 py-8 mt-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
            <div className="grid md:grid-cols-2 gap-8">
              
              {/* Original Side */}
              <div className="flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-semibold text-gray-600">Original</span>
                  <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-semibold">Exposed</span>
                </div>
                {/* Mockup Container */}
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
                {/* Mockup Container */}
                <div className="bg-gray-800 h-64 rounded-lg overflow-hidden flex items-center justify-center relative border border-gray-700">
                    <div className="w-1/2 h-full bg-white shadow-xl flex flex-col p-4 gap-3 blur-[2px] opacity-80">
                      <div className="w-20 h-4 bg-gray-300 rounded"></div>
                      <div className="w-full h-12 bg-gray-300 rounded-lg"></div>
                      <div className="w-16 h-4 bg-blue-200 rounded ml-auto"></div>
                      <div className="w-full h-16 bg-gray-300 rounded-lg"></div>
                   </div>
                   {/* Floating Label */}
                   <div className="absolute bg-white px-4 py-2 rounded-md shadow-lg flex items-center gap-2 font-semibold text-sm text-gray-800">
                      <Sparkles className="w-4 h-4 text-[#0D52E9]" />
                      AI Auto-Redacted
                   </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="w-full max-w-6xl px-4 py-20 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Intelligent Detection</h2>
          <p className="text-gray-600 mb-12 max-w-2xl mx-auto">
            Our models are trained specifically to identify and isolate PII (Personally Identifiable Information) in complex UI screenshots.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            
            {/* Feature 1 */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mb-4">
                <UserCircle className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Profile Photo Detection</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Automatically locates and blurs faces and avatars across messaging apps, social feeds, and internal tools.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 mb-4">
                <Phone className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Phone Number Detection</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Identifies various international phone number formats inline within text blocks or designated fields.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 mb-4">
                <Contact className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Name Detection</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Context-aware NLP models highlight proper nouns that indicate user names or handles.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600 mb-4">
                <Wand2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Manual Blur Control</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Fine-tune the results with our intuitive brush tool for custom redactions or adjustments.
              </p>
            </div>

          </div>
        </section>
        </main>

          {/* Footer (Hanya tampil jika tidak sedang loading) */}
          <footer className="bg-[#111827] text-gray-400 py-10 px-8">
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center">
              <div className="mb-4 md:mb-0 text-center md:text-left">
                <h4 className="text-white text-lg font-bold mb-1">PrivaShield</h4>
                <p className="text-sm">© 2024 PrivaShield AI. Secure by Design.</p>
              </div>
            </div>
          </footer>
        </>
      )}
    </div>
  );
};

export default LandingPage;