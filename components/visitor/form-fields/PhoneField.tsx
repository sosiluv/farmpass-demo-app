import React from "react";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { UseFormReturn, FieldValues, Path } from "react-hook-form";
import { formatPhone } from "@/lib/utils/validation/validation";
import { LABELS, PLACEHOLDERS } from "@/lib/constants/visitor";
import { Phone } from "lucide-react";

interface PhoneFieldProps<T extends FieldValues = any> {
  form: UseFormReturn<T>;
  required?: boolean;
  className?: string;
}

export const PhoneField = <T extends FieldValues = any>({
  form,
  required = false,
  className = "",
}: PhoneFieldProps<T>) => {
  return (
    <FormField
      control={form.control}
      name={"phoneNumber" as Path<T>}
      render={({ field }) => (
        <FormItem className={`space-y-2 sm:space-y-2 ${className}`}>
          <FormLabel
            htmlFor="visitor-phoneNumber"
            className="flex items-center gap-2 font-semibold text-gray-800 text-sm"
          >
            <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            {LABELS.PHONE_NUMBER}
            {required && (
              <span className="text-red-500">{LABELS.REQUIRED_MARK}</span>
            )}
          </FormLabel>
          <FormControl>
            <Input
              {...field}
              id="visitor-phoneNumber"
              name="phoneNumber"
              type="tel"
              onChange={(e) => {
                const formattedPhone = formatPhone(e.target.value);
                field.onChange(formattedPhone);
              }}
              placeholder={PLACEHOLDERS.PHONE_NUMBER}
              maxLength={13}
              className="h-10 sm:h-12 bg-gray-50 border border-gray-200 text-sm"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
