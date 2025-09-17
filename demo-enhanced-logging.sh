#!/bin/bash

echo "🎯 Enhanced Redis Cache Logging Demo"
echo "===================================="
echo ""

echo "This demo shows detailed console logs that track:"
echo "- When data is fetched from Redis cache (fast)"
echo "- When data is fetched from Firebase database (slower)" 
echo "- When Redis database is updated with Firebase data"
echo ""

BASE_URL="http://localhost:3000"

echo "📋 Step 1: Clear any existing cache"
curl -s -X DELETE "$BASE_URL/api/test-redis?productId=0np8KgXvTIysNnwzSOaX" > /dev/null
echo "✅ Cache cleared"
echo ""

echo "📋 Step 2: First request - should fetch from Firebase and update Redis"
echo "Watch the console logs for detailed flow..."
curl -s "$BASE_URL/api/test-redis?test=cache-flow&productId=0np8KgXvTIysNnwzSOaX" | jq -r '.message + " (Total: " + .totalTime + ")"'
echo ""

echo "📋 Step 3: Second request - should fetch from Redis cache (much faster)"
echo "Watch the console logs for cache hit..."  
curl -s "$BASE_URL/api/test-redis?test=cache-flow&productId=0np8KgXvTIysNnwzSOaX" | jq -r '.message + " (Total: " + .totalTime + ")"'
echo ""

echo "📋 Step 4: Test Products API - first request from Firebase"
echo "Watch the console logs for products list caching..."
curl -s "$BASE_URL/api/products?pageSize=3" | jq -r '.source + " (" + (.products | length | tostring) + " products)"'
echo ""

echo "📋 Step 5: Test Products API - second request from Redis"
echo "Watch the console logs for products list cache hit..."
curl -s "$BASE_URL/api/products?pageSize=3" | jq -r '.source + " (" + (.products | length | tostring) + " products)"'
echo ""

echo "🎯 Demo Complete!"
echo ""
echo "Console Log Symbols Guide:"
echo "🔍 [REDIS] - Redis cache operations"  
echo "✅ [REDIS] - Cache hit (data found)"
echo "❌ [REDIS] - Cache miss (data not found)"
echo "📊 [FIREBASE] - Firebase database operations"
echo "💾 [CACHE UPDATE] - Data cached from Firebase to Redis"
echo "🎯 [SUMMARY] - Operation summary"
echo ""
echo "Check your Next.js terminal for detailed step-by-step logs!"
