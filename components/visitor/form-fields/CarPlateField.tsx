import React from "react";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { UseFormReturn } from "react-hook-form";
import type { VisitorFormData } from "@/lib/utils/validation/visitor-validation";
import { LABELS, PLACEHOLDERS } from "@/lib/constants/visitor";
import { Car } from "lucide-react";

interface CarPlateFieldProps {
  form: UseFormReturn<VisitorFormData>;
  required?: boolean;
  className?: string;
}

export const CarPlateField = ({
  form,
  required = false,
  className = "",
}: CarPlateFieldProps) => {
  return (
    <FormField
      control={form.control}
      name="carPlateNumber"
      render={({ field }) => (
        <FormItem className={`space-y-2 sm:space-y-2 ${className}`}>
          <FormLabel
            htmlFor="visitor-carPlateNumber"
            className="flex items-center gap-2 font-semibold text-gray-800 text-sm"
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
              id="visitor-carPlateNumber"
              name="carPlateNumber"
              onChange={(e) => field.onChange(e.target.value.toUpperCase())}
              placeholder={PLACEHOLDERS.CAR_PLATE}
              className="h-10 sm:h-12 bg-gray-50 border border-gray-200 uppercase text-sm"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
