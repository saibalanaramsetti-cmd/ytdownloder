import hmac
import hashlib
import time
import socket
import ipaddress
from urllib.parse import urlparse
from typing import Tuple, Optional
from fastapi import HTTPException, Request, status
from .config import settings

BLOCKED_NETWORKS = [
    ipaddress.ip_network("0.0.0.0/8"),
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("100.64.0.0/10"),
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("169.254.0.0/16"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.0.0.0/24"),
    ipaddress.ip_network("192.0.2.0/24"),
    ipaddress.ip_network("192.88.99.0/24"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("198.18.0.0/15"),
    ipaddress.ip_network("198.51.100.0/24"),
    ipaddress.ip_network("203.0.113.0/24"),
    ipaddress.ip_network("224.0.0.0/4"),
    ipaddress.ip_network("240.0.0.0/4"),
    ipaddress.ip_network("255.255.255.255/32"),
    ipaddress.ip_network("::/128"),
    ipaddress.ip_network("::1/128"),
    ipaddress.ip_network("fc00::/7"),
    ipaddress.ip_network("fe80::/10"),
]

def is_ip_blocked(ip_str: str) -> bool:
    try:
        ip = ipaddress.ip_address(ip_str)
        if ip.is_loopback or ip.is_private or ip.is_link_local or ip.is_reserved or ip.is_multicast:
            return True
        for net in BLOCKED_NETWORKS:
            if ip in net:
                return True
        return False
    except ValueError:
        return True

def validate_url_security(url: str) -> Tuple[bool, str]:
    if not url or not isinstance(url, str):
        return False, "URL must be a non-empty string"
    
    url = url.strip()
    if len(url) > 2048:
        return False, "URL length exceeds 2048 characters"
        
    try:
        parsed = urlparse(url)
    except Exception as e:
        return False, f"Invalid URL syntax: {str(e)}"
        
    if parsed.scheme not in ("http", "https"):
        return False, "Only HTTP and HTTPS protocols are allowed"
        
    hostname = parsed.hostname
    if not hostname:
        return False, "URL is missing a valid hostname"
        
    hostname_lower = hostname.lower()
    blocked_hosts = {
        "localhost", "127.0.0.1", "::1", "0.0.0.0",
        "instance-data", "metadata.google.internal",
        "169.254.169.254", "metadata"
    }
    if hostname_lower in blocked_hosts or hostname_lower.endswith(".local") or hostname_lower.endswith(".internal"):
        return False, f"Host '{hostname}' is an internal or disallowed address"
        
    if parsed.port:
        if parsed.port not in (80, 443, 8000, 8080):
            return False, f"Port {parsed.port} is not permitted"
            
    try:
        resolved_ips = socket.getaddrinfo(hostname, None)
        for res in resolved_ips:
            ip_candidate = res[4][0]
            if is_ip_blocked(ip_candidate):
                return False, f"Resolved IP {ip_candidate} is restricted (private/internal network)"
    except socket.gaierror:
        return False, f"Unable to resolve domain '{hostname}'"
    except Exception as e:
        return False, f"DNS resolution error: {str(e)}"
        
    return True, "Valid"

def generate_download_token(job_id: str, filename: str, expires_at: int) -> str:
    message = f"{job_id}:{filename}:{expires_at}".encode('utf-8')
    sig = hmac.new(settings.SECRET_KEY.encode('utf-8'), message, hashlib.sha256).hexdigest()
    return f"{job_id}.{expires_at}.{sig}"

def verify_download_token(token: str, filename: str) -> Tuple[bool, Optional[str]]:
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return False, "Malformed token format"
        job_id, exp_str, sig = parts
        expires_at = int(exp_str)
        
        now = int(time.time())
        if now > expires_at:
            return False, "Download link has expired"
            
        expected_token = generate_download_token(job_id, filename, expires_at)
        expected_sig = expected_token.split(".")[2]
        
        if not hmac.compare_digest(sig, expected_sig):
            return False, "Invalid cryptographic token signature"
            
        return True, job_id
    except Exception as e:
        return False, f"Token validation error: {str(e)}"

class InMemoryRateLimiter:
    def __init__(self, requests_per_minute: int = 60):
        self.rpm = requests_per_minute
        self.clients: dict = {}
        
    def is_allowed(self, client_ip: str) -> bool:
        now = time.time()
        minute_ago = now - 60
        timestamps = self.clients.get(client_ip, [])
        valid_timestamps = [t for t in timestamps if t > minute_ago]
        if len(valid_timestamps) >= self.rpm:
            self.clients[client_ip] = valid_timestamps
            return False
        valid_timestamps.append(now)
        self.clients[client_ip] = valid_timestamps
        return True

rate_limiter = InMemoryRateLimiter(settings.MAX_REQUESTS_PER_MINUTE)

def check_rate_limit(request: Request):
    client_ip = request.client.host if request.client else "unknown"
    if not rate_limiter.is_allowed(client_ip):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Please wait a moment before sending more requests."
        )
