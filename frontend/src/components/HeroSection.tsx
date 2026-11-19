import React from 'react';
import { Film, Music, Zap, Shield, Sparkles } from 'lucide-react';

export const HeroSection: React.FC = () => {
  return (
    <section className="relative pt-12 pb-8 sm:pt-16 sm:pb-12 text-center overflow-hidden">
      {/* Background ambient lighting effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-tr from-indigo-600/20 via-purple-600/15 to-cyan-500/10 blur-[120px] rounded-full -z-10 pointer-events-none" />
      <div className="absolute -top-24 left-1/4 w-72 h-72 bg-indigo-500/10 blur-[90px] rounded-full -z-10 pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Floating Badge */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full glass-panel mb-6 border border-white/10 shadow-lg shadow-indigo-500/5 animate-float">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-semibold bg-gradient-to-r from-indigo-200 via-indigo-300 to-cyan-200 bg-clip-text text-transparent">
            Powered by Hardware-Accelerated FFmpeg 9.0 Core
          </span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white light:text-slate-900 leading-[1.15] mb-5">
          Ultra-Fast Media Downloader{' '}
          <span className="block text-gradient-primary">
            & Studio-Grade Converter
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg md:text-xl text-slate-300 light:text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed mb-8">
          Download, transcode, trim, and enhance authorized online videos, pristine 320kbps audio, and subtitles in seconds. No ads, no limits, pure quality.
        </p>

        {/* Feature Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-4 text-xs font-medium text-slate-300 light:text-slate-600">
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 light:bg-slate-100 light:border-slate-200">
            <Film className="w-3.5 h-3.5 text-indigo-400" />
            <span>4K / 1080p 60fps</span>
          </div>
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 light:bg-slate-100 light:border-slate-200">
            <Music className="w-3.5 h-3.5 text-cyan-400" />
            <span>MP3 320kbps / FLAC</span>
          </div>
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 light:bg-slate-100 light:border-slate-200">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Instant Trimming & GIF</span>
          </div>
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 light:bg-slate-100 light:border-slate-200">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>SSRF Safe & Private</span>
          </div>
        </div>
      </div>
    </section>
  );
};
