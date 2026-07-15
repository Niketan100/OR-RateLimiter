# OR-RateLimiter

Simple in-memory rate limiter with tier-based limits.

## Features
- Configurable limits per tier (for example: `premium`, `free`, `anonymous`)
- Per-user request tracking
- Anonymous request handling
- Runtime tier limit updates (for example, changing premium limits)

## Example
```python
from rate_limiter import TieredRateLimiter

limiter = TieredRateLimiter(
    tier_limits={"anonymous": 2, "free": 5, "premium": 10},
    window_seconds=60,
)

limiter.register_user("u1", "premium")
limiter.allow_request("u1")       # True
limiter.allow_request(None)       # True (anonymous)
```

## Run tests
```bash
python -m unittest discover -v
```