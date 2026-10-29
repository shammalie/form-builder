"use client";

import { Controller, type Control } from "react-hook-form";
import { Label } from "@/components/ui/label";
import type { FieldDef } from "@/forms/definition";
import { fieldRegistry } from "@/forms/field-registry";

export function RenderedField({ field, control }: { field: FieldDef; control: Control }) {
  const { Input } = fieldRegistry[field.type];
  const label = (
    <Label htmlFor={field.id} className="leading-snug">
      {field.label}
      {field.required && <span className="text-destructive"> *</span>}
    </Label>
  );
  return (
    <Controller
      name={field.id}
      control={control}
      render={({ field: rhf, fieldState }) => (
        <div className="space-y-2">
          {field.type === "checkbox" ? (
            <div className="flex items-center gap-3">
              <Input field={field as never} value={rhf.value} onChange={rhf.onChange} invalid={!!fieldState.error} />
              {label}
            </div>
          ) : (
            <>
              {label}
              <Input field={field as never} value={rhf.value} onChange={rhf.onChange} invalid={!!fieldState.error} />
            </>
          )}
          {fieldState.error && <p className="text-sm text-destructive">{fieldState.error.message}</p>}
        </div>
      )}
    />
  );
}
