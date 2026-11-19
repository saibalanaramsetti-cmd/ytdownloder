import React from 'react';
import { Sparkles, Shield, Cpu } from 'lucide-react';
import { SystemHealth } from '../types/media';

interface FooterProps {
  systemHealth: SystemHealth | null;
}

export const Footer: React.FC<FooterProps> = ({ systemHealth }) => {
  return (
    <footer className="w-full border-t border-white/10 bg-[#070b13] text-slate-400 text-xs py-12 transition-colors dark:bg-[#070b13] light:bg-slate-100 light:border-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 pb-8 border-b border-white/5">
          {/* Col 1: Brand & Description */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center space-x-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-400 p-[1px]">
                <div className="w-full h-full bg-[#0b0f19] light:bg-white rounded-[11px] flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                </div>
              </div>
              <span className="text-lg font-black text-white light:text-slate-900 tracking-tight">
                Media<span className="text-indigo-400">Flow</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              Production-oriented online media processing platform. Powered by hardware-accelerated FFmpeg, modern glassmorphism design, and zero-loss audio-video pipelines.
            </p>
            <div className="flex items-center space-x-3 text-[11px] text-slate-500 pt-1">
              <span className="flex items-center space-x-1">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>SSRF Protected</span>
              </span>
              <span>•</span>
              <span className="flex items-center space-x-1">
                <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                <span>{systemHealth?.ffmpeg_version || 'FFmpeg 9.0 Enabled'}</span>
              </span>
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white light:text-slate-900">
              Media Features
            </h4>
            <ul className="space-y-1.5 text-xs">
              <li><a href="#downloader" className="hover:text-indigo-400 transition-colors">4K Video Downloader</a></li>
              <li><a href="#converter" className="hover:text-indigo-400 transition-colors">320kbps MP3 Converter</a></li>
              <li><a href="#tools" className="hover:text-indigo-400 transition-colors">Video Trimmer & Cutter</a></li>
              <li><a href="#tools" className="hover:text-indigo-400 transition-colors">Subtitle Extractor (.SRT)</a></li>
              <li><a href="#tools" className="hover:text-indigo-400 transition-colors">HD Thumbnail Grabber</a></li>
            </ul>
          </div>

          {/* Col 3: API & Legal */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white light:text-slate-900">
              Developer & Legal
            </h4>
            <ul className="space-y-1.5 text-xs">
              <li><a href="/docs" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-400 transition-colors">FastAPI Interactive Docs</a></li>
              <li><a href="/redoc" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-400 transition-colors">OpenAPI ReDoc Schema</a></li>
              <li><a href="#faq" className="hover:text-indigo-400 transition-colors">Usage Guidelines</a></li>
              <li><a href="#faq" className="hover:text-indigo-400 transition-colors">Terms of Service</a></li>
              <li><a href="#faq" className="hover:text-indigo-400 transition-colors">Privacy Policy</a></li>
            </ul>
          </div>
        </div>

        {/* Legal Disclaimer & Status Row */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p className="text-center md:text-left max-w-2xl leading-normal">
            <strong>Disclaimer:</strong> MediaFlow is intended for processing media content that users own or are legally authorized to access and download for personal, non-commercial use. MediaFlow does not bypass DRM, encryption, or copyright protections.
          </p>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1.5 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Backend Status: Online</span>
            </div>
            <span>© {new Date().getFullYear()} MediaFlow. All rights reserved.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
