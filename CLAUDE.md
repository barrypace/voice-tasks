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

## The Problem
My partner has ADHD. She thinks of tasks throughout the day but loses them before she can write them down. Existing tools fail because they have too many steps. This app captures a thought at the speed it occurs. If something adds friction to the moment of capture, it's wrong.

## What We're Building
Read SPEC.md — it's the source of truth. In short: one-button voice capture, browser speech-to-text, Claude Haiku extracts tasks, shared list in Upstash Redis. Two users, secret URL for auth.

## Infrastructure (all done)
- GitHub repo: barrypace/voice-tasks (private) — connected
- Vercel project: voice-tasks (linked to GitHub, hobby tier) — linked via Vercel CLI
- Upstash Redis: connected to Vercel project — credentials in .env.local
- Anthropic API key: in .env.local
- APP_SLUG: in .env.local (UUID, used as the secret URL path)
- Next.js scaffolded with TypeScript, App Router, no Tailwind, no ESLint

## How We Track What We're Building
- **SPEC.md** is the current truth of what we're building. We update it together as we make changes. Don't add things independently.
- **DECISIONS.md** is a running log of choices made during the build and why. When we make a meaningful decision (change approach, drop something, add something), add a short dated entry. Keep it brief — one or two lines per decision.

## Constraints
- No database, auth library, queue, or separate transcription service.
- Web Speech API may be flaky on mobile Safari — flag issues as we encounter them.

## Project Directory
/Users/Barry.Pace/personal/voice-tasks
