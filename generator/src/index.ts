import fs from "fs";
import path from "path";

import {
  validateProject,
  type ProjectDefinition
} from "@backend-file-generator/shared";
import { generatePrismaModel } from "./generators/model-generator";
import { writeGeneratedFile } from "./output/file-writer";
import { createProjectStructure } from "./generators/project-generator";

const projectPath = path.resolve(
  __dirname,"../../examples/ecommerce.json"
)

const projectFile = fs.readFileSync(projectPath, "utf-8")

const project: ProjectDefinition = JSON.parse(projectFile)

const result = validateProject(project);

if(!result.valid){
  console.error(result.errors)
  process.exit(1);
}

const models = project.entities.map((entity) => generatePrismaModel(entity)).join("\n\n")

const outputDirectory = path.resolve(
  __dirname,
  "../../generated/ecommerce"
)

createProjectStructure(outputDirectory)

const outputPath = path.resolve(
  outputDirectory,
  "prisma",
  "schema.prisma"
)

writeGeneratedFile(outputPath, models);

console.log(`Generated: ${outputPath}`)