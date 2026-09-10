import fs from "fs"

export function createProjectStructure(outputDirectory: string): void {
  const directories = [
    "prisma",
    "src",
    "src/controllers",
    "src/routes",
    "src/services",
    "src/middleware",
  ];

  for(const directory of directories){ 
    fs.mkdirSync(`${outputDirectory}/${directory}`, {recursive: true})
  }
}
