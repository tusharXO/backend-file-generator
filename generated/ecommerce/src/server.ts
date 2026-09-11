import express from "express";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client.js";

import userRouter from "./routes/user.routes.js";
import productRouter from "./routes/product.routes.js";

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
    await prisma.$queryRaw`SELECT 1`;

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

app.use(userRouter);
app.use(productRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
