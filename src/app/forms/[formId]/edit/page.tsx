"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { FormBuilder } from "@/components/builder/form-builder";
import { VersionsPanel } from "@/components/builder/versions-panel";
import { Button } from "@/components/ui/button";
import { isConflict, trpc } from "@/trpc/client";

export default function EditFormPage() {
  const { formId } = useParams<{ formId: string }>();
  const utils = trpc.useUtils();
  const latest = trpc.form.getLatest.useQuery({ formId });
  const save = trpc.form.saveVersion.useMutation();
  const [status, setStatus] = useState<React.ReactNode>(null);

  if (latest.isLoading) return <p className="text-muted-foreground">Loading…</p>;
  if (latest.error) return <p className="text-destructive">{latest.error.message}</p>;
  if (!latest.data) return null;

  const current = status ?? `Editing v${latest.data.version}${latest.data.published ? " (live)" : " (not published)"}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Edit form</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/forms/${formId}/fill`}>Open live form</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/forms/${formId}/submissions`}>Submissions</Link>
          </Button>
        </div>
      </div>
      <FormBuilder
        initial={latest.data.definition}
        status={current}
        sidebar={<VersionsPanel formId={formId} />}
        onSave={async (definition) => {
          try {
            const r = await save.mutateAsync({ formId, definition });
            setStatus(r.created ? `Saved v${r.version} (not published)` : `No changes, still v${r.version}`);
            utils.form.listVersions.invalidate({ formId });
            utils.form.list.invalidate();
          } catch (e) {
            setStatus(
              <span className="text-destructive">
                {isConflict(e) ? "Someone else saved at the same time. Reload and try again." : (e as Error).message}
              </span>,
            );
          }
        }}
      />
    </div>
  );
}
