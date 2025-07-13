import React from "react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { AddressSearch } from "@/components/common/address-search";
import type { UseFormReturn } from "react-hook-form";
import type { VisitorFormData } from "@/lib/utils/validation/visitor-validation";
import { LABELS } from "@/constants/visitor-form";
import { MapPin } from "lucide-react";

interface AddressFieldProps {
  form: UseFormReturn<VisitorFormData>;
  required?: boolean;
  className?: string;
  defaultDetailedAddress?: string;
}

export const AddressField = ({
  form,
  required = false,
  className = "",
  defaultDetailedAddress,
}: AddressFieldProps) => {
  return (
    <FormField
      control={form.control}
      name="address"
      render={({ field }) => (
        <FormItem
          className={`space-y-2 sm:space-y-2 md:col-span-2 ${className}`}
        >
          <FormLabel className="flex items-center gap-2 font-semibold text-gray-800 text-sm">
            <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            {LABELS.ADDRESS}
            {required && <span className="text-red-500">*</span>}
          </FormLabel>
          <FormControl>
            <AddressSearch
              onSelect={(address, detailedAddress) => {
                field.onChange(address);
                form.setValue("detailedAddress", detailedAddress);
              }}
              defaultDetailedAddress={defaultDetailedAddress}
            />
          </FormControl>
          <FormMessage />
          {field.value && (
            <div className="mt-2 p-2.5 sm:p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="text-xs sm:text-sm">
                <div className="font-medium text-gray-700">선택된 주소:</div>
                <div className="text-gray-600 mt-1">
                  {field.value}
                  {form.watch("detailedAddress") && (
                    <span className="text-blue-600">
                      {" "}
                      {form.watch("detailedAddress")}
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
