export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type CrudOperation = "create" | "list" | "get" | "update" | "delete";

export interface ApiDefinition {
  name: string;
  method: HttpMethod;
  path: string;
  entity?: string;
  operation?: CrudOperation
}
