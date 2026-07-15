import unittest

from rate_limiter import TieredRateLimiter


class TieredRateLimiterTests(unittest.TestCase):
    def setUp(self) -> None:
        self.limiter = TieredRateLimiter(
            tier_limits={"anonymous": 2, "free": 3, "premium": 5},
            window_seconds=60,
        )
        self.limiter.register_user("premium_user", "premium")
        self.limiter.register_user("free_user", "free")

    def test_applies_limits_by_user_tier(self) -> None:
        for _ in range(5):
            self.assertTrue(self.limiter.allow_request("premium_user", now=1))
        self.assertFalse(self.limiter.allow_request("premium_user", now=1))

        for _ in range(3):
            self.assertTrue(self.limiter.allow_request("free_user", now=1))
        self.assertFalse(self.limiter.allow_request("free_user", now=1))

    def test_uses_anonymous_limit_for_unknown_or_missing_user(self) -> None:
        self.assertTrue(self.limiter.allow_request(None, now=1))
        self.assertTrue(self.limiter.allow_request(None, now=1))
        self.assertFalse(self.limiter.allow_request(None, now=1))

        self.assertTrue(self.limiter.allow_request("unknown_user", now=10))
        self.assertTrue(self.limiter.allow_request("unknown_user", now=10))
        self.assertFalse(self.limiter.allow_request("unknown_user", now=10))

    def test_premium_limit_can_be_changed(self) -> None:
        self.limiter.set_tier_limit("premium", 2)
        self.assertTrue(self.limiter.allow_request("premium_user", now=1))
        self.assertTrue(self.limiter.allow_request("premium_user", now=1))
        self.assertFalse(self.limiter.allow_request("premium_user", now=1))

    def test_window_resets_after_expiry(self) -> None:
        self.assertTrue(self.limiter.allow_request("free_user", now=1))
        self.assertTrue(self.limiter.allow_request("free_user", now=1))
        self.assertTrue(self.limiter.allow_request("free_user", now=1))
        self.assertFalse(self.limiter.allow_request("free_user", now=1))

        self.assertTrue(self.limiter.allow_request("free_user", now=62))


if __name__ == "__main__":
    unittest.main()
