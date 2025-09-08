import React from "react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import type { UseFormReturn, FieldValues, Path } from "react-hook-form";
import {
  LABELS,
  PLACEHOLDERS,
  VISIT_PURPOSE_OPTIONS,
} from "@/lib/constants/visitor";
import { FileText } from "lucide-react";

interface VisitPurposeFieldProps<T extends FieldValues = any> {
  form: UseFormReturn<T>;
  required?: boolean;
  className?: string;
}

export const VisitPurposeField = <T extends FieldValues = any>({
  form,
  required = false,
  className = "",
}: VisitPurposeFieldProps<T>) => {
  return (
    <FormField
      control={form.control}
      name={"visitor_purpose" as Path<T>}
      render={({ field }) => (
        <FormItem className={`space-y-2 ${className}`}>
          <FormLabel
            htmlFor="visitor-visitor_purpose"
            className="flex items-center gap-2 text-sm"
          >
            <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            {LABELS.VISIT_PURPOSE}
            {required && (
              <span className="text-red-500">{LABELS.REQUIRED_MARK}</span>
            )}
          </FormLabel>
          <FormControl>
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger
                id="visitor-visitor_purpose"
                name="visitor_purpose"
              >
                <SelectValue placeholder={PLACEHOLDERS.VISIT_PURPOSE} />
              </SelectTrigger>
              <SelectContent>
                {VISIT_PURPOSE_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
