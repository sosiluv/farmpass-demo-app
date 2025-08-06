"use client";

import { memo } from "react";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Phone } from "lucide-react";
import { formatPhone } from "@/lib/utils/validation/validation";
import { LABELS, PLACEHOLDERS } from "@/lib/constants/auth";

interface PhoneFieldProps {
  field: any;
  loading: boolean;
}

export const PhoneField = memo(({ field, loading }: PhoneFieldProps) => (
  <FormItem>
    <FormLabel className="text-sm text-gray-800">
      {LABELS.PHONE} <span className="text-red-500">*</span>
    </FormLabel>
    <div className="relative">
      <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <FormControl>
        <Input
          {...field}
          type="tel"
          placeholder={PLACEHOLDERS.PHONE}
          className="h-12 pl-10 input-focus"
          disabled={loading}
          onChange={(e) => {
            const formattedPhone = formatPhone(e.target.value);
            field.onChange(formattedPhone);
          }}
          maxLength={13}
        />
      </FormControl>
    </div>
    <FormMessage />
  </FormItem>
));

PhoneField.displayName = "PhoneField";
