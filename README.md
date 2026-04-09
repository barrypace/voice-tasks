# Voice Tasks

A minimal voice-capture app for people who lose thoughts before they can write them down.

Tap a button → speak naturally → an LLM extracts your tasks → they go into a shared list. Works as a PWA on iOS Safari.

Also supports a second mode: record questions for someone else when you don't want to interrupt them.

## Deploy Your Own

1. Fork this repo
2. Import into [Vercel](https://vercel.com) from GitHub
3. Add Upstash Redis via Vercel Storage (free tier) — credentials auto-populate
4. Set the remaining environment variables (see below)
5. Deploy

## Environment Variables

Copy `.env.example` to `.env.local` and fill in the values.

| Variable | Where to get it |
|---|---|
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) |
| `APP_PASSWORD` | Choose anything — this is what you type to log in |
| `APP_SECRET` | Run `openssl rand -hex 32` in your terminal |
| `KV_REST_API_URL` / `KV_REST_API_TOKEN` | Auto-set by Vercel's Upstash integration |

## Local Development

```bash
cp .env.example .env.local
# fill in .env.local

npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Stack

- [Next.js](https://nextjs.org) 16 — App Router, TypeScript
- [Upstash Redis](https://upstash.com) — serverless key-value storage
- [Anthropic Claude](https://anthropic.com) — task extraction and question cleanup
- Web Speech API — browser-native voice capture, no external service
- [Vercel](https://vercel.com) — hosting (Hobby tier, free)
