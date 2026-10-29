"use client";

import { useWatch, type Control } from "react-hook-form";
import { FormRenderer } from "@/components/renderer/form-renderer";
import { fieldSchema, type FormDefinition } from "@/forms/definition";

export function FormPreview({ control }: { control: Control<FormDefinition> }) {
  const values = useWatch({ control });
  // Preview only the fields that are currently valid, so half-edited ones don't break it.
  const definition: FormDefinition = {
    schemaVersion: 1,
    title: values.title || "Untitled form",
    fields: (values.fields ?? []).flatMap((f) => {
      const r = fieldSchema.safeParse(f);
      return r.success ? [r.data] : [];
    }),
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold break-words">{definition.title}</h2>
      {definition.fields.length === 0 ? (
        <p className="text-sm text-muted-foreground">Add a field to see the preview.</p>
      ) : (
        // Remount when the definition changes so RHF starts from fresh defaults.
        <FormRenderer key={JSON.stringify(definition)} definition={definition} preview />
      )}
    </div>
  );
}
