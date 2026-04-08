@AGENTS.md

# CLAUDE.md

## Who I Am
Product leader, 20 years working with engineers, never written code. Learning as I go. I want to understand what's being built, not just have it built for me.

## How to Work With Me
- Explain the intent of each step before doing it.
- When you create a file, tell me what it's for and where it fits.
- Don't assume I know terminal commands, package managers, or framework conventions.
- If there's a meaningful decision, pause and ask me.
- If I haven't asked for it, don't add it.
- **Thin vertical slices**: build one usable end-to-end journey first, not full layers.

## The Problem
My partner has ADHD. She thinks of tasks throughout the day but loses them before she can write them down. Existing tools fail because they have too many steps. This app captures a thought at the speed it occurs. If something adds friction to the moment of capture, it's wrong.

## What We're Building
Read SPEC.md — it's the source of truth.

## Infrastructure (all done)
- GitHub repo: barrypace/voice-tasks (public) — connected to Vercel
- Vercel project: voice-tasks — deployed and live
- **Production URL**: https://voice-tasks-xi.vercel.app
- **App URL**: https://voice-tasks-xi.vercel.app/app/14402617-b909-441e-b743-6be800569b29
- Upstash Redis: connected to Vercel project — credentials in .env.local
- Anthropic API key: in .env.local (personal account key, org `e839a10f`)
- APP_SLUG: `14402617-b909-441e-b743-6be800569b29` — in .env.local and set in Vercel env vars
- Next.js scaffolded with TypeScript, App Router, no Tailwind, no ESLint

## ⚠️ Known Local Issue
`ANTHROPIC_API_KEY` is set as a shell environment variable (probably in `~/.zshrc` or `~/.zprofile`) pointing to a work Anthropic account with no credit. This overrides `.env.local` when running `npm run dev` normally. Workaround: start the dev server with the key explicitly set:
```
ANTHROPIC_API_KEY="sk-ant-api03-Rk0..." npm run dev
```
Fix properly by removing the shell env var from `~/.zshrc`.

## Current State (2026-04-08)
- App is fully built and deployed
- Capture screen: tap red button → speak → Claude extracts tasks → confirm/discard
- List screen: view tasks, tap to mark done, clear done
- Safari iOS audio fixed: restart loop handles iOS's per-utterance stop behaviour; text accumulates across sessions
- PWA installed on partner's iPhone home screen via Safari → Share → Add to Home Screen
- **In live trial with partner**

## How We Track What We're Building
- **SPEC.md** is the current truth of what we're building. We update it together as we make changes. Don't add things independently.
- **DECISIONS.md** is a running log of choices made during the build and why. When we make a meaningful decision (change approach, drop something, add something), add a short dated entry. Keep it brief — one or two lines per decision.

## Constraints
- No database, auth library, queue, or separate transcription service.
- Web Speech API on iOS Safari requires a restart loop (`continuous: false` + restart on `onend`). This is implemented — see DECISIONS.md for detail.

## Project Directory
/Users/Barry.Pace/personal/voice-tasks
