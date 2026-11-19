import React, { useState } from 'react';
import { MediaMetadata, CreateJobPayload } from '../types/media';
import { Scissors, X, Clock, Film } from 'lucide-react';

interface VideoTrimmerModalProps {
  metadata: MediaMetadata;
  isOpen: boolean;
  onClose: () => void;
  onSubmitTrim: (payload: CreateJobPayload) => void;
}

export const VideoTrimmerModal: React.FC<VideoTrimmerModalProps> = ({
  metadata,
  isOpen,
  onClose,
  onSubmitTrim,
}) => {
  const [startSec, setStartSec] = useState<string>('00:00:00');
  const [endSec, setEndSec] = useState<string>(
    metadata.duration
      ? formatTime(Math.min(metadata.duration, 60))
      : '00:01:00'
  );
  const [targetExt, setTargetExt] = useState<string>('mp4');
  const [isGif, setIsGif] = useState<boolean>(false);

  if (!isOpen) return null;

  function formatTime(seconds: number) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitTrim({
      url: metadata.webpage_url,
      media_type: isGif ? 'gif' : 'trim',
      target_ext: isGif ? 'gif' : targetExt,
      trim_start: startSec,
      trim_end: endSec,
      target_quality: isGif ? 'Animated GIF' : `Trimmed ${targetExt.toUpperCase()}`,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div className="w-full max-w-lg glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl relative animate-float">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-400">
            <Scissors className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white light:text-slate-900">
              Video Trimmer & Cutter
            </h3>
            <p className="text-xs text-slate-400">
              Cut high-precision segments with zero quality loss
            </p>
          </div>
        </div>

        <form onSubmit={handleApply} className="space-y-4">
          <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-xs text-slate-300 flex items-center space-x-2">
            <Clock className="w-4 h-4 text-indigo-400 flex-shrink-0" />
            <span className="truncate">Source Duration: <strong>{metadata.duration_str || 'Full Length'}</strong></span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Start Timestamp (HH:MM:SS)
              </label>
              <input
                type="text"
                value={startSec}
                onChange={(e) => setStartSec(e.target.value)}
                placeholder="00:00:00"
                className="w-full py-2.5 px-3 rounded-xl glass-input text-xs font-mono text-white focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                End Timestamp (HH:MM:SS)
              </label>
              <input
                type="text"
                value={endSec}
                onChange={(e) => setEndSec(e.target.value)}
                placeholder="00:00:30"
                className="w-full py-2.5 px-3 rounded-xl glass-input text-xs font-mono text-white focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Export Format
            </label>
            <div className="grid grid-cols-4 gap-2">
              {['mp4', 'webm', 'mkv', 'mp3'].map((ext) => (
                <button
                  key={ext}
                  type="button"
                  onClick={() => {
                    setTargetExt(ext);
                    setIsGif(false);
                  }}
                  className={`py-2 rounded-xl text-xs font-bold uppercase transition-all ${
                    targetExt === ext && !isGif
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-white/5 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  {ext}
                </button>
              ))}
            </div>
          </div>

          {/* GIF Mode Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
            <div className="flex items-center space-x-2">
              <Film className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-medium text-slate-200">Convert Selection to Animated GIF</span>
            </div>
            <input
              type="checkbox"
              checked={isGif}
              onChange={(e) => setIsGif(e.target.checked)}
              className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 shadow-lg shadow-indigo-500/25 transition-all"
            >
              Start Trimming
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
