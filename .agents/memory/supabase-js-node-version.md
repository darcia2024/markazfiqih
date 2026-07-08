---
name: supabase-js node version requirement
description: supabase-js realtime client requires Node 22+ native WebSocket; Node 20 throws at client creation even if realtime is unused.
---

Creating a Supabase client (via `createClient`) on Node 20 or below throws
`Error: Node.js detected but native WebSocket not found` from
@supabase/realtime-js, even if the app never uses realtime features — the
client eagerly initializes a RealtimeClient in its constructor.

**Why:** Node's native `WebSocket` global was only added in Node ~22. supabase-js
detects Node runtime and requires the native implementation instead of a ws polyfill.

**How to apply:** Any Replit project using `@supabase/supabase-js` (frontend or
backend) needs the `nodejs-22` module (or later), not `nodejs-20`. If a backend
using supabase-js fails to boot with this WebSocket error, check/upgrade the
Node module first before debugging supabase config.
