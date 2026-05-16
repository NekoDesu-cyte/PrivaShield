import React from 'react';
import { Brush, Square, Eraser } from 'lucide-react';

interface EditorSidebarProps {
  activeTool: 'Blur' | 'Erase' | 'Rect';
  setActiveTool: (tool: 'Blur' | 'Erase' | 'Rect') => void;
  blurIntensity: number;
  setBlurIntensity: (val: number) => void;
  // KABEL REMOT KONTROL BARU
  showAnnotations: boolean;
  setShowAnnotations: (val: boolean) => void;
}

const EditorSidebar: React.FC<EditorSidebarProps> = ({ 
  activeTool, setActiveTool, blurIntensity, setBlurIntensity,
  showAnnotations, setShowAnnotations // TERIMA KABELNYA
}) => {
  return (
    <aside className="w-80 bg-white flex flex-col flex-shrink-0 border-l border-gray-100">
      <div className="p-6 flex-1 overflow-y-auto">
        <div className="mb-8">
          <span className="text-[14px] font-bold text-gray-900 mb-4 block">Manual Tools</span>
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
            type="range" min="5" max="80" 
            value={blurIntensity}
            onChange={(e) => setBlurIntensity(Number(e.target.value))}
            className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#0D52E9]"
          />
        </div>

        <div className="space-y-6 mb-8">
          {/* SAKLAR SHOW ANNOTATION YANG SUDAH HIDUP */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Show Annotations</span>
            <button 
              onClick={() => setShowAnnotations(!showAnnotations)}
              className={`w-11 h-6 rounded-full flex items-center px-1 transition-all duration-200 ease-in-out ${
                showAnnotations ? 'bg-[#0D52E9] justify-end' : 'bg-gray-300 justify-start'
              }`}
            >
              <div className="w-4 h-4 bg-white rounded-full shadow-md transform transition-transform"></div>
            </button>
          </div>
          <div className="flex items-center justify-between opacity-50 cursor-not-allowed">
            <span className="text-sm font-medium text-gray-700">High-Precision Mode</span>
            <button disabled className="w-11 h-6 rounded-full flex items-center px-1 bg-gray-300">
              <div className="w-4 h-4 bg-white rounded-full"></div>
            </button>
          </div>
          <p className="text-[10px] text-gray-400 mt-2">AI features are managed in sync with backend.</p>
        </div>
      </div>

      <div className="p-6 pt-0 mt-auto bg-white">
        <p className="text-xs text-center text-gray-500 leading-relaxed px-2">
          All processing happens locally on your device for maximum privacy.
        </p>
      </div>
    </aside>
  );
};

export default EditorSidebar;