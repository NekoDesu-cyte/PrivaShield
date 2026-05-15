import React, { useState, useRef } from 'react';
import { CloudUpload, Image as ImageIcon } from 'lucide-react';

interface UploadAreaProps {
  onFileSelect: (file: File) => void;
}

const UploadArea: React.FC<UploadAreaProps> = ({ onFileSelect }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // JURUS RAHASIA: Menyimpan jumlah elemen yang dilewati kursor
  const dragCounter = useRef(0);

  const handleInputSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) onFileSelect(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1; // Tambah hitungan saat masuk
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1; // Kurangi hitungan saat keluar
    
    // Matikan efek HANYA jika kursor benar-benar keluar dari seluruh kotak (hitungan = 0)
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0; // Reset hitungan saat file dilepas
    
    const file = e.dataTransfer.files?.[0];
    if (file) onFileSelect(file);
  };

  return (
    <div 
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative w-full max-w-lg min-h-[280px] bg-white border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center shadow-sm mt-2 transition-all duration-200 overflow-hidden ${
        isDragging ? 'border-[#0D52E9] scale-[1.02]' : 'border-[#B4C4E4]'
      }`}
    >
      
      {/* --- LAPISAN ATAS: TAMPILAN DRAGGING MELAYANG --- */}
      <div className={`absolute inset-0 bg-blue-50/95 backdrop-blur-sm flex flex-col items-center justify-center z-10 transition-opacity duration-200 pointer-events-none ${
        isDragging ? 'opacity-100' : 'opacity-0'
      }`}>
        <div className="bg-[#0D52E9] p-5 rounded-full mb-4 animate-bounce shadow-lg shadow-blue-200">
          <CloudUpload className="w-10 h-10 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-[#0D52E9]">Drop image here!</h3>
        <p className="text-sm text-blue-600 mt-2 font-medium">Release your mouse to upload</p>
      </div>

      {/* --- LAPISAN BAWAH: TAMPILAN NORMAL --- */}
      <div className={`flex flex-col items-center justify-center gap-3 w-full transition-opacity duration-200 ${
        isDragging ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}>
        <div className="bg-[#EBF1FF] p-4 rounded-full mb-2 transition-colors">
          <CloudUpload className="w-8 h-8 text-[#0D52E9]" />
        </div>
        <h3 className="text-xl font-bold text-gray-900">Drag & drop your image here</h3>
        <p className="text-sm text-gray-500 mb-4">Supports JPG, PNG, WEBP (Max 10MB)</p>
        
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*"
          onChange={handleInputSelect} 
        />
        
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center justify-center gap-2 bg-[#0D52E9] hover:bg-blue-700 text-white px-6 py-2.5 rounded-md text-sm font-semibold transition-colors shadow-sm"
        >
          <ImageIcon className="w-4 h-4" />
          Select Image
        </button>
      </div>

    </div>
  );
};

export default UploadArea;