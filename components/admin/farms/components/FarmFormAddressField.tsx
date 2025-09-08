import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AddressSearch } from "@/components/ui/address-search";
import type { UseFormReturn } from "react-hook-form";
import type { FarmFormValues } from "@/lib/utils/validation";
import { MapPin, FileText } from "lucide-react";
import { LABELS, PLACEHOLDERS } from "@/lib/constants/farms";

interface FarmFormAddressFieldProps {
  form: UseFormReturn<FarmFormValues>;
}

export function FarmFormAddressField({ form }: FarmFormAddressFieldProps) {
  return (
    <>
      <FormField
        control={form.control}
        name="farm_address"
        render={({ field }) => (
          <FormItem className="space-y-2 md:col-span-2">
            <FormLabel
              htmlFor="farm-address"
              className="flex items-center gap-2 text-sm"
            >
              <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              {LABELS.FARM_ADDRESS}
              <span className="text-red-500">*</span>
            </FormLabel>
            <FormControl>
              <div className="space-y-3">
                <AddressSearch
                  onSelect={(address, detailedAddress) => {
                    field.onChange(address);
                    form.setValue("farm_detailed_address", detailedAddress);
                  }}
                  defaultDetailedAddress={
                    form.getValues("farm_detailed_address") || ""
                  }
                />

                <Textarea
                  id="farm-address"
                  placeholder={PLACEHOLDERS.FARM_ADDRESS}
                  {...field}
                  readOnly
                  className="min-h-[80px]"
                />
                <FormField
                  control={form.control}
                  name="farm_detailed_address"
                  render={({ field: detailField }) => (
                    <FormItem className="space-y-2">
                      <FormLabel
                        htmlFor="farm-detailed-address"
                        className="flex items-center gap-2 text-sm"
                      >
                        <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        {LABELS.FARM_DETAILED_ADDRESS}
                      </FormLabel>
                      <FormControl>
                        <Input
                          id="farm-detailed-address"
                          placeholder={PLACEHOLDERS.FARM_DETAILED_ADDRESS}
                          {...detailField}
                          value={detailField.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
