import type { ApiDefinition } from "@backend-file-generator/shared";
import { toVariableName } from "../utils/name-utils";

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

    if (api.method === "GET" && api.operation === "get") {
      imports.push(`get${entityName}`);

      routes.push(`router.get("${api.path}", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const ${entityVariable} = await get${entityName}(id);

    if (!${entityVariable}) {
      res.status(404).json({
        error: "${entityName} not found"
      });

      return;
    }

    res.json(${entityVariable});
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

      routes.push(`router.post("${api.path}", validate${entityName}Create, async (req, res) => {
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

    if (api.method === "PUT" && api.operation === "update") {
      imports.push(`update${entityName}`);

      routes.push(`router.put("${api.path}", validate${entityName}Update, async (req, res) => {
  try {
    const id = Number(req.params.id);

    const ${entityVariable} = await update${entityName}(id, req.body);

    res.json(${entityVariable});
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Internal server error"
    });
  }
});`);

      continue;
    }

    if (api.method === "DELETE" && api.operation === "delete") {
      imports.push(`delete${entityName}`);

      routes.push(`router.delete("${api.path}", async (req, res) => {
  try {
    const id = Number(req.params.id);

    await delete${entityName}(id);

    res.status(204).send();
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
      `Unsupported API operation: \${api.method} \${api.operation}`,
    );
  }

  const uniqueImports = [...new Set(imports)];

  const validationImport = `import {
  validate${entityName}Create,
  validate${entityName}Update
} from "../middleware/${entityVariable}.validation.js";`;

  return `import { Router } from "express";
import { ${uniqueImports.join(", ")} } from "../services/${entityVariable}.service.js";
${validationImport}

const router = Router();

${routes.join("\n\n")}

export default router;
`;
}
