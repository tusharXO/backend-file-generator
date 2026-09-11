import { ApiDefinition } from "@backend-file-generator/shared";
import { toVariableName } from "../utils/name-utils";

export function generateRouteImports(
    apis: ApiDefinition[]
): string{
    const entities = [
        ...new Set(
            apis
            .filter((api) => api.entity)
            .map((api) => api.entity!)
        )
    ]

    return entities.map((entity) => {
        const variableName = toVariableName(entity)

        return `import ${variableName}Router from "./routes/${variableName}.routes.js";`;
    })
    .join("\n")
}

export function generateRouteRegistrations(
    apis: ApiDefinition[]
): string{
    const entities = [
        ...new Set(
            apis
            .filter((api) => api.entity)
            .map((api) => api.entity!)
        )
    ]

    return entities.map((entity) => {
        const variableName = toVariableName(entity)

        return `app.use(${variableName}Router);`;
    })
    .join("\n")
}