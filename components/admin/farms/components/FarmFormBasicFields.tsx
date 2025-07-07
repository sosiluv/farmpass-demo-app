import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FARM_TYPE_OPTIONS } from "@/lib/constants/farm-types";
import type { UseFormReturn } from "react-hook-form";
import type { FarmFormValues } from "@/lib/utils/validation";

interface FarmFormBasicFieldsProps {
  form: UseFormReturn<FarmFormValues>;
}

export function FarmFormBasicFields({ form }: FarmFormBasicFieldsProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <FormField
        control={form.control}
        name="farm_name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>농장명 *</FormLabel>
            <FormControl>
              <Input placeholder="그린팜 1농장" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="farm_type"
        render={({ field }) => (
          <FormItem>
            <FormLabel>농장 유형 *</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="농장 유형을 선택하세요" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {(FARM_TYPE_OPTIONS || []).map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
