import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

interface FaqItem {
  q: string;
  a: string;
}

export const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs: FaqItem[] = [
    {
      q: 'What types of media links and formats are supported?',
      a: 'MediaFlow supports direct HTTP/HTTPS media streams (MP4, WebM, MP3, AAC, FLAC, OGG, WAV) as well as authorized public web video and audio links. Output formats include MP4, WebM, MKV up to 4K 60fps, and studio-grade MP3 (320kbps), AAC, FLAC lossless, and SubRip (.SRT) subtitles.',
    },
    {
      q: 'Is MediaFlow free to use, and are there any file size limits?',
      a: 'Yes, MediaFlow is completely free and contains no deceptive advertisements. For security and optimal server throughput, files up to 2GB and up to 3 hours in duration are supported per processing job.',
    },
    {
      q: 'How does MediaFlow protect user privacy and copyright?',
      a: 'MediaFlow strictly adheres to digital copyright laws and platform terms of service. It only processes public, authorized media and does not bypass DRM, encryption, or authentication paywalls. Furthermore, all generated media files are signed with temporary tokens and permanently wiped from our cache after 1 hour.',
    },
    {
      q: 'Can I download videos directly to my iPhone, iPad, or Android phone?',
      a: 'Absolutely! On iOS Safari, tap "Download File Now" and choose "Save to Files" or scan the QR code generated on your desktop screen using your mobile camera. On Android Chrome, files are saved immediately to your device’s Downloads directory.',
    },
    {
      q: 'How does the Video Trimmer & Audio Booster work?',
      a: 'Our trimmer leverages FFmpeg’s millisecond-accurate fast seek mode (`-ss` and `-to`). If the target container matches the source container, stream copying is performed with zero re-encoding time. The audio booster normalizes audio tracks with an integrated volume multiplier filter.',
    },
  ];

  return (
    <section className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-16" id="faq">
      <div className="text-center mb-10">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full glass-panel mb-3 border border-white/10">
          <HelpCircle className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-semibold text-indigo-300">Got Questions?</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white light:text-slate-900 tracking-tight">
          Frequently Asked Questions
        </h2>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={faq.q}
              className="glass-card rounded-2xl border border-white/10 overflow-hidden transition-all"
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="w-full p-5 text-left flex items-center justify-between text-sm sm:text-base font-bold text-white light:text-slate-900 hover:text-indigo-300 transition-colors"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-5 h-5 text-slate-400 transition-transform duration-300 flex-shrink-0 ml-4 ${
                    isOpen ? 'rotate-180 text-indigo-400' : ''
                  }`}
                />
              </button>

              {isOpen && (
                <div className="px-5 pb-5 text-xs sm:text-sm text-slate-400 leading-relaxed border-t border-white/5 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
