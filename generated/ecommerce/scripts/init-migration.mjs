import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const migrationsDirectory = path.join(projectRoot, "prisma", "migrations");

try {
  if (fs.existsSync(migrationsDirectory) && fs.lstatSync(migrationsDirectory).isSymbolicLink()) {
    throw new Error("The migrations directory must not be a symbolic link.");
  }
  const entries = fs.existsSync(migrationsDirectory)
    ? fs.readdirSync(migrationsDirectory, { withFileTypes: true })
    : [];
  for (const entry of entries) {
    if (entry.isSymbolicLink()) {
      throw new Error("Migration entries must be regular files or directories, not symbolic links: " + entry.name);
    }
    if (entry.isDirectory()) {
      const sqlPath = path.join(migrationsDirectory, entry.name, "migration.sql");
      if (!fs.existsSync(sqlPath) || fs.lstatSync(sqlPath).isSymbolicLink() || !fs.statSync(sqlPath).isFile()) {
        throw new Error("Incomplete migration directory: " + entry.name + ". Restore its migration.sql before continuing.");
      }
    }
  }
  const lockPath = path.join(migrationsDirectory, "migration_lock.toml");
  if (fs.existsSync(lockPath) && !/^\s*provider\s*=\s*"postgresql"\s*$/m.test(fs.readFileSync(lockPath, "utf8"))) {
    throw new Error("Existing migration_lock.toml must declare the postgresql provider.");
  }
  if (entries.some(entry => entry.isDirectory())) {
    console.log("Existing migrations found; preserving migration history. Use npm run db:migrate for later schema changes.");
  } else {
    const prismaCli = path.join(projectRoot, "node_modules", "prisma", "build", "index.js");
    if (!fs.existsSync(prismaCli)) throw new Error("Prisma is not installed. Run npm install first.");
    const result = spawnSync(process.execPath, [prismaCli, "migrate", "diff", "--from-empty", "--to-schema", "prisma/schema.prisma", "--script"], {
      cwd: projectRoot,
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024,
    });
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error(result.stderr.trim() || "Prisma could not generate the initial migration.");
    if (!result.stdout.trim()) throw new Error("Prisma returned empty migration SQL; no files were written.");

    const initialDirectory = path.join(migrationsDirectory, "00000000000000_init");
    fs.mkdirSync(initialDirectory, { recursive: true });
    fs.writeFileSync(path.join(initialDirectory, "migration.sql"), result.stdout, { flag: "wx" });
    if (!fs.existsSync(lockPath)) fs.writeFileSync(lockPath, 'provider = "postgresql"\n', { flag: "wx" });
    console.log("Created prisma/migrations/00000000000000_init/migration.sql. Commit migration files with your project.");
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
