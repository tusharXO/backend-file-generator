import type { Request, Response, NextFunction } from "express";
import {
  UserCreateSchema,
  UserUpdateSchema
} from "../validation/user.schema.js";

export function validateUserCreate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const result = UserCreateSchema.safeParse(req.body);

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

export function validateUserUpdate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const result = UserUpdateSchema.safeParse(req.body);

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
