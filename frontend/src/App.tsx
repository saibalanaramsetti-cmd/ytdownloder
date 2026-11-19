import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { UrlInputBar } from './components/UrlInputBar';
import { SupportedSources } from './components/SupportedSources';
import { MediaPreviewCard } from './components/MediaPreviewCard';
import { FormatSelector } from './components/FormatSelector';
import { ProcessingProgress } from './components/ProcessingProgress';
import { DownloadResultCard } from './components/DownloadResultCard';
import { MediaToolsSection } from './components/MediaToolsSection';
import { FeaturesSection } from './components/FeaturesSection';
import { FaqSection } from './components/FaqSection';
import { Footer } from './components/Footer';
import { DownloadHistoryModal } from './components/DownloadHistoryModal';
import { QrCodeModal } from './components/QrCodeModal';
import { VideoTrimmerModal } from './components/VideoTrimmerModal';
import { api } from './services/api';
import { MediaMetadata, JobProgress, CreateJobPayload, HistoryItem, SystemHealth } from './types/media';

export const App: React.FC = () => {
  const [url, setUrl] = useState<string>('');
  const [isLoadingMetadata, setIsLoadingMetadata] = useState<boolean>(false);
  const [metadata, setMetadata] = useState<MediaMetadata | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Active Job states
  const [activeJob, setActiveJob] = useState<JobProgress | null>(null);
  const [completedResult, setCompletedResult] = useState<JobProgress | null>(null);
  const [lastJobPayload, setLastJobPayload] = useState<CreateJobPayload | null>(null);

  // Modals & History
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('mediaflow_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [isTrimmerOpen, setIsTrimmerOpen] = useState<boolean>(false);

  // System Health
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);

  // Cleanup reference for SSE listener
  const unsubscribeJobRef = useRef<(() => void) | null>(null);

  // Fetch system health on mount
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const health = await api.getHealth();
        setSystemHealth(health);
      } catch (e) {
        console.warn('Backend offline or initializing', e);
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  // Save history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('mediaflow_history', JSON.stringify(history));
    } catch (e) {
      console.error('Failed to save history', e);
    }
  }, [history]);

  // Clean up SSE subscription on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeJobRef.current) {
        unsubscribeJobRef.current();
      }
    };
  }, []);

  // Fetch metadata handler
  const handleFetchMetadata = async (targetUrl: string) => {
    setError(null);
    setIsLoadingMetadata(true);
    setCompletedResult(null);

    try {
      const meta = await api.fetchMetadata(targetUrl);
      setMetadata(meta);
      // Auto-scroll down to preview card
      setTimeout(() => {
        const el = document.getElementById('media-preview');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err: any) {
      setError(err.message || 'Unable to analyze media URL. Please ensure it is a valid, publicly accessible media link.');
      setMetadata(null);
    } finally {
      setIsLoadingMetadata(false);
    }
  };

  // Start conversion / processing job
  const handleStartJob = async (payload: CreateJobPayload) => {
    setError(null);
    setLastJobPayload(payload);
    setCompletedResult(null);

    // Cancel existing subscription if any
    if (unsubscribeJobRef.current) {
      unsubscribeJobRef.current();
      unsubscribeJobRef.current = null;
    }

    try {
      // Create job in backend
      const initialJob = await api.createJob(payload);
      setActiveJob(initialJob);

      // Subscribe to real-time progress updates
      const unsub = api.subscribeJobProgress(
        initialJob.job_id,
        (updatedProgress) => {
          setActiveJob(updatedProgress);

          if (updatedProgress.status === 'completed') {
            setCompletedResult(updatedProgress);
            setActiveJob(null);

            // Add to history
            const historyEntry: HistoryItem = {
              job_id: updatedProgress.job_id,
              title: metadata?.title || updatedProgress.file_name || 'Processed Media',
              thumbnail: metadata?.thumbnail,
              target_ext: payload.target_ext,
              quality_label: payload.target_quality || payload.target_ext.toUpperCase(),
              media_type: payload.media_type,
              file_size_str: updatedProgress.file_size_str,
              download_url: updatedProgress.download_url || '',
              completed_at: new Date().toISOString(),
              source_url: payload.url,
            };

            setHistory((prev) => [historyEntry, ...prev.slice(0, 49)]);
          } else if (updatedProgress.status === 'failed') {
            setError(updatedProgress.error || 'Media conversion process encountered a failure.');
          }
        },
        (err) => {
          console.error('Job subscription error', err);
        }
      );

      unsubscribeJobRef.current = unsub;
    } catch (err: any) {
      setError(err.message || 'Failed to initiate media conversion task.');
      setActiveJob(null);
    }
  };

  // Cancel active job
  const handleCancelJob = async () => {
    if (!activeJob) return;
    try {
      await api.cancelJob(activeJob.job_id);
      setActiveJob((prev) => (prev ? { ...prev, status: 'cancelled', message: 'Cancelled by user.' } : null));
      if (unsubscribeJobRef.current) {
        unsubscribeJobRef.current();
        unsubscribeJobRef.current = null;
      }
    } catch (err: any) {
      console.error('Cancel job error', err);
    }
  };

  // Retry last job
  const handleRetryJob = () => {
    if (lastJobPayload) {
      handleStartJob(lastJobPayload);
    }
  };

  // Reset to initial state
  const handleReset = () => {
    setMetadata(null);
    setActiveJob(null);
    setCompletedResult(null);
    setError(null);
    setUrl('');
    if (unsubscribeJobRef.current) {
      unsubscribeJobRef.current();
      unsubscribeJobRef.current = null;
    }
  };

  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem('mediaflow_history');
  };

  const handleSelectTool = (toolId: string) => {
    if (toolId === 'video-trimmer') {
      if (metadata) {
        setIsTrimmerOpen(true);
      } else {
        setError('Please enter or select a media link above first to trim video timestamps.');
      }
    } else if (toolId === 'video-to-mp3') {
      const converter = document.getElementById('converter');
      if (converter) converter.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f19] text-slate-100 selection:bg-indigo-500/30 selection:text-indigo-200 transition-colors dark:bg-[#0b0f19] light:bg-[#f8fafc] light:text-slate-800">
      {/* Navigation */}
      <Navbar
        onOpenHistory={() => setIsHistoryOpen(true)}
        historyCount={history.length}
        systemHealth={systemHealth}
        onSelectTool={handleSelectTool}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {/* Hero Section */}
        <HeroSection />

        {/* Input Bar */}
        <UrlInputBar
          url={url}
          setUrl={setUrl}
          onFetch={handleFetchMetadata}
          isLoading={isLoadingMetadata}
          error={error}
          onClearError={() => setError(null)}
        />

        {/* Supported Sources Indicators */}
        <SupportedSources />

        {/* Processing Progress (When Active) */}
        {activeJob && (
          <ProcessingProgress
            progress={activeJob}
            onCancel={handleCancelJob}
            onRetry={handleRetryJob}
          />
        )}

        {/* Download Result Card (When Ready) */}
        {completedResult && (
          <DownloadResultCard
            result={completedResult}
            onOpenQr={(qrUrl) => setQrCodeUrl(qrUrl)}
            onReset={handleReset}
            onOpenTrimmer={metadata ? () => setIsTrimmerOpen(true) : undefined}
          />
        )}

        {/* Media Preview Card */}
        {metadata && (
          <div id="media-preview">
            <MediaPreviewCard
              metadata={metadata}
              onOpenTrimmer={() => setIsTrimmerOpen(true)}
            />

            {/* Format Selector Cards */}
            <FormatSelector
              metadata={metadata}
              onStartJob={handleStartJob}
              isProcessing={!!activeJob && activeJob.status !== 'failed' && activeJob.status !== 'cancelled'}
            />
          </div>
        )}

        {/* Media Tools Section */}
        <MediaToolsSection onSelectTool={handleSelectTool} />

        {/* Features Section */}
        <FeaturesSection />

        {/* FAQ Section */}
        <FaqSection />
      </main>

      {/* Footer */}
      <Footer systemHealth={systemHealth} />

      {/* Modals */}
      <DownloadHistoryModal
        history={history}
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onClearHistory={handleClearHistory}
      />

      <QrCodeModal
        url={qrCodeUrl}
        isOpen={!!qrCodeUrl}
        onClose={() => setQrCodeUrl(null)}
      />

      {metadata && (
        <VideoTrimmerModal
          metadata={metadata}
          isOpen={isTrimmerOpen}
          onClose={() => setIsTrimmerOpen(false)}
          onSubmitTrim={handleStartJob}
        />
      )}
    </div>
  );
};
