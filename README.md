🔒 API Rate Limiter
A robust, flexible rate limiting middleware for Node.js applications with support for memory, Redis, and custom stores.

https://badge.fury.io/js/rate-limiter.svg
https://img.shields.io/badge/License-MIT-yellow.svg
https://img.shields.io/badge/PRs-welcome-brightgreen.svg

✨ Features
🚀 Multiple Store Support - Memory, Redis, and custom stores

🎯 Flexible Configuration - Custom limits, windows, and key generators

🛡️ Protection - Against brute force, DDoS, and API abuse

📊 Rate Limit Headers - Standard X-RateLimit-* headers

🔧 Extensible - Easy to add custom stores and handlers

🎨 Clean API - Express/Connect compatible middleware

⚡ Performance - Optimized with minimal overhead

📦 Installation
bash
npm install @yourusername/rate-limiter
# or
yarn add @yourusername/rate-limiter
🚀 Quick Start
Basic Usage with Memory Store
javascript
import express from 'express';
import { RateLimiter, MemoryStore } from '@yourusername/rate-limiter';

const app = express();

const limiter = new RateLimiter({
  store: new MemoryStore(),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests, please try again later.',
  statusCode: 429,
});

app.use(limiter.middleware());

app.get('/api', (req, res) => {
  res.json({ message: 'You are within rate limits!' });
});
Redis Store (Production Ready)
javascript
import Redis from 'ioredis';
import { RateLimiter, RedisStore } from '@yourusername/rate-limiter';

const redis = new Redis({
  host: 'localhost',
  port: 6379,
});

const limiter = new RateLimiter({
  store: new RedisStore(redis),
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
});
📚 API Documentation
Constructor Options
Option	Type	Default	Description
store	Store	MemoryStore	Storage backend for rate limiting
windowMs	number	60000	Time window in milliseconds
max	number	5	Maximum requests per window
message	string|object	'Too many requests'	Response body when rate limited
statusCode	number	429	HTTP status code when rate limited
keyGenerator	function	(req) => req.ip	Generate unique key for each client
skip	function	() => false	Skip rate limiting for certain requests
handler	function	Default handler	Custom handler when rate limited
onLimitReached	function	null	Callback when limit is reached
skipSuccessfulRequests	boolean	false	Don't count successful responses
skipFailedRequests	boolean	false	Don't count failed responses
Methods
middleware()
Returns Express/Connect middleware function.

reset(key: string)
Reset rate limit for a specific key.

getClient(key: string)
Get current rate limit status for a client.

getStore()
Get the underlying store instance.

🎯 Advanced Usage
Custom Key Generator
javascript
const limiter = new RateLimiter({
  store: new RedisStore(redis),
  keyGenerator: (req) => {
    return req.user?.id || req.ip; // Use user ID if authenticated
  },
});
Skip Logic
javascript
const limiter = new RateLimiter({
  store: new MemoryStore(),
  skip: (req) => {
    // Skip rate limiting for admin users
    return req.user?.role === 'admin';
  },
});
Custom Handler
javascript
const limiter = new RateLimiter({
  store: new MemoryStore(),
  handler: (req, res, next) => {
    res.status(429).json({
      error: 'Rate limit exceeded',
      retryAfter: Math.ceil(limiter.windowMs / 1000),
    });
  },
});
Different Limits for Different Routes
javascript
// Strict limit for auth endpoints
const authLimiter = new RateLimiter({
  store: new RedisStore(redis),
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 attempts per 15 minutes
});

// Loose limit for public endpoints
const publicLimiter = new RateLimiter({
  store: new RedisStore(redis),
  windowMs: 60 * 1000,
  max: 100,
});

app.use('/api/auth', authLimiter.middleware());
app.use('/api/public', publicLimiter.middleware());
🛠️ Custom Stores
Implement your own store by extending the Store class:

javascript
class CustomStore extends Store {
  async increment(key, windowMs) {
    // Return { totalHits, resetTime }
  }
  
  async decrement(key) {
    // Optional: Decrement counter
  }
  
  async reset(key) {
    // Reset counter for a key
  }
  
  async get(key) {
    // Get current count
  }
}
📊 Rate Limit Headers
The middleware automatically adds these headers to all responses:

X-RateLimit-Limit - Max requests per window

X-RateLimit-Remaining - Remaining requests

X-RateLimit-Reset - Reset timestamp (UTC epoch seconds)

Retry-After - Seconds until reset (when rate limited)

🧪 Testing
bash
npm test
🤝 Contributing
Contributions are welcome! Please read our Contributing Guide.

Fork the repository

Create your feature branch (git checkout -b feature/amazing-feature)

Commit your changes (git commit -m 'Add amazing feature')

Push to the branch (git push origin feature/amazing-feature)

Open a Pull Request

📄 License
MIT © [Your Name]

🚀 Package.json
json
{
  "name": "@yourusername/rate-limiter",
  "version": "1.0.0",
  "description": "A robust, flexible rate limiting middleware for Node.js",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "test": "jest",
    "lint": "eslint src/**/*.ts",
    "prepublishOnly": "npm run build"
  },
  "keywords": [
    "rate-limiter",
    "rate-limiting",
    "middleware",
    "express",
    "redis",
    "security",
    "ddos-protection"
  ],
  "author": "Your Name <your.email@example.com>",
  "license": "MIT",
  "devDependencies": {
    "@types/express": "^4.17.17",
    "@types/jest": "^29.5.0",
    "@types/node": "^18.15.0",
    "@typescript-eslint/eslint-plugin": "^5.54.0",
    "@typescript-eslint/parser": "^5.54.0",
    "eslint": "^8.36.0",
    "jest": "^29.5.0",
    "ts-jest": "^29.0.5",
    "typescript": "^4.9.5"
  },
  "dependencies": {
    "express": "^4.18.2"
  },
  "peerDependencies": {
    "express": "^4.0.0"
  }
}
🏗️ Project Structure
text
rate-limiter/
├── src/
│   ├── core/
│   │   ├── RateLimiter.ts
│   │   └── Store.ts
│   ├── stores/
│   │   ├── MemoryStore.ts
│   │   └── RedisStore.ts
│   ├── types/
│   │   └── index.ts
│   └── index.ts
├── tests/
│   ├── unit/
│   └── integration/
├── examples/
│   ├── basic-usage.js
│   └── redis-usage.js
├── .github/
│   └── workflows/
│       └── ci.yml
├── .gitignore
├── LICENSE
├── README.md
├── CONTRIBUTING.md
├── package.json
└── tsconfig.json
📝 Example Usage with TypeScript
typescript
import express from 'express';
import { RateLimiter, RedisStore } from '@yourusername/rate-limiter';
import Redis from 'ioredis';

const app = express();
const redis = new Redis();

const limiter = new RateLimiter({
  store: new RedisStore(redis),
  windowMs: 60000,
  max: 10,
  keyGenerator: (req: express.Request) => {
    return req.headers['x-api-key'] as string || req.ip;
  },
});

app.use(limiter.middleware());
