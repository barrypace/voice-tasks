# Voice Capture To-Do App — Project Spec

## Problem
My partner has ADHD. She thinks of things she needs to do throughout the day — while walking, cooking, mid-conversation — but the thought is fleeting. By the time she could open an app, find the right screen, and type it out, the thought is gone. The friction of existing tools is the problem. She needs to externalise a thought instantly, with zero cognitive overhead, and have it automatically organised into a shared to-do list.

This isn't about building a better to-do app. It's about capturing thoughts at the speed they occur, before working memory lets them go.

## Solution
A minimal web app. One button. Press it, speak, done. An LLM extracts actionable items from what was said and adds them to a shared list. No login screens, no navigation, no setup on each use.

Every design decision should be evaluated against one question: does this add friction to the moment of capture? If yes, cut it.

---

## Core User Flow

1. Open app via home screen bookmark
2. Single large button fills the screen — tap to record
3. Speak naturally ("we need to book the boiler service and I think we're out of olive oil")
4. Recording stops on tap or after silence
5. LLM extracts tasks from the transcript
6. Tasks shown alongside original transcript for confirmation
7. On confirm → tasks added to shared list

---

## Users
- Two people sharing one list, both on mobile browsers
- Partner is the primary user — she has ADHD, so minimising steps, decisions, and cognitive load is the core design requirement

---

## Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js (App Router) | Front + back in one repo, deploys to Vercel trivially |
| Hosting | Vercel (Hobby tier) | Free, zero config |
| Voice capture + transcription | Web Speech API (browser-native) | No libraries, no cost, on-device |
| LLM (task extraction) | Claude API (claude-haiku-4-5-20251001) | Cheapest Claude model, fast, good at extraction |
| Storage | Upstash Redis (via Vercel Storage) | Serverless KV, free tier, zero setup |
| Auth | Secret URL slug (UUID in env var) | Sufficient for two-person private use |

Do not introduce a database, auth library, queue, webhook system, or separate transcription service. Every piece of this stack is free or near-free and requires no setup beyond what's already done.

---

## Task Extraction

The LLM takes a raw transcript and returns a JSON array of task strings. Nothing else.

The user will speak in natural, unstructured language — mid-thought, with false starts, filler words, and multiple tasks jumbled together. The prompt needs to handle messy real speech.

Example input:
```
"we need to book the boiler service and I think we're out of olive oil and can you remind me to call mum on Sunday"
```

Example output:
```json
["Book boiler service", "Buy olive oil", "Call mum on Sunday"]
```

No prioritisation, categorisation, or scheduling in v1.

---

## Storage

Single key in Upstash Redis: `tasks`

```json
[
  { "id": "uuid", "text": "Book boiler service", "done": false, "created": "ISO timestamp" }
]
```

No user IDs, no tags, no additional metadata.

---

## UI

### Capture (default screen)
- Full screen, one large record button, centre
- Tap → recording starts, button pulses
- Tap again or silence → stops, brief processing state
- Shows extracted tasks alongside original transcript
- Confirm adds to list, discard resets

### List
- Scrollable list of tasks
- Tap to mark done (strikethrough, moves to bottom)
- "Clear done" button to remove completed tasks
- No editing in v1
- Tab/link to switch between Capture and List

No other screens.

---

## Auth
- UUID slug in environment variable: `/app/{slug}`
- Both users bookmark this URL
- No match → 404
- No sessions, no cookies

---

## Out of Scope for v1
Native app, push notifications, multiple lists, editing tasks, user accounts, voice playback, Whisper, local LLM. Revisit if v1 proves useful.

---

## Environment Variables
```
ANTHROPIC_API_KEY=
APP_SLUG=
```

Upstash Redis credentials are automatically available via the Vercel project connection.

---

## Success Criteria
- Partner can add a task in under 5 seconds from unlock
- Tasks visible on both phones within 30 seconds
- Works on mobile Safari and Chrome
- Ongoing cost: effectively £0