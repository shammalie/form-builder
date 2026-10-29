"use client";

import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formDefinitionSchema, newFieldId, type FormDefinition } from "@/forms/definition";
import { fieldRegistry } from "@/forms/field-registry";
import { AddFieldMenu } from "./add-field-menu";
import { ErrorText } from "./error-text";
import { FieldEditor } from "./field-editor";
import { FormPreview } from "./form-preview";

type Props = {
  initial: FormDefinition;
  onSave: (d: FormDefinition) => Promise<void>;
  status?: React.ReactNode;
  sidebar?: React.ReactNode;
};

export function FormBuilder({ initial, onSave, status, sidebar }: Props) {
  const form = useForm<FormDefinition>({ resolver: zodResolver(formDefinitionSchema), defaultValues: initial });
  // keyName "key" stops useFieldArray from overwriting our own stable `id`.
  const fields = useFieldArray({ control: form.control, name: "fields", keyName: "key" });
  const { errors, isSubmitting } = form.formState;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
      <div className="space-y-4">
        {/* The preview renders its own <form>, so it must stay outside this one. */}
        <form onSubmit={form.handleSubmit(onSave)} noValidate className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="form-title">Form title</Label>
            <Input id="form-title" className="h-10 text-base" {...form.register("title")} />
            <ErrorText error={errors.title} />
          </div>

          {fields.fields.map((f, i) => (
            <FieldEditor
              key={f.key}
              index={i}
              count={fields.fields.length}
              control={form.control}
              register={form.register}
              errors={errors}
              onMove={(to) => fields.move(i, to)}
              onRemove={() => fields.remove(i)}
            />
          ))}
          <ErrorText error={errors.fields?.root ?? errors.fields} />

          <AddFieldMenu onAdd={(type) => fields.append(fieldRegistry[type].create(newFieldId()))} />

          <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t bg-background/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-lg sm:border">
            <Button type="submit" size="lg" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : "Save new version"}
            </Button>
            <div className="min-w-0 text-sm text-muted-foreground">{status}</div>
          </div>
        </form>

        {sidebar}
      </div>

      <Card className="lg:sticky lg:top-20">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Live preview</CardTitle>
        </CardHeader>
        <CardContent>
          <FormPreview control={form.control} />
        </CardContent>
      </Card>
    </div>
  );
}
