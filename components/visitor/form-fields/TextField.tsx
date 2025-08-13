import React from "react";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { UseFormReturn, FieldValues, Path } from "react-hook-form";
import { LABELS, PLACEHOLDERS } from "@/lib/constants/visitor";

interface TextFieldProps<T extends FieldValues = any> {
  form: UseFormReturn<T>;
  name: Path<T>;
  icon: React.ComponentType<{ className?: string }>;
  required?: boolean;
  fullWidth?: boolean;
  placeholder?: string;
  className?: string;
}

export const TextField = <T extends FieldValues = any>({
  form,
  name,
  icon: Icon,
  required = false,
  fullWidth = false,
  placeholder,
  className = "",
}: TextFieldProps<T>) => {
  const labelKey = getLabelKey(name as string);
  const placeholderKey = getPlaceholderKey(name as string);

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem
          className={`space-y-2 sm:space-y-2 ${
            fullWidth ? "md:col-span-2" : ""
          } ${className}`}
        >
          <FormLabel
            htmlFor={`visitor-${name}`}
            className="flex items-center gap-2 font-semibold text-gray-800 text-sm"
          >
            <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            {LABELS[labelKey]}
            {required && (
              <span className="text-red-500">{LABELS.REQUIRED_MARK}</span>
            )}
          </FormLabel>
          <FormControl>
            <Input
              {...field}
              id={`visitor-${name}`}
              name={name}
              placeholder={
                placeholder ||
                (placeholderKey ? PLACEHOLDERS[placeholderKey] : "")
              }
              className="h-10 sm:h-12 bg-gray-50 border border-gray-200 text-sm"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

// 필드명을 라벨 키로 매핑
const getLabelKey = (fieldName: string): keyof typeof LABELS => {
  const mapping: Record<string, keyof typeof LABELS> = {
    visitor_name: "FULL_NAME",
    visitor_phone: "PHONE_NUMBER",
    visitor_address: "ADDRESS",
    detailed_address: "ADDRESS",
    vehicle_number: "CAR_PLATE",
    visitor_purpose: "VISIT_PURPOSE",
    disinfection_check: "DISINFECTION",
    notes: "NOTES",
    profile_photo_url: "PROFILE_PHOTO",
    consent_given: "CONSENT",
  };
  return mapping[fieldName] || "FULL_NAME";
};

// 필드명을 플레이스홀더 키로 매핑
const getPlaceholderKey = (
  fieldName: string
): keyof typeof PLACEHOLDERS | null => {
  const mapping: Record<string, keyof typeof PLACEHOLDERS | null> = {
    visitor_name: "FULL_NAME",
    visitor_phone: "PHONE_NUMBER",
    visitor_address: "ADDRESS",
    detailed_address: "ADDRESS",
    vehicle_number: "CAR_PLATE",
    visitor_purpose: "VISIT_PURPOSE",
    disinfection_check: null,
    notes: "NOTES",
    profile_photo_url: null,
    consent_given: null,
  };
  return mapping[fieldName] || null;
};
