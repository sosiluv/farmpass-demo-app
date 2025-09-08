import React from "react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { AddressSearch } from "@/components/ui/address-search";
import { Textarea } from "@/components/ui/textarea";
import { LABELS, PLACEHOLDERS } from "@/lib/constants/visitor";
import { MapPin } from "lucide-react";
import type { UseFormReturn, FieldValues, Path } from "react-hook-form";

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
        <FormItem className={`space-y-2 md:col-span-2 ${className}`}>
          <FormLabel
            htmlFor="visitor-visitor_address"
            className="flex items-center gap-2 text-sm"
          >
            <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            {LABELS.ADDRESS}
            {required && (
              <span className="text-red-500">{LABELS.REQUIRED_MARK}</span>
            )}
          </FormLabel>
          <FormControl>
            <div className="space-y-2">
              <AddressSearch
                onSelect={(address, detailedAddress) => {
                  field.onChange(address);
                  (form as any).setValue("detailed_address", detailedAddress);
                }}
                defaultDetailedAddress={defaultDetailedAddress}
              />

              <Textarea
                id="visitor-visitor_address"
                placeholder={PLACEHOLDERS.VISITOR_ADDRESS_PLACEHOLDER}
                {...field}
                readOnly
                className="min-h-[80px]"
                value={
                  field.value
                    ? `${field.value}${
                        (form as any).watch("detailed_address")
                          ? ` ${(form as any).watch("detailed_address")}`
                          : ""
                      }`
                    : ""
                }
              />
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
