export function generatePrismaClient(): string {
  return `import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });

export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
  } finally {
    await pool.end();
  }
}
`;
}
