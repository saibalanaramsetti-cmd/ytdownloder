import React, { useState } from 'react';
import { X, Copy, Check, Smartphone } from 'lucide-react';

interface QrCodeModalProps {
  url: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({ url, isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !url) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Generate QR image via high-reliability SVG/PNG data endpoint
  const qrImageSrc = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
    url
  )}&bgcolor=11-18-27&color=99-102-241&margin=1`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-sm glass-panel rounded-3xl p-6 sm:p-7 border border-white/10 shadow-2xl relative text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 mx-auto flex items-center justify-center mb-3">
          <Smartphone className="w-6 h-6" />
        </div>

        <h3 className="text-lg font-bold text-white light:text-slate-900 mb-1">
          Scan to Download on Mobile
        </h3>
        <p className="text-xs text-slate-400 mb-5">
          Scan with your iPhone or Android camera to start downloading directly to your phone.
        </p>

        {/* QR Code Container */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-white/10 inline-block mb-5 shadow-inner">
          <img
            src={qrImageSrc}
            alt="QR Code"
            className="w-48 h-48 rounded-xl object-contain mx-auto"
            onError={(e) => {
              // Fallback display if offline
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>

        {/* Quick Copy Link */}
        <div className="flex items-center space-x-2 p-2 rounded-xl bg-white/5 border border-white/10 text-xs">
          <input
            type="text"
            readOnly
            value={url}
            className="flex-1 bg-transparent text-slate-300 font-mono text-[11px] truncate focus:outline-none pl-1"
          />
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center space-x-1"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
