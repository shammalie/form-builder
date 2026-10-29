"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isConflict, trpc } from "@/trpc/client";

export function VersionsPanel({ formId }: { formId: string }) {
  const utils = trpc.useUtils();
  const versions = trpc.form.listVersions.useQuery({ formId });
  const publish = trpc.form.publish.useMutation({
    onSettled: () => {
      utils.form.listVersions.invalidate({ formId });
      utils.form.getLatest.invalidate({ formId });
      utils.form.list.invalidate();
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Versions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {publish.error && (
          <p className="text-sm text-destructive">
            {isConflict(publish.error) ? "Someone else published at the same time. Try again." : publish.error.message}
          </p>
        )}
        {versions.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        <ul className="divide-y">
          {versions.data?.map((v) => (
            <li key={v.versionId} className="flex items-center justify-between gap-3 py-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2 font-medium">
                  v{v.version}
                  {v.published && <Badge>Live</Badge>}
                </div>
                <div className="text-xs text-muted-foreground">
                  {v.createdAt.toLocaleString()} · {v.submissionCount} submission{v.submissionCount === 1 ? "" : "s"}
                </div>
              </div>
              {!v.published && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={publish.isPending}
                  onClick={() => publish.mutate({ formId, versionId: v.versionId })}
                >
                  Publish
                </Button>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
