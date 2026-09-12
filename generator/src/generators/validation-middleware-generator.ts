import type { EntityDefinition } from "@backend-file-generator/shared";
import { toVariableName } from "../utils/name-utils";

export function generateValidationMiddleware(
  entity: EntityDefinition
): string {
  const entityVariable = toVariableName(entity.name);

  return `import type { Request, Response, NextFunction } from "express";
import {
  ${entity.name}CreateSchema,
  ${entity.name}UpdateSchema
} from "../validation/${entityVariable}.schema.js";

export function validate${entity.name}Create(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const result = ${entity.name}CreateSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({
      error: "Validation failed",
      details: result.error.issues
    });

    return;
  }

  req.body = result.data;

  next();
}

export function validate${entity.name}Update(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const result = ${entity.name}UpdateSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({
      error: "Validation failed",
      details: result.error.issues
    });

    return;
  }

  req.body = result.data;

  next();
}
`;
}