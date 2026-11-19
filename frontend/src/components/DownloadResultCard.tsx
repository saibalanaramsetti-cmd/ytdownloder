import React, { useState, useEffect } from 'react';
import { JobProgress } from '../types/media';
import { CheckCircle2, Download, QrCode, Copy, Check, Clock, FileCheck, Scissors, RefreshCw } from 'lucide-react';

interface DownloadResultCardProps {
  result: JobProgress;
  onOpenQr: (url: string) => void;
  onReset: () => void;
  onOpenTrimmer?: () => void;
}

export const DownloadResultCard: React.FC<DownloadResultCardProps> = ({
  result,
  onOpenQr,
  onReset,
  onOpenTrimmer,
}) => {
  const [copied, setCopied] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(
    result.expires_in_seconds || 3600
  );

  // Countdown timer for temporary signed URL
  useEffect(() => {
    if (secondsRemaining <= 0) return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [secondsRemaining]);

  const formatCountdown = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}m ${s < 10 ? '0' : ''}${s}s`;
  };

  const handleCopyLink = () => {
    if (!result.download_url) return;
    const fullUrl = `${window.location.origin}${result.download_url}`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 mb-8 animate-float">
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-emerald-500/30 shadow-2xl relative overflow-hidden bg-gradient-to-b from-emerald-500/5 to-transparent">
        {/* Glow corner */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[90px] rounded-full pointer-events-none" />

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-xl font-extrabold text-white light:text-slate-900">
                  Media Converted Successfully!
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold tracking-wide uppercase border border-emerald-500/30">
                  Ready
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Processed with FFmpeg zero-loss conversion pipeline
              </p>
            </div>
          </div>

          {/* Expiry countdown */}
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-medium text-slate-300">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Link expires in: <strong className="text-amber-400">{formatCountdown(secondsRemaining)}</strong></span>
          </div>
        </div>

        {/* File Details Box */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-sm font-bold text-white light:text-slate-900 break-all">
                <FileCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{result.file_name || 'mediaflow_download.mp4'}</span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                <span>File Size: <strong className="text-slate-200">{result.file_size_str || 'Estimated'}</strong></span>
                {result.checksum && (
                  <>
                    <span>•</span>
                    <span className="font-mono text-[11px]">MD5: {result.checksum.substring(0, 12)}...</span>
                  </>
                )}
              </div>
            </div>

            {/* Main Download Button */}
            {result.download_url && (
              <a
                href={result.download_url}
                download={result.file_name || true}
                className="px-8 py-3.5 rounded-2xl font-black text-sm text-white bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 shadow-xl shadow-emerald-500/25 flex items-center justify-center space-x-2 transform active:scale-95 transition-all flex-shrink-0"
              >
                <Download className="w-5 h-5" />
                <span>Download File Now</span>
              </a>
            )}
          </div>
        </div>

        {/* Action Row: QR code, Copy Link, Trim, Process Another */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/10">
          <div className="flex flex-wrap items-center gap-2">
            {result.download_url && (
              <>
                <button
                  onClick={() => onOpenQr(`${window.location.origin}${result.download_url}`)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-200 border border-white/10 transition-all"
                  title="Scan QR on mobile"
                >
                  <QrCode className="w-4 h-4 text-indigo-400" />
                  <span>QR Code for Mobile</span>
                </button>

                <button
                  onClick={handleCopyLink}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-200 border border-white/10 transition-all"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Link Copied' : 'Copy Direct URL'}</span>
                </button>
              </>
            )}

            {onOpenTrimmer && (
              <button
                onClick={onOpenTrimmer}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-xs font-semibold text-indigo-300 border border-indigo-500/20 transition-all"
              >
                <Scissors className="w-4 h-4" />
                <span>Trim This Video</span>
              </button>
            )}
          </div>

          <button
            onClick={onReset}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Process Another Link</span>
          </button>
        </div>
      </div>
    </div>
  );
};
