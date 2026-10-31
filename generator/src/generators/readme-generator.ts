import type { ProjectDefinition } from "@backend-file-generator/shared";

export function generateReadme(project: ProjectDefinition): string {
  const routes = project.apis.map(api => `| ${api.method} | \`${api.path}\` | ${api.entity} | ${api.operation} |`).join("\n");
  return `# ${project.name}

Generated standalone TypeScript + Express + Prisma + PostgreSQL backend.
Project version: ${project.version}. You own and can edit these files.

## Requirements

- Docker Desktop (running) with Docker Compose for the Docker workflow.
- Node.js 24 or later and npm for native development and the API smoke test.
- Internet access on the first install/build to download packages, images, and Prisma binaries.

This is a development scaffold. Authentication, authorization, relationships,
workflows, and production deployment configuration are not implemented.
The included database credentials are for local development only.

## Run with Docker

From this directory:

\`\`\`sh
docker compose up --build
\`\`\`

Compose starts PostgreSQL, waits for database readiness, builds the backend and
its Prisma client, applies migrations, and starts the API. The build creates an
initial migration if this project has no migration history yet. Source files
inside your host directory are not changed by the Docker build.

Open http://localhost:3000/health. A ready API responds with HTTP 200 and
\`{"status":"ok","database":"connected"}\`.

In another terminal, run \`npm test\`. The smoke test requires only Node.js;
you do not need a native npm install when testing a backend running in Docker.

Stop the services with \`docker compose down\`. Database data remains in the
Compose project's named volume. Keep that volume if you want to preserve data.
Different generated directories use separate Compose project names by default.

## Run natively

Install dependencies:

\`\`\`sh
npm install
\`\`\`

Copy the environment template only if you do not already have a \`.env\` file.

PowerShell:

\`\`\`powershell
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
\`\`\`

macOS/Linux:

\`\`\`sh
test -f .env || cp .env.example .env
\`\`\`

Then start PostgreSQL and initialize the backend:

\`\`\`sh
docker compose up -d --wait postgres
npm run setup
npm run build
npm start
\`\`\`

The \`--wait\` option waits for PostgreSQL to be healthy before setup; check with
\`docker compose ps\`. Setup generates the initial migration when needed and
applies pending migrations. Build generates the Prisma client and compiles
TypeScript. Use \`npm run dev\` instead of \`npm start\` for automatic reloads.
For an existing PostgreSQL server, set \`DATABASE_URL\` in \`.env\` and skip
\`docker compose up -d --wait postgres\`.

On Windows PowerShell, use \`npm.cmd\` if execution policy blocks \`npm.ps1\`.

## Test the running API

Run in a second terminal:

\`\`\`sh
npm test
\`\`\`

The test checks health and representative CRUD operations supported by this definition,
using the first route for each operation. Review its generated payloads when adding
custom constraints or multiple routes for the same operation. Unique fields with
small value ranges may need custom test values when testing an existing database.
It creates test records. It deletes only records it created when a corresponding
DELETE endpoint exists. Entities with create-only or create/list APIs can retain
test records; use a development database and inspect the test output.

To test a different address, set \`API_URL\` first:

\`\`\`powershell
$env:API_URL = "http://localhost:3100"
npm.cmd test
\`\`\`

\`\`\`sh
API_URL=http://localhost:3100 npm test
\`\`\`

## Configuration

| Setting | Native workflow | Docker Compose |
| --- | --- | --- |
| \`DATABASE_URL\` | PostgreSQL connection URL from \`.env\` | Uses the internal \`postgres:5432\` service |
| \`PORT\` | API listening port, default 3000 | Host port, default 3000; container uses 3000 |
| \`POSTGRES_PORT\` | Published database port, default 5432 | Same host port; internal port stays 5432 |

Docker's defaults work without a \`.env\` file. To change published ports,
copy \`.env.example\` and edit \`PORT\`/\`POSTGRES_PORT\`. For native development,
also update the port in \`DATABASE_URL\` if you change \`POSTGRES_PORT\`.
Published ports bind to your local computer only.

## APIs

| Method | Path | Entity | Operation |
| --- | --- | --- | --- |
${routes || "| — | — | — | No APIs configured |"}

The API also exposes \`GET /health\`. It returns 503 if PostgreSQL is unavailable.
Create endpoints return 201; successful deletion returns 204. Invalid IDs or
bodies return 400, missing records return 404, and duplicate unique values
return 409. Unexpected server errors return a generic 500 response.

Create bodies contain required fields. Integer primary keys and automatic
timestamps are assigned by the backend; string primary keys must be supplied.
Fields with defaults may be omitted. Updates accept a nonempty subset of mutable
fields and leave other fields unchanged. Unknown or immutable fields are rejected.
Date fields accept \`YYYY-MM-DD\`; datetime fields require ISO strings with a timezone.

## Migrations and source layout

- \`prisma/schema.prisma\`: database model.
- \`prisma/migrations/\`: migration SQL; commit it to version control.
- \`src/routes/\`, \`src/services/\`: request handling and database operations.
- \`src/validation/\`, \`src/middleware/\`: request schemas and error handling.
- \`scripts/smoke-test.mjs\`: API checks against a running backend.

\`npm run db:init\` creates SQL from an empty database model only when there is
no existing migration. It does not connect to or reset your database, and it
never replaces existing migration history. For later schema edits, run
\`npm run db:migrate -- --name describe_your_change\` against your development
database, then \`npm run build\`. Keep the resulting migrations with the code.
\`npm run db:deploy\` applies committed migrations without generating new ones.

The default \`db:init\` path assumes a new empty database. Existing databases
without this project's migration history require deliberate baselining before
applying migrations. Do not reset a database to bypass a migration error.

For Docker-only work, initial SQL is created inside the image. Run
\`npm install\` and \`npm run db:init\` on the host before editing the schema so
that you can commit and evolve the same migration history.

## Troubleshooting

- Connection refused: confirm Docker Desktop/PostgreSQL is running and check \`DATABASE_URL\`.
- Port already allocated: choose unused \`PORT\` and \`POSTGRES_PORT\` values, then restart.
- Docker startup failure: inspect \`docker compose logs api\` and \`docker compose logs postgres\`.
- Migration failure: inspect the migration history and database; \`setup\` preserves existing migrations.
- Smoke tests fail: wait for a successful health response, then confirm \`API_URL\` matches your API port.
`;
}
