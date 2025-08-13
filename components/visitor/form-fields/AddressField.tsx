import React from "react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { AddressSearch } from "@/components/ui/address-search";
import type { UseFormReturn, FieldValues, Path } from "react-hook-form";
import { LABELS } from "@/lib/constants/visitor";
import { MapPin } from "lucide-react";

interface AddressFieldProps<T extends FieldValues = any> {
  form: UseFormReturn<T>;
  required?: boolean;
  className?: string;
  defaultDetailedAddress?: string;
}

export const AddressField = <T extends FieldValues = any>({
  form,
  required = false,
  className = "",
  defaultDetailedAddress,
}: AddressFieldProps<T>) => {
  return (
    <FormField
      control={form.control}
      name={"visitor_address" as Path<T>}
      render={({ field }) => (
        <FormItem
          className={`space-y-2 sm:space-y-2 md:col-span-2 ${className}`}
        >
          <FormLabel
            htmlFor="visitor-visitor_address"
            className="flex items-center gap-2 font-semibold text-gray-800 text-sm"
          >
            <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            {LABELS.ADDRESS}
            {required && (
              <span className="text-red-500">{LABELS.REQUIRED_MARK}</span>
            )}
          </FormLabel>
          <FormControl>
            <AddressSearch
              onSelect={(address, detailedAddress) => {
                field.onChange(address);
                (form as any).setValue("detailed_address", detailedAddress);
              }}
              defaultDetailedAddress={defaultDetailedAddress}
            />
          </FormControl>
          <FormMessage />
          {field.value && (
            <div className="mt-2 p-2.5 sm:p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="text-xs sm:text-sm">
                <div className="font-medium text-gray-700">
                  {LABELS.SELECTED_ADDRESS}
                </div>
                <div className="text-gray-600 mt-1">
                  {field.value}
                  {(form as any).watch("detailed_address") && (
                    <span className="text-blue-600">
                      {" "}
                      {(form as any).watch("detailed_address")}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </FormItem>
      )}
    />
  );
};
