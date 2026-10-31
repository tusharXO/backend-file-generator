import fs from "node:fs";
import path from "node:path";
import { validateProject, type ProjectDefinition } from "@backend-file-generator/shared";
import { writeGeneratedFile } from "./output/file-writer";
import { generatePrismaModel } from "./generators/model-generator";
import { generatePackageJson } from "./generators/package-generator";
import { generateTsConfig } from "./generators/tsconfig-generator";
import { generateServer } from "./generators/server-generator";
import { generatePrismaSchemaConfig } from "./generators/prisma-generator";
import { generatePrismaConfig } from "./generators/prisma-config-generator";
import { generateEnv } from "./generators/env-generator";
import { generateDockerCompose } from "./generators/docker-compose-generator";
import { generatePrismaClient } from "./generators/prisma-client-generator";
import { generateService } from "./generators/service-generator";
import { generateRoute } from "./generators/router-generator";
import { generateRouteImports, generateRouteRegistrations } from "./generators/server-route-generator";
import { toVariableName } from "./utils/name-utils";
import { generateValidationSchema } from "./generators/validation-generator";
import { generateValidationMiddleware } from "./generators/validation-middleware-generator";
import { generateErrorMiddleware } from "./generators/error-middleware-generator";
import { generateDockerfile, generateDockerIgnore, generateGitIgnore } from "./generators/dockerfile-generator";
import { generateInitMigration } from "./generators/init-migration-generator";
import { generateReadme } from "./generators/readme-generator";
import { generateSmokeTest } from "./generators/smoke-test-generator";

export interface GenerationResult {
  outputDirectory: string;
  files: string[];
}

/** Validate and render everything before creating any output files. */
export function generateProject(definition: unknown, outputPath: string): GenerationResult {
  const validation = validateProject(definition);
  if (!validation.valid) {
    throw new Error(`Invalid project definition:\n${validation.errors.map(error => `- ${error}`).join("\n")}`);
  }

  const project = definition as ProjectDefinition;
  const files: Record<string, string> = {
    "package.json": generatePackageJson(project.name, project.version),
    "tsconfig.json": generateTsConfig(),
    "src/server.ts": generateServer(generateRouteImports(project.apis), generateRouteRegistrations(project.apis)),
    "prisma/schema.prisma": `${generatePrismaSchemaConfig()}\n${project.entities.map(generatePrismaModel).join("\n\n")}`,
    "prisma.config.ts": generatePrismaConfig(),
    ".env.example": generateEnv(),
    "docker-compose.yml": generateDockerCompose(),
    "src/lib/prisma.ts": generatePrismaClient(),
    "src/middleware/error-handler.ts": generateErrorMiddleware(),
    "Dockerfile": generateDockerfile(),
    ".dockerignore": generateDockerIgnore(),
    ".gitignore": generateGitIgnore(),
    "README.md": generateReadme(project),
    "scripts/init-migration.mjs": generateInitMigration(),
    "scripts/smoke-test.mjs": generateSmokeTest(project),
  };

  for (const entity of project.entities) {
    const variable = toVariableName(entity.name);
    files[`src/services/${variable}.service.ts`] = generateService(entity);
    files[`src/validation/${variable}.schema.ts`] = generateValidationSchema(entity);
    const apis = project.apis.filter(api => api.entity === entity.name);
    if (apis.length > 0) {
      files[`src/middleware/${variable}.validation.ts`] = generateValidationMiddleware(entity);
      files[`src/routes/${variable}.routes.ts`] = generateRoute(entity, apis);
    }
  }

  const outputDirectory = path.resolve(outputPath);
  if (fs.existsSync(outputDirectory)) {
    if (fs.lstatSync(outputDirectory).isSymbolicLink() || !fs.statSync(outputDirectory).isDirectory()) {
      throw new Error(`Output must be a new or empty directory: ${outputDirectory}`);
    }
    if (fs.readdirSync(outputDirectory).length > 0) {
      throw new Error(`Output directory is not empty: ${outputDirectory}. Choose a new directory to preserve existing files.`);
    }
  }

  for (const [relativePath, content] of Object.entries(files)) {
    writeGeneratedFile(path.join(outputDirectory, relativePath), content);
  }

  return { outputDirectory, files: Object.keys(files).sort() };
}
