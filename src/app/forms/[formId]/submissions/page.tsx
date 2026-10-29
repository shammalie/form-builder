"use client";

import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { FieldDef } from "@/forms/definition";
import { trpc } from "@/trpc/client";

function formatAnswer(field: FieldDef, value: unknown) {
  if (field.type === "checkbox") return value === true ? "Yes" : "No";
  if (value === undefined || value === null || value === "") return "—";
  if (field.type === "select") return field.options.find((o) => o.value === value)?.label ?? String(value);
  return String(value);
}

export default function SubmissionsPage() {
  const { formId } = useParams<{ formId: string }>();
  const list = trpc.submission.list.useQuery({ formId });

  if (list.isLoading) return <p className="text-muted-foreground">Loading…</p>;
  if (list.error) return <p className="text-destructive">{list.error.message}</p>;
  if (!list.data) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold break-words">Submissions: {list.data.title}</h1>
      {list.data.versions.length === 0 && <p className="text-muted-foreground">No submissions yet.</p>}

      {list.data.versions.map((v) => {
        const fields = v.definition.fields;
        return (
          <Card key={v.versionId}>
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center gap-2">
                Version {v.version}
                {v.published && <Badge>Live</Badge>}
                <span className="text-sm font-normal text-muted-foreground">
                  {v.submissions.length} submission{v.submissions.length === 1 ? "" : "s"}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Phones: one card per submission. */}
              <ul className="space-y-3 md:hidden">
                {v.submissions.map((s) => (
                  <li key={s.id} className="rounded-lg border bg-background p-3">
                    <div className="mb-2 text-xs text-muted-foreground">{s.createdAt.toLocaleString()}</div>
                    <dl className="space-y-1.5 text-sm">
                      {fields.map((f) => (
                        <div key={f.id} className="grid grid-cols-[40%_1fr] gap-2">
                          <dt className="text-muted-foreground break-words">{f.label}</dt>
                          <dd className="break-words">{formatAnswer(f, s.data[f.id])}</dd>
                        </div>
                      ))}
                    </dl>
                  </li>
                ))}
              </ul>

              {/* Tablet and up: a table with this version's own labels as columns. */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left text-sm">
                  <thead className="border-b text-muted-foreground">
                    <tr>
                      <th className="py-2 pr-4 font-medium whitespace-nowrap">Submitted</th>
                      {fields.map((f) => (
                        <th key={f.id} className="py-2 pr-4 font-medium">
                          {f.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {v.submissions.map((s) => (
                      <tr key={s.id}>
                        <td className="py-2 pr-4 whitespace-nowrap text-muted-foreground">
                          {s.createdAt.toLocaleString()}
                        </td>
                        {fields.map((f) => (
                          <td key={f.id} className="max-w-xs py-2 pr-4 break-words">
                            {formatAnswer(f, s.data[f.id])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
