"use client";

import { Controller, get, useWatch, type Control, type FieldErrors, type UseFormRegister } from "react-hook-form";
import { ArrowDownIcon, ArrowUpIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FormDefinition } from "@/forms/definition";
import { fieldRegistry } from "@/forms/field-registry";
import { ErrorText } from "./error-text";
import { OptionsEditor } from "./options-editor";

type Props = {
  index: number;
  count: number;
  control: Control<FormDefinition>;
  register: UseFormRegister<FormDefinition>;
  errors: FieldErrors<FormDefinition>;
  onMove: (to: number) => void;
  onRemove: () => void;
};

const optionalNumber = { setValueAs: (v: string) => (v === "" || v == null ? undefined : Number(v)) };

export function FieldEditor({ index, count, control, register, errors, onMove, onRemove }: Props) {
  const name = `fields.${index}` as const;
  const type = useWatch({ control, name: `${name}.type` });
  const id = useWatch({ control, name: `${name}.id` });

  return (
    <Card size="sm">
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{fieldRegistry[type].label}</span>
            <span className="ml-2 font-mono">#{id}</span>
          </div>
          <div className="flex shrink-0 gap-1">
            <Button type="button" variant="ghost" size="icon" aria-label="Move up" disabled={index === 0} onClick={() => onMove(index - 1)}>
              <ArrowUpIcon />
            </Button>
            <Button type="button" variant="ghost" size="icon" aria-label="Move down" disabled={index === count - 1} onClick={() => onMove(index + 1)}>
              <ArrowDownIcon />
            </Button>
            <Button type="button" variant="ghost" size="icon" aria-label="Remove field" onClick={onRemove}>
              <Trash2Icon />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${id}-label`}>Label</Label>
          <Input id={`${id}-label`} {...register(`${name}.label`)} />
          <ErrorText error={get(errors, `${name}.label`)} />
        </div>

        <Controller
          control={control}
          name={`${name}.required`}
          render={({ field }) => (
            <div className="flex items-center gap-3">
              <Checkbox
                id={`${id}-required`}
                className="size-5"
                checked={field.value}
                onCheckedChange={(v) => field.onChange(v === true)}
              />
              <Label htmlFor={`${id}-required`}>Required</Label>
            </div>
          )}
        />

        {(type === "text" || type === "textarea") && (
          <div className="space-y-2">
            <Label htmlFor={`${id}-max`}>Max length (optional)</Label>
            <Input id={`${id}-max`} type="number" inputMode="numeric" {...register(`${name}.maxLength`, optionalNumber)} />
            <ErrorText error={get(errors, `${name}.maxLength`)} />
          </div>
        )}

        {type === "number" && (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor={`${id}-min`}>Min</Label>
              <Input id={`${id}-min`} type="number" inputMode="decimal" {...register(`${name}.min`, optionalNumber)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${id}-maxn`}>Max</Label>
              <Input id={`${id}-maxn`} type="number" inputMode="decimal" {...register(`${name}.max`, optionalNumber)} />
            </div>
          </div>
        )}

        {type === "select" && <OptionsEditor index={index} control={control} register={register} errors={errors} />}
      </CardContent>
    </Card>
  );
}
