import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AddressSearch } from "@/components/common/address-search";
import type { UseFormReturn } from "react-hook-form";
import type { FarmFormValues } from "@/lib/utils/validation";
import { MapPin, FileText } from "lucide-react";

interface FarmFormAddressFieldProps {
  form: UseFormReturn<FarmFormValues>;
}

export function FarmFormAddressField({ form }: FarmFormAddressFieldProps) {
  return (
    <FormField
      control={form.control}
      name="farm_address"
      render={({ field }) => (
        <FormItem>
          <FormLabel
            htmlFor="farm-address"
            className="flex items-center gap-2 text-sm"
          >
            <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            농장 주소
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
              <div className="space-y-3">
                <Textarea
                  id="farm-address"
                  placeholder="주소 검색 버튼을 클릭하여 주소를 입력하세요"
                  {...field}
                  readOnly
                  className="text-sm min-h-[80px]"
                />
                <FormField
                  control={form.control}
                  name="farm_detailed_address"
                  render={({ field: detailField }) => (
                    <FormItem>
                      <FormLabel
                        htmlFor="farm-detailed-address"
                        className="flex items-center gap-2 text-sm"
                      >
                        <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        상세 주소
                      </FormLabel>
                      <FormControl>
                        <Input
                          id="farm-detailed-address"
                          placeholder="상세 주소를 입력하세요 (예: 101동 1234호)"
                          {...detailField}
                          value={detailField.value || ""}
                          className="h-10 sm:h-12 text-sm"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
