import fs, { write } from "fs";
import path from "path";

import {
  validateProject,
  type ProjectDefinition,
} from "@backend-file-generator/shared";
import { generatePrismaModel } from "./generators/model-generator";
import { writeGeneratedFile } from "./output/file-writer";
import { createProjectStructure } from "./generators/project-generator";
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
import {
  generateRouteImports,
  generateRouteRegistrations,
} from "./generators/server-route-generator";
import { toVariableName } from "./utils/name-utils";
import { generateValidationSchema } from "./generators/validation-generator";
import { generateValidationMiddleware } from "./generators/validation-middleware-generator";

const projectPath = path.resolve(__dirname, "../../examples/ecommerce.json");

const projectFile = fs.readFileSync(projectPath, "utf-8");

const project: ProjectDefinition = JSON.parse(projectFile);

const result = validateProject(project);

if (!result.valid) {
  console.error(result.errors);
  process.exit(1);
}

const outputDirectory = path.resolve(__dirname, "../../generated/ecommerce");

createProjectStructure(outputDirectory);

const packageJsonPath = path.join(outputDirectory, "package.json");

writeGeneratedFile(packageJsonPath, generatePackageJson(project.name));

const tsConfigPath = path.join(outputDirectory, "tsconfig.json");

writeGeneratedFile(tsConfigPath, generateTsConfig());

const serverPath = path.join(outputDirectory, "src", "server.ts");
const routeImports = generateRouteImports(project.apis);
const routeRegistrations = generateRouteRegistrations(project.apis);

writeGeneratedFile(
  serverPath,
  generateServer(routeImports, routeRegistrations),
);

const prismaSchemaPath = path.join(outputDirectory, "prisma", "schema.prisma");

const models = project.entities
  .map((entity) => generatePrismaModel(entity))
  .join("\n\n");

const prismaConfigPath = path.join(outputDirectory, "prisma.config.ts");

writeGeneratedFile(prismaConfigPath, generatePrismaConfig());

writeGeneratedFile(
  prismaSchemaPath,
  `${generatePrismaSchemaConfig()}\n${models}`,
);

const envPath = path.join(outputDirectory, ".env.example");

writeGeneratedFile(envPath, generateEnv());

const dockerComposePath = path.join(outputDirectory, "docker-compose.yml");

writeGeneratedFile(dockerComposePath, generateDockerCompose());

const prismaClientPath = path.join(outputDirectory, "src", "lib", "prisma.ts");

writeGeneratedFile(prismaClientPath, generatePrismaClient());

for (const entity of project.entities) {
  const servicePath = path.join(
    outputDirectory,
    "src",
    "services",
    `${entity.name.charAt(0).toLowerCase()}${entity.name.slice(1)}.service.ts`,
  );

  writeGeneratedFile(servicePath, generateService(entity));
}

for (const entity of project.entities) {
  const entityApis = project.apis.filter((api) => api.entity === entity.name);

  if (entityApis.length === 0) {
    continue;
  }

  const entityVariable = toVariableName(entity.name);

  const validationPath = path.join(
    outputDirectory,
    "src",
    "validation",
    `${entityVariable}.schema.ts`,
  );

  const validationMiddlewarePath = path.join(
    outputDirectory,
    "src",
    "middleware",
    `${entityVariable}.validation.ts`
  )

  const routePath = path.join(
    outputDirectory,
    "src",
    "routes",
    `${entityVariable}.routes.ts`,
  );

  writeGeneratedFile(validationMiddlewarePath, generateValidationMiddleware(entity))

  writeGeneratedFile(validationPath, generateValidationSchema(entity));

  writeGeneratedFile(routePath, generateRoute(entity.name, entityApis));
}
