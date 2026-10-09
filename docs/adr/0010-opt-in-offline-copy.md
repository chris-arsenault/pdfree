# 0010 — Opt-in offline copy

- Status: Accepted; supersedes the retained-PWA clause of [ADR 0004](0004-projects-drafts-and-retained-pwa.md)
- Date: 2026-10-09

## Context

ADR 0004 kept the PWA as built: every visit registered the service worker and
precached the whole build, about 29 MB of which 15 MB is OCR engine and
language data. A visitor who only wanted to fill one form downloaded and stored
all of it, and became an "installation" without choosing to. The app does not
need the precache to work online: PDF.js and OCR assets load from the same
origin when used.

## Decision

A visit registers no service worker. The footer offers **Use offline**, which
states the size of the offline copy and, on request:

- registers the service worker, whose install step precaches the full build,
  including OCR, and reports progress from Cache Storage against a build-time
  `offline-manifest.json` (file count and bytes);
- asks the browser to keep the storage (`navigator.storage.persist()`), only at
  this moment, because Firefox prompts for it;
- remembers the choice, so later visits register the worker and keep the
  existing update prompt.

**Install app** appears where the browser offers an install prompt and also
saves the offline copy, as does launching the installed app. **Remove offline
copy** unregisters the worker and deletes its caches. Browsers that already hold
a registration from earlier versions are treated as having opted in.

## Alternatives

- **Keep registering on every visit.** Rejected: it stores 29 MB for people who
  never asked for offline use.
- **A smaller offline copy without OCR, with OCR as a second choice.** Rejected:
  recognition would fail offline with a confusing error, for a 15 MB saving.
- **Unregister workers left by earlier versions.** Rejected: it would silently
  break offline use for anyone relying on it; removal is one click instead.

## Consequences

- Online visits download assets on demand; the first OCR run fetches its engine
  and language data then.
- Offline tests opt in through the footer before going offline.
- The web manifest stays linked, so a browser can still install the app from
  its own menu; launching it saves the offline copy.
