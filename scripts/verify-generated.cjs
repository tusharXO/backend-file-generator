const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { randomBytes } = require("node:crypto");
const { spawnSync } = require("node:child_process");
const { generateProject } = require("../generator/dist/generate-project");

const root = path.resolve(__dirname, "..");
const args = process.argv.slice(2);
let input = path.join(root, "examples/ecommerce.json");
let keep = false;
for (let index = 0; index < args.length; index++) {
  if (args[index] === "--input" && args[index + 1]) input = path.resolve(args[++index]);
  else if (args[index] === "--keep") keep = true;
  else throw new Error("Usage: npm run verify:generated -- [--input definition.json] [--keep]");
}

// Docker chooses free host ports. A random Compose project owns every test container/volume.
const projectName = "bfgverify" + randomBytes(6).toString("hex");
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "bfg-verify-"));
const output = path.join(temporary, "backend");
const environment = { ...process.env, PORT: "0", POSTGRES_PORT: "0", COMPOSE_PROGRESS: "plain", BUILDKIT_PROGRESS: "plain" };
let compose;
let generated = false;
let cleanupFailed = false;

function run(command, commandArgs, capture = false) {
  const result = spawnSync(command, commandArgs, {
    cwd: output, env: environment,
    stdio: capture ? ["ignore", "pipe", "pipe"] : "inherit",
    encoding: "utf8", timeout: 600000,
  });
  if (result.error || result.status !== 0) {
    throw new Error(`${command} ${commandArgs.join(" ")} failed: ${result.error?.message || result.stderr || "see output above"}`);
  }
  return (result.stdout || "").trim();
}

function dockerCompose(commandArgs, capture = false) {
  return run(compose.command, [...compose.prefix, "--project-name", projectName, ...commandArgs], capture);
}

try {
  const definition = JSON.parse(fs.readFileSync(input, "utf8"));
  generateProject(definition, output);
  generated = true;
  console.log(`Fresh project generated from ${input}\nOutput: ${output}\nCompose project: ${projectName}`);

  const plugin = spawnSync("docker", ["compose", "version"], { encoding: "utf8" });
  if (!plugin.error && plugin.status === 0) compose = { command: "docker", prefix: ["compose"] };
  else {
    const standalone = spawnSync("docker-compose", ["version"], { encoding: "utf8" });
    if (standalone.error || standalone.status !== 0) throw new Error("Docker Compose is required. Start Docker Desktop and retry.");
    compose = { command: "docker-compose", prefix: [] };
  }

  console.log("Building from fresh output, applying migrations, and waiting for database/API health...");
  dockerCompose(["up", "--build", "--detach", "--wait", "--wait-timeout", "120"]);
  const address = dockerCompose(["port", "api", "3000"], true).split(/\r?\n/).find(line => line.startsWith("127.0.0.1:"));
  if (!address) throw new Error("Could not determine the API's assigned host port.");
  environment.API_URL = "http://" + address;
  console.log(`Running generated API tests against ${environment.API_URL}`);
  run(process.execPath, ["--test", "scripts/smoke-test.mjs"]);
  console.log("PASS: fresh generation, dependency installation, Prisma client, TypeScript build, migrations, health, and representative CRUD operations.");
} catch (error) {
  console.error(error.message);
  if (compose && generated) {
    try { dockerCompose(["logs", "--no-color", "--tail", "80"]); } catch { /* Preserve the original error. */ }
  }
  process.exitCode = 1;
} finally {
  if (compose && generated) {
    console.log("Removing only this verification's Compose containers and database volume...");
    try { dockerCompose(["down", "--volumes", "--remove-orphans", "--rmi", "local"]); }
    catch (error) {
      cleanupFailed = true;
      console.error(error.message);
      console.error(`Cleanup failed. Keep this directory and retry Compose down with --project-name ${projectName}: ${output}`);
      process.exitCode = 1;
    }
  }
  if (keep || cleanupFailed) console.log("Generated files kept at " + output);
  else {
    const tempRoot = path.resolve(os.tmpdir()) + path.sep;
    const target = path.resolve(temporary);
    if (!target.toLowerCase().startsWith(tempRoot.toLowerCase()) || !path.basename(target).startsWith("bfg-verify-")) {
      console.error("Refusing to remove an unexpected temporary directory: " + target);
      process.exitCode = 1;
    } else fs.rmSync(target, { recursive: true, force: true });
  }
}
