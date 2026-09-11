export function generatePrismaSchemaConfig(): string{
    return`generator client { 
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
}
`;
}