import React from 'react';
import { Music2, Video, Globe, Film, Play, Radio, Share2 } from 'lucide-react';

export const SupportedSources: React.FC = () => {
  const sources = [
    { name: 'YouTube', icon: Play, color: 'text-red-500', note: 'Up to 4K 60fps' },
    { name: 'SoundCloud', icon: Music2, color: 'text-orange-500', note: 'Lossless & 320k' },
    { name: 'Vimeo', icon: Video, color: 'text-blue-400', note: '1080p & 4K' },
    { name: 'TikTok', icon: Film, color: 'text-pink-500', note: 'HD & Audio' },
    { name: 'Twitter / X', icon: Share2, color: 'text-sky-400', note: 'Original MP4' },
    { name: 'Twitch', icon: Radio, color: 'text-purple-400', note: 'Clips & Streams' },
    { name: 'Direct Links', icon: Globe, color: 'text-emerald-400', note: 'MP4, WebM, MP3' },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 mb-12">
      <div className="p-4 rounded-2xl glass-panel border border-white/5">
        <div className="text-center mb-3">
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
            Supported Authorized Platforms & Direct Media
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 text-center">
          {sources.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.name}
                className="flex flex-col items-center p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-all border border-transparent hover:border-white/10 group cursor-default"
              >
                <Icon className={`w-5 h-5 mb-1.5 ${item.color} group-hover:scale-110 transition-transform`} />
                <span className="text-xs font-semibold text-slate-200 light:text-slate-700">{item.name}</span>
                <span className="text-[10px] text-slate-400">{item.note}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
