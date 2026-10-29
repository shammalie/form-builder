"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { TRPCClientError } from "@trpc/client";
import { FormRenderer, type FieldErrors } from "@/components/renderer/form-renderer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isConflict, trpc } from "@/trpc/client";

export default function FillFormPage() {
  const { formId } = useParams<{ formId: string }>();
  const published = trpc.form.getPublished.useQuery({ formId });
  const create = trpc.submission.create.useMutation();
  const [submittedCount, setSubmittedCount] = useState(0);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (published.isLoading) return <p className="text-muted-foreground">Loading…</p>;
  if (published.error) return <p className="text-destructive">{published.error.message}</p>;
  if (!published.data) {
    return (
      <Card className="mx-auto max-w-xl">
        <CardContent className="py-8 text-center text-muted-foreground">This form isn&apos;t available.</CardContent>
      </Card>
    );
  }

  const { definition, versionId } = published.data;

  return (
    <Card className="mx-auto max-w-xl">
      <CardHeader>
        <CardTitle className="text-xl break-words">{definition.title}</CardTitle>
      </CardHeader>
      <CardContent>
        {done ? (
          <div className="space-y-4 py-4 text-center">
            <p className="text-lg font-medium">Thanks, your answers were saved.</p>
            <Button variant="outline" onClick={() => setDone(false)}>
              Submit another response
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {error && (
              <div className="space-y-2 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
                <p>{error}</p>
                {error.includes("reload") && (
                  <Button size="sm" variant="outline" onClick={() => window.location.reload()}>
                    Reload
                  </Button>
                )}
              </div>
            )}
            <FormRenderer
              key={`${versionId}-${submittedCount}`}
              definition={definition}
              onSubmit={async (data): Promise<FieldErrors | void> => {
                setError(null);
                try {
                  await create.mutateAsync({ formVersionId: versionId, data });
                  setSubmittedCount((n) => n + 1);
                  setDone(true);
                } catch (e) {
                  // Typed values stay in the form so nothing is lost.
                  if (isConflict(e)) setError("This form was updated, please reload.");
                  else setError((e as Error).message);
                  if (e instanceof TRPCClientError) return e.data?.fieldErrors ?? undefined;
                }
              }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
