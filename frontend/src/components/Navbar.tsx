import React from 'react';
import { Sparkles, Sun, Moon, History, Activity, ShieldCheck } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { SystemHealth } from '../types/media';

interface NavbarProps {
  onOpenHistory: () => void;
  historyCount: number;
  systemHealth: SystemHealth | null;
  onSelectTool?: (toolId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenHistory,
  historyCount,
  systemHealth,
}) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-[#0b0f19]/80 border-b border-white/10 transition-colors dark:bg-[#0b0f19]/80 light:bg-white/80 light:border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-[1px] shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-[#0b0f19] dark:bg-[#0b0f19] light:bg-white rounded-[11px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-indigo-400 light:text-indigo-600 animate-pulse-slow" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-extrabold tracking-tight text-white light:text-slate-900">
                Media<span className="text-indigo-400 light:text-indigo-600">Flow</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                PRO
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium hidden sm:block">Ultra HD Downloader & Converter</p>
          </div>
        </div>

        {/* Center Navigation Links */}
        <nav className="hidden md:flex items-center space-x-1 lg:space-x-2 text-sm font-medium text-slate-300 light:text-slate-600">
          <a href="#downloader" className="px-3 py-1.5 rounded-lg hover:text-white light:hover:text-slate-900 hover:bg-white/5 transition-all">
            Downloader
          </a>
          <a href="#converter" className="px-3 py-1.5 rounded-lg hover:text-white light:hover:text-slate-900 hover:bg-white/5 transition-all">
            Audio Converter
          </a>
          <a href="#tools" className="px-3 py-1.5 rounded-lg hover:text-white light:hover:text-slate-900 hover:bg-white/5 transition-all">
            Media Tools
          </a>
          <a href="#features" className="px-3 py-1.5 rounded-lg hover:text-white light:hover:text-slate-900 hover:bg-white/5 transition-all">
            Features
          </a>
          <a href="#faq" className="px-3 py-1.5 rounded-lg hover:text-white light:hover:text-slate-900 hover:bg-white/5 transition-all">
            FAQ
          </a>
        </nav>

        {/* Right actions */}
        <div className="flex items-center space-x-3">
          {/* Health indicator badge */}
          <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-medium text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping opacity-75" />
            <Activity className="w-3 h-3 text-emerald-400" />
            <span>{systemHealth?.ffmpeg_available ? 'FFmpeg 9.0 Online' : 'System Ready'}</span>
          </div>

          {/* Download History Button */}
          <button
            onClick={onOpenHistory}
            className="relative flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 transition-all light:bg-slate-100 light:hover:bg-slate-200 light:text-slate-700 light:border-slate-300"
            title="Download History"
          >
            <History className="w-4 h-4 text-indigo-400 light:text-indigo-600" />
            <span className="hidden sm:inline">History</span>
            {historyCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-indigo-500 text-white">
                {historyCount}
              </span>
            )}
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all light:bg-slate-100 light:hover:bg-slate-200 light:text-slate-700 light:border-slate-300"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>

          {/* Safe Badge */}
          <div className="hidden xl:flex items-center space-x-1 text-slate-400 text-xs pl-2 border-l border-white/10">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span className="text-[11px]">100% Secure</span>
          </div>
        </div>
      </div>
    </header>
  );
};
