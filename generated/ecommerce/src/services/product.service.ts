import { prisma } from "../lib/prisma.js";

export async function listProducts() {
  return prisma.product.findMany();
}

export async function getProduct(id: number) {
  return prisma.product.findUnique({
    where: {
      id: id,
    },
  });
}

export async function createProduct(data: any) {
  return prisma.product.create({
    data,
  });
}

export async function updateProduct(id: number, data: any) {
  return prisma.product.update({
    where: {
      id: id,
    },
    data,
  });
}

export async function deleteProduct(id: number) {
  return prisma.product.delete({
    where: {
      id: id,
    },
  });
}
