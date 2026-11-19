import React from 'react';
import { Zap, ShieldCheck, Sparkles, Layers, Sliders, Smartphone } from 'lucide-react';

export const FeaturesSection: React.FC = () => {
  const features = [
    {
      icon: Zap,
      title: 'Ultra-Fast FFmpeg 9.0 Core',
      desc: 'Harness multi-threaded hardware acceleration to transcode, mux, and repackage video streams in milliseconds.',
    },
    {
      icon: Layers,
      title: 'Pristine Lossless Quality',
      desc: 'Direct stream passthrough whenever possible. No unnecessary re-encoding, preserving pure 4K 60fps and 320kbps audio.',
    },
    {
      icon: ShieldCheck,
      title: 'Zero Ads & Private by Design',
      desc: 'No popups, redirects, or malicious trackers. Temporary files are cryptographically signed and auto-deleted after 1 hour.',
    },
    {
      icon: Smartphone,
      title: 'Universal Cross-Device Support',
      desc: 'Seamlessly works across iOS Safari, Android Chrome, macOS, Windows, and Linux with built-in QR mobile handover.',
    },
    {
      icon: Sliders,
      title: 'Precision Trimming & Filters',
      desc: 'Slice exact clips, boost audio volume, adjust framerates, or create looping animated GIFs directly in your browser.',
    },
    {
      icon: Sparkles,
      title: 'Asynchronous Job Queue',
      desc: 'Powered by scalable Redis worker queues and Server-Sent Events with live progress bars and automatic cancellation.',
    },
  ];

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16" id="features">
      <div className="p-8 sm:p-12 rounded-3xl glass-panel border border-white/10 relative overflow-hidden">
        {/* Glow corner */}
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">
            Engineered for High Performance
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white light:text-slate-900 tracking-tight mt-2 mb-4">
            Why Professionals Choose MediaFlow
          </h2>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Built from the ground up to replace clunky, ad-infested downloaders with a high-speed, secure, and modern cloud processing experience.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="flex items-start space-x-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 flex-shrink-0 mt-1">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white light:text-slate-900 mb-1">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
