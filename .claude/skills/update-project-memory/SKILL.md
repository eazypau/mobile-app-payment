---
name: update-project-memory
description: >
  ALWAYS invoke after completing any task that adds, removes,
  renames, or relocates files, screens, routes, services,
  dependencies, or theme constants. Also invoke when project
  conventions change. Do not skip this after structural changes.
---

## What to maintain

- `PROJECT-STATE.md` at the repo root. Create it if it doesn't exist.

This is an index of *what exists*. Decisions and their reasoning go in `DECISIONS.md`, not here.

## On every update:

1. Read the current `PROJECT-STATE.md`
2. Diff what changed against what is documented
3. Update ONLY the sections that changed:
   - Routes: path, screen file in `src/app/`, layout/navigator
   - Components: name, path, purpose (one line)
   - Services & utils: path, exported functions, purpose (pure TS, no React)
   - Native capabilities: module (e.g. `expo-local-authentication`), what it's used for, needs dev build? (y/n)
   - Dependencies: package, why it is here, version
   - Theme: new/removed constants in `src/constants/`
   - Conventions: any pattern that changed
4. Timestamp the update
5. Do NOT rewrite sections that did not change
6. Keep each entry to one line. This is an index, not documentation
