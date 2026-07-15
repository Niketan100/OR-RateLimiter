# 1. Test Premium User - should handle 20 requests easily (limit is 100/min with 20 burst)
echo "=== Premium User: 25 Rapid Requests ==="
for i in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25; do 
  echo -n "Request $i: "
  curl -s -H "x-api-key: premium-key" http://localhost:3000/api/test
  echo ""
done

# 2. Check premium user's bucket state
echo ""
echo "=== Premium User Store ==="
curl -s http://localhost:3000/debug/store | python3 -m json.tool

# 3. Compare: Anonymous vs Premium side by side
echo ""
echo "=== Anonymous User ==="
curl -s http://localhost:3000/api/test
echo ""

echo "=== Premium User ==="
curl -s -H "x-api-key: premium-key" http://localhost:3000/api/test
echo ""

# 4. Stress test - 200 requests for premium user
echo ""
echo "=== Premium Stress Test (200 requests) ==="
allowed=0
blocked=0
for i in {1..200}; do
  status=$(curl -s -o /dev/null -w "%{http_code}" -H "x-api-key: premium-key" http://localhost:3000/api/test)
  if [ "$status" = "200" ]; then
    ((allowed++))
  else
    ((blocked++))
  fi
done
echo "Allowed: $allowed"
echo "Blocked: $blocked"

# 5. Check final state
echo ""
echo "=== Final Store State ==="
curl -s http://localhost:3000/debug/store | python3 -m json.tool
