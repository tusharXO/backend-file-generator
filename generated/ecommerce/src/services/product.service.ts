import { prisma } from "../lib/prisma.js";

export async function listProducts() {
  return prisma.product.findMany();
}

export async function createProduct(data: any) {
  return prisma.product.create({
    data
  });
}
