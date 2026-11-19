import React, { useState } from 'react';
import { MediaMetadata } from '../types/media';
import { Clock, Eye, ThumbsUp, ExternalLink, Scissors, Play, Share2, Check } from 'lucide-react';

interface MediaPreviewCardProps {
  metadata: MediaMetadata;
  onOpenTrimmer?: () => void;
}

export const MediaPreviewCard: React.FC<MediaPreviewCardProps> = ({ metadata, onOpenTrimmer }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(metadata.webpage_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatNumber = (num?: number) => {
    if (!num) return null;
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
    if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K';
    return num.toLocaleString();
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 mb-8">
      <div className="glass-card rounded-3xl p-5 sm:p-6 border border-white/10 overflow-hidden relative">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Thumbnail / Video Preview Area */}
          <div className="relative w-full md:w-80 h-48 md:h-52 rounded-2xl overflow-hidden bg-slate-900 flex-shrink-0 group shadow-xl">
            {metadata.thumbnail ? (
              <img
                src={metadata.thumbnail}
                alt={metadata.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-950 to-slate-900 text-slate-500">
                <Play className="w-12 h-12 text-white/30" />
              </div>
            )}

            {/* Gradient overlay on hover */}
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <a
                href={metadata.webpage_url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3.5 rounded-full bg-indigo-600/90 hover:bg-indigo-500 text-white shadow-lg backdrop-blur-md transform scale-90 group-hover:scale-100 transition-all"
                title="Open Source Video"
              >
                <Play className="w-6 h-6 fill-white translate-x-0.5" />
              </a>
            </div>

            {/* Duration Badge */}
            {metadata.duration_str && (
              <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-[11px] font-bold text-white flex items-center space-x-1">
                <Clock className="w-3 h-3 text-indigo-400" />
                <span>{metadata.duration_str}</span>
              </div>
            )}

            {/* Platform Extractor Badge */}
            <div className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-indigo-600/90 backdrop-blur-md text-[10px] font-extrabold uppercase tracking-wider text-white">
              {metadata.extractor}
            </div>
          </div>

          {/* Metadata Information Details */}
          <div className="flex-1 flex flex-col justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white light:text-slate-900 leading-snug line-clamp-2 mb-2">
                {metadata.title}
              </h2>

              <div className="flex items-center space-x-2 text-sm text-indigo-400 light:text-indigo-600 font-semibold mb-4">
                {metadata.author && (
                  <span>{metadata.author}</span>
                )}
                {metadata.upload_date && (
                  <>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-400 text-xs font-normal">
                      Uploaded {metadata.upload_date}
                    </span>
                  </>
                )}
              </div>

              {/* Stats badges */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 light:text-slate-600 mb-4">
                {metadata.view_count !== undefined && (
                  <div className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-white/5 border border-white/5">
                    <Eye className="w-3.5 h-3.5 text-slate-400" />
                    <span>{formatNumber(metadata.view_count)} views</span>
                  </div>
                )}
                {metadata.like_count !== undefined && (
                  <div className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-white/5 border border-white/5">
                    <ThumbsUp className="w-3.5 h-3.5 text-slate-400" />
                    <span>{formatNumber(metadata.like_count)} likes</span>
                  </div>
                )}
                <div className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-white/5 border border-white/5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span>{metadata.video_formats.length} video streams ready</span>
                </div>
              </div>
            </div>

            {/* Quick Action Toolbar */}
            <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-white/10">
              <button
                onClick={handleCopyLink}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-slate-300 hover:text-white border border-white/10 transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                <span>{copied ? 'Link Copied!' : 'Share Link'}</span>
              </button>

              <a
                href={metadata.webpage_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-slate-300 hover:text-white border border-white/10 transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Source</span>
              </a>

              {onOpenTrimmer && (
                <button
                  onClick={onOpenTrimmer}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-xs font-semibold text-indigo-300 border border-indigo-500/20 transition-all"
                >
                  <Scissors className="w-3.5 h-3.5" />
                  <span>Trim & Cut Video</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
