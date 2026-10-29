"use client";

import { get, useFieldArray, type Control, type FieldErrors, type UseFormRegister } from "react-hook-form";
import { PlusIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FormDefinition } from "@/forms/definition";
import { ErrorText } from "./error-text";

type Props = {
  index: number;
  control: Control<FormDefinition>;
  register: UseFormRegister<FormDefinition>;
  errors: FieldErrors<FormDefinition>;
};

export function OptionsEditor({ index, control, register, errors }: Props) {
  const name = `fields.${index}.options` as const;
  const options = useFieldArray({ control, name, keyName: "key" });

  return (
    <div className="space-y-2">
      <Label>Options</Label>
      {options.fields.map((o, i) => (
        <div key={o.key} className="space-y-1">
          <div className="flex items-start gap-2">
            <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
              <Input placeholder="Label" aria-label={`Option ${i + 1} label`} {...register(`${name}.${i}.label`)} />
              <Input placeholder="Value" aria-label={`Option ${i + 1} value`} {...register(`${name}.${i}.value`)} />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Remove option ${i + 1}`}
              disabled={options.fields.length === 1}
              onClick={() => options.remove(i)}
            >
              <XIcon />
            </Button>
          </div>
          <ErrorText error={get(errors, `${name}.${i}.label`) ?? get(errors, `${name}.${i}.value`)} />
        </div>
      ))}
      <ErrorText error={get(errors, name)} />
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => {
          const n = options.fields.length + 1;
          options.append({ label: `Option ${n}`, value: `option_${n}` });
        }}
      >
        <PlusIcon /> Add option
      </Button>
    </div>
  );
}
