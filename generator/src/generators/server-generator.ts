export function generateServer(
  routeImports: string,
  routeRegistrations: string,
): string {
  return `import express from "express";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client.js";

${routeImports}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter
});

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw\`SELECT 1\`;

    res.json({
      status: "ok",
      database: "connected"
    });
  } catch {
    res.status(503).json({
      status: "error",
      database: "disconnected"
    });
  }
});

${routeRegistrations}

app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});
`;
}
