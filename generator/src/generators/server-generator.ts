export function generateServer(routeImports: string, routeRegistrations: string): string {
  return `import express from "express";
import { prisma, disconnectDatabase } from "./lib/prisma.js";
import { errorHandler } from "./middleware/error-handler.js";
${routeImports}

const app = express();
app.use(express.json());

app.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw\`SELECT 1\`;
    res.json({ status: "ok", database: "connected" });
  } catch {
    res.status(503).json({ status: "error", database: "disconnected" });
  }
});

${routeRegistrations}
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});

let shuttingDown = false;
function shutdown(): void {
  if (shuttingDown) return;
  shuttingDown = true;
  const timeout = setTimeout(() => process.exit(1), 10000);
  timeout.unref();
  server.close(() => {
    void disconnectDatabase().then(() => {
      clearTimeout(timeout);
    }).catch(error => {
      console.error(error);
      process.exitCode = 1;
    });
  });
}

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
`;
}
