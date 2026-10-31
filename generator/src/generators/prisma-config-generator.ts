export function generatePrismaConfig(): string {
  return `import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: {
    // Client generation and initial SQL generation do not need a running database.
    url: process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/ecommerce",
  },
});
`;
}
