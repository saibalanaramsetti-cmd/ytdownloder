import React from 'react';
import { JobProgress } from '../types/media';
import { XCircle, RefreshCw, Cpu, Gauge, Clock, AlertTriangle } from 'lucide-react';

interface ProcessingProgressProps {
  progress: JobProgress;
  onCancel: () => void;
  onRetry: () => void;
}

export const ProcessingProgress: React.FC<ProcessingProgressProps> = ({ progress, onCancel, onRetry }) => {
  const isFailed = progress.status === 'failed';
  const isCancelled = progress.status === 'cancelled';

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 mb-8">
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl relative overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Cpu className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white light:text-slate-900">
                {isFailed
                  ? 'Processing Failed'
                  : isCancelled
                  ? 'Job Cancelled'
                  : 'Processing Media Stream...'}
              </h3>
              <p className="text-xs text-slate-400">
                {progress.phase || 'Executing hardware-accelerated pipeline'}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-2xl sm:text-3xl font-black text-indigo-400 light:text-indigo-600 font-mono">
              {Math.min(100, Math.max(0, Math.round(progress.progress)))}%
            </span>
          </div>
        </div>

        {/* Progress Bar Container */}
        <div className="w-full h-3 rounded-full bg-slate-800/80 light:bg-slate-200 overflow-hidden relative mb-4">
          <div
            className={`h-full transition-all duration-300 rounded-full relative ${
              isFailed
                ? 'bg-rose-500'
                : isCancelled
                ? 'bg-amber-500'
                : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400'
            }`}
            style={{ width: `${Math.max(5, progress.progress)}%` }}
          >
            {/* Animated shimmer light effect */}
            {!isFailed && !isCancelled && (
              <div className="absolute inset-0 bg-white/20 animate-shimmer" />
            )}
          </div>
        </div>

        {/* Real-time stats row: Speed, ETA, Message */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 mb-6">
          <div className="flex items-center space-x-4">
            {progress.speed && (
              <div className="flex items-center space-x-1.5 text-slate-300">
                <Gauge className="w-4 h-4 text-cyan-400" />
                <span>Speed: <strong className="text-white">{progress.speed}</strong></span>
              </div>
            )}
            {progress.eta && (
              <div className="flex items-center space-x-1.5 text-slate-300">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>ETA: <strong className="text-white">{progress.eta}</strong></span>
              </div>
            )}
          </div>

          {progress.message && (
            <div className="text-xs text-slate-400 italic">
              {progress.message}
            </div>
          )}
        </div>

        {/* Error message if failed */}
        {isFailed && progress.error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-rose-200 mb-0.5">Media Processing Encountered an Error:</p>
              <p className="font-mono">{progress.error}</p>
            </div>
          </div>
        )}

        {/* Bottom Actions: Cancel & Retry */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-white/5">
          {(!isFailed && !isCancelled) ? (
            <button
              onClick={onCancel}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-rose-300 hover:text-white bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all"
            >
              <XCircle className="w-4 h-4" />
              <span>Cancel Job</span>
            </button>
          ) : (
            <button
              onClick={onRetry}
              className="flex items-center space-x-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-md shadow-indigo-600/25"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Try Again</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
