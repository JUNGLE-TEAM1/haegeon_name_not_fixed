# AGENTS.md

## Project Overview

This repository uses a docs-first workflow for Codex-assisted development.

Source of truth order:

1. `docs/01-product-planning.md`
2. `docs/02-architecture.md`
3. `docs/03-api-reference.md`
4. `docs/04-development-guide.md`
5. `README.md`

If these documents conflict, follow the numbered order above.

## How Codex Should Work In This Repo

Before writing code, Codex should:

1. Read the planning and architecture docs first.
2. Confirm the current task fits the MVP scope.
3. Check whether API/DB/docs need to change before coding.
4. Work in a small branch-scoped task, not a whole-project rewrite.
5. Update docs when behavior, schema, or conventions change.
6. Keep `README.md` short, presentation-friendly, and suitable for first-time readers.
7. Treat this project as implementation plus learning: after each implementation Phase, help produce a short code-reading review report under `docs/reviews/` using `docs/reviews/phase-review-template.md`.
8. When generating a Phase review, focus on request flow, data flow, ownership boundaries, failure handling, and the questions the developer should be able to answer.

## Codex-First Development Order

When building a new project from scratch, prefer this order:

1. Project/app bootstrap
2. Environment and database connection
3. Authentication foundation
4. Core domain model and CRUD
5. Query/list/detail APIs
6. Secondary actions (join, comment, like, upload, etc.)
7. Frontend pages or client integration
8. Error handling and authorization hardening
9. Tests and regression coverage
10. Deployment, CI/CD, and docs sync
11. Final README polish for demo/presentation

## Task Sizing Rules

- One feature branch should focus on one clear outcome.
- Avoid asking Codex to implement multiple unrelated features at once.
- Prefer prompts like "implement signup API with tests" over "build auth system".
- Do not let multiple teammates use Codex on the same file at the same time unless coordinated.

## Collaboration Rules

- Each teammate uses a separate branch.
- API changes must update `docs/03-api-reference.md` in the same PR.
- Schema/data model changes must update `docs/02-architecture.md` in the same PR.
- Process or branching changes must update `docs/04-development-guide.md` in the same PR.
- `README.md` stays as the entry document and presentation summary, not a running log.

## Branch Naming

Recommended branch types:

- `feature/<name>`
- `fix/<name>`
- `docs/<name>`
- `test/<name>`
- `chore/<name>`

## Commands To Fill In Per Project

Replace the placeholders below when starting a real project.

- Bootstrap: `[example: ./scripts/bootstrap.sh]`
- Dev run: `[example: python run.py]`
- Local test: `[example: pytest -q]`
- Build: `[example: npm run build]`
- Lint/format: `[example: npm run lint]`

## Definition of Done

A task is complete when:

- Code is implemented
- Relevant tests pass
- Related docs are updated
- PR summary explains what changed and why
- Known limitations are called out if not fully solved

## Good Prompt Examples For Teammates

- `Read docs/01-product-planning.md and docs/03-api-reference.md, then implement signup API with tests.`
- `Read docs/02-architecture.md and create the repository layer for the core resource.`
- `Using docs/04-development-guide.md, split this work into safe feature branches.`
- `Review this branch for regressions against docs/03-api-reference.md.`
- `Polish README.md for presentation using the implemented features and demo flow.`

## Things Codex Should Avoid

- Making up requirements that are not in the docs
- Editing unrelated files while implementing a small feature
- Leaving API/documentation drift behind
- Treating README as an internal scratchpad
- Writing a README that is too detailed to use for a project presentation
