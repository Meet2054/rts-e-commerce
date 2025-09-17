#!/bin/bash

# Redis Startup Check Script
echo "🔍 Checking Redis availability..."

# Check if Redis is installed
if ! command -v redis-server &> /dev/null; then
    echo "❌ Redis server is not installed"
    echo "📋 Install Redis:"
    echo "   macOS: brew install redis"
    echo "   Ubuntu: sudo apt-get install redis-server"
    echo "   Windows: Download from https://redis.io/download"
    exit 1
fi

# Check if port 6379 is available
if lsof -Pi :6379 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️  Port 6379 is already in use"
    echo "📋 Either:"
    echo "   - Stop existing Redis: redis-cli shutdown"
    echo "   - Use 'npm run dev:next-only' if Redis is already running"
    echo "   - Kill process: lsof -ti :6379 | xargs kill -9"
else
    echo "✅ Port 6379 is available"
fi

# Test Redis connection if running
if redis-cli ping >/dev/null 2>&1; then
    echo "✅ Redis is responding to ping"
    echo "📊 Redis info:"
    redis-cli info server | grep redis_version
else
    echo "📍 Redis is not currently running (will start with npm run dev)"
fi

echo ""
echo "🚀 Ready to start development servers!"
echo "Run: npm run dev"
