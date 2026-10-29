"use client";

import { useRouter } from "next/navigation";
import { FormBuilder } from "@/components/builder/form-builder";
import type { FormDefinition } from "@/forms/definition";
import { trpc } from "@/trpc/client";

// No starter field: field ids are random, and generating one during render
// would differ between the server HTML and the client.
const initial: FormDefinition = { schemaVersion: 1, title: "Untitled form", fields: [] };

export default function NewFormPage() {
  const router = useRouter();
  const create = trpc.form.create.useMutation();

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
