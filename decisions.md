# DECISIONS.md

## Working principles
- **Thin vertical slices**: build one usable end-to-end journey first, then expand. Don't complete a full layer (e.g. all API routes) before touching the next. Noted after building the full backend before any UI existed.

## Build session (2026-04-08)
- **params is a Promise in Next.js 16**: Dynamic route params must be `await`ed — breaking change from v14.
- **Slug check in server component**: `APP_SLUG` comparison happens server-side; wrong slug calls `notFound()` immediately.
- **No Tailwind**: Plain CSS modules throughout. Two-screen app doesn't need a framework.
- **SpeechRecognition types not in DOM lib**: TypeScript at this version doesn't include Web Speech API types. Using `any` on the recognition object — honest fix, not a hack.
- **Record button red by default**: Red = record, universally understood. Darker red + pulse when actively recording. Grey when processing.
- **Strip markdown fences from Claude response**: Claude sometimes wraps JSON in ```json``` despite being told not to. Strip them in code rather than relying on the prompt instruction — more robust.
- **Shell env var overrides .env.local**: `ANTHROPIC_API_KEY` was set in the shell pointing to a work Anthropic account (zero credit), silently overriding `.env.local`. Root cause of the "something went wrong" errors. Fix: remove from `~/.zshrc`.
- **vercel.json needed to fix framework detection**: Vercel defaulted to Framework Preset "Other" instead of Next.js, so it served static files and skipped the build entirely. Added `vercel.json` with `framework: nextjs` to fix.
- **APP_SLUG must be added to Vercel env vars separately**: `.env.local` is not deployed. `ANTHROPIC_API_KEY` and `APP_SLUG` must be set explicitly via Vercel dashboard or CLI.

## Safari iOS + PWA session (2026-04-08)
- **Web Speech API stops after each utterance on iOS**: `continuous: true` causes Safari iOS to stop recognition immediately after the first utterance and fire `onend` with an empty result. Fix: set `continuous: false` and `interimResults: false` on iOS, and restart recognition in `onend` while `isRecordingRef` is true. Text accumulates across restarts in `accumulatedRef`.
- **Separate user intent from recognition state**: Added `isRecordingRef` (user's intent) alongside `recognitionRef` (browser's active session). These diverge on iOS because the browser restarts mid-speech. `isRecordingRef` is the source of truth for whether to keep listening.
- **Error codes mapped to actionable messages**: `not-allowed` → tells user to check Safari settings. `no-speech` → silent restart. `network` → connectivity message. `aborted` → ignored (user-initiated stop). Previous code treated all errors identically.
- **PWA manifest for home screen install**: Added `public/manifest.json` and iOS-specific meta tags in `layout.tsx` (`appleWebApp`, `manifest`, `icons`). Without this, "Add to Home Screen" installs a bare bookmark with no icon and no standalone mode.
- **Icons generated with Node.js zlib**: No ImageMagick or extra dependencies. Pure Node.js script using `zlib.deflateSync` to write valid PNG bytes. Red circle (#c92a2a) on white, matching the record button.

## Pre-build (2026-04-07)
- **Upstash Redis instead of Vercel KV**: Vercel no longer offers native KV. Upstash Redis is what Vercel KV was built on, same thing with a different name. Use `@upstash/redis` SDK.
- **Claude Haiku 4.5 instead of Haiku 3**: Current cheapest model is `claude-haiku-4-5-20251001`, faster and smarter at the same price point.
- **Confirm step shows transcript**: After task extraction, show the original transcript alongside extracted tasks so the user can see what was heard vs what was interpreted. Builds trust in the tool.
- **Added "clear done" button**: Not in original spec. Without it the task list grows forever. Tiny scope addition, prevents real annoyance within first week.
