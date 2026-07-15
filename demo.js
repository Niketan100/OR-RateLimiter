const express = require('express');
const { SmartRateLimiter, MemoryStore } = require('./dist');

const app = express();

// Create store reference so we can inspect it
const store = new MemoryStore();

const limiter = new SmartRateLimiter({
  userResolver: (req) => {
    const apiKey = req.headers['x-api-key'];
    
    const users = {
      'premium-key': { id: 'user-premium-1', tier: 'premium' },
      'basic-key': { id: 'user-basic-1', tier: 'basic' }
    };
    
    if (apiKey && users[apiKey]) {
      return users[apiKey];
    }
    
    return {
      id: req.ip || '127.0.0.1',
      tier: 'anonymous'
    };
  },
  
  tiers: {
    'premium': {
      limit: 100,
      window: 60000,
      algorithm: 'token-bucket',
      burst: 20
    },
    'basic': {
      limit: 30,
      window: 60000,
      algorithm: 'sliding-window-counter'
    },
    'anonymous': {
      limit: 5,
      window: 60000,
      algorithm: 'token-bucket',
      burst: 5
    }
  },
  
  store: store,
  headers: true,
  
  onLimitReached: (user, result) => {
    console.log(`\n🔴 RATE LIMIT HIT!`);
    console.log(`   User: ${user.id} (${user.tier})`);
    console.log(`   Retry after: ${result.retryAfter}ms`);
  }
});

app.use(limiter.middleware());

app.get('/api/test', (req, res) => {
  console.log(`\n✅ Request: ${req.rateLimit?.userTier} - Remaining: ${req.rateLimit?.remaining}/${req.rateLimit?.limit}`);
  
  res.json({
    message: 'Request allowed!',
    tier: req.rateLimit?.userTier,
    remaining: req.rateLimit?.remaining,
    limit: req.rateLimit?.limit
  });
});

// Debug endpoint
app.get('/debug/store', (req, res) => {
  const storeData = store.getStore();
  const debugInfo = {};
  
  storeData.forEach((value, key) => {
    const shortKey = key.substring(0, 80) + '...';
    debugInfo[shortKey] = {
      data: value.data,
      ttl: Math.max(0, value.expiry - Date.now()),
      expiresIn: Math.ceil((value.expiry - Date.now()) / 1000) + 's'
    };
  });
  
  res.json({
    totalKeys: storeData.size,
    store: debugInfo
  });
});

// Recover tokens
app.post('/debug/recover', express.json(), (req, res) => {
  const { tier, amount } = req.body;
  const storeData = store.getStore();
  
  let recovered = false;
  storeData.forEach((value, key) => {
    if (key.includes(`tier:${tier}`) && value.data.tokens !== undefined) {
      value.data.tokens = Math.min(value.data.tokens + (amount || 3), 5);
      recovered = true;
      console.log(`🔧 Recovered tokens for ${tier}: now ${value.data.tokens}`);
    }
  });
  
  res.json({ recovered });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}\n`);
});
