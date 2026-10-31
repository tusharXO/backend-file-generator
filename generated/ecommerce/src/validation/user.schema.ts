import { z } from "zod";

export const UserIdSchema = z.string().regex(/^[1-9]\d*$/, "Expected a positive integer ID").transform(Number).pipe(z.number().int().min(1).max(2147483647));

export const UserCreateSchema = z.strictObject({
  name: z.string().min(2).max(100),
  email: z.string().min(5).max(255)
});

export const UserUpdateSchema = z.strictObject({
  name: z.string().min(2).max(100).optional(),
  email: z.string().min(5).max(255).optional()
}).refine(value => Object.keys(value).length > 0, {
  message: "Provide at least one field to update"
});

export type UserId = z.infer<typeof UserIdSchema>;
export type UserCreateInput = z.infer<typeof UserCreateSchema>;
export type UserUpdateInput = z.infer<typeof UserUpdateSchema>;
