@echo off
title MediaFlow Residential Backend & Tunnel
cd /d "c:\ytdownloader"
echo Starting MediaFlow Local Residential Backend & Cloudflare Tunnel...
python start_tunnel_backend.py
pause
