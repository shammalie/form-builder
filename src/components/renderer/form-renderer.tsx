"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import type { FormDefinition } from "@/forms/definition";
import { buildDefaultValues, buildZodSchema } from "@/forms/build-zod-schema";
import { RenderedField } from "./rendered-field";

export type FieldErrors = Record<string, string[] | undefined>;

type Props = {
  definition: FormDefinition;
  // May return server-side field errors, which are shown next to their fields.
  onSubmit?: (data: Record<string, unknown>) => Promise<FieldErrors | void>;
  preview?: boolean;
};

export function FormRenderer({ definition, onSubmit, preview }: Props) {
  const schema = useMemo(() => buildZodSchema(definition), [definition]);
  const form = useForm<Record<string, unknown>>({
    resolver: zodResolver(schema),
    defaultValues: buildDefaultValues(definition),
  });

  const submit = form.handleSubmit(async (data) => {
    if (preview || !onSubmit) return;
    const errors = await onSubmit(data);
    for (const [name, messages] of Object.entries(errors ?? {})) {
      if (messages?.length) form.setError(name, { message: messages[0] });
    }
  });

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      {definition.fields.map((field) => (
        <RenderedField key={field.id} field={field} control={form.control} />
      ))}
      <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={preview || form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Submitting…" : "Submit"}
      </Button>
    </form>
  );
}
