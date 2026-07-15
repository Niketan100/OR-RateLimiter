from __future__ import annotations

from dataclasses import dataclass
from time import time


@dataclass
class _WindowCounter:
    window_start: float
    count: int


class TieredRateLimiter:
    def __init__(
        self,
        tier_limits: dict[str, int],
        window_seconds: int = 60,
        default_tier: str = "anonymous",
    ) -> None:
        if window_seconds <= 0:
            raise ValueError("window_seconds must be greater than 0")
        if default_tier not in tier_limits:
            raise ValueError("default_tier must exist in tier_limits")
        for tier, limit in tier_limits.items():
            if limit <= 0:
                raise ValueError(f"limit for tier '{tier}' must be greater than 0")

        self.tier_limits = dict(tier_limits)
        self.window_seconds = window_seconds
        self.default_tier = default_tier
        self.user_tiers: dict[str, str] = {}
        self.counters: dict[str, _WindowCounter] = {}

    def register_user(self, user_id: str, tier: str) -> None:
        if tier not in self.tier_limits:
            raise ValueError(f"unknown tier '{tier}'")
        self.user_tiers[user_id] = tier

    def set_tier_limit(self, tier: str, limit: int) -> None:
        if limit <= 0:
            raise ValueError("limit must be greater than 0")
        self.tier_limits[tier] = limit

    def allow_request(self, user_id: str | None, now: float | None = None) -> bool:
        current_time = time() if now is None else now
        counter_key = self._counter_key(user_id)
        tier = self._resolve_tier(user_id)
        limit = self.tier_limits[tier]
        counter = self.counters.get(counter_key)

        if counter is None or current_time - counter.window_start >= self.window_seconds:
            counter = _WindowCounter(window_start=current_time, count=0)
            self.counters[counter_key] = counter

        if counter.count >= limit:
            return False

        counter.count += 1
        return True

    def _resolve_tier(self, user_id: str | None) -> str:
        if user_id is None:
            return self.default_tier
        return self.user_tiers.get(user_id, self.default_tier)

    @staticmethod
    def _counter_key(user_id: str | None) -> str:
        return user_id or "__anonymous__"
