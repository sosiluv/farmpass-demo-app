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
          <FormLabel>농장 주소 *</FormLabel>
          <FormControl>
            <div className="space-y-2">
              <AddressSearch
                onSelect={(address, detailedAddress) => {
                  field.onChange(address);
                  form.setValue("farm_detailed_address", detailedAddress);
                }}
                defaultDetailedAddress={
                  form.getValues("farm_detailed_address") || ""
                }
              />
              <div className="space-y-2">
                <Textarea
                  placeholder="주소 검색 버튼을 클릭하여 주소를 입력하세요"
                  {...field}
                  readOnly
                />
                <FormField
                  control={form.control}
                  name="farm_detailed_address"
                  render={({ field: detailField }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          placeholder="상세 주소를 입력하세요 (예: 101동 1234호)"
                          {...detailField}
                          value={detailField.value || ""}
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
