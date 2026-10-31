# Development and testing walkthrough

## 1. Install and understand the repository

Use Node.js 24 or later. From the repository root:

```sh
npm ci
npm run check
```

On PowerShell, use `npm.cmd` when the execution policy blocks `npm.ps1`.

`npm run check` builds all workspaces, runs regressions, and lints the frontend.
It does not start PostgreSQL. Regression tests execute generated schemas and HTTP
handlers with a stub database boundary, test CLI safety, and exercise migration
initialization. Live PostgreSQL is covered separately by `verify:generated`.

The frontend is still a Vite starter. `npm run dev --workspace frontend` starts
that starter; backend design currently happens by editing JSON.

## 2. Follow the generation pipeline

```text
examples/*.json
      |
shared/src/validation/project-validator.ts  (runtime input validation)
      |
generator/src/generate-project.ts          (render files, then write new output)
      |
generated backend                         (independent Node.js project)
```

`generator/src/index.ts` parses CLI arguments and reads JSON. The reusable engine
can also be called directly through `generateProject(definition, outputPath)`.
Generators under `generator/src/generators/` render each kind of file. Request
validation in an emitted API is separate from validation of the input definition.

The current [definition format](definition-format.md) documents the supported
fields, IDs, routes, defaults, and timestamps. Unsupported features are rejected
before writing output. Filesystem write failures can leave partial new output;
inspect it and choose another empty directory before retrying.

## 3. Generate your first backend

```sh
npm run generate -- --input examples/ecommerce.json --output generated/my-api
cd generated/my-api
docker compose up --build
```

Choose a new output directory each time; populated output is protected from
overwriting. The existing `generated/ecommerce` folder is a checked-in example,
with migration history, and is not an empty output target.

Compose runs a separate PostgreSQL server and the API. The build creates initial
migration SQL, generates the Prisma client, and compiles TypeScript. Startup applies
pending migrations after PostgreSQL is ready. Test readiness:

```powershell
Invoke-RestMethod http://localhost:3000/health
```

Or on macOS/Linux:

```sh
curl http://localhost:3000/health
```

Expect `status: ok` and `database: connected`.

## 4. Try APIs manually

In a second PowerShell terminal:

```powershell
$body = @{ name = "Demo User"; email = "demo-user@example.test" } | ConvertTo-Json
$created = Invoke-RestMethod -Method Post -Uri http://localhost:3000/users -ContentType application/json -Body $body
$recordId = $created.id
Invoke-RestMethod "http://localhost:3000/users/$recordId"
Invoke-RestMethod -Method Put -Uri "http://localhost:3000/users/$recordId" -ContentType application/json -Body '{"name":"Updated User"}'
Invoke-RestMethod http://localhost:3000/users
Invoke-RestMethod -Method Delete -Uri "http://localhost:3000/users/$recordId"
```

Creation returns 201, reads/updates 200, and deletion 204. Reusing an existing
email returns 409. Invalid IDs/bodies return 400, and reading a deleted record
returns 404. PowerShell reports non-success HTTP codes as exceptions.

For macOS/Linux, create a record with:

```sh
curl -i -X POST http://localhost:3000/users \
  -H 'Content-Type: application/json' \
  -d '{"name":"Demo User","email":"demo-user@example.test"}'
```

Use the returned `id` with GET/PUT/DELETE `/users/<id>`.

## 5. Run automated API checks

From the generated directory while the API is running:

```sh
npm test
```

This command requires only Node.js because the emitted test uses built-in HTTP
and assertion APIs. It tests health and representative CRUD operations. Records
created by tests are cleaned up only when a DELETE API is declared. The Product
example has no DELETE API, so it retains a test product in the development database.
Review generated payloads for custom constraints or multiple routes per operation.

For verification in a clean temporary database, return to the repository root:

```sh
npm run verify:generated
npm run verify:generated -- --input examples/notes.json
```

The Notes example demonstrates client-supplied string keys, nullable fields,
primitive defaults, ISO dates, and automatic timestamps. Verification cleans up
only its randomly named Compose project. It does not reset your development data.

## 6. Native Node.js development

Follow the generated README for the complete commands. The sequence is:

1. Install generated-project dependencies with `npm install`.
2. Copy `.env.example` to `.env` if `.env` does not exist.
3. Start PostgreSQL with `docker compose up -d --wait postgres`, or set `DATABASE_URL`
   to an existing development PostgreSQL server.
4. Once PostgreSQL is healthy, run `npm run setup`, then `npm run build`.
5. Run `npm start` (compiled JavaScript) or `npm run dev` (TypeScript reloads).

`npm run build` generates the Prisma client before compiling. `npm run db:init`
creates the first migration only if there is no migration history. Later schema
changes use `npm run db:migrate -- --name describe_change`; commit the resulting
migration files. `npm run db:deploy` applies committed migrations.

## 7. Change the project safely

- Change input definitions in `examples/` to design a backend.
- Change `shared/` to adjust what definitions mean and what is supported.
- Change `generator/src/generators/` to change emitted behavior.
- Add a regression when changing generation or validation behavior, then run
  `npm test` and `npm run check`.
- Generate into a new directory and run the live verification for behavior that
  depends on Prisma or PostgreSQL.
- Preserve existing migrations when updating an existing backend. Regeneration
  into another directory does not migrate an existing database automatically.
- Keep generated-project lockfiles and migrations with that project for repeatable
  installs. Use `npm ci` once a lockfile has been created.

The current phase intentionally covers standalone CRUD generation. Relationships,
workflows, authentication, ZIP export, and the visual editor remain future work.
