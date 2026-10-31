import { prisma } from "../lib/prisma.js";
import type {
  ProductId,
  ProductCreateInput,
  ProductUpdateInput
} from "../validation/product.schema.js";

export async function listProducts() {
  return prisma.product.findMany();
}

export async function getProduct(id: ProductId) {
  return prisma.product.findUnique({ where: { id: id } });
}

export async function createProduct(data: ProductCreateInput) {
  return prisma.product.create({ data });
}

export async function updateProduct(id: ProductId, data: ProductUpdateInput) {
  return prisma.product.update({ where: { id: id }, data });
}

export async function deleteProduct(id: ProductId) {
  return prisma.product.delete({ where: { id: id } });
}
