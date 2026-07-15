# Rate Limiter OSS

Smart, plug-and-play rate limiter with dynamic user-based tier system.

## Features

- 🎯 **Smart User Detection** - Auto-detect user type and apply appropriate limits
- 📊 **Multiple Algorithms** - Token Bucket, Leaky Bucket, Fixed Window, Sliding Window
- 🗄️ **Flexible Storage** - In-memory, Redis, or custom stores
- 🚦 **Tier-based Limiting** - Different limits for different user types
- 🛣️ **Route-specific Rules** - Custom limits per endpoint
- 📈 **Quota System** - Daily, hourly, monthly quotas
- 🔌 **Framework Agnostic** - Express, Koa, Fastify, Next.js support
- 🚀 **Zero Config** - Works out of the box with smart defaults

## Installation

```bash
npm install rate-limiter-oss
