# Redis Auto-Startup Configuration

This project is configured to automatically start Redis server alongside Next.js development server.

## How it Works

When you run `npm run dev`, it uses `concurrently` to start both:
- **Redis Server** (port 6379) - For caching
- **Next.js Dev Server** (port 3000) - For the web application

## Available Scripts

```bash
# Start both Redis and Next.js (recommended)
npm run dev

# Start only Next.js (if Redis is already running)
npm run dev:next-only

# Start only Redis server
npm run dev:redis

# Start only Next.js dev server
npm run dev:next
```

## Console Output

You'll see color-coded output:
- 🔴 **[REDIS]** - Redis server logs (red)
- 🔵 **[NEXT]** - Next.js dev server logs (cyan)

## Requirements

- Redis installed on your system
- `concurrently` package (installed as dev dependency)

## Troubleshooting

If Redis fails to start:
1. Make sure Redis is installed: `brew install redis` (macOS)
2. Check if port 6379 is available: `lsof -i :6379`
3. Use `npm run dev:next-only` if Redis is running separately

## Manual Redis Setup

If you prefer to run Redis manually:
```bash
# Start Redis server
redis-server

# In another terminal, start Next.js
npm run dev:next-only
```
