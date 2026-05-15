import React, { useState, useRef } from 'react';
import { CloudUpload, Image as ImageIcon } from 'lucide-react';

// Ini ibarat "kabel" untuk mengirim file yang dipilih kembali ke LandingPage
interface UploadAreaProps {
  onFileSelect: (file: File) => void;
}

const UploadArea: React.FC<UploadAreaProps> = ({ onFileSelect }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // --- PEMICU 1: DARI TOMBOL PILIH GAMBAR ---
  const handleInputSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) onFileSelect(file);
    // Reset nilai input agar user bisa memilih file yang sama lagi jika terjadi error
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // --- PEMICU 2: DARI DRAG & DROP ---
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onFileSelect(file);
  };

  return (
    <div 
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`w-full max-w-lg bg-white border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center gap-3 shadow-sm mt-2 transition-colors duration-200 ${
        isDragging ? 'border-[#0D52E9] bg-blue-50/50' : 'border-[#B4C4E4]'
      }`}
    >
      <div className="bg-[#EBF1FF] p-4 rounded-full mb-2">
        <CloudUpload className="w-8 h-8 text-[#0D52E9]" />
      </div>
      <h3 className="text-xl font-bold text-gray-900">Drag & drop your image here</h3>
      <p className="text-sm text-gray-500 mb-4">Supports JPG, PNG, WEBP (Max 10MB)</p>
      
      {/* 1. INPUT FILE TERSEMBUNYI */}
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*"
        onChange={handleInputSelect} 
      />
      
      {/* 2. TOMBOL BIRU */}
      <button 
        onClick={() => fileInputRef.current?.click()}
        className="flex items-center justify-center gap-2 bg-[#0D52E9] hover:bg-blue-700 text-white px-6 py-2.5 rounded-md text-sm font-semibold transition-colors"
      >
        <ImageIcon className="w-4 h-4" />
        Select Image
      </button>
    </div>
  );
};

export default UploadArea;