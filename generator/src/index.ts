import fs from "fs";
import path from "path";

import {
  validateProject,
  type ProjectDefinition
} from "@backend-file-generator/shared";

const projectPath = path.resolve(
  __dirname,"../../examples/ecommerce.json"
)

const projectFile = fs.readFileSync(projectPath, "utf-8")

const project: ProjectDefinition = JSON.parse(projectFile)

const result = validateProject(project);

console.log(JSON.stringify(result, null, 2));