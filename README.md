# 🚦 OR RateLimiter

<p align="center">

A production-ready, flexible, and highly configurable rate limiting library for Express applications with pluggable storage backends and multiple rate limiting algorithms.

</p>

<p align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-yellow?style=for-the-badge)
![Node](https://img.shields.io/badge/node-%3E%3D18-green?style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-Ready-3178C6?style=for-the-badge)

</p>

---

# ✨ Why OR RateLimiter?

Most rate limiters only support a single strategy.

**OR RateLimiter** lets you choose the right algorithm for your application while keeping the API simple.

Perfect for:

- REST APIs
- SaaS products
- Authentication endpoints
- Public APIs
- Internal services
- Microservices

---

# ✨ Features

- ⚡ Extremely fast
- 🔥 Multiple rate limiting algorithms
- 🗄️ Memory & Redis support
- 🔌 Pluggable custom storage
- 🎯 Tier-based limits
- 👤 Custom user resolution
- 📦 Express middleware
- 📊 Standard RateLimit headers
- 💙 Full TypeScript support
- ✅ Production ready
- 🧪 Fully tested
- 🪶 Lightweight with minimal overhead

---

# 📚 Table of Contents

- Installation
- Quick Start
- Algorithms
- Storage Backends
- Configuration
- Advanced Usage
- Response Headers
- Performance
- Roadmap
- Contributing
- License

---

# 📦 Installation

```bash
npm install rate-limiter-oss
```

or


### Peer Dependencies

```bash
npm install express
```



---

# 🚀 Quick Start

```javascript
import express from "express";
import {
  SmartRateLimiter,
  MemoryStore
} from "or-rate-limiter";

const app = express();

const limiter = new SmartRateLimiter({
  store: new MemoryStore(),

  userResolver(req) {
    return {
      id: req.ip,
      tier: "anonymous"
    };
  },

  tiers: {
    anonymous: {
      limit: 10,
      window: 60000,
      algorithm: "sliding-window-counter"
    }
  }
});

app.use(limiter.middleware());

app.listen(3000);
```

---

# 👥 Tier Based Rate Limiting

Different users can have different limits.

```javascript
const limiter = new SmartRateLimiter({

  userResolver(req) {

    const apiKey = req.headers["x-api-key"];

    if (apiKey === "premium-key") {
      return {
        id: apiKey,
        tier: "premium"
      };
    }

    return {
      id: req.ip,
      tier: "free"
    };
  },

  tiers: {

    premium: {
      limit: 100,
      window: 60000,
      algorithm: "token-bucket",
      burst: 20
    },

    free: {
      limit: 20,
      window: 60000,
      algorithm: "sliding-window-counter"
    }

  }

});
```

---

# ⚙️ Supported Algorithms

| Algorithm | Best For |
|------------|----------|
| Fixed Window | Simple applications |
| Sliding Window Counter | General APIs |
| Sliding Window Log | High accuracy |
| Token Bucket | Bursty traffic |
| Leaky Bucket | Smooth traffic |

---

# 🗄️ Storage Backends

| Store | Development | Production |
|---------|:----------:|:----------:|
| MemoryStore | ✅ | ❌ |
| RedisStore | ✅ | ✅ |
| Custom Store | ✅ | ✅ |

Example:

```javascript
new MemoryStore();
```

or

```javascript
new RedisStore({
    client: redis
});
```

---

# ⚙️ Configuration

| Option | Description | Default |
|----------|-------------|----------|
| store | Storage backend | MemoryStore |
| userResolver | Resolve current user | req.ip |
| tiers | Tier configuration | Required |
| headers | Send RateLimit headers | true |
| skip | Skip limiter | false |
| onLimitReached | Callback | undefined |

---

# 📊 Response Headers

```http
X-RateLimit-Limit
X-RateLimit-Remaining
X-RateLimit-Reset
Retry-After
```

Example response

```
HTTP/1.1 429 Too Many Requests

Retry-After: 25

X-RateLimit-Limit: 20
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1712345678
```

---

# 🎯 Advanced Usage

## Skip Health Checks

```javascript
skip: (req) => req.path === "/health"
```

---

## Custom Key Generator

```javascript
userResolver(req) {

    return {
        id: req.headers["x-api-key"],
        tier: "premium"
    };

}
```

---

## Limit Reached Callback

```javascript
onLimitReached(user, result) {

    console.log(`${user.id} exceeded the limit`);

}
```

---

# 📈 Performance

| Store | Requests/sec |
|---------|-------------:|
| Memory | ~50,000 |
| Redis | ~30,000 |

Benchmarks were executed using Node.js with concurrent requests on a local machine.

---

# 🛣️ Roadmap

- [x] Memory Store
- [x] Redis Store
- [x] Multiple Algorithms
- [x] Tier Based Limits
- [x] Custom User Resolver
- [ ] Redis Cluster
- [ ] Metrics Dashboard
- [ ] Prometheus Support
- [ ] Distributed Token Bucket
- [ ] Rate Limiting Analytics

---

# 🤝 Contributing

Contributions are always welcome.

1. Fork the repository

2. Create a feature branch

```bash
git checkout -b feature/amazing-feature
```

3. Commit your changes

```bash
git commit -m "Add amazing feature"
```

4. Push your branch

```bash
git push origin feature/amazing-feature
```

5. Open a Pull Request

---

# 📄 License

Licensed under the MIT License.

---

# ⭐ Support

If OR RateLimiter helps your project, consider giving the repository a ⭐ on GitHub.

Open source survives because developers occasionally click one shiny star instead of opening another tab. A strange but effective ecosystem.
