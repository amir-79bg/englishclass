# Repository instructions for AI agents

These instructions apply to the entire repository.

## Mandatory startup

Before any file-changing work:

1. Read `docs/EXECUTION_PLAN.md` completely. It is the canonical source for the Laravel + Android rebuild.
2. Run `git status --short` and preserve all user-owned or unrelated changes.
3. Select an existing task ID from the execution plan. If none fits, add a narrowly scoped task with acceptance criteria before coding.
4. Confirm that the task's dependencies and unresolved decisions do not block it.

## Mandatory closeout

For every completed implementation task:

1. Run the relevant tests, build, lint, migration, or health checks.
2. Update the task status and evidence in `docs/EXECUTION_PLAN.md` in the same change as the implementation.
3. Append a short entry to the verification/change log. Do not rewrite earlier log entries.
4. Mark a task `DONE` only when its acceptance criteria pass. Otherwise leave it `IN PROGRESS` or `BLOCKED` with the exact reason.
5. Record any durable architecture or product decision in the decision log.

Read-only investigation does not require a plan edit unless it changes an assumption, decision, task, or status.

## Documentation portal

- Markdown files under `docs/` are the documentation source of truth. Never edit the generated `docs/index.html` by hand.
- After adding, removing, renaming, or changing any `docs/**/*.md` file, run `node tools/build-docs.js` and include the refreshed `docs/index.html` in the same change.
- Before closing documentation work, run `node --test tools/build-docs.test.js` and `node tools/build-docs.js --check`.
- `--check` must pass in CI. A stale generated portal means the task is not complete.
- Use `node tools/build-docs.js --watch` while editing several documents if live rebuilding is useful.

## Repository boundaries

- This is one monorepo. New backend code belongs in `backend/`; new native Android code belongs in `android/`.
- The current HTML application, `data/`, and `tools/` are the legacy product and migration source. Do not move them until a dedicated migration task authorizes it.
- Never edit the generated single-file HTML bundle by hand. Follow the pipeline documented in `README.md`.
- Treat existing word index `i` and released English headwords as stable migration identifiers. Never reorder, delete, or rename released content without an explicit migration.
- Keep content/catalog data separate from user progress and sync data.
- Never commit secrets, credentials, access tokens, signing keys, `.env` files, local SDK paths, generated build outputs, or user data.
- Existing files under `.claude/agents/` are legacy content/UX helpers. They are reference-only for the Laravel/Android rebuild unless the execution plan explicitly assigns them work.

## Engineering defaults

- Backend: Laravel REST API under `/api/v1`, initially SQLite for local development.
- Android: Kotlin, Jetpack Compose, Room, and WorkManager.
- Product behavior: offline-first. A lost or slow connection must not discard learning progress.
- Sync writes must be retry-safe and idempotent; content must be versioned and checksum-verified.
- Prefer a tested vertical slice over building an entire layer in isolation.
