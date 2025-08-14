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
import { Building2, FileText } from "lucide-react";
import { LABELS, PLACEHOLDERS } from "@/lib/constants/farms";

interface FarmFormBasicFieldsProps {
  form: UseFormReturn<FarmFormValues>;
}

export function FarmFormBasicFields({ form }: FarmFormBasicFieldsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      <FormField
        control={form.control}
        name="farm_name"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2 text-sm">
              <Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              {LABELS.FARM_NAME}
              <span className="text-red-500">*</span>
            </FormLabel>
            <FormControl>
              <Input
                placeholder={PLACEHOLDERS.FARM_NAME}
                {...field}
                className="text-sm sm:text-base"
              />
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
            <FormLabel
              htmlFor="farm-type-select"
              className="flex items-center gap-2 text-sm"
            >
              <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              {LABELS.FARM_TYPE}
              <span className="text-red-500">*</span>
            </FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger
                  id="farm-type-select"
                  name="farm_type"
                  className="h-12 text-sm sm:text-base"
                >
                  <SelectValue placeholder={PLACEHOLDERS.FARM_TYPE} />
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
