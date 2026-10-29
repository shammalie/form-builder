import type * as React from "react";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { FieldDef, FieldType } from "./definition";

type FieldOf<T extends FieldType> = Extract<FieldDef, { type: T }>;

export type FieldInputProps<T extends FieldType> = {
  field: FieldOf<T>;
  value: any; // eslint-disable-line @typescript-eslint/no-explicit-any -- RHF values are untyped for runtime forms
  onChange: (v: unknown) => void;
  invalid?: boolean;
};

type FieldEntry<T extends FieldType> = {
  label: string; // shown in the "Add field" menu
  create: (id: string) => FieldOf<T>;
  toZod: (f: FieldOf<T>) => z.ZodType;
  defaultValue: unknown;
  Input: React.ComponentType<FieldInputProps<T>>;
};

const optionalString = (s: z.ZodString, required: boolean) =>
  required ? s.min(1, "Required") : s;

export const fieldRegistry: { [T in FieldType]: FieldEntry<T> } = {
  text: {
    label: "Short text",
    create: (id) => ({ id, type: "text", label: "Untitled", required: false }),
    toZod: (f) => {
      let s = z.string().trim();
      if (f.maxLength) s = s.max(f.maxLength);
      return optionalString(s, f.required);
    },
    defaultValue: "",
    Input: ({ field, value, onChange, invalid }) => (
      <Input id={field.id} aria-invalid={invalid} value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
    ),
  },
  textarea: {
    label: "Long text",
    create: (id) => ({ id, type: "textarea", label: "Untitled", required: false }),
    toZod: (f) => {
      let s = z.string().trim();
      if (f.maxLength) s = s.max(f.maxLength);
      return optionalString(s, f.required);
    },
    defaultValue: "",
    Input: ({ field, value, onChange, invalid }) => (
      <Textarea id={field.id} aria-invalid={invalid} value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
    ),
  },
  email: {
    label: "Email",
    create: (id) => ({ id, type: "email", label: "Email", required: false }),
    toZod: (f) => {
      const email = z.string().trim().pipe(z.email("Enter a valid email"));
      return f.required ? email : email.or(z.literal(""));
    },
    defaultValue: "",
    Input: ({ field, value, onChange, invalid }) => (
      <Input
        id={field.id}
        type="email"
        inputMode="email"
        aria-invalid={invalid}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
      />
    ),
  },
  number: {
    label: "Number",
    create: (id) => ({ id, type: "number", label: "Number", required: false }),
    toZod: (f) => {
      let n = z.number({ error: f.required ? "Required" : "Enter a number" });
      if (f.min !== undefined) n = n.min(f.min);
      if (f.max !== undefined) n = n.max(f.max);
      // "" -> undefined, so an empty optional number isn't coerced to 0
      return z.preprocess((v) => (v === "" || v == null ? undefined : Number(v)), f.required ? n : n.optional());
    },
    defaultValue: "",
    Input: ({ field, value, onChange, invalid }) => (
      <Input
        id={field.id}
        type="number"
        inputMode="decimal"
        aria-invalid={invalid}
        min={field.min}
        max={field.max}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
      />
    ),
  },
  checkbox: {
    label: "Checkbox",
    create: (id) => ({ id, type: "checkbox", label: "I agree", required: false }),
    toZod: (f) => (f.required ? z.literal(true, { error: "Required" }) : z.boolean()),
    defaultValue: false,
    Input: ({ field, value, onChange, invalid }) => (
      <Checkbox
        id={field.id}
        aria-invalid={invalid}
        className="size-5"
        checked={value === true}
        onCheckedChange={(v) => onChange(v === true)}
      />
    ),
  },
  date: {
    label: "Date",
    create: (id) => ({ id, type: "date", label: "Date", required: false }),
    // stored as "YYYY-MM-DD"
    toZod: (f) => (f.required ? z.iso.date("Required") : z.iso.date().or(z.literal(""))),
    defaultValue: "",
    Input: ({ field, value, onChange, invalid }) => (
      <Input
        id={field.id}
        type="date"
        aria-invalid={invalid}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
      />
    ),
  },
  select: {
    label: "Dropdown",
    create: (id) => ({
      id,
      type: "select",
      label: "Choose one",
      required: false,
      options: [{ label: "Option 1", value: "option_1" }],
    }),
    toZod: (f) => {
      const e = z.enum(f.options.map((o) => o.value) as [string, ...string[]], { error: "Required" });
      return f.required ? e : e.or(z.literal(""));
    },
    defaultValue: "",
    Input: ({ field, value, onChange, invalid }) => (
      <Select value={value ?? ""} onValueChange={onChange}>
        <SelectTrigger id={field.id} aria-invalid={invalid} className="w-full">
          <SelectValue placeholder="Select…" />
        </SelectTrigger>
        <SelectContent>
          {field.options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    ),
  },
};

export const fieldTypes = Object.keys(fieldRegistry) as FieldType[];
