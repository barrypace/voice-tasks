# DECISIONS.md

## Working principles
- **Thin vertical slices**: build one usable end-to-end journey first, then expand. Don't complete a full layer (e.g. all API routes) before touching the next. Noted after building the full backend before any UI existed.

## Build session (2026-04-08)
- **params is a Promise in Next.js 16**: Dynamic route params must be `await`ed — this is a breaking change from v14. Server component pages typed as `params: Promise<{ slug: string }>`.
- **Slug check in server component**: `APP_SLUG` comparison happens server-side before any HTML is rendered; wrong slug calls `notFound()` immediately.

## Pre-build (2026-04-07)
- **Upstash Redis instead of Vercel KV**: Vercel no longer offers native KV. Upstash Redis is what Vercel KV was built on, same thing with a different name. Use `@upstash/redis` SDK.
- **Claude Haiku 4.5 instead of Haiku 3**: Original spec referenced `claude-haiku-3`. Current cheapest model is `claude-haiku-4-5-20251001`, faster and smarter at the same price point.
- **No Tailwind decision yet**: Leaving CSS approach to the build session. Two-screen app may not need a framework.
- **Confirm step shows transcript**: After task extraction, show the original transcript alongside extracted tasks so the user can see what was heard vs what was interpreted. Builds trust in the tool.
- **Added "clear done" button**: Not in original spec. Without it the task list grows forever. Tiny scope addition, prevents real annoyance within first week.
