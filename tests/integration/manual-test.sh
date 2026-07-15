#!/bin/bash

echo "🧪 Testing Rate Limiter..."
echo "================================"

# Test 1: Anonymous user hitting limit
echo -e "\n📊 Test 1: Anonymous user (5 req/min)"
for i in {1..7}; do
  echo -n "Request $i: "
  curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/test
  echo ""
  sleep 0.1
done

# Test 2: Premium user
echo -e "\n📊 Test 2: Premium user (100 req/min)"
for i in {1..7}; do
  echo -n "Premium request $i: "
  curl -s -o /dev/null -w "%{http_code}" -H "x-api-key: premium-key" http://localhost:3000/api/test
  echo ""
  sleep 0.1
done

# Test 3: Admin access
echo -e "\n📊 Test 3: Anonymous user blocked from admin"
echo -n "Anonymous admin access: "
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/admin
echo ""

echo -e "\n📊 Test 4: Premium admin access"
echo -n "Premium admin access: "
curl -s -o /dev/null -w "%{http_code}" -H "x-api-key: premium-key" http://localhost:3000/api/admin
echo ""

# Test 5: Headers check
echo -e "\n📊 Test 5: Rate limit headers"
curl -I http://localhost:3000/api/test 2>&1 | grep -i "x-ratelimit"

echo -e "\n✅ Testing complete!"