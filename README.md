# Backend File Generator

Generate a standalone TypeScript + Express + Prisma + PostgreSQL backend from a
JSON project definition. The current implementation is a CLI prototype. The
React/Vite frontend is a starter and is not connected to generation yet.

## Requirements

- Node.js 24 or later and npm.
- Docker with Compose for running PostgreSQL and the generated backend.

## Install and check the repository

```sh
npm ci
npm run check
```

`check` builds the shared definitions, generator, and frontend, runs automated
tests, and lints the frontend. Individual commands:

| Command | Purpose |
| --- | --- |
| `npm run build:core` | Build shared definitions and the generator, in dependency order |
| `npm run build` | Build all three workspaces |
| `npm test` | Build the core and run the regression tests |
| `npm run lint` | Lint the frontend |
| `npm run verify:generated` | Build a fresh ecommerce backend in Docker and test it against temporary PostgreSQL |
| `npm run dev --workspace frontend` | Open the current frontend starter through Vite |

On Windows PowerShell, replace `npm` with `npm.cmd` if the shell blocks `npm.ps1`.

## Generate a backend

```sh
npm run generate -- --input examples/ecommerce.json --output generated/my-api
```

Input and output paths are relative to the directory where you run the command.
The output must be new or empty. Generation never overwrites an existing project;
use another output directory when trying a changed definition. In particular,
`generated/ecommerce` already contains the checked-in example and is not an empty
output target.

After building, you can invoke the CLI directly, including from another directory:

```sh
node generator/dist/index.js --help
node generator/dist/index.js generate --input examples/ecommerce.json --output generated/another-api
```

Generation validates the entire definition and renders the files in memory before
writing output. Invalid JSON, unsupported features, and unsafe definitions produce
a nonzero exit code and a readable error. See [the definition format](docs/definition-format.md).

## Run and test the generated backend

After generating `generated/my-api`:

```sh
cd generated/my-api
docker compose up --build
```

Wait for a successful health response at http://localhost:3000/health. In a second
terminal, open the same generated directory and run:

```sh
npm test
```

This test runs against the API and creates test records. It removes its records
when DELETE is available; the ecommerce Product example exposes only list/create,
so its smoke-test product remains. Use a development database. Stop the backend
with `docker compose down`; database data is retained.

Each generated project includes its own README with native Node.js setup,
environment variables, database migration commands, and troubleshooting.

## Verify from fresh output automatically

From the repository root, with Docker running:

```sh
npm run verify:generated
npm run verify:generated -- --input examples/notes.json
```

These commands generate into temporary directories, install dependencies and build
inside Docker, generate/apply migrations, wait for health, and run representative
API tests. Each run uses its own Compose project, free host ports, and database
volume. It removes its test containers, volume, and locally built image afterward.
The first run downloads images and npm packages and can take several minutes.

Add `--keep` to retain the generated source for inspection. If cleanup fails, the
source is retained automatically and the command prints the directory and Compose
project name needed to retry cleanup. If interrupted, use that printed directory
and project name with `docker compose --project-name <name> down --volumes --rmi local`.

Repository `npm test` runs regressions without PostgreSQL. Generated-project
`npm test` checks a running HTTP API. See [the development walkthrough](docs/development.md)
for manual API requests and how to make changes safely.

## Repository map

| Path | Role |
| --- | --- |
| `shared/` | Backend definition types and runtime validation |
| `generator/` | Definition-to-files generation engine |
| `examples/ecommerce.json` | Example input definition |
| `examples/notes.json` | String primary key, defaults, nullable fields, and generated timestamps |
| `generated/ecommerce/` | Checked-in example backend, including its migration history |
| `frontend/` | React/Vite starter for a future visual editor |
| `tests/` | Automated regression checks |

The generator consumes JSON. The intended visual editor will produce the same
definition; generation logic belongs in the generator rather than the frontend.

See [the current phase plan and verification log](docs/next-phase.md) for work in progress.

