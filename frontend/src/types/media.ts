export interface VideoFormat {
  format_id: string;
  ext: string;
  resolution: string;
  height?: number;
  width?: number;
  fps?: number;
  filesize?: number;
  filesize_str?: string;
  vcodec?: string;
  acodec?: string;
  tbr?: number;
  quality_label: string;
  has_audio: boolean;
  has_video: boolean;
}

export interface AudioFormat {
  format_id: string;
  ext: string;
  abr?: number;
  filesize?: number;
  filesize_str?: string;
  acodec?: string;
  quality_label: string;
}

export interface SubtitleTrack {
  lang: string;
  name: string;
  ext: string;
  is_auto: boolean;
}

export interface MediaMetadata {
  id: string;
  title: string;
  webpage_url: string;
  description?: string;
  duration?: number;
  duration_str?: string;
  thumbnail?: string;
  author?: string;
  channel_url?: string;
  view_count?: number;
  like_count?: number;
  upload_date?: string;
  extractor: string;
  extractor_key: string;
  video_formats: VideoFormat[];
  audio_formats: AudioFormat[];
  subtitles: SubtitleTrack[];
}

export type JobMediaType = 'video' | 'audio' | 'subtitle' | 'thumbnail' | 'trim' | 'gif' | 'compress';

export interface CreateJobPayload {
  url: string;
  media_type: JobMediaType;
  format_id?: string;
  target_ext: string;
  target_quality?: string;
  trim_start?: string; // e.g. "00:00:10" or seconds "10"
  trim_end?: string;
  subtitle_lang?: string;
  audio_bitrate?: string; // e.g. "320k"
  compress_crf?: number; // e.g. 28
}

export type JobState = 'queued' | 'downloading' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface JobProgress {
  job_id: string;
  status: JobState;
  progress: number; // 0 to 100
  phase: string;
  speed?: string;
  eta?: string;
  message?: string;
  file_name?: string;
  file_size?: number;
  file_size_str?: string;
  download_url?: string;
  checksum?: string;
  expires_in_seconds?: number;
  error?: string;
  created_at: string;
  finished_at?: string;
}

export interface HistoryItem {
  job_id: string;
  title: string;
  thumbnail?: string;
  target_ext: string;
  quality_label: string;
  media_type: JobMediaType;
  file_size_str?: string;
  download_url: string;
  completed_at: string;
  source_url: string;
}

export interface SystemHealth {
  status: string;
  ffmpeg_available: boolean;
  ffmpeg_version?: string;
  storage_type: string;
  queue_type: string;
  active_jobs: number;
  uptime_seconds: number;
}
