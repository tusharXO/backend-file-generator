# Next phase: Reliable, runnable CRUD generation

The project already generates basic CRUD source code. This phase makes that
workflow reproducible for someone starting from a fresh clone, before adding
relationships or a visual editor.

## Tasks, in execution order

| Task | Deliverable | Acceptance check | Status |
| --- | --- | --- | --- |
| 1. Development baseline | Root build, test, lint, and check commands; compatible TypeScript tooling | A fresh install can run the documented checks | Complete |
| 2. Definition and CLI | Runtime input validation; configurable JSON input/output; safe output handling | Invalid input fails before writing files; valid input generates to a new directory | Complete |
| 3. CRUD correctness | Consistent field defaults/timestamps and supported IDs; useful HTTP errors | Regression tests cover valid and invalid requests | Complete |
| 4. Standalone backend | Generated setup scripts, Dockerfile/Compose, README, and API smoke test | A fresh project can generate its client, build, initialize PostgreSQL, and start | Complete |
| 5. Verification and handoff | Repeatable verification, project guide, and final status | Document commands, observed results, and any environment limits | Complete |

## Working rules

- Finish and verify each task before moving to the next.
- Explain changes and results in the chat and record the durable details here.
- Preserve the existing example definition and migration history.
- Use isolated output for generation tests and a separate database for integration checks.
- Do not add relationship generation, workflows, authentication, or frontend product features in this phase.
- Do not silently ignore unsupported definition features.

## How the pieces fit together

1. `shared/` defines and validates the backend definition (IR).
2. `generator/` turns a valid definition into a standalone backend project.
3. `examples/ecommerce.json` is the input example.
4. `generated/ecommerce/` is the checked-in example output; its existing migrations are preserved.
5. `frontend/` is currently a React/Vite starter; it is not yet connected to the generator.

## Verification log

### Task 1

- Aligned root TypeScript with the frontend's TypeScript 6 line. The old root
  TypeScript 7 package exposed version metadata where ESLint expected compiler APIs.
- Added root `build:core`, `build`, `test`, `lint`, and `check` commands.
- Replaced the failing placeholder test command with Node's built-in test runner.
- Added baseline tests for the example, duplicate entities, and unknown API entities.
- `npm run check` passed: all three workspaces built, 3 tests passed, and frontend lint passed.

Run commands from the repository root. On Windows PowerShell, use `npm.cmd`
instead of `npm` if execution policy blocks `npm.ps1`.

### Task 2

- Separated the reusable `generateProject` engine from the CLI entry point.
- Added explicit `generate --input ... --output ...` arguments and root `npm run generate`.
- Generation refuses nonempty output directories and output symlinks.
- The runtime validator accepts unknown JSON safely and reports structural,
  identifier, field/default, primary-key, and API errors. It also detects route
  ambiguity and unsupported settings before generation starts.
- Kept the existing ecommerce definition valid; relationships must remain empty
  until their generation phase is implemented.
- `npm test` passed: 34 tests across validation and CLI behavior, with both core builds passing.

### Task 3

- Added typed create/update services, strict Zod bodies, and primary-key schemas.
- Integer keys remain auto-incremented; string keys are supplied on creation.
- Implemented primitive Prisma defaults and `updatedAt` automation. Nullable and
  omitted values now follow the documented field contract.
- Reused one Prisma connection pool in the health endpoint and CRUD services.
- Added centralized 400/404/409/413/500 handling and database-aware 503 health responses.
- Added `examples/notes.json` to demonstrate string keys, defaults, dates, nullable
  fields, and created/updated timestamps.
- `npm test` passed: 46 tests. New tests execute generated Zod schemas, Express
  routes, middleware, and services using stub database delegates. Actual PostgreSQL
  integration is verified in the next task.

### Task 4

- Each output now includes a Dockerfile, Compose services for PostgreSQL and the
  API, standalone setup/build/migration scripts, ignore files, a README, and HTTP
  smoke tests.
- Initial migration SQL is generated with Prisma's schema-only diff; existing
  migrations are preserved. The checked-in ecommerce migration files are unchanged.
- Fixed a PostgreSQL readiness race found by the first Docker run: health now
  checks TCP availability instead of the temporary initialization socket.
- Added `npm run verify:generated`: fresh output, isolated Compose project,
  automatically assigned host ports, PostgreSQL migrations, HTTP tests, and scoped
  cleanup. Cleanup failures retain generated files for manual retry.
- Live ecommerce verification passed (3 HTTP tests); Notes passed (2 HTTP tests)
  including string IDs, defaults, nullable updates, dates, and timestamps.
- Applied compatible dependency fixes: synchronized Prisma packages at 7.10.1 and
  required patched Zod. The fresh Notes Docker install reported 0 vulnerabilities.
- Local regression suite passed 52 tests before final clean-install verification.

### Task 5 — final results (October 30, 2026)

- Clean root installation from the lockfile succeeded. Final `npm run check`
  passed: shared/generator/frontend builds, 52 regression tests, and frontend lint.
- Both fresh Docker examples passed with Prisma 7.10.1: ecommerce (3 HTTP tests)
  and Notes (2 HTTP tests). Dependency installation, client generation, TypeScript,
  initial migration creation/deployment, database health, and CRUD all ran from
  fresh output without relying on the checked-in Prisma client or old migrations.
- The refreshed checked-in ecommerce backend builds natively. Its initializer
  confirms existing migration history is preserved; migration file hashes and Git
  comparisons are unchanged.
- Prisma validated small/large numeric defaults, including exponent-form input
  expanded into supported decimal schema literals.
- Current full npm audits for the repository and checked-in example report 0
  vulnerabilities after compatible dependency updates. This is a point-in-time
  advisory check, not a guarantee about future advisories.
- Confirmed no verification containers or database volumes remain. Verification
  images were removed; downloaded base images/build cache remain reusable.
- Added the root README walkthrough, `docs/development.md`, the supported definition
  contract, generated READMEs, and the reusable verification command.

## What comes next

This reliability phase is complete. The V0 product is still in development.
The next feature phase is relationship generation (foreign keys and relation
validation), followed by the visual editor. Workflows, authentication, export UI,
and production configuration remain outside the completed scope.
