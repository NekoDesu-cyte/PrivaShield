import React from 'react';
import { RotateCcw, Undo, Download } from 'lucide-react';

interface EditorTopbarProps {
  filename: string;
  onClearAll: () => void;
  onUndo: () => void;
  canUndo: boolean;
  onDownload: () => void;
}

const EditorTopbar: React.FC<EditorTopbarProps> = ({
  filename, onClearAll, onUndo, canUndo, onDownload
}) => {
  return (
    <div className="h-16 flex items-center justify-between px-6 bg-white border-b border-gray-200 flex-shrink-0">
      <div className="flex items-center gap-3">
        <h3 className="font-semibold text-gray-800 max-w-xs truncate">{filename}</h3>
        <span className="bg-[#E4ECFA] text-[#0D52E9] text-[10px] font-bold px-2.5 py-1 rounded-full tracking-wide">
          MANUAL MODE
        </span>
      </div>
      <div className="flex items-center gap-3">
        <button 
          onClick={onClearAll}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Clear All
        </button>

        <button 
          onClick={onUndo}
          disabled={!canUndo}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg border transition-colors ${
            !canUndo ? 'text-gray-300 border-gray-200 cursor-not-allowed' : 'text-gray-600 border-gray-300 hover:bg-gray-50'
          }`}
        >
          <Undo className="w-3.5 h-3.5" /> Undo
        </button>

        <button 
          onClick={onDownload}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#0D52E9] rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Download className="w-4 h-4" /> Download Image
        </button>
      </div>
    </div>
  );
};

export default EditorTopbar;