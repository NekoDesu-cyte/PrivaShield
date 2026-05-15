import React from 'react';
import { XCircle, AlertTriangle, Info, RefreshCcw, CheckCircle2 } from 'lucide-react';

type AlertType = 'error' | 'warning' | 'info' | 'success' | 'confirm';

interface AlertModalProps {
  isOpen: boolean;
  type: AlertType;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel?: () => void;
  confirmLabel?: string;
}

const AlertModal: React.FC<AlertModalProps> = ({ 
  isOpen, type, title, message, onConfirm, onCancel, confirmLabel = "Try Again" 
}) => {
  if (!isOpen) return null;

  // Konfigurasi Ikon dan Warna berdasarkan Type
  const config = {
    error: { icon: <XCircle className="w-10 h-10 text-red-500" />, bg: 'bg-red-50', btn: 'bg-red-600 hover:bg-red-700' },
    warning: { icon: <AlertTriangle className="w-10 h-10 text-orange-500" />, bg: 'bg-orange-50', btn: 'bg-[#0D52E9] hover:bg-blue-700' },
    info: { icon: <Info className="w-10 h-10 text-blue-500" />, bg: 'bg-blue-50', btn: 'bg-[#0D52E9] hover:bg-blue-700' },
    success: { icon: <CheckCircle2 className="w-10 h-10 text-green-500" />, bg: 'bg-green-50', btn: 'bg-[#0D52E9] hover:bg-blue-700' },
    confirm: { icon: <RefreshCcw className="w-10 h-10 text-red-500" />, bg: 'bg-red-50', btn: 'bg-red-600 hover:bg-red-700' },
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full text-center shadow-2xl animate-in fade-in zoom-in duration-300">
        
        {/* Ikon */}
        <div className={`mx-auto w-20 h-20 flex items-center justify-center rounded-3xl mb-6 ${config[type].bg}`}>
          {config[type].icon}
        </div>

        {/* Text */}
        <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-500 leading-relaxed px-4 mb-8">
          {message}
        </p>

        {/* Buttons */}
        <div className="flex flex-col gap-3">
          <button 
            onClick={onConfirm}
            className={`w-full py-3.5 text-white font-bold rounded-2xl transition-all shadow-md ${config[type].btn}`}
          >
            {confirmLabel}
          </button>
          
          {onCancel && (
            <button 
              onClick={onCancel}
              className="w-full py-3.5 text-gray-500 font-bold hover:bg-gray-50 rounded-2xl transition-all"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlertModal;