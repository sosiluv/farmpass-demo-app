import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { UseFormReturn } from "react-hook-form";
import type { FarmFormValues } from "@/lib/utils/validation";
import { formatPhone } from "@/lib/utils/validation/validation";
import { User, Phone, FileText } from "lucide-react";
import { LABELS, PLACEHOLDERS } from "@/lib/constants/farms";

interface FarmFormManagerFieldsProps {
  form: UseFormReturn<FarmFormValues>;
}

export function FarmFormManagerFields({ form }: FarmFormManagerFieldsProps) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="manager_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2 text-sm">
                <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                {LABELS.MANAGER_NAME}
                <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder={PLACEHOLDERS.MANAGER_NAME}
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
          name="manager_phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2 text-sm">
                <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                {LABELS.MANAGER_PHONE}
                <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  type="tel"
                  placeholder={PLACEHOLDERS.MANAGER_PHONE}
                  {...field}
                  className="text-sm sm:text-base"
                  onChange={(e) => {
                    const formattedPhone = formatPhone(e.target.value);
                    field.onChange(formattedPhone);
                  }}
                  maxLength={13} // 010-0000-0000 형식의 최대 길이
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2 text-sm">
              <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              {LABELS.DESCRIPTION}
            </FormLabel>
            <FormControl>
              <Textarea
                placeholder={PLACEHOLDERS.DESCRIPTION}
                {...field}
                value={field.value || ""}
                className="text-sm min-h-[80px]"
                rows={4}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
