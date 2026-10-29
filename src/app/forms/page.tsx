"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/trpc/client";

export default function FormsPage() {
  const utils = trpc.useUtils();
  const forms = trpc.form.list.useQuery();
  const archive = trpc.form.archive.useMutation({ onSuccess: () => utils.form.list.invalidate() });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Forms</h1>
      {forms.isLoading && <p className="text-muted-foreground">Loading…</p>}
      {forms.error && <p className="text-destructive">{forms.error.message}</p>}
      {forms.data?.length === 0 && (
        <Card>
          <CardContent className="space-y-3 py-6 text-center">
            <p className="text-muted-foreground">No forms yet.</p>
            <Button asChild>
              <Link href="/forms/new">Create your first form</Link>
            </Button>
          </CardContent>
        </Card>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {forms.data?.map((f) => (
          <Card key={f.id}>
            <CardHeader>
              <CardTitle className="break-words">{f.title}</CardTitle>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                {f.publishedVersion ? (
                  <Badge>Live v{f.publishedVersion}</Badge>
                ) : (
                  <Badge variant="secondary">Not published</Badge>
                )}
                <span>latest v{f.latestVersion}</span>
              </div>
            </CardHeader>
            <CardFooter className="flex flex-wrap gap-2">
              <Button asChild size="sm">
                <Link href={`/forms/${f.id}/edit`}>Edit</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href={`/forms/${f.id}/fill`}>Fill</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href={`/forms/${f.id}/submissions`}>Submissions</Link>
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive"
                disabled={archive.isPending}
                onClick={() => {
                  if (confirm(`Archive "${f.title}"? It will be hidden and can't be filled in.`)) {
                    archive.mutate({ formId: f.id });
                  }
                }}
              >
                Archive
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
