export type RealtionshipType =
  | "one-to-one"
  | "one-to-many"
  | "many-to-one"
  | "many-to-many";

export interface RelationshipDefinition {
    name: string;
    type: RealtionshipType;
    from: string;
    to: string
}