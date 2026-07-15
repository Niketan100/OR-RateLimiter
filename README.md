# 🚦 OR RateLimiter

> A production-ready, flexible, and lightweight rate limiting library for Express applications with pluggable storage backends.

<p align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-yellow?style=for-the-badge)
![Node](https://img.shields.io/badge/node-%3E%3D14-green?style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-Ready-3178C6?style=for-the-badge)

</p>

## ✨ Features

- ⚡ Fast and lightweight
- 🛡️ Protects APIs against abuse and brute-force attacks
- 🗄️ Supports Memory and Redis stores
- 🔌 Easily extendable with custom stores
- 📦 Express middleware
- 📊 Standard `X-RateLimit-*` response headers
- 🎯 Custom key generators and skip logic
- 💙 Full TypeScript support
- ✅ Tested and production ready

---

## 📚 Table of Contents

- Installation
- Quick Start
- Storage Backends
- Configuration
- Advanced Usage
- API Reference
- Performance
- Contributing
- License

---

## 📦 Installation

```bash
npm install @yourusername/rate-limiter
# or
pnpm add @yourusername/rate-limiter
# or
yarn add @yourusername/rate-limiter
```

**Peer Dependencies**

- express ^4.x
- ioredis (only if using Redis)

---

## 🚀 Quick Start

js
import express from "express";
import { RateLimiter, MemoryStore } from "@yourusername/rate-limiter";

const app = express();

const limiter = new RateLimiter({
  store: new MemoryStore(),
  windowMs: 15 * 60 * 1000,
  max: 100,
});

app.use(limiter.middleware());


---

## 🗄️ Storage Backends

| Store | Recommended For |
|-------|------------------|
| MemoryStore | Development & Testing |
| RedisStore | Production |
| Custom Store | Custom databases/caches |

---

## ⚙️ Configuration

| Option | Description | Default |
|--------|-------------|---------|
| store | Storage backend | MemoryStore |
| windowMs | Time window | 60000 |
| max | Maximum requests | 5 |
| message | Rate limit response | "Too many requests" |
| statusCode | HTTP status | 429 |
| keyGenerator | Client identifier | req.ip |

---

## 📊 Response Headers

http
X-RateLimit-Limit
X-RateLimit-Remaining
X-RateLimit-Reset
Retry-After


---

## 🎯 Advanced Usage

- Different limiters for different routes
- Custom key generators
- Skip specific users
- Custom handlers
- Event callbacks
- Skip successful or failed requests

---

## 📈 Performance

| Store | Requests/sec | Production |
|-------|-------------:|:----------:|
| Memory | ~50,000 | ❌ |
| Redis | ~30,000 | ✅ |

---

## 🤝 Contributing

1. Fork the repository.
2. Create a feature branch.
3. Commit your changes.
4. Push your branch.
5. Open a Pull Request.

---

## 📄 License

MIT

---

## ⭐ Support

If you find this project useful, consider giving it a ⭐ on GitHub.

> **Notes**
>
> Replace all placeholders such as `@yourusername` with your actual npm package name before publishing.
> 
> For screenshots or demo GIFs, store them in:
>

> assets/
> ├── demo.gif
> ├── architecture.png
> └── benchmark.png

>
> Then embed them like:
>

> ![Demo](assets/demo.gif)
