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
import type { UseFormReturn } from "react-hook-form";
import type { VisitorFormData } from "@/lib/utils/validation/visitor-validation";
import {
  LABELS,
  PLACEHOLDERS,
  VISIT_PURPOSE_OPTIONS,
} from "@/constants/visitor-form";
import { FileText } from "lucide-react";

interface VisitPurposeFieldProps {
  form: UseFormReturn<VisitorFormData>;
  required?: boolean;
  className?: string;
}

export const VisitPurposeField = ({
  form,
  required = false,
  className = "",
}: VisitPurposeFieldProps) => {
  return (
    <FormField
      control={form.control}
      name="visitPurpose"
      render={({ field }) => (
        <FormItem className={`space-y-2 sm:space-y-2 ${className}`}>
          <FormLabel className="flex items-center gap-2 font-semibold text-gray-800 text-sm">
            <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            {LABELS.VISIT_PURPOSE}
            {required && <span className="text-red-500">*</span>}
          </FormLabel>
          <FormControl>
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger className="h-10 sm:h-12 bg-gray-50 border border-gray-200 text-sm">
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
