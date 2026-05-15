import React from "react";
import { CheckCircle2, CloudDownload, Loader2 } from "lucide-react";

type DownloadModalProps = {
  progress: number;
};

const DownloadModal: React.FC<DownloadModalProps> = ({ progress }) => {
  return (
    // Overlay hitam transparan di belakang popup
    <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50 flex items-center justify-center px-4">
      {/* Box Popup */}
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl relative animate-in fade-in zoom-in duration-200">
        {/* Ikon Awan dengan efek Glow Biru */}
        <div className="relative mx-auto w-16 h-16 flex items-center justify-center mb-6">
          <div className="absolute inset-0 bg-[#0D52E9] blur-xl opacity-20 rounded-full"></div>
          <div className="relative bg-white rounded-full p-3 shadow-sm border border-gray-50">
            <CloudDownload
              className="w-8 h-8 text-[#0D52E9]"
              fill="currentColor"
            />
          </div>
        </div>

        {/* Teks Header */}
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Preparing Download
        </h3>
        <p className="text-sm text-gray-500 leading-relaxed px-2">
          Our AI is finalizing the secure encryption and metadata stripping for
          your image.
        </p>

        {/* Box Loading Spinner */}
        <div className="bg-[#F3F4F6] rounded-xl p-4 mt-6 flex items-center justify-center gap-3">
          {progress >= 100 ? (
            // Teks saat selesai
            <span className="text-sm font-bold text-green-600 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" /> Download Started!
            </span>
          ) : (
            // Teks saat proses
            <>
              <Loader2 className="w-5 h-5 text-[#0D52E9] animate-spin" />
              <span className="text-sm font-semibold text-[#0D52E9]">
                Preparing your image...
              </span>
            </>
          )}
        </div>

        {/* Teks Persentase */}
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-6 block">
          PROCESS {progress}% COMPLETE
        </span>
      </div>
    </div>
  );
};

export default DownloadModal;
