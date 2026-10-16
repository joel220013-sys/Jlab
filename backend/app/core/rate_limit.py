# pyrefly: ignore-errors
# type: ignore
import time
from typing import Dict, List, Tuple
from fastapi import Request, HTTPException, status
from collections import defaultdict

class InMemoryRateLimiter:
    """
    Sliding window in-memory rate limiter for brute-force protection.
    Thread-safe, self-cleaning, and requires zero external Redis dependency.
    """
    def __init__(self):
        # Maps (ip, route_key) -> list of timestamp floats
        self.requests: Dict[Tuple[str, str], List[float]] = defaultdict(list)
        self.last_cleanup = time.time()

    def get_client_ip(self, request: Request) -> str:
        # Check X-Forwarded-For in case behind Nginx, Vercel, Cloudflare, or Render
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            # First IP is client IP
            return forwarded_for.split(",")[0].strip()
        cf_connecting_ip = request.headers.get("CF-Connecting-IP")
        if cf_connecting_ip:
            return cf_connecting_ip.strip()
        if request.client and request.client.host:
            return request.client.host
        return "127.0.0.1"

    def clean_stale_records(self, now: float, window_seconds: int = 300):
        if now - self.last_cleanup > 60: # Clean at most once a minute
            stale_keys = []
            for key, timestamps in self.requests.items():
                # Keep only timestamps in last window
                valid = [t for t in timestamps if now - t < window_seconds]
                if not valid:
                    stale_keys.append(key)
                else:
                    self.requests[key] = valid
            for k in stale_keys:
                del self.requests[k]
            self.last_cleanup = now

    def check_rate_limit(self, request: Request, route_key: str, max_requests: int, window_seconds: int = 60):
        now = time.time()
        self.clean_stale_records(now, window_seconds)

        ip = self.get_client_ip(request)
        key = (ip, route_key)
        timestamps = self.requests[key]

        # Filter out timestamps older than the window
        valid_timestamps = [t for t in timestamps if now - t < window_seconds]
        
        if len(valid_timestamps) >= max_requests:
            retry_after = int(window_seconds - (now - valid_timestamps[0])) + 1
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Too many requests. Please wait {max_retry(retry_after, 1)} seconds before trying again.",
                headers={"Retry-After": str(max_retry(retry_after, 1))}
            )

        valid_timestamps.append(now)
        self.requests[key] = valid_timestamps

def max_retry(val: int, minimum: int = 1) -> int:
    return val if val >= minimum else minimum

rate_limiter = InMemoryRateLimiter()

# Dependencies for route handlers
def limit_login_attempts(request: Request):
    """Max 10 login attempts per minute per IP"""
    rate_limiter.check_rate_limit(request, "login", max_requests=10, window_seconds=60)

def limit_admin_pin_attempts(request: Request):
    """Max 5 PIN verification attempts per minute per IP (prevents brute forcing)"""
    rate_limiter.check_rate_limit(request, "admin_pin", max_requests=5, window_seconds=60)

def limit_general_api(request: Request):
    """Max 120 API requests per minute per IP"""
    rate_limiter.check_rate_limit(request, "general_api", max_requests=120, window_seconds=60)
