import { ProjectDefinition } from "../ir/project";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateProject(project: ProjectDefinition): ValidationResult {
  const errors: string[] = [];

  const entityNames = new Set<string>();

  for (const entity of project.entities) {
    if (entityNames.has(entity.name)) {
      errors.push(`Duplicate entity name: ${entity}`);
    } else {
      entityNames.add(entity.name);
    }
  }

  for (const api of project.apis) {
    if (api.entity && !entityNames.has(api.entity)) {
      errors.push(`API "${api.name}" references unknown entity: ${api.entity}`);
    }
  }

  for (const entity of project.entities) {
    const hasPrimaryKey = entity.fields.some(
      (field) => field.name === entity.primaryKey,
    );

    if (!hasPrimaryKey) {
      errors.push(
        `Entity "${entity.name}" references unknown primary key: ${entity.primaryKey}`,
      );
    }
  }

  for (const relationship of project.relationships) {
    if (!entityNames.has(relationship.from)) {
      errors.push(
        `Relationship "${relationship.name}" references unknown entity: ${relationship.from}`,
      );
    }
    if (!entityNames.has(relationship.to)) {
      errors.push(
        `Relationship "${relationship.name}" references unknown entity: ${relationship.to}`,
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
