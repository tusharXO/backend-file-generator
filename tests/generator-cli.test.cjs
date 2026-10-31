const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");
const { generateProject } = require("../generator/dist/generate-project");

const root = path.resolve(__dirname, "..");
const examplePath = path.join(root, "examples/ecommerce.json");
const example = () => JSON.parse(fs.readFileSync(examplePath, "utf8"));

function temporary(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "bfg-cli-"));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  return directory;
}

test("CLI generates from an absolute input path when run outside the repository", t => {
  const cwd = temporary(t);
  const output = path.join(cwd, "my-backend");
  const result = spawnSync(process.execPath, [path.join(root, "generator/dist/index.js"), "generate", "--input", examplePath, "--output", output], { cwd, encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Generated \d+ files/);
  assert.ok(fs.existsSync(path.join(output, "src/routes/user.routes.ts")));
  assert.equal(JSON.parse(fs.readFileSync(path.join(output, "package.json"))).name, "ecommerce-api");
});

test("invalid definitions leave the output directory uncreated", t => {
  const output = path.join(temporary(t), "invalid");
  const project = example();
  project.apis[0].entity = "Unknown";
  assert.throws(() => generateProject(project, output), /Invalid project definition/);
  assert.equal(fs.existsSync(output), false);
});

test("generation refuses to overwrite a populated directory", t => {
  const output = temporary(t);
  fs.writeFileSync(path.join(output, "important.txt"), "keep me");
  assert.throws(() => generateProject(example(), output), /not empty/);
  assert.deepEqual(fs.readdirSync(output), ["important.txt"]);
  assert.equal(fs.readFileSync(path.join(output, "important.txt"), "utf8"), "keep me");
});

test("CLI rejects unreadable JSON and unknown or missing arguments", t => {
  const cwd = temporary(t);
  const input = path.join(cwd, "invalid.json");
  fs.writeFileSync(input, "{broken");
  for (const args of [[], ["generate", "--bad", "value"], ["generate", "--input", examplePath], ["generate", "--input", input, "--output", path.join(cwd, "output")]]) {
    const result = spawnSync(process.execPath, [path.join(root, "generator/dist/index.js"), ...args], { cwd, encoding: "utf8" });
    assert.equal(result.status, 1);
    assert.ok(result.stderr.length > 0);
  }
  assert.equal(fs.existsSync(path.join(cwd, "output")), false);
});

test("CLI help succeeds without writing files", t => {
  const cwd = temporary(t);
  const result = spawnSync(process.execPath, [path.join(root, "generator/dist/index.js"), "--help"], { cwd, encoding: "utf8" });
  assert.equal(result.status, 0);
  assert.match(result.stdout, /Usage/);
  assert.deepEqual(fs.readdirSync(cwd), []);
});
