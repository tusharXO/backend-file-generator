import { prisma } from "../lib/prisma.js";
import type {
  UserId,
  UserCreateInput,
  UserUpdateInput
} from "../validation/user.schema.js";

export async function listUsers() {
  return prisma.user.findMany();
}

export async function getUser(id: UserId) {
  return prisma.user.findUnique({ where: { id: id } });
}

export async function createUser(data: UserCreateInput) {
  return prisma.user.create({ data });
}

export async function updateUser(id: UserId, data: UserUpdateInput) {
  return prisma.user.update({ where: { id: id }, data });
}

export async function deleteUser(id: UserId) {
  return prisma.user.delete({ where: { id: id } });
}
