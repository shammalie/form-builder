import { z } from "zod";
import type { FormDefinition } from "./definition";
import { fieldRegistry } from "./field-registry";

export function buildZodSchema(def: FormDefinition) {
  const shape: Record<string, z.ZodType> = {};
  for (const f of def.fields) shape[f.id] = fieldRegistry[f.type].toZod(f as never);
  return z.object(shape).strict(); // reject unknown keys on the server
}

export function buildDefaultValues(def: FormDefinition): Record<string, unknown> {
  return Object.fromEntries(def.fields.map((f) => [f.id, fieldRegistry[f.type].defaultValue]));
}
