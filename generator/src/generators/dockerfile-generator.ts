export function generateDockerfile(): string {
  return `FROM node:24-bookworm-slim

RUN apt-get update \\
    && apt-get install -y --no-install-recommends openssl ca-certificates \\
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

COPY . .
RUN npm run db:init && npm run build

EXPOSE 3000
CMD ["sh", "-c", "npm run db:deploy && exec node dist/server.js"]
`;
}

export function generateDockerIgnore(): string {
  return `node_modules
dist
.git
.env
.env.*
!.env.example
*.log
src/generated/prisma
`;
}

export function generateGitIgnore(): string {
  return `node_modules/
dist/
.env
.env.*
!.env.example
*.log
src/generated/prisma/
`;
}
