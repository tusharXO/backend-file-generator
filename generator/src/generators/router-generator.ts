import type { ApiDefinition, EntityDefinition } from "@backend-file-generator/shared";
import { toPluralName, toVariableName } from "../utils/name-utils";

export function generateRoute(entity: EntityDefinition, apis: ApiDefinition[]): string {
  const name = entity.name;
  const variable = toVariableName(name);
  const services = new Set<string>();
  const middleware = new Set<string>();
  let needsId = false;
  const routes = apis.filter(api => api.entity === name).map(api => {
    const path = JSON.stringify(api.path);
    const hasId = ["get", "update", "delete"].includes(api.operation ?? "");
    let validation = "";
    if (hasId) {
      needsId = true;
      validation = `  const id = ${name}IdSchema.safeParse(req.params[${JSON.stringify(entity.primaryKey)}]);
  if (!id.success) {
    res.status(400).json({ error: "Invalid ID", details: id.error.issues });
    return;
  }

`;
    }
    let handler: string;
    let beforeHandler = "";
    if (api.method === "GET" && api.operation === "list") {
      services.add(`list${toPluralName(name)}`);
      handler = `  res.json(await list${toPluralName(name)}());`;
    } else if (api.method === "GET" && api.operation === "get") {
      services.add(`get${name}`);
      handler = `  const record = await get${name}(id.data);
  if (!record) {
    res.status(404).json({ error: ${JSON.stringify(`${name} not found`)} });
    return;
  }
  res.json(record);`;
    } else if (api.method === "POST" && api.operation === "create") {
      services.add(`create${name}`);
      middleware.add(`validate${name}Create`);
      beforeHandler = `validate${name}Create, `;
      handler = `  res.status(201).json(await create${name}(req.body));`;
    } else if (api.method === "PUT" && api.operation === "update") {
      services.add(`update${name}`);
      middleware.add(`validate${name}Update`);
      beforeHandler = `validate${name}Update, `;
      handler = `  res.json(await update${name}(id.data, req.body));`;
    } else if (api.method === "DELETE" && api.operation === "delete") {
      services.add(`delete${name}`);
      handler = `  await delete${name}(id.data);
  res.status(204).send();`;
    } else {
      throw new Error(`Unsupported API operation: ${api.method} ${api.operation}`);
    }
    // Express 5 forwards rejected async handlers to the central error middleware.
    return `router.${api.method.toLowerCase()}(${path}, ${beforeHandler}async (req, res) => {
${validation}${handler}
});`;
  });
  const imports = [
    'import { Router } from "express";',
    `import { ${[...services].join(", ")} } from "../services/${variable}.service.js";`,
  ];
  if (middleware.size) imports.push(`import { ${[...middleware].join(", ")} } from "../middleware/${variable}.validation.js";`);
  if (needsId) imports.push(`import { ${name}IdSchema } from "../validation/${variable}.schema.js";`);
  return `${imports.join("\n")}

const router = Router();

${routes.join("\n\n")}

export default router;
`;
}
