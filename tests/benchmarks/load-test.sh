#!/bin/bash

echo "🔥 Load Testing Rate Limiter..."
echo "================================"

# Test with Apache Bench if available
if command -v ab &> /dev/null; then
    echo -e "\n📊 Testing with Apache Bench:"
    echo "Anonymous user (should rate limit):"
    ab -n 100 -c 10 http://localhost:3000/api/test
    
    echo -e "\nPremium user (should succeed):"
    ab -n 100 -c 10 -H "x-api-key: premium-key" http://localhost:3000/api/test
else
    echo "Apache Bench not found. Install with: apt-get install apache2-utils"
fi

# Alternative with curl loop
echo -e "\n📊 Sequential load test:"
echo "Sending 50 requests as anonymous user..."

start_time=$(date +%s%N)
blocked=0
allowed=0

for i in {1..50}; do
    response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/test)
    if [ "$response" = "429" ]; then
        ((blocked++))
    else
        ((allowed++))
    fi
done

end_time=$(date +%s%N)
elapsed=$((($end_time - $start_time) / 1000000))

echo "Results:"
echo "  ✅ Allowed: $allowed"
echo "  🚫 Blocked: $blocked"
echo "  ⏱️  Time: ${elapsed}ms"