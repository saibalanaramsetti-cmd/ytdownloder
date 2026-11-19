import { MediaMetadata, CreateJobPayload, JobProgress, SystemHealth } from '../types/media';

const API_BASE = (((import.meta as any).env?.VITE_API_URL || (import.meta as any).env?.VITE_API_BASE_URL || '/api') as string).replace(/\/$/, '');

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (netErr: any) {
    throw new ApiError(
      'Network connection failed. Ensure the backend server is running at http://localhost:8000',
      0
    );
  }

  if (!response.ok) {
    let errorDetail = `Request failed with status ${response.status}`;
    try {
      const text = await response.text();
      try {
        const errJson = JSON.parse(text);
        if (typeof errJson.detail === 'string') {
          errorDetail = errJson.detail;
        } else if (Array.isArray(errJson.detail)) {
          errorDetail = errJson.detail.map((e: any) => e.msg || e.message || JSON.stringify(e)).join('; ');
        } else if (errJson.message) {
          errorDetail = errJson.message;
        }
      } catch {
        // If text response mentions ECONNREFUSED or proxy error
        if (response.status === 405) {
          errorDetail = 'Backend API is not running on Vercel (405). Vercel only serves the frontend UI. Please connect your backend using VITE_API_URL or deploy the backend to Render/Railway.';
        } else if (text.includes('ECONNREFUSED') || text.includes('proxy error') || response.status === 500 || response.status === 502) {
          errorDetail = 'Backend server is unreachable. Please verify that the FastAPI backend is running.';
        } else if (text.length > 0 && text.length < 300) {
          errorDetail = text;
        }
      }
    } catch {
      // ignore
    }
    throw new ApiError(errorDetail, response.status);
  }

  return response.json();
}

export const api = {
  async getHealth(): Promise<SystemHealth> {
    return request<SystemHealth>('/health');
  },

  async validateUrl(url: string): Promise<{ valid: boolean; normalized_url?: string; reason?: string }> {
    return request<{ valid: boolean; normalized_url?: string; reason?: string }>('/media/validate', {
      method: 'POST',
      body: JSON.stringify({ url }),
    });
  },

  async fetchMetadata(url: string): Promise<MediaMetadata> {
    return request<MediaMetadata>('/media/info', {
      method: 'POST',
      body: JSON.stringify({ url }),
    });
  },

  async createJob(payload: CreateJobPayload): Promise<JobProgress> {
    return request<JobProgress>('/jobs/create', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getJobStatus(jobId: string): Promise<JobProgress> {
    return request<JobProgress>(`/jobs/${jobId}`);
  },

  async cancelJob(jobId: string): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(`/jobs/${jobId}/cancel`, {
      method: 'POST',
    });
  },

  subscribeJobProgress(jobId: string, onUpdate: (progress: JobProgress) => void, onError: (err: any) => void): () => void {
    let sseSource: EventSource | null = null;
    let pollInterval: any = null;
    let isTerminated = false;

    try {
      sseSource = new EventSource(`${API_BASE}/jobs/${jobId}/events`);

      sseSource.onmessage = (event) => {
        try {
          const data: JobProgress = JSON.parse(event.data);
          onUpdate(data);
          if (data.status === 'completed' || data.status === 'failed' || data.status === 'cancelled') {
            sseSource?.close();
          }
        } catch (e) {
          console.error("Error parsing SSE job progress", e);
        }
      };

      sseSource.onerror = (e) => {
        if (!isTerminated && !pollInterval) {
          console.warn("SSE connection interrupted, falling back to polling", e);
          sseSource?.close();
          pollInterval = setInterval(async () => {
            try {
              const res = await api.getJobStatus(jobId);
              onUpdate(res);
              if (res.status === 'completed' || res.status === 'failed' || res.status === 'cancelled') {
                clearInterval(pollInterval);
              }
            } catch (pollErr) {
              onError(pollErr);
              clearInterval(pollInterval);
            }
          }, 1200);
        }
      };
    } catch {
      pollInterval = setInterval(async () => {
        try {
          const res = await api.getJobStatus(jobId);
          onUpdate(res);
          if (res.status === 'completed' || res.status === 'failed' || res.status === 'cancelled') {
            clearInterval(pollInterval);
          }
        } catch (pollErr) {
          onError(pollErr);
          clearInterval(pollInterval);
        }
      }, 1200);
    }

    return () => {
      isTerminated = true;
      if (sseSource) sseSource.close();
      if (pollInterval) clearInterval(pollInterval);
    };
  }
};
