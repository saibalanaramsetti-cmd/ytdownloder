import React, { useState } from 'react';
import { Link2, Clipboard, ArrowRight, Loader2, X, AlertCircle } from 'lucide-react';

interface UrlInputBarProps {
  url: string;
  setUrl: (url: string) => void;
  onFetch: (url: string) => void;
  isLoading: boolean;
  error?: string | null;
  onClearError?: () => void;
}

export const UrlInputBar: React.FC<UrlInputBarProps> = ({
  url,
  setUrl,
  onFetch,
  isLoading,
  error,
  onClearError,
}) => {
  const [pasteSuccess, setPasteSuccess] = useState(false);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text.trim());
        if (onClearError) onClearError();
        setPasteSuccess(true);
        setTimeout(() => setPasteSuccess(false), 2000);
      }
    } catch {
      // Fallback if browser permission is blocked
      const promptText = window.prompt("Paste your media URL here:");
      if (promptText) {
        setUrl(promptText.trim());
        if (onClearError) onClearError();
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || isLoading) return;
    onFetch(url.trim());
  };

  const handleClear = () => {
    setUrl('');
    if (onClearError) onClearError();
  };

  // Supported source sample chips for rapid testing
  const sampleUrls = [
    { name: "Direct Video Demo", url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" },
    { name: "Public Audio Demo", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
    { name: "Vimeo Sample", url: "https://vimeo.com/76979871" },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 mb-8" id="downloader">
      {/* Search / Input Box Container */}
      <div className="relative group">
        {/* Exterior subtle gradient border glow */}
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 rounded-3xl blur-md opacity-30 group-hover:opacity-60 transition duration-500 group-focus-within:opacity-80" />

        <form onSubmit={handleSubmit} className="relative flex flex-col sm:flex-row items-center gap-2 p-2 rounded-2xl glass-input shadow-2xl border border-white/10 dark:border-white/10 light:border-slate-300">
          <div className="relative flex-1 w-full flex items-center pl-3">
            <Link2 className="w-5 h-5 text-indigo-400 light:text-indigo-600 flex-shrink-0" />
            
            <input
              type="text"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (onClearError) onClearError();
              }}
              placeholder="Paste media link here (YouTube, Vimeo, SoundCloud, Direct MP4/MP3...)"
              className="w-full py-3.5 pl-3 pr-20 bg-transparent text-sm sm:text-base font-normal text-white light:text-slate-900 placeholder-slate-400 focus:outline-none"
              disabled={isLoading}
            />

            {/* Quick action buttons inside input */}
            <div className="absolute right-2 flex items-center space-x-1.5">
              {url && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-1.5 text-slate-400 hover:text-white light:hover:text-slate-900 rounded-lg hover:bg-white/10 transition-colors"
                  title="Clear input"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={handlePaste}
                className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  pasteSuccess
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-white/10 hover:bg-white/15 text-slate-200 border border-white/10 light:bg-slate-200 light:text-slate-700 light:hover:bg-slate-300'
                }`}
                title="Paste from clipboard"
              >
                <Clipboard className="w-3.5 h-3.5" />
                <span>{pasteSuccess ? 'Pasted!' : 'Paste'}</span>
              </button>
            </div>
          </div>

          {/* Primary Action Button */}
          <button
            type="submit"
            disabled={!url.trim() || isLoading}
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95 flex items-center justify-center space-x-2 flex-shrink-0"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Analyzing Media...</span>
              </>
            ) : (
              <>
                <span>Fetch Media</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mt-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold text-rose-200">Processing Error: </span>
            <span>{error}</span>
          </div>
          <button onClick={onClearError} className="text-rose-400 hover:text-rose-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Quick sample chips */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400">
        <span className="font-medium text-slate-400">Try sample links:</span>
        {sampleUrls.map((sample) => (
          <button
            key={sample.name}
            type="button"
            onClick={() => {
              setUrl(sample.url);
              onFetch(sample.url);
            }}
            className="px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5 transition-all text-[11px]"
          >
            {sample.name}
          </button>
        ))}
      </div>
    </div>
  );
};
