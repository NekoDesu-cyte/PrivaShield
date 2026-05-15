import { ShieldCheck, Lock } from "lucide-react";

type AiScanningOverlayProps = {
  imageUrl?: string;
  progress?: number;
};

function AiScanningOverlay({
  imageUrl,
  progress = 65,
}: AiScanningOverlayProps) {
  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md flex flex-col items-center text-center">
        {/* Image scanner visual */}
        <div className="relative mb-8 flex h-48 w-48 items-center justify-center">
          {/* Outer pulse rings */}
          <div className="absolute h-44 w-44 rounded-full border border-blue-200 animate-ping opacity-40" />
          <div className="absolute h-40 w-40 rounded-full border border-blue-200" />
          <div className="absolute h-32 w-32 rounded-full border border-blue-100" />

          {/* Image preview */}
          <div className="relative h-28 w-28 overflow-hidden rounded-xl bg-white shadow-lg">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt="Uploaded preview"
                className="h-full w-full object-cover opacity-80"
              />
            ) : (
              <div className="h-full w-full bg-slate-200" />
            )}

            {/* Scanning line */}
            <div className="absolute left-0 h-1 w-full -translate-y-1/2 bg-blue-500 shadow-[0_0_16px_rgba(59,130,246,0.8)] animate-scan z-10" />
          </div>
        </div>

        {/* Title */}
        <h2 className="mb-3 text-2xl font-semibold tracking-tight text-slate-800">
          Scanning image and detecting sensitive information...
        </h2>

        <p className="mb-6 text-sm leading-6 text-slate-500">
          Our AI is identifying profile photos, phone numbers, and personal
          names.
        </p>

        {/* Progress card */}
        <div className="mb-6 w-full rounded-2xl border border-slate-100 bg-white p-5 text-left shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wide text-blue-600">
              Privacy Analysis
            </span>
            <span className="text-sm font-semibold text-blue-600">
              {progress}%
            </span>
          </div>

          <div className="mb-5 h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-blue-600 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <Lock size={14} className="text-blue-600" />
            Secure local processing active
          </div>
        </div>
        

        {/* Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-600">
          <ShieldCheck size={14} />
          High-Trust Processing Environment
        </div>
      </div>
    </div>
  );
}

export default AiScanningOverlay;
