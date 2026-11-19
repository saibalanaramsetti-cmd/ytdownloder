import React from 'react';
import { HistoryItem } from '../types/media';
import { History, X, Download, Trash2, ExternalLink, Clock } from 'lucide-react';

interface DownloadHistoryModalProps {
  history: HistoryItem[];
  isOpen: boolean;
  onClose: () => void;
  onClearHistory: () => void;
}

export const DownloadHistoryModal: React.FC<DownloadHistoryModalProps> = ({
  history,
  isOpen,
  onClose,
  onClearHistory,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-2xl glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl relative max-h-[85vh] flex flex-col">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white light:text-slate-900">
                Recent Download History
              </h3>
              <p className="text-xs text-slate-400">
                {history.length} processed items saved in this browser
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {history.length > 0 && (
              <button
                onClick={onClearHistory}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-300 hover:text-white bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* History List Container */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {history.length > 0 ? (
            history.map((item) => (
              <div
                key={item.job_id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all gap-3"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  {item.thumbnail ? (
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="w-16 h-12 object-cover rounded-xl bg-slate-900 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 flex-shrink-0 text-xs font-bold uppercase">
                      {item.target_ext}
                    </div>
                  )}

                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-white light:text-slate-900 truncate">
                      {item.title}
                    </h4>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 mt-1">
                      <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-bold uppercase text-[10px]">
                        {item.target_ext}
                      </span>
                      <span>{item.quality_label}</span>
                      {item.file_size_str && (
                        <>
                          <span>•</span>
                          <span>{item.file_size_str}</span>
                        </>
                      )}
                      <span>•</span>
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>{new Date(item.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 flex-shrink-0 self-end sm:self-center">
                  <a
                    href={item.download_url}
                    download
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-md"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </a>

                  <a
                    href={item.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
                    title="Open original link"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-slate-400">
              <History className="w-10 h-10 mx-auto text-slate-600 mb-2" />
              <p className="text-sm font-semibold">No download history yet.</p>
              <p className="text-xs text-slate-500 mt-1">
                Completed media conversions will automatically appear here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
