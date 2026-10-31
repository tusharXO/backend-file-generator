import { z } from "zod";

export const ProductIdSchema = z.string().regex(/^[1-9]\d*$/, "Expected a positive integer ID").transform(Number).pipe(z.number().int().min(1).max(2147483647));

export const ProductCreateSchema = z.strictObject({
  name: z.string().min(2).max(200),
  price: z.number()
});

export const ProductUpdateSchema = z.strictObject({
  name: z.string().min(2).max(200).optional(),
  price: z.number().optional()
}).refine(value => Object.keys(value).length > 0, {
  message: "Provide at least one field to update"
});

export type ProductId = z.infer<typeof ProductIdSchema>;
export type ProductCreateInput = z.infer<typeof ProductCreateSchema>;
export type ProductUpdateInput = z.infer<typeof ProductUpdateSchema>;
