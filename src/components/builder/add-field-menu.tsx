"use client";

import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { FieldType } from "@/forms/definition";
import { fieldRegistry, fieldTypes } from "@/forms/field-registry";

export function AddFieldMenu({ onAdd }: { onAdd: (type: FieldType) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" size="lg" className="w-full">
          <PlusIcon /> Add field
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {fieldTypes.map((type) => (
          <DropdownMenuItem key={type} className="py-2" onSelect={() => onAdd(type)}>
            {fieldRegistry[type].label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
