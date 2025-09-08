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
import { LABELS, PLACEHOLDERS } from "@/lib/constants/visitor";
import { Car } from "lucide-react";

interface CarPlateFieldProps<T extends FieldValues = any> {
  form: UseFormReturn<T>;
  required?: boolean;
  className?: string;
}

export const CarPlateField = <T extends FieldValues = any>({
  form,
  required = false,
  className = "",
}: CarPlateFieldProps<T>) => {
  return (
    <FormField
      control={form.control}
      name={"vehicle_number" as Path<T>}
      render={({ field }) => (
        <FormItem className={`space-y-2 ${className}`}>
          <FormLabel
            htmlFor="visitor-vehicle_number"
            className="flex items-center gap-2 text-sm"
          >
            <Car className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            {LABELS.CAR_PLATE}
            {required && (
              <span className="text-red-500">{LABELS.REQUIRED_MARK}</span>
            )}
          </FormLabel>
          <FormControl>
            <Input
              {...field}
              value={field.value || ""} // null/undefined를 빈 문자열로 처리
              id="visitor-vehicle_number"
              name="vehicle_number"
              onChange={(e) => field.onChange(e.target.value.toUpperCase())}
              placeholder={PLACEHOLDERS.CAR_PLATE}
              className="uppercase"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
