import { FieldDefinition } from "./field";

export interface EntityDefinition {
    name: string;
    fields: FieldDefinition[];
    primaryKey: string;
}