import React, { useState } from 'react';
import { MediaMetadata, VideoFormat, CreateJobPayload } from '../types/media';
import { Film, Music, Image as ImageIcon, Subtitles, Download, VolumeX } from 'lucide-react';

interface FormatSelectorProps {
  metadata: MediaMetadata;
  onStartJob: (payload: CreateJobPayload) => void;
  isProcessing: boolean;
}

type TabType = 'video' | 'audio' | 'subtitles' | 'thumbnail';

export const FormatSelector: React.FC<FormatSelectorProps> = ({ metadata, onStartJob, isProcessing }) => {
  const [activeTab, setActiveTab] = useState<TabType>('video');
  const [targetContainer, setTargetContainer] = useState<string>('mp4');
  const [includeAudio, setIncludeAudio] = useState<boolean>(true);

  // Group and sort video formats cleanly
  const sortedVideoFormats = [...metadata.video_formats].sort((a, b) => {
    return (b.height || 0) - (a.height || 0);
  });

  const handleDownloadVideo = (format: VideoFormat) => {
    onStartJob({
      url: metadata.webpage_url,
      media_type: 'video',
      format_id: format.format_id,
      target_ext: targetContainer,
      target_quality: format.quality_label || format.resolution,
    });
  };

  const handleDownloadAudio = (ext: string, bitrate: string) => {
    onStartJob({
      url: metadata.webpage_url,
      media_type: 'audio',
      target_ext: ext,
      audio_bitrate: bitrate,
      target_quality: `${bitrate} Audio`,
    });
  };

  const handleDownloadThumbnail = () => {
    onStartJob({
      url: metadata.webpage_url,
      media_type: 'thumbnail',
      target_ext: 'jpg',
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 mb-12" id="converter">
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl">
        {/* Tab Headers */}
        <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-4 mb-6">
          <button
            onClick={() => setActiveTab('video')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
              activeTab === 'video'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Film className="w-4 h-4" />
            <span>Video & Formats</span>
            <span className="px-1.5 py-0.5 rounded-md bg-white/10 text-[10px]">
              {sortedVideoFormats.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('audio')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
              activeTab === 'audio'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Music className="w-4 h-4" />
            <span>Extract Audio (MP3/FLAC)</span>
          </button>

          <button
            onClick={() => setActiveTab('subtitles')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
              activeTab === 'subtitles'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Subtitles className="w-4 h-4" />
            <span>Subtitles ({metadata.subtitles.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('thumbnail')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
              activeTab === 'thumbnail'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>HD Thumbnail</span>
          </button>
        </div>

        {/* Tab 1: Video Format Options */}
        {activeTab === 'video' && (
          <div>
            {/* Container format toggles */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-4 border-b border-white/5">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-slate-400">Target Container:</span>
                {['mp4', 'webm', 'mkv'].map((container) => (
                  <button
                    key={container}
                    onClick={() => setTargetContainer(container)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold uppercase transition-all ${
                      targetContainer === container
                        ? 'bg-indigo-500 text-white'
                        : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200'
                    }`}
                  >
                    {container}
                  </button>
                ))}
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIncludeAudio(!includeAudio)}
                  className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    !includeAudio
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-white/5 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  <VolumeX className="w-3.5 h-3.5" />
                  <span>{includeAudio ? 'Audio Included' : 'Mute Audio Track'}</span>
                </button>
              </div>
            </div>

            {/* List of video formats */}
            <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
              {sortedVideoFormats.length > 0 ? (
                sortedVideoFormats.map((fmt) => {
                  const isUltraHd = (fmt.height || 0) >= 2160;
                  const is2K = (fmt.height || 0) >= 1440 && (fmt.height || 0) < 2160;
                  const is1080 = (fmt.height || 0) >= 1080 && (fmt.height || 0) < 1440;
                  const isHighFps = (fmt.fps || 0) >= 50;

                  return (
                    <div
                      key={fmt.format_id}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all group gap-3"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-extrabold text-xs">
                          {fmt.height ? `${fmt.height}p` : fmt.resolution}
                        </div>

                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-bold text-white light:text-slate-900">
                              {fmt.resolution} {targetContainer.toUpperCase()}
                            </span>

                            {isUltraHd && (
                              <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-extrabold uppercase border border-amber-500/30">
                                4K UHD
                              </span>
                            )}
                            {is2K && (
                              <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 text-[10px] font-extrabold uppercase border border-purple-500/30">
                                2K QHD
                              </span>
                            )}
                            {is1080 && (
                              <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 text-[10px] font-extrabold uppercase border border-cyan-500/30">
                                Full HD
                              </span>
                            )}
                            {isHighFps && (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                                {fmt.fps}fps
                              </span>
                            )}
                          </div>

                          <div className="flex items-center space-x-2 text-xs text-slate-400 mt-0.5">
                            <span>Codec: {fmt.vcodec?.split('.')[0] || 'Auto H.264'}</span>
                            <span>•</span>
                            <span>{fmt.filesize_str || 'Estimated size'}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDownloadVideo(fmt)}
                        disabled={isProcessing}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition-all flex items-center justify-center space-x-1.5 shadow-md shadow-indigo-600/20"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download {fmt.height ? `${fmt.height}p` : ''}</span>
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-slate-400">
                  Direct media stream ready. Click to process.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Audio Extraction Options */}
        {activeTab === 'audio' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-400">
              Extract high-fidelity audio tracks directly from the source media, converted via FFmpeg with ID3 tags and album cover preserved.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { format: 'mp3', bitrate: '320k', label: 'MP3 320 kbps', badge: 'Ultra Quality', desc: 'Highest MP3 bitrate, studio sound' },
                { format: 'mp3', bitrate: '256k', label: 'MP3 256 kbps', badge: 'High Quality', desc: 'Optimal fidelity and portable size' },
                { format: 'mp3', bitrate: '192k', label: 'MP3 192 kbps', badge: 'Standard', desc: 'Standard quality for podcasts & voice' },
                { format: 'flac', bitrate: 'lossless', label: 'FLAC Lossless', badge: 'Audiophile', desc: 'Pure uncompressed acoustic stream' },
                { format: 'm4a', bitrate: '256k', label: 'M4A / AAC', badge: 'Apple Native', desc: 'Crystal clear Apple ecosystem playback' },
                { format: 'wav', bitrate: 'uncompressed', label: 'WAV PCM', badge: 'Studio Master', desc: 'Uncompressed waveform for audio editing' },
              ].map((item) => (
                <div
                  key={item.label}
                  className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-indigo-500/30 transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-white light:text-slate-900">{item.label}</span>
                      <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 text-[10px] font-bold">
                        {item.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mb-4">{item.desc}</p>
                  </div>

                  <button
                    onClick={() => handleDownloadAudio(item.format, item.bitrate)}
                    disabled={isProcessing}
                    className="w-full py-2.5 rounded-xl font-bold text-xs text-white bg-indigo-600/90 hover:bg-indigo-600 transition-all flex items-center justify-center space-x-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Convert to {item.format.toUpperCase()}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Subtitles / Captions */}
        {activeTab === 'subtitles' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-400">
              Download clean SubRip (.SRT) or WebVTT subtitles and transcriptions for this media.
            </p>

            {metadata.subtitles.length > 0 ? (
              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                {metadata.subtitles.map((sub) => (
                  <div
                    key={`${sub.lang}-${sub.name}`}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all"
                  >
                    <div className="flex items-center space-x-3">
                      <Subtitles className="w-5 h-5 text-indigo-400" />
                      <div>
                        <span className="text-sm font-bold text-white light:text-slate-900">
                          {sub.name} ({sub.lang.toUpperCase()})
                        </span>
                        {sub.is_auto && (
                          <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                            Auto-generated
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        onStartJob({
                          url: metadata.webpage_url,
                          media_type: 'subtitle',
                          target_ext: 'srt',
                          subtitle_lang: sub.lang,
                        });
                      }}
                      disabled={isProcessing}
                      className="px-4 py-1.5 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-500 transition-all flex items-center space-x-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download .SRT</span>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-white/5 text-center text-slate-400 text-sm">
                No embedded or auto-generated subtitle tracks found for this specific media.
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Thumbnail extraction */}
        {activeTab === 'thumbnail' && (
          <div className="space-y-4 text-center">
            <p className="text-xs text-slate-400">
              Extract maximum resolution thumbnail poster image in high-quality JPEG or WebP format.
            </p>

            {metadata.thumbnail && (
              <div className="max-w-md mx-auto rounded-2xl overflow-hidden border border-white/10 shadow-lg">
                <img src={metadata.thumbnail} alt="Poster" className="w-full object-cover" />
              </div>
            )}

            <button
              onClick={handleDownloadThumbnail}
              disabled={isProcessing}
              className="px-6 py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 transition-all inline-flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Download Ultra HD Thumbnail (JPG)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
