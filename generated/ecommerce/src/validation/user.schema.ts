import { z } from "zod";

export const UserCreateSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().min(5).max(255)
});

export const UserUpdateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().min(5).max(255).optional()
});

export type UserCreateInput = z.infer<
  typeof UserCreateSchema
>;

export type UserUpdateInput = z.infer<
  typeof UserUpdateSchema
>;
