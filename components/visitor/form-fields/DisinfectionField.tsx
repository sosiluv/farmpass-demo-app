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
import { Shield } from "lucide-react";

interface DisinfectionFieldProps<T extends FieldValues = any> {
  form: UseFormReturn<T>;
  className?: string;
}

export const DisinfectionField = <T extends FieldValues = any>({
  form,
  className = "",
}: DisinfectionFieldProps<T>) => {
  return (
    <FormField
      control={form.control}
      name={"disinfection_check" as Path<T>}
      render={({ field }) => (
        <FormItem className={className}>
          <FormControl>
            <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg mb-3 sm:mb-4 mt-2">
              <Checkbox
                id="visitor-disinfection_check"
                name="disinfection_check"
                checked={field.value}
                onCheckedChange={(checked) => {
                  // 비동기적으로 상태 업데이트
                  setTimeout(() => {
                    field.onChange(checked);
                  }, 0);
                }}
                className="w-4 h-4 sm:w-5 sm:h-5"
              />
              <Label
                htmlFor="visitor-disinfection_check"
                className="flex items-center gap-2 font-medium text-sm"
              >
                <Shield className="h-4 w-4 text-green-600" />
                {LABELS.DISINFECTION}
              </Label>
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
