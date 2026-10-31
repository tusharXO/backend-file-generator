import type { EntityDefinition } from "@backend-file-generator/shared";
import { toPluralName, toVariableName } from "../utils/name-utils";

export function generateService(entity: EntityDefinition): string {
  const variable = toVariableName(entity.name);
  const plural = toPluralName(entity.name);
  return `import { prisma } from "../lib/prisma.js";
import type {
  ${entity.name}Id,
  ${entity.name}CreateInput,
  ${entity.name}UpdateInput
} from "../validation/${variable}.schema.js";

export async function list${plural}() {
  return prisma.${variable}.findMany();
}

export async function get${entity.name}(id: ${entity.name}Id) {
  return prisma.${variable}.findUnique({ where: { ${entity.primaryKey}: id } });
}

export async function create${entity.name}(data: ${entity.name}CreateInput) {
  return prisma.${variable}.create({ data });
}

export async function update${entity.name}(id: ${entity.name}Id, data: ${entity.name}UpdateInput) {
  return prisma.${variable}.update({ where: { ${entity.primaryKey}: id }, data });
}

export async function delete${entity.name}(id: ${entity.name}Id) {
  return prisma.${variable}.delete({ where: { ${entity.primaryKey}: id } });
}
`;
}
