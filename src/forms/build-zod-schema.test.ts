import { describe, expect, it } from "vitest";
import { buildDefaultValues, buildZodSchema } from "./build-zod-schema";
import { formDefinitionSchema, type FormDefinition } from "./definition";

const def: FormDefinition = {
  schemaVersion: 1,
  title: "Signup",
  fields: [
    { id: "name", type: "text", label: "Name", required: true, maxLength: 5 },
    { id: "bio", type: "textarea", label: "Bio", required: false },
    { id: "email", type: "email", label: "Email", required: false },
    { id: "age", type: "number", label: "Age", required: false, min: 18, max: 99 },
    { id: "terms", type: "checkbox", label: "Terms", required: true },
    { id: "born", type: "date", label: "Born", required: false },
    {
      id: "color",
      type: "select",
      label: "Color",
      required: true,
      options: [
        { label: "Red", value: "red" },
        { label: "Blue", value: "blue" },
      ],
    },
  ],
};

const valid = { name: "Ada", bio: "", email: "", age: "", terms: true, born: "", color: "red" };

describe("formDefinitionSchema", () => {
  it("accepts a valid definition", () => {
    expect(formDefinitionSchema.safeParse(def).success).toBe(true);
  });

  it("rejects duplicate field ids", () => {
    const dup = { ...def, fields: [def.fields[0], def.fields[0]] };
    expect(formDefinitionSchema.safeParse(dup).success).toBe(false);
  });

  it("rejects ids with dots or dashes", () => {
    const bad = { ...def, fields: [{ ...def.fields[0], id: "a.b" }] };
    expect(formDefinitionSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects a select without options and an empty form", () => {
    const noOptions = { ...def, fields: [{ id: "s", type: "select", label: "S", required: false, options: [] }] };
    expect(formDefinitionSchema.safeParse(noOptions).success).toBe(false);
    expect(formDefinitionSchema.safeParse({ ...def, fields: [] }).success).toBe(false);
  });
});

describe("buildZodSchema", () => {
  const schema = buildZodSchema(def);

  it("default values have one key per field", () => {
    expect(Object.keys(buildDefaultValues(def))).toEqual(def.fields.map((f) => f.id));
  });

  it("accepts valid data and leaves an empty optional number undefined", () => {
    const r = schema.parse(valid);
    expect(r.age).toBeUndefined();
    expect(schema.parse({ ...valid, age: "42" }).age).toBe(42);
  });

  it("enforces required fields", () => {
    expect(schema.safeParse({ ...valid, name: "  " }).success).toBe(false);
    expect(schema.safeParse({ ...valid, terms: false }).success).toBe(false);
    expect(schema.safeParse({ ...valid, color: "" }).success).toBe(false);
  });

  it("enforces type-specific rules", () => {
    expect(schema.safeParse({ ...valid, name: "toolong" }).success).toBe(false);
    expect(schema.safeParse({ ...valid, age: "10" }).success).toBe(false);
    expect(schema.safeParse({ ...valid, email: "nope" }).success).toBe(false);
    expect(schema.safeParse({ ...valid, born: "2020-13-45" }).success).toBe(false);
    expect(schema.safeParse({ ...valid, color: "green" }).success).toBe(false);
  });

  it("rejects unknown keys", () => {
    expect(schema.safeParse({ ...valid, extra: 1 }).success).toBe(false);
  });
});
