const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");
const { generateInitMigration } = require("../generator/dist/generators/init-migration-generator");

function project(t, prismaSource) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "bfg-migration-"));
  t.after(() => {
    const resolved = path.resolve(directory);
    assert.ok(resolved.startsWith(path.resolve(os.tmpdir()) + path.sep));
    assert.ok(path.basename(resolved).startsWith("bfg-migration-"));
    fs.rmSync(resolved, { recursive: true, force: true });
  });
  fs.mkdirSync(path.join(directory, "scripts"));
  fs.mkdirSync(path.join(directory, "prisma"));
  fs.writeFileSync(path.join(directory, "scripts/init-migration.mjs"), generateInitMigration());
  if (prismaSource) {
    const cliDirectory = path.join(directory, "node_modules/prisma/build");
    fs.mkdirSync(cliDirectory, { recursive: true });
    fs.writeFileSync(path.join(cliDirectory, "index.js"), prismaSource);
  }
  return {
    directory,
    migrations: path.join(directory, "prisma/migrations"),
    run: () => spawnSync(process.execPath, [path.join(directory, "scripts/init-migration.mjs")], { encoding: "utf8" }),
  };
}

test("initial migration generation passes schema-only diff arguments and writes PostgreSQL SQL once", t => {
  const fixture = project(t, `
    const assert = require('node:assert/strict');
    assert.deepEqual(process.argv.slice(2), ['migrate','diff','--from-empty','--to-schema','prisma/schema.prisma','--script']);
    process.stdout.write('CREATE TABLE "Example" ("id" INTEGER PRIMARY KEY);\\n');
  `);
  const first = fixture.run();
  assert.equal(first.status, 0, first.stderr);
  const sqlPath = path.join(fixture.migrations, "00000000000000_init/migration.sql");
  const sql = fs.readFileSync(sqlPath, "utf8");
  assert.match(sql, /CREATE TABLE/);
  assert.equal(fs.readFileSync(path.join(fixture.migrations, "migration_lock.toml"), "utf8"), 'provider = "postgresql"\n');
  const second = fixture.run();
  assert.equal(second.status, 0, second.stderr);
  assert.match(second.stdout, /preserving migration history/);
  assert.equal(fs.readFileSync(sqlPath, "utf8"), sql);
});

test("an existing migration is preserved without invoking or requiring Prisma", t => {
  const fixture = project(t);
  const previous = path.join(fixture.migrations, "20260911093334_init");
  fs.mkdirSync(previous, { recursive: true });
  fs.writeFileSync(path.join(previous, "migration.sql"), "-- existing history\n");
  const result = fixture.run();
  assert.equal(result.status, 0, result.stderr);
  assert.equal(fs.readFileSync(path.join(previous, "migration.sql"), "utf8"), "-- existing history\n");
  assert.deepEqual(fs.readdirSync(fixture.migrations), ["20260911093334_init"]);
});

test("an incomplete migration or mismatched lock fails without writing replacement history", t => {
  const fixture = project(t);
  fs.mkdirSync(path.join(fixture.migrations, "20260911093334_incomplete"), { recursive: true });
  const result = fixture.run();
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Incomplete migration directory/);
  assert.deepEqual(fs.readdirSync(fixture.migrations), ["20260911093334_incomplete"]);

  const wrongProvider = project(t);
  fs.mkdirSync(wrongProvider.migrations);
  fs.writeFileSync(path.join(wrongProvider.migrations, "migration_lock.toml"), 'provider = "mysql"\n');
  const failed = wrongProvider.run();
  assert.equal(failed.status, 1);
  assert.match(failed.stderr, /postgresql provider/);
  assert.deepEqual(fs.readdirSync(wrongProvider.migrations), ["migration_lock.toml"]);
});

test("a failed Prisma diff leaves migration files uncreated", t => {
  const fixture = project(t, 'console.error("schema rejected"); process.exitCode = 1;');
  const result = fixture.run();
  assert.equal(result.status, 1);
  assert.match(result.stderr, /schema rejected/);
  assert.equal(fs.existsSync(fixture.migrations), false);
});
