import fs from "node:fs";
import path from "node:path";
import { generateProject } from "./generate-project";

const usage = `Backend File Generator

Usage:
  node generator/dist/index.js generate --input <definition.json> --output <new-directory>

Options:
  --input   Path to a JSON backend definition (relative to the current directory)
  --output  New or empty output directory; existing files are never overwritten
  --help    Show this help
`;

export function runCli(args: string[]): number {
  if (args.length === 1 && (args[0] === "--help" || args[0] === "-h")) {
    console.log(usage);
    return 0;
  }

  if (args[0] !== "generate") {
    console.error(usage);
    return 1;
  }

  if (args.length === 2 && args[1] === "--help") {
    console.log(usage);
    return 0;
  }

  const options = new Map<string, string>();
  for (let index = 1; index < args.length; index += 2) {
    const flag = args[index];
    const value = args[index + 1];
    if (
      !["--input", "--output"].includes(flag) ||
      !value || value.startsWith("--") || options.has(flag)
    ) {
      console.error(`Invalid or duplicate argument: ${flag}\n${usage}`);
      return 1;
    }
    options.set(flag, value);
  }

  if (!options.has("--input") || !options.has("--output")) {
    console.error(`Both --input and --output are required.\n${usage}`);
    return 1;
  }

  try {
    const inputPath = path.resolve(options.get("--input")!);
    let definition: unknown;
    try {
      definition = JSON.parse(fs.readFileSync(inputPath, "utf8"));
    } catch (error) {
      throw new Error(`Cannot read JSON definition at ${inputPath}: ${(error as Error).message}`);
    }

    const result = generateProject(definition, options.get("--output")!);
    console.log(`Generated ${result.files.length} files in ${result.outputDirectory}`);
    console.log("Read the generated README.md for setup and testing instructions.");
    return 0;
  } catch (error) {
    console.error((error as Error).message);
    return 1;
  }
}

if (require.main === module) {
  process.exitCode = runCli(process.argv.slice(2));
}
