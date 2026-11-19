import React from 'react';
import { Music, Scissors, Volume2, Subtitles, Image, Minimize2, Film, ArrowRight, Sparkles } from 'lucide-react';

interface MediaToolsSectionProps {
  onSelectTool: (toolId: string) => void;
}

export const MediaToolsSection: React.FC<MediaToolsSectionProps> = ({ onSelectTool }) => {
  const tools = [
    {
      id: 'video-to-mp3',
      title: 'Video to MP3 Converter',
      desc: 'Convert any online video or stream into 320kbps high-fidelity MP3 with metadata and album artwork.',
      icon: Music,
      gradient: 'from-indigo-500 to-purple-600',
      badge: 'Popular',
    },
    {
      id: 'video-trimmer',
      title: 'Video Trimmer & Cutter',
      desc: 'Cut, slice, and export specific timestamps with millisecond precision without quality loss.',
      icon: Scissors,
      gradient: 'from-purple-500 to-pink-600',
      badge: 'Precise',
    },
    {
      id: 'audio-booster',
      title: 'Audio Extractor & Booster',
      desc: 'Extract FLAC, WAV, AAC, and boost normalized audio gain up to +12dB with FFmpeg volume filter.',
      icon: Volume2,
      gradient: 'from-cyan-500 to-blue-600',
      badge: 'Studio',
    },
    {
      id: 'subtitle-extractor',
      title: 'Subtitle Downloader',
      desc: 'Extract SubRip (.SRT) and WebVTT captions in all available languages, clean and timestamped.',
      icon: Subtitles,
      gradient: 'from-emerald-500 to-teal-600',
      badge: 'Clean SRT',
    },
    {
      id: 'thumbnail-grabber',
      title: 'HD Thumbnail Grabber',
      desc: 'Save original ultra high resolution cover artwork and poster frames in WebP and JPG.',
      icon: Image,
      gradient: 'from-amber-500 to-orange-600',
      badge: '4K Ready',
    },
    {
      id: 'video-compressor',
      title: 'Smart Video Compressor',
      desc: 'Shrink video file sizes by up to 80% using H.264 / AV1 variable bitrate CRF compression.',
      icon: Minimize2,
      gradient: 'from-rose-500 to-red-600',
      badge: 'Save 80%',
    },
    {
      id: 'gif-maker',
      title: 'Animated GIF Creator',
      desc: 'Turn dynamic video moments into smooth, optimized animated GIF loops with custom FPS.',
      icon: Film,
      gradient: 'from-violet-500 to-indigo-600',
      badge: 'Smooth FPS',
    },
  ];

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16" id="tools">
      <div className="text-center max-w-3xl mx-auto mb-12">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full glass-panel mb-4 border border-white/10">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-semibold text-indigo-300">Modular Media Engine</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white light:text-slate-900 tracking-tight mb-4">
          All-in-One Professional Media Tools
        </h2>
        <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
          Everything you need to convert, cut, optimize, and transform your authorized digital media in a single unified interface.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <div
              key={tool.id}
              onClick={() => {
                onSelectTool(tool.id);
                // Scroll up smoothly to input
                const el = document.getElementById('downloader');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="glass-card rounded-3xl p-6 border border-white/10 hover:border-indigo-500/40 transition-all duration-300 hover:-translate-y-1.5 cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${tool.gradient} p-0.5 shadow-lg group-hover:scale-110 transition-transform`}>
                    <div className="w-full h-full bg-[#0b0f19] light:bg-white rounded-[14px] flex items-center justify-center">
                      <Icon className="w-6 h-6 text-white light:text-slate-900" />
                    </div>
                  </div>

                  <span className="px-2.5 py-0.5 rounded-full bg-white/5 group-hover:bg-indigo-500/20 text-slate-300 group-hover:text-indigo-300 text-[11px] font-bold border border-white/10 group-hover:border-indigo-500/30 transition-colors">
                    {tool.badge}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white light:text-slate-900 mb-2 group-hover:text-indigo-300 transition-colors">
                  {tool.title}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-6">
                  {tool.desc}
                </p>
              </div>

              <div className="flex items-center text-xs font-bold text-indigo-400 group-hover:text-indigo-300 transition-colors">
                <span>Launch Tool</span>
                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
