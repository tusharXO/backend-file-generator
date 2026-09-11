import { prisma } from "../lib/prisma.js";

export async function listUsers() {
  return prisma.user.findMany();
}

export async function createUser(data: any) {
  return prisma.user.create({
    data
  });
}
