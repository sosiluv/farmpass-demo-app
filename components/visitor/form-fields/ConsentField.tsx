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

interface ConsentFieldProps {
  form: UseFormReturn<VisitorFormData>;
  className?: string;
}

export const ConsentField = ({ form, className = "" }: ConsentFieldProps) => {
  return (
    <FormField
      control={form.control}
      name="consentGiven"
      render={({ field }) => (
        <FormItem className={className}>
          <FormControl>
            <div className="flex items-start space-x-2 sm:space-x-3 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <Checkbox
                id="visitor-consentGiven"
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
                htmlFor="visitor-consentGiven"
                className="text-xs sm:text-sm leading-relaxed"
              >
                <span className="font-medium">{LABELS.CONSENT}</span>
                <span className="text-red-500 ml-1">*</span>
                <br />
                <span className="text-xs text-muted-foreground mt-1 block">
                  수집된 정보는 방역 관리 목적으로만 사용되며, 관련 법령에 따라
                  보관됩니다.
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
