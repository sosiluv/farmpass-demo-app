import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import type { UseFormReturn } from "react-hook-form";
import type { VisitorFormData } from "@/lib/utils/validation/visitor-validation";
import { LABELS } from "@/constants/visitor-form";
import { Shield } from "lucide-react";

interface DisinfectionFieldProps {
  form: UseFormReturn<VisitorFormData>;
  className?: string;
}

export const DisinfectionField = ({
  form,
  className = "",
}: DisinfectionFieldProps) => {
  return (
    <FormField
      control={form.control}
      name="disinfectionCheck"
      render={({ field }) => (
        <FormItem className={className}>
          <FormControl>
            <div className="flex items-center space-x-2 sm:space-x-3 p-2.5 sm:p-3 bg-green-50 border border-green-200 rounded-lg mb-3 sm:mb-4 mt-2">
              <Checkbox
                id="visitor-disinfectionCheck"
                name="disinfectionCheck"
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
                htmlFor="visitor-disinfectionCheck"
                className="flex items-center gap-1.5 sm:gap-2 font-medium text-sm sm:text-base"
              >
                <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600" />
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
