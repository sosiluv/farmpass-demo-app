import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import type { UseFormReturn, FieldValues, Path } from "react-hook-form";
import { LABELS } from "@/lib/constants/visitor";

interface ConsentFieldProps<T extends FieldValues = any> {
  form: UseFormReturn<T>;
  className?: string;
}

export const ConsentField = <T extends FieldValues = any>({
  form,
  className = "",
}: ConsentFieldProps<T>) => {
  return (
    <FormField
      control={form.control}
      name={"consent_given" as Path<T>}
      render={({ field }) => (
        <FormItem className={className}>
          <FormControl>
            <div className="flex items-start space-x-2 sm:space-x-3 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <Checkbox
                id="visitor-consent_given"
                checked={field.value}
                onCheckedChange={(checked) => {
                  // 비동기적으로 상태 업데이트
                  setTimeout(() => {
                    field.onChange(checked);
                  }, 0);
                }}
                className="mt-1 w-4 h-4 sm:w-5 sm:h-5"
              />
              <Label
                htmlFor="visitor-consent_given"
                className="text-xs sm:text-sm leading-relaxed"
              >
                <span className="font-medium">{LABELS.CONSENT}</span>
                <span className="text-red-500 ml-1">
                  {LABELS.REQUIRED_MARK}
                </span>
                <br />
                <span className="text-xs text-muted-foreground mt-1 block">
                  {LABELS.CONSENT_DESCRIPTION}
                </span>
              </Label>
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
