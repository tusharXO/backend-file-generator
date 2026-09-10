export type FieldType =
  | "string"
  | "integer"
  | "number"
  | "boolean"
  | "date"
  | "datetime";

export interface FieldDefinition {
    name: string;
    type: FieldType;
    required: boolean;
    defaultValue?: string | number | boolean;
}