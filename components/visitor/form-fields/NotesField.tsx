import React from "react";
import { Textarea } from "@/components/ui/textarea";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { UseFormReturn, FieldValues, Path } from "react-hook-form";
import { LABELS, PLACEHOLDERS } from "@/lib/constants/visitor";
import { FileText } from "lucide-react";

interface NotesFieldProps<T extends FieldValues = any> {
  form: UseFormReturn<T>;
  required?: boolean;
  className?: string;
}

export const NotesField = <T extends FieldValues = any>({
  form,
  required = false,
  className = "",
}: NotesFieldProps<T>) => {
  return (
    <FormField
      control={form.control}
      name={"notes" as Path<T>}
      render={({ field }) => (
        <FormItem
          className={`space-y-2 sm:space-y-2 md:col-span-2 ${className}`}
        >
          <FormLabel
            htmlFor="visitor-notes"
            className="flex items-center gap-2 font-semibold text-gray-800 text-sm"
          >
            <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            {LABELS.NOTES}
            {required && (
              <span className="text-red-500">{LABELS.REQUIRED_MARK}</span>
            )}
          </FormLabel>
          <FormControl>
            <Textarea
              {...field}
              id="visitor-notes"
              name="notes"
              placeholder={PLACEHOLDERS.NOTES}
              rows={3}
              className="resize-none bg-gray-50 border border-gray-200 text-sm"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
