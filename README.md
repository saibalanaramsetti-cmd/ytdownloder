# MediaFlow – Premium Online Media Downloader & Converter

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI_0.115+-009688.svg?logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React_19_TypeScript-61DAFB.svg?logo=react)](https://react.dev)
[![FFmpeg](https://img.shields.io/badge/Engine-FFmpeg_9.0-007808.svg?logo=ffmpeg)](https://ffmpeg.org)
[![Tailwind CSS](https://img.shields.io/badge/Styles-Tailwind_Glassmorphism-38B2AC.svg?logo=tailwind-css)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A production-oriented, responsive online media processing platform inspired by high-end modern UX principles. MediaFlow provides a glassmorphism dark/light interface to analyze, transcode, trim, convert, and enhance authorized public media streams with zero quality degradation.

---

## 🌟 Key Features

### 1. Unified Downloader & Transcoder
- **4K UHD, 2K QHD & 1080p 60fps**: Full container support for MP4 (H.264/AAC), WebM (VP9/Opus), and MKV.
- **Audiophile Audio Extraction**: Studio-grade MP3 (320kbps, 256kbps, 192kbps), FLAC lossless, Apple M4A/AAC, and WAV PCM.
- **SubRip (.SRT) & WebVTT Captions**: Multi-language subtitle extraction and auto-caption download.
- **HD Poster Grabber**: Original high-resolution video thumbnail grabber (WebP / JPG).

### 2. Built-in Professional Media Tools
- **Millisecond-Accurate Video Trimmer**: Cut, slice, and export timestamp segments without re-encoding.
- **Audio Booster**: Normalize audio gain up to +12dB with FFmpeg volume normalization.
- **Animated GIF Maker**: Two-pass palette generation for smooth 15/24fps animated GIF loops.
- **Smart Video Compressor**: Reduce file sizes by up to 80% using H.264 CRF variable bitrate tuning.

### 3. Asynchronous Job Processing & Live Telemetry
- **Hardware-Accelerated FFmpeg Pipeline**: Long-running conversions run in background workers, never inside HTTP handlers.
- **Real-Time Progress Streaming**: Server-Sent Events (SSE) with millisecond progress bars, encoding speed (e.g. `2.4x`), and ETA countdowns.
- **Job Cancellation & Retry**: Full user control to safely terminate running subprocesses.
- **QR Code Mobile Handover**: Instant QR code generation to transfer download streams to iOS Safari or Android phones.
- **Persistent Local History**: Download registry stored in browser localStorage with quick re-download links.

---

## 🛡️ Security & Privacy Architecture

- **Strict SSRF Protection**:
  - Validates URLs against private RFC1918 subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`).
  - Blocks loopback (`127.0.0.0/8`, `::1`), link-local (`169.254.0.0/16`), and AWS/GCP cloud metadata endpoints.
  - Performs pre-flight DNS resolution before allowing media probes.
- **Cryptographically Signed Download URLs**:
  - Temporary download URLs are protected by HMAC-SHA256 signatures with timestamped expiration (`DOWNLOAD_TTL_SECONDS = 3600`).
  - Tamper-proof validation guarantees unauthorized access denial.
- **Automatic File Cleanup**:
  - Background task scans and permanently purges processed files older than 1 hour.
- **Rate Limiting**:
  - Per-IP sliding-window rate limiting to prevent denial-of-service attempts.

---

## 🏗️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite 6, Tailwind CSS 3, Lucide Icons |
| **Backend** | Python 3.12+, FastAPI, SQLAlchemy, SQLite (standard) / PostgreSQL (production) |
| **Workers & Queue** | Distributed Redis Queue / AsyncIO Multi-Worker Queue |
| **Media Processing** | FFmpeg 9.0 Core, `yt-dlp`, `mutagen`, `Pillow` |
| **Infrastructure** | Docker, Multi-Stage Dockerfile, Docker Compose, Nginx Alpine |

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Python 3.10+ (Python 3.12 or 3.14 recommended)
- Node.js 18+ & npm

### 1. Start the Backend API Server
```bash
cd backend
python -m pip install -r requirements.txt
python run.py
```
*The FastAPI server starts at `http://localhost:8000` with interactive API documentation at `http://localhost:8000/docs`.*

### 2. Start the Frontend Dev Server
```bash
cd frontend
npm install
npm run dev
```
*The Vite development server runs at `http://localhost:3000` with live proxying to the backend API.*

### 3. Production Build & Unified Serving
You can also run both frontend and backend through FastAPI as a single application:
```bash
cd frontend
npm run build
cd ../backend
python run.py
```
*Access `http://localhost:8000` to view the full application.*

---

## 🐳 Docker & Docker Compose Deployment

Run the complete multi-container production stack (PostgreSQL, Redis, FastAPI backend workers, and Nginx frontend):

```bash
docker compose up -d --build
```

- **Frontend Application**: `http://localhost`
- **Backend API Docs**: `http://localhost:8000/docs`
- **Health Check**: `http://localhost:8000/api/health`

---

## 🧪 Testing

Run backend unit and security tests:
```bash
cd backend
python -m pytest tests/test_api.py -v
```

---

## 📜 Compliance & Fair Use Notice

MediaFlow is strictly designed for processing public media files, authorized personal streams, and content that users have direct permissions or rights to access. MediaFlow does not circumvent DRM, bypass copyright protection, or defeat platform paywalls.
