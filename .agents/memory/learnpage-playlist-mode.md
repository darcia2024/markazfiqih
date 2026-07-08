---
name: LearnPage Playlist Mode patterns
description: Durable patterns/gotchas for Markaz Fiqih's Playlist Mode video player (LearnPage.tsx) — reading individual video IDs from a YouTube playlist, avoiding autoplay, and completion-badge truth source.
---

## Reading individual video IDs from a YouTube playlist without extra API key
YouTube IFrame Player API doesn't give per-video IDs from a playlist ID directly. Pattern used: create a *hidden* player with `listType:'playlist', list:<id>, autoplay:0, mute:1`, read `player.getPlaylist()` once inside `onReady`, then immediately `destroy()` it. Drive actual playback with a second, visible player using `videoId` (single-video mode, not playlist mode) + `cueVideoById()` for navigation.

**Why:** avoids exposing the full playlist in the user's YouTube history/recommendations for paid/private content, while still working without a YouTube Data API key. It's a mitigation, not a full fix — there's a brief metadata exposure while the hidden player loads, and Unlisted videos are still accessible via direct ID/link to anyone who obtains it.

**How to apply:** any time we need "just the video list" from a playlist ID for a custom nav UI. `getPlaylist()` can occasionally return empty on first `onReady` — add one short retry (e.g. 800ms) before treating it as a real failure, and use an idempotent teardown helper to avoid double-`destroy()` across success/retry/onError/cleanup paths.

## Completion/status badges must read from server data, not mutation state
Never gate a "completed"/"done" badge purely on `useMutation(...).isSuccess` — that resets to `false` on every remount (e.g. navigating away and back), making a real DB-persisted completion look reverted.

**Why:** confirmed real bug in Playlist Mode's "Tandai Kelas Selesai" — the badge appeared to un-complete itself despite the DB row being correct.

**How to apply:** pass the real value down as a prop from the query that already fetches server truth (e.g. `enrollment.isCompleted` from `listEnrollments`), and use local mutation-driven state only as an additive "optimistic" layer. Also invalidate the relevant query key on mutation success so sibling views (dashboard, sidebar) refresh too.

## Route-param-keyed components with heavy internal state need `key={param}`
A component that owns significant internal state (video player instances, fetched ID lists, current index, refs) and is rendered for a route like `/class/:classId/learn` will NOT reset that state automatically when the user navigates between two different ids of the same route — React reuses the instance since the component tree shape didn't change.

**Why:** caught by code review — without `key={classId}`, navigating from one Playlist Mode class straight to another would carry over stale video IDs/index and could target the wrong class's progress.

**How to apply:** add `key={<route param>}` on the child that owns this state so React fully unmounts/remounts it on every id change, rather than hand-rolling manual state-reset effects.
