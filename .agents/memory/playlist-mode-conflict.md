---
name: Playlist-mode vs module/dars-mode conflict (Markaz Fiqih LearnPage)
description: A class with a YouTube playlist ID AND a leftover module/dars row silently falls back to manual mode and ignores the live playlist entirely.
---

`LearnPage.tsx` picks the content mode with `isPlaylistMode = youtubePlaylistId && modules.length === 0`.
If a class has a `youtube_playlist_id` set but ALSO still has even one stray `modules`/`dars`
row (e.g. leftover from before the class was switched to playlist mode), the app renders
manual/module mode and never calls the YouTube IFrame API at all — so new videos added to the
playlist never appear, no matter how many times the student refreshes. This looks like a
"sync"/caching bug from the outside but isn't one: playlist video IDs are always read live via
`getPlaylist()` on every fresh mount, there is no DB snapshot or stale-cache layer for them.

**Why:** the mode switch is an all-or-nothing `if`, not a merge — manual dars entries always win
over the playlist once any exist for that class.

**How to apply:** if a "playlist videos not updating" report comes in again, first check
`select count(*) from modules where class_id = ...` for that class instead of suspecting a cache;
a non-zero count while `youtube_playlist_id` is also set is the mode conflict, and removing the
stray module/dars rows (after confirming the videos they reference are still present in the
actual YouTube playlist, and backing up/warning about cascade-deleted `progress` rows) is the fix.
