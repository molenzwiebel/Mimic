import Based, { Basie, field } from "basie";

/**
 * Represents an entry in the database that links internal and external IP together.
 */
abstract class InstanceModel extends Basie {
    @field
    internalIP: string;

    @field
    externalIP: string;
}
export const Instance = Based(InstanceModel, "instance");