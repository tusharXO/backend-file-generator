export function generateEnv(): string {
  return `# Local development only. Docker Compose uses its internal postgres hostname.
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ecommerce"
PORT=3000
POSTGRES_PORT=5432
`;
}
