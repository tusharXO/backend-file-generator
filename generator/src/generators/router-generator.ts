import { ApiDefinition } from "@backend-file-generator/shared";
import { toPluralName, toVariableName } from "../utils/name-utils";

export function generateRoute(
  entityName: string,
  apis: ApiDefinition[],
): string {
  const entityVariable = toVariableName(entityName);

  const imports: string[] = [];
  const routes: string[] = [];

  for (const api of apis) {
    if (api.entity !== entityName) {
      continue;
    }

    if (api.method === "GET" && api.operation === "list") {
      imports.push(`list${entityName}s`);

      routes.push(`router.get("${api.path}", async (_req, res) => {
  try {
    const ${entityVariable}s = await list${entityName}s();

    res.json(${entityVariable}s);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Internal server error"
    });
  }
});`);
      continue;
    }

    if (api.method === "POST" && api.operation === "create") {
      imports.push(`create${entityName}`);

      routes.push(`router.post("${api.path}", async (req, res) => {
  try {
    const ${entityVariable} = await create${entityName}(req.body);

    res.status(201).json(${entityVariable});
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Internal server error"
    });
  }
});`);

      continue;
    }

    throw new Error(
      `Unsupported API operation: ${api.method} ${api.operation}`,
    );
  }

  const uniqueImports = [...new Set(imports)];

  return `import { Router } from "express";
import { ${uniqueImports.join(", ")} } from "../services/${entityVariable}.service.js";

const router = Router();

${routes.join("\n\n")}

export default router;
`;
}
