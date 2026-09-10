import { EntityDefinition } from "./entity";
import { RelationshipDefinition } from "./relationship";

export interface ProjectDefinition {
    name: string;
    version: string;
    entities: EntityDefinition[];
    relationships: RelationshipDefinition[];
}