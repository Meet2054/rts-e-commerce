#!/bin/bash

echo "🚀 Redis Cache Flow Testing Script"
echo "=================================="

BASE_URL="http://localhost:3000/api/test-redis"

echo ""
echo "1️⃣  Testing basic Redis connection..."
curl -s "$BASE_URL" | jq '.'

echo ""
echo "2️⃣  First request (should fetch from DB and cache it)..."
curl -s "$BASE_URL?test=cache-flow&productId=43852" | jq '.'

echo ""
echo "3️⃣  Second request (should fetch from Redis cache - much faster!)..."
curl -s "$BASE_URL?test=cache-flow&productId=43852" | jq '.'

echo ""
echo "4️⃣  Clearing cache..."
curl -s -X DELETE "$BASE_URL?productId=43852" | jq '.'

echo ""
echo "5️⃣  Third request after cache clear (should fetch from DB again)..."
curl -s "$BASE_URL?test=cache-flow&productId=43852" | jq '.'

echo ""
echo "6️⃣  Fourth request (should be from cache again)..."
curl -s "$BASE_URL?test=cache-flow&productId=43852" | jq '.'

echo ""
echo "✅ Test completed! Check the console logs for detailed step-by-step flow."
