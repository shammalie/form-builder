import { z } from "zod";
import { customAlphabet } from "nanoid";

const base = {
  // Stable id (no "." or "-"): React key, RHF field name and submission key.
  id: z.string().regex(/^[A-Za-z0-9_]+$/),
  label: z.string().trim().min(1, "Label is required"),
  required: z.boolean(),
};

const optionalPositiveInt = z.number().int().positive().optional();

export const fieldSchema = z.discriminatedUnion("type", [
  z.object({ ...base, type: z.literal("text"), maxLength: optionalPositiveInt }),
  z.object({ ...base, type: z.literal("textarea"), maxLength: optionalPositiveInt }),
  z.object({ ...base, type: z.literal("email") }),
  z.object({ ...base, type: z.literal("number"), min: z.number().optional(), max: z.number().optional() }),
  z.object({ ...base, type: z.literal("checkbox") }),
  z.object({ ...base, type: z.literal("date") }),
  z.object({
    ...base,
    type: z.literal("select"),
    options: z
      .array(
        z.object({
          label: z.string().trim().min(1, "Option label is required"),
          value: z.string().trim().min(1, "Option value is required"),
        }),
      )
      .min(1, "Add at least one option"),
  }),
]);

export const formDefinitionSchema = z
  .object({
    schemaVersion: z.literal(1), // version of the *format*, not of the form
    title: z.string().trim().min(1, "Title is required"),
    fields: z.array(fieldSchema).min(1, "Add at least one field"),
  })
  .refine((d) => new Set(d.fields.map((f) => f.id)).size === d.fields.length, {
    message: "Field ids must be unique",
    path: ["fields"],
  });

export type FieldDef = z.infer<typeof fieldSchema>;
export type FieldType = FieldDef["type"];
export type FormDefinition = z.infer<typeof formDefinitionSchema>;

export const newFieldId = customAlphabet(
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
  8,
);
