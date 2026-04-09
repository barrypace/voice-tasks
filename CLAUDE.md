@AGENTS.md

# CLAUDE.md

## Project

Voice Tasks is a minimal web app for capturing spoken thoughts as tasks or questions. One button — tap to record, speak naturally, an LLM extracts actionable items, they go into a shared list. Built for people who lose thoughts before they can write them down.

See SPEC.md for full product requirements. See DECISIONS.md for why things are built the way they are.

## How to Work With This Codebase

- Explain the intent of each step before doing it
- If there's a meaningful decision, pause and ask
- Don't add features that weren't asked for
- **Thin vertical slices**: build one working end-to-end journey first, not full layers

## Architecture

- Next.js 16 App Router, TypeScript, no Tailwind, plain CSS modules
- Auth: cookie-based (HMAC-SHA256), Next.js middleware, no auth library
- Storage: Upstash Redis — `tasks` key (array) and `questions` key (array)
- Voice: Web Speech API (browser-native, no external service)
- LLM: Claude Haiku via Anthropic SDK

## Constraints

- No database, auth library, queue, or separate transcription service
- Web Speech API on iOS Safari requires a restart loop (`continuous: false` + restart on `onend`) — see DECISIONS.md

## Environment Variables

See `.env.example` for all required variables and where to get them.
