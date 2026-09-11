import { EntityDefinition } from "@backend-file-generator/shared";
import { toPluralName, toVariableName } from "../utils/name-utils";

export function generateService(
    entity: EntityDefinition
): string{
    const variableName = toVariableName(entity.name);
    const pluralName = toPluralName(entity.name)

  return `import { prisma } from "../lib/prisma.js";

export async function list${pluralName}() {
  return prisma.${variableName}.findMany();
}

export async function create${entity.name}(data: any) {
  return prisma.${variableName}.create({
    data
  });
}
`;
}