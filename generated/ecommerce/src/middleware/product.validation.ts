import type { Request, Response, NextFunction } from "express";
import {
  ProductCreateSchema,
  ProductUpdateSchema
} from "../validation/product.schema.js";

export function validateProductCreate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const result = ProductCreateSchema.safeParse(req.body);

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

export function validateProductUpdate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const result = ProductUpdateSchema.safeParse(req.body);

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
