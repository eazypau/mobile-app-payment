# Decisions

My cheat sheet for the interview debrief. Each entry is one choice and two sentences on why.

## Claude instructions: CLAUDE.md imports AGENTS.md — 2026-11-24
**Chose:** importing over merging or keeping two separate files.
The Expo rules stay in one place that other AI tools can also read, and `CLAUDE.md` only holds the take-home rules. This avoids two copies of the same rules drifting apart.

## Commit workflow: propose-then-approve on `main` — 2026-11-24
**Chose:** small Conventional Commits on `main` that I approve, over auto-commits or a branch and PR per slice.
Atomic, well-named commits let a reviewer follow how the module was built, and approving each one keeps me in control of what's in history. Branches and PRs would add ceremony without much value for a solo take-home.
