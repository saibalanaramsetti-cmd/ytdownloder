import os
import sys
import re
import time
import json
import subprocess
import threading
from pathlib import Path

BASE_DIR = Path("c:/ytdownloader")
CLOUDFLARED = BASE_DIR / "cloudflared.exe"
VERCEL_JSON = BASE_DIR / "vercel.json"
FRONTEND_VERCEL_JSON = BASE_DIR / "frontend" / "vercel.json"

def run():
    print("=" * 60)
    print("  MediaFlow - Local Residential Backend & Cloudflare Tunnel")
    print("=" * 60)

    # 1. Start local Uvicorn backend
    print("\n[1/3] Starting local FastAPI backend on port 8000...")
    env = os.environ.copy()
    backend_proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"],
        cwd=str(BASE_DIR),
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1
    )

    def log_backend():
        for line in backend_proc.stdout:
            if "Application startup complete" in line or "Uvicorn running" in line or "ERROR" in line:
                print(f"  [Backend] {line.strip()}")

    threading.Thread(target=log_backend, daemon=True).start()
    time.sleep(2)

    # 2. Start Cloudflare Quick Tunnel
    print("\n[2/3] Establishing Cloudflare Quick Tunnel for port 8000...")
    tunnel_proc = subprocess.Popen(
        [str(CLOUDFLARED), "tunnel", "--url", "http://127.0.0.1:8000", "--no-autoupdate"],
        cwd=str(BASE_DIR),
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1
    )

    tunnel_url = None
    url_pattern = re.compile(r"https://[a-zA-Z0-9-]+\.trycloudflare\.com")

    for line in tunnel_proc.stdout:
        m = url_pattern.search(line)
        if m:
            tunnel_url = m.group(0)
            break

    if not tunnel_url:
        print("[ERROR] Could not extract Cloudflare tunnel URL!")
        return

    print(f"\n>>> LIVE TUNNEL URL: {tunnel_url} <<<")

    # 3. Update vercel.json configurations
    print("\n[3/3] Updating Vercel proxy configuration...")
    for v_path in [VERCEL_JSON, FRONTEND_VERCEL_JSON]:
        if v_path.exists():
            try:
                data = json.loads(v_path.read_text(encoding="utf-8"))
                for rule in data.get("rewrites", []):
                    if rule.get("source") == "/api/(.*)":
                        rule["destination"] = f"{tunnel_url}/api/$1"
                v_path.write_text(json.dumps(data, indent=2), encoding="utf-8")
                print(f"  Updated {v_path.name} -> {tunnel_url}/api/$1")
            except Exception as e:
                print(f"  Error updating {v_path}: {e}")

    # 4. Push to GitHub so Vercel deploys to this tunnel
    try:
        subprocess.run(
            ["git", "add", "vercel.json", "frontend/vercel.json"],
            cwd=str(BASE_DIR), check=True
        )
        subprocess.run(
            ["git", "commit", "-m", f"chore: point Vercel API proxy to residential Cloudflare tunnel {tunnel_url}"],
            cwd=str(BASE_DIR), check=True
        )
        subprocess.run(
            ["git", "push", "origin", "main"],
            cwd=str(BASE_DIR), check=True
        )
        print("\n[SUCCESS] Committed and pushed to GitHub! Vercel is now connecting to your local machine.")
    except Exception as e:
        print(f"\n[Git Note] Could not auto-push to GitHub: {e}")

    print("\n" + "=" * 60)
    print(f"  MediaFlow Backend is LIVE & CONNECTED via Residential IP!")
    print(f"  Tunnel URL: {tunnel_url}")
    print(f"  Health Check: {tunnel_url}/api/health")
    print(f"  Keep this window open while downloading media.")
    print("=" * 60 + "\n")

    # Keep alive
    try:
        tunnel_proc.wait()
    except KeyboardInterrupt:
        print("\nStopping services...")
        backend_proc.terminate()
        tunnel_proc.terminate()

if __name__ == "__main__":
    run()
