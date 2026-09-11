export function generateTsConfig(): string {
  const tsConfig = {
    compilerOptions: {
      target: "ES2022",
      module: "NodeNext",
      moduleResolution: "NodeNext",
      rootDir: "src",
      outDir: "dist",
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true
    },
    include: ["src"]
  };

  return JSON.stringify(tsConfig, null, 2);
}