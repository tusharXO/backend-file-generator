import { z } from "zod";

export const ProductCreateSchema = z.object({
  name: z.string().min(2).max(200),
  price: z.number()
});

export const ProductUpdateSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  price: z.number().optional()
});

export type ProductCreateInput = z.infer<
  typeof ProductCreateSchema
>;

export type ProductUpdateInput = z.infer<
  typeof ProductUpdateSchema
>;
