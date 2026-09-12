import { prisma } from "../lib/prisma.js";

export async function listUsers() {
  return prisma.user.findMany();
}

export async function getUser(id: number) {
  return prisma.user.findUnique({
    where: {
      id: id,
    },
  });
}

export async function createUser(data: any) {
  return prisma.user.create({
    data,
  });
}

export async function updateUser(id: number, data: any) {
  return prisma.user.update({
    where: {
      id: id,
    },
    data,
  });
}

export async function deleteUser(id: number) {
  return prisma.user.delete({
    where: {
      id: id,
    },
  });
}
