const express = require('express');
const { SmartRateLimiter, MemoryStore } = require('./dist');

const app = express();

// Create store reference so we can inspect it
const store = new MemoryStore();

const limiter = new SmartRateLimiter({
  userResolver: (req) => {
    const apiKey = req.headers['x-api-key'];
    
    const users = {
      'premium-key': { id: 'user-premium-1', tier: 'premium', metadata: { plan: 'enterprise' } },
      'basic-key': { id: 'user-basic-1', tier: 'basic', metadata: { plan: 'starter' } }
    };
    
    if (apiKey && users[apiKey]) {
      return users[apiKey];
    }
    
    // Return detailed user info for anonymous
    return {
      id: req.ip || '127.0.0.1',
      tier: 'anonymous',
      metadata: {
        userAgent: req.headers['user-agent']?.substring(0, 50),
        ip: req.ip
      }
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
      algorithm: 'token-bucket',  // Changed to token-bucket so we can see refills!
      burst: 5
    }
  },
  
  store: store,  // Pass our custom store
  headers: true,
  
  // Callback when limit is hit
  onLimitReached: (user, result) => {
    console.log(`\n🔴 RATE LIMIT HIT!`);
    console.log(`   User: ${user.id} (${user.tier})`);
    console.log(`   Retry after: ${result.retryAfter}ms`);
    console.log(`   Resets at: ${new Date(result.reset).toLocaleTimeString()}`);
  }
});

// Rate limit middleware
app.use(limiter.middleware());

// Test endpoint
app.get('/api/test', (req, res) => {
  console.log(`\n✅ Request allowed for ${req.rateLimit?.userTier} (${req.rateLimit?.userId})`);
  console.log(`   Remaining: ${req.rateLimit?.remaining}/${req.rateLimit?.limit}`);
  
  res.json({
    message: 'Request allowed!',
    tier: req.rateLimit?.userTier,
    userId: req.rateLimit?.userId,
    remaining: req.rateLimit?.remaining,
    limit: req.rateLimit?.limit,
    retryAfter: req.rateLimit?.retryAfter,
    resetAt: new Date(req.rateLimit?.reset).toLocaleTimeString()
  });
});

// 🔍 DEBUG ENDPOINT - See internal state
app.get('/debug/store', (req, res) => {
  const storeData = store.getStore(); // We'll add this method
  res.json({
    totalKeys: Object.keys(storeData).length,
    store: storeData
  });
});

// 🔍 DEBUG - See specific user's bucket
app.get('/debug/user/:tier', (req, res) => {
  const tier = req.params.tier;
  const storeData = store.getStore();
  
  const userKeys = Object.keys(storeData).filter(key => key.includes(`tier:${tier}`));
  const userData = {};
  
  userKeys.forEach(key => {
    userData[key] = storeData[key];
  });
  
  res.json({
    tier,
    keysFound: userKeys.length,
    data: userData
  });
});

// 🔍 DEBUG - Simulate and recover
app.post('/debug/recover', express.json(), (req, res) => {
  const { tier, userId, amount } = req.body;
  
  // Find the key for this user
  const storeData = store.getStore();
  const userKey = Object.keys(storeData).find(key => 
    key.includes(`tier:${tier}`) && key.includes(`user:${userId}`)
  );
  
  if (userKey && storeData[userKey]) {
    // Recover tokens by resetting the bucket
    const data = storeData[userKey].data;
    if (data.tokens !== undefined) {
      data.tokens = Math.min(data.tokens + (amount || 5), data.tokens + 5);
      console.log(`\n🔧 Recovered ${amount || 5} tokens for ${userId} (${tier})`);
      console.log(`   New token count: ${data.tokens}`);
      res.json({ recovered: true, tokens: data.tokens });
    } else if (data.count !== undefined) {
      data.count = Math.max(0, data.count - (amount || 5));
      console.log(`\n🔧 Reduced count by ${amount || 5} for ${userId} (${tier})`);
      res.json({ recovered: true, count: data.count });
    } else {
      res.json({ recovered: false, reason: 'Unknown data structure' });
    }
  } else {
    res.json({ recovered: false, reason: 'User not found in store' });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log('\n📊 Test endpoints:');
  console.log('  GET  /api/test          - Normal endpoint');
  console.log('  GET  /debug/store        - See ALL internal state');
  console.log('  GET  /debug/user/:tier   - See specific tier state');
  console.log('  POST /debug/recover      - Recover tokens for a user\n');
});
