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

interface FarmFormManagerFieldsProps {
  form: UseFormReturn<FarmFormValues>;
}

export function FarmFormManagerFields({ form }: FarmFormManagerFieldsProps) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="manager_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>관리자명 *</FormLabel>
              <FormControl>
                <Input placeholder="홍길동" {...field} />
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
              <FormLabel>관리자 연락처 *</FormLabel>
              <FormControl>
                <Input
                  type="tel"
                  placeholder="숫자만 입력 가능합니다"
                  {...field}
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
            <FormLabel>농장 설명</FormLabel>
            <FormControl>
              <Textarea
                placeholder="농장에 대한 설명을 입력하세요"
                {...field}
                value={field.value || ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
