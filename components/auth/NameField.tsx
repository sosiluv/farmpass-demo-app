"use client";

import { memo } from "react";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { User } from "lucide-react";
import { LABELS, PLACEHOLDERS } from "@/lib/constants/auth";

interface NameFieldProps {
  field: any;
  loading: boolean;
}

export const NameField = memo(({ field, loading }: NameFieldProps) => (
  <FormItem>
    <FormLabel className="text-sm text-gray-800">
      {LABELS.NAME} <span className="text-red-500">*</span>
    </FormLabel>
    <div className="relative">
      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <FormControl>
        <Input
          {...field}
          type="text"
          placeholder={PLACEHOLDERS.NAME}
          autoComplete="name"
          className="h-12 pl-10 input-focus"
          disabled={loading}
        />
      </FormControl>
    </div>
    <FormMessage />
  </FormItem>
));

NameField.displayName = "NameField";
