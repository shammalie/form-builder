"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FormBuilder } from "@/components/builder/form-builder";
import { newFieldId, type FormDefinition } from "@/forms/definition";
import { fieldRegistry } from "@/forms/field-registry";
import { trpc } from "@/trpc/client";

export default function NewFormPage() {
  const router = useRouter();
  const create = trpc.form.create.useMutation();
  const [initial] = useState<FormDefinition>(() => ({
    schemaVersion: 1,
    title: "Untitled form",
    fields: [{ ...fieldRegistry.text.create(newFieldId()), label: "Name" }],
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">New form</h1>
      <FormBuilder
        initial={initial}
        status={create.error ? <span className="text-destructive">{create.error.message}</span> : "Not saved yet"}
        onSave={async (definition) => {
          try {
            const { formId } = await create.mutateAsync({ definition });
            router.push(`/forms/${formId}/edit`);
          } catch {
            // create.error is shown in the status area
          }
        }}
      />
    </div>
  );
}
