import React from 'react';
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react';

interface ZoomControlsProps {
  zoomScale: number;
  setZoomScale: React.Dispatch<React.SetStateAction<number>>;
}

const ZoomControls: React.FC<ZoomControlsProps> = ({ zoomScale, setZoomScale }) => {
  return (
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
  );
};

export default ZoomControls;